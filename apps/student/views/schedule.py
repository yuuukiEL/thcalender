from flask import Blueprint, render_template, jsonify, request, session, current_app, send_from_directory
from apps.models.schedule import StudentSchedule
from apps.student.models.personal_schedule import StudentPersonalSchedule
from apps.extensions import db
from flask_login import login_required, current_user
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo
from apps.models.teacher import Teacher
from apps.models.classroom import Classroom
from apps.auth import student_login_required
import json
import os
from werkzeug.utils import secure_filename
import time
import logging

from apps.student.views.schedule_utils import from_jst_string, get_schedule_by_day_period, update_or_create_schedule, delete_schedule

schedule = Blueprint('schedule', __name__)

@schedule.route('/index')
@login_required
def schedule_view():
    return render_template('student/calendar/index.html')

@schedule.route('/api/events')
@login_required
def get_events():
    try:
        student_id = session.get('student_id')
        if not student_id:
            return jsonify([])

        # 個人スケジュール取得
        personal_schedules = StudentPersonalSchedule.query.filter_by(
            student_id=student_id
        ).all()

        events = []
        for s in personal_schedules:
            # タイムゾーン情報を付加してJST時刻を返す
            start_time = s.start_time.replace(tzinfo=ZoneInfo("Asia/Tokyo"))
            end_time = s.end_time.replace(tzinfo=ZoneInfo("Asia/Tokyo"))
            
            # 終了時刻が翌日の0時の場合は23:59に調整
            if end_time.hour == 0 and end_time.minute == 0:
                end_time = end_time - timedelta(minutes=1)
            
            event = {
                'id': f'personal_{s.schedule_id}',
                'title': s.title,
                'start': start_time.isoformat(),
                'end': end_time.isoformat(),
                'location': s.location,
                'description': s.description,
                'type': 'personal'
            }
            events.append(event)

        return jsonify(events)
    except Exception as e:
        logging.error(f"イベント取得エラー: {e}")
        return jsonify([])

@schedule.route('/api/common-schedules')
@login_required
def get_common_schedules():
    """共通スケジュールを取得"""
    try:
        student_id = session.get('student_id')
        if not student_id:
            return jsonify([])

        schedules = StudentSchedule.query.filter_by(
            student_id=student_id
        ).all()
        return jsonify([s.to_dict() for s in schedules])
    except Exception as e:
        logging.error(f"共通スケジュール取得エラー: {e}")
        return jsonify([])

@schedule.route('/display')
@login_required
def display_data():
    """時間割表示ページ"""
    schedule_data = StudentSchedule.query.filter_by(student_id=current_user.student_id).all()
    return render_template('student/schedule/display.html', data=schedule_data) 

@schedule.route('/api/personal-schedules', methods=['GET'])
@login_required
def get_personal_schedules():
    """個人スケジュールを取得（自分の予定のみ）"""
    try:
        student_id = session.get('student_id')
        if not student_id:
            return jsonify([])

        schedules = StudentPersonalSchedule.query.filter_by(
            student_id=student_id
        ).all()
        return jsonify([s.to_dict() for s in schedules])
    except Exception as e:
        logging.error(f"個人スケジュール取得エラー: {e}")
        return jsonify([])

