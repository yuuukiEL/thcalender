/**
 * 表示情報の更新関数
 * クラス情報、担任名、期間の表示を更新する
 */
function updateDisplayInfo() {
    // 必要な要素の取得
    const classSelect = document.getElementById('class_select');  // クラス選択セレクトボックス
    const displayClassName = document.getElementById('displayClassName');  // クラス名表示要素
    const displayTeacherName = document.getElementById('displayTeacherName');  // 担任名表示要素
    const displayPeriod = document.getElementById('displayPeriod');  // 期間表示要素

    // クラス情報の更新処理
    if (classSelect && displayClassName) {
        const selectedOption = classSelect.options[classSelect.selectedIndex];
        if (selectedOption && selectedOption.value) {
            // 選択されたクラスの情報を表示
            displayClassName.textContent = selectedOption.text;  // クラス名を表示
            if (displayTeacherName) {
                // data-teacher-name属性から担任名を取得して表示
                const teacherName = selectedOption.dataset.teacherName || '-';
                displayTeacherName.textContent = teacherName;
            }
        } else {
            // クラスが選択されていない場合、デフォルト表示
            displayClassName.textContent = '-';
            if (displayTeacherName) {
                displayTeacherName.textContent = '-';
            }
        }
    }

    // 期間情報の更新処理
    if (displayPeriod) {
        // 開始日と終了日を取得（オプショナルチェイニングで安全に取得）
        const startDate = document.getElementById('start_date')?.value;
        const endDate = document.getElementById('end_date')?.value;
        // 両方の日付が入力されている場合のみ期間を表示
        displayPeriod.textContent = (startDate && endDate) 
            ? `${startDate} 〜 ${endDate}` 
            : '-';
    }
}

/**
 * DOMContentLoadedイベントで全ての初期化を行う
 * ページ読み込み完了時に実行される
 */
document.addEventListener('DOMContentLoaded', function() {
    // 必要な要素の取得
    const classSelect = document.getElementById('class_select');  // クラス選択
    const startDate = document.getElementById('start_date');  // 開始日
    const endDate = document.getElementById('end_date');  // 終了日
    const displayClassName = document.getElementById('displayClassName');  // クラス名表示
    const displayTeacherName = document.getElementById('displayTeacherName');  // 担任名表示
    const displayPeriod = document.getElementById('displayPeriod');  // 期間表示
    const subjectSelects = document.querySelectorAll('.subject-select');  // 科目選択
    const scheduleForm = document.getElementById('scheduleForm');  // スケジュールフォーム

    // クラス選択の変更イベント設定
    if (classSelect) {
        classSelect.addEventListener('change', () => {
            updateDisplayInfo();  // 表示情報を更新
            fetchExistingSchedule();  // 既存のスケジュールを取得
        });
    }

    // 日付の変更イベント設定
    if (startDate) {
        startDate.addEventListener('change', updateDisplayInfo);  // 開始日変更時に表示更新
    }
    if (endDate) {
        endDate.addEventListener('change', updateDisplayInfo);  // 終了日変更時に表示更新
    }

    // 科目選択の変更イベント設定
    subjectSelects.forEach(select => {
        select.addEventListener('change', handleSubjectChange);  // 科目変更時の処理
    });

    // フォームの送信イベント設定
    if (scheduleForm) {
        scheduleForm.addEventListener('submit', handleFormSubmit);  // フォーム送信時の処理
    }

    // 初期表示の更新
    updateDisplayInfo();  // ページ読み込み時に表示を初期化
});

/**
 * このJavaScriptファイルは、クラス共通スケジュール登録画面の動的な機能を提供します。
 * 
 * 主な機能：
 * 1. クラス選択時の表示更新
 * 2. 期間（開始日・終了日）の表示更新
 * 3. 科目選択時の関連フィールドの制御
 * 4. フォーム送信時のデータ処理
 * 
 * 関連するPythonルート（schedule.py）：
 * - GET /register/class_schedule: スケジュール登録画面の表示
 * - POST /register/class_schedule: スケジュールデータの登録
 * - GET /api/class_schedule/<class_id>: 既存スケジュールの取得
 */

// グローバル変数の定義
let currentSchedule = {};  // 現在の時間割データを保持

/**
 * ページ読み込み時の初期化処理
 * DOMContentLoadedイベントで実行される
 */
