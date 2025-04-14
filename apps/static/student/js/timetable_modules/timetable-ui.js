// 時間割のUI操作を管理するモジュール
import EventBus from './event-bus.js';
import TimetableCore from './timetable-core.js';
import ModalManager from './modal-manager.js';
import CommentManager from './comment-manager.js';

const TimetableUI = {
    isEditMode: false,
    timetableElement: null,

    // 初期化
    async init() {
        console.log('TimetableUI 初期化開始');

        // 時間割要素を取得
        this.timetableElement = document.querySelector('.timetable.current-timetable');
        if (!this.timetableElement) {
            console.warn('時間割要素が見つかりません');
            return false;
        }

        // 編集モードの初期状態を設定
        this.loadEditModeState();

        // イベント購読を設定
        this.setupEventSubscriptions();

        // UIコンポーネントを初期化
        this.setupUIComponents();

        // 時間割セルのイベントを設定
        this.setupTimetableCellEvents();

        // セルのダブルクリックイベントを設定
        this.setupCellDoubleClickEvents();

        // 初期データを読み込み
        await this.loadInitialData();

        console.log('TimetableUI 初期化完了');

        // 初期化完了イベントを発行
        EventBus.publish('ui:initialized', {});

        return true;
    },

    // 初期データを読み込み
    async loadInitialData() {
        try {
            console.log('初期データを読み込み');

            // 全データを取得
            const data = await TimetableCore.fetchAllData();
            if (!data) {
                throw new Error('データの取得に失敗しました');
            }

            // 時間割表示を更新
            this.updateTimetableDisplay(data);

            return true;
        } catch (error) {
            console.error('初期データ読み込みエラー:', error);
            return false;
        }
    },

    // 編集モードの状態を読み込み
    loadEditModeState() {
        // デフォルトは閲覧モード（false）
        this.isEditMode = false;

        // ローカルストレージから編集モードの状態を取得
        // ただし、初回ロード時は常に閲覧モードにする
        const savedMode = localStorage.getItem('timetableEditMode');
        if (savedMode !== null) {
            // 2回目以降のロード時のみローカルストレージの値を使用
            this.isEditMode = savedMode === 'true';
        }

        // グローバル変数も更新
        window.isEditMode = this.isEditMode;

        console.log(`編集モードを読み込み: ${this.isEditMode ? 'ON' : 'OFF'}`);

        // 編集モードに応じてUIを更新
        this.updateEditModeUI();

        // 編集モードの状態をローカルストレージに保存（初期値を確実に保存）
        localStorage.setItem('timetableEditMode', this.isEditMode);
    },

    // 編集モードを切り替える
    toggleEditMode() {
        // 現在の状態を反転
        this.isEditMode = !this.isEditMode;

        // グローバル変数も更新
        window.isEditMode = this.isEditMode;

        console.log(`編集モードを切り替え: ${this.isEditMode ? 'ON' : 'OFF'}`);

        // 編集モードに応じてUIを更新
        this.updateEditModeUI();

        // 編集モードの状態をローカルストレージに保存
        localStorage.setItem('timetableEditMode', this.isEditMode);

        // 編集モード変更イベントを発行
        EventBus.publish('ui:editModeChanged', {
            isEditMode: this.isEditMode
        });

        return this.isEditMode;
    },

    // 編集モードUIを更新（拡張版）
    updateEditModeUI() {
        // 時間割要素のクラスを更新
        if (this.timetableElement) {
            if (this.isEditMode) {
                this.timetableElement.classList.add('edit-mode');
            } else {
                this.timetableElement.classList.remove('edit-mode');
            }
        }

        // body要素のクラスを更新
        if (this.isEditMode) {
            document.body.classList.add('edit-mode');
        } else {
            document.body.classList.remove('edit-mode');
        }

        // 全セルの編集可能状態を更新
        const cells = document.querySelectorAll('.schedule-cell');
        cells.forEach(cell => {
            if (this.isEditMode) {
                cell.classList.add('editable');
            } else {
                cell.classList.remove('editable');
            }
        });

        // 編集モードトグルの状態を更新
        const editModeToggle = document.getElementById('edit-mode-toggle');
        if (editModeToggle) {
            editModeToggle.checked = this.isEditMode;
        }

        // PDFアップロードボタンの表示/非表示
        const pdfUploadBtn = document.getElementById('pdfUploadBtn');
        if (pdfUploadBtn) {
            pdfUploadBtn.style.display = this.isEditMode ? 'inline-block' : 'none';
        }

        // PDF読み込みボタンの表示/非表示
        const pdfLoadBtn = document.getElementById('loadPdfBtn');
        if (pdfLoadBtn) {
            pdfLoadBtn.style.display = this.isEditMode ? 'flex' : 'none';
        }
    },

    // 時間割表示を更新
    updateTimetableDisplay(data) {
        console.log('時間割表示を更新:', data);

        // データがない場合は何もしない
        if (!data) {
            console.warn('更新するデータがありません');
            return;
        }

        // APIレスポンスの形式に応じて処理を分岐
        if (data.schedules) {
            // 新しいAPI形式: { schedules: [...] }
            console.log('新しいAPI形式のデータを処理します');
            const schedules = data.schedules;
            for (const schedule of schedules) {
                const day = schedule.day;
                const period = schedule.period;
                console.log(`スケジュール更新: day=${day}, period=${period}`, schedule);
                this.updateCellContent(day, period, schedule);
            }
        } else if (Array.isArray(data)) {
            // 配列形式: [{ day: '...', period: '...', ... }, ...]
            console.log('配列形式のデータを処理します');
            for (const schedule of data) {
                const day = schedule.day;
                const period = schedule.period;
                console.log(`スケジュール更新: day=${day}, period=${period}`, schedule);
                this.updateCellContent(day, period, schedule);
            }
        } else if (typeof data === 'object') {
            // オブジェクト形式: { day_period: {...}, ... } または { day: { period: {...}, ... }, ... }
            console.log('オブジェクト形式のデータを処理します');

            // day_period形式のチェック
            let hasDayPeriodKeys = false;
            for (const key in data) {
                if (key.includes('_')) {
                    hasDayPeriodKeys = true;
                    const [day, period] = key.split('_');
                    if (day && period) {
                        console.log(`スケジュール更新: day=${day}, period=${period}`, data[key]);
                        this.updateCellContent(day, period, data[key]);
                    }
                }
            }

            // day: { period: {...} } 形式のチェック
            if (!hasDayPeriodKeys) {
                for (const day in data) {
                    if (typeof data[day] === 'object') {
                        for (const period in data[day]) {
                            console.log(`スケジュール更新: day=${day}, period=${period}`, data[day][period]);
                            this.updateCellContent(day, period, data[day][period]);
                        }
                    }
                }
            }
        }

        // 時間割更新イベントを発行
        EventBus.publish('ui:timetableUpdated', {
            data
        });
    },

    // セルクリックイベントハンドラ
    handleCellClick(event) {
        const cell = event.currentTarget;
        const day = cell.dataset.day;
        const period = cell.dataset.period;
        const scheduleId = cell.dataset.scheduleId;

        console.log(`セルクリック: day=${day}, period=${period}, scheduleId=${scheduleId}`);

        // 編集モードの場合は編集モーダルを表示
        if (this.isEditMode) {
            // モーダルマネージャーを使用して編集モーダルを表示
            ModalManager.showEditModal(day, period, scheduleId);
        } else {
            // 閲覧モードの場合は授業情報モーダルを表示
            if (scheduleId) {
                // ScheduleInfoManagerを使用して授業情報モーダルを表示
                EventBus.publish('ui:cellClicked', {
                    day,
                    period,
                    scheduleId
                });
            }
        }
    },

    // イベント購読を設定
    setupEventSubscriptions() {
        // 編集モード切り替えボタンのイベントを設定
        const editModeToggle = document.getElementById('edit-mode-toggle');
        if (editModeToggle) {
            editModeToggle.addEventListener('change', (e) => {
                this.isEditMode = e.target.checked;
                this.updateEditModeUI();

                // グローバル変数も更新
                window.isEditMode = this.isEditMode;

                // ローカルストレージに保存
                localStorage.setItem('timetableEditMode', this.isEditMode);

                // イベント発行
                EventBus.publish('ui:editModeChanged', {
                    isEditMode: this.isEditMode
                });
            });
        }

        // その他のイベント購読
        this.eventSubscriptions = [
            EventBus.subscribe('core:dataLoaded', data => {
                this.updateTimetableDisplay(data.data);
            })
        ];
    },

    // UIコンポーネントを初期化
    setupUIComponents() {
        // 編集モードトグルボタンを設定
        const editModeToggle = document.getElementById('edit-mode-toggle');
        if (editModeToggle) {
            editModeToggle.checked = this.isEditMode;
        }

        // 編集モードボタンを作成（存在しない場合）
        if (!editModeToggle) {
            this.createEditModeToggle();
        }
    },

    // 編集モードトグルボタンを作成
    createEditModeToggle() {
        const container = document.querySelector('.timetable-controls');
        if (!container) return;

        const toggleWrapper = document.createElement('div');
        toggleWrapper.className = 'edit-mode-toggle-wrapper';

        toggleWrapper.innerHTML = `
            <label class="switch">
                <input type="checkbox" id="edit-mode-toggle" ${this.isEditMode ? 'checked' : ''}>
                <span class="slider round"></span>
            </label>
            <span class="toggle-label">編集モード</span>
        `;

        container.appendChild(toggleWrapper);

        // イベントリスナーを設定
        const toggle = toggleWrapper.querySelector('#edit-mode-toggle');
        toggle.addEventListener('change', (e) => {
            this.isEditMode = e.target.checked;
            this.updateEditModeUI();

            // グローバル変数も更新
            window.isEditMode = this.isEditMode;

            // ローカルストレージに保存
            localStorage.setItem('timetableEditMode', this.isEditMode);

            // イベント発行
            EventBus.publish('ui:editModeChanged', {
                isEditMode: this.isEditMode
            });
        });
    },

    // 時間割セルのイベントを設定
    setupTimetableCellEvents() {
        if (!this.timetableElement) return;

        const cells = this.timetableElement.querySelectorAll('.schedule-cell');
        cells.forEach(cell => {
            // クリックイベントを設定
            cell.addEventListener('click', this.handleCellClick.bind(this));
        });
    },

    // セル内容を更新
    updateCellContent(day, period, data) {
        console.log(`セル内容を更新: day=${day}, period=${period}`, data);

        // 曜日と時限の形式を正規化
        const normalizedDay = this.normalizeDay(day);
        const normalizedPeriod = this.normalizePeriod(period);

        console.log(`正規化後: day=${normalizedDay}, period=${normalizedPeriod}`);

        // セルを取得（複数の方法で試行）
        let cell = null;

        // 方法1: 正規化した値で検索
        cell = this.timetableElement.querySelector(`.schedule-cell[data-day="${normalizedDay}"][data-period="${normalizedPeriod}"]`);

        // 方法2: 正規化した値 + "限" で検索
        if (!cell) {
            cell = this.timetableElement.querySelector(`.schedule-cell[data-day="${normalizedDay}"][data-period="${normalizedPeriod}限"]`);
        }

        // 方法3: 元の値で検索
        if (!cell) {
            cell = this.timetableElement.querySelector(`.schedule-cell[data-day="${day}"][data-period="${period}"]`);
        }

        // 方法4: 曜日のみで検索して、時限を手動で確認
        if (!cell) {
            const cellsWithDay = this.timetableElement.querySelectorAll(`.schedule-cell[data-day="${normalizedDay}"]`);
            for (const c of cellsWithDay) {
                const cellPeriod = c.dataset.period;
                if (cellPeriod === normalizedPeriod ||
                    cellPeriod === `${normalizedPeriod}限` ||
                    cellPeriod === period) {
                    cell = c;
                    break;
                }
            }
        }

        // それでも見つからない場合はログを出力して終了
        if (!cell) {
            console.warn(`セルが見つかりません: day=${day}, period=${period} (正規化後: day=${normalizedDay}, period=${normalizedPeriod})`);

            // デバッグ用：すべてのセルの属性を出力
            if (this.timetableElement) {
                const allCells = this.timetableElement.querySelectorAll('.schedule-cell');
                console.log(`時間割表内のセル数: ${allCells.length}`);
                console.log('すべてのセル属性:');
                allCells.forEach(c => {
                    console.log(`セル属性: day=${c.dataset.day}, period=${c.dataset.period}`);
                });
            }

            return;
        }

        // セル内のコンテンツ要素を取得または作成
        let content = cell.querySelector('.cell-content');
        if (!content) {
            content = document.createElement('div');
            content.className = 'cell-content';
            cell.appendChild(content);
        }

        // データがない場合は空にする
        if (!data) {
            content.innerHTML = '';
            content.removeAttribute('data-schedule-id');
            cell.dataset.scheduleId = '';
            return;
        }

        // スケジュールIDを設定（複数の可能性を考慮）
        const scheduleId = data.id || data.schedule_id || '';
        content.dataset.scheduleId = scheduleId;
        cell.dataset.scheduleId = scheduleId;

        // 内容を更新
        let html = '';

        // 科目名（複数の可能性を考慮）
        const subject = data.subject || data.subject_name || '';
        if (subject) {
            html += `<div class="subject-name">${subject}</div>`;
        }

        // 教員名（複数の可能性を考慮）
        let teacher = '';
        if (data.teacher) {
            if (typeof data.teacher === 'string') {
                teacher = data.teacher;
            } else if (data.teacher.name) {
                teacher = data.teacher.name;
            }
        } else if (data.teacher_name) {
            teacher = data.teacher_name;
        }

        if (teacher) {
            html += `<div class="teacher-name">${teacher}</div>`;
        }

        // 教室（複数の可能性を考慮）
        let classroom = '';
        if (data.classroom) {
            if (typeof data.classroom === 'string') {
                classroom = data.classroom;
            } else if (data.classroom.classroom_id) {
                classroom = data.classroom.classroom_id;
            }
        } else if (data.classroom_id) {
            classroom = data.classroom_id;
        }

        if (classroom) {
            html += `<div class="classroom-number">${classroom}</div>`;
        }

        content.innerHTML = html;

        // セル更新イベントを発行
        EventBus.publish('ui:cellUpdated', {
            day: normalizedDay,
            period: normalizedPeriod,
            data
        });
    },

    // 曜日を正規化する関数
    normalizeDay(day) {
        if (!day) return '';

        // 英語の曜日名を日本語に変換（HTMLのセルは日本語の曜日を使用）
        const dayMap = {
            'monday': '月',
            'tuesday': '火',
            'wednesday': '水',
            'thursday': '木',
            'friday': '金',
            'saturday': '土',
            'sunday': '日',
            'Monday': '月',
            'Tuesday': '火',
            'Wednesday': '水',
            'Thursday': '木',
            'Friday': '金',
            'Saturday': '土',
            'Sunday': '日',
            'mon': '月',
            'tue': '火',
            'wed': '水',
            'thu': '木',
            'fri': '金',
            'sat': '土',
            'sun': '日'
        };

        // 変換マップから検索
        return dayMap[day] || day;
    },

    // 時限を正規化する関数
    normalizePeriod(period) {
        if (!period) return '';

        // 文字列に変換
        period = String(period);

        // 数字のみの場合（例: "3"）
        if (/^\d+$/.test(period)) {
            return `${period}`;
        }

        // "限"が含まれている場合は削除（例: "3限" → "3"）
        if (period.includes('限')) {
            return period.replace('限', '');
        }

        return period;
    },

    // クリーンアップ
    cleanup() {
        // イベント購読を解除
        if (this.eventSubscriptions) {
            this.eventSubscriptions.forEach(unsubscribe => unsubscribe());
            this.eventSubscriptions = [];
        }
    },

    // セルのダブルクリックイベントを設定
    setupCellDoubleClickEvents() {
        if (!this.timetableElement) {
            console.warn('時間割要素がないためダブルクリックイベントを設定できません');
            return;
        }

        const cells = this.timetableElement.querySelectorAll('.schedule-cell');
        console.log(`ダブルクリックイベントを設定: ${cells.length}個のセル`);

        cells.forEach((cell, index) => {
            // 既存のイベントリスナーを削除（重複防止）
            cell.removeEventListener('dblclick', this.handleCellDoubleClick);

            // 新しいイベントリスナーを追加
            cell.addEventListener('dblclick', this.handleCellDoubleClick.bind(this));

            // デバッグ用：最初の数個のセルの情報を出力
            if (index < 3) {
                console.log(`セル${index + 1}:`, {
                    day: cell.dataset.day,
                    period: cell.dataset.period,
                    id: cell.dataset.scheduleId
                });
            }
        });

        console.log('ダブルクリックイベントの設定が完了しました');
    },

    // セルのダブルクリックイベントハンドラ
    handleCellDoubleClick(event) {
        // 編集モードの場合はダブルクリックイベントを無視
        if (this.isEditMode) {
            console.log('編集モード中はダブルクリックイベントを無視します');
            return;
        }
        
        const cell = event.currentTarget;
        const day = cell.dataset.day;
        const period = cell.dataset.period;
        const scheduleId = cell.dataset.scheduleId;
        
        console.log(`セルダブルクリック: day=${day}, period=${period}, scheduleId=${scheduleId}`);
        
        // イベント発行（ScheduleInfoManagerがこのイベントを購読して処理）
        EventBus.publish('ui:cellDoubleClicked', {
            day,
            period,
            scheduleId
        });
    },

    // 授業情報モーダルを表示
    async showScheduleInfoModal(day, period, scheduleId) {
        try {
            console.log(`授業情報モーダル表示: day=${day}, period=${period}, scheduleId=${scheduleId}`);

            // データを取得
            const data = await TimetableCore.fetchData(day, period);

            if (!data) {
                console.error('データが取得できませんでした');
                return;
            }

            // 授業情報モーダルを取得
            const modal = document.getElementById('scheduleInfoModal');
            if (!modal) {
                console.error('授業情報モーダルが見つかりません');
                return;
            }

            // スケジュール情報を表示
            const scheduleInfoContainer = modal.querySelector('#scheduleInfoContainer');
            if (!scheduleInfoContainer) {
                console.error('スケジュール情報コンテナが見つかりません');
                return;
            }

            // 教員情報を取得
            const teacherName = data.teacher ? data.teacher.name : (data.teacher_name || '未設定');

            // 教室情報を取得
            const classroomId = data.classroom ? data.classroom.classroom_id : (data.classroom_id || '未設定');

            // 資料URLを取得
            let scheduleFileUrl = data.schedule_file_url || '';

            // URLを正規化
            if (scheduleFileUrl && !scheduleFileUrl.startsWith('/')) {
                scheduleFileUrl = '/' + scheduleFileUrl;
            }

            // ファイルパスの修正（uploads/schedules/ を確認）
            if (scheduleFileUrl && !scheduleFileUrl.includes('/uploads/schedules/') && scheduleFileUrl.includes('schedules/')) {
                scheduleFileUrl = scheduleFileUrl.replace('schedules/', '/uploads/schedules/');
            }

            // ファイル拡張子を取得
            const getFileExtension = (url) => {
                if (!url) return '';
                const parts = url.split('.');
                return parts.length > 1 ? parts.pop().toLowerCase() : '';
            };

            const fileExt = getFileExtension(scheduleFileUrl);
            const isPdf = fileExt === 'pdf';
            const isImage = ['jpg', 'jpeg', 'png', 'gif'].includes(fileExt);

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

            // モーダルのタイトルを変更
            const modalHeader = modal.querySelector('.schedule-modal-header h3');
            if (modalHeader) {
                modalHeader.textContent = '授業情報';
            }

            // スケジュール情報を表示
            scheduleInfoContainer.innerHTML = `
                <div class="schedule-info">
                    <div class="schedule-header">
                        <span class="schedule-day-period">${dayJp} ${period}限</span>
                    </div>
                    <div class="schedule-details">
                        <div class="schedule-subject">${data.subject_name || '科目名なし'}</div>
                        <div class="schedule-teacher">担当: ${teacherName}</div>
                        <div class="schedule-classroom">教室: ${classroomId}</div>
                        <div class="schedule-content">
                            <h4>授業内容:</h4>
                            <p>${data.content || '授業内容なし'}</p>
                        </div>
                        ${scheduleFileUrl ? `                            <div class="schedule-file">
                                <h4>授業資料:</h4>
                                ${isPdf ? `
                                    <div class="file-preview">
                                        <a href="${scheduleFileUrl}" target="_blank" class="file-link">
                                            <i class="fas fa-file-pdf"></i> PDFを表示
                                        </a>
                                    </div>
                                ` : isImage ? `
                                    <div class="file-preview">
                                        <a href="${scheduleFileUrl}" target="_blank" class="file-link">
                                            <i class="fas fa-file-image"></i> 画像を表示
                                        </a>
                                    </div>
                                ` : `
                                    <div class="file-preview">
                                        <a href="${scheduleFileUrl}" target="_blank" class="file-link">
                                            <i class="fas fa-file"></i> ファイルを表示
                                        </a>
                                    </div>
                                `}
                                <a href="${scheduleFileUrl}" download class="download-link">
                                    <i class="fas fa-download"></i> ダウンロード
                                </a>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;

            // モーダルを表示
            modal.classList.remove('hidden');

            // モーダルの閉じるボタンにイベントリスナーを追加
            const closeButtons = modal.querySelectorAll('.schedule-modal-close');
            closeButtons.forEach(button => {
                button.onclick = () => {
                    modal.classList.add('hidden');
                };
            });

            // オーバーレイクリックでも閉じる
            const overlay = modal.querySelector('.schedule-modal-overlay');
            if (overlay) {
                overlay.onclick = (e) => {
                    // イベントの伝播を停止
                    e.stopPropagation();
                    modal.classList.add('hidden');
                };
            }

            // モーダル表示イベントを発行
            EventBus.publish('scheduleInfo:shown', {
                day,
                period,
                data
            });

        } catch (error) {
            console.error('授業情報モーダル表示エラー:', error);
            alert('授業情報の表示に失敗しました');
        }
    },

    // 特定のセルを空にする
    clearCell(day, period) {
        console.log(`セルをクリア: day=${day}, period=${period}`);

        // 曜日と時限を正規化
        const normalizedDay = this.normalizeDay(day);
        const normalizedPeriod = this.normalizePeriod(period);

        // セルを取得
        const cell = this.timetableElement.querySelector(`.schedule-cell[data-day="${normalizedDay}"][data-period="${normalizedPeriod}"]`);

        if (!cell) {
            console.warn(`セルが見つかりません: day=${normalizedDay}, period=${normalizedPeriod}`);
            return;
        }

        // セル内のコンテンツをクリア
        const content = cell.querySelector('.cell-content');
        if (content) {
            content.innerHTML = '';
        }

        // スケジュールIDをクリア
        cell.dataset.scheduleId = '';

        console.log(`セルをクリアしました: day=${normalizedDay}, period=${normalizedPeriod}`);

        // セル更新イベントを発行
        EventBus.publish('ui:cellUpdated', {
            day: normalizedDay,
            period: normalizedPeriod,
            data: null
        });
    }
};

export default TimetableUI;
