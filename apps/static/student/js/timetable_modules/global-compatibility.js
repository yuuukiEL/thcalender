// グローバル変数と後方互換性のための関数を管理するモジュール
import TimetableCore from './timetable-core.js';
import TimetableUI from './timetable-ui.js';
import ModalManager from './modal-manager.js';
import FileViewer from './file-viewer.js';
import EventBus from './event-bus.js';
import ModuleLoader from './module-loader.js';
import DataProvider from './data-provider.js';
import CommentManager from './comment-manager.js';

const GlobalCompatibility = {
    // グローバル変数を設定
    setupGlobalVariables() {
        // モジュールをグローバルに公開
        window.TimetableCore = TimetableCore;
        window.TimetableUI = TimetableUI;
        window.ModalManager = ModalManager;
        window.FileViewer = FileViewer;
        window.DataProvider = DataProvider;
        
        // グローバル状態変数の初期化（常に閲覧モードから開始）
        window.isEditMode = false;
        window.currentDay = null;
        window.currentPeriod = null;
        window.currentScheduleId = null;
        window.allComments = [];
        
        console.log('グローバル変数を設定しました');
        console.log('編集モード:', window.isEditMode ? 'ON' : 'OFF');
    },
    
    // 後方互換性のための関数を設定
    setupCompatibilityFunctions() {
        window.fetchTimetableData = TimetableCore.fetchData.bind(TimetableCore);
        window.updateCellContent = TimetableUI.updateCellContent.bind(TimetableUI);
        window.handleCellClick = TimetableUI.handleCellClick.bind(TimetableUI);
        window.updateClassroomOptions = DataProvider.updateClassroomOptions.bind(DataProvider);
        window.createAndShowModal = ModalManager.createAndShowModal.bind(ModalManager);
        
        console.log('後方互換性のための関数を設定しました');
    },
    
    // イベント購読を設定
    setupEventSubscriptions() {
        // コアモジュールのエラーイベントを購読
        EventBus.subscribe('core:error', data => {
            console.warn('コアモジュールでエラーが発生:', data);
            // 必要に応じてエラー処理
        });
        
        console.log('イベント購読を設定しました');
    },
    
    // 初期化
    async init() {
        console.log('グローバル互換性レイヤーの初期化を開始...');
        
        try {
            this.setupGlobalVariables();
            this.setupCompatibilityFunctions();
            this.setupGlobalFunctions();
            this.setupEventSubscriptions();
            
            console.log('グローバル互換性レイヤーを初期化しました');
            
            // 初期化完了イベントを発行
            EventBus.publish('compatibility:initialized', {});
            
            return true;
        } catch (error) {
            console.error('グローバル互換性レイヤーの初期化に失敗:', error);
            EventBus.publish('compatibility:error', { error: error.message });
            throw error;
        }
    },
    
    // グローバル関数を設定
    setupGlobalFunctions() {
        // 時間割データ取得関数
        window.fetchTimetableData = async function(day, period) {
            return await TimetableCore.fetchData(day, period);
        };
        
        // 時間割更新関数
        window.updateSchedule = async function(day, period, data) {
            return await TimetableCore.updateSchedule(day, period, data);
        };
        
        // 時間割削除関数
        window.deleteSchedule = async function(scheduleId) {
            return await TimetableCore.deleteSchedule(scheduleId);
        };
        
        // 編集モード切り替え関数（timetable2.jsとの互換性用）
        window.toggleEditMode = function() {
            // TimetableUIモジュールを使用
            import('./timetable-ui.js').then(module => {
                const TimetableUI = module.default;
                const newMode = TimetableUI.toggleEditMode();
                console.log(`グローバル関数から編集モードを切り替え: ${newMode ? 'ON' : 'OFF'}`);
            });
        };
        
        // 編集モード更新関数（timetable2.jsとの互換性用）
        window.updateEditMode = function() {
            // TimetableUIモジュールを使用
            import('./timetable-ui.js').then(module => {
                const TimetableUI = module.default;
                TimetableUI.updateEditModeUI();
                console.log('グローバル関数から編集モードUIを更新');
            });
        };
        
        // コメントモーダル表示関数
        window.showCommentModal = function(scheduleId) {
            const cell = document.querySelector(`.schedule-cell[data-schedule-id="${scheduleId}"]`);
            if (cell) {
                const day = cell.dataset.day;
                const period = cell.dataset.period;
                CommentManager.showCommentModal(scheduleId, day, period);
            } else {
                console.error(`スケジュールID ${scheduleId} のセルが見つかりません`);
            }
        };
        
        // コメント追加関数
        window.addComment = async function(commentText) {
            return await CommentManager.addComment(commentText);
        };
        
        // コメント読み込み関数
        window.loadComments = async function() {
            return await CommentManager.loadComments();
        };
        
        console.log('グローバル関数を設定しました');
    }
};

export default GlobalCompatibility; 