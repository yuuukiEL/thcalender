# cython_models.pyx
import numpy as np
cimport numpy as np
import pandas as pd
from sqlalchemy import text
from sqlalchemy.orm import Query
from typing import List, Dict, Any, Optional

# 型定義
ctypedef np.int_t DTYPE_INT
ctypedef np.float_t DTYPE_FLOAT

def fast_student_search(db_session, str name_query, str course_id=None):
    """学生の高速検索"""
    cdef list results
    cdef dict student_dict
    cdef list student_list = []
    
    # SQLクエリを直接実行（高速）
    query = "SELECT * FROM students WHERE name LIKE :name"
    params = {"name": f"%{name_query}%"}
    
    if course_id:
        query += " AND course_id = :course_id"
        params["course_id"] = course_id
    
    # 直接SQLを実行
    results = db_session.execute(text(query), params).fetchall()
    
    # 結果を辞書のリストに変換
    for row in results:
        student_dict = dict(row._mapping)
        student_list.append(student_dict)
    
    return student_list

def fast_schedule_processing(np.ndarray[DTYPE_INT, ndim=2] schedule_data):
    """スケジュールデータの高速処理"""
    cdef np.ndarray[DTYPE_INT, ndim=2] result
    cdef int i, j, rows, cols
    
    rows = schedule_data.shape[0]
    cols = schedule_data.shape[1]
    
    # 新しい配列を作成
    result = np.zeros((rows, cols), dtype=np.int)
    
    # データ処理（例：各値を2倍にする）
    for i in range(rows):
        for j in range(cols):
            result[i, j] = schedule_data[i, j] * 2
    
    return result

def calculate_attendance_stats(np.ndarray[DTYPE_FLOAT, ndim=1] attendance_rates):
    """出席率の統計計算"""
    cdef double mean, std_dev, min_val, max_val
    cdef int count = attendance_rates.shape[0]
    
    if count == 0:
        return {"mean": 0, "std": 0, "min": 0, "max": 0, "count": 0}
    
    mean = np.mean(attendance_rates)
    std_dev = np.std(attendance_rates)
    min_val = np.min(attendance_rates)
    max_val = np.max(attendance_rates)
    
    return {
        "mean": mean,
        "std": std_dev,
        "min": min_val,
        "max": max_val,
        "count": count
    }

def fast_course_enrollment_count(db_session):
    """コース別の登録者数を高速集計"""
    cdef list results
    cdef dict course_counts = {}
    
    # 直接SQLで集計クエリを実行
    query = """
    SELECT c.course_id, c.course_name, COUNT(s.student_id) as student_count
    FROM course_master c
    LEFT JOIN students s ON c.course_id = s.course_id
    GROUP BY c.course_id, c.course_name
    """
    
    results = db_session.execute(text(query)).fetchall()
    
    # 結果を辞書に変換
    for row in results:
        course_counts[row.course_id] = {
            "course_name": row.course_name,
            "student_count": row.student_count
        }
    
    return course_counts 