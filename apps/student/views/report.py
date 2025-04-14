from flask import Blueprint, render_template, request, jsonify, redirect, url_for, flash, current_app
from flask_wtf.csrf import generate_csrf
from flask_wtf import FlaskForm
from wtforms import StringField, TextAreaField, BooleanField, MultipleFileField
from wtforms.validators import DataRequired
from apps.extensions import db
from apps.models.student import Student
from flask_login import login_required, current_user
from apps.models.report import ReportBoard as Report
from datetime import datetime
from sqlalchemy.exc import SQLAlchemyError
import json
import os
from werkzeug.utils import secure_filename

bp = Blueprint('report', __name__, url_prefix='/report')

# アップロード設定を修正 - プロジェクトルートの uploads ディレクトリを使用
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), 'uploads', 'report_board')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'mp4', 'mov', 'avi'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# 報告IDごとのディレクトリを作成する関数
def ensure_upload_dir(report_id):
    report_dir = os.path.join(UPLOAD_FOLDER, str(report_id))
    os.makedirs(report_dir, exist_ok=True)
    return report_dir

class ReportForm(FlaskForm):
    content = TextAreaField('内容', validators=[DataRequired()])
    images = MultipleFileField('画像（複数可）')
    videos = MultipleFileField('動画（複数可）')
    is_anonymous = BooleanField('匿名で投稿する')

@bp.route('/')
@login_required
def index():
    """報告一覧を表示"""
    reports = Report.query.order_by(Report.created_at.desc()).all()
    
    # 画像・動画パスをJSONから解析
    for report in reports:
        if report.image_paths:
            report.image_paths_list = json.loads(report.image_paths)
        else:
            report.image_paths_list = []
            
        if report.video_paths:
            report.video_paths_list = json.loads(report.video_paths)
        else:
            report.video_paths_list = []
    
    form = ReportForm()
    return render_template('student/report/index.html', reports=reports, form=form)

@bp.route('/create', methods=['POST'])
@login_required
def create():
    """新規報告作成"""
    form = ReportForm()
    if form.validate_on_submit():
        try:
            # 学生IDの設定（匿名の場合はNone）
            student_id = None if form.is_anonymous.data else current_user.student.student_id
            
            # 報告の作成
            report = Report(
                student_id=student_id,
                content=form.content.data
            )
            db.session.add(report)
            db.session.commit()
            
            # 画像・動画のアップロード処理
            image_paths = []
            video_paths = []
            
            # 報告IDごとのディレクトリを作成
            report_dir = ensure_upload_dir(report.report_id)
            
            # 画像ファイルの処理 - MultipleFileFieldに対応
            if form.images.data:
                for file in form.images.data:
                    if file and file.filename and allowed_file(file.filename):
                        filename = secure_filename(file.filename)
                        file_path = os.path.join(report_dir, filename)
                        file.save(file_path)
                        # パスを修正 - ファイル名のみを保存
                        image_paths.append(filename)
            
            # 動画ファイルの処理 - MultipleFileFieldに対応
            if form.videos.data:
                for file in form.videos.data:
                    if file and file.filename and allowed_file(file.filename):
                        filename = secure_filename(file.filename)
                        file_path = os.path.join(report_dir, filename)
                        file.save(file_path)
                        # パスを修正 - ファイル名のみを保存
                        video_paths.append(filename)
            
            # パスをJSONとして保存
            report.image_paths = json.dumps(image_paths) if image_paths else None
            report.video_paths = json.dumps(video_paths) if video_paths else None
            db.session.commit()
            
            flash('報告を送信しました。', 'success')
            return redirect(url_for('.index'))
        except Exception as e:
            current_app.logger.error(f"Error creating report: {str(e)}")
            db.session.rollback()
            flash('報告の送信中にエラーが発生しました。', 'error')
    
    return render_template('student/report/create.html', form=form, csrf_token=generate_csrf())

