// デフォルトのプロフィール画像（Base64エンコード）
const DEFAULT_PROFILE_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICAgIDxjaXJjbGUgY3g9IjQwIiBjeT0iNDAiIHI9IjQwIiBmaWxsPSIjRTJFOEYwIi8+CiAgICA8cGF0aCBkPSJNNDAgMjBDMzQuNDggMjAgMzAgMjQuNDggMzAgMzBDMzAgMzUuNTIgMzQuNDggNDAgNDAgNDBDNDUuNTIgNDAgNTAgMzUuNTIgNTAgMzBDNTAgMjQuNDggNDUuNTIgMjAgNDAgMjBaTTQwIDQ0QzMyLjY2IDQ0IDE4IDQ3LjY4IDE4IDU1VjYwSDYyVjU1QzYyIDQ3LjY4IDQ3LjM0IDQ0IDQwIDQ0WiIgZmlsbD0iI0EwQUVDMCIvPgo8L3N2Zz4=';

let currentScheduleId = null;  // グローバル変数として定義
let currentSubjectId = null;
let allComments = [];
let isDescending = true; // 新しい順がデフォルト

// すべての関数を先に定義
function showWriteCommentModal(subject, teacher, classroom, scheduleId, teacherId) {
    currentScheduleId = scheduleId;
    const modal = document.getElementById('writeCommentModal');
    
    // 情報を設定
    document.getElementById('teacherName').textContent = teacher;
    document.getElementById('subjectName').textContent = subject;
    document.getElementById('classroomInfo').textContent = classroom;
    
    // 教師の画像を設定
    const teacherImage = document.getElementById('teacherImage');
    if (teacherId) {
        teacherImage.src = `/api/teachers/${teacherId}/profile-image`;
        teacherImage.onerror = function() {
            this.src = DEFAULT_PROFILE_IMAGE;
        };
    } else {
        teacherImage.src = DEFAULT_PROFILE_IMAGE;
    }
    teacherImage.style.display = 'block';
    
    // コメントを読み込む（追加）
    loadComments();
    
    modal.classList.remove('hidden');
}

function showReadCommentModal(subject, teacher, classroom, scheduleId, teacherId) {
    currentScheduleId = scheduleId;
    const modal = document.getElementById('readCommentModal');
    
    // 情報を設定
    document.getElementById('teacherNameRead').textContent = teacher;
    document.getElementById('subjectNameRead').textContent = subject;
    document.getElementById('classroomInfoRead').textContent = classroom;
    
    // 教師の画像を設定
    const teacherImage = document.getElementById('teacherImageRead');
    if (teacherId) {
        teacherImage.src = `/api/teachers/${teacherId}/profile-image`;
        teacherImage.onerror = function() {
            this.src = DEFAULT_PROFILE_IMAGE;
        };
    } else {
        teacherImage.src = DEFAULT_PROFILE_IMAGE;
    }
    teacherImage.style.display = 'block';
    
    // コメントを読み込む
    loadComments();
    
    modal.classList.remove('hidden');
}

function hideWriteCommentModal() {
    const modal = document.getElementById('writeCommentModal');
    modal.classList.add('hidden');
}

function hideReadCommentModal() {
    const modal = document.getElementById('readCommentModal');
    modal.classList.add('hidden');
}

async function loadComments() {
    if (!currentScheduleId) return;
    
    try {
        const response = await fetch(`/api/comments/${currentScheduleId}`);
        if (!response.ok) {
            throw new Error('コメントの取得に失敗しました');
        }
        const data = await response.json();
        
        currentSubjectId = data.subject_id;
        allComments = data.comments;
        
        displayComments(allComments, currentScheduleId);
        
        // フィルタータグのイベントリスナー設定
        document.getElementById('currentSubject').onclick = () => {
            document.getElementById('currentSubject').classList.add('active');
            document.getElementById('allSubjects').classList.remove('active');
            displayComments(allComments, currentScheduleId);
        };
        
        document.getElementById('allSubjects').onclick = () => {
            document.getElementById('allSubjects').classList.add('active');
            document.getElementById('currentSubject').classList.remove('active');
            displayComments(allComments);
        };
        
    } catch (error) {
        console.error('コメントの読み込みに失敗しました:', error);
        const commentsList = document.getElementById('commentsList');
        commentsList.innerHTML = '<p class="error-message">コメントを読み込めませんでした</p>';
    }
}

