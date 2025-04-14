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
from apps.models import Announcement
from apps.models import Teacher
from ...extensions import db
from .auth import login_required, admin_required

bp = Blueprint("announcement", __name__)

@bp.route("/announcements", methods=["GET"])
@login_required
def list_announcements():
    try:
        announcements = Announcement.query.order_by(Announcement.created_at.desc()).all()
        announcement_list = [announcement.to_dict() for announcement in announcements]
        return render_template("announcements/list.html", announcements=announcement_list)
    except Exception as e:
        flash(f"お知らせの取得に失敗しました: {str(e)}", "error")
        return redirect(url_for("views.index"))

@bp.route("/announcements/create", methods=["GET", "POST"])
@login_required
@admin_required
def create_announcement():
    try:
        if request.method == "POST":
            title = request.form.get("title")
            content = request.form.get("content")
            teacher_id = session.get("teacher_id")

            announcement = Announcement(
                title=title,
                content=content,
                created_by=teacher_id
            )
            db.session.add(announcement)
            db.session.commit()

            flash("お知らせを作成しました。", "success")
            return redirect(url_for("announcement.list_announcements"))

        return render_template("announcements/create.html")

    except Exception as e:
        db.session.rollback()
        flash(f"お知らせの作成に失敗しました: {str(e)}", "error")
        return redirect(url_for("announcement.list_announcements"))

@bp.route("/announcements/<int:announcement_id>", methods=["GET"])
@login_required
def view_announcement(announcement_id):
    try:
        announcement = Announcement.query.get_or_404(announcement_id)
        return render_template("announcements/view.html", announcement=announcement.to_dict())
    except Exception as e:
        flash(f"お知らせの取得に失敗しました: {str(e)}", "error")
        return redirect(url_for("announcement.list_announcements"))

@bp.route("/announcements/<int:announcement_id>/edit", methods=["GET", "POST"])
@login_required
@admin_required
def edit_announcement(announcement_id):
    try:
        announcement = Announcement.query.get_or_404(announcement_id)

        if request.method == "POST":
            announcement.title = request.form.get("title")
            announcement.content = request.form.get("content")
            db.session.commit()

            flash("お知らせを更新しました。", "success")
            return redirect(url_for("announcement.view_announcement", announcement_id=announcement_id))

        return render_template("announcements/edit.html", announcement=announcement.to_dict())

    except Exception as e:
        db.session.rollback()
        flash(f"お知らせの更新に失敗しました: {str(e)}", "error")
        return redirect(url_for("announcement.list_announcements"))

@bp.route("/announcements/<int:announcement_id>", methods=["DELETE"])
@login_required
@admin_required
def delete_announcement(announcement_id):
    try:
        announcement = Announcement.query.get_or_404(announcement_id)
        db.session.delete(announcement)
        db.session.commit()
        return jsonify({"success": True, "message": "お知らせを削除しました"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500 