"""認証関連のビュー"""
from flask import Blueprint, render_template, request, current_app, redirect, url_for, flash, session, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from apps.models.student import Student, StudentUser
from apps.models.course import CourseMaster, SpecializationMaster
from apps.student.models.student_auth import StudentAuth
from apps.extensions import db
from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField
from wtforms.validators import DataRequired
from apps.common.forms import LoginForm, StudentRegisterForm
from apps.student.forms.auth import StudentRegistrationForm, LoginForm
from werkzeug.utils import secure_filename

import os
from datetime import datetime

# Blueprintの作成
bp = Blueprint('student_register', __name__)  # auth_bpからbpに変更

def allowed_file(filename):
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}  # 許可する拡張子を指定
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@bp.route('/login', methods=['GET', 'POST'])
def login():
    """ログインページ"""
    if current_user.is_authenticated:
        return redirect(url_for('student.home.index'))

    form = LoginForm()
    if form.validate_on_submit():
        student = Student.query.filter_by(student_id=form.username.data).first()
        if student and student.check_password(form.password.data):
            user = StudentUser(student)
            login_user(user)
            session['student_id'] = student.student_id
            session['logged_in'] = True
            return redirect(url_for('student.home.index'))
        flash('ユーザー名またはパスワードが違います')
    
    return render_template('student/auth/login.html', form=form)

@bp.route('/logout')
@login_required
def logout():
    """ログアウト処理"""
    logout_user()
    flash('ログアウトしました。', 'success')
    return redirect(url_for('common.home'))  # common.homeに変更

@bp.route('/register', methods=['GET', 'POST'])
def register():
    """学生登録ページ"""
    form = StudentRegistrationForm()
    return render_template('student/auth/register.html', form=form)

@bp.route('/forgot-password', methods=['GET', 'POST'])
def forgot_password():
    """パスワード再設定処理"""
    return render_template('common/auth/forgot_password/student.html')

@bp.route('/complete')
def complete():
    """登録完了ページを表示"""
    # セッションから登録情報を取得
    student_id = session.get('student_id')
    name = session.get('name')
    department = session.get('department')
    
    # セッションをクリア
    session.clear()
    
    return render_template('student/auth/complete.html',
                         student_id=student_id,
                         name=name,
                         department=department)

@bp.route('/api/register', methods=['POST'])
def api_register():
    # この関数を削除 
    pass 