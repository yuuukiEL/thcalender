"""スケジュール関連のユーティリティ関数"""
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from flask import current_app, jsonify, session, request
from flask_login import login_required
from sqlalchemy import and_, or_
from zoneinfo import ZoneInfo
import logging
import os

from apps.models.schedule import StudentSchedule
from apps.student.models.personal_schedule import StudentPersonalSchedule
from apps.extensions import db
from flask import Blueprint

# Blueprintを定義
bp = Blueprint('student_schedule_utils', __name__)

def get_student_schedules(student_id: str) -> List[Dict[str, Any]]:
    """学生の時間割を取得"""
    schedules = StudentSchedule.query.filter_by(student_id=student_id).all()
    return [schedule.to_dict() for schedule in schedules]

def get_personal_schedules(student_id: str) -> List[Dict[str, Any]]:
    """学生の個人スケジュールを取得"""
    schedules = StudentPersonalSchedule.query.filter_by(student_id=student_id).all()
    return [schedule.to_dict() for schedule in schedules]

def check_schedule_conflicts(student_id: str, start_time: datetime, end_time: datetime) -> bool:
    """スケジュールの重複をチェック"""
    # 既存の個人スケジュールとの重複チェック
    personal_conflicts = StudentPersonalSchedule.query.filter(
        StudentPersonalSchedule.student_id == student_id,
        and_(
            StudentPersonalSchedule.start_time < end_time,
            StudentPersonalSchedule.end_time > start_time
        )
    ).first()

    if personal_conflicts:
        return True

    # 授業スケジュールとの重複チェック
    day_of_week = start_time.strftime('%A')
    period = get_period_from_time(start_time.hour)
    
    class_conflicts = StudentSchedule.query.filter(
        StudentSchedule.student_id == student_id,
        StudentSchedule.day == day_of_week,
        StudentSchedule.period == period
    ).first()

    return bool(class_conflicts)

def create_recurring_events(
    student_id: str,
    title: str,
    description: str,
    start_time: datetime,
    end_time: datetime,
    recurrence_pattern: str,
    until_date: datetime
) -> List[Dict[str, Any]]:
    """定期的なイベントを作成"""
    events = []
    current_start = start_time
    current_end = end_time

    while current_start <= until_date:
        if not check_schedule_conflicts(student_id, current_start, current_end):
            event = StudentPersonalSchedule(
                student_id=student_id,
                title=title,
                description=description,
                start_time=current_start,
                end_time=current_end
            )
            db.session.add(event)
            events.append(event)

        # 次の繰り返しの日時を計算
        if recurrence_pattern == 'daily':
            current_start += timedelta(days=1)
            current_end += timedelta(days=1)
        elif recurrence_pattern == 'weekly':
            current_start += timedelta(weeks=1)
            current_end += timedelta(weeks=1)
        elif recurrence_pattern == 'monthly':
            # 月の日数を考慮して計算
            next_month = current_start.replace(day=1) + timedelta(days=32)
            current_start = next_month.replace(day=current_start.day)
            current_end = current_start + (end_time - start_time)

    db.session.commit()
    return [event.to_dict() for event in events]

def get_period_from_time(hour: int) -> Optional[int]:
    """時間から時限を取得"""
    period_map = {
        9: 1,   # 1限: 9:00-10:30
        10: 2,  # 2限: 10:40-12:10
        11: 3,  # 3限: 13:00-14:30
        13: 4,  # 4限: 14:40-16:10
        14: 5,  # 5限: 16:20-17:50
        15: 6   # 6限: 18:00-19:30
    }
    return period_map.get(hour)

def get_next_date(current_date: datetime, recurrence_type: str) -> datetime:
    """次の日付を取得"""
    if recurrence_type == 'daily':
        return current_date + timedelta(days=1)
    elif recurrence_type == 'weekly':
        return current_date + timedelta(weeks=1)
    elif recurrence_type == 'monthly':
        # 月の日数を考慮して計算
        next_month = current_date.replace(day=1) + timedelta(days=32)
        return next_month.replace(day=min(current_date.day, (next_month.replace(day=1) - timedelta(days=1)).day))
    return current_date

