import pytest
from app.models.user import User
from app.extensions import db


def test_registration_success(client):
    """Test user registration with valid details creates an active employee."""
    payload = {
        "full_name": "New User",
        "email": "newuser@example.com",
        "password": "SecurePassword123",
    }
    res = client.post("/api/v1/auth/register", json=payload)
    assert res.status_code == 201
    data = res.json
    assert data["success"] is True
    assert "token" in data
    assert data["user"]["email"] == "newuser@example.com"
    assert data["user"]["role"] == User.ROLE_EMPLOYEE


def test_registration_cannot_escalate_role(client):
    """Public registration must force role to employee even if admin is requested."""
    payload = {
        "full_name": "Hacker User",
        "email": "hacker@example.com",
        "password": "SecurePassword123",
        "role": "admin",
    }
    res = client.post("/api/v1/auth/register", json=payload)
    assert res.status_code == 201
    assert res.json["user"]["role"] == User.ROLE_EMPLOYEE


def test_registration_duplicate_email(client, seed_users):
    """Registering with an already existing email returns 409 conflict."""
    payload = {
        "full_name": "Duplicate Alice",
        "email": "alice@test.com",
        "password": "Password123",
    }
    res = client.post("/api/v1/auth/register", json=payload)
    assert res.status_code == 409
    assert res.json["success"] is False


def test_login_success(client, seed_users):
    """Test login with correct credentials returns 200 and access token."""
    res = client.post("/api/v1/auth/login", json={
        "email": "alice@test.com",
        "password": "AlicePass123",
    })
    assert res.status_code == 200
    assert "token" in res.json
    assert res.json["user"]["email"] == "alice@test.com"


def test_login_invalid_credentials(client, seed_users):
    """Test login with wrong password returns 401."""
    res = client.post("/api/v1/auth/login", json={
        "email": "alice@test.com",
        "password": "WrongPassword",
    })
    assert res.status_code == 401
    assert res.json["success"] is False


def test_login_deactivated_user(client, app):
    """Test that deactivated user account is rejected."""
    with app.app_context():
        user = User(
            full_name="Deactivated Person",
            email="inactive@test.com",
            role=User.ROLE_EMPLOYEE,
            is_active=False,
        )
        user.set_password("InactivePass123")
        db.session.add(user)
        db.session.commit()

    res = client.post("/api/v1/auth/login", json={
        "email": "inactive@test.com",
        "password": "InactivePass123",
    })
    assert res.status_code == 403
    assert "deactivated" in res.json["error"]["message"].lower()


def test_get_profile(client, seed_users):
    """Test /auth/me returns current user profile."""
    # Login as alice
    login_res = client.post("/api/v1/auth/login", json={
        "email": "alice@test.com",
        "password": "AlicePass123",
    })
    token = login_res.json["token"]

    res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json["user"]["email"] == "alice@test.com"
    assert res.json["user"]["role"] == "employee"


def test_change_password(client, app):
    """Test changing user password on dedicated user."""
    with app.app_context():
        user = User(
            full_name="Pwd Person",
            email="changepwd@test.com",
            role=User.ROLE_EMPLOYEE,
            is_active=True,
        )
        user.set_password("OldPassword123")
        db.session.add(user)
        db.session.commit()

    login_res = client.post("/api/v1/auth/login", json={
        "email": "changepwd@test.com",
        "password": "OldPassword123",
    })
    token = login_res.json["token"]

    # Change password
    res = client.patch(
        "/api/v1/auth/change-password",
        headers={"Authorization": f"Bearer {token}"},
        json={"current_password": "OldPassword123", "new_password": "BrandNewPassword123"},
    )
    assert res.status_code == 200

    # Try logging in with old password
    fail_res = client.post("/api/v1/auth/login", json={
        "email": "changepwd@test.com",
        "password": "OldPassword123",
    })
    assert fail_res.status_code == 401

    # Log in with new password
    success_res = client.post("/api/v1/auth/login", json={
        "email": "changepwd@test.com",
        "password": "BrandNewPassword123",
    })
    assert success_res.status_code == 200
