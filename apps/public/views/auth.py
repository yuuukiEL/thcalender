from flask import Blueprint, render_template, redirect, url_for, session, request, flash
from functools import wraps
from flask_login import login_user, logout_user, login_required
from apps.models import PublicUser
from apps.extensions import db
from apps.common.forms import LoginForm, PublicRegisterForm

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

def public_only(view_func):
    """一般ユーザーのみアクセス可能なデコレータ"""
    @wraps(view_func)
    def wrapped(*args, **kwargs):
        if session.get('is_admin') or session.get('student_id'):
            return redirect(url_for('common.home'))
        return view_func(*args, **kwargs)
    return wrapped

@auth_bp.route('/login', methods=['GET', 'POST'])
@public_only
def login():
    """一般ユーザーログイン処理"""
    form = LoginForm()
    if form.validate_on_submit():
        user = PublicUser.query.filter_by(email=form.username.data).first()
        if user and user.check_password(form.password.data):
            login_user(user)
            return redirect(url_for('public.dashboard.index'))
        flash('メールアドレスまたはパスワードが正しくありません', 'error')
    
    return render_template('public/auth/login.html', form=form)

@auth_bp.route('/admin/login')
def admin_login():
    return render_template('public/auth/admin_login.html')

@auth_bp.route('/about')
def about():
    """概要ページ"""
    return render_template('public/about.html')

@auth_bp.route('/register', methods=['GET', 'POST'])
@public_only
def register():
    form = PublicRegisterForm()
    if form.validate_on_submit():
        if PublicUser.query.filter_by(username=form.username.data).first():
            flash('このユーザー名は既に使用されています', 'error')
        elif PublicUser.query.filter_by(email=form.email.data).first():
            flash('このメールアドレスは既に使用されています', 'error')
        else:
            user = PublicUser(
                username=form.username.data,
                email=form.email.data
            )
            user.set_password(form.password.data)
            db.session.add(user)
            db.session.commit()
            flash('アカウントが作成されました。ログインしてください。', 'success')
            return redirect(url_for('public.auth.login'))
    
    return render_template('public/auth/register.html', form=form)

@auth_bp.route('/forgot-password', methods=['GET', 'POST'])
def forgot_password():
    return render_template('public/auth/forgot_password.html')

@auth_bp.route('/logout')
@login_required
def logout():
    """ログアウト処理"""
    logout_user()
    return redirect(url_for('common.home')) 