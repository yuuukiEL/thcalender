from flask import Blueprint, render_template, redirect, url_for
from flask_login import current_user
from functools import wraps

bp = Blueprint('public', __name__)

def public_only(f):
    """一般ユーザー専用デコレータ"""
    @wraps(f)
    def decorated_view(*args, **kwargs):
        if current_user.is_authenticated:
            if current_user.user_type == 'student':
                return redirect(url_for('student.home.index'))
            elif current_user.user_type == 'admin':
                return redirect(url_for('admin.home.index'))
        return f(*args, **kwargs)
    return decorated_view

@bp.route('/')
def index():
    """一般トップページ"""
    # 認証済みユーザーの場合は適切なページにリダイレクト
    if current_user.is_authenticated and hasattr(current_user, 'user_type'):
        if current_user.user_type == 'student':
            return redirect(url_for('student.home.index'))
        elif current_user.user_type == 'admin':
            return redirect(url_for('admin.home.index'))
    # 未認証の場合は共通のホームページを表示
    return render_template('common/home.html')

@bp.route('/contact')
def contact():
    """お問い合わせページ"""
    return render_template('public/contact.html')

@bp.route('/faq')
def faq():
    """よくある質問ページ"""
    return render_template('public/faq.html') 