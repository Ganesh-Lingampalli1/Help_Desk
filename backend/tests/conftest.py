import pytest
from app import create_app
from app.extensions import db
from app.models import Comment, TicketHistory, Attachment, Notification, Ticket, User


@pytest.fixture(scope="session")
def app():
    """Create application configured for testing."""
    test_app = create_app("testing")
    with test_app.app_context():
        db.create_all()
        yield test_app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    """Test client for HTTP requests."""
    return app.test_client()


@pytest.fixture(autouse=True)
def clean_db(app):
    """Ensure clean database state before and after each test run."""
    with app.app_context():
        db.session.rollback()
        for model in [Comment, TicketHistory, Attachment, Notification, Ticket, User]:
            db.session.query(model).delete()
        db.session.commit()
    yield
    with app.app_context():
        db.session.rollback()
        for model in [Comment, TicketHistory, Attachment, Notification, Ticket, User]:
            db.session.query(model).delete()
        db.session.commit()


@pytest.fixture
def seed_users(app, clean_db):
    """Fixture providing created admin, agent, and two employees."""
    with app.app_context():
        admin = User(
            full_name="Admin User",
            email="admin@test.com",
            role=User.ROLE_ADMIN,
            is_active=True,
        )
        admin.set_password("AdminPass123")

        agent = User(
            full_name="Agent Smith",
            email="agent@test.com",
            role=User.ROLE_AGENT,
            is_active=True,
        )
        agent.set_password("AgentPass123")

        employee1 = User(
            full_name="Employee Alice",
            email="alice@test.com",
            role=User.ROLE_EMPLOYEE,
            is_active=True,
        )
        employee1.set_password("AlicePass123")

        employee2 = User(
            full_name="Employee Bob",
            email="bob@test.com",
            role=User.ROLE_EMPLOYEE,
            is_active=True,
        )
        employee2.set_password("BobPass123")

        db.session.add_all([admin, agent, employee1, employee2])
        db.session.commit()

        return {
            "admin": admin.id,
            "agent": agent.id,
            "employee1": employee1.id,
            "employee2": employee2.id,
        }


def get_token(client, email, password):
    """Helper to authenticate and retrieve a bearer token."""
    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, res.data
    return res.json["token"]
