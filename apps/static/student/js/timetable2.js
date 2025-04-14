// 定数定義
const TIMETABLE_API_ENDPOINT = '/student/api/schedule/cell';

// グローバル変数
let currentScheduleId = null;
let currentSubjectId = null;
let allComments = [];
let isDescending = true; // 新しい順がデフォルト
let isEditMode = false;
let DEFAULT_PROFILE_IMAGE = '/static/common/img/default-profile.png'; // アンダースコアをハイフンに変更
let currentDay = null;
let currentPeriod = null;

// PDF配置モーダルの処理を追加
let selectedFile = null;
let selectedCell = null;

// コメントモーダル関連の関数
function showWriteCommentModal(subjectName, teacherName, classroomNumber, scheduleId, teacherId) {
    try {
        console.log('コメントモーダル表示開始:', {
            subjectName, teacherName, classroomNumber, scheduleId, teacherId
        });

        // モーダル要素を取得
        const modal = document.getElementById('writeCommentModal');
        if (!modal) {
            console.error('コメントモーダルが見つかりません (ID: writeCommentModal)');
            return;
        }

        // 現在のスケジュールIDを設定
        currentScheduleId = scheduleId;

        // スケジュール情報を表示
        const scheduleInfoContainer = modal.querySelector('#scheduleInfoContainer');
        if (!scheduleInfoContainer) {
            console.error('スケジュール情報コンテナが見つかりません (ID: scheduleInfoContainer)');
            return;
        }

        console.log('スケジュール情報コンテナ:', scheduleInfoContainer);

        const day = currentDay; // 現在の曜日を取得
        const period = currentPeriod; // 現在の時限を取得

        // 曜日の日本語表記
        const dayNames = {
            '月': '月曜日',
            '火': '火曜日',
            '水': '水曜日',
            '木': '木曜日',
            '金': '金曜日',
            '土': '土曜日',
            '日': '日曜日'
        };

        const dayJp = dayNames[day] || day;

        // まず基本情報を表示
        scheduleInfoContainer.innerHTML = `
            <div class="schedule-info">
                <div class="schedule-header">
                    <span class="schedule-day-period">${dayJp} ${period}限</span>
                </div>
                <div class="schedule-details">
                    <div class="schedule-subject">${subjectName || '科目名なし'}</div>
                    <div class="schedule-teacher">担当: ${teacherName || '未設定'}</div>
                    <div class="schedule-classroom">教室: ${classroomNumber || '未設定'}</div>
                    <div class="schedule-content">
                        <h4>授業内容:</h4>
                        <p>読み込み中...</p>
                    </div>
                </div>
            </div>
        `;

        // 授業内容を非同期で取得
        fetchTimetableData(day, period)
            .then(data => {
                console.log('取得したスケジュールデータ:', data);
                const content = data?.content || '授業内容なし';

                // 授業内容部分だけを更新
                const contentElement = scheduleInfoContainer.querySelector('.schedule-content p');
                if (contentElement) {
                    contentElement.textContent = content;
                }
            })
            .catch(err => {
                console.error('スケジュールデータ取得エラー:', err);
                const contentElement = scheduleInfoContainer.querySelector('.schedule-content p');
                if (contentElement) {
                    contentElement.textContent = '授業内容を取得できませんでした';
                }
            });

        // モーダルを表示
        console.log('モーダルを表示します');
        modal.classList.remove('hidden');
        console.log('モーダルのクラス:', modal.className);

        // モーダルの閉じるボタンにイベントリスナーを追加
        const closeButtons = modal.querySelectorAll('.comment-modal-close');
        closeButtons.forEach(button => {
            button.onclick = () => {
                modal.classList.add('hidden');
            };
        });

        // オーバーレイクリックでも閉じる
        const overlay = modal.querySelector('.comment-modal-overlay');
        if (overlay) {
            overlay.onclick = (e) => {
                // イベントの伝播を停止
                e.stopPropagation();
                modal.classList.add('hidden');
            };
        }

    } catch (error) {
        console.error('コメントモーダル表示エラー:', error);
    }
}

function showReadCommentModal(subject, teacher, classroom, scheduleId, teacherId) {
    currentScheduleId = scheduleId;
    const modal = document.getElementById('readCommentModal');
    if (!modal) return;

    // 現在の曜日と時限を取得
    const day = currentDay;
    const period = currentPeriod;

    // スケジュール情報を表示
    const scheduleInfoContainer = modal.querySelector('#scheduleInfoContainer');
    if (scheduleInfoContainer) {
        const dayNames = {
            '月': '月曜日',
            '火': '火曜日',
            '水': '水曜日',
            '木': '木曜日',
            '金': '金曜日',
            '土': '土曜日',
            '日': '日曜日'
        };

        const dayJp = dayNames[day] || day;
        scheduleInfoContainer.innerHTML = `
            <div class="schedule-info">
                <div class="schedule-header">
                    <span class="schedule-day-period">${dayJp} ${period}限</span>
                </div>
                <div class="schedule-details">
                    <div class="schedule-subject">${subject || '科目名なし'}</div>
                    <div class="schedule-teacher">担当: ${teacher || '未設定'}</div>
                    <div class="schedule-classroom">教室: ${classroom || '未設定'}</div>
                </div>
            </div>
        `;
    }

    // コメントを読み込む
    loadComments();

    modal.classList.remove('hidden');

    // モーダルの閉じるボタンにイベントリスナーを追加
    const closeButtons = modal.querySelectorAll('.comment-modal-close');
    closeButtons.forEach(button => {
        button.onclick = () => {
            modal.classList.add('hidden');
        };
    });

    // オーバーレイクリックでも閉じる
    const overlay = modal.querySelector('.comment-modal-overlay');
    if (overlay) {
        overlay.onclick = (e) => {
            // イベントの伝播を停止
            e.stopPropagation();
            modal.classList.add('hidden');
        };
    }
}

function hideWriteCommentModal() {
    const modal = document.getElementById('writeCommentModal');
    if (modal) modal.classList.add('hidden');
}

function hideReadCommentModal() {
    const modal = document.getElementById('readCommentModal');
    if (modal) modal.classList.add('hidden');
}

// コメント関連の関数
async function loadComments() {
    if (!currentScheduleId) return;

    try {
        const response = await fetch(`/student/api/comments/${currentScheduleId}`);
        if (!response.ok) {
            throw new Error('コメントの取得に失敗しました');
        }

        const data = await response.json();
        allComments = data.comments || [];

        // コメントを表示
        displayComments(allComments);
    } catch (error) {
        console.error('コメントの読み込みに失敗しました:', error);
    }
}

// コメントを表示する関数を改善
function displayComments(comments) {
    const commentsContainer = document.getElementById('commentsList');

    if (!commentsContainer) {
        console.error('コメントコンテナが見つかりません (ID: commentsList)');
        return;
    }

    commentsContainer.innerHTML = '';

    if (comments.length === 0) {
        commentsContainer.innerHTML = '<div class="no-comments">コメントはまだありません</div>';
        return;
    }

    // 日付順に並べ替え（新しい順）
    const sortedComments = [...comments].sort((a, b) => {
        return new Date(b.created_at) - new Date(a.created_at);
    });

    sortedComments.forEach(comment => {
        const commentElement = document.createElement('div');
        commentElement.className = 'comment-card';

        // 日付を日本語フォーマットに変換
        const date = new Date(comment.created_at);
        const formattedDate = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;

        commentElement.innerHTML = `
            <div class="comment-header">
                <span class="comment-date">${formattedDate}</span>
            </div>
            <div class="comment-body">
                <p class="comment-text">${comment.comment}</p>
            </div>
        `;
        commentsContainer.appendChild(commentElement);
    });
}

function createCommentElement(comment) {
    const commentElement = document.createElement('div');
    commentElement.className = 'comment-item';

    const formattedDate = formatDate(comment.created_at);

    commentElement.innerHTML = `
                <div class="comment-header">
            <div class="comment-author">${comment.student_name || '匿名'}</div>
            <div class="comment-date">${formattedDate}</div>
                </div>
                <div class="comment-content">${comment.content}</div>
            `;

    return commentElement;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        return '今日 ' + date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
        return '昨日 ' + date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    } else {
        return date.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' }) + ' ' +
            date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    }
}

// CSRFトークンを取得する関数を修正
function getCsrfToken() {
    // Flaskでは通常、フォーム内の隠しフィールドとしてCSRFトークンが提供される
    const tokenInput = document.querySelector('input[name="csrf_token"]');
    if (tokenInput) {
        return tokenInput.value;
    }

    // または、metaタグから取得
    const tokenMeta = document.querySelector('meta[name="csrf-token"]');
    if (tokenMeta) {
        return tokenMeta.getAttribute('content');
    }

    // Cookieから取得する方法もある
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        cookie = cookie.trim();
        if (cookie.startsWith('csrf_token=')) {
            return cookie.substring('csrf_token='.length, cookie.length);
        }
    }

    console.warn('CSRFトークンが見つかりません');
    return '';
}

// コメント追加関数を修正
async function addComment(commentText) {
    try {
        if (!currentScheduleId) {
            console.error('スケジュールIDが設定されていません');
            return;
        }

        // デバッグ情報を追加
        console.log('コメント追加リクエスト:', {
            schedule_id: currentScheduleId,
            content: commentText,  // サーバー側のパラメータ名に合わせる
            student_id: document.querySelector('meta[name="student-id"]')?.getAttribute('content') || ''
        });

        // リクエストボディを作成（サーバー側のパラメータ名に合わせる）
        const requestBody = {
            schedule_id: currentScheduleId,
            content: commentText  // サーバー側で期待されるパラメータ名
        };

        // コメントAPIのエンドポイントを確認
        const response = await fetch('/student/api/comments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken()
            },
            body: JSON.stringify(requestBody)
        });

        // レスポンスの詳細をログに出力
        console.log('レスポンスステータス:', response.status);
        const responseText = await response.text();
        console.log('レスポンス本文:', responseText);

        if (!response.ok) {
            throw new Error(`コメントの追加に失敗しました (${response.status}): ${responseText}`);
        }

        // JSONとしてパースし直す
        const result = responseText ? JSON.parse(responseText) : {};
        console.log('コメント追加成功:', result);

        // コメント入力欄をクリア
        const commentInput = document.getElementById('newComment');
        if (commentInput) {
            commentInput.value = '';
        }

        // コメントを再読み込み
        loadComments();

        return result;
    } catch (error) {
        console.error('コメント追加エラー:', error);
        alert('コメントの追加に失敗しました: ' + error.message);
        return null;
    }
}

