"""教室関連のビュー"""
from flask import (
    Blueprint,
    request,
    redirect,
    url_for,
    flash,
    render_template,
    jsonify,
    current_app,
    session,
)
from flask_login import login_required
from datetime import datetime, timedelta
from apps.extensions import db
from apps.models import Student, Classroom, EmptyClassroom  # 正しいパスからインポート
from sqlalchemy import text
from calendar import monthcalendar
from flask_wtf.csrf import generate_csrf  # 追加

bp = Blueprint("student_classroom", __name__, url_prefix="/classroom")


@bp.route("/classroom", methods=["GET", "POST"])
def register_classroom():
    try:
        if request.method == "POST":
            classroom_id = request.form["classroom_number"]
            floor = request.form["floor"]
            seating_capacity = request.form["seating_capacity"]
            classroom_type = request.form["classroom_type"]

            # SQLAlchemyを使用して教室情報を更新
            query = text(
                """
                UPDATE classrooms 
                SET floor = :floor, 
                    seating_capacity = :seating_capacity, 
                    classroom_type = :classroom_type 
                WHERE classroom_id = :classroom_id
            """
            )

            db.session.execute(
                query,
                {
                    "floor": floor,
                    "seating_capacity": seating_capacity,
                    "classroom_type": classroom_type,
                    "classroom_id": classroom_id,
                },
            )

            db.session.commit()
            flash("教室情報が正常に更新されました。", "success")

        # 教室情報の取得
        query = text(
            """
            SELECT classroom_id, floor, classroom_type, seating_capacity 
            FROM classrooms
            ORDER BY classroom_id
        """
        )

        result = db.session.execute(query)
        classrooms = []
        for row in result:
            classroom = {
                "classroom_id": row[0],
                "floor": row[1],
                "classroom_type": row[2],
                "seating_capacity": row[3],
            }
            classrooms.append(classroom)

        return render_template("register_classroom.html", classrooms=classrooms)

    except Exception as err:
        db.session.rollback()
        flash(f"データベースエラーが発生しました: {err}", "error")
        return render_template("register_classroom.html", classrooms=[])


def get_dates(year=None, month=None):
    """カレンダーの日付を取得"""
    today = datetime.now()  # 関数の先頭で定義
    
    if year is None or month is None:
        year = today.year
        month = today.month
    
    # 月初めと月末の日付を取得
    first_day = datetime(year, month, 1)
    if month == 12:
        last_day = datetime(year + 1, 1, 1) - timedelta(days=1)
    else:
        last_day = datetime(year, month + 1, 1) - timedelta(days=1)
    
    # カレンダーの週データを取得
    cal = monthcalendar(year, month)
    
    dates = []
    for week in cal:
        week_dates = []
        for day in week:
            if day == 0:
                week_dates.append(None)
            else:
                date = datetime(year, month, day)
                week_dates.append({
                    'date': date.strftime('%Y-%m-%d'),
                    'is_today': date.date() == today.date(),
                    'is_past': date.date() < today.date(),
                    'day_of_week': date.strftime('%a')
                })
        dates.append(week_dates)
    
    return {
        'year': year,
        'month': month,
        'weeks': dates
    }


def get_prev_month(year=None, month=None):
    """前月の年月を取得"""
    if year is None or month is None:
        today = datetime.now()
        year = today.year
        month = today.month
    
    if month == 1:  # todayをmonthに変更
        return {
            'year': year - 1,  # today.yearをyearに変更
            'month': 12
        }
    return {
        'year': year,  # today.yearをyearに変更
        'month': month - 1  # today.monthをmonthに変更
    }


def get_next_month(year=None, month=None):
    """翌月の年月を取得"""
    if year is None or month is None:
        today = datetime.now()
        year = today.year
        month = today.month
    
    if month == 12:  # todayをmonthに変更
        return {
            'year': year + 1,  # today.yearをyearに変更
            'month': 1
        }
    return {
        'year': year,  # today.yearをyearに変更
        'month': month + 1  # today.monthをmonthに変更
    }


@bp.route('/')
@login_required
def index():
    """教室一覧表示"""
    classrooms = Classroom.query.all()
    return render_template('student/classroom/index.html', classrooms=classrooms)


# CSRFトークンを文字列として扱う
def get_csrf_token():
    return generate_csrf()


