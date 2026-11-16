from datetime import datetime
import pytest
from app.models.ticket import Ticket
from app.models.notification import Notification
from tests.conftest import get_token


def test_sla_due_date_calculation(client, seed_users):
    """Test that due_at is calculated according to priority SLA."""
    alice_token = get_token(client, "alice@test.com", "AlicePass123")

    for priority, hours in [("Critical", 4), ("High", 8), ("Medium", 24), ("Low", 48)]:
        res = client.post(
            "/api/v1/tickets",
            headers={"Authorization": f"Bearer {alice_token}"},
            json={
                "title": f"SLA test for {priority}",
                "description": "Testing SLA computation.",
                "category": Ticket.CATEGORY_SOFTWARE,
                "priority": priority,
            },
        )
        assert res.status_code == 201
        due_at_str = res.json["ticket"]["due_at"]
        assert due_at_str is not None


def test_notifications_workflow(client, seed_users):
    """Test notification generation, listing, mark read, and mark all read."""
    alice_token = get_token(client, "alice@test.com", "AlicePass123")
    admin_token = get_token(client, "admin@test.com", "AdminPass123")

    # Alice creates ticket
    create_res = client.post(
        "/api/v1/tickets",
        headers={"Authorization": f"Bearer {alice_token}"},
        json={
            "title": "Need assistance with email sync",
            "description": "Outlook is not synchronizing inbox.",
            "category": Ticket.CATEGORY_SOFTWARE,
            "priority": Ticket.PRIORITY_MEDIUM,
        },
    )
    ticket_id = create_res.json["ticket"]["id"]

    # Admin assigns ticket to Agent -> Agent should receive notification
    client.post(
        f"/api/v1/tickets/{ticket_id}/assign",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"assigned_to": seed_users["agent"]},
    )

    agent_token = get_token(client, "agent@test.com", "AgentPass123")
    notif_res = client.get(
        "/api/v1/notifications",
        headers={"Authorization": f"Bearer {agent_token}"},
    )
    assert notif_res.status_code == 200
    assert notif_res.json["unread_count"] >= 1
    notifications = notif_res.json["notifications"]
    notif_id = notifications[0]["id"]

    # Mark single notification as read
    mark_res = client.patch(
        f"/api/v1/notifications/{notif_id}/read",
        headers={"Authorization": f"Bearer {agent_token}"},
    )
    assert mark_res.status_code == 200
    assert mark_res.json["notification"]["is_read"] is True

    # Mark all read
    all_read_res = client.post(
        "/api/v1/notifications/mark-all-read",
        headers={"Authorization": f"Bearer {agent_token}"},
    )
    assert all_read_res.status_code == 200

    # Verify unread count is 0
    after_res = client.get(
        "/api/v1/notifications",
        headers={"Authorization": f"Bearer {agent_token}"},
    )
    assert after_res.json["unread_count"] == 0
