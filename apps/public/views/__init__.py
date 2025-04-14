"""一般ユーザービューモジュール"""

from flask import Blueprint
from . import auth

# メインのBlueprintを作成
bp = Blueprint('public', __name__)

# サブBlueprintを登録
bp.register_blueprint(auth.auth_bp)

__all__ = ['bp'] 