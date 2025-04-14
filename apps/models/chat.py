"""チャットモデル"""
from apps.extensions import db
from apps.models.base import BaseModel

class PrivateChat(BaseModel):
    """プライベートチャットモデル"""
    __tablename__ = 'private_chat'

    chat_id = db.Column(db.Integer, primary_key=True, autoincrement=True, comment='チャットID')
    sender_id = db.Column(db.String(5), db.ForeignKey('students.student_id'), nullable=False, comment='送信者ID')
    receiver_id = db.Column(db.String(5), db.ForeignKey('students.student_id'), nullable=False, comment='受信者ID')
    message = db.Column(db.Text, nullable=False, comment='メッセージ内容')
    created_at = db.Column(db.DateTime, nullable=False, server_default=db.func.current_timestamp(), comment='作成日時')

    # リレーションシップ
    sender = db.relationship('Student', foreign_keys=[sender_id], backref='sent_messages')
    receiver = db.relationship('Student', foreign_keys=[receiver_id], backref='received_messages')

    def __repr__(self):
        return f'<PrivateChat {self.chat_id}: {self.sender_id} -> {self.receiver_id}>'

    def to_dict(self):
        """モデルを辞書に変換"""
        return {
            'chat_id': self.chat_id,
            'sender_id': self.sender_id,
            'sender_name': self.sender.name if self.sender else None,
            'receiver_id': self.receiver_id,
            'receiver_name': self.receiver.name if self.receiver else None,
            'message': self.message,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }