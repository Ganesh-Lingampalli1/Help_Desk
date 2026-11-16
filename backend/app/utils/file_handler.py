import os
import uuid
from pathlib import Path
from flask import current_app
from werkzeug.utils import secure_filename

# Safe MIME types mapping
SAFE_MIME_TYPES = {
    "png": "image/png",
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "gif": "image/gif",
    "pdf": "application/pdf",
    "txt": "text/plain",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "zip": "application/zip",
}


def allowed_file(filename: str) -> bool:
    """Check if the uploaded file has an allowed extension."""
    if "." not in filename:
        return False
    ext = filename.rsplit(".", 1)[1].lower()
    allowed = current_app.config.get("ALLOWED_EXTENSIONS", set())
    return ext in allowed


def save_uploaded_file(file_storage) -> tuple[str, str, str, int]:
    """
    Saves an uploaded file to the configured UPLOAD_FOLDER securely.
    Returns:
        (original_filename, stored_filename, content_type, file_size)
    """
    if not file_storage or not file_storage.filename:
        raise ValueError("No file provided.")

    original_filename = secure_filename(file_storage.filename)
    if not original_filename:
        raise ValueError("Invalid file name.")

    if not allowed_file(original_filename):
        allowed = ", ".join(sorted(current_app.config.get("ALLOWED_EXTENSIONS", [])))
        raise ValueError(f"File type not permitted. Allowed extensions: {allowed}")

    ext = original_filename.rsplit(".", 1)[1].lower()
    unique_prefix = uuid.uuid4().hex[:12]
    stored_filename = f"{unique_prefix}_{original_filename}"

    upload_dir = Path(current_app.config["UPLOAD_FOLDER"])
    upload_dir.mkdir(parents=True, exist_ok=True)

    dest_path = upload_dir / stored_filename

    # Read content to check size safely
    file_bytes = file_storage.read()
    file_size = len(file_bytes)

    max_size = current_app.config.get("MAX_CONTENT_LENGTH", 5 * 1024 * 1024)
    if file_size > max_size:
        raise ValueError(f"File exceeds maximum allowed size ({max_size // (1024 * 1024)}MB).")

    with open(dest_path, "wb") as f:
        f.write(file_bytes)

    # Content type resolution
    content_type = (
        file_storage.content_type
        if file_storage.content_type and file_storage.content_type != "application/octet-stream"
        else SAFE_MIME_TYPES.get(ext, "application/octet-stream")
    )

    return original_filename, stored_filename, content_type, file_size


def get_file_path(stored_filename: str) -> Path | None:
    """Safely resolve the file path, preventing directory traversal."""
    upload_dir = Path(current_app.config["UPLOAD_FOLDER"]).resolve()
    target_path = (upload_dir / stored_filename).resolve()

    if not str(target_path).startswith(str(upload_dir)):
        return None
    if not target_path.exists():
        return None
    return target_path
