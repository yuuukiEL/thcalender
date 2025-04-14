from apps.extensions import db

class BaseModel(db.Model):
    """共通のモデル基底クラス"""
    __abstract__ = True

    def save(self):
        """モデルをデータベースに保存"""
        db.session.add(self)
        db.session.commit()

    def delete(self):
        """モデルをデータベースから削除"""
        db.session.delete(self)
        db.session.commit()

    @classmethod
    def get_by_id(cls, id):
        """IDによるモデルの取得"""
        return cls.query.get(id)

    @classmethod
    def get_all(cls):
        """全てのモデルを取得"""
        return cls.query.all() 