def get_schedule_by_date_range(
    student_id: str,
    start_date: datetime,
    end_date: datetime
) -> List[Dict[str, Any]]:
    """指定された期間のスケジュールを取得"""
    # 個人スケジュールを取得
    personal_schedules = StudentPersonalSchedule.query.filter(
        StudentPersonalSchedule.student_id == student_id,
        and_(
            StudentPersonalSchedule.start_time >= start_date,
            StudentPersonalSchedule.end_time <= end_date
        )
    ).all()

    # 授業スケジュールを取得
    class_schedules = StudentSchedule.query.filter_by(student_id=student_id).all()

    # 結果を格納するリスト
    events = []

    # 個人スケジュールをイベントリストに追加
    for schedule in personal_schedules:
        events.append({
            'id': f'personal_{schedule.id}',
            'title': schedule.title,
            'start': schedule.start_time.isoformat(),
            'end': schedule.end_time.isoformat(),
            'description': schedule.description,
            'type': 'personal'
        })

    # 授業スケジュールをイベントリストに追加
    for schedule in class_schedules:
        # 各日付に対してイベントを生成
        current_date = start_date
        while current_date <= end_date:
            if current_date.strftime('%A') == schedule.day:
                # 時限から時刻を計算
                period_times = {
                    1: ('09:00', '10:30'),
                    2: ('10:40', '12:10'),
                    3: ('13:00', '14:30'),
                    4: ('14:40', '16:10'),
                    5: ('16:20', '17:50'),
                    6: ('18:00', '19:30')
                }
                start_time, end_time = period_times.get(schedule.period, ('00:00', '00:00'))
                
                event_start = datetime.combine(current_date.date(), 
                                            datetime.strptime(start_time, '%H:%M').time())
                event_end = datetime.combine(current_date.date(), 
                                          datetime.strptime(end_time, '%H:%M').time())
                
                events.append({
                    'id': f'class_{schedule.schedule_id}_{current_date.date()}',
                    'title': schedule.subject_name,
                    'start': event_start.isoformat(),
                    'end': event_end.isoformat(),
                    'location': schedule.classroom_id,
                    'teacher': schedule.teacher.name if schedule.teacher else None,
                    'type': 'class'
                })
            
            current_date += timedelta(days=1)

    return events

def to_jst_datetime(dt):
    """日時をJSTに変換"""
    if dt is None:
        return None
    
    # タイムゾーン情報がない場合はJSTとして解釈
    if not dt.tzinfo:
        dt = dt.replace(tzinfo=ZoneInfo("Asia/Tokyo"))
    # 異なるタイムゾーンの場合はJSTに変換
    elif dt.tzinfo != ZoneInfo("Asia/Tokyo"):
        dt = dt.astimezone(ZoneInfo("Asia/Tokyo"))
    return dt

def from_jst_string(dt_str):
    """JST文字列から日時オブジェクトを作成"""
    if not dt_str:
        return None
    
    try:
        # タイムゾーン情報がない場合はJSTとして解釈
        if '+' not in dt_str and 'Z' not in dt_str:
            dt_str = dt_str + '+09:00'
        elif 'Z' in dt_str:
            dt_str = dt_str.replace('Z', '+00:00')
        
        dt = datetime.fromisoformat(dt_str)
        
        # タイムゾーン情報がない場合はJSTとして解釈
        if not dt.tzinfo:
            dt = dt.replace(tzinfo=ZoneInfo("Asia/Tokyo"))
        # 異なるタイムゾーンの場合はJSTに変換
        elif dt.tzinfo != ZoneInfo("Asia/Tokyo"):
            dt = dt.astimezone(ZoneInfo("Asia/Tokyo"))
            
        return dt
    except ValueError as e:
        logging.error(f"日時文字列のパース失敗: {dt_str}, エラー: {e}")
        return None

def convert_weekday_en_to_ja(weekday_en: str) -> str:
    """英語の曜日を日本語に変換"""
    weekday_map = {
        'Monday': '月',
        'Tuesday': '火',
        'Wednesday': '水',
        'Thursday': '木',
        'Friday': '金',
        'Saturday': '土',
        'Sunday': '日'
    }
    return weekday_map.get(weekday_en, '')

def convert_weekday_ja_to_en(weekday_ja: str) -> str:
    """日本語の曜日を英語に変換"""
    weekday_map = {
        '月': 'Monday',
        '火': 'Tuesday',
        '水': 'Wednesday',
        '木': 'Thursday',
        '金': 'Friday',
        '土': 'Saturday',
        '日': 'Sunday'
    }
    return weekday_map.get(weekday_ja, '')

