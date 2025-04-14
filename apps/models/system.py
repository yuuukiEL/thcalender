from datetime import datetime
from apps.extensions import db
from apps.models.base import BaseModel

class SystemConfig(BaseModel):
    """システム設定モデル"""
    __tablename__ = 'system_config'
    __table_args__ = {'extend_existing': True}

    config_id = db.Column(db.Integer, primary_key=True, autoincrement=True, comment='設定ID（ユニーク）')
    key = db.Column(db.String(255), unique=True, nullable=False, comment='設定キー')
    value = db.Column(db.Text, nullable=False, comment='設定値')
    description = db.Column(db.Text, comment='説明')
    created_at = db.Column(db.DateTime, nullable=False, server_default=db.func.current_timestamp(), comment='作成日時')
    updated_at = db.Column(db.DateTime, nullable=False, server_default=db.func.current_timestamp(), 
                          onupdate=db.func.current_timestamp(), comment='更新日時')

    def __repr__(self):
        return f'<SystemConfig {self.key}>'

    def to_dict(self):
        return {
            'config_id': self.config_id,
            'key': self.key,
            'value': self.value,
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        } 