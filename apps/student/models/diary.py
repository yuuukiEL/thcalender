"""日記関連のモデル"""
from apps.extensions import db
from datetime import datetime
from apps.models.base import BaseModel

# 中間テーブルの定義
diary_hashtags = db.Table('diary_hashtags',
    db.Column('diary_id', db.Integer, db.ForeignKey('diaries.diary_id', ondelete='CASCADE'), primary_key=True),
    db.Column('hashtag_id', db.Integer, db.ForeignKey('hashtags.hashtag_id', ondelete='CASCADE'), primary_key=True),
    extend_existing=True
)

class Diary(BaseModel):
    """日記モデル"""
    __tablename__ = 'diaries'
    __table_args__ = {'extend_existing': True}

    diary_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    student_id = db.Column(db.String(5), db.ForeignKey('students.student_id'), nullable=False)
    title = db.Column(db.String(100), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)

    # リレーションシップ
    student = db.relationship('apps.models.student.Student', backref=db.backref('diaries', lazy=True))
    images = db.relationship('DiaryImage', backref='diary', lazy=True, cascade='all, delete-orphan')
    hashtags = db.relationship('Hashtag', 
                             secondary=diary_hashtags, 
                             lazy='subquery',
                             back_populates='diaries')

    def __repr__(self):
        return f'<Diary {self.diary_id}: {self.title}>'

    def to_dict(self):
        """モデルを辞書に変換"""
        return {
            'diary_id': self.diary_id,
            'student_id': self.student_id,
            'student_name': self.student.name if self.student else None,
            'title': self.title,
            'content': self.content,
            'hashtags': [h.tag_name for h in self.hashtags],
            'image_count': len(self.images),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class DiaryImage(BaseModel):
    """日記画像モデル"""
    __tablename__ = 'diary_images'
    __table_args__ = {'extend_existing': True}

    image_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    diary_id = db.Column(db.Integer, db.ForeignKey('diaries.diary_id'), nullable=False)
    image_data = db.Column(db.LargeBinary, nullable=False)
    image_name = db.Column(db.String(255), nullable=False)
    mime_type = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.now)

    def __repr__(self):
        return f'<DiaryImage {self.image_id}: {self.image_name}>'

    def to_dict(self):
        """モデルを辞書に変換"""
        return {
            'image_id': self.image_id,
            'diary_id': self.diary_id,
            'diary_title': self.diary.title if self.diary else None,
            'image_name': self.image_name,
            'mime_type': self.mime_type,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Hashtag(BaseModel):
    """ハッシュタグモデル"""
    __tablename__ = 'hashtags'
    __table_args__ = {'extend_existing': True}
    
    hashtag_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    tag_name = db.Column(db.String(50), nullable=False, unique=True)
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    
    # リレーションシップ
    diaries = db.relationship('Diary', 
                            secondary='diary_hashtags', 
                            back_populates='hashtags')

    def __repr__(self):
        return f'<Hashtag {self.hashtag_id}: {self.tag_name}>'

    def to_dict(self):
        """モデルを辞書に変換"""
        return {
            'hashtag_id': self.hashtag_id,
            'tag_name': self.tag_name,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }