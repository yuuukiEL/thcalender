// const specializationsByStudent = {{ specializations_by_course | tojson | safe }};

function updateSpecializations() {
    const studentSelect = document.getElementById('student_id');
    const specializationContainer = document.getElementById('specialization_container');
    const studentId = studentSelect.value;
    const currentPreference = studentSelect.selectedOptions[0].dataset.currentPreference;
    const currentGrade = studentSelect.selectedOptions[0].dataset.grade;

    if (!studentId) {
        specializationContainer.innerHTML = `
            <select id="desired_specialization_id" name="desired_specialization_id" required>
                <option value="">学生を選択してください</option>
            </select>
        `;
        return;
    }

    const specializations = specializationsByStudent[studentId];
    if (!specializations || specializations.length === 0) {
        specializationContainer.innerHTML = `
            <select id="desired_specialization_id" name="desired_specialization_id" required>
                <option value="">選択可能な専攻がありません</option>
            </select>
        `;
        return;
    }

    const nextGrade = parseInt(currentGrade) + 1;
    let html = `<div class="specialization-select">`;
    html += `<select id="desired_specialization_id" name="desired_specialization_id" required>
        <option value="">専攻を選択してください</option>`;

    // 次の学年の専攻のみを表示
    specializations[0].children.forEach(spec => {
        const selected = spec.id === parseInt(currentPreference) ? 'selected' : '';
        html += `<option value="${spec.id}" ${selected}>
            ${spec.specialization_name} (希望者: ${spec.current_applicants}名)
        </option>`;
    });

    html += `</select></div>`;
    specializationContainer.innerHTML = html;
}

function showConfirmation() {
    const studentSelect = document.getElementById('student_id');
    const specializationSelect = document.getElementById('desired_specialization_id');
    const otherSpecializationSelect = document.getElementById('other_specialization_id');

    if (!studentSelect.value || (!specializationSelect.value && (!otherSpecializationSelect || !otherSpecializationSelect.value))) {
        alert('学生と希望専攻を選択してください。');
        return;
    }

    const studentText = studentSelect.selectedOptions[0].text;
    const specializationText = specializationSelect.value ? 
        specializationSelect.selectedOptions[0].text :
        otherSpecializationSelect.selectedOptions[0].text;

    document.getElementById('confirmationContent').innerHTML = `
        <p><strong>学生:</strong> ${studentText}</p>
        <p><strong>希望専攻:</strong> ${specializationText}</p>
    `;

    document.getElementById('modalBackdrop').style.display = 'block';
    document.getElementById('confirmationModal').style.display = 'block';
}

function hideConfirmation() {
    document.getElementById('modalBackdrop').style.display = 'none';
    document.getElementById('confirmationModal').style.display = 'none';
}

function submitForm() {
    const form = document.getElementById('promotionForm');
    const specializationSelect = document.getElementById('desired_specialization_id');
    const otherSpecializationSelect = document.getElementById('other_specialization_id');

    if (otherSpecializationSelect && otherSpecializationSelect.value) {
        specializationSelect.value = otherSpecializationSelect.value;
    }

    form.submit();
}

function updateSpecializationsAndTree() {
    const studentSelect = document.getElementById('student_id');
    const studentId = studentSelect.value;
    const selectedOption = studentSelect.selectedOptions[0];
    
    if (studentId) {
        // コース名を更新
        const courseName = selectedOption.text.match(/\((.*?)\)/)[1].split(' ')[1];
        document.getElementById('courseName').textContent = courseName;
        
        updateSpecializationTree(studentId);
        updateSpecializations();
    } else {
        // 学生が選択されていない場合はツリーをクリア
        document.getElementById('courseName').textContent = '';
        d3.select('#specializationTreeContainer').selectAll('*').remove();
    }
}

