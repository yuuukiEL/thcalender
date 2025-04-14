// データプロバイダモジュール
import EventBus from './event-bus.js';

const DataProvider = {
    teachersList: [],
    classroomsList: [],
    
    // 初期化
    init() {
        console.log('DataProvider 初期化開始');
        
        // 教員と教室のデータを取得
        Promise.all([
            this.fetchTeachers(),
            this.fetchClassrooms()
        ])
        .then(() => {
            console.log('DataProvider 初期化完了');
            // 初期化完了イベントを発行
            EventBus.publish('dataProvider:initialized', {
                teachersCount: this.teachersList.length,
                classroomsCount: this.classroomsList.length
            });
        })
        .catch(error => {
            console.error('DataProvider 初期化エラー:', error);
            // エラーイベントを発行
            EventBus.publish('dataProvider:error', {
                type: 'initError',
                error: error.message
            });
        });
    },
    
    // 教員リストを取得
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
            
            this.teachersList = teachers || [];
            
            console.log(`教員リスト取得完了: ${this.teachersList.length}件`);
            
            // 教員リスト取得完了イベントを発行
            EventBus.publish('dataProvider:teachersLoaded', {
                teachers: this.teachersList
            });
            
            return this.teachersList;
        } catch (error) {
            console.error('教員データの取得に失敗しました:', error);
            return [];
        }
    },
    
    // 教室リストを取得
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
            
            this.classroomsList = classrooms || [];
            
            console.log(`教室リスト取得完了: ${this.classroomsList.length}件`);
            
            // 教室リスト取得完了イベントを発行
            EventBus.publish('dataProvider:classroomsLoaded', {
                classrooms: this.classroomsList
            });
            
            return this.classroomsList;
        } catch (error) {
            console.error('教室データの取得に失敗しました:', error);
            return [];
        }
    },
    
    // 教室選択肢を更新
    updateClassroomOptions(selectElement) {
        if (!selectElement) {
            console.error('教室選択要素が見つかりません');
            return;
        }
        
        // 既存のオプションをクリア
        selectElement.innerHTML = '<option value="">教室を選択</option>';
        
        // 教室リストが空の場合は取得
        if (this.classroomsList.length === 0) {
            this.fetchClassrooms()
                .then(() => this.populateClassroomOptions(selectElement))
                .catch(error => console.error('教室リスト取得エラー:', error));
        } else {
            this.populateClassroomOptions(selectElement);
        }
    },
    
    // 教室選択肢を設定
    populateClassroomOptions(selectElement) {
        // 教室リストをソート
        const sortedClassrooms = [...this.classroomsList].sort((a, b) => {
            return a.classroom_id.localeCompare(b.classroom_id);
        });
        
        // オプションを追加
        sortedClassrooms.forEach(classroom => {
            const option = document.createElement('option');
            option.value = classroom.id;
            option.textContent = `${classroom.classroom_id} (${classroom.building})`;
            selectElement.appendChild(option);
        });
    },
    
    // 教員選択肢を更新
    updateTeacherOptions(selectElement) {
        if (!selectElement) {
            console.error('教員選択要素が見つかりません');
            return;
        }
        
        // 既存のオプションをクリア
        selectElement.innerHTML = '<option value="">教員を選択</option>';
        
        // 教員リストが空の場合は取得
        if (this.teachersList.length === 0) {
            this.fetchTeachers()
                .then(() => this.populateTeacherOptions(selectElement))
                .catch(error => console.error('教員リスト取得エラー:', error));
        } else {
            this.populateTeacherOptions(selectElement);
        }
    },
    
    // 教員選択肢を設定
    populateTeacherOptions(selectElement) {
        // 教員リストをソート
        const sortedTeachers = [...this.teachersList].sort((a, b) => {
            return a.name.localeCompare(b.name);
        });
        
        // オプションを追加
        sortedTeachers.forEach(teacher => {
            const option = document.createElement('option');
            option.value = teacher.id;
            option.textContent = teacher.name;
            selectElement.appendChild(option);
        });
    },
    
    // 全スケジュールデータを取得
    async fetchAllScheduleData() {
        try {
            console.log('全スケジュールデータ取得開始');
            
            // 学生IDを取得（メタタグから）
            const studentIdMeta = document.querySelector('meta[name="student-id"]');
            const studentId = studentIdMeta ? studentIdMeta.getAttribute('content') : null;
            
            // APIエンドポイントを構築
            let url = '/student/api/schedule/batch';
            
            // 学生IDがある場合はクエリパラメータとして追加
            if (studentId) {
                url += `?student_id=${studentId}`;
                console.log(`学生ID: ${studentId}でデータを取得します`);
            } else {
                console.warn('学生IDが見つかりません。セッションのIDを使用します。');
            }
            
            console.log(`スケジュールデータ取得URL: ${url}`);
            const response = await fetch(url);
            
            if (!response.ok) {
                console.warn(`スケジュールデータ取得警告: ${response.status} ${response.statusText}`);
                // エラーが発生しても空のデータを返す
                return this.createEmptyScheduleData();
            }
            
            const data = await response.json();
            console.log('取得したスケジュールデータ:', data);
            
            // APIレスポンスの形式に応じてデータを整形
            let schedules = this.createEmptyScheduleData();
            
            // データの形式を判断
            if (data === null || data === undefined) {
                // データがnullまたはundefinedの場合は空のデータを返す
                console.warn('データがnullまたはundefinedです。空のデータを返します。');
            } else if (Array.isArray(data)) {
                // 配列形式の場合は曜日と時限でグループ化
                schedules = this.organizeScheduleData(data);
            } else if (typeof data === 'object') {
                // オブジェクト形式の場合
                if (data.schedules) {
                    // schedules属性がある場合はそれを使用
                    schedules = this.organizeScheduleData(data.schedules);
                } else if (Object.keys(data).some(key => ['月', '火', '水', '木', '金', '土'].includes(key))) {
                    // 曜日キーがある場合はそのまま使用
                    schedules = data;
                } else {
                    // 英語の曜日_時限形式のキーを持つオブジェクト形式の場合
                    const dayMapping = {
                        'Monday': '月',
                        'Tuesday': '火',
                        'Wednesday': '水',
                        'Thursday': '木',
                        'Friday': '金',
                        'Saturday': '土'
                    };
                    
                    // 各キーを処理
                    Object.keys(data).forEach(key => {
                        // キーを曜日と時限に分解（例: "Monday_1限" → "Monday"と"1"）
                        const parts = key.split('_');
                        if (parts.length === 2) {
                            const englishDay = parts[0];
                            const periodWithSuffix = parts[1]; // "1限"
                            
                            // 日本語の曜日に変換
                            const japaneseDay = dayMapping[englishDay];
                            
                            // 時限から数字部分のみを抽出
                            const period = periodWithSuffix.replace(/[^0-9]/g, '');
                            
                            if (japaneseDay && period) {
                                // スケジュールデータを設定
                                if (!schedules[japaneseDay]) {
                                    schedules[japaneseDay] = {};
                                }
                                
                                schedules[japaneseDay][period] = data[key];
                            }
                        }
                    });
                }
            }
            
            // スケジュールデータ読み込み完了イベントを発行
            EventBus.publish('dataProvider:schedulesLoaded', {
                schedules: schedules
            });
            
            return schedules;
        } catch (error) {
            console.error('スケジュールデータ取得エラー:', error);
            
            // エラーイベントを発行
            EventBus.publish('dataProvider:error', {
                type: 'fetchError',
                error: error.message
            });
            
            // エラーが発生しても空のデータを返す
            return this.createEmptyScheduleData();
        }
    },
    
    // スケジュールデータを曜日と時限でグループ化
    organizeScheduleData(scheduleArray) {
        const days = ['月', '火', '水', '木', '金', '土'];
        const periods = ['1', '2', '3', '4', '5', '6', '7'];
        
        // 空のデータ構造を作成
        const organizedData = this.createEmptyScheduleData();
        
        // 配列データを曜日と時限でグループ化
        if (!Array.isArray(scheduleArray)) {
            console.warn('organizeScheduleData: 配列ではないデータが渡されました', scheduleArray);
            return organizedData;
        }
        
        console.log('スケジュールデータを整理します:', scheduleArray);
        
        scheduleArray.forEach(schedule => {
            // scheduleがオブジェクトでない場合はスキップ
            if (!schedule || typeof schedule !== 'object') {
                console.warn('無効なスケジュールデータをスキップします:', schedule);
                return;
            }
            
            // dayとperiodを取得
            let day = schedule.day;
            let period = schedule.period;
            
            // dayとperiodが文字列でない場合は変換
            if (day && typeof day !== 'string') {
                day = String(day);
            }
            
            if (period && typeof period !== 'string') {
                period = String(period);
            }
            
            // 英語の曜日を日本語に変換（必要に応じて）
            const dayMapping = {
                'Monday': '月',
                'Tuesday': '火',
                'Wednesday': '水',
                'Thursday': '木',
                'Friday': '金',
                'Saturday': '土',
                'Sunday': '日'
            };
            
            if (day && dayMapping[day]) {
                day = dayMapping[day];
            }
            
            // 有効な曜日と時限の場合のみ処理
            if (day && period && days.includes(day) && periods.includes(period)) {
                organizedData[day][period] = schedule;
            } else {
                console.warn(`無効な曜日または時限です: day=${day}, period=${period}`);
            }
        });
        
        return organizedData;
    },
    
    // 空のスケジュールデータを作成
    createEmptyScheduleData() {
        const days = ['月', '火', '水', '木', '金', '土'];
        const periods = ['1', '2', '3', '4', '5', '6', '7'];
        
        const emptyData = {};
        
        days.forEach(day => {
            emptyData[day] = {};
            periods.forEach(period => {
                emptyData[day][period] = {
                    subject: '',
                    teacher: '',
                    classroom: ''
                };
            });
        });
        
        return emptyData;
    },
    
    // CSRFトークンを取得
    getCsrfToken() {
        // Flaskでは通常、フォーム内の隠しフィールドとしてCSRFトークンが提供される
        const tokenInput = document.querySelector('input[name="csrf_token"]');
        if (tokenInput) {
            return tokenInput.value;
        }

        // または、metaタグから取得
        const tokenMeta = document.querySelector('meta[name="csrf-token"]');
        if (tokenMeta) {
            return tokenMeta.getAttribute('content');
        }

        // Cookieから取得する方法もある
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            cookie = cookie.trim();
            if (cookie.startsWith('csrf_token=')) {
                return cookie.substring('csrf_token='.length, cookie.length);
            }
        }

        console.warn('CSRFトークンが見つかりません');
        return '';
    },
    
    // スケジュールを更新
    async updateSchedule(scheduleData) {
        console.log('スケジュール更新:', scheduleData);
        
        try {
            // CSRFトークンを取得
            const csrfToken = this.getCsrfToken();
            
            // APIリクエスト
            const response = await fetch('/student/api/schedule/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },
                body: JSON.stringify(scheduleData)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'スケジュールの更新に失敗しました');
            }
            
            const result = await response.json();
            console.log('スケジュール更新結果:', result);
            
            // 成功イベントを発行
            EventBus.publish('schedule:updated', {
                day: scheduleData.day,
                period: scheduleData.period,
                data: result.schedule
            });
            
            return result.schedule;
        } catch (error) {
            console.error('スケジュール更新エラー:', error);
            EventBus.publish('schedule:updateError', {
                error: error.message
            });
            throw error;
        }
    },
    
    // スケジュールを削除
    async deleteSchedule(scheduleId) {
        console.log('スケジュール削除:', scheduleId);
        
        try {
            // CSRFトークンを取得
            const csrfToken = this.getCsrfToken();
            
            // APIリクエスト
            const response = await fetch('/student/api/schedule/delete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },
                body: JSON.stringify({ schedule_id: scheduleId })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'スケジュールの削除に失敗しました');
            }
            
            const result = await response.json();
            console.log('スケジュール削除結果:', result);
            
            return result;
        } catch (error) {
            console.error('スケジュール削除エラー:', error);
            EventBus.publish('schedule:deleteError', {
                error: error.message
            });
            throw error;
        }
    },
    
    // クリーンアップ
    cleanup() {
        // 必要に応じてリソースを解放
        this.teachersList = [];
        this.classroomsList = [];
    }
};

export default DataProvider;
