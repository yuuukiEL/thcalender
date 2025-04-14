from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SelectField, FileField
from wtforms.validators import DataRequired, Email, Length, EqualTo, Regexp

class StudentRegistrationForm(FlaskForm):
    """学生登録フォーム"""
    # 学籍番号を最初に
    student_id = StringField('学籍番号', 
        validators=[
            DataRequired(message='学籍番号を入力してください'),
            Length(min=5, max=5, message='学籍番号は5桁で入力してください'),
            Regexp(r'^[0-9]{5}$', message='学籍番号は数字5桁で入力してください')
        ])
    
    # 基本情報
    name = StringField('氏名', validators=[
        DataRequired(message='氏名を入力してください'),
        Length(max=255, message='氏名は255文字以内で入力してください')
    ])
    
    # 入学情報
    enrollment_year = SelectField('入学年度', 
        validators=[DataRequired(message='入学年度を選択してください')],
        choices=[] # ビューで動的に設定
    )
    
    enrollment_term = SelectField('入学期',
        validators=[DataRequired(message='入学期を選択してください')],
        choices=[
            ('1', '1期（4月入学）'),
            ('2', '2期（10月入学）')
        ]
    )

    # 学科・専攻情報
    department_code = StringField('学科コード', validators=[DataRequired()])
    specialization_id = StringField('専攻ID', validators=[DataRequired()])
    
    # パスワード
    password = PasswordField('パスワード', validators=[
        DataRequired(message='パスワードを入力してください'),
        Length(min=8, message='パスワードは8文字以上で入力してください')
    ])
    
    # プロフィール画像
    profile_image = FileField('プロフィール画像', validators=[])

    email = StringField('メールアドレス',  # 必須フィールドを追加
        validators=[
            DataRequired(message='メールアドレスを入力してください'),
            Email(message='有効なメールアドレスを入力してください')
        ])

    course_id = SelectField('コース', coerce=int, validators=[DataRequired()])
    specialization_id = SelectField('専攻', coerce=int, validators=[DataRequired()])

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # 現在の年から過去5年分の入学年度を選択可能に
        from datetime import datetime
        current_year = datetime.now().year
        self.enrollment_year.choices = [
            (str(year), f'{year}年度') 
            for year in range(current_year, current_year - 6, -1)  # 現在年から5年前まで
        ] 

class LoginForm(FlaskForm):
    """ログインフォーム"""
    username = StringField('学籍番号', validators=[DataRequired()])
    password = PasswordField('パスワード', validators=[DataRequired()]) 