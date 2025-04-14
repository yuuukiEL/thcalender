from flask import Blueprint, render_template, jsonify, request, send_file, current_app
from apps.database.connection import get_db
from sqlalchemy import text
import os
from werkzeug.utils import secure_filename
from pathlib import Path
import base64
import io

# Blueprintの定義を修正
bp = Blueprint('schedule_pdf', __name__, url_prefix='/schedule-pdf')

# アプリケーションのルートディレクトリを取得
APP_ROOT = Path(__file__).parent.parent.parent
UPLOAD_FOLDER = APP_ROOT / 'uploads' / 'seating_pdfs'
UPLOAD_FOLDER.mkdir(parents=True, exist_ok=True)

# グローバルエラーハンドラーを追加
@bp.errorhandler(404)
@bp.errorhandler(500)
def handle_error(e):
    return jsonify({
        'error': 'Not Found' if e.code == 404 else 'Internal Server Error',
        'status': e.code
    }), e.code

# メインページ
@bp.route('/')
def index():
    return render_template('schedule_pdf/index.html')

@bp.route('/get-class-schedule/<int:class_id>')
def get_class_schedule(class_id):
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        
        print(f"Fetching schedule for class_id: {class_id}, start_date: {start_date}, end_date: {end_date}")
        
        cursor.execute("""
            SELECT DISTINCT
                cs.schedule_id,
                cs.day,
                cs.period,
                s.subject_name,
                t.name as teacher_name,
                cr.classroom_id,
                cs.start_date,
                cs.end_date
            FROM class_common_schedules cs
            JOIN subjects s ON cs.subject_id = s.subject_id
            JOIN teachers t ON cs.teacher_id = t.teacher_id
            JOIN classrooms cr ON cs.classroom_id = cr.classroom_id
            WHERE cs.class_id = %s
            AND (
                (cs.start_date <= %s AND cs.end_date >= %s)  -- 期間が重なる
                OR
                (cs.start_date BETWEEN %s AND %s)  -- 開始日が期間内
                OR
                (cs.end_date BETWEEN %s AND %s)    -- 終了日が期間内
            )
            ORDER BY 
                CASE cs.day
                    WHEN '月曜' THEN 1
                    WHEN '火曜' THEN 2
                    WHEN '水曜' THEN 3
                    WHEN '木曜' THEN 4
                    WHEN '金曜' THEN 5
                    WHEN '土曜' THEN 6
                END,
                CASE cs.period
                    WHEN '1限' THEN 1
                    WHEN '2限' THEN 2
                    WHEN '3限' THEN 3
                    WHEN '4限' THEN 4
                    WHEN '5限' THEN 5
                    WHEN '6限' THEN 6
                    WHEN '夜間' THEN 7
                END
        """, (
            class_id, 
            end_date, start_date,  # 期間が重なる
            start_date, end_date,  # 開始日が期間内
            start_date, end_date   # 終了日が期間内
        ))
        
        schedules = cursor.fetchall()
        print(f"Found {len(schedules)} schedules")
        for schedule in schedules:
            print(f"Schedule: {schedule}")
        
        return jsonify({
            'schedules': [{
                'schedule_id': row['schedule_id'],
                'day': row['day'],
                'period': row['period'],
                'subject_name': row['subject_name'],
                'teacher_name': row['teacher_name'],
                'classroom_id': row['classroom_id'],
                'start_date': row['start_date'].strftime('%Y-%m-%d') if row['start_date'] else None,
                'end_date': row['end_date'].strftime('%Y-%m-%d') if row['end_date'] else None
            } for row in schedules]
        })
        
    except Exception as e:
        print(f"時間割取得エラー: {e}")
        return jsonify({'error': str(e)}), 500
        
    finally:
        cursor.close() 

