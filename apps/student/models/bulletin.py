"""
このファイルは非推奨です。
代わりに apps.models.bulletin を使用してください。
"""
# BulletinReactionをインポートして再エクスポート
from apps.models.bulletin import BulletinReactionModel as BulletinReaction
from apps.extensions import db
from datetime import datetime

class BulletinBoard(db.Model):
    __tablename__ = 'bulletin_board'
    
    bulletin_id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    content = db.Column(db.Text, nullable=False)
    # image_paths = db.Column(db.Text) # このコメントアウトは正しい
    status = db.Column(db.String(20), default='pending')
    created_by = db.Column(db.Integer, db.ForeignKey('users.user_id'))
    approved_by = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=True)
    approved_at = db.Column(db.DateTime, nullable=True)
    rejection_reason = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# 空のファイル - 内容はすべて削除 