@schedule.route('/api/personal-schedule', methods=['POST'])
@login_required
def create_personal_schedule():
    """個人スケジュールを作成"""
    try:
        student_id = session.get('student_id')
        if not student_id:
            return jsonify({"error": "学生IDが見つかりません", "success": False}), 400

        data = request.get_json()
        logging.debug("受信データ: %s", data)

        # フロントエンドから受け取った日時をパース
        start_time_str = data['start_datetime']
        end_time_str = data['end_datetime']
        
        # タイムゾーン情報がない場合はJSTとして解釈
        if 'Z' in start_time_str or '+' not in start_time_str:
            start_time_str = start_time_str.replace('Z', '') + '+09:00'
        if 'Z' in end_time_str or '+' not in end_time_str:
            end_time_str = end_time_str.replace('Z', '') + '+09:00'
            
        start_time = datetime.fromisoformat(start_time_str)
        end_time = datetime.fromisoformat(end_time_str)
        
        # タイムゾーン情報を確認
        if not start_time.tzinfo:
            jst = ZoneInfo("Asia/Tokyo")
            start_time = start_time.replace(tzinfo=jst)
            end_time = end_time.replace(tzinfo=jst)

        logging.debug("変換後の時刻: %s", {
            "start": start_time.isoformat(),
            "end": end_time.isoformat()
        })

        # 基本のスケジュール作成
        schedule = StudentPersonalSchedule(
            student_id=student_id,
            title=data['title'],
            description=data.get('description', ''),
            location=data.get('location', ''),
            start_time=start_time,
            end_time=end_time,
            is_private=data.get('is_private', True)
        )
        
        db.session.add(schedule)
        db.session.commit()

        # レスポンスデータを作成
        response_data = schedule.to_dict()
        response_data.update({
            'start': start_time.isoformat(),
            'end': end_time.isoformat()
        })

        logging.debug("レスポンスデータ: %s", response_data)

        return jsonify({
            "success": True,
            "message": "スケジュールを作成しました",
            "data": response_data
        }), 201

    except Exception as e:
        logging.error(f"個人スケジュール作成エラー: {e}")
        import traceback
        logging.error(traceback.format_exc())
        db.session.rollback()
        return jsonify({"error": str(e), "success": False}), 400

@schedule.route('/api/personal-schedule/<schedule_id>', methods=['PUT'])
@login_required
def update_personal_schedule(schedule_id):
    """個人スケジュールを更新"""
    try:
        student_id = session.get('student_id')
        # schedule_idからpersonal_プレフィックスを削除
        schedule_id = schedule_id.replace('personal_', '')
        
        # スケジュールの存在確認
        schedule = StudentPersonalSchedule.query.get(int(schedule_id))
        if not schedule:
            return jsonify({"error": "スケジュールが見つかりません", "success": False}), 404
        
        # 権限チェック
        if schedule.student_id != student_id:
            return jsonify({"error": "権限がありません", "success": False}), 403

        data = request.get_json()
        logging.debug("更新データ: %s", data)
        
        # 日時の処理
        start_time_str = data['start_datetime']
        end_time_str = data['end_datetime']
        
        # タイムゾーン情報がない場合はJSTとして解釈
        if 'Z' in start_time_str or '+' not in start_time_str:
            start_time_str = start_time_str.replace('Z', '') + '+09:00'
        if 'Z' in end_time_str or '+' not in end_time_str:
            end_time_str = end_time_str.replace('Z', '') + '+09:00'
            
        start_time = datetime.fromisoformat(start_time_str)
        end_time = datetime.fromisoformat(end_time_str)
        
        # タイムゾーン情報を確認
        if not start_time.tzinfo:
            jst = ZoneInfo("Asia/Tokyo")
            start_time = start_time.replace(tzinfo=jst)
            end_time = end_time.replace(tzinfo=jst)

        # スケジュール更新
        schedule.title = data.get('title', schedule.title)
        schedule.description = data.get('description', schedule.description)
        schedule.location = data.get('location', schedule.location)
        schedule.start_time = start_time
        schedule.end_time = end_time
        schedule.is_private = data.get('is_private', schedule.is_private)

        db.session.commit()
        
        # 更新後のデータを返す
        response_data = schedule.to_dict()
        response_data.update({
            'start': start_time.isoformat(),
            'end': end_time.isoformat()
        })
        
        return jsonify({"success": True, "data": response_data})
    except Exception as e:
        logging.error(f"個人スケジュール更新エラー: {e}")
        import traceback
        logging.error(traceback.format_exc())
        db.session.rollback()
        return jsonify({"error": str(e), "success": False}), 400

@schedule.route('/api/personal-schedule/<schedule_id>', methods=['DELETE'])
@login_required
def delete_personal_schedule(schedule_id):
    """個人スケジュールを削除"""
    try:
        student_id = session.get('student_id')
        if not student_id:
            return jsonify({"error": "学生IDが見つかりません", "success": False}), 400

        # schedule_idからpersonal_プレフィックスを削除
        schedule_id = int(schedule_id.replace('personal_', ''))
        
        # スケジュールの存在確認
        schedule = db.session.query(StudentPersonalSchedule).filter(
            StudentPersonalSchedule.schedule_id == schedule_id,
            StudentPersonalSchedule.student_id == student_id
        ).first()
        
        if not schedule:
            return jsonify({"error": "スケジュールが見つかりません", "success": False}), 404
        
        # 権限チェック
        if schedule.student_id != student_id:
            return jsonify({"error": "権限がありません", "success": False}), 403

        logging.debug(f"スケジュール削除: ID={schedule_id}, タイトル={schedule.title}")
        
        # 削除実行
        db.session.delete(schedule)
        db.session.commit()
        
        logging.debug(f"スケジュール削除完了: ID={schedule_id}")
        return jsonify({
            "success": True,
            "message": "スケジュールを削除しました",
            "deleted_id": schedule_id
        }), 200
        
    except Exception as e:
        logging.error(f"個人スケジュール削除エラー: {e}")
        import traceback
        logging.error(traceback.format_exc())
        db.session.rollback()
        return jsonify({"error": str(e), "success": False}), 400