// 時間割データを一括取得する関数
async function fetchAllScheduleData() {
    try {
        console.log('時間割データを一括取得します');

        // ユーザーIDをメタタグから取得
        const studentId = document.querySelector('meta[name="student-id"]')?.getAttribute('content');
        let url = '/student/api/schedule/batch';

        // student_idパラメータを追加
        if (studentId) {
            url += `?student_id=${studentId}`;
            console.log(`学生ID: ${studentId}でデータを取得します`);
        } else {
            console.warn('学生IDが見つかりません。セッションのIDを使用します。');
        }

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`サーバーエラー: ${response.status}`);
        }

        const data = await response.json();
        console.log('一括取得したデータ:', data);

        // 曜日の変換マップ
        const dayMap = {
            'Monday': '月',
            'Tuesday': '火',
            'Wednesday': '水',
            'Thursday': '木',
            'Friday': '金',
            'Saturday': '土',
            'Sunday': '日'
        };

        // キーを変換したデータを作成
        const convertedData = {};
        for (const key in data) {
            // キーを分解（例: "Friday_1限" → ["Friday", "1限"]）
            const parts = key.split('_');
            if (parts.length === 2) {
                const englishDay = parts[0];
                const periodWithSuffix = parts[1]; // "1限"

                // 数字部分だけを取得
                const period = periodWithSuffix.replace(/[^0-9]/g, '');

                // 日本語の曜日に変換
                const japaneseDay = dayMap[englishDay] || englishDay;

                // 新しいキー形式（例: "月_1"）
                const newKey = `${japaneseDay}_${period}`;

                // 変換したキーでデータを設定
                convertedData[newKey] = data[key];
                console.log(`キー変換: ${key} → ${newKey}`);
            } else {
                // キーの形式が想定外の場合はそのまま使用
                convertedData[key] = data[key];
            }
        }

        console.log('変換後のデータ:', convertedData);
        return convertedData;
    } catch (error) {
        console.error('時間割データの一括取得に失敗:', error);
        return {};
    }
}

// 時間割表示を更新する関数を最適化
async function updateTimetableDisplay() {
    try {
        console.log('時間割表示の更新を開始します');

        // 全データを一度に取得
        const allData = await fetchAllScheduleData();
        console.log('取得したデータ:', allData);

        // エラーチェック
        if (!allData || typeof allData !== 'object') {
            console.error('有効なデータが取得できませんでした:', allData);
            return;
        }

        // セルを更新
        const cells = document.querySelectorAll('.schedule-cell');
        console.log(`更新対象セル数: ${cells.length}`);

        // データがない場合は処理を終了
        if (Object.keys(allData).length === 0) {
            console.warn('時間割データが空です。表示を更新しません。');
            return;
        }

        for (const cell of cells) {
            const day = cell.dataset.day;
            const period = cell.dataset.period;
            const key = `${day}_${period}`;

            console.log(`セル(${day}, ${period})の処理中...`);

            // セルの内容をクリア
            cell.innerHTML = '';
            const content = document.createElement('div');
            content.className = 'cell-content';

            // データがある場合のみ表示
            const data = allData[key];
            if (data && Object.keys(data).length > 0) {
                console.log(`セル(${day}, ${period})にデータあり:`, data);

                try {
                    // 科目名
                    if (data.subject_name) {
                        const subjectName = document.createElement('div');
                        subjectName.className = 'subject-name';
                        subjectName.textContent = data.subject_name;
                        content.appendChild(subjectName);

                        // データ属性を設定
                        content.dataset.scheduleId = data.id;
                    }

                    // 教員名
                    if (data.teacher && data.teacher.name) {
                        const teacherName = document.createElement('div');
                        teacherName.className = 'teacher-name';
                        teacherName.textContent = data.teacher.name;
                        content.appendChild(teacherName);

                        // データ属性を設定
                        content.dataset.teacherId = data.teacher.id;
                    }

                    // 教室
                    if (data.classroom && data.classroom.classroom_id) {
                        const classroomNumber = document.createElement('div');
                        classroomNumber.className = 'classroom-number';
                        classroomNumber.textContent = data.classroom.classroom_id;
                        content.appendChild(classroomNumber);
                    }

                    // セルに内容を追加
                    cell.appendChild(content);
                } catch (cellError) {
                    console.error(`セル(${day}, ${period})の更新中にエラー:`, cellError);
                }
            } else {
                console.log(`セル(${day}, ${period})にデータなし`);
            }
        }

        console.log('時間割表示を更新しました');
    } catch (error) {
        console.error('時間割表示の更新に失敗:', error);
    }
}

// 時間割の更新
async function updateSchedule(day, period, scheduleData) {
    try {
        console.log('送信データ:', scheduleData);

        // 科目名が空でないことを確認
        if (!scheduleData.subject_name || scheduleData.subject_name.trim() === '') {
            alert('科目名を入力してください');
            throw new Error('科目名が空です');
        }

        // ファイルURLの処理
        let fileUrl = scheduleData.schedule_file_url || null;
        if (fileUrl) {
            // クエリパラメータを削除
            fileUrl = fileUrl.split('?')[0];

            // tempファイルパスを修正
            if (fileUrl.includes('temp_')) {
                // 既存のファイルパスを保持
                const originalFileUrl = fileUrl;

                // 一時ファイル名を正規のファイル名に変換
                // 例: /uploads/schedules/temp_1740492854_20024.png → /uploads/schedules/new_20024.png
                const parts = fileUrl.split('/');
                const filename = parts[parts.length - 1];

                // ユーザーIDを抽出（temp_TIMESTAMP_USERID.ext形式を想定）
                const match = filename.match(/temp_\d+_(\d+)\.([^.]+)$/);
                if (match) {
                    const userId = match[1];
                    const ext = match[2];
                    const newFilename = `new_${userId}_${Date.now()}.${ext}`;

                    // 新しいパスを構築
                    parts[parts.length - 1] = newFilename;
                    fileUrl = parts.join('/');

                    console.log(`ファイルパス変更: ${originalFileUrl} → ${fileUrl}`);
                }
            }
        }

        // 送信データの整形
        const dataToSend = {
            subject_name: scheduleData.subject_name,
            teacher_id: scheduleData.teacher_id || null,
            classroom_id: scheduleData.classroom_id || null,
            schedule_file_url: fileUrl,
            content: scheduleData.content || null,
            floor: scheduleData.floor || null,
            // ファイル処理フラグを追加
            rename_temp_file: true
        };

        console.log('送信するデータ:', dataToSend);

        const response = await fetch(`${TIMETABLE_API_ENDPOINT}?day=${day}&period=${period}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken()
            },
            body: JSON.stringify(dataToSend)
        });

        console.log('サーバーレスポンス:', response);

        if (!response.ok) {
            let errorMessage = '時間割の更新に失敗しました';
            try {
                const responseData = await response.json();
                console.log('エラーレスポンスデータ:', responseData);
                errorMessage = responseData.error || errorMessage;
            } catch (e) {
                console.error('エラーレスポンスの解析に失敗:', e);
            }

            alert(errorMessage);
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorMessage}`);
        }

        const responseData = await response.json();
        console.log('レスポンスデータ:', responseData);

        // 成功メッセージを表示
        alert('時間割を更新しました');

        // モーダルを閉じる
        const modal = document.getElementById('scheduleEditModal');
        if (modal) modal.remove();

        // 教員名を含めるために教員情報を取得
        if (dataToSend.teacher_id && window.allTeachers) {
            const teacherId = dataToSend.teacher_id.toString();
            const teacher = window.allTeachers.find(t =>
                (t.id && t.id.toString() === teacherId) ||
                (t.teacher_id && t.teacher_id.toString() === teacherId)
            );

            if (teacher) {
                scheduleData.teacher = { name: teacher.name, id: dataToSend.teacher_id };
                console.log('教員情報を設定:', scheduleData.teacher);
            } else {
                console.warn(`教員ID ${teacherId} に対応する教員が見つかりません`);
                // 教員リストをログ出力して確認
                console.log('利用可能な教員リスト:', window.allTeachers);
            }
        }

        // セルの内容を更新（ページ再読み込みなし）
        updateCellContent(day, period, scheduleData);

        return responseData;
    } catch (error) {
        console.error('時間割の更新に失敗しました:', error);
        throw error;
    }
}

