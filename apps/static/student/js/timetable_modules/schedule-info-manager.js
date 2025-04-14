// 授業情報管理モジュール
import EventBus from './event-bus.js';
import TimetableCore from './timetable-core.js';

const ScheduleInfoManager = {
    currentScheduleId: null,
    
    // 初期化
    init() {
        this.setupEventSubscriptions();
        console.log('ScheduleInfoManager 初期化完了');
        
        // 初期化完了イベントを発行
        EventBus.publish('scheduleInfo:initialized', {});
    },
    
    // イベント購読を設定
    setupEventSubscriptions() {
        // UIからのイベントを購読
        this.eventSubscriptions = [
            EventBus.subscribe('ui:cellClicked', data => {
                this.currentScheduleId = data.scheduleId;
            }),
            EventBus.subscribe('ui:cellDoubleClicked', data => {
                this.showInfoModal(data.scheduleId, data.day, data.period);
            })
        ];
    },
    
    // 授業情報モーダルを表示
    async showInfoModal(scheduleId, day, period) {
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
                        ${scheduleFileUrl ? `
                            <div class="schedule-file">
                                <h4>授業資料:</h4>
                                ${isPdf ? `
                                    <div class="file-preview">
                                        <a href="javascript:void(0);" class="file-link preview-file-btn" data-url="${scheduleFileUrl}" data-type="pdf">
                                            <i class="fas fa-file-pdf"></i> PDFをプレビュー
                                        </a>
                                    </div>
                                ` : isImage ? `
                                    <div class="file-preview">
                                        <a href="javascript:void(0);" class="file-link preview-file-btn" data-url="${scheduleFileUrl}" data-type="image">
                                            <i class="fas fa-file-image"></i> 画像をプレビュー
                                        </a>
                                    </div>
                                ` : `
                                    <div class="file-preview">
                                        <a href="javascript:void(0);" class="file-link preview-file-btn" data-url="${scheduleFileUrl}" data-type="other">
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
            
            // ファイルプレビューボタンのイベントを設定
            const previewButtons = modal.querySelectorAll('.preview-file-btn');
            const filePreviewContainer = modal.querySelector('.file-preview-container');
            const pdfViewer = modal.querySelector('#fileViewer');
            const imageViewer = modal.querySelector('#imageViewer');
            const fileDownloadInfo = modal.querySelector('#fileDownloadInfo');
            const fileDownloadLink = modal.querySelector('#fileDownloadLink');
            
            // ファイルプレビューボタンのクリックイベントを設定
            previewButtons.forEach(button => {
                button.onclick = () => {
                    const fileUrl = button.dataset.url;
                    const fileType = button.dataset.type;
                    
                    this.showFilePreview(fileUrl, fileType, data.subject_name, fileExt, filePreviewContainer, pdfViewer, imageViewer, fileDownloadInfo, fileDownloadLink);
                };
            });
            
            // ファイルがある場合は自動的にプレビューを表示
            if (scheduleFileUrl) {
                this.showFilePreview(scheduleFileUrl, isPdf ? 'pdf' : (isImage ? 'image' : 'other'), data.subject_name, fileExt, filePreviewContainer, pdfViewer, imageViewer, fileDownloadInfo, fileDownloadLink);
            }
            
            // モーダルの閉じるボタンにイベントリスナーを追加
            const closeButtons = modal.querySelectorAll('.schedule-modal-close');
            closeButtons.forEach(button => {
                button.onclick = () => {
                    modal.classList.add('hidden');
                    // ファイルプレビューコンテナを非表示
                    if (filePreviewContainer) {
                        filePreviewContainer.style.display = 'none';
                    }
                };
            });
            
            // プレビューの閉じるボタンにイベントリスナーを追加
            const previewCloseButton = modal.querySelector('.preview-close');
            if (previewCloseButton) {
                previewCloseButton.onclick = () => {
                    // ファイルプレビューコンテナのみを非表示
                    if (filePreviewContainer) {
                        filePreviewContainer.style.display = 'none';
                    }
                };
            }
            
            // オーバーレイクリックでも閉じる
            const overlay = modal.querySelector('.schedule-modal-overlay');
            if (overlay) {
                overlay.onclick = (e) => {
                    // イベントの伝播を停止
                    e.stopPropagation();
                    modal.classList.add('hidden');
                    // ファイルプレビューコンテナを非表示
                    if (filePreviewContainer) {
                        filePreviewContainer.style.display = 'none';
                    }
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

    // ファイルプレビューを表示する関数
    showFilePreview(fileUrl, fileType, subjectName, fileExt, filePreviewContainer, pdfViewer, imageViewer, fileDownloadInfo, fileDownloadLink) {
        // ファイルプレビューコンテナを表示
        if (filePreviewContainer) {
            filePreviewContainer.style.display = 'block';
        }
        
        // ファイルタイプに応じてビューアを設定
        if (fileType === 'pdf') {
            pdfViewer.style.display = 'block';
            imageViewer.style.display = 'none';
            fileDownloadInfo.style.display = 'none';
            pdfViewer.src = fileUrl;
        } else if (fileType === 'image') {
            pdfViewer.style.display = 'none';
            imageViewer.style.display = 'block';
            fileDownloadInfo.style.display = 'none';
            imageViewer.src = fileUrl;
        } else {
            pdfViewer.style.display = 'none';
            imageViewer.style.display = 'none';
            fileDownloadInfo.style.display = 'block';
            fileDownloadLink.href = fileUrl;
            fileDownloadLink.download = `${subjectName || '授業資料'}.${fileExt}`;
        }
    },

    // 共有ボタンのクリックハンドラ
    handleShare(url) {
        navigator.clipboard.writeText(url).then(() => {
            const shareBtn = document.querySelector('.share-btn');
            shareBtn.classList.add('copied');
            setTimeout(() => {
                shareBtn.classList.remove('copied');
            }, 2000);
        }).catch(err => {
            console.error('URLのコピーに失敗しました:', err);
            alert('URLのコピーに失敗しました');
        });
    }
};

export default ScheduleInfoManager; 