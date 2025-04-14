"""スケジュール基底モデル"""
from apps.extensions import db
from apps.models.base import BaseModel
from sqlalchemy.orm import declared_attr

class StudentBaseSchedule(BaseModel):
    """スケジュール基底クラス"""
    __abstract__ = True  # 抽象基底クラスとして定義

    @declared_attr
    def student_id(cls):
        return db.Column(db.String(5), db.ForeignKey('students.student_id'), nullable=False)

    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=False)

    @declared_attr
    def student(cls):
        return db.relationship('Student', backref=db.backref('schedules', lazy=True))