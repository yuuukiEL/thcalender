from apps import db
from datetime import datetime

class StudentContact(db.Model):
    """学生の連絡先情報モデル"""
    __tablename__ = 'student_contacts'
    
    student_id = db.Column(db.String(5), db.ForeignKey('students.student_id', ondelete='CASCADE'), primary_key=True)
    phone = db.Column(db.String(20), nullable=True)
    emergency_contact = db.Column(db.String(255), nullable=True)
    emergency_phone = db.Column(db.String(20), nullable=True)
    address = db.Column(db.String(255), nullable=True)
    postal_code = db.Column(db.String(8), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    
    # リレーションシップを一時的に削除
    # student = db.relationship(Student, foreign_keys=[student_id]) 