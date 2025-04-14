from flask import Blueprint, jsonify, request, current_app, url_for, session, render_template, redirect, flash
from werkzeug.utils import secure_filename
import os
from apps.models.student import Student, StudentUser
from apps.models.course import CourseMaster, SpecializationMaster
from apps.student.models.personal_schedule import StudentPersonalSchedule
from apps import db  # dbをインポート
from flask_login import login_required, current_user, login_user
from urllib.parse import urlparse, quote_plus  # 標準ライブラリを使用
from datetime import datetime, timedelta
import logging
from apps.student.models.security_question import StudentSecurityQuestion as SecurityQuestion
from apps.student.models.contact import StudentContact
from apps.student.models.student_api_connections import StudentApiConnection
from apps.student.models.student_review import StudentReview
from apps.models.api_settings import ApiSettings
from flask_session import Session
from sqlalchemy.orm import joinedload
from flask_wtf import FlaskForm  # FlaskFormをインポート
from wtforms import StringField, PasswordField, BooleanField, SubmitField, RadioField  # フォームフィールド
from wtforms.validators import DataRequired  # バリデータ
import json
import random

import logging
from sqlalchemy import create_engine  # 追加: SQLAlchemyのエンジンをインポート
from apps.student.models.verification_question import VerificationQuestion

# SQLAlchemy のエンジンのログレベルを WARNING 以上に変更
logging.getLogger('sqlalchemy.engine').setLevel(logging.WARNING)
# Blueprintの定義を修正
bp = Blueprint('student_api', __name__)  # api_bpからbpに変更

# F-screenの表示フラグ（一時的にオフに設定）
F_SCREEN_ENABLED = False

# ユーティリティ関数
def get_api_setting_id(api_type):
    """APIタイプからAPI設定IDを取得"""
    api_setting = ApiSettings.query.filter_by(api_type=api_type).first()
    if api_setting:
        return api_setting.id
    return None

@bp.route('/departments/<course_type>')
def get_departments(course_type):
    """指定されたコース区分の学科一覧を取得"""
    try:
        # コース区分に基づいて学科を取得
        courses = CourseMaster.query.filter_by(
            course_type=course_type
        ).order_by(CourseMaster.course_id).all()
        
        return jsonify([{
            'id': course.course_id,
            'code': course.course_code,
            'name': course.course_name
        } for course in courses])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/departments')
def get_all_departments():
    """全ての学科一覧を取得"""
    try:
        # クエリパラメータを取得
        course_type = request.args.get('course_type')
        attendance_type = request.args.get('attendance_type')

        # クエリを構築
        query = CourseMaster.query

        # フィルタリング条件を追加
        if course_type and course_type != 'undefined':
            query = query.filter_by(course_type=course_type)
        if attendance_type and attendance_type != 'undefined':
            query = query.filter_by(part_time_type=attendance_type)

        # 学科を取得
        courses = query.order_by(CourseMaster.course_id).all()
        
        return jsonify([{
            'id': course.course_id,
            'code': course.course_code,
            'name': course.course_name,
            'course_type': course.course_type,
            'part_time_type': course.part_time_type
        } for course in courses])
    except Exception as e:
        current_app.logger.error(f"Error in get_all_departments: {str(e)}")
        return jsonify({'error': str(e)}), 500

@bp.route('/specializations/<int:course_id>')
def get_specializations(course_id):
    """指定されたコースの専攻一覧を取得"""
    try:
        specializations = SpecializationMaster.query.filter_by(
            course_id=course_id
        ).order_by(SpecializationMaster.specialization_id).all()
        
        return jsonify([{
            'id': spec.specialization_id,
            'code': spec.specialization_code,
            'name': spec.specialization_name
        } for spec in specializations])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/class-info/<specialization_id>', methods=['GET'])
