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
from apps.models import Classroom, EmptyClassroom, CourseMaster, Teacher
from ...extensions import db
from .auth import login_required, admin_required

bp = Blueprint("classroom", __name__)

@bp.route("/classroom", methods=["GET", "POST"])
def register_classroom():
    try:
        if request.method == "POST":
            classroom_id = request.form["classroom_number"]
            floor = request.form["floor"]
            seating_capacity = request.form["seating_capacity"]
            room_type = request.form["classroom_type"]

            # 既存の教室を検索
            classroom = Classroom.query.get(classroom_id)
            if classroom:
                # 既存の教室情報を更新
                classroom.floor = floor
                classroom.seating_capacity = seating_capacity
                classroom.room_type = room_type
            else:
                # 新規教室を作成
                classroom = Classroom(
                    classroom_id=classroom_id,
                    floor=floor,
                    seating_capacity=seating_capacity,
                    room_type=room_type
                )
                db.session.add(classroom)

            db.session.commit()
            flash("教室情報が正常に更新されました。", "success")

        # 教室情報の取得
        classrooms = Classroom.query.all()
        classroom_list = [classroom.to_dict() for classroom in classrooms]

        return render_template("register_classroom.html", classrooms=classroom_list)

    except Exception as err:
        db.session.rollback()
        flash(f"データベースエラーが発生しました: {err}", "error")
        return render_template("register_classroom.html", classrooms=[])

@bp.route("/empty_classroom", methods=["GET"])
def register_empty_classroom():
    # 現在の月を取得
    month = request.args.get("month", default=datetime.now().strftime("%Y-%m"), type=str)
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

    try:
        # 空き教室データを取得
        empty_rooms = EmptyClassroom.query.filter(
            db.extract('year', EmptyClassroom.created_at) == year,
            db.extract('month', EmptyClassroom.created_at) == month
        ).order_by(EmptyClassroom.created_at, EmptyClassroom.classroom_id, EmptyClassroom.period).all()

        # 日付フォーマットを修正
        empty_rooms_list = []
        for room in empty_rooms:
            date_obj = room.created_at
            weekday_en = date_obj.strftime("%a")
            weekday_jp = weekdays[weekday_en]
            formatted_date = date_obj.strftime(f"%Y年%m月%d日({weekday_jp})")

            period_index = {
                '1限': 1, '2限': 2, '3限': 3,
                '4限': 4, '5限': 5, '6限': 6,
                '夜間': 7
            }.get(room.period, 0)

            room_dict = {
                'classroom_id': room.classroom_id,
                'formatted_date': formatted_date,
                'period': room.period,
                'period_index': period_index
            }
            empty_rooms_list.append(room_dict)

        return render_template(
            "register_empty_classroom.html",
            dates=dates,
            prev_month=prev_month,
            next_month=next_month,
            empty_rooms=empty_rooms_list
        )

    except Exception as err:
        current_app.logger.error(f"Database error: {str(err)}")
        flash(f"データベースエラーが発生しました: {str(err)}", "error")
        return redirect(url_for("views.index"))

@bp.route("/api/update-empty-classroom", methods=["POST"])
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
        except ValueError as e:
            return jsonify({"success": False, "error": f"日付の形式が不正です: {str(e)}"}), 400

        # 既存の空き教室を検索
        empty_room = EmptyClassroom.query.filter_by(
            classroom_id=room,
            created_at=date_obj,
            period=period
        ).first()

        if empty_room and not is_empty:
            # 空き教室でなくなった場合はレコードを削除
            db.session.delete(empty_room)
        elif not empty_room and is_empty:
            # 空き教室になった場合は新しいレコードを挿入
            new_empty_room = EmptyClassroom(
                classroom_id=room,
                created_at=date_obj,
                period=period
            )
            db.session.add(new_empty_room)

        db.session.commit()
        return jsonify({"success": True, "message": "空き教室情報を更新しました"})

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Database error: {str(e)}")
        return jsonify({"success": False, "error": f"データベースエラー: {str(e)}"}), 500

@bp.route("/api/commit-empty-classroom", methods=["POST"])
def commit_empty_classroom():
    """空き教室情報のコミットを処理するAPIエンドポイント"""
    try:
        db.session.commit()
        return jsonify({"success": True, "message": "空き教室情報が正常に保存されました"})
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error committing empty classroom data: {str(e)}")
        return jsonify({
            "success": False,
            "error": "空き教室情報の保存中にエラーが発生しました"
        }), 500 