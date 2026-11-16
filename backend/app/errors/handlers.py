from flask import jsonify
from werkzeug.exceptions import HTTPException


def register_error_handlers(app):
    """Register centralized JSON error handlers for the Flask app."""

    @app.errorhandler(400)
    def bad_request(error):
        description = getattr(error, "description", "Bad request.")
        return jsonify({
            "success": False,
            "error": {
                "code": 400,
                "message": description,
            }
        }), 400

    @app.errorhandler(401)
    def unauthorized(error):
        description = getattr(error, "description", "Unauthorized access. Please log in.")
        return jsonify({
            "success": False,
            "error": {
                "code": 401,
                "message": description,
            }
        }), 401

    @app.errorhandler(403)
    def forbidden(error):
        description = getattr(error, "description", "Forbidden. You do not have permission to perform this action.")
        return jsonify({
            "success": False,
            "error": {
                "code": 403,
                "message": description,
            }
        }), 403

    @app.errorhandler(404)
    def not_found(error):
        description = getattr(error, "description", "Requested resource was not found.")
        return jsonify({
            "success": False,
            "error": {
                "code": 404,
                "message": description,
            }
        }), 404

    @app.errorhandler(405)
    def method_not_allowed(error):
        return jsonify({
            "success": False,
            "error": {
                "code": 405,
                "message": "Method not allowed.",
            }
        }), 405

    @app.errorhandler(413)
    def request_entity_too_large(error):
        return jsonify({
            "success": False,
            "error": {
                "code": 413,
                "message": "File exceeds maximum upload size limit (5MB).",
            }
        }), 413

    @app.errorhandler(422)
    def unprocessable_entity(error):
        description = getattr(error, "description", "Unprocessable entity. Validation failed.")
        return jsonify({
            "success": False,
            "error": {
                "code": 422,
                "message": description,
            }
        }), 422

    @app.errorhandler(429)
    def ratelimit_handler(error):
        return jsonify({
            "success": False,
            "error": {
                "code": 429,
                "message": "Too many requests. Please slow down and try again later.",
            }
        }), 429

    @app.errorhandler(Exception)
    def handle_unexpected_error(error):
        if isinstance(error, HTTPException):
            return jsonify({
                "success": False,
                "error": {
                    "code": error.code,
                    "message": error.description,
                }
            }), error.code

        # In production, do not leak raw stack traces to client
        app.logger.exception(f"Unhandled server error: {error}")
        return jsonify({
            "success": False,
            "error": {
                "code": 500,
                "message": "An internal server error occurred.",
            }
        }), 500
