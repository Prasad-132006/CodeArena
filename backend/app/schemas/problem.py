import uuid
from datetime import datetime
from typing import List, Optional, Any
from pydantic import BaseModel, ConfigDict, Field


class TagResponse(BaseModel):
    """Tag schema."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    slug: str
    problem_count: Optional[int] = None


class ProblemExample(BaseModel):
    """Problem example schema."""
    input: str
    output: str
    explanation: Optional[str] = None


class ProblemListItem(BaseModel):
    """Summarized problem schema for problem listings."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    slug: str
    title: str
    difficulty: str
    tags: List[TagResponse]
    created_at: datetime


class TestCaseResponse(BaseModel):
    """Execution test case schema."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    input_data: str
    expected_output: str
    is_sample: bool
    explanation: Optional[str] = None
    order: int


class ProblemDetailResponse(BaseModel):
    """Comprehensive problem schema for problem details."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    slug: str
    title: str
    difficulty: str
    description: str
    constraints: str
    input_format: str
    output_format: str
    starter_code: str
    starter_codes: Optional[dict[str, str]] = None
    examples: List[Any] = Field(default_factory=list)
    tags: List[TagResponse]
    is_published: bool
    created_at: datetime
    updated_at: datetime


class ProblemListResponse(BaseModel):
    """Paginated response schema for problems."""
    items: List[ProblemListItem]
    total: int
    page: int
    page_size: int
    total_pages: int
