from flask import Flask, jsonify

from app_core.config import get_config
from app_core.routes.admin import admin_bp
from app_core.routes.main import main_bp
from app_core.storage import init_storage


def create_app():
    config = get_config()
    app = Flask(__name__, template_folder="../templates", static_folder="../static")
    app.config.from_object(config)

    init_storage()

    app.register_blueprint(main_bp)
    app.register_blueprint(admin_bp)

    @app.errorhandler(404)
    def not_found(_error):
        return jsonify({"success": False, "message": "Sayfa bulunamadi"}), 404

    @app.errorhandler(500)
    def server_error(_error):
        return jsonify({"success": False, "message": "Sunucu hatasi"}), 500

    return app
