from flask import Blueprint, jsonify, request
from apps.models import CourseMaster, SpecializationMaster

bp = Blueprint('student_course', __name__)

@bp.route('/course-types')
def get_course_types():
    """コース区分の一覧を取得"""
    try:
        course_types = [
            {
                'course_type': '四年制',
                'attendance_type': 'day',
                'display_name': '四年制（昼間部）'
            },
            {
                'course_type': '二年制',
                'attendance_type': 'day',
                'display_name': '二年制（昼間部）'
            },
            {
                'course_type': '二年制',
                'attendance_type': 'night',
                'display_name': '二年制（夜間部）'
            }
        ]
        return jsonify(course_types)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/departments')
def get_departments():
    """学科一覧を取得"""
    try:
        # クエリパラメータを取得
        course_type = request.args.get('course_type')
        attendance_type = request.args.get('attendance_type')

        # クエリを構築
        query = CourseMaster.query

        # フィルタリング条件を追加
        if course_type and course_type != 'undefined':
            if course_type == '四年制':
                query = query.filter(CourseMaster.course_type == '4year')
            elif course_type == '二年制':
                query = query.filter(CourseMaster.course_type == '2year')

        if attendance_type and attendance_type != 'undefined':
            if attendance_type == 'day':
                query = query.filter(CourseMaster.part_time_type == 'day')
            elif attendance_type == 'night':
                query = query.filter(CourseMaster.part_time_type == 'night')

        # 学科を取得
        courses = query.order_by(CourseMaster.course_id).all()
        
        # course_id を含めて JSON で返すように修正
        return jsonify([{
            'course_id': course.course_id,  # course_id を追加
            'code': course.course_code,
            'name': course.course_name,
            'part_time_type': course.part_time_type,
            'course_type': '四年制' if course.course_type == '4year' else '二年制'
        } for course in courses])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/specializations/<course_code>')
def get_specializations(course_code):
    """指定されたコースの専攻一覧を取得"""
    try:
        course = CourseMaster.query.filter_by(course_code=course_code).first_or_404()
        specializations = SpecializationMaster.query.filter_by(
            course_id=course.course_id
        ).order_by(SpecializationMaster.specialization_id).all()
        
        return jsonify([{
            'specialization_id': spec.specialization_id,
            'specialization_code': spec.specialization_code,
            'specialization_name': spec.specialization_name,
            'grade': spec.grade
        } for spec in specializations])
    except Exception as e:
        return jsonify({'error': str(e)}), 500
