from flask import Blueprint

bp = Blueprint('teacher', __name__)

from . import views

__all__ = ['bp'] 