def get_schedule_by_day_period(student_id, day, period):
    """曜日と時限からスケジュールを取得する"""
    try:
        # 日本語の曜日を英語に変換
        day_mapping = {
            '月': 'Monday',
            '火': 'Tuesday',
            '水': 'Wednesday',
            '木': 'Thursday',
            '金': 'Friday',
            '土': 'Saturday',
            '日': 'Sunday'
        }
        day_en = day_mapping.get(day, day)
        
        # ここのprint文をlogging.debugに変更
        logging.debug(f"スケジュール検索: student_id={student_id}, day={day}({day_en}), period={period}")
        
        # 以下の処理は変更なし
        schedule = StudentSchedule.query.filter_by(
            student_id=student_id,
            day=day_en,
            period=f"{period}限"
        ).first()
        
        if schedule:
            # ここのprint文もlogging.debugに変更
            result = schedule.to_dict()
            logging.debug(f"検索結果: {result}")
            return result
        
        # ここのprint文もlogging.debugに変更
        logging.debug(f"検索結果: None")
        return None
        
    except Exception as e:
        # エラーログはERRORレベルで出力
        logging.error(f"スケジュール検索エラー: {e}")
        return None

def update_or_create_schedule(student_id, day, period, subject_name, teacher_id=None, classroom_id=None, schedule_file_url=None, content=None):
    """スケジュールを更新または作成する"""
    try:
        # 日本語の曜日を英語に変換
        day_mapping = {
            '月': 'Monday', '火': 'Tuesday', '水': 'Wednesday', 
            '木': 'Thursday', '金': 'Friday', '土': 'Saturday', '日': 'Sunday'
        }
        
        # 日本語の曜日が来た場合は英語に変換
        day_en = day_mapping.get(day, day)
        
        # dayが空でないことを確認
        if not day_en:
            return {"error": "曜日が指定されていません"}
        
        # periodが整数であることを確認
        try:
            period = int(period)
        except (TypeError, ValueError):
            return {"error": "時限は整数である必要があります"}
        
        # 既存のスケジュールを検索（完全一致で検索）
        existing_schedule = StudentSchedule.query.filter_by(
            student_id=student_id,
            day=day_en,
            period=period
        ).first()
        
        # デバッグ出力
        print(f"検索条件: student_id={student_id}, day={day_en}, period={period}")
        print(f"既存スケジュール: {existing_schedule}")
        
        if existing_schedule:
            # 既存のスケジュールを更新
            existing_schedule.subject_name = subject_name
            
            # 教員IDが指定されている場合のみ更新
            if teacher_id:
                existing_schedule.teacher_id = teacher_id
            
            # 教室IDが指定されている場合のみ更新
            if classroom_id:
                existing_schedule.classroom_id = classroom_id
            
            # ファイルURLが指定されている場合のみ更新
            if schedule_file_url is not None:
                # 古いファイルが存在する場合は削除
                if existing_schedule.schedule_file_url:
                    try:
                        old_file_path = os.path.join(
                            current_app.config['UPLOAD_FOLDER'], 
                            existing_schedule.schedule_file_url.lstrip('/')
                        )
                        if os.path.exists(old_file_path):
                            os.remove(old_file_path)
                    except Exception as e:
                        current_app.logger.warning(f"古いファイル削除エラー: {str(e)}")
                
                existing_schedule.schedule_file_url = schedule_file_url
            
            # 内容が指定されている場合のみ更新
            if content is not None:
                existing_schedule.content = content
                
            db.session.commit()
            
            # 更新後のデータを取得して返す
            return existing_schedule.to_dict()
        else:
            # 新規スケジュールを作成
            try:
                new_schedule = StudentSchedule(
                    student_id=student_id,
                    day=day_en,
                    period=period,
                    subject_name=subject_name,
                    teacher_id=teacher_id if teacher_id else None,
                    classroom_id=classroom_id if classroom_id else None,
                    schedule_file_url=schedule_file_url,
                    content=content
                )
                
                db.session.add(new_schedule)
                db.session.commit()
                
                # 作成後のデータを取得して返す
                return new_schedule.to_dict()
            except Exception as inner_e:
                db.session.rollback()
                current_app.logger.error(f"新規スケジュール作成エラー: {str(inner_e)}")
                
                # 既存のレコードを再確認（別のトランザクションで作成された可能性）
                existing_schedule = StudentSchedule.query.filter_by(
                    student_id=student_id,
                    day=day_en,
                    period=period
                ).first()
                
                if existing_schedule:
                    # 既存のレコードを更新
                    existing_schedule.subject_name = subject_name
                    if teacher_id:
                        existing_schedule.teacher_id = teacher_id
                    if classroom_id:
                        existing_schedule.classroom_id = classroom_id
                    if schedule_file_url is not None:
                        existing_schedule.schedule_file_url = schedule_file_url
                    if content is not None:
                        existing_schedule.content = content
                    
                    db.session.commit()
                    return existing_schedule.to_dict()
                else:
                    # エラーを返す
                    return {"error": str(inner_e)}
            
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"スケジュール更新エラー: {str(e)}")
        return {"error": str(e)}