function displayComments(comments, filterScheduleId = null) {
    const commentsList = document.getElementById('commentsList');
    commentsList.innerHTML = '';
    
    if (!comments || comments.length === 0) {
        commentsList.innerHTML = `
            <div class="no-comments">
                <p>この科目の過去のコメントはありません</p>
                <p class="no-comments-sub">最初のコメントを投稿してみましょう！</p>
            </div>
        `;
        return;
    }
    
    const filteredComments = filterScheduleId 
        ? comments.filter(c => c.schedule_id === parseInt(filterScheduleId))
        : comments;
    
    // 日付でグループ化
    const groupedComments = {};
    filteredComments.forEach(comment => {
        const date = new Date(comment.created_at).toLocaleDateString();
        if (!groupedComments[date]) {
            groupedComments[date] = [];
        }
        groupedComments[date].push(comment);
    });
    
    // 日付の配列を取得して並び替え
    let dates = Object.keys(groupedComments);
    dates = isDescending ? dates.reverse() : dates;
    
    dates.forEach(date => {
        const dateGroup = document.createElement('div');
        dateGroup.className = 'comment-date-group';
        dateGroup.innerHTML = `<div class="comment-date-header">${date}</div>`;
        
        // 各日付内のコメントも並び替え
        let dateComments = groupedComments[date];
        dateComments.sort((a, b) => {
            const timeA = new Date(a.created_at).getTime();
            const timeB = new Date(b.created_at).getTime();
            return isDescending ? timeB - timeA : timeA - timeB;
        });
        
        dateComments.forEach(comment => {
            const commentElement = document.createElement('div');
            commentElement.className = 'comment-item';
            commentElement.innerHTML = `
                <div class="comment-header">
                    <span class="comment-author">${comment.subject_name}</span>
                    <span class="comment-time">${new Date(comment.created_at).toLocaleTimeString()}</span>
                </div>
                <div class="comment-schedule-info">
                    担当：${comment.teacher_name}
                </div>
                <div class="comment-content">${comment.content}</div>
            `;
            dateGroup.appendChild(commentElement);
        });
        
        commentsList.appendChild(dateGroup);
    });
}

async function addComment(commentText) {
    try {
        const response = await fetch('/api/comments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                schedule_id: currentScheduleId,
                content: commentText
            })
        });
        
        if (response.ok) {
            // コメントリストを再読み込み
            loadComments();
            // 入力欄をクリア
            document.getElementById('newComment').value = '';
            // 成功メッセージを表示
            const commentForm = document.querySelector('.comment-form');
            const successMessage = document.createElement('div');
            successMessage.className = 'success-message';
            successMessage.textContent = 'コメントを追加しました';
            commentForm.appendChild(successMessage);
            // 3秒後にメッセージを消す
            setTimeout(() => {
                successMessage.remove();
            }, 3000);
        } else {
            const error = await response.json();
            alert(error.error || 'コメントの投稿に失敗しました');
        }
    } catch (error) {
        console.error('コメントの投稿に失敗しました:', error);
        alert('コメントの投稿に失敗しました');
    }
}

