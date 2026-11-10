from fastapi import APIRouter
from app.api.v1.endpoints import auth, health, problems, submissions

api_router = APIRouter()

# Core diagnostic endpoints
api_router.include_router(health.router, tags=["Health"])

# Authentication endpoints
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])

# Problem management endpoints
api_router.include_router(problems.router, prefix="/problems", tags=["Problems"])
api_router.include_router(submissions.router, prefix="/submissions", tags=["Submissions"])

# Direct /tags endpoint as specified in requirements
api_router.add_api_route(
    "/tags",
    problems.list_tags,
    methods=["GET"],
    response_model=problems.List[problems.TagResponse],
    tags=["Tags"],
    summary="List all problem tags with counts",
)