def get_class_info(specialization_id):
    """専攻情報を取得するAPI"""
    try:
        specialization = SpecializationMaster.query.get_or_404(specialization_id)
        course = specialization.course_master
        
        # 部コードを生成
        department_code = '2' if course.part_time_type == 'night' else '1'
        class_code = f"{specialization.specialization_code}{department_code}{specialization.grade}"
        
        return jsonify({
            'success': True,
            'course_name': specialization.specialization_name,
            'class_code': class_code
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/login', methods=['GET', 'POST'])
def login():
    """学生ログインページ"""
    # すでにログインしている場合はリダイレクト
    if current_user.is_authenticated:
        # F-screenが有効な場合はそちらにリダイレクト、無効な場合はブラウザバック
        if F_SCREEN_ENABLED:
            return redirect(url_for('student_api.f_screen'))
        else:
            return """
                <script>
                    window.history.back();
                </script>
            """
    
    form = LoginForm()
    if form.validate_on_submit():
        student_id = form.student_id.data
        password = form.password.data
        
        # 学生情報を取得
        student = Student.query.filter_by(student_id=student_id).first()
        
        if student and student.check_password(password):
            # ユーザーオブジェクトを作成
            user = StudentUser(student)
            login_user(user, remember=form.remember_me.data)
            
            # セッションに学生IDを保存
            session['student_id'] = student_id
            
            # F-screenが有効な場合はそちらにリダイレクト、無効な場合はブラウザバック
            if F_SCREEN_ENABLED:
                return redirect(url_for('student_api.f_screen'))
            else:
                return """
                    <script>
                        window.history.back();
                    </script>
                """
        else:
            flash('学生IDまたはパスワードが正しくありません', 'error')
    
    return render_template('student/auth/login.html', form=form)

@bp.route('/register', methods=['POST'])
def register():
    """学生登録API"""
    try:
        form_data = request.form
        
        # 必須フィールドの存在確認
        required_fields = ['student_id', 'name', 'email', 'password', 
                         'enrollment_year', 'enrollment_term', 
                         'department_code', 'specialization_id']
        
        for field in required_fields:
            if not form_data.get(field):
                raise ValueError(f'{field}は必須項目です')

        # 学科情報の取得
        course = CourseMaster.query.filter_by(
            course_code=form_data.get('department_code')
        ).first_or_404()

        # current_gradeを整数に変換
        current_grade = int(form_data.get('current_grade'))
        
        # 学生データの作成
        student = Student(
            student_id=form_data.get('student_id'),
            name=form_data.get('name'),
            email=form_data.get('email'),
            enrollment_year=int(form_data.get('enrollment_year')),
            enrollment_term=form_data.get('enrollment_term'),
            course_id=course.course_id,
            current_grade=current_grade,
            specialization_id=int(form_data.get('specialization_id')),
            status='active'
        )
        
        # プロフィール画像の処理
        if 'profile_image' in request.files:
            file = request.files['profile_image']
            if file and file.filename:
                filename = secure_filename(file.filename)
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S_')
                filename = timestamp + filename
                
                # プロフィール画像の保存パスを設定
                save_dir = os.path.join(
                    current_app.config['UPLOAD_FOLDER'], 
                    current_app.config['PROFILE_IMAGE_PATH']
                )
                os.makedirs(save_dir, exist_ok=True)
                
                # ファイルを保存
                file_path = os.path.join(save_dir, filename)
                file.save(file_path)
                
                # データベースには相対パスを保存
                student.profile_image_path = os.path.join(
                    current_app.config['PROFILE_IMAGE_PATH'], 
                    filename
                )

        # パスワードのハッシュ化
        student.set_password(form_data.get('password'))

        # データベースに保存
        db.session.add(student)
        db.session.commit()

        # セッションに登録情報を保存（完了ページ用）
        session['student_id'] = student.student_id
        session['name'] = student.name
        session['department'] = course.course_name
        
        return jsonify({
            'success': True,
            'message': '登録が完了しました'
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Registration error: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'登録に失敗しました: {str(e)}'
        }), 400 

@bp.app_template_global()
def get_specialization(specialization_id):
    """専攻IDから専攻情報を取得"""
    return SpecializationMaster.query.get(specialization_id)

@bp.route('/profile')
@login_required
def profile():
    """学生のプロフィールページを表示"""
    # API連携情報の取得
    google_connection = StudentApiConnection.query.filter_by(
        student_id=current_user.student.student_id,
        api_setting_id=get_api_setting_id('google')
    ).first()
    
    notion_connection = StudentApiConnection.query.filter_by(
        student_id=current_user.student.student_id,
        api_setting_id=get_api_setting_id('notion')
    ).first()
    
    # デモ用のダミーデータ
    if not google_connection:
        google_connection = type('obj', (object,), {
            'is_active': True,
            'account_email': 'student@example.com'
        })
    
    if not notion_connection:
        notion_connection = type('obj', (object,), {
            'is_active': True
        })
    
    outlook_connection = type('obj', (object,), {
        'is_active': True,
        'account_email': 'student@outlook.com'
    })
    
    # 連携状態の判定
    google_status = '連携済み' if google_connection and google_connection.is_active else '未連携'
    notion_status = '連携済み' if notion_connection and notion_connection.is_active else '未連携'
    
    # 学生のレビューを取得
    student_review = StudentReview.query.filter_by(
        student_id=current_user.student.student_id
    ).first()
    
    return render_template('student/auth/profile.html',
                          google_connection=google_connection,
                          notion_connection=notion_connection,
                          outlook_connection=outlook_connection,
                          google_status=google_status,
                          notion_status=notion_status,
                          student_review=student_review)

@bp.route('/edit-profile')
@login_required
def edit_profile():
    """学生プロフィール編集画面を表示"""
    # 学生の専攻に関連するコースの全専攻を取得
    specializations = SpecializationMaster.query.filter_by(
        course_id=current_user.student.course_id
    ).all()
    
    # 各専攻に学年情報を追加（一時的な属性として）
    specializations_with_grade = []
    for spec in specializations:
        # 専攻のコピーを作成して学年情報を追加
        spec_dict = {
            'specialization_id': spec.specialization_id,
            'specialization_name': spec.specialization_name,
            'course_id': spec.course_id
        }
        
        # 専攻IDから学年を計算
        spec_id = spec.specialization_id
        if spec_id % 4 == 1:
            spec_dict['grade'] = 1
        elif spec_id % 4 == 2:
            spec_dict['grade'] = 2
        elif spec_id % 4 == 3:
            spec_dict['grade'] = 3
        else:
            spec_dict['grade'] = 4
        
        specializations_with_grade.append(spec_dict)
        
        # デバッグ用にログ出力
        current_app.logger.info(f"専攻: {spec.specialization_name}, ID: {spec.specialization_id}, 学年: {spec_dict['grade']}")
    
    return render_template('student/auth/edit_profile.html', 
                          student=current_user.student,
                          specializations=specializations_with_grade)

@bp.route('/update-profile', methods=['POST'])
@login_required
def update_profile():
    """学生プロフィール情報を更新"""
    try:
        student = current_user.student
        
        # フォームからデータを取得
        student.name = request.form.get('name')
        student.email = request.form.get('email')
        
        # 学年の更新
        current_grade = int(request.form.get('current_grade'))
        student.current_grade = current_grade
        
        # 専攻の更新
        specialization_id = request.form.get('specialization_id')
        if specialization_id:
            # 専攻IDを整数に変換
            spec_id = int(specialization_id)
            
            # 専攻の学年を計算
            if spec_id % 4 == 1:
                spec_grade = 1
            elif spec_id % 4 == 2:
                spec_grade = 2
            elif spec_id % 4 == 3:
                spec_grade = 3
            else:
                spec_grade = 4
            
            # 専攻の学年が現在の学年と一致するか確認
            if spec_grade != current_grade:
                raise ValueError('選択された専攻は現在の学年と一致しません')
            
            student.specialization_id = spec_id
        
        # パスワード変更処理
        current_password = request.form.get('current_password')
        new_password = request.form.get('new_password')
        confirm_password = request.form.get('confirm_password')
        
        if current_password and new_password and confirm_password:
            # 現在のパスワードが正しいか確認
            if not student.check_password(current_password):
                raise ValueError('現在のパスワードが正しくありません')
            
            # 新しいパスワードと確認用パスワードが一致するか確認
            if new_password != confirm_password:
                raise ValueError('新しいパスワードと確認用パスワードが一致しません')
            
            # パスワードを更新
            student.set_password(new_password)
        
        # プロフィール画像の処理
        if 'profile_image' in request.files:
            file = request.files['profile_image']
            if file and file.filename:
                filename = secure_filename(file.filename)
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S_')
                filename = timestamp + filename
                
                # プロフィール画像の保存パスを設定
                save_dir = os.path.join(
                    current_app.config['UPLOAD_FOLDER'], 
                    current_app.config['PROFILE_IMAGE_PATH']
                )
                os.makedirs(save_dir, exist_ok=True)
                
                # ファイルを保存
                file_path = os.path.join(save_dir, filename)
                file.save(file_path)
                
                # データベースには相対パスを保存
                student.profile_image_path = os.path.join(
                    current_app.config['PROFILE_IMAGE_PATH'], 
                    filename
                )
        
        # データベースに保存
        db.session.commit()
        
        return redirect(url_for('student_api.profile'))
        
    except ValueError as e:
        db.session.rollback()
        # 学生の専攻に関連するコースの全専攻を取得
        specializations = SpecializationMaster.query.filter_by(
            course_id=current_user.student.course_id
        ).all()
        return render_template('student/auth/edit_profile.html', 
                              student=current_user.student,
                              specializations=specializations,
                              error=str(e))
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Profile update error: {str(e)}")
        # 学生の専攻に関連するコースの全専攻を取得
        specializations = SpecializationMaster.query.filter_by(
            course_id=current_user.student.course_id
        ).all()
        return render_template('student/auth/edit_profile.html', 
                              student=current_user.student,
                              specializations=specializations,
                              error=f'更新に失敗しました: {str(e)}') 

@bp.route('/edit-contact-info')
@login_required
def edit_contact_info():
    """学生の連絡先情報編集画面を表示"""
    # 学生の連絡先情報を取得
    contact = StudentContact.query.filter_by(student_id=current_user.student.student_id).first()
    
    # 連絡先情報がなければ新規作成
    if not contact:
        contact = StudentContact(student_id=current_user.student.student_id)
    
    return render_template('student/auth/edit_contact.html', contact=contact)

@bp.route('/update-contact-info', methods=['POST'])
@login_required
def update_contact_info():
    """学生の連絡先情報を更新"""
    try:
        # 学生の連絡先情報を取得
        contact = StudentContact.query.filter_by(student_id=current_user.student.student_id).first()
        
        # 連絡先情報がなければ新規作成
        if not contact:
            contact = StudentContact(student_id=current_user.student.student_id)
            db.session.add(contact)
        
        # フォームからデータを取得して更新
        contact.phone = request.form.get('phone')
        contact.postal_code = request.form.get('postal_code')
        contact.address = request.form.get('address')
        contact.emergency_contact = request.form.get('emergency_contact_name')
        contact.emergency_phone = request.form.get('emergency_contact_phone')
        
        # データベースに保存
        db.session.commit()
        
        return redirect(url_for('student_api.profile'))
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Contact update error: {str(e)}")
        return render_template('student/auth/edit_contact.html', 
                              contact=contact,
                              error=f'更新に失敗しました: {str(e)}')

@bp.route('/security-settings')
@login_required
def security_settings():
    """学生のセキュリティ設定画面を表示"""
    # 学生のセキュリティ質問を取得
    security_question = SecurityQuestion.query.filter_by(student_id=current_user.student.student_id).first()
    
    return render_template('student/auth/security_settings.html', security_question=security_question)

@bp.route('/update-security-question', methods=['POST'])
@login_required
def update_security_question():
    """学生のセキュリティ質問を更新"""
    try:
        # 学生のセキュリティ質問を取得
        security_question = SecurityQuestion.query.filter_by(student_id=current_user.student.student_id).first()
        
        # 既存の質問がある場合はパスワード確認
        if security_question:
            current_password = request.form.get('current_password')
            if not current_user.student.check_password(current_password):
                raise ValueError('現在のパスワードが正しくありません')
        else:
            # 新規作成の場合
            security_question = SecurityQuestion(student_id=current_user.student.student_id)
            db.session.add(security_question)
        
        # フォームからデータを取得して更新
        security_question.question = request.form.get('security_question')
        security_question.set_answer(request.form.get('security_answer'))
        
        # データベースに保存
        db.session.commit()
        
        return render_template('student/auth/security_settings.html', 
                              security_question=security_question,
                              success='セキュリティ質問が正常に更新されました')
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Security question update error: {str(e)}")
        return render_template('student/auth/security_settings.html', 
                              security_question=security_question if 'security_question' in locals() else None,
                              error=f'更新に失敗しました: {str(e)}') 

@bp.route('/api-connections')
@login_required
def api_connections():
    """学生のAPI連携情報を表示"""
    # API連携情報の取得
    google_connection = StudentApiConnection.query.filter_by(
        student_id=current_user.student.student_id,
        api_setting_id=get_api_setting_id('google')
    ).first()
    
    notion_connection = StudentApiConnection.query.filter_by(
        student_id=current_user.student.student_id,
        api_setting_id=get_api_setting_id('notion')
    ).first()
    
    # 連携状態の判定
    google_status = '連携済み' if google_connection else '未連携'
    notion_status = '連携済み' if notion_connection else '未連携'
    
    return render_template('student/auth/api_connections.html',
                          google_connection=google_connection,
                          notion_connection=notion_connection,
                          google_status=google_status,
                          notion_status=notion_status)

@bp.route('/connect-api/<api_type>', methods=['GET'])
def connect_api(api_type):
    """外部APIとの連携を開始"""
    try:
        # 学生IDをセッションから取得
        student_id = session.get('student_id')
        if not student_id:
            flash('ログインが必要です', 'error')
            return redirect(url_for('student_api.login'))
            
        # API設定を取得
        api_setting = ApiSettings.query.filter_by(api_type=api_type).first_or_404()
        
        # 既存の連携を削除（スコープ変更エラーを防ぐため）
        existing_connection = StudentApiConnection.query.filter_by(
            student_id=student_id,
            api_setting_id=api_setting.id
        ).first()
        
        if existing_connection:
            db.session.delete(existing_connection)
            db.session.commit()
            current_app.logger.info(f"既存の{api_type}連携を削除しました")
        
        # OAuth認証URLを生成
        if api_type == 'google':
            # URLクエリパラメータとして直接指定する（順序を保証）
            from urllib.parse import quote_plus
            
            scope_str = quote_plus("openid https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/calendar.readonly")
            
            # 状態トークンを生成（CSRF対策）
            from apps.models.oauth_state import OAuthState
            import uuid
            
            # 既存の状態を削除
            OAuthState.query.filter_by(
                user_id=student_id,
                provider=api_type
            ).delete()
            
            # 新しい状態を作成
            state = str(uuid.uuid4())
            oauth_state = OAuthState(
                user_id=student_id,
                provider=api_type,
                state=state,
                scopes="https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/calendar.readonly openid"
            )
            db.session.add(oauth_state)
            db.session.commit()
            
            # セッションにも状態を保存（冗長性のため）
            session[f'{api_type}_oauth_state'] = state
            session[f'{api_type}_student_id'] = student_id
            
            # 直接URLを構築
            auth_url = "https://accounts.google.com/o/oauth2/auth?client_id="
            auth_url += api_setting.client_id
            auth_url += "&redirect_uri=" + quote_plus(url_for('student_api.oauth_callback', api_type=api_type, _external=True))
            auth_url += "&response_type=code"
            auth_url += "&scope=" + scope_str 
            auth_url += "&state=" + state
            auth_url += "&access_type=offline"
            auth_url += "&prompt=consent"
        elif api_type == 'notion':
            # Notionの場合の処理
            auth_url = f"https://api.notion.com/v1/oauth/authorize?client_id={api_setting.client_id}&redirect_uri={url_for('student_api.oauth_callback', api_type=api_type, _external=True)}&response_type=code"
        else:
            return jsonify({'error': '未対応のAPIタイプです'}), 400
        
        # リダイレクト
        return redirect(auth_url)
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"API connection error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@bp.route('/oauth-callback/<api_type>')
def oauth_callback(api_type):
    """OAuth認証コールバック処理"""
    try:
        # 認証コードを取得
        code = request.args.get('code')
        if not code:
            raise ValueError('認証コードがありません')
        
        # 状態トークンを検証（CSRF対策）
        state = request.args.get('state')
        
        # データベースから状態を取得
        from apps.models.oauth_state import OAuthState
        oauth_state = OAuthState.query.filter_by(
            provider=api_type,
            state=state
        ).first()
        
        if not oauth_state:
            raise ValueError('不正な状態トークンです')
        
        # 学生IDを取得
        student_id = oauth_state.user_id
        session_student_id = session.get(f'{api_type}_student_id')
        
        # セッションとデータベースの学生IDが一致するか確認（可能であれば）
        if session_student_id and student_id != session_student_id:
            raise ValueError('認証情報が一致しません')
        
        # API設定を取得
        api_setting = ApiSettings.query.filter_by(api_type=api_type).first_or_404()
        
        # トークンを取得（実際のAPIリクエスト）
        if api_type == 'google':
            import requests
            
            # トークン取得リクエスト
            token_url = 'https://oauth2.googleapis.com/token'
            token_data = {
                'code': code,
                'client_id': api_setting.client_id,
                'client_secret': api_setting.client_secret,
                'redirect_uri': url_for('student_api.oauth_callback', api_type=api_type, _external=True),
                'grant_type': 'authorization_code'
            }
            
            token_response = requests.post(token_url, data=token_data)
            
            if token_response.status_code != 200:
                current_app.logger.error(f"Token error: {token_response.text}")
                raise ValueError('トークンの取得に失敗しました')
            
            token_info = token_response.json()
            
            # 既存の連携情報を確認
            connection = StudentApiConnection.query.filter_by(
                student_id=student_id,
                api_setting_id=api_setting.id
            ).first()
            
            if not connection:
                # 新規連携情報を作成
                connection = StudentApiConnection(
                    student_id=student_id,
                    api_setting_id=api_setting.id,
                    access_token=token_info.get('access_token'),
                    refresh_token=token_info.get('refresh_token'),
                    expires_at=datetime.now() + timedelta(seconds=token_info.get('expires_in', 3600))
                )
                db.session.add(connection)
            else:
                # 既存の連携情報を更新
                connection.access_token = token_info.get('access_token')
                if 'refresh_token' in token_info:
                    connection.refresh_token = token_info.get('refresh_token')
                connection.expires_at = datetime.now() + timedelta(seconds=token_info.get('expires_in', 3600))
        
        # 使用済みの状態を削除
        db.session.delete(oauth_state)
        db.session.commit()
        
        flash(f'{api_type.capitalize()}との連携が完了しました', 'success')
        return redirect(url_for('student_api.api_connections'))
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"OAuth callback error: {str(e)}")
        flash(f'API連携に失敗しました: {str(e)}', 'error')
        return redirect(url_for('student_api.api_connections'))

# ログインフォームの定義
class LoginForm(FlaskForm):
    student_id = StringField('学生ID', validators=[DataRequired()])
    password = PasswordField('パスワード', validators=[DataRequired()])
    remember_me = BooleanField('ログイン状態を保持')
    submit = SubmitField('ログイン')

# 確認フォームの定義
class VerificationForm(FlaskForm):
    answer = RadioField('回答', validators=[DataRequired()])
    submit = SubmitField('確認')

@bp.route('/verify', methods=['GET', 'POST'])
def verify():
    """学生確認ページ"""
    form = VerificationForm()
    
    # GETリクエスト時に新しい問題を選択
    if request.method == 'GET':
        # アクティブな問題をランダムに取得
        questions = VerificationQuestion.query.filter_by(active=True).all()
        if not questions:
            # 問題がない場合はダミーの問題を作成
            dummy_question = {
                'id': 0,
                'question_text': 'HAL東京の最寄り駅は？',
                'options': json.dumps(['新宿', '渋谷', '池袋', '秋葉原']),
                'correct_answer': '0'  # インデックス0（新宿）が正解
            }
            session['current_question'] = dummy_question
        else:
            # ランダムに問題を選択
            question = random.choice(questions)
            session['current_question'] = {
                'id': question.id,
                'question_text': question.question_text,
                'options': question.options,
                'correct_answer': question.correct_answer
            }
    
    # 問題情報をセッションから取得
    question_data = session.get('current_question', {})
    
    # フォームの選択肢を設定
    if question_data:
        options = json.loads(question_data.get('options', '[]'))
        form.answer.choices = [(str(i), option) for i, option in enumerate(options)]
    
    if form.validate_on_submit():
        user_answer = form.answer.data
        correct_answer = question_data.get('correct_answer', '')
        
        if user_answer == correct_answer:
            # 正解の場合、登録ページにリダイレクト
            session['verified'] = True
            flash('確認できました。登録を続けてください。', 'success')
            return redirect(url_for('student.auth.register_form'))
        else:
            # 不正解の場合、エラーメッセージを表示
            flash('回答が正しくありません。', 'danger')
            return render_template('student/auth/verification.html', 
                                  form=form, 
                                  question=question_data.get('question_text'),
                                  error='回答が正しくありません。')
    
    return render_template('student/auth/verification.html', 
                          form=form, 
                          question=question_data.get('question_text'))

@bp.route('/register-form', methods=['GET', 'POST'])
def register_form():
    """学生登録フォーム表示"""
    # セッションに確認済みフラグがなければ確認ページにリダイレクト
    if not session.get('verified'):
        return redirect(url_for('student.auth.verify'))
    
    # 以下は既存の登録フォーム表示処理
    return render_template('student/auth/register.html')

@bp.route('/get-verification-question', methods=['GET'])
def get_verification_question():
    """確認問題を取得するAPI"""
    try:
        # アクティブな問題をランダムに取得
        questions = VerificationQuestion.query.filter_by(active=True).all()
        if not questions:
            # 問題がない場合はダミーの問題を作成
            return jsonify({
                'success': True,
                'question': {
                    'id': 0,
                    'question_text': 'HAL東京の最寄り駅は？',
                    'options': json.dumps(['新宿', '渋谷', '池袋', '秋葉原']),
                    'correct_answer': '0'  # インデックス0（新宿）が正解
                }
            })
        else:
            # ランダムに問題を選択
            question = random.choice(questions)
            return jsonify({
                'success': True,
                'question': {
                    'id': question.id,
                    'question_text': question.question_text,
                    'options': question.options,
                    'correct_answer': question.correct_answer  # フロントエンドには送信しない
                }
            })
    except Exception as e:
        current_app.logger.error(f"問題取得エラー: {str(e)}")
        return jsonify({'success': False, 'error': str(e)})

@bp.route('/verify-answer', methods=['POST'])
def verify_answer():
    """回答を検証するAPI"""
    try:
        data = request.json
        question_id = data.get('question_id')
        answer = data.get('answer')
        
        if question_id == 0:  # ダミー問題の場合
            is_correct = answer == '0'  # 新宿が正解
        else:
            question = VerificationQuestion.query.get(question_id)
            if not question:
                return jsonify({'success': False, 'error': '問題が見つかりません'})
            
            is_correct = question.check_answer(answer)
        
        if is_correct:
            # 正解の場合、セッションに確認済みフラグを設定
            session['verified'] = True
            return jsonify({'success': True})
        else:
            return jsonify({'success': False, 'error': '回答が正しくありません'})
    except Exception as e:
        current_app.logger.error(f"回答検証エラー: {str(e)}")
        return jsonify({'success': False, 'error': str(e)})

@bp.route('/f-screen')
def f_screen():
    """Fスクリーン表示"""
    if not F_SCREEN_ENABLED:
        return """
            <script>
                window.history.back();
            </script>
        """
    return render_template('student/auth/f_screen.html') 