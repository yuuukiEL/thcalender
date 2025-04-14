from apps import db
from datetime import datetime
import json

class VerificationQuestion(db.Model):
    """学生確認用の問題モデル"""
    __tablename__ = 'verification_questions'
    
    id = db.Column(db.Integer, primary_key=True)
    question_text = db.Column(db.String(255), nullable=False)
    options = db.Column(db.Text, nullable=False)  # JSON形式で選択肢を保存
    correct_answer = db.Column(db.String(10), nullable=False)  # インデックス番号を文字列で保存
    difficulty = db.Column(db.String(20), default='normal')  # easy, normal, hard
    active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def get_options(self):
        """選択肢をリストとして取得"""
        return json.loads(self.options)
    
    def set_options(self, options_list):
        """選択肢をJSONとして保存"""
        self.options = json.dumps(options_list)
    
    def check_answer(self, answer):
        """回答が正解かどうかを確認"""
        return answer.strip() == self.correct_answer.strip()
    
    def get_correct_option(self):
        """正解の選択肢テキストを取得"""
        options = self.get_options()
        try:
            index = int(self.correct_answer)
            if 0 <= index < len(options):
                return options[index]
        except (ValueError, IndexError):
            pass
        return None 