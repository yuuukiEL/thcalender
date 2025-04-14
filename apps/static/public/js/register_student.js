document.addEventListener('DOMContentLoaded', function() {
    const courseModal = document.getElementById('courseModal');
    const specializationModal = document.getElementById('specializationModal');
    const departmentDisplay = document.getElementById('departmentDisplay');
    let selectedDepartment = null;
    let courseTypeData = [];

    // 課程区分データを取得
    fetch('/api/course-types')
        .then(response => {
            if (!response.ok) {
                throw new Error('課程区分データの取得に失敗しました');
            }
            return response.json();
        })
        .then(data => {
            courseTypeData = data;
            generateCourseTypeList(data);
        })
        .catch(error => {
            console.error('Error:', error);
            alert(error.message);
        });

    // 課程区分リストの生成
    function generateCourseTypeList(courseTypes) {
        const courseTypeList = document.getElementById('courseTypeList');
        courseTypeList.innerHTML = '';
        courseTypes.forEach((courseType) => {
            const item = document.createElement('button');
            item.type = 'button';
            item.className = 'list-group-item list-group-item-action';
            item.setAttribute('role', 'option');
            item.dataset.attendanceType = courseType.attendance_type;
            item.dataset.courseType = courseType.course_type;
            item.textContent = courseType.display_name;
            courseTypeList.appendChild(item);
        });
    }

    // 学科リストの生成
    function generateDepartmentList(departments) {
        const departmentList = document.getElementById('departmentList');
        departmentList.innerHTML = '';
        departments.forEach(department => {
            const item = document.createElement('button');
            item.type = 'button';
            item.className = 'list-group-item list-group-item-action';
            item.setAttribute('role', 'option');
            item.dataset.code = department.code;
            item.dataset.name = department.name;
            item.textContent = department.name;
            departmentList.appendChild(item);
        });
    }

    // 課程区分の選択イベント
    document.getElementById('courseTypeList').addEventListener('click', function(e) {
        if (e.target.matches('.list-group-item')) {
            this.querySelectorAll('.list-group-item').forEach(item => {
                item.classList.remove('active');
            });
            e.target.classList.add('active');
            
            const selectedAttendanceType = e.target.dataset.attendanceType;
            const selectedCourseType = e.target.dataset.courseType;
            
            fetch(`/api/departments?attendance_type=${selectedAttendanceType}&course_type=${selectedCourseType}`)
                .then(response => response.json())
                .then(data => {
                    generateDepartmentList(data);
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('学科データの取得に失敗しました');
                });
        }
    });

    // 確認モーダル表示
    window.showConfirmation = function() {
        const form = document.getElementById('studentRegistrationForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const name = document.getElementById('name').value;
        const year = document.getElementById('enrollment_year').value;
        const term = document.getElementById('enrollment_term').options[document.getElementById('enrollment_term').selectedIndex].text;
        const department = document.getElementById('departmentDisplay').textContent;
        const profileImage = document.getElementById('profile_image').files[0];

        document.getElementById('confirm-name').textContent = name;
        document.getElementById('confirm-department').textContent = department;
        document.getElementById('confirm-year').textContent = `${year}年度`;
        document.getElementById('confirm-term').textContent = term;
        document.getElementById('confirm-image').textContent = profileImage ? profileImage.name : '画像なし';

        const confirmationModal = new bootstrap.Modal(document.getElementById('confirmationModal'));
        confirmationModal.show();
    };

    // フォーム送信
    window.submitForm = function() {
        const form = document.getElementById('studentRegistrationForm');
        const formData = new FormData(form);

        fetch('/api/student/register', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                window.location.href = data.redirect_url;
            } else {
                alert(data.message || '登録に失敗しました');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('登録中にエラーが発生しました');
        });
    };

    // プロフィール画像プレビュー
    document.getElementById('profile_image').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const preview = document.getElementById('imagePreview');
                preview.innerHTML = `<img src="${e.target.result}" class="img-thumbnail" style="max-width: 200px;">`;
            };
            reader.readAsDataURL(file);
        }
    });
}); 