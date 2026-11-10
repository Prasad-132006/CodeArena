import uuid
from typing import List, Optional
from sqlalchemy import (
    Column,
    ForeignKey,
    String,
    Text,
    Boolean,
    Integer,
    Table,
    Index,
    JSON,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, UUIDPrimaryKeyMixin, TimestampMixin


# Many-to-many association table between Problems and Tags
problem_tags = Table(
    "problem_tags",
    Base.metadata,
    Column(
        "problem_id",
        UUID(as_uuid=True),
        ForeignKey("problems.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "tag_id",
        UUID(as_uuid=True),
        ForeignKey("tags.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)


class Tag(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Normalized Tag for topic categories (e.g., Arrays, Dynamic Programming)."""
    __tablename__ = "tags"

    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(60), unique=True, index=True, nullable=False)

    problems: Mapped[List["Problem"]] = relationship(
        "Problem",
        secondary=problem_tags,
        back_populates="tags",
    )


class TestCase(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Evaluation test case for problem execution (sample and hidden)."""
    __tablename__ = "test_cases"

    problem_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("problems.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    input_data: Mapped[str] = mapped_column(Text, nullable=False)
    expected_output: Mapped[str] = mapped_column(Text, nullable=False)
    is_sample: Mapped[bool] = mapped_column(Boolean, default=False, index=True, nullable=False)
    explanation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    problem: Mapped["Problem"] = relationship("Problem", back_populates="test_cases")


class Problem(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Coding Problem database model."""
    __tablename__ = "problems"

    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(200), index=True, nullable=False)
    difficulty: Mapped[str] = mapped_column(String(20), index=True, nullable=False)  # Easy, Medium, Hard
    description: Mapped[str] = mapped_column(Text, nullable=False)
    constraints: Mapped[str] = mapped_column(Text, nullable=False, default="")
    input_format: Mapped[str] = mapped_column(Text, nullable=False, default="")
    output_format: Mapped[str] = mapped_column(Text, nullable=False, default="")
    starter_code: Mapped[str] = mapped_column(Text, nullable=False)  # Default C++ starter code
    starter_codes: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True, default=dict)
    examples: Mapped[Optional[list]] = mapped_column(JSON, nullable=True, default=list)
    is_published: Mapped[bool] = mapped_column(Boolean, default=True, index=True, nullable=False)
    time_limit_ms: Mapped[int] = mapped_column(Integer, default=2000, nullable=False)
    memory_limit_mb: Mapped[int] = mapped_column(Integer, default=256, nullable=False)
    output_limit_kb: Mapped[int] = mapped_column(Integer, default=64, nullable=False)

    # Relationships
    tags: Mapped[List[Tag]] = relationship(
        "Tag",
        secondary=problem_tags,
        back_populates="problems",
        lazy="selectin",
    )
    test_cases: Mapped[List[TestCase]] = relationship(
        "TestCase",
        back_populates="problem",
        cascade="all, delete-orphan",
        order_by="TestCase.order",
        lazy="selectin",
    )


# Additional compound index for efficient filtering
Index("ix_problems_published_difficulty", Problem.is_published, Problem.difficulty)
Index("ix_problems_published_created", Problem.is_published, Problem.created_at.desc())
Index("ix_test_cases_problem_sample", TestCase.problem_id, TestCase.is_sample)

