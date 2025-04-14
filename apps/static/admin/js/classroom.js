let classrooms = [];

function setClassrooms(data) {
    classrooms = data;
    updateClassroomList();
}

function createYMark() {
    const yMark = document.createElementNS("http://www.w3.org/2000/svg", "g");
    // scaleを2.0から1.6に縮小
    yMark.setAttribute("transform", "translate(0, -30) scale(1.6) rotate(0)");

    // 左上の長方形（左下に傾斜）
    // M-45 -55: 左上の開始点が今は左下に
    // L-25 -55: 右上が今は右下に
    // L-15 -20: 右下が今は右上に
    // L-35 -20: 左下が今は左上に
    const leftRect = document.createElementNS("http://www.w3.org/2000/svg", "path");
    leftRect.setAttribute("d", "M-45 55 L-25 55 L-15 20 L-35 20 Z");

    // 中央の長方形（内側に回転）
    const middleRect = document.createElementNS("http://www.w3.org/2000/svg", "path");
    middleRect.setAttribute("d", "M-15 20 L15 20 L15 28 L-15 28 Z");

    // 右上の長方形（右下に傾斜）
    const rightRect = document.createElementNS("http://www.w3.org/2000/svg", "path");
    rightRect.setAttribute("d", "M15 20 L35 20 L45 55 L25 55 Z");

    // 下部の四角形（□）
    const bottomSquare = document.createElementNS("http://www.w3.org/2000/svg", "path");
    bottomSquare.setAttribute("d", "M-15 0 L15 0 L15 -43 L-15 -43 Z");

    // 共通のスタイル設定
    [leftRect, middleRect, rightRect, bottomSquare].forEach(element => {
        element.setAttribute("stroke", "#333");
        element.setAttribute("stroke-width", "2");
        element.setAttribute("fill", "#FFFFFF");
        element.setAttribute("stroke-linejoin", "round");
    });

    // 描画順序: 下から上へ
    yMark.appendChild(bottomSquare);  // 最下層
    yMark.appendChild(leftRect);      // 左上の長方形
    yMark.appendChild(middleRect);    // 中央の長方形
    yMark.appendChild(rightRect);     // 右上の長方形
    return yMark;
}

function updateClassroomList() {
    const floor = document.getElementById('floorSelect').value;
    const displayGroup = document.getElementById('classroomDisplay');
    displayGroup.innerHTML = '';

    // アトリウムと三角形のパスは残すが、透明に
    const trianglePath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    trianglePath.setAttribute("d", "M0 -150 A150 150 0 0 1 129.9 75 L0 0 L-129.9 75 A150 150 0 0 1 0 -150");
    trianglePath.setAttribute("fill", "none");  // 塗りを無しに
    trianglePath.setAttribute("stroke", "none"); // 線も無しに
    displayGroup.appendChild(trianglePath);

    // Y字マークを追加
    const yMark = createYMark();
    displayGroup.appendChild(yMark);

    // 選択された階の教室を表示
    const floorClassrooms = classrooms.filter(c => c.floor == floor);
    
    // 教室を3つのグループに分割
    const maxClassroomsPerEdge = 3;
    const groups = [
        floorClassrooms.slice(0, maxClassroomsPerEdge),
        floorClassrooms.slice(maxClassroomsPerEdge, maxClassroomsPerEdge * 2),
        floorClassrooms.slice(maxClassroomsPerEdge * 2, maxClassroomsPerEdge * 3)
    ];

    // 各辺に教室を配置
    groups.forEach((classroomsForEdge, edgeIndex) => {
        if (classroomsForEdge.length === 0) return;

        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        
        // 各辺の回転角度と位置調整を設定
        let transform = '';
        let fillColor = '';
        switch(edgeIndex) {
            case 0: // 上辺（71,72,73）- 赤色
                transform = `rotate(0) translate(-20, 10)`;
                fillColor = '#ffcccc';  // 薄い赤
                break;
            case 1: // 右下辺（74,75,76）- 緑色
                transform = `rotate(120) translate(-20, 10)`;
                fillColor = '#ccffcc';  // 薄い緑
                break;
            case 2: // 左下辺（77,78,79）- 青色
                transform = `rotate(240) translate(-20, 10)`;
                fillColor = '#cce5ff';  // 薄い青
                break;
        }
        g.setAttribute("transform", transform);

        classroomsForEdge.forEach((classroom, index) => {
            const classroomG = document.createElementNS("http://www.w3.org/2000/svg", "g");
            classroomG.setAttribute("transform", "rotate(-90)");
            
            // グループ全体をクリック可能に
            classroomG.setAttribute("class", "classroom-group");
            classroomG.onclick = () => selectClassroom(classroom.classroom_id, classroom);
            
            // マウスイベントの追加
            let currentTooltip = null;
            classroomG.addEventListener('mouseover', (e) => {
                currentTooltip = showTooltip(e, classroom);
                classroomG.classList.add('hover');
            });
            classroomG.addEventListener('mousemove', (e) => {
                if (currentTooltip) {
                    currentTooltip.style.left = `${e.pageX - currentTooltip.offsetWidth - 10}px`;
                    currentTooltip.style.top = `${e.pageY + 10}px`;
                }
            });
            classroomG.addEventListener('mouseout', () => {
                if (currentTooltip) {
                    currentTooltip.remove();
                    currentTooltip = null;
                }
                classroomG.classList.remove('hover');
            });

            // 教室ボックス
            const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            rect.setAttribute("x", "-145");
            rect.setAttribute("y", `${-50 + (index * 50)}`);
            rect.setAttribute("width", "40");
            rect.setAttribute("height", "45");
            rect.setAttribute("class", "classroom-box");
            rect.setAttribute("rx", "4");
            rect.setAttribute("style", `fill: ${fillColor}; stroke: #333; stroke-width: 1px;`);  // styleで直接指定

            // 教室番号テキスト
            const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.setAttribute("x", "-125");
            text.setAttribute("y", `${-27.5 + (index * 50)}`);
            text.setAttribute("class", "classroom-text");
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("dominant-baseline", "middle");
            text.setAttribute("style", "fill: #333;");  // テキストの色も指定
            text.textContent = classroom.classroom_id;

            classroomG.appendChild(rect);
            classroomG.appendChild(text);
            g.appendChild(classroomG);
        });

        displayGroup.appendChild(g);
    });
}

