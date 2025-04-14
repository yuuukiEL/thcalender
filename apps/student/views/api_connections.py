from flask import Blueprint, render_template, redirect, url_for, flash, request, session, current_app
from flask_login import login_required, current_user
from apps.models.api_settings import ApiSettings
from apps.student.models.student_api_connections import StudentApiConnection
from apps.models.student import Student
from apps import db
from datetime import datetime, timedelta
import requests
import json
import os
from sqlalchemy.orm import joinedload
from google_auth_oauthlib.flow import Flow
from apps.models.oauth_state import OAuthState

# ブループリント定義
api_connections_bp = Blueprint('student_api_connections', __name__, url_prefix='/student/api')
bp = api_connections_bp  # エイリアスを作成（両方の名前でインポートできるようにする）

@api_connections_bp.route('/settings', methods=['GET'])
@login_required
def api_settings():
    """API連携設定ページを表示"""
    # デモ用のダミーデータを作成
    google_connection = {
        'is_active': True,
        'account_email': 'student@example.com'
    }
    
    notion_connection = {
        'is_active': True
    }
    
    outlook_connection = {
        'is_active': True,
        'account_email': 'student@outlook.com'
    }
    
    return render_template('student/auth/api_settings.html',
                          google_connection=google_connection,
                          notion_connection=notion_connection,
                          outlook_connection=outlook_connection)

@api_connections_bp.route('/connect/google', methods=['GET'])
@login_required
def connect_google():
    """Googleアカウントとの連携を開始（OAuth認証）"""
    try:
        # クライアントシークレットの設定
        client_config = {
            "web": {
                "client_id": os.environ.get('GOOGLE_CLIENT_ID'),
                "client_secret": os.environ.get('GOOGLE_CLIENT_SECRET'),
                "redirect_uris": [os.environ.get('GOOGLE_REDIRECT_URI')],
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token"
            }
        }
        
        # 認証フローを作成
        flow = Flow.from_client_config(
            client_config,
            scopes=['https://www.googleapis.com/auth/calendar.readonly', 'https://www.googleapis.com/auth/userinfo.email'],
            redirect_uri=os.environ.get('GOOGLE_REDIRECT_URI')
        )
        
        # 認証URLを生成
        authorization_url, state = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            prompt='consent'
        )
        
        # 状態をデータベースに保存
        OAuthState.create_state(
            user_id=current_user.student.student_id,
            service='google',
            state=state
        )
        
        # デバッグ情報をログに出力
        current_app.logger.info(f"Generated state: {state}")
        
        # 認証URLにリダイレクト
        return redirect(authorization_url)
        
    except Exception as e:
        current_app.logger.error(f"Google connect error: {str(e)}")
        flash(f'連携処理中にエラーが発生しました: {str(e)}', 'error')
        return redirect(url_for('student_api_connections.api_settings'))

@api_connections_bp.route('/connect/notion', methods=['POST'])
@login_required
def connect_notion():
    """NotionのAPIキーを登録"""
    try:
        api_key = request.form.get('api_key')
        if not api_key:
            flash('APIキーを入力してください', 'error')
            return redirect(url_for('student_api_connections.api_settings'))
        
        # APIキーの検証（実際の実装ではNotionのAPIを呼び出して検証）
        if len(api_key) < 10 or not api_key.startswith('secret_'):
            flash('無効なAPIキーです', 'error')
            return redirect(url_for('student_api_connections.api_settings'))
        
        # 現在のユーザーのメールアドレスを取得
        user_email = current_user.email if hasattr(current_user, 'email') else 'demo@notion.com'
        
        # 既存の連携があれば更新、なければ新規作成
        notion_connection = StudentApiConnection.query.filter_by(
            student_id=current_user.student.student_id,
            api_setting_id=get_api_setting_id('notion')
        ).first()
        
        if notion_connection:
            notion_connection.api_key = api_key
            notion_connection.is_active = True
            notion_connection.account_email = user_email
            notion_connection.last_sync_datetime = datetime.utcnow()  # 最終同期日時を更新
            notion_connection.updated_at = datetime.utcnow()
        else:
            notion_connection = StudentApiConnection(
                student_id=current_user.student.student_id,
                api_setting_id=get_api_setting_id('notion'),
                api_key=api_key,
                is_active=True,
                account_email=user_email,
                last_sync_datetime=datetime.utcnow()  # 最終同期日時を設定
            )
            db.session.add(notion_connection)
        
        db.session.commit()
        flash('Notionとの連携が完了しました', 'success')
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Notion connect error: {str(e)}")
        flash(f'連携処理中にエラーが発生しました: {str(e)}', 'error')
    
    return redirect(url_for('student_api_connections.api_settings'))

