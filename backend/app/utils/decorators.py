from functools import wraps
from flask import jsonify, g
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from app.models.user import User


def get_current_user():
    """Retrieve the currently authenticated User model instance."""
    identity = get_jwt_identity()
    if not identity:
        return None

    try:
        user_id = int(identity)
    except (ValueError, TypeError):
        return None

    if hasattr(g, "current_user") and g.current_user is not None and g.current_user.id == user_id:
        return g.current_user

    user = User.query.get(user_id)
    if user and user.is_active:
        g.current_user = user
        return user
    return None


def role_required(*roles):
    """
    Decorator to enforce JWT authentication and role-based authorization.
    Verifies the user is authenticated, active, and possesses one of the allowed roles.
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            try:
                verify_jwt_in_request()
            except Exception as e:
                return jsonify({
                    "success": False,
                    "error": {
                        "code": 401,
                        "message": "Authentication required. Invalid or missing token.",
                    }
                }), 401

            user = get_current_user()
            if not user:
                return jsonify({
                    "success": False,
                    "error": {
                        "code": 401,
                        "message": "User not found or account has been deactivated.",
                    }
                }), 401

            if roles and user.role not in roles:
                return jsonify({
                    "success": False,
                    "error": {
                        "code": 403,
                        "message": f"Access denied. Requires one of roles: {', '.join(roles)}.",
                    }
                }), 403

            return fn(*args, **kwargs)
        return wrapper
    return decorator


def active_user_required(fn):
    """Decorator ensuring that any authenticated and active user can access the endpoint."""
    return role_required(User.ROLE_EMPLOYEE, User.ROLE_AGENT, User.ROLE_ADMIN)(fn)
