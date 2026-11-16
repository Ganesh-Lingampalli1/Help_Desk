import pytest
from app.models.ticket import Ticket
from app.models.user import User
from tests.conftest import get_token


def test_create_ticket_success(client, seed_users):
    """Test ticket creation generates ticket number and SLA due date."""
    token = get_token(client, "alice@test.com", "AlicePass123")

    payload = {
        "title": "Cannot access internal wiki",
        "description": "Getting 403 Forbidden error when trying to access confluence documentation.",
        "category": Ticket.CATEGORY_ACCOUNT_ACCESS,
        "priority": Ticket.PRIORITY_HIGH,
    }

    res = client.post("/api/v1/tickets", headers={"Authorization": f"Bearer {token}"}, json=payload)
    assert res.status_code == 201
    ticket = res.json["ticket"]
    assert ticket["title"] == payload["title"]
    assert ticket["status"] == Ticket.STATUS_OPEN
    assert ticket["ticket_number"].startswith("HD-")
    assert ticket["due_at"] is not None
    assert len(ticket["history"]) >= 1


def test_ticket_ownership_isolation(client, seed_users):
    """Employee Bob must NOT be able to view Alice's ticket (IDOR protection)."""
    alice_token = get_token(client, "alice@test.com", "AlicePass123")
    bob_token = get_token(client, "bob@test.com", "BobPass123")

    # Alice creates a ticket
    create_res = client.post(
        "/api/v1/tickets",
        headers={"Authorization": f"Bearer {alice_token}"},
        json={
            "title": "Alice's Secret Hardware Issue",
            "description": "My laptop battery is swelling.",
            "category": Ticket.CATEGORY_HARDWARE,
            "priority": Ticket.PRIORITY_MEDIUM,
        },
    )
    assert create_res.status_code == 201
    ticket_id = create_res.json["ticket"]["id"]

    # Bob tries to access Alice's ticket
    bob_view_res = client.get(
        f"/api/v1/tickets/{ticket_id}",
        headers={"Authorization": f"Bearer {bob_token}"},
    )
    assert bob_view_res.status_code == 403
    assert "access denied" in bob_view_res.json["error"]["message"].lower()

    # Bob's tickets list should NOT show Alice's ticket
    bob_list_res = client.get(
        "/api/v1/tickets",
        headers={"Authorization": f"Bearer {bob_token}"},
    )
    assert bob_list_res.status_code == 200
    assert len(bob_list_res.json["tickets"]) == 0


def test_agent_and_admin_can_view_all_tickets(client, seed_users):
    """Support Agent and Admin can view any ticket."""
    alice_token = get_token(client, "alice@test.com", "AlicePass123")
    agent_token = get_token(client, "agent@test.com", "AgentPass123")
    admin_token = get_token(client, "admin@test.com", "AdminPass123")

    create_res = client.post(
        "/api/v1/tickets",
        headers={"Authorization": f"Bearer {alice_token}"},
        json={
            "title": "Network connectivity issue",
            "description": "Ethernet port at desk 5 is dead.",
            "category": Ticket.CATEGORY_NETWORK,
            "priority": Ticket.PRIORITY_LOW,
        },
    )
    ticket_id = create_res.json["ticket"]["id"]

    # Agent view
    res_agent = client.get(f"/api/v1/tickets/{ticket_id}", headers={"Authorization": f"Bearer {agent_token}"})
    assert res_agent.status_code == 200
    assert res_agent.json["ticket"]["id"] == ticket_id

    # Admin view
    res_admin = client.get(f"/api/v1/tickets/{ticket_id}", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_admin.status_code == 200
    assert res_admin.json["ticket"]["id"] == ticket_id


def test_ticket_assignment_workflow(client, seed_users):
    """Admin assigns ticket to Agent; status changes to Assigned and history is logged."""
    alice_token = get_token(client, "alice@test.com", "AlicePass123")
    admin_token = get_token(client, "admin@test.com", "AdminPass123")

    # Create ticket
    create_res = client.post(
        "/api/v1/tickets",
        headers={"Authorization": f"Bearer {alice_token}"},
        json={
            "title": "Printer Jam in Room 204",
            "description": "Paper tray 2 is jammed.",
            "category": Ticket.CATEGORY_HARDWARE,
            "priority": Ticket.PRIORITY_LOW,
        },
    )
    ticket_id = create_res.json["ticket"]["id"]

    # Admin assigns to agent
    assign_res = client.post(
        f"/api/v1/tickets/{ticket_id}/assign",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"assigned_to": seed_users["agent"]},
    )
    assert assign_res.status_code == 200
    ticket = assign_res.json["ticket"]
    assert ticket["assigned_to"] == seed_users["agent"]
    assert ticket["status"] == Ticket.STATUS_ASSIGNED


def test_ticket_status_transitions_and_resolution_notes(client, seed_users):
    """Test full status transition pipeline: Open -> In Progress -> Resolved -> Closed."""
    alice_token = get_token(client, "alice@test.com", "AlicePass123")
    agent_token = get_token(client, "agent@test.com", "AgentPass123")

    # Alice creates ticket
    create_res = client.post(
        "/api/v1/tickets",
        headers={"Authorization": f"Bearer {alice_token}"},
        json={
            "title": "Software crash on launch",
            "description": "App crashes immediately with exit code 1.",
            "category": Ticket.CATEGORY_SOFTWARE,
            "priority": Ticket.PRIORITY_HIGH,
        },
    )
    ticket_id = create_res.json["ticket"]["id"]

    # Agent self-assigns
    client.post(
        f"/api/v1/tickets/{ticket_id}/assign",
        headers={"Authorization": f"Bearer {agent_token}"},
        json={"assigned_to": seed_users["agent"]},
    )

    # Move to In Progress
    res_progress = client.patch(
        f"/api/v1/tickets/{ticket_id}/status",
        headers={"Authorization": f"Bearer {agent_token}"},
        json={"status": Ticket.STATUS_IN_PROGRESS},
    )
    assert res_progress.status_code == 200
    assert res_progress.json["ticket"]["status"] == Ticket.STATUS_IN_PROGRESS

    # Attempt to Resolve WITHOUT resolution notes -> Should FAIL (400)
    fail_resolve = client.patch(
        f"/api/v1/tickets/{ticket_id}/status",
        headers={"Authorization": f"Bearer {agent_token}"},
        json={"status": Ticket.STATUS_RESOLVED},
    )
    assert fail_resolve.status_code == 400
    assert "resolution notes are required" in fail_resolve.json["error"]["message"].lower()

    # Resolve WITH resolution notes -> SUCCESS
    success_resolve = client.patch(
        f"/api/v1/tickets/{ticket_id}/status",
        headers={"Authorization": f"Bearer {agent_token}"},
        json={
            "status": Ticket.STATUS_RESOLVED,
            "resolution_notes": "Updated graphics drivers to version 535.43, crash resolved.",
        },
    )
    assert success_resolve.status_code == 200
    assert success_resolve.json["ticket"]["status"] == Ticket.STATUS_RESOLVED
    assert success_resolve.json["ticket"]["resolution_notes"] is not None

    # Alice closes the resolved ticket
    close_res = client.patch(
        f"/api/v1/tickets/{ticket_id}/status",
        headers={"Authorization": f"Bearer {alice_token}"},
        json={"status": Ticket.STATUS_CLOSED},
    )
    assert close_res.status_code == 200
    assert close_res.json["ticket"]["status"] == Ticket.STATUS_CLOSED
