from datetime import datetime
from app.extensions import db


class Attachment(db.Model):
    """File attachment associated with a ticket."""
    __tablename__ = "attachments"

    id = db.Column(db.Integer, primary_key=True)
    ticket_id = db.Column(db.Integer, db.ForeignKey("tickets.id"), nullable=False, index=True)
    uploaded_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    original_filename = db.Column(db.String(255), nullable=False)
    stored_filename = db.Column(db.String(255), nullable=False)
    content_type = db.Column(db.String(100), nullable=False)
    file_size = db.Column(db.Integer, nullable=False)  # Size in bytes
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    uploader = db.relationship("User", foreign_keys=[uploaded_by], lazy="joined")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "ticket_id": self.ticket_id,
            "uploaded_by": self.uploaded_by,
            "uploader_name": self.uploader.full_name if self.uploader else "Unknown",
            "original_filename": self.original_filename,
            "content_type": self.content_type,
            "file_size": self.file_size,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "download_url": f"/api/v1/tickets/{self.ticket_id}/attachments/{self.id}/download",
        }

    def __repr__(self):
        return f"<Attachment #{self.id} for Ticket #{self.ticket_id}: {self.original_filename}>"
