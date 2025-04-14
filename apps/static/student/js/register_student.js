document.addEventListener('DOMContentLoaded', function() {
    let selectedDepartment = null;
    
    // 課程区分データの取得と表示
    fetch('/student/api/course-types')
        .then(response => response.json())
        .then(data => {
            const courseTypeList = document.getElementById('courseTypeList');
            data.forEach(courseType => {
                const item = document.createElement('button');
                item.type = 'button';
                item.className = 'list-group-item list-group-item-action';
                item.dataset.courseType = courseType.course_type;
                item.dataset.attendanceType = courseType.attendance_type;
                item.textContent = courseType.display_name;
                courseTypeList.appendChild(item);
            });
        });

    // 課程区分の選択イベント
    document.getElementById('courseTypeList').addEventListener('click', function(e) {
        if (e.target.matches('.list-group-item')) {
            // 既存のアクティブ状態をクリア
            this.querySelectorAll('.list-group-item').forEach(item => {
                item.classList.remove('active');
            });
            e.target.classList.add('active');

            const courseType = e.target.dataset.courseType;
            const attendanceType = e.target.dataset.attendanceType;

            // 学科データの取得
            fetch(`/student/api/departments?course_type=${courseType}&attendance_type=${attendanceType}`)
                .then(response => response.json())
                .then(data => {
                    const departmentList = document.getElementById('departmentList');
                    departmentList.innerHTML = '';
                    data.forEach(department => {
                        const item = document.createElement('button');
                        item.type = 'button';
                        item.className = 'list-group-item list-group-item-action';
                        item.dataset.code = department.code;
                        item.dataset.name = department.name;
                        item.dataset.partTimeType = department.part_time_type;
                        item.dataset.courseId = department.course_id;
                        item.textContent = department.name;
                        departmentList.appendChild(item);
                    });
                });
        }
    });

    // 学科の選択イベント
    document.getElementById('departmentList').addEventListener('click', function(e) {
        if (e.target.matches('.list-group-item')) {
            this.querySelectorAll('.list-group-item').forEach(item => {
                item.classList.remove('active');
            });
            e.target.classList.add('active');
            
            const departmentCode = e.target.dataset.code;
            selectedDepartment = {
                code: departmentCode,
                name: e.target.dataset.name,
                partTimeType: e.target.dataset.partTimeType,
                courseId: e.target.dataset.courseId
            };

            // department_codeをhidden inputにセット
            document.getElementById('department_code_hidden').value = departmentCode;

            // 専攻情報を取得
            fetch(`/student/api/specializations/${departmentCode}`)
                .then(response => response.json())
                .then(data => {
                    // 専攻リストをクリア
                    const specializationList = document.getElementById('specializationList');
                    specializationList.innerHTML = '';
                    
                    // グレードでグループ化
                    const gradeGroups = {};
                    data.forEach(specialization => {
                        const grade = specialization.grade;
                        if (!gradeGroups[grade]) {
                            gradeGroups[grade] = [];
                        }
                        gradeGroups[grade].push(specialization);
                    });

                    // グレードごとに専攻リストを生成
                    Object.keys(gradeGroups).sort().forEach(grade => {
                        // グレードのヘッダーを追加
                        const header = document.createElement('h6');
                        header.className = 'list-group-header mt-3 mb-2 ms-2';
                        header.textContent = `${grade}年次`;
                        specializationList.appendChild(header);

                        // そのグレードの専攻リストを生成
                        gradeGroups[grade].forEach(specialization => {
                            const item = document.createElement('button');
                            item.type = 'button';
                            item.className = 'list-group-item list-group-item-action';
                            item.dataset.id = specialization.specialization_id;
                            item.dataset.name = specialization.specialization_name;
                            item.dataset.code = specialization.specialization_code;
                            item.dataset.grade = specialization.grade;

                            // 部コードを含めた表示（例：CI13:イラスト）
                            const partCode = selectedDepartment.partTimeType === 'night' ? '2' : '1';
                            item.textContent = `${specialization.specialization_code}${partCode}${specialization.grade}:${specialization.specialization_name}`;
                            specializationList.appendChild(item);
                        });
                    });

                    // 学科名を表示エリアに設定
                    document.getElementById('departmentDisplay').textContent = selectedDepartment.name;
                    
                    // 専攻選択モーダルを表示
                    const specializationModal = new bootstrap.Modal(document.getElementById('specializationModal'));
                    specializationModal.show();
                    
                    const courseModal = bootstrap.Modal.getInstance(document.getElementById('courseModal'));
                    if (courseModal) {
                        courseModal.hide();
                        cleanupModal();
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('専攻データの取得に失敗しました');
                });
        }
    });

    // 専攻の選択イベント
    document.getElementById('specializationList').addEventListener('click', function(e) {
        if (e.target.matches('.list-group-item')) {
            const specializationId = e.target.dataset.id;
            const specializationName = e.target.dataset.name;
            const specializationCode = e.target.dataset.code;
            const grade = e.target.dataset.grade;

            // 専攻IDをhidden inputにセット
            document.getElementById('specialization_id').value = specializationId;
            // current_gradeは数値型で保存する必要があるため、文字列の'1'を数値の1に変換
            document.getElementById('current_grade').value = parseInt(grade, 10);

            // 部コードを含めた表示（例：CI13:イラスト）
            const partCode = selectedDepartment.partTimeType === 'night' ? '2' : '1';
            const displayCode = `${specializationCode}${partCode}${grade}`;
            
            // 表示を更新
            document.getElementById('departmentDisplay').textContent = 
                `${selectedDepartment.name} - ${displayCode}:${specializationName}`;

            // モーダルを閉じる
            const modal = bootstrap.Modal.getInstance(document.getElementById('specializationModal'));
            if (modal) {
                modal.hide();
                cleanupModal();
            }
        }
    });

    // モーダルのクリーンアップ処理
    function cleanupModal() {
        const modalBackdrop = document.querySelector('.modal-backdrop');
        if (modalBackdrop) {
            modalBackdrop.remove();
        }
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
    }

    // フォーム送信処理
    document.getElementById('studentRegistrationForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        
        // course_idを追加
        if (selectedDepartment && selectedDepartment.courseId) {
            formData.set('course_id', selectedDepartment.courseId);
        }
        
        // 必須項目のチェック
        const requiredFields = [
            'name', 
            'student_id', 
            'email', 
            'password', 
            'enrollment_year', 
            'enrollment_term',
            'department_code',
            'specialization_id',
            'current_grade'
        ];

        for (const field of requiredFields) {
            const value = formData.get(field);
            if (!value) {
                if (field === 'department_code') {
                    alert('学科を選択してください');
                } else if (field === 'specialization_id') {
                    alert('専攻を選択してください');
                } else {
                    alert(`${field}は必須項目です`);
                }
                return;
            }
        }

        // プロフィール画像のチェック
        const imageInput = document.getElementById('profile_image');
        if (imageInput.files.length > 0) {
            const file = imageInput.files[0];
            if (!file.type.match('image.*')) {
                alert('画像ファイルを選択してください');
                return;
            }
        }

        // 確認モーダルを閉じる
        const modal = bootstrap.Modal.getInstance(document.getElementById('confirmationModal'));
        if (modal) {
            modal.hide();
        }

        fetch('/student/api/register', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                window.location.href = '/student/auth/complete';
            } else {
                alert('登録に失敗しました: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('登録中にエラーが発生しました');
        });
    });

    // 確認モーダル表示の関数
    window.showConfirmation = function() {
        // フォームの値を取得
        const name = document.getElementById('name').value;
        const studentId = document.getElementById('student_id').value;
        const email = document.getElementById('email').value;
        const department = document.getElementById('departmentDisplay').textContent;
        const year = document.getElementById('enrollment_year').value;
        const term = document.getElementById('enrollment_term').value;
        const imageInput = document.getElementById('profile_image');
        const imageName = imageInput.files.length > 0 ? imageInput.files[0].name : 'なし';

        // 必須項目のチェック
        if (!name || !studentId || !email || department === '学科を選択してください' || !year || !term) {
            alert('必須項目を入力してください');
            return;
        }

        // 確認モーダルに値をセット
        document.getElementById('confirm-name').textContent = name;
        document.getElementById('confirm-student-id').textContent = studentId;
        document.getElementById('confirm-email').textContent = email;
        document.getElementById('confirm-department').textContent = department;
        document.getElementById('confirm-year').textContent = year + '年度';
        document.getElementById('confirm-term').textContent = term + '期';
        document.getElementById('confirm-image').textContent = imageName;

        // 確認モーダルを表示
        const confirmationModal = new bootstrap.Modal(document.getElementById('confirmationModal'));
        confirmationModal.show();
    };
});