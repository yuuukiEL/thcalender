from flask import Blueprint, render_template, request, jsonify, session, redirect, url_for, flash, current_app, send_file
from flask_wtf.csrf import generate_csrf
from flask_wtf import FlaskForm
from wtforms import StringField, TextAreaField
from wtforms.validators import DataRequired
from apps.models.diary import Diary, Hashtag, DiaryImage
from apps.models.task import Task
from apps.models.student import Student
from apps.extensions import db
from .register import login_required
from datetime import datetime
from sqlalchemy.exc import SQLAlchemyError
import json
import os
from werkzeug.utils import secure_filename
import io

diary = Blueprint('diary', __name__)

# アップロード設定
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'static', 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

class DiaryForm(FlaskForm):
    title = StringField('タイトル', validators=[DataRequired()])
    content = TextAreaField('内容', validators=[DataRequired()])

@diary.route('/list')
@login_required
def list_view():
    student_base_number = session.get('student_base_number')
    student = Student.query.filter_by(student_base_number=student_base_number).first()
    diaries = Diary.query.filter_by(
        student_base_number=student_base_number
    ).order_by(Diary.created_at.desc()).all()
    return render_template('diary/list.html', diaries=diaries, student=student)

@diary.route('/diary')
@diary.route('/diary/<int:diary_id>')
@login_required
def diary_view(diary_id=None):
    student_base_number = session.get('student_base_number')
    student = Student.query.filter_by(student_base_number=student_base_number).first()
    
    if diary_id:
        diary = Diary.query.get_or_404(diary_id)
        tasks = Task.query.filter_by(diary_id=diary_id).all()
        return render_template('diary.html', diary=diary, tasks=tasks, student=student, csrf_token=generate_csrf(), google_maps_api_key=current_app.config.get('GOOGLE_MAPS_API_KEY', ''))
    
    return render_template('diary.html', student=student, today_date=datetime.now(), csrf_token=generate_csrf(), google_maps_api_key=current_app.config.get('GOOGLE_MAPS_API_KEY', ''))

@diary.route('/diary/create', methods=['GET', 'POST'])
@login_required
def create():
    student_base_number = session.get('student_base_number')
    student = Student.query.filter_by(student_base_number=student_base_number).first()
    
    if request.method == 'POST':
        try:
            print("[diary.py] Received POST request")
            print("[diary.py] Form data:", request.form)
            
            # フォームデータの取得
            title = request.form.get('title')
            content = request.form.get('content')
            date_str = request.form.get('date')
            
            if not all([title, content]):
                flash('タイトルと内容は必須です')
                return redirect(url_for('diary.create'))
            
            # 日記の作成
            new_diary = Diary(
                student_base_number=student_base_number,
                title=title,
                content=content,
                created_at=datetime.now()
            )
            
            # 画像の処理
            for i in range(1, 4):  # 最大3枚の画像
                image_key = f'image{i}'
                if image_key in request.files:
                    image_file = request.files[image_key]
                    if image_file and allowed_file(image_file.filename):
                        # 画像データを直接保存
                        image_data = image_file.read()
                        mime_type = image_file.content_type or 'application/octet-stream'
                        
                        # 画像情報をデータベースに保存
                        diary_image = DiaryImage(
                            diary=new_diary,
                            image_data=image_data,
                            image_name=secure_filename(image_file.filename),
                            mime_type=mime_type
                        )
                        db.session.add(diary_image)

            # ハッシュタグの処理
            hashtags_json = request.form.get('hashtags')
            if hashtags_json:
                try:
                    hashtags = json.loads(hashtags_json)
                    for tag_name in hashtags:
                        # 既存のハッシュタグを検索、なければ作成
                        hashtag = Hashtag.query.filter_by(name=tag_name).first()
                        if not hashtag:
                            hashtag = Hashtag(name=tag_name)
                            db.session.add(hashtag)
                        new_diary.hashtags.append(hashtag)
                except json.JSONDecodeError:
                    print("[diary.py] Error decoding hashtags JSON")
            
            db.session.add(new_diary)
            db.session.commit()
            
            flash('日記が作成されました')
            return redirect(url_for('diary.diary_view'))
            
        except Exception as e:
            db.session.rollback()
            print("[diary.py] Error creating diary:", str(e))
            flash(f'日記の作成に失敗しました：{str(e)}')
            return redirect(url_for('diary.create'))
    
    # GETリクエストの場合
    current_date = datetime.now().strftime('%Y-%m-%d')
    form = DiaryForm()  # FlaskFormを使用している場合
    return render_template('diary/create.html', 
                         student=student, 
                         current_date=current_date,
                         form=form)

