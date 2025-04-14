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
from datetime import datetime, timedelta
from apps.database.connection import get_db

bp = Blueprint("classroom", __name__)


@bp.route("/classroom", methods=["GET", "POST"])
def register_classroom():
    conn = get_db()
    cursor = conn.cursor(dictionary=True)

    try:
        if request.method == "POST":
            classroom_id = request.form["classroom_number"]
            floor = request.form["floor"]
            seating_capacity = request.form["seating_capacity"]
            classroom_type = request.form["classroom_type"]

            # 既存の教室情報を更新
            cursor.execute(
                """
                UPDATE classrooms 
                SET floor = %s, 
                    seating_capacity = %s, 
                    classroom_type = %s 
                WHERE classroom_id = %s
            """,
                (floor, seating_capacity, classroom_type, classroom_id),
            )

            conn.commit()
            flash("教室情報が正常に更新されました。", "success")

        # 教室情報の取得（更新後の最新データを取得）
        cursor.execute(
            """
            SELECT classroom_id, floor, classroom_type, seating_capacity 
            FROM classrooms
        """
        )
        classrooms = [
            {
                "classroom_id": row["classroom_id"],
                "floor": row["floor"],
                "classroom_type": row["classroom_type"],
                "seating_capacity": row["seating_capacity"],
            }
            for row in cursor.fetchall()
        ]

        return render_template("register_classroom.html", classrooms=classrooms)

    except Exception as err:
        conn.rollback()
        flash(f"データベースエラーが発生しました: {err}", "error")
        return render_template("register_classroom.html", classrooms=[])

    finally:
        cursor.close()


@bp.route("/empty_classroom", methods=["GET"])
def register_empty_classroom():
    # 現在の月を取得
    month = request.args.get(
        "month", default=datetime.now().strftime("%Y-%m"), type=str
    )
    year, month = map(int, month.split("-"))

    # 指定された月の初日を取得
    first_day = datetime(year, month, 1)
    next_month = first_day + timedelta(days=32)
    next_month = next_month.replace(day=1)
    prev_month = first_day - timedelta(days=1)
    prev_month = prev_month.replace(day=1)

    # その月の日数を取得
    days_in_month = (next_month - first_day).days

    # 日付リストを作成（日本語の曜日を使用）
    weekdays = {
        "Mon": "月",
        "Tue": "火",
        "Wed": "水",
        "Thu": "木",
        "Fri": "金",
        "Sat": "土",
        "Sun": "日",
    }
    dates = []
    for i in range(days_in_month):
        current_date = first_day + timedelta(days=i)
        weekday_en = current_date.strftime("%a")
        weekday_jp = weekdays[weekday_en]
        formatted_date = current_date.strftime(f"%Y年%m月%d日({weekday_jp})")
        dates.append(formatted_date)

    # データベース接続
    conn = get_db()
    cursor = conn.cursor(dictionary=True)

    try:
        # start_dateを使用するように修正
        cursor.execute(
            """
            SELECT classroom_id, start_date as date, period
            FROM class_common_schedules
            WHERE YEAR(start_date) = %s 
            AND MONTH(start_date) = %s
            AND start_date <= end_date  -- 有効な期間のスケジュールのみ取得
        """,
            (year, month),
        )

        common_schedules = cursor.fetchall()

        # 共通スケジュールの教室情報を整形
        common_schedule_list = []
        for schedule in common_schedules:
            date_obj = schedule["date"]
            weekday_en = date_obj.strftime("%a")
            weekday_jp = weekdays[weekday_en]
            formatted_date = date_obj.strftime(f"%Y年%m月%d日({weekday_jp})")

            schedule_dict = {
                "classroom_id": str(schedule["classroom_id"]),
                "formatted_date": formatted_date,
                "period": schedule["period"],
            }
            common_schedule_list.append(schedule_dict)

        # 空き教室データを取得
        cursor.execute(
            """
            SELECT 
                classroom_id,
                date,
                period,
                CASE period
                    WHEN '1限' THEN 1
                    WHEN '2限' THEN 2
                    WHEN '3限' THEN 3
                    WHEN '4限' THEN 4
                    WHEN '5限' THEN 5
                    WHEN '6限' THEN 6
                    WHEN '夜間' THEN 7
                END as period_index
            FROM empty_classrooms
            WHERE YEAR(date) = %s 
            AND MONTH(date) = %s
            ORDER BY date, classroom_id, period
        """,
            (year, month),
        )

        empty_rooms = cursor.fetchall()

        # 日付フォーマットを修正
        empty_rooms_list = []
        for room in empty_rooms:
            # 日付オブジェクトから正しい形式の文字列を生成
            date_obj = room["date"]
            weekday_en = date_obj.strftime("%a")
            weekday_jp = weekdays[weekday_en]
            formatted_date = date_obj.strftime(f"%Y年%m月%d日({weekday_jp})")

            room_dict = {
                "classroom_id": str(room["classroom_id"]),
                "formatted_date": formatted_date,
                "period": room["period"],
                "period_index": int(room["period_index"]),
            }
            empty_rooms_list.append(room_dict)

        return render_template(
            "register_empty_classroom.html",
            dates=dates,
            prev_month=prev_month,
            next_month=next_month,
            empty_rooms=empty_rooms_list,
            common_schedules=common_schedule_list,
        )

    except Exception as err:
        current_app.logger.error(f"Database error: {str(err)}")  # エラーログを追加
        flash(f"データベースエラーが発生しました: {str(err)}", "error")
        return redirect(url_for("views.index"))

    finally:
        cursor.close()


