from apps.extensions import db
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin

class Admin(UserMixin, db.Model):
    """管理者モデル"""
    __tablename__ = 'admins'

    id = db.Column(db.Integer, primary_key=True)
    admin_id = db.Column(db.String(20), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    is_active = db.Column(db.Boolean, default=True)

    def set_password(self, password):
        """パスワードをハッシュ化して設定"""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """パスワードをチェック"""
        return check_password_hash(self.password_hash, password)

    def get_id(self):
        """Flask-Loginで使用するID"""
        return str(self.id)

    def __repr__(self):
        return f'<Admin {self.admin_id}>' 