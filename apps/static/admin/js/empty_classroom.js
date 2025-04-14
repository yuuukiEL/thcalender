document.addEventListener('DOMContentLoaded', function() {
    const table = document.querySelector('table');
    let isSelecting = false;
    let startCell = null;
    let hasUnsavedChanges = false;
    let isUpdating = false;
    let isDragging = false;

    // セルの更新を処理する関数
    async function updateCell(cell, isSelected) {
        if (isUpdating) {
            console.log('Update in progress, skipping...');
            return false;
        }
        
        const roomNumber = cell.parentElement.cells[0].textContent.trim();
        const dateIndex = Math.floor((cell.cellIndex - 1) / 7);
        const dateCell = table.querySelector('thead tr:first-child').cells[dateIndex + 1];
        const periodIndex = (cell.cellIndex - 1) % 7;
        const periods = ['1限', '2限', '3限', '4限', '5限', '6限', '夜間'];
        const period = periods[periodIndex];

        const requestData = {
            room: roomNumber,
            date: dateCell.textContent,
            period: period,
            is_empty: isSelected
        };

        console.log('Sending request with data:', requestData);

        try {
            isUpdating = true;
            const response = await fetch('/classroom/register/api/update-empty-classroom', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });

            console.log('Response status:', response.status);
            const responseText = await response.text();
            console.log('Response text:', responseText);

            if (!response.ok) {
                try {
                    const errorJson = JSON.parse(responseText);
                    throw new Error(errorJson.error || 'Network response was not ok');
                } catch (e) {
                    throw new Error('Network response was not ok: ' + responseText);
                }
            }

            try {
                const data = JSON.parse(responseText);
                console.log('Parsed response data:', data);

                if (data.success) {
                    return true;
                } else {
                    throw new Error(data.error || 'Update failed');
                }
            } catch (e) {
                throw new Error('Failed to parse response: ' + responseText);
            }
        } catch (error) {
            console.error('Error updating cell:', error);
            return false;
        } finally {
            isUpdating = false;
        }
    }

    // セルの範囲選択を処理する関数
    function selectCellRange(start, end) {
        const startRow = start.parentElement.rowIndex;
        const startCol = start.cellIndex;
        const endRow = end.parentElement.rowIndex;
        const endCol = end.cellIndex;

        const minRow = Math.min(startRow, endRow);
        const maxRow = Math.max(startRow, endRow);
        const minCol = Math.min(startCol, endCol);
        const maxCol = Math.max(startCol, endCol);

        // 前回の選択をクリア
        table.querySelectorAll('td.selecting').forEach(cell => {
            cell.classList.remove('selecting');
        });

        const selectedCells = [];
        for (let i = minRow; i <= maxRow; i++) {
            for (let j = minCol; j <= maxCol; j++) {
                const cell = table.rows[i].cells[j];
                if (cell && !cell.classList.contains('room-number')) {
                    cell.classList.add('selecting');
                    selectedCells.push(cell);
                }
            }
        }
        return selectedCells;
    }

    // マウスダウンイベント
    table.addEventListener('mousedown', function(e) {
        const cell = e.target;
        if (cell.tagName === 'TD' && !cell.classList.contains('room-number')) {
            isSelecting = true;
            startCell = cell;
            isDragging = false;
            e.preventDefault();
        }
    });

    // マウスムーブイベント
    table.addEventListener('mousemove', function(e) {
        if (isSelecting && startCell) {
            isDragging = true;
            const currentCell = e.target;
            if (currentCell.tagName === 'TD') {
                selectCellRange(startCell, currentCell);
            }
        }
    });

    // マウスアップイベント
    document.addEventListener('mouseup', async function(e) {
        if (!isSelecting || !startCell) return;

        if (isDragging) {
            const selectedCells = Array.from(table.querySelectorAll('td.selecting'));
            if (selectedCells.length > 0) {
                const isSelected = !startCell.classList.contains('selected');
                const uniqueCells = [...new Set(selectedCells)];

                // 即座に視覚的な選択状態を更新
                uniqueCells.forEach(cell => {
                    cell.classList.remove('selecting');
                    cell.classList.toggle('selected', isSelected);
                });

                // データベースの更新
                try {
                    const updateResults = [];
                    for (const cell of uniqueCells) {
                        const result = await updateCell(cell, isSelected);
                        updateResults.push(result);
                    }
                    
                    const failedUpdates = updateResults.filter(result => !result).length;
                    if (failedUpdates > 0) {
                        throw new Error(`${failedUpdates} updates failed`);
                    }
                    
                    hasUnsavedChanges = true;
                } catch (error) {
                    console.error('Error during batch update:', error);
                    alert('更新中にエラーが発生しました: ' + error.message);
                }
            }
        } else {
            const cell = e.target;
            if (cell.tagName === 'TD' && !cell.classList.contains('room-number')) {
                const isSelected = !cell.classList.contains('selected');
                
                // 即座に視覚的な選択状態を更新
                cell.classList.toggle('selected', isSelected);
                
                try {
                    const success = await updateCell(cell, isSelected);
                    if (!success) {
                        cell.classList.toggle('selected', !isSelected);
                        throw new Error('Failed to update cell');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    alert('更新に失敗しました');
                }
            }
        }

        // 状態をリセット
        isSelecting = false;
        startCell = null;
        isDragging = false;
        table.querySelectorAll('td.selecting').forEach(cell => {
            cell.classList.remove('selecting');
        });
    });

    // マウスリーブイベント（テーブルから出た時）
    table.addEventListener('mouseleave', function() {
        if (isSelecting) {
            table.querySelectorAll('td.selecting').forEach(cell => {
                cell.classList.remove('selecting');
            });
        }
    });

    // 初期表示時に空き教室を反映
    if (typeof emptyRooms !== 'undefined' && emptyRooms.length > 0) {
        console.log('Empty Rooms Data:', emptyRooms);  // デバッグ用

        emptyRooms.forEach(room => {
            console.log(`Processing room: ${room.classroom_id}, Date: ${room.formatted_date}, Period: ${room.period}`); // デバッグ用

            const roomRow = Array.from(table.rows).find(row => 
                row.cells[0].textContent.trim() === String(room.classroom_id)
            );
            
            if (roomRow) {
                const dateHeaders = Array.from(table.rows[0].cells);
                const dateIndex = dateHeaders.findIndex(cell => 
                    cell.textContent.trim() === room.formatted_date
                );
                
                console.log(`Date Index: ${dateIndex}`); // デバッグ用

                if (dateIndex > 0) {
                    const periodIndex = room.period_index;
                    const cellIndex = ((dateIndex - 1) * 7) + periodIndex;
                    
                    if (cellIndex > 0 && cellIndex < roomRow.cells.length) {
                        roomRow.cells[cellIndex].classList.add('selected'); // オレンジ色にする
                    }
                }
            }
        });
    }

    // 登録ボタンのクリックイベント
    const registerButton = document.getElementById('register-button');
    if (registerButton) {
        registerButton.addEventListener('click', async function() {
            try {
                await fetch('/classroom/register/api/commit-empty-classroom', {
                    method: 'POST'
                });
                hasUnsavedChanges = false;
                alert('空き教室の登録が完了しました');
            } catch (error) {
                console.error('Error:', error);
                alert('登録に失敗しました');
            }
        });
    }

    // 戻るリンクのクリックイベント
    document.querySelector('.back-link a').addEventListener('click', function(e) {
        if (hasUnsavedChanges) {
            const confirmed = confirm('変更が保存されていません。保存せずに戻りますか？');
            if (!confirmed) {
                e.preventDefault();
            }
        }
    });

    // 追加ボタンのイベントリスナー
    document.getElementById('addEmptyRooms').addEventListener('click', function() {
        const unselectedCells = Array.from(table.querySelectorAll('td:not(.room-number):not(.selected)'));
        if (unselectedCells.length === 0) {
            alert('すべてのセルが既に選択されています');
            return;
        }

        if (confirm('選択されていないすべてのセルを空き教室として登録しますか？')) {
            unselectedCells.forEach(async (cell) => {
                try {
                    await updateCell(cell, true);
                    cell.classList.add('selected');
                } catch (error) {
                    console.error('Error updating cell:', error);
                }
            });
        }
    });

    // 削除ボタンのイベントリスナー
    document.getElementById('removeEmptyRooms').addEventListener('click', function() {
        const selectedCells = Array.from(table.querySelectorAll('td.selected'));
        if (selectedCells.length === 0) {
            alert('選択されているセルがありません');
            return;
        }

        if (confirm('選択されているすべてのセルの登録を解除しますか？')) {
            selectedCells.forEach(async (cell) => {
                try {
                    await updateCell(cell, false);
                    cell.classList.remove('selected');
                } catch (error) {
                    console.error('Error updating cell:', error);
                }
            });
        }
    });

    // セルクリックイベントの処理
    function handleCellClick(cell) {
        // 共通スケジュールセルの場合は何もしない
        if (cell.classList.contains('common-schedule-cell')) {
            return;
        }

        // ... 既存のクリック処理コード ...
    }

    // セルにクリックイベントを追加
    document.querySelectorAll('td:not(.room-number)').forEach(cell => {
        cell.addEventListener('click', () => handleCellClick(cell));
    });
});