from datetime import datetime, timedelta
from sqlalchemy import func
from app.extensions import db
from app.models.ticket import Ticket
from app.models.user import User


def get_dashboard_statistics(user: User) -> dict:
    """
    Compute role-tailored real-time metrics from the database.
    - Employee sees stats for their tickets
    - Agent sees stats for assigned & queue tickets
    - Admin sees global system analytics
    """
    now = datetime.utcnow()
    query = Ticket.query

    if user.role == User.ROLE_EMPLOYEE:
        query = query.filter(Ticket.created_by == user.id)
    elif user.role == User.ROLE_AGENT:
        # Agent overview includes assigned and overall work
        pass

    total_tickets = query.count()
    open_tickets = query.filter(Ticket.status == Ticket.STATUS_OPEN).count()
    assigned_tickets = query.filter(Ticket.status == Ticket.STATUS_ASSIGNED).count()
    in_progress_tickets = query.filter(Ticket.status == Ticket.STATUS_IN_PROGRESS).count()
    pending_tickets = query.filter(Ticket.status == Ticket.STATUS_PENDING).count()
    resolved_tickets = query.filter(Ticket.status == Ticket.STATUS_RESOLVED).count()
    closed_tickets = query.filter(Ticket.status == Ticket.STATUS_CLOSED).count()

    critical_tickets = query.filter(
        Ticket.priority == Ticket.PRIORITY_CRITICAL,
        Ticket.status.notin_([Ticket.STATUS_RESOLVED, Ticket.STATUS_CLOSED]),
    ).count()

    overdue_tickets = query.filter(
        Ticket.status.notin_([Ticket.STATUS_RESOLVED, Ticket.STATUS_CLOSED]),
        Ticket.due_at < now,
    ).count()

    stats = {
        "total": total_tickets,
        "open": open_tickets,
        "assigned": assigned_tickets,
        "in_progress": in_progress_tickets,
        "pending": pending_tickets,
        "resolved": resolved_tickets,
        "closed": closed_tickets,
        "critical": critical_tickets,
        "overdue": overdue_tickets,
    }

    if user.role == User.ROLE_AGENT:
        # Extra agent-specific counts
        my_assigned = Ticket.query.filter(Ticket.assigned_to == user.id).count()
        my_open = Ticket.query.filter(
            Ticket.assigned_to == user.id,
            Ticket.status.in_([Ticket.STATUS_ASSIGNED, Ticket.STATUS_IN_PROGRESS]),
        ).count()
        my_resolved = Ticket.query.filter(
            Ticket.assigned_to == user.id,
            Ticket.status.in_([Ticket.STATUS_RESOLVED, Ticket.STATUS_CLOSED]),
        ).count()
        unassigned_count = Ticket.query.filter(
            Ticket.assigned_to.is_(None),
            Ticket.status == Ticket.STATUS_OPEN,
        ).count()

        stats["my_assigned"] = my_assigned
        stats["my_active"] = my_open
        stats["my_resolved"] = my_resolved
        stats["unassigned_queue"] = unassigned_count

    return stats


def get_admin_analytics() -> dict:
    """Detailed analytics and reports computed for Administrators."""
    now = datetime.utcnow()

    # Category distribution
    categories = [
        Ticket.CATEGORY_HARDWARE,
        Ticket.CATEGORY_SOFTWARE,
        Ticket.CATEGORY_NETWORK,
        Ticket.CATEGORY_ACCOUNT_ACCESS,
        Ticket.CATEGORY_OTHER,
    ]
    by_category = []
    for cat in categories:
        count = Ticket.query.filter_by(category=cat).count()
        by_category.append({"name": cat, "count": count})

    # Priority distribution
    priorities = [
        Ticket.PRIORITY_LOW,
        Ticket.PRIORITY_MEDIUM,
        Ticket.PRIORITY_HIGH,
        Ticket.PRIORITY_CRITICAL,
    ]
    by_priority = []
    for prio in priorities:
        count = Ticket.query.filter_by(priority=prio).count()
        by_priority.append({"name": prio, "count": count})

    # Status distribution
    by_status = []
    for st in Ticket.STATUSES:
        count = Ticket.query.filter_by(status=st).count()
        by_status.append({"name": st, "count": count})

    # Ticket creation trend for last 7 days
    creation_trends = []
    for i in range(6, -1, -1):
        day_date = (now - timedelta(days=i)).date()
        day_start = datetime.combine(day_date, datetime.min.time())
        day_end = datetime.combine(day_date, datetime.max.time())
        count = Ticket.query.filter(
            Ticket.created_at >= day_start,
            Ticket.created_at <= day_end,
        ).count()
        creation_trends.append({
            "date": day_date.strftime("%b %d"),
            "created": count,
        })

    # Average Resolution Time calculation (in hours)
    resolved_tickets = Ticket.query.filter(
        Ticket.resolved_at.isnot(None),
        Ticket.status.in_([Ticket.STATUS_RESOLVED, Ticket.STATUS_CLOSED]),
    ).all()

    avg_resolution_hours = 0.0
    sla_met_count = 0
    total_resolved = len(resolved_tickets)

    if total_resolved > 0:
        total_seconds = sum(
            (t.resolved_at - t.created_at).total_seconds()
            for t in resolved_tickets
            if t.resolved_at > t.created_at
        )
        avg_resolution_hours = round(total_seconds / (3600 * total_resolved), 1)

        sla_met_count = sum(
            1 for t in resolved_tickets
            if t.due_at and t.resolved_at <= t.due_at
        )
        sla_compliance_rate = round((sla_met_count / total_resolved) * 100, 1)
    else:
        sla_compliance_rate = 100.0

    # Agent workload statistics
    agents = User.query.filter(
        User.role.in_([User.ROLE_AGENT, User.ROLE_ADMIN]),
        User.is_active.is_(True),
    ).all()

    agent_workload = []
    for agent in agents:
        active_count = Ticket.query.filter(
            Ticket.assigned_to == agent.id,
            Ticket.status.notin_([Ticket.STATUS_RESOLVED, Ticket.STATUS_CLOSED]),
        ).count()
        resolved_count = Ticket.query.filter(
            Ticket.assigned_to == agent.id,
            Ticket.status.in_([Ticket.STATUS_RESOLVED, Ticket.STATUS_CLOSED]),
        ).count()
        agent_workload.append({
            "id": agent.id,
            "name": agent.full_name,
            "role": agent.role,
            "active_tickets": active_count,
            "resolved_tickets": resolved_count,
        })

    return {
        "by_category": by_category,
        "by_priority": by_priority,
        "by_status": by_status,
        "trends": creation_trends,
        "avg_resolution_hours": avg_resolution_hours,
        "sla_compliance_rate": sla_compliance_rate,
        "agent_workload": agent_workload,
        "total_tickets": Ticket.query.count(),
        "total_users": User.query.count(),
    }
