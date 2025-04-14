from flask import Blueprint, jsonify, request, render_template, flash, redirect, url_for
from apps.database.connection import get_db, db
from ..models import Teacher
from apps.models import Class, Specialization
from datetime import datetime

# APIエンドポイント用のBlueprint
api_bp = Blueprint("class_assignment_api", __name__, url_prefix='/api')

# ページ表示用のBlueprint
page_bp = Blueprint("class_assignment_page", __name__, url_prefix='/class')

@api_bp.route("/specializations/master", methods=["GET"])
def get_specializations():
    try:
        department_code = request.args.get("department_code")
        attendance_type = request.args.get("attendance_type")
        course_type = request.args.get("course_type")

        if not all([department_code, attendance_type, course_type]):
            return jsonify({"error": "必要なパラメータが不足しています"}), 400

        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        # テーブル構造を確認するクエリ
        cursor.execute("DESCRIBE specialization_master")
        columns = cursor.fetchall()
        print("Specialization Master Columns:", columns)

        # 専攻データを取得
        query = """
            SELECT DISTINCT 
                sm.id,
                sm.specialization_code,
                sm.specialization_name,
                sm.previous_specialization_id,
                sm.course_code,
                sm.grade
            FROM specialization_master sm
            WHERE sm.course_code = %s
            ORDER BY sm.specialization_code
        """
        cursor.execute(query, (department_code,))
        specializations = cursor.fetchall()

        # デバッグ用に結果を出力
        print(f"Query parameters: department_code={department_code}")
        print(f"Found {len(specializations)} specializations")
        print(
            "First specialization:", specializations[0] if specializations else "None"
        )

        return jsonify(specializations)

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({"error": "専攻データの取得に失敗しました"}), 500
    finally:
        cursor.close()


@api_bp.route("/teachers", methods=["GET"])
def get_teachers():
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT teacher_id, name
            FROM teachers
            ORDER BY name
        """)
        teachers = cursor.fetchall()
        return jsonify(teachers)
    except Exception as e:
        print(f"Error in get_teachers: {str(e)}")
        return jsonify({"error": "教員データの取得に失敗しました"}), 500
    finally:
        cursor.close()
        conn.close()


@api_bp.route("/departments/<attendance_type>/<course_type>", methods=["GET"])
def get_departments(attendance_type, course_type):
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        query = """
            SELECT DISTINCT 
                cm.course_code,
                cm.course_name
            FROM course_master cm
            WHERE cm.part_time_type = %s 
            AND cm.course_type = %s
            ORDER BY cm.course_code
        """
        
        part_time_type = "day" if attendance_type == "daytime" else "night"
        cursor.execute(query, (part_time_type, course_type))
        departments = cursor.fetchall()

        return jsonify([{
            'code': dept['course_code'],
            'name': dept['course_name']
        } for dept in departments])
    except Exception as e:
        print(f"Error in get_departments: {str(e)}")
        return jsonify({"error": "学科データの取得に失敗しました"}), 500
    finally:
        cursor.close()
        conn.close()


@page_bp.route("/assignment")
def show_assignment_page():
    """クラス分け管理ページの表示"""
    return render_template("class_assignment.html")


@api_bp.route("/register_class", methods=["POST"])
def register_class():
    try:
        data = request.get_json()

        # 必須フィールドのバリデーション
        required_fields = ["teacher_id", "specialization_id", "class_letter"]
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({"success": False, "message": f"{field} は必須項目です"}), 400

        # データ型のバリデーション
        try:
            homeroom_teacher_id = int(data["teacher_id"])
            specialization_id = int(data["specialization_id"])
            class_letter = str(data["class_letter"]).strip().upper()
        except (ValueError, TypeError):
            return jsonify({"success": False, "message": "無効なデータ形式です"}), 400

        # クラス記号のバリデーション
        if len(class_letter) != 1 or not class_letter.isalpha():
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "クラス記号は1文字のアルファベットでなければなりません",
                    }
                ),
                400,
            )

        # 専攻情報と課程情報を取得
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT sm.id, 
                   sm.specialization_code,
                   sm.course_code,
                   sm.grade,
                   cm.part_time_type,
                   cm.course_type
            FROM specialization_master sm
            JOIN course_master cm ON sm.course_code = cm.course_code
            WHERE sm.id = %s
            """,
            (specialization_id,),
        )
        specialization = cursor.fetchone()

        if not specialization:
            raise ValueError("専攻が見つかりません")

        # 部コードの決定
        if specialization["course_type"] == "4year":
            department_code = "1"  # 4年制は春期生昼間部
        else:  # 2year
            if specialization["part_time_type"] == "day":
                if specialization["course_type"] == "2year":
                    department_code = "4"  # 秋期生昼間部
            else:  # night
                department_code = "2"  # 春期生夜間部

        # 部コード+学年を組み合わせる（例：13 = 春期生昼間部の3年）
        department_number = f"{department_code}{specialization['grade']}"

        # 既存のクラスをチェック
        existing_class = Class.query.filter_by(
            specialization_id=specialization_id,
            department_number=department_number,
            class_letter=class_letter,
            class_number="",
        ).first()

        if existing_class:
            raise ValueError("同じ条件のクラスが既に存在します")

        # 新しいクラスを作成
        new_class = Class(
            specialization_id=specialization_id,
            department_number=department_number,
            class_letter=class_letter,
            class_number="",
            homeroom_teacher_id=homeroom_teacher_id,
        )

        # データベースに保存
        db.session.add(new_class)
        db.session.commit()

        return jsonify({"success": True, "message": "クラスが正常に登録されました"})

    except ValueError as e:
        db.session.rollback()
        return jsonify({"success": False, "message": str(e)}), 400
    except Exception as e:
        db.session.rollback()
        print(f"Error in register_class: {str(e)}")
        return jsonify({"success": False, "message": "クラスの登録に失敗しました"}), 500
    finally:
        if "cursor" in locals():
            cursor.close()


@api_bp.route("/api/course-types", methods=["GET"])
def get_course_types():
    try:
        # データベースから課程区分を取得
        course_types = [
            {
                "attendance_type": "day",
                "course_type": "4year",
                "display_name": "4年制（昼間部）",
            },
            {
                "attendance_type": "day",
                "course_type": "2year",
                "display_name": "2年制（昼間部）",
            },
            {
                "attendance_type": "night",
                "course_type": "2year",
                "display_name": "2年制（夜間部）",
            },
        ]
        return jsonify(course_types)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
