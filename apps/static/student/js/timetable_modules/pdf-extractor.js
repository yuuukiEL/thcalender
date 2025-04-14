// PDFから時間割情報を抽出するモジュール
import EventBus from './event-bus.js';
import DataProvider from './data-provider.js';

const PdfExtractor = {
    // 初期化
    init() {
        console.log('PdfExtractor 初期化開始');
        this.setupEventSubscriptions();
        this.setupUIComponents();
        console.log('PdfExtractor 初期化完了');
        
        // 初期化完了イベントを発行
        EventBus.publish('pdfExtractor:initialized', {});
    },
    
    // イベント購読を設定
    setupEventSubscriptions() {
        // PDFアップロードボタンのイベントを購読
        const pdfUploadBtn = document.getElementById('pdfUploadBtn');
        if (pdfUploadBtn) {
            pdfUploadBtn.addEventListener('click', this.handlePdfUpload.bind(this));
        }
        
        // ファイル入力の変更イベントを設定
        const fileInput = document.getElementById('pdfFileInput');
        if (fileInput) {
            fileInput.addEventListener('change', this.handleFileSelected.bind(this));
        } else {
            // ファイル入力要素がなければ作成
            this.createFileInput();
        }
        
        // イベントバスの購読
        this.eventSubscriptions = [
            EventBus.subscribe('ui:pdfUploadRequested', () => {
                this.handlePdfUpload();
            })
        ];
    },
    
    // UIコンポーネントを設定
    setupUIComponents() {
        // ファイル入力要素の作成のみを行う
        if (!document.getElementById('pdfFileInput')) {
            this.createFileInput();
        }
    },
    
    // ファイル入力要素を作成
    createFileInput() {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.id = 'pdfFileInput';
        fileInput.accept = 'application/pdf';
        fileInput.style.display = 'none';
        fileInput.addEventListener('change', this.handleFileSelected.bind(this));
        document.body.appendChild(fileInput);
    },
    
    // PDFアップロードボタンのハンドラ
    handlePdfUpload() {
        const fileInput = document.getElementById('pdfFileInput');
        if (fileInput) {
            fileInput.click();
        }
    },
    
    // ファイル選択ハンドラ
    handleFileSelected(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // PDFファイルかどうかを確認
        if (file.type !== 'application/pdf') {
            alert('PDFファイルを選択してください');
            return;
        }
        
        console.log('PDFファイルが選択されました:', file.name);
        
        // PDFプレースメントモーダルを表示
        this.showPdfPlacementModal(file);
        
        // ファイル入力をリセット（同じファイルを再選択できるように）
        event.target.value = '';
    },
    
    // PDF配置モーダルを表示
    showPdfPlacementModal(file) {
        // 既存のモーダルを削除
        const existingModal = document.getElementById('pdfPlacementModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // モーダルを作成
        const modal = document.createElement('div');
        modal.id = 'pdfPlacementModal';
        modal.className = 'schedule-edit-modal';
        
        // モーダルのHTML構造
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
                                <button class="zoom-btn" id="zoomIn">+</button>
                                <span class="zoom-level">100%</span>
                                <button class="zoom-btn" id="zoomOut">-</button>
                            </div>
                            <button id="selectAreaBtn" class="btn">範囲選択</button>
                            <div class="selection-info" style="display: none;">
                                選択範囲: <span id="selectionCoords"></span>
                            </div>
                        </div>
                        <div class="pdf-wrapper">
                            <canvas id="pdfCanvas"></canvas>
                            <div id="selectionOverlay" class="selection-overlay"></div>
                        </div>
                    </div>
                    
                    <!-- 右側：時間割プレビュー -->
                    <div class="preview-timetable-container">
                        <div class="timetable-controls">
                            <span>セルを選択してください</span>
                            <div>
                                <button id="selectAllCells" class="btn">全選択</button>
                                <button id="clearSelection" class="btn">選択解除</button>
                            </div>
                            <div class="selected-cells-count">選択: <span id="selectedCount">0</span>個</div>
                        </div>
                        <div class="timetable-wrapper">
                            <table class="preview-timetable">
                                <thead>
                                    <tr>
                                        <th></th>
                                        <th>月</th>
                                        <th>火</th>
                                        <th>水</th>
                                        <th>木</th>
                                        <th>金</th>
                                        <th>土</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${Array.from({length: 7}, (_, i) => {
                                        const period = i + 1;
                                        return `
                                            <tr>
                                                <td>${period}</td>
                                                <td class="preview-cell" data-day="月" data-period="${period}"></td>
                                                <td class="preview-cell" data-day="火" data-period="${period}"></td>
                                                <td class="preview-cell" data-day="水" data-period="${period}"></td>
                                                <td class="preview-cell" data-day="木" data-period="${period}"></td>
                                                <td class="preview-cell" data-day="金" data-period="${period}"></td>
                                                <td class="preview-cell" data-day="土" data-period="${period}"></td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <div class="modal-actions">
                    <button id="savePdfPlacement" class="save-btn">保存</button>
                    <button class="cancel-btn">キャンセル</button>
                </div>
            </div>
        `;
        
        // モーダルをDOMに追加
        document.body.appendChild(modal);
        
        // ファイルURLを作成
        const fileUrl = URL.createObjectURL(file);
        
        // PDFを読み込み
        const loadingTask = pdfjsLib.getDocument(fileUrl);
        loadingTask.promise.then(async (pdfDoc) => {
            this.pdfDoc = pdfDoc;
            this.fileUrl = fileUrl;
            
            // キャンバスを取得
            const canvas = document.getElementById('pdfCanvas');
            const ctx = canvas.getContext('2d');
            
            // 最初のページを表示
            await this.renderPage(pdfDoc, canvas, ctx, 1);
            
            // 範囲選択ハンドラを設定
            const selectionHandler = this.setupSelectionHandlers(canvas, ctx);
            
            // 保存ボタンの処理
            const saveBtn = modal.querySelector('#savePdfPlacement');
            saveBtn.onclick = () => this.handleSavePlacement(selectionHandler, canvas, ctx, modal);
            
            // ズームコントロール
            this.setupZoomControls(canvas, pdfDoc, ctx);
            
        }).catch(error => {
            console.error('PDFの読み込みに失敗しました:', error);
            alert('PDFの読み込みに失敗しました');
            modal.remove();
            URL.revokeObjectURL(fileUrl);
        });
        
        // クリーンアップ処理
        const cleanup = () => {
            if (this.fileUrl) {
                URL.revokeObjectURL(this.fileUrl);
                this.fileUrl = null;
            }
            if (this.pdfDoc) {
                this.pdfDoc.destroy();
                this.pdfDoc = null;
            }
            modal.remove();
        };
        
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
    },
    
    // PDFページをレンダリング
    async renderPage(pdfDoc, canvas, ctx, pageNumber) {
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
    },
    
    // 範囲選択の処理を設定する関数
    setupSelectionHandlers(canvas, ctx) {
        let isSelecting = false;
        let startX, startY, endX, endY;
        let selection = null;
        let selectedCells = []; // 選択されたセルを保持
        
        const selectionOverlay = document.getElementById('selectionOverlay');
        
        // 範囲選択ボタンのイベントリスナー
        const selectAreaBtn = document.getElementById('selectAreaBtn');
        selectAreaBtn.addEventListener('click', function() {
            this.classList.toggle('active');
            isSelecting = this.classList.contains('active');
            
            // 選択モードを切り替え
            canvas.style.cursor = isSelecting ? 'crosshair' : 'default';
            
            // 選択情報の表示/非表示
            const selectionInfo = document.querySelector('.selection-info');
            selectionInfo.style.display = isSelecting ? 'block' : 'none';
            
            // 選択をクリア
            if (!isSelecting) {
                selectionOverlay.style.display = 'none';
                selection = null;
            }
        });
        
        // マウスダウンイベント
        canvas.addEventListener('mousedown', function(e) {
            if (!isSelecting) return;
            
            const rect = canvas.getBoundingClientRect();
            startX = e.clientX - rect.left;
            startY = e.clientY - rect.top;
            
            // 選択オーバーレイを表示
            selectionOverlay.style.display = 'block';
            selectionOverlay.style.left = startX + 'px';
            selectionOverlay.style.top = startY + 'px';
            selectionOverlay.style.width = '0px';
            selectionOverlay.style.height = '0px';
        });
        
        // マウス移動イベント
        canvas.addEventListener('mousemove', function(e) {
            if (!isSelecting || startX === undefined) return;
            
            const rect = canvas.getBoundingClientRect();
            endX = e.clientX - rect.left;
            endY = e.clientY - rect.top;
            
            // 選択範囲の計算
            const width = endX - startX;
            const height = endY - startY;
            
            // 選択オーバーレイを更新
            selectionOverlay.style.width = Math.abs(width) + 'px';
            selectionOverlay.style.height = Math.abs(height) + 'px';
            
            if (width < 0) {
                selectionOverlay.style.left = endX + 'px';
            }
            
            if (height < 0) {
                selectionOverlay.style.top = endY + 'px';
            }
            
            // 選択座標を表示
            document.getElementById('selectionCoords').textContent = 
                `X: ${Math.min(startX, endX)}, Y: ${Math.min(startY, endY)}, W: ${Math.abs(width)}, H: ${Math.abs(height)}`;
        });
        
        // マウスアップイベント
        canvas.addEventListener('mouseup', function() {
            if (!isSelecting || startX === undefined) return;
            
            // 選択範囲を保存
            selection = {
                x: Math.min(startX, endX),
                y: Math.min(startY, endY),
                width: Math.abs(endX - startX),
                height: Math.abs(endY - startY)
            };
            
            // 選択モードを解除
            isSelecting = false;
            selectAreaBtn.classList.remove('active');
            canvas.style.cursor = 'default';
            
            // 変数をリセット
            startX = undefined;
            startY = undefined;
        });
        
        // プレビューセルのクリックイベント
        const previewCells = document.querySelectorAll('.preview-cell');
        previewCells.forEach(cell => {
            cell.addEventListener('click', function() {
                // 選択状態を切り替え
                this.classList.toggle('selected');
                
                // 選択リストを更新
                if (this.classList.contains('selected')) {
                    selectedCells.push(this);
                } else {
                    const index = selectedCells.indexOf(this);
                    if (index !== -1) {
                        selectedCells.splice(index, 1);
                    }
                }
                
                // 選択数を更新
                document.getElementById('selectedCount').textContent = selectedCells.length;
            });
        });
        
        // 全選択ボタン
        const selectAllBtn = document.getElementById('selectAllCells');
        selectAllBtn.addEventListener('click', function() {
            previewCells.forEach(cell => {
                cell.classList.add('selected');
                if (!selectedCells.includes(cell)) {
                    selectedCells.push(cell);
                }
            });
            document.getElementById('selectedCount').textContent = selectedCells.length;
        });
        
        // 選択解除ボタン
        const clearSelectionBtn = document.getElementById('clearSelection');
        clearSelectionBtn.addEventListener('click', function() {
            previewCells.forEach(cell => {
                cell.classList.remove('selected');
            });
            selectedCells = [];
            document.getElementById('selectedCount').textContent = 0;
        });
        
        // 選択ハンドラーを返す
        return {
            getSelection: () => selection,
            getSelectedCells: () => selectedCells
        };
    },
    
    // ズームコントロールを設定
    setupZoomControls(canvas, pdfDoc, ctx) {
        let scale = 1.0;
        const zoomIn = document.getElementById('zoomIn');
        const zoomOut = document.getElementById('zoomOut');
        const zoomLevel = document.querySelector('.zoom-level');
        
        zoomIn.addEventListener('click', () => {
            scale += 0.1;
            this.updateZoom(canvas, pdfDoc, ctx, scale, zoomLevel);
        });
        
        zoomOut.addEventListener('click', () => {
            if (scale > 0.2) {
                scale -= 0.1;
                this.updateZoom(canvas, pdfDoc, ctx, scale, zoomLevel);
            }
        });
    },
    
    // ズームを更新
    async updateZoom(canvas, pdfDoc, ctx, scale, zoomLevel) {
        const page = await pdfDoc.getPage(1);
        const viewport = page.getViewport({ scale });
        
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        await page.render({
            canvasContext: ctx,
            viewport
        }).promise;
        
        zoomLevel.textContent = `${Math.round(scale * 100)}%`;
    },
    
    // 保存ボタンの処理
    async handleSavePlacement(selectionHandler, canvas, ctx, modal) {
        // 範囲選択ハンドラーから選択セルと範囲を取得
        const selectedCells = selectionHandler.getSelectedCells();
        const selection = selectionHandler.getSelection();
        
        if (selectedCells.length === 0 || !selection) {
            alert('セルと範囲を選択してください');
            return;
        }
        
        // 情報抽出ダイアログを表示
        const extractedInfo = await this.showInfoExtractionDialog(selection, ctx);
        if (!extractedInfo) {
            return; // キャンセルされた場合
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
            try {
                // FormDataを作成
                const formData = new FormData();
                formData.append('image', blob, 'selection.png');
                
                // 各セルに対して処理
                for (let i = 0; i < selectedCells.length; i++) {
                    const cell = selectedCells[i];
                    const day = cell.dataset.day;
                    const period = cell.dataset.period;
                    
                    processingMsg.textContent = `セル ${i+1}/${selectedCells.length} を処理中...`;
                    
                    try {
                        // APIリクエスト
                        const csrfToken = this.getCsrfToken();
                        const response = await fetch('/student/api/schedule/cell', {
                            method: 'POST',
                            headers: {
                                'X-CSRFToken': csrfToken
                            },
                            body: formData
                        });
                        
                        if (!response.ok) {
                            throw new Error(`APIエラー: ${response.status}`);
                        }
                        
                        // レスポンスを取得
                        const data = await response.json();
                        
                        // 抽出した情報を使用してスケジュールを更新
                        await DataProvider.updateSchedule(day, period, {
                            subject_name: extractedInfo.subject_name,
                            teacher_name: extractedInfo.teacher_name,
                            classroom_number: extractedInfo.classroom_number,
                            image_url: data.image_url
                        });
                        
                        console.log(`セル ${day}曜${period}限 を更新しました`);
                    } catch (error) {
                        console.error(`セル ${day}曜${period}限 の処理中にエラーが発生:`, error);
                    }
                }
                
                // 処理完了
                processingMsg.textContent = '処理が完了しました！';
                setTimeout(() => {
                    processingMsg.remove();
                    modal.remove();
                    
                    // 時間割を再読み込み
                    EventBus.publish('ui:reloadTimetable', {});
                }, 1000);
                
            } catch (error) {
                console.error('画像処理エラー:', error);
                processingMsg.remove();
                alert('処理中にエラーが発生しました');
            }
        }, 'image/png');
    },
    
    // 情報抽出ダイアログを表示
    async showInfoExtractionDialog(selection, ctx) {
        return new Promise(resolve => {
            // 選択範囲のプレビュー用キャンバスを作成
            const previewCanvas = document.createElement('canvas');
            previewCanvas.width = selection.width;
            previewCanvas.height = selection.height;
            const previewCtx = previewCanvas.getContext('2d');
            
            // 選択範囲を描画
            const imageData = ctx.getImageData(
                selection.x, selection.y,
                selection.width, selection.height
            );
            previewCtx.putImageData(imageData, 0, 0);
            
            // モーダルを作成
            const modal = document.createElement('div');
            modal.className = 'schedule-edit-modal';
            modal.innerHTML = `
                <div class="modal-overlay"></div>
                <div class="modal-content" style="width: 400px;">
                    <div class="modal-header">
                        <h3>時間割情報を入力</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body" style="padding: 20px;">
                        <div style="margin-bottom: 15px;">
                            <p>選択した範囲から情報を入力または修正してください：</p>
                            <div style="text-align: center; margin-bottom: 10px;">
                                <img id="previewImage" src="${previewCanvas.toDataURL()}" style="max-width: 100%; border: 1px solid #ddd;">
                            </div>
                        </div>
                        <div class="form-group" style="margin-bottom: 10px;">
                            <label for="subject_name">科目名：</label>
                            <input type="text" id="subject_name" class="form-control" style="width: 100%;">
                        </div>
                        <div class="form-group" style="margin-bottom: 10px;">
                            <label for="teacher_name">教員名：</label>
                            <input type="text" id="teacher_name" class="form-control" style="width: 100%;">
                        </div>
                        <div class="form-group" style="margin-bottom: 10px;">
                            <label for="classroom_number">教室番号：</label>
                            <input type="text" id="classroom_number" class="form-control" style="width: 100%;">
                        </div>
                    </div>
                    <div class="modal-actions">
                        <button id="saveExtractionBtn" class="save-btn">確定</button>
                        <button class="cancel-btn">キャンセル</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // 確定ボタンの処理
            const saveBtn = modal.querySelector('#saveExtractionBtn');
            saveBtn.onclick = () => {
                const extractedInfo = {
                    subject_name: document.getElementById('subject_name').value,
                    teacher_name: document.getElementById('teacher_name').value,
                    classroom_number: document.getElementById('classroom_number').value
                };
                modal.remove();
                resolve(extractedInfo);
            };
            
            // キャンセルと閉じるボタンの処理
            const cancelBtns = modal.querySelectorAll('.cancel-btn, .modal-close, .modal-overlay');
            cancelBtns.forEach(btn => {
                btn.onclick = () => {
                    modal.remove();
                    resolve(null);
                };
            });
        });
    },
    
    // CSRFトークンを取得
    getCsrfToken() {
        const cookieValue = document.cookie
            .split('; ')
            .find(row => row.startsWith('csrftoken='))
            ?.split('=')[1];
        
        if (!cookieValue) {
            // メタタグからCSRFトークンを取得
            const metaTag = document.querySelector('meta[name="csrf-token"]');
            if (metaTag) {
                return metaTag.getAttribute('content');
            }
        }
        
        return cookieValue;
    },
    
    // クリーンアップ
    cleanup() {
        // イベント購読を解除
        if (this.eventSubscriptions) {
            this.eventSubscriptions.forEach(unsubscribe => unsubscribe());
            this.eventSubscriptions = [];
        }
        
        // PDFドキュメントのクリーンアップ
        if (this.pdfDoc) {
            this.pdfDoc.destroy();
            this.pdfDoc = null;
        }
        
        // ファイルURLの解放
        if (this.fileUrl) {
            URL.revokeObjectURL(this.fileUrl);
            this.fileUrl = null;
        }
    }
};

export default PdfExtractor; 