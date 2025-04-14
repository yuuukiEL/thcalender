from flask import Blueprint, render_template, request, jsonify, session, redirect, url_for, flash, current_app, send_file
from flask_wtf.csrf import generate_csrf
from flask_wtf import FlaskForm
from wtforms import StringField, TextAreaField
from wtforms.validators import DataRequired
from apps.extensions import db
from apps.models.student import Student
from apps.student.views.register import login_required
from datetime import datetime
from sqlalchemy.exc import SQLAlchemyError
import json
import os
from werkzeug.utils import secure_filename
import io
from flask_login import login_required, current_user
from apps.student.models import Diary, DiaryImage, Hashtag, diary_hashtags

bp = Blueprint('diary', __name__, url_prefix='/diary')

# アップロード設定
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'static', 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

class DiaryForm(FlaskForm):
    title = StringField('タイトル', validators=[DataRequired()])
    content = TextAreaField('内容', validators=[DataRequired()])

@bp.route('/')
@login_required
def index():
    """日記一覧を表示"""
    # フラッシュメッセージをクリア
    session.pop('_flashes', None)
    
    try:
        # 日記を取得
        diaries = Diary.query.filter_by(
            student_id=current_user.student.student_id
        ).order_by(Diary.created_at.desc()).all()
        
        # ハッシュタグを取得
        for diary in diaries:
            hashtag_ids = db.session.query(diary_hashtags.c.hashtag_id).filter(
                diary_hashtags.c.diary_id == diary.diary_id
            ).all()
            
            hashtag_ids = [h[0] for h in hashtag_ids]
            diary.hashtags = Hashtag.query.filter(Hashtag.hashtag_id.in_(hashtag_ids)).all()
        
        # すべてのハッシュタグを取得（重複なし）
        all_hashtags = Hashtag.query.join(
            diary_hashtags
        ).join(
            Diary
        ).filter(
            Diary.student_id == current_user.student.student_id
        ).distinct().all()
            
        return render_template('student/diary/list.html', 
                             diaries=diaries,
                             all_hashtags=all_hashtags,
                             csrf_token=generate_csrf())
    except Exception as e:
        current_app.logger.error(f"Error in diary index: {str(e)}")
        flash('日記の取得中にエラーが発生しました。', 'error')
        return redirect(url_for('student.home.index'))

@bp.route('/list')
@login_required
def list():
    """日記一覧を表示（別名）"""
    return index()

@bp.route('/create', methods=['GET', 'POST'])
@login_required
def create():
    """新規日記作成"""
    form = DiaryForm()
    if form.validate_on_submit():
        try:
            diary = Diary(
                student_id=current_user.student.student_id,
                title=form.title.data,
                content=form.content.data
            )
            db.session.add(diary)
            db.session.commit()
            flash('日記を作成しました。', 'success')
            return redirect(url_for('.index'))
        except Exception as e:
            current_app.logger.error(f"Error creating diary: {str(e)}")
            db.session.rollback()
            flash('日記の作成中にエラーが発生しました。', 'error')
            return redirect(url_for('.index'))

    # 今日の日付を追加
    today_date = datetime.now()
    
    return render_template('student/diary/diary.html', 
                         form=form,
                         csrf_token=generate_csrf(),
                         today_date=today_date)

@bp.route('/<int:diary_id>')
@login_required
def detail(diary_id):
    """日記詳細を表示"""
    diary = Diary.query.get_or_404(diary_id)
    if diary.student_id != current_user.student.student_id:
        flash('アクセス権限がありません。', 'error')
        return redirect(url_for('.index'))
    return render_template('student/diary/detail.html', diary=diary)

@bp.route('/api/diary/image/<int:image_id>')
@login_required
def get_diary_image(image_id):
    image = DiaryImage.query.get_or_404(image_id)
    
    if image.diary.student_id != current_user.student.student_id:
        return jsonify({'error': '権限がありません'}), 403
    
    return send_file(
        io.BytesIO(image.image_data),
        mimetype=image.mime_type,
        as_attachment=False,
        download_name=image.image_name
    )

@bp.route('/api/events')
@login_required
def get_events():
    """イベント一覧を取得"""
    return jsonify([])  # 空のリストを返す

