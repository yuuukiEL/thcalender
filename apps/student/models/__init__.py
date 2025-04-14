"""学生関連のモデル定義"""
import numpy as np
import pandas as pd

# 基本的なモデル
from apps.models.student import Student
from apps.models.teacher import Teacher
from apps.models.announcement import Announcement
from apps.models.report import Report
from apps.models.course import CourseMaster, SpecializationMaster
from apps.models.api_settings import ApiSettings  # API設定を追加

# 学生固有のモデル
from .personal_schedule import StudentPersonalSchedule  # 先にインポート
from .schedule_base import StudentBaseSchedule
from .diary import Diary, DiaryImage, Hashtag, diary_hashtags
from .chat import PrivateChat
from .student_auth import StudentAuth
from .student_profile import StudentProfile
from .task import Task
from .student_api_connections import StudentApiConnection  # API接続を追加

# 機能モデル
from .schedule_utils import get_student_schedule

# 重複を避けるために、ローカルのScheduleCommentは削除または名前変更

# 以下の行を修正または削除
# from .bulletin import BulletinReaction

# 直接インポートする形に変更
from apps.models.bulletin import BulletinReactionModel

# 新しいモデルをインポート
from apps.student.models.security_question import StudentSecurityQuestion
from apps.student.models.contact import StudentContact

# 以下の行を削除（循環参照の原因）
# Student.security_question = db.relationship('StudentSecurityQuestion', backref='student', uselist=False)
# Student.contact = db.relationship('StudentContact', backref='student', uselist=False)

# 高速データ処理ユーティリティ
def get_student_stats(student_ids=None):
    """学生の統計情報を高速取得"""
    query = Student.query
    if student_ids:
        query = query.filter(Student.student_id.in_(student_ids))
    
    df = Student.to_dataframe(query)
    return Student.analyze_data(df, ['attendance_rate', 'gpa'])

def get_course_enrollment_stats():
    """コース登録状況の統計を高速取得"""
    students_df = Student.to_dataframe()
    courses_df = CourseMaster.to_dataframe()
    
    # コース別の学生数を集計
    enrollment = students_df.groupby('course_id').size().reset_index(name='count')
    
    # コース情報と結合
    result = pd.merge(enrollment, courses_df, on='course_id', how='left')
    
    return result

# 既存のインポート
from .student_review import StudentReview

__all__ = [
    'Student',
    'Teacher',
    'Announcement',
    'Report',
    'CourseMaster',
    'SpecializationMaster',
    'ApiSettings',  # API設定を追加
    'Diary',
    'DiaryImage',
    'Hashtag',
    'diary_hashtags',
    'StudentPersonalSchedule',
    'StudentBaseSchedule',
    'PrivateChat',
    'BulletinReactionModel',
    'StudentAuth',
    'StudentProfile',
    'Task',
    'StudentSecurityQuestion',
    'StudentContact',
    'StudentApiConnection',  # API接続を追加
    'get_student_stats',
    'get_course_enrollment_stats',
    'StudentReview',
] 