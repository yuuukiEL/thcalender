"""報告機能のモデル"""
from apps.extensions import db
from datetime import datetime
from apps.models.base import BaseModel

class Report(BaseModel):
    """報告モデル"""
    __tablename__ = 'report_board'
    __table_args__ = {'extend_existing': True}

    report_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    student_id = db.Column(db.String(5), db.ForeignKey('students.student_id'), nullable=True)  # 匿名の場合はNULL
    content = db.Column(db.Text, nullable=False)
    image_paths = db.Column(db.Text, nullable=True)  # JSON形式で複数の画像パスを保存
    video_paths = db.Column(db.Text, nullable=True)  # JSON形式で複数の動画パスを保存
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)

    # リレーションシップ
    student = db.relationship('apps.models.student.Student', backref=None)

    def __repr__(self):
        return f'<Report {self.report_id}>'

    def to_dict(self):
        """モデルを辞書に変換"""
        return {
            'report_id': self.report_id,
            'student_id': self.student_id,
            'student_name': self.student.name if self.student else '匿名',
            'content': self.content,
            'image_paths': self.image_paths,
            'video_paths': self.video_paths,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
