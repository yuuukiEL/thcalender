// グローバルにカレンダーインスタンスを定義
let calendar;

document.addEventListener('DOMContentLoaded', function() {
    const calendarEl = document.getElementById('calendar');
    
    let clickTimer = null;

    // calendarをグローバル変数に代入
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'timeGridWeek',
        locale: 'ja',
        timeZone: 'Asia/Tokyo',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'timeGridDay,timeGridWeek,dayGridMonth,listWeek'
        },
        buttonText: {
            today: '今日',
            month: '月',
            week: '週',
            day: '日',
            list: 'リスト'
        },
        height: 'auto',
        allDaySlot: false,
        
        // 時間表示の設定を修正
        slotMinTime: '00:00:00',
        slotMaxTime: '24:00:00',
        scrollTime: '08:00:00',  // スクロール開始位置を朝8時に設定
        nextDayThreshold: '00:00:00', // 翌日の境界を00:00に設定
        
        slotDuration: '00:30:00',  // 30分単位で表示
        slotLabelInterval: '01:00:00',  // 1時間ごとにラベル表示
        
        // 時間ラベル表示
        slotLabelFormat: {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        },
        
        // その他の設定
        expandRows: true,
        stickyHeaderDates: true,
        nowIndicator: true,
        selectable: true,
        selectMirror: false,
        editable: true,
        snapDuration: '00:15:00',      // ドラッグ＆ドロップの単位
        eventStartEditable: true,
        eventDurationEditable: true,
        eventResizableFromStart: true,
        dragRevertDuration: 0,
        dayCount: 7,
        weekNumberCalculation: 'ISO',
        firstDay: 0,  // 週の開始日を日曜日に設定

        // ダブルクリックでイベント追加
        eventClick: function(info) {
            if (info.event.extendedProps?.type !== 'class') {
                showEditEventModal(info.event);
            }
        },
        
        // シングルクリックを無効化し、ダブルクリックのみ有効にする
        dateClick: function(info) {
            if (calendar.view.type === 'dayGridMonth') {
                if (clickTimer === null) {
                    clickTimer = setTimeout(function () {
                        clickTimer = null;
                        calendar.changeView('timeGridDay', info.dateStr);
                    }, 300);
                } else {
                    clearTimeout(clickTimer);
                    clickTimer = null;
                    
                    // 日付文字列から正確な時間を取得
                    const clickedDate = new Date(info.dateStr);
                    console.log('月ビューでクリックした日付:', clickedDate);
                    showCreateEventModal(clickedDate);
                }
            } else if (calendar.view.type === 'timeGridDay' || calendar.view.type === 'timeGridWeek') {
                if (clickTimer === null) {
                    clickTimer = setTimeout(function () {
                        clickTimer = null;
                    }, 300);
                } else {
                    clearTimeout(clickTimer);
                    clickTimer = null;
                    
                    // info.dateはクリックした正確な時間を含む
                    console.log('時間グリッドでクリックした日時:', info.date);
                    showCreateEventModal(info.date);
                }
            }
        },

        // ナビゲーションリンクの設定
        navLinks: true,
        navLinkDayClick: function(date, jsEvent) {
            // 日付リンクをクリックした時は表示変更のみ
            calendar.changeView('timeGridDay', date);
        },

        events: function(info, successCallback, failureCallback) {
            fetch('/student/api/events')
                .then(response => response.json())
                .then(events => {
                    const processedEvents = events.map(event => {
                        // 日時文字列をパース
                        const start = new Date(event.start);
                        const end = new Date(event.end);
                        
                        return {
                            id: event.id,
                            title: event.title,
                            start: start.toISOString(),
                            end: end.toISOString(),
                            location: event.location,
                            description: event.description,
                            backgroundColor: event.type === 'class' ? '#4CAF50' : '#2196F3',
                            borderColor: event.type === 'class' ? '#45a049' : '#1976D2',
                            extendedProps: { type: event.type }
                        };
                    });
                    
                    console.log('処理済みイベント:', processedEvents);
                    successCallback(processedEvents);
                })
                .catch(error => {
                    console.error('イベント取得エラー:', error);
                    failureCallback(error);
                });
        },

        eventDidMount: function(info) {
            // 個人予定のみログ出力
            if (info.event.extendedProps?.type === 'personal') {
                console.log('個人予定がマウントされました:', {
                    ID: info.event.id,
                    タイトル: info.event.title,
                    開始: info.event.start,
                    終了: info.event.end
                });
            }

            // ツールチップの設定
            const tooltipContent = [
                info.event.title,
                info.event.extendedProps?.description,
                info.event.extendedProps?.location
            ].filter(Boolean).join('\n');
            
            if (tooltipContent) {
                info.el.title = tooltipContent;
            }
        },

        // イベントのホバー効果
        eventMouseEnter: function(info) {
            info.el.style.cursor = info.event.extendedProps?.type === 'common' ? 'default' : 'pointer';
        },

        // ドラッグ＆ドロップの設定
        eventDragStart: function(info) {
            if (info.event.extendedProps?.type === 'personal') {
                console.log('ドラッグ開始:', {
                    ID: info.event.id,
                    タイトル: info.event.title,
                    開始時刻: info.event.start
                });
            }
        },
        
        // イベントのドラッグ中
        eventDragMinDistance: 5,  // ドラッグを開始する最小距離
        
        // イベントのドロップ時の処理を修正
        eventDrop: function(info) {
            const event = info.event;
            
            if (event.extendedProps?.type === 'personal') {
                // IDから'personal_'プレフィックスを削除
                const scheduleId = event.id.replace('personal_', '');
                
                // 日本時間として時刻を処理
                const startDate = new Date(event.start);
                const endDate = new Date(event.end);
                
                // JSTでの時刻文字列を作成
                const jstStartDateTime = startDate.toISOString().slice(0, 19);
                const jstEndDateTime = endDate.toISOString().slice(0, 19);

                const eventData = {
                    title: event.title,
                    location: event.extendedProps.location || '',
                    description: event.extendedProps.description || '',
                    start_datetime: jstStartDateTime,
                    end_datetime: jstEndDateTime
                };

                // デバッグ用：移動内容の確認
                console.log('イベント移動:', {
                    ID: event.id,
                    移動前: info.oldEvent.start.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }),
                    移動後: startDate.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }),
                    送信データ: eventData
                });

                fetch(`/student/api/personal-schedule/${scheduleId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(eventData)
                })
                .then(response => response.json())
                .then(result => {
                    if (!result.success) {
                        info.revert();
                        showNotification('予定の更新に失敗しました', 'error');
                    } else {
                        showNotification('予定を更新しました', 'success');
                        calendar.refetchEvents();
                    }
                })
                .catch(error => {
                    console.error('更新エラー:', error);
                    info.revert();
                    showNotification('エラーが発生しました', 'error');
                });
            }
        },

        // リサイズの処理を修正
        eventResize: function(info) {
            const event = info.event;
            
            if (event.extendedProps?.type === 'personal') {
                // IDから'personal_'プレフィックスを削除
                const scheduleId = event.id.replace('personal_', '');
                
                // デバッグ情報を出力
                console.log('リサイズイベント:', {
                    イベント: event,
                    タイプ: event.extendedProps?.type,
                    開始時刻: event.start,
                    終了時刻: event.end,
                    元のイベント: info.oldEvent
                });

                // イベントの存在チェック
                if (!event) {
                    console.error('イベントが見つかりません');
                    info.revert();
                    showNotification('エラーが発生しました', 'error');
                    return;
                }

                // 共通時間割は変更不可
                if (event.extendedProps?.type === 'common') {
                    info.revert();
                    showNotification('共通時間割は変更できません', 'error');
                    return;
                }

                // 日本時間として時刻を処理
                const startDate = new Date(event.start);
                const endDate = new Date(event.end);
                
                // JSTでの時刻文字列を作成
                const jstStartDateTime = startDate.toISOString().slice(0, 19);
                const jstEndDateTime = endDate.toISOString().slice(0, 19);

                const eventData = {
                    title: event.title,
                    location: event.extendedProps.location || '',
                    description: event.extendedProps.description || '',
                    start_datetime: jstStartDateTime,
                    end_datetime: jstEndDateTime
                };

                // デバッグ用：リサイズ内容の確認
                console.log('イベントリサイズ:', {
                    ID: event.id,
                    変更前: info.oldEvent ? {
                        開始: info.oldEvent.start?.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }),
                        終了: info.oldEvent.end?.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })
                    } : '変更前情報なし',
                    変更後: {
                        開始: startDate.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }),
                        終了: endDate.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })
                    },
                    送信データ: eventData
                });

                // APIを呼び出してデータベースを更新
                fetch(`/student/api/personal-schedule/${scheduleId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(eventData)
                })
                .then(response => response.json())
                .then(result => {
                    if (!result.success) {
                        info.revert();
                        showNotification('予定の更新に失敗しました', 'error');
                    } else {
                        showNotification('予定を更新しました', 'success');
                        calendar.refetchEvents();
                    }
                })
                .catch(error => {
                    console.error('リサイズエラー:', error);
                    info.revert();
                    showNotification('エラーが発生しました', 'error');
                });
            }
        },
        views: {
            timeGrid: {
                dayHeaderFormat: { weekday: 'short', month: 'numeric', day: 'numeric', omitCommas: true }
            }
        },
        eventTimeFormat: {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            meridiem: false
        }
    });

    calendar.render();
});