@bp.route('/<int:report_id>')
@login_required
def detail(report_id):
    """報告詳細を表示"""
    report = Report.query.get_or_404(report_id)
    
    # 画像・動画パスをリストに変換
    image_paths = json.loads(report.image_paths) if report.image_paths else []
    video_paths = json.loads(report.video_paths) if report.video_paths else []
    
    return render_template('student/report/detail.html', 
                         report=report,
                         image_paths=image_paths,
                         video_paths=video_paths)

@bp.route('/api/save', methods=['POST'])
@login_required
def api_save_report():
    """APIエンドポイント経由で報告を保存"""
    try:
        # フォームデータの取得
        content = request.form.get('content')
        is_anonymous = request.form.get('is_anonymous') == 'true'
        
        if not content:
            return jsonify({'success': False, 'error': '内容を入力してください'}), 400
        
        # 学生IDの設定（匿名の場合はNone）
        student_id = None if is_anonymous else current_user.student.student_id
        
        # 報告の作成
        report = Report(
            student_id=student_id,
            content=content
        )
        db.session.add(report)
        db.session.commit()
        
        # 画像・動画のアップロード処理
        image_paths = []
        video_paths = []
        
        # 報告IDごとのディレクトリを作成
        report_dir = ensure_upload_dir(report.report_id)
        
        # 画像ファイルの処理
        for key, file in request.files.items():
            if key.startswith('image') and file and file.filename:
                if allowed_file(file.filename):
                    filename = secure_filename(file.filename)
                    file_path = os.path.join(report_dir, filename)
                    file.save(file_path)
                    # パスを修正 - ファイル名のみを保存
                    image_paths.append(filename)
            elif key.startswith('video') and file and file.filename:
                if allowed_file(file.filename):
                    filename = secure_filename(file.filename)
                    file_path = os.path.join(report_dir, filename)
                    file.save(file_path)
                    # パスを修正 - ファイル名のみを保存
                    video_paths.append(filename)
        
        # パスをJSONとして保存
        report.image_paths = json.dumps(image_paths) if image_paths else None
        report.video_paths = json.dumps(video_paths) if video_paths else None
        db.session.commit()
        
        return jsonify({
            'success': True,
            'report_id': report.report_id,
            'message': '報告が送信されました'
        })
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error saving report: {str(e)}")
        return jsonify({'success': False, 'error': f'報告の送信中にエラーが発生しました: {str(e)}'}), 500 

@bp.route('/fix_paths')
@login_required
def fix_paths():
    """既存のパスを修正"""
    reports = Report.query.all()
    for report in reports:
        if report.image_paths:
            image_paths = json.loads(report.image_paths)
            fixed_images = []
            for path in image_paths:
                # パスからファイル名だけを抽出
                if '/' in path:
                    filename = path.split('/')[-1]
                    fixed_images.append(filename)
                else:
                    fixed_images.append(path)
            report.image_paths = json.dumps(fixed_images)
            
        if report.video_paths:
            video_paths = json.loads(report.video_paths)
            fixed_videos = []
            for path in video_paths:
                # パスからファイル名だけを抽出
                if '/' in path:
                    filename = path.split('/')[-1]
                    fixed_videos.append(filename)
                else:
                    fixed_videos.append(path)
            report.video_paths = json.dumps(fixed_videos)
    
    db.session.commit()
    flash('パスを修正しました', 'success')
    return redirect(url_for('.index')) 

@bp.route('/check_image/<int:report_id>')
@login_required
def check_image(report_id):
    """特定の報告の画像パスを確認"""
    report = Report.query.get_or_404(report_id)
    
    result = {
        'report_id': report.report_id,
        'image_paths': json.loads(report.image_paths) if report.image_paths else [],
        'video_paths': json.loads(report.video_paths) if report.video_paths else [],
        'file_exists': []
    }
    
    # 画像ファイルの存在確認
    for path in result['image_paths']:
        file_path = os.path.join(UPLOAD_FOLDER, str(report.report_id), path)
        result['file_exists'].append({
            'path': path,
            'exists': os.path.exists(file_path)
        })
    
    return jsonify(result) 