from ...extensions import db
from datetime import datetime
from ...common.database import BaseModel

class PrivateChat(BaseModel):
    """プライベートチャットモデル"""
    __tablename__ = 'private_chats'

    chat_id = db.Column(db.Integer, primary_key=True, autoincrement=True, comment='チャットID（ユニーク）')
    sender_id = db.Column(db.String(5), db.ForeignKey('students.student_id'), nullable=False, comment='送信者ID（students参照）')
    receiver_id = db.Column(db.String(5), db.ForeignKey('students.student_id'), nullable=False, comment='受信者ID（students参照）')
    message = db.Column(db.Text, nullable=False, comment='メッセージ内容')
    is_read = db.Column(db.Boolean, default=False, comment='既読フラグ')
    created_at = db.Column(db.DateTime, nullable=False, server_default=db.func.current_timestamp(), comment='作成日時')
    updated_at = db.Column(db.DateTime, nullable=False, server_default=db.func.current_timestamp(), 
                          onupdate=db.func.current_timestamp(), comment='更新日時')

    def __repr__(self):
        return f'<PrivateChat {self.chat_id}>'

    def to_dict(self):
        return {
            'chat_id': self.chat_id,
            'sender_id': self.sender_id,
            'receiver_id': self.receiver_id,
            'message': self.message,
            'is_read': self.is_read,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'sender_name': self.sender.name if self.sender else None,
            'receiver_name': self.receiver.name if self.receiver else None
        } 