document.addEventListener('DOMContentLoaded', async function () {
    // クラス選択要素の取得とイベントリスナーの設定
    const classSelect = document.getElementById('class_select');
    if (classSelect) {
        classSelect.addEventListener('change', handleClassChange);
    }

    /**
     * サイドパネルの初期設定
     * - expanded: パネルを展開状態に
     * - サイドパネルトグルボタンの状態も同期
     */
    const sidePanel = document.getElementById('sidePanel');
    if (sidePanel) {
        sidePanel.classList.add('expanded');
        document.querySelector('.side-panel-toggle').classList.add('expanded');
        document.querySelector('.container').classList.add('panel-expanded');
    }

    // 日付の初期値を設定
    setDefaultDates();

    /**
     * "すべてがFになる"ボタンの追加
     * 時間割編集ヘッダーの横に配置
     */
    const editScheduleHeader = document.querySelector('.edit-schedule h3');
    if (editScheduleHeader) {
        // ヘッダーラッパーの作成と設定
        const headerWrapper = document.createElement('div');
        headerWrapper.style.display = 'flex';
        headerWrapper.style.justifyContent = 'space-between';
        headerWrapper.style.alignItems = 'center';
        headerWrapper.style.marginBottom = '15px';

        // FFFFボタンの作成
        const ffButton = document.createElement('button');
        ffButton.type = 'button';
        ffButton.className = 'btn-ff';
        ffButton.textContent = 'すべてがFになる';
        ffButton.onclick = setAllToF;

        // DOM要素の配置
        editScheduleHeader.parentNode.insertBefore(headerWrapper, editScheduleHeader);
        headerWrapper.appendChild(editScheduleHeader);
        headerWrapper.appendChild(ffButton);
    }

    /**
     * 科目選択の初期化
     * APIから科目データを取得して選択肢を設定
     */
    try {
        // 科目データのフェッチ
        const response = await fetch('/api/subjects');
        if (!response.ok) {
            throw new Error('科目データの取得に失敗しました');
        }
        const subjects = await response.json();

        // 科目選択セレクトボックスのセットアップ
        document.querySelectorAll('.edit-timetable select[name*="[subject]"]').forEach(select => {
            // デフォルトオプションの保持
            const defaultOption = select.querySelector('option[value=""]');

            // 既存のオプションをクリア
            select.innerHTML = '';

            // デフォルトオプションを追加
            if (defaultOption) {
                select.appendChild(defaultOption);
            }

            // FFFFオプションを追加
            const ffOption = document.createElement('option');
            ffOption.value = 'FFFF';
            ffOption.textContent = 'FFFF';
            select.appendChild(ffOption);

            // 科目オプションを追加
            subjects.forEach(subject => {
                if (subject.subject_name !== 'FFFF') {
                    const option = document.createElement('option');
                    option.value = subject.subject_id;
                    option.textContent = subject.subject_name;
                    select.appendChild(option);
                }
            });

            // 科目選択時のイベントリスナーを設定
            select.addEventListener('change', handleSubjectChange);
        });
    } catch (error) {
        console.error('科目データの初期化エラー:', error);
        showMessage('科目データの読み込みに失敗しました', 'error');
    }

    /**
     * 日付入力のイベントリスナー設定
     * 開始日と終了日の相互依存関係を制御
     */
    const startDateInput = document.getElementById('start_date');
    const endDateInput = document.getElementById('end_date');

    // 開始日の変更イベント
    if (startDateInput) {
        startDateInput.addEventListener('change', function () {
            if (endDateInput) {
                // 終了日の最小値を開始日に設定
                endDateInput.min = this.value;
                // 終了日が開始日より前の場合、終了日を開始日に合わせる
                if (new Date(endDateInput.value) < new Date(this.value)) {
                    endDateInput.value = this.value;
                }
            }
        });
    }

    // 終了日の変更イベント
    if (endDateInput) {
        endDateInput.addEventListener('change', function () {
            if (startDateInput) {
                // 開始日の最大値を終了日に設定
                startDateInput.max = this.value;
                // 開始日が終了日より後の場合、開始日を終了日に合わせる
                if (new Date(startDateInput.value) > new Date(this.value)) {
                    startDateInput.value = this.value;
                }
            }
        });
    }

    /**
     * 科目選択のイベントリスナー設定
     * 科目選択時の教員と教室の制御を行う
     */
    document.querySelectorAll('.subject-select').forEach(select => {
        select.addEventListener('change', function () {
            const selectedValue = this.value;
            // 関連する教員選択と教室表示要素を取得
            const teacherSelect = this.closest('.cell-content').querySelector('.teacher-select');
            const classroomDisplay = this.closest('.cell-content').querySelector('.classroom-display');

            // FFFFが選択された場合の処理
            if (selectedValue === 'FFFF') {
                // 教員選択を無効化してクリア
                teacherSelect.disabled = true;
                teacherSelect.value = '';
                // 教室選択を無効化してクリア
                classroomDisplay.disabled = true;
                classroomDisplay.value = '';
            } else {
                // 通常科目の場合は入力を有効化
                teacherSelect.disabled = false;
                classroomDisplay.disabled = false;
            }
        });
    });

    // 変更検知の初期設定
    setupChangeDetection();
});

/**
 * 日付の初期値を設定する関数
 * 現在日から2ヶ月後までの期間を設定
 */
function setDefaultDates() {
    const startDateInput = document.getElementById('start_date');
    const endDateInput = document.getElementById('end_date');

    if (startDateInput && endDateInput) {
        // 現在日を取得
        const today = new Date();
        // 2ヶ月後の日付を計算
        const twoMonthsLater = new Date(today);
        twoMonthsLater.setMonth(today.getMonth() + 2);

        // 日付を設定
        startDateInput.value = formatDate(today);
        endDateInput.value = formatDate(twoMonthsLater);
    }
}

/**
 * 日付フォーマット関数
 * Date オブジェクトを YYYY-MM-DD 形式の文字列に変換
 * @param {Date} date - フォーマットする日付
 * @returns {string} フォーマットされた日付文字列
 */
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');  // 月を2桁に
    const day = String(date.getDate()).padStart(2, '0');         // 日を2桁に
    return `${year}-${month}-${day}`;
}

/**
 * 科目選択時の処理を修正
 * 科目が選択された時に教員と教室の入力状態を制御
 * @param {Event} event - 科目選択時のイベントオブジェクト
 */
function handleSubjectChange(event) {
    const select = event.target;
    const cell = select.closest('.schedule-cell');
    const subjectId = select.value;
    
    if (!cell) return;

    // 教員選択の制御
    const teacherSelect = cell.querySelector('select[name*="[teacher_id]"]');
    if (teacherSelect) {
        if (subjectId && subjectId !== 'FFFF') {
            teacherSelect.disabled = false;
        } else {
            teacherSelect.disabled = true;
            teacherSelect.value = '';
        }
    }

    // schedule_idを更新
    const dayOfWeek = cell.dataset.day;
    const period = cell.dataset.period;
    const scheduleId = subjectId ? `${dayOfWeek}_${period}_${subjectId}` : null;
    cell.dataset.scheduleId = scheduleId;

    // 科目説明テーブルの更新
    updateSubjectInfoTable();
}

// 科目説明を取得する関数
async function fetchSubjectDescription(scheduleId) {
    try {
        const response = await fetch(`/api/subject_description/${scheduleId}`);
        if (!response.ok) {
            throw new Error('科目説明の取得に失敗しました');
        }
        const data = await response.json();
        return data.description;
    } catch (error) {
        console.error('Error fetching subject description:', error);
        throw error;
    }
}

