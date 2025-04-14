from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager

# データベース
db = SQLAlchemy()

# ログイン管理
student_login_manager = LoginManager()
admin_login_manager = LoginManager()


def init_extensions(app):
    """アプリケーションの拡張機能を初期化"""
    # データベース設定
    app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:Tomodachi1!@localhost/calender2?charset=utf8mb4'
    
    db.init_app(app)

    # 学生用ログイン設定
    student_login_manager.init_app(app)
    student_login_manager.login_view = 'student.auth.login'
    student_login_manager.login_message = 'このページにアクセスするにはログインが必要です。'
    student_login_manager.session_protection = "strong"

    # 管理者用ログイン設定
    admin_login_manager.init_app(app)
    admin_login_manager.login_view = 'admin.auth.login'
    admin_login_manager.login_message = 'このページにアクセスするにはログインが必要です。' 