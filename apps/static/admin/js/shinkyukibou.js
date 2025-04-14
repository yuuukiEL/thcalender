document.addEventListener('DOMContentLoaded', function() {
    const studentSelect = document.getElementById('student_id');
    const currentInfoDiv = document.getElementById('current-info');
    const specializationTreeDiv = document.getElementById('specialization-tree');
    const promotionForm = document.getElementById('promotionForm');
    const confirmationModal = document.getElementById('confirmationModal');
    const modalBackdrop = document.getElementById('modalBackdrop');
    const confirmButton = document.getElementById('confirmButton');
    const cancelButton = document.getElementById('cancelButton');
    const errorMessageDiv = document.getElementById('error-message');

    // 学生選択時の処理
    studentSelect.addEventListener('change', async function() {
        specializationTreeDiv.innerHTML = '';
        currentInfoDiv.style.display = 'none';
        errorMessageDiv.style.display = 'none';

        if (!this.value) {
            return;
        }

        try {
            const response = await fetch(`/student/promotion/api/specializations/${this.value}`);
            if (!response.ok) {
                throw new Error('専攻情報の取得に失敗しました');
            }

            const data = await response.json();
            if (data.error) {
                throw new Error(data.error);
            }

            // 現在の情報を表示
            currentInfoDiv.innerHTML = `
                <p>現在の学科：${data.current_course_name}</p>
                <p>現在の学年：${data.current_grade}年</p>
                <p>現在の専攻：${data.current_specialization_name || '未所属'}</p>
            `;
            currentInfoDiv.style.display = 'block';

            // 専攻ツリーの表示
            const treeContainer = document.createElement('div');
            treeContainer.id = 'specializationTreeContainer';
            specializationTreeDiv.appendChild(treeContainer);

            // D3.jsを使用してツリーを描画
            const width = treeContainer.offsetWidth;
            const height = treeContainer.offsetHeight;
            const margin = {top: 20, right: 90, bottom: 30, left: 90};

            const svg = d3.select('#specializationTreeContainer')
                .append('svg')
                .attr('width', width)
                .attr('height', height)
                .append('g')
                .attr('transform', `translate(${margin.left},${margin.top})`);

            const treeLayout = d3.tree().size([height - margin.top - margin.bottom, width - margin.left - margin.right]);
            const root = d3.hierarchy(data.specializations);
            const treeData = treeLayout(root);

            // リンクを描画
            svg.selectAll('.link')
                .data(treeData.links())
                .enter()
                .append('path')
                .attr('class', 'link')
                .attr('d', d3.linkHorizontal()
                    .x(d => d.y)
                    .y(d => d.x));

            // ノードを描画
            const node = svg.selectAll('.node')
                .data(treeData.descendants())
                .enter()
                .append('g')
                .attr('class', 'node')
                .attr('transform', d => `translate(${d.y},${d.x})`);

            // ノードの円を描画
            node.append('circle')
                .attr('r', 10)
                .style('fill', '#fff')
                .style('stroke', '#4CAF50');

            // ノードのテキストを描画
            node.append('text')
                .attr('dy', '.35em')
                .attr('x', d => d.children ? -13 : 13)
                .style('text-anchor', d => d.children ? 'end' : 'start')
                .text(d => d.data.name)
                .append('tspan')
                .attr('x', d => d.children ? -13 : 13)
                .attr('dy', '1.2em')
                .text(d => d.data.applicants ? `(${d.data.applicants}名)` : '');

            // クリックイベントを追加
            node.on('click', function(event, d) {
                if (d.data.id) {
                    document.getElementById('desired_specialization_id').value = d.data.id;
                    node.selectAll('circle').style('fill', '#fff');
                    d3.select(this).select('circle').style('fill', '#4CAF50');
                }
            });

        } catch (error) {
            errorMessageDiv.textContent = error.message;
            errorMessageDiv.style.display = 'block';
        }
    });

    // フォーム送信時の処理
    promotionForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const studentId = studentSelect.value;
        const specializationId = document.getElementById('desired_specialization_id').value;

        if (!studentId || !specializationId) {
            errorMessageDiv.textContent = '学生と希望専攻を選択してください';
            errorMessageDiv.style.display = 'block';
            return;
        }

        // 確認モーダルの内容を設定
        const studentName = studentSelect.options[studentSelect.selectedIndex].text;
        const selectedNode = d3.select('.node circle[style*="fill: rgb(76, 175, 80)"]').node();
        const specializationName = selectedNode ? 
            selectedNode.parentNode.querySelector('text').textContent : '';

        document.getElementById('confirmationText').innerHTML = `
            <p>以下の内容で進級希望を登録します：</p>
            <p>学生：${studentName}</p>
            <p>希望専攻：${specializationName}</p>
        `;

        // モーダルを表示
        confirmationModal.style.display = 'block';
        modalBackdrop.style.display = 'block';
    });

    // 確認ボタンのクリックイベント
    confirmButton.addEventListener('click', function() {
        promotionForm.submit();
    });

    // キャンセルボタンのクリックイベント
    cancelButton.addEventListener('click', function() {
        confirmationModal.style.display = 'none';
        modalBackdrop.style.display = 'none';
    });

    // モーダル外クリックでモーダルを閉じる
    modalBackdrop.addEventListener('click', function() {
        confirmationModal.style.display = 'none';
        modalBackdrop.style.display = 'none';
    });
}); 