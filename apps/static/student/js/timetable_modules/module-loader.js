// モジュールの動的読み込みを管理するモジュール
import EventBus from './event-bus.js';

const ModuleLoader = {
    // 読み込み済みモジュールのキャッシュ
    loadedModules: {},
    
    // 初期化
    init() {
        console.log('モジュールローダーを初期化');
        this.setupEventSubscriptions();
    },
    
    // イベント購読を設定
    setupEventSubscriptions() {
        // モジュール読み込み要求イベントを購読
        EventBus.subscribe('loader:loadModule', async data => {
            const { moduleName, modulePath } = data;
            await this.loadModule(moduleName, modulePath);
        });
    },
    
    // モジュールを動的に読み込む
    async loadModule(moduleName, modulePath) {
        if (this.loadedModules[moduleName]) {
            console.log(`モジュール ${moduleName} はすでに読み込まれています`);
            return this.loadedModules[moduleName];
        }
        
        try {
            console.log(`モジュール ${moduleName} を読み込みます: ${modulePath}`);
            const module = await import(modulePath);
            this.loadedModules[moduleName] = module.default || module;
            
            console.log(`モジュール ${moduleName} の読み込みが完了しました`);
            
            // モジュール読み込み完了イベントを発行
            EventBus.publish('loader:moduleLoaded', {
                moduleName,
                module: this.loadedModules[moduleName]
            });
            
            return this.loadedModules[moduleName];
        } catch (error) {
            console.error(`モジュール ${moduleName} の読み込みに失敗:`, error);
            
            // モジュール読み込みエラーイベントを発行
            EventBus.publish('loader:error', {
                moduleName,
                error: error.message
            });
            
            throw error;
        }
    },
    
    // モジュールが読み込まれているか確認
    isModuleLoaded(moduleName) {
        return !!this.loadedModules[moduleName];
    },
    
    // 読み込み済みのモジュールを取得
    getModule(moduleName) {
        return this.loadedModules[moduleName] || null;
    }
};

export default ModuleLoader; 