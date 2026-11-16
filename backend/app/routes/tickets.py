from datetime import datetime
from flask import Blueprint, request, jsonify
from sqlalchemy import or_

from app.extensions import db
from app.models.ticket import Ticket
from app.models.user import User
from app.models.history import TicketHistory
from app.services.ticket_service import (
    generate_ticket_number,
    calculate_due_date,
    record_history,
    transition_ticket_status,
    assign_ticket,
)
from app.services.stats_service import get_dashboard_statistics
from app.utils.decorators import get_current_user, active_user_required, role_required

tickets_bp = Blueprint("tickets", __name__, url_prefix="/api/v1/tickets")


@tickets_bp.route("/stats", methods=["GET"])
@active_user_required
def get_stats():
    """Get real-time dashboard statistics tailored to the current user."""
    user = get_current_user()
    stats = get_dashboard_statistics(user)
    return jsonify({"success": True, "stats": stats}), 200


@tickets_bp.route("", methods=["POST"])
@active_user_required
def create_ticket():
    """Create a new support ticket."""
    user = get_current_user()
    data = request.get_json() or {}

    title = data.get("title", "").strip()
    description = data.get("description", "").strip()
    category = data.get("category", "").strip()
    priority = data.get("priority", Ticket.PRIORITY_MEDIUM).strip()

    if not title:
        return jsonify({"success": False, "error": {"code": 400, "message": "Ticket title is required."}}), 400

    if len(title) > 200:
        return jsonify({"success": False, "error": {"code": 400, "message": "Ticket title cannot exceed 200 characters."}}), 400

    if not description:
        return jsonify({"success": False, "error": {"code": 400, "message": "Ticket description is required."}}), 400

    if category not in Ticket.CATEGORIES:
        return jsonify({
            "success": False,
            "error": {"code": 400, "message": f"Invalid category. Allowed: {', '.join(Ticket.CATEGORIES)}"}
        }), 400

    if priority not in Ticket.PRIORITIES:
        return jsonify({
            "success": False,
            "error": {"code": 400, "message": f"Invalid priority. Allowed: {', '.join(Ticket.PRIORITIES)}"}
        }), 400

    ticket_number = generate_ticket_number()
    due_at = calculate_due_date(priority)

    ticket = Ticket(
        ticket_number=ticket_number,
        title=title,
        description=description,
        category=category,
        priority=priority,
        status=Ticket.STATUS_OPEN,
        created_by=user.id,
        due_at=due_at,
    )

    db.session.add(ticket)
    db.session.flush()  # Obtain ticket.id for history record

    record_history(
        ticket_id=ticket.id,
        changed_by_id=user.id,
        old_status=None,
        new_status=Ticket.STATUS_OPEN,
        description=f"Ticket created by {user.full_name} ({user.role})",
    )

    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Ticket created successfully.",
        "ticket": ticket.to_dict(include_details=True, current_user_role=user.role),
    }), 201


@tickets_bp.route("", methods=["GET"])
@active_user_required
def get_tickets():
    """
    Get paginated and filtered list of tickets.
    Enforces authorization: employees can only view their own tickets.
    """
    user = get_current_user()

    # Query params
    page = request.args.get("page", 1, type=int)
    per_page = min(request.args.get("per_page", 10, type=int), 100)
    search = request.args.get("search", "").strip()
    status = request.args.get("status", "").strip()
    priority = request.args.get("priority", "").strip()
    category = request.args.get("category", "").strip()
    assigned_to = request.args.get("assigned_to", "").strip()
    created_by = request.args.get("created_by", "").strip()
    sort_by = request.args.get("sort_by", "created_at").strip()
    order = request.args.get("order", "desc").strip().lower()

    query = Ticket.query

    # Authorization filter: employees only ever see their own tickets
    if user.role == User.ROLE_EMPLOYEE:
        query = query.filter(Ticket.created_by == user.id)
    else:
        # Agent / Admin specific filters
        if created_by:
            query = query.filter(Ticket.created_by == int(created_by))
        if assigned_to:
            if assigned_to == "unassigned":
                query = query.filter(Ticket.assigned_to.is_(None))
            elif assigned_to == "me":
                query = query.filter(Ticket.assigned_to == user.id)
            else:
                try:
                    query = query.filter(Ticket.assigned_to == int(assigned_to))
                except ValueError:
                    pass

    # Status filter
    if status and status in Ticket.STATUSES:
        query = query.filter(Ticket.status == status)

    # Priority filter
    if priority and priority in Ticket.PRIORITIES:
        query = query.filter(Ticket.priority == priority)

    # Category filter
    if category and category in Ticket.CATEGORIES:
        query = query.filter(Ticket.category == category)

    # Full text search in ticket_number, title, or description
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Ticket.ticket_number.ilike(search_pattern),
                Ticket.title.ilike(search_pattern),
                Ticket.description.ilike(search_pattern),
            )
        )

    # Sorting
    sort_column = getattr(Ticket, sort_by, Ticket.created_at)
    if order == "asc":
        query = query.order_by(sort_column.asc())
    else:
        query = query.order_by(sort_column.desc())

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    tickets_data = [
        t.to_dict(include_details=False, current_user_role=user.role)
        for t in pagination.items
    ]

    return jsonify({
        "success": True,
        "tickets": tickets_data,
        "pagination": {
            "total": pagination.total,
            "pages": pagination.pages,
            "page": page,
            "per_page": per_page,
            "has_next": pagination.has_next,
            "has_prev": pagination.has_prev,
        },
    }), 200


