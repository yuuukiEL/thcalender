from flask import Blueprint, jsonify, send_file
from apps.models import Teacher
from io import BytesIO

teachers = Blueprint('teachers', __name__)

@teachers.route('/api/teachers/<int:teacher_id>/profile-image')
def get_teacher_profile_image(teacher_id):
    try:
        teacher = Teacher.query.get(teacher_id)
        if teacher and teacher.profile_image:
            return send_file(
                BytesIO(teacher.profile_image),
                mimetype='image/jpeg'
            )
    except Exception as e:
        print(f"Error loading teacher profile image: {str(e)}")
    
    # デフォルト画像を返す
    return '', 404 