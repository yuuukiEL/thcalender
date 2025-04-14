// グローバルにカレンダーインスタンスを定義
let calendar;

document.addEventListener('DOMContentLoaded', function() {
    const calendarEl = document.getElementById('calendar');
    
    // 時限と時間のマッピング
    const periodTimes = {
        '1限': { start: '09:30:00', end: '11:00:00' },
        '2限': { start: '11:15:00', end: '12:45:00' },
        '3限': { start: '13:30:00', end: '15:00:00' },
        '4限': { start: '15:15:00', end: '16:45:00' },
        '5限': { start: '17:00:00', end: '18:30:00' },
        '6限': { start: '18:45:00', end: '20:15:00' }
    };

    let clickTimer = null;

    // calendarをグローバル変数に代入
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'timeGridWeek',
        locale: 'ja',
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
        slotMinTime: '00:00:00',
        slotMaxTime: '24:00:00',
        expandRows: true,
        stickyHeaderDates: true,
        nowIndicator: true,
        selectable: false,
        selectMirror: false,
        editable: true,
        slotDuration: '00:15:00',
        slotLabelInterval: '01:00:00',
        snapDuration: '00:15:00',
        eventStartEditable: true,
        eventDurationEditable: true,
        eventResizableFromStart: true,
        dragRevertDuration: 0,

        // ダブルクリックでイベント追加
        eventClick: function(info) {
            const event = info.event;
            if (event.extendedProps?.type === 'common') {
                return;
            }
            showEditEventModal(event);
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
                    showCreateEventModal(info.date);
                }
            } else if (calendar.view.type === 'timeGridDay' || calendar.view.type === 'timeGridWeek') {
                if (clickTimer === null) {
                    clickTimer = setTimeout(function () {
                        clickTimer = null;
                    }, 300);
                } else {
                    clearTimeout(clickTimer);
                    clickTimer = null;
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
            Promise.all([
                fetch('/api/common-schedules').then(response => response.json()),
                fetch('/api/events').then(response => response.json()),
                fetch('/api/personal-schedules').then(response => response.json())
            ])
            .then(([commonSchedules, classEvents, personalEvents]) => {
                // 共通時間割の変換
                const formattedCommonSchedules = commonSchedules.map(schedule => {
                    const period = `${schedule.period}限`;
                    const times = periodTimes[period];
                    
                    if (!times) return null;

                    // 曜日の文字列を数値に変換
                    const dayMap = {
                        'Monday': 1,
                        'Tuesday': 2,
                        'Wednesday': 3,
                        'Thursday': 4,
                        'Friday': 5
                    };

                    // 現在の週の開始日から対応する曜日の日付を計算
                    const date = new Date(info.start);
                    const day = dayMap[schedule.day];
                    if (day) {
                        date.setDate(date.getDate() + (day - date.getDay()));
                        
                        return {
                            id: `common_${schedule.schedule_id}`,
                            title: schedule.subject_name,
                            start: `${date.toISOString().split('T')[0]}T${times.start}`,
                            end: `${date.toISOString().split('T')[0]}T${times.end}`,
                            location: `${schedule.classroom_id}教室`,
                            description: `担当：${schedule.teacher_name}`,
                            backgroundColor: '#4CAF50', // 共通時間割用の色
                            borderColor: '#45a049',
                            extendedProps: {
                                type: 'common',
                                teacher_id: schedule.teacher_id
                            }
                        };
                    }
                    return null;
                }).filter(event => event !== null);

                // 他のイベントの処理（既存のコード）
                const formattedClassEvents = classEvents.map(event => {
                    const period = `${event.period}限`;
                    const times = periodTimes[period];
                    
                    if (!times) return null;

                    const dayMap = {
                        'Monday': 1,
                        'Tuesday': 2,
                        'Wednesday': 3,
                        'Thursday': 4,
                        'Friday': 5
                    };

                    const date = new Date(info.start);
                    date.setDate(date.getDate() + (dayMap[event.day] - date.getDay()));
                    
                    return {
                        id: event.id,
                        title: event.title,
                        start: `${date.toISOString().split('T')[0]}T${times.start}`,
                        end: `${date.toISOString().split('T')[0]}T${times.end}`,
                        location: event.location,
                        description: event.description,
                        extendedProps: {
                            teacher_id: event.teacher_id,
                            type: 'class'
                        }
                    };
                }).filter(event => event !== null);

                // 個人スケジュールの処理を修正
                const formattedPersonalEvents = personalEvents.map(event => {
                    // サーバーから受け取った時刻文字列をJST（日本時間）として解釈
                    const startDate = new Date(event.start + '+09:00');  // JSTタイムゾーンを明示
                    const endDate = new Date(event.end + '+09:00');      // JSTタイムゾーンを明示
                    
                    console.log('個人予定の変換:', {
                        元のstart: event.start,
                        元のend: event.end,
                        JST_start: startDate.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }),
                        JST_end: endDate.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })
                    });

                    return {
                        id: event.id,
                        title: event.title,
                        start: startDate,
                        end: endDate,
                        editable: true,
                        durationEditable: true,
                        startEditable: true,
                        backgroundColor: '#3788d8',
                        borderColor: '#2C6DB2',
                        extendedProps: {
                            type: 'personal',
                            location: event.location,
                            description: event.description
                        }
                    };
                });

                // すべてのイベントを結合
                const allEvents = [
                    ...formattedCommonSchedules,
                    ...formattedClassEvents,
                    ...formattedPersonalEvents
                ];

                successCallback(allEvents);
            })
            .catch(error => {
                console.error('Error fetching events:', error);
                failureCallback(error);
            });
        },

        eventTimeFormat: {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
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
                // 日本時間として時刻を処理
                const startDate = new Date(event.start);
                const endDate = new Date(event.end);
                
                // JSTでの時刻文字列を作成
                const jstStartDateTime = new Date(startDate.getTime() - (startDate.getTimezoneOffset() * 60000))
                    .toISOString()
                    .slice(0, 19);
                const jstEndDateTime = new Date(endDate.getTime() - (endDate.getTimezoneOffset() * 60000))
                    .toISOString()
                    .slice(0, 19);

                const eventData = {
                    title: event.title,
                    location: event.extendedProps.location || '',
                    description: event.extendedProps.description || '',
                    start_datetime: jstStartDateTime,
                    end_datetime: jstEndDateTime
                };

                console.log('更新データ:', {
                    ID: event.id,
                    移動前: info.oldEvent.start.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }),
                    移動後: startDate.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }),
                    送信データ: {
                        ...eventData,
                        start_datetime_JST: new Date(jstStartDateTime + '+09:00').toLocaleString('ja-JP'),
                        end_datetime_JST: new Date(jstEndDateTime + '+09:00').toLocaleString('ja-JP')
                    }
                });

                fetch(`/api/personal-schedule/${event.id}`, {
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

            // 個人スケジュールのみ更新可能
            if (event.extendedProps?.type === 'personal') {
                try {
                    // 日本時間として時刻を処理
                    const startDate = new Date(event.start);
                    const endDate = new Date(event.end);
                    
                    // JSTでの時刻文字列を作成
                    const jstStartDateTime = new Date(startDate.getTime() - (startDate.getTimezoneOffset() * 60000))
                        .toISOString()
                        .slice(0, 19);
                    const jstEndDateTime = new Date(endDate.getTime() - (endDate.getTimezoneOffset() * 60000))
                        .toISOString()
                        .slice(0, 19);

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
                            開始: info.oldEvent.start?.toLocaleString('ja-JP'),
                            終了: info.oldEvent.end?.toLocaleString('ja-JP')
                        } : '変更前情報なし',
                        変更後: {
                            開始: startDate.toLocaleString('ja-JP'),
                            終了: endDate.toLocaleString('ja-JP')
                        },
                        送信データ: eventData
                    });

                    // APIを呼び出してデータベースを更新
                    fetch(`/api/personal-schedule/${event.id}`, {
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
                } catch (error) {
                    console.error('リサイズ処理エラー:', error);
                    info.revert();
                    showNotification('エラーが発生しました', 'error');
                }
            }
        },
        slotLabelFormat: {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            meridiem: false
        },
        slotLabelContent: function(arg) {
            const hour = arg.date.getHours();
            const minutes = arg.date.getMinutes();
            let periodLabel = '';
            
            // 時限の開始時刻に合わせて表示
            if (hour === 9 && minutes === 30) {
                periodLabel = '1限';
            } else if (hour === 11 && minutes === 15) {
                periodLabel = '2限';
            } else if (hour === 13 && minutes === 30) {
                periodLabel = '3限';
            } else if (hour === 15 && minutes === 15) {
                periodLabel = '4限';
            } else if (hour === 17 && minutes === 0) {
                periodLabel = '5限';
            } else if (hour === 18 && minutes === 45) {
                periodLabel = '6限';
            }

            // 時刻表示（1時間ごと）
            if (minutes === 0) {
                // 24時間表示で2桁に統一
                const formattedHour = hour.toString().padStart(2, '0');
                return {
                    html: `<div class="fc-timegrid-slot-label-cushion fc-hour-label">${formattedHour}:00</div>`
                };
            }
            
            // 時限表示
            if (periodLabel) {
                return {
                    html: `<div class="fc-timegrid-slot-label-cushion fc-period-label">${periodLabel}</div>`
                };
            }
            
            // その他の時間（15分刻み）
            return {
                html: `<div class="fc-timegrid-slot-label-cushion fc-minor-label">${arg.text}</div>`
            };
        },
        // スロットの生成時のデバッグ
        slotLabelDidMount: function(arg) {
            // スロットラベルのマウント時のデバッグ
            if (arg.date.getMinutes() === 0) {  // 1時間ごとのラベルのみログ出力
                console.log('時間ラベルがマウントされました:', {
                    時刻: arg.text,
                    日時: arg.date
                });
            }
        },

        // 時間枠の生成時のデバッグ
        slotDidMount: function(arg) {
            console.log('Slot mounted:', {
                date: arg.date,
                el: arg.el,
                isLabeled: arg.isLabeled
            });
        },

        // カレンダービューの変更時のデバッグ
        viewDidMount: function(arg) {
            console.log('カレンダービューが変更されました:', {
                表示タイプ: arg.view.type,
                開始日時: arg.view.currentStart,
                終了日時: arg.view.currentEnd
            });
        }
    });

    calendar.render();
});

