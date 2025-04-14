// 掲示板関連のJavaScript

function openPostModal() {
    const modal = document.getElementById('postModal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        document.body.style.overflow = 'hidden';
    } else {
        console.error('Modal element not found');
    }
}

function closePostModal() {
    document.getElementById('postModal').classList.add('hidden');
    document.getElementById('postModal').classList.remove('flex');
    document.body.style.overflow = ''; // スクロールを有効化
    
    // フォームをリセット
    document.getElementById('genre').value = '';
    document.getElementById('content').value = '';
    document.getElementById('images').value = '';
    resetImageUpload();
}

// 画像アップロード処理
document.addEventListener('DOMContentLoaded', function() {
    const imageUploadArea = document.getElementById('image-upload-area');
    const uploadPlaceholder = document.getElementById('upload-placeholder');
    const previewContainer = document.getElementById('image-preview-container');
    const previewImage = document.getElementById('preview-image');
    const imageCountBadge = document.getElementById('image-count-badge');
    const removeImageBtn = document.getElementById('remove-image-btn');
    const imageInput = document.getElementById('images');

    if (imageUploadArea) {
        // 画像エリアのクリックでファイル選択ダイアログを開く
        imageUploadArea.addEventListener('click', function() {
            imageInput.click();
        });

        // ダブルクリックでも同様
        imageUploadArea.addEventListener('dblclick', function() {
            imageInput.click();
        });
    }

    if (imageInput) {
        // 画像選択時の処理
        imageInput.addEventListener('change', function(event) {
            const files = event.target.files;
            
            if (files.length > 0) {
                // プレビュー表示
                const reader = new FileReader();
                reader.onload = function(e) {
                    previewImage.src = e.target.result;
                    uploadPlaceholder.classList.add('hidden');
                    previewContainer.classList.remove('hidden');
                    
                    // 複数画像の場合はバッジを表示
                    if (files.length > 1) {
                        imageCountBadge.textContent = `+${files.length}`;
                        imageCountBadge.classList.remove('hidden');
                    } else {
                        imageCountBadge.classList.add('hidden');
                    }
                };
                reader.readAsDataURL(files[0]); // 最初の画像をプレビュー
            } else {
                // 画像が選択されていない場合は初期表示に戻す
                resetImageUpload();
            }
        });
    }

    if (removeImageBtn) {
        // 削除ボタンの処理
        removeImageBtn.addEventListener('click', function(e) {
            e.stopPropagation(); // クリックイベントの伝播を止める
            resetImageUpload();
            imageInput.value = ''; // ファイル入力をクリア
        });
    }

    // 新規投稿モーダルのボタン設定
    const openModalBtn = document.querySelector('.open-post-modal');
    if (openModalBtn) {
        openModalBtn.addEventListener('click', openPostModal);
    }
    
    // すべてのクローズボタンを取得して設定
    const closeModalBtns = document.querySelectorAll('.close-post-modal');
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', closePostModal);
    });

    // リアクションボタンのイベントリスナーを設定
    setupReactionButtons();
});

// 画像アップロードエリアをリセット
function resetImageUpload() {
    const uploadPlaceholder = document.getElementById('upload-placeholder');
    const previewContainer = document.getElementById('image-preview-container');
    const previewImage = document.getElementById('preview-image');
    const imageCountBadge = document.getElementById('image-count-badge');
    
    if (uploadPlaceholder && previewContainer && previewImage) {
        uploadPlaceholder.classList.remove('hidden');
        previewContainer.classList.add('hidden');
        previewImage.src = '';
        imageCountBadge.classList.add('hidden');
    }
}

function toggleReaction(postId, reactionType) {
    // 引数の型を確認して適切に処理
    if (typeof postId === 'string' && postId.includes(',')) {
        const parts = postId.split(',');
        postId = parts[0].trim();
        if (!reactionType && parts.length > 1) {
            reactionType = parts[1].trim();
        }
    }

    // 引数が正しい形式であることを確認
    if (typeof reactionType === 'string') {
        reactionType = reactionType.replace(/["']/g, '');
    }

    // Fetchリクエストを送信
    fetch(`/student/bulletin/reaction/${postId}/${reactionType}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken()
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            location.reload(); // 成功時の処理
        }
    })
    .catch(error => console.error('Error:', error));
}

function toggleReactionMenu(postId) {
    const menu = document.getElementById(`reaction-menu-${postId}`);
    if (menu.classList.contains('hidden')) {
        menu.classList.remove('hidden');
    } else {
        menu.classList.add('hidden');
    }
}

function showReactionUsers(postId, reactionType) {
    // カンマの問題を処理
    if (typeof postId === 'string' && postId.includes(',')) {
        const parts = postId.split(',');
        postId = parts[0].trim();
        if (!reactionType && parts.length > 1) {
            reactionType = parts[1].trim();
            reactionType = reactionType.replace(/["']/g, '');
        }
    }
    
    if (typeof reactionType === 'string') {
        reactionType = reactionType.replace(/["']/g, '');
    }
    
    const userList = document.getElementById(`reaction-users-${postId}-${reactionType}`);
    if (userList) {
        userList.classList.remove('hidden');
    }
}

function hideReactionUsers(postId, reactionType) {
    // カンマの問題を処理
    if (typeof postId === 'string' && postId.includes(',')) {
        const parts = postId.split(',');
        postId = parts[0].trim();
        if (!reactionType && parts.length > 1) {
            reactionType = parts[1].trim();
            reactionType = reactionType.replace(/["']/g, '');
        }
    }
    
    if (typeof reactionType === 'string') {
        reactionType = reactionType.replace(/["']/g, '');
    }
    
    const userList = document.getElementById(`reaction-users-${postId}-${reactionType}`);
    if (userList) {
        userList.classList.add('hidden');
    }
}

function filterBySearch(searchText) {
    if (searchText.length >= 2) {  // 2文字以上で検索開始
        window.location.href = `/student/bulletin/?search=${encodeURIComponent(searchText)}`;
    }
}

function clearSearch() {
    document.getElementById('titleFilter').value = '';
    window.location.href = `/student/bulletin/`;
}

// CSRFトークン取得関数
function getCsrfToken() {
    return document.querySelector('input[name="csrf_token"]').value;
}

// リアクションボタンの設定
function setupReactionButtons() {
    // リアクションボタンにイベントリスナーを追加
    document.querySelectorAll('.reaction-button').forEach(button => {
        const postId = button.dataset.postId;
        const reactionType = button.dataset.reactionType;
        
        // クリックイベント
        button.addEventListener('click', function() {
            toggleReaction(postId, reactionType);
        });
        
        // マウスオーバーイベント
        button.addEventListener('mouseover', function() {
            showReactionUsers(postId, reactionType);
        });
        
        // マウスアウトイベント
        button.addEventListener('mouseout', function() {
            hideReactionUsers(postId, reactionType);
        });
    });
    
    // リアクションメニューボタンにイベントリスナーを追加
    document.querySelectorAll('.reaction-menu-button').forEach(button => {
        const postId = button.dataset.postId;
        
        button.addEventListener('click', function() {
            toggleReactionMenu(postId);
        });
    });
    
    // リアクションメニュー内のボタンにイベントリスナーを追加
    document.querySelectorAll('.reaction-menu-item').forEach(button => {
        const postId = button.dataset.postId;
        const reactionType = button.dataset.reactionType;
        
        button.addEventListener('click', function() {
            toggleReaction(postId, reactionType);
        });
    });
} 