// 新規作成用のモーダルを表示する関数を修正
function showCreateEventModal(date) {
    const modal = document.getElementById('eventModal');
    const form = document.getElementById('eventForm');
    const deleteButton = document.querySelector('.delete-event');
    const repeatButton = document.querySelector('.repeat-event');
    
    // ボタンを非表示
    deleteButton.style.display = 'none';
    repeatButton.style.display = 'none';
    
    // 繰り返し設定を非表示
    document.querySelector('.repeat-settings').style.display = 'none';
    
    form.reset();
    
    console.log('クリックした日時:', date);
    
    // 日付と時間を分離（タイムゾーンを考慮せずそのまま使用）
    const startDate = date.toISOString().split('T')[0];
    const startHours = date.getHours().toString().padStart(2, '0');
    const startMinutes = date.getMinutes().toString().padStart(2, '0');
    const startTime = `${startHours}:${startMinutes}`;
    
    // 30分後の時間を計算
    const endDate = startDate;
    const endLocalDate = new Date(date.getTime() + 30 * 60000);
    const endHours = endLocalDate.getHours().toString().padStart(2, '0');
    const endMinutes = endLocalDate.getMinutes().toString().padStart(2, '0');
    const endTime = `${endHours}:${endMinutes}`;
    
    console.log('設定する時間:', {
        startDate,
        startTime,
        endDate,
        endTime
    });
    
    // フォームに初期値を設定
    document.getElementById('startDate').value = startDate;
    document.getElementById('startTime').value = startTime;
    document.getElementById('endDate').value = endDate;
    document.getElementById('endTime').value = endTime;
    
    // モーダルのタイトルを設定
    document.querySelector('#eventModal .modal-content h2').textContent = '新規予定の作成';
    
    // 送信ボタンのテキストを設定
    document.querySelector('#eventModal .submit').textContent = '作成';
    
    // フォームのデータ属性を設定
    form.setAttribute('data-mode', 'create');
    form.removeAttribute('data-event-id');
    
    modal.classList.add('show');
}

