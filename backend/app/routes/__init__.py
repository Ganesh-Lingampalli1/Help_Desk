from app.routes.auth import auth_bp
from app.routes.tickets import tickets_bp
from app.routes.comments import comments_bp
from app.routes.attachments import attachments_bp
from app.routes.notifications import notifications_bp
from app.routes.admin import admin_bp


def register_blueprints(app):
    """Register all API blueprints with the Flask application."""
    app.register_blueprint(auth_bp)
    app.register_blueprint(tickets_bp)
    app.register_blueprint(comments_bp)
    app.register_blueprint(attachments_bp)
    app.register_blueprint(notifications_bp)
    app.register_blueprint(admin_bp)
