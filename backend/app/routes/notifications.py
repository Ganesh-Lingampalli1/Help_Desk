from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models.notification import Notification
from app.utils.decorators import get_current_user, active_user_required

notifications_bp = Blueprint("notifications", __name__, url_prefix="/api/v1/notifications")


@notifications_bp.route("", methods=["GET"])
@active_user_required
def get_notifications():
    """Retrieve notifications for the current user."""
    user = get_current_user()

    unread_only = request.args.get("unread", "false").lower() == "true"
    limit = min(request.args.get("limit", 20, type=int), 100)

    query = Notification.query.filter_by(user_id=user.id)
    if unread_only:
        query = query.filter_by(is_read=False)

    notifications = query.order_by(Notification.created_at.desc()).limit(limit).all()
    unread_count = Notification.query.filter_by(user_id=user.id, is_read=False).count()

    return jsonify({
        "success": True,
        "unread_count": unread_count,
        "notifications": [n.to_dict() for n in notifications],
    }), 200


@notifications_bp.route("/<int:notification_id>/read", methods=["PATCH"])
@active_user_required
def mark_read(notification_id: int):
    """Mark a single notification as read."""
    user = get_current_user()
    notification = Notification.query.filter_by(id=notification_id, user_id=user.id).first()

    if not notification:
        return jsonify({"success": False, "error": {"code": 404, "message": "Notification not found."}}), 404

    notification.is_read = True
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Notification marked as read.",
        "notification": notification.to_dict(),
    }), 200


@notifications_bp.route("/mark-all-read", methods=["POST"])
@active_user_required
def mark_all_read():
    """Mark all unread notifications for the user as read."""
    user = get_current_user()

    Notification.query.filter_by(user_id=user.id, is_read=False).update({"is_read": True})
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "All notifications marked as read.",
    }), 200
