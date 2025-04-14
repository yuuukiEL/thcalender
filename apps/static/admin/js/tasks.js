// タスクの状態を更新する関数
function updateTaskStatus(checkbox) {
    const taskItem = checkbox.closest('.task-item');
    const taskId = taskItem.dataset.taskId;
    const status = checkbox.checked ? '完了' : '未完了';

    fetch('/tasks/update_status', {
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

    fetch('/tasks/update_content', {
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

    if (!confirm('このタスクを削除してもよろしいですか？')) {
        return;
    }

    fetch('/tasks/delete', {
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
                    <img src="/static/img/feather/trash-2.svg" alt="Delete">
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
        fetch('/tasks/create', {
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