function updateSpecializationTree(studentId) {
    const treeData = specializationsByStudent[studentId];
    console.log('Tree data for student:', treeData);
    
    if (!treeData || treeData.length === 0) {
        console.log('No tree data available');
        d3.select('#specializationTreeContainer').selectAll('*').remove();
        return;
    }

    // 既存のツリーをクリア
    d3.select('#specializationTreeContainer').selectAll('*').remove();

    // ツリーを描画するための設定
    const container = document.getElementById('specializationTreeContainer');
    const width = container.clientWidth;
    const height = 250;

    const margin = { top: 30, right: 60, bottom: 30, left: 60 }; // マージンを調整

    // SVG要素を作成
    const svg = d3.select('#specializationTreeContainer').append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // ツリーのレイアウトを設定
    const treemap = d3.tree()
        .size([height - margin.top - margin.bottom, width - margin.right - margin.left])
        .separation((a, b) => { // ノード間の距離を調整
            return (a.parent == b.parent ? 1.5 : 2); // 距離を広げる
        });

    try {
        // データをD3の階層構造に変換
        const root = d3.hierarchy(treeData[0], d => d.children);

        // ツリーのノードとリンクを計算
        const treeDataLayout = treemap(root);

        // リンクを描画
        svg.selectAll('.link')
            .data(treeDataLayout.links())
            .enter()
            .append('path')
            .attr('class', 'link')
            .style('fill', 'none')
            .style('stroke', '#ccc')
            .style('stroke-width', '1.5px')
            .attr('d', d3.linkHorizontal()
                .x(d => d.y * 0.7) // 横方向の距離をさらに縮小
                .y(d => d.x));

        // ノードを描画
        const node = svg.selectAll('.node')
            .data(treeDataLayout.descendants())
            .enter()
            .append('g')
            .attr('class', 'node')
            .attr('transform', d => `translate(${d.y * 0.7},${d.x})`); // 横方向の距離をさらに縮小

        // ノードの背景の四角形を描画
        node.append('rect')
            .attr('class', 'node-box')
            .attr('rx', 5)
            .attr('ry', 5)
            .style('fill', 'white')
            .style('stroke', d => d.depth === 0 ? '#ff4444' : '#2196F3')
            .style('stroke-width', '1.5px');

        // ノードのテキストを描画
        const nodeText = node.append('text')
            .attr('dy', '0.3em')
            .attr('text-anchor', 'middle')
            .style('font-size', '0.9em')
            .text(d => d.data.specialization_name);

        // テキストのサイズに基づいて四角形のサイズを調整
        node.selectAll('.node-box')
            .attr('x', function(d) {
                const textLength = this.parentNode.querySelector('text').getComputedTextLength();
                return -textLength/2 - 15; // パディングを増やす
            })
            .attr('y', -12)
            .attr('width', function(d) {
                const textLength = this.parentNode.querySelector('text').getComputedTextLength();
                return textLength + 30; // パディングを増やす
            })
            .attr('height', 24); // 高さを少し小さく

    } catch (error) {
        console.error('Error drawing tree:', error);
    }
}

// CSSの更新も必要なので、動的にスタイルを追加
const style = document.createElement('style');
style.textContent = `
    .specialization-tree-container {
        border: 1px solid #ddd;
        padding: 20px;
        margin-top: 20px;
        height: 600px;
        overflow: auto;
    }
    .node circle {
        fill-opacity: 0.8;
    }
    .node text {
        font-size: 12px;
    }
    .capacity-info {
        font-size: 10px;
        fill: #666;
    }
    .link {
        fill: none;
        stroke: #ccc;
        stroke-width: 1px;
    }
`;
document.head.appendChild(style);

// ウィンドウサイズが変更されたときにツリーを再描画
window.addEventListener('resize', () => {
    const studentId = document.getElementById('student_id').value;
    if (studentId) {
        updateSpecializationTree(studentId);
    }
});

// モーダルの閉じるボタンのイベントリスナー
document.addEventListener('DOMContentLoaded', function() {
    const closeButtons = document.querySelectorAll('[data-dismiss="modal"]');
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const modalId = this.closest('.modal').id;
            $(`#${modalId}`).modal('hide');
        });
    });
});