@bp.route("/empty")
@bp.route("/empty/<int:year>/<int:month>")
@login_required
def view_empty_classroom(year=None, month=None):
    """空き教室一覧を表示"""
    if year is None or month is None:
        today = datetime.now()
        return redirect(url_for(
            'student.classroom.view_empty_classroom',
            year=today.year,
            month=today.month
        ))
        
    student_id = session.get('student_id')
    student = Student.query.filter_by(student_id=student_id).first()
    
    if not student:
        flash('学生情報が見つかりません。', 'error')
        return redirect(url_for('student.auth.login'))
    
    # 月初めと月末の日付を正しく計算
    start_date = datetime(year, month, 1)
    if month == 12:
        end_date = datetime(year + 1, 1, 1) - timedelta(days=1)
    else:
        end_date = datetime(year, month + 1, 1) - timedelta(days=1)
    
    # 空き教室データの取得
    empty_rooms = db.session.query(EmptyClassroom).filter(
        EmptyClassroom.date_info.between(start_date, end_date)
    ).all()

    # 空き教室データを辞書形式に変換（periodから「限」を削除）
    empty_rooms_list = [
        {
            'classroom_id': room.classroom_id,
            'date_info': room.date_info.strftime('%Y-%m-%d'),
            'period': room.period.replace('限', '')  # '1限' → '1' に変換
        }
        for room in empty_rooms
    ]

    return render_template(
        "student/classroom/empty_classroom.html",
        student=student,
        csrf_token=get_csrf_token(),
        dates=get_dates(year, month),
        prev_month=get_prev_month(year, month),
        next_month=get_next_month(year, month),
        empty_rooms=empty_rooms_list,
        common_schedules=[]
    )


def get_period_from_time(time_str):
    """時刻から時限を取得する"""
    hour = int(time_str.split(":")[0])
    if 9 <= hour < 10:
        return "1限"
    elif 10 <= hour < 12:
        return "2限"
    elif 13 <= hour < 14:
        return "3限"
    elif 14 <= hour < 16:
        return "4限"
    elif 16 <= hour < 17:
        return "5限"
    elif 17 <= hour < 18:
        return "6限"
    elif 18 <= hour < 21:
        return "夜間"
    else:
        return "空き"


@bp.route("/empty_classroom", methods=["GET"])
def register_empty_classroom():
    try:
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

        # 共通スケジュール情報を取得
        common_query = text("""
            SELECT classroom_id, date, period
            FROM common_schedules
            WHERE YEAR(date) = :year 
            AND MONTH(date) = :month
        """)

        try:
            common_result = db.session.execute(common_query, {
                "year": year,
                "month": month
            })

            common_schedules = []
            for row in common_result:
                date_obj = row[1]
                weekday_en = date_obj.strftime("%a")
                weekday_jp = weekdays[weekday_en]
                formatted_date = date_obj.strftime(f"%Y年%m月%d日({weekday_jp})")

                common_schedules.append({
                    "classroom_id": str(row[0]),
                    "formatted_date": formatted_date,
                    "period": row[2]
                })

            # 空き教室データを取得
            empty_rooms_query = text("""
                SELECT classroom_id, date_info, period
                FROM empty_classrooms
                WHERE YEAR(date_info) = :year 
                AND MONTH(date_info) = :month
                ORDER BY date_info, classroom_id, period
            """)

            empty_result = db.session.execute(empty_rooms_query, {
                "year": year,
                "month": month
            })

            empty_rooms = []
            for row in empty_result:
                date_obj = row[1]
                weekday_en = date_obj.strftime("%a")
                weekday_jp = weekdays[weekday_en]
                formatted_date = date_obj.strftime(f"%Y年%m月%d日({weekday_jp})")

                empty_rooms.append({
                    "classroom_id": str(row[0]),
                    "formatted_date": formatted_date,
                    "period": row[2]
                })

            return render_template(
                "classroom/register_empty_classroom.html",
                dates=dates,
                prev_month=prev_month,
                next_month=next_month,
                empty_rooms=empty_rooms,
                common_schedules=common_schedules
            )

        except Exception as e:
            current_app.logger.error(f"データベースエラーが発生しました: {str(e)}")
            return render_template(
                "classroom/register_empty_classroom.html",
                dates=dates,
                prev_month=prev_month,
                next_month=next_month,
                empty_rooms=[],
                common_schedules=[]
            )

    except Exception as e:
        current_app.logger.error(f"エラーが発生しました: {str(e)}")
        return redirect(url_for("views.index"))


@bp.route("/class", methods=["GET", "POST"])
def register_class():
    try:
        if request.method == "POST":
            department_letters = request.form.get("department_letters")
            department_number = request.form.get("department_number")
            class_letter = request.form.get("class_letter")
            teacher_id = request.form.get("teacher_id")

            # クラス情報の登録
            insert_query = text("""
                INSERT INTO classes 
                (department_letters, department_number, class_letter, teacher_id)
                VALUES (:department_letters, :department_number, :class_letter, :teacher_id)
            """)

            db.session.execute(insert_query, {
                "department_letters": department_letters,
                "department_number": department_number,
                "class_letter": class_letter,
                "teacher_id": teacher_id
            })

            db.session.commit()
            flash("クラス情報を登録しました。", "success")
            return redirect(url_for("views.index"))

        # 教員一覧の取得
        teachers_query = text("SELECT teacher_id, name FROM teachers ORDER BY name")
        teachers = db.session.execute(teachers_query).fetchall()

        # 既存のクラス一覧を取得
        classes_query = text("""
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
        """)
        classes = db.session.execute(classes_query).fetchall()

        return render_template(
            "register_class.html",
            teachers=teachers,
            classes=classes
        )

    except Exception as e:
        db.session.rollback()
        flash(f"エラーが発生しました: {str(e)}", "error")
        return redirect(url_for("views.index"))


