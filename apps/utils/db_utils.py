from typing import List, Dict, Any, Optional, Tuple, Union
from sqlalchemy.orm import Query
from sqlalchemy.exc import SQLAlchemyError
from ..config import Config
from ..database import db
from contextlib import contextmanager
from flask import current_app
from sqlalchemy import text

class DatabaseUtils:
    """データベースユーティリティクラス"""

    @staticmethod
    @contextmanager
    def get_cursor():
        """PyMySQL接続とカーソルを提供するコンテキストマネージャー"""
        conn = Config.get_db_connection()
        try:
            cursor = conn.cursor()
            yield cursor
            conn.commit()
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            cursor.close()
            conn.close()

    @staticmethod
    def execute_raw_sql(sql: str, params: Optional[Union[Dict, List]] = None) -> int:
        """生のSQLを実行（INSERT/UPDATE/DELETE用）"""
        with DatabaseUtils.get_cursor() as cursor:
            if params is not None:
                cursor.execute(sql, params)
            else:
                cursor.execute(sql)
            return cursor.rowcount

    @staticmethod
    def fetch_all(sql: str, params: Optional[Union[Dict, List]] = None) -> List[Dict]:
        """生のSQLを実行してすべての結果を取得"""
        with DatabaseUtils.get_cursor() as cursor:
            if params is not None:
                cursor.execute(sql, params)
            else:
                cursor.execute(sql)
            return cursor.fetchall()

    @staticmethod
    def fetch_one(sql: str, params: Optional[Union[Dict, List]] = None) -> Optional[Dict]:
        """生のSQLを実行して1行を取得"""
        with DatabaseUtils.get_cursor() as cursor:
            if params is not None:
                cursor.execute(sql, params)
            else:
                cursor.execute(sql)
            return cursor.fetchone()

    @staticmethod
    def execute_many(sql: str, params_list: List[Dict]) -> int:
        """複数のSQLを一括実行"""
        with DatabaseUtils.get_cursor() as cursor:
            cursor.executemany(sql, params_list)
            return cursor.rowcount

    @staticmethod
    def transaction():
        """SQLAlchemyトランザクションを提供するコンテキストマネージャー"""
        try:
            yield
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            raise e

    @staticmethod
    def paginate_query(query: Query, page: int = 1, per_page: int = 20) -> Tuple[List, int]:
        """SQLAlchemyクエリをページネーション"""
        items = query.limit(per_page).offset((page - 1) * per_page).all()
        total = query.count()
        return items, total

    @staticmethod
    def bulk_save(objects: List[Any]) -> None:
        """複数のオブジェクトを一括保存"""
        try:
            db.session.bulk_save_objects(objects)
            db.session.commit()
        except SQLAlchemyError as e:
            db.session.rollback()
            raise e

    @staticmethod
    def bulk_insert(model: Any, mappings: List[Dict]) -> None:
        """複数のマッピングを一括挿入"""
        try:
            db.session.bulk_insert_mappings(model, mappings)
            db.session.commit()
        except SQLAlchemyError as e:
            db.session.rollback()
            raise e

    @staticmethod
    def bulk_update(model: Any, mappings: List[Dict]) -> None:
        """複数のマッピングを一括更新"""
        try:
            db.session.bulk_update_mappings(model, mappings)
            db.session.commit()
        except SQLAlchemyError as e:
            db.session.rollback()
            raise e

def test_db_connection():
    """データベース接続をテスト"""
    try:
        # シンプルなクエリを実行してみる
        db.session.execute(text('SELECT 1'))
        return True, "データベース接続OK"
    except Exception as e:
        return False, f"データベース接続エラー: {str(e)}"

def get_db_info():
    """データベース接続情報を取得"""
    config = current_app.config
    return {
        'host': config.get('DB_HOST'),
        'database': config.get('DB_NAME'),
        'user': config.get('DB_USER'),
        'charset': config.get('MYSQL_CLIENT_CHARSET'),
        'pool_size': config.get('SQLALCHEMY_POOL_SIZE'),
        'pool_timeout': config.get('SQLALCHEMY_POOL_TIMEOUT'),
        'pool_recycle': config.get('SQLALCHEMY_POOL_RECYCLE')
    }