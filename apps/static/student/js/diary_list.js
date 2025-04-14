document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    const hashtagFilterBtn = document.getElementById('hashtagFilterBtn');
    const hashtagDropdown = document.getElementById('hashtagDropdown');
    const sortBtn = document.getElementById('sortBtn');
    const sortDropdown = document.getElementById('sortDropdown');
    const diaryCards = document.querySelectorAll('.diary-card');

    // 検索機能
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        diaryCards.forEach(card => {
            const title = card.querySelector('h2').textContent.toLowerCase();
            const content = card.querySelector('.diary-card-content p').textContent.toLowerCase();
            const tags = Array.from(card.querySelectorAll('.tag')).map(tag => tag.textContent.toLowerCase());
            
            const isMatch = title.includes(searchTerm) || 
                           content.includes(searchTerm) ||
                           tags.some(tag => tag.includes(searchTerm));
            
            card.style.display = isMatch ? 'block' : 'none';
        });
    });

    // ハッシュタグフィルター
    hashtagFilterBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        hashtagDropdown.style.display = hashtagDropdown.style.display === 'none' ? 'block' : 'none';
        sortDropdown.style.display = 'none';
    });

    // ハッシュタグによるフィルタリング（クリック方式）
    const hashtagItems = hashtagDropdown.querySelectorAll('.hashtag-item');
    let activeTag = '';

    hashtagItems.forEach(item => {
        item.addEventListener('click', function() {
            const tagName = this.dataset.tag;
            
            // アクティブ状態の切り替え
            hashtagItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            
            // 現在のアクティブタグを更新
            activeTag = tagName;
            
            // 日記カードをフィルタリング
            diaryCards.forEach(card => {
                if (!activeTag) {
                    // 「すべて表示」が選択された場合
                    card.style.display = 'block';
                } else {
                    const cardTags = card.dataset.tags ? card.dataset.tags.split(' ') : [];
                    card.style.display = cardTags.includes(activeTag) ? 'block' : 'none';
                }
            });
            
            // ドロップダウンを閉じる
            hashtagDropdown.style.display = 'none';
        });
    });

    // 並び替えボタン
    sortBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        sortDropdown.style.display = sortDropdown.style.display === 'none' ? 'block' : 'none';
        hashtagDropdown.style.display = 'none';
    });

    // 並び替え機能
    const sortRadios = sortDropdown.querySelectorAll('input[type="radio"]');
    sortRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            const sortValue = this.value;
            const diaryList = document.querySelector('.diary-list');
            const cardsArray = Array.from(diaryCards);

            cardsArray.sort((a, b) => {
                switch(sortValue) {
                    case 'date_desc':
                        return new Date(b.querySelector('.diary-date').textContent) - 
                               new Date(a.querySelector('.diary-date').textContent);
                    case 'date_asc':
                        return new Date(a.querySelector('.diary-date').textContent) - 
                               new Date(b.querySelector('.diary-date').textContent);
                    case 'title':
                        return a.querySelector('h2').textContent.localeCompare(
                            b.querySelector('h2').textContent
                        );
                    case 'hashtags':
                        return (a.querySelector('.diary-tags')?.textContent || '').localeCompare(
                            b.querySelector('.diary-tags')?.textContent || ''
                        );
                    default:
                        return 0;
                }
            });

            cardsArray.forEach(card => diaryList.appendChild(card));
        });
    });

    // ドロップダウンを閉じる
    document.addEventListener('click', function() {
        hashtagDropdown.style.display = 'none';
        sortDropdown.style.display = 'none';
    });

    // タグクリックでフィルタリング
    document.querySelectorAll('.tag').forEach(tag => {
        tag.addEventListener('click', function() {
            const tagName = this.dataset.tag;
            filterDiariesByTag(tagName);
        });
    });

    // カード要素のアニメーション
    diaryCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-5px)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
        });
    });

    // タグのフィルタリング機能
    const tags = document.querySelectorAll('.tag');
    tags.forEach(tag => {
        tag.addEventListener('click', () => {
            const tagName = tag.textContent.substring(1); // #を除去
            filterDiariesByTag(tagName);
        });
    });

    // 削除ボタンの機能
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async function(e) {
            e.stopPropagation();
            if (confirm('この日記を削除してもよろしいですか？')) {
                const diaryId = this.dataset.diaryId;
                try {
                    const response = await fetch(`/student/diary/${diaryId}`, {
                        method: 'DELETE',
                        headers: {
                            'X-CSRFToken': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                        }
                    });
                    
                    if (response.ok) {
                        const card = this.closest('.diary-card');
                        card.remove();
                        alert('日記が削除されました');
                    } else {
                        alert('日記の削除に失敗しました。');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    alert('日記の削除中にエラーが発生しました。');
                }
            }
        });
    });
});

function filterDiariesByTag(tagName) {
    const diaryCards = document.querySelectorAll('.diary-card');
    diaryCards.forEach(card => {
        const cardTags = Array.from(card.querySelectorAll('.tag'))
            .map(tag => tag.textContent.substring(1));
        
        if (cardTags.includes(tagName)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// 日記削除機能
function deleteDiary(diaryId) {
    if (confirm('この日記を削除してもよろしいですか？')) {
        fetch(`/student/diary/${diaryId}`, {
            method: 'DELETE',
            headers: {
                'X-CSRFToken': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // 成功時は該当の日記要素を削除
                const diaryElement = document.querySelector(`[data-diary-id="${diaryId}"]`);
                if (diaryElement) {
                    diaryElement.remove();
                }
                alert('日記が削除されました');
            } else {
                alert(`エラー: ${data.error}`);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('日記の削除中にエラーが発生しました');
        });
    }
} 