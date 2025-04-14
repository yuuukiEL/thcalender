from apps import db
from werkzeug.security import generate_password_hash, check_password_hash

class StudentSecurityQuestion(db.Model):
    """学生のセキュリティ質問モデル"""
    __tablename__ = 'student_security_questions'
    
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.String(20), nullable=False)
    question = db.Column(db.String(255), nullable=False)
    answer_hash = db.Column(db.String(255), nullable=False)
    
    def set_answer(self, answer):
        """回答をハッシュ化して保存"""
        if answer:
            self.answer_hash = generate_password_hash(answer.lower())
    
    def check_answer(self, answer):
        """回答が正しいか確認"""
        if not answer or not self.answer_hash:
            return False
        return check_password_hash(self.answer_hash, answer.lower()) 