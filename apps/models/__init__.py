"""共通モデル定義"""
from flask_login import UserMixin
from ..extensions import db
import numpy as np
import pandas as pd

# 基本モデル
from .base import BaseModel

# システム関連
from .system import SystemConfig
from .teacher import Teacher
from .task import Task
from .bulletin import BulletinBoard
from .announcement import Announcement
from .elevator import building  # エレベーター関連を追加
from .api_settings import ApiSettings  # API設定を追加

# スケジュール関連
from .schedule import StudentSchedule

# 学生関連
from .student import Student

# その他のモデル
from .classroom import Classroom, EmptyClassroom
from .course import CourseMaster, SpecializationMaster
from .report import Report, ReportBoard
from .public_user import PublicUser
from .admin import Admin

# 古い参照を削除
StudentBaseSchedule = StudentSchedule  # 後方互換性のため

# データ分析用ユーティリティ関数
def get_model_stats(model_class, columns=None):
    """モデルの統計情報を取得（高速）"""
    df = model_class.to_dataframe()
    return model_class.analyze_data(df, columns or [])

def get_related_models_data(main_model, related_models, join_column):
    """関連モデルのデータを結合して取得（高速）"""
    main_df = main_model.to_dataframe()
    
    result = main_df
    for model in related_models:
        related_df = model.to_dataframe()
        result = pd.merge(result, related_df, on=join_column, how='left')
    
    return result

__all__ = [
    'BaseModel',
    'SystemConfig',
    'Teacher',
    'Task',
    'Hashtag',
    'Diary',
    'BulletinBoard',
    'Announcement',
    'building',  # エレベーター関連を追加
    'ApiSettings',  # API設定を追加
    'StudentSchedule',
    'StudentBaseSchedule',
    'StudentPersonalSchedule',
    'Student',
    'Classroom',
    'EmptyClassroom',
    'CourseMaster',
    'SpecializationMaster',
    'Report',
    'ReportBoard',
    'PublicUser',
    'Admin',
    'get_model_stats',
    'get_related_models_data'
]