@bp.route("/register/api/update-empty-classroom", methods=["POST"])
def update_empty_classroom():
    """空き教室情報を更新するAPIエンドポイント"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "データが送信されていません"}), 400

        room = data.get("room")
        date = data.get("date")
        period = data.get("period")
        is_empty = data.get("is_empty")

        if not all([room, date, period, is_empty is not None]):
            return jsonify({"success": False, "error": "必要なデータが不足しています"}), 400

        # 日付の変換（例：2025年01月01日(水) → 2025-01-01）
        try:
            date_without_weekday = date.split("(")[0]
            date_obj = datetime.strptime(date_without_weekday, "%Y年%m月%d日")
            formatted_date = date_obj.strftime("%Y-%m-%d")
        except ValueError as e:
            return jsonify({"success": False, "error": f"日付の形式が不正です: {str(e)}"}), 400

        try:
            # 共通スケジュールでの使用状況を確認
            check_common_query = text("""
                SELECT common_schedule_id 
                FROM common_schedules 
                WHERE classroom_id = :room 
                AND date = :date 
                AND period = :period
            """)

            common_result = db.session.execute(check_common_query, {
                "room": room,
                "date": formatted_date,
                "period": period
            }).fetchone()

            if common_result:
                return jsonify({
                    "success": False,
                    "error": "この教室は共通スケジュールで使用されているため、空き教室として登録できません"
                }), 400

            # 既存のレコードを確認
            check_existing_query = text("""
                SELECT empty_classroom_id FROM empty_classrooms 
                WHERE classroom_id = :room AND date_info = :date AND period = :period
            """)

            existing_result = db.session.execute(check_existing_query, {
                "room": room,
                "date": formatted_date,
                "period": period
            }).fetchone()

            if existing_result and not is_empty:
                # 空き教室でなくなった場合はレコードを削除
                delete_query = text("""
                    DELETE FROM empty_classrooms 
                    WHERE classroom_id = :room AND date_info = :date AND period = :period
                """)
                db.session.execute(delete_query, {
                    "room": room,
                    "date": formatted_date,
                    "period": period
                })
            elif not existing_result and is_empty:
                # 空き教室になった場合は新しいレコードを挿入
                insert_query = text("""
                    INSERT INTO empty_classrooms (classroom_id, date_info, period)
                    VALUES (:room, :date, :period)
                """)
                db.session.execute(insert_query, {
                    "room": room,
                    "date": formatted_date,
                    "period": period
                })

            db.session.commit()
            return jsonify({"success": True, "message": "空き教室情報を更新しました"})

        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Database error: {str(e)}")
            return jsonify({"success": False, "error": f"データベースエラー: {str(e)}"}), 500

    except Exception as e:
        current_app.logger.error(f"Request error: {str(e)}")
        return jsonify({"success": False, "error": f"リクエストエラー: {str(e)}"}), 400


@bp.route("/register/api/commit-empty-classroom", methods=["POST"])
def commit_empty_classroom():
    """空き教室情報のコミットを処理するAPIエンドポイント"""
    try:
        db.session.commit()
        return jsonify(
            {"success": True, "message": "空き教室情報が正常に保存されました"}
        )
    except Exception as e:
        db.session.rollback()
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


@bp.route('/api/empty')
@login_required
def get_empty_classrooms():
    """空き教室API"""
    empty_classrooms = EmptyClassroom.query.all()
    return jsonify([c.to_dict() for c in empty_classrooms])


@bp.route('/api/classrooms')
def get_classrooms_api():
    """教室一覧を取得するAPI"""
    try:
        # 教室情報を取得
        classrooms = Classroom.query.order_by(Classroom.classroom_id).all()
        
        return jsonify([{
            'id': classroom.classroom_id,
            'code': classroom.classroom_code,
            'name': classroom.classroom_name,
            'capacity': classroom.capacity
        } for classroom in classrooms])
    except Exception as e:
        current_app.logger.error(f"Error in get_classrooms_api: {str(e)}")
        return jsonify({'error': str(e)}), 500


# 静的ファイルのパスを設定するヘルパー関数を追加
@bp.context_processor
def inject_static_url():
    """静的ファイルのURLを提供するヘルパー関数"""
    def static_url(filename):
        return url_for('static', filename=filename)
    return dict(static_url=static_url)
