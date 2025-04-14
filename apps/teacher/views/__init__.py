"""教員ビューモジュール"""

from flask import Blueprint
from . import auth
from . import dashboard

# メインのBlueprintを作成
bp = Blueprint('teacher', __name__)

# Blueprintの登録
bp.register_blueprint(auth.bp, url_prefix='/auth')
bp.register_blueprint(dashboard.bp, url_prefix='/dashboard')

__all__ = ['auth', 'dashboard'] 