function showTooltip(event, classroom) {
    const tooltip = document.createElement('div');
    tooltip.className = 'classroom-tooltip';
    
    const content = document.createElement('div');
    content.className = 'classroom-tooltip-content';
    
    const rows = [
        { label: '教室番号', value: classroom.classroom_id },
        { label: '階数', value: `${classroom.floor}階` },
        { label: '教室種類', value: getJapaneseRoomType(classroom.classroom_type) },
        { label: '座席数', value: classroom.seating_capacity ? `${classroom.seating_capacity}席` : '未設定' }
    ];
    
    rows.forEach(row => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'classroom-tooltip-row';
        rowDiv.innerHTML = `
            <span class="classroom-tooltip-label">${row.label}:</span>
            <span>${row.value}</span>
        `;
        content.appendChild(rowDiv);
    });
    
    tooltip.appendChild(content);
    document.body.appendChild(tooltip);
    
    tooltip.style.left = `${event.pageX - tooltip.offsetWidth - 10}px`;
    tooltip.style.top = `${event.pageY + 10}px`;
    
    return tooltip;
}

function selectClassroom(classroomId, classroom) {
    document.getElementById('classroom_number').value = classroomId;
    document.getElementById('floor').value = classroom.floor;
    document.getElementById('classroom_type').value = classroom.classroom_type;
    
    // 座席数がある場合のみ設定
    if (classroom.seating_capacity) {
        document.getElementById('seating_capacity').value = classroom.seating_capacity;
    } else {
        document.getElementById('seating_capacity').value = ''; // 未設定の場合は空に
    }
    
    // 選択状態の更新
    const groups = document.querySelectorAll('.classroom-group');
    groups.forEach(group => group.classList.remove('selected'));
    event.currentTarget.classList.add('selected');
}

function openModal() {
    var modal = document.getElementById("classroomModal");
    modal.style.display = "block";
}

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById("selectClassroomButton").onclick = function() {
        var select = document.getElementById("classroomSelect");
        var classroomNumber = select.value.split(" - ")[0];
        document.getElementById("classroom_number").value = classroomNumber;
        document.getElementById("classroomModal").style.display = "none";
    };

    document.querySelector(".close").onclick = function() {
        document.getElementById("classroomModal").style.display = "none";
    };

    if (classrooms && classrooms.length > 0) {
        updateClassroomList();
    }
});

// 教室種類の日本語変換関数
function getJapaneseRoomType(type) {
    const types = {
        'game_studio_nintendo': 'ゲームスタジオ（Nintendo Switch）',
        'game_studio_others': 'ゲームスタジオ（Xbox、PlayStation）',
        'digital_animation': 'デジタルアニメーションスタジオ',
        'motion_capture': 'モーションキャプチャースタジオ',
        'visual_design': 'ビジュアルデザインスタジオ',
        'recording': 'レコーディングスタジオ',
        'digital_music': 'デジタルミュージックスタジオ',
        'server_room': 'サーバルーム',
        'drawing': 'デッサンスタジオ',
        'lecture': '講義教室',
        'car_design': 'カーデザインスタジオ',
        '3d_printer': '3Dプリンター'
    };
    return types[type] || type;
} 