from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from app.extensions import db


class User(db.Model):
    """User account model for Employees, Agents, and Administrators."""
    __tablename__ = "users"

    ROLE_EMPLOYEE = "employee"
    ROLE_AGENT = "agent"
    ROLE_ADMIN = "admin"
    ROLES = [ROLE_EMPLOYEE, ROLE_AGENT, ROLE_ADMIN]

    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default=ROLE_EMPLOYEE)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relationships
    created_tickets = db.relationship(
        "Ticket",
        foreign_keys="Ticket.created_by",
        backref=db.backref("creator", lazy="joined"),
        lazy="dynamic",
    )
    assigned_tickets = db.relationship(
        "Ticket",
        foreign_keys="Ticket.assigned_to",
        backref=db.backref("assignee", lazy="joined"),
        lazy="dynamic",
    )
    comments = db.relationship("Comment", backref="author", lazy="dynamic")
    notifications = db.relationship(
        "Notification",
        backref="user",
        lazy="dynamic",
        cascade="all, delete-orphan",
    )

    def set_password(self, password: str):
        """Hash and set the user's password."""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        """Verify the user's password."""
        return check_password_hash(self.password_hash, password)

    def to_dict(self, include_email: bool = True) -> dict:
        """Convert user object to dictionary representation."""
        data = {
            "id": self.id,
            "full_name": self.full_name,
            "role": self.role,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_email:
            data["email"] = self.email
        return data

    def __repr__(self):
        return f"<User {self.email} ({self.role})>"
