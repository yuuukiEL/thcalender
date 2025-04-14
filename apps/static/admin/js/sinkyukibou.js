// const specializationsByStudent = {{ specializations_by_course | tojson | safe }};

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded');
    console.log('specializationsByStudent:', specializationsByStudent);
    
    const studentSelect = document.getElementById('student_id');
    if (studentSelect) {
        console.log('Student select found');
        studentSelect.addEventListener('change', function() {
            console.log('Student selected:', this.value);
            updateSpecializationsAndTree();
        });
    } else {
        console.log('Student select not found');
    }
});

function clearSpecializationTree() {
    const container = document.getElementById('specializationTreeContainer');
    if (container) {
        container.innerHTML = '';
    }
}

function buildHierarchicalData(specializations) {
    // 現在の専攻（根）を見つける
    const currentSpecialization = specializations.find(spec => spec.is_current);
    if (!currentSpecialization) return null;

    // IDをキーとする専攻のマップを作成
    const specMap = new Map(specializations.map(spec => [spec.id, spec]));

    // 再帰的にツリーを構築する関数
    function buildTree(spec) {
        if (!spec) return null;

        const node = {
            name: `${spec.grade}年 ${spec.specialization_name}`,
            id: spec.id,
            grade: spec.grade,
            current_applicants: spec.current_applicants,
            planned_capacity: spec.planned_capacity,
            children: []
        };

        // この専攻をprevious_specialization_idとして持つ専攻を探す
        specializations.forEach(childSpec => {
            if (childSpec.previous_specialization_id === spec.id) {
                const childNode = buildTree(childSpec);
                if (childNode) {
                    node.children.push(childNode);
                }
            }
        });

        return node;
    }

    // ツリーを構築して返す
    return buildTree(currentSpecialization);
}

function displaySpecializationTree(specializations) {
    clearSpecializationTree();
    if (!specializations || specializations.length === 0) return;

    const container = document.getElementById('specializationTreeContainer');
    
    // 現在の学年を取得
    const currentSpecialization = specializations.find(spec => spec.is_current);
    const currentGrade = currentSpecialization ? currentSpecialization.grade : 0;
    
    // SVGのサイズを設定
    const width = container.clientWidth;
    const height = 250;
    const margin = { top: 20, right: 100, bottom: 20, left: 100 };  // 左右のマージンを増やして中央寄りに

    // SVG要素を作成
    const svg = d3.select('#specializationTreeContainer')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // 階層構造のデータを構築
    const treeData = buildHierarchicalData(specializations);
    if (!treeData) return;

    // ツリーレイアウトを設定
    const treeLayout = d3.tree()
        .size([height - margin.top - margin.bottom, width - margin.left - margin.right])
        .separation((a, b) => (a.parent == b.parent ? 1 : 1.2));

    // データを階層構造に変換
    const root = d3.hierarchy(treeData);
    const treeData2 = treeLayout(root);

    // リンク（線）を描画
    svg.selectAll('.link')
        .data(treeData2.links())
        .enter()
        .append('path')
        .attr('class', 'link')
        .attr('d', d3.linkHorizontal()
            .x(d => d.y * 0.6)  // 横方向の距離を0.6倍に縮小
            .y(d => d.x))
        .style('fill', 'none')
        .style('stroke', '#ccc')
        .style('stroke-width', '1px');

    // ノードを描画
    const node = svg.selectAll('.node')
        .data(treeData2.descendants())
        .enter()
        .append('g')
        .attr('class', 'node')
        .attr('transform', d => `translate(${d.y * 0.6},${d.x})`)
        .style('cursor', d => {
            const grade = d.data.grade;
            return grade === currentGrade + 1 ? 'pointer' : 'not-allowed';
        })
        .on('click', function(event, d) {
            const grade = d.data.grade;
            if (grade === currentGrade + 1) {
                selectSpecialization(d.data.id, this);
            }
        });

    // ノードの背景を描画
    node.append('rect')
        .attr('class', 'node-box')
        .attr('x', -65)  // 少し幅を広げる
        .attr('y', -12)
        .attr('width', 130)  // 少し幅を広げる
        .attr('height', 24)  // 高さを調整
        .attr('rx', 5)
        .style('fill', d => {
            const grade = d.data.grade;
            return grade === currentGrade + 1 ? 'white' : '#f5f5f5';
        })
        .style('stroke', d => d.depth === 0 ? '#ff4444' : '#2196F3')
        .style('stroke-width', '1.5px');

    // ノードのテキストを描画
    node.append('text')
        .attr('dy', '0.3em')
        .attr('text-anchor', 'middle')
        .style('font-size', '0.75em')  // フォントサイズをさらに小さく
        .text(d => d.data.name);
}

