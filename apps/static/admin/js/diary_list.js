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

    // ハッシュタグによるフィルタリング
    const hashtagCheckboxes = hashtagDropdown.querySelectorAll('input[type="checkbox"]');
    hashtagCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const selectedTags = Array.from(hashtagCheckboxes)
                .filter(cb => cb.checked)
                .map(cb => cb.value);

            diaryCards.forEach(card => {
                const cardTags = card.dataset.tags.split(' ');
                card.style.display = selectedTags.length === 0 || 
                    selectedTags.some(tag => cardTags.includes(tag)) ? 'block' : 'none';
            });
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
    document.addEventListener('click', function(e) {
        if (!hashtagDropdown.contains(e.target) && e.target !== hashtagFilterBtn) {
            hashtagDropdown.style.display = 'none';
        }
        if (!sortDropdown.contains(e.target) && e.target !== sortBtn) {
            sortDropdown.style.display = 'none';
        }
    });

    // タグクリックでフィルタリング
    document.querySelectorAll('.tag').forEach(tag => {
        tag.addEventListener('click', function() {
            const tagName = this.dataset.tag;
            const checkbox = Array.from(hashtagCheckboxes)
                .find(cb => cb.value === tagName);
            
            if (checkbox) {
                checkbox.checked = !checkbox.checked;
                checkbox.dispatchEvent(new Event('change'));
            }
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
                    const response = await fetch(`/diary/${diaryId}`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                        }
                    });
                    
                    if (response.ok) {
                        const card = this.closest('.diary-card');
                        card.remove();
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