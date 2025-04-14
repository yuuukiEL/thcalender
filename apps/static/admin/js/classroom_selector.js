// グローバル変数
let currentClassroomInput = null;
let currentDisplayInput = null;

// モーダルを開く関数
function openClassroomSelector(displayElement) {
    const modal = document.getElementById('classroomModal');
    currentDisplayInput = displayElement;
    currentClassroomInput = displayElement.parentElement.querySelector('.classroom-id-input');
    modal.style.display = 'block';

    // 現在選択されている教室があれば、そのボタンをハイライト
    const currentId = currentClassroomInput.value;
    clearClassroomSelection();
    if (currentId) {
        const button = document.querySelector(`.classroom-btn[data-classroom-id="${currentId}"]`);
        if (button) {
            button.classList.add('selected');
        }
    }
}

// モーダルを閉じる関数
function closeClassroomSelector() {
    const modal = document.getElementById('classroomModal');
    modal.style.display = 'none';
    currentClassroomInput = null;
    currentDisplayInput = null;
}

// 教室を選択する関数
function selectClassroom(button) {
    if (currentClassroomInput && currentDisplayInput) {
        const classroomId = button.dataset.classroomId;

        currentClassroomInput.value = classroomId;
        currentDisplayInput.value = `${classroomId}教室`;

        clearClassroomSelection();
        button.classList.add('selected');

        closeClassroomSelector();
    }
}

// 選択状態をクリアする関数
function clearClassroomSelection() {
    document.querySelectorAll('.classroom-btn.selected').forEach(btn => {
        btn.classList.remove('selected');
    });
}

// イベントリスナーの設定
document.addEventListener('DOMContentLoaded', function () {
    // 閉じるボタンのイベント
    document.querySelector('.close-modal').addEventListener('click', closeClassroomSelector);

    // モーダルの外側をクリックして閉じる
    const modal = document.getElementById('classroomModal');
    modal.addEventListener('click', function (event) {
        if (event.target === modal) {
            closeClassroomSelector();
        }
    });

    // 教室ボタンのイベント
    document.querySelectorAll('.classroom-btn').forEach(button => {
        button.addEventListener('click', function () {
            selectClassroom(this);
        });
    });
}); 