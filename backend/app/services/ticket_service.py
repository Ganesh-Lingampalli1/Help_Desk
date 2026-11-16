from datetime import datetime, timedelta
import random
from flask import current_app
from app.extensions import db
from app.models.ticket import Ticket
from app.models.history import TicketHistory
from app.models.user import User
from app.services.notification_service import send_notification

# Allowed transitions state machine: current_status -> set of allowed next_statuses
ALLOWED_TRANSITIONS = {
    Ticket.STATUS_OPEN: {
        Ticket.STATUS_ASSIGNED,
        Ticket.STATUS_IN_PROGRESS,
        Ticket.STATUS_CLOSED,
    },
    Ticket.STATUS_ASSIGNED: {
        Ticket.STATUS_OPEN,
        Ticket.STATUS_IN_PROGRESS,
        Ticket.STATUS_PENDING,
        Ticket.STATUS_CLOSED,
    },
    Ticket.STATUS_IN_PROGRESS: {
        Ticket.STATUS_ASSIGNED,
        Ticket.STATUS_PENDING,
        Ticket.STATUS_RESOLVED,
        Ticket.STATUS_CLOSED,
    },
    Ticket.STATUS_PENDING: {
        Ticket.STATUS_IN_PROGRESS,
        Ticket.STATUS_RESOLVED,
        Ticket.STATUS_CLOSED,
    },
    Ticket.STATUS_RESOLVED: {
        Ticket.STATUS_CLOSED,
        Ticket.STATUS_IN_PROGRESS,  # Reopening
        Ticket.STATUS_OPEN,        # Reopening
    },
    Ticket.STATUS_CLOSED: {
        Ticket.STATUS_OPEN,        # Admin or authorized reopen
        Ticket.STATUS_IN_PROGRESS,  # Admin or authorized reopen
    },
}


def calculate_due_date(priority: str) -> datetime:
    """Calculate the due date based on priority SLA targets."""
    sla_targets = current_app.config.get("SLA_TARGETS", {
        "Critical": 4,
        "High": 8,
        "Medium": 24,
        "Low": 48,
    })
    hours = sla_targets.get(priority, 24)
    return datetime.utcnow() + timedelta(hours=hours)


def generate_ticket_number() -> str:
    """Generate a unique, human-readable ticket number like HD-2026-1042."""
    year = datetime.utcnow().year
    # Try generating a sequential or unique number
    for _ in range(10):
        rand_num = random.randint(1000, 9999)
        ticket_number = f"HD-{year}-{rand_num}"
        if not Ticket.query.filter_by(ticket_number=ticket_number).first():
            return ticket_number
    # Fallback to timestamp based
    ts = int(datetime.utcnow().timestamp()) % 100000
    return f"HD-{year}-{ts}"


def record_history(
    ticket_id: int,
    changed_by_id: int,
    old_status: str | None,
    new_status: str,
    description: str | None = None,
) -> TicketHistory:
    """Record an audit entry in the ticket history."""
    history = TicketHistory(
        ticket_id=ticket_id,
        changed_by=changed_by_id,
        old_status=old_status,
        new_status=new_status,
        description=description,
    )
    db.session.add(history)
    return history


