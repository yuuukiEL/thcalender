"""お知らせモデル"""
from ..extensions import db
from datetime import datetime

class Announcement(db.Model):
    """お知らせモデル"""
    __tablename__ = 'announcements'
    __table_args__ = {'extend_existing': True}

    announcement_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    title = db.Column(db.String(255), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey('teachers.teacher_id', name='fk_announcement_teacher'), nullable=False)
    created_at = db.Column(db.TIMESTAMP, nullable=False, server_default=db.text('CURRENT_TIMESTAMP'))
    updated_at = db.Column(db.TIMESTAMP, nullable=False, server_default=db.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'))
    is_important = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)

    # リレーションシップ
    created_teacher = db.relationship(
        'apps.models.teacher.Teacher',
        back_populates='created_announcements',
        foreign_keys=[created_by],
        overlaps="announcements,teacher"  # 重複警告を抑制
    )

    def __repr__(self):
        return f'<Announcement {self.title}>'

    def to_dict(self):
        return {
            'announcement_id': self.announcement_id,
            'title': self.title,
            'content': self.content,
            'teacher_id': self.created_by,
            'teacher_name': self.created_teacher.name if self.created_teacher else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'is_important': self.is_important,
            'is_active': self.is_active
        }