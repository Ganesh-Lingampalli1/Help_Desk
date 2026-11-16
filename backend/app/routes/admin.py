from flask import Blueprint, request, jsonify
from sqlalchemy import or_
from email_validator import validate_email, EmailNotValidError

from app.extensions import db
from app.models.user import User
from app.models.ticket import Ticket
from app.services.stats_service import get_dashboard_statistics, get_admin_analytics
from app.utils.decorators import get_current_user, role_required

admin_bp = Blueprint("admin", __name__, url_prefix="/api/v1/admin")


@admin_bp.route("/dashboard", methods=["GET"])
@role_required(User.ROLE_ADMIN)
def admin_dashboard():
    """Get system-wide overview statistics for administrator dashboard."""
    user = get_current_user()
    stats = get_dashboard_statistics(user)
    stats["total_users"] = User.query.count()
    stats["total_employees"] = User.query.filter_by(role=User.ROLE_EMPLOYEE).count()
    stats["total_agents"] = User.query.filter_by(role=User.ROLE_AGENT).count()
    stats["total_admins"] = User.query.filter_by(role=User.ROLE_ADMIN).count()

    return jsonify({"success": True, "stats": stats}), 200


@admin_bp.route("/analytics", methods=["GET"])
@role_required(User.ROLE_ADMIN)
def admin_analytics():
    """Get calculated analytics including SLA compliance, categories, priorities, and trends."""
    analytics_data = get_admin_analytics()
    return jsonify({"success": True, "analytics": analytics_data}), 200


@admin_bp.route("/users", methods=["GET"])
@role_required(User.ROLE_ADMIN)
def list_users():
    """List users with pagination, search, and filtering."""
    page = request.args.get("page", 1, type=int)
    per_page = min(request.args.get("per_page", 10, type=int), 100)
    search = request.args.get("search", "").strip()
    role = request.args.get("role", "").strip()
    status = request.args.get("status", "").strip()

    query = User.query

    if role and role in User.ROLES:
        query = query.filter(User.role == role)

    if status == "active":
        query = query.filter(User.is_active.is_(True))
    elif status == "inactive":
        query = query.filter(User.is_active.is_(False))

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                User.full_name.ilike(search_pattern),
                User.email.ilike(search_pattern),
            )
        )

    pagination = query.order_by(User.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )

    users_data = [u.to_dict(include_email=True) for u in pagination.items]

    return jsonify({
        "success": True,
        "users": users_data,
        "pagination": {
            "total": pagination.total,
            "pages": pagination.pages,
            "page": page,
            "per_page": per_page,
            "has_next": pagination.has_next,
            "has_prev": pagination.has_prev,
        },
    }), 200


@admin_bp.route("/users", methods=["POST"])
@role_required(User.ROLE_ADMIN)
def create_user():
    """Create a new user account with specified role."""
    data = request.get_json() or {}

    full_name = data.get("full_name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    role = data.get("role", User.ROLE_EMPLOYEE).strip()

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

    if role not in User.ROLES:
        return jsonify({
            "success": False,
            "error": {"code": 400, "message": f"Invalid role. Allowed: {', '.join(User.ROLES)}"}
        }), 400

    if User.query.filter_by(email=email).first():
        return jsonify({
            "success": False,
            "error": {"code": 409, "message": "User with this email already exists."}
        }), 409

    user = User(
        full_name=full_name,
        email=email,
        role=role,
        is_active=True,
    )
    user.set_password(password)

    db.session.add(user)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": f"User account created for {user.full_name} ({user.role}).",
        "user": user.to_dict(include_email=True),
    }), 201


@admin_bp.route("/users/<int:user_id>", methods=["PATCH"])
@role_required(User.ROLE_ADMIN)
def update_user(user_id: int):
    """Update user account details, role, or active status (soft-delete / deactivation)."""
    current_admin = get_current_user()
    user = User.query.get(user_id)

    if not user:
        return jsonify({"success": False, "error": {"code": 404, "message": "User not found."}}), 404

    data = request.get_json() or {}

    # Prevent admin from deactivating their own account
    if "is_active" in data:
        is_active = bool(data["is_active"])
        if user.id == current_admin.id and not is_active:
            return jsonify({
                "success": False,
                "error": {"code": 400, "message": "You cannot deactivate your own administrative account."}
            }), 400
        user.is_active = is_active

    if "role" in data:
        new_role = data["role"].strip()
        if new_role in User.ROLES:
            if user.id == current_admin.id and new_role != User.ROLE_ADMIN:
                return jsonify({
                    "success": False,
                    "error": {"code": 400, "message": "You cannot demote your own administrative role."}
                }), 400
            user.role = new_role

    if "full_name" in data:
        full_name = data["full_name"].strip()
        if full_name:
            user.full_name = full_name

    if "email" in data:
        new_email = data["email"].strip().lower()
        if new_email and new_email != user.email:
            try:
                valid = validate_email(new_email, check_deliverability=False)
                new_email = valid.normalized
            except EmailNotValidError as e:
                return jsonify({"success": False, "error": {"code": 400, "message": f"Invalid email: {str(e)}"}}), 400

            existing = User.query.filter_by(email=new_email).first()
            if existing and existing.id != user.id:
                return jsonify({
                    "success": False,
                    "error": {"code": 409, "message": "Another user already uses this email address."}
                }), 409
            user.email = new_email

    if "password" in data and data["password"]:
        pwd = data["password"]
        if len(pwd) < 6:
            return jsonify({
                "success": False,
                "error": {"code": 400, "message": "Password must be at least 6 characters long."}
            }), 400
        user.set_password(pwd)

    db.session.commit()

    return jsonify({
        "success": True,
        "message": f"User {user.full_name} updated successfully.",
        "user": user.to_dict(include_email=True),
    }), 200


@admin_bp.route("/agents", methods=["GET"])
@role_required(User.ROLE_AGENT, User.ROLE_ADMIN)
def list_assignable_agents():
    """List active agents and admins available for ticket assignments."""
    agents = User.query.filter(
        User.role.in_([User.ROLE_AGENT, User.ROLE_ADMIN]),
        User.is_active.is_(True),
    ).order_by(User.full_name.asc()).all()

    return jsonify({
        "success": True,
        "agents": [a.to_dict(include_email=True) for a in agents],
    }), 200