@tickets_bp.route("/<int:ticket_id>", methods=["GET"])
@active_user_required
def get_ticket(ticket_id: int):
    """Get single ticket details with comments, history, and attachments."""
    user = get_current_user()
    ticket = Ticket.query.get(ticket_id)

    if not ticket:
        return jsonify({"success": False, "error": {"code": 404, "message": "Ticket not found."}}), 404

    # IDOR / Authorization check
    if user.role == User.ROLE_EMPLOYEE and ticket.created_by != user.id:
        return jsonify({
            "success": False,
            "error": {"code": 403, "message": "Access denied. You do not have permission to view this ticket."}
        }), 403

    return jsonify({
        "success": True,
        "ticket": ticket.to_dict(include_details=True, current_user_role=user.role),
    }), 200


@tickets_bp.route("/<int:ticket_id>", methods=["PATCH"])
@active_user_required
def update_ticket(ticket_id: int):
    """Update ticket fields (title, description, category, priority)."""
    user = get_current_user()
    ticket = Ticket.query.get(ticket_id)

    if not ticket:
        return jsonify({"success": False, "error": {"code": 404, "message": "Ticket not found."}}), 404

    # Authorization
    if user.role == User.ROLE_EMPLOYEE:
        if ticket.created_by != user.id:
            return jsonify({"success": False, "error": {"code": 403, "message": "Access denied."}}), 403
        if ticket.status != Ticket.STATUS_OPEN:
            return jsonify({
                "success": False,
                "error": {"code": 400, "message": "Employees can only edit tickets while they remain in 'Open' status."}
            }), 400

    data = request.get_json() or {}

    # Update title
    if "title" in data:
        new_title = data["title"].strip()
        if new_title:
            ticket.title = new_title

    # Update description
    if "description" in data:
        new_desc = data["description"].strip()
        if new_desc:
            ticket.description = new_desc

    # Update category
    if "category" in data:
        new_cat = data["category"].strip()
        if new_cat in Ticket.CATEGORIES:
            ticket.category = new_cat

    # Update priority (Agents & Admins only)
    if "priority" in data:
        if user.role == User.ROLE_EMPLOYEE:
            return jsonify({
                "success": False,
                "error": {"code": 403, "message": "Employees cannot change the ticket priority after submission."}
            }), 403

        new_prio = data["priority"].strip()
        if new_prio in Ticket.PRIORITIES and new_prio != ticket.priority:
            old_prio = ticket.priority
            ticket.priority = new_prio
            ticket.due_at = calculate_due_date(new_prio)
            record_history(
                ticket_id=ticket.id,
                changed_by_id=user.id,
                old_status=ticket.status,
                new_status=ticket.status,
                description=f"Priority updated from {old_prio} to {new_prio} by {user.full_name}",
            )

    ticket.updated_at = datetime.utcnow()
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Ticket updated successfully.",
        "ticket": ticket.to_dict(include_details=True, current_user_role=user.role),
    }), 200


@tickets_bp.route("/<int:ticket_id>/status", methods=["PATCH"])
@active_user_required
def update_status(ticket_id: int):
    """Perform a status transition on a ticket."""
    user = get_current_user()
    ticket = Ticket.query.get(ticket_id)

    if not ticket:
        return jsonify({"success": False, "error": {"code": 404, "message": "Ticket not found."}}), 404

    data = request.get_json() or {}
    new_status = data.get("status", "").strip()
    resolution_notes = data.get("resolution_notes")
    explanation = data.get("explanation")

    success, message = transition_ticket_status(
        ticket=ticket,
        new_status=new_status,
        user=user,
        resolution_notes=resolution_notes,
        explanation=explanation,
    )

    if not success:
        return jsonify({"success": False, "error": {"code": 400, "message": message}}), 400

    db.session.commit()

    return jsonify({
        "success": True,
        "message": message,
        "ticket": ticket.to_dict(include_details=True, current_user_role=user.role),
    }), 200


@tickets_bp.route("/<int:ticket_id>/assign", methods=["POST"])
@role_required(User.ROLE_AGENT, User.ROLE_ADMIN)
def assign(ticket_id: int):
    """Assign or reassign a ticket to a support agent or unassign."""
    user = get_current_user()
    ticket = Ticket.query.get(ticket_id)

    if not ticket:
        return jsonify({"success": False, "error": {"code": 404, "message": "Ticket not found."}}), 404

    data = request.get_json() or {}
    assigned_to_id = data.get("assigned_to")

    success, message = assign_ticket(
        ticket=ticket,
        assigned_to_id=assigned_to_id,
        assigned_by=user,
    )

    if not success:
        return jsonify({"success": False, "error": {"code": 400, "message": message}}), 400

    db.session.commit()

    return jsonify({
        "success": True,
        "message": message,
        "ticket": ticket.to_dict(include_details=True, current_user_role=user.role),
    }), 200


@tickets_bp.route("/<int:ticket_id>/history", methods=["GET"])
@active_user_required
def get_history(ticket_id: int):
    """Get audit trail and status transition history for a ticket."""
    user = get_current_user()
    ticket = Ticket.query.get(ticket_id)

    if not ticket:
        return jsonify({"success": False, "error": {"code": 404, "message": "Ticket not found."}}), 404

    if user.role == User.ROLE_EMPLOYEE and ticket.created_by != user.id:
        return jsonify({"success": False, "error": {"code": 403, "message": "Access denied."}}), 403

    history = (
        TicketHistory.query.filter_by(ticket_id=ticket.id)
        .order_by(TicketHistory.created_at.desc())
        .all()
    )

    return jsonify({
        "success": True,
        "history": [h.to_dict() for h in history],
    }), 200
