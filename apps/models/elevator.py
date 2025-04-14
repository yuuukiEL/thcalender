class Floor:
    def __init__(self, number, display_name, image_path=None):
        self.number = number
        self.display_name = display_name
        self.image_path = image_path

class Elevator:
    def __init__(self, color, color_code):
        self.color = color
        self.color_code = color_code

class Building:
    def __init__(self):
        self.floors = [
            Floor(7, "7階"),
            Floor(8, "8階"),
            Floor(9, "9階"),
            Floor(10, "10階")
        ]
        self.elevators = {
            "red": Elevator("赤", "#FF0000"),
            "blue": Elevator("青", "#0000FF")
        }

    def get_elevators_for_floor(self, floor_number):
        return list(self.elevators.values())

building = Building() 