console.log('Initializing class creation script');

document.addEventListener('DOMContentLoaded', function() {
    const specializationSelect = document.getElementById('specializationSelect');
    const teacherSelect = document.getElementById('teacherSelect');
    const classCreationForm = document.getElementById('classCreationForm');

    // 専攻データを取得してドロップダウンに表示
    async function loadSpecializations() {
        console.log('Loading specializations...');
        try {
            const response = await fetch('/api/specializations/all');
            console.log('Specializations API response:', response);
            if (!response.ok) {
                throw new Error('専攻データの取得に失敗しました');
            }
            const specializations = await response.json();
            
            specializationSelect.innerHTML = '<option value="">専攻を選択してください</option>';
            specializations.forEach(spec => {
                const option = document.createElement('option');
                option.value = spec.id;
                option.textContent = `${spec.grade}年 ${spec.specialization_name}`;
                specializationSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading specializations:', error);
            alert('専攻データの取得中にエラーが発生しました');
        }
    }

    

    // フォーム送信時の処理
    classCreationForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const specializationId = specializationSelect.value;
        const teacherId = teacherSelect.value;
        const classLetter = classLetter.value.trim().toUpperCase();

        if (!specializationId || !teacherId || !classLetter) {
            alert('すべての項目を入力してください');
            return;
        }

        try {
            const response = await fetch('/api/classes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    specialization_id: specializationId,
                    teacher_id: teacherId,
                    class_letter: classLetter
                })
            });

            if (!response.ok) {
                throw new Error('クラスの作成に失敗しました');
            }

            const result = await response.json();
            if (result.success) {
                alert('クラスが正常に作成されました');
                window.location.reload();
            } else {
                throw new Error(result.message || 'クラスの作成に失敗しました');
            }
        } catch (error) {
            console.error('Error creating class:', error);
            alert(error.message);
        }
    });

    // 初期データ読み込み
    loadSpecializations();
    loadTeachers();
}); 