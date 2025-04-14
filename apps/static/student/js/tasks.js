// タスクの状態を更新する関数
function updateTaskStatus(checkbox) {
    const taskItem = checkbox.closest('.task-item');
    const taskId = taskItem.dataset.taskId;
    const status = checkbox.checked ? '完了' : '未完了';

    fetch('/student/tasks/update_status', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            task_id: taskId,
            status: status
        })
    })
    .then(response => response.json())
    .then(data => {
        if (!data.success) {
            console.error('タスクの更新に失敗しました');
            checkbox.checked = !checkbox.checked;
        }
    })
    .catch(error => {
        console.error('Error:', error);
        checkbox.checked = !checkbox.checked;
    });
}

// タスク内容を更新する関数
function updateTaskContent(input) {
    const taskItem = input.closest('.task-item');
    const taskId = taskItem.dataset.taskId;

    fetch('/student/tasks/update_content', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            task_id: taskId,
            content: input.value
        })
    })
    .then(response => response.json())
    .then(data => {
        if (!data.success) {
            console.error('タスクの更新に失敗しました');
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

// タスクを削除する関数
function deleteTask(button) {
    const taskItem = button.closest('.task-item');
    const taskId = taskItem.dataset.taskId;

    fetch('/student/tasks/delete', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            task_id: taskId
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            taskItem.remove();
        } else {
            console.error('タスクの削除に失敗しました');
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

// タブ切り替え
function initializeTabs() {
    document.querySelectorAll('.sticky-note').forEach(tab => {
        tab.addEventListener('click', (e) => {
            // ボタンクリック時はタブ切り替えしない
            if (e.target.closest('button')) return;
            
            document.querySelectorAll('.sticky-note').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const targetId = tab.dataset.target;
            document.querySelectorAll('.task-mood-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(targetId).classList.add('active');
        });
    });
}

// 新規タスクを追加する関数
function addNewTask() {
    const taskListContainer = document.querySelector('.task-list-container');
    
    // 新しいタスク要素を作成
    const newTaskElement = document.createElement('div');
    newTaskElement.className = 'task-item';
    newTaskElement.innerHTML = `
        <div class="task-header">
            <input type="checkbox" class="task-checkbox" onchange="updateTaskStatus(this)">
            <input type="text" class="task-content" placeholder="新しいタスクを入力" value="">
            <div class="task-actions">
                <button type="button" class="task-delete-btn" onclick="deleteTask(this)">
                    <img src="/static/common/img/feather/trash-2.svg" alt="Delete">
                </button>
            </div>
        </div>
    `;

    // タスクリストの先頭に追加
    if (taskListContainer.firstChild) {
        taskListContainer.insertBefore(newTaskElement, taskListContainer.firstChild);
    } else {
        taskListContainer.appendChild(newTaskElement);
    }

    // 入力欄にフォーカス
    const input = newTaskElement.querySelector('.task-content');
    input.focus();

    // 入力イベントの設定
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            input.blur();
        }
    });

    input.addEventListener('blur', () => {
        const content = input.value.trim();
        if (!content) {
            newTaskElement.remove();
            return;
        }

        // 新規タスクをサーバーに送信
        fetch('/student/tasks/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                content: content
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                newTaskElement.dataset.taskId = data.task_id;
            } else {
                console.error('タスクの作成に失敗しました');
                newTaskElement.remove();
            }
        })
        .catch(error => {
            console.error('Error:', error);
            newTaskElement.remove();
        });
    });
}

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    initializeTabs();
    
    // 新規タスク追加ボタンのイベントリスナー
    const createTaskBtn = document.getElementById('createTaskBtn');
    if (createTaskBtn) {
        createTaskBtn.addEventListener('click', addNewTask);
    }

    // タスク内容の編集イベントを設定
    document.querySelectorAll('.task-content').forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                input.blur();
                updateTaskContent(input);
            }
        });

        input.addEventListener('blur', () => {
            updateTaskContent(input);
        });
    });
});

// タスク関連の処理を管理するクラス
class TaskManager {
    constructor() {
        this.setupEventListeners();
        this.loadTasks();
    }

