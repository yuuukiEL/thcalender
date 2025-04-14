from apps import db
from datetime import datetime, timedelta

class OAuthState(db.Model):
    """OAuth認証状態を保存するモデル"""
    __tablename__ = 'oauth_states'
    
    id = db.Column(db.Integer, primary_key=True)
    state = db.Column(db.String(100), unique=True, nullable=False)
    user_id = db.Column(db.String(20), nullable=False)  # 学生IDまたは教員ID
    service = db.Column(db.String(20), nullable=False)  # google, notion, outlook等
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, default=lambda: datetime.utcnow() + timedelta(minutes=10))
    
    @classmethod
    def create_state(cls, user_id, service, state):
        """新しい状態を作成して保存"""
        oauth_state = cls(
            state=state,
            user_id=user_id,
            service=service
        )
        db.session.add(oauth_state)
        db.session.commit()
        return oauth_state
    
    @classmethod
    def validate_state(cls, state, user_id, service):
        """状態を検証"""
        oauth_state = cls.query.filter_by(
            state=state,
            user_id=user_id,
            service=service
        ).first()
        
        if not oauth_state:
            return False
        
        # 有効期限をチェック
        if oauth_state.expires_at < datetime.utcnow():
            db.session.delete(oauth_state)
            db.session.commit()
            return False
        
        # 使用済みの状態を削除
        db.session.delete(oauth_state)
        db.session.commit()
        
        return True 