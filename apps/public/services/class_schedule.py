from flask import Blueprint, render_template, request, flash, redirect, url_for
from apps.models import db, Class, Subject, Teacher, Classroom, ClassSchedule
from datetime import datetime

class_schedule_bp = Blueprint('class_schedule', __name__)

@class_schedule_bp.route('/register_class_schedule', methods=['GET', 'POST'])
def register_class_schedule():
    if request.method == 'POST':
        try:
            # フォームデータの取得
            class_id = request.form.get('class_select')
            start_date = request.form.get('start_date')
            end_date = request.form.get('end_date')
            schedule_data = request.form.getlist('schedule')

            # バリデーション
            if not class_id or not start_date or not end_date:
                flash('必須項目が入力されていません', 'error')
                return redirect(url_for('class_schedule.register_class_schedule'))

            # 既存のスケジュールを削除
            ClassSchedule.query.filter_by(class_id=class_id).delete()

            # 新しいスケジュールを登録
            for day, periods in schedule_data.items():
                for period, details in periods.items():
                    if details['subject'] and details['teacher_id'] and details['classroom_id']:
                        new_schedule = ClassSchedule(
                            class_id=class_id,
                            day_of_week=day,
                            period=period,
                            subject_id=details['subject'],
                            teacher_id=details['teacher_id'],
                            classroom_id=details['classroom_id'],
                            start_date=datetime.strptime(start_date, '%Y-%m-%d'),
                            end_date=datetime.strptime(end_date, '%Y-%m-%d')
                        )
                        db.session.add(new_schedule)

            db.session.commit()
            flash('クラススケジュールが正常に登録されました', 'success')
            return redirect(url_for('class_schedule.register_class_schedule'))

        except Exception as e:
            db.session.rollback()
            flash(f'スケジュール登録中にエラーが発生しました: {str(e)}', 'error')
            return redirect(url_for('class_schedule.register_class_schedule'))

    # GETリクエスト時の処理
    classes = Class.query.order_by(Class.class_id).all()
    subjects = Subject.query.order_by(Subject.subject_name).all()
    teachers = Teacher.query.order_by(Teacher.name).all()
    classrooms = Classroom.query.order_by(Classroom.classroom_id).all()

    return render_template('register_class_schedule.html',
                           classes=classes,
                           subjects=subjects,
                           teachers=teachers,
                           classrooms=classrooms) 