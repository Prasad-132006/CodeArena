import math
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import distinct, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.problem import Problem, Tag, TestCase, problem_tags
from app.schemas.problem import (
    ProblemDetailResponse,
    ProblemListItem,
    ProblemListResponse,
    TagResponse,
    TestCaseResponse,
)

router = APIRouter()


@router.get(
    "",
    response_model=ProblemListResponse,
    summary="List coding problems with pagination, search, and filtering",
)
async def list_problems(
    page: int = Query(1, ge=1, description="Page number starting at 1"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, max_length=100, description="Search by title or description"),
    difficulty: Optional[str] = Query(None, description="Difficulty level: Easy, Medium, Hard"),
    tag: Optional[str] = Query(None, description="Filter by tag slug or name"),
    sort_by: Optional[str] = Query("newest", description="Sort order: newest, oldest, title_asc, title_desc"),
    db: AsyncSession = Depends(get_db),
) -> ProblemListResponse:
    """Retrieve published coding problems with full search and filtering support."""
    # Base query strictly filtering published problems
    base_stmt = select(Problem).where(Problem.is_published.is_(True))

    # Validate difficulty if provided
    if difficulty:
        normalized_diff = difficulty.capitalize()
        if normalized_diff not in ("Easy", "Medium", "Hard"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Difficulty must be one of: Easy, Medium, Hard",
            )
        base_stmt = base_stmt.where(Problem.difficulty == normalized_diff)

    # Search filter
    if search:
        search_pattern = f"%{search.strip()}%"
        base_stmt = base_stmt.where(
            (Problem.title.ilike(search_pattern)) | (Problem.description.ilike(search_pattern))
        )

    # Tag filter using EXISTS subquery
    if tag:
        tag_pattern = tag.strip().lower()
        base_stmt = base_stmt.where(
            Problem.tags.any((Tag.slug == tag_pattern) | (Tag.name.ilike(tag_pattern)))
        )

    # Count total items efficiently
    subq = base_stmt.subquery()
    count_stmt = select(func.count()).select_from(subq)
    total_count = (await db.execute(count_stmt)).scalar() or 0

    # Sorting
    if sort_by == "oldest":
        order_clause = Problem.created_at.asc()
    elif sort_by == "title_asc":
        order_clause = Problem.title.asc()
    elif sort_by == "title_desc":
        order_clause = Problem.title.desc()
    else:  # default "newest"
        order_clause = Problem.created_at.desc()

    # Pagination & execution
    offset = (page - 1) * page_size
    query = (
        base_stmt.options(selectinload(Problem.tags))
        .order_by(order_clause)
        .offset(offset)
        .limit(page_size)
    )

    result = await db.execute(query)
    problems = result.scalars().all()

    total_pages = math.ceil(total_count / page_size) if total_count > 0 else 1

    return ProblemListResponse(
        items=[ProblemListItem.model_validate(p) for p in problems],
        total=total_count,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get(
    "/tags",
    response_model=List[TagResponse],
    summary="List all problem tags with counts",
)
async def list_tags(
    db: AsyncSession = Depends(get_db),
) -> List[TagResponse]:
    """Retrieve all available topic tags with published problem counts."""
    stmt = (
        select(
            Tag.id,
            Tag.name,
            Tag.slug,
            func.count(distinct(Problem.id)).label("problem_count"),
        )
        .outerjoin(problem_tags, Tag.id == problem_tags.c.tag_id)
        .outerjoin(
            Problem,
            (Problem.id == problem_tags.c.problem_id) & (Problem.is_published.is_(True)),
        )
        .group_by(Tag.id, Tag.name, Tag.slug)
        .order_by(Tag.name.asc())
    )
    result = await db.execute(stmt)
    rows = result.all()

    return [
        TagResponse(
            id=row.id,
            name=row.name,
            slug=row.slug,
            problem_count=row.problem_count,
        )
        for row in rows
    ]


@router.get(
    "/{slug}",
    response_model=ProblemDetailResponse,
    summary="Retrieve coding problem details by slug",
)
async def get_problem_by_slug(
    slug: str,
    db: AsyncSession = Depends(get_db),
) -> ProblemDetailResponse:
    """Retrieve published problem details by unique slug."""
    stmt = (
        select(Problem)
        .options(selectinload(Problem.tags), selectinload(Problem.test_cases))
        .where(Problem.slug == slug.lower().strip())
        .where(Problem.is_published.is_(True))
    )
    result = await db.execute(stmt)
    problem = result.scalar_one_or_none()

    if not problem:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Problem '{slug}' not found or is currently unpublished.",
        )

    return ProblemDetailResponse.model_validate(problem)


@router.get(
    "/{slug}/test-cases",
    response_model=List[TestCaseResponse],
    summary="Retrieve problem test cases",
)
async def get_problem_test_cases(
    slug: str,
    samples_only: bool = Query(True, description="Filter for sample test cases visible to users"),
    db: AsyncSession = Depends(get_db),
) -> List[TestCaseResponse]:
    """Retrieve test cases for a problem, defaulting to sample cases."""
    stmt = (
        select(Problem)
        .where(Problem.slug == slug.lower().strip())
        .where(Problem.is_published.is_(True))
    )
    result = await db.execute(stmt)
    problem = result.scalar_one_or_none()
    if not problem:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Problem '{slug}' not found or is currently unpublished.",
        )

    tc_stmt = select(TestCase).where(TestCase.problem_id == problem.id)
    if samples_only:
        tc_stmt = tc_stmt.where(TestCase.is_sample.is_(True))
    tc_stmt = tc_stmt.order_by(TestCase.order.asc())

    tc_res = await db.execute(tc_stmt)
    test_cases = tc_res.scalars().all()
    return [TestCaseResponse.model_validate(tc) for tc in test_cases]