// 編集用のモーダルを表示する関数を修正
function showEditEventModal(event) {
    const modal = document.getElementById('eventModal');
    const form = document.getElementById('eventForm');
    const deleteButton = document.querySelector('.delete-event');
    const repeatButton = document.querySelector('.repeat-event');
    const repeatSettings = document.querySelector('.repeat-settings');
    
    // ボタンを表示
    deleteButton.style.display = 'flex';
    repeatButton.style.display = 'flex';
    
    // 繰り返しボタンのクリックイベント
    repeatButton.onclick = function() {
        repeatSettings.style.display = 
            repeatSettings.style.display === 'none' ? 'block' : 'none';
    };
    
    // 繰り返し設定の変更イベント
    document.getElementById('repeatType').addEventListener('change', function(e) {
        const repeatEndGroup = document.querySelector('.repeat-end-group');
        repeatEndGroup.style.display = 
            e.target.value === 'none' ? 'none' : 'block';
    });
    
    // フォームをリセット
    form.reset();
    
    console.log('編集モーダルに設定する値:', {
        タイトル: event.title,
        場所: event.extendedProps?.location,
        説明: event.extendedProps?.description,
        開始日時: event.start,
        終了日時: event.end
    });
    
    // フォームに値を設定
    document.getElementById('title').value = event.title;
    document.getElementById('location').value = event.extendedProps?.location || '';
    document.getElementById('description').value = event.extendedProps?.description || '';
    
    // 日時の処理を修正
    const startDate = event.start.toISOString().split('T')[0];
    const startTime = event.start.toISOString().split('T')[1].substring(0, 5);
    const endDate = event.end.toISOString().split('T')[0];
    const endTime = event.end.toISOString().split('T')[1].substring(0, 5);
    
    document.getElementById('startDate').value = startDate;
    document.getElementById('startTime').value = startTime;
    document.getElementById('endDate').value = endDate;
    document.getElementById('endTime').value = endTime;
    
    // モーダルのタイトルを設定
    document.querySelector('#eventModal .modal-content h2').textContent = '予定の編集';
    
    // 送信ボタンのテキストを設定
    document.querySelector('#eventModal .submit').textContent = '更新';
    
    // フォームのデータ属性を設定
    form.setAttribute('data-mode', 'edit');
    form.setAttribute('data-event-id', event.id);
    
    // 削除ボタンのクリックイベントを設定
    deleteButton.onclick = function() {
        if (confirm('この予定を削除してもよろしいですか？')) {
            deleteEvent(event.id);
        }
    };
    
    modal.classList.add('show');
}

