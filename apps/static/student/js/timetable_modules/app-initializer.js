// アプリケーションの初期化を管理するクラス
import EventBus from './event-bus.js';
import TimetableCore from './timetable-core.js';
import TimetableUI from './timetable-ui.js';
import ModalManager from './modal-manager.js';
import CommentManager from './comment-manager.js';
import FileViewer from './file-viewer.js';
import DataProvider from './data-provider.js';
import PdfExtractor from './pdf-extractor.js';

class AppInitializer {
    constructor() {
        this.modules = [
            { name: 'EventBus', module: EventBus },
            { name: 'DataProvider', module: DataProvider },
            { name: 'TimetableCore', module: TimetableCore },
            { name: 'ModalManager', module: ModalManager },
            { name: 'TimetableUI', module: TimetableUI },
            { name: 'CommentManager', module: CommentManager },
            { name: 'FileViewer', module: FileViewer },
            { name: 'PdfExtractor', module: PdfExtractor }
        ];
        
        this.initialized = false;
    }
    
    // アプリケーションを初期化
    async init() {
        console.log('アプリケーションの初期化を開始');
        
        try {
            // 各モジュールを初期化
            await this.initializeModules();
            
            this.initialized = true;
            console.log('アプリケーションの初期化が完了');
            
            // 初期化完了イベントを発行
            EventBus.publish('app:initialized', {});
            
            return true;
        } catch (error) {
            console.error('アプリケーションの初期化に失敗:', error);
            
            // クリーンアップを実行
            this.cleanup();
            
            return false;
        }
    }
    
    // 各モジュールを初期化
    async initializeModules() {
        for (const moduleInfo of this.modules) {
            try {
                console.log(`${moduleInfo.name} を初期化中...`);
                
                // モジュールに初期化メソッドがあれば実行
                if (typeof moduleInfo.module.init === 'function') {
                    const result = moduleInfo.module.init();
                    
                    // Promiseの場合は待機
                    if (result instanceof Promise) {
                        await result;
                    }
                }
                
                console.log(`${moduleInfo.name} の初期化が完了`);
            } catch (error) {
                console.error(`${moduleInfo.name} の初期化に失敗:`, error);
                throw error;
            }
        }
    }
    
    // クリーンアップ
    cleanup() {
        console.log('アプリケーションのクリーンアップを開始');
        
        // 各モジュールをクリーンアップ
        for (const moduleInfo of this.modules) {
            try {
                // モジュールにクリーンアップメソッドがあれば実行
                if (typeof moduleInfo.module.cleanup === 'function') {
                    moduleInfo.module.cleanup();
                }
            } catch (error) {
                console.error(`${moduleInfo.name} のクリーンアップに失敗:`, error);
            }
        }
        
        this.initialized = false;
        console.log('アプリケーションのクリーンアップが完了');
    }
}

export default AppInitializer; 