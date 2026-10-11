import uuid
from typing import List, Optional
from sqlalchemy import (
    Column,
    ForeignKey,
    String,
    Text,
    Boolean,
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
    examples: Mapped[Optional[list]] = mapped_column(JSON, nullable=True, default=list)
    is_published: Mapped[bool] = mapped_column(Boolean, default=True, index=True, nullable=False)

    # Relationships
    tags: Mapped[List[Tag]] = relationship(
        "Tag",
        secondary=problem_tags,
        back_populates="problems",
        lazy="selectin",
    )


# Additional compound index for efficient filtering
Index("ix_problems_published_difficulty", Problem.is_published, Problem.difficulty)
Index("ix_problems_published_created", Problem.is_published, Problem.created_at.desc())