// セルの内容を更新する関数
function updateCellContent(day, period, scheduleData) {
    console.log('updateCellContent called with data:', scheduleData);

    // 対象のセルを取得
    const cell = document.querySelector(`.schedule-cell[data-day="${day}"][data-period="${period}"]`);
    if (!cell) {
        console.error(`セルが見つかりません: day=${day}, period=${period}`);
        return;
    }

    // セル内のコンテンツ要素を取得または作成
    let content = cell.querySelector('.cell-content');
    if (!content) {
        content = document.createElement('div');
        content.className = 'cell-content';
        cell.appendChild(content);
    }

    // 科目名
    const subjectName = scheduleData.subject_name || '';

    // 教員名の取得（複数の方法で試行）
    let teacherName = '';

    // 1. scheduleData.teacher.nameから直接取得
    if (scheduleData.teacher && scheduleData.teacher.name) {
        teacherName = scheduleData.teacher.name;
        console.log('教員名をteacher.nameから取得:', teacherName);
    }
    // 2. teacher_idとwindow.allTeachersから取得
    else if (scheduleData.teacher_id && window.allTeachers) {
        // 教員IDを文字列に変換して比較
        const teacherId = scheduleData.teacher_id.toString();
        const teacher = window.allTeachers.find(t =>
            (t.id && t.id.toString() === teacherId) ||
            (t.teacher_id && t.teacher_id.toString() === teacherId)
        );

        if (teacher) {
            teacherName = teacher.name;
            console.log('教員名をallTeachersから取得:', teacherName);
        } else {
            console.warn(`教員ID ${teacherId} に対応する教員が見つかりません`);
            // 教員リストをログ出力して確認
            console.log('利用可能な教員リスト:', window.allTeachers);
        }
    }

    // 教室番号
    let classroomNumber = '';
    if (scheduleData.classroom && scheduleData.classroom.classroom_id) {
        classroomNumber = scheduleData.classroom.classroom_id;
    } else if (scheduleData.classroom_id) {
        classroomNumber = scheduleData.classroom_id;
    }

    console.log('更新する内容:', {
        subjectName,
        teacherName,
        classroomNumber,
        teacher_id: scheduleData.teacher_id,
        teacher: scheduleData.teacher
    });

    // コンテンツを更新
    content.innerHTML = `
        <div class="subject-name">${subjectName}</div>
        <div class="teacher-name">${teacherName}</div>
        <div class="classroom-number">${classroomNumber}</div>
    `;

    // データ属性を更新
    if (scheduleData.id) {
        content.dataset.scheduleId = scheduleData.id;
    }

    // 教員IDをデータ属性に設定
    if (scheduleData.teacher_id) {
        content.dataset.teacherId = scheduleData.teacher_id;
    } else if (scheduleData.teacher && scheduleData.teacher.id) {
        content.dataset.teacherId = scheduleData.teacher.id;
    }

    // PDFボタンを追加
    if (scheduleData.schedule_file_url) {
        const pdfButton = document.createElement('div');
        pdfButton.className = 'pdf-button';
        pdfButton.innerHTML = '<img src="/static/common/img/feather/file-text.svg" alt="PDF" width="16" height="16">';
        pdfButton.onclick = (e) => {
            e.stopPropagation();  // セルのクリックイベントを停止
            window.open(scheduleData.schedule_file_url, '_blank');
        };
        cell.appendChild(pdfButton);
    }

    console.log(`セル内容を更新完了: day=${day}, period=${period}, subject=${subjectName}, teacher=${teacherName}`);
}

// 時間割の削除
async function deleteSchedule(day, period) {
    try {
        // URLを修正
        const response = await fetch(`/student/api/schedule/cell?day=${day}&period=${period}`, {
            method: 'DELETE',
            headers: {
                'X-CSRFToken': getCsrfToken()  // CSRFトークンを追加
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('時間割の削除に失敗しました:', error);
        throw error;
    }
}

// セルのクリックイベントハンドラ
function handleCellClick(e) {
    const cell = this;
    const day = cell.dataset.day;
    const period = cell.dataset.period;

    // 現在の曜日と時限を保存
    currentDay = day;
    currentPeriod = period;

    console.log(`セルクリック: day=${day}, period=${period}, 編集モード=${isEditMode}`);

    // 編集モードの場合
    if (isEditMode) {
        // 編集モードの場合は編集モーダルを表示（既存データは取得しない）
        showEditModal(day, period);
    } else {
        // 閲覧モードの場合はファイル表示処理
        fetchTimetableData(day, period)
            .then(data => {
                if (data && data.schedule_file_url) {
                    // ファイルビューアで表示
                    showScheduleFile(data.subject_name, data.schedule_file_url);
                } else {
                    console.log('スケジュールファイルがありません');
                }
            })
            .catch(error => console.error('スケジュールデータ取得エラー:', error));
    }
}

// 時間割データを取得する関数
async function fetchTimetableData(day, period) {
    try {
        console.log(`時間割データを取得: day=${day}, period=${period}`);

        // ユーザーIDをメタタグから取得
        const studentId = document.querySelector('meta[name="student-id"]')?.getAttribute('content');
        let url = `/student/api/schedule/cell?day=${day}&period=${period}`;

        // student_idパラメータを追加
        if (studentId) {
            url += `&student_id=${studentId}`;
        }

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`サーバーエラー: ${response.status}`);
        }

        const data = await response.json();
        console.log('取得したセルデータ:', data);

        // スケジュールIDを保存
        if (data && data.id) {
            currentScheduleId = data.id;
            console.log(`現在のスケジュールID: ${currentScheduleId}`);
        }

        return data;
    } catch (error) {
        console.error('時間割データの取得に失敗:', error);
        return null;
    }
}

// スケジュールファイルを表示する関数
function showScheduleFile(title, fileUrl) {
    console.log(`ファイル表示: ${title}, URL=${fileUrl}`);

    // ファイルビューア要素を取得
    const fileViewer = document.querySelector('.schedule-file-viewer-container');
    const pdfViewer = document.getElementById('scheduleFileViewer');
    const imageViewer = document.getElementById('scheduleImageViewer');
    const fileViewerTitle = document.getElementById('fileViewerTitle');

    if (!fileViewer || !pdfViewer || !imageViewer || !fileViewerTitle) {
        console.error('ファイルビューア要素が見つかりません');
        return;
    }

    // タイトルを設定
    fileViewerTitle.textContent = title || 'スケジュールファイル';

    // ファイルの種類に応じて表示方法を変更
    const fileExtension = getFileExtension(fileUrl);
    console.log('ファイル拡張子:', fileExtension);

    // URLを正規化（必要に応じて代替パスを試す）
    const normalizedUrl = normalizeFileUrl(fileUrl);

    if (isPdfFile(fileExtension)) {
        // PDFの場合
        pdfViewer.style.display = 'block';
        imageViewer.style.display = 'none';

        // PDFビューアにURLを設定
        pdfViewer.src = normalizedUrl;

        // モバイルでもPDFを直接表示するが、代替リンクも提供
        if (isMobileDevice()) {
            // PDFリンクを表示（ダウンロード用）
            const pdfLinkContainer = document.createElement('div');
            pdfLinkContainer.className = 'pdf-link-container';
            pdfLinkContainer.innerHTML = `
                <p>PDFが表示されない場合:</p>
                <div class="pdf-action-buttons">
                    <button class="btn btn-primary pdf-view-btn" onclick="window.open('${normalizedUrl}', '_blank')">
                        <img src="/static/common/img/feather/external-link.svg" alt="開く" width="16" height="16">
                        別ウィンドウで開く
                    </button>
                    <a href="${normalizedUrl}" download="${title || 'schedule'}.pdf" class="btn btn-secondary pdf-download-btn">
                        <img src="/static/common/img/feather/download.svg" alt="ダウンロード" width="16" height="16">
                        ダウンロード
                    </a>
                </div>
            `;

            // 既存のPDFリンクを削除
            const existingLink = fileViewer.querySelector('.pdf-link-container');
            if (existingLink) {
                existingLink.remove();
            }

            // PDFビューアの後に挿入
            pdfViewer.parentNode.insertBefore(pdfLinkContainer, pdfViewer.nextSibling);
        }
    } else if (isImageFile(fileExtension)) {
        // 画像の場合
        pdfViewer.style.display = 'none';
        imageViewer.style.display = 'block';

        // 画像の読み込みを確認
        const tempImg = new Image();
        tempImg.onload = function () {
            imageViewer.src = normalizedUrl;
            console.log('画像の読み込みに成功しました');
        };
        tempImg.onerror = function () {
            console.error('画像の読み込みに失敗しました');
            // 代替パスを試す
            tryAlternativeFilePath(imageViewer, normalizedUrl);
        };
        tempImg.src = normalizedUrl;
    } else {
        // その他のファイル形式
        pdfViewer.style.display = 'none';
        imageViewer.style.display = 'none';

        // ダウンロードリンクを表示
        const downloadLinkContainer = document.createElement('div');
        downloadLinkContainer.className = 'download-link-container';
        downloadLinkContainer.innerHTML = `
            <p>このファイル形式はプレビューできません</p>
            <a href="${normalizedUrl}" download="${title || 'file'}.${fileExtension}" class="file-download-link">ファイルをダウンロード</a>
        `;

        // 既存のダウンロードリンクを削除
        const existingLink = fileViewer.querySelector('.download-link-container');
        if (existingLink) {
            existingLink.remove();
        }

        // ビューアの後に挿入
        pdfViewer.parentNode.insertBefore(downloadLinkContainer, pdfViewer.nextSibling);
    }

    // ファイルビューアを表示
    fileViewer.style.display = 'block';
}

// ファイルURLを正規化する関数
function normalizeFileUrl(url) {
    if (!url) return '';

    // URLを正規化
    let normalizedUrl = url;

    // 先頭にスラッシュがない場合は追加
    if (!normalizedUrl.startsWith('/')) {
        normalizedUrl = '/' + normalizedUrl;
    }

    // 相対パスを絶対パスに変換
    if (!normalizedUrl.startsWith('http')) {
        // 現在のオリジンを取得
        const origin = window.location.origin;
        normalizedUrl = origin + normalizedUrl;
    }

    console.log('正規化されたURL:', normalizedUrl);
    return normalizedUrl;
}

// モバイルデバイスかどうかを判定する関数
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
}

// ファイルの代替パスを試す関数
function tryAlternativeFilePath(element, originalUrl) {
    // 代替パスのリスト
    const alternativePaths = [
        originalUrl.replace('/static/', '/'),
        originalUrl.replace('/uploads/', '/static/uploads/'),
        originalUrl.replace('/uploads/', '/'),
        // ファイル名だけを使用した代替パス
        `/uploads/schedules/${originalUrl.split('/').pop()}`
    ];

    console.log('ファイルの代替パスを試行:', alternativePaths);

    // 順番に試す
    tryNextPath(0);

    function tryNextPath(index) {
        if (index >= alternativePaths.length) {
            console.error('すべての代替パスが失敗しました');
            // エラーメッセージを表示
            const errorMsg = document.createElement('div');
            errorMsg.className = 'file-error-message';
            errorMsg.textContent = 'ファイルを読み込めませんでした';
            element.parentNode.insertBefore(errorMsg, element.nextSibling);
            return;
        }

        const path = alternativePaths[index];
        console.log(`代替パス ${index + 1} を試行:`, path);

        const tempElement = element.tagName === 'IMG' ? new Image() : document.createElement('embed');

        tempElement.onload = function () {
            console.log(`代替パス ${index + 1} が成功:`, path);
            element.src = path;

            // エラーメッセージがあれば削除
            const errorMsg = element.parentNode.querySelector('.file-error-message');
            if (errorMsg) errorMsg.remove();
        };

        tempElement.onerror = function () {
            console.log(`代替パス ${index + 1} が失敗:`, path);
            tryNextPath(index + 1);
        };

        if (element.tagName === 'IMG') {
            tempElement.src = path;
        } else {
            tempElement.src = path;
            // embedの場合はonloadイベントが発火しない場合があるので、タイムアウトを設定
            setTimeout(() => {
                if (!tempElement.complete) {
                    tempElement.onerror();
                }
            }, 2000);
        }
    }
}