def delete_schedule(student_id: str, day: str, period: int) -> bool:
    """スケジュールを削除"""
    day_en = convert_weekday_ja_to_en(day)
    schedule = StudentSchedule.query.filter_by(
        student_id=student_id,
        day=day_en,
        period=period
    ).first()

    if schedule:
        db.session.delete(schedule)
        db.session.commit()
        return True
    return False

@bp.route('/api/schedule/all')
@login_required
def get_all_schedule_cells():
    """すべての時間割セルデータを一度に取得するAPI"""
    try:
        student_id = session.get('student_id')
        if not student_id:
            return jsonify({'error': '学生IDが見つかりません'}), 401
            
        # すべての曜日と時限の組み合わせに対するデータを一度に取得
        days = ['月', '火', '水', '木', '金', '土']
        periods = range(1, 8)  # 1〜7限
        
        # データベースからスケジュールを一括取得
        schedules = StudentPersonalSchedule.query.filter_by(
            student_id=student_id
        ).all()
        
        # 結果を整形
        result = {}
        for day in days:
            result[day] = {}
            for period in periods:
                result[day][str(period)] = {
                    'subject': '',
                    'teacher': '',
                    'classroom': '',
                    'color': ''
                }
        
        # 取得したスケジュールデータを結果に反映
        for schedule in schedules:
            if schedule.day in result and str(schedule.period) in result[schedule.day]:
                result[schedule.day][str(schedule.period)] = {
                    'subject': schedule.subject,
                    'teacher': schedule.teacher,
                    'classroom': schedule.classroom,
                    'color': schedule.color
                }
        
        return jsonify(result)
    except Exception as e:
        current_app.logger.error(f"Error getting all schedule cells: {str(e)}")
        return jsonify({'error': str(e)}), 500

@bp.route('/api/schedule/cell', methods=['GET', 'PUT', 'DELETE'])
def handle_schedule():
    try:
        # パラメータを取得
        day = request.args.get('day')
        period = request.args.get('period')
        student_id = session.get('student_id')

        if not all([day, period, student_id]):
            return jsonify({'error': '必要なパラメータが不足しています'}), 400

        # 日本語の曜日を英語に変換
        day_mapping = {
            '月': 'Monday',
            '火': 'Tuesday',
            '水': 'Wednesday',
            '木': 'Thursday',
            '金': 'Friday',
            '土': 'Saturday',
            '日': 'Sunday'
        }
        day_en = day_mapping.get(day, day)

        if request.method == 'DELETE':
            # スケジュールを削除
            schedule = StudentSchedule.query.filter_by(
                student_id=student_id,
                day=day_en,  # 英語の曜日を使用
                period=int(period)  # 文字列を整数に変換
            ).first()

            if schedule:
                try:
                    db.session.delete(schedule)
                    db.session.commit()
                    return jsonify({'success': True, 'message': 'スケジュールを削除しました'})
                except Exception as e:
                    db.session.rollback()
                    current_app.logger.error(f"スケジュール削除エラー: {str(e)}")
                    return jsonify({'error': 'スケジュールの削除に失敗しました'}), 500
            else:
                return jsonify({'error': 'スケジュールが見つかりません'}), 404

        # ... 既存のGET, PUTの処理 ...

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error handling schedule: {str(e)}")
        return jsonify({'error': str(e)}), 500

# 以下、既存のコード... 