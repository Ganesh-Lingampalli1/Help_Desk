from flask import Blueprint, request, jsonify, send_file
from app.extensions import db
from app.models.ticket import Ticket
from app.models.user import User
from app.models.attachment import Attachment
from app.utils.file_handler import save_uploaded_file, get_file_path
from app.utils.decorators import get_current_user, active_user_required

attachments_bp = Blueprint("attachments", __name__, url_prefix="/api/v1/tickets")


@attachments_bp.route("/<int:ticket_id>/attachments", methods=["POST"])
@active_user_required
def upload_attachment(ticket_id: int):
    """Upload a file attachment to a ticket."""
    user = get_current_user()
    ticket = Ticket.query.get(ticket_id)

    if not ticket:
        return jsonify({"success": False, "error": {"code": 404, "message": "Ticket not found."}}), 404

    # Access control
    if user.role == User.ROLE_EMPLOYEE and ticket.created_by != user.id:
        return jsonify({"success": False, "error": {"code": 403, "message": "Access denied."}}), 403

    if "file" not in request.files:
        return jsonify({"success": False, "error": {"code": 400, "message": "No file part in request."}}), 400

    file_obj = request.files["file"]
    if not file_obj or not file_obj.filename:
        return jsonify({"success": False, "error": {"code": 400, "message": "No file selected."}}), 400

    try:
        orig_name, stored_name, content_type, file_size = save_uploaded_file(file_obj)
    except ValueError as e:
        return jsonify({"success": False, "error": {"code": 400, "message": str(e)}}), 400

    attachment = Attachment(
        ticket_id=ticket.id,
        uploaded_by=user.id,
        original_filename=orig_name,
        stored_filename=stored_name,
        content_type=content_type,
        file_size=file_size,
    )

    db.session.add(attachment)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "File uploaded successfully.",
        "attachment": attachment.to_dict(),
    }), 201


@attachments_bp.route("/<int:ticket_id>/attachments/<int:attachment_id>/download", methods=["GET"])
@active_user_required
def download_attachment(ticket_id: int, attachment_id: int):
    """Safely stream/download a file attachment."""
    user = get_current_user()
    ticket = Ticket.query.get(ticket_id)

    if not ticket:
        return jsonify({"success": False, "error": {"code": 404, "message": "Ticket not found."}}), 404

    if user.role == User.ROLE_EMPLOYEE and ticket.created_by != user.id:
        return jsonify({"success": False, "error": {"code": 403, "message": "Access denied."}}), 403

    attachment = Attachment.query.filter_by(id=attachment_id, ticket_id=ticket.id).first()
    if not attachment:
        return jsonify({"success": False, "error": {"code": 404, "message": "Attachment not found."}}), 404

    file_path = get_file_path(attachment.stored_filename)
    if not file_path:
        return jsonify({"success": False, "error": {"code": 404, "message": "File not found on storage."}}), 404

    return send_file(
        file_path,
        mimetype=attachment.content_type,
        as_attachment=True,
        download_name=attachment.original_filename,
    )
