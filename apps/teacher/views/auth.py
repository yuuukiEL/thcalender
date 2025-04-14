from flask import Blueprint, render_template, request, redirect, url_for, flash, session
from flask_login import login_user, logout_user, login_required
from apps.models import Teacher
from apps.extensions import db
from apps.common.forms import LoginForm, TeacherRegisterForm

bp = Blueprint('auth', __name__)

@bp.route('/login', methods=['GET', 'POST'])
def login():
    form = LoginForm()
    if form.validate_on_submit():
        teacher = Teacher.query.filter_by(teacher_id=form.username.data).first()
        if teacher and teacher.check_password(form.password.data):
            login_user(teacher, remember=form.remember.data)
            return redirect(url_for('teacher.dashboard.index'))
        flash('ユーザーIDまたはパスワードが正しくありません', 'error')
    
    return render_template('teacher/auth/login_teacher.html',
                         form=form)

@bp.route('/register', methods=['GET', 'POST'])
def register():
    form = TeacherRegisterForm()
    # 学科の選択肢を設定
    form.department.choices = [
        ('IT', '情報工学科'),
        ('ME', '機械工学科'),
        ('EE', '電気電子工学科')
    ]
    
    if form.validate_on_submit():
        if Teacher.query.filter_by(teacher_id=form.teacher_id.data).first():
            flash('この教員IDは既に使用されています', 'error')
        elif Teacher.query.filter_by(email=form.email.data).first():
            flash('このメールアドレスは既に使用されています', 'error')
        else:
            teacher = Teacher(
                teacher_id=form.teacher_id.data,
                name=form.username.data,
                email=form.email.data,
                department=form.department.data
            )
            teacher.set_password(form.password.data)
            db.session.add(teacher)
            db.session.commit()
            flash('アカウントが作成されました。ログインしてください。', 'success')
            return redirect(url_for('teacher.auth.login'))
    
    return render_template('teacher/auth/register_teacher.html',
                         form=form)

@bp.route('/logout')
@login_required
def logout():
    """ログアウト処理"""
    logout_user()
    session.clear()
    return redirect(url_for('common.index')) 