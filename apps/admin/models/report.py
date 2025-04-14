from datetime import datetime
from apps.extensions import db
from apps.database import BaseModel

class Report(BaseModel):
    """レポートモデル"""
    __tablename__ = 'reports'
    __table_args__ = {'extend_existing': True}

    report_id = db.Column(db.Integer, primary_key=True, autoincrement=True, comment='レポートID（ユニーク）')
    title = db.Column(db.String(255), nullable=False, comment='タイトル')
    content = db.Column(db.Text, nullable=False, comment='内容')
    report_type = db.Column(db.String(50), nullable=False, comment='レポートタイプ')
    created_by = db.Column(db.Integer, db.ForeignKey('teachers.teacher_id'), nullable=False, comment='作成者の教師ID（teachers参照）')
    created_at = db.Column(db.DateTime, nullable=False, server_default=db.func.current_timestamp(), comment='作成日時')
    updated_at = db.Column(db.DateTime, nullable=False, server_default=db.func.current_timestamp(), 
                          onupdate=db.func.current_timestamp(), comment='更新日時')

    # リレーションシップ
    teacher = db.relationship('Teacher', backref=db.backref('reports', lazy=True))

    def __repr__(self):
        return f'<Report {self.report_id}>'

    def to_dict(self):
        return {
            'report_id': self.report_id,
            'title': self.title,
            'content': self.content,
            'report_type': self.report_type,
            'created_by': self.created_by,
            'teacher_name': self.teacher.name if self.teacher else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        } 