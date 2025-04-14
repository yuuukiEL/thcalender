# HAL学生管理システム

## 概要
このシステムは、HAL専門学校の学生管理を効率化するためのウェブアプリケーションです。教師と学生のコミュニケーションを促進し、学習進捗の管理をサポートします。

## 主な機能
- 学生情報管理
- 出席管理
- 課題提出・管理
- 掲示板機能
- スケジュール管理
- 教師・学生間のコミュニケーション

## 技術スタック
- バックエンド: Python (Flask)
- フロントエンド: HTML, CSS, JavaScript
- データベース: MySQL
- 認証: Flask-Login

## セットアップ方法

### 前提条件
- Python 3.8以上
- MySQL 5.7以上
- pip (Pythonパッケージマネージャー)

### インストール手順
1. リポジトリをクローン
   ```
   git clone https://github.com/yuuukiEL/thcalender.git
   cd hal-student-management
   ```

2. 仮想環境を作成して有効化
   ```
   python -m venv venv
   source venv/bin/activate  # Linuxの場合
   venv\Scripts\activate     # Windowsの場合
   ```

3. 依存パッケージをインストール
   ```
   pip install -r requirements.txt
   ```

4. データベースのセットアップ
   ```
   mysql -u root -p < calender2\ \(5\).sql
   ```

5. 環境変数の設定
   `.env`ファイルを作成し、以下の内容を設定
   ```
   FLASK_APP=run.py
   FLASK_ENV=development
   SECRET_KEY=your_secret_key
   DATABASE_URL=mysql://username:password@localhost/database_name
   ```

6. アプリケーションの起動
   ```
   flask run
   ```

## 使用方法
1. ブラウザで `http://localhost:5000` にアクセス
2. 教師または学生としてログイン
   - 教師アカウント: メールアドレスとパスワードでログイン
   - 学生アカウント: 学生IDとパスワードでログイン

## ディレクトリ構造
```
hal-student-management/
├── apps/                  # アプリケーションコード
│   ├── admin/             # 管理者機能
│   ├── student/           # 学生機能
│   ├── teacher/           # 教師機能
│   ├── static/            # 静的ファイル
│   └── templates/         # HTMLテンプレート
├── uploads/               # アップロードされたファイル
├── logs/                  # ログファイル
├── requirements.txt       # 依存パッケージリスト
├── calender2 (5).sql      # データベーススキーマ
└── run.py                 # アプリケーション起動スクリプト
```

## 必要なリソース

このプロジェクトを実行するには、以下のリソースを別途入手して配置する必要があります：


### Featherアイコン(zipファイル)
- Featherアイコンを `assets/feather/` ディレクトリに配置してください
- 入手先: https://feathericons.com/ 

### FullCalendar
- FullCalendar ライブラリを `assets/fullcalendar/` ディレクトリに配置してください
- 入手先: https://fullcalendar.io/
- バージョン: [使用しているバージョン番号] 

## 就職プレゼンテーション向け情報

このプロジェクトは就職活動におけるプレゼンテーション用に制作されました。以下の点を重視して開発しています：

### 開発の目的
- 実務に近い環境での開発経験を積むこと
- チーム開発のプロセスを理解すること
- 実際の業務で使用されるような実用的なシステムを構築すること

### 習得したスキル
- Webアプリケーション開発（フルスタック）
- データベース設計と実装
- ユーザー認証とセキュリティ対策
- レスポンシブデザイン
- APIの設計と実装

### 工夫した点
- ユーザビリティを重視したUI/UXデザイン
- スケーラブルなアーキテクチャ設計
- セキュリティを考慮した実装
- 効率的なデータベースクエリの最適化

### 今後の展望
- 機能の拡張（モバイルアプリ対応など）
- パフォーマンスの最適化
- より高度なデータ分析機能の追加
- クラウドサービスとの連携強化

## 連絡先

開発者: [kazuma kobayashi]
メール: [arkeuce69@gmail.com]
ポートフォリオ: [https://github.com/yuuukiEL]

## ログイン方法

### 学生アカウント
- 学籍番号: 20024
- パスワード: Tomodachi1!

1. トップページで「学生ログイン」ボタンをクリック
2. 上記の学籍番号とパスワードを入力
3. ログインボタンをクリック


