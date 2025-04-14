"""タスクモデル"""
from apps.extensions import db
from apps.models.base import BaseModel
from datetime import datetime

class Task(BaseModel):
    """タスクモデル"""
    __tablename__ = 'tasks'
    __table_args__ = {'extend_existing': True}

    task_id = db.Column(db.Integer, primary_key=True, autoincrement=True, comment='タスクID')
    student_id = db.Column(db.String(5), db.ForeignKey('students.student_id'), nullable=False, comment='学生ID')
    content = db.Column(db.Text, nullable=False, comment='内容')
    is_completed = db.Column(db.Boolean, default=False, comment='完了フラグ')
    created_at = db.Column(db.DateTime, server_default=db.func.current_timestamp(), comment='作成日時')
    updated_at = db.Column(db.DateTime, server_default=db.func.current_timestamp(), 
                          onupdate=db.func.current_timestamp(), comment='更新日時')

    # リレーションシップ
    student = db.relationship(
        'Student',
        backref=db.backref('task_list', lazy=True),
        lazy=True
    )

    def __repr__(self):
        return f'<Task {self.task_id}: {self.content}>'

    def to_dict(self):
        return {
            'task_id': self.task_id,
            'student_id': self.student_id,
            'content': self.content,
            'is_completed': self.is_completed,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'student_name': self.student.name if self.student else None
        } 