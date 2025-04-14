// 時間割アプリケーションのメインエントリーポイント
import AppInitializer from './timetable_modules/app-initializer.js';

// アプリケーションの初期化
document.addEventListener('DOMContentLoaded', async () => {
    console.log('時間割アプリケーションを初期化します');
    
    try {
        // アプリケーション初期化クラスのインスタンスを作成
        const appInitializer = new AppInitializer();
        
        // アプリケーションを初期化
        const success = await appInitializer.init();
        
        if (success) {
            console.log('時間割アプリケーションの初期化が完了しました');
        } else {
            console.error('時間割アプリケーションの初期化に失敗しました');
        }
    } catch (error) {
        console.error('時間割アプリケーションの初期化中にエラーが発生しました:', error);
    }
}); 