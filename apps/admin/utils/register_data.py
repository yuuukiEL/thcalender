from flask import Flask, render_template, request, redirect, url_for, flash
from werkzeug.utils import secure_filename
import os
import mysql.connector
from datetime import datetime
from apps import create_app
from apps.extensions import db
from apps.models.course import CourseMaster, SpecializationMaster

app = Flask(__name__)
app.secret_key = 'your_secret_key'  # セッション用の秘密鍵

# アップロード設定
UPLOAD_FOLDER = 'static/img/teacher'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# データベース接続設定
def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="",
        database="calender"
    )

# ディレクトリ構造の確認と作成
def check_directories():
    print("Checking directory structure...")
    directories = [
        'templates/auth',
        'static/img/teacher'
    ]
    
    for directory in directories:
        full_path = os.path.join(os.path.dirname(__file__), directory)
        if os.path.exists(full_path):
            print(f"Directory exists: {full_path}")
        else:
            os.makedirs(full_path)
            print(f"Created directory: {full_path}")
    
    print(f"Upload directory: {app.config['UPLOAD_FOLDER']}")

# メインの登録メニュー
@app.route('/register')
def register():
    return render_template('auth/register.html')

# 学生情報登録
@app.route('/register/student', methods=['GET', 'POST'])
def register_student():
    if request.method == 'POST':
        student_base_number = request.form['student_base_number']
        name = request.form['name']
        department_letters = request.form['department_letters']
        department_number = request.form['department_number']
        class_letter = request.form['class_letter']
        class_number = request.form['class_number']
        attendance_number = request.form['attendance_number']
        password = request.form['password']
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute(
                """INSERT INTO students 
                (student_base_number, name, department_letters, department_number,
                class_letter, class_number, attendance_number, password)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
                (student_base_number, name, department_letters, department_number,
                class_letter, class_number, attendance_number, password)
            )
            conn.commit()
            flash('学生情報が正常に登録されました。', 'success')
            return redirect(url_for('register'))
        except mysql.connector.Error as err:
            flash(f'エラーが発生しました: {err}', 'error')
        finally:
            cursor.close()
            conn.close()
            
    return render_template('auth/register_student.html')

# 教員情報登録
@app.route('/register/teacher', methods=['GET', 'POST'])
def register_teacher():
    if request.method == 'POST':
        name = request.form['name']
        profile_image = request.files['profile_image']
        
        if profile_image:
            filename = secure_filename(profile_image.filename)
            profile_image.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            image_path = os.path.join('img/teacher', filename)
        else:
            image_path = None
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute(
                "INSERT INTO teachers (name, profile_image) VALUES (%s, %s)",
                (name, image_path)
            )
            conn.commit()
            flash('教員情報が正常に登録されました。', 'success')
            return redirect(url_for('register'))
        except mysql.connector.Error as err:
            flash(f'エラーが発生しました: {err}', 'error')
        finally:
            cursor.close()
            conn.close()
            
    return render_template('auth/register_teacher.html')

# 教科情報登録
@app.route('/register/subject', methods=['GET', 'POST'])
def register_subject():
    if request.method == 'POST':
        subject_name = request.form['subject_name']
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute(
                "INSERT INTO subjects (name) VALUES (%s)",
                (subject_name,)
            )
            conn.commit()
            flash('教科情報が正常に登録されました。', 'success')
            return redirect(url_for('register'))
        except mysql.connector.Error as err:
            flash(f'エラーが発生しました: {err}', 'error')
        finally:
            cursor.close()
            conn.close()
            
    return render_template('auth/register_subject.html')

# 教室情報登録
@app.route('/register/classroom', methods=['GET', 'POST'])
def register_classroom():
    if request.method == 'POST':
        classroom_number = request.form['classroom_number']
        floor = request.form['floor']
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute(
                "INSERT INTO classrooms (classroom_number, floor) VALUES (%s, %s)",
                (classroom_number, floor)
            )
            conn.commit()
            flash('教室情報が正常に登録されました。', 'success')
            return redirect(url_for('register'))
        except mysql.connector.Error as err:
            flash(f'エラーが発生しました: {err}', 'error')
        finally:
            cursor.close()
            conn.close()
            
    return render_template('auth/register_classroom.html')

# 教員週次スケジュール登録
@app.route('/register/teacher_schedule', methods=['GET', 'POST'])
def register_teacher_schedule():
    if request.method == 'POST':
        teacher_id = request.form['teacher_id']
        day = request.form['day']
        period = request.form['period']
        classroom_id = request.form['classroom_id']
        subject_id = request.form['subject_id']
        class_name = request.form['class_name']
        start_date = request.form['start_date']
        end_date = request.form['end_date']
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute(
                """INSERT INTO teacher_schedules 
                (teacher_id, day, period, classroom_id, subject_id, class_name, start_date, end_date)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
                (teacher_id, day, period, classroom_id, subject_id, class_name, start_date, end_date)
            )
            conn.commit()
            flash('教員スケジュールが正常に登録されました。', 'success')
            return redirect(url_for('register'))
        except mysql.connector.Error as err:
            flash(f'エラーが発生しました: {err}', 'error')
        finally:
            cursor.close()
            conn.close()
    
    # 教員、教室、教科のリストを取得
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        cursor.execute("SELECT teacher_id, name FROM teachers")
        teachers = cursor.fetchall()
        
        cursor.execute("SELECT classroom_id, classroom_number FROM classrooms")
        classrooms = cursor.fetchall()
        
        cursor.execute("SELECT subject_id, name as subject_name FROM subjects")
        subjects = cursor.fetchall()
        
        return render_template('auth/register_teacher_schedule.html',
                             teachers=teachers,
                             classrooms=classrooms,
                             subjects=subjects)
    except mysql.connector.Error as err:
        flash(f'エラーが発生しました: {err}', 'error')
        return redirect(url_for('register'))
    finally:
        cursor.close()
        conn.close()