@bp.route("/class", methods=["GET", "POST"])
def register_class():
    conn = get_db()
    cursor = conn.cursor(dictionary=True)

    try:
        if request.method == "POST":
            department_letters = request.form.get("department_letters")
            department_number = request.form.get("department_number")
            class_letter = request.form.get("class_letter")
            teacher_id = request.form.get("teacher_id")

            # クラス情報の登録
            cursor.execute(
                """
                INSERT INTO classes 
                (department_letters, department_number, class_letter, teacher_id)
                VALUES (%s, %s, %s, %s)
            """,
                (department_letters, department_number, class_letter, teacher_id),
            )

            conn.commit()
            flash("クラス情報を登録しました。", "success")
            return redirect(url_for("views.index"))

        # 教員一覧の取得
        cursor.execute("SELECT teacher_id, name FROM teachers ORDER BY name")
        teachers = cursor.fetchall()

        # 既存のクラス一覧を取得
        cursor.execute(
            """
            SELECT 
                c.class_id,
                c.department_letters,
                c.department_number,
                c.class_letter,
                t.name as teacher_name
            FROM classes c
            LEFT JOIN teachers t ON c.teacher_id = t.teacher_id
            ORDER BY 
                c.department_letters,
                c.department_number,
                c.class_letter
        """
        )
        classes = cursor.fetchall()

        return render_template(
            "register_class.html", teachers=teachers, classes=classes
        )

    except Exception as e:
        conn.rollback()
        flash(f"エラーが発生しました: {str(e)}", "error")
        return redirect(url_for("views.index"))

    finally:
        cursor.close()


@bp.route("/api/update-empty-classroom", methods=["POST"])
def update_empty_classroom():
    """空き教室情報を更新するAPIエンドポイント"""
    try:
        data = request.get_json()
        if not data:
            return (
                jsonify({"success": False, "error": "データが送信されていません"}),
                400,
            )

        room = data.get("room")
        date = data.get("date")
        period = data.get("period")
        is_empty = data.get("is_empty")

        if not all([room, date, period, is_empty is not None]):
            return (
                jsonify({"success": False, "error": "必要なデータが不足しています"}),
                400,
            )

        # 日付の変換（例：2025年01月01日(水) → 2025-01-01）
        try:
            # 曜日部分を除去して解析
            date_without_weekday = date.split("(")[0]
            date_obj = datetime.strptime(date_without_weekday, "%Y年%m月%d日")
            formatted_date = date_obj.strftime("%Y-%m-%d")
        except ValueError as e:
            return (
                jsonify({"success": False, "error": f"日付の形式が不正です: {str(e)}"}),
                400,
            )

        conn = get_db()
        cursor = conn.cursor()

        try:
            # start_dateとend_dateを使用するように修正
            cursor.execute(
                """
                SELECT schedule_id 
                FROM class_common_schedules 
                WHERE classroom_id = %s 
                AND %s BETWEEN start_date AND end_date
                AND period = %s
                """,
                (room, formatted_date, period),
            )

            common_schedule = cursor.fetchone()

            if common_schedule:
                return (
                    jsonify(
                        {
                            "success": False,
                            "error": "この教室は共通スケジュールで使用されているため、空き教室として登録できません",
                        }
                    ),
                    400,
                )

            # 既存のレコードを確認
            cursor.execute(
                """
                SELECT empty_classroom_id FROM empty_classrooms 
                WHERE classroom_id = %s AND date = %s AND period = %s
            """,
                (room, formatted_date, period),
            )

            existing_record = cursor.fetchone()

            if existing_record and not is_empty:
                # 空き教室でなくなった場合はレコードを削除
                cursor.execute(
                    """
                    DELETE FROM empty_classrooms 
                    WHERE classroom_id = %s AND date = %s AND period = %s
                """,
                    (room, formatted_date, period),
                )
            elif not existing_record and is_empty:
                # 空き教室になった場合は新しいレコードを挿入
                cursor.execute(
                    """
                    INSERT INTO empty_classrooms (classroom_id, date, period)
                    VALUES (%s, %s, %s)
                """,
                    (room, formatted_date, period),
                )

            conn.commit()
            return jsonify({"success": True, "message": "空き教室情報を更新しました"})

        except Exception as e:
            conn.rollback()
            current_app.logger.error(f"Database error: {str(e)}")
            return (
                jsonify({"success": False, "error": f"データベースエラー: {str(e)}"}),
                500,
            )

        finally:
            cursor.close()

    except Exception as e:
        current_app.logger.error(f"Request error: {str(e)}")
        return jsonify({"success": False, "error": f"リクエストエラー: {str(e)}"}), 400


@bp.route("/api/commit-empty-classroom", methods=["POST"])
def commit_empty_classroom():
    """空き教室情報のコミットを処理するAPIエンドポイント"""
    try:
        conn = get_db()
        conn.commit()
        return jsonify(
            {"success": True, "message": "空き教室情報が正常に保存されました"}
        )
    except Exception as e:
        current_app.logger.error(f"Error committing empty classroom data: {str(e)}")
        return (
            jsonify(
                {
                    "success": False,
                    "error": "空き教室情報の保存中にエラーが発生しました",
                }
            ),
            500,
        )
