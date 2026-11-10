"""Redis list worker. Run with: python -m app.judge.worker"""
import asyncio
import json
import logging
import uuid
from datetime import datetime
from sqlalchemy import select
from app.core.config import settings
from app.core.database import async_session_maker
from app.core.redis import get_redis_client, close_redis_client
from app.judge.engine import Case, DockerCppJudge
from app.judge.harness import wrap_source_code
from app.models.problem import Problem, TestCase
from app.models.submission import Submission, SubmissionStatus, SubmissionType, Verdict

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("codearena.judge")
judge = DockerCppJudge(settings.JUDGE_IMAGE, settings.JUDGE_COMPILATION_TIMEOUT_SECONDS, settings.JUDGE_WORKSPACE_ROOT)


async def process_submission(job: str) -> None:
    try:
        submission_id = uuid.UUID(job)
    except (ValueError, TypeError):
        logger.error("Discarding malformed judge job")
        return
    async with async_session_maker() as db:
        sub = (await db.execute(select(Submission).where(Submission.id == submission_id).with_for_update())).scalar_one_or_none()
        if sub is None or sub.status != SubmissionStatus.QUEUED:
            return
        problem = (await db.execute(select(Problem).where(Problem.id == sub.problem_id))).scalar_one_or_none()
        if problem is None or not problem.is_published:
            sub.status, sub.verdict, sub.error_message = SubmissionStatus.FAILED, Verdict.SYSTEM_ERROR, "Problem is unavailable."
            await db.commit()
            return
        sub.status = SubmissionStatus.COMPILING
        await db.commit()
        query = select(TestCase).where(TestCase.problem_id == problem.id)
        if sub.submission_type == SubmissionType.RUN:
            query = query.where(TestCase.is_sample.is_(True))
        test_cases = (await db.execute(query.order_by(TestCase.order.asc()))).scalars().all()
        if not test_cases:
            sub.status, sub.verdict, sub.error_message = SubmissionStatus.FAILED, Verdict.SYSTEM_ERROR, "No judge test cases are configured."
            await db.commit()
            return
        sub.total_test_cases = len(test_cases)
        sub.status = SubmissionStatus.RUNNING
        await db.commit()
        executable_source = wrap_source_code(sub.source_code, problem.slug, sub.language)
        try:
            outcome = await asyncio.to_thread(
                judge.evaluate,
                executable_source,
                [Case(tc.input_data, tc.expected_output) for tc in test_cases],
                problem.time_limit_ms,
                problem.memory_limit_mb,
                problem.output_limit_kb,
                sub.submission_type == SubmissionType.SUBMIT,
                sub.language,
            )
        except Exception:
            logger.exception("Judge infrastructure failed for submission %s", submission_id)
            outcome = None
        if outcome is None:
            sub.status, sub.verdict, sub.error_message = SubmissionStatus.FAILED, Verdict.SYSTEM_ERROR, "Judge infrastructure failed."
        else:
            sub.status = SubmissionStatus.FAILED if outcome.verdict == "SYSTEM_ERROR" else SubmissionStatus.COMPLETED
            sub.verdict = Verdict(outcome.verdict)
            sub.execution_time_ms = outcome.execution_time_ms
            sub.memory_used_kb = outcome.memory_used_kb
            sub.passed_test_cases = outcome.passed
            sub.total_test_cases = outcome.total
            queue_wait_ms = None
            if sub.created_at:
                now_utc = datetime.now(sub.created_at.tzinfo) if sub.created_at.tzinfo else datetime.utcnow()
                queue_wait_ms = max(0, int((now_utc - sub.created_at).total_seconds() * 1000))
            metrics = {
                "queue_wait_ms": queue_wait_ms,
                "compile_time_ms": outcome.compile_time_ms,
                "execution_time_ms": outcome.execution_time_ms,
                "total_processing_ms": outcome.total_processing_ms,
            }
            details = {
                "message": outcome.message,
                "case_results": outcome.case_results,
                "metrics": metrics,
            }
            sub.error_message = json.dumps(details)
        await db.commit()


async def main() -> None:
    redis = await get_redis_client()
    # Recover jobs left in the in-flight list after an unclean worker stop.
    async with async_session_maker() as db:
        await db.execute(
            select(Submission).where(Submission.status.in_([SubmissionStatus.COMPILING, SubmissionStatus.RUNNING]))
        )
        from sqlalchemy import update
        await db.execute(update(Submission).where(Submission.status.in_([SubmissionStatus.COMPILING, SubmissionStatus.RUNNING])).values(status=SubmissionStatus.QUEUED))
        await db.commit()
    abandoned = await redis.lrange(f"{settings.JUDGE_QUEUE_NAME}:processing", 0, -1)
    for submission_id in abandoned:
        await redis.lrem(f"{settings.JUDGE_QUEUE_NAME}:processing", 1, submission_id)
        await redis.lpush(settings.JUDGE_QUEUE_NAME, submission_id)
    logger.info("Judge worker started; queue=%s", settings.JUDGE_QUEUE_NAME)
    while True:
        try:
            job = await redis.brpoplpush(settings.JUDGE_QUEUE_NAME, f"{settings.JUDGE_QUEUE_NAME}:processing", timeout=5)
            if job:
                attempts_key = f"{settings.JUDGE_QUEUE_NAME}:attempts:{job}"
                attempts = await redis.incr(attempts_key)
                await redis.expire(attempts_key, 86400)
                try:
                    await process_submission(job)
                    await redis.lrem(f"{settings.JUDGE_QUEUE_NAME}:processing", 1, job)
                    await redis.delete(attempts_key)
                except Exception:
                    logger.exception("Failed to process judge job %s (attempt %s)", job, attempts)
                    await redis.lrem(f"{settings.JUDGE_QUEUE_NAME}:processing", 1, job)
                    if attempts < 3:
                        async with async_session_maker() as db:
                            sub = (await db.execute(select(Submission).where(Submission.id == uuid.UUID(job)))).scalar_one_or_none()
                            if sub and sub.status not in (SubmissionStatus.COMPLETED, SubmissionStatus.FAILED):
                                sub.status = SubmissionStatus.QUEUED
                                await db.commit()
                        await redis.lpush(settings.JUDGE_QUEUE_NAME, job)
                        await asyncio.sleep(2)
                    else:
                        try:
                            async with async_session_maker() as db:
                                sub = (await db.execute(select(Submission).where(Submission.id == uuid.UUID(job)))).scalar_one_or_none()
                                if sub and sub.status not in (SubmissionStatus.COMPLETED, SubmissionStatus.FAILED):
                                    sub.status = SubmissionStatus.FAILED
                                    sub.verdict = Verdict.SYSTEM_ERROR
                                    sub.error_message = "Judge infrastructure failed after three attempts."
                                    await db.commit()
                        except Exception:
                            logger.exception("Unable to persist terminal infrastructure failure for job %s", job)
                        await redis.delete(attempts_key)
        except asyncio.CancelledError:
            raise
        except Exception:
            logger.exception("Worker loop error; retrying")
            await asyncio.sleep(2)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    finally:
        asyncio.run(close_redis_client())
