"""一般ユーザーモジュール"""

from flask import Blueprint

# メインのBlueprintを作成
bp = Blueprint('public', __name__, url_prefix='/public')

from .views import auth

# 各ビューモジュールをインポート
from .views.home import bp as home_bp

# サブBlueprintを登録
bp.register_blueprint(auth.auth_bp)
bp.register_blueprint(home_bp)

def init_app(app):
    app.register_blueprint(bp)

__all__ = ['bp'] 