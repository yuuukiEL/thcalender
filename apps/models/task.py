"""タスクモデル"""
from apps.extensions import db
from apps.models.base import BaseModel

class Task(BaseModel):
    """タスクモデル"""
    __tablename__ = 'tasks'

    task_id = db.Column(db.Integer, primary_key=True, autoincrement=True, comment='タスクID')
    student_id = db.Column(db.String(5), db.ForeignKey('students.student_id'), nullable=False, comment='学生ID')
    content = db.Column(db.Text, nullable=False, comment='内容')
    is_completed = db.Column(db.Boolean, nullable=False, default=False, comment='完了フラグ')
    created_at = db.Column(db.DateTime, nullable=False, server_default=db.func.current_timestamp(), comment='作成日時')
    updated_at = db.Column(db.DateTime, nullable=False, server_default=db.func.current_timestamp(), 
                          onupdate=db.func.current_timestamp(), comment='更新日時')

    # リレーションシップ
    student = db.relationship('Student', backref=db.backref('tasks', lazy=True))