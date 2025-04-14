// コメント管理モジュール
import EventBus from './event-bus.js';
import TimetableCore from './timetable-core.js';

const CommentManager = {
    currentScheduleId: null,
    allComments: [],
    isDescending: true, // 新しい順がデフォルト
    
    // 初期化
    init() {
        this.setupEventSubscriptions();
        console.log('CommentManager 初期化完了');
        
        // 初期化完了イベントを発行
        EventBus.publish('comments:initialized', {});
    },
    
    // イベント購読を設定
    setupEventSubscriptions() {
        // UIからのイベントを購読
        this.eventSubscriptions = [
            EventBus.subscribe('ui:cellClicked', data => {
                this.currentScheduleId = data.scheduleId;
            })
        ];
    },
    
    // 詳細モーダルを表示
    showDetailModal(scheduleId, day, period) {
        console.log(`詳細モーダル表示: scheduleId=${scheduleId}, day=${day}, period=${period}`);
        
        // 現在のスケジュールIDを設定
        this.currentScheduleId = scheduleId;
        
        // データを取得
        this.loadScheduleDetails(day, period);
    },
    
    // スケジュール詳細を読み込む関数
    async loadScheduleDetails(day, period) {
        console.log(`スケジュール詳細を読み込み: day=${day}, period=${period}`);
        
        try {
            // データを取得
            const data = await TimetableCore.fetchData(day, period);
            
            if (!data) {
                console.error('データが取得できませんでした');
            return;
            }
            
            // モーダルを作成して表示
            this.createAndShowDetailModal(day, period, data);
            
        } catch (error) {
            console.error('スケジュール詳細読み込みエラー:', error);
            alert('詳細情報の読み込みに失敗しました');
        }
    },
    
    // 詳細モーダルを作成して表示
    createAndShowDetailModal(day, period, data) {
        // 既存のモーダルがあれば削除
        const existingModal = document.getElementById('scheduleDetailModal');
        if (existingModal) {
            existingModal.remove();
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
        const fileExt = this.getFileExtension(scheduleFileUrl);
        
        // ファイルの種類に応じたプレビュー表示
        let previewHtml = '';
        
        if (scheduleFileUrl) {
            if (this.isPdfFile(fileExt)) {
                // PDFファイルの場合
                previewHtml = `
                    <div class="file-preview pdf-preview">
                        <p>PDFファイルがアップロードされています</p>
                    </div>
                `;
            } else if (this.isImageFile(fileExt)) {
                // 画像ファイルの場合
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
        }
        
        // モーダルHTMLを作成
        const modalHtml = `
            <div id="scheduleDetailModal" class="schedule-detail-modal">
                <div class="modal-overlay"></div>
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>${day}曜${period}限の授業詳細</h3>
                        <button class="modal-close">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="schedule-detail">
                            <div class="schedule-info-summary">
                                <div class="detail-item">
                                    <div class="detail-label">科目名</div>
                                    <div class="detail-value">${data.subject_name || '未設定'}</div>
                                </div>
                                <div class="detail-item">
                                    <div class="detail-label">教員名</div>
                                    <div class="detail-value">${teacherName}</div>
                                </div>
                                <div class="detail-item">
                                    <div class="detail-label">教室</div>
                                    <div class="detail-value">${classroomId}</div>
                                </div>
                                <div class="detail-item">
                                    <div class="detail-label">内容</div>
                                    <div class="detail-value">${data.content || '未設定'}</div>
                                </div>
                </div>
                            
                            ${scheduleFileUrl ? `
                                ${previewHtml}
                                <div class="file-link">
                                    <a href="${scheduleFileUrl}" download="${data.subject_name || '授業資料'}.${fileExt}" class="btn btn-primary">
                                        <i class="fas fa-file-download"></i> 授業資料をダウンロード
                                    </a>
                        </div>
                            ` : ''}
                        </div>
                    </div>
                    <div class="modal-actions">
                        <button class="close-btn">閉じる</button>
                    </div>
                </div>
            </div>
        `;
        
        // モーダルを追加
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // モーダル要素を取得
        const modal = document.getElementById('scheduleDetailModal');
        const closeBtn = modal.querySelector('.modal-close');
        const closeBtnFooter = modal.querySelector('.close-btn');
        const overlay = modal.querySelector('.modal-overlay');
        
        // 閉じるボタンのイベントを設定
        const closeModal = () => modal.remove();
        closeBtn.onclick = closeModal;
        closeBtnFooter.onclick = closeModal;
        overlay.onclick = closeModal;
        
        // モーダル表示イベントを発行
        EventBus.publish('detail:shown', {
            day,
            period,
            data
        });
    },
    
    // ファイル拡張子を取得
    getFileExtension(fileUrl) {
        if (!fileUrl) return '';
        const parts = fileUrl.split('.');
        return parts.length > 1 ? parts.pop().toLowerCase() : '';
    },
    
    // PDFファイルかどうかを判定
    isPdfFile(ext) {
        return ext === 'pdf';
    },
    
    // 画像ファイルかどうかを判定
    isImageFile(ext) {
        return ['jpg', 'jpeg', 'png', 'gif'].includes(ext);
    },
    
    // クリーンアップ
    cleanup() {
        // イベント購読を解除
        if (this.eventSubscriptions) {
            this.eventSubscriptions.forEach(unsubscribe => unsubscribe());
            this.eventSubscriptions = [];
        }
    },
    
    // コメントモーダルを表示
    showCommentModal(scheduleId, day, period) {
        console.log(`コメントモーダル表示: scheduleId=${scheduleId}, day=${day}, period=${period}`);
        
        // スケジュールIDがない場合は何もしない
        if (!scheduleId) {
            console.warn('スケジュールIDがないためコメントモーダルを表示できません');
            return;
        }
        
        // 現在のスケジュールIDを設定
        this.currentScheduleId = scheduleId;
        
        // データを取得
        TimetableCore.fetchData(day, period)
            .then(data => {
                if (!data) {
                    console.error('データが取得できませんでした');
                    return;
                }
                
                // 教員情報を取得
                const teacherName = data.teacher ? data.teacher.name : (data.teacher_name || '未設定');
                
                // 教室情報を取得
                const classroomNumber = data.classroom ? data.classroom.classroom_id : (data.classroom_id || '未設定');
                
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
                
                // コメントモーダルを直接表示
                const modal = document.getElementById('writeCommentModal');
                if (modal) {
                    // スケジュール情報を表示
                    const scheduleInfoContainer = modal.querySelector('#scheduleInfoContainer');
                    if (scheduleInfoContainer) {
                        scheduleInfoContainer.innerHTML = `
                            <div class="schedule-info">
                                <div class="schedule-header">
                                    <span class="schedule-day-period">${dayJp} ${period}限</span>
                                </div>
                                <div class="schedule-details">
                                    <div class="schedule-subject">${data.subject_name || '科目名なし'}</div>
                                    <div class="schedule-teacher">担当: ${teacherName}</div>
                                    <div class="schedule-classroom">教室: ${classroomNumber}</div>
                                </div>
                            </div>
                        `;
                    }
                    
                    // モーダルを表示
                    modal.classList.remove('hidden');
                    
                    // コメント一覧を読み込む
                    this.loadComments();
                } else {
                    console.error('コメントモーダルが見つかりません');
                    alert('コメント機能を利用できません');
                }
            })
            .catch(error => {
                console.error('データ取得エラー:', error);
                alert('データの取得に失敗しました');
            });
    }
};

export default CommentManager;
