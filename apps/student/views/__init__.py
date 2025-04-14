"""学生ビューモジュール"""

from flask import Blueprint, redirect, url_for
from . import register
from . import diary  # diaryモジュールをインポート
from .bulletin import bp as bulletin_bp
from . import classroom
from . import home
from . import auth  # APIモジュール
from . import course
from .tasks import tasks
from .schedule import schedule as schedule_bp
from . import report
from .schedule_utils import bp as schedule_utils_bp
from .schedule_view import bp as schedule_view_bp
from .api_connections import api_connections_bp
from apps.student.views import ascii_art

# メインのBlueprintを作成
student = Blueprint('student', __name__)

def init_student_views(app):
    """学生ビューの初期化"""
    # メインのBlueprintを登録
    app.register_blueprint(student, url_prefix='/student')
    # 各機能のBlueprintを登録（名前空間を student.* に統一）
    app.register_blueprint(register.bp, url_prefix='/student/auth', name='student.auth')
    app.register_blueprint(home.bp, url_prefix='/student', name='student.home')
    app.register_blueprint(diary.bp, url_prefix='/student/diary', name='student.diary')
    app.register_blueprint(bulletin_bp, url_prefix='/student/bulletin', name='student.bulletin')
    app.register_blueprint(classroom.bp, url_prefix='/student/classroom', name='student.classroom')
    app.register_blueprint(course.bp, url_prefix='/student/api')
    app.register_blueprint(auth.bp, url_prefix='/student/api')
    app.register_blueprint(tasks, url_prefix='/student/tasks')
    app.register_blueprint(schedule_bp, url_prefix='/student')
    app.register_blueprint(report.bp, url_prefix='/student/report', name='student.report')
    app.register_blueprint(schedule_utils_bp, url_prefix='/student')
    app.register_blueprint(schedule_view_bp)  # url_prefixは既に設定済み
    app.register_blueprint(api_connections_bp, url_prefix='/student/api', name='student_api_connections')
    app.register_blueprint(ascii_art.bp, url_prefix='/student/ascii')

    # 各モジュールのルート登録
    from ..routes import init_app
    init_app(app)

    # 学生確認ページへのリダイレクト
    @app.route('/student/register')
    def student_register_redirect():
        return redirect(url_for('student.auth.verify'))

__all__ = [
    'register',
    'diary',
    'bulletin',
    'classroom',
    'home',
] 