from apps import create_app, db
from sqlalchemy import text

app = create_app()

with app.app_context():
    # api_settingsテーブルを作成
    try:
        db.session.execute(text("""
        CREATE TABLE IF NOT EXISTS `api_settings` (
          `id` int(11) NOT NULL AUTO_INCREMENT,
          `name` varchar(100) NOT NULL COMMENT 'API名称（例：Google Calendar、Notion）',
          `api_type` varchar(50) NOT NULL COMMENT 'APIタイプ（google, notion, outlook）',
          `api_url` varchar(255) NOT NULL COMMENT 'API接続先URL',
          `description` text DEFAULT NULL COMMENT 'API機能の説明文',
          `required_scopes` text DEFAULT NULL COMMENT '必要な権限スコープ（カンマ区切り）',
          `created_at` timestamp NOT NULL DEFAULT current_timestamp() COMMENT '作成日時',
          `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '更新日時',
          PRIMARY KEY (`id`),
          UNIQUE KEY `unique_api_type` (`api_type`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
        """))
        
        # 初期データを挿入
        db.session.execute(text("""
        INSERT INTO `api_settings` (`name`, `api_type`, `api_url`, `description`, `required_scopes`) VALUES
        ('Google Calendar', 'google', 'https://www.googleapis.com/calendar/v3', 'Googleカレンダーとの連携', 'https://www.googleapis.com/auth/calendar.readonly,https://www.googleapis.com/auth/userinfo.email'),
        ('Notion', 'notion', 'https://api.notion.com/v1', 'Notionとの連携', NULL),
        ('Outlook Calendar', 'outlook', 'https://graph.microsoft.com/v1.0/me/calendar', 'Outlookカレンダーとの連携', 'Calendars.Read');
        """))
        
        db.session.commit()
        print("api_settingsテーブルを作成し、初期データを挿入しました")
    except Exception as e:
        db.session.rollback()
        print(f"エラーが発生しました: {e}") 