from flask import Blueprint, jsonify, request
from apps.database.connection import get_db
from datetime import datetime
import re
from sqlalchemy import text

bp = Blueprint("api", __name__, url_prefix="/api")


@bp.route("/update-empty-classroom", methods=["POST"])
def update_empty_classroom():
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "データが提供されていません"}), 400

        date = data.get("date")
        room = data.get("room")
        period = data.get("period")
        is_empty = data.get("is_empty")

        if not all([date, room, period]):
            return jsonify({"error": "必要なデータが不足しています"}), 400

        # 日付文字列から年月日を抽出
        date_match = re.match(r"(\d{4})年(\d{1,2})月(\d{1,2})日", date)
        if not date_match:
            return jsonify({"error": "日付のフォーマットが不正です"}), 400

        year, month, day = map(int, date_match.groups())
        date_obj = datetime(year, month, day)

        # empty_classroom_idを生成
        # 形式: YYYYMMDD_期間_教室番号
        period_num = period.replace("限", "").replace("夜間", "7")
        empty_classroom_id = f"{date_obj.strftime('%Y%m%d')}_{period_num}_{room}"

        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        try:
            if is_empty:
                # 既存のレコードを確認
                cursor.execute(
                    """
                    SELECT empty_classroom_id 
                    FROM empty_classrooms 
                    WHERE classroom_id = %s 
                    AND date = %s 
                    AND period = %s
                """,
                    (room, date_obj, period),
                )

                existing = cursor.fetchone()

                if not existing:
                    # 新規登録
                    cursor.execute(
                        """
                        INSERT INTO empty_classrooms 
                        (empty_classroom_id, classroom_id, date, period, created_at, updated_at)
                        VALUES (%s, %s, %s, %s, NOW(), NOW())
                    """,
                        (empty_classroom_id, room, date_obj, period),
                    )
            else:
                # 空き教室から削除
                cursor.execute(
                    """
                    DELETE FROM empty_classrooms
                    WHERE classroom_id = %s
                    AND date = %s
                    AND period = %s
                """,
                    (room, date_obj, period),
                )

            conn.commit()
            return jsonify({"success": True})

        except Exception as err:
            conn.rollback()
            return jsonify({"error": str(err)}), 500

        finally:
            cursor.close()
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@bp.route("/departments", methods=["GET"])
def get_departments():
    course_type = request.args.get("course_type")
    if not course_type:
        return jsonify({"error": "course_type parameter is required"}), 400

    conn = get_db()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute(
            """
            SELECT DISTINCT course_code, course_name
            FROM course_master
            WHERE course_type = %s
            ORDER BY course_code
        """,
            (course_type,),
        )

        departments = cursor.fetchall()
        return jsonify(departments)

    except Exception as err:
        return jsonify({"error": str(err)}), 500

    finally:
        cursor.close()


@bp.route("/specializations", methods=["GET"])
def get_specializations():
    course_code = request.args.get("course_code")
    grade = request.args.get("grade")

    if not course_code or not grade:
        return jsonify({"error": "course_code and grade parameters are required"}), 400

    conn = get_db()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute(
            """
            SELECT id, specialization_name
            FROM specialization_master
            WHERE course_code = %s
            AND grade = %s
            ORDER BY id
        """,
            (course_code, grade),
        )

        specializations = cursor.fetchall()
        return jsonify(specializations)

    except Exception as err:
        return jsonify({"error": str(err)}), 500

    finally:
        cursor.close()


@bp.route("/teachers", methods=["GET"])
def get_teachers():
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM teachers")
        teachers = cursor.fetchall()
        return jsonify(teachers)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()


@bp.route("/specializations/master", methods=["GET"])
def get_specialization_master():
    # This method is mentioned in the original file but not implemented in the new version
    # It's left unchanged as it's mentioned in the original file
    pass


