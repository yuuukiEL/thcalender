// イベントバスモジュール - モジュール間の通信を管理
const EventBus = {
    events: {},
    
    // イベントを購読
    subscribe(eventName, callback) {
        // イベント配列がなければ作成
        if (!this.events[eventName]) {
            this.events[eventName] = [];
        }
        
        // コールバックを追加
        this.events[eventName].push(callback);
        
        // 購読解除用の関数を返す
        return () => {
            this.events[eventName] = this.events[eventName].filter(
                eventCallback => eventCallback !== callback
            );
        };
    },
    
    // イベントを発行
    publish(eventName, data) {
        // イベントが登録されていなければ何もしない
        if (!this.events[eventName]) {
            return;
        }
        
        // 登録されたすべてのコールバックを実行
        this.events[eventName].forEach(callback => {
            callback(data);
        });
    },
    
    // すべてのイベントをクリア
    clear() {
        this.events = {};
    }
};

export default EventBus; 