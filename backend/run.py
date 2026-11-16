import os
import click
from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.ticket import Ticket
from app.models.comment import Comment
from app.models.history import TicketHistory
from app.models.notification import Notification
from app.services.ticket_service import generate_ticket_number, calculate_due_date

app = create_app(os.getenv("FLASK_ENV", "development"))


@app.cli.command("init-db")
def init_db_command():
    """Create all database tables."""
    with app.app_context():
        db.create_all()
        click.echo("[OK] Database tables initialized successfully.")


@app.cli.command("create-admin")
@click.option("--name", default="System Administrator", help="Admin's full name")
@click.option("--email", prompt="Admin email", help="Admin email address")
@click.option("--password", prompt=True, hide_input=True, confirmation_prompt=True, help="Admin password")
def create_admin_command(name, email, password):
    """CLI command to create or update the initial administrator account."""
    with app.app_context():
        email = email.strip().lower()
        user = User.query.filter_by(email=email).first()
        if user:
            user.full_name = name
            user.role = User.ROLE_ADMIN
            user.is_active = True
            user.set_password(password)
            click.echo(f"[OK] Existing user {email} promoted to Administrator.")
        else:
            admin = User(
                full_name=name,
                email=email,
                role=User.ROLE_ADMIN,
                is_active=True,
            )
            admin.set_password(password)
            db.session.add(admin)
            click.echo(f"[OK] Administrator account created for {email}.")
        db.session.commit()


