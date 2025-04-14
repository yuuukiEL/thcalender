// メインのJavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log('Student dashboard loaded');
    
    // チェックボックスの機能
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            if (this.checked) {
                this.parentElement.style.textDecoration = 'line-through';
            } else {
                this.parentElement.style.textDecoration = 'none';
            }
        });
    });

    // サイドバートグル機能 - イベントリスナーを一度だけ設定
    const setupSidebar = () => {
        const sidebarToggle = document.getElementById('sidebar-toggle');
        const sidebar = document.querySelector('.sidebar');
        const sidebarClose = document.querySelector('.sidebar-close');

        if (sidebarToggle && sidebar && sidebarClose) {
            // 既存のイベントリスナーを削除（重複防止）
            sidebarToggle.removeEventListener('click', toggleSidebar);
            sidebarClose.removeEventListener('click', closeSidebar);
            
            // 新しいイベントリスナーを設定
            sidebarToggle.addEventListener('click', toggleSidebar);
            sidebarClose.addEventListener('click', closeSidebar);
            
            // 画面外クリックでサイドバーを閉じる
            document.removeEventListener('click', handleOutsideClick);
            document.addEventListener('click', handleOutsideClick);
        }
    };
    
    // イベントハンドラー関数
    function toggleSidebar(e) {
        e.stopPropagation();
        document.querySelector('.sidebar').classList.add('open');
    }
    
    function closeSidebar(e) {
        e.stopPropagation();
        document.querySelector('.sidebar').classList.remove('open');
    }
    
    function handleOutsideClick(event) {
        const sidebar = document.querySelector('.sidebar');
        const sidebarToggle = document.getElementById('sidebar-toggle');
        
        if (sidebar && sidebar.classList.contains('open') && 
            !sidebar.contains(event.target) && 
            event.target !== sidebarToggle &&
            !sidebarToggle.contains(event.target)) {
            sidebar.classList.remove('open');
        }
    }

    // タスクパネルトグル機能 - イベントリスナーを一度だけ設定
    const setupTaskPanel = () => {
        const taskToggleBtn = document.querySelector('.task-toggle-btn');
        const taskCloseBtn = document.querySelector('.task-close-btn');
        const taskContainer = document.querySelector('.task-mood-location-container');

        if (taskToggleBtn && taskCloseBtn && taskContainer) {
            // 既存のイベントリスナーを削除（重複防止）
            taskToggleBtn.removeEventListener('click', toggleTaskPanel);
            taskCloseBtn.removeEventListener('click', closeTaskPanel);
            
            // 新しいイベントリスナーを設定
            taskToggleBtn.addEventListener('click', toggleTaskPanel);
            taskCloseBtn.addEventListener('click', closeTaskPanel);
        }
    };
    
    // イベントハンドラー関数
    function toggleTaskPanel(e) {
        e.stopPropagation();
        const taskContainer = document.querySelector('.task-mood-location-container');
        taskContainer.classList.toggle('open');
        this.classList.toggle('active');
    }
    
    function closeTaskPanel(e) {
        e.stopPropagation();
        const taskContainer = document.querySelector('.task-mood-location-container');
        const taskToggleBtn = document.querySelector('.task-toggle-btn');
        taskContainer.classList.remove('open');
        taskToggleBtn.classList.remove('active');
    }
    
    // 初期設定を実行
    setupSidebar();
    setupTaskPanel();
});