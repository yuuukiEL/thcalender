from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, BooleanField, EmailField, SelectField, IntegerField
from wtforms.validators import DataRequired, Email, EqualTo, Length, NumberRange

class BaseRegisterForm(FlaskForm):
    """基本登録フォーム"""
    username = StringField('ユーザー名', validators=[
        DataRequired(),
        Length(min=4, max=20)
    ])
    email = EmailField('メールアドレス', validators=[
        DataRequired(),
        Email()
    ])
    password = PasswordField('パスワード', validators=[
        DataRequired(),
        Length(min=6),
        EqualTo('confirm_password', message='パスワードが一致しません')
    ])
    confirm_password = PasswordField('パスワード（確認）')

class StudentRegisterForm(FlaskForm):
    """学生登録フォーム"""
    student_id = StringField('学籍番号', validators=[
        DataRequired(),
        Length(min=7, max=7, message='学籍番号は7桁で入力してください')
    ])
    name = StringField('氏名', validators=[
        DataRequired(),
        Length(max=100)
    ])
    email = EmailField('メールアドレス', validators=[
        DataRequired(),
        Email()
    ])
    password = PasswordField('パスワード', validators=[
        DataRequired(),
        Length(min=8, message='パスワードは8文字以上で入力してください'),
        EqualTo('password_confirm', message='パスワードが一致しません')
    ])
    password_confirm = PasswordField('パスワード（確認）')
    course = SelectField('学科', validators=[DataRequired()])

class TeacherRegisterForm(BaseRegisterForm):
    """教員用登録フォーム"""
    teacher_id = StringField('教員ID', validators=[
        DataRequired(),
        Length(min=4, max=10)
    ])
    department = SelectField('所属学科', validators=[DataRequired()])

class PublicRegisterForm(BaseRegisterForm):
    """一般ユーザー用登録フォーム"""
    pass

class LoginForm(FlaskForm):
    """ログインフォーム"""
    username = StringField('ユーザーID', validators=[DataRequired()])
    password = PasswordField('パスワード', validators=[DataRequired()])
    remember = BooleanField('ログインを記憶する') 