# 空き教室登録
@app.route('/register/empty_classroom', methods=['GET', 'POST'])
def register_empty_classroom():
    if request.method == 'POST':
        classroom_id = request.form['classroom_id']
        date = request.form['date']
        day = request.form['day']
        period = request.form['period']
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute(
                "INSERT INTO empty_classrooms (classroom_id, date, day, period) VALUES (%s, %s, %s, %s)",
                (classroom_id, date, day, period)
            )
            conn.commit()
            flash('空き教室情報が正常に登録されました。', 'success')
            return redirect(url_for('register'))
        except mysql.connector.Error as err:
            flash(f'エラーが発生しました: {err}', 'error')
        finally:
            cursor.close()
            conn.close()
    
    # 教室のリストを取得
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        cursor.execute("SELECT classroom_id, classroom_number FROM classrooms")
        classrooms = cursor.fetchall()
        
        return render_template('auth/register_empty_classroom.html',
                             classrooms=classrooms)
    except mysql.connector.Error as err:
        flash(f'エラーが発生しました: {err}', 'error')
        return redirect(url_for('register'))
    finally:
        cursor.close()
        conn.close()

# 学校全体スケジュール登録
@app.route('/register/school_schedule', methods=['GET', 'POST'])
def register_school_schedule():
    if request.method == 'POST':
        title = request.form['title']
        description = request.form['description']
        start_datetime = request.form['start_datetime']
        end_datetime = request.form['end_datetime']
        target_group = request.form['target_group']
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute(
                """INSERT INTO school_schedules 
                (title, description, start_datetime, end_datetime, target_group)
                VALUES (%s, %s, %s, %s, %s)""",
                (title, description, start_datetime, end_datetime, target_group)
            )
            conn.commit()
            flash('学校スケジュールが正常に登録されました。', 'success')
            return redirect(url_for('register'))
        except mysql.connector.Error as err:
            flash(f'エラーが発生しました: {err}', 'error')
        finally:
            cursor.close()
            conn.close()
            
    return render_template('auth/register_school_schedule.html')