// 科目説明を保存する関数
async function saveSubjectDescription(scheduleId, description) {
    try {
        // scheduleIdから科目IDを取得（形式: day_period_subjectId）
        const subject_id = scheduleId.split('_')[2];
        if (!subject_id) {
            throw new Error('科目IDが取得できません');
        }

        const response = await fetch('/api/subject_description', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                subject_id: subject_id,
                description: description
            })
        });

        if (!response.ok) {
            throw new Error('科目説明の保存に失敗しました');
        }

        return await response.json();
    } catch (error) {
        console.error('Error saving subject description:', error);
        throw error;
    }
}

// 科目説明の編集UIを表示する関数
function showDescriptionEditor(cell, scheduleId) {
    const textarea = document.createElement('textarea');
    textarea.className = 'description-editor';
    textarea.rows = 3;
    
    // 既存の説明を取得して表示
    fetchSubjectDescription(scheduleId)
        .then(description => {
            textarea.value = description;
        })
        .catch(error => {
            console.error('説明の取得に失敗:', error);
            textarea.value = '';
        });

    // 保存ボタン
    const saveButton = document.createElement('button');
    saveButton.textContent = '保存';
    saveButton.onclick = async () => {
        try {
            await saveSubjectDescription(scheduleId, textarea.value);
            showMessage('科目説明を保存しました', 'success');
        } catch (error) {
            showMessage('科目説明の保存に失敗しました', 'error');
        }
    };

    // 説明エディタを表示
    const editorContainer = cell.querySelector('.description-container') || document.createElement('div');
    editorContainer.className = 'description-container';
    editorContainer.innerHTML = '';
    editorContainer.appendChild(textarea);
    editorContainer.appendChild(saveButton);

    if (!cell.querySelector('.description-container')) {
        cell.appendChild(editorContainer);
    }
}

