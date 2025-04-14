from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin
from ..extensions import db

class PublicUser(UserMixin, db.Model):
    """一般ユーザーモデル"""
    __tablename__ = 'public_users'

    user_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    profile_image_path = db.Column(db.String(255))
    status = db.Column(db.Enum('active', 'suspended', 'deleted'), 
                      nullable=False, default='active')
    created_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp())
    updated_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp(),
                          onupdate=db.func.current_timestamp())

    def get_id(self):
        return str(self.user_id)

    def set_password(self, password):
        self.password = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password, password) 