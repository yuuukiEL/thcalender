from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
from apps.student.models.personal_schedule import StudentPersonalSchedule
from apps.extensions import db
from datetime import datetime

bp = Blueprint('student_personal_schedule', __name__)

@bp.route('/api/schedule/personal', methods=['POST'])
@login_required
def create_personal_schedule():
    """個人スケジュールを作成"""
    try:
        data = request.get_json()
        schedule = StudentPersonalSchedule(
            student_id=current_user.student_id,
            title=data['title'],
            description=data.get('description'),
            start_time=datetime.fromisoformat(data['start_time']),
            end_time=datetime.fromisoformat(data['end_time']),
            is_private=data.get('is_private', True)
        )
        db.session.add(schedule)
        db.session.commit()
        return jsonify(schedule.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@bp.route('/api/schedule/personal/<int:schedule_id>', methods=['PUT'])
@login_required
def update_personal_schedule(schedule_id):
    """個人スケジュールを更新"""
    try:
        schedule = StudentPersonalSchedule.query.get_or_404(schedule_id)
        if schedule.student_id != current_user.student_id:
            return jsonify({'error': '権限がありません'}), 403

        data = request.get_json()
        schedule.title = data.get('title', schedule.title)
        schedule.description = data.get('description', schedule.description)
        schedule.start_time = datetime.fromisoformat(data.get('start_time', schedule.start_time.isoformat()))
        schedule.end_time = datetime.fromisoformat(data.get('end_time', schedule.end_time.isoformat()))
        schedule.is_private = data.get('is_private', schedule.is_private)

        db.session.commit()
        return jsonify(schedule.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@bp.route('/api/schedule/personal/<int:schedule_id>', methods=['DELETE'])
@login_required
def delete_personal_schedule(schedule_id):
    """個人スケジュールを削除"""
    try:
        schedule = StudentPersonalSchedule.query.get_or_404(schedule_id)
        if schedule.student_id != current_user.student_id:
            return jsonify({'error': '権限がありません'}), 403

        db.session.delete(schedule)
        db.session.commit()
        return '', 204
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400