@bp.route('/specializations/all', methods=['GET'])
def get_all_specializations():
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT id, specialization_name, grade
            FROM specialization_master
            ORDER BY grade, specialization_name
        """)
        
        specializations = cursor.fetchall()
        return jsonify(specializations)
        
    except Exception as e:
        print(f"Error in get_all_specializations: {str(e)}")
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()


@bp.route('/classes', methods=['POST'])
def create_class():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "データが提供されていません"}), 400

        specialization_id = data.get('specialization_id')
        teacher_id = data.get('teacher_id')
        class_letter = data.get('class_letter')

        if not all([specialization_id, teacher_id, class_letter]):
            return jsonify({"error": "必要なデータが不足しています"}), 400

        conn = get_db()
        cursor = conn.cursor()

        # クラスコードを生成
        cursor.execute("""
            SELECT CONCAT(specialization_code, '-', %s) AS class_code
            FROM specialization_master
            WHERE id = %s
        """, (class_letter, specialization_id))
        class_code = cursor.fetchone()['class_code']

        # クラスを登録
        cursor.execute("""
            INSERT INTO classes (class_code, specialization_id, teacher_id)
            VALUES (%s, %s, %s)
        """, (class_code, specialization_id, teacher_id))

        conn.commit()
        return jsonify({"success": True, "class_code": class_code})

    except Exception as e:
        conn.rollback()
        print(f"Error in create_class: {str(e)}")
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()


@bp.route('/get_course_types', methods=['GET'])
def get_course_types():
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM course_types")
        course_types = cursor.fetchall()
        return jsonify(course_types)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()
        
@bp.route('/subject_description/<int:subject_id>', methods=['GET'])
def get_subject_description(subject_id):
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT d.description
            FROM subject_descriptions d
            WHERE d.subject_id = %s
        """, (subject_id,))
        
        result = cursor.fetchone()
        if result:
            return jsonify({"description": result['description']})
        return jsonify({"description": "説明が登録されていません"})
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# 科目説明の保存用エンドポイントを追加
@bp.route('/subject_description', methods=['POST'])
def save_subject_description():
    try:
        data = request.get_json()
        subject_id = data.get('subject_id')
        description = data.get('description')

        if not all([subject_id, description]):
            return jsonify({"error": "必要なデータが不足しています"}), 400

        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        # 既存の説明を確認
        cursor.execute("""
            SELECT description_id 
            FROM subject_descriptions 
            WHERE subject_id = %s
        """, (subject_id,))
        
        existing = cursor.fetchone()

        if existing:
            # 更新
            cursor.execute("""
                UPDATE subject_descriptions 
                SET description = %s, 
                    updated_at = NOW()
                WHERE subject_id = %s
            """, (description, subject_id))
        else:
            # 新規作成
            cursor.execute("""
                INSERT INTO subject_descriptions 
                (subject_id, description) 
                VALUES (%s, %s)
            """, (subject_id, description))

        conn.commit()
        return jsonify({"success": True})

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@bp.route("/specialization-info/<int:specialization_id>", methods=["GET"])
def get_specialization_info(specialization_id):
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        # 学科・専攻情報を取得
        cursor.execute(
            """
            SELECT 
                cm.course_name,
                sm.specialization_name
            FROM specialization_master sm
            INNER JOIN course_master cm ON sm.course_code = cm.course_code
            INNER JOIN classes c ON sm.id = c.specialization_id
            WHERE sm.id = %s
            LIMIT 1
            """,
            (specialization_id,)
        )

        specialization_data = cursor.fetchone()
        if not specialization_data:
            return jsonify({"success": False, "error": "専攻情報が見つかりません"}), 404

        return jsonify({
            "success": True,
            "course_name": specialization_data['course_name'],
            "specialization_name": specialization_data['specialization_name']
        })

    except Exception as e:
        print(f"Error in get_specialization_info: {str(e)}")  # デバッグログ
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        cursor.close()

@bp.route("/class-info/<int:specialization_id>", methods=["GET"])
def get_class_info(specialization_id):
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT 
                c.class_id,
                sm.specialization_code,
                sm.course_code,
                c.department_number,
                c.class_letter,
                cm.course_name,
                sm.specialization_name
            FROM classes c
            INNER JOIN specialization_master sm ON c.specialization_id = sm.id
            INNER JOIN course_master cm ON sm.course_code = cm.course_code
            WHERE sm.id = %s
            AND YEAR(c.created_at) = YEAR(CURRENT_DATE)
            LIMIT 1
            """,
            (specialization_id,)
        )

        class_data = cursor.fetchone()
        
        if not class_data:
            return jsonify({
                "success": False,
                "error": "クラス情報が見つかりません"
            }), 404

        # クラスコードを生成（例：IS1-A）
        class_code = f"{class_data['specialization_code']}{class_data['department_number']}-{class_data['class_letter']}"

        return jsonify({
            "success": True,
            "course_name": class_data['course_name'],
            "specialization_name": class_data['specialization_name'],
            "class_code": class_code,
            "class_id": class_data['class_id'],
            "course_code": class_data['course_code']
        })

    except Exception as e:
        print(f"Error in get_class_info: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500
    finally:
        cursor.close()

@bp.route('/classes')
def get_classes():
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT 
                c.class_id,
                CONCAT(
                    sm.specialization_code,
                    c.department_number,
                    c.class_letter
                ) as class_name
            FROM classes c
            JOIN specialization_master sm ON c.specialization_id = sm.id
            ORDER BY 
                sm.specialization_code,
                c.department_number,
                c.class_letter
        """)
        
        classes = cursor.fetchall()
        return jsonify([{
            'class_id': row['class_id'],
            'class_name': row['class_name']
        } for row in classes])
        
    except Exception as e:
        print(f"クラス一覧取得エラー: {e}")
        return jsonify([])
    
    finally:
        cursor.close()
