"""個人スケジュールモデル"""
from apps.extensions import db
from .schedule_base import StudentBaseSchedule
from datetime import datetime

class StudentPersonalSchedule(StudentBaseSchedule):
    """学生の個人スケジュールモデル"""
    __tablename__ = 'student_personal_schedules'
    __table_args__ = {'extend_existing': True}

    schedule_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    student_id = db.Column(db.String(5), db.ForeignKey('students.student_id'), nullable=False)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=False)
    is_private = db.Column(db.Boolean, default=True)
    location = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, server_default=db.func.current_timestamp())
    updated_at = db.Column(db.DateTime, server_default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())

    # 個人スケジュール固有のリレーションシップ
    student = db.relationship(
        'apps.models.student.Student',
        backref=db.backref(
            'personal_schedules',
            lazy=True,
            cascade='all, delete-orphan',
            order_by='StudentPersonalSchedule.start_time'
        ),
        primaryjoin='StudentPersonalSchedule.student_id == Student.student_id'
    )

    def __repr__(self):
        return f'<StudentPersonalSchedule {self.schedule_id}: {self.title}>'

    def to_dict(self):
        return {
            'id': self.schedule_id,
            'student_id': self.student_id,
            'title': self.title,
            'description': self.description,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'is_private': self.is_private,
            'location': self.location,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }