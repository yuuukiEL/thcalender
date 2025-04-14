console.log('[diary.js] Script loaded');

// グローバルスコープで変数を定義
let imageInput = null;
let refreshImageBtn = null;
let currentActiveButton = 1; // 現在選択中のボタン番号

// 画像管理のための配列
const imageStates = {
    1: { preview: null, file: null, id: null },
    2: { preview: null, file: null, id: null },
    3: { preview: null, file: null, id: null }
};

// ボタンのクリック管理用の変数
const buttonClickStates = {
    1: { lastClick: 0, clickCount: 0 },
    2: { lastClick: 0, clickCount: 0 },
    3: { lastClick: 0, clickCount: 0 }
};

document.addEventListener('DOMContentLoaded', function() {
    console.log('[diary.js] DOM fully loaded and parsed');
    
    // DOM要素の取得
    const prevDateBtn = document.getElementById('prevDay');
    const nextDateBtn = document.getElementById('nextDay');
    const currentDateElem = document.getElementById('currentDate');
    const calendarBtn = document.getElementById('calendarBtn');
    const imageUploadBtn = document.getElementById('imageUploadBtn');
    const imagePreview = document.getElementById('imagePreview');
    const diaryContent = document.getElementById('diaryContent');
    const taskList = document.getElementById('taskList');
    const addTaskBtn = document.querySelector('.add-task-btn');
    const locationBtn = document.getElementById('locationBtn');
    const settingsBtn = document.getElementById('settingsBtn');
    const saveBtn = document.getElementById('saveBtn');
    const newSaveBtn = document.getElementById('newSaveBtn');
    const pointsContainer = document.getElementById('pointsContainer');
    const pointsTooltip = document.getElementById('pointsTooltip');
    const totalPointsElement = document.getElementById('totalPoints');
    
    // グローバル変数の初期化
    refreshImageBtn = document.getElementById('refreshImageBtn');

    // 画像入力要素の取得（既存の要素を使用）
    imageInput = document.getElementById('imageInput');
    if (!imageInput) {
        // 存在しない場合のみ新規作成
        imageInput = document.createElement('input');
        imageInput.type = 'file';
        imageInput.accept = 'image/*';
        imageInput.style.display = 'none';
        imageInput.id = 'imageInput';
        document.body.appendChild(imageInput);
    }

    // 要素の存在確認をログ出力
    console.log('Elements check:', {
        prevDateBtn: !!prevDateBtn,
        nextDateBtn: !!nextDateBtn,
        currentDateElem: !!currentDateElem,
        calendarBtn: !!calendarBtn,
        imageUploadBtn: !!imageUploadBtn,
        imagePreview: !!imagePreview,
        diaryContent: !!diaryContent,
        taskList: !!taskList,
        addTaskBtn: !!addTaskBtn,
        locationBtn: !!locationBtn,
        settingsBtn: !!settingsBtn,
        saveBtn: !!saveBtn,
        newSaveBtn: !!newSaveBtn,
        pointsContainer: !!pointsContainer,
        pointsTooltip: !!pointsTooltip,
        totalPointsElement: !!totalPointsElement,
        refreshImageBtn: !!refreshImageBtn,
        imageInput: !!imageInput
    });

    // 保存ボタンのイベントリスナー
    initializeSaveButtons();
    initializeHashtagFeature();
    initStickyNotes();

    let currentDate = new Date();

    // 日付表示の更新
    function updateDateDisplay() {
        if (currentDateElem) {
            currentDateElem.textContent = currentDate.toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
        }
    }

    // イベントリスナーの追加（要素の存在確認付き）
    if (prevDateBtn) {
        prevDateBtn.addEventListener('click', function () {
            currentDate.setDate(currentDate.getDate() - 1);
            updateDateDisplay();
        });
    }

    if (nextDateBtn) {
        nextDateBtn.addEventListener('click', function () {
            currentDate.setDate(currentDate.getDate() + 1);
            updateDateDisplay();
        });
    }

    // 画像アップロード関連の処理
    // 画像を参照ボタンのイベントリスナー
    if (imageUploadBtn && imageInput) {
        console.log('画像アップロードボタンのイベントリスナーを設定');
        imageUploadBtn.addEventListener('click', () => {
            console.log('画像アップロードボタンがクリックされました');
            imageInput.click();
        });
    }

    // 画像選択時の処理
    if (imageInput) {
        imageInput.addEventListener('change', function() {
            console.log('画像が選択されました');
            const files = this.files;
            if (files.length > 0) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    // 現在選択中のボタン番号の画像状態を更新
                    imageStates[currentActiveButton] = {
                        preview: e.target.result,
                        file: files[0],
                        id: null
                    };
                    updateImagePreview(currentActiveButton);
                };
                reader.readAsDataURL(files[0]);
            }
            // 入力をクリアして、同じファイルを再度選択できるようにする
            this.value = '';
        });
    }

    // 画像プレビューを更新する関数
    function updateImagePreview(buttonNumber) {
        if (imagePreview) {
            const imageState = imageStates[buttonNumber];
            if (imageState && imageState.preview) {
                if (imageState.id) {
                    // データベースから画像を取得して表示
                    imagePreview.innerHTML = `<img src="/api/diary/image/${imageState.id}" alt="プレビュー ${buttonNumber}">`;
                } else {
                    // 新しくアップロードした画像のプレビューを表示
                    imagePreview.innerHTML = `<img src="${imageState.preview}" alt="プレビュー ${buttonNumber}">`;
                }
                imagePreview.classList.add('has-image');
                if (imageUploadBtn) imageUploadBtn.style.display = 'none';
                if (refreshImageBtn) refreshImageBtn.style.display = 'block';
            } else {
                imagePreview.innerHTML = '';
                imagePreview.classList.remove('has-image');
                if (imageUploadBtn) imageUploadBtn.style.display = 'block';
                if (refreshImageBtn) refreshImageBtn.style.display = 'none';
            }
        }
    }

    // リフレッシュボタンの処理
    if (refreshImageBtn) {
        refreshImageBtn.addEventListener('click', function() {
            // 現在選択中のボタンの画像状態をリセット
            imageStates[currentActiveButton] = {
                preview: null,
                file: null,
                id: null
            };
            updateImagePreview(currentActiveButton);
        });
    }

    // ボタンのクリック管理用の変数を追加
    const buttonClickStates = {
        1: { lastClick: 0, clickCount: 0 },
        2: { lastClick: 0, clickCount: 0 },
        3: { lastClick: 0, clickCount: 0 }
    };

    // 垂直ボタンのイベントリスナー
    document.querySelectorAll('.square-btn').forEach((btn, index) => {
        const buttonNumber = index + 1;

        // 最初のボタンをアクティブに設定
        if (index === 0) {
            btn.classList.add('active');
        }

        btn.addEventListener('click', () => {
            const now = Date.now();
            const buttonState = buttonClickStates[buttonNumber];
            const timeSinceLastClick = now - buttonState.lastClick;

            // 0.8秒以内の2回目のクリックの場合
            if (timeSinceLastClick < 800 && buttonState.clickCount === 1) {
                // ダブルクリックの処理：画像をリセット
                imageStates[buttonNumber] = {
                    preview: null,
                    file: null,
                    id: null
                };
                // アクティブボタンの更新
                document.querySelectorAll('.square-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentActiveButton = buttonNumber;
                updateImagePreview(buttonNumber);

                // クリックカウントをリセット
                buttonState.clickCount = 0;

                // 画像アップロードボタンを表示
                const imageUploadBtn = document.getElementById('imageUploadBtn');
                if (imageUploadBtn) {
                    imageUploadBtn.style.display = 'block';
                }
            } else {
                // シングルクリックの処理
                if (timeSinceLastClick > 800) {
                    buttonState.clickCount = 0;
                }
                buttonState.clickCount++;

                // 通常のボタン切り替え処理
                if (buttonState.clickCount === 1) {
                    document.querySelectorAll('.square-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    currentActiveButton = buttonNumber;
                    updateImagePreview(buttonNumber);
                }
            }

            buttonState.lastClick = now;
        });
    });

    // タスク追加機能
    if (addTaskBtn && taskList) {
        addTaskBtn.addEventListener('click', function() {
            console.log('タスク追加ボタンがクリックされました');
            const taskItem = document.createElement('div');
            taskItem.className = 'task-item';
            taskItem.innerHTML = `
                <input type="checkbox" class="task-checkbox">
                <input type="text" class="task-input" placeholder="タスク内容を入力">
                <button class="task-delete-btn">
                    <img src="/static/img/feather/trash-2.svg" alt="Delete" class="task-delete-icon">
                </button>
            `;

            // 削除ボタンのイベントリスナーを追加
            const deleteBtn = taskItem.querySelector('.task-delete-btn');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', function() {
                    taskItem.remove();
                });
            }

            taskList.appendChild(taskItem);
            // 新しいタスク入力欄にフォーカスを当てる
            const newTaskInput = taskItem.querySelector('.task-input');
            if (newTaskInput) {
                newTaskInput.focus();
            }
            // スクロールを一番下に移動
            taskList.scrollTop = taskList.scrollHeight;
        });
    } else {
        console.error('タスク追加に必要な要素が見つかりません:', {
            addTaskBtn: !!addTaskBtn,
            taskList: !!taskList
        });
    }

    // 付箋の切り替え機能
    function initStickyNotes() {
        const stickyNotes = document.querySelectorAll('.sticky-note');
        const contents = document.querySelectorAll('.task-mood-content');

        stickyNotes.forEach(note => {
            note.addEventListener('click', function () {
                // アクティブなタブを切り替え
                stickyNotes.forEach(n => n.classList.remove('active'));
                this.classList.add('active');

                // コンテンツを切り替え
                const targetId = this.dataset.target;
                document.querySelectorAll('.task-mood-content').forEach(content => {
                    content.classList.remove('active');
                });
                document.getElementById(targetId).classList.add('active');
            });
        });
    }

    // ポイント計算
    async function updatePoints() {
        try {
            const result = await calculateDiaryPoints(
                diaryContent.textContent,
                [],  // ハッシュタグ機能を削除したため、空の配列を渡す
                imagePreview.querySelector('img') ? imagePreview.querySelector('img').src : null,
                Array.from(document.querySelectorAll('.task-item')).map(item => item.textContent)
            );

            document.getElementById('hashtagPoints').textContent = `ハッシュタグ: ${result.hashtagPoints}点`;
            document.getElementById('diaryPoints').textContent = `日記内容: ${result.diaryPoints}点`;
            document.getElementById('imagePoints').textContent = `画像: ${result.imagePoints}点`;
            document.getElementById('taskPoints').textContent = `タスク: ${result.taskPoints}点`;
            totalPointsElement.textContent = result.totalPoints;
        } catch (error) {
            console.error('Error updating points:', error);
        }
    }

    // ポイントのツールチップ表示
    pointsContainer.addEventListener('mouseenter', function () {
        const rect = this.getBoundingClientRect();
        pointsTooltip.style.display = 'block';
        pointsTooltip.style.top = `${rect.top + window.scrollY - pointsTooltip.offsetHeight - 10}px`;
        pointsTooltip.style.left = `${rect.left + window.scrollX + (rect.width - pointsTooltip.offsetWidth) / 2}px`;
    });

    pointsContainer.addEventListener('mouseleave', function () {
        pointsTooltip.style.display = 'none';
    });

    // 初期化
    function init() {
        updateDateDisplay();
        updatePoints();
    }

    init();

    // イベントリスナーの追加
    diaryContent.addEventListener('input', updatePoints);

    // ウィンドウクリックでモーダルを閉じる
    window.addEventListener('click', (event) => {
        if (event.target === iconModal) {
            iconModal.style.display = 'none';
        }
    });

    // 日記編集ツールバー
    document.querySelectorAll('.toolbar-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const command = this.dataset.command;
            const selection = window.getSelection();

            switch (command) {
                case 'increaseFontSize':
                    if (selection.toString().length > 0) {
                        const range = selection.getRangeAt(0);
                        const selectedText = range.extractContents();
                        const span = document.createElement('span');
                        const currentSize = parseInt(window.getComputedStyle(range.commonAncestorContainer).fontSize) || 16;
                        span.style.fontSize = `${currentSize + 2}px`;
                        span.appendChild(selectedText);
                        range.insertNode(span);
                    }
                    break;

                case 'decreaseFontSize':
                    if (selection.toString().length > 0) {
                        const range = selection.getRangeAt(0);
                        const selectedText = range.extractContents();
                        const span = document.createElement('span');
                        const currentSize = parseInt(window.getComputedStyle(range.commonAncestorContainer).fontSize) || 16;
                        span.style.fontSize = `${Math.max(currentSize - 2, 8)}px`;
                        span.appendChild(selectedText);
                        range.insertNode(span);
                    }
                    break;

                case 'insertOrderedList':
                case 'insertUnorderedList':
                    const listType = command === 'insertOrderedList' ? 'ordered' : 'unordered';
                    const div = document.createElement('div');
                    div.setAttribute('data-list-type', listType);
                    div.setAttribute('data-counter', '1');
                    div.className = 'list-item';
                    div.contentEditable = true;

                    // カーソル位置に挿入
                    const sel = window.getSelection();
                    if (sel.rangeCount > 0) {
                        const range = sel.getRangeAt(0);
                        const currentBlock = range.commonAncestorContainer.parentElement;
                        if (currentBlock === diaryContent || currentBlock.parentElement === diaryContent) {
                            range.insertNode(div);
                            // カーソルを新しいリストアイテムに移動
                            const newRange = document.createRange();
                            newRange.setStart(div, 0);
                            newRange.collapse(true);
                            sel.removeAllRanges();
                            sel.addRange(newRange);
                        }
                    }
                    break;

                case 'insertHashtag':
                    const hashtag = prompt('ハッシュタグを入力してください（#なし）:');
                    if (hashtag) {
                        const hashtagSpan = document.createElement('span');
                        hashtagSpan.className = 'hashtag';
                        hashtagSpan.textContent = `#${hashtag} `;
                        hashtagSpan.style.color = '#1da1f2';

                        // カーソル位置またはdiaryContentの先頭に挿入
                        const selection = window.getSelection();
                        if (selection.rangeCount > 0) {
                            const range = selection.getRangeAt(0);
                            if (diaryContent.contains(range.commonAncestorContainer)) {
                                // 現在の段落の先頭に挿入
                                const currentParagraph = range.commonAncestorContainer.parentElement;
                                if (currentParagraph === diaryContent) {
                                    diaryContent.insertBefore(hashtagSpan, diaryContent.firstChild);
                                } else {
                                    currentParagraph.insertBefore(hashtagSpan, currentParagraph.firstChild);
                                }
                            } else {
                                // diaryContentの先頭に挿入
                                diaryContent.insertBefore(hashtagSpan, diaryContent.firstChild);
                            }
                        }
                    }
                    break;
            }
        });
    });

    // リストの自動番号付けと新規行の処理
    diaryContent.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            const selection = window.getSelection();
            const range = selection.getRangeAt(0);
            const currentElement = range.commonAncestorContainer.parentElement;

            if (currentElement.classList.contains('list-item')) {
                e.preventDefault();
                const listType = currentElement.getAttribute('data-list-type');
                const newDiv = document.createElement('div');
                newDiv.className = 'list-item';
                newDiv.setAttribute('data-list-type', listType);

                if (listType === 'ordered') {
                    const prevCounter = parseInt(currentElement.getAttribute('data-counter') || '1');
                    newDiv.setAttribute('data-counter', (prevCounter + 1).toString());
                }

                newDiv.contentEditable = true;
                currentElement.insertAdjacentElement('afterend', newDiv);

                // カーソルを新しい要素に移動
                const newRange = document.createRange();
                newRange.setStart(newDiv, 0);
                newRange.collapse(true);
                selection.removeAllRanges();
                selection.addRange(newRange);
            }
        } else if (e.key === 'Tab') {
            e.preventDefault();
            const selection = window.getSelection();
            const range = selection.getRangeAt(0);
            const currentElement = range.commonAncestorContainer.parentElement;

            if (currentElement.classList.contains('list-item')) {
                const currentMargin = parseInt(currentElement.style.marginLeft || '0');
                currentElement.style.marginLeft = `${currentMargin + 20}px`;
            }
        }
    });

    // 位置情報の設定
    if (locationBtn) {
        locationBtn.addEventListener('click', function () {
            console.log('位置情報を設定');
        });
    }

    // 設定画面を開く
    if (settingsBtn) {
        settingsBtn.addEventListener('click', function () {
            console.log('設定画面を開く');
        });
    }

    // 保存ボタンの処理
    function initializeSaveButtons() {
        console.log('[initializeSaveButtons] Initializing save buttons');
        const saveBtn = document.getElementById('saveBtn');
        const newSaveBtn = document.getElementById('newSaveBtn');
        const diaryForm = document.getElementById('diaryForm');
        const titleInput = document.getElementById('title');
        const diaryContent = document.getElementById('diaryContent');
        const hiddenContent = document.getElementById('hiddenContent');

        // 要素の存在確認をログ出力
        console.log('[initializeSaveButtons] Elements found:', {
            saveBtn: !!saveBtn,
            newSaveBtn: !!newSaveBtn,
            diaryForm: !!diaryForm,
            titleInput: !!titleInput,
            diaryContent: !!diaryContent,
            hiddenContent: !!hiddenContent
        });

        // 必要な要素が存在しない場合は処理を中断
        if (!diaryForm || !titleInput || !diaryContent || !hiddenContent) {
            console.error('[initializeSaveButtons] Required elements not found for save functionality');
            return;
        }

        // 通常の保存ボタン
        if (saveBtn) {
            saveBtn.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('[saveBtn] Save button clicked');
                handleSave();
            });
            console.log('[initializeSaveButtons] Save button event listener added');
        }

        // 新しい保存ボタン
        if (newSaveBtn) {
            console.log('[initializeSaveButtons] Adding click event listener to newSaveBtn');
            newSaveBtn.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('[newSaveBtn] New save button clicked');
                handleSave();
            });
            console.log('[initializeSaveButtons] New save button event listener added');
        }

        // フォームの送信イベント
        diaryForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('[diaryForm] Form submitted');
            handleSave();
        });
    }

    async function handleSave() {
        try {
            console.log('[handleSave] Save process started');
            const titleInput = document.getElementById('title');
            const diaryContent = document.getElementById('diaryContent');
            const hiddenContent = document.getElementById('hiddenContent');

            // デバッグ情報の出力
            console.log('[handleSave] Form elements:', {
                titleInput: titleInput?.value,
                diaryContent: diaryContent?.innerHTML?.substring(0, 100) + '...',
                hiddenContent: hiddenContent?.value?.substring(0, 100) + '...'
            });

            // 必要な要素の確認
            if (!diaryContent || !titleInput || !hiddenContent) {
                console.error('[handleSave] Required elements missing');
                throw new Error('必要な要素が見つかりません');
            }

            // 内容の検証
            if (!titleInput.value.trim()) {
                console.error('[handleSave] Title is empty');
                alert('タイトルを入力してください');
                titleInput.focus();
                return;
            }

            // hiddenContentの更新
            hiddenContent.value = diaryContent.innerHTML;
            console.log('[handleSave] Hidden content updated');

            // フォームデータの作成
            const formData = new FormData();

            // 基本情報の追加
            formData.append('title', titleInput.value.trim());
            formData.append('content', diaryContent.innerHTML);

            console.log('[handleSave] FormData created with basic info');

            // 画像データの追加
            Object.keys(imageStates).forEach(key => {
                if (imageStates[key].file) {
                    formData.append(`image${key}`, imageStates[key].file);
                }
            });

            // タスクデータの追加
            const tasks = Array.from(document.querySelectorAll('.task-item')).map(task => ({
                content: task.querySelector('.task-input')?.value?.trim() || '',
                isCompleted: task.querySelector('.task-checkbox')?.checked || false
            }));
            formData.append('tasks', JSON.stringify(tasks));

            // ハッシュタグの追加
            const hashtags = Array.from(document.querySelectorAll('.hashtag'))
                .map(tag => tag.textContent.replace('#', '').trim())
                .filter(tag => tag); // 空のタグを除外
            formData.append('hashtags', JSON.stringify(hashtags));

            // CSRFトークンの取得と追加
            const csrfToken = document.querySelector('input[name="csrf_token"]')?.value;
            if (!csrfToken) {
                throw new Error('CSRFトークンが見つかりません');
            }

            console.log('[handleSave] Form data prepared:', {
                title: titleInput.value,
                contentLength: diaryContent.innerHTML.length,
                tasksCount: tasks.length,
                hashtagsCount: hashtags.length,
                csrfToken: !!csrfToken
            });

            // 保存中の状態を表示
            updateSaveButtonState('saving');

            // サーバーへのデータ送信
            const response = await fetch('/api/diary', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrfToken
                },
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `サーバーエラー: ${response.status}`);
            }

            const result = await response.json();
            console.log('[handleSave] Server response:', result);

            if (result.success) {
                updateSaveButtonState('success');
                // 成功メッセージを表示
                alert('日記が保存されました');
                setTimeout(() => {
                    window.location.href = '/diary';
                }, 1000);
            } else {
                throw new Error(result.error || '保存に失敗しました');
            }
        } catch (error) {
            console.error('[handleSave] Save error:', error);
            updateSaveButtonState('error', error.message);
        }
    }

    function updateSaveButtonState(state, errorMessage = '') {
        console.log('[updateSaveButtonState] Updating button state:', state);

        // saveBtn の状態更新
        if (saveBtn) {
            switch (state) {
                case 'saving':
                    saveBtn.innerHTML = '<span class="save-icon">⏳</span> 保存中...';
                    saveBtn.disabled = true;
                    break;
                case 'success':
                    saveBtn.innerHTML = '<span class="save-icon">✅</span> 保存完了';
                    saveBtn.disabled = false;
                    break;
                case 'error':
                    saveBtn.innerHTML = '<span class="save-icon">❌</span> 保存失敗';
                    saveBtn.disabled = false;
                    alert(`保存に失敗しました: ${errorMessage}`);
                    break;
                default:
                    const imgElement = saveBtn.querySelector('img');
                    if (imgElement) {
                        saveBtn.innerHTML = '<img src="' + imgElement.getAttribute('src') + '" alt="Save">';
                    } else {
                        console.warn('saveBtn に img 要素が見つかりません。');
                        saveBtn.innerHTML = '保存';
                    }
                    saveBtn.disabled = false;
            }
        }

        // newSaveBtn の状態更新
        if (newSaveBtn) {
            switch (state) {
                case 'saving':
                    newSaveBtn.innerHTML = '<span class="save-icon">⏳</span> 保存中...';
                    newSaveBtn.disabled = true;
                    break;
                case 'success':
                    newSaveBtn.innerHTML = '<span class="save-icon">✅</span> 保存完了';
                    newSaveBtn.disabled = false;
                    break;
                case 'error':
                    newSaveBtn.innerHTML = '<span class="save-icon">❌</span> 保存失敗';
                    newSaveBtn.disabled = false;
                    alert(`保存に失敗しました: ${errorMessage}`);
                    break;
                default:
                    newSaveBtn.innerHTML = '<span class="save-icon">💾</span> 日記を保存';
                    newSaveBtn.disabled = false;
            }
        }
    }

    function getHashtags() {
        const hashtagElements = document.querySelectorAll('.hashtag');
        return Array.from(hashtagElements).map(el => el.textContent.replace('#', ''));
    }

    const todayMoodBtn = document.getElementById('todayMoodBtn');
    const moodSections = document.getElementById('moodSections');
    const moodButtons = document.querySelectorAll('.mood-input-btn');
    const imageModal = document.getElementById('imageModal');
    const imageContainer = document.getElementById('imageContainer');
    const closeModal = document.querySelector('.close');

    // todayMoodBtnが存在する場合のみイベントリスナーを追加
    if (todayMoodBtn && moodSections) {
        todayMoodBtn.addEventListener('click', function () {
            moodSections.style.display = 'block';
        });
    }

    // moodButtonsが存在する場合のみイベントリスナーを追加
    if (moodButtons.length > 0) {
        moodButtons.forEach(button => {
            button.addEventListener('click', function () {
                console.log('[diary.js] Mood button clicked:', this);
                const placeholder = this.dataset.placeholder;
                const imageContainerId = this.previousElementSibling.id;
                iconSelectionArea.style.display = 'block';
                loadIcons(imageContainerId, placeholder, button);
            });
        });
    }

    // closeModalが存在する場合のみイベントリスナーを追加
    if (closeIconSelection) {
        closeIconSelection.addEventListener('click', function () {
            console.log('[diary.js] Close button clicked');
            iconSelectionArea.style.display = 'none';
        });
    }

    window.addEventListener('click', function (event) {
        if (event.target === imageModal) {
            imageModal.style.display = 'none';
        }
    });

    async function fetchImages() {
        const images = [];
        for (let i = 1; i <= 40; i++) {
            images.push(`/static/img/icon/${i}.png`);
        }
        return images;
    }

    const moodBtn = document.getElementById('moodBtn');
    const iconSelectionArea = document.getElementById('iconSelectionArea');
    const iconGrid = document.getElementById('iconGrid');
    const closeIconSelection = document.querySelector('.close-icon-selection');

    // moodBtnの存在チェックを追加
    if (moodBtn) {
        console.log('[diary.js] MoodBtn found, adding event listener');
        moodBtn.addEventListener('click', function () {
            fetchImages().then(images => {
                if (imageContainer) {
                    imageContainer.innerHTML = '';
                    images.forEach(src => {
                        const img = document.createElement('img');
                        img.src = src;
                        img.className = 'selectable-image';
                        img.addEventListener('click', () => {
                            if (moodBtn) {
                                moodBtn.textContent = src;
                                if (imageModal) {
                                    imageModal.style.display = 'none';
                                }
                            }
                        });
                        imageContainer.appendChild(img);
                    });
                }
                if (imageModal) {
                    imageModal.style.display = 'block';
                }
            });
        });
    } else {
        console.log('[diary.js] MoodBtn not found, skipping event listener');
    }

    // iconSelectionAreaの存在チェックを追加
    if (iconSelectionArea) {
        window.addEventListener('click', function (event) {
            if (event.target === iconSelectionArea) {
                console.log('[diary.js] Clicked outside modal');
                iconSelectionArea.style.display = 'none';
            }
        });
    }

    async function loadIcons(imageContainerId, placeholder, button) {
        console.log('[diary.js] Loading icons...');
        try {
            const response = await fetch('/api/icons');
            const icons = await response.json();
            console.log('[diary.js] Icons loaded:', icons);

            iconGrid.innerHTML = '';
            icons.forEach(icon => {
                const img = document.createElement('img');
                img.src = `/static/img/icon/${icon}`;
                img.alt = `アイコン ${icon}`;
                img.className = 'icon-preview';
                img.addEventListener('click', () => selectIcon(icon, imageContainerId, placeholder, button));
                iconGrid.appendChild(img);
            });
        } catch (error) {
            console.error('[diary.js] Error loading icons:', error);
        }
    }

    function selectIcon(icon, imageContainerId, placeholder, button) {
        console.log('[diary.js] Icon selected:', icon);
        const selectedImageContainer = document.getElementById(imageContainerId);
        selectedImageContainer.innerHTML = `<img src="/static/img/icon/${icon}" class="selected-image">`;
        button.textContent = placeholder + ': ' + icon;
        iconSelectionArea.style.display = 'none';
    }

    // ハッシュタグ関連の処理を修正
    function initializeHashtagFeature() {
        const hashtagModal = document.getElementById('hashtagModal');
        const addHashtagBtn = document.querySelector('.add-hashtag-btn');
        const closeModalBtn = document.querySelector('.close-modal');
        const modalHashtagInput = document.getElementById('modalHashtagInput');
        const addModalHashtagBtn = document.getElementById('addModalHashtagBtn');
        const diaryContent = document.getElementById('diaryContent');

        if (!addHashtagBtn || !hashtagModal || !diaryContent) {
            console.warn('ハッシュタグ関連の要素が見つかりません');
            return;
        }

        // ハッシュタグボタンのクリックイベント
        addHashtagBtn.addEventListener('click', function () {
            hashtagModal.style.display = 'block';
            if (modalHashtagInput) {
                modalHashtagInput.focus();
            }
        });

        // モーダルを閉じる
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', function () {
                hashtagModal.style.display = 'none';
                if (modalHashtagInput) {
                    modalHashtagInput.value = '';
                }
            });
        }

        // モーダル外クリックで閉じる
        window.addEventListener('click', function (e) {
            if (e.target === hashtagModal) {
                hashtagModal.style.display = 'none';
                if (modalHashtagInput) {
                    modalHashtagInput.value = '';
                }
            }
        });

        // ハッシュタグを追加する関数を修正
        function addHashtag() {
            if (!modalHashtagInput || !diaryContent) return;

            const tagText = modalHashtagInput.value.trim();
            if (tagText) {
                // スペースを追加
                const space = document.createTextNode(' ');
                contentHashtagSpan.after(space);

                // ハッシュタグリスト用のハッシュタグ
                const hashtagContainer = document.getElementById('hashtagContainer');
                if (hashtagContainer) {
                    const listHashtagSpan = document.createElement('span');
                    listHashtagSpan.className = 'hashtag';
                    listHashtagSpan.textContent = `#${tagText}`;
                    listHashtagSpan.style.color = '#0C07FF';
                    listHashtagSpan.style.marginRight = '10px';
                    hashtagContainer.appendChild(listHashtagSpan);
                }

                // モーダルをクリアして閉じる
                modalHashtagInput.value = '';
                hashtagModal.style.display = 'none';

                // 保存ボタンの状態を更新
                if (typeof updateSaveButtonState === 'function') {
                    updateSaveButtonState('default');
                }

                console.log('ハッシュタグを追加しました:', tagText);
            }
        }

        // ハッシュタグ追加ボタンのクリックイベント
        if (addModalHashtagBtn) {
            addModalHashtagBtn.addEventListener('click', addHashtag);
        }

        // ハッシュタグ入力フィールドでEnterキーを押した時の処理
        if (modalHashtagInput) {
            modalHashtagInput.addEventListener('keypress', function (e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    addHashtag();
                }
            });
        }
    }
});






