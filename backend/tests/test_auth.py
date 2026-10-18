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


@pytest.mark.asyncio
async def test_update_me_display_name(client):
    unique_email = f"update_{uuid.uuid4().hex[:8]}@example.com"
    reg = await client.post(
        "/api/v1/auth/register",
        json={"email": unique_email, "display_name": "Old Name", "password": "Password123!"},
    )
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    update_res = await client.patch(
        "/api/v1/auth/me",
        json={"display_name": "New Display Name"},
        headers=headers,
    )
    assert update_res.status_code == 200
    assert update_res.json()["display_name"] == "New Display Name"

    # Verify updated profile via get_me
    me_res = await client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["display_name"] == "New Display Name"


@pytest.mark.asyncio
async def test_change_password_success(client):
    unique_email = f"pwd_{uuid.uuid4().hex[:8]}@example.com"
    reg = await client.post(
        "/api/v1/auth/register",
        json={"email": unique_email, "display_name": "Pwd User", "password": "OriginalPassword123!"},
    )
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    change_res = await client.post(
        "/api/v1/auth/me/change-password",
        json={"current_password": "OriginalPassword123!", "new_password": "BrandNewPassword456!"},
        headers=headers,
    )
    assert change_res.status_code == 200
    assert "successfully" in change_res.json()["message"]

    # Verify login with new password
    login_new = await client.post(
        "/api/v1/auth/login",
        json={"email": unique_email, "password": "BrandNewPassword456!"},
    )
    assert login_new.status_code == 200

    # Old password should now fail
    login_old = await client.post(
        "/api/v1/auth/login",
        json={"email": unique_email, "password": "OriginalPassword123!"},
    )
    assert login_old.status_code == 401


@pytest.mark.asyncio
async def test_change_password_wrong_current(client):
    unique_email = f"wrong_pwd_{uuid.uuid4().hex[:8]}@example.com"
    reg = await client.post(
        "/api/v1/auth/register",
        json={"email": unique_email, "display_name": "Wrong Pwd User", "password": "OriginalPassword123!"},
    )
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    change_res = await client.post(
        "/api/v1/auth/me/change-password",
        json={"current_password": "IncorrectPassword999!", "new_password": "BrandNewPassword456!"},
        headers=headers,
    )
    assert change_res.status_code == 400
    assert "verification failed" in change_res.json()["detail"]

