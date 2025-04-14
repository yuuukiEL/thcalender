from flask import jsonify, render_template, Blueprint
from models import Subject, Teacher, Class
from flask_sqlalchemy import SQLAlchemy

views = Blueprint("views", __name__)

db = SQLAlchemy()


@views.route("/register_class_schedule", methods=["GET", "POST"])
def register_class_schedule():
    # クラスデータを取得
    classes = Class.query.order_by(Class.class_id).all()
    # 他の必要なデータも取得
    subjects = Subject.query.all()
    teachers = Teacher.query.all()
    classrooms = Classroom.query.all()

    return render_template(
        "register_class_schedule.html",
        classes=classes,
        subjects=subjects,
        teachers=teachers,
        classrooms=classrooms,
    )


@views.route("/api/subjects", methods=["GET"])
def get_subjects():
    try:
        subjects = Subject.query.all()
        subject_list = [
            {"subject_id": subject.subject_id, "subject_name": subject.subject_name}
            for subject in subjects
        ]
        return jsonify(subject_list)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@views.route("/student/promotion/class-assignment")
def class_assignment_promotion():
    try:
        # 担任データをデータベースから取得
        teachers = db.session.query(Teacher).order_by(Teacher.name).all()

        # テンプレートにデータを渡す
        return render_template("class_assignment.html", teachers=teachers)

    except Exception as e:
        # エラーログを出力
        print(f"Error fetching teachers: {str(e)}")
        # エラーが発生した場合は空のリストを渡す
        return render_template("class_assignment.html", teachers=[])
