import os
from pathlib import Path
from flask import Flask, jsonify
from app.config import config_by_name
from app.extensions import db, migrate, jwt, cors, limiter
from app.errors.handlers import register_error_handlers
from app.routes import register_blueprints


def create_app(config_name: str | None = None) -> Flask:
    """Application factory for Flask Help Desk API."""
    if config_name is None:
        config_name = os.getenv("FLASK_ENV", "development")

    app = Flask(__name__)
    app.config.from_object(config_by_name.get(config_name, config_by_name["development"]))

    # Ensure upload directory exists
    upload_path = Path(app.config["UPLOAD_FOLDER"])
    upload_path.mkdir(parents=True, exist_ok=True)

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    cors.init_app(app, origins=app.config.get("CORS_ORIGIN", "*"), supports_credentials=True)
    limiter.init_app(app)

    # Register error handlers
    register_error_handlers(app)

    # Register API blueprints
    register_blueprints(app)

    # Health check route
    @app.route("/api/v1/health", methods=["GET"])
    def health_check():
        return jsonify({
            "status": "healthy",
            "service": "Help Desk Ticket Management API",
            "version": "1.0.0",
        }), 200

    return app