document.addEventListener('DOMContentLoaded', function () {
    // 既存の変数宣言を使用
    const imageInput = document.getElementById('imageInput');
    const imagePreview = document.getElementById('imagePreview');
    const imageUploadBtn = document.getElementById('imageUploadBtn');
    const contextMenu = document.getElementById('contextMenu');
    const diaryContent = document.getElementById('diaryContent');
    const hashtagModal = document.getElementById('hashtagModal');
    const addHashtagBtn = document.querySelector('.add-hashtag-btn');
    const closeModalBtn = document.querySelector('.close-modal');
    const modalHashtagInput = document.getElementById('modalHashtagInput');
    const addModalHashtagBtn = document.getElementById('addModalHashtagBtn');
    const hashtagContainer = document.getElementById('hashtagContainer');
    const textColorPicker = document.getElementById('textColorPicker');
    const bgColorPicker = document.getElementById('bgColorPicker');

    // 要素の存在をログ出力
    console.log('Elements found:', {
        imageInput: !!imageInput,
        imagePreview: !!imagePreview,
        imageUploadBtn: !!imageUploadBtn,
        contextMenu: !!contextMenu,
        diaryContent: !!diaryContent,
        hashtagModal: !!hashtagModal,
        addHashtagBtn: !!addHashtagBtn,
        closeModalBtn: !!closeModalBtn,
        modalHashtagInput: !!modalHashtagInput,
        addModalHashtagBtn: !!addModalHashtagBtn,
        hashtagContainer: !!hashtagContainer,
        textColorPicker: !!textColorPicker,
        bgColorPicker: !!bgColorPicker
    });

    // ハッシュタグモーダル関連の処理
    if (addHashtagBtn && hashtagModal && modalHashtagInput) {
        addHashtagBtn.addEventListener('click', function() {
            hashtagModal.style.display = 'block';
            modalHashtagInput.focus();
        });

        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', function() {
                hashtagModal.style.display = 'none';
                modalHashtagInput.value = '';
            });
        }

        window.addEventListener('click', function(e) {
            if (e.target === hashtagModal) {
                hashtagModal.style.display = 'none';
                modalHashtagInput.value = '';
            }
        });

        function addHashtag() {
            const tagText = modalHashtagInput.value.trim();
            if (tagText && hashtagContainer) {
                const hashtagSpan = document.createElement('span');
                hashtagSpan.className = 'hashtag';
                hashtagSpan.textContent = `#${tagText}`;
                hashtagSpan.style.color = '#0C07FF';
                hashtagContainer.appendChild(hashtagSpan);
                modalHashtagInput.value = '';
                hashtagModal.style.display = 'none';
            }
        }

        if (addModalHashtagBtn) {
            addModalHashtagBtn.addEventListener('click', addHashtag);
        }

        modalHashtagInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                addHashtag();
            }
        });
    }

    // 画像リフレッシュ機能
    const refreshImageBtn = document.getElementById('refreshImageBtn');

    if (refreshImageBtn && imagePreview && imageUploadBtn && imageInput) {
        refreshImageBtn.addEventListener('click', function() {
            imageInput.value = '';
            imagePreview.innerHTML = '';
            imageUploadBtn.textContent = '画像を参照';
        });
    }

    // コンテキストメニューの処理
    if (diaryContent) {
        let selectedRange = null;

        diaryContent.addEventListener('contextmenu', function (e) {
            e.preventDefault();
            const selection = window.getSelection();
            if (selection.toString().length > 0) {
                selectedRange = selection.getRangeAt(0).cloneRange();
                contextMenu.style.display = 'block';

                // メニューを中央に表示
                const menuWidth = contextMenu.offsetWidth;
                const menuHeight = contextMenu.offsetHeight;
                const x = e.pageX - (menuWidth / 2);
                const y = e.pageY - menuHeight - 10;

                // 画面外にはみ出さないように調整
                const maxX = window.innerWidth - menuWidth;
                const maxY = window.innerHeight - menuHeight;
                contextMenu.style.left = `${Math.max(0, Math.min(x, maxX))}px`;
                contextMenu.style.top = `${Math.max(0, Math.min(y, maxY))}px`;
            }
        });

        document.addEventListener('click', function (e) {
            if (contextMenu && !contextMenu.contains(e.target)) {
                contextMenu.style.display = 'none';
            }
        });

        // カラーピッカーのクリックイベントの伝播を停止
        textColorPicker.addEventListener('click', (e) => e.stopPropagation());
        bgColorPicker.addEventListener('click', (e) => e.stopPropagation());

        // カラーピッカーの変更イベント
        textColorPicker.addEventListener('input', function (e) {
            if (selectedRange) {
                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(selectedRange);
                document.execCommand('foreColor', false, e.target.value);
                selectedRange = selection.getRangeAt(0).cloneRange();
            }
        });

        bgColorPicker.addEventListener('input', function (e) {
            if (selectedRange) {
                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(selectedRange);
                document.execCommand('hiliteColor', false, e.target.value);
                selectedRange = selection.getRangeAt(0).cloneRange();
            }
        });

        if (contextMenu) {
            contextMenu.querySelectorAll('li').forEach(item => {
                item.addEventListener('click', function () {
                    if (selectedRange && !this.classList.contains('menu-separator')) {
                        const selection = window.getSelection();
                        selection.removeAllRanges();
                        selection.addRange(selectedRange);

                        const command = this.dataset.command;
                        switch (command) {
                            case 'increaseFontSize':
                                const range = selection.getRangeAt(0);
                                const container = range.commonAncestorContainer;
                                const currentSize = parseInt(window.getComputedStyle(container.nodeType === 3 ? container.parentNode : container).fontSize) || 16;
                                const span = document.createElement('span');
                                span.style.fontSize = `${currentSize + 2}px`;
                                span.appendChild(range.extractContents());
                                range.insertNode(span);
                                selectedRange = selection.getRangeAt(0).cloneRange();
                                break;

                            case 'decreaseFontSize':
                                const rangeDecrease = selection.getRangeAt(0);
                                const containerDecrease = rangeDecrease.commonAncestorContainer;
                                const currentSizeDecrease = parseInt(window.getComputedStyle(containerDecrease.nodeType === 3 ? containerDecrease.parentNode : containerDecrease).fontSize) || 16;
                                const spanDecrease = document.createElement('span');
                                spanDecrease.style.fontSize = `${Math.max(currentSizeDecrease - 2, 8)}px`;
                                spanDecrease.appendChild(rangeDecrease.extractContents());
                                rangeDecrease.insertNode(spanDecrease);
                                selectedRange = selection.getRangeAt(0).cloneRange();
                                break;

                            case 'insertHashtag':
                                const selectedText = selection.toString();
                                if (selectedText) {
                                    // ハッシュタグを作成
                                    const hashtagSpan = document.createElement('span');
                                    hashtagSpan.className = 'hashtag';
                                    hashtagSpan.style.color = '#0C07FF';
                                    hashtagSpan.textContent = `#${selectedText}`;
                                    hashtagSpan.setAttribute('data-hashtag', selectedText);

                                    // 選択範囲を置き換え
                                    const hashtagRange = selection.getRangeAt(0);
                                    hashtagRange.deleteContents();
                                    hashtagRange.insertNode(hashtagSpan);

                                    // カーソルを#の後ろに移動し、黒文字で続きを入力できるようにする
                                    const textNode = document.createTextNode('');
                                    hashtagSpan.after(textNode);

                                    // 新しい範囲を作成し、デフォルトのスタイルを設定
                                    const newRange = document.createRange();
                                    newRange.setStart(textNode, 0);
                                    newRange.collapse(true);
                                    selection.removeAllRanges();
                                    selection.addRange(newRange);

                                    // デフォルトのスタイルをリセット
                                    const defaultSpan = document.createElement('span');
                                    defaultSpan.style.color = 'black';
                                    defaultSpan.style.backgroundColor = 'transparent';
                                    defaultSpan.appendChild(textNode);
                                    hashtagSpan.after(defaultSpan);

                                    // カーソルを新しいスパンの中に移動
                                    const finalRange = document.createRange();
                                    finalRange.setStart(defaultSpan.firstChild, 0);
                                    finalRange.collapse(true);
                                    selection.removeAllRanges();
                                    selection.addRange(finalRange);

                                    // ハッシュタグコンテナにも追加
                                    if (hashtagContainer) {
                                        const containerHashtag = document.createElement('span');
                                        containerHashtag.className = 'hashtag';
                                        containerHashtag.textContent = `#${selectedText}`;
                                        hashtagContainer.appendChild(containerHashtag);
                                    }
                                }
                                break;

                            default:
                                if (command && !command.includes('Color')) {
                                    document.execCommand(command, false, null);
                                    selectedRange = selection.getRangeAt(0).cloneRange();
                                }
                                break;
                        }

                        if (!command.includes('Color')) {
                            contextMenu.style.display = 'none';
                        }
                    }
                });
            });
        }

        // フォーム送信時の処理
        const diaryForm = document.getElementById('diaryForm');
        const hiddenContent = document.getElementById('hiddenContent');

        if (diaryForm && hiddenContent && diaryContent) {
            diaryForm.addEventListener('submit', function (e) {
                // ハッシュタグを収集
                const hashtags = [];
                diaryContent.querySelectorAll('.hashtag').forEach(tag => {
                    const tagText = tag.getAttribute('data-hashtag');
                    if (tagText && !hashtags.includes(tagText)) {
                        hashtags.push(tagText);
                    }
                });

                // ハッシュタグをhiddenフィールドに追加
                const hashtagsInput = document.createElement('input');
                hashtagsInput.type = 'hidden';
                hashtagsInput.name = 'hashtags';
                hashtagsInput.value = JSON.stringify(hashtags);
                this.appendChild(hashtagsInput);

                // 日記の内容を設定
                hiddenContent.value = diaryContent.innerHTML;
            });
        }
    }
});

