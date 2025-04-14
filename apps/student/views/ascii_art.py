from flask import Blueprint, render_template, current_app, jsonify
import os
import numpy as np
import pandas as pd

bp = Blueprint('student_ascii', __name__)

@bp.route('/f-screen')
def f_screen():
    """Fスクリーン表示"""
    return render_template('student/auth/f_screen.html')

@bp.route('/api/optimize-ascii')
def optimize_ascii():
    """アスキーアートを最適化して返す"""
    try:
        # F.txtのパスを取得
        f_txt_path = os.path.join(current_app.static_folder, 'common/img/F.txt')
        
        # ファイルを読み込む
        with open(f_txt_path, 'r') as file:
            ascii_text = file.read()
        
        # 行に分割
        lines = ascii_text.split('\n')
        
        # NumPyの2次元配列に変換
        max_length = max(len(line) for line in lines)
        ascii_array = np.zeros((len(lines), max_length), dtype='U1')
        
        for i, line in enumerate(lines):
            for j, char in enumerate(line):
                ascii_array[i, j] = char
        
        # 空白でない文字の位置を抽出
        non_space_mask = ascii_array != ' '
        non_space_indices = np.where(non_space_mask)
        
        # 最適化されたデータ構造を作成
        optimized_data = {
            'width': max_length,
            'height': len(lines),
            'positions': []
        }
        
        # 非空白文字の位置と文字を記録
        for i, j in zip(non_space_indices[0], non_space_indices[1]):
            optimized_data['positions'].append({
                'x': int(j),
                'y': int(i),
                'char': ascii_array[i, j]
            })
        
        return jsonify({
            'success': True,
            'data': optimized_data,
            'raw_text': ascii_text
        })
    except Exception as e:
        current_app.logger.error(f"アスキーアート最適化エラー: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }) 