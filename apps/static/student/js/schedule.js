// 従来の方法（個別リクエスト）
function loadScheduleCell(day, period) {
    fetch(`/student/api/schedule/cell?day=${day}&period=${period}`)
        .then(response => response.json())
        .then(data => {
            // セルを更新
        });
}

// 新しい方法（一括リクエスト）
function loadScheduleMatrix() {
    fetch('/student/api/schedule/matrix')
        .then(response => response.json())
        .then(data => {
            const matrix = data.matrix;
            const days = data.days;
            
            // 全セルを一度に更新
            days.forEach((day, dayIdx) => {
                for (let period = 1; period <= 7; period++) {
                    const cellData = matrix[dayIdx][period-1];
                    updateCell(day, period, cellData);
                }
            });
        });
}

// ページ読み込み時に一度だけ呼び出す
document.addEventListener('DOMContentLoaded', function() {
    loadScheduleMatrix();
});

function updateCell(day, period, data) {
    const cellId = `schedule-${day}-${period}`;
    const cell = document.getElementById(cellId);
    
    if (!cell) return;
    
    if (data) {
        // データがある場合のセル更新処理
        cell.innerHTML = `
            <div class="subject">${data.subject_name}</div>
            <div class="teacher">${data.teacher.name || ''}</div>
            <div class="room">${data.classroom.classroom_id || ''}</div>
        `;
        cell.classList.add('has-class');
    } else {
        // データがない場合は空セル
        cell.innerHTML = '';
        cell.classList.remove('has-class');
    }
} 