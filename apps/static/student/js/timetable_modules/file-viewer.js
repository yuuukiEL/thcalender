// ファイル表示機能を管理するモジュール
import EventBus from './event-bus.js';

const FileViewer = {
    // 初期化
    init() {
        console.log('FileViewer 初期化開始');
        
        // ファイルビューア要素を取得
        this.fileViewer = document.getElementById('scheduleFileViewer');
        this.imageViewer = document.getElementById('scheduleImageViewer');
        this.fileViewerContainer = document.querySelector('.schedule-file-viewer-container');
        this.closeButton = document.getElementById('closeFileViewer');
        
        if (!this.fileViewer || !this.imageViewer || !this.fileViewerContainer || !this.closeButton) {
            console.warn('ファイルビューア要素が見つかりません');
            return false;
        }
        
        // イベントリスナーを設定
        this.setupEventListeners();
        
        console.log('FileViewer 初期化完了');
        
        // 初期化完了イベントを発行
        EventBus.publish('fileViewer:initialized', {});
        
        return true;
    },
    
    // イベントリスナーを設定
    setupEventListeners() {
        // 閉じるボタンのイベントリスナーを設定
        if (this.closeButton) {
            this.closeButton.addEventListener('click', () => {
                this.hideFileViewer();
            });
        }
        
        // イベント購読を設定
        this.eventSubscriptions = [
            EventBus.subscribe('ui:fileViewRequested', data => {
                this.showFile(data.url, data.title, data.type);
            })
        ];
    },
    
    // ファイルを表示
    showFile(url, title, type) {
        console.log(`ファイル表示: url=${url}, title=${title}, type=${type}`);
        
        if (!url) {
            console.warn('URLが指定されていません');
            return;
        }
        
        // URLを正規化
        const normalizedUrl = this.normalizeFileUrl(url);
        
        // ファイル拡張子を取得
        const fileExtension = this.getFileExtension(normalizedUrl);
        
        // タイトルが指定されていない場合はデフォルト値を設定
        const fileTitle = title || 'スケジュールファイル';
        
        // タイトルを設定
        const titleElement = document.getElementById('fileViewerTitle');
        if (titleElement) {
            titleElement.textContent = fileTitle;
        }
        
        // ファイルの種類に応じて表示方法を変更
        if (this.isPdfFile(fileExtension)) {
            // PDFの場合
            this.fileViewer.style.display = 'block';
            this.imageViewer.style.display = 'none';
            
            // PDFビューアにURLを設定
            this.fileViewer.src = normalizedUrl;
            
            // モバイルでもPDFを直接表示するが、代替リンクも提供
            if (this.isMobileDevice()) {
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
                        <a href="${normalizedUrl}" download="${fileTitle || 'schedule'}.pdf" class="btn btn-secondary pdf-download-btn">
                            <img src="/static/common/img/feather/download.svg" alt="ダウンロード" width="16" height="16">
                            ダウンロード
                        </a>
                    </div>
                `;
                
                // 既存のPDFリンクを削除
                const existingLink = this.fileViewerContainer.querySelector('.pdf-link-container');
                if (existingLink) {
                    existingLink.remove();
                }
                
                // PDFビューアの後に挿入
                this.fileViewer.parentNode.insertBefore(pdfLinkContainer, this.fileViewer.nextSibling);
            }
        } else if (this.isImageFile(fileExtension)) {
            // 画像の場合
            this.fileViewer.style.display = 'none';
            this.imageViewer.style.display = 'block';
            
            // 画像の読み込みを確認
            const tempImg = new Image();
            tempImg.onload = () => {
                this.imageViewer.src = normalizedUrl;
                console.log('画像の読み込みに成功しました');
            };
            tempImg.onerror = () => {
                console.error('画像の読み込みに失敗しました');
                // 代替パスを試す
                this.tryAlternativeFilePath(this.imageViewer, normalizedUrl);
            };
            tempImg.src = normalizedUrl;
        } else {
            // その他のファイル形式
            this.fileViewer.style.display = 'none';
            this.imageViewer.style.display = 'none';
            
            // ダウンロードリンクを表示
            const downloadLinkContainer = document.createElement('div');
            downloadLinkContainer.className = 'download-link-container';
            downloadLinkContainer.innerHTML = `
                <p>このファイル形式はプレビューできません</p>
                <a href="${normalizedUrl}" download="${fileTitle || 'file'}.${fileExtension}" class="file-download-link">ファイルをダウンロード</a>
            `;
            
            // 既存のダウンロードリンクを削除
            const existingLink = this.fileViewerContainer.querySelector('.download-link-container');
            if (existingLink) {
                existingLink.remove();
            }
            
            // ビューアの後に挿入
            this.fileViewer.parentNode.insertBefore(downloadLinkContainer, this.fileViewer.nextSibling);
        }
        
        // ファイルビューアを表示
        this.showFileViewer();
        
        // ファイル表示イベントを発行
        EventBus.publish('fileViewer:shown', {
            url: normalizedUrl,
            title: fileTitle,
            type: fileExtension
        });
    },
    
    // ファイルビューアを表示
    showFileViewer() {
        if (this.fileViewerContainer) {
            this.fileViewerContainer.style.display = 'flex';
        }
    },
    
    // ファイルビューアを非表示
    hideFileViewer() {
        if (this.fileViewerContainer) {
            this.fileViewerContainer.style.display = 'none';
            
            // ビューアをクリア
            if (this.fileViewer) {
                this.fileViewer.src = '';
            }
            if (this.imageViewer) {
                this.imageViewer.src = '';
                this.imageViewer.style.display = 'none';
            }
            
            // ダウンロードリンクを削除
            const downloadLink = this.fileViewerContainer.querySelector('.download-link-container');
            if (downloadLink) {
                downloadLink.remove();
            }
            
            // PDFリンクを削除
            const pdfLink = this.fileViewerContainer.querySelector('.pdf-link-container');
            if (pdfLink) {
                pdfLink.remove();
            }
        }
        
        // ファイルビューア非表示イベントを発行
        EventBus.publish('fileViewer:hidden', {});
    },
    
    // ファイルURLを正規化する関数
    normalizeFileUrl(url) {
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
    },
    
    // ファイル拡張子を取得
    getFileExtension(url) {
        if (!url) return '';
        const parts = url.split('.');
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
    
    // モバイルデバイスかどうかを判定
    isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },
    
    // 代替ファイルパスを試す
    tryAlternativeFilePath(imageElement, originalUrl) {
        console.log('代替ファイルパスを試みます');
        
        // 代替パスを生成（例: /uploads/schedules/ を追加）
        let alternativeUrl = originalUrl;
        
        if (!alternativeUrl.includes('/uploads/schedules/') && alternativeUrl.includes('schedules/')) {
            alternativeUrl = alternativeUrl.replace('schedules/', '/uploads/schedules/');
        }
        
        if (alternativeUrl !== originalUrl) {
            console.log('代替URL:', alternativeUrl);
            
            // 代替URLで再試行
            imageElement.src = alternativeUrl;
        } else {
            console.error('代替パスが見つかりません');
            imageElement.alt = '画像を読み込めませんでした';
        }
    },
    
    // クリーンアップ
    cleanup() {
        console.log('FileViewer クリーンアップ');
        
        // イベント購読を解除
        if (this.eventSubscriptions) {
            this.eventSubscriptions.forEach(unsubscribe => unsubscribe());
            this.eventSubscriptions = [];
        }
        
        // 閉じるボタンのイベントリスナーを削除
        if (this.closeButton) {
            this.closeButton.removeEventListener('click', this.hideFileViewer);
        }
        
        // ファイルビューアを非表示
        this.hideFileViewer();
    }
};

export default FileViewer; 