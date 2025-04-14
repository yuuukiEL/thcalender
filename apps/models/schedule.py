"""スケジュールモデル"""
from apps.extensions import db
from datetime import datetime
import numpy as np
from sqlalchemy import text

# Cythonを使わないフォールバック関数を直接定義
def fast_schedule_processing(schedule_data):
    """スケジュールデータの処理（Pythonのみ）"""
    result = np.array(schedule_data) * 2
    return result

class StudentSchedule(db.Model):
    """学生スケジュールモデル"""
    __tablename__ = 'student_schedules'
    __table_args__ = (
        db.UniqueConstraint('student_id', 'day', 'period', name='unique_schedule'),
        {'extend_existing': True}
    )

    schedule_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    student_id = db.Column(db.String(20), db.ForeignKey('students.student_id'), nullable=False)
    day = db.Column(db.String(10), nullable=False)  # 曜日
    period = db.Column(db.Integer, nullable=False)  # 時限
    subject_name = db.Column(db.String(100), nullable=False)  # 科目名
    teacher_id = db.Column(db.String(20), db.ForeignKey('teachers.teacher_id'), nullable=True)
    classroom_id = db.Column(db.String(20), db.ForeignKey('classrooms.classroom_id'), nullable=True)
    schedule_file_url = db.Column(db.String(255), nullable=True)  # 資料URL
    content = db.Column(db.Text, nullable=True)  # 内容
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)

    # リレーションシップ
    student = db.relationship('Student', backref=db.backref('schedule_items', lazy=True))
    teacher = db.relationship('Teacher', backref=db.backref('teacher_schedules', lazy=True))
    classroom = db.relationship('Classroom', backref=db.backref('classroom_schedules', lazy=True))
    
    def __repr__(self):
        return f'<StudentSchedule {self.schedule_id}: {self.student_id} - {self.day} {self.period}>'

    def to_dict(self):
        """辞書形式に変換"""
        return {
            'id': self.schedule_id,
            'student_id': self.student_id,
            'day': self.day,
            'period': self.period,
            'subject_name': self.subject_name,
            'teacher': self.teacher.to_dict() if self.teacher else None,
            'classroom': self.classroom.to_dict() if self.classroom else None,
            'schedule_file_url': self.schedule_file_url,
            'content': self.content,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    @classmethod
    def process_schedule_data(cls, schedule_data):
        """スケジュールデータの高速処理"""
        # リストをNumPy配列に変換
        data_array = np.array(schedule_data, dtype=np.int32)
        
        # Cython関数またはフォールバック関数で処理
        processed_data = fast_schedule_processing(data_array)
        
        # 必要に応じて結果を変換
        return processed_data.tolist()

def analyze_schedule_distribution(db_session):
    """時間割の分布を高速分析"""
    # 曜日と時限ごとの授業数を取得
    query = """
    SELECT day, period, COUNT(*) as count 
    FROM student_schedules 
    GROUP BY day, period
    """
    results = db_session.execute(text(query)).fetchall()
    
    # 曜日のマッピング
    days = ['月', '火', '水', '木', '金', '土', '日']
    day_map = {day: i for i, day in enumerate(days)}
    
    # 結果を2次元配列に格納
    # 7日 x 最大8時限の配列を作成
    schedule_matrix = np.zeros((7, 8), dtype=np.int32)
    
    for row in results:
        day = row[0]
        period = row[1] - 1  # 0-indexedに変換
        count = row[2]
        
        if day in day_map and 0 <= period < 8:
            schedule_matrix[day_map[day], period] = count
    
    # 曜日ごとの合計
    day_totals = np.sum(schedule_matrix, axis=1)
    
    # 時限ごとの合計
    period_totals = np.sum(schedule_matrix, axis=0)
    
    # 最も授業が多い曜日と時限
    max_day_idx = np.argmax(day_totals)
    max_period_idx = np.argmax(period_totals)
    
    return {
        'matrix': schedule_matrix.tolist(),
        'day_totals': day_totals.tolist(),
        'period_totals': period_totals.tolist(),
        'busiest_day': days[max_day_idx],
        'busiest_period': max_period_idx + 1,
        'total_classes': int(np.sum(schedule_matrix))
    }