// DOMContentLoadedイベントを最後に配置
document.addEventListener('DOMContentLoaded', function() {
    const calendar = document.querySelector('#calendar');
    const timetable = document.querySelector('.timetable');
    const switchToCalendarBtn = document.getElementById('switchToCalendar');

    // 時間割データを取得する関数
    async function fetchTimetableData() {
        try {
            const response = await fetch('/api/events');
            const events = await response.json();
            return events;
        } catch (error) {
            console.error('時間割データの取得に失敗しました:', error);
            return [];
        }
    }

    // 時間割を表示する関数
    function displayTimetable(events) {
        const cells = document.querySelectorAll('.schedule-cell');
        cells.forEach(cell => {
            const content = cell.querySelector('.cell-content');
            content.querySelector('.subject-name').textContent = '';
            content.querySelector('.teacher-name').textContent = '';
            content.querySelector('.classroom-number').textContent = '';
            content.dataset.scheduleId = '';
            content.dataset.teacherId = '';
        });

        // 曜日のマッピング
        const dayMapping = {
            'Monday': 0,
            'Tuesday': 1,
            'Wednesday': 2,
            'Thursday': 3,
            'Friday': 4
        };

        // 時限のマッピング
        const periodMapping = {
            '1限': 0,
            '2限': 1,
            '3限': 2,
            '4限': 3,
            '5限': 4,
            '6限': 5
        };

        events.forEach(event => {
            // データベースの day と period を直接使用
            const day = dayMapping[event.day];
            const period = periodMapping[event.period];

            if (day !== undefined && period !== undefined) {
                const cellIndex = day + (period * 5);
                const cell = cells[cellIndex];
                if (cell) {
                    const content = cell.querySelector('.cell-content');
                    content.querySelector('.subject-name').textContent = event.title;
                    content.querySelector('.teacher-name').textContent = event.description;
                    content.querySelector('.classroom-number').textContent = event.location;
                    content.dataset.scheduleId = event.id;
                    content.dataset.teacherId = event.teacher_id;
                }
            }
        });
    }

    // カレンダー表示に切り替え
    function showCalendar() {
        if (calendar) {  // カレンダー要素が存在する場合のみ実行
            calendar.style.display = 'block';
            timetable.style.display = 'none';
            switchToCalendarBtn.style.display = 'none';
        }
    }

    // 時間割表示に切り替え
    async function showTimetable() {
        if (timetable) {  // 時間割要素が存在する場合のみ実行
            if (calendar) calendar.style.display = 'none';
            timetable.style.display = 'table';
            if (switchToCalendarBtn) switchToCalendarBtn.style.display = 'block';
            
            const events = await fetchTimetableData();
            displayTimetable(events);
        }
    }

    // イベントリスナーの設定
    if (switchToCalendarBtn) {
        switchToCalendarBtn.addEventListener('click', showCalendar);
    }

    // 時間割のセルにダブルクリックイベントリスナーを追加
    const scheduleCells = document.querySelectorAll('.schedule-cell');
    scheduleCells.forEach(cell => {
        cell.addEventListener('dblclick', function(e) {
            const content = this.querySelector('.cell-content');
            if (!content) return;

            const subjectName = content.querySelector('.subject-name').textContent;
            const teacherName = content.querySelector('.teacher-name').textContent;
            const classroomNumber = content.querySelector('.classroom-number').textContent;
            const scheduleId = content.dataset.scheduleId;
            const teacherId = content.dataset.teacherId;

            if (subjectName && teacherName) {
                if (e.shiftKey) {
                    // Shiftキー + ダブルクリックで読み取りモーダル
                    showReadCommentModal(subjectName, teacherName, classroomNumber, scheduleId, teacherId);
                } else {
                    // 通常のダブルクリックで書き込みモーダル
                    showWriteCommentModal(subjectName, teacherName, classroomNumber, scheduleId, teacherId);
                }
            }
        });
    });

    // モーダルを閉じるイベントの設定
    function setupModalCloseListeners() {
        document.querySelectorAll('.comment-modal-close, .comment-modal-overlay').forEach(element => {
            element.addEventListener('click', function(e) {
                e.preventDefault();
                hideWriteCommentModal();
                hideReadCommentModal();
            });
        });
    }

    // 過去のコメントを見るボタンのイベントリスナー設定
    function setupPastCommentsButton() {
        const showPastCommentsBtn = document.getElementById('showPastComments');
        if (showPastCommentsBtn) {
            showPastCommentsBtn.addEventListener('click', function() {
                const writeModal = document.getElementById('writeCommentModal');
                const subject = document.getElementById('subjectName').textContent;
                const teacher = document.getElementById('teacherName').textContent;
                const classroom = document.getElementById('classroomInfo').textContent;
                
                hideWriteCommentModal();
                showReadCommentModal(subject, teacher, classroom, currentScheduleId, writeModal.dataset.teacherId);
            });
        }
    }

    // コメント送信ボタンのイベントリスナー設定
    function setupCommentSubmitButton() {
        const addCommentBtn = document.getElementById('addComment');
        if (addCommentBtn) {
            addCommentBtn.addEventListener('click', function() {
                const commentText = document.getElementById('newComment').value.trim();
                if (commentText) {
                    addComment(commentText);
                }
            });
        }
    }

    // 並び替えボタンのイベントリスナー
    const sortButton = document.getElementById('sortButton');
    if (sortButton) {
        sortButton.addEventListener('click', function() {
            isDescending = !isDescending;
            this.classList.toggle('descending');
            this.querySelector('span').textContent = isDescending ? '新しい順' : '古い順';
            displayComments(allComments, currentScheduleId);
        });
    }

    // 初期化処理
    setupModalCloseListeners();
    setupPastCommentsButton();
    setupCommentSubmitButton();
    showTimetable();
}); 