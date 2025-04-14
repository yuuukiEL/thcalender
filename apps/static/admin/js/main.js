// Add functionality to task checkboxes
document.addEventListener('DOMContentLoaded', function() {
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