from app.extensions import db
from app.models.notification import Notification


def send_notification(user_id: int, ticket_id: int | None, message: str) -> Notification | None:
    """Create an in-app notification if a duplicate unread one does not already exist."""
    if not user_id or not message:
        return None

    # Check for recent duplicate unread notification
    existing = Notification.query.filter_by(
        user_id=user_id,
        ticket_id=ticket_id,
        message=message,
        is_read=False,
    ).first()

    if existing:
        return existing

    notification = Notification(
        user_id=user_id,
        ticket_id=ticket_id,
        message=message,
        is_read=False,
    )
    db.session.add(notification)
    return notification
