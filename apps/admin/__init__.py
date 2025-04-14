"""管理者モジュール"""

from flask import Blueprint

bp = Blueprint('admin', __name__, url_prefix='/admin')

from .views import auth

bp.register_blueprint(auth.auth_bp)

def init_app(app):
    app.register_blueprint(bp)

__all__ = ['bp']
