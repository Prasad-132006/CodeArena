import enum
import uuid
from sqlalchemy import Enum, ForeignKey, Integer, String, Text, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base, UUIDPrimaryKeyMixin, TimestampMixin


class SubmissionType(str, enum.Enum):
    RUN = "RUN"
    SUBMIT = "SUBMIT"


class SubmissionStatus(str, enum.Enum):
    QUEUED = "QUEUED"
    COMPILING = "COMPILING"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class Verdict(str, enum.Enum):
    ACCEPTED = "ACCEPTED"
    WRONG_ANSWER = "WRONG_ANSWER"
    COMPILATION_ERROR = "COMPILATION_ERROR"
    RUNTIME_ERROR = "RUNTIME_ERROR"
    TIME_LIMIT_EXCEEDED = "TIME_LIMIT_EXCEEDED"
    MEMORY_LIMIT_EXCEEDED = "MEMORY_LIMIT_EXCEEDED"
    OUTPUT_LIMIT_EXCEEDED = "OUTPUT_LIMIT_EXCEEDED"
    SYSTEM_ERROR = "SYSTEM_ERROR"


class Submission(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "submissions"
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    problem_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("problems.id", ondelete="CASCADE"), nullable=False)
    language: Mapped[str] = mapped_column(String(20), nullable=False, default="cpp")
    source_code: Mapped[str] = mapped_column(Text, nullable=False)
    submission_type: Mapped[SubmissionType] = mapped_column(Enum(SubmissionType, name="submissiontype"), nullable=False)
    status: Mapped[SubmissionStatus] = mapped_column(Enum(SubmissionStatus, name="submissionstatus"), nullable=False, default=SubmissionStatus.QUEUED)
    verdict: Mapped[Verdict | None] = mapped_column(Enum(Verdict, name="submissionverdict"), nullable=True)
    execution_time_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    memory_used_kb: Mapped[int | None] = mapped_column(Integer, nullable=True)
    passed_test_cases: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_test_cases: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)


Index("ix_submissions_user_created", Submission.user_id, Submission.created_at.desc())
Index("ix_submissions_problem_created", Submission.problem_id, Submission.created_at.desc())
