from flask import Blueprint, render_template, request, jsonify, current_app, session
from flask_login import login_required, current_user
from apps.models.schedule import StudentSchedule, analyze_schedule_distribution
from apps.extensions import db
import numpy as np
import pandas as pd

bp = Blueprint('student_schedule_view', __name__, url_prefix='/student/api/schedule')

@bp.route('/cell', methods=['GET'])
@login_required
def get_schedule_cell():
    """個別のセル情報を取得（従来の方法）"""
    day = request.args.get('day')
    period = request.args.get('period')
    
    # current_userからstudent_idを取得する方法を修正
    student_id = request.args.get('student_id')
    if not student_id and hasattr(current_user, 'get_id'):
        student_id = current_user.get_id()
    
    # 指定された曜日・時限のスケジュールを取得
    schedule = StudentSchedule.query.filter_by(
        student_id=student_id,
        day=day,
        period=period
    ).first()
    
    if schedule:
        return jsonify(schedule.to_dict())
    else:
        return jsonify({})

@bp.route('/batch', methods=['GET'])
@login_required
def get_schedule_batch():
    """時間割データを一括取得（高速）"""
    # current_userからstudent_idを取得する方法を修正
    student_id = request.args.get('student_id')
    if not student_id and hasattr(current_user, 'get_id'):
        student_id = current_user.get_id()
    
    # デバッグ情報
    current_app.logger.info(f"バッチ取得: student_id={student_id}, current_user={current_user}, type={type(current_user)}")
    
    # 学生IDが取得できない場合はセッションから取得
    if not student_id and 'student_id' in session:
        student_id = session.get('student_id')
        current_app.logger.info(f"セッションから学生ID取得: {student_id}")
    
    # それでも取得できない場合は固定値を使用（テスト用）
    if not student_id:
        student_id = "20001"  # テスト用の学生ID
        current_app.logger.warning(f"学生IDが取得できないため、テスト用ID {student_id} を使用")
    
    # SQLで一度に全データを取得
    try:
        schedules = StudentSchedule.query.filter_by(student_id=student_id).all()
        current_app.logger.info(f"取得したスケジュール数: {len(schedules)}")
        
        # 結果を辞書に格納
        result = {}
        for schedule in schedules:
            try:
                # 日本語の曜日を使用
                key = f"{schedule.day}_{schedule.period}"
                schedule_dict = schedule.to_dict()
                result[key] = schedule_dict
                current_app.logger.debug(f"スケジュール変換成功: {key} -> {schedule_dict}")
            except Exception as e:
                current_app.logger.error(f"スケジュール変換エラー: {e}")
        
        return jsonify(result)
    except Exception as e:
        current_app.logger.error(f"スケジュール取得エラー: {e}")
        return jsonify({"error": str(e)}), 500

@bp.route('/matrix', methods=['GET'])
@login_required
def get_schedule_matrix():
    """時間割をマトリックス形式で取得（さらに高速）"""
    # current_userからstudent_idを取得する方法を修正
    student_id = request.args.get('student_id')
    if not student_id and hasattr(current_user, 'get_id'):
        student_id = current_user.get_id()
    
    # 曜日のマッピング
    days = ['月', '火', '水', '木', '金', '土', '日']
    day_map = {day: i for i, day in enumerate(days)}
    
    # 空のマトリックスを作成（7日×7時限）
    matrix = [[None for _ in range(7)] for _ in range(7)]
    
    # SQLで一度に全データを取得
    schedules = StudentSchedule.query.filter_by(student_id=student_id).all()
    
    # マトリックスにデータを配置
    for schedule in schedules:
        day_idx = day_map.get(schedule.day)
        period_idx = schedule.period - 1
        
        if 0 <= day_idx < 7 and 0 <= period_idx < 7:
            matrix[day_idx][period_idx] = schedule.to_dict()
    
    return jsonify({
        'matrix': matrix,
        'days': days
    })

@bp.route('/stats', methods=['GET'])
@login_required
def schedule_stats():
    """時間割の統計情報を取得"""
    stats = analyze_schedule_distribution(db.session)
    return jsonify(stats)

@bp.route('/view', methods=['GET'])
@login_required
def schedule_view():
    """時間割表示（最適化版）"""
    # current_userからstudent_idを取得する方法を修正
    student_id = None
    if hasattr(current_user, 'get_id'):
        student_id = current_user.get_id()
    
    # 一度のクエリで全スケジュールデータを取得
    schedules = StudentSchedule.query.filter_by(student_id=student_id).all()
    
    # NumPyとPandasを使って高速処理
    # スケジュールデータをDataFrameに変換
    schedule_data = []
    for s in schedules:
        schedule_data.append({
            'day': s.day,
            'period': s.period,
            'subject_name': s.subject_name,
            'teacher_name': s.teacher.name if s.teacher else '',
            'classroom_id': s.classroom.classroom_id if s.classroom else '',
            'schedule_id': s.schedule_id
        })
    
    # DataFrameに変換
    if schedule_data:
        df = pd.DataFrame(schedule_data)
        
        # 曜日と時限でピボットテーブルを作成
        schedule_matrix = df.pivot_table(
            index='day', 
            columns='period', 
            values=['subject_name', 'teacher_name', 'classroom_id', 'schedule_id'],
            aggfunc='first'
        ).to_dict()
    else:
        schedule_matrix = {}
    
    # 曜日と時限の定義
    days = ['月', '火', '水', '木', '金', '土']
    periods = list(range(1, 8))
    
    # 時間割の統計情報を取得
    stats = analyze_schedule_distribution(db.session)
    
    return render_template(
        'student/schedule.html',
        schedule_matrix=schedule_matrix,
        days=days,
        periods=periods,
        stats=stats
    ) 