// 科目説明テーブルの更新関数を修正
async function updateSubjectInfoTable() {
    const tbody = document.getElementById('subjectInfoBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    // 科目ごとの情報を管理するMap
    const subjectMap = new Map();
    
    // まず全ての科目情報を収集
    document.querySelectorAll('.schedule-cell').forEach(cell => {
        const subjectSelect = cell.querySelector('select[name*="[subject]"]');
        const teacherSelect = cell.querySelector('select[name*="[teacher_id]"]');
        
        if (subjectSelect && subjectSelect.value && subjectSelect.value !== 'FFFF') {
            const subjectId = subjectSelect.value;
            const subjectName = subjectSelect.options[subjectSelect.selectedIndex].text;
            const teacherName = teacherSelect?.options[teacherSelect.selectedIndex]?.text || '';

            if (!subjectMap.has(subjectId)) {
                subjectMap.set(subjectId, {
                    subjectName: subjectName,
                    teachers: new Set(),
                    scheduleId: subjectId  // 科目IDをschedule_idとして使用
                });
            }

            // 教員名が有効な場合のみ追加
            if (teacherName && !teacherName.includes('教員を選択')) {
                subjectMap.get(subjectId).teachers.add(teacherName);
            }
        }
    });

    // 科目ごとに行を追加
    for (const [subjectId, data] of subjectMap) {
        const row = tbody.insertRow();
        
        // 科目名セル（幅20%）
        const subjectCell = row.insertCell(0);
        subjectCell.style.width = '20%';
        subjectCell.textContent = data.subjectName;

        // 教員名セル（幅20%）
        const teacherCell = row.insertCell(1);
        teacherCell.style.width = '20%';
        const teacherNames = Array.from(data.teachers);
        teacherCell.textContent = teacherNames.length > 0 ? teacherNames.join('、') : '-';

        // 説明セル（幅50%）
        const descriptionCell = row.insertCell(2);
        descriptionCell.style.width = '50%';
        const textarea = document.createElement('textarea');
        textarea.className = 'description-editor';
        textarea.rows = 3;

        // 保存ボタンセル（幅10%）
        const actionCell = row.insertCell(3);
        actionCell.style.width = '10%';
        const saveButton = document.createElement('button');
        saveButton.textContent = '保存';
        saveButton.className = 'btn-save-description';
        
        // 説明を取得して表示（科目IDを使用）
        fetchSubjectDescription(subjectId)
            .then(description => {
                textarea.value = description || '';
            })
            .catch(error => {
                console.error('説明の取得に失敗:', error);
                textarea.value = '';
            });

        // 保存ボタンのクリックイベント
        saveButton.onclick = async () => {
            try {
                await saveSubjectDescription(subjectId, textarea.value);
                showMessage('科目説明を保存しました', 'success');
            } catch (error) {
                showMessage('科目説明の保存に失敗しました', 'error');
            }
        };

        descriptionCell.appendChild(textarea);
        actionCell.appendChild(saveButton);
    }
}

// 時間割から科目の教師名を取得する補助関数
function getTeacherNameForSubject(subjectName) {
    let teacherName = '';
    document.querySelectorAll('.edit-timetable .schedule-cell').forEach(cell => {
        const subjectSelect = cell.querySelector('select[name*="[subject]"]');
        if (subjectSelect && subjectSelect.value === subjectName) {
            const teacherSelect = cell.querySelector('select[name*="[teacher_id]"]');
            if (teacherSelect && teacherSelect.selectedOptions[0]) {
                teacherName = teacherSelect.selectedOptions[0].text;
            }
        }
    });
    return teacherName;
}

// 教師リストを表示
function showTeacherList(button) {
    // 既存のリストを削除
    const existingList = document.querySelector('.teacher-popup-list');
    if (existingList) {
        existingList.remove();
    }

    const teacherCell = button.closest('td[contenteditable="true"]');
    const teacherSelect = document.createElement('select');
    teacherSelect.className = 'teacher-popup-list';
    teacherSelect.size = 10;

    // 既存の教師リストから選択肢を作成
    const existingSelect = document.querySelector('.teacher-select');
    if (existingSelect) {
        teacherSelect.innerHTML = Array.from(existingSelect.options)
            .map(opt => opt.value ? `<option value="${opt.value}">${opt.text}</option>` : '')
            .join('');
    }

    // 選択時の処理
    teacherSelect.onchange = function () {
        const selectedTeacher = this.options[this.selectedIndex].text;
        const currentText = teacherCell.textContent.replace('+teacher', '').trim();
        teacherCell.textContent = currentText ?
            `${currentText}\n${selectedTeacher}` : selectedTeacher;

        // ボタンを再配置
        teacherCell.appendChild(button);
        this.remove();
        handleFormChange();
    };

    // キャンセル時の処理（モーダル外クリック）
    document.addEventListener('click', function closeModal(e) {
        if (!teacherSelect.contains(e.target) && e.target !== button) {
            teacherSelect.remove();
            document.removeEventListener('click', closeModal);
        }
    });

    // リストを表示
    document.body.appendChild(teacherSelect);
    teacherSelect.focus();
}

// テキストエリアの自動リサイズ
function autoResize(textarea) {
    if (textarea.matches(':focus')) {
        textarea.style.height = '28px';
        textarea.style.height = (textarea.scrollHeight) + 'px';
    }
}

// 教師名変更時の処理
function handleTeacherNameChange(subjectName, value) {
    // 同じ科目の教師名を全て更新
    document.querySelectorAll('.edit-timetable .schedule-cell').forEach(cell => {
        const subjectSelect = cell.querySelector('select[name*="[subject]"]');
        if (subjectSelect && subjectSelect.value === subjectName) {
            const teacherSelect = cell.querySelector('select[name*="[teacher_id]"]');
            if (teacherSelect) {
                // 教師名に一致するオプションを探す
                const option = Array.from(teacherSelect.options).find(opt => opt.text === value);
                if (option) {
                    teacherSelect.value = option.value;
                }
            }
        }
    });
    handleFormChange(); // 変更を検知
}

// 説明文変更時の処理
function handleDescriptionChange(subjectName, value) {
    handleFormChange(); // 変更を検知
}

// CSSスタイル追加
const style = document.createElement('style');
style.textContent = `
    .btn-ff {
        background-color: #6c757d;
        color: white;
        padding: 5px 15px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        transition: background-color 0.3s;
    }
    .btn-ff:hover {
        background-color: #5a6268;
    }
`;
document.head.appendChild(style);

// クラス選択時の処理
async function handleClassChange() {
    const classId = document.getElementById('class_select').value;
    if (!classId) {
        clearScheduleDisplay();
        clearEditSchedule();  // 編集用の時間割もクリア
        return;
    }

    try {
        // 既存のデータを完全にクリア
        clearScheduleDisplay();  // サイドパネルをクリア
        clearEditSchedule();     // 編集用テーブルをクリア

        // DBから時間割データを取得
        const response = await fetch(`/api/class_schedule/${classId}`);
        if (!response.ok) {
            throw new Error('時間割取得に失敗しました');
        }
        const schedules = await response.json();
        console.log('DBから取得したデータ:', schedules);

        // データが存在する場合のみ処理
        if (schedules && schedules.length > 0) {
            // 時間割データを編集用テーブルに反映
            schedules.forEach(schedule => {
                // 時限のインデックスを計算（0始まり）
                const period = schedule.period.replace('限', '');
                const periodIndex = period === '夜間' ? 6 : parseInt(period) - 1;

                // 曜日のインデックスを計算（0始まり）
                const dayMap = {
                    'Monday': 0,
                    'Tuesday': 1,
                    'Wednesday': 2,
                    'Thursday': 3,
                    'Friday': 4,
                    'Saturday': 5
                };
                const dayIndex = dayMap[schedule.day_of_week];

                // 該当するセルを取得
                const rows = document.querySelectorAll('.edit-timetable tbody tr');
                const cells = rows[periodIndex]?.querySelectorAll('.schedule-cell');
                const cell = cells?.[dayIndex];

                if (cell) {
                    // 科目の設定
                    const subjectSelect = cell.querySelector('select[name*="[subject]"]');
                    if (subjectSelect) {
                        subjectSelect.value = schedule.subject;
                        // 科目変更イベントを発火
                        subjectSelect.dispatchEvent(new Event('change', { bubbles: true }));
                    }

                    // 教師の設定
                    const teacherSelect = cell.querySelector('select[name*="[teacher_id]"]');
                    if (teacherSelect) {
                        const teacherOption = Array.from(teacherSelect.options)
                            .find(opt => opt.text === schedule.teacher_name);
                        if (teacherOption) {
                            teacherSelect.value = teacherOption.value;
                        }
                        teacherSelect.disabled = schedule.subject === 'FFFF';
                    }

                    // 教室の設定
                    const classroomDisplay = cell.querySelector('.classroom-display');
                    const classroomInput = cell.querySelector('.classroom-id-input');
                    if (classroomDisplay && classroomInput) {
                        classroomDisplay.value = schedule.classroom_id || '';
                        classroomInput.value = schedule.classroom_id || '';
                        classroomDisplay.disabled = schedule.subject === 'FFFF';
                    }
                }
            });

            // サイドパネルの時間割も更新
            updateCurrentSchedule(schedules);
        }

        // クラス情報とその他の更新
        updateClassInfo();
        updateSubjectInfoTable();

    } catch (error) {
        console.error('Error:', error);
        showMessage(error.message, 'error');
    }
}

// 編集用の時間割をクリアする関数
function clearEditSchedule() {
    console.log('時間割をクリア開始');  // デバッグ用

    // 編集用テーブルの全セルをクリア
    document.querySelectorAll('.edit-timetable tbody tr').forEach((row, rowIndex) => {
        row.querySelectorAll('.schedule-cell').forEach((cell, colIndex) => {
            console.log(`セルをクリア: ${rowIndex}行目, ${colIndex}列目`);  // デバッグ用

            // 科目選択をクリア
            const subjectSelect = cell.querySelector('select[name*="[subject]"]');
            if (subjectSelect) {
                subjectSelect.value = '';
                console.log('科目選択をクリア');  // デバッグ用
            }

            // 教師選択をクリア
            const teacherSelect = cell.querySelector('select[name*="[teacher_id]"]');
            if (teacherSelect) {
                teacherSelect.value = '';
                teacherSelect.disabled = true;
                console.log('教師選択をクリア');  // デバッグ用
            }

            // 教室情報をクリア
            const classroomDisplay = cell.querySelector('.classroom-display');
            const classroomInput = cell.querySelector('.classroom-id-input');
            if (classroomDisplay) {
                classroomDisplay.value = '';
                classroomDisplay.disabled = true;
                console.log('教室表示をクリア');  // デバッグ用
            }
            if (classroomInput) {
                classroomInput.value = '';
                console.log('教室入力をクリア');  // デバッグ用
            }

            // スタイルをリセット
            if (teacherSelect) teacherSelect.style.backgroundColor = '';
            if (classroomDisplay) classroomDisplay.style.backgroundColor = '';
        });
    });

    // 科目説明テーブルをクリア
    const subjectInfoBody = document.getElementById('subjectInfoBody');
    if (subjectInfoBody) {
        subjectInfoBody.innerHTML = '';
        console.log('科目説明テーブルをクリア');  // デバッグ用
    }

    console.log('時間割のクリア完了');  // デバッグ用
}

// 編集用の時間割を更新する関数
function updateEditSchedule(schedules) {
    console.log('更新するスケジュール:', schedules);  // デバッグ用

    schedules.forEach(schedule => {
        // 時限のインデックスを計算
        const period = schedule.period.replace('限', '');
        const periodIndex = period === '夜間' ? 6 : parseInt(period) - 1;

        // 曜日のインデックスを計算
        const dayMap = {
            'Monday': 0,
            'Tuesday': 1,
            'Wednesday': 2,
            'Thursday': 3,
            'Friday': 4,
            'Saturday': 5
        };
        const dayIndex = dayMap[schedule.day_of_week];

        console.log(`サル位置: ${periodIndex}行目, ${dayIndex}列目`);  // デバッグ用

        // セルを取得
        const rows = document.querySelectorAll('.edit-timetable tbody tr');
        const cell = rows[periodIndex]?.children[dayIndex + 1];  // +1 for time column

        if (cell) {
            // 科目の設定
            const subjectSelect = cell.querySelector('select[name*="[subject]"]');
            if (subjectSelect) {
                subjectSelect.value = schedule.subject;
                console.log(`科目を設定: ${schedule.subject}`);

                // 科目変更イベントを発火して関連フィールドの状態を更新
                const event = new Event('change', { bubbles: true });
                subjectSelect.dispatchEvent(event);
            }

            // 教師の設定
            const teacherSelect = cell.querySelector('select[name*="[teacher_id]"]');
            if (teacherSelect) {
                const teacherOption = Array.from(teacherSelect.options)
                    .find(opt => opt.text === schedule.teacher_name);
                if (teacherOption) {
                    teacherSelect.value = teacherOption.value;
                    console.log(`教師を設定: ${schedule.teacher_name}`);
                }
                teacherSelect.disabled = schedule.subject === 'FFFF';
            }

            // 教室の設定
            const classroomDisplay = cell.querySelector('.classroom-display');
            const classroomInput = cell.querySelector('.classroom-id-input');
            if (classroomDisplay && classroomInput) {
                classroomDisplay.value = schedule.classroom_id || '';
                classroomInput.value = schedule.classroom_id || '';
                classroomDisplay.disabled = schedule.subject === 'FFFF';
            }
        } else {
            console.error(`セルが見つかりません: ${schedule.period} ${schedule.day_of_week}`);
        }
    });

    // 科目説明テーブルを更新
    updateSubjectInfoTable();
}

// 時間割表のクリア
function clearScheduleDisplay() {
    document.querySelectorAll('.current-timetable .schedule-cell').forEach(cell => {
        cell.querySelector('.subject-name').textContent = '';
        cell.querySelector('.teacher-name').textContent = '';
        cell.querySelector('.classroom-number').textContent = '';
    });

    // クラス情報をクリア
    document.getElementById('displayClassName').textContent = '-';
    document.getElementById('displayTeacherName').textContent = '-';
    document.getElementById('displayPeriod').textContent = '-';
}

/**
 * 現在の時間割を更新する関数
 * @param {Array} schedules - 更新する時間割データの配列
 */
function updateCurrentSchedule(schedules) {
    console.log('Updating schedule with:', schedules);

    // 全てのセルをクリア
    document.querySelectorAll('.edit-timetable .schedule-cell').forEach(cell => {
        const subjectSelect = cell.querySelector('select[name*="[subject]"]');
        const teacherSelect = cell.querySelector('select[name*="[teacher_id]"]');
        const classroomInput = cell.querySelector('.classroom-id-input');
        const classroomDisplay = cell.querySelector('.classroom-display');

        if (subjectSelect) subjectSelect.value = '';
        if (teacherSelect) teacherSelect.value = '';
        if (classroomInput) classroomInput.value = '';
        if (classroomDisplay) classroomDisplay.value = '';
    });

    // スケジュールデータを設定
    schedules.forEach(schedule => {
        // 曜日のマッピング
        const dayMap = {
            'Monday': 2,    // 1列目は時限なので2列目から
            'Tuesday': 3,
            'Wednesday': 4,
            'Thursday': 5,
            'Friday': 6,
            'Saturday': 7
        };
        const dayIndex = dayMap[schedule.day];

        // 時限の処理
        let periodIndex;
        if (schedule.period === '夜間') {
            periodIndex = 7;
        } else {
            periodIndex = parseInt(schedule.period.replace('限', ''));
        }

        // セルの取得（より具体的なセレクタを使用）
        const cell = document.querySelector(
            `.edit-timetable tbody tr:nth-child(${periodIndex}) td[data-day="${schedule.day}"]`
        );

        if (cell) {
            const subjectSelect = cell.querySelector('select[name*="[subject]"]');
            const teacherSelect = cell.querySelector('select[name*="[teacher_id]"]');
            const classroomInput = cell.querySelector('.classroom-id-input');
            const classroomDisplay = cell.querySelector('.classroom-display');

            // 科目の設定
            if (subjectSelect) {
                const subjectValue = schedule.subject_id || schedule.subject;
                subjectSelect.value = subjectValue;
                
                // 科目選択イベントを手動で発火
                const event = new Event('change');
                subjectSelect.dispatchEvent(event);
            }

            // 教員の設定
            if (teacherSelect) {
                teacherSelect.value = schedule.teacher_id || '';
                teacherSelect.disabled = false;  // 教員選択を有効化
            }

            // 教室の設定
            if (classroomInput) {
                classroomInput.value = schedule.classroom_id || '';
            }
            if (classroomDisplay) {
                classroomDisplay.value = schedule.classroom_id || '';
            }

            // デバッグ出力
            console.log('Successfully updated cell:', {
                day: schedule.day,
                period: schedule.period,
                subject: subjectSelect?.value,
                teacher: teacherSelect?.value,
                classroom: classroomInput?.value
            });
        } else {
            console.error('Cell not found:', {
                day: schedule.day,
                period: schedule.period,
                selector: `.edit-timetable tbody tr:nth-child(${periodIndex}) td[data-day="${schedule.day}"]`
            });
        }
    });

    // サイドパネルも更新
    updateSidePanel(schedules);
}

/**
 * クラス情報の更新関数
 * クラス選択時に表示情報を更新する
 */
function updateClassInfo() {
    const classSelect = document.getElementById('class_select');
    const selectedOption = classSelect.selectedOptions[0];
    
    if (selectedOption) {
        // クラス名を取得（括弧前までの文字列）
        const className = selectedOption.text.split('(')[0].trim();
        // 担任名を取得（括弧内の "任: " 以降の文字列）
        const teacherName = selectedOption.text.match(/\(任: (.*?)\)/);

        // クラス名と担任名を表示要素に設定
        document.getElementById('displayClassName').textContent = className || '-';
        document.getElementById('displayTeacherName').textContent = teacherName ? teacherName[1] : '-';

        // 期間情報の更新
        const startDate = document.getElementById('start_date').value;
        const endDate = document.getElementById('end_date').value;
        if (startDate && endDate) {
            // 日付を日本語形式にフォーマット
            const formattedStartDate = new Date(startDate).toLocaleDateString('ja-JP');
            const formattedEndDate = new Date(endDate).toLocaleDateString('ja-JP');
            // 期間を表示
            document.getElementById('displayPeriod').textContent =
                `${formattedStartDate} ～ ${formattedEndDate}`;
        } else {
            document.getElementById('displayPeriod').textContent = '-';
        }

        // サイドパネルのタイトルを更新
        const sidePanelTitle = document.querySelector('.current-schedule h3');
        if (sidePanelTitle) {
            sidePanelTitle.textContent = `${className} 時間割`;
        }
    }
}

// 反映（一時保存）機能を修正
function applyChanges() {
    previewSchedule().then(() => {
        // プレビュー成功後、ボタンを登録に切り替え
        const actionButton = document.getElementById('actionButton');
        if (actionButton) {
            actionButton.textContent = '登録';
            actionButton.className = 'btn-save';
            // クリックイベントを変更
            actionButton.onclick = handleFormSubmit;
        }
    }).catch(error => {
        console.error('反映処理エラー:', error);
        showMessage('反映処理中にエラーが発生しました', 'error');
    });
}

// 全てがFかどうかをチェックする関数を追加
function checkAllF() {
    const subjectSelects = document.querySelectorAll('.subject-select');
    return Array.from(subjectSelects).every(select => select.value === 'FFFF');
}

// プレビュー機能を修正
async function previewSchedule() {
    const classId = document.getElementById('class_select').value;
    if (!classId) {
        showMessage('クラスを選択してください', 'error');
        return;
    }

    try {
        const schedules = collectScheduleData();
        
        // 科目説明は一時的にスキップ（PDFプレビューを優先）
        const params = new URLSearchParams({
            start_date: document.getElementById('start_date').value,
            end_date: document.getElementById('end_date').value,
            schedules: JSON.stringify(schedules),
            preview: 'true'
        });

        // PDFプレビューを新しいウィンドウで開く
        const url = `/api/generate_pdf/${classId}?${params.toString()}`;
        window.open(url, '_blank');

    } catch (error) {
        console.error('プレビューエラー:', error);
        showMessage('プレビュー生成中にエラーが発生しました', 'error');
    }
}

/**
 * サイドパネルの切り替え処理
 * パネルの展開/折りたたみを制御
 */
function toggleSidePanel() {
    const sidePanel = document.getElementById('sidePanel');
    const toggleButton = document.querySelector('.side-panel-toggle');
    const container = document.querySelector('.container');
    const arrow = toggleButton.querySelector('.toggle-arrow');

    // パネルの状態を切り替え
    if (sidePanel.classList.contains('expanded')) {
        sidePanel.classList.remove('expanded');
        toggleButton.classList.remove('expanded');
        container.classList.remove('panel-expanded');
        arrow.textContent = '‹';  // 左向き矢印
    } else {
        sidePanel.classList.add('expanded');
        toggleButton.classList.add('expanded');
        container.classList.add('panel-expanded');
        arrow.textContent = '›';  // 右向き矢印
    }
}

// スケジュールデータを収集する関数を修正
function collectScheduleData() {
    const schedules = [];
    document.querySelectorAll('.edit-timetable tbody tr').forEach((row, rowIndex) => {
        const period = rowIndex + 1;
        const periodText = period === 7 ? '夜間' : `${period}限`;
        
        row.querySelectorAll('.schedule-cell').forEach((cell, colIndex) => {
            const dayMap = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const day = dayMap[colIndex];
            
            const subjectSelect = cell.querySelector('select[name*="[subject]"]');
            const teacherSelect = cell.querySelector('select[name*="[teacher_id]"]');
            const classroomInput = cell.querySelector('.classroom-id-input');

            if (subjectSelect && subjectSelect.value) {
                schedules.push({
                    day_of_week: day,
                    period: periodText,
                    subject: subjectSelect.value,
                    subject_name: subjectSelect.options[subjectSelect.selectedIndex].text,
                    teacher_id: teacherSelect?.value || '',
                    teacher_name: teacherSelect?.options[teacherSelect.selectedIndex]?.text || '',
                    classroom_id: classroomInput?.value || ''
                });
            }
        });
    });
    return schedules;
}

// フォーム送信時の処理
async function handleFormSubmit(event) {
    event.preventDefault();

    if (!validateForm()) {
        return;
    }

    try {
        const classId = document.getElementById('class_select').value;
        const schedules = [];
        
        // スケジュールデータの収集
        document.querySelectorAll('.edit-timetable tbody tr').forEach((row, rowIndex) => {
            const period = rowIndex + 1;
            const periodText = period === 7 ? '夜間' : `${period}限`;
            
            row.querySelectorAll('.schedule-cell').forEach((cell, colIndex) => {
                const dayMap = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                const day = dayMap[colIndex];
                
                const subjectSelect = cell.querySelector('select[name*="[subject]"]');
                const teacherSelect = cell.querySelector('select[name*="[teacher_id]"]');
                const classroomInput = cell.querySelector('.classroom-id-input');

                if (subjectSelect && subjectSelect.value) {
                    schedules.push({
                        day_of_week: day,
                        period: periodText,
                        subject: subjectSelect.value,  // 保存時は科目IDを使用
                        teacher_id: teacherSelect?.value || '',
                        classroom_id: classroomInput?.value || ''
                    });
                }
            });
        });

        // デバッグ出力
        console.log('Sending schedules:', schedules);

        const formData = new FormData();
        formData.append('class_id', classId);
        formData.append('schedules', JSON.stringify(schedules));
        formData.append('start_date', document.getElementById('start_date').value);
        formData.append('end_date', document.getElementById('end_date').value);

        const response = await fetch('/register/class_schedule', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'サーバーエラーが発生しました');
        }

        showMessage('時間割が正常に保存されました', 'success');
        
        // 保存ボタンを反映ボタンに戻す
        const actionButton = document.getElementById('actionButton');
        if (actionButton) {
            actionButton.textContent = '反映';
            actionButton.className = 'btn-apply';
        }

    } catch (error) {
        console.error('Error:', error);
        showMessage(error.message || 'エラーが発生しました', 'error');
    }
}

