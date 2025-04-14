// 時間割アプリケーションのメインエントリポイント
import AppInitializer from './timetable_modules/app-initializer.js';
import GlobalCompatibility from './timetable_modules/global-compatibility.js';
import ModuleLoader from './timetable_modules/module-loader.js';
import EventBus from './timetable_modules/event-bus.js';
import TimetableCore from './timetable_modules/timetable-core.js';
import TimetableUI from './timetable_modules/timetable-ui.js';
import ModalManager from './timetable_modules/modal-manager.js';
import CommentManager from './timetable_modules/comment-manager.js';
import FileViewer from './timetable_modules/file-viewer.js';
import DataProvider from './timetable_modules/data-provider.js';
import ScheduleInfoManager from './timetable_modules/schedule-info-manager.js';

// グローバル変数
let isEditMode = false; // デフォルトは閲覧モード
let currentDay = null;
let currentPeriod = null;
let currentScheduleId = null;
let allComments = [];

// アプリケーション初期化
async function initApp() {
    console.log('時間割アプリケーション初期化開始');
    
    // 編集モードを強制的に閲覧モードに設定
    isEditMode = false;
    window.isEditMode = false;
    localStorage.setItem('timetableEditMode', 'false');
    
    console.log('初期編集モード:', isEditMode ? 'ON' : 'OFF');
    
    try {
        // グローバル互換性レイヤーを初期化
        GlobalCompatibility.init();
        
        // モジュールローダーを初期化
        ModuleLoader.init();
        
        // アプリケーション初期化
        const appInitializer = new AppInitializer();
        const initialized = await appInitializer.init();
        
        if (!initialized) {
            throw new Error('アプリケーションの初期化に失敗しました');
        }
        
        console.log('時間割アプリケーション初期化完了');
        console.log('初期化後の編集モード:', window.isEditMode ? 'ON' : 'OFF');
        
        // 従来のコードと同様の初期化処理
        initTraditionalCode();
        
        // モーダルマネージャーを初期化
        ModalManager.init();
        
        // 授業情報マネージャーを初期化
        ScheduleInfoManager.init();
        
        // 初期化完了イベントを発行
        EventBus.publish('app:initialized', {});
    } catch (error) {
        console.error('アプリケーション初期化エラー:', error);
        
        // 従来のスクリプトを読み込む
        console.log('従来のスクリプト(timetable2.js)を読み込みます');
        loadFallbackScript();
        
        // エラーメッセージを表示
        showErrorMessage('モジュール版の時間割表示に失敗しました。従来版を読み込みます。');
    }
}

// 従来のコードと同様の初期化処理
function initTraditionalCode() {
    console.log('従来のコードと同様の初期化処理を実行');

    try {
        // ファイルビューア要素の初期化を確認
        FileViewer.init();

        // 編集モードのトグル処理
        const toggleCheckbox = document.getElementById('edit-mode-toggle');

        if (toggleCheckbox) {
            // トグルの初期状態を設定
            toggleCheckbox.checked = window.isEditMode;
            
            toggleCheckbox.addEventListener('change', function() {
                isEditMode = this.checked;
                window.isEditMode = isEditMode;
                TimetableUI.updateEditMode();
            });
        }

        // 初期データの読み込み
        TimetableCore.fetchAllData()
            .catch(error => {
                console.error('初期データ読み込みエラー:', error);
            });
    } catch (error) {
        console.error('従来のコード初期化エラー:', error);
    }
}

// エラーメッセージを表示する関数
function showErrorMessage(message) {
    const errorContainer = document.createElement('div');
    errorContainer.className = 'error-message';
    errorContainer.style.cssText = 'background-color: #ffebee; color: #c62828; padding: 10px; margin: 10px 0; border-radius: 4px; display: none;';
    errorContainer.textContent = message;
    
    // ページの先頭に挿入
    const firstChild = document.body.firstChild;
    document.body.insertBefore(errorContainer, firstChild);
    
    // フェードイン
    setTimeout(() => {
        errorContainer.style.display = 'block';
        let opacity = 0;
        const fadeIn = setInterval(() => {
            opacity += 0.1;
            errorContainer.style.opacity = opacity;
            if (opacity >= 1) clearInterval(fadeIn);
        }, 30);
        
        // 5秒後にフェードアウト
        setTimeout(() => {
            let opacity = 1;
            const fadeOut = setInterval(() => {
                opacity -= 0.1;
                errorContainer.style.opacity = opacity;
                if (opacity <= 0) {
                    clearInterval(fadeOut);
                    errorContainer.remove();
                }
            }, 30);
        }, 5000);
    }, 100);
}

// フォールバックスクリプトを読み込む関数
function loadFallbackScript() {
    const script = document.createElement('script');
    script.src = '/static/student/js/timetable2.js';
    script.onerror = function() {
        console.error('従来のスクリプト読み込みに失敗しました');
    };
    script.onload = function() {
        console.log('従来のスクリプト読み込み完了');
    };
    document.body.appendChild(script);
}

// グローバルエラーハンドリング
window.addEventListener('error', (event) => {
    // モジュールの読み込みに失敗した場合のエラー処理
    if (event.error && event.error.message && 
        (event.error.message.includes('Failed to fetch') || 
         event.error.message.includes('module specifier') ||
         event.error.message.includes('import'))) {
        
        console.log('モジュール読み込みエラー、従来のスクリプトを読み込みます');
        loadFallbackScript();
    }
});

// グローバル関数
window.fetchTimetableData = TimetableCore.fetchData.bind(TimetableCore);
window.updateSchedule = TimetableCore.updateSchedule.bind(TimetableCore);
window.deleteSchedule = TimetableCore.deleteSchedule.bind(TimetableCore);

// TimetableUI.updateEditModeがない場合は、toggleEditModeを使用
window.updateEditMode = TimetableUI.toggleEditMode ? 
    TimetableUI.toggleEditMode.bind(TimetableUI) : 
    function() { console.warn('updateEditMode is not available'); };

window.showCommentModal = CommentManager.showCommentModal ? 
    CommentManager.showCommentModal.bind(CommentManager) : 
    function() { console.warn('showCommentModal is not available'); };

window.addComment = CommentManager.addComment ? 
    CommentManager.addComment.bind(CommentManager) : 
    function() { console.warn('addComment is not available'); };

window.loadComments = CommentManager.loadComments ? 
    CommentManager.loadComments.bind(CommentManager) : 
    function() { console.warn('loadComments is not available'); };

window.handleCellClick = TimetableUI.handleCellClick.bind(TimetableUI);
window.updateTimetableDisplay = TimetableUI.updateTimetableDisplay.bind(TimetableUI);
window.initFileViewer = FileViewer.init.bind(FileViewer);

// 授業情報モーダル表示関数を追加
window.showScheduleInfoModal = ScheduleInfoManager.showInfoModal.bind(ScheduleInfoManager);

// グローバル互換性レイヤーを初期化
GlobalCompatibility.setupGlobalFunctions();

// DOMコンテンツ読み込み完了時にアプリケーションを初期化
document.addEventListener('DOMContentLoaded', initApp);