@bp.route('/api/common-schedules')
@login_required
def get_common_schedules():
    """共通スケジュールを取得"""
    return jsonify([])  # 空のリストを返す

@bp.route('/api/personal-schedules')
@login_required
def get_personal_schedules():
    """個人スケジュールを取得"""
    return jsonify([])  # 空のリストを返す

@bp.route('/save', methods=['POST'])
@bp.route('/api/diary/save', methods=['POST'])  # 代替ルートを追加
@login_required
def save_diary():
    """日記を保存するAPI"""
    try:
        # フォームデータの取得
        title = request.form.get('title')
        content = request.form.get('content')
        tasks_json = request.form.get('tasks')
        hashtags_json = request.form.get('hashtags')
        
        if not title or not content:
            return jsonify({'success': False, 'error': '必須項目が不足しています'}), 400
        
        # 日記の作成または更新
        diary_id = request.form.get('diary_id')
        
        if diary_id:
            # 既存の日記を更新
            diary = Diary.query.get(diary_id)
            if not diary or diary.student_id != current_user.student.student_id:
                return jsonify({'success': False, 'error': '日記が見つからないか、アクセス権限がありません'}), 403
            
            diary.title = title
            diary.content = content
            diary.updated_at = datetime.now()
        else:
            # 新しい日記を作成
            diary = Diary(
                student_id=current_user.student.student_id,
                title=title,
                content=content
            )
            db.session.add(diary)
        
        # 一度コミットして日記IDを取得
        db.session.commit()
        
        # 画像の処理
        for i in range(1, 4):  # 3枚まで対応
            image_key = f'image{i}'
            if image_key in request.files and request.files[image_key].filename:
                file = request.files[image_key]
                if file and allowed_file(file.filename):
                    # 安全なファイル名を生成
                    filename = secure_filename(file.filename)
                    
                    # 画像データを保存
                    image_data = file.read()
                    mime_type = file.content_type
                    
                    # DiaryImageモデルに保存
                    diary_image = DiaryImage(
                        diary_id=diary.diary_id,
                        image_name=filename,
                        image_data=image_data,
                        mime_type=mime_type,
                        position=i  # 画像の位置
                    )
                    db.session.add(diary_image)
        
        # ハッシュタグの処理
        if hashtags_json:
            try:
                hashtags = json.loads(hashtags_json)
                # 既存のハッシュタグとの関連付けを解除
                diary.hashtags = []
                
                # 新しいハッシュタグを追加
                for tag_text in hashtags:
                    if tag_text.strip():
                        # 既存のハッシュタグを検索
                        hashtag = Hashtag.query.filter_by(tag_name=tag_text.strip()).first()
                        
                        if not hashtag:
                            # 新しいハッシュタグを作成
                            hashtag = Hashtag(tag_name=tag_text.strip())
                            db.session.add(hashtag)
                        
                        # 日記とハッシュタグを関連付け
                        diary.hashtags.append(hashtag)
            except json.JSONDecodeError:
                current_app.logger.error(f"Invalid hashtags JSON: {hashtags_json}")
        
        # 変更をコミット
        db.session.commit()
        
        return jsonify({
            'success': True,
            'diary_id': diary.diary_id,
            'message': '日記が保存されました'
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error saving diary: {str(e)}")
        return jsonify({'success': False, 'error': f'日記の保存中にエラーが発生しました: {str(e)}'}), 500

@bp.route('/api/save', methods=['POST'])
@login_required
def api_save():
    try:
        # フォームデータの取得
        title = request.form.get('title', '')
        content = request.form.get('content', '')
        
        # ハッシュタグの取得
        hashtags_json = request.form.get('hashtags', '[]')
        hashtags_list = json.loads(hashtags_json)
        
        # 現在の日付を取得
        current_date = datetime.now().strftime('%Y-%m-%d')
        
        # 学生IDの取得
        student_id = current_user.student.student_id
        
        # 既存の日記を検索
        existing_diary = Diary.query.filter_by(
            student_id=student_id,
            created_at=current_date
        ).first()
        
        if existing_diary:
            # 既存の日記を更新
            existing_diary.title = title
            existing_diary.content = content
            diary_id = existing_diary.diary_id
            diary = existing_diary
        else:
            # 新しい日記を作成
            new_diary = Diary(
                student_id=student_id,
                title=title,
                content=content
            )
            db.session.add(new_diary)
            db.session.flush()  # IDを取得するためにflush
            diary_id = new_diary.diary_id
            diary = new_diary
        
        # ハッシュタグの処理
        if hashtags_list:
            # 既存のハッシュタグ関連をクリア
            diary.hashtags = []
            
            # 新しいハッシュタグを追加
            for tag_name in hashtags_list:
                # 既存のハッシュタグを検索
                hashtag = Hashtag.query.filter_by(tag_name=tag_name).first()
                
                # 存在しない場合は新規作成
                if not hashtag:
                    hashtag = Hashtag(tag_name=tag_name)
                    db.session.add(hashtag)
                    db.session.flush()
                
                # 日記とハッシュタグを関連付け
                diary.hashtags.append(hashtag)
        
        # 画像の処理
        if 'images[]' in request.files:
            images = request.files.getlist('images[]')
            for image in images:
                if image and allowed_file(image.filename):
                    # 画像データの保存
                    image_data = image.read()
                    mime_type = image.content_type
                    image_name = secure_filename(image.filename)
                    
                    # 新しい画像レコードを作成
                    new_image = DiaryImage(
                        diary_id=diary_id,
                        image_data=image_data,
                        image_name=image_name,
                        mime_type=mime_type
                    )
                    db.session.add(new_image)
        
        # 変更をコミット
        db.session.commit()
        
        return jsonify({'success': True, 'diary_id': diary_id})
    
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error saving diary: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/<int:diary_id>', methods=['DELETE'])
@login_required
def delete_diary(diary_id):
    """日記を削除する"""
    try:
        diary = Diary.query.get_or_404(diary_id)
        
        # 権限チェック
        if diary.student_id != current_user.student.student_id:
            return jsonify({'success': False, 'error': 'アクセス権限がありません'}), 403
        
        # 日記を削除
        db.session.delete(diary)
        db.session.commit()
        
        return jsonify({'success': True, 'message': '日記が削除されました'})
    
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting diary: {str(e)}")
        return jsonify({'success': False, 'error': f'日記の削除中にエラーが発生しました: {str(e)}'}), 500

@bp.route('/<int:diary_id>/edit', methods=['GET'])
@login_required
def edit(diary_id):
    """日記編集画面を表示"""
    diary = Diary.query.get_or_404(diary_id)
    if diary.student_id != current_user.student.student_id:
        flash('アクセス権限がありません。', 'error')
        return redirect(url_for('.index'))
    return render_template('student/diary/edit.html', diary=diary)

@bp.route('/<int:diary_id>/update', methods=['POST'])
@login_required
def update(diary_id):
    """日記を更新"""
    diary = Diary.query.get_or_404(diary_id)
    if diary.student_id != current_user.student.student_id:
        flash('アクセス権限がありません。', 'error')
        return redirect(url_for('.index'))
    
    try:
        diary.title = request.form.get('title')
        diary.content = request.form.get('content')
        diary.updated_at = datetime.now()
        
        # ハッシュタグの処理
        hashtags_text = request.form.get('hashtags')
        if hashtags_text:
            hashtags = [tag.strip() for tag in hashtags_text.split('#') if tag.strip()]
            diary.hashtags = []
            
            for tag_text in hashtags:
                hashtag = Hashtag.query.filter_by(tag_name=tag_text).first()
                if not hashtag:
                    hashtag = Hashtag(tag_name=tag_text)
                    db.session.add(hashtag)
                diary.hashtags.append(hashtag)
        
        # 画像の処理
        if 'images' in request.files:
            files = request.files.getlist('images')
            for file in files:
                if file and allowed_file(file.filename):
                    filename = secure_filename(file.filename)
                    image_data = file.read()
                    mime_type = file.content_type
                    
                    diary_image = DiaryImage(
                        diary_id=diary.diary_id,
                        image_name=filename,
                        image_data=image_data,
                        mime_type=mime_type
                    )
                    db.session.add(diary_image)
        
        db.session.commit()
        flash('日記を更新しました。', 'success')
        return redirect(url_for('.detail', diary_id=diary.diary_id))
    
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating diary: {str(e)}")
        flash('日記の更新中にエラーが発生しました。', 'error')
        return redirect(url_for('.edit', diary_id=diary.diary_id)) 