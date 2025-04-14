from apps.extensions import db
from datetime import datetime
from apps.models.base import BaseModel


class Feedback(BaseModel):
    """フィードバックモデル"""

    __tablename__ = "feedbacks"

    feedback_id = db.Column(
        db.Integer,
        primary_key=True,
        autoincrement=True,
        comment="フィードバックID（ユニーク）",
    )
    student_id = db.Column(
        db.String(5),
        db.ForeignKey("students.student_id", ondelete="SET NULL"),
        comment="生徒ID（students参照）",
    )
    category = db.Column(db.String(50), nullable=False, comment="カテゴリ")
    subject = db.Column(db.String(255), nullable=False, comment="件名")
    content = db.Column(db.Text, nullable=False, comment="内容")
    rating = db.Column(db.Integer, comment="評価（1-5）")
    status = db.Column(
        db.Enum("new", "in_review", "implemented", "declined", name="feedback_status"),
        default="new",
        comment="対応状況",
    )
    response = db.Column(db.Text, comment="返答内容")
    is_anonymous = db.Column(db.Boolean, default=False, comment="匿名フラグ")
    created_at = db.Column(
        db.DateTime,
        nullable=False,
        server_default=db.func.current_timestamp(),
        comment="作成日時",
    )
    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        server_default=db.func.current_timestamp(),
        onupdate=db.func.current_timestamp(),
        comment="更新日時",
    )

    # リレーションシップ
    student = db.relationship("Student", backref=db.backref("feedbacks", lazy=True))

    def __repr__(self):
        return f"<Feedback {self.feedback_id}>"

    def to_dict(self):
        return {
            "feedback_id": self.feedback_id,
            "student_id": self.student_id if not self.is_anonymous else None,
            "category": self.category,
            "subject": self.subject,
            "content": self.content,
            "rating": self.rating,
            "status": self.status,
            "response": self.response,
            "is_anonymous": self.is_anonymous,
            "student_name": (
                self.student.name
                if self.student and not self.is_anonymous
                else "Anonymous"
            ),
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
