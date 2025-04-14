from datetime import datetime, timedelta
from typing import List, Dict, Any
from sqlalchemy import and_
from apps.extensions import db
from apps.database import BaseModel
from .schedule_base import StudentBaseSchedule
from .personal_schedule import StudentPersonalSchedule  # こちらから直接インポート
from apps.models.schedule import StudentSchedule  # StudentScheduleのみインポート
import logging

logger = logging.getLogger(__name__)

def check_schedule_conflicts(student_id: str, start_time: datetime, end_time: datetime, exclude_schedule_id=None) -> bool:
    """指定された時間帯に既存のスケジュールがあるかチェック"""
    try:
        return StudentPersonalSchedule.query.filter(
            and_(
                StudentPersonalSchedule.student_id == student_id,
                StudentPersonalSchedule.start_time <= end_time,
                StudentPersonalSchedule.end_time >= start_time
            )
        ).count() > 0
    except Exception as e:
        logger.error(f"スケジュール重複チェックエラー: {str(e)}")
        raise

def create_recurring_events(base_event: Dict[str, Any], repeat_type: str, repeat_until: datetime, is_new: bool = True) -> List[Dict[str, Any]]:
    """繰り返しイベントを作成"""
    try:
        events = []
        start_date = datetime.strptime(base_event['start'], '%Y-%m-%dT%H:%M:%S')
        end_date = datetime.strptime(base_event['end'], '%Y-%m-%dT%H:%M:%S')
        until_date = datetime.strptime(repeat_until, '%Y-%m-%d')
        
        # イベントの期間（時間）を計算
        duration = end_date - start_date
        
        # 新規作成時は最初の日付から、更新時は次の日付から開始
        current_date = start_date if is_new else get_next_date(start_date, repeat_type)
        
        while current_date.date() <= until_date.date():
            event = base_event.copy()
            event['start'] = current_date.strftime('%Y-%m-%dT%H:%M:%S')
            event['end'] = (current_date + duration).strftime('%Y-%m-%dT%H:%M:%S')
            
            # 既存のイベントとの重複をチェック
            if not check_schedule_conflicts(base_event['student_id'], current_date, current_date + duration):
                events.append(event)
            
            # 次の日付を計算
            current_date = get_next_date(current_date, repeat_type)
        
        return events
    except Exception as e:
        logger.error(f"繰り返しイベント作成エラー: {str(e)}")
        raise

def get_next_date(current_date: datetime, repeat_type: str) -> datetime:
    """次の日付を計算"""
    try:
        if repeat_type == 'daily':
            return current_date + timedelta(days=1)
        elif repeat_type == 'weekly':
            return current_date + timedelta(weeks=1)
        elif repeat_type == 'monthly':
            next_month = current_date.replace(day=1) + timedelta(days=32)
            return next_month.replace(day=min(current_date.day, (next_month.replace(day=1) - timedelta(days=1)).day))
        else:
            raise ValueError(f"不正な繰り返しタイプ: {repeat_type}")
    except Exception as e:
        logger.error(f"次の日付計算エラー: {str(e)}")
        raise

def get_schedule_by_date_range(student_id: str, start_date: datetime, end_date: datetime) -> List[Dict[str, Any]]:
    """指定された期間のスケジュールを取得"""
    try:
        # 授業スケジュールの取得
        class_schedules = StudentBaseSchedule.query.filter_by(student_id=student_id).all()
        schedule_list = [schedule.to_dict() for schedule in class_schedules]
        
        # 個人スケジュールの取得
        personal_schedules = StudentPersonalSchedule.query.filter(
            and_(
                StudentPersonalSchedule.student_id == student_id,
                StudentPersonalSchedule.start_time <= end_date,
                StudentPersonalSchedule.end_time >= start_date
            )
        ).all()
        schedule_list.extend([schedule.to_dict() for schedule in personal_schedules])
        
        return schedule_list
    except Exception as e:
        logger.error(f"スケジュール取得エラー: {str(e)}")
        raise

def get_student_schedule(student_id, start_date=None, end_date=None):
    """学生のスケジュールを取得する関数"""
    if not start_date:
        start_date = datetime.now()
    if not end_date:
        end_date = start_date + timedelta(days=7)

    # 個人スケジュール取得
    personal_schedules = StudentPersonalSchedule.query.filter(
        StudentPersonalSchedule.student_id == student_id,
        StudentPersonalSchedule.start_time >= start_date,
        StudentPersonalSchedule.end_time <= end_date
    ).all()

    return {
        'personal': [s.to_dict() for s in personal_schedules]
    }

class Calendar:
    """カレンダーモデル"""
    def __init__(self):
        self.events = []

    @staticmethod
    def get_schedule(start_date, end_date):
        """指定期間のスケジュールを取得"""
        try:
            schedules = StudentBaseSchedule.query.filter(
                and_(
                    StudentBaseSchedule.start_time >= start_date,
                    StudentBaseSchedule.end_time <= end_date
                )
            ).all()
            return [schedule.to_dict() for schedule in schedules]
        except Exception as e:
            logger.error(f"スケジュール取得エラー: {str(e)}")
            return [] 