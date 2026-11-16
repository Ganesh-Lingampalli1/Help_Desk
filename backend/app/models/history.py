from datetime import datetime
from app.extensions import db


class TicketHistory(db.Model):
    """Audit trail for ticket status transitions and key events."""
    __tablename__ = "ticket_history"

    id = db.Column(db.Integer, primary_key=True)
    ticket_id = db.Column(db.Integer, db.ForeignKey("tickets.id"), nullable=False, index=True)
    changed_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    old_status = db.Column(db.String(30), nullable=True)
    new_status = db.Column(db.String(30), nullable=False)
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    changer = db.relationship("User", foreign_keys=[changed_by], lazy="joined")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "ticket_id": self.ticket_id,
            "changed_by": self.changed_by,
            "changer_name": self.changer.full_name if self.changer else "System",
            "changer_role": self.changer.role if self.changer else "system",
            "old_status": self.old_status,
            "new_status": self.new_status,
            "description": self.description,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f"<TicketHistory Ticket #{self.ticket_id}: {self.old_status} -> {self.new_status}>"
