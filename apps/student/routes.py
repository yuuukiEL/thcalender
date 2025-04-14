from flask import Blueprint
from .views import bulletin, diary

def init_app(app):
    """アプリケーションにルートを登録"""
    
    # 掲示板
    app.register_blueprint(bulletin.bp, url_prefix='/student/bulletin')
    
    # 報告の登録は削除（__init__.pyですでに登録されているため）