function selectSpecialization(specializationId, element) {
    const studentId = document.getElementById('student_id').value;
    const specializations = specializationsByStudent[studentId];
    const currentGrade = specializations.find(spec => spec.is_current).grade;

    // D3.jsのノードデータを取得
    const nodeData = d3.select(element).datum();
    const grade = nodeData.data.grade;

    // 選択された専攻が現在の学年+1でない場合は処理を中止
    if (grade !== currentGrade + 1) {
        return;
    }

    // 選択状態をリセット
    d3.selectAll('.node-box').style('fill', function(d) {
        const grade = d.data.grade;
        return grade === currentGrade + 1 ? 'white' : '#f5f5f5';
    });
    
    // 選択された要素の背景色を変更
    d3.select(element).select('.node-box').style('fill', '#e3f2fd');

    // hidden inputに選択した専攻のIDを設定
    const hiddenInput = document.getElementById('desired_specialization_id');
    if (hiddenInput) {
        hiddenInput.value = specializationId;
        // 選択された専攻の名前を保存
        hiddenInput.dataset.selectedName = nodeData.data.name;
        showConfirmation(nodeData.data);
    }
}

function showConfirmation(selectedData) {
    const studentSelect = document.getElementById('student_id');
    const hiddenInput = document.getElementById('desired_specialization_id');

    if (!studentSelect.value || !hiddenInput.value) {
        alert('学生と希望専攻を選択してください。');
        return;
    }

    const studentText = studentSelect.selectedOptions[0].text;
    const specializationText = selectedData.name;

    document.getElementById('confirmationContent').innerHTML = `
        <p><strong>学生:</strong> ${studentText}</p>
        <p><strong>希望専攻:</strong> ${specializationText}</p>
        <p><strong>専攻ID:</strong> ${hiddenInput.value}</p>
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
    if (form) {
        form.submit();
    }
}

function updateSpecializations() {
    const studentSelect = document.getElementById('student_id');
    const specializationContainer = document.getElementById('specialization_container');
    const studentId = studentSelect.value;
    const currentPreference = studentSelect.selectedOptions[0].dataset.currentPreference;
    const currentGrade = studentSelect.selectedOptions[0].dataset.grade;

    console.log('specializationsByStudent:', specializationsByStudent);
    console.log('studentId:', studentId);
    console.log('currentPreference:', currentPreference);
    console.log('currentGrade:', currentGrade);

    if (!studentId) {
        specializationContainer.innerHTML = `
            <select id="desired_specialization_id" name="desired_specialization_id" required>
                <option value="">学生を選択してください</option>
            </select>
        `;
        return;
    }

    const specializations = specializationsByStudent[studentId];
    console.log('specializations:', specializations);

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

    // データ構造に応じて処理を分岐
    if (Array.isArray(specializations)) {
        specializations.forEach(spec => {
            if (spec.grade === nextGrade) {
                const selected = spec.id === parseInt(currentPreference) ? 'selected' : '';
                html += `<option value="${spec.id}" ${selected}>
                    ${spec.specialization_name} (希望者: ${spec.current_applicants || 0}名)
                </option>`;
            }
        });
    } else if (specializations.children) {
        specializations.children.forEach(spec => {
            const selected = spec.id === parseInt(currentPreference) ? 'selected' : '';
            html += `<option value="${spec.id}" ${selected}>
                ${spec.specialization_name} (希望者: ${spec.current_applicants || 0}名)
            </option>`;
        });
    }

    html += `</select></div>`;
    specializationContainer.innerHTML = html;
}

function updateSpecializationsAndTree() {
    console.log('Updating specializations and tree');
    const studentSelect = document.getElementById('student_id');
    const studentId = studentSelect.value;
    
    console.log('Selected student ID:', studentId);
    console.log('Available specializations:', specializationsByStudent);
    
    if (!studentId) {
        console.log('No student selected');
        clearSpecializationTree();
        return;
    }

    const specializations = specializationsByStudent[studentId];
    console.log('Specializations for student:', specializations);
    
    if (!specializations || specializations.length === 0) {
        console.log('No specializations available');
        clearSpecializationTree();
        return;
    }

    console.log('Displaying specialization tree');
    displaySpecializationTree(specializations);
    updateSpecializations();
}

// スタイルの追加
const style = document.createElement('style');
style.textContent = `
    #specializationTreeContainer {
        margin-top: 20px;
    }
    .specialization-item {
        padding: 8px 16px;
        margin: 4px 0;
        border: 1px solid #ddd;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s;
    }
    .specialization-item:hover {
        background-color: #e3f2fd;
    }
    .specialization-item.selected {
        background-color: #FFC107;
        border-color: #FFA000;
    }
    .node-box.disabled {
        fill: #f5f5f5;
    }
    .link {
        stroke: #ccc;
        stroke-width: 1px;
    }
`;
document.head.appendChild(style); 