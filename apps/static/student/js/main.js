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
});