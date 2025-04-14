from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from ..extensions import db

class Teacher(UserMixin, db.Model):
    """教員モデル"""
    __tablename__ = 'teachers'
    __table_args__ = {'extend_existing': True}

    teacher_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), nullable=False, unique=True)
    password = db.Column(db.String(255), nullable=False)
    profile_image_path = db.Column(db.String(255))
    comment = db.Column(db.String(255))
    is_admin = db.Column(db.Boolean, nullable=False, default=False)
    created_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp())
    updated_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp(),
                          onupdate=db.func.current_timestamp())

    # クラス担任の関係を定義（後で追加）
    # classes = db.relationship('Class', backref='homeroom_teacher', lazy=True)

    # リレーションシップ
    schedules = db.relationship(
        'apps.models.schedule.StudentSchedule',
        back_populates='teacher',
        overlaps="personal_schedules"
    )
    
    created_announcements = db.relationship(
        'apps.models.announcement.Announcement',
        back_populates='created_teacher',
        foreign_keys='apps.models.announcement.Announcement.created_by',
        cascade='all, delete-orphan',
        overlaps="announcements,teacher"  # 重複警告を抑制
    )

    def set_password(self, password):
        """パスワードをハッシュ化して設定"""
        self.password = generate_password_hash(password)

    def check_password(self, password):
        """パスワードをチェック"""
        return check_password_hash(self.password, password)

    def get_id(self):
        """Flask-Loginで使用するID"""
        return str(self.teacher_id)

    def __repr__(self):
        return f'<Teacher {self.name}>'

    def to_dict(self):
        return {
            'teacher_id': self.teacher_id,
            'name': self.name,
            'email': self.email,
            'profile_image_path': self.profile_image_path,
            'is_admin': self.is_admin,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        } 