@diary.route('/api/diary', methods=['GET', 'POST', 'PUT'])
@login_required
def handle_diary():
    student_base_number = session.get('student_base_number')
    print("[diary.py] Handling diary request for student:", student_base_number)

    if request.method == 'GET':
        date = request.args.get('date', datetime.now().strftime('%Y-%m-%d'))
        diary = Diary.query.filter_by(
            student_base_number=student_base_number,
            created_at=datetime.strptime(date, '%Y-%m-%d')
        ).first()
        
        if diary:
            return jsonify(diary.to_dict())
        return jsonify({})

    if request.method == 'POST':
        try:
            print("[diary.py] Processing POST request")
            
            # フォームデータの取得
            title = request.form.get('title')
            content = request.form.get('content')
            
            if not title or not content:
                return jsonify({
                    'success': False,
                    'error': 'タイトルと内容は必須です'
                }), 400

            # 日記の作成
            new_diary = Diary(
                student_base_number=student_base_number,
                title=title,
                content=content,
                created_at=datetime.now()
            )
            
            # 画像の処理
            for i in range(1, 4):  # 最大3枚の画像
                image_key = f'image{i}'
                if image_key in request.files:
                    image_file = request.files[image_key]
                    if image_file and allowed_file(image_file.filename):
                        # 画像データを直接保存
                        image_data = image_file.read()
                        mime_type = image_file.content_type or 'application/octet-stream'
                        
                        # 画像情報をデータベースに保存
                        diary_image = DiaryImage(
                            diary=new_diary,
                            image_data=image_data,
                            image_name=secure_filename(image_file.filename),
                            mime_type=mime_type
                        )
                        db.session.add(diary_image)

            # タスクの処理
            tasks_json = request.form.get('tasks')
            if tasks_json:
                try:
                    tasks_data = json.loads(tasks_json)
                    for task_data in tasks_data:
                        task = Task(
                            student_base_number=student_base_number,
                            content=task_data['content'],
                            is_completed=task_data.get('isCompleted', False)
                        )
                        db.session.add(task)
                except json.JSONDecodeError:
                    print("[diary.py] Error decoding tasks JSON")

            # ハッシュタグの処理
            hashtags_json = request.form.get('hashtags')
            if hashtags_json:
                try:
                    hashtags = json.loads(hashtags_json)
                    for tag_name in hashtags:
                        hashtag = Hashtag.query.filter_by(name=tag_name).first()
                        if not hashtag:
                            hashtag = Hashtag(name=tag_name)
                            db.session.add(hashtag)
                        new_diary.hashtags.append(hashtag)
                except json.JSONDecodeError:
                    print("[diary.py] Error decoding hashtags JSON")

            db.session.add(new_diary)
            db.session.commit()
            
            return jsonify({
                'success': True,
                'diary_id': new_diary.diary_id,
                'message': '日記が保存されました'
            })
            
        except Exception as e:
            db.session.rollback()
            print("[diary.py] Error saving diary:", str(e))
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500

    elif request.method == 'PUT':
        try:
            data = request.get_json()
            diary = Diary.query.get_or_404(data['diary_id'])
            
            if diary.student_base_number != student_base_number:
                return jsonify({
                    'success': False,
                    'error': '権限がありません'
                }), 403
            
            if 'title' in data:
                diary.title = data['title']
            if 'content' in data:
                diary.content = data['content']
            
            # ハッシュタグの更新
            if 'hashtags' in data:
                diary.hashtags.clear()
                for tag_name in data['hashtags']:
                    hashtag = Hashtag.query.filter_by(name=tag_name).first()
                    if not hashtag:
                        hashtag = Hashtag(name=tag_name)
                        db.session.add(hashtag)
                    diary.hashtags.append(hashtag)
            
            db.session.commit()
            return jsonify({
                'success': True,
                'message': '日記が更新されました'
            })
            
        except Exception as e:
            db.session.rollback()
            print("[diary.py] Error updating diary:", str(e))
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500

@diary.route('/api/tasks', methods=['GET', 'POST'])
@login_required
def handle_tasks():
    student_base_number = session.get('student_base_number')
    
    if request.method == 'GET':
        tasks = Task.query.filter_by(student_base_number=student_base_number).all()
        return jsonify([task.to_dict() for task in tasks])
        
    elif request.method == 'POST':
        try:
            data = request.get_json()
            new_task = Task(
                student_base_number=student_base_number,
                content=data['content']
            )
            db.session.add(new_task)
            db.session.commit()
            return jsonify(new_task.to_dict()), 201
        except KeyError as e:
            return jsonify({'error': 'タスクの内容が必要です'}), 400
        except SQLAlchemyError as e:
            db.session.rollback()
            return jsonify({'error': 'データベースエラー'}), 500

@diary.route('/api/tasks/<int:task_id>', methods=['PUT', 'DELETE'])
@login_required
def handle_task(task_id):
    student_base_number = session.get('student_base_number')
    task = Task.query.filter_by(task_id=task_id, student_base_number=student_base_number).first_or_404()
    
    if request.method == 'PUT':
        try:
            data = request.get_json()
            if 'content' in data:
                task.content = data['content']
            if 'is_completed' in data:
                task.is_completed = data['is_completed']
            
            db.session.commit()
            return jsonify(task.to_dict())
        except SQLAlchemyError as e:
            db.session.rollback()
            return jsonify({'error': 'タスクの更新に失敗しました'}), 400
            
    elif request.method == 'DELETE':
        try:
            db.session.delete(task)
            db.session.commit()
            return '', 204
        except SQLAlchemyError as e:
            db.session.rollback()
            return jsonify({'error': 'タスクの削除に失敗しました'}), 500

@diary.route('/api/diary/image/<int:image_id>')
@login_required
def get_diary_image(image_id):
    # 画像の取得
    image = DiaryImage.query.get_or_404(image_id)
    
    # 権限チェック
    if image.diary.student_base_number != session.get('student_base_number'):
        return jsonify({
            'success': False,
            'error': '権限がありません'
        }), 403
    
    # 画像データを返す
    return send_file(
        io.BytesIO(image.image_data),
        mimetype=image.mime_type,
        as_attachment=False,
        download_name=image.image_name
    ) 