document.addEventListener('DOMContentLoaded', function () {
    let selectedDepartment = null;
    let currentStep = 1;

    // セクションの表示/非表示を切り替える関数
    function showSection(sectionId) {
        console.log('表示するセクション:', sectionId);
        
        const sections = ['courseTypeSection', 'departmentSection', 'specializationSection'];
        
        sections.forEach(section => {
            const element = document.getElementById(section);
            if (element) {
                if (section === sectionId) {
                    console.log(`表示: ${section}`);
                    element.style.display = 'block';
                } else {
                    console.log(`非表示: ${section}`);
                    element.style.display = 'none';
                }
            } else {
                console.error(`セクションが見つかりません: ${section}`);
            }
        });
    }

    // ステップの更新
    function updateSteps(step) {
        console.log('ステップを更新:', step);
        
        const steps = [
            { id: 'stepCourse', step: 1 },
            { id: 'stepDepartment', step: 2 },
            { id: 'stepSpecialization', step: 3 }
        ];
        
        steps.forEach((item, index) => {
            const stepElement = document.getElementById(item.id);
            if (stepElement) {
                if (index + 1 < step) {
                    stepElement.classList.remove('active');
                    stepElement.classList.add('completed');
                } else if (index + 1 === step) {
                    stepElement.classList.add('active');
                    stepElement.classList.remove('completed');
                } else {
                    stepElement.classList.remove('active', 'completed');
                }
            } else {
                console.error(`ステップ要素が見つかりません: ${item.id}`);
            }
        });
    }

    // 次のステップに進む
    function nextStep() {
        switch (currentStep) {
            case 1: // 課程区分から学科選択へ
                const selectedCourseType = document.querySelector('#courseTypeList .active');
                if (!selectedCourseType) {
                    alert('課程区分を選択してください');
                    return;
                }
                currentStep = 2;
                showSection('departmentSection');
                updateSteps(currentStep);
                const backButton = document.getElementById('backButton');
                if (backButton) {
                    backButton.disabled = false;
                    backButton.style.display = 'block';
                }
                document.getElementById('nextButton').style.display = 'block';
                document.getElementById('completeButton').style.display = 'none';
                break;

            case 2: // 学科選択から専攻選択へ
                if (!selectedDepartment) {
                    alert('学科を選択してください');
                    return;
                }
                currentStep = 3;
                loadSpecializations();
                showSection('specializationSection');
                updateSteps(currentStep);
                document.getElementById('backButton').style.display = 'block';
                document.getElementById('nextButton').style.display = 'none';
                document.getElementById('completeButton').style.display = 'block';
                break;
        }
    }

    // 前のステップに戻る
    function previousStep() {
        console.log('前のステップに戻ります。現在のステップ:', currentStep);
        
        switch (currentStep) {
            case 2: // 学科選択から課程区分へ
                console.log('学科選択 → 課程区分');
                currentStep = 1;
                showSection('courseTypeSection');
                updateSteps(currentStep);
                document.getElementById('backButton').style.display = 'none';
                document.getElementById('nextButton').style.display = 'block';
                document.getElementById('completeButton').style.display = 'none';
                break;

            case 3: // 専攻選択から学科選択へ
                console.log('専攻選択 → 学科選択');
                currentStep = 2;
                showSection('departmentSection');
                updateSteps(currentStep);
                document.getElementById('backButton').style.display = 'block';
                document.getElementById('nextButton').style.display = 'block';
                document.getElementById('completeButton').style.display = 'none';
                break;

            default:
                console.warn('無効なステップ番号:', currentStep);
                break;
        }
        
        updateNextButtonState();
        console.log('戻る処理完了。新しいステップ:', currentStep);
    }

    // 課程区分リストの生成と表示
    function initializeCourseTypes() {
        const courseTypeList = document.getElementById('courseTypeList');
        if (!courseTypeList) {
            console.error('courseTypeList element not found');
            return;
        }

        // 課程区分データを取得
        fetch('/api/course-types')
            .then(response => {
                if (!response.ok) {
                    throw new Error('課程区分データの取得に失敗しました');
                }
                return response.json();
            })
            .then(data => {
                courseTypeList.innerHTML = '';
                data.forEach(courseType => {
                    const item = document.createElement('button');
                    item.type = 'button';
                    item.className = 'list-group-item list-group-item-action';
                    item.setAttribute('role', 'option');
                    item.dataset.attendanceType = courseType.attendance_type;
                    item.dataset.courseType = courseType.course_type;
                    item.textContent = courseType.display_name;

                    item.addEventListener('click', function () {
                        // 選択状態の更新
                        courseTypeList.querySelectorAll('.list-group-item').forEach(btn => {
                            btn.classList.remove('active');
                        });
                        this.classList.add('active');

                        // 学科データの読み込み
                        loadDepartments(courseType.attendance_type, courseType.course_type);

                        // ボタンの状態を更新
                        updateNextButtonState();
                    });

                    courseTypeList.appendChild(item);
                });
            })
            .catch(error => {
                console.error('Error:', error);
                alert(error.message);
            });

        // 最初のセクションを表示
        showSection('courseTypeSection');
    }

    // 学科リストの生成
    function generateDepartmentList(departments) {
        const departmentList = document.getElementById('departmentList');
        if (!departmentList) {
            console.error('departmentList element not found');
            return;
        }

        departmentList.innerHTML = '';
        departments.forEach(department => {
            const item = document.createElement('button');
            item.type = 'button';
            item.className = 'list-group-item list-group-item-action department-btn';
            item.setAttribute('role', 'option');
            item.dataset.code = department.code;
            item.dataset.name = department.name;
            item.textContent = department.name;

            item.addEventListener('click', function () {
                // 選択状態の更新
                departmentList.querySelectorAll('.department-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                this.classList.add('active');

                // 選択された学科を保存
                selectedDepartment = {
                    code: department.code,
                    name: department.name
                };

                // ボタンの状態を更新
                updateNextButtonState();
            });

            departmentList.appendChild(item);
        });
    }

    // 専攻リストの生成
    function buildHierarchicalData(specializations) {
        // デバッグ用に入力データを確認
        console.log('Input specializations:', specializations);

        // IDをキーとする専攻のマップを作成
        const specMap = new Map();

        // 学年でソートして処理
        const sortedSpecs = [...specializations].sort((a, b) => a.grade - b.grade);

        // まず全ての専攻をマップに登録
        sortedSpecs.forEach(spec => {
            specMap.set(spec.id, {
                ...spec,
                children: [],
                processed: false
            });
        });

        // ルートノードとなる配列を準備
        const rootNodes = [];

        // 各専攻に対して、親子関係を設定（学年順に処理）
        sortedSpecs.forEach(spec => {
            const node = specMap.get(spec.id);

            if (!node.processed) {
                if (spec.previous_specialization_id) {
                    // 親ノードが存在する場合、その子として追加
                    const parentNode = specMap.get(spec.previous_specialization_id);
                    if (parentNode) {
                        // 重複チェック
                        if (!parentNode.children.some(child => child.id === node.id)) {
                            parentNode.children.push(node);
                            console.log(`Added ${spec.specialization_name} (Grade ${spec.grade}) as child of ${parentNode.specialization_name} (Grade ${parentNode.grade})`);
                        }
                    } else {
                        console.warn(`Parent node not found for specialization: ${spec.specialization_name} (ID: ${spec.id}, Previous ID: ${spec.previous_specialization_id})`);
                    }
                } else {
                    // 親がない場合はルートノードとして追加
                    if (!rootNodes.some(root => root.id === node.id)) {
                        rootNodes.push(node);
                        console.log(`Added ${spec.specialization_name} as root node`);
                    }
                }
                node.processed = true;
            }
        });

        // ノードを作成する関数
        function createNode(spec) {
            return {
                name: `${spec.grade}年 ${spec.specialization_name}`,
                id: spec.id,
                grade: spec.grade,
                specialization_code: spec.specialization_code,
                children: spec.children
                    .sort((a, b) => a.grade - b.grade)  // 子ノードを学年順にソート
                    .map(child => createNode(child))
            };
        }

        // デバッグ用に最終的なツリー構造を確認
        console.log('Root nodes:', rootNodes);

        // ルートノードを作成して返す
        return {
            name: selectedDepartment.name,
            children: rootNodes
                .sort((a, b) => a.grade - b.grade)  // ルートノードを学年順にソート
                .map(node => createNode(node))
        };
    }

    function generateSpecializationList(specializations) {
        const specializationList = document.getElementById('specializationList');
        specializationList.innerHTML = '';

        // 表示切り替えボタングループ
        const viewToggle = document.createElement('div');
        viewToggle.className = 'btn-group mb-3';
        viewToggle.setAttribute('role', 'group');

        const treeViewBtn = document.createElement('button');
        treeViewBtn.type = 'button';
        treeViewBtn.className = 'btn btn-primary active';
        treeViewBtn.textContent = 'ツリー表示';

        const listViewBtn = document.createElement('button');
        listViewBtn.type = 'button';
        listViewBtn.className = 'btn btn-outline-primary';
        listViewBtn.textContent = 'リスト表示';

        viewToggle.appendChild(treeViewBtn);
        viewToggle.appendChild(listViewBtn);
        specializationList.appendChild(viewToggle);

        // コンテナの作成
        const treeContainer = document.createElement('div');
        treeContainer.id = 'specializationTreeContainer';
        treeContainer.style.height = '600px';
        treeContainer.style.width = '100%';
        treeContainer.style.maxWidth = '100%';
        treeContainer.style.margin = '0 auto';
        treeContainer.style.overflowX = 'auto';
        treeContainer.style.overflowY = 'hidden';
        treeContainer.style.position = 'relative';
        specializationList.appendChild(treeContainer);

        const listContainer = document.createElement('div');
        listContainer.id = 'specializationListContainer';
        listContainer.style.display = 'none';
        listContainer.className = 'list-group';
        specializationList.appendChild(listContainer);

        // リスト表示用のデータを生成
        const sortedSpecializations = [...specializations].sort((a, b) => {
            if (a.grade !== b.grade) return a.grade - b.grade;
            return a.specialization_name.localeCompare(b.specialization_name);
        });

        sortedSpecializations.forEach(spec => {
            const item = document.createElement('button');
            item.type = 'button';
            item.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-center';
            item.innerHTML = `
                <span>${spec.grade}年 ${spec.specialization_name}</span>
                <span class="badge bg-primary rounded-pill">${spec.id}</span>
            `;
            item.addEventListener('click', function () {
                listContainer.querySelectorAll('.list-group-item').forEach(btn => {
                    btn.classList.remove('active');
                });
                this.classList.add('active');
                handleSpecializationSelection(spec.id, `${spec.grade}年 ${spec.specialization_name}`);
            });
            listContainer.appendChild(item);
        });

        // 表示切り替えの処理
        treeViewBtn.addEventListener('click', function () {
            treeViewBtn.className = 'btn btn-primary active';
            listViewBtn.className = 'btn btn-outline-primary';
            treeContainer.style.display = 'block';
            listContainer.style.display = 'none';
        });

        listViewBtn.addEventListener('click', function () {
            listViewBtn.className = 'btn btn-primary active';
            treeViewBtn.className = 'btn btn-outline-primary';
            listContainer.style.display = 'block';
            treeContainer.style.display = 'none';
        });

        // SVGのサイズを設定
        const width = Math.max(window.innerWidth * 2, 2400);
        const height = 600;

        // SVG要素を作成
        const svg = d3.select('#specializationTreeContainer')
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .style('display', 'block')
            .append('g')
            .attr('transform', `translate(${width / 2}, 40)`);  // ルートノードを中央に配置

        // スクロール位置を中央に設定
        setTimeout(() => {
            const container = document.getElementById('specializationTreeContainer');
            container.scrollLeft = (width - container.clientWidth) / 2;
        }, 100);

        // ツリーデータの構築
        const treeData = buildHierarchicalData(specializations);

        // データを階層構造に変換
        const root = d3.hierarchy(treeData);

        // ノードサイズを設定
        root.dx = 25;
        root.dy = width / (root.height + 1) * 0.15;

        // ツリーレイアウトを設定
        const treeLayout = d3.tree()
            .nodeSize([root.dx * 6, root.dy])
            .separation((a, b) => {
                // 同じ専攻名を持つノード間の距離を調整
                const baseDistance = 1.5;
                let multiplier;

                // 同じ専攻名を持つノード間の距離を広げる
                if (a.data.specialization_name === b.data.specialization_name) {
                    multiplier = 2.5;  // 同じ専攻名の場合、より大きな間隔
                } else if (a.data.grade === 3 || b.data.grade === 3) {
                    multiplier = 1.2;  // 3年生の場合
                } else if (a.data.grade === 4 || b.data.grade === 4) {
                    multiplier = 2.0;  // 4年生の場合
                } else {
                    multiplier = 1.5;  // その他の場合
                }

                // 同じ親を持つノードかどうかで調整
                return (a.parent == b.parent ? baseDistance : baseDistance * 1.2) * multiplier;
            });

        // レイアウトを適用
        const treeData2 = treeLayout(root);

        // ノードの位置を調整
        treeData2.descendants().forEach(d => {
            // 無効な値をチェック
            if (!d.data || typeof d.data.grade === 'undefined') {
                console.warn('Invalid node data:', d);
                return;
            }

            // 基本位置の設定
            let baseY = d.depth * root.dy;

            // 学年に応じた水平位置の調整
            if (d.data.grade === 4) {
                d.y = baseY * 1.1;  // 4年生は間隔を広げる
            } else if (d.data.grade === 3) {
                d.y = baseY * 0.9;  // 3年生の間隔を調整
            } else {
                d.y = baseY;  // 1,2年生は通常の間隔
            }

            // 同じ専攻名を持つノードの位置を調整
            if (d.parent && d.parent.children) {
                const siblings = d.parent.children;
                const sameNameSiblings = siblings.filter(sibling =>
                    sibling.data.specialization_name === d.data.specialization_name &&
                    sibling !== d
                );

                if (sameNameSiblings.length > 0) {
                    // 同じ専攻名を持つノードがある場合、位置を少しずらす
                    const offset = (d.data.grade - 2) * 20;  // オフセットを小さくする
                    d.x += offset;
                }
            }

            // 位置が有効な数値であることを確認
            if (isNaN(d.x) || isNaN(d.y)) {
                console.warn('Invalid position calculated:', d);
                d.x = 0;
                d.y = 0;
            }
        });

        // リンク（線）を描画
        svg.selectAll('.link')
            .data(treeData2.links())
            .enter()
            .append('path')
            .attr('class', 'link')
            .attr('d', d => {
                // エラーチェックを追加
                if (isNaN(d.source.x) || isNaN(d.source.y) || isNaN(d.target.x) || isNaN(d.target.y)) {
                    console.warn('Invalid coordinates detected:', d);
                    return '';
                }

                return d3.linkVertical()
                    .x(d => d.x)
                    .y(d => d.y)({
                        source: { x: d.source.x, y: d.source.y },
                        target: { x: d.target.x, y: d.target.y }
                    });
            })
            .style('fill', 'none')
            .style('stroke', '#ccc')
            .style('stroke-width', '1.5px');

        // ノードを描画
        const node = svg.selectAll('.node')
            .data(treeData2.descendants())
            .enter()
            .append('g')
            .attr('class', 'node')
            .attr('transform', d => {
                // エラーチェックを追加
                if (isNaN(d.x) || isNaN(d.y)) {
                    console.warn('Invalid node position:', d);
                    return 'translate(0,0)';
                }
                return `translate(${d.x},${d.y})`;
            })
            .style('cursor', d => d.depth > 0 ? 'pointer' : 'default')
            .on('click', function (event, d) {
                if (d.depth > 0) {
                    // 選択状態をリセット
                    d3.selectAll('.node-box').style('fill', d => d.depth > 0 ? 'white' : '#f5f5f5');
                    // クリックされたノードを選択状態に
                    d3.select(this).select('.node-box').style('fill', '#e3f2fd');
                    // クラス作成フォームを表示
                    handleSpecializationSelection(d.data.id, d.data.name);
                }
            });

        // ノードの背景を描画（大きく）
        node.append('rect')
            .attr('class', 'node-box')
            .attr('x', -120)  // より広く
            .attr('y', -20)
            .attr('width', 240)  // より広く
            .attr('height', 40)  // より高く
            .attr('rx', 6)
            .style('fill', d => d.depth > 0 ? 'white' : '#f5f5f5')
            .style('stroke', d => {
                if (d.depth === 0) return '#ff4444';
                return d.data.grade ? `hsl(${(d.data.grade - 1) * 60}, 70%, 50%)` : '#2196F3';
            })
            .style('stroke-width', '2px');  // 線を太く

        // ノードのテキストを描画（大きく）
        node.append('text')
            .attr('dy', '0.3em')
            .attr('text-anchor', 'middle')
            .style('font-size', '1.1em')  // フォントサイズを大きく
            .text(d => d.data.name);
    }

    // スタイルの追加
    const style = document.createElement('style');
    style.textContent = `
        #specializationTreeContainer {
            margin-top: 20px;
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

    // 学科データの読み込み
    function loadDepartments(attendanceType, courseType) {
        console.log(`学科データの取得: ${attendanceType}/${courseType}`);
        fetch(`/api/departments/${attendanceType}/${courseType}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('学科データの取得に失敗しました');
                }
                return response.json();
            })
            .then(departments => {
                const departmentList = document.getElementById('departmentList');
                departmentList.innerHTML = departments.map(dept => `
                    <button type="button" class="list-group-item list-group-item-action department-btn" 
                            data-code="${dept.code}" 
                            data-name="${dept.name}">
                        ${dept.name}
                    </button>
                `).join('');
                
                // 学科選択のイベントリスナーを設定
                document.querySelectorAll('.department-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        // 他のボタンから'active'クラスを削除
                        document.querySelectorAll('.department-btn').forEach(b => 
                            b.classList.remove('active'));
                        // クリックされたボタンに'active'クラスを追加
                        this.classList.add('active');
                        
                        // 選択された学科の情報を保存
                        selectedDepartment = {
                            code: this.dataset.code,
                            name: this.dataset.name
                        };
                        
                        console.log('選択された学科:', selectedDepartment);
                        updateNextButtonState();
                    });
                });
            })
            .catch(error => {
                console.error('Error:', error);
                alert('学科データの取得に失敗しました');
            });
    }

    // 専攻データの読み込み
    function loadSpecializations() {
        const selectedCourseType = document.querySelector('#courseTypeList .active');
        if (!selectedCourseType || !selectedDepartment) {
            console.error('課程区分または学科が選択されていません');
            return;
        }

        const params = new URLSearchParams({
            department_code: selectedDepartment.code,
            attendance_type: selectedCourseType.dataset.attendanceType,
            course_type: selectedCourseType.dataset.courseType
        });

        // デバッグ用にパラメータを出力
        console.log('API Parameters:', Object.fromEntries(params));

        fetch(`/api/specializations/master?${params}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('専攻データの取得に失敗しました');
                }
                return response.json();
            })
            .then(data => {
                generateSpecializationList(data);
            })
            .catch(error => {
                console.error('Error:', error);
                alert(error.message);
            });
    }

    // リストアイテムのクリックイベントを共通化
    function setupListClickListeners(selector, callback) {
        document.querySelectorAll(selector).forEach(item => {
            item.addEventListener('click', () => {
                // 選択状態の更新
                document.querySelectorAll(selector).forEach(btn => {
                    btn.classList.remove('active');
                });
                item.classList.add('active');

                // コールバック関数の実行
                callback(item);

                // ボタンの状態を更新
                updateNextButtonState();
            });
        });
    }

    // 初期化時にリスナーを設定
    function setupSelectionListeners() {
        // 課程区分選択
        setupListClickListeners('#courseTypeList .list-group-item', (item) => {
            console.log('課程区分が選択されました:', item.textContent);
        });

        // 学科選択
        setupListClickListeners('#departmentList .department-btn', (item) => {
            console.log('学科が選択されました:', item.textContent);
            selectedDepartment = {
                code: item.dataset.code,
                name: item.dataset.name
            };
        });

        // 専攻選択
        setupListClickListeners('#specializationList .list-group-item', (item) => {
            console.log('専攻が選択されました:', item.textContent);
        });

        // 担任選択
        document.getElementById('teacher').addEventListener('change', () => {
            console.log('担任が選択されました');
            updateNextButtonState();
        });
    }

    // 初期化処理をまとめる
    function initialize() {
        console.log('初期化を開始します');
        
        // ボタンの初期状態を設定
        const backButton = document.getElementById('backButton');
        const nextButton = document.getElementById('nextButton');
        const completeButton = document.getElementById('completeButton');
        
        if (backButton) {
            backButton.disabled = true;
            backButton.style.display = 'none';
            console.log('戻るボタンの初期状態を設定しました');
        }
        
        if (completeButton) {
            completeButton.style.display = 'none';
            console.log('確定ボタンの初期状態を設定しました');
        }

        // 各種初期化処理を実行
        initializeCourseTypes();
        loadTeachers();
        setupSelectionListeners();
        updateNextButtonState();
    }

    // イベントリスナーの設定
    const nextButton = document.getElementById('nextButton');
    const backButton = document.getElementById('backButton');
    const completeButton = document.getElementById('completeButton');

    if (nextButton) {
        nextButton.addEventListener('click', () => {
            console.log('次へボタンがクリックされました');
            nextStep();
        });
    }

    if (backButton) {
        console.log('戻るボタンが見つかりました');
        backButton.addEventListener('click', function(event) {
            console.log('戻るボタンがクリックされました');
            event.preventDefault();
            if (!this.disabled) {
                previousStep();
            }
        });
    }

    if (completeButton) {
        completeButton.addEventListener('click', () => {
            console.log('確定ボタンがクリックされました');
            const specializationId = document.getElementById('specialization_id').value;
            const classLetter = document.getElementById('class_letter').value;
            const teacherId = document.getElementById('teacher').value;

            const data = {
                specialization_id: specializationId,
                class_letter: classLetter,
                teacher_id: teacherId,
                class_number: ''
            };

            registerClass(data);
        });
    }

    // フォームのバリデーション
    const form = document.querySelector('form');
    if (form) {
        form.addEventListener('submit', function (e) {
            const classLetter = document.getElementById('class_letter').value;
            const departmentCode = document.getElementById('department_code').value;
            const specializationId = document.getElementById('specialization_id').value;

            if (!departmentCode || !specializationId) {
                e.preventDefault();
                alert('課程・学科・専攻を選択してください');
                return;
            }

            if (!/^[A-Za-z]$/.test(classLetter)) {
                e.preventDefault();
                alert('クラス記号は1文字のアルファベットを入力してください');
                return;
            }

            if (!specializationId || isNaN(specializationId)) {
                e.preventDefault();
                alert('有効な専攻IDを選択してください');
                return;
            }

            if (!teacherId || isNaN(teacherId)) {
                e.preventDefault();
                alert('有効な担任教員を選択してください');
                return;
            }
        });
    }

    // 初期化を実行
    initialize();

    // クラス編集機能
    window.editClass = function (classId) {
        fetch(`/api/class/${classId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('クラスデータの取得に失敗しました');
                }
                return response.json();
            })
            .then(data => {
                document.getElementById('department_code').value = data.department_code;
                document.getElementById('specialization_id').value = data.specialization_id;
                document.getElementById('class_letter').value = data.class_letter;

                // 選択中の学科情報を更新
                const selectedDepartmentInfo = document.getElementById('selectedDepartmentInfo');
                if (selectedDepartmentInfo) {
                    selectedDepartmentInfo.textContent = `選択中の学科: ${data.department_name}`;
                }

                if (data.teacher_id) {
                    document.getElementById('homeroom_teacher_id').value = data.teacher_id;
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert(error.message);
            });
    };

    // クラス削除機能
    window.deleteClass = function (classId) {
        if (confirm('このクラスを削除してもよろしいですか？')) {
            fetch(`/api/class/${classId}`, {
                method: 'DELETE'
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        location.reload();
                    } else {
                        alert('削除に失敗しました: ' + data.message);
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('削除に失敗しました');
                });
        }
    };

    // クラス情報入力フォームの生成
    function validateClassLetter(classLetter) {
        return /^[A-Za-z]$/.test(classLetter);
    }

    function handleSpecializationSelection(specializationId, specializationName) {
        console.log('Selected specialization:', {
            id: specializationId,
            name: specializationName
        });
        
        // 既存のフォームがあれば削除
        const existingForm = document.getElementById('classFormContainer');
        if (existingForm) {
            existingForm.remove();
        }

        const classFormContainer = document.createElement('div');
        classFormContainer.className = 'mt-4';
        classFormContainer.id = 'classFormContainer';
        classFormContainer.innerHTML = `
            <div class="card">
                <div class="card-body">
                    <h6 class="card-title">クラス情報の入力</h6>
                    <div class="mb-3">
                        <label class="form-label">選択された専攻: ${specializationName}</label>
                        <input type="hidden" id="specialization_id" value="${specializationId}">
                    </div>
                    <div class="mb-3">
                        <label for="class_letter" class="form-label">クラス記号</label>
                        <input type="text" class="form-control" id="class_letter" maxlength="1" required
                            oninput="this.value = this.value.toUpperCase()">
                        <div class="invalid-feedback">1文字のアルファベットを入力してください</div>
                    </div>
                    <div class="mb-3">
                        <label for="teacher" class="form-label">担任選択</label>
                        <select class="form-select" id="teacher" required>
                            <option value="">教員を選択してください</option>
                        </select>
                        <div class="invalid-feedback">担任を選択してください</div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('specializationList').appendChild(classFormContainer);

        // イベントリスナーの設定
        const classLetterInput = document.getElementById('class_letter');
        classLetterInput.addEventListener('input', function() {
            if (validateClassLetter(this.value)) {
                this.classList.remove('is-invalid');
            } else {
                this.classList.add('is-invalid');
            }
            updateCompleteButtonState();
        });

        const teacherSelect = document.getElementById('teacher');
        teacherSelect.addEventListener('change', function() {
            if (this.value) {
                this.classList.remove('is-invalid');
            } else {
                this.classList.add('is-invalid');
            }
            updateCompleteButtonState();
        });

        loadTeachers();
        updateCompleteButtonState();
    }

    // 確定ボタンの状態を更新する関数
    function updateCompleteButtonState() {
        const completeButton = document.getElementById('completeButton');
        const specializationId = document.getElementById('specialization_id')?.value;
        const classLetter = document.getElementById('class_letter')?.value;
        const teacherId = document.getElementById('teacher')?.value;

        const isValid = specializationId && 
                       classLetter && 
                       /^[A-Za-z]$/.test(classLetter) && 
                       teacherId;

        if (completeButton) {
            completeButton.disabled = !isValid;
            console.log('確定ボタンの状態更新:', {
                specializationId,
                classLetter,
                teacherId,
                isValid
            });
        }
    }

    // 教員選択の変更イベントリスナーを追加
    document.getElementById('teacher')?.addEventListener('change', updateCompleteButtonState);

    // 担任選択フォームの表示
    function showTeacherSelectionForm() {
        // HTML側で既にフォームが表示されているので、特に処理は不要
    }

    // 現在のステップを取得する関数
    function getCurrentStep() {
        return currentStep;
    }

    // 次へボタンの有効化/無効化を管理する関数
    function updateNextButtonState() {
        const currentStep = getCurrentStep();
        const nextButton = document.getElementById('nextButton');
        
        let isEnabled = false;
        switch (currentStep) {
            case 1:
                const selectedCourse = document.querySelector('#courseTypeList .active');
                isEnabled = !!selectedCourse;
                console.log('課程区分の選択状態:', selectedCourse ? '選択済み' : '未選択');
                break;
            case 2:
                const selectedDepartment = document.querySelector('#departmentList .active');
                isEnabled = !!selectedDepartment;
                console.log('学科の選択状態:', selectedDepartment ? '選択済み' : '未選択');
                break;
            case 3:
                const selectedSpecialization = document.querySelector('#specializationList .active');
                const selectedTeacher = document.getElementById('teacher').value;
                isEnabled = !!(selectedSpecialization && selectedTeacher);
                break;
        }

        nextButton.disabled = !isEnabled;
        console.log(`次へボタンの状態: ${nextButton.disabled ? '無効' : '有効'}`);
    }

    function logSelection(step, item) {
        console.log(`ステップ${step}で選択されました:`, {
            text: item.textContent,
            data: item.dataset
        });
    }

    function loadTeachers() {
        console.log('教員データの取得を開始');
        fetch('/api/teachers')
            .then(response => {
                if (!response.ok) {
                    throw new Error('教員データの取得に失敗しました');
                }
                return response.json();
            })
            .then(data => {
                console.log('取得した教員データ:', data);
                const teacherSelect = document.getElementById('teacher');
                teacherSelect.innerHTML = '<option value="">教員を選択してください</option>';
                data.forEach(teacher => {
                    const option = document.createElement('option');
                    option.value = teacher.teacher_id;
                    option.textContent = teacher.name;
                    teacherSelect.appendChild(option);
                });
            })
            .catch(error => {
                console.error('Error:', error);
                alert('教員データの取得に失敗しました');
            });
    }

    // クラス記号の入力イベントリスナー
    document.addEventListener('input', function(e) {
        if (e.target.id === 'class_letter') {
            updateCompleteButtonState();
        }
    });

    // 教員選択の変更イベントリスナー
    document.addEventListener('change', function(e) {
        if (e.target.id === 'teacher') {
            updateCompleteButtonState();
        }
    });

    // クラス登録処理
    function registerClass(classData) {
        fetch('/api/register_class', {  // URLを修正
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(classData)
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    throw new Error(err.message || 'クラスの登録に失敗しました');
                });
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                alert('クラスが正常に登録されました');
                window.location.reload();
            } else {
                alert(data.message || 'クラスの登録に失敗しました');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert(error.message);
        });
    }
}); 