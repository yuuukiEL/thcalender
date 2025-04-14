from flask import Blueprint, render_template, redirect, url_for, session, current_app, request, flash
from flask_login import login_user, logout_user, login_required, current_user
from functools import wraps
from .auth import User

bp = Blueprint('common', __name__)

def get_user_type():
    """ユーザータイプを取得"""
    if current_user.is_authenticated:
        return current_user.user_type
    return 'public'

def route_by_user_type(view_func):
    """ユーザータイプに基づいてルーティングするデコレータ"""
    @wraps(view_func)
    def wrapped(*args, **kwargs):
        # ログインページの場合はリダイレクトしない
        if request.endpoint and ('login' in request.endpoint or 'auth' in request.endpoint):
            return view_func(*args, **kwargs)

        user_type = get_user_type()
        route_rules = current_app.config.get('ROUTE_RULES', {})
        
        # ユーザータイプに基づいてリダイレクト
        if user_type in route_rules:
            if user_type == 'public':
                return view_func(*args, **kwargs)
            target = route_rules[user_type].get('dashboard')
            if target:
                return redirect(target)
        return view_func(*args, **kwargs)
    return wrapped

@bp.route('/')
@route_by_user_type
def index():
    """共通のインデックスページ"""
    try:
        return render_template('common/home.html')
    except Exception as e:
        current_app.logger.error(f"テンプレートのレンダリングエラー: {str(e)}")
        return render_template('common/error.html', error=str(e)), 500

@bp.route('/login', methods=['GET', 'POST'])
def login():
    """共通のログインページ"""
    if current_user.is_authenticated:
        return redirect(url_for('common.index'))

    try:
        if request.method == 'POST':
            username = request.form.get('username')
            password = request.form.get('password')
            remember = request.form.get('remember_me', False)

            # ここでユーザー認証を行う（実装は省略）
            # 認証成功時の例：
            # user = authenticate_user(username, password)
            # if user:
            #     login_user(user, remember=remember)
            #     return redirect(url_for('common.index'))

            flash('ユーザー名またはパスワードが正しくありません。', 'error')

        return render_template('common/login.html')
    except Exception as e:
        current_app.logger.error(f"テンプレートのレンダリングエラー: {str(e)}")
        return render_template('common/error.html', error=str(e)), 500

@bp.route('/logout')
@login_required
def logout():
    """ログアウト処理"""
    logout_user()
    return redirect(url_for('common.index'))

@bp.route('/about')
def about():
    """共通の概要ページ"""
    try:
        return render_template('common/about.html')
    except Exception as e:
        current_app.logger.error(f"テンプレートのレンダリングエラー: {str(e)}")
        return render_template('common/error.html', error=str(e)), 500 