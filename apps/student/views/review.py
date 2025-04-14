from flask import Blueprint, render_template, redirect, url_for, flash, request
from flask_login import login_required, current_user
from apps import db
from datetime import datetime
from apps.student.models.student_review import StudentReview, get_student_review, get_student_reviews, get_all_reviews
from apps.models.student import Student

# ブループリント定義
review_bp = Blueprint('student_api_review', __name__, url_prefix='/student/review')

@review_bp.route('/', methods=['GET'])
@login_required
def review():
    """レビューページを表示"""
    # 学生の最新レビューを取得
    student_review = get_student_review(current_user.student.student_id)
    
    # すべてのレビューを取得（最新20件）
    all_reviews = get_all_reviews(limit=20)
    
    # 学生名の取得を一時的にスキップ
    for review in all_reviews:
        review.student_name = None  # 匿名表示
    
    return render_template('student/auth/review.html', 
                          student_review=student_review,
                          all_reviews=all_reviews)

@review_bp.route('/all', methods=['GET'])
@login_required
def all_reviews():
    """すべてのレビューを表示"""
    # すべてのレビューを取得
    all_reviews = get_all_reviews()
    
    # 学生名を取得
    for review in all_reviews:
        student = Student.query.filter_by(student_id=review.student_id).first()
        review.student_name = student.name if student else None
    
    return render_template('student/auth/all_reviews.html', all_reviews=all_reviews)

@review_bp.route('/submit', methods=['POST'])
@login_required
def submit_review():
    """新しいレビューを投稿"""
    rating = request.form.get('rating')
    comment = request.form.get('comment', '')
    
    if not rating or not rating.isdigit() or int(rating) < 1 or int(rating) > 5:
        flash('評価は1〜5の間で選択してください', 'error')
        return redirect(url_for('student_api_review.review'))
    
    # 常に新しいレビューを作成
    new_review = StudentReview(
        student_id=current_user.student.student_id,
        rating=int(rating),
        comment=comment
    )
    
    db.session.add(new_review)
    db.session.commit()
    
    flash('レビューを投稿しました', 'success')
    return redirect(url_for('student_api_review.review')) 