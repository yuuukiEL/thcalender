from flask import Blueprint, render_template, current_app, request, jsonify, session, flash, redirect, url_for
from flask_login import login_required, current_user
from werkzeug.utils import secure_filename
import os
from datetime import datetime
from apps.extensions import db
from apps.models.bulletin import BulletinBoard, BulletinReactionModel
from apps.models.student import Student
from apps.models.teacher import Teacher
import uuid

bp = Blueprint('bulletin', __name__, url_prefix='/bulletin')

# 許可するファイル拡張子
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@bp.route('/')
@login_required
def index():
    """掲示板一覧表示"""
    # フィルター
    genre = request.args.get('genre')
    my_posts = request.args.get('my_posts') == 'true'
    search = request.args.get('search')
    
    # クエリ構築
    query = BulletinBoard.query
    
    # フィルタリング条件を適用
    if genre:
        query = query.filter_by(title=genre)
    if my_posts:
        query = query.filter_by(created_by=current_user.student.student_id)
    
    # 承認済みの投稿のみ表示
    query = query.filter_by(status='approved')
    
    # 検索フィルター
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            db.or_(
                BulletinBoard.title.ilike(search_term),
                BulletinBoard.content.ilike(search_term)
            )
        )
    
    # 日付の降順で並べ替え
    query = query.order_by(BulletinBoard.created_at.desc())
    
    # クエリを実行
    all_posts = query.all()
    
    # オブジェクトから辞書に変換
    posts = []
    for post in all_posts:
        post_dict = post.to_dict()
        posts.append(post_dict)
    
    # ユーザーのリアクション情報を取得
    user_reactions = {}
    reaction_counts = {}
    reaction_users = {}  # リアクションごとのユーザー情報
    
    for post in posts:
        # ユーザーのリアクション状態
        user_reactions[post['bulletin_id']] = {
            'like': False,
            'helpful': False,
            'interesting': False,
            'thanks': False,
            'good': False,
            'agree': False,
            'funny': False,
            'important': False,
            'question': False,
            'idea': False
        }
        # リアクション数
        reaction_counts[post['bulletin_id']] = {
            'like': 0,
            'helpful': 0,
            'interesting': 0,
            'thanks': 0,
            'good': 0,
            'agree': 0,
            'funny': 0,
            'important': 0,
            'question': 0,
            'idea': 0
        }
        
        # リアクションユーザー情報の初期化
        reaction_users[post['bulletin_id']] = {
            'like': [],
            'helpful': [],
            'interesting': [],
            'thanks': [],
            'good': [],
            'agree': [],
            'funny': [],
            'important': [],
            'question': [],
            'idea': []
        }
        
        # リアクションの取得
        reactions = BulletinReactionModel.query.filter_by(post_id=post['bulletin_id']).all()
        for reaction in reactions:
            if reaction.student_id == current_user.student.student_id:
                user_reactions[post['bulletin_id']][reaction.reaction_type] = True
            reaction_counts[post['bulletin_id']][reaction.reaction_type] += 1
            
            # リアクションしたユーザーの情報を取得
            student = Student.query.filter_by(student_id=reaction.student_id).first()
            if student:
                reaction_users[post['bulletin_id']][reaction.reaction_type].append({
                    'id': student.student_id,
                    'name': student.name
                })
    
    # 全タイトルのリストを取得
    genres = db.session.query(BulletinBoard.title).distinct().all()
    genres = [g[0] for g in genres if g[0]]
    
    # リアクションの絵文字マッピング
    reaction_emojis = {
        'like': '👍',
        'helpful': '🎯',
        'interesting': '💡',
        'thanks': '🙏',
        'good': '⭐️',
        'agree': '✅',
        'funny': '😄',
        'important': '❗️',
        'question': '❓',
        'idea': '💭'
    }
    
    return render_template(
        'student/bulletin/index.html',
        posts=posts,
        user_reactions=user_reactions,
        reaction_counts=reaction_counts,
        reaction_users=reaction_users,
        genres=genres,
        selected_genre=genre,
        my_posts=my_posts,
        reaction_emojis=reaction_emojis
    )

@bp.route('/create', methods=['POST'])
@login_required
def create():
    try:
        # フォームデータの取得
        genre = request.form.get('genre')
        content = request.form.get('content')
        auto_approve = request.form.get('auto_approve') == 'true'
        
        # 必須項目の検証
        if not genre or not content:
            flash('タイトルと内容は必須です。', 'error')
            return redirect(url_for('.index'))
        
        # 画像処理
        image_paths = []
        if 'images' in request.files:
            files = request.files.getlist('images')
            for file in files:
                if file and file.filename and allowed_file(file.filename):
                    filename = secure_filename(file.filename)
                    unique_filename = f"{uuid.uuid4().hex}_{filename}"
                    
                    # パスの区切り文字を常に'/'に統一する
                    upload_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], 'bulletin')
                    if not os.path.exists(upload_dir):
                        os.makedirs(upload_dir)
                    
                    file_path = os.path.join(upload_dir, unique_filename)
                    current_app.logger.debug(f"ファイル保存先: {file_path}")
                    file.save(file_path)
                    
                    # データベースに保存するパスは相対パス
                    relative_path = f"bulletin/{unique_filename}"  # スラッシュを直接使用
                    current_app.logger.debug(f"データベース保存パス: {relative_path}")
                    image_paths.append(relative_path)
        
        # 画像パスをカンマ区切りの文字列に変換
        image_paths_str = ','.join(image_paths) if image_paths else ''
        current_app.logger.debug(f"最終的な画像パス文字列: {image_paths_str}")
        
        # 現在時刻
        now = datetime.now()
        
        # 投稿の作成
        post = BulletinBoard(
            title=genre,
            created_by=current_user.student.student_id,
            content=content,
            image_path=image_paths_str,
            status='approved' if auto_approve else 'pending',
            created_at=now,
            updated_at=now,
            approved_by=95 if auto_approve else None,
            approved_at=now if auto_approve else None
        )
        
        db.session.add(post)
        db.session.commit()
        
        flash('投稿が完了しました。', 'success')
        return redirect(url_for('.index'))
        
    except Exception as e:
        current_app.logger.error(f"Error creating post: {str(e)}")
        flash('投稿の作成中にエラーが発生しました。', 'error')
        return redirect(url_for('.index'))

@bp.route('/reaction/<int:post_id>/<string:reaction_type>', methods=['POST'])
@login_required
def toggle_reaction(post_id, reaction_type):
    """リアクションの切り替え"""
    try:
        # 投稿を取得
        post = BulletinBoard.query.get(post_id)
        if not post:
            return jsonify({'success': False, 'message': '投稿が見つかりません'})
        
        # 既存のリアクションを確認
        existing = BulletinReactionModel.query.filter_by(
            post_id=post_id,  # bulletin_idを使用
            student_id=current_user.student.student_id,
            reaction_type=reaction_type
        ).first()
        
        if existing:
            # リアクションを削除
            db.session.delete(existing)
            message = 'リアクションを削除しました'
        else:
            # リアクションを追加
            reaction = BulletinReactionModel(
                post_id=post_id,  # bulletin_idを使用
                student_id=current_user.student.student_id,
                reaction_type=reaction_type
            )
            db.session.add(reaction)
            message = 'リアクションを追加しました'
        
        db.session.commit()
        
        return jsonify({'success': True, 'message': message})
        
    except Exception as e:
        current_app.logger.error(f"Error toggling reaction: {str(e)}")
        return jsonify({'success': False, 'message': 'エラーが発生しました。'}) 