// モーダルを閉じる関数を修正
function closeEventModal() {
    const modal = document.getElementById('eventModal');
    const deleteButton = document.querySelector('.delete-event');
    const repeatButton = document.querySelector('.repeat-event');
    
    // 削除ボタンのイベントリスナーを削除
    deleteButton.onclick = null;
    repeatButton.onclick = null;
    
    modal.classList.remove('show');
    document.getElementById('eventForm').reset();
}

// イベントの詳細を表示する関数
function showEventDetails(event) {
    // イベントの時刻をJSTに変換
    const startJST = new Date(event.start.getTime() + (9 * 60 * 60 * 1000));
    const endJST = new Date(event.end.getTime() + (9 * 60 * 60 * 1000));

    document.getElementById('eventTitle').value = event.title;
    document.getElementById('eventLocation').value = event.extendedProps?.location || '';
    document.getElementById('eventDescription').value = event.extendedProps?.description || '';
    document.getElementById('startDate').value = formatDate(startJST);
    document.getElementById('startTime').value = formatTime(startJST);
    document.getElementById('endDate').value = formatDate(endJST);
    document.getElementById('endTime').value = formatTime(endJST);

    document.getElementById('eventModal').classList.add('show');
}

// 日付のフォーマット関数を修正
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 時刻のフォーマット関数を修正
function formatTime(date) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