@bp.route('/get-all-schedules/<int:class_id>')
def get_all_schedules(class_id):
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT DISTINCT
                cs.schedule_id,
                cs.day,
                cs.period,
                s.subject_name,
                t.name as teacher_name,
                cr.classroom_id,
                cs.start_date,
                cs.end_date
            FROM class_common_schedules cs
            JOIN subjects s ON cs.subject_id = s.subject_id
            JOIN teachers t ON cs.teacher_id = t.teacher_id
            JOIN classrooms cr ON cs.classroom_id = cr.classroom_id
            WHERE cs.class_id = %s
            AND cs.end_date >= CURDATE()  -- 終了日が現在日付以降のものを表示
            ORDER BY 
                cs.start_date,
                CASE cs.day
                    WHEN '月曜' THEN 1
                    WHEN '火曜' THEN 2
                    WHEN '水曜' THEN 3
                    WHEN '木曜' THEN 4
                    WHEN '金曜' THEN 5
                    WHEN '土曜' THEN 6
                END,
                CASE cs.period
                    WHEN '1限' THEN 1
                    WHEN '2限' THEN 2
                    WHEN '3限' THEN 3
                    WHEN '4限' THEN 4
                    WHEN '5限' THEN 5
                    WHEN '6限' THEN 6
                    WHEN '夜間' THEN 7
                END
        """, (class_id,))
        
        schedules = cursor.fetchall()
        
        return jsonify({
            'schedules': [{
                'schedule_id': row['schedule_id'],
                'day': row['day'],
                'period': row['period'],
                'subject_name': row['subject_name'],
                'teacher_name': row['teacher_name'],
                'classroom_id': row['classroom_id'],
                'start_date': row['start_date'].strftime('%Y-%m-%d') if row['start_date'] else None,
                'end_date': row['end_date'].strftime('%Y-%m-%d') if row['end_date'] else None
            } for row in schedules]
        })
        
    except Exception as e:
        print(f"時間割取得エラー: {e}")
        return jsonify({'error': str(e)}), 500
        
    finally:
        cursor.close() 

@bp.route('/api/upload-seating-pdf/<int:schedule_id>', methods=['POST'])
def upload_seating_pdf(schedule_id):
    try:
        if 'pdf' not in request.files:
            return jsonify({'error': 'PDFファイルが見つかりません'}), 400
            
        pdf_file = request.files['pdf']
        if pdf_file.filename == '':
            return jsonify({'error': 'ファイルが選択されていません'}), 400
            
        if pdf_file and pdf_file.filename.endswith('.pdf'):
            filename = f'seating_{schedule_id}.pdf'
            filepath = UPLOAD_FOLDER / filename
            pdf_file.save(str(filepath))
            return jsonify({'success': True})
            
        return jsonify({'error': '無効なファイル形式です'}), 400
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/api/seating-pdf/<int:schedule_id>')
def get_seating_pdf(schedule_id):
    try:
        filepath = UPLOAD_FOLDER / f'seating_{schedule_id}.pdf'
        if filepath.exists():
            return send_file(str(filepath), mimetype='application/pdf')
        return '', 404
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500 

@bp.route('/api/class-students/<int:schedule_id>')
def get_class_students(schedule_id):
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        
        # スケジュールの存在確認とclass_idの取得
        cursor.execute("""
            SELECT cs.class_id 
            FROM class_common_schedules cs
            WHERE cs.schedule_id = %s
        """, (schedule_id,))
        
        schedule = cursor.fetchone()
        if not schedule:
            return jsonify([])
            
        # 生徒情報の取得（ステータス表示を修正）
        cursor.execute("""
            SELECT DISTINCT
                s.student_base_number,
                s.name,
                s.student_base_number as attendance_number,
                s.status,  -- statusをそのまま返す
                CASE s.status 
                    WHEN 'active' THEN '在籍中'
                    ELSE '休学中'
                END as status_text
            FROM students s
            WHERE s.class_id = %s
            AND s.status = 'active'  -- activeな生徒のみを取得
            ORDER BY s.student_base_number
        """, (schedule['class_id'],))
        
        students = cursor.fetchall()
        return jsonify([{
            'student_number': student['student_base_number'],
            'name': student['name'],
            'attendance_number': student['attendance_number'],
            'status': student['status'],  # 元のステータス
            'status_text': student['status_text']  # 日本語のステータス
        } for student in students])
        
    except Exception as e:
        current_app.logger.error(f"生徒情報取得エラー: {e}")
        return jsonify([])
        
    finally:
        cursor.close()

@bp.route('/api/classroom/<int:classroom_id>')
def get_classroom(classroom_id):
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT 
                classroom_id,
                COALESCE(seating_capacity, 36) as seating_capacity,  -- capacityをseating_capacityに修正
                CONCAT(classroom_id, '教室') as classroom_name
            FROM classrooms
            WHERE classroom_id = %s
        """, (classroom_id,))
        
        classroom = cursor.fetchone()
        if not classroom:
            return jsonify({
                'classroom_id': classroom_id,
                'seating_capacity': 36,
                'classroom_name': f'{classroom_id}教室'
            })
            
        return jsonify(classroom)
        
    except Exception as e:
        current_app.logger.error(f"教室情報取得エラー: {e}")
        return jsonify({
            'classroom_id': classroom_id,
            'seating_capacity': 36,
            'classroom_name': f'{classroom_id}教室'
        })
        
    finally:
        cursor.close() 

@bp.route('/api/seating/save', methods=['POST'])
def save_seating_chart():
    try:
        data = request.json
        schedule_id = data.get('schedule_id')
        pdf_data = data.get('pdf_data')
        pdf_name = data.get('pdf_name', 'seating.pdf')
        
        # Base64デコード
        pdf_binary = base64.b64decode(pdf_data.split(',')[1])
        
        with get_db() as conn:
            with conn.cursor() as cur:
                # まず既存のレコードを確認
                cur.execute("""
                    SELECT id FROM schedule_pdf 
                    WHERE schedule_id = %s
                """, (schedule_id,))
                existing = cur.fetchone()
                
                if existing:
                    # 更新
                    cur.execute("""
                        UPDATE schedule_pdf 
                        SET seating_pdf = %s,
                            pdf_name = %s,
                            mime_type = %s,
                            updated_at = CURRENT_TIMESTAMP
                        WHERE schedule_id = %s
                    """, (pdf_binary, pdf_name, 'application/pdf', schedule_id))
                    result_id = existing[0]
                else:
                    # 新規挿入
                    cur.execute("""
                        INSERT INTO schedule_pdf 
                        (schedule_id, seating_pdf, pdf_name, mime_type) 
                        VALUES (%s, %s, %s, %s)
                    """, (schedule_id, pdf_binary, pdf_name, 'application/pdf'))
                    result_id = cur.lastrowid
                
                conn.commit()
                
        return jsonify({'success': True, 'id': result_id})
    except Exception as e:
        current_app.logger.error(f"Error saving PDF: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/api/seating/<int:schedule_id>', methods=['GET'])
def get_seating_chart(schedule_id):
    try:
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT seating_pdf, pdf_name, mime_type 
                    FROM seating_pdfs 
                    WHERE schedule_id = %s
                """, (schedule_id,))
                result = cur.fetchone()
                
                if result and result[0]:
                    return send_file(
                        io.BytesIO(result[0]),
                        mimetype=result[2],
                        download_name=result[1],
                        as_attachment=False
                    )
                    
        return jsonify({'success': False, 'error': 'PDF not found'}), 404
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500 