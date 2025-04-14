"""
共通ビューモジュール
全ユーザーが利用可能な基本的なビュー関数を定義
"""

from flask import Blueprint, render_template, redirect, url_for, flash, request
from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, EmailField
from wtforms.validators import DataRequired, Email, Length
from werkzeug.security import check_password_hash
from apps.common.forms import LoginForm
from flask_login import current_user
from apps.extensions import db

bp = Blueprint('common', __name__)

# モデルのインポートを遅延させる
def get_models():
    from apps.models import Student, Teacher, PublicUser
    return Student, Teacher, PublicUser

@bp.route('/')
def home():
    """トップページ"""
    if current_user.is_authenticated and hasattr(current_user, 'student'):
        return render_template('common/home.html')
    return render_template('common/home.html')

@bp.route('/about')
def about():
    """概要ページ
    
    Returns:
        Response: 概要ページのレンダリング結果
    """
    return render_template('common/about.html')

@bp.route('/error')
def error():
    """エラーページ
    
    Returns:
        Response: エラーページのレンダリング結果
    """
    return render_template('common/error.html')

@bp.route('/student/login', methods=['GET', 'POST'])
def student_login():
    """学生ログインページ"""
    Student, _, _ = get_models()
    form = LoginForm()
    if form.validate_on_submit():
        student = Student.query.filter_by(student_id=form.username.data).first()
        if student and check_password_hash(student.password, form.password.data):
            # ログイン処理
            return redirect(url_for('student.dashboard'))
        flash('ユーザーIDまたはパスワードが正しくありません', 'error')
    return render_template('common/login.html', form=form, user_type='student')

@bp.route('/teacher/login', methods=['GET', 'POST'])
def teacher_login():
    """教職員ログインページ"""
    Student, Teacher, _ = get_models()
    form = LoginForm()
    if form.validate_on_submit():
        teacher = Teacher.query.filter_by(email=form.username.data).first()
        if teacher and check_password_hash(teacher.password, form.password.data):
            # ログイン処理
            return redirect(url_for('teacher.dashboard'))
        flash('メールアドレスまたはパスワードが正しくありません', 'error')
    return render_template('common/login.html', form=form, user_type='teacher')

@bp.route('/public/login', methods=['GET', 'POST'])
def public_login():
    """一般ユーザーログインページ"""
    Student, _, PublicUser = get_models()
    form = LoginForm()
    if form.validate_on_submit():
        user = PublicUser.query.filter_by(username=form.username.data).first()
        if user and check_password_hash(user.password, form.password.data):
            # ログイン処理
            return redirect(url_for('public.dashboard'))
        flash('ユーザー名またはパスワードが正しくありません', 'error')
    return render_template('common/login.html', form=form, user_type='public')

@bp.route('/notice')
def notice():
    """お知らせページ
    
    Returns:
        Response: お知らせページのレンダリング結果
    """
    return render_template('common/notice.html')

@bp.route('/contact', methods=['GET', 'POST'])
def contact():
    """お問い合わせページ
    
    Returns:
        Response: お問い合わせページのレンダリング結果
    """
    if request.method == 'POST':
        # POSTリクエストの処理（フォーム送信時）
        # TODO: お問い合わせフォームの処理を実装
        flash('お問い合わせを受け付けました。', 'success')
        return redirect(url_for('common.contact'))
    
    return render_template('common/contact.html') 