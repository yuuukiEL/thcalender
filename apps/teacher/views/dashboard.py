from flask import Blueprint, render_template
from flask_login import login_required, current_user

bp = Blueprint('dashboard', __name__)

@bp.route('/')
@login_required
def index():
    """教員ダッシュボードのメインページ"""
    return render_template('teacher/dashboard/index.html') 