@api_connections_bp.route('/connect/outlook', methods=['GET'])
@login_required
def connect_outlook():
    """Outlookアカウントとの連携を開始"""
    # 実際の実装ではOAuth2認証フローを開始
    flash('Outlookアカウントとの連携を開始します。実際の実装では認証画面にリダイレクトします。', 'info')
    return redirect(url_for('student_api_connections.api_settings'))

@api_connections_bp.route('/disconnect/google', methods=['POST'])
@login_required
def disconnect_google():
    """Google連携を解除"""
    try:
        connection = StudentApiConnection.query.filter_by(
            student_id=current_user.student.student_id,
            api_setting_id=get_api_setting_id('google')
        ).first()
        
        if connection:
            connection.is_active = False
            connection.updated_at = datetime.utcnow()
            db.session.commit()
            flash('Googleカレンダーとの連携を解除しました', 'success')
        else:
            flash('Googleカレンダーとの連携が見つかりません', 'warning')
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Google disconnect error: {str(e)}")
        flash(f'連携解除中にエラーが発生しました: {str(e)}', 'error')
    
    return redirect(url_for('student_api_connections.api_settings'))

@api_connections_bp.route('/disconnect/notion', methods=['POST'])
@login_required
def disconnect_notion():
    """Notion連携を解除"""
    try:
        connection = StudentApiConnection.query.filter_by(
            student_id=current_user.student.student_id,
            api_setting_id=get_api_setting_id('notion')
        ).first()
        
        if connection:
            connection.is_active = False
            connection.updated_at = datetime.utcnow()
            db.session.commit()
            flash('Notionとの連携を解除しました', 'success')
        else:
            flash('Notionとの連携が見つかりません', 'warning')
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Notion disconnect error: {str(e)}")
        flash(f'連携解除中にエラーが発生しました: {str(e)}', 'error')
    
    return redirect(url_for('student_api_connections.api_settings'))

@api_connections_bp.route('/disconnect/outlook', methods=['POST'])
@login_required
def disconnect_outlook():
    """Outlook連携を解除"""
    connection = StudentApiConnection.query.filter_by(
        student_id=current_user.student.student_id,
        api_setting_id=get_api_setting_id('outlook')
    ).first()
    
    if connection:
        connection.is_active = False
        db.session.commit()
        flash('Outlookカレンダーとの連携を解除しました', 'success')
    
    return redirect(url_for('student_api_connections.api_settings'))

@api_connections_bp.route('/sync/google', methods=['POST'])
@login_required
def sync_google_calendar():
    """Googleカレンダーと同期"""
    try:
        connection = StudentApiConnection.query.filter_by(
            student_id=current_user.student.student_id,
            api_setting_id=get_api_setting_id('google')
        ).first()
        
        if connection and connection.is_active:
            # 実際の実装ではGoogleカレンダーAPIを呼び出して同期
            connection.last_sync_datetime = datetime.utcnow()
            db.session.commit()
            flash('Googleカレンダーと同期しました', 'success')
        else:
            flash('Googleカレンダーとの連携が有効ではありません', 'error')
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Google sync error: {str(e)}")
        flash(f'同期処理中にエラーが発生しました: {str(e)}', 'error')
    
    return redirect(url_for('student_api_connections.api_settings'))

@api_connections_bp.route('/sync/notion', methods=['POST'])
@login_required
def sync_notion():
    """Notionと同期"""
    try:
        connection = StudentApiConnection.query.filter_by(
            student_id=current_user.student.student_id,
            api_setting_id=get_api_setting_id('notion')
        ).first()
        
        if connection and connection.is_active:
            # 実際の実装ではNotionAPIを呼び出して同期
            connection.last_sync_datetime = datetime.utcnow()
            db.session.commit()
            flash('Notionと同期しました', 'success')
        else:
            flash('Notionとの連携が有効ではありません', 'error')
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Notion sync error: {str(e)}")
        flash(f'同期処理中にエラーが発生しました: {str(e)}', 'error')
    
    return redirect(url_for('student_api_connections.api_settings'))

