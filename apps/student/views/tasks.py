from flask import Blueprint, jsonify, request, session
from apps.student.models.task import Task  # 正しいTaskモデルをインポート
from apps.extensions import db
from datetime import datetime

tasks = Blueprint('student_tasks', __name__, url_prefix='/tasks')

@tasks.route('/create', methods=['POST'])
def create_task():
    try:
        if not session.get('logged_in'):
            return jsonify({'success': False, 'message': 'ログインが必要です'}), 401

        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'message': 'データが送信されていません'}), 400
            
        content = data.get('content')
        if not content:
            return jsonify({'success': False, 'message': '内容が空です'}), 400

        student_id = session.get('student_id')
        
        new_task = Task(
            student_id=student_id,
            content=content,
            is_completed=False
        )
        
        db.session.add(new_task)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'task_id': new_task.task_id
        })
    except Exception as e:
        db.session.rollback()
        print(f"Error creating task: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@tasks.route('/update_status', methods=['POST'])
def update_task_status():
    try:
        if not session.get('logged_in'):
            return jsonify({'success': False, 'message': 'ログインが必要です'}), 401

        data = request.get_json()
        task_id = data.get('task_id')
        is_completed = data.get('status') == '完了'  # is_completedに変換
        
        task = Task.query.get(task_id)
        if not task:
            return jsonify({'success': False, 'message': 'タスクが見つかりません'}), 404
        
        if task.student_id != session.get('student_id'):
            return jsonify({'success': False, 'message': '権限がありません'}), 403
        
        task.is_completed = is_completed
        db.session.commit()
        
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@tasks.route('/update_content', methods=['POST'])
def update_task_content():
    try:
        if not session.get('logged_in'):
            return jsonify({'success': False, 'message': 'ログインが必要です'}), 401

        data = request.get_json()
        task_id = data.get('task_id')
        content = data.get('content')
        
        task = Task.query.get(task_id)
        if not task:
            return jsonify({'success': False, 'message': 'タスクが見つかりません'}), 404
        
        if task.student_id != session.get('student_id'):
            return jsonify({'success': False, 'message': '権限がありません'}), 403
        
        task.content = content  # contentとして保存
        db.session.commit()
        
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@tasks.route('/delete', methods=['POST'])
def delete_task():
    try:
        if not session.get('logged_in'):
            return jsonify({'success': False, 'message': 'ログインが必要です'}), 401

        data = request.get_json()
        task_id = data.get('task_id')
        
        task = Task.query.get(task_id)
        if not task:
            return jsonify({'success': False, 'message': 'タスクが見つかりません'}), 404
        
        if task.student_id != session.get('student_id'):
            return jsonify({'success': False, 'message': '権限がありません'}), 403
        
        db.session.delete(task)
        db.session.commit()
        
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@tasks.route('/list', methods=['GET'])
def get_tasks():
    """タスク一覧を取得"""
    try:
        if not session.get('logged_in'):
            return jsonify({'success': False, 'message': 'ログインが必要です'}), 401

        student_id = session.get('student_id')
        tasks = Task.query.filter_by(student_id=student_id).order_by(Task.created_at.desc()).all()
        
        return jsonify({
            'success': True,
            'tasks': [{
                'task_id': task.task_id,
                'content': task.content,
                'is_completed': task.is_completed,
                'created_at': task.created_at.isoformat() if task.created_at else None
            } for task in tasks]
        })
    except Exception as e:
        print(f"Error getting tasks: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500 