def transition_ticket_status(
    ticket: Ticket,
    new_status: str,
    user: User,
    resolution_notes: str | None = None,
    explanation: str | None = None,
) -> tuple[bool, str]:
    """
    Validates and performs a status transition on a ticket.
    Enforces authorization, required notes, and transition rules.
    """
    if new_status not in Ticket.STATUSES:
        return False, f"Invalid status: '{new_status}'. Allowed: {', '.join(Ticket.STATUSES)}"

    old_status = ticket.status

    # No change needed
    if old_status == new_status:
        return True, "Ticket status is already set to this value."

    # Status transition rules check
    allowed_next = ALLOWED_TRANSITIONS.get(old_status, set())
    if new_status not in allowed_next:
        # Admins can force any sensible transition if needed, otherwise block
        if user.role != User.ROLE_ADMIN:
            return False, f"Transition from '{old_status}' to '{new_status}' is not allowed."

    # Employee specific restriction
    if user.role == User.ROLE_EMPLOYEE:
        # Employees can only close their own ticket or reopen from Resolved
        if ticket.created_by != user.id:
            return False, "You can only change the status of tickets you created."
        if new_status not in [Ticket.STATUS_CLOSED, Ticket.STATUS_IN_PROGRESS, Ticket.STATUS_OPEN]:
            return False, "Employees can only close or reopen tickets."
        if old_status == Ticket.STATUS_CLOSED and user.role != User.ROLE_ADMIN:
            return False, "Closed tickets cannot be reopened by employees. Please contact support or submit a new ticket."

    # Agent specific restriction
    if user.role == User.ROLE_AGENT:
        # Agents can only update tickets assigned to them or unassigned tickets they are picking up
        if ticket.assigned_to and ticket.assigned_to != user.id:
            return False, "You can only update tickets assigned to you."

    # Resolution notes requirement
    if new_status == Ticket.STATUS_RESOLVED:
        if not resolution_notes or not resolution_notes.strip():
            return False, "Resolution notes are required when marking a ticket as Resolved."
        ticket.resolution_notes = resolution_notes.strip()
        ticket.resolved_at = datetime.utcnow()

    # Closed timestamp
    if new_status == Ticket.STATUS_CLOSED:
        ticket.closed_at = datetime.utcnow()

    # Reopened handling
    if old_status in [Ticket.STATUS_RESOLVED, Ticket.STATUS_CLOSED] and new_status in [
        Ticket.STATUS_IN_PROGRESS,
        Ticket.STATUS_OPEN,
    ]:
        reopen_msg = f"Ticket reopened by {user.full_name} ({user.role})"
        if explanation:
            reopen_msg += f": {explanation}"
        explanation = reopen_msg

    # Apply status change
    ticket.status = new_status
    ticket.updated_at = datetime.utcnow()

    # Audit log
    desc = explanation or f"Status changed from {old_status} to {new_status}"
    record_history(
        ticket_id=ticket.id,
        changed_by_id=user.id,
        old_status=old_status,
        new_status=new_status,
        description=desc,
    )

    # Notify creator if changed by someone else
    if ticket.created_by != user.id:
        send_notification(
            user_id=ticket.created_by,
            ticket_id=ticket.id,
            message=f"Ticket {ticket.ticket_number} status was updated to '{new_status}' by {user.full_name}.",
        )

    # Notify assignee if changed by someone else
    if ticket.assigned_to and ticket.assigned_to != user.id:
        send_notification(
            user_id=ticket.assigned_to,
            ticket_id=ticket.id,
            message=f"Ticket {ticket.ticket_number} status was updated to '{new_status}' by {user.full_name}.",
        )

    return True, "Status updated successfully."


def assign_ticket(
    ticket: Ticket,
    assigned_to_id: int | None,
    assigned_by: User,
) -> tuple[bool, str]:
    """Assign or reassign a ticket to a support agent or unassign."""
    # Only admins and agents can assign/reassign tickets
    if assigned_by.role not in [User.ROLE_ADMIN, User.ROLE_AGENT]:
        return False, "Only Administrators and Support Agents can assign tickets."

    # If agent assigning, can self-assign or reassign if allowed
    if assigned_by.role == User.ROLE_AGENT and assigned_to_id != assigned_by.id:
        if assigned_by.role != User.ROLE_ADMIN:
            return False, "Agents can only self-assign tickets."

    old_assignee_id = ticket.assigned_to
    new_assignee = None

    if assigned_to_id:
        new_assignee = User.query.get(assigned_to_id)
        if not new_assignee or not new_assignee.is_active:
            return False, "Selected assignee does not exist or is inactive."
        if new_assignee.role not in [User.ROLE_AGENT, User.ROLE_ADMIN]:
            return False, "Tickets can only be assigned to Support Agents or Administrators."

    ticket.assigned_to = assigned_to_id
    old_status = ticket.status

    if assigned_to_id:
        if ticket.status == Ticket.STATUS_OPEN:
            ticket.status = Ticket.STATUS_ASSIGNED
        assign_desc = f"Assigned to {new_assignee.full_name} by {assigned_by.full_name}"
    else:
        if ticket.status == Ticket.STATUS_ASSIGNED:
            ticket.status = Ticket.STATUS_OPEN
        assign_desc = f"Unassigned by {assigned_by.full_name}"

    ticket.updated_at = datetime.utcnow()

    # Audit history
    record_history(
        ticket_id=ticket.id,
        changed_by_id=assigned_by.id,
        old_status=old_status,
        new_status=ticket.status,
        description=assign_desc,
    )

    # Notify new assignee
    if assigned_to_id and assigned_to_id != assigned_by.id:
        send_notification(
            user_id=assigned_to_id,
            ticket_id=ticket.id,
            message=f"Ticket {ticket.ticket_number} has been assigned to you by {assigned_by.full_name}.",
        )

    # Notify creator
    if ticket.created_by != assigned_by.id:
        agent_name = new_assignee.full_name if new_assignee else "unassigned"
        send_notification(
            user_id=ticket.created_by,
            ticket_id=ticket.id,
            message=f"Ticket {ticket.ticket_number} is now assigned to {agent_name}.",
        )

    return True, "Ticket assignment updated successfully."