@api_connections_bp.route('/sync/outlook', methods=['POST'])
@login_required
def sync_outlook_calendar():
    """Outlookカレンダーと同期"""
    try:
        connection = StudentApiConnection.query.filter_by(
            student_id=current_user.student.student_id,
            api_setting_id=get_api_setting_id('outlook')
        ).first()
        
        if connection and connection.is_active:
            # 実際の実装ではOutlookカレンダーAPIを呼び出して同期
            connection.last_sync_datetime = datetime.utcnow()
            db.session.commit()
            flash('Outlookカレンダーと同期しました', 'success')
        else:
            flash('Outlookカレンダーとの連携が有効ではありません', 'error')
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Outlook sync error: {str(e)}")
        flash(f'同期処理中にエラーが発生しました: {str(e)}', 'error')
    
    return redirect(url_for('student_api_connections.api_settings'))

@api_connections_bp.route('/google/callback')
@login_required
def google_callback():
    """Googleの認証コールバックを処理"""
    # 状態の検証（CSRF対策）
    state = request.args.get('state')
    
    # デバッグ情報をログに出力
    current_app.logger.info(f"Callback state: {state}")
    
    # データベースで状態を検証
    if not state or not OAuthState.validate_state(
        state=state,
        user_id=current_user.student.student_id,
        service='google'
    ):
        flash('認証状態が無効または期限切れです。もう一度お試しください。', 'error')
        return redirect(url_for('student_api_connections.api_settings'))
    
    # エラーチェック
    if 'error' in request.args:
        error = request.args.get('error')
        flash(f'認証に失敗しました: {error}', 'error')
        return redirect(url_for('student_api_connections.api_settings'))
    
    # 認証コードを取得
    code = request.args.get('code')
    if not code:
        flash('認証に失敗しました: 認証コードがありません', 'error')
        return redirect(url_for('student_api_connections.api_settings'))
    
    try:
        # クライアントシークレットの設定
        client_config = {
            "web": {
                "client_id": os.environ.get('GOOGLE_CLIENT_ID'),
                "client_secret": os.environ.get('GOOGLE_CLIENT_SECRET'),
                "redirect_uris": [os.environ.get('GOOGLE_REDIRECT_URI')],
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token"
            }
        }
        
        # 認証フローを作成
        flow = Flow.from_client_config(
            client_config,
            scopes=['https://www.googleapis.com/auth/calendar.readonly', 'https://www.googleapis.com/auth/userinfo.email'],
            redirect_uri=os.environ.get('GOOGLE_REDIRECT_URI'),
            state=state
        )
        
        # 認証コードをトークンに交換
        flow.fetch_token(code=code)
        
        # 認証情報を取得
        credentials = flow.credentials
        
        # Google APIを使用してユーザー情報を取得
        from googleapiclient.discovery import build
        service = build('oauth2', 'v2', credentials=credentials)
        user_info = service.userinfo().get().execute()
        email = user_info.get('email')
        
        # トークン情報をデータベースに保存
        connection = StudentApiConnection.query.filter_by(
            student_id=current_user.student.student_id,
            api_setting_id=get_api_setting_id('google')
        ).first()
        
        if not connection:
            connection = StudentApiConnection(
                student_id=current_user.student.student_id,
                api_setting_id=get_api_setting_id('google'),
                is_active=True,
                account_email=email,
                access_token=credentials.token,
                refresh_token=credentials.refresh_token,
                token_expires_at=datetime.utcnow() + timedelta(seconds=credentials.expires_in),
                last_sync_datetime=datetime.utcnow()
            )
            db.session.add(connection)
        else:
            connection.is_active = True
            connection.account_email = email
            connection.access_token = credentials.token
            if credentials.refresh_token:  # リフレッシュトークンは毎回返されるわけではない
                connection.refresh_token = credentials.refresh_token
            connection.token_expires_at = datetime.utcnow() + timedelta(seconds=credentials.expires_in)
            connection.last_sync_datetime = datetime.utcnow()
            connection.updated_at = datetime.utcnow()
        
        db.session.commit()
        flash('Googleカレンダーとの連携が完了しました', 'success')
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Google OAuth callback error: {str(e)}")
        flash(f'認証処理中にエラーが発生しました: {str(e)}', 'error')
    
    return redirect(url_for('student_api_connections.api_settings'))

# ユーティリティ関数
def get_api_setting_id(api_type):
    """APIタイプからAPI設定IDを取得"""
    api_setting = ApiSettings.query.filter_by(api_type=api_type).first()
    if api_setting:
        return api_setting.id
    return None 