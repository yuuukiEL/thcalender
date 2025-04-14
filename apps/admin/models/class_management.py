from ...extensions import db
from datetime import datetime

class Class(db.Model):
    __tablename__ = 'classes'

    class_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    department_letters = db.Column(db.String(10), nullable=False)
    department_number = db.Column(db.String(10), nullable=False)
    class_letter = db.Column(db.String(1), nullable=False)
    teacher_id = db.Column(db.Integer, db.ForeignKey('teachers.teacher_id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # リレーションシップ
    teacher = db.relationship('Teacher', backref=db.backref('classes', lazy=True))
    students = db.relationship('Student', backref='class', lazy=True)

    def __repr__(self):
        return f'<Class {self.department_letters}{self.department_number}{self.class_letter}>'

    def to_dict(self):
        return {
            'class_id': self.class_id,
            'department_letters': self.department_letters,
            'department_number': self.department_number,
            'class_letter': self.class_letter,
            'teacher_id': self.teacher_id,
            'teacher_name': self.teacher.name if self.teacher else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        } 