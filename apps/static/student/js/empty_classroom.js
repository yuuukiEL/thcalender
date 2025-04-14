document.addEventListener('DOMContentLoaded', function() {
    const table = document.querySelector('table');

    // 現在の日付を取得
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 初期表示時に空き教室を反映
    if (typeof emptyRooms !== 'undefined' && emptyRooms.length > 0) {
        emptyRooms.forEach(room => {
            // 教室の行を探す
            const roomRow = Array.from(table.querySelectorAll('tr')).find(row => 
                row.cells[0].textContent.trim() === room.classroom_id
            );
            
            if (roomRow) {
                // 日付のヘッダーを探す
                const dateHeaders = document.querySelectorAll('.date-header th');
                let dateIndex = -1;
                
                // MM/DD形式で比較
                const roomDate = room.formatted_date.substring(5).replace(/-/, '/');
                
                dateHeaders.forEach((header, index) => {
                    if (header.textContent.trim() === roomDate) {
                        dateIndex = index;
                    }
                });

                if (dateIndex > 0) {
                    // 時限のインデックスを取得（1限=0, 2限=1, ...）
                    const periods = ['1限', '2限', '3限', '4限', '5限', '6限', '夜間'];
                    const periodIndex = periods.indexOf(room.period);
                    
                    // セルのインデックスを計算
                    const cellIndex = ((dateIndex - 1) * 7) + periodIndex + 1;
                    
                    if (cellIndex > 0 && cellIndex < roomRow.cells.length) {
                        roomRow.cells[cellIndex].classList.add('empty-room');
                    }
                }
            }
        });
    }

    // スクロール処理
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const date = String(today.getDate()).padStart(2, '0');
    const formattedToday = `${month}/${date}`;

    const dateHeaders = document.querySelectorAll('.date-header th');
    let todayColumn = -1;

    dateHeaders.forEach((header, index) => {
        if (header.textContent.includes(formattedToday)) {
            todayColumn = index;
        }
    });

    if (todayColumn > 0) {
        const tableContainer = document.querySelector('.table-container');
        const columnWidth = 80;
        const scrollPosition = (todayColumn - 1) * columnWidth * 7;
        const containerWidth = tableContainer.offsetWidth;
        tableContainer.scrollLeft = Math.max(0, scrollPosition - (containerWidth / 2) + (columnWidth * 7 / 2));
    }
});