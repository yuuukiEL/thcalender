from apps import db
from datetime import datetime

class ApiSettings(db.Model):
    __tablename__ = 'api_settings'
    
    id = db.Column(db.Integer, primary_key=True, comment='API設定の一意識別子')
    name = db.Column(db.String(100), nullable=False, comment='API名称（例：Google Calendar、Notion）')
    api_type = db.Column(db.String(50), nullable=False, unique=True, comment='APIタイプ（google, notion, outlook）')
    api_url = db.Column(db.String(255), nullable=False, comment='API接続先URL')
    description = db.Column(db.Text, nullable=True, comment='API機能の説明文')
    required_scopes = db.Column(db.Text, nullable=True, comment='必要な権限スコープ（カンマ区切り）')
    created_at = db.Column(db.DateTime, default=datetime.utcnow, comment='作成日時')
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, comment='更新日時')
    
    # リレーションシップの定義を削除
    # connections = db.relationship('StudentApiConnection', backref='api_setting', lazy=True)
    
    def __repr__(self):
        return f'<ApiSettings {self.name}>' 