from flask import Blueprint, render_template, session
from apps.models import Teacher
from .auth import admin_required

bp = Blueprint('admin_dashboard', __name__)

@bp.route('/')
@bp.route('/dashboard')
@admin_required
def dashboard():
    """管理者ダッシュボード"""
    teacher = Teacher.query.get(session.get('teacher_id'))
    return render_template('admin/dashboard.html', teacher=teacher)

@bp.route('/profile')
@admin_required
def profile():
    """管理者プロフィール"""
    teacher = Teacher.query.get(session.get('teacher_id'))
    return render_template('admin/profile.html', teacher=teacher) 