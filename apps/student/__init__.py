"""学生関連のモジュール"""
from flask import Blueprint
from .views import init_student_views
from .views.home import bp as home_bp
from .views.register import bp as register_bp
from .views.auth import bp as auth_bp
from .views.api_connections import api_connections_bp
from .views.review import review_bp

# モデルを先にインポート
from apps.models import Student, CourseMaster, SpecializationMaster
from apps.student.models.student_review import StudentReview
from apps import db

def init_student(app):
    """学生機能の初期化"""
    # ビューの初期化
    init_student_views(app)
    
    # 追加のブループリントを登録
    # app.register_blueprint(api_connections_bp)  # この行をコメントアウトまたは削除
    app.register_blueprint(review_bp)

# アプリケーション初期化時に必要なものを公開
__all__ = ['init_student', 'StudentReview']