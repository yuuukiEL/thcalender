from .extensions import db
import numpy as np
import pandas as pd
from sqlalchemy.orm import Query
from typing import List, Dict, Any, Union, Optional

class BaseModel(db.Model):
    """全モデルの基底クラス"""
    __abstract__ = True  # 抽象基底クラスとして定義

    def save(self):
        """モデルインスタンスを保存"""
        try:
            db.session.add(self)
            db.session.commit()
            return True
        except Exception as e:
            db.session.rollback()
            raise e

    def delete(self):
        """モデルインスタンスを削除"""
        try:
            db.session.delete(self)
            db.session.commit()
            return True
        except Exception as e:
            db.session.rollback()
            raise e

    @classmethod
    def get_by_id(cls, id):
        """IDによるインスタンス取得"""
        return cls.query.get(id)

    @classmethod
    def get_all(cls):
        """全インスタンス取得"""
        return cls.query.all()
        
    @classmethod
    def to_dataframe(cls, query: Optional[Query] = None) -> pd.DataFrame:
        """クエリ結果をPandasデータフレームに変換"""
        if query is None:
            query = cls.query
            
        # SQLAlchemyのクエリ結果をリストに変換
        results = query.all()
        
        if not results:
            return pd.DataFrame()
            
        # 各オブジェクトを辞書に変換
        data = []
        for obj in results:
            item = {}
            for column in cls.__table__.columns:
                item[column.name] = getattr(obj, column.name)
            data.append(item)
            
        # データフレームに変換
        return pd.DataFrame(data)
        
    @classmethod
    def bulk_insert(cls, data_list: List[Dict[str, Any]]) -> bool:
        """データの一括挿入（高速）"""
        try:
            # 一括挿入用のオブジェクトリストを作成
            objects = [cls(**data) for data in data_list]
            
            # 一括挿入
            db.session.bulk_save_objects(objects)
            db.session.commit()
            return True
        except Exception as e:
            db.session.rollback()
            raise e
            
    @classmethod
    def analyze_data(cls, df: pd.DataFrame, columns: List[str]) -> Dict[str, Any]:
        """データフレームの統計分析"""
        if df.empty:
            return {}
            
        # 数値列のみ抽出
        numeric_df = df.select_dtypes(include=[np.number])
        
        # 指定された列のみ分析
        if columns:
            numeric_df = numeric_df[[col for col in columns if col in numeric_df.columns]]
            
        if numeric_df.empty:
            return {}
            
        # 基本統計量を計算
        stats = {
            'mean': numeric_df.mean().to_dict(),
            'median': numeric_df.median().to_dict(),
            'std': numeric_df.std().to_dict(),
            'min': numeric_df.min().to_dict(),
            'max': numeric_df.max().to_dict(),
            'count': len(df)
        }
        
        return stats 