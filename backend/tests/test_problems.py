import pytest
from tests.conftest import db_session_maker
from app.models.problem import Problem


@pytest.mark.asyncio
async def test_list_published_problems(client):
    response = await client.get("/api/v1/problems")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert data["total"] >= 10
    assert len(data["items"]) >= 10
    # Check problem structure
    p = data["items"][0]
    assert "id" in p
    assert "slug" in p
    assert "title" in p
    assert "difficulty" in p
    assert "tags" in p


@pytest.mark.asyncio
async def test_get_problem_by_slug(client):
    response = await client.get("/api/v1/problems/two-sum")
    assert response.status_code == 200
    data = response.json()
    assert data["slug"] == "two-sum"
    assert data["title"] == "Two Sum"
    assert data["difficulty"] == "Easy"
    assert "class Solution" in data["starter_code"]
    assert len(data["examples"]) >= 2
    assert "constraints" in data
    assert "input_format" in data
    assert "output_format" in data


@pytest.mark.asyncio
async def test_get_problem_unknown_slug(client):
    response = await client.get("/api/v1/problems/this-slug-does-not-exist")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_filter_by_difficulty(client):
    response = await client.get("/api/v1/problems?difficulty=Medium")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    for item in data["items"]:
        assert item["difficulty"] == "Medium"


@pytest.mark.asyncio
async def test_filter_invalid_difficulty(client):
    response = await client.get("/api/v1/problems?difficulty=Impossible")
    assert response.status_code == 400
    assert "Difficulty must be one of" in response.json()["detail"]


@pytest.mark.asyncio
async def test_filter_by_tag(client):
    response = await client.get("/api/v1/problems?tag=Arrays")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    for item in data["items"]:
        tag_names = [t["name"] for t in item["tags"]]
        assert "Arrays" in tag_names


@pytest.mark.asyncio
async def test_search_problems(client):
    response = await client.get("/api/v1/problems?search=Palindrome")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    slugs = [p["slug"] for p in data["items"]]
    assert "valid-palindrome" in slugs


@pytest.mark.asyncio
async def test_pagination(client):
    response = await client.get("/api/v1/problems?page=1&page_size=3")
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 3
    assert data["page"] == 1
    assert data["page_size"] == 3
    assert data["total_pages"] >= 4


@pytest.mark.asyncio
async def test_list_tags(client):
    response = await client.get("/api/v1/tags")
    assert response.status_code == 200
    tags = response.json()
    assert len(tags) >= 5
    tag_names = [t["name"] for t in tags]
    assert "Arrays" in tag_names
    assert "String" in tag_names
    for t in tags:
        assert "problem_count" in t
        assert t["problem_count"] >= 0


@pytest.mark.asyncio
async def test_unpublished_problem_isolation(client):
    # Insert an unpublished problem
    async with db_session_maker() as session:
        unpub = Problem(
            slug="secret-hidden-problem",
            title="Secret Hidden Problem",
            difficulty="Hard",
            description="Judge test data only",
            starter_code="// starter",
            is_published=False,
            constraints="None",
            input_format="None",
            output_format="None",
        )
        session.add(unpub)
        await session.commit()

    try:
        # Verify it cannot be retrieved via public slug endpoint
        response = await client.get("/api/v1/problems/secret-hidden-problem")
        assert response.status_code == 404

        # Verify it is not listed in public listing
        list_res = await client.get("/api/v1/problems?search=Secret")
        assert list_res.status_code == 200
        slugs = [p["slug"] for p in list_res.json()["items"]]
        assert "secret-hidden-problem" not in slugs
    finally:
        # Clean up
        async with db_session_maker() as session:
            from sqlalchemy import delete
            await session.execute(
                delete(Problem).where(Problem.slug == "secret-hidden-problem")
            )
            await session.commit()


@pytest.mark.asyncio
async def test_problem_detail_has_test_cases(client):
    response = await client.get("/api/v1/problems/two-sum")
    assert response.status_code == 200
    data = response.json()
    assert "test_cases" in data
    assert len(data["test_cases"]) > 0
    # First test case should be sample
    first_tc = data["test_cases"][0]
    assert "input_data" in first_tc
    assert "expected_output" in first_tc
    assert "is_sample" in first_tc


@pytest.mark.asyncio
async def test_get_problem_test_cases_samples_only(client):
    response = await client.get("/api/v1/problems/two-sum/test-cases?samples_only=true")
    assert response.status_code == 200
    cases = response.json()
    assert len(cases) > 0
    # Every case must have is_sample == True
    for c in cases:
        assert c["is_sample"] is True


@pytest.mark.asyncio
async def test_get_problem_test_cases_all(client):
    response = await client.get("/api/v1/problems/two-sum/test-cases?samples_only=false")
    assert response.status_code == 200
    cases = response.json()
    # Should include both samples and hidden cases
    samples = [c for c in cases if c["is_sample"]]
    hidden = [c for c in cases if not c["is_sample"]]
    assert len(samples) > 0
    assert len(hidden) > 0

