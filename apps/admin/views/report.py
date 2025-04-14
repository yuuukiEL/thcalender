from flask import (
    Blueprint,
    request,
    redirect,
    url_for,
    flash,
    render_template,
    jsonify,
    current_app,
    session,
)
from datetime import datetime
from apps.models.report import Report
from apps.models.student import Student
from ...extensions import db
from .auth import login_required
import os

bp = Blueprint("report", __name__)

@bp.route("/reports", methods=["GET"])
@login_required
def list_reports():
    try:
        reports = Report.query.order_by(Report.created_at.desc()).all()
        report_list = [report.to_dict() for report in reports]
        return render_template("reports/list.html", reports=report_list)
    except Exception as e:
        flash(f"報告の取得に失敗しました: {str(e)}", "error")
        return redirect(url_for("views.index"))

@bp.route("/reports/create", methods=["GET", "POST"])
@login_required
def create_report():
    try:
        if request.method == "POST":
            content = request.form.get("content")
            is_anonymous = request.form.get("is_anonymous") == "true"
            student_id = None if is_anonymous else session.get("student_id")

            # 画像の処理
            image_paths = []
            if 'images' in request.files:
                images = request.files.getlist('images')
                for image in images:
                    if image and image.filename:
                        filename = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{image.filename}"
                        image_path = os.path.join('report_board', str(student_id) if student_id else 'anonymous', filename)
                        os.makedirs(os.path.dirname(image_path), exist_ok=True)
                        image.save(image_path)
                        image_paths.append(image_path)

            # 動画の処理
            video_paths = []
            if 'videos' in request.files:
                videos = request.files.getlist('videos')
                for video in videos:
                    if video and video.filename:
                        filename = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{video.filename}"
                        video_path = os.path.join('report_board', str(student_id) if student_id else 'anonymous', filename)
                        os.makedirs(os.path.dirname(video_path), exist_ok=True)
                        video.save(video_path)
                        video_paths.append(video_path)

            report = Report(
                student_id=student_id,
                content=content,
                image_paths=','.join(image_paths) if image_paths else None,
                video_paths=','.join(video_paths) if video_paths else None
            )
            db.session.add(report)
            db.session.commit()

            flash("報告を作成しました。", "success")
            return redirect(url_for("report.list_reports"))

        return render_template("reports/create.html")

    except Exception as e:
        db.session.rollback()
        flash(f"報告の作成に失敗しました: {str(e)}", "error")
        return redirect(url_for("report.list_reports"))

@bp.route("/reports/<int:report_id>", methods=["GET"])
@login_required
def view_report(report_id):
    try:
        report = Report.query.get_or_404(report_id)
        return render_template("reports/view.html", report=report.to_dict())
    except Exception as e:
        flash(f"報告の取得に失敗しました: {str(e)}", "error")
        return redirect(url_for("report.list_reports"))

@bp.route("/reports/<int:report_id>", methods=["DELETE"])
@login_required
def delete_report(report_id):
    try:
        report = Report.query.get_or_404(report_id)
        
        # 報告者本人または管理者のみ削除可能
        if report.student_id == session.get("student_id") or session.get("is_admin"):
            # 画像・動画ファイルの削除
            if report.image_paths:
                for path in report.image_paths.split(','):
                    try:
                        os.remove(path)
                    except OSError:
                        current_app.logger.warning(f"Failed to delete image: {path}")

            if report.video_paths:
                for path in report.video_paths.split(','):
                    try:
                        os.remove(path)
                    except OSError:
                        current_app.logger.warning(f"Failed to delete video: {path}")

            db.session.delete(report)
            db.session.commit()
            return jsonify({"success": True, "message": "報告を削除しました"})
        else:
            return jsonify({"success": False, "error": "削除権限がありません"}), 403

    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500 