import pytest
from app.models.ticket import Ticket
from tests.conftest import get_token


def test_internal_notes_isolation_for_employees(client, seed_users):
    """
    Critical Security Test:
    Verify that internal notes created by agents/admins are completely hidden
    from employees in ticket details and comment endpoints.
    """
    alice_token = get_token(client, "alice@test.com", "AlicePass123")
    agent_token = get_token(client, "agent@test.com", "AgentPass123")

    # Alice creates a ticket
    create_res = client.post(
        "/api/v1/tickets",
        headers={"Authorization": f"Bearer {alice_token}"},
        json={
            "title": "Account locked after password attempts",
            "description": "I cannot log into the payroll system.",
            "category": Ticket.CATEGORY_ACCOUNT_ACCESS,
            "priority": Ticket.PRIORITY_MEDIUM,
        },
    )
    ticket_id = create_res.json["ticket"]["id"]

    # Agent posts a public comment
    client.post(
        f"/api/v1/tickets/{ticket_id}/comments",
        headers={"Authorization": f"Bearer {agent_token}"},
        json={
            "message": "Hello Alice, I am unlocking your account now.",
            "is_internal": False,
        },
    )

    # Agent posts a PRIVATE INTERNAL NOTE
    client.post(
        f"/api/v1/tickets/{ticket_id}/comments",
        headers={"Authorization": f"Bearer {agent_token}"},
        json={
            "message": "CONFIDENTIAL: User triggered security alert threshold. Reviewing audit log.",
            "is_internal": True,
        },
    )

    # 1. Agent views ticket details -> SHOULD see both comments (including internal note)
    agent_view = client.get(
        f"/api/v1/tickets/{ticket_id}",
        headers={"Authorization": f"Bearer {agent_token}"},
    )
    agent_comments = agent_view.json["ticket"]["comments"]
    assert len(agent_comments) == 2
    assert any(c["is_internal"] is True for c in agent_comments)

    # 2. Employee Alice views ticket details -> MUST NOT see the internal note!
    alice_view = client.get(
        f"/api/v1/tickets/{ticket_id}",
        headers={"Authorization": f"Bearer {alice_token}"},
    )
    alice_comments = alice_view.json["ticket"]["comments"]
    assert len(alice_comments) == 1
    assert all(c["is_internal"] is False for c in alice_comments)
    assert not any("CONFIDENTIAL" in c["message"] for c in alice_comments)

    # 3. Employee Alice views comments list endpoint -> MUST NOT see internal note!
    alice_comments_list = client.get(
        f"/api/v1/tickets/{ticket_id}/comments",
        headers={"Authorization": f"Bearer {alice_token}"},
    )
    assert len(alice_comments_list.json["comments"]) == 1
    assert alice_comments_list.json["comments"][0]["is_internal"] is False


def test_employee_cannot_create_internal_note(client, seed_users):
    """If an employee attempts to submit is_internal=True, it must be forced to False."""
    alice_token = get_token(client, "alice@test.com", "AlicePass123")

    create_res = client.post(
        "/api/v1/tickets",
        headers={"Authorization": f"Bearer {alice_token}"},
        json={
            "title": "Need second monitor cable",
            "description": "HDMI cable required.",
            "category": Ticket.CATEGORY_HARDWARE,
            "priority": Ticket.PRIORITY_LOW,
        },
    )
    ticket_id = create_res.json["ticket"]["id"]

    comment_res = client.post(
        f"/api/v1/tickets/{ticket_id}/comments",
        headers={"Authorization": f"Bearer {alice_token}"},
        json={
            "message": "Trying to post internal note as employee",
            "is_internal": True,
        },
    )
    assert comment_res.status_code == 201
    assert comment_res.json["comment"]["is_internal"] is False