    setupEventListeners() {
        // 新規タスク追加ボタンのイベントリスナー
        const createTaskBtn = document.getElementById('createTaskBtn');
        if (createTaskBtn) {
            createTaskBtn.addEventListener('click', () => this.addNewTask());
        }
    }

    // タスク一覧を取得して表示
    async loadTasks() {
        try {
            const response = await fetch('/student/tasks/list');
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.displayTasks(data.tasks);
                }
            }
        } catch (error) {
            console.error('Error loading tasks:', error);
        }
    }

    // タスクを画面に表示
    displayTasks(tasks) {
        const taskListContainer = document.querySelector('.task-list-container');
        if (!taskListContainer) return;

        taskListContainer.innerHTML = tasks.map(task => `
            <div class="task-item" data-task-id="${task.task_id}">
                <div class="task-header">
                    <input type="checkbox" class="task-checkbox" 
                           onchange="updateTaskStatus(this)" 
                           ${task.is_completed ? 'checked' : ''}>
                    <input type="text" class="task-content" 
                           value="${task.content}">
                    <div class="task-actions">
                        <button type="button" class="task-delete-btn" onclick="deleteTask(this)">
                            <img src="/static/common/img/feather/trash-2.svg" alt="Delete">
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        // 既存のタスクの入力イベントを設定
        taskListContainer.querySelectorAll('.task-content').forEach(input => {
            this.setupTaskInputEvents(input);
        });
    }

    // 新規タスクを追加
    addNewTask() {
        const taskListContainer = document.querySelector('.task-list-container');
        if (!taskListContainer) return;
        
        const newTaskElement = document.createElement('div');
        newTaskElement.className = 'task-item new-task';  // new-taskクラスを追加
        newTaskElement.innerHTML = `
            <div class="task-header">
                <input type="checkbox" class="task-checkbox" onchange="updateTaskStatus(this)">
                <input type="text" class="task-content" placeholder="新しいタスクを入力" value="">
                <div class="task-actions">
                    <button type="button" class="task-delete-btn" onclick="deleteTask(this)">
                        <img src="/static/common/img/feather/trash-2.svg" alt="Delete">
                    </button>
                </div>
            </div>
        `;

        taskListContainer.insertBefore(newTaskElement, taskListContainer.firstChild);
        const input = newTaskElement.querySelector('.task-content');
        input.focus();

        // 新規タスク用の特別なイベントを設定
        this.setupNewTaskInputEvents(input, newTaskElement);
    }

    // 既存のタスク入力欄のイベント設定
    setupTaskInputEvents(input) {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                input.blur();
            }
        });

        input.addEventListener('blur', () => {
            const taskItem = input.closest('.task-item');
            if (!taskItem.classList.contains('new-task')) {  // 既存のタスクの場合のみ更新
                updateTaskContent(input);
            }
        });
    }

    // 新規タスク入力欄の特別なイベント設定
    setupNewTaskInputEvents(input, taskElement) {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                input.blur();
            }
        });

        input.addEventListener('blur', () => {
            if (taskElement.classList.contains('new-task')) {  // 新規タスクの場合のみ作成
                this.createTask(input, taskElement);
            }
        });
    }

    // タスクを作成
    async createTask(input, taskElement) {
        const content = input.value.trim();
        if (!content) {
            taskElement.remove();
            return;
        }

        try {
            const response = await fetch('/student/tasks/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ content: content })
            });
            const data = await response.json();
            if (data.success) {
                taskElement.dataset.taskId = data.task_id;
                taskElement.classList.remove('new-task');  // 作成完了後にnew-taskクラスを削除
                this.setupTaskInputEvents(input);  // 通常のタスク用イベントに切り替え
            } else {
                console.error('タスクの作成に失敗しました');
                taskElement.remove();
            }
        } catch (error) {
            console.error('Error:', error);
            taskElement.remove();
        }
    }
}

// ページ読み込み時にTaskManagerをインスタンス化
document.addEventListener('DOMContentLoaded', () => {
    new TaskManager();
});