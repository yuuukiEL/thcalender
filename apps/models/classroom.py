from apps import db
from apps.models.base import BaseModel
from datetime import datetime


class Classroom(db.Model):
    """教室モデル"""

    __tablename__ = "classrooms"
    __table_args__ = {"extend_existing": True}

    classroom_id = db.Column(
        db.String(50), primary_key=True, comment="教室ID（ユニーク）"
    )
    floor = db.Column(db.Integer, nullable=False, comment="階数")
    seating_capacity = db.Column(db.Integer, nullable=False, comment="収容人数")
    room_type = db.Column(
        db.String(255), nullable=False, default="normal", comment="教室タイプ"
    )
    created_at = db.Column(
        db.TIMESTAMP,
        nullable=False,
        server_default=db.text("CURRENT_TIMESTAMP"),
        comment="作成日時",
    )
    updated_at = db.Column(
        db.TIMESTAMP,
        nullable=False,
        server_default=db.text("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
        comment="更新日時",
    )

    # リレーションシップを修正
    schedules = db.relationship(
        "apps.models.schedule.StudentSchedule",
        backref=db.backref("classroom_ref", lazy=True),
        overlaps="classroom_schedules,classroom",
    )
    empty_slots = db.relationship(
        "EmptyClassroom", backref=db.backref("classroom_ref", lazy=True)
    )

    def __repr__(self):
        return f"<Classroom {self.classroom_id}>"

    def to_dict(self):
        """モデルを辞書に変換"""
        return {
            "classroom_id": self.classroom_id,
            "floor": self.floor,
            "seating_capacity": self.seating_capacity,
            "room_type": self.room_type,
            "schedule_count": len(self.schedules),
            "empty_slot_count": len(self.empty_slots),
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class EmptyClassroom(db.Model):
    """空き教室モデル"""

    __tablename__ = "empty_classrooms"

    empty_classroom_id = db.Column(
        db.Integer, primary_key=True, comment="空き教室ID（ユニーク）"
    )
    classroom_id = db.Column(
        db.String(50),
        db.ForeignKey("classrooms.classroom_id", ondelete="CASCADE"),
        nullable=False,
        comment="教室番号（例: 201, 202など）",
    )
    # dayカラムをdate_infoに変更
    date_info = db.Column(
        db.Date, nullable=False, comment="利用可能日（YYYY-MM-DD形式）"
    )
    period = db.Column(
        db.Enum("1", "2", "3", "4", "5", "6", "夜間"),
        nullable=False,
        comment="時限（1〜6限、夜間）",
    )
    created_at = db.Column(
        db.TIMESTAMP,
        nullable=False,
        server_default=db.text("CURRENT_TIMESTAMP"),
        comment="レコード作成日時",
    )
    updated_at = db.Column(
        db.TIMESTAMP,
        nullable=False,
        server_default=db.text("CURRENT_TIMESTAMP"),
        server_onupdate=db.text("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
        comment="レコード更新日時",
    )

    # リレーションシップ
    classroom = db.relationship("Classroom", backref="empty_times")

    __table_args__ = (
        db.UniqueConstraint(
            "classroom_id", "date_info", "period", name="unique_empty_classroom"
        ),
    )

    def __repr__(self):
        return f"<EmptyClassroom {self.empty_classroom_id}: {self.classroom_id} - {self.date_info} {self.period}>"

    def to_dict(self):
        """モデルを辞書に変換"""
        return {
            "empty_classroom_id": self.empty_classroom_id,
            "classroom_id": self.classroom_id,
            "classroom_floor": self.classroom.floor if self.classroom else None,
            "date_info": self.date_info.isoformat() if self.date_info else None,
            "period": self.period,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
