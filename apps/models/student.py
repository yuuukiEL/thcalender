"""学生モデル"""
from apps.extensions import db
from datetime import datetime
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from apps.models.base import BaseModel
from sqlalchemy.orm import joinedload, relationship
from sqlalchemy import text
import numpy as np

# Cythonを使わないフォールバック関数を直接定義
def fast_student_search(db_session, name_query, course_id=None):
    """学生の高速検索（Pythonのみ）"""
    query = "SELECT * FROM students WHERE name LIKE :name"
    params = {"name": f"%{name_query}%"}
    
    if course_id:
        query += " AND course_id = :course_id"
        params["course_id"] = course_id
    
    results = db_session.execute(text(query), params).fetchall()
    return [dict(row._mapping) for row in results]

def calculate_attendance_stats(attendance_rates):
    """出席率の統計計算（Pythonのみ）"""
    if len(attendance_rates) == 0:
        return {"mean": 0, "std": 0, "min": 0, "max": 0, "count": 0}
    
    return {
        "mean": float(np.mean(attendance_rates)),
        "std": float(np.std(attendance_rates)),
        "min": float(np.min(attendance_rates)),
        "max": float(np.max(attendance_rates)),
        "count": len(attendance_rates)
    }

class Student(UserMixin, db.Model):
    """学生モデル"""
    __tablename__ = 'students'
    __table_args__ = {'extend_existing': True}

    # 基本情報
    student_id = db.Column(db.String(5), primary_key=True, comment='生徒ID（ユニーク、学生が自分で入力）')
    name = db.Column(db.String(255), nullable=False, comment='生徒名')
    password = db.Column(db.String(255), nullable=False, comment='パスワード')
    email = db.Column(db.String(255), nullable=False, comment='メールアドレス')
    profile_image_path = db.Column(db.String(255), nullable=True, comment='画像の相対パス')
    
    # 学籍情報
    enrollment_year = db.Column(db.Integer, nullable=False, comment='入学年')
    enrollment_term = db.Column(db.String(1), nullable=False, comment='入学学期')
    course_id = db.Column(db.Integer, db.ForeignKey('course_master.course_id'), nullable=False, comment='コースID')
    current_grade = db.Column(db.Integer, nullable=False, comment='現在の学年')
    specialization_id = db.Column(
        db.Integer, 
        db.ForeignKey('specialization_master.specialization_id'),
        nullable=True, 
        comment='専攻ID'
    )
    status = db.Column(db.Enum('active','leave','graduated','withdrawn'), nullable=False, default='active', comment='ステータス')
    
    # タイムスタンプ
    created_at = db.Column(db.TIMESTAMP, nullable=False, server_default=db.text('CURRENT_TIMESTAMP'), comment='作成日時')
    updated_at = db.Column(db.TIMESTAMP, nullable=False, server_default=db.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'), comment='更新日時')

    # リレーションシップ
    course = db.relationship('CourseMaster', back_populates='students')
    specialization = db.relationship('SpecializationMaster', back_populates='students')
    
    # スケジュール関連のリレーションシップ
    schedules = db.relationship(
        'apps.models.schedule.StudentSchedule',
        back_populates='student',
        cascade='all, delete-orphan'
    )

    # タスク関連のリレーションシップ
    student_tasks = db.relationship(
        'apps.student.models.task.Task',
        back_populates='student',
        lazy=True,
        cascade='all, delete-orphan'
    )

    # リレーションシップを一時的に削除
    # api_connections = relationship("StudentApiConnection", backref="student", lazy=True)

    def __repr__(self):
        """オブジェクトの文字列表現"""
        return f'<Student {self.student_id}: {self.name}>'

    def to_dict(self):
        """モデルを辞書に変換"""
        return {
            'student_id': self.student_id,
            'name': self.name,
            'email': self.email,
            'profile_image_path': self.profile_image_path,
            'enrollment_year': self.enrollment_year,
            'enrollment_term': self.enrollment_term,
            'course_id': self.course_id,
            'current_grade': self.current_grade,
            'specialization_id': self.specialization_id,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    def get_id(self):
        """ユーザーIDを取得"""
        return str(self.student_id)

    def set_password(self, password):
        """パスワードをハッシュ化して設定"""
        self.password = generate_password_hash(password)

    def check_password(self, password):
        """パスワードを検証"""
        return check_password_hash(self.password, password)

    @classmethod
    def fast_search(cls, name_query, course_id=None):
        """Cythonを使用した高速検索"""
        student_dicts = fast_student_search(db.session, name_query, course_id)
        
        # 辞書からStudentオブジェクトを作成
        students = []
        for student_dict in student_dicts:
            student = cls()
            for key, value in student_dict.items():
                setattr(student, key, value)
            students.append(student)
        
        return students
    
    @classmethod
    def get_attendance_stats(cls, student_ids=None):
        """Cythonを使用した出席率統計の高速計算"""
        query = cls.query
        if student_ids:
            query = query.filter(cls.student_id.in_(student_ids))
        
        # 出席率のみを取得
        attendance_rates = [s.attendance_rate for s in query.all() if s.attendance_rate is not None]
        
        # NumPy配列に変換
        attendance_array = np.array(attendance_rates, dtype=np.float64)
        
        # Cython関数で統計計算
        return calculate_attendance_stats(attendance_array)

class StudentUser(UserMixin):
    """Flask-Loginで使用するユーザークラス"""
    def __init__(self, student):
        self.id = student.student_id
        self.student = student
    
    @property
    def is_active(self):
        return self.student.is_active if hasattr(self.student, 'is_active') else True
    
    def get_id(self):
        return self.id

# NumPyを使った高速な学生データ分析
def analyze_student_data(db_session, course_id=None):
    """NumPyを使った学生データの高速分析"""
    # SQLで直接データを取得
    query = "SELECT student_id, enrollment_year, current_grade FROM students"
    if course_id:
        query += " WHERE course_id = :course_id"
        params = {"course_id": course_id}
        results = db_session.execute(text(query), params).fetchall()
    else:
        results = db_session.execute(text(query)).fetchall()
    
    # NumPy配列に変換
    student_ids = []
    years = []
    grades = []
    
    for row in results:
        student_ids.append(row[0])
        years.append(row[1])
        grades.append(row[2])
    
    # NumPy配列に変換して高速処理
    years_array = np.array(years, dtype=np.int32)
    grades_array = np.array(grades, dtype=np.int32)
    
    # 統計計算（非常に高速）
    stats = {
        'count': len(years_array),
        'year_mean': float(np.mean(years_array)),
        'year_std': float(np.std(years_array)),
        'year_min': int(np.min(years_array)),
        'year_max': int(np.max(years_array)),
        'grade_mean': float(np.mean(grades_array)),
        'grade_distribution': np.bincount(grades_array).tolist()
    }
    
    return stats