from apps.extensions import db
from datetime import datetime

class CourseMaster(db.Model):
    """コースマスタモデル"""
    __tablename__ = 'course_master'
    __table_args__ = {'extend_existing': True}

    course_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    course_code = db.Column(db.String(2), unique=True, nullable=False)
    course_name = db.Column(db.String(100), nullable=False)
    course_type = db.Column(db.String(10))
    part_time_type = db.Column(db.String(10))

    # リレーションシップ
    specializations = db.relationship('SpecializationMaster', back_populates='course')
    students = db.relationship('Student', back_populates='course')

    def __repr__(self):
        return f'<CourseMaster {self.course_code}: {self.course_name}>'

    def to_dict(self):
        return {
            'course_id': self.course_id,
            'course_code': self.course_code,
            'course_name': self.course_name,
            'course_type': self.course_type,
            'part_time_type': self.part_time_type
        }

class SpecializationMaster(db.Model):
    """専攻マスタモデル"""
    __tablename__ = 'specialization_master'
    __table_args__ = {'extend_existing': True}

    specialization_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    specialization_code = db.Column(db.String(2), nullable=False)
    specialization_name = db.Column(db.String(100), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey('course_master.course_id'), nullable=False)
    grade = db.Column(db.Integer, nullable=False)
    previous_specialization_id = db.Column(
        db.Integer, 
        db.ForeignKey('specialization_master.specialization_id'), 
        nullable=True
    )

    # リレーションシップ
    course = db.relationship('CourseMaster', back_populates='specializations')
    students = db.relationship('Student', back_populates='specialization')
    previous_specialization = db.relationship(
        'SpecializationMaster',
        remote_side=[specialization_id],
        backref='next_specializations'
    )

    def __repr__(self):
        return f'<SpecializationMaster {self.specialization_code}: {self.specialization_name}>'

    def to_dict(self):
        return {
            'specialization_id': self.specialization_id,
            'specialization_code': self.specialization_code,
            'specialization_name': self.specialization_name,
            'course_id': self.course_id,
            'grade': self.grade,
            'previous_specialization_id': self.previous_specialization_id
        }