// イベント削除関数を追加
function deleteEvent(eventId) {
    console.log(`スケジュール削除開始: ${eventId}`);
    
    fetch(`/student/api/personal-schedule/${eventId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(result => {
        console.log('削除レスポンス:', result);
        if (result.success) {
            calendar.refetchEvents();  // カレンダーを更新
            closeEventModal();
            showNotification('予定を削除しました', 'success');
        } else {
            showNotification(result.error || '予定の削除に失敗しました', 'error');
        }
    })
    .catch(error => {
        console.error('Delete error:', error);
        showNotification('エラーが発生しました', 'error');
    });
}

// 繰り返し設定の初期化処理を追加
function initRepeatSettings() {
    const repeatType = document.getElementById('repeatType');
    const repeatEndGroup = document.querySelector('.repeat-end-group');
    const repeatUntil = document.getElementById('repeatUntil');
    
    // 繰り返しタイプが変更されたときの処理
    repeatType.addEventListener('change', function() {
        repeatEndGroup.style.display = this.value === 'none' ? 'none' : 'block';
        if (this.value === 'none') {
            repeatUntil.value = '';
        } else {
            // デフォルトの終了日を1ヶ月後に設定
            const defaultEndDate = new Date();
            defaultEndDate.setMonth(defaultEndDate.getMonth() + 1);
            repeatUntil.value = defaultEndDate.toISOString().split('T')[0];
        }
    });
}

// DOMContentLoadedイベントで初期化
document.addEventListener('DOMContentLoaded', function() {
    initRepeatSettings();
});

// イベントフォームの送信処理を修正
document.getElementById('eventForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const form = this;
    const formData = new FormData(form);
    const mode = form.getAttribute('data-mode');
    
    // 日時の処理（JSTとして扱う）
    const startDateTime = `${formData.get('startDate')}T${formData.get('startTime')}:00`;
    const endDateTime = `${formData.get('endDate')}T${formData.get('endTime')}:00`;
    
    const eventData = {
        title: formData.get('title'),
        location: formData.get('location'),
        description: formData.get('description'),
        start_datetime: startDateTime,
        end_datetime: endDateTime
    };

    console.log('送信データ:', eventData);

    // 新規作成か編集かで処理を分岐
    if (mode === 'create') {
        // 新規作成の場合
        fetch('/student/api/personal-schedule', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(eventData)
        })
        .then(response => response.json())
        .then(result => {
            console.log('作成結果:', result);
            if (result.success) {
                calendar.refetchEvents();
                closeEventModal();
                showNotification('予定を追加しました', 'success');
                form.reset();
            } else {
                showNotification(result.error || '予定の作成に失敗しました', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('エラーが発生しました', 'error');
        });
    } else if (mode === 'edit') {
        // 編集の場合
        const eventId = form.getAttribute('data-event-id');
        
        fetch(`/student/api/personal-schedule/${eventId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(eventData)
        })
        .then(response => response.json())
        .then(result => {
            console.log('更新結果:', result);
            if (result.success) {
                calendar.refetchEvents();
                closeEventModal();
                showNotification('予定を更新しました', 'success');
            } else {
                showNotification(result.error || '予定の更新に失敗しました', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('エラーが発生しました', 'error');
        });
    }
});

// モーダル外クリックでの閉じる処理を修正
document.addEventListener('click', function(e) {
    const modal = document.getElementById('eventModal');
    const modalContent = modal.querySelector('.modal-content');
    
    if (e.target === modal) {  // モーダルの外側をクリックした場合
        closeEventModal();
    }
});

// キャンセルボタンのクリックハンドラを追加
document.querySelector('#eventModal .cancel').addEventListener('click', function(e) {
    e.preventDefault();
    closeEventModal();
});

// 通知メッセージを表示する関数
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // スタイルを設定
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.padding = '10px 20px';
    notification.style.borderRadius = '4px';
    notification.style.zIndex = '1000';
    notification.style.animation = 'fadeInOut 3s forwards';
    
    if (type === 'success') {
        notification.style.backgroundColor = '#4CAF50';
        notification.style.color = 'white';
    } else {
        notification.style.backgroundColor = '#f44336';
        notification.style.color = 'white';
    }
    
    document.body.appendChild(notification);
    
    // 3秒後に通知を削除
    setTimeout(() => {
        notification.remove();
    }, 3000);
}
