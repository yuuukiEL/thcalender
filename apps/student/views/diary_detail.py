from flask import Blueprint, render_template, request, jsonify, session, redirect, url_for, flash
from flask_wtf.csrf import generate_csrf
from apps.models.diary import Diary, DiaryImage, Hashtag, DiaryComment
from apps.models.student import Student
from apps.extensions import db
from apps.student.views.register import login_required
from datetime import datetime
from sqlalchemy import text
from werkzeug.utils import secure_filename

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

diary_detail = Blueprint('diary_detail', __name__)

@diary_detail.route('/diary/<int:diary_id>', methods=['GET', 'DELETE'])
@login_required
def view(diary_id):
    student_id = session.get('student_id')  # student_base_numberをstudent_idに変更
    student = Student.query.filter_by(student_id=student_id).first()
    diary = Diary.query.get_or_404(diary_id)
    
    # 権限チェック
    if diary.student_id != student_id:  # student_base_numberをstudent_idに変更
        flash('この日記にアクセスする権限がありません')
        return redirect(url_for('list.diary_list'))

    if request.method == 'DELETE':
        try:
            # 関連するハッシュタグの関連付けのみを削除
            diary.hashtags = []
            db.session.commit()
            
            # 関連する画像を削除
            DiaryImage.query.filter_by(diary_id=diary_id).delete()
            db.session.commit()
            
            # 日記を削除
            db.session.delete(diary)
            db.session.commit()
            
            return jsonify({'message': '日記が削除されました'}), 200
            
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500

    # GETリクエストの場合
    return render_template(
        'diary/detail.html',
        diary=diary,
        student=student,  # studentオブジェクトを追加
        csrf_token=generate_csrf()
    )

@diary_detail.route('/diary/<int:diary_id>/edit', methods=['GET', 'POST'])
@login_required
def edit(diary_id):
    student_id = session.get('student_id')  # student_base_numberをstudent_idに変更
    student = Student.query.filter_by(student_id=student_id).first()
    diary = Diary.query.get_or_404(diary_id)
    
    # 権限チェック
    if diary.student_id != student_id:  # student_base_numberをstudent_idに変更
        flash('この日記を編集する権限がありません')
        return redirect(url_for('list.diary_list'))
    
    if request.method == 'POST':
        try:
            # フォームデータの取得
            title = request.form.get('title')
            content = request.form.get('content')
            
            if not all([title, content]):
                flash('タイトルと内容は必須です')
                return redirect(url_for('diary_detail.edit', diary_id=diary_id))
            
            # 日記の更新
            diary.title = title
            diary.content = content
            diary.updated_at = datetime.now()
            
            # ハッシュタグの処理
            hashtags_json = request.form.get('hashtags')
            if hashtags_json:
                try:
                    import json
                    hashtags = json.loads(hashtags_json)
                    diary.hashtags.clear()
                    for tag_name in hashtags:
                        hashtag = Hashtag.query.filter_by(name=tag_name).first()
                        if not hashtag:
                            hashtag = Hashtag(name=tag_name)
                            db.session.add(hashtag)
                        diary.hashtags.append(hashtag)
                except json.JSONDecodeError:
                    pass
            
            db.session.commit()
            flash('日記が更新されました')
            return redirect(url_for('diary_detail.view', diary_id=diary_id))
            
        except Exception as e:
            db.session.rollback()
            flash(f'日記の更新に失敗しました：{str(e)}')
            return redirect(url_for('diary_detail.edit', diary_id=diary_id))
    
    return render_template(
        'diary/edit.html',
        diary=diary,
        student=student,
        csrf_token=generate_csrf()
    )

@diary_detail.route('/diary/<int:diary_id>', methods=['POST'])
@login_required
def update(diary_id):
    diary = Diary.query.get_or_404(diary_id)
    
    # フォームからデータを取得
    title = request.form.get('title')
    content = request.form.get('content')
    hashtag_string = request.form.get('hashtags', '')
    
    # 日記を更新
    diary.title = title
    diary.content = content
    
    # ハッシュタグを更新
    diary.hashtags = []
    if hashtag_string:
        hashtag_names = [tag.strip('#') for tag in hashtag_string.split() if tag.startswith('#')]
        for name in hashtag_names:
            tag = Hashtag.query.filter_by(name=name).first()
            if not tag:
                tag = Hashtag(name=name)
                db.session.add(tag)
            diary.hashtags.append(tag)
    
    # 画像の削除処理
    delete_images = request.form.getlist('delete_images')
    for image_id in delete_images:
        image = DiaryImage.query.get(image_id)
        if image:
            db.session.delete(image)
    
    # 新しい画像の追加
    if 'images' in request.files:
        files = request.files.getlist('images')
        for file in files:
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                file_data = file.read()
                new_image = DiaryImage(
                    diary_id=diary.diary_id,
                    image_data=file_data,
                    filename=filename
                )
                db.session.add(new_image)
    
    db.session.commit()
    return redirect(url_for('diary_detail.view', diary_id=diary_id))

@diary_detail.route('/diary/<int:diary_id>')
@login_required
def detail(diary_id):
    student_id = session.get('student_id')
    student = Student.query.filter_by(student_id=student_id).first()
    diary = Diary.query.get_or_404(diary_id)
    
    return render_template(
        'student/diary/detail.html',
        diary=diary,
        student=student
    ) 