@app.cli.command("seed-data")
def seed_data_command():
    """Populate database with sample realistic data for immediate testing and demonstration."""
    with app.app_context():
        db.create_all()

        # 1. Create default Admin
        admin = User.query.filter_by(email="admin@helpdesk.com").first()
        if not admin:
            admin = User(
                full_name="Alex Vance (Admin)",
                email="admin@helpdesk.com",
                role=User.ROLE_ADMIN,
                is_active=True,
            )
            admin.set_password("Admin@123456")
            db.session.add(admin)

        # 2. Create default Support Agents
        agent1 = User.query.filter_by(email="agent.sarah@helpdesk.com").first()
        if not agent1:
            agent1 = User(
                full_name="Sarah Connor",
                email="agent.sarah@helpdesk.com",
                role=User.ROLE_AGENT,
                is_active=True,
            )
            agent1.set_password("Agent@123456")
            db.session.add(agent1)

        agent2 = User.query.filter_by(email="agent.john@helpdesk.com").first()
        if not agent2:
            agent2 = User(
                full_name="John Miller",
                email="agent.john@helpdesk.com",
                role=User.ROLE_AGENT,
                is_active=True,
            )
            agent2.set_password("Agent@123456")
            db.session.add(agent2)

        # 3. Create default Employees
        emp1 = User.query.filter_by(email="employee.david@company.com").first()
        if not emp1:
            emp1 = User(
                full_name="David Patel",
                email="employee.david@company.com",
                role=User.ROLE_EMPLOYEE,
                is_active=True,
            )
            emp1.set_password("Employee@123456")
            db.session.add(emp1)

        emp2 = User.query.filter_by(email="employee.emily@company.com").first()
        if not emp2:
            emp2 = User(
                full_name="Emily Watson",
                email="employee.emily@company.com",
                role=User.ROLE_EMPLOYEE,
                is_active=True,
            )
            emp2.set_password("Employee@123456")
            db.session.add(emp2)

        db.session.commit()

        # 4. Create sample tickets if none exist
        if Ticket.query.count() == 0:
            sample_tickets = [
                {
                    "title": "VPN connection dropping repeatedly during video calls",
                    "description": "Whenever I connect to the corporate VPN from home, Microsoft Teams calls disconnect after 5-10 minutes. Requires reconnecting VPN every time.",
                    "category": Ticket.CATEGORY_NETWORK,
                    "priority": Ticket.PRIORITY_HIGH,
                    "status": Ticket.STATUS_IN_PROGRESS,
                    "creator": emp1,
                    "assignee": agent1,
                },
                {
                    "title": "Dual monitor display flickering with USB-C docking station",
                    "description": "My secondary external monitor flickers black randomly every few seconds when connected through the Dell USB-C dock at desk #14.",
                    "category": Ticket.CATEGORY_HARDWARE,
                    "priority": Ticket.PRIORITY_MEDIUM,
                    "status": Ticket.STATUS_ASSIGNED,
                    "creator": emp1,
                    "assignee": agent2,
                },
                {
                    "title": "Production database latency spike and timeout alerts",
                    "description": "Automated alert: API endpoints encountering query timeouts on primary replica. SLA breach imminent if unaddressed.",
                    "category": Ticket.CATEGORY_SOFTWARE,
                    "priority": Ticket.PRIORITY_CRITICAL,
                    "status": Ticket.STATUS_OPEN,
                    "creator": emp2,
                    "assignee": None,
                },
                {
                    "title": "Request access to Git repository and AWS sandbox account",
                    "description": "Onboarding request: Need read/write access to the core-billing repo on GitHub and an IAM role for the dev sandbox account.",
                    "category": Ticket.CATEGORY_ACCOUNT_ACCESS,
                    "priority": Ticket.PRIORITY_LOW,
                    "status": Ticket.STATUS_RESOLVED,
                    "creator": emp2,
                    "assignee": agent1,
                    "resolution_notes": "Granted repository write permissions and dispatched AWS SSO invitation email.",
                },
                {
                    "title": "Need license key for JetBrains PyCharm Professional",
                    "description": "Annual renewal for developer PyCharm license. Manager approval already attached in HR portal.",
                    "category": Ticket.CATEGORY_SOFTWARE,
                    "priority": Ticket.PRIORITY_MEDIUM,
                    "status": Ticket.STATUS_CLOSED,
                    "creator": emp1,
                    "assignee": agent2,
                    "resolution_notes": "Assigned license via JetBrains Organization Team Portal.",
                },
            ]

            for s in sample_tickets:
                ticket_num = generate_ticket_number()
                due_at = calculate_due_date(s["priority"])
                ticket = Ticket(
                    ticket_number=ticket_num,
                    title=s["title"],
                    description=s["description"],
                    category=s["category"],
                    priority=s["priority"],
                    status=s["status"],
                    created_by=s["creator"].id,
                    assigned_to=s["assignee"].id if s.get("assignee") else None,
                    due_at=due_at,
                    resolution_notes=s.get("resolution_notes"),
                )
                db.session.add(ticket)
                db.session.flush()

                # Add initial history
                hist = TicketHistory(
                    ticket_id=ticket.id,
                    changed_by=s["creator"].id,
                    old_status=None,
                    new_status=Ticket.STATUS_OPEN,
                    description=f"Ticket submitted by {s['creator'].full_name}",
                )
                db.session.add(hist)

                # Add sample comments
                if s["status"] in [Ticket.STATUS_IN_PROGRESS, Ticket.STATUS_ASSIGNED, Ticket.STATUS_RESOLVED]:
                    c1 = Comment(
                        ticket_id=ticket.id,
                        user_id=agent1.id,
                        message="Hello! I have started looking into this issue. Could you let me know which network adapter driver version is currently installed?",
                        is_internal=False,
                    )
                    db.session.add(c1)

                    internal_note = Comment(
                        ticket_id=ticket.id,
                        user_id=agent1.id,
                        message="Internal Note: Checked the gateway logs for desk 14 subnet; MTU size mismatch might be causing packet drops.",
                        is_internal=True,
                    )
                    db.session.add(internal_note)

            db.session.commit()
            click.echo("[OK] Sample realistic tickets and conversations seeded.")

        click.echo("[OK] Database seeded successfully.")
        click.echo("Credentials created:")
        click.echo("  Admin:     admin@helpdesk.com / Admin@123456")
        click.echo("  Agent:     agent.sarah@helpdesk.com / Agent@123456")
        click.echo("  Employee:  employee.david@company.com / Employee@123456")


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
