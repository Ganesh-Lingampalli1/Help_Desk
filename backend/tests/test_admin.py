import pytest
from app.models.user import User
from tests.conftest import get_token


def test_admin_route_authorization(client, seed_users):
    """Only Admin role can access admin dashboard and user management endpoints."""
    alice_token = get_token(client, "alice@test.com", "AlicePass123")
    agent_token = get_token(client, "agent@test.com", "AgentPass123")
    admin_token = get_token(client, "admin@test.com", "AdminPass123")

    # Employee attempt -> 403
    res_emp = client.get("/api/v1/admin/users", headers={"Authorization": f"Bearer {alice_token}"})
    assert res_emp.status_code == 403

    # Agent attempt -> 403
    res_agent = client.get("/api/v1/admin/users", headers={"Authorization": f"Bearer {agent_token}"})
    assert res_agent.status_code == 403

    # Admin attempt -> 200
    res_admin = client.get("/api/v1/admin/users", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_admin.status_code == 200
    assert "users" in res_admin.json


def test_admin_create_and_manage_user(client, seed_users):
    """Admin creates a new agent, updates their role, and deactivates the account."""
    admin_token = get_token(client, "admin@test.com", "AdminPass123")

    # Create new agent
    create_res = client.post(
        "/api/v1/admin/users",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "full_name": "New Support Agent",
            "email": "new.agent@test.com",
            "password": "Password123",
            "role": User.ROLE_AGENT,
        },
    )
    assert create_res.status_code == 201
    user_id = create_res.json["user"]["id"]
    assert create_res.json["user"]["role"] == User.ROLE_AGENT

    # Update role to Admin
    patch_res = client.patch(
        f"/api/v1/admin/users/{user_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"role": User.ROLE_ADMIN},
    )
    assert patch_res.status_code == 200
    assert patch_res.json["user"]["role"] == User.ROLE_ADMIN

    # Deactivate account
    deactivate_res = client.patch(
        f"/api/v1/admin/users/{user_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"is_active": False},
    )
    assert deactivate_res.status_code == 200
    assert deactivate_res.json["user"]["is_active"] is False


def test_admin_cannot_self_deactivate(client, seed_users):
    """Admin cannot deactivate their own account to prevent lockout."""
    admin_token = get_token(client, "admin@test.com", "AdminPass123")
    admin_id = seed_users["admin"]

    res = client.patch(
        f"/api/v1/admin/users/{admin_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"is_active": False},
    )
    assert res.status_code == 400
    assert "cannot deactivate your own" in res.json["error"]["message"].lower()


def test_admin_analytics_endpoint(client, seed_users):
    """Admin analytics returns structured aggregations for charts."""
    admin_token = get_token(client, "admin@test.com", "AdminPass123")

    res = client.get("/api/v1/admin/analytics", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    analytics = res.json["analytics"]
    assert "by_category" in analytics
    assert "by_priority" in analytics
    assert "by_status" in analytics
    assert "trends" in analytics
    assert "agent_workload" in analytics
    assert "sla_compliance_rate" in analytics
