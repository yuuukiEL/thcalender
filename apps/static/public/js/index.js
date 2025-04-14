document.addEventListener('DOMContentLoaded', function() {
    var calendarEl = document.getElementById('calendar');
    var timetableEl = document.querySelector('.current-timetable');
    var currentView = 'calendar';

    var calendar = new FullCalendar.Calendar(calendarEl, {
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listMonth,customTable'
        },
        customButtons: {
            customTable: {
                text: 'テーブル',
                click: function() {
                    if (currentView === 'calendar') {
                        calendarEl.style.display = 'none';
                        timetableEl.style.display = 'table';
                        currentView = 'table';
                        updateTimetableData();
                        document.getElementById('switchToCalendar').style.display = 'inline-block';
                    } else {
                        calendarEl.style.display = 'block';
                        timetableEl.style.display = 'none';
                        currentView = 'calendar';
                        calendar.changeView('timeGridWeek');
                        document.getElementById('switchToCalendar').style.display = 'none';
                    }
                }
            }
        },
        buttonText: {
            today: '今月',
            month: '月',
            week: '週',
            day: '日',
            list: 'リスト'
        },
        initialView: 'timeGridWeek',
        locale: 'ja',
        navLinks: true,
        businessHours: true,
        editable: true,
        selectable: true,
        height: 'auto',
        displayEventTime: true,
        events: '/api/schedule'
    });

    calendar.render();
    
    // 時間割テーブルの初期表示を非表示に
    timetableEl.style.display = 'none';

    // 時間割テーブルのデータを更新する関数
    function updateTimetableData() {
        fetch('/api/schedule')
            .then(response => response.json())
            .then(events => {
                // テーブルをクリア
                clearTimetable();
                
                // イベントを時間割テーブルに配置
                events.forEach(event => {
                    // 曜日のマッピングを修正（月曜が2列目から始まるため）
                    const dayMap = {
                        'Monday': 2,
                        'Tuesday': 3,
                        'Wednesday': 4,
                        'Thursday': 5,
                        'Friday': 6
                    };
                    
                    const periodMap = {
                        '1限': 0,
                        '2限': 1,
                        '3限': 2,
                        '4限': 3,
                        '5限': 4,
                        '6限': 5
                    };

                    // イベントの日付から曜日を取得
                    const eventDate = new Date(event.start);
                    const dayOfWeek = eventDate.toLocaleString('en-US', { weekday: 'long' });
                    const dayIndex = dayMap[dayOfWeek];

                    // 時限を取得（例：13:30:00 → 3限）
                    const eventTime = eventDate.toTimeString().substring(0, 8);
                    let period;
                    if (eventTime >= '09:30:00' && eventTime < '11:00:00') period = '1限';
                    else if (eventTime >= '11:15:00' && eventTime < '12:45:00') period = '2限';
                    else if (eventTime >= '13:30:00' && eventTime < '15:00:00') period = '3限';
                    else if (eventTime >= '15:15:00' && eventTime < '16:45:00') period = '4限';
                    else if (eventTime >= '17:00:00' && eventTime < '18:30:00') period = '5限';
                    else if (eventTime >= '18:45:00' && eventTime < '20:15:00') period = '6限';

                    const periodIndex = periodMap[period];

                    if (dayIndex !== undefined && periodIndex !== undefined) {
                        const cell = document.querySelector(`.current-timetable tbody tr:nth-child(${periodIndex + 1}) td:nth-child(${dayIndex})`);
                        if (cell) {
                            const titleParts = event.title.split('\n');
                            cell.querySelector('.subject-name').textContent = titleParts[0] || '';
                            cell.querySelector('.teacher-name').textContent = titleParts[1] || '';
                            cell.querySelector('.classroom-number').textContent = titleParts[2] || '';
                        }
                    }
                });
            })
            .catch(error => console.error('Error fetching schedule:', error));
    }

    // 時間割テーブルをクリアする関数
    function clearTimetable() {
        document.querySelectorAll('.current-timetable .schedule-cell').forEach(cell => {
            cell.querySelector('.subject-name').textContent = '';
            cell.querySelector('.teacher-name').textContent = '';
            cell.querySelector('.classroom-number').textContent = '';
        });
    }

    // 既存のボタンにイベントリスナーを追加
    var switchButton = document.getElementById('switchToCalendar');
    switchButton.onclick = function() {
        calendarEl.style.display = 'block';
        timetableEl.style.display = 'none';
        currentView = 'calendar';
        calendar.changeView('timeGridWeek');
        switchButton.style.display = 'none';
    };

    // 時間割テーブルが表示されると同時にボタンを表示
    timetableEl.addEventListener('transitionend', function() {
        if (timetableEl.style.display === 'table') {
            switchButton.style.display = 'inline-block';
        }
    });
});
