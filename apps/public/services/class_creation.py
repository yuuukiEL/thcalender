from flask import Blueprint, render_template, request, flash, redirect, url_for
from apps.database.connection import get_db

# ブループリントの作成
bp = Blueprint("class_creation", __name__, url_prefix="/class-creation")


@bp.route("/")
def index():
    conn = get_db()
    cursor = conn.cursor(dictionary=True)

    try:
        # 教員データの取得
        cursor.execute("SELECT teacher_id, name FROM teachers ORDER BY name")
        teachers = cursor.fetchall()

        # 専攻データの取得
        cursor.execute(
            """
            SELECT id as specialization_id, specialization_name 
            FROM specialization_master 
            ORDER BY specialization_name
        """
        )
        specializations = cursor.fetchall()

        return render_template(
            "class_creation.html", teachers=teachers, specializations=specializations
        )
    except Exception as e:
        flash(f"データの取得に失敗しました: {str(e)}")
        return render_template("class_creation.html", teachers=[], specializations=[])
    finally:
        cursor.close()


@bp.route("/create", methods=["POST"])
def create_class():
    conn = get_db()
    cursor = conn.cursor()

    try:
        # フォームデータの取得
        specialization_id = request.form.get("specialization_id")
        teacher_id = request.form.get("teacher_id")
        class_letter = request.form.get("class_letter")

        # バリデーション
        if not all([specialization_id, teacher_id, class_letter]):
            flash("すべての項目を入力してください")
            return redirect(url_for("class_creation.index"))

        # クラスの作成
        cursor.execute(
            """
            INSERT INTO classes 
            (specialization_id, teacher_id, class_letter) 
            VALUES (%s, %s, %s)
        """,
            (specialization_id, teacher_id, class_letter.upper()),
        )

        conn.commit()
        flash("クラスが正常に作成されました")

    except Exception as e:
        conn.rollback()
        flash(f"エラーが発生しました: {str(e)}")
    finally:
        cursor.close()

    return redirect(url_for("class_creation.index"))