// 編集モーダルを表示する関数（統合版）
function showEditModal(day, period, existingData = null) {
    console.log(`編集モーダルを表示: day=${day}, period=${period}`);

    // モーダル要素を取得
    const modal = document.getElementById('editScheduleModal');
    if (!modal) {
        console.error('編集モーダルが見つかりません (ID: editScheduleModal)');
        return;
    }

    // 曜日と時限をセット
    document.getElementById('edit-day').value = day;
    document.getElementById('edit-period').value = period;

    // 既存データがある場合はそれを使用
    if (existingData) {
        populateModalWithData(existingData);
        modal.classList.remove('hidden');
        return;
    }

    // 既存のデータがなければ取得して表示
    fetchTimetableData(day, period)
        .then(data => {
            console.log('編集モーダル用のデータを取得:', data);

            if (data) {
                populateModalWithData(data);
            }
        })
        .catch(error => {
            console.error('スケジュールデータの取得に失敗:', error);
        })
        .finally(() => {
            // モーダルを表示
            modal.classList.remove('hidden');

            // 閉じるボタンのイベントリスナーを設定
            const closeButton = modal.querySelector('.modal-close');
            if (closeButton) {
                closeButton.onclick = hideEditModal;
            }

            // 保存ボタンのイベントリスナーを設定
            const saveButton = modal.querySelector('#save-schedule-btn');
            if (saveButton) {
                saveButton.onclick = handleSaveSchedule;
            }

            // 削除ボタンのイベントリスナーを設定
            const deleteButton = modal.querySelector('#delete-schedule-btn');
            if (deleteButton) {
                deleteButton.onclick = function () {
                    if (confirm('このスケジュールを削除してもよろしいですか？')) {
                        deleteSchedule(day, period)
                            .then(result => {
                                if (result && result.success) {
                                    // セルの内容をクリア
                                    clearCellContent(day, period);

                                    // モーダルを閉じる
                                    hideEditModal();

                                    // 成功メッセージを表示
                                    showMessage('スケジュールを削除しました', 'success');
                                }
                            })
                            .catch(error => {
                                console.error('スケジュール削除エラー:', error);
                                showMessage('スケジュールの削除に失敗しました', 'error');
                            });
                    }
                };
            }
        });
}

// モーダルにデータを入力する関数
function populateModalWithData(data) {
    console.log('モーダルにデータを入力:', data);

    // 科目選択
    if (data.subject_id) {
        document.getElementById('edit-subject').value = data.subject_id;
    }

    // 教員選択
    const teacherSelect = document.getElementById('edit-teacher');
    if (teacherSelect) {
        console.log('教員選択要素:', teacherSelect);
        console.log('教員選択オプション数:', teacherSelect.options.length);

        // 教員IDを取得（複数の場所から可能性を確認）
        let teacherId = null;

        if (data.teacher && data.teacher.teacher_id) {
            teacherId = data.teacher.teacher_id;
            console.log('教員IDをteacher.teacher_idから取得:', teacherId);
        } else if (data.teacher && data.teacher.id) {
            teacherId = data.teacher.id;
            console.log('教員IDをteacher.idから取得:', teacherId);
        } else if (data.teacher_id) {
            teacherId = data.teacher_id;
            console.log('教員IDをteacher_idから取得:', teacherId);
        }

        if (teacherId) {
            // 教員IDを文字列に変換して比較
            const teacherIdStr = teacherId.toString();
            console.log('教員ID（文字列）:', teacherIdStr);

            // セレクトボックスのオプションを確認
            let optionFound = false;
            for (const option of teacherSelect.options) {
                console.log(`オプション: value=${option.value}, text=${option.text}`);
                if (option.value === teacherIdStr) {
                    teacherSelect.value = teacherIdStr;
                    optionFound = true;
                    console.log('教員選択を設定:', teacherIdStr);
                    break;
                }
            }

            if (!optionFound) {
                console.warn(`教員ID ${teacherIdStr} に対応するオプションが見つかりません`);
            }
        }
    } else {
        console.error('教員選択要素が見つかりません (ID: edit-teacher)');
    }

    // 教室選択
    if (data.classroom_id) {
        document.getElementById('edit-classroom').value = data.classroom_id;
    } else if (data.classroom && data.classroom.classroom_id) {
        document.getElementById('edit-classroom').value = data.classroom.classroom_id;
    }

    // 内容
    if (data.content) {
        document.getElementById('edit-content').value = data.content;
    }

    // ファイル情報
    const fileInfoElement = document.getElementById('edit-file-info');
    if (fileInfoElement && data.schedule_file_url) {
        fileInfoElement.innerHTML = `
            <p>現在のファイル: <a href="${data.schedule_file_url}" target="_blank">${data.schedule_file_name || '添付ファイル'}</a></p>
        `;
        fileInfoElement.style.display = 'block';
    } else if (fileInfoElement) {
        fileInfoElement.innerHTML = '';
        fileInfoElement.style.display = 'none';
    }
}

// 編集モードの更新
function updateEditMode() {
    const cells = document.querySelectorAll('.schedule-cell');
    const pdfLoadBtn = document.getElementById('loadPdfBtn');

    if (isEditMode) {
        // 編集モードの場合
        document.body.classList.add('edit-mode');
        cells.forEach(cell => {
            cell.classList.add('editable');
        });
        // PDF読み込みボタンを表示
        if (pdfLoadBtn) pdfLoadBtn.style.display = 'flex';
    } else {
        // 閲覧モードの場合
        document.body.classList.remove('edit-mode');
        cells.forEach(cell => {
            cell.classList.remove('editable');
        });
        // PDF読み込みボタンを非表示
        if (pdfLoadBtn) pdfLoadBtn.style.display = 'none';
    }
}

// 編集モード用のモーダルを表示
function showEditModal(day, period, existingData = null) {
    // 既存のモーダルを削除
    const existingModal = document.getElementById('scheduleEditModal');
    if (existingModal) {
        existingModal.remove();
    }

    // 既存データがない場合は取得する
    if (!existingData) {
        fetchTimetableData(day, period)
            .then(data => {
                if (data && Object.keys(data).length > 0) {
                    showEditModal(day, period, data);
                } else {
                    // データがない場合は空のモーダルを表示
                    createAndShowModal(day, period, null);
                }
            })
            .catch(err => {
                console.error('スケジュールデータ取得エラー:', err);
                createAndShowModal(day, period, null);
            });
        return;
    }

    // モーダルを作成して表示する関数
    createAndShowModal(day, period, existingData);
}