@schedule.route('/api/schedule/cell', methods=['GET'])
@student_login_required
def handle_schedule_cell():
    """時間割セルのAPI"""
    try:
        # ログ出力を削除するか、デバッグレベルに変更
        day = request.args.get('day')
        period = request.args.get('period')
        logging.debug(f"リクエスト情報: day={day}, period={period}")
        
        if not day or not period:
            return jsonify({'error': '曜日と時限は必須です'}), 400
        
        # 学生IDを取得
        student_id = session.get('student_id')
        logging.debug(f"学生ID: {student_id}")
        
        if not student_id:
            return jsonify({'error': '学生IDが見つかりません'}), 400
        
        # スケジュールを取得
        schedule = get_schedule_by_day_period(student_id, day, period)
        logging.debug(f"取得したスケジュール: {schedule}")
        
        # スケジュールが存在しない場合は空のオブジェクトを返す
        if schedule is None:
            logging.debug(f"スケジュールなし: student_id={student_id}, day={day}, period={period}")
            return jsonify({})
            
        return jsonify(schedule)
    except Exception as e:
        current_app.logger.error(f"スケジュール取得エラー: {str(e)}")
        print(f"スケジュール取得エラー: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@schedule.route('/api/teachers', methods=['GET'])
@student_login_required
def get_teachers():
    """教員リストを取得するAPI"""
    try:
        teachers = Teacher.query.all()
        return jsonify([{
            'teacher_id': teacher.teacher_id,
            'name': teacher.name
        } for teacher in teachers])
    except Exception as e:
        current_app.logger.error(f"教員リスト取得エラー: {str(e)}")
        return jsonify({'error': '教員リストの取得に失敗しました'}), 500

@schedule.route('/api/classrooms', methods=['GET'])
@student_login_required
def get_classrooms():
    """教室リストを取得するAPI"""
    try:
        classrooms = Classroom.query.all()
        classroom_list = []
        
        for classroom in classrooms:
            classroom_data = {
                'classroom_id': classroom.classroom_id
            }
            
            # floor属性が存在する場合は追加
            if hasattr(classroom, 'floor'):
                classroom_data['floor'] = str(classroom.floor)  # 数値を文字列に変換
            else:
                # デフォルト値を設定
                classroom_data['floor'] = '7'  # 最小階数をデフォルトに
            
            # buildingとcapacity属性が存在する場合のみ追加
            if hasattr(classroom, 'building'):
                classroom_data['building'] = classroom.building
            else:
                classroom_data['building'] = ''  # デフォルト値を設定
                
            if hasattr(classroom, 'capacity'):
                classroom_data['capacity'] = classroom.capacity
            
            classroom_list.append(classroom_data)
            
        return jsonify(classroom_list)
    except Exception as e:
        current_app.logger.error(f"教室リスト取得エラー: {str(e)}")
        return jsonify({'error': '教室リストの取得に失敗しました'}), 500

@schedule.route('/api/upload_schedule_file', methods=['POST'])
@login_required
def upload_schedule_file():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'ファイルがありません'}), 400
            
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'ファイルが選択されていません'}), 400
        
        # セッションからstudent_idを取得
        student_id = session.get('student_id')
        if not student_id:
            return jsonify({'error': '学生IDが見つかりません'}), 400
        
        # ファイル名を安全に処理
        filename = secure_filename(file.filename)
        
        # 保存先ディレクトリ (student_idのフォルダを作成)
        upload_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], 'schedules', student_id)
        os.makedirs(upload_dir, exist_ok=True)
        
        # ファイルを保存
        file_path = os.path.join(upload_dir, filename)
        file.save(file_path)
        
        # ファイルのパスを返す
        return jsonify({
            'file_url': f"/uploads/schedules/{student_id}/{filename}"
        })
    except Exception as e:
        current_app.logger.error(f"ファイルアップロードエラー: {str(e)}")
        return jsonify({'error': str(e)}), 500