# クラス共通スケジュール登録
@app.route('/register/class_schedule', methods=['GET', 'POST'])
def register_class_schedule():
    if request.method == 'POST':
        department_letters = request.form['department_letters']
        department_number = request.form['department_number']
        class_letter = request.form['class_letter']
        class_number = request.form['class_number']
        day = request.form['day']
        period = request.form['period']
        classroom_id = request.form['classroom_id']
        teacher_id = request.form['teacher_id']
        title = request.form['title']
        description = request.form['description']
        start_date = request.form['start_date']
        end_date = request.form['end_date']
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute(
                """INSERT INTO class_schedules 
                (department_letters, department_number, class_letter, class_number,
                day, period, classroom_id, teacher_id, title, description, start_date, end_date)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                (department_letters, department_number, class_letter, class_number,
                day, period, classroom_id, teacher_id, title, description, start_date, end_date)
            )
            conn.commit()
            flash('クラススケジュールが正常に登録されました。', 'success')
            return redirect(url_for('register'))
        except mysql.connector.Error as err:
            flash(f'エラーが発生しました: {err}', 'error')
        finally:
            cursor.close()
            conn.close()
    
    # 教員と教室のリストを取得
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        cursor.execute("SELECT teacher_id, name FROM teachers")
        teachers = cursor.fetchall()
        
        cursor.execute("SELECT classroom_id, classroom_number FROM classrooms")
        classrooms = cursor.fetchall()
        
        return render_template('auth/register_class_schedule.html',
                             teachers=teachers,
                             classrooms=classrooms)
    except mysql.connector.Error as err:
        flash(f'エラーが発生しました: {err}', 'error')
        return redirect(url_for('register'))
    finally:
        cursor.close()
        conn.close()

def register_course_data():
    app = create_app()
    with app.app_context():
        # 既存のデータを削除
        SpecializationMaster.query.delete()
        CourseMaster.query.delete()
        
        # 課程マスターデータ
        courses = [
            # 全日制（本科）
            CourseMaster(course_code='IT', course_name='ITエンジニア科', attendance_type='full', course_type='regular'),
            CourseMaster(course_code='AI', course_name='AIエンジニア科', attendance_type='full', course_type='regular'),
            CourseMaster(course_code='WD', course_name='Webデザイン科', attendance_type='full', course_type='regular'),
            # 全日制（専攻科）
            CourseMaster(course_code='AD', course_name='高度ITエンジニア科', attendance_type='full', course_type='advanced'),
            # 定時制（本科）
            CourseMaster(course_code='PT', course_name='ITエンジニア科（定時）', attendance_type='part', course_type='regular'),
            # 定時制（専攻科）
            CourseMaster(course_code='PA', course_name='高度ITエンジニア科（定時）', attendance_type='part', course_type='advanced'),
        ]
        
        # 専攻マスターデータ
        specializations = [
            # ITエンジニア科の専攻
            SpecializationMaster(specialization_name='システム開発専攻', course_code='IT', grade=1),
            SpecializationMaster(specialization_name='ネットワーク専攻', course_code='IT', grade=1),
            # AIエンジニア科の専攻
            SpecializationMaster(specialization_name='機械学習専攻', course_code='AI', grade=1),
            SpecializationMaster(specialization_name='データサイエンス専攻', course_code='AI', grade=1),
            # Webデザイン科の専攻
            SpecializationMaster(specialization_name='UIデザイン専攻', course_code='WD', grade=1),
            SpecializationMaster(specialization_name='グラフィック専攻', course_code='WD', grade=1),
        ]
        
        # データベースに追加
        db.session.add_all(courses)
        db.session.add_all(specializations)
        db.session.commit()

if __name__ == '__main__':
    print("Starting application...")
    check_directories()
    print("\nStarting Flask application...")
    register_course_data()
    app.run(debug=True)