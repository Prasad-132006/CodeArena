import json
import uuid
from datetime import datetime
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_current_user
from app.core.config import settings
from app.core.database import get_db
from app.core.redis import get_redis_client
from app.judge.languages import LanguageRegistry
from app.models.problem import Problem
from app.models.submission import Submission, SubmissionStatus, SubmissionType, Verdict
from app.models.user import User

router = APIRouter()


class SubmissionRequest(BaseModel):
    source_code: str = Field(min_length=1)
    language: str = Field(default="cpp", pattern="^(?i)(cpp|c|java|python|python3|py|py3|go|golang|c\\+\\+|cpp20|g\\+\\+|gcc|c17|java17|openjdk)$")


class SubmissionResponse(BaseModel):
    id: uuid.UUID
    problem_id: uuid.UUID
    language: str
    submission_type: SubmissionType
    status: SubmissionStatus
    verdict: str | None
    execution_time_ms: int | None
    memory_used_kb: int | None
    passed_test_cases: int
    total_test_cases: int
    error_message: str | None
    created_at: datetime
    updated_at: datetime
    case_results: list[dict[str, Any]] | None = None
    metrics: dict[str, Any] | None = None

    @classmethod
    def from_model(cls, submission: Submission):
        payload = {key: getattr(submission, key) for key in cls.model_fields if hasattr(submission, key)}
        if submission.verdict:
            payload["verdict"] = submission.verdict.value
        if submission.error_message and submission.error_message.startswith("{"):
            try:
                details = json.loads(submission.error_message)
                payload["error_message"] = details.get("message")
                payload["case_results"] = details.get("case_results")
                payload["metrics"] = details.get("metrics")
            except (ValueError, TypeError):
                pass
        return cls(**payload)


async def _create(payload: SubmissionRequest, slug: str, kind: SubmissionType, user: User, db: AsyncSession):
    if len(payload.source_code.encode("utf-8")) > settings.MAX_SOURCE_CODE_BYTES:
        raise HTTPException(status_code=413, detail="Source code exceeds the maximum allowed size.")
    problem = (await db.execute(select(Problem).where(Problem.slug == slug, Problem.is_published.is_(True)))).scalar_one_or_none()
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found or unavailable.")
    canonical_language = LanguageRegistry.canonical_id(payload.language)
    sub = Submission(
        user_id=user.id,
        problem_id=problem.id,
        language=canonical_language,
        source_code=payload.source_code,
        submission_type=kind,
        status=SubmissionStatus.QUEUED,
    )
    db.add(sub)
    await db.commit()
    await db.refresh(sub)
    try:
        redis = await get_redis_client()
        await redis.lpush(settings.JUDGE_QUEUE_NAME, str(sub.id))
    except Exception as exc:
        sub.status = SubmissionStatus.FAILED
        sub.verdict = Verdict.SYSTEM_ERROR
        sub.error_message = "Judge queue is unavailable. Please retry."
        await db.commit()
        raise HTTPException(status_code=503, detail="Judge queue is unavailable; submission was recorded as failed.") from exc
    return sub


@router.get("/languages", response_model=list[dict[str, Any]])
async def list_supported_languages():
    return [
        {
            "id": l.id,
            "name": l.name,
            "monaco_id": l.monaco_id,
            "source_filename": l.source_filename,
            "compiler_or_runtime": l.compiler_or_runtime,
            "is_compiled": l.is_compiled,
            "default_time_limit_ms": l.default_time_limit_ms,
            "default_memory_limit_mb": l.default_memory_limit_mb,
            "starter_code": l.starter_code,
        }
        for l in LanguageRegistry.list_all()
    ]


@router.post("/problems/{slug}/run", response_model=SubmissionResponse, status_code=202)
async def run_code(slug: str, payload: SubmissionRequest, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return SubmissionResponse.from_model(await _create(payload, slug, SubmissionType.RUN, user, db))


@router.post("/problems/{slug}/submit", response_model=SubmissionResponse, status_code=202)
async def submit_code(slug: str, payload: SubmissionRequest, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return SubmissionResponse.from_model(await _create(payload, slug, SubmissionType.SUBMIT, user, db))


@router.get("/{submission_id}", response_model=SubmissionResponse)
async def get_submission(submission_id: uuid.UUID, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    sub = (await db.execute(select(Submission).where(Submission.id == submission_id, Submission.user_id == user.id))).scalar_one_or_none()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found.")
    return SubmissionResponse.from_model(sub)


@router.get("", response_model=list[SubmissionResponse])
async def submission_history(problem_id: uuid.UUID | None = None, page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100), user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    stmt = select(Submission).where(Submission.user_id == user.id)
    if problem_id:
        stmt = stmt.where(Submission.problem_id == problem_id)
    rows = await db.execute(stmt.order_by(Submission.created_at.desc()).offset((page - 1) * page_size).limit(page_size))
    return [SubmissionResponse.from_model(row) for row in rows.scalars().all()]
