import os
from apps import create_app
import logging
import pymysql
import numpy as np
import pandas as pd
from cython_optimized import cleanup_connections
from flask import request, Response, make_response

# 環境変数から設定名を取得、デフォルトは'development'
config_name = os.getenv('FLASK_ENV', 'development')

# アプリケーション作成前にデータベース接続をクリーンアップ
try:
    # Cythonで最適化された関数を使用
    cleanup_result = cleanup_connections()
    if not cleanup_result:
        # Cython関数が失敗した場合のフォールバック処理
        # 既存のpandas処理コードはそのまま残す
        conn = pymysql.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            user=os.getenv('DB_USER', 'root'),
            password=os.getenv('DB_PASSWORD', 'Tomodachi1!'),
            database=os.getenv('DB_NAME', 'calender2')
        )
        with conn.cursor() as cursor:
            cursor.execute("SHOW PROCESSLIST")
            processes = cursor.fetchall()
            
        # pandasデータフレームに変換して処理
        df = pd.DataFrame(processes)
        # 自分自身の接続以外でSleepのものをフィルタリング
        sleep_processes = df[
            (df[4] == 'Sleep') & 
            (df[0] != conn.thread_id())
        ]
        
        # 高速に処理
        if not sleep_processes.empty:
            with conn.cursor() as cursor:
                for process_id in sleep_processes[0].tolist():
                    cursor.execute(f"KILL {process_id}")
        
        conn.close()
except Exception as e:
    print(f"接続クリーンアップエラー: {e}")

app = create_app(config_name)

# 検索エンジンにインデックスされないようにするミドルウェア
@app.after_request
def add_noindex_header(response):
    # robots.txtへのリクエストの場合は特別な処理
    if request.path == '/robots.txt':
        content = "User-agent: *\nDisallow: /\n"
        return Response(content, mimetype='text/plain')
    
    # 他のすべてのレスポンスにno-indexヘッダーを追加
    response.headers['X-Robots-Tag'] = 'noindex, nofollow'
    return response

# ロギングレベルを変更
logging.basicConfig(level=logging.WARNING)  # DEBUGからWARNINGに変更

# 特定のログを抑制
import logging

# スケジュール関連のログを抑制するロガーを設定
schedule_logger = logging.getLogger('schedule')
schedule_logger.setLevel(logging.WARNING)  # または logging.ERROR

# 元のコードで、詳細なログを出力している箇所を修正
# 例: print文をlogger.debug()に置き換える
def get_schedule(student_id, day, period):
    # 以下のような print 文の代わりに
    # print(f"スケジュール検索: student_id={student_id}, day={day}, period={period}")
    
    # こう書く
    schedule_logger.debug(f"スケジュール検索: student_id={student_id}, day={day}, period={period}")
    
    # 以下同様に変更

# Flaskのログレベルを変更
import logging
from flask.logging import default_handler

default_handler.setLevel(logging.WARNING)  # DEBUGからWARNINGに変更

# または完全に無効化する場合
app.logger.disabled = True

# データベース接続プールの設定 - より保守的な値に調整
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'pool_size': 5,  # 同時接続数を減らす
    'max_overflow': 10,
    'pool_recycle': 60,  # 1分でリサイクル
    'pool_pre_ping': True,
    'pool_timeout': 30  # 接続タイムアウトを設定
}

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True)