from apps import create_app, db
from sqlalchemy import text

app = create_app()

with app.app_context():
    # マイグレーションをスキップするためのダミーエントリを作成
    try:
        db.session.execute(text("INSERT INTO alembic_version (version_num) VALUES ('36179ca14eb1')"))
        db.session.commit()
        print("マイグレーションエントリを追加しました")
    except Exception as e:
        db.session.rollback()
        print(f"エラーが発生しました: {e}")
    
    # oauth_statesテーブルを作成
    try:
        db.session.execute(text("""
        CREATE TABLE IF NOT EXISTS `oauth_states` (
          `id` int(11) NOT NULL AUTO_INCREMENT,
          `state` varchar(100) NOT NULL,
          `user_id` varchar(20) NOT NULL,
          `service` varchar(20) NOT NULL,
          `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
          `expires_at` datetime DEFAULT NULL,
          PRIMARY KEY (`id`),
          UNIQUE KEY `state` (`state`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
        """))
        db.session.commit()
        print("oauth_statesテーブルを作成しました")
    except Exception as e:
        db.session.rollback()
        print(f"エラーが発生しました: {e}") 