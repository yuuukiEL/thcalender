from datetime import datetime
from apps.extensions import db
from apps.database import BaseModel


class AdminBaseModel(BaseModel):
    """管理者モデルの基底クラス"""
    __abstract__ = True

    created_at = db.Column(db.DateTime, nullable=False, server_default=db.func.current_timestamp(), comment='作成日時')
    updated_at = db.Column(db.DateTime, nullable=False, server_default=db.func.current_timestamp(), 
                          onupdate=db.func.current_timestamp(), comment='更新日時')
    created_by = db.Column(db.Integer, db.ForeignKey('teachers.teacher_id'), nullable=False, comment='作成者の教師ID（teachers参照）')

    # リレーションシップ
    creator = db.relationship('Teacher', backref=db.backref('created_items', lazy=True))

    def to_dict(self):
        """基本的な辞書形式の表現を返す"""
        return {
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'created_by': self.created_by,
            'creator_name': self.creator.name if self.creator else None
        }
