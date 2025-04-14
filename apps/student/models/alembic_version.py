from ...extensions import db
from ...common.database import BaseModel

class AlembicVersion(BaseModel):
    """マイグレーション管理用のバージョン情報モデル"""
    __tablename__ = 'alembic_version'

    version_num = db.Column(db.String(32), primary_key=True, comment='マイグレーションバージョン番号')

    def __repr__(self):
        return f'<AlembicVersion {self.version_num}>'

    def to_dict(self):
        return {
            'version_num': self.version_num
        }

 