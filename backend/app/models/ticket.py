from datetime import datetime
from app.extensions import db


class Ticket(db.Model):
    """Ticket model for issue tracking."""
    __tablename__ = "tickets"

    # Status Constants
    STATUS_OPEN = "Open"
    STATUS_ASSIGNED = "Assigned"
    STATUS_IN_PROGRESS = "In Progress"
    STATUS_PENDING = "Pending"
    STATUS_RESOLVED = "Resolved"
    STATUS_CLOSED = "Closed"

    STATUSES = [
        STATUS_OPEN,
        STATUS_ASSIGNED,
        STATUS_IN_PROGRESS,
        STATUS_PENDING,
        STATUS_RESOLVED,
        STATUS_CLOSED,
    ]

    # Priority Constants
    PRIORITY_LOW = "Low"
    PRIORITY_MEDIUM = "Medium"
    PRIORITY_HIGH = "High"
    PRIORITY_CRITICAL = "Critical"

    PRIORITIES = [
        PRIORITY_LOW,
        PRIORITY_MEDIUM,
        PRIORITY_HIGH,
        PRIORITY_CRITICAL,
    ]

    # Category Constants
    CATEGORY_HARDWARE = "Hardware"
    CATEGORY_SOFTWARE = "Software"
    CATEGORY_NETWORK = "Network"
    CATEGORY_ACCOUNT_ACCESS = "Account Access"
    CATEGORY_OTHER = "Other"

    CATEGORIES = [
        CATEGORY_HARDWARE,
        CATEGORY_SOFTWARE,
        CATEGORY_NETWORK,
        CATEGORY_ACCOUNT_ACCESS,
        CATEGORY_OTHER,
    ]

    id = db.Column(db.Integer, primary_key=True)
    ticket_number = db.Column(db.String(30), unique=True, nullable=False, index=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(50), nullable=False)
    priority = db.Column(db.String(20), nullable=False, default=PRIORITY_MEDIUM)
    status = db.Column(db.String(30), nullable=False, default=STATUS_OPEN, index=True)
    created_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    assigned_to = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True, index=True)
    resolution_notes = db.Column(db.Text, nullable=True)
    due_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )
    resolved_at = db.Column(db.DateTime, nullable=True)
    closed_at = db.Column(db.DateTime, nullable=True)

    # Relationships
    comments = db.relationship(
        "Comment",
        backref="ticket",
        cascade="all, delete-orphan",
        order_by="Comment.created_at.asc()",
        lazy="select",
    )
    history = db.relationship(
        "TicketHistory",
        backref="ticket",
        cascade="all, delete-orphan",
        order_by="TicketHistory.created_at.desc()",
        lazy="select",
    )
    attachments = db.relationship(
        "Attachment",
        backref="ticket",
        cascade="all, delete-orphan",
        order_by="Attachment.created_at.desc()",
        lazy="select",
    )

    @property
    def is_overdue(self) -> bool:
        """Check if ticket SLA deadline has breached."""
        if not self.due_at:
            return False
        if self.status in [self.STATUS_RESOLVED, self.STATUS_CLOSED]:
            return False
        return datetime.utcnow() > self.due_at

    def to_dict(self, include_details: bool = False, current_user_role: str = "employee") -> dict:
        """Convert ticket to dictionary, respecting role permissions for internal data."""
        data = {
            "id": self.id,
            "ticket_number": self.ticket_number,
            "title": self.title,
            "description": self.description,
            "category": self.category,
            "priority": self.priority,
            "status": self.status,
            "created_by": self.created_by,
            "creator": self.creator.to_dict() if self.creator else None,
            "assigned_to": self.assigned_to,
            "assignee": self.assignee.to_dict() if self.assignee else None,
            "resolution_notes": self.resolution_notes,
            "due_at": self.due_at.isoformat() if self.due_at else None,
            "is_overdue": self.is_overdue,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "resolved_at": self.resolved_at.isoformat() if self.resolved_at else None,
            "closed_at": self.closed_at.isoformat() if self.closed_at else None,
        }

        if include_details:
            # Filter internal comments for employees
            visible_comments = [
                c.to_dict()
                for c in self.comments
                if not c.is_internal or current_user_role in ["agent", "admin"]
            ]
            data["comments"] = visible_comments
            data["history"] = [h.to_dict() for h in self.history]
            data["attachments"] = [a.to_dict() for a in self.attachments]

        return data

    def __repr__(self):
        return f"<Ticket {self.ticket_number} - {self.status}>"
