import uuid
import pytest


@pytest.mark.asyncio
async def test_register_success(client):
    unique_email = f"user_{uuid.uuid4().hex[:8]}@example.com"
    payload = {
        "email": unique_email,
        "display_name": "Test Engineer",
        "password": "SecurePassword123!",
    }
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert "user" in data
    assert data["user"]["email"] == unique_email
    assert data["user"]["display_name"] == "Test Engineer"
    assert "hashed_password" not in data["user"]
    # Verify HttpOnly cookie was set
    assert "codearena_auth_token" in response.cookies


@pytest.mark.asyncio
async def test_register_duplicate_email(client):
    unique_email = f"dupe_{uuid.uuid4().hex[:8]}@example.com"
    payload = {
        "email": unique_email,
        "display_name": "Original User",
        "password": "SecurePassword123!",
    }
    first_res = await client.post("/api/v1/auth/register", json=payload)
    assert first_res.status_code == 201

    # Second registration with same email
    payload["display_name"] = "Duplicate User"
    second_res = await client.post("/api/v1/auth/register", json=payload)
    assert second_res.status_code == 400
    assert "already exists" in second_res.json()["detail"]


@pytest.mark.asyncio
async def test_register_invalid_email(client):
    payload = {
        "email": "not-an-email",
        "display_name": "Invalid User",
        "password": "ValidPassword123!",
    }
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_register_weak_password(client):
    # Too short
    payload = {
        "email": f"short_{uuid.uuid4().hex[:8]}@example.com",
        "display_name": "Short Pwd",
        "password": "abc1",
    }
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 422

    # Missing digits
    payload["password"] = "onlyletterspassword"
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_login_success(client):
    unique_email = f"login_{uuid.uuid4().hex[:8]}@example.com"
    password = "CorrectPassword123!"

    # Register first
    await client.post(
        "/api/v1/auth/register",
        json={"email": unique_email, "display_name": "Login User", "password": password},
    )

    # Login
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": unique_email, "password": password},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == unique_email
    assert "codearena_auth_token" in response.cookies


@pytest.mark.asyncio
async def test_login_incorrect_password(client):
    unique_email = f"wrong_{uuid.uuid4().hex[:8]}@example.com"
    await client.post(
        "/api/v1/auth/register",
        json={"email": unique_email, "display_name": "User", "password": "OriginalPassword123!"},
    )

    response = await client.post(
        "/api/v1/auth/login",
        json={"email": unique_email, "password": "WrongPassword999!"},
    )
    assert response.status_code == 401
    assert "Invalid email or password" in response.json()["detail"]


@pytest.mark.asyncio
async def test_login_nonexistent_user(client):
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "nonexistent_ghost_user@example.com", "password": "Password123!"},
    )
    assert response.status_code == 401
    assert "Invalid email or password" in response.json()["detail"]


@pytest.mark.asyncio
async def test_me_unauthenticated(client):
    response = await client.get("/api/v1/auth/me")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_me_authenticated_with_bearer(client):
    unique_email = f"bearer_{uuid.uuid4().hex[:8]}@example.com"
    reg = await client.post(
        "/api/v1/auth/register",
        json={"email": unique_email, "display_name": "Bearer User", "password": "Password123!"},
    )
    token = reg.json()["access_token"]

    response = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == unique_email
    assert data["display_name"] == "Bearer User"
    assert "hashed_password" not in data


@pytest.mark.asyncio
async def test_me_authenticated_with_cookie(client):
    unique_email = f"cookie_{uuid.uuid4().hex[:8]}@example.com"
    reg = await client.post(
        "/api/v1/auth/register",
        json={"email": unique_email, "display_name": "Cookie User", "password": "Password123!"},
    )
    cookie_val = reg.cookies.get("codearena_auth_token")

    response = await client.get(
        "/api/v1/auth/me",
        cookies={"codearena_auth_token": cookie_val},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == unique_email


@pytest.mark.asyncio
async def test_logout(client):
    response = await client.post("/api/v1/auth/logout")
    assert response.status_code == 200
    assert "Successfully logged out" in response.json()["message"]
