// 時間割の基本機能を管理するモジュール
import EventBus from './event-bus.js';

const TimetableCore = {
    // 定数定義
    API_ENDPOINT: '/student/api/schedule/cell',
    BATCH_API_ENDPOINT: '/student/api/schedule/batch',
    eventSubscriptions: [],
    currentDay: null,
    currentPeriod: null,
    
    // 初期化
    init() {
        this.setupEventSubscriptions();
        console.log('TimetableCore 初期化完了');
        
        // 初期化完了イベントを発行
        EventBus.publish('core:initialized', {});
        return true;
    },
    
    // イベント購読を設定
    setupEventSubscriptions() {
        // UIからのイベントを購読
        this.eventSubscriptions = [
            EventBus.subscribe('ui:cellClicked', data => {
                console.log('UIからのセルクリックイベントを受信:', data);
                this.handleCellClick(data.day, data.period);
            }),
            
            EventBus.subscribe('ui:scheduleUpdateRequested', data => {
                console.log('UIからのスケジュール更新要求を受信:', data);
                this.updateSchedule(data.day, data.period, data.scheduleData);
            })
        ];
    },
    
    // セルクリックハンドラ
    handleCellClick(day, period) {
        console.log(`セルがクリックされました: day=${day}, period=${period}`);
        this.currentDay = day;
        this.currentPeriod = period;
        
        // データ取得イベントを発行
        EventBus.publish('core:cellSelected', {
            day,
            period
        });
        
        // データを取得
        this.fetchData(day, period);
    },
    
    // データ取得
    async fetchData(day, period) {
        try {
            console.log(`時間割データを取得: day=${day}, period=${period}`);
            
            const response = await fetch(`${this.API_ENDPOINT}?day=${day}&period=${period}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('取得したデータ:', data);
            
            // データ読み込みイベントを発行
            EventBus.publish('core:dataLoaded', {
                day,
                period,
                data
            });
            
            return data;
        } catch (error) {
            console.error('データ取得エラー:', error);
            
            // エラーイベントを発行
            EventBus.publish('core:error', {
                type: 'fetchError',
                day,
                period,
                message: error.message
            });
            
            return null;
        }
    },
    
    // スケジュール更新
    async updateSchedule(day, period, scheduleData) {
        try {
            console.log(`スケジュールを更新: day=${day}, period=${period}`, scheduleData);
            
            // CSRFトークンを取得
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            
            // サーバー側のAPIエンドポイントに合わせる
            const response = await fetch(`${this.API_ENDPOINT}?day=${day}&period=${period}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },
                body: JSON.stringify(scheduleData)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('スケジュール更新成功:', result);
            
            // 更新イベントを発行
            EventBus.publish('schedule:updated', {
                day,
                period,
                data: result
            });
            
            return result;
        } catch (error) {
            console.error('スケジュール更新エラー:', error);
            EventBus.publish('error:occurred', {
                source: 'timetable-core',
                method: 'updateSchedule',
                error
            });
            throw error;
        }
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
    
    // スケジュール削除
    async deleteSchedule(day, period) {
        try {
            console.log(`スケジュールを削除: day=${day}, period=${period}`);
            
            // CSRFトークンを取得
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            
            // 削除用APIエンドポイント
            const response = await fetch(`${this.API_ENDPOINT}?day=${day}&period=${period}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('スケジュール削除成功:', result);
            
            // 削除イベントを発行
            EventBus.publish('schedule:deleted', {
                day,
                period
            });
            
            // 全データを再取得して表示を更新
            await this.fetchAllData();
            
            return { success: true };
        } catch (error) {
            console.error('スケジュール削除エラー:', error);
            EventBus.publish('error:occurred', {
                source: 'timetable-core',
                method: 'deleteSchedule',
                error
            });
            throw error;
        }
    },
    
    // 時間割データを一括取得
    async fetchAllData() {
        try {
            console.log('時間割データを一括取得します');
            
            // ユーザーIDをメタタグから取得
            const studentId = document.querySelector('meta[name="student-id"]')?.getAttribute('content');
            let url = '/student/api/schedule/batch';
            
            // student_idパラメータを追加
            if (studentId) {
                url += `?student_id=${studentId}`;
                console.log(`学生ID: ${studentId}でデータを取得します`);
            } else {
                console.warn('学生IDが見つかりません。セッションのIDを使用します。');
            }
            
            // データ取得開始
            console.log(`APIリクエスト: ${url}`);
            const response = await fetch(url);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`APIエラー (${response.status}): ${errorText}`);
                throw new Error(`時間割データの取得に失敗しました: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('取得したデータ:', data);
            
            // データをキャッシュ
            this.cachedData = data;
            
            // 教員データと教室データも取得
            await this.fetchTeachers();
            await this.fetchClassrooms();
            
            // データ取得イベントを発行
            EventBus.publish('core:dataLoaded', {
                data: this.cachedData
            });
            
            // UIを更新
            TimetableUI.updateTimetableDisplay(this.cachedData);
            
            return this.cachedData;
        } catch (error) {
            console.error('時間割データの取得に失敗しました:', error);
            
            // エラーイベントを発行
            EventBus.publish('core:error', {
                error: error.message,
                context: 'fetchAllData'
            });
            
            return null;
        }
    },
    
    // 教員データを取得
    async fetchTeachers() {
        try {
            console.log('教員データを取得します');
            const response = await fetch('/student/api/teachers');
            
            if (!response.ok) {
                throw new Error('教員データの取得に失敗しました');
            }
            
            const teachers = await response.json();
            console.log('取得した教員データ:', teachers);
            
            // グローバル変数に保存
            window.allTeachers = teachers;
            
            return teachers;
        } catch (error) {
            console.error('教員データの取得に失敗しました:', error);
            return [];
        }
    },
    
    // 教室データを取得
    async fetchClassrooms() {
        try {
            console.log('教室データを取得します');
            const response = await fetch('/student/api/classrooms');
            
            if (!response.ok) {
                throw new Error('教室データの取得に失敗しました');
            }
            
            const classrooms = await response.json();
            console.log('取得した教室データ:', classrooms);
            
            // グローバル変数に保存
            window.allClassrooms = classrooms;
            
            return classrooms;
        } catch (error) {
            console.error('教室データの取得に失敗しました:', error);
            return [];
        }
    },
    
    // クリーンアップ
    cleanup() {
        // イベント購読を解除
        this.eventSubscriptions.forEach(unsubscribe => unsubscribe());
        this.eventSubscriptions = [];
    }
};

export default TimetableCore; 