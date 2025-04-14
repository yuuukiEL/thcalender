from flask import Blueprint, render_template, session, redirect, url_for
from flask_login import login_required, current_user
from apps.extensions import db
from apps.models.student import Student
from apps.models.course import CourseMaster, SpecializationMaster
from apps.models.schedule import StudentSchedule
from apps.student.models.personal_schedule import StudentPersonalSchedule
from datetime import datetime, timedelta

bp = Blueprint('student_home', __name__)

@bp.route('/')
@login_required
def index():
    """学生ホーム画面"""
    try:
        student_id = session.get("student_id")
        # DBセッションから学生情報を取得
        student = db.session.query(Student).filter_by(student_id=student_id).first()
        
        # スケジュールを事前に読み込む
        schedules = student.schedules if student else []
        
        return render_template(
            'student/home/index.html',
            student=student,
            schedules=schedules
        )
    except Exception as e:
        print(f"Error in home index: {e}")
        return render_template('student/home/index.html')