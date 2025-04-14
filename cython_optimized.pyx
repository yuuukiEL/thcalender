import pymysql
import os
import numpy as np
cimport numpy as np

def cleanup_connections():
    """Cythonで最適化された接続クリーンアップ関数"""
    cdef int process_id, thread_id
    
    try:
        conn = pymysql.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            user=os.getenv('DB_USER', 'root'),
            password=os.getenv('DB_PASSWORD', 'Tomodachi1!'),
            database=os.getenv('DB_NAME', 'calender2')
        )
        
        thread_id = conn.thread_id()
        
        with conn.cursor() as cursor:
            cursor.execute("SHOW PROCESSLIST")
            processes = cursor.fetchall()
            
            # 高速ループ処理
            for process in processes:
                process_id = process[0]
                if process[4] == 'Sleep' and process_id != thread_id:
                    cursor.execute(f"KILL {process_id}")
        
        conn.close()
        return True
    except Exception as e:
        print(f"Cython接続クリーンアップエラー: {e}")
        return False 