// 新規作成用のモーダルを表示する関数
function showCreateEventModal(date) {
    const modal = document.getElementById('eventModal');
    const form = document.getElementById('eventForm');
    const deleteButton = document.querySelector('.delete-event');
    const repeatButton = document.querySelector('.repeat-event');
    const repeatSettings = document.querySelector('.repeat-settings');
    
    // ボタンを非表示
    deleteButton.style.display = 'none';
    repeatButton.style.display = 'none';
    repeatSettings.style.display = 'none';
    
    // フォームをリセット
    form.reset();
    
    // タイムゾーンを考慮した日付と時間の取得
    const localDate = new Date(date);
    
    // 日付と時間を分離
    const startDate = localDate.toLocaleDateString('sv').split(' ')[0]; // YYYY-MM-DD形式
    const hours = localDate.getHours().toString().padStart(2, '0');
    const minutes = localDate.getMinutes().toString().padStart(2, '0');
    const startTime = `${hours}:${minutes}`;
    
    // 30分後の時間を計算
    const endDate = startDate;
    const endLocalDate = new Date(localDate.getTime() + 30 * 60000);
    const endHours = endLocalDate.getHours().toString().padStart(2, '0');
    const endMinutes = endLocalDate.getMinutes().toString().padStart(2, '0');
    const endTime = `${endHours}:${endMinutes}`;
    
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
    
    // 要素の存在確認
    const elements = {
        title: document.getElementById('title'),
        location: document.getElementById('location'),
        description: document.getElementById('description'),
        startDate: document.getElementById('startDate'),
        startTime: document.getElementById('startTime'),
        endDate: document.getElementById('endDate'),
        endTime: document.getElementById('endTime')
    };

    // 要素の存在チェック
    Object.entries(elements).forEach(([key, element]) => {
        if (!element) {
            console.error(`要素が見つかりません: ${key}`);
        }
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
    document.getElementById('startDate').value = event.start.toISOString().split('T')[0];
    document.getElementById('startTime').value = event.start.toTimeString().slice(0,5);
    document.getElementById('endDate').value = event.end.toISOString().split('T')[0];
    document.getElementById('endTime').value = event.end.toTimeString().slice(0,5);
    
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

// イベントフォームの送信処理を修正
document.getElementById('eventForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    const mode = this.getAttribute('data-mode');
    const eventId = this.getAttribute('data-event-id');
    
    // 日時の処理
    const startDateTime = `${formData.get('startDate')}T${formData.get('startTime')}:00`;
    const endDateTime = `${formData.get('endDate')}T${formData.get('endTime')}:00`;
    
    // バリデーション
    const startDateObj = new Date(startDateTime);
    const endDateObj = new Date(endDateTime);
    const repeatType = formData.get('repeatType');
    const repeatUntil = formData.get('repeatUntil');
    
    // 繰り返し設定のバリデーション
    if (repeatType !== 'none') {
        if (!repeatUntil) {
            showNotification('繰り返し終了日を設定してください', 'error');
            return;
        }
        
        const untilDate = new Date(repeatUntil);
        if (untilDate < startDateObj) {
            showNotification('繰り返し終了日は開始日より後に設定してください', 'error');
            return;
        }
    }
    
    const eventData = {
        title: formData.get('title'),
        location: formData.get('location'),
        description: formData.get('description'),
        start_datetime: startDateTime,
        end_datetime: endDateTime,
        repeat_type: repeatType,
        repeat_until: repeatUntil
    };
    
    // APIリクエスト
    fetch('/api/personal-schedule', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData)
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            calendar.refetchEvents();
            closeEventModal();
            showNotification(
                repeatType !== 'none' 
                    ? '繰り返し予定を作成しました' 
                    : '予定を追加しました', 
                'success'
            );
            this.reset();
        } else {
            showNotification('予定の作成に失敗しました', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('エラーが発生しました', 'error');
    });
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

// イベントの詳細を表示する関数
function showEventDetails(event) {
    const eventData = {
        title: event.title,
        location: event.extendedProps?.location || '',
        description: event.extendedProps?.description || '',
        start: event.start,
        end: event.end
    };

    // フォームに値を設定
    document.getElementById('eventTitle').value = eventData.title;
    document.getElementById('eventLocation').value = eventData.location;
    document.getElementById('eventDescription').value = eventData.description;
    document.getElementById('startDate').value = eventData.start.toISOString().split('T')[0];
    document.getElementById('startTime').value = eventData.start.toTimeString().slice(0,5);
    document.getElementById('endDate').value = eventData.end.toISOString().split('T')[0];
    document.getElementById('endTime').value = eventData.end.toTimeString().slice(0,5);

    // モーダルを表示
    const modal = document.getElementById('eventModal');
    modal.classList.add('show');
}

// イベント削除関数を追加
function deleteEvent(eventId) {
    fetch(`/api/personal-schedule/${eventId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            calendar.refetchEvents();
            closeEventModal();
            showNotification('予定を削除しました', 'success');
        } else {
            showNotification('予定の削除に失敗しました', 'error');
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
