from flask import Blueprint, render_template, session, jsonify, request
from apps.student.models.diary import Diary, Hashtag
from apps.models.student import Student
from apps.extensions import db
from apps.student.views.register import login_required

list_bp = Blueprint('list', __name__)

@list_bp.route('/list')
@list_bp.route('/diary/list')
@login_required
def diary_list():
    student_id = session.get('student_id')
    student = Student.query.filter_by(student_id=student_id).first()
    
    # 全てのハッシュタグを取得
    all_hashtags = Hashtag.query.all()
    
    # 日記を取得（新しい順）
    diaries = Diary.query.filter_by(
        student_id=student.student_id
    ).order_by(Diary.created_at.desc()).all()
    
    return render_template(
        'diary/list.html',
        diaries=diaries,
        student=student,
        all_hashtags=all_hashtags
    )

@list_bp.route('/api/diary/list/filter', methods=['POST'])
@login_required
def filter_diaries():
    student_id = session.get('student_id')
    data = request.get_json()
    
    # 基本クエリ
    query = Diary.query.filter_by(student_id=student_id)
    
    # 検索フィルター
    if 'search' in data and data['search']:
        search_term = f"%{data['search']}%"
        query = query.filter(
            (Diary.title.ilike(search_term)) |
            (Diary.content.ilike(search_term))
        )
    
    # ハッシュタグフィルター
    if 'hashtags' in data and data['hashtags']:
        for tag in data['hashtags']:
            query = query.filter(Diary.hashtags.any(Hashtag.name == tag))
    
    # ソート
    if 'sort' in data:
        if data['sort'] == 'date_desc':
            query = query.order_by(Diary.created_at.desc())
        elif data['sort'] == 'date_asc':
            query = query.order_by(Diary.created_at.asc())
        elif data['sort'] == 'title':
            query = query.order_by(Diary.title)
    
    diaries = query.all()
    return jsonify([{
        'id': d.diary_id,
        'title': d.title,
        'content': d.content[:50] + '...' if len(d.content) > 50 else d.content,
        'created_at': d.created_at.strftime('%Y年%m月%d日'),
        'hashtags': [tag.name for tag in d.hashtags]
    } for d in diaries]) 