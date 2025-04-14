import networkx as nx
import graphviz
import xml.etree.ElementTree as ET
import re
from datetime import datetime
import shapefile  # pyshpのみを使用


class BuildingNetwork:
    def __init__(self):
        self.G = nx.Graph()
        # ノードタイプの定義
        self.node_types = {
            "classroom": {"description": "教室"},
            "mens_room": {"description": "男子トイレ"},
            "womens_room": {"description": "女子トイレ"},
            "elevator_red": {"description": "赤エレベーター"},
            "elevator_blue": {"description": "青エレベーター"},
            "elevator_green": {"description": "緑エレベーター"},
            "stairs_up": {"description": "階段（上り）"},
            "stairs_down": {"description": "階段（下り）"},
            "stairs_both": {"description": "階段（両方向）"},
            "stairs_both_left": {"description": "両方向階段（左）"},
            "stairs_both_right": {"description": "両方向階段（右）"},
        }

        # エッジタイプ
        self.edge_types = {"corridor": {"description": "廊下"}}  # 廊下のみを定義

        # エレベーターの停止階を定義
        self.elevator_stops = {
            "elevator_red": [2, 4, 9, 15, 21, 30, 33, 36, 39, 42, 45, 48],
            "elevator_blue": [2, 4, 24, 27, 30, 33, 36, 39],
            "elevator_green": [2, 4, 9, 12, 15, 18, 21, 24, 27, 30, 39],
        }

        # 階段の移動コスト（秒）
        self.stair_costs = {
            "up": 15,  # 1階上がるのに15秒
            "down": 10,  # 1階下がるのに10秒
            "fatigue_multiplier": 1.2,  # 連続した階の移動による疲労係数
        }

    def add_node(self, node_id, coords, node_type="shape_point", **attributes):
        """ノードを追加（属性付き）"""
        self.G.add_node(
            node_id,
            coords=coords,
            node_type=node_type,
            **attributes,  # シェープファイルからの追加属性
        )

    def add_edge(self, start_id, end_id, edge_type="corridor", **attributes):
        """エッジを追加（属性付き）"""
        start_coords = self.G.nodes[start_id]["coords"]
        end_coords = self.G.nodes[end_id]["coords"]

        # 通常の距離を計算
        distance = (
            (start_coords[0] - end_coords[0]) ** 2
            + (start_coords[1] - end_coords[1]) ** 2
        ) ** 0.5

        # 階段の場合、上り下りのコストを計算
        if self.G.nodes[start_id]["node_type"].startswith("stairs") and self.G.nodes[
            end_id
        ]["node_type"].startswith("stairs"):
            start_floor = self.G.nodes[start_id]["floor"]
            end_floor = self.G.nodes[end_id]["floor"]
            floor_diff = end_floor - start_floor

            if floor_diff > 0:  # 上り
                weight = self.stair_costs["up"] * abs(floor_diff)
            else:  # 下り
                weight = self.stair_costs["down"] * abs(floor_diff)
        else:
            weight = distance

        self.G.add_edge(
            start_id, end_id, weight=weight, edge_type=edge_type, **attributes
        )

    def find_shortest_path(self, start_node, end_node):
        """最短経路を見つける（疲労度を考慮）"""
        try:
            # Dijkstraアルゴリズムのカスタム重み関数
            def weight_function(u, v, edge_data):
                base_weight = edge_data["weight"]

                # 階段の連続使用による疲労を考慮
                if self.G.nodes[u]["node_type"].startswith("stairs") and self.G.nodes[
                    v
                ]["node_type"].startswith("stairs"):
                    # パス内での階段の連続使用回数を計算
                    consecutive_stairs = 1
                    current = u
                    while current in path_so_far:
                        prev = path_so_far[current]
                        if not self.G.nodes[prev]["node_type"].startswith("stairs"):
                            break
                        consecutive_stairs += 1
                        current = prev

                    # 疲労係数を適用
                    return base_weight * (
                        self.stair_costs["fatigue_multiplier"]
                        ** (consecutive_stairs - 1)
                    )

                return base_weight

            # 経路追跡用の辞書
            path_so_far = {}

            # カスタム重み関数を使用してDijkstraアルゴリズムを実行
            path = nx.dijkstra_path(
                self.G, start_node, end_node, weight=weight_function
            )

            return path
        except nx.NetworkXNoPath:
            return None

    def find_nearest_facility(self, start_node, facility_type):
        """最寄りの施設（トイレ、階段など）を見つける"""
        min_distance = float("inf")
        nearest_facility = None

        for node in self.G.nodes():
            if self.G.nodes[node]["node_type"] == facility_type:
                try:
                    distance = nx.shortest_path_length(
                        self.G, start_node, node, weight="weight"
                    )
                    if distance < min_distance:
                        min_distance = distance
                        nearest_facility = node
                except nx.NetworkXNoPath:
                    continue

        return nearest_facility

    def to_dot(self):
        """GraphvizのDOT形式に変換"""
        dot = graphviz.Digraph(comment="Building Layout")

        # ノードの色とスタイルを設定
        node_styles = {
            "classroom": {"color": "lightblue", "shape": "box"},
            "mens_room": {"color": "lightgreen", "shape": "circle"},
            "womens_room": {"color": "pink", "shape": "circle"},
            "stairs": {"color": "gray", "shape": "triangle"},
            "elevator": {"color": "orange", "shape": "rectangle"},
            "up_only": {"color": "yellow", "shape": "triangle"},
            "down_only": {"color": "yellow", "shape": "invtriangle"},
            "corridor": {"color": "white", "shape": "point"},
        }

        # ノードを追加
        for node in self.G.nodes():
            node_type = self.G.nodes[node]["node_type"]
            floor = self.G.nodes[node]["floor"]
            style = node_styles.get(node_type, {"color": "white", "shape": "circle"})

            dot.node(
                str(node),
                f"{node}\n(Floor {floor})",
                color=style["color"],
                style="filled",
                shape=style["shape"],
            )

        # エッジを追加（色付きで）
        for edge in self.G.edges(data=True):
            edge_type = edge[2].get("edge_type", "corridor")
            edge_style = self.edge_types[edge_type]
            dot.edge(
                str(edge[0]),
                str(edge[1]),
                color=edge_style["color"],
                style=edge_style["style"],
            )

        return dot

    def to_drawio_xml(self, filename):
        """Draw.io用のXMLファイルを生成する"""
        # Draw.ioの基本的なXML構造を作成
        mxfile = ET.Element("mxfile")
        diagram = ET.SubElement(mxfile, "diagram")
        mxGraphModel = ET.SubElement(diagram, "mxGraphModel")
        root = ET.SubElement(mxGraphModel, "root")

        # デフォルトの親要素
        parent = ET.SubElement(root, "mxCell", id="0")
        parent = ET.SubElement(root, "mxCell", id="1", parent="0")

        # ノードのスタイル定義
        node_styles = {
            "classroom": "shape=rectangle;fillColor=#E1F5FE;strokeColor=#0288D1;",
            "mens_room": "shape=ellipse;fillColor=#E8F5E9;strokeColor=#2E7D32;",
            "womens_room": "shape=ellipse;fillColor=#FCE4EC;strokeColor=#C2185B;",
            "stairs": "shape=triangle;fillColor=#EEEEEE;strokeColor=#424242;",
            "elevator": "shape=rectangle;fillColor=#FFF3E0;strokeColor=#EF6C00;",
            "up_only": "shape=triangle;fillColor=#FFF9C4;strokeColor=#FBC02D;",
            "down_only": "shape=triangle;direction=south;fillColor=#FFF9C4;strokeColor=#FBC02D;",
            "corridor": "shape=ellipse;fillColor=#FFFFFF;strokeColor=#9E9E9E;",
        }

        # ノードの配置
        node_positions = {}
        current_x = 100
        current_y = 100
        floor_height = 200

        # 階層ごとにノードを整理
        nodes_by_floor = {}
        for node in self.G.nodes():
            floor = self.G.nodes[node]["floor"]
            if floor not in nodes_by_floor:
                nodes_by_floor[floor] = []
            nodes_by_floor[floor].append(node)

        # ノードをDraw.ioのセルとして追加
        cell_id = 2
        for floor in sorted(nodes_by_floor.keys(), reverse=True):
            current_x = 100
            current_y = 100 + (floor_height * (max(nodes_by_floor.keys()) - floor))

            for node in nodes_by_floor[floor]:
                node_type = self.G.nodes[node]["node_type"]
                style = node_styles.get(node_type, "")

                # ノードを追加
                cell = ET.SubElement(
                    root,
                    "mxCell",
                    id=str(cell_id),
                    value=f"{node}\n(Floor {floor})",
                    style=style,
                    vertex="1",
                    parent="1",
                )

                # ノードの位置を設定
                geometry = ET.SubElement(
                    cell,
                    "mxGeometry",
                    x=str(current_x),
                    y=str(current_y),
                    width="80",
                    height="40",
                    as_="geometry",
                )

                node_positions[node] = (cell_id, current_x, current_y)
                current_x += 150
                cell_id += 1

        # エッジを追加
        for edge in self.G.edges():
            source_id = str(node_positions[edge[0]][0])
            target_id = str(node_positions[edge[1]][0])

            edge_cell = ET.SubElement(
                root,
                "mxCell",
                id=str(cell_id),
                style="endArrow=none;html=1;",
                edge="1",
                parent="1",
                source=source_id,
                target=target_id,
            )

            # エッジの位置を設定
            edge_geometry = ET.SubElement(
                edge_cell, "mxGeometry", relative="1", as_="geometry"
            )
            cell_id += 1

        # XMLファイルとして保存
        tree = ET.ElementTree(mxfile)
        tree.write(filename, encoding="UTF-8", xml_declaration=True)

    def to_drawio_xml_by_floor(self, base_filename):
        """各階ごとにDraw.io用のXMLファイルを生成する"""
        # 階層ごとにノードを整理
        nodes_by_floor = {}
        for node in self.G.nodes():
            floor = self.G.nodes[node]["floor"]
            if floor not in nodes_by_floor:
                nodes_by_floor[floor] = []
            nodes_by_floor[floor].append(node)

        # 各階ごとにファイルを生成
        for floor in nodes_by_floor.keys():
            # Draw.ioの基本的なXML構造を作成
            mxfile = ET.Element("mxfile")
            diagram = ET.SubElement(mxfile, "diagram")
            mxGraphModel = ET.SubElement(diagram, "mxGraphModel")
            root = ET.SubElement(mxGraphModel, "root")

            # デフォルトの親要素
            parent = ET.SubElement(root, "mxCell", id="0")
            parent = ET.SubElement(root, "mxCell", id="1", parent="0")

            # ノードのスタイル定義（既存のnode_styles定義を使用）
            node_styles = {
                "classroom": "shape=rectangle;fillColor=#E1F5FE;strokeColor=#0288D1;",
                "mens_room": "shape=ellipse;fillColor=#E8F5E9;strokeColor=#2E7D32;",
                "womens_room": "shape=ellipse;fillColor=#FCE4EC;strokeColor=#C2185B;",
                "stairs": "shape=triangle;fillColor=#EEEEEE;strokeColor=#424242;",
                "elevator": "shape=rectangle;fillColor=#FFF3E0;strokeColor=#EF6C00;",
                "up_only": "shape=triangle;fillColor=#FFF9C4;strokeColor=#FBC02D;",
                "down_only": "shape=triangle;direction=south;fillColor=#FFF9C4;strokeColor=#FBC02D;",
                "corridor": "shape=ellipse;fillColor=#FFFFFF;strokeColor=#9E9E9E;",
            }

            # この階のノードの配置
            node_positions = {}
            current_x = 100
            current_y = 100

            # この階のノードを追加
            cell_id = 2
            for node in nodes_by_floor[floor]:
                node_type = self.G.nodes[node]["node_type"]
                style = node_styles.get(node_type, "")

                # ノードを追加
                cell = ET.SubElement(
                    root,
                    "mxCell",
                    id=str(cell_id),
                    value=f"{node}",  # 階数は同じ階なので表示しない
                    style=style,
                    vertex="1",
                    parent="1",
                )

                # ノードの位置を設定
                geometry = ET.SubElement(
                    cell,
                    "mxGeometry",
                    x=str(current_x),
                    y=str(current_y),
                    width="80",
                    height="40",
                    as_="geometry",
                )

                node_positions[node] = (cell_id, current_x, current_y)
                current_x += 150
                cell_id += 1

            # この階のエッジを追加
            for edge in self.G.edges():
                # 両方のノードがこの階にある場合のみエッジを追加
                if (
                    edge[0] in nodes_by_floor[floor]
                    and edge[1] in nodes_by_floor[floor]
                ):
                    source_id = str(node_positions[edge[0]][0])
                    target_id = str(node_positions[edge[1]][0])

                    edge_type = self.G.edges[edge[0], edge[1]].get(
                        "edge_type", "corridor"
                    )
                    edge_style = self.edge_types[edge_type]

                    edge_cell = ET.SubElement(
                        root,
                        "mxCell",
                        id=str(cell_id),
                        style=f"endArrow=none;html=1;strokeColor={edge_style['color']};strokeWidth=2;{edge_style['style']}=1;",
                        edge="1",
                        parent="1",
                        source=source_id,
                        target=target_id,
                    )

                    edge_geometry = ET.SubElement(
                        edge_cell, "mxGeometry", relative="1", as_="geometry"
                    )
                    cell_id += 1

            # 階ごとのXMLファイルとして保存
            filename = f"{base_filename}_floor_{floor}.drawio"
            tree = ET.ElementTree(mxfile)
            tree.write(filename, encoding="UTF-8", xml_declaration=True)

    def update_classroom_data(self, classroom_id, data):
        """教室ノードのデータを更新する"""
        if classroom_id in self.G.nodes():
            if self.G.nodes[classroom_id]["node_type"] == "classroom":
                self.G.nodes[classroom_id]["data"] = data
                return True
        return False

    def load_from_svg(self, svg_file):
        """SVGファイルからノードとエッジを読み込む"""
        tree = ET.parse(svg_file)
        root = tree.getroot()

        # SVGの名前空間を取得
        namespaces = {"svg": "http://www.w3.org/2000/svg"}

        # ノードの情報を保存する辞書
        nodes_info = {}

        # まずノードを探索（rect, path要素）
        for element in root.findall(".//svg:rect", namespaces) + root.findall(
            ".//svg:path", namespaces
        ):
            element_id = element.get("id", "")
            if not element_id:
                continue

            # IDからノードタイプを判定
            node_type = None
            if "classroom" in element_id:
                node_type = "classroom"
            elif "mens_room" in element_id:
                node_type = "mens_room"
            elif "womens_room" in element_id:
                node_type = "womens_room"
            elif "stairs_both_right" in element_id:
                node_type = "stairs_both_right"
            elif "stairs_both_left" in element_id:
                node_type = "stairs_both_left"
            elif "stairs_both" in element_id:
                node_type = "stairs_both"

            if node_type:
                # 要素の位置を取得
                if element.tag.endswith("rect"):
                    x = float(element.get("x", 0))
                    y = float(element.get("y", 0))
                    width = float(element.get("width", 0))
                    height = float(element.get("height", 0))
                    # 中心座標を計算
                    x = x + width / 2
                    y = y + height / 2
                else:  # path
                    # pathの場合は最初の座標を使用
                    d = element.get("d", "")
                    coords = re.findall(r"[ML]\s*([\d.]+)\s*[, ]\s*([\d.]+)", d)
                    if coords:
                        x = float(coords[0][0])
                        y = float(coords[0][1])

                # ノードを追加
                node_id = element_id
                floor = 10  # この例では10階固定
                self.add_node(node_id, (x, y), node_type, floor=floor)
                nodes_info[node_id] = (x, y)

        # 廊下（エッジ）を探索
        corridor = root.find('.//svg:path[@id="corridor"]', namespaces)
        if corridor is not None:
            d = corridor.get("d", "")
            # M x,y L x,y の形式のパスを解析
            points = re.findall(r"[ML]\s*([\d.]+)\s*[, ]\s*([\d.]+)", d)
            if points:
                # 各点の近くにあるノードを探して接続
                for i in range(len(points) - 1):
                    x1, y1 = float(points[i][0]), float(points[i][1])
                    x2, y2 = float(points[i + 1][0]), float(points[i + 1][1])

                    # 近くのノードを探す
                    node1 = self._find_nearest_node(x1, y1, nodes_info)
                    node2 = self._find_nearest_node(x2, y2, nodes_info)

                    if node1 and node2 and node1 != node2:
                        self.add_corridor(node1, node2)

    def _find_nearest_node(self, x, y, nodes_info, max_distance=50):
        """指定された座標に最も近いノードを見つける"""
        nearest_node = None
        min_distance = float("inf")

        for node_id, (node_x, node_y) in nodes_info.items():
            distance = ((x - node_x) ** 2 + (y - node_y) ** 2) ** 0.5
            if distance < min_distance and distance < max_distance:
                min_distance = distance
                nearest_node = node_id

        return nearest_node

    def _connect_vertical_transitions(self):
        """階段とエレベーターの上下接続を処理"""
        nodes = list(self.G.nodes(data=True))
        for i, (node1, data1) in enumerate(nodes):
            for node2, data2 in nodes[i + 1 :]:
                # 同じタイプで異なる階のノードを接続
                if (
                    data1["node_type"] == data2["node_type"]
                    and data1["floor"] != data2["floor"]
                    and abs(data1["floor"] - data2["floor"]) == 1
                ):

                    if data1["node_type"].startswith(("stairs_", "elevator_")):
                        self.add_corridor(node1, node2)

    def add_corridor(self, node1, node2, distance=1):
        """廊下（エッジ）を追加する"""
        self.G.add_edge(node1, node2, weight=distance, edge_type="corridor")

    def connect_floor_transitions(self, up_node, down_node, floor_num):
        """階段やエレベーターの上下接続を追加"""
        if (
            self.G.nodes[up_node]["floor"] == floor_num
            and self.G.nodes[down_node]["floor"] == floor_num + 1
        ):
            self.G.add_edge(
                up_node, down_node, weight=1, edge_type="vertical_transition"
            )

    def _estimate_floor_from_y(self, y):
        """Y座標から階数を推定する"""
        # SVGの座標系に応じて調整が必要
        floor_height = 200  # 例: 200ピクセルごとに1階と仮定
        return max(1, int((1000 - y) / floor_height))

    def add_stair_connection(self, stair_node1, stair_node2):
        """階段ノード同士を接続する"""
        if stair_node1 in self.G.nodes() and stair_node2 in self.G.nodes():
            node1_type = self.G.nodes[stair_node1]["node_type"]
            node2_type = self.G.nodes[stair_node2]["node_type"]

            # 階段ノードの有効な組み合わせ
            valid_combinations = [
                ("stairs_up", "stairs_down"),  # 上り階段と下り階段
                ("stairs_both", "stairs_both"),  # 両方向階段同士
                ("stairs_both_left", "stairs_both_right"),  # 左右の両方向階段
                ("stairs_both_right", "stairs_both_left"),  # 右左の両方向階段
            ]

            if (node1_type, node2_type) in valid_combinations:
                # 階段ノード同士を廊下として接続
                self.add_corridor(stair_node1, stair_node2)
                return True
        return False

    def visualize_path(self, path, output_file):
        """経路を視覚化してSVGファイルとして保存"""
        dot = graphviz.Digraph(comment="Route Visualization")
        dot.attr(bgcolor="transparent")

        # パスに含まれるノードを強調表示
        for node in self.G.nodes():
            node_type = self.G.nodes[node]["node_type"]
            floor = self.G.nodes[node]["floor"]

            # ノードの色とスタイルを設定
            if node in path:
                # パスに含まれるノードは強調表示
                color = self.node_types[node_type]["color"]
                style = "filled,bold"
            else:
                # その他のノードは薄く表示
                color = "#DDDDDD"
                style = "filled"

            dot.node(str(node), f"{node}\n({floor}階)", color=color, style=style)

        # エッジを追加
        for i in range(len(path) - 1):
            # パスに含まれるエッジは赤く太く表示
            dot.edge(str(path[i]), str(path[i + 1]), color="#FF0000", penwidth="2.0")

        # その他のエッジは薄く表示
        for edge in self.G.edges():
            if edge[0] not in path or edge[1] not in path:
                dot.edge(str(edge[0]), str(edge[1]), color="#DDDDDD", penwidth="1.0")

        # SVGファイルとして保存
        dot.render(output_file, format="svg", cleanup=True)

    def _is_similar_color(self, color1, color2, tolerance=20):
        """2つの色が近似しているかチェック"""

        def hex_to_rgb(color):
            color = color.lstrip("#")
            return tuple(int(color[i : i + 2], 16) for i in (0, 2, 4))

        rgb1 = hex_to_rgb(color1)
        rgb2 = hex_to_rgb(color2)

        return all(abs(c1 - c2) <= tolerance for c1, c2 in zip(rgb1, rgb2))

    def get_corridor_points(self):
        """廊下のパス上の点を取得"""
        points = []
        step = 5  # 点の間隔（ピクセル）

        # corridorのパスからポイントを生成
        for edge in self.G.edges():
            start = self.G.nodes[edge[0]]["coords"]
            end = self.G.nodes[edge[1]]["coords"]

            # 2点間の距離と点の配置
            dx = end[0] - start[0]
            dy = end[1] - start[1]
            steps = int((dx * dx + dy * dy) ** 0.5 / step)
            for i in range(steps + 1):
                t = i / steps
                x = start[0] + dx * t
                y = start[1] + dy * t
                points.append((x, y))

        return points

    def load_floor_from_shapefile(self, shp_path, floor_number, y_offset=0):
        """各階のシェープファイルを読み込む"""
        try:
            # シェープファイルを読み込む
            sf = shapefile.Reader(shp_path, encoding="cp932")
            shapes = sf.shapes()
            records = sf.records()
            fields = sf.fields[1:]  # 最初のフィールド（DeletionFlag）を除外

            # フィールド名のリストを作成
            field_names = [field[0] for field in fields]

            # 各シェープを処理
            for i, (shape, record) in enumerate(zip(shapes, records)):
                # レコードを辞書に変換
                attributes = dict(zip(field_names, record))

                if shape.shapeType == 1:  # Point
                    # ポイントの場合、ノードとして追加
                    x, y = shape.points[0]
                    # Y座標に階数オフセットを適用
                    y = y + (y_offset * floor_number)
                    node_id = f"floor_{floor_number}_node_{i}"

                    # ノードタイプの判定（属性から判定）
                    node_type = self._determine_node_type(attributes)

                    self.add_node(
                        node_id,
                        coords=(x, y),
                        node_type=node_type,
                        floor=floor_number,
                        **attributes,
                    )

                elif shape.shapeType == 3:  # LineString
                    # ラインの場合、始点と終点をノードとして追加し、エッジを作成
                    points = shape.points
                    if len(points) >= 2:
                        start_x, start_y = points[0]
                        end_x, end_y = points[-1]
                        # Y座標に階数オフセットを適用
                        start_y += y_offset * floor_number
                        end_y += y_offset * floor_number

                        start_id = f"floor_{floor_number}_start_{i}"
                        end_id = f"floor_{floor_number}_end_{i}"

                        self.add_node(
                            start_id, coords=(start_x, start_y), floor=floor_number
                        )
                        self.add_node(end_id, coords=(end_x, end_y), floor=floor_number)
                        self.add_edge(start_id, end_id, **attributes)

        except Exception as e:
            print(f"シェープファイル読み込みエラー: {str(e)}")

    def _determine_node_type(self, attributes):
        """属性からノードタイプを判定"""
        if "type" in attributes:
            type_value = attributes["type"].lower()
            if "stair" in type_value:
                if "up" in type_value:
                    return "stairs_up"
                elif "down" in type_value:
                    return "stairs_down"
                elif "left" in type_value:
                    return "stairs_both_left"
                elif "right" in type_value:
                    return "stairs_both_right"
                else:
                    return "stairs_both"
            elif "elevator" in type_value:
                if "red" in type_value:
                    return "elevator_red"
                elif "blue" in type_value:
                    return "elevator_blue"
                else:
                    return "elevator_green"
            elif "classroom" in type_value:
                return "classroom"
            elif "mens" in type_value:
                return "mens_room"
            elif "womens" in type_value:
                return "womens_room"

        # デフォルトは教室として扱う
        return "classroom"

    def connect_stairs_between_floors(self, stair_nodes_by_floor):
        """階段ノードで階層間を接続"""
        floors = sorted(stair_nodes_by_floor.keys())
        for i in range(len(floors) - 1):
            current_floor = floors[i]
            next_floor = floors[i + 1]

            # 現在の階と次の階の階段ノードを接続
            for current_stair in stair_nodes_by_floor[current_floor]:
                for next_stair in stair_nodes_by_floor[next_floor]:
                    # x座標が近い階段同士を接続
                    if self._are_stairs_aligned(current_stair, next_stair):
                        self.add_edge(
                            current_stair, next_stair, edge_type="vertical_transition"
                        )

    def _are_stairs_aligned(self, stair1, stair2, max_distance=5.0):
        """2つの階段ノードが垂直に整列しているかチェック（X座標のみ）"""
        coords1 = self.G.nodes[stair1]["coords"]
        coords2 = self.G.nodes[stair2]["coords"]

        # x座標の差のみをチェック
        dx = abs(coords1[0] - coords2[0])
        return dx < max_distance

    def connect_vertical_transitions_between_floors(self, floor_nodes_by_floor):
        """階段とエレベーターで階層間を接続"""
        floors = sorted(floor_nodes_by_floor.keys())
        for i in range(len(floors) - 1):
            current_floor = floors[i]
            next_floor = floors[i + 1]

            # 現在の階と次の階の階段・エレベーターノードを接続
            for current_node in floor_nodes_by_floor[current_floor]:
                current_type = self.G.nodes[current_node]["node_type"]

                for next_node in floor_nodes_by_floor[next_floor]:
                    next_type = self.G.nodes[next_node]["node_type"]

                    # 同じタイプの垂直移動ノード同士を接続
                    if self._can_connect_vertically(current_node, next_node):
                        if self._are_vertically_aligned(current_node, next_node):
                            self.add_edge(
                                current_node, next_node, edge_type="vertical_transition"
                            )

    def _can_connect_vertically(self, current_node, next_node):
        """2つのノードが垂直接続可能かチェック"""
        current_type = self.G.nodes[current_node]["node_type"]
        next_type = self.G.nodes[next_node]["node_type"]
        current_floor = self.G.nodes[current_node]["floor"]
        next_floor = self.G.nodes[next_node]["floor"]

        # 階段の場合は隣接階のみ接続
        if current_type.startswith("stairs") and next_type.startswith("stairs"):
            return abs(current_floor - next_floor) == 1

        # エレベーターの場合は停止階のチェック
        for elevator_type, stops in self.elevator_stops.items():
            if current_type == elevator_type and next_type == elevator_type:
                return current_floor in stops and next_floor in stops

        return False

    def _are_vertically_aligned(self, node1, node2, max_distance=5.0):
        """2つのノードが垂直に整列しているかチェック"""
        coords1 = self.G.nodes[node1]["coords"]
        coords2 = self.G.nodes[node2]["coords"]

        # x座標の差のみをチェック（y座標は階層で異なるため）
        dx = abs(coords1[0] - coords2[0])
        return dx < max_distance

    def connect_shapefiles(self, shapefiles):
        """複数のシェープファイルを連携させる"""
        # 各シェープファイルのノードを保持
        nodes_by_file = {}

        # 各シェープファイルを読み込む
        for floor_num, shp_path in enumerate(shapefiles, start=1):
            try:
                # シェープファイルを読み込む
                sf = shapefile.Reader(shp_path, encoding="cp932")
                shapes = sf.shapes()
                records = sf.records()
                fields = sf.fields[1:]
                field_names = [field[0] for field in fields]

                file_nodes = []
                # 各シェープを処理
                for i, (shape, record) in enumerate(zip(shapes, records)):
                    attributes = dict(zip(field_names, record))

                    if shape.shapeType == 1:  # Point
                        x, y = shape.points[0]
                        node_id = f"floor_{floor_num}_node_{i}"
                        node_type = self._determine_node_type(attributes)

                        # 階層オフセットを適用
                        y_with_offset = y + (1000 * floor_num)  # 1000は階層間の距離

                        self.add_node(
                            node_id,
                            coords=(x, y_with_offset),
                            node_type=node_type,
                            floor=floor_num,
                            original_coords=(x, y),  # 元の座標も保存
                            **attributes,
                        )
                        file_nodes.append(node_id)

                nodes_by_file[floor_num] = file_nodes

            except Exception as e:
                print(f"シェープファイル読み込みエラー ({shp_path}): {str(e)}")

        # 階層間の接続を処理
        self._connect_floors(nodes_by_file)

    def _connect_floors(self, nodes_by_file):
        """階層間のノードを接続"""
        floors = sorted(nodes_by_file.keys())

        # 全ての階の組み合わせで接続をチェック
        for i, floor1 in enumerate(floors):
            for floor2 in floors[i + 1 :]:  # floor1より上の階
                for node1 in nodes_by_file[floor1]:
                    for node2 in nodes_by_file[floor2]:
                        # 座標が近く、接続可能な場合のみ接続
                        if self._are_vertically_aligned(
                            node1, node2
                        ) and self._can_connect_vertically(node1, node2):
                            self.add_edge(node1, node2)
