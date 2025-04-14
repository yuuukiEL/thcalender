from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin
from .extensions import db
from datetime import datetime

class Teacher(UserMixin, db.Model):
    """教員モデル"""
    __tablename__ = 'teachers'

    teacher_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(255), nullable=False)
    password = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), nullable=False, unique=True)
    profile_image_path = db.Column(db.String(255))
    comment = db.Column(db.String(255))
    is_admin = db.Column(db.Boolean, nullable=False, default=False)
    created_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp())
    updated_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp(),
                          onupdate=db.func.current_timestamp())

    def check_password(self, password):
        return check_password_hash(self.password, password)

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

class Task(db.Model):
    __tablename__ = 'tasks'
    
    task_id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.String(20), db.ForeignKey('students.student_id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    is_completed = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    student = db.relationship('Student', backref=db.backref('tasks', lazy=True))

class EmptyClassroom(db.Model):
    __tablename__ = 'empty_classrooms'
    
    empty_classroom_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    classroom_id = db.Column(db.String(50), db.ForeignKey('classrooms.classroom_id', ondelete='CASCADE'), nullable=False)
    date_info = db.Column(db.Date, nullable=False)
    period = db.Column(db.Enum('1', '2', '3', '4', '5', '6', '夜間'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now) 