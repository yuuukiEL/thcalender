from flask import Blueprint, jsonify
from apps.models.elevator import building

bp = Blueprint('elevator', __name__)

@bp.route('/api/floors')
def get_floors():
    return jsonify([{
        'number': floor.number,
        'display_name': floor.display_name,
        'image_path': floor.image_path
    } for floor in building.floors])

@bp.route('/api/elevators/<int:floor_number>')
def get_elevators_for_floor(floor_number):
    elevators = building.get_elevators_for_floor(floor_number)
    return jsonify([{
        'color': elevator.color,
        'color_code': elevator.color_code
    } for elevator in elevators]) 