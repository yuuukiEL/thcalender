// モーダル操作
function openReportModal() {
    document.getElementById('reportModal').classList.remove('hidden');
}

function closeReportModal() {
    document.getElementById('reportModal').classList.add('hidden');
    document.getElementById('reportForm').reset();
    resetImagePreview();
    resetVideoPreview();
}

// 画像プレビュー機能
function resetImagePreview() {
    const preview = document.getElementById('imagePreview');
    preview.classList.add('hidden');
    document.getElementById('imageUploadLabel').classList.remove('hidden');
    document.getElementById('imageInput').value = '';
}

// 動画プレビュー機能
function resetVideoPreview() {
    const preview = document.getElementById('videoPreview');
    preview.classList.add('hidden');
    document.getElementById('videoUploadLabel').classList.remove('hidden');
    document.getElementById('videoInput').value = '';
    const videoSource = preview.querySelector('source');
    if (videoSource) {
        videoSource.src = '';
    }
    const video = preview.querySelector('video');
    if (video) {
        video.load(); // 動画をリセット
    }
}

// DOMが読み込まれた後に実行
document.addEventListener('DOMContentLoaded', function() {
    // 画像アップロード処理
    document.getElementById('imageInput').addEventListener('change', function(e) {
        if (this.files && this.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const preview = document.getElementById('imagePreview');
                preview.querySelector('img').src = e.target.result;
                preview.classList.remove('hidden');
                document.getElementById('imageUploadLabel').classList.add('hidden');
            }
            reader.readAsDataURL(this.files[0]);
        }
    });

    document.getElementById('imagePreview').addEventListener('dblclick', function() {
        resetImagePreview();
    });

    // 動画アップロード処理
    document.getElementById('videoInput').addEventListener('change', function(e) {
        if (this.files && this.files[0]) {
            const file = this.files[0];
            const preview = document.getElementById('videoPreview');
            const videoSource = preview.querySelector('source');
            const video = preview.querySelector('video');
            
            videoSource.src = URL.createObjectURL(file);
            video.load(); // 新しいソースを読み込む
            
            document.getElementById('videoFileName').textContent = file.name;
            preview.classList.remove('hidden');
            document.getElementById('videoUploadLabel').classList.add('hidden');
        }
    });

    document.getElementById('videoPreview').addEventListener('dblclick', function() {
        resetVideoPreview();
    });

    // メディアスライダーの初期化
    initMediaSliders();
    
    // 画像クリックで拡大表示
    initImageZoom();
});

// メディアスライダーの初期化
function initMediaSliders() {
    const sliders = document.querySelectorAll('.media-slider');
    
    sliders.forEach(slider => {
        const slides = slider.querySelectorAll('.media-slide');
        const indicators = slider.querySelectorAll('.indicator-dot');
        const prevBtn = slider.querySelector('.slider-arrow.prev');
        const nextBtn = slider.querySelector('.slider-arrow.next');
        
        // 矢印ボタンのz-indexを高く設定して最前面に表示
        if (prevBtn) prevBtn.style.zIndex = '20';
        if (nextBtn) nextBtn.style.zIndex = '20';
        
        // スライドが存在しない場合は処理をスキップ
        if (slides.length === 0) return;
        
        let currentIndex = 0;
        let slideInterval;
        
        // スライドが1つしかない場合は矢印とインジケーターを非表示
        if (slides.length <= 1) {
            if (prevBtn) prevBtn.style.display = 'none';
            if (nextBtn) nextBtn.style.display = 'none';
            if (indicators.length > 0) {
                indicators.forEach(dot => {
                    dot.style.display = 'none';
                });
            }
            
            // 唯一のスライドを表示
            if (slides[0]) {
                slides[0].classList.remove('opacity-0');
                slides[0].classList.add('opacity-100');
                slides[0].style.zIndex = '10';
            }
            return;
        }
        
        console.log('スライダー初期化: スライド数=', slides.length);
        console.log('矢印ボタン:', prevBtn, nextBtn);
        
        // スライドを切り替える関数
        function showSlide(index) {
            slides.forEach((slide, i) => {
                // スライドの表示/非表示を切り替え
                if (i === index) {
                    slide.classList.remove('opacity-0');
                    slide.classList.add('opacity-100');
                    slide.style.zIndex = '10'; // 表示中のスライドを前面に
                } else {
                    slide.classList.add('opacity-0');
                    slide.classList.remove('opacity-100');
                    slide.style.zIndex = '1'; // 非表示のスライドを背面に
                }
            });
            
            if (indicators.length > 0) {
                indicators.forEach((dot, i) => {
                    if (i === index) {
                        dot.classList.add('bg-blue-500');
                        dot.classList.remove('bg-gray-300');
                    } else {
                        dot.classList.remove('bg-blue-500');
                        dot.classList.add('bg-gray-300');
                    }
                });
            }
            
            currentIndex = index;
        }
        
        // 自動スライド切り替えを開始
        function startSlideInterval() {
            if (slides.length > 1) {
                slideInterval = setInterval(() => {
                    let nextIndex = (currentIndex + 1) % slides.length;
                    showSlide(nextIndex);
                }, 20000); // 20秒ごとに切り替え
            }
        }
        
        // 自動スライド切り替えを停止
        function stopSlideInterval() {
            clearInterval(slideInterval);
        }
        
        // 前のスライドを表示
        if (prevBtn) {
            prevBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                stopSlideInterval();
                let prevIndex = (currentIndex - 1 + slides.length) % slides.length;
                showSlide(prevIndex);
                startSlideInterval();
            });
        } else {
            console.warn('前へボタンが見つかりません');
        }
        
        // 次のスライドを表示
        if (nextBtn) {
            nextBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                stopSlideInterval();
                let nextIndex = (currentIndex + 1) % slides.length;
                showSlide(nextIndex);
                startSlideInterval();
            });
        } else {
            console.warn('次へボタンが見つかりません');
        }
        
        // インジケーターのクリックイベント
        if (indicators.length > 0) {
            indicators.forEach((dot, index) => {
                dot.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    stopSlideInterval();
                    showSlide(index);
                    startSlideInterval();
                });
            });
        }
        
        // スライダーにマウスが乗ったら自動切り替えを停止
        slider.addEventListener('mouseenter', stopSlideInterval);
        
        // スライダーからマウスが離れたら自動切り替えを再開
        slider.addEventListener('mouseleave', startSlideInterval);
        
        // 初期化 - 最初のスライドを表示
        showSlide(0);
        startSlideInterval();
    });
}

// 画像クリックで拡大表示
function initImageZoom() {
    // 画像クリックイベントをバブリングで処理
    document.addEventListener('click', function(e) {
        // クリックされた要素またはその親要素が画像かどうかをチェック
        const img = e.target.closest('.media-slide.opacity-100 img');
        
        if (img) {
            e.preventDefault();
            e.stopPropagation();
            
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50';
            modal.innerHTML = `
                <div class="relative max-w-4xl max-h-screen p-4">
                    <img src="${img.src}" class="max-w-full max-h-[90vh] object-contain">
                    <button class="absolute top-2 right-2 bg-white rounded-full p-2 text-black">×</button>
                </div>
            `;
            document.body.appendChild(modal);
            
            modal.querySelector('button').addEventListener('click', () => {
                modal.remove();
            });
            
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.remove();
                }
            });
        }
    });
    
    // 画像にポインターカーソルを設定
    document.querySelectorAll('.media-slide img').forEach(img => {
        img.style.cursor = 'pointer';
    });
} 