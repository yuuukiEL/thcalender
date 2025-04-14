"""
アプリケーションのメインモジュール
アプリケーションの初期化と設定を行う
"""

from flask import Flask, render_template, redirect, url_for, session as flask_session, send_from_directory
from flask_migrate import Migrate
from .extensions import init_extensions, db, student_login_manager, admin_login_manager
from .models.course import CourseMaster, SpecializationMaster
from .models.student import Student
from .models import Teacher, PublicUser
from .auth import _load_student_cached  # キャッシュ付き関数をインポート
import os
from .config import config  # 相対インポートに修正
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_wtf.csrf import CSRFProtect, generate_csrf
import logging
import warnings
from sqlalchemy import exc as sa_exc
from datetime import datetime, timedelta
from flask_session import Session

# SQLAlchemyの警告を完全に無効化
warnings.filterwarnings('ignore', category=sa_exc.SAWarning)

# SQLAlchemyのロギングを完全に無効化
logging.getLogger('sqlalchemy').setLevel(logging.CRITICAL)
logging.getLogger('sqlalchemy.engine').setLevel(logging.CRITICAL)
logging.getLogger('sqlalchemy.pool').setLevel(logging.CRITICAL)
logging.getLogger('sqlalchemy.orm').setLevel(logging.CRITICAL)
logging.getLogger('sqlalchemy.dialects').setLevel(logging.CRITICAL)

# 拡張機能の初期化
db = SQLAlchemy()
migrate = Migrate()
csrf = CSRFProtect()

# ログイン管理の設定
student_login_manager = LoginManager()
student_login_manager.login_view = 'student.auth.login'
student_login_manager.login_message = 'このページにアクセスするにはログインが必要です。'

teacher_login_manager = LoginManager()
teacher_login_manager.login_view = 'teacher.auth.login'
teacher_login_manager.login_message = 'このページにアクセスするにはログインが必要です。'

# 開発環境ではOAuthの安全でないリダイレクトを許可
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'  # 開発環境のみ

# セッションの初期化
flask_server_session = Session()

def create_app(config_name='default'):
    """アプリケーションファクトリ"""
    app = Flask(__name__)
    
    # 設定の読み込み
    app.config.from_object(config[config_name])
    config[config_name].init_app(app)
    
    # SQLAlchemyのエコーを無効化
    app.config['SQLALCHEMY_ECHO'] = False
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
        'echo': False,
        'echo_pool': False
    }
    
    # アップロードディレクトリの作成
    upload_dir = app.config['UPLOAD_FOLDER']
    profile_dir = os.path.join(upload_dir, app.config['PROFILE_IMAGE_PATH'])
    
    # 必要なディレクトリを作成
    os.makedirs(upload_dir, exist_ok=True)
    os.makedirs(profile_dir, exist_ok=True)
    
    # データベースの初期化
    db.init_app(app)
    migrate.init_app(app, db)
    
    # テーブルが存在しない場合は作成
    with app.app_context():
        from sqlalchemy import inspect
        inspector = inspect(db.engine)
        if 'oauth_states' not in inspector.get_table_names():
            from apps.models.oauth_state import OAuthState
            OAuthState.__table__.create(db.engine, checkfirst=True)
    
    # 拡張機能の初期化
    init_extensions(app)
    
    # 認証機能の初期化
    from .auth import init_auth
    init_auth(app)
    
    # 各モジュールを初期化
    from .student import init_student
    init_student(app)
    
    # Blueprintの登録
    from .common import bp as common_bp
    from .admin import bp as admin_bp
    
    app.register_blueprint(common_bp)
    app.register_blueprint(admin_bp, url_prefix='/admin')
    
    # schedule_view_bpの登録を削除
    # from apps.student.views.schedule_view import bp as schedule_view_bp
    # app.register_blueprint(schedule_view_bp)
    
    # 静的ファイルのパスを設定
    app.static_folder = 'static'  # または絶対パスを指定
    
    # アップロードディレクトリのルートを設定
    uploads_dir = os.path.join(app.root_path, '..', 'uploads')
    bulletin_dir = os.path.join(uploads_dir, 'bulletin')
    
    # ディレクトリを作成
    os.makedirs(uploads_dir, exist_ok=True)
    os.makedirs(bulletin_dir, exist_ok=True)
    
    # アップロードされたファイルを提供するルートを追加
    @app.route('/uploads/<path:filename>')
    def uploaded_file(filename):
        return send_from_directory(os.path.join(app.root_path, '..', 'uploads'), filename)
    
    @app.context_processor
    def inject_static_url():
        """テンプレートに静的ファイルのURLを注入"""
        return dict(
            static_url=app.static_url_path,
            bootstrap_css=url_for('static', filename='vendor/bootstrap/css/bootstrap.min.css'),
            bootstrap_js=url_for('static', filename='vendor/bootstrap/js/bootstrap.bundle.min.js')
        )
    
    @app.context_processor
    def inject_student():
        """学生情報をテンプレートに注入"""
        if 'student_id' in flask_session:
            student = Student.query.filter_by(student_id=flask_session.get('student_id')).first()
            return dict(student=student)
        return dict(student=None)
    
    @app.context_processor
    def inject_csrf_token():
        return dict(csrf_token=generate_csrf)
    
    # ルートURLのハンドラ
    @app.route('/')
    def index():
        return redirect(url_for('common.home'))
    
    # エラーハンドラーを登録
    @app.errorhandler(404)
    def page_not_found(e):
        """404エラーハンドラ"""
        return render_template('errors/404.html'), 404
        
    @app.errorhandler(500)
    def internal_server_error(e):
        """500エラーハンドラ"""
        return render_template('errors/500.html'), 500
        
    @app.after_request
    def after_request(response):
        """リクエスト後の処理"""
        # キャッシュをクリア
        _load_student_cached.cache_clear()  # 正しい関数名を使用
        return response
    
    # カスタムフィルターを追加
    @app.template_filter('date')
    def date_filter(value):
        if value is None:
            return '未設定'
        if isinstance(value, str):
            try:
                value = datetime.strptime(value, '%Y-%m-%d %H:%M:%S')
            except ValueError:
                return value
        return value.strftime('%Y年%m月%d日')
    
    # セッション設定を明示的に設定
    app.config['SESSION_TYPE'] = 'filesystem'
    app.config['SESSION_PERMANENT'] = True
    app.config['SESSION_USE_SIGNER'] = True
    app.config['SESSION_KEY_PREFIX'] = 'student_session:'
    app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=1)
    
    # セッションの初期化（アプリケーション作成後に行う）
    flask_server_session.init_app(app)
    
    return app