@schedule.route('/api/schedule/cell', methods=['PUT'])
@student_login_required
def update_schedule_cell():
    """時間割を更新するAPI"""
    try:
        # リクエストパラメータを取得
        day = request.args.get('day')
        period = request.args.get('period')
        if not day or not period:
            return jsonify({'error': '曜日と時限は必須です'}), 400
        
        # リクエストボディを取得
        data = request.get_json()
        print(f"受信データ: {data}")
        
        # 学生IDを取得
        student_id = session.get('student_id')
        if not student_id:
            return jsonify({'error': '学生IDが見つかりません'}), 400
        
        # ファイルURLが一時ファイルの場合、正式なファイル名に変更
        schedule_file_url = data.get('schedule_file_url')
        if schedule_file_url and 'temp_' in schedule_file_url:
            # 既存のスケジュールを取得
            existing_schedule = get_schedule_by_day_period(student_id, day, period)
            schedule_id = existing_schedule.get('id') if existing_schedule else None
            
            if schedule_id:
                # 一時ファイルのパスから正式なファイル名を生成
                file_name = os.path.basename(schedule_file_url)
                file_ext = os.path.splitext(file_name)[1]
                new_filename = f"{schedule_id}_{student_id}{file_ext}"
                
                # ファイルの保存先パス
                upload_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], 'schedules', student_id)
                old_path = os.path.join(upload_dir, file_name)
                new_path = os.path.join(upload_dir, new_filename)
                
                # ファイル名を変更
                if os.path.exists(old_path):
                    os.rename(old_path, new_path)
                    data['schedule_file_url'] = f"/uploads/schedules/{student_id}/{new_filename}"
        
        # スケジュールを更新
        schedule = update_or_create_schedule(
            student_id=student_id,
            day=day,
            period=int(period),
            subject_name=data.get('subject_name'),
            teacher_id=data.get('teacher_id'),
            classroom_id=data.get('classroom_id'),
            schedule_file_url=data.get('schedule_file_url'),
            content=data.get('content')
        )
        
        # 更新後、ファイル名を正式なものに変更（新規作成の場合）
        if schedule and not schedule.get('error') and schedule_file_url and 'temp_' in schedule_file_url:
            schedule_id = schedule.get('id')
            if schedule_id:
                # 一時ファイルのパスから正式なファイル名を生成
                file_name = os.path.basename(schedule_file_url)
                file_ext = os.path.splitext(file_name)[1]
                new_filename = f"{schedule_id}_{student_id}{file_ext}"
                
                # ファイルの保存先パス
                upload_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], 'schedules', student_id)
                old_path = os.path.join(upload_dir, file_name)
                new_path = os.path.join(upload_dir, new_filename)
                
                # ファイル名を変更
                if os.path.exists(old_path):
                    os.rename(old_path, new_path)
                    
                    # スケジュールのファイルURLを更新
                    updated_url = f"/uploads/schedules/{student_id}/{new_filename}"
                    update_schedule_file_url(schedule_id, updated_url)
                    schedule['schedule_file_url'] = updated_url
        
        if schedule and schedule.get('error'):
            return jsonify({'error': schedule['error']}), 400
            
        return jsonify(schedule)
    except Exception as e:
        current_app.logger.error(f"スケジュール更新エラー: {str(e)}")
        return jsonify({'error': str(e)}), 500

def update_schedule_file_url(schedule_id, file_url):
    """スケジュールのファイルURLを更新する補助関数"""
    try:
        schedule = StudentSchedule.query.get(schedule_id)
        if schedule:
            schedule.schedule_file_url = file_url
            db.session.commit()
            return True
        return False
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"ファイルURL更新エラー: {str(e)}")
        return False

@schedule.route('/uploads/<path:filename>')
def uploaded_file(filename):
    """アップロードされたファイルを提供するルート"""
    upload_folder = current_app.config['UPLOAD_FOLDER']
    return send_from_directory(upload_folder, filename) 