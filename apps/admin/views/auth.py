from flask import Blueprint, render_template, redirect, url_for, session, request, flash
from flask_login import login_user, logout_user, login_required
from apps.models import Teacher, Admin
from werkzeug.security import check_password_hash
from functools import wraps
from apps.common.forms import LoginForm

bp = Blueprint('admin_auth', __name__)
auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

def login_required(view_func):
    """ログインを要求するデコレータ"""
    @wraps(view_func)
    def wrapped(*args, **kwargs):
        if not session.get('teacher_id'):
            flash('ログインが必要です。', 'error')
            return redirect(url_for('admin.auth.login'))
        return view_func(*args, **kwargs)
    return wrapped

def admin_required(view_func):
    """管理者権限を要求するデコレータ"""
    @wraps(view_func)
    def wrapped(*args, **kwargs):
        if not session.get('is_admin'):
            flash('管理者権限が必要です。', 'error')
            return redirect(url_for('common.index'))
        return view_func(*args, **kwargs)
    return wrapped

@bp.route('/login', methods=['GET', 'POST'])
def login():
    """管理者ログインページ"""
    if session.get('teacher_id'):  # 既にログイン済みの場合
        return redirect(url_for('admin.dashboard.index'))
        
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        
        teacher = Teacher.query.filter_by(email=email, is_admin=True).first()
        
        if teacher and check_password_hash(teacher.password, password):
            session['teacher_id'] = teacher.teacher_id
            session['is_admin'] = True
            return redirect(url_for('admin.dashboard.index'))
            
        flash('メールアドレスまたはパスワードが正しくありません。', 'error')
    
    return render_template('admin/auth/login.html')

@bp.route('/logout')
def logout():
    """管理者ログアウト"""
    session.pop('teacher_id', None)
    session.pop('is_admin', None)
    flash('ログアウトしました。', 'success')
    return redirect(url_for('common.home'))

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    """管理者ログイン処理"""
    form = LoginForm()
    if form.validate_on_submit():
        admin = Admin.query.filter_by(admin_id=form.username.data).first()
        if admin and admin.check_password(form.password.data):
            login_user(admin)
            return redirect(url_for('admin.dashboard.index'))
        flash('管理者IDまたはパスワードが正しくありません', 'error')
    
    return render_template('admin/auth/login.html', form=form)

@auth_bp.route('/logout')
@login_required
def logout():
    """ログアウト処理"""
    logout_user()
    return redirect(url_for('common.home'))