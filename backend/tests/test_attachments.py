import io
import pytest
from app.models.ticket import Ticket
from tests.conftest import get_token


def test_upload_valid_attachment(client, seed_users):
    """Uploading a permitted file type (e.g. png, txt) succeeds."""
    alice_token = get_token(client, "alice@test.com", "AlicePass123")

    # Create ticket
    create_res = client.post(
        "/api/v1/tickets",
        headers={"Authorization": f"Bearer {alice_token}"},
        json={
            "title": "Error screenshot attached",
            "description": "Please see error screenshot.",
            "category": Ticket.CATEGORY_SOFTWARE,
            "priority": Ticket.PRIORITY_MEDIUM,
        },
    )
    ticket_id = create_res.json["ticket"]["id"]

    # Upload attachment
    data = {
        "file": (io.BytesIO(b"fake image data content"), "error_log.txt"),
    }
    upload_res = client.post(
        f"/api/v1/tickets/{ticket_id}/attachments",
        headers={"Authorization": f"Bearer {alice_token}"},
        data=data,
        content_type="multipart/form-data",
    )
    assert upload_res.status_code == 201
    attachment = upload_res.json["attachment"]
    assert attachment["original_filename"] == "error_log.txt"
    assert attachment["file_size"] > 0

    # Download attachment
    att_id = attachment["id"]
    download_res = client.get(
        f"/api/v1/tickets/{ticket_id}/attachments/{att_id}/download",
        headers={"Authorization": f"Bearer {alice_token}"},
    )
    assert download_res.status_code == 200
    assert download_res.data == b"fake image data content"


def test_upload_disallowed_file_extension(client, seed_users):
    """Uploading executable or unsupported file extension fails with 400."""
    alice_token = get_token(client, "alice@test.com", "AlicePass123")

    create_res = client.post(
        "/api/v1/tickets",
        headers={"Authorization": f"Bearer {alice_token}"},
        json={
            "title": "Malware test ticket",
            "description": "Testing invalid file types.",
            "category": Ticket.CATEGORY_SOFTWARE,
            "priority": Ticket.PRIORITY_LOW,
        },
    )
    ticket_id = create_res.json["ticket"]["id"]

    data = {
        "file": (io.BytesIO(b"malicious script"), "payload.exe"),
    }
    upload_res = client.post(
        f"/api/v1/tickets/{ticket_id}/attachments",
        headers={"Authorization": f"Bearer {alice_token}"},
        data=data,
        content_type="multipart/form-data",
    )
    assert upload_res.status_code == 400
    assert "not permitted" in upload_res.json["error"]["message"].lower()


def test_attachment_idor_protection(client, seed_users):
    """Employee Bob cannot download attachments from Alice's ticket."""
    alice_token = get_token(client, "alice@test.com", "AlicePass123")
    bob_token = get_token(client, "bob@test.com", "BobPass123")

    create_res = client.post(
        "/api/v1/tickets",
        headers={"Authorization": f"Bearer {alice_token}"},
        json={
            "title": "Confidential financial ticket",
            "description": "Invoice discrepancy.",
            "category": Ticket.CATEGORY_OTHER,
            "priority": Ticket.PRIORITY_MEDIUM,
        },
    )
    ticket_id = create_res.json["ticket"]["id"]

    upload_res = client.post(
        f"/api/v1/tickets/{ticket_id}/attachments",
        headers={"Authorization": f"Bearer {alice_token}"},
        data={"file": (io.BytesIO(b"sensitive invoice"), "invoice.pdf")},
        content_type="multipart/form-data",
    )
    att_id = upload_res.json["attachment"]["id"]

    # Bob attempts to download Alice's invoice
    bob_res = client.get(
        f"/api/v1/tickets/{ticket_id}/attachments/{att_id}/download",
        headers={"Authorization": f"Bearer {bob_token}"},
    )
    assert bob_res.status_code == 403