// カレンダー機能の実装
document.addEventListener('DOMContentLoaded', function () {
    const calendarBtn = document.getElementById('calendarBtn');
    const currentDateElem = document.getElementById('currentDate');

    if (calendarBtn && currentDateElem) {
        // 日付入力要素を作成（非表示）
        const dateInput = document.createElement('input');
        dateInput.type = 'text';
        dateInput.name = 'date';
        dateInput.className = 'js-datepicker2 flatpickr-input';
        dateInput.style.display = 'none';

        // カレンダーボタンの後ろに日付入力要素を追加
        calendarBtn.parentNode.insertBefore(dateInput, calendarBtn.nextSibling);

        // flatpickrの初期化
        const fp = flatpickr(dateInput, {
            allowInput: true,
            locale: 'ja',
            dateFormat: 'Y-m-d',
            position: 'below', // カレンダーの位置を下に固定
            appendTo: calendarBtn.parentNode, // カレンダーを親要素に追加
            static: true, // カレンダーを固定位置に
            onChange: function (selectedDates) {
                if (selectedDates.length > 0) {
                    const selectedDate = selectedDates[0];
                    const formattedDate = selectedDate.toLocaleDateString('ja-JP', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                    });
                    currentDateElem.textContent = formattedDate;
                }
            }
        });

        // カレンダーボタンのクリックイベント
        calendarBtn.addEventListener('click', function (e) {
            e.preventDefault();
            dateInput._flatpickr.open();
        });
    }
});

