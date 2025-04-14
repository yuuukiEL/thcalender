// モーダル管理モジュール
import EventBus from './event-bus.js';
import TimetableCore from './timetable-core.js';
import CommentManager from './comment-manager.js';
import DataProvider from './data-provider.js';

const ModalManager = {
    currentDay: null,
    currentPeriod: null,
    currentScheduleId: null,
    
    // 初期化
    init() {
        this.setupEventSubscriptions();
        console.log('ModalManager 初期化完了');
        
        // 初期化完了イベントを発行
        EventBus.publish('modals:initialized', {});
    },
    
    // イベント購読を設定
    setupEventSubscriptions() {
        // UIからのイベントを購読
        this.eventSubscriptions = [
            EventBus.subscribe('ui:cellClicked', data => {
                this.currentDay = data.day;
                this.currentPeriod = data.period;
                this.currentScheduleId = data.scheduleId;
            })
        ];
    },
    
    // 編集モーダルを表示
    async showEditModal(day, period, scheduleId) {
        console.log(`編集モーダル表示: day=${day}, period=${period}, scheduleId=${scheduleId || 'なし'}`);
        
        // 現在の値を保存
        this.currentDay = day;
        this.currentPeriod = period;
        this.currentScheduleId = scheduleId;
        
        // 既存のデータを取得
        const data = await TimetableCore.fetchData(day, period);
        
        // モーダルを作成して表示
        this.createAndShowModal(day, period, data);
    },
    
    // 詳細モーダルを表示
    async showDetailModal(day, period, scheduleId) {
        console.log(`詳細モーダル表示: day=${day}, period=${period}, scheduleId=${scheduleId}`);
        
        // データを取得
        const data = await TimetableCore.fetchData(day, period);
        
        if (!data) {
            console.error('データが取得できませんでした');
            return;
        }
        
        // モーダルを作成して表示
        this.createAndShowModal({
            title: `${day}曜${period}限の授業詳細`,
            content: `
                <div class="schedule-detail">
                    <div class="detail-item">
                        <div class="detail-label">科目名</div>
                        <div class="detail-value">${data.subject_name || '未設定'}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">教員名</div>
                        <div class="detail-value">${data.teacher_name || '未設定'}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">教室</div>
                        <div class="detail-value">${data.classroom_id || '未設定'}</div>
                    </div>
                </div>
            `,
            buttons: [
                {
                    text: 'コメントを見る',
                    class: 'btn-info',
                    onClick: () => {
                        // モーダルを閉じる
                        document.querySelector('.modal').remove();
                        
                        // コメントモーダルを表示
                        CommentManager.showCommentModal(scheduleId, day, period);
                    }
                },
                {
                    text: '閉じる',
                    class: 'btn-secondary',
                    onClick: () => {
                        // モーダルを閉じる
                        document.querySelector('.modal').remove();
                    }
                }
            ]
        });
    },
    
    // モーダルを作成して表示する関数
    createAndShowModal(day, period, existingData) {
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
                            <select id="floorSelect">
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

        // モーダル要素を取得
        const modal = document.getElementById('scheduleEditModal');
        const closeBtn = modal.querySelector('.modal-close');
        const saveBtn = modal.querySelector('.save-btn');
        const deleteBtn = modal.querySelector('.delete-btn');
        const cancelBtn = modal.querySelector('.cancel-btn');
        const overlay = modal.querySelector('.modal-overlay');
        
        // 教員リストを取得して設定
        this.populateTeacherOptions(existingData);
        
        // 階数が選択されている場合は教室リストを更新
        const floorSelect = document.getElementById('floorSelect');
        
        // 教室番号から階数を抽出（例: 701 → 7階）
        if (existingData) {
            let classroomId = null;
            
            // 複数の可能性を考慮
            if (existingData.classroom_id) {
                classroomId = existingData.classroom_id;
            } else if (existingData.classroom && existingData.classroom.classroom_id) {
                classroomId = existingData.classroom.classroom_id;
            }
            
            if (classroomId) {
                const classroomIdStr = String(classroomId);
                if (classroomIdStr.length > 0) {
                    // 教室IDの形式に基づいて階数を抽出
                    let floor = '';
                    if (classroomIdStr.length >= 3) {
                        // 例: 1901 -> 19階
                        floor = classroomIdStr.substring(0, 2);
                    } else if (classroomIdStr.length === 2) {
                        // 例: 91 -> 9階
                        floor = classroomIdStr.substring(0, 1);
                    } else {
                        floor = classroomIdStr.charAt(0);
                    }
                    
                    floorSelect.value = floor;
                    this.updateClassroomOptions(classroomId);
                }
            }
        }
        
        // 階数選択時のイベントハンドラを設定
        floorSelect.addEventListener('change', () => {
            this.updateClassroomOptions();
        });

        // ファイル参照ボタンのグローバル関数を設定
        window.browseFiles = () => {
            this.browseFiles();
        };
        
        // モーダルを閉じる処理
        const closeModal = () => modal.remove();
        closeBtn.onclick = closeModal;
        overlay.onclick = closeModal;
        if (cancelBtn) cancelBtn.onclick = closeModal;
        
        // 保存ボタンの処理
        saveBtn.onclick = async () => {
            await this.handleSaveButtonClick(day, period, closeModal);
        };
        
        // 削除ボタンの処理
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                this.handleDeleteButtonClick(day, period, closeModal);
            });
        }
        
        // 入力フィールドにフォーカス
        document.getElementById('subjectName').focus();
        
        // モーダル表示イベントを発行
        EventBus.publish('modal:shown', {
            type: 'scheduleEdit',
            day,
            period,
            existingData
        });
    },
    
    // 教員リストを取得して設定
    async populateTeacherOptions(existingData) {
        try {
            const teacherSelect = document.getElementById('teacherId');
            if (!teacherSelect) return;
            
            // 教員リストがグローバル変数にあるか確認
            let teachers = window.allTeachers;
            
            // なければAPIから取得
            if (!teachers || teachers.length === 0) {
                console.log('教員リストをAPIから取得します');
                teachers = await DataProvider.fetchTeachers();
            }
            
            if (!teachers || teachers.length === 0) {
                console.warn('教員リストが取得できませんでした');
                return;
            }
            
            console.log('教員リスト:', teachers);
            
            // 教員リストをセレクトボックスに追加
            teachers.forEach(teacher => {
                const option = document.createElement('option');
                const teacherId = teacher.id || teacher.teacher_id;
                option.value = teacherId;
                option.textContent = teacher.name;
                teacherSelect.appendChild(option);
            });
            
            // 既存データがある場合は選択状態にする
            if (existingData) {
                // 教員IDを取得（複数の可能性を考慮）
                let teacherId = null;
                
                if (existingData.teacher_id) {
                    teacherId = existingData.teacher_id;
                } else if (existingData.teacher && existingData.teacher.teacher_id) {
                    teacherId = existingData.teacher.teacher_id;
                } else if (existingData.teacher && existingData.teacher.id) {
                    teacherId = existingData.teacher.id;
                }
                
                if (teacherId) {
                    // 文字列に変換して比較
                    const teacherIdStr = String(teacherId);
                    
                    // 対応するオプションを探して選択
                    for (const option of teacherSelect.options) {
                        if (option.value === teacherIdStr) {
                            option.selected = true;
                            break;
                        }
                    }
                }
            }
        } catch (error) {
            console.error('教員リストの設定に失敗しました:', error);
        }
    },
    
    // 教室リストを更新
    async updateClassroomOptions(selectedClassroomId = null) {
        try {
            const floorSelect = document.getElementById('floorSelect');
            const classroomSelect = document.getElementById('classroomId');
            
            if (!floorSelect || !classroomSelect) return;
            
            const floor = floorSelect.value;
            
            // 教室リストをクリア
            classroomSelect.innerHTML = '<option value="">選択してください</option>';
            
            if (!floor) return;
            
            // 教室リストがグローバル変数にあるか確認
            let classrooms = window.allClassrooms;
            
            // なければAPIから取得
            if (!classrooms || classrooms.length === 0) {
                console.log('教室リストをAPIから取得します');
                classrooms = await DataProvider.fetchClassrooms();
            }
            
            if (!classrooms || classrooms.length === 0) {
                console.warn('教室リストが取得できませんでした');
                return;
            }
            
            console.log('教室リスト:', classrooms);
            
            // 選択された階の教室をフィルタリング
            const filteredClassrooms = classrooms.filter(classroom => {
                // 教室番号から階数を抽出
                const classroomId = String(classroom.classroom_id);
                if (classroomId.length > 0) {
                    // 階数が1桁か2桁かで処理を分ける
                    if (String(floor).length === 1) {
                        // 1桁の階数（例: 7階）
                        return classroomId.startsWith(String(floor));
                    } else {
                        // 2桁の階数（例: 19階）
                        return classroomId.startsWith(String(floor));
                    }
                }
                return false;
            });
            
            // 教室リストをセレクトボックスに追加
            filteredClassrooms.forEach(classroom => {
                const option = document.createElement('option');
                option.value = classroom.classroom_id;
                option.textContent = classroom.classroom_id;
                classroomSelect.appendChild(option);
            });
            
            // 既存の選択値があれば設定
            if (selectedClassroomId) {
                // 文字列に変換して比較
                const classroomIdStr = String(selectedClassroomId);
                
                // 対応するオプションを探して選択
                for (const option of classroomSelect.options) {
                    if (option.value === classroomIdStr) {
                        option.selected = true;
                        break;
                    }
                }
            }
        } catch (error) {
            console.error('教室リストの更新に失敗しました:', error);
        }
    },
    
    // ファイル参照機能
    browseFiles() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.pdf,.png,.jpg,.jpeg';
        
        input.onchange = async (e) => {
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
                formData.append('day', this.currentDay);
                formData.append('period', this.currentPeriod);
                
                // 強制上書きフラグを追加
                formData.append('force_overwrite', 'true');
                
                try {
                    console.log('ファイルアップロード開始');
                    
                    // CSRFトークンを取得
                    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
                    
                    // ファイルをアップロード
                    const response = await fetch('/student/api/upload_schedule_file', {
                        method: 'POST',
                        headers: {
                            'X-CSRFToken': csrfToken
                        },
                        body: formData
                    });
                    
                    if (!response.ok) {
                        const errorText = await response.text();
                        throw new Error(`ファイルのアップロードに失敗しました (${response.status}): ${errorText}`);
                    }
                    
                    const result = await response.json();
                    console.log('アップロード成功:', result);
                    
                    // アップロードされたファイルのURLをフィールドに設定
                    let fileUrl = result.file_url;
                    if (!fileUrl.startsWith('/')) {
                        fileUrl = '/' + fileUrl;
                    }
                    
                    // URLを入力フィールドに設定
                    const urlInput = document.getElementById('scheduleFileUrl');
                    if (urlInput) {
                        urlInput.value = fileUrl;
                        console.log('ファイルURLを設定:', fileUrl);
                    }
                    
                    // 成功メッセージを表示
                    alert(`ファイル「${file.name}」のアップロードが完了しました`);
                } catch (error) {
                    console.error('ファイルアップロードエラー:', error);
                    alert('ファイルのアップロードに失敗しました: ' + error.message);
                }
            }
        };
        
        input.click();
    },
    
    // 保存ボタンのクリックハンドラ
    async handleSaveButtonClick(day, period, closeModal) {
        const subjectNameField = document.getElementById('subjectName');
        const subjectName = subjectNameField ? subjectNameField.value.trim() : '';
        
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
            floor: document.getElementById('floorSelect').value
        };
        
        console.log('送信データ:', scheduleData);
        
        try {
            const saveBtn = document.querySelector('.save-btn');
            if (saveBtn) {
                saveBtn.disabled = true;
                saveBtn.textContent = '保存中...';
            }
            
            const result = await TimetableCore.updateSchedule(day, period, scheduleData);
            if (result) {
                console.log('時間割を更新しました:', result);
                
                // 時間割表示を更新
                await TimetableCore.fetchAllData();
                
                // モーダルを閉じる
                closeModal();
                
                // 成功メッセージを表示
                alert('時間割を更新しました');
            }
        } catch (error) {
            console.error('時間割の更新に失敗しました:', error);
            alert('時間割の更新に失敗しました: ' + (error.message || '不明なエラー'));
        } finally {
            const saveBtn = document.querySelector('.save-btn');
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.textContent = '保存';
            }
        }
    },
    
    // 削除ボタンのクリックハンドラ
    async handleDeleteButtonClick(day, period, closeModal) {
        // 確認ダイアログを表示
        if (!confirm('この時間割を削除してもよろしいですか？')) {
            return;
        }
        
        try {
            const deleteBtn = document.querySelector('.delete-btn');
            if (deleteBtn) {
                deleteBtn.disabled = true;
                deleteBtn.textContent = '削除中...';
            }
            
            // TimetableCoreの削除メソッドを呼び出す
            const result = await TimetableCore.deleteSchedule(day, period);
            
            if (result && result.success) {
                console.log('時間割を削除しました');
                
                // 即座にUIを更新（TimetableUIのインポートが必要）
                import('./timetable-ui.js').then(module => {
                    const TimetableUI = module.default;
                    TimetableUI.clearCell(day, period);
                });
                
                // モーダルを閉じる
                closeModal();
                
                // 成功メッセージを表示
                alert('時間割を削除しました');
            } else {
                throw new Error('削除に失敗しました');
            }
        } catch (error) {
            console.error('時間割の削除に失敗しました:', error);
            alert('時間割の削除に失敗しました: ' + (error.message || '不明なエラー'));
        } finally {
            const deleteBtn = document.querySelector('.delete-btn');
            if (deleteBtn) {
                deleteBtn.disabled = false;
                deleteBtn.textContent = '削除';
            }
        }
    },
    
    // クリーンアップ
    cleanup() {
        // イベント購読を解除
        if (this.eventSubscriptions) {
            this.eventSubscriptions.forEach(unsubscribe => unsubscribe());
            this.eventSubscriptions = [];
        }
    }
};

export default ModalManager;