// メォムのバリデーション
function validateForm() {
    const classSelect = document.getElementById('class_select');
    if (!classSelect.value) {
        showMessage('クラスを選択してください', 'error');
        return false;
    }

    const startDate = document.getElementById('start_date');
    const endDate = document.getElementById('end_date');
    if (!startDate.value || !endDate.value) {
        showMessage('開始日と終了日を入力してください', 'error');
        return false;
    }

    if (new Date(startDate.value) > new Date(endDate.value)) {
        showMessage('開始日は終了日より前の日付を選択してください', 'error');
        return false;
    }

    return true;
}

// メッセージ表示関数
function showMessage(message, type) {
    const container = document.querySelector('.container');
    if (!container) return;

    // 既存アラートを削除
    document.querySelectorAll('.alert').forEach(alert => alert.remove());

    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;

    const firstChild = container.firstChild;
    if (firstChild) {
        container.insertBefore(alertDiv, firstChild);
    } else {
        container.appendChild(alertDiv);
    }

    setTimeout(() => {
        alertDiv.remove();
    }, 3000);
}

// PDF生成関数
async function generatePDF() {
    const classId = document.getElementById('class_select').value;
    if (!classId) {
        showMessage('クラスを選択してください', 'error');
        return;
    }

    try {
        // 現在の入力データを収集
        const schedules = [];
        document.querySelectorAll('.edit-timetable tbody tr').forEach((row, rowIndex) => {
            const period = rowIndex + 1;
            const periodText = period === 7 ? '夜間' : `${period}限`;
            
            row.querySelectorAll('.schedule-cell').forEach((cell, colIndex) => {
                const dayMap = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                const day = dayMap[colIndex];
                
                const subjectSelect = cell.querySelector('select[name*="[subject]"]');
                const teacherSelect = cell.querySelector('select[name*="[teacher_id]"]');
                const classroomInput = cell.querySelector('.classroom-id-input');

                if (subjectSelect && subjectSelect.value) {
                    schedules.push({
                        day_of_week: day,
                        period: periodText,
                        subject: subjectSelect.value,
                        teacher_name: teacherSelect?.options[teacherSelect.selectedIndex]?.text || '',
                        classroom_id: classroomInput?.value || ''
                    });
                }
            });
        });

        // クエリパラメータを構築
        const params = new URLSearchParams({
            start_date: document.getElementById('start_date').value,
            end_date: document.getElementById('end_date').value,
            schedules: JSON.stringify(schedules)
        });

        // GETリクエストでPDFを生成
        const response = await fetch(`/api/generate_pdf/${classId}?${params.toString()}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/pdf'
            }
        });

        if (!response.ok) {
            throw new Error('PDF生成に失敗しました');
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `timetable_${classId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
    } catch (error) {
        console.error('PDF生成エラー:', error);
        showMessage('PDF生成中にエラーが発生しました', 'error');
    }
}

// すべてをFにする関数を修正
function setAllToF() {
    // 全ての科目選択をFFFFに設定
    document.querySelectorAll('.edit-timetable select[name*="[subject]"]').forEach(select => {
        select.value = 'FFFF';
        // 変更イベントを発火
        const event = new Event('change');
        select.dispatchEvent(event);
    });

    // 教員と教室の選択をクリア
    document.querySelectorAll('.edit-timetable .teacher-select').forEach(select => {
        select.value = '';
        select.disabled = true;
    });

    document.querySelectorAll('.edit-timetable .classroom-id-input').forEach(input => {
        input.value = '';
    });

    document.querySelectorAll('.edit-timetable .classroom-display').forEach(display => {
        display.value = '';
    });

    // メッセージを表示
    showMessage('全ての時限をFに設定しました。プレビューボタンで確認できます。', 'success');

    // 保存ボタンの状態を更新
    const actionButton = document.getElementById('actionButton');
    if (actionButton) {
        actionButton.textContent = '反映';
        actionButton.className = 'btn-apply';
    }
}

// プレビューボタンのイベントリスナーを設定
document.querySelector('.btn-preview')?.addEventListener('click', function(e) {
    e.preventDefault();
    previewSchedule();
});

// フォームの変更を検知する関数
function setupChangeDetection() {
    // 科目選択の変更検知
    document.querySelectorAll('.subject-select').forEach(select => {
        select.addEventListener('change', handleFormChange);
    });

    // 教師選択の変更検知
    document.querySelectorAll('.teacher-select').forEach(select => {
        select.addEventListener('change', handleFormChange);
    });

    // 教室選択の変更検知
    document.querySelectorAll('.classroom-display').forEach(input => {
        input.addEventListener('change', handleFormChange);
    });
}

// フォーム変更時の処理
function handleFormChange() {
    const actionButton = document.getElementById('actionButton');
    if (actionButton && actionButton.textContent === '保存') {
        // 保存状態か反状態に戻す
        actionButton.textContent = '反映';
        actionButton.className = 'btn-apply';
    }
}

// 反映/保存ボタンの処理
function handleActionButton() {
    const actionButton = document.getElementById('actionButton');
    if (actionButton.textContent === '反映') {
        // 反映処理
        applyChanges();
        // ボタンを保存ボタンに切り替え
        actionButton.textContent = '保存';
        actionButton.className = 'btn-save';
    } else {
        // 保存処理
        document.getElementById('scheduleForm').submit();
    }
}

// プレースホルダーの処理を追加
document.addEventListener('DOMContentLoaded', function () {
    document.addEventListener('focus', function (e) {
        if (e.target.matches('td[contenteditable="true"]')) {
            if (!e.target.textContent.trim()) {
                e.target.textContent = '';
            }
        }
    }, true);

    document.addEventListener('blur', function (e) {
        if (e.target.matches('td[contenteditable="true"]')) {
            if (!e.target.textContent.trim() && e.target.hasAttribute('data-placeholder')) {
                e.target.textContent = '';
            }
        }
    }, true);
});

// 既存のスケジュールを取得する関数を修正
async function fetchExistingSchedule() {
    const classId = document.getElementById('class_select').value;
    if (!classId) return;

    try {
        const response = await fetch(`/api/class_schedule/${classId}`);
        if (!response.ok) {
            throw new Error('スケジュールの取得に失敗しました');
        }
        const data = await response.json();
        
        // デバッグ出力
        console.log('Fetched schedules:', data.schedules);
        
        if (Array.isArray(data.schedules)) {
            updateCurrentSchedule(data.schedules);
        } else {
            console.error('Invalid schedule data format:', data);
            showMessage('スケジュールデータの形式が不正です', 'error');
        }
    } catch (error) {
        console.error('Error fetching schedule:', error);
        showMessage('スケジュールの取得中にエラーが発生しました', 'error');
    }
}

// クラス選択時のイベントリスナーを設定
document.getElementById('class_select')?.addEventListener('change', function() {
    if (this.value) {
        fetchExistingSchedule();
    }
});

// ページ読み込み時に既存のスケジュールを取得
document.addEventListener('DOMContentLoaded', function() {
    const classSelect = document.getElementById('class_select');
    if (classSelect && classSelect.value) {
        fetchExistingSchedule();
    }
});

// サイドパネルの更新関数を修正
function updateSidePanel(schedules) {
    const sidePanel = document.querySelector('.current-timetable');
    if (!sidePanel) return;

    // 全てのセルをクリア
    sidePanel.querySelectorAll('.schedule-cell').forEach(cell => {
        cell.querySelector('.subject-name').textContent = '';
        cell.querySelector('.teacher-name').textContent = '';
        cell.querySelector('.classroom-number').textContent = '';
    });

    // スケジュールデータを設定
    schedules.forEach(schedule => {
        const periodIndex = schedule.period === '夜間' ? 7 : parseInt(schedule.period);
        const dayIndex = {
            'Monday': 1,
            'Tuesday': 2,
            'Wednesday': 3,
            'Thursday': 4,
            'Friday': 5,
            'Saturday': 6
        }[schedule.day_of_week];

        if (periodIndex && dayIndex) {
            const cell = sidePanel.querySelector(
                `tbody tr:nth-child(${periodIndex}) td:nth-child(${dayIndex + 1})`
            );
            
            if (cell) {
                // 科目名を正しく表示
                cell.querySelector('.subject-name').textContent = schedule.subject_name || schedule.subject;
                cell.querySelector('.teacher-name').textContent = schedule.teacher_name || '';
                cell.querySelector('.classroom-number').textContent = 
                    schedule.classroom_id ? `${schedule.classroom_id}教室` : '';
            }
        }
    });
}