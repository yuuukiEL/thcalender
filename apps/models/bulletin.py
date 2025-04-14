from datetime import datetime
from apps.extensions import db
from apps.models.base import BaseModel
from sqlalchemy.ext.declarative import declared_attr

class BulletinBoard(BaseModel):
    """掲示板モデル（お知らせの承認/拒否管理）"""
    __tablename__ = 'bulletin_board'
    __table_args__ = {'extend_existing': True}

    bulletin_id = db.Column(db.Integer, primary_key=True, autoincrement=True, comment='掲示板ID')
    title = db.Column(db.String(255), nullable=False, comment='タイトル')
    content = db.Column(db.Text, nullable=False, comment='内容')
    image_path = db.Column(db.String(255), comment='画像パス')
    status = db.Column(db.String(20), nullable=False, comment='ステータス（pending, approved, rejected）')
    created_by = db.Column(db.String(5), db.ForeignKey('students.student_id'), nullable=False, comment='作成者（学生）ID')
    approved_by = db.Column(db.Integer, db.ForeignKey('teachers.teacher_id'), comment='承認者（教員）ID')
    approved_at = db.Column(db.DateTime, comment='承認/拒否日時')
    rejection_reason = db.Column(db.Text, comment='拒否理由')
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, comment='作成日時')
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow, comment='更新日時')

    # リレーションシップ
    student = db.relationship('Student', backref='bulletin_posts')
    teacher = db.relationship('Teacher', backref='approved_posts')

    def __repr__(self):
        return f'<BulletinBoard {self.bulletin_id}: {self.title}>'

    def to_dict(self):
        return {
            'bulletin_id': self.bulletin_id,
            'title': self.title,
            'content': self.content,
            'image_path': self.image_path,
            'status': self.status,
            'created_by': self.created_by,
            'approved_by': self.approved_by,
            'approved_at': self.approved_at.isoformat() if self.approved_at else None,
            'rejection_reason': self.rejection_reason,
            'created_at': self.created_at,
            'updated_at': self.updated_at,
            'student': self.student.to_dict() if self.student else None,
            'teacher': self.teacher.to_dict() if self.teacher else None
        }

class Announcement(BaseModel):
    """お知らせモデル"""
    __tablename__ = 'announcements'
    __table_args__ = {'extend_existing': True}

    announcement_id = db.Column(db.Integer, primary_key=True, autoincrement=True, comment='お知らせID（ユニーク）')
    title = db.Column(db.String(255), nullable=False, comment='タイトル')
    content = db.Column(db.Text, nullable=False, comment='内容')
    created_by = db.Column(db.Integer, db.ForeignKey('teachers.teacher_id'), nullable=False, comment='作成者の教師ID（teachers参照）')
    created_at = db.Column(db.DateTime, nullable=False, server_default=db.func.current_timestamp(), comment='作成日時')
    updated_at = db.Column(db.DateTime, nullable=False, server_default=db.func.current_timestamp(), 
                          onupdate=db.func.current_timestamp(), comment='更新日時')

    # リレーションシップ
    teacher = db.relationship('Teacher', backref=db.backref('announcements', lazy=True))

    def __repr__(self):
        return f'<Announcement {self.announcement_id}>'

    def to_dict(self):
        return {
            'announcement_id': self.announcement_id,
            'title': self.title,
            'content': self.content,
            'created_by': self.created_by,
            'teacher_name': self.teacher.name if self.teacher else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class BulletinReactionModel(BaseModel):
    """掲示板リアクションモデル"""
    __tablename__ = 'bulletin_reactions'
    __table_args__ = {'extend_existing': True}

    reaction_id = db.Column(db.Integer, primary_key=True, autoincrement=True, comment='リアクションID')
    post_id = db.Column(db.Integer, db.ForeignKey('bulletin_board.bulletin_id'), nullable=False, comment='掲示板ID')
    student_id = db.Column(db.String(5), db.ForeignKey('students.student_id'), nullable=False, comment='学生ID')
    reaction_type = db.Column(db.String(20), nullable=False, comment='リアクションタイプ')
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, comment='作成日時')
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow, comment='更新日時')

    # リレーションシップは削除 