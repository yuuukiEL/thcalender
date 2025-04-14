import os
from datetime import timedelta


class Config:
    """基本設定"""
    # 基本パス設定
    BASE_DIR = os.path.dirname(os.path.dirname(__file__))
    ASSETS_ROOT = os.environ.get('ASSETS_ROOT') or os.path.join(BASE_DIR, 'apps')
    
    # アップロード関連の設定
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')  # 修正: uploadsディレクトリを直下に
    PROFILE_IMAGE_PATH = os.path.join('profiles', 'students')  # 相対パスとして定義
    
    # アップロードされる拡張子の制限
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
    
    # アップロードファイルの最大サイズ
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB

    @staticmethod
    def init_app(app):
        """アプリケーションの初期化"""
        os.environ['SQLALCHEMY_ECHO'] = 'False'  # ✅ 環境変数でも設定

    # アプリケーション設定
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'your-secret-key-here'
    SESSION_TYPE = 'filesystem'  # または 'redis', 'memcached' など
    SESSION_PERMANENT = True
    PERMANENT_SESSION_LIFETIME = timedelta(hours=1)  # セッションの有効期限を延長

    # テンプレート設定
    TEMPLATE_PATHS = {
        'common': os.path.join(ASSETS_ROOT, 'templates', 'common'),
        'student': os.path.join(ASSETS_ROOT, 'templates', 'student'),
        'admin': os.path.join(ASSETS_ROOT, 'templates', 'admin'),
        'public': os.path.join(ASSETS_ROOT, 'templates', 'public')
    }

    # 静的ファイル設定
    STATIC_PATHS = {
        'student': os.path.join(ASSETS_ROOT, 'static', 'student'),
        'admin': os.path.join(ASSETS_ROOT, 'static', 'admin'),
        'public': os.path.join(ASSETS_ROOT, 'static', 'public'),
        'common': os.path.join(ASSETS_ROOT, 'static', 'common')
    }
    
    # 静的ファイルのURL設定
    STATIC_URL = '/static/'
    MEDIA_URL = '/media/'
    
# データベース設定
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'mysql+pymysql://root:Tomodachi1!@localhost/calender2'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = False  # ✅ クエリログを無効化

    
    # SQLAlchemy設定
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_size': 10,
        'pool_recycle': 3600,
        'pool_pre_ping': True,
        'pool_timeout': 60,
        'echo': True if os.environ.get('FLASK_DEBUG') else False
    } 

class DevelopmentConfig(Config):
    """開発環境設定"""
    DEBUG = True

class ProductionConfig(Config):
    """本番環境設定"""
    DEBUG = False

class TestingConfig(Config):
    """テスト環境設定"""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'mysql+pymysql://root:Tomodachi1!@localhost/calender2_test'

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
} 