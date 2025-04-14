"""管理者ビューモジュール"""

from flask import Blueprint
from . import auth

# メインのBlueprintを作成
bp = Blueprint('admin', __name__)

# サブBlueprintを登録
bp.register_blueprint(auth.bp, url_prefix='/auth')  # url_prefixを追加

__all__ = ['auth']