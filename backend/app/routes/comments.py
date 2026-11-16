from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models.ticket import Ticket
from app.models.user import User
from app.models.comment import Comment
from app.services.notification_service import send_notification
from app.utils.decorators import get_current_user, active_user_required

comments_bp = Blueprint("comments", __name__, url_prefix="/api/v1/tickets")


@comments_bp.route("/<int:ticket_id>/comments", methods=["GET"])
@active_user_required
def get_comments(ticket_id: int):
    """Retrieve comments for a ticket. Automatically filters out internal notes for employees."""
    user = get_current_user()
    ticket = Ticket.query.get(ticket_id)

    if not ticket:
        return jsonify({"success": False, "error": {"code": 404, "message": "Ticket not found."}}), 404

    if user.role == User.ROLE_EMPLOYEE and ticket.created_by != user.id:
        return jsonify({"success": False, "error": {"code": 403, "message": "Access denied."}}), 403

    query = Comment.query.filter_by(ticket_id=ticket.id)
    if user.role == User.ROLE_EMPLOYEE:
        # Strictly hide internal notes
        query = query.filter_by(is_internal=False)

    comments = query.order_by(Comment.created_at.asc()).all()

    return jsonify({
        "success": True,
        "comments": [c.to_dict() for c in comments],
    }), 200


@comments_bp.route("/<int:ticket_id>/comments", methods=["POST"])
@active_user_required
def add_comment(ticket_id: int):
    """Add a public comment or internal note to a ticket."""
    user = get_current_user()
    ticket = Ticket.query.get(ticket_id)

    if not ticket:
        return jsonify({"success": False, "error": {"code": 404, "message": "Ticket not found."}}), 404

    # Authorization
    if user.role == User.ROLE_EMPLOYEE and ticket.created_by != user.id:
        return jsonify({"success": False, "error": {"code": 403, "message": "Access denied."}}), 403

    data = request.get_json() or {}
    message = data.get("message", "").strip()
    is_internal = bool(data.get("is_internal", False))

    if not message:
        return jsonify({"success": False, "error": {"code": 400, "message": "Comment message is required."}}), 400

    # Employees can NEVER post internal notes
    if user.role == User.ROLE_EMPLOYEE:
        is_internal = False

    comment = Comment(
        ticket_id=ticket.id,
        user_id=user.id,
        message=message,
        is_internal=is_internal,
    )

    db.session.add(comment)

    # Notifications
    if not is_internal:
        # Public comment: notify opposite party
        if user.id == ticket.created_by:
            # Employee commented: notify assignee if present
            if ticket.assigned_to:
                send_notification(
                    user_id=ticket.assigned_to,
                    ticket_id=ticket.id,
                    message=f"New comment from {user.full_name} on Ticket {ticket.ticket_number}.",
                )
        else:
            # Agent or Admin commented: notify employee creator
            send_notification(
                user_id=ticket.created_by,
                ticket_id=ticket.id,
                message=f"New update from support on Ticket {ticket.ticket_number}.",
            )
    else:
        # Internal note: notify assignee or admin, NEVER employee
        if ticket.assigned_to and ticket.assigned_to != user.id:
            send_notification(
                user_id=ticket.assigned_to,
                ticket_id=ticket.id,
                message=f"Internal note added by {user.full_name} on Ticket {ticket.ticket_number}.",
            )

    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Comment added successfully.",
        "comment": comment.to_dict(),
    }), 201
