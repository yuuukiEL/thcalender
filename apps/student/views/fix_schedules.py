"""スケジュールデータを修正するスクリプト"""
from apps import create_app
from apps.extensions import db
from apps.models.schedule import StudentSchedule
from sqlalchemy import text

app = create_app()

with app.app_context():
    # 問題のあるレコードを検索
    problematic_records = StudentSchedule.query.filter(
        (StudentSchedule.day == '') | 
        (StudentSchedule.day.is_(None))
    ).all()
    
    print(f"問題のあるレコード数: {len(problematic_records)}")
    for record in problematic_records:
        print(f"ID: {record.schedule_id}, 学生ID: {record.student_id}, 曜日: '{record.day}', 時限: {record.period}")
    
    # 問題のあるレコードを削除
    if problematic_records:
        for record in problematic_records:
            db.session.delete(record)
        db.session.commit()
        print("問題のあるレコードを削除しました")
    
    # 特定の学生のスケジュールをすべて削除
    student_id = '20024'  # 対象の学生ID
    records = StudentSchedule.query.filter_by(student_id=student_id).all()
    print(f"学生ID {student_id} のレコード数: {len(records)}")
    for record in records:
        print(f"ID: {record.schedule_id}, 曜日: '{record.day}', 時限: {record.period}")
        db.session.delete(record)
    db.session.commit()
    print(f"学生ID {student_id} のレコードをすべて削除しました")
    
    # ユニーク制約を確認
    result = db.session.execute(text("""
        SELECT CONSTRAINT_NAME, TABLE_NAME
        FROM information_schema.TABLE_CONSTRAINTS
        WHERE CONSTRAINT_TYPE = 'UNIQUE'
        AND TABLE_NAME = 'student_schedules'
    """))
    
    for row in result:
        print(f"制約名: {row[0]}, テーブル名: {row[1]}")
        
    # 制約の詳細を確認
    result = db.session.execute(text("""
        SELECT COLUMN_NAME
        FROM information_schema.KEY_COLUMN_USAGE
        WHERE CONSTRAINT_NAME = 'unique_schedule'
        AND TABLE_NAME = 'student_schedules'
    """))
    
    print("unique_schedule制約のカラム:")
    for row in result:
        print(f"- {row[0]}") 