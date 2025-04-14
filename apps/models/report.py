from datetime import datetime
from apps.extensions import db
from apps.models.base import BaseModel

class Report(BaseModel):
    """レポートモデル（教師が作成する公式レポート）"""
    __tablename__ = 'reports'
    __table_args__ = {'extend_existing': True}

    report_id = db.Column(db.Integer, primary_key=True, autoincrement=True, comment='レポートID')
    student_id = db.Column(db.String(5), db.ForeignKey('students.student_id'), nullable=False, comment='学生ID')
    content = db.Column(db.Text, nullable=False, comment='内容')
    image_paths = db.Column(db.String(255), comment='画像パス')
    video_paths = db.Column(db.String(255), comment='動画パス')
    created_at = db.Column(db.DateTime, nullable=False, server_default=db.func.current_timestamp(), comment='作成日時')
    updated_at = db.Column(db.DateTime, nullable=False, server_default=db.func.current_timestamp(), 
                          onupdate=db.func.current_timestamp(), comment='更新日時')

    # リレーションシップ
    student = db.relationship('Student', backref=db.backref('reports', lazy=True))

class ReportBoard(BaseModel):
    """レポート掲示板モデル（学生が投稿する報告）"""
    __tablename__ = 'report_board'

    report_id = db.Column(db.Integer, primary_key=True, autoincrement=True, comment='報告ID')
    student_id = db.Column(db.String(5), db.ForeignKey('students.student_id'), nullable=True, comment='学生ID')
    content = db.Column(db.Text, nullable=False, comment='内容')
    image_paths = db.Column(db.String(255), comment='画像パス')
    video_paths = db.Column(db.String(255), comment='動画パス')
    created_at = db.Column(db.DateTime, nullable=False, server_default=db.func.current_timestamp(), comment='作成日時')
    updated_at = db.Column(db.DateTime, nullable=False, server_default=db.func.current_timestamp(), 
                          onupdate=db.func.current_timestamp(), comment='更新日時')

    # リレーションシップ
    student = db.relationship('Student', backref=db.backref('report_boards', lazy=True))

    def __repr__(self):
        return f'<Report {self.report_id}>'

    def to_dict(self):
        return {
            'report_id': self.report_id,
            'student_id': self.student_id,
            'content': self.content,
            'image_paths': self.image_paths,
            'video_paths': self.video_paths,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'student_name': self.student.name if self.student else None
        } 