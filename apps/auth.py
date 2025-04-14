from flask_login import UserMixin, current_user, login_required
from functools import lru_cache, wraps
from flask import redirect, url_for, session, flash, request
from .models.student import Student
from .extensions import db, student_login_manager, admin_login_manager

class StudentUser(UserMixin):
    """学生ユーザークラス"""
    def __init__(self, student):
        self.student = student
        self.user_type = 'student'
        
    def get_id(self):
        return str(self.student.student_id)

class AdminUser(UserMixin):
    """管理者ユーザークラス"""
    def __init__(self, admin):
        self.admin = admin
        self.user_type = 'admin'

@lru_cache(maxsize=None)
def _load_student_cached(user_id):
    """学生データをキャッシュ付きで読み込む"""
    if not user_id:
        return None
    try:
        student = Student.query.get(user_id)
        if student:
            return StudentUser(student)
    except Exception as e:
        print(f"Error loading student: {e}")
    return None

@student_login_manager.user_loader
def load_student(user_id):
    """学生のユーザーローダー"""
    return _load_student_cached(user_id)

@admin_login_manager.user_loader
def load_admin(user_id):
    """管理者ユーザーをロードする"""
    from .models import Admin
    admin = Admin.query.get(user_id)
    if admin:
        return AdminUser(admin)
    return None

def init_auth(app):
    """認証機能の初期化"""
    # 学生用ログインマネージャーをデフォルトとして設定
    student_login_manager.init_app(app)
    student_login_manager.login_view = 'student.auth.login'
    student_login_manager.login_message = 'このページにアクセスするにはログインが必要です。'

# 学生ログイン要求デコレータを追加
def student_login_required(f):
    """学生ユーザーのログインを要求するデコレータ"""
    @wraps(f)
    @login_required  # まず一般的なログイン確認
    def decorated_function(*args, **kwargs):
        # ユーザーが学生かどうかを確認
        if not hasattr(current_user, 'user_type') or current_user.user_type != 'student':
            flash('この機能には学生としてのログインが必要です', 'warning')
            return redirect(url_for('student_register.login', next=request.url))
        return f(*args, **kwargs)
    return decorated_function