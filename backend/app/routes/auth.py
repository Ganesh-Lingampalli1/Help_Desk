import re
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required
from email_validator import validate_email, EmailNotValidError

from app.extensions import db, limiter
from app.models.user import User
from app.utils.decorators import get_current_user, active_user_required

auth_bp = Blueprint("auth", __name__, url_prefix="/api/v1/auth")


@auth_bp.route("/register", methods=["POST"])
@limiter.limit("10 per minute")
def register():
    """Register a new user account. Role is strictly forced to 'employee'."""
    data = request.get_json() or {}

    full_name = data.get("full_name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not full_name:
        return jsonify({"success": False, "error": {"code": 400, "message": "Full name is required."}}), 400

    if not email:
        return jsonify({"success": False, "error": {"code": 400, "message": "Email is required."}}), 400

    try:
        valid = validate_email(email, check_deliverability=False)
        email = valid.normalized
    except EmailNotValidError as e:
        return jsonify({"success": False, "error": {"code": 400, "message": f"Invalid email: {str(e)}"}}), 400

    if not password or len(password) < 6:
        return jsonify({
            "success": False,
            "error": {"code": 400, "message": "Password must be at least 6 characters long."}
        }), 400

    # Ensure email is unique
    if User.query.filter_by(email=email).first():
        return jsonify({
            "success": False,
            "error": {"code": 409, "message": "An account with this email address already exists."}
        }), 409

    # Public registration CANNOT grant agent or admin role
    user = User(
        full_name=full_name,
        email=email,
        role=User.ROLE_EMPLOYEE,
        is_active=True,
    )
    user.set_password(password)

    db.session.add(user)
    db.session.commit()

    # Generate JWT token
    access_token = create_access_token(identity=str(user.id))

    return jsonify({
        "success": True,
        "message": "Registration successful.",
        "token": access_token,
        "user": user.to_dict(),
    }), 201


@auth_bp.route("/login", methods=["POST"])
@limiter.limit("20 per minute")
def login():
    """Authenticate user with email and password, returning JWT access token."""
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({
            "success": False,
            "error": {"code": 400, "message": "Email and password are required."}
        }), 400

    user = User.query.filter_by(email=email).first()

    if not user or not user.check_password(password):
        return jsonify({
            "success": False,
            "error": {"code": 401, "message": "Invalid email or password."}
        }), 401

    if not user.is_active:
        return jsonify({
            "success": False,
            "error": {"code": 403, "message": "Account has been deactivated. Please contact an administrator."}
        }), 403

    access_token = create_access_token(identity=str(user.id))

    return jsonify({
        "success": True,
        "message": "Login successful.",
        "token": access_token,
        "user": user.to_dict(),
    }), 200


@auth_bp.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    """Client-side token invalidation confirmation."""
    return jsonify({
        "success": True,
        "message": "Logged out successfully.",
    }), 200


@auth_bp.route("/me", methods=["GET"])
@active_user_required
def get_current_profile():
    """Get profile of currently authenticated user."""
    user = get_current_user()
    return jsonify({
        "success": True,
        "user": user.to_dict(),
    }), 200


@auth_bp.route("/change-password", methods=["PATCH"])
@active_user_required
def change_password():
    """Change the password for the currently authenticated user."""
    user = get_current_user()
    data = request.get_json() or {}

    current_password = data.get("current_password", "")
    new_password = data.get("new_password", "")

    if not current_password or not new_password:
        return jsonify({
            "success": False,
            "error": {"code": 400, "message": "Current password and new password are required."}
        }), 400

    if not user.check_password(current_password):
        return jsonify({
            "success": False,
            "error": {"code": 400, "message": "Current password does not match."}
        }), 400

    if len(new_password) < 6:
        return jsonify({
            "success": False,
            "error": {"code": 400, "message": "New password must be at least 6 characters long."}
        }), 400

    user.set_password(new_password)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Password changed successfully.",
    }), 200