// モーダルを作成して表示する関数
function createAndShowModal(day, period, existingData) {
    console.log('モーダル作成 - 既存データ:', existingData);

    // モーダルHTMLを作成
    const modalHtml = `
        <div id="scheduleEditModal" class="schedule-edit-modal">
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${day}曜${period}限の授業設定</h3>
                    <button class="modal-close">×</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="subjectName">科目名 <span class="required">*</span></label>
                        <input type="text" id="subjectName" placeholder="例: プログラミング基礎" value="${existingData?.subject_name || ''}">
                    </div>
                    <div class="form-group">
                        <label for="teacherId">担当教員</label>
                        <select id="teacherId">
                            <option value="">選択してください</option>
                            <!-- 教員リストはAPIから取得して動的に追加 -->
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="floorSelect">階数</label>
                        <select id="floorSelect" onchange="updateClassroomOptions()">
                            <option value="">選択してください</option>
                            <option value="7">7階</option>
                            <option value="8">8階</option>
                            <option value="9">9階</option>
                            <option value="10">10階</option>
                            <option value="11">11階</option>
                            <option value="12">12階</option>
                            <option value="13">13階</option>
                            <option value="14">14階</option>
                            <option value="15">15階</option>
                            <option value="16">16階</option>
                            <option value="17">17階</option>
                            <option value="18">18階</option>
                            <option value="19">19階</option>
                            <option value="20">20階</option>
                            <option value="21">21階</option>
                            <option value="22">22階</option>
                            <option value="23">23階</option>
                            <option value="24">24階</option>
                            <option value="25">25階</option>
                            <option value="26">26階</option>
                            <option value="27">27階</option>
                            <option value="28">28階</option>
                            <option value="29">29階</option>
                            <option value="30">30階</option>
                            <option value="31">31階</option>
                            <option value="32">32階</option>
                            <option value="33">33階</option>
                            <option value="34">34階</option>
                            <option value="35">35階</option>
                            <option value="36">36階</option>
                            <option value="37">37階</option>
                            <option value="38">38階</option>
                            <option value="39">39階</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="classroomId">教室番号</label>
                        <select id="classroomId">
                            <option value="">選択してください</option>
                            <!-- 教室リストはAPIから取得して動的に追加 -->
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="scheduleFileUrl">資料URL</label>
                        <div class="url-input-container">
                            <input type="text" id="scheduleFileUrl" placeholder="例: https://example.com/file.pdf" value="${existingData?.schedule_file_url || ''}">
                            <button type="button" class="browse-btn" onclick="browseFiles()">参照</button>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="content">内容</label>
                        <textarea id="content" rows="3" placeholder="授業の内容を入力してください">${existingData?.content || ''}</textarea>
                    </div>
                    <div class="modal-actions">
                        <button class="save-btn">保存</button>
                        ${existingData ? '<button class="delete-btn">削除</button>' : ''}
                        <button class="cancel-btn">キャンセル</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const modal = document.getElementById('scheduleEditModal');
    const closeBtn = modal.querySelector('.modal-close');
    const saveBtn = modal.querySelector('.save-btn');
    const deleteBtn = modal.querySelector('.delete-btn');
    const cancelBtn = modal.querySelector('.cancel-btn');
    const overlay = modal.querySelector('.modal-overlay');
    const teacherSelect = document.getElementById('teacherId');
    const floorSelect = document.getElementById('floorSelect');

    // 全教室データを保持するグローバル変数
    window.allClassrooms = [];

    // 教室リストを取得
    fetchClassrooms().then(classrooms => {
        window.allClassrooms = classrooms;
        console.log('取得した教室リスト:', classrooms);

        // 既存データがある場合は階数と教室を設定
        if (existingData?.classroom) {
            console.log('既存の教室データ:', existingData.classroom);
            const classroomId = existingData.classroom.classroom_id;

            if (classroomId) {
                console.log('教室ID:', classroomId);

                // 教室IDから階数を取得（文字列として扱う）
                const classroomIdStr = classroomId.toString();
                let floor = '';

                // 教室IDの形式に基づいて階数を抽出
                if (classroomIdStr.length >= 3) {
                    // 例: 1901 -> 19階
                    floor = classroomIdStr.substring(0, 2);
                } else if (classroomIdStr.length === 2) {
                    // 例: 91 -> 9階
                    floor = classroomIdStr.substring(0, 1);
                }

                console.log('設定する階数:', floor);

                if (floor) {
                    // 階数を選択
                    const floorSelect = document.getElementById('floorSelect');
                    if (floorSelect) {
                        floorSelect.value = floor;
                        console.log('階数を設定:', floor);

                        // 階数に基づいて教室リストを更新
                        updateClassroomOptions();

                        // 教室を選択（遅延を長めに設定）
                        setTimeout(() => {
                            const classroomSelect = document.getElementById('classroomId');
                            if (classroomSelect) {
                                classroomSelect.value = classroomId;
                                console.log('教室を選択:', classroomId);
                            } else {
                                console.error('教室選択要素が見つかりません');
                            }
                        }, 500);
                    } else {
                        console.error('階数選択要素が見つかりません');
                    }
                }
            }
        }
    });

    // 教員リストを取得して選択肢を設定
    fetchTeachers().then(teachers => {
        // グローバル変数に保存
        window.allTeachers = teachers;
        console.log('取得した教員リスト:', teachers);

        teachers.forEach(teacher => {
            const option = document.createElement('option');
            option.value = teacher.teacher_id || teacher.id;
            option.textContent = teacher.name;
            teacherSelect.appendChild(option);
        });

        // 既存データがある場合は選択状態にする
        if (existingData?.teacher) {
            console.log('既存の教員データ:', existingData.teacher);

            // 教員IDを取得（複数の場所から可能性を確認）
            let teacherId = null;

            if (existingData.teacher.teacher_id) {
                teacherId = existingData.teacher.teacher_id;
                console.log('教員IDをteacher.teacher_idから取得:', teacherId);
            } else if (existingData.teacher.id) {
                teacherId = existingData.teacher.id;
                console.log('教員IDをteacher.idから取得:', teacherId);
            }

            if (teacherId) {
                // 教員IDを文字列に変換
                const teacherIdStr = teacherId.toString();
                console.log('教員ID（文字列）:', teacherIdStr);

                // セレクトボックスの値を設定
                teacherSelect.value = teacherIdStr;
                console.log('教員選択を設定:', teacherIdStr);
            }
        } else if (existingData?.teacher_id) {
            teacherSelect.value = existingData.teacher_id;
            console.log('teacher_idから教員選択を設定:', existingData.teacher_id);
        }
    });

    // 階数選択に基づいて教室リストを更新する関数
    window.updateClassroomOptions = function () {
        const floorSelect = document.getElementById('floorSelect');
        const classroomSelect = document.getElementById('classroomId');
        const selectedFloor = floorSelect.value;

        console.log('選択された階数:', selectedFloor);

        // 教室選択をリセット
        classroomSelect.innerHTML = '<option value="">選択してください</option>';

        if (!selectedFloor) return;

        // 選択された階数に基づいて教室をフィルタリング
        const filteredClassrooms = window.allClassrooms.filter(classroom => {
            // 教室IDを文字列として扱う
            const classroomIdStr = classroom.classroom_id.toString();

            // 階数が1桁か2桁かで処理を分ける
            if (selectedFloor.length === 1) {
                // 1桁の階数（例: 7階）
                return classroomIdStr.startsWith(selectedFloor);
            } else {
                // 2桁の階数（例: 19階）
                return classroomIdStr.startsWith(selectedFloor);
            }
        });

        console.log('フィルタリングされた教室:', filteredClassrooms);

        // 教室リストを追加
        filteredClassrooms.forEach(classroom => {
            const option = document.createElement('option');
            option.value = classroom.classroom_id;
            option.textContent = `${classroom.classroom_id}`;
            classroomSelect.appendChild(option);
        });
    };

    // モーダルを閉じる処理
    const closeModal = () => modal.remove();
    closeBtn.onclick = closeModal;
    overlay.onclick = closeModal;
    if (cancelBtn) cancelBtn.onclick = closeModal;

    // ファイル参照機能
    window.browseFiles = function () {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.pdf,.png,.jpg,.jpeg';

        input.onchange = async function (e) {
            if (e.target.files.length > 0) {
                const file = e.target.files[0];
                console.log('選択されたファイル:', file);

                // ファイル形式を確認
                const fileExt = file.name.split('.').pop().toLowerCase();
                const allowedExts = ['pdf', 'png', 'jpg', 'jpeg'];

                if (!allowedExts.includes(fileExt)) {
                    alert('アップロードできるのはPDFまたは画像ファイル(PNG, JPG)のみです。');
                    return;
                }

                // FormDataを作成してファイルを追加
                const formData = new FormData();
                formData.append('file', file);

                // 現在の曜日と時限を追加
                formData.append('day', currentDay);
                formData.append('period', currentPeriod);

                // 強制上書きフラグを追加
                formData.append('force_overwrite', 'true');

                try {
                    console.log('ファイルアップロード開始');
                    // CSRFトークンを取得
                    const csrfToken = getCsrfToken();

                    // ファイルをアップロード
                    const response = await fetch('/student/api/upload_schedule_file', {
                        method: 'POST',
                        headers: {
                            'X-CSRFToken': csrfToken
                        },
                        body: formData
                    });

                    console.log('アップロードレスポンス:', response);

                    if (!response.ok) {
                        const errorText = await response.text();
                        console.error('アップロードエラーレスポンス:', errorText);
                        throw new Error(`ファイルのアップロードに失敗しました (${response.status}): ${errorText}`);
                    }

                    const result = await response.json();
                    console.log('アップロード成功:', result);

                    // アップロードされたファイルのURLをフィールドに設定
                    let fileUrl = result.file_url;
                    if (!fileUrl.startsWith('/')) {
                        fileUrl = '/' + fileUrl;
                    }

                    console.log('設定するファイルURL:', fileUrl);

                    // URLを入力フィールドに設定
                    const urlInput = document.getElementById('scheduleFileUrl');
                    urlInput.value = fileUrl;

                    // 成功メッセージを表示
                    alert(`ファイル「${file.name}」のアップロードが完了しました`);

                } catch (error) {
                    console.error('ファイルアップロードエラー:', error);
                    alert('ファイルのアップロードに失敗しました: ' + error.message);
                    document.getElementById('scheduleFileUrl').value = '';
                }
            }
        };

        input.click();
    };

    // 保存ボタンの処理
    saveBtn.onclick = async () => {
        const subjectNameField = document.getElementById('subjectName');
        console.log('科目名フィールド要素:', subjectNameField);

        const subjectName = subjectNameField ? subjectNameField.value.trim() : '';
        console.log('取得した科目名:', subjectName);

        // 科目名が空の場合は警告
        if (!subjectName) {
            alert('科目名を入力してください');
            return;
        }

        // 送信データを作成
        const scheduleData = {
            subject_name: subjectName,
            teacher_id: document.getElementById('teacherId').value,
            classroom_id: document.getElementById('classroomId').value,
            schedule_file_url: document.getElementById('scheduleFileUrl').value.trim(),
            content: document.getElementById('content').value.trim(),
            floor: document.getElementById('floorSelect').value // 階数も送信
        };

        console.log('送信データ:', scheduleData);

        try {
            saveBtn.disabled = true;
            saveBtn.textContent = '保存中...';

            const result = await updateSchedule(day, period, scheduleData);
            if (result) {
                console.log('時間割を更新しました:', result);
                await updateTimetableDisplay();
                closeModal();
            }
        } catch (error) {
            console.error('時間割の更新に失敗しました:', error);
            alert('時間割の更新に失敗しました: ' + (error.message || '不明なエラー'));
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = '保存';
        }
    };

    // 削除ボタンの処理
    if (deleteBtn) {
        deleteBtn.onclick = async () => {
            if (confirm('この時間割を削除してもよろしいですか？')) {
                try {
                    deleteBtn.disabled = true;
                    deleteBtn.textContent = '削除中...';

                    const result = await deleteSchedule(day, period);
                    if (result && result.success) {
                        console.log('時間割を削除しました');
                        await updateTimetableDisplay();
                        closeModal();
                    } else {
                        throw new Error('削除に失敗しました');
                    }
                } catch (error) {
                    console.error('時間割の削除に失敗しました:', error);
                    alert('時間割の削除に失敗しました');
                } finally {
                    deleteBtn.disabled = false;
                    deleteBtn.textContent = '削除';
                }
            }
        };
    }

    // 入力フィールドにフォーカス
    document.getElementById('subjectName').focus();

    // 科目名フィールドの確認
    const subjectNameField = document.getElementById('subjectName');
    console.log('科目名フィールド:', subjectNameField);
    if (subjectNameField) {
        if (existingData && existingData.subject_name) {
            // モーダル内のinputフィールドに値を設定
            subjectNameField.value = existingData.subject_name;
            console.log('既存の科目名を設定:', existingData.subject_name);
        }
    } else {
        console.error('科目名フィールドが見つかりません');
    }
}

// 教員リストを取得
async function fetchTeachers() {
    try {
        const response = await fetch('/student/api/teachers');
        if (!response.ok) {
            throw new Error('教員リストの取得に失敗しました');
        }
        const teachers = await response.json();
        // グローバル変数に保存して後で参照できるようにする
        window.allTeachers = teachers;
        return teachers;
    } catch (error) {
        console.error('教員リストの取得に失敗しました:', error);
        return [];
    }
}

// 教室リストを取得
async function fetchClassrooms() {
    try {
        console.log('教室リスト取得開始');
        const response = await fetch('/student/api/classrooms');
        if (!response.ok) {
            throw new Error('教室リストの取得に失敗しました');
        }
        const data = await response.json();
        console.log('教室リスト取得成功:', data);
        return data;
    } catch (error) {
        console.error('教室リストの取得に失敗しました:', error);
        return [];
    }
}

// ページ読み込み時の処理を修正
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOMContentLoaded: 時間割表示の初期化');

    // ファイルビューア要素の初期化を確認
    initFileViewer();

    // 編集モードのトグル処理
    const toggleCheckbox = document.getElementById('edit-mode-toggle');

    if (toggleCheckbox) {
        toggleCheckbox.addEventListener('change', function () {
            isEditMode = this.checked;
            updateEditMode();
            console.log('トグル状態:', isEditMode ? '編集モード' : '閲覧モード');
        });
    } else {
        console.error('トグルボタンが見つかりません');
    }

    // 初期表示時に時間割を更新
    updateTimetableDisplay();

    // コメントモーダル関連のイベントリスナーを削除
    /*
    const closeButtons = document.querySelectorAll('.comment-modal-close');
    const overlays = document.querySelectorAll('.comment-modal-overlay');
    const addCommentBtn = document.getElementById('addComment');
    */

    // セルのクリックイベント設定（表示更新後に再設定）
    const cells = document.querySelectorAll('.schedule-cell');
    cells.forEach(cell => {
        cell.addEventListener('click', handleCellClick);

        // ダブルクリックイベントを削除
        /*
        cell.addEventListener('dblclick', function (e) {
            // ... コメント関連のコードを削除 ...
        });
        */
    });

    // PDF読み込みボタンのイベントリスナーを設定
    const loadPdfBtn = document.getElementById('loadPdfBtn');
    if (loadPdfBtn) {
        loadPdfBtn.addEventListener('click', function () {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.pdf';
            input.onchange = async function (e) {
                if (e.target.files.length > 0) {
                    selectedFile = e.target.files[0];
                    showPdfPlacementModal(selectedFile);
                }
            };
            input.click();
        });
    }
});

// モバイル用のタブ切り替え機能を初期化する関数
function initMobileTabs() {
    if (!isMobileDevice()) return;

    const buildingSection = document.querySelector('.building-section');
    if (!buildingSection) return;

    // 既存の要素を取得
    const elevatorCard = buildingSection.querySelector('.elevator-card:nth-child(1)');
    const floorMapCard = buildingSection.querySelector('.elevator-card:nth-child(2)');

    if (!elevatorCard || !floorMapCard) return;

    // タブコンテンツの配列
    const tabContents = [
        { id: 'elevator-tab', element: elevatorCard, title: 'エレベーター停止階' },
        { id: 'floor-map-tab', element: floorMapCard, title: 'フロアマップ' }
    ];

    // 現在のタブインデックス
    let currentTabIndex = 0;

    // タブコンテナを作成
    const tabContainer = document.createElement('div');
    tabContainer.className = 'tab-container';

    // 矢印ボタンを作成
    const arrowsHtml = `
        <div class="tab-arrows">
            <button class="tab-arrow tab-arrow-left">
                <img src="/static/common/img/feather/chevron-left.svg" alt="前へ" width="16" height="16">
            </button>
            <button class="tab-arrow tab-arrow-right">
                <img src="/static/common/img/feather/chevron-right.svg" alt="次へ" width="16" height="16">
            </button>
        </div>
    `;

    // タブコンテナにHTML追加（タイトルなし）
    tabContainer.innerHTML = arrowsHtml;

    // 既存の要素をタブコンテンツとして包む
    tabContents.forEach((tab, index) => {
        tab.element.classList.add('tab-content');
        tab.element.id = tab.id;
        if (index === 0) {
            tab.element.classList.add('active');
        }

        // カードのヘッダータイトルを更新
        const cardHeader = tab.element.querySelector('.card-header');
        if (cardHeader && cardHeader.querySelector('.card-title')) {
            cardHeader.querySelector('.card-title').textContent = tab.title;
        }
    });

    // タブコンテナを最初に挿入
    buildingSection.insertBefore(tabContainer, buildingSection.firstChild);

    // インジケーターを作成（タブコンテンツの後に配置）
    const indicatorsContainer = document.createElement('div');
    indicatorsContainer.className = 'tab-indicators';

    tabContents.forEach((_, index) => {
        const indicator = document.createElement('div');
        indicator.className = `tab-indicator ${index === 0 ? 'active' : ''}`;
        indicatorsContainer.appendChild(indicator);

        // インジケーターのクリックイベント
        indicator.addEventListener('click', () => {
            currentTabIndex = index;
            updateTabDisplay();
        });
    });

    // インジケーターをタブコンテンツの後に挿入
    buildingSection.appendChild(indicatorsContainer);

    // 左矢印のイベントリスナー
    const leftArrow = tabContainer.querySelector('.tab-arrow-left');
    leftArrow.addEventListener('click', () => {
        currentTabIndex = (currentTabIndex - 1 + tabContents.length) % tabContents.length;
        updateTabDisplay();
    });

    // 右矢印のイベントリスナー
    const rightArrow = tabContainer.querySelector('.tab-arrow-right');
    rightArrow.addEventListener('click', () => {
        currentTabIndex = (currentTabIndex + 1) % tabContents.length;
        updateTabDisplay();
    });

    // タブ表示を更新する関数
    function updateTabDisplay() {
        // インジケーターを更新
        const indicators = indicatorsContainer.querySelectorAll('.tab-indicator');
        indicators.forEach((indicator, index) => {
            if (index === currentTabIndex) {
                indicator.classList.add('active');
            } else {
                indicator.classList.remove('active');
            }
        });

        // タブコンテンツを更新
        tabContents.forEach((tab, index) => {
            if (index === currentTabIndex) {
                tab.element.classList.add('active');
            } else {
                tab.element.classList.remove('active');
            }
        });
    }
}

// 画像読み込み処理の改善
function checkImageLoading(imgElement, errorElement) {
    if (!imgElement) return;

    // タイムアウト処理を追加
    let loadTimeout;

    imgElement.onload = function () {
        clearTimeout(loadTimeout);
        console.log('フロア画像が正常に読み込まれました');
        imgElement.style.display = 'block';
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    };

    imgElement.onerror = function () {
        clearTimeout(loadTimeout);
        console.error('フロア画像の読み込みに失敗しました');
        imgElement.style.display = 'none';
        if (errorElement) {
            errorElement.style.display = 'block';
        }

        // 代替パスを試す
        tryAlternativePath(imgElement, errorElement);
    };

    // 5秒後にタイムアウト処理
    loadTimeout = setTimeout(function () {
        if (!imgElement.complete) {
            console.warn('画像読み込みがタイムアウトしました');
            imgElement.onerror();
        }
    }, 5000);
}

// 代替パスを試す関数を分離
function tryAlternativePath(imgElement, errorElement) {
    const currentSrc = imgElement.src;

    // 複数の代替パスを試す
    const alternativePaths = [
        currentSrc.replace('/static/', '/'),
        currentSrc.replace('/static/common/', '/common/'),
        `/common/img/floor_classroom/${currentSrc.split('/').pop()}`
    ];

    console.log('代替パスを試行:', alternativePaths);

    // 順番に代替パスを試す
    tryNextPath(0);

    function tryNextPath(index) {
        if (index >= alternativePaths.length) {
            console.error('すべての代替パスが失敗しました');
            return;
        }

        const tempImg = new Image();
        tempImg.onload = function () {
            imgElement.src = alternativePaths[index];
            imgElement.style.display = 'block';
            if (errorElement) {
                errorElement.style.display = 'none';
            }
            console.log(`代替パス ${index + 1} が成功しました:`, alternativePaths[index]);
        };

        tempImg.onerror = function () {
            console.log(`代替パス ${index + 1} が失敗しました:`, alternativePaths[index]);
            tryNextPath(index + 1);
        };

        tempImg.src = alternativePaths[index];
    }
}

// ファイルビューア要素を初期化する関数
function initFileViewer() {
    const classroomList = document.getElementById('classroom-list');
    if (!classroomList) {
        console.error('classroom-list要素が見つかりません');
        return;
    }

    // ファイルビューア要素がなければ作成
    if (!document.querySelector('.schedule-file-viewer-container')) {
        classroomList.innerHTML = `
            <div class="schedule-file-viewer-container">
                <div class="file-viewer-header">
                    <h4 id="fileViewerTitle">スケジュールファイル</h4>
                    <button id="closeFileViewer" class="close-btn">×</button>
                </div>
                <div class="file-viewer-content">
                    <embed id="scheduleFileViewer" src="" type="application/pdf" width="100%" height="500px">
                    <img id="scheduleImageViewer" src="" alt="スケジュール画像" style="display: none; max-width: 100%; max-height: 500px;">
                </div>
        </div>
    `;

        // 閉じるボタンのイベントリスナーを設定
        const closeBtn = document.getElementById('closeFileViewer');
        if (closeBtn) {
            closeBtn.addEventListener('click', hideScheduleFileViewer);
        }
    }
}

// ファイルビューアを非表示にする関数
function hideScheduleFileViewer() {
    const fileViewer = document.querySelector('.schedule-file-viewer-container');
    if (!fileViewer) return;

    fileViewer.style.display = 'none';

    // ビューアをクリア
    const pdfViewer = document.getElementById('scheduleFileViewer');
    const imageViewer = document.getElementById('scheduleImageViewer');

    if (pdfViewer) pdfViewer.src = '';
    if (imageViewer) imageViewer.src = '';
}

// ファイルの拡張子を取得する関数
function getFileExtension(url) {
    if (!url) return '';
    const parts = url.split('.');
    if (parts.length <= 1) return '';
    return parts[parts.length - 1].toLowerCase();
}

// PDFファイルかどうかを判定する関数
function isPdfFile(ext) {
    return ext === 'pdf';
}

// 画像ファイルかどうかを判定する関数
function isImageFile(ext) {
    // 画像ファイルの拡張子を限定
    const imageExts = ['jpg', 'jpeg', 'png'];
    return imageExts.includes(ext);
}

// スケジュール情報を表示する関数を修正
function showScheduleInfo(day, period, subjectName, teacherName, classroom) {
    // 曜日の日本語表記
    const dayNames = {
        '月': '月曜日',
        '火': '火曜日',
        '水': '水曜日',
        '木': '木曜日',
        '金': '金曜日',
        '土': '土曜日',
        '日': '日曜日'
    };

    const dayJp = dayNames[day] || day;
    const scheduleInfo = document.createElement('div');
    scheduleInfo.className = 'schedule-info';
    scheduleInfo.innerHTML = `
        <div class="schedule-header">
            <span class="schedule-day-period">${dayJp} ${period}限</span>
        </div>
        <div class="schedule-details">
            <div class="schedule-subject">${subjectName || '科目名なし'}</div>
            <div class="schedule-teacher">担当: ${teacherName || '未設定'}</div>
            <div class="schedule-classroom">教室: ${classroom || '未設定'}</div>
        </div>
    `;

    // コメントモーダルの先頭に追加
    const modalBody = document.querySelector('.comment-modal-body');
    if (modalBody) {
        // 既存の情報をクリアしない（この部分をコメントアウト）
        /*
        const existingInfo = modalBody.querySelector('.schedule-info');
        if (existingInfo) {
            existingInfo.remove();
        }
        */

        // 新しい情報を先頭に追加
        modalBody.insertBefore(scheduleInfo, modalBody.firstChild);
    }
}

// シングルクリック時の資料表示処理を修正
function showFilePreview(fileUrl, subjectName, dayJp, period, teacherName, classroomNumber) {
    const classroomList = document.getElementById('classroom-list');
    if (!classroomList) return;

    console.log('表示するファイルURL(元):', fileUrl);

    // URLを正規化
    if (!fileUrl.startsWith('/')) {
        fileUrl = '/' + fileUrl;
    }

    // ファイルパスの修正（uploads/schedules/ を確認）
    if (!fileUrl.includes('/uploads/schedules/') && fileUrl.includes('schedules/')) {
        fileUrl = fileUrl.replace('schedules/', '/uploads/schedules/');
    }

    console.log('表示するファイルURL(修正後):', fileUrl);

    const fileExt = getFileExtension(fileUrl);
    console.log('ファイル拡張子:', fileExt);

    // ファイルの種類に応じたプレビュー表示
    let previewHtml = '';

    if (isPdfFile(fileExt)) {
        // PDFファイルの場合
        previewHtml = `
            <div class="file-preview pdf-preview">
                <p>PDFファイルがアップロードされています</p>
            </div>
        `;
    } else if (isImageFile(fileExt)) {
        // 画像ファイルの場合（プレビューなし、ダウンロードのみ）
        previewHtml = `
            <div class="file-preview image-preview">
                <p>画像ファイルがアップロードされています</p>
            </div>
        `;
    } else {
        // その他のファイル形式の場合
        previewHtml = `
            <div class="file-preview no-preview">
                <p>このファイル形式はプレビューできません。PDFまたは画像ファイルのみプレビュー可能です。</p>
            </div>
        `;
    }

    // 資料URLがある場合は表示
    classroomList.innerHTML = `
        <div class="schedule-file-container">
            <div class="schedule-info-summary">
                <h3>${subjectName || '科目名なし'}</h3>
                <p>${dayJp} ${period}限</p>
                <p>担当: ${teacherName || '未設定'}</p>
                <p>教室: ${classroomNumber || '未設定'}</p>
            </div>
            ${previewHtml}
            <div class="file-link">
                <a href="${fileUrl}" download="${subjectName || '授業資料'}.${fileExt}" class="btn btn-primary">
                    <i class="fas fa-file-download"></i> 授業資料をダウンロード
                </a>
            </div>
        </div>
    `;
}

// 編集モーダルの保存ボタンクリック時の処理
function handleSaveSchedule() {
    const day = document.getElementById('edit-day').value;
    const period = document.getElementById('edit-period').value;
    const subjectId = document.getElementById('edit-subject').value;
    const teacherId = document.getElementById('edit-teacher').value;
    const classroomId = document.getElementById('edit-classroom').value;
    const content = document.getElementById('edit-content').value;
    const scheduleFile = document.getElementById('edit-schedule-file').files[0];

    console.log('保存するスケジュールデータ:', {
        day, period, subjectId, teacherId, classroomId, content,
        hasFile: !!scheduleFile
    });

    // FormDataオブジェクトを作成
    const formData = new FormData();
    formData.append('day', day);
    formData.append('period', period);
    formData.append('subject_id', subjectId);

    if (teacherId) {
        formData.append('teacher_id', teacherId);
        console.log('教員IDをフォームに追加:', teacherId);
    }

    if (classroomId) {
        formData.append('classroom_id', classroomId);
    }

    if (content) {
        formData.append('content', content);
    }

    if (scheduleFile) {
        formData.append('schedule_file', scheduleFile);
    }

    // APIにPOSTリクエストを送信
    fetch(TIMETABLE_API_ENDPOINT, {
        method: 'POST',
        body: formData
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('スケジュール保存成功:', data);

            // 保存したデータを取得して表示を更新
            fetchTimetableData(day, period)
                .then(updatedData => {
                    if (updatedData) {
                        console.log('更新後のデータを取得:', updatedData);

                        // 教員IDが含まれていない場合は追加
                        if (!updatedData.teacher_id && teacherId) {
                            updatedData.teacher_id = teacherId;
                            console.log('教員IDを手動で追加:', teacherId);
                        }

                        // セルの内容を更新
                        updateCellContent(day, period, updatedData);

                        // 編集モーダルを閉じる
                        hideEditModal();

                        // 成功メッセージを表示
                        showMessage('スケジュールを保存しました', 'success');
                    }
                })
                .catch(error => {
                    console.error('更新後のデータ取得に失敗:', error);
                    showMessage('スケジュールは保存されましたが、表示の更新に失敗しました', 'warning');
                });
        })
        .catch(error => {
            console.error('スケジュール保存エラー:', error);
            showMessage('スケジュールの保存に失敗しました', 'error');
        });
}

// PDF配置モーダルを表示
function showPdfPlacementModal(file) {
    // 既存のモーダルを削除
    const existingModal = document.getElementById('pdfPlacementModal');
    if (existingModal) {
        existingModal.remove();
    }

    // モーダルを作成
    const modal = document.createElement('div');
    modal.id = 'pdfPlacementModal';
    modal.className = 'schedule-edit-modal';

    // モーダルのHTML構造を修正
    modal.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="pdf-modal-content">
            <div class="modal-header">
                <h3>PDFから時間割を設定</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <!-- 左側：PDF選択エリア -->
                <div class="pdf-selection-area">
                    <div class="pdf-controls">
                        <div class="zoom-controls">
                            <button class="zoom-btn" id="zoomOut">-</button>
                            <span class="zoom-level">100%</span>
                            <button class="zoom-btn" id="zoomIn">+</button>
                        </div>
                        <button id="selectAreaBtn" class="btn btn-primary">範囲選択</button>
                        <span class="selection-info">選択範囲: なし</span>
                    </div>
                    <div class="pdf-wrapper">
                        <canvas id="pdfCanvas"></canvas>
                        <div id="selectionOverlay" class="selection-overlay"></div>
                    </div>
                </div>

                <!-- 右側：時間割プレビュー -->
                <div class="preview-timetable-container">
                    <div class="timetable-controls">
                        <span>時間割プレビュー</span>
                    </div>
                    <div class="timetable-wrapper">
                        <table class="preview-timetable">
                            <thead>
                                <tr>
                                    <th></th>
                                    ${['月', '火', '水', '木', '金', '土'].map(day => `<th>${day}</th>`).join('')}
                                </tr>
                            </thead>
                            <tbody>
                                ${Array.from({length: 7}, (_, i) => {
                                    const period = i + 1;
                                    return `
                                        <tr>
                                            <th>${period === 7 ? '夜間' : period + '限'}</th>
                                            ${['月', '火', '水', '木', '金', '土'].map(day => `
                                                <td class="preview-cell" data-day="${day}" data-period="${period}"></td>
                                            `).join('')}
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <div class="modal-actions">
                <button id="savePdfPlacement" class="save-btn">配置を保存</button>
                <button class="cancel-btn">キャンセル</button>
            </div>
        </div>
    `;

    // モーダルをDOMに追加
    document.body.appendChild(modal);
    
    // モーダルを表示
    modal.classList.remove('hidden');

    // canvas要素を取得（DOMに追加された後で）
    const canvas = document.getElementById('pdfCanvas');
    const ctx = canvas.getContext('2d');
    let pdfDoc = null;
    let currentPage = 1;
    let selection = null;

    // PDF.jsを使用してPDFを読み込み
    const fileUrl = URL.createObjectURL(file);
    pdfjsLib.getDocument(fileUrl).promise.then(pdf => {
        pdfDoc = pdf;
        renderPage(currentPage);
    }).catch(error => {
        console.error('PDF読み込みエラー:', error);
        alert('PDFの読み込みに失敗しました');
    });

    // ページを描画する関数
    async function renderPage(pageNumber) {
        const page = await pdfDoc.getPage(pageNumber);
        
        // PDF表示領域のサイズを取得
        const pdfWrapper = document.querySelector('.pdf-wrapper');
        const containerWidth = pdfWrapper.clientWidth;
        
        // ビューポートのスケールを計算
        const viewport = page.getViewport({ scale: 1.0 });
        const scale = containerWidth / viewport.width;
        
        // スケールを適用した新しいビューポート
        const scaledViewport = page.getViewport({ scale: scale });
        
        // キャンバスサイズを設定
        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;
        
        // PDFを描画
        await page.render({
            canvasContext: ctx,
            viewport: scaledViewport
        }).promise;
        
        // 範囲選択の処理を設定
        setupSelectionHandlers();
    }

    // 範囲選択の処理を設定する関数
    function setupSelectionHandlers() {
        let isSelecting = false;
        let startX, startY;
        const selectionOverlay = document.getElementById('selectionOverlay');
        let selectedCells = []; // 選択されたセルを保持

        // 範囲選択ボタンのイベントリスナー
        const selectBtn = document.getElementById('selectAreaBtn');
        selectBtn.onclick = () => {
            isSelecting = !isSelecting;
            selectBtn.classList.toggle('active');
            canvas.style.cursor = isSelecting ? 'crosshair' : 'default';
            if (!isSelecting) {
                selectionOverlay.style.display = 'none';
            }
        };

        // プレビューセルのクリックイベントを設定
        const previewCells = document.querySelectorAll('.preview-cell');
        previewCells.forEach(cell => {
            cell.addEventListener('click', function() {
                // 選択状態を切り替え
                this.classList.toggle('selected');
                
                // 選択セルリストを更新
                if (this.classList.contains('selected')) {
                    selectedCells.push(this);
                } else {
                    selectedCells = selectedCells.filter(c => c !== this);
                }
                
                // 選択セル数を表示
                updateSelectedCount();
            });
        });

        // 全選択/解除ボタンを追加
        const timetableControls = document.querySelector('.timetable-controls');
        
        // 全選択ボタン
        const selectAllBtn = document.createElement('button');
        selectAllBtn.className = 'btn btn-secondary';
        selectAllBtn.textContent = '全て選択';
        selectAllBtn.onclick = () => {
            previewCells.forEach(cell => {
                cell.classList.add('selected');
                if (!selectedCells.includes(cell)) {
                    selectedCells.push(cell);
                }
            });
            updateSelectedCount();
        };
        
        // 選択解除ボタン
        const clearSelectBtn = document.createElement('button');
        clearSelectBtn.className = 'btn btn-secondary';
        clearSelectBtn.textContent = '選択解除';
        clearSelectBtn.onclick = () => {
            previewCells.forEach(cell => {
                cell.classList.remove('selected');
            });
            selectedCells = [];
            updateSelectedCount();
        };
        
        // 選択カウンターの追加
        const selectedCount = document.createElement('div');
        selectedCount.className = 'selected-cells-count';
        selectedCount.textContent = '0セル選択中';
        
        // コントロールに追加
        timetableControls.appendChild(selectAllBtn);
        timetableControls.appendChild(clearSelectBtn);
        timetableControls.appendChild(selectedCount);
        
        // 選択数の更新関数
        function updateSelectedCount() {
            selectedCount.textContent = `${selectedCells.length}セル選択中`;
        }

        // マウスイベントのハンドラー
        canvas.onmousedown = (e) => {
            if (!isSelecting) return;
            const rect = canvas.getBoundingClientRect();
            startX = e.clientX - rect.left;
            startY = e.clientY - rect.top;

            selectionOverlay.style.left = `${startX}px`;
            selectionOverlay.style.top = `${startY}px`;
            selectionOverlay.style.width = '0';
            selectionOverlay.style.height = '0';
            selectionOverlay.style.display = 'block';
        };

        canvas.onmousemove = (e) => {
            if (!isSelecting || !startX) return;
            const rect = canvas.getBoundingClientRect();
            const currentX = e.clientX - rect.left;
            const currentY = e.clientY - rect.top;

            const width = currentX - startX;
            const height = currentY - startY;

            selectionOverlay.style.width = `${Math.abs(width)}px`;
            selectionOverlay.style.height = `${Math.abs(height)}px`;
            selectionOverlay.style.left = `${width < 0 ? currentX : startX}px`;
            selectionOverlay.style.top = `${height < 0 ? currentY : startY}px`;
        };

        canvas.onmouseup = (e) => {
            if (!isSelecting) return;
            const rect = canvas.getBoundingClientRect();
            const endX = e.clientX - rect.left;
            const endY = e.clientY - rect.top;

            selection = {
                x: Math.min(startX, endX),
                y: Math.min(startY, endY),
                width: Math.abs(endX - startX),
                height: Math.abs(endY - startY)
            };

            document.querySelector('.selection-info').textContent =
                `選択範囲: (${Math.round(selection.x)}, ${Math.round(selection.y)}) - ${Math.round(selection.width)}x${Math.round(selection.height)}`;

            startX = null;
            isSelecting = false;
            selectBtn.classList.remove('active');
            canvas.style.cursor = 'default';
        };
        
        // 選択したセルと範囲情報を返す
        return {
            getSelectedCells: () => selectedCells
        };
    }

    // ズームコントロールを設定
    const zoomInBtn = document.getElementById('zoomIn');
    const zoomOutBtn = document.getElementById('zoomOut');
    const zoomLevelEl = document.querySelector('.zoom-level');
    let scale = 1.0;

    zoomInBtn.addEventListener('click', () => {
        scale = Math.min(scale * 1.2, 3);
        updateZoom();
    });

    zoomOutBtn.addEventListener('click', () => {
        scale = Math.max(scale / 1.2, 0.5);
        updateZoom();
    });

    function updateZoom() {
        canvas.style.transform = `scale(${scale})`;
        zoomLevelEl.textContent = `${Math.round(scale * 100)}%`;
    }

    // 保存ボタンの処理を更新
    const saveBtn = modal.querySelector('#savePdfPlacement');
    saveBtn.onclick = async function() {
        // 範囲選択ハンドラーから選択セルを取得
        const selectionHandler = setupSelectionHandlers();
        const selectedCells = selectionHandler.getSelectedCells();
        
        if (selectedCells.length === 0 || !selection) {
            alert('セルと範囲を選択してください');
            return;
        }

        // 処理中メッセージを表示
        const processingMsg = document.createElement('div');
        processingMsg.textContent = `${selectedCells.length}個のセルを処理中...`;
        processingMsg.style.position = 'fixed';
        processingMsg.style.top = '50%';
        processingMsg.style.left = '50%';
        processingMsg.style.transform = 'translate(-50%, -50%)';
        processingMsg.style.padding = '20px';
        processingMsg.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        processingMsg.style.color = 'white';
        processingMsg.style.borderRadius = '8px';
        processingMsg.style.zIndex = '9999';
        document.body.appendChild(processingMsg);

        // 選択範囲のデータを取得
        const imageData = ctx.getImageData(
            selection.x, selection.y,
            selection.width, selection.height
        );

        // 新しいcanvasに選択範囲を描画
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = selection.width;
        tempCanvas.height = selection.height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.putImageData(imageData, 0, 0);

        // canvasをBlobに変換
        tempCanvas.toBlob(async (blob) => {
            const promises = [];
            
            // 選択された各セルに対してリクエストを作成
            for (const cell of selectedCells) {
                const day = cell.dataset.day;
                const period = cell.dataset.period;
                
                const formData = new FormData();
                formData.append('file', blob, `selection_${day}_${period}.png`);
                formData.append('day', day);
                formData.append('period', period);
                
                const promise = fetch('/student/api/upload_schedule_file', {
                    method: 'POST',
                    headers: {
                        'X-CSRFToken': getCsrfToken()
                    },
                    body: formData
                }).then(response => {
                    if (!response.ok) {
                        throw new Error(`${day}曜${period}限の更新に失敗しました`);
                    }
                    return response.json();
                });
                
                promises.push(promise);
            }
            
            try {
                // すべてのリクエストを並行処理
                const results = await Promise.allSettled(promises);
                
                // 処理結果を解析
                const succeeded = results.filter(r => r.status === 'fulfilled').length;
                const failed = results.filter(r => r.status === 'rejected').length;
                
                // 処理メッセージを削除
                document.body.removeChild(processingMsg);
                
                // 結果を表示
                if (failed > 0) {
                    alert(`${succeeded}セルの更新に成功、${failed}セルの更新に失敗しました`);
                } else {
                    alert(`${succeeded}セルを更新しました`);
                }
                
                // モーダルを閉じて時間割を更新
                modal.remove();
                updateTimetableDisplay();
            } catch (error) {
                console.error('アップロードエラー:', error);
                document.body.removeChild(processingMsg);
                alert('PDFの処理中にエラーが発生しました');
            }
        }, 'image/png');
    };

    // クリーンアップ処理
    function cleanup() {
        URL.revokeObjectURL(fileUrl);
        modal.remove();
    }

    // キャンセルと閉じるボタンの処理
    const closeButtons = modal.querySelectorAll('.modal-close, .cancel-btn');
    closeButtons.forEach(btn => {
        btn.onclick = cleanup;
    });

    // オーバーレイクリックで閉じる
    const overlay = modal.querySelector('.modal-overlay');
    if (overlay) {
        overlay.onclick = cleanup;
    }
}
// PDFビューアの機能拡張
function initializePdfViewer(canvas) {
    let scale = 1;
    let isDragging = false;
    let startX, startY, scrollLeft, scrollTop;
    const wrapper = canvas.parentElement;

    // ズームコントロールを追加
    const controls = document.querySelector('.pdf-controls');
    controls.innerHTML = `
        <div class="zoom-controls">
            <button class="zoom-btn" id="zoomOut">-</button>
            <span class="zoom-level">100%</span>
            <button class="zoom-btn" id="zoomIn">+</button>
        </div>
        <button id="selectAreaBtn" class="btn btn-primary">範囲選択</button>
        <span class="selection-info">選択範囲: なし</span>
    `;

    // ズーム機能
    document.getElementById('zoomIn').onclick = () => {
        scale = Math.min(scale * 1.2, 3);
        updateZoom();
    };

    document.getElementById('zoomOut').onclick = () => {
        scale = Math.max(scale / 1.2, 0.5);
        updateZoom();
    };

    function updateZoom() {
        canvas.style.transform = `scale(${scale})`;
        canvas.style.transformOrigin = '0 0';
        document.querySelector('.zoom-level').textContent = `${Math.round(scale * 100)}%`;
    }

    // ドラッグ機能
    wrapper.addEventListener('mousedown', (e) => {
        if (isSelecting) return;  // 範囲選択中は無効
        isDragging = true;
        startX = e.pageX - wrapper.offsetLeft;
        startY = e.pageY - wrapper.offsetTop;
        scrollLeft = wrapper.scrollLeft;
        scrollTop = wrapper.scrollTop;
    });

    wrapper.addEventListener('mousemove', (e) => {
        if (!isDragging || isSelecting) return;
        e.preventDefault();
        const x = e.pageX - wrapper.offsetLeft;
        const y = e.pageY - wrapper.offsetTop;
        const walkX = (x - startX) * 1.5;
        const walkY = (y - startY) * 1.5;
        wrapper.scrollLeft = scrollLeft - walkX;
        wrapper.scrollTop = scrollTop - walkY;
    });

    wrapper.addEventListener('mouseup', () => {
        isDragging = false;
    });

    wrapper.addEventListener('mouseleave', () => {
        isDragging = false;
    });
}
