from flask import (
    Blueprint,
    request,
    redirect,
    url_for,
    flash,
    render_template,
    jsonify,
    current_app,
)
from datetime import datetime
from ..models.class_management import Class
from apps.models import (
    Teacher,
    Classroom,
    EmptyClassroom,
    CourseMaster,
)
from ...extensions import db
from .auth import login_required, admin_required

bp = Blueprint("class_management", __name__)

@bp.route("/class", methods=["GET", "POST"])
def register_class():
    try:
        if request.method == "POST":
            department_letters = request.form.get("department_letters")
            department_number = request.form.get("department_number")
            class_letter = request.form.get("class_letter")
            teacher_id = request.form.get("teacher_id")

            # 新しいクラスを作成
            new_class = Class(
                department_letters=department_letters,
                department_number=department_number,
                class_letter=class_letter,
                teacher_id=teacher_id
            )
            db.session.add(new_class)
            db.session.commit()

            flash("クラス情報を登録しました。", "success")
            return redirect(url_for("class_management.register_class"))

        # 教員一覧の取得
        teachers = Teacher.query.order_by(Teacher.name).all()
        teacher_list = [teacher.to_dict() for teacher in teachers]

        # 既存のクラス一覧を取得
        classes = Class.query.order_by(
            Class.department_letters,
            Class.department_number,
            Class.class_letter
        ).all()
        class_list = [class_.to_dict() for class_ in classes]

        return render_template(
            "register_class.html",
            teachers=teacher_list,
            classes=class_list
        )

    except Exception as e:
        db.session.rollback()
        flash(f"エラーが発生しました: {str(e)}", "error")
        return redirect(url_for("views.index"))

@bp.route("/class/<int:class_id>", methods=["PUT"])
def update_class(class_id):
    try:
        data = request.get_json()
        class_ = Class.query.get_or_404(class_id)

        class_.department_letters = data.get("department_letters", class_.department_letters)
        class_.department_number = data.get("department_number", class_.department_number)
        class_.class_letter = data.get("class_letter", class_.class_letter)
        class_.teacher_id = data.get("teacher_id", class_.teacher_id)

        db.session.commit()
        return jsonify({"success": True, "message": "クラス情報を更新しました"})

    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500

@bp.route("/class/<int:class_id>", methods=["DELETE"])
def delete_class(class_id):
    try:
        class_ = Class.query.get_or_404(class_id)
        db.session.delete(class_)
        db.session.commit()
        return jsonify({"success": True, "message": "クラスを削除しました"})

    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500 