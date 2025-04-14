document.addEventListener('DOMContentLoaded', function() {
    const classSelect = document.getElementById('class-select');
    const viewSelector = document.getElementById('viewSelector');
    const dateRangeSelector = document.getElementById('dateRangeSelector');
    const scheduleContainer = document.getElementById('scheduleContainer');
    const gridView = document.getElementById('gridView');
    const listView = document.getElementById('listView');
    const startDate = document.getElementById('start-date');
    const endDate = document.getElementById('end-date');
    const showScheduleBtn = document.getElementById('show-schedule');
    const scheduleBody = document.getElementById('schedule-body');

    // 初期日付設定
    const today = new Date();
    startDate.value = today.toISOString().split('T')[0];
    today.setDate(today.getDate() + 7);
    endDate.value = today.toISOString().split('T')[0];

    // クラス一覧を取得して選択肢を設定
    fetch('/api/classes')
        .then(response => response.json())
        .then(classes => {
            classes.sort((a, b) => a.class_name.localeCompare(b.class_name));
            classes.forEach(cls => {
                const option = document.createElement('option');
                option.value = cls.class_id;
                option.textContent = cls.class_name;
                classSelect.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Error:', error);
            alert('クラス一覧の取得に失敗しました');
        });

    // クラス選択時の処理
    classSelect.addEventListener('change', function() {
        if (this.value) {
            viewSelector.style.display = 'block';
            dateRangeSelector.style.display = 'none';
            scheduleContainer.style.display = 'none';
            clearScheduleTable();
            document.getElementById('schedule-list').innerHTML = '';
        } else {
            viewSelector.style.display = 'none';
            dateRangeSelector.style.display = 'none';
            scheduleContainer.style.display = 'none';
        }
    });

    // グリッド表示ボタンのクリック処理
    document.getElementById('gridViewBtn').addEventListener('click', function() {
        this.classList.add('active');
        document.getElementById('listViewBtn').classList.remove('active');
        dateRangeSelector.style.display = 'block';
        scheduleContainer.style.display = 'block';
        gridView.style.display = 'block';
        listView.style.display = 'none';
    });

    // リスト表示ボタンのクリック処理
    document.getElementById('listViewBtn').addEventListener('click', function() {
        this.classList.add('active');
        document.getElementById('gridViewBtn').classList.remove('active');
        dateRangeSelector.style.display = 'none';
        scheduleContainer.style.display = 'block';
        gridView.style.display = 'none';
        listView.style.display = 'block';
        fetchAllSchedules(classSelect.value);
    });

    // 時間割表示ボタンのクリックハンドラ
    showScheduleBtn.addEventListener('click', function() {
        if (!classSelect.value || !startDate.value || !endDate.value) {
            alert('クラスと期間を選択してください');
            return;
        }
        
        const params = new URLSearchParams({
            start_date: startDate.value,
            end_date: endDate.value
        });

        fetch(`/schedule-pdf/get-class-schedule/${classSelect.value}?${params}`)
            .then(response => response.json())
            .then(data => {
                if (data.error) throw new Error(data.error);
                updateScheduleDisplay(data.schedules);
            })
            .catch(error => {
                console.error('Error:', error);
                alert('時間割の取得に失敗しました');
            });
    });

    // テーブルをクリアする関数
    function clearScheduleTable() {
        const cells = scheduleBody.querySelectorAll('.schedule-cell .cell-content');
        cells.forEach(content => {
            content.querySelector('.subject-name').textContent = '';
            content.querySelector('.teacher-name').textContent = '';
            content.querySelector('.classroom-number').textContent = '';
        });
    }

    // オプション状態の管理を修正
    let seatingOptions = {
        alternateSeats: false,
        alternateRows: false,
        alternateColumns: false,
        frontRowEmpty: false
    };

    // 座席配置の方向
    let currentDirection = 'horizontal';

    // 自動配置機能を修正
    window.autoAssignSeats = function(mode) {
        clearAllSeats();  // まず全ての席をクリア
        const students = Array.from(document.querySelectorAll('.student-item:not([data-assigned="true"])'));
        const seats = Array.from(document.querySelectorAll('.seat:not(.occupied)'));

        if (!students.length || !seats.length) return;

        // 出席番号でソート
        const sortedStudents = [...students].sort((a, b) => 
            parseInt(a.dataset.attendanceNumber) - parseInt(b.dataset.attendanceNumber)
        );

        switch (mode) {
            case 'sequential':
                assignSequentially(sortedStudents, seats);
                break;
            case 'horizontal':
                assignHorizontally(sortedStudents, seats);
                break;
            case 'vertical':
                assignVertically(sortedStudents, seats);
                break;
        }
    };

    window.clearAllSeats = function() {
        document.querySelectorAll('.seat .student-info').forEach(info => {
            const studentId = info.dataset.studentId;
            const student = document.querySelector(`[data-student-id="${studentId}"]`);
            if (student) {
                student.style.opacity = '1';
                student.removeAttribute('data-assigned');
            }
            info.remove();
        });
        
        // オプションの状態もリセット
        Object.keys(seatingOptions).forEach(key => {
            seatingOptions[key] = false;
            const btn = document.getElementById(`${key}Btn`);
            if (btn) {
                btn.classList.remove('btn-secondary');
                btn.classList.add('btn-outline-secondary');
            }
        });
    };

    // 横方向配置（右から左、前から後ろ）を修正
    function assignHorizontally(students, seats) {
        const rows = 6;  // 座席の行数
        const cols = Math.ceil(seats.length / rows);  // 列数
        let studentIndex = 0;

        // 右上から配置開始
        for (let row = 0; row < rows && studentIndex < students.length; row++) {
            for (let col = cols - 1; col >= 0 && studentIndex < students.length; col--) {
                const seatIndex = row * cols + (cols - 1 - col);  // 右から左に配置
                if (seatIndex < seats.length) {
                    const studentInfo = createStudentInfo(students[studentIndex]);
                    seats[seatIndex].appendChild(studentInfo);
                    students[studentIndex].style.opacity = '0.5';
                    students[studentIndex].setAttribute('data-assigned', 'true');
                    studentIndex++;
                }
            }
        }
    }

    // 縦方向配置も同様に修正
    function assignVertically(students, seats) {
        const rows = 6;  // 座席の行数
        const cols = Math.ceil(seats.length / rows);  // 列数
        let studentIndex = 0;

        // 右上から配置開始
        for (let col = cols - 1; col >= 0 && studentIndex < students.length; col--) {
            for (let row = 0; row < rows && studentIndex < students.length; row++) {
                const seatIndex = row * cols + (cols - 1 - col);  // 右から左に配置
                if (seatIndex < seats.length) {
                    const studentInfo = createStudentInfo(students[studentIndex]);
                    seats[seatIndex].appendChild(studentInfo);
                    students[studentIndex].style.opacity = '0.5';
                    students[studentIndex].setAttribute('data-assigned', 'true');
                    studentIndex++;
                }
            }
        }
    }

    // 出席番号順の配置を修正
    function assignSequentially(students, seats) {
        // 座席を右から左、上から下の順にソート
        const sortedSeats = [...seats].sort((a, b) => {
            const aNum = parseInt(a.dataset.seatNumber);
            const bNum = parseInt(b.dataset.seatNumber);
            return aNum - bNum;
        });

        students.forEach((student, index) => {
            if (index < sortedSeats.length) {
                const studentInfo = createStudentInfo(student);
                sortedSeats[index].appendChild(studentInfo);
                student.style.opacity = '0.5';
                student.setAttribute('data-assigned', 'true');
            }
        });
    }

    // ヘルパー関数もグローバルに定義
    function applySeatingOption(option) {
        const seats = Array.from(document.querySelectorAll('.seat'));
        const rows = 6;
        const cols = Math.ceil(seats.length / rows);
        
        const currentAssignments = Array.from(document.querySelectorAll('.seat .student-info')).map(info => {
            return {
                element: info,
                seatIndex: seats.indexOf(info.closest('.seat'))
            };
        });

        clearAllSeats();

        currentAssignments.forEach((assignment, index) => {
            let newSeatIndex = assignment.seatIndex;

            if (seatingOptions.alternateSeats) {
                newSeatIndex = index * 2;
            }
            if (seatingOptions.alternateRows) {
                const currentRow = Math.floor(index / cols);
                newSeatIndex = (currentRow * 2) * cols + (index % cols);
            }
            if (seatingOptions.alternateColumns) {
                const currentRow = Math.floor(index / cols);
                const currentCol = index % cols;
                newSeatIndex = currentRow * cols + (currentCol * 2);
            }
            if (seatingOptions.frontRowEmpty) {
                newSeatIndex = cols + index;  // 前列をスキップ
            }

            if (newSeatIndex < seats.length) {
                seats[newSeatIndex].appendChild(assignment.element);
            }
        });
    }

    function reapplyCurrentLayout() {
        const currentStudents = Array.from(document.querySelectorAll('.seat .student-info')).map(info => {
            return {
                studentId: info.dataset.studentId,
                studentNumber: info.querySelector('.student-number').textContent,
                studentName: info.querySelector('.student-name').textContent
            };
        });

        clearAllSeats();
        
        if (currentStudents.length > 0) {
            const seats = Array.from(document.querySelectorAll('.seat:not(.occupied)'));
            currentStudents.forEach((student, index) => {
                if (index < seats.length) {
                    const originalStudent = document.querySelector(`[data-student-id="${student.studentId}"]`);
                    if (originalStudent) {
                        const studentInfo = createStudentInfo(originalStudent);
                        seats[index].appendChild(studentInfo);
                        originalStudent.style.opacity = '0.5';
                        originalStudent.setAttribute('data-assigned', 'true');
                    }
                }
            });
        }
    }

    // 生徒一覧を表示する部分を修正
    function displayStudents(students) {
        const studentList = document.getElementById('studentList');
        
        // 学籍番号を連番に変換
        const sortedStudents = students.sort((a, b) => a.attendance_number - b.attendance_number);
        const studentNumbers = {};
        sortedStudents.forEach((student, index) => {
            studentNumbers[student.student_base_number] = index + 1;
        });

        studentList.innerHTML = `
            <thead>
                <tr>
                    <th>出席</th>
                    <th>番号</th>
                    <th>氏名</th>
                    <th>状態</th>
                </tr>
            </thead>
            <tbody>
                ${sortedStudents.map(student => `
                    <tr class="student-item" draggable="true" 
                        data-student-id="${student.student_number}"
                        data-attendance-number="${student.attendance_number}"
                        data-student-base-number="${studentNumbers[student.student_base_number]}"
                        data-name="${student.name}">
                        <td>${student.attendance_number}</td>
                        <td>${studentNumbers[student.student_base_number]}</td>
                        <td>${student.name}</td>
                        <td>
                            <span class="badge bg-${student.status === 'active' ? 'success' : 'secondary'}">
                                ${student.status_text}
                            </span>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        `;

        setupDragAndDrop();
    }

    // ドラッグ&ドロップの設定
    function setupDragAndDrop() {
        const students = document.querySelectorAll('.student-item');
        const seats = document.querySelectorAll('.seat');

        students.forEach(student => {
            student.addEventListener('dragstart', e => {
                e.dataTransfer.setData('text/plain', student.dataset.studentId);
                student.classList.add('dragging');
            });

            student.addEventListener('dragend', () => {
                student.classList.remove('dragging');
            });
        });

        seats.forEach(seat => {
            seat.addEventListener('dragover', e => {
                e.preventDefault();
                seat.classList.add('drag-over');
            });

            seat.addEventListener('dragleave', () => {
                seat.classList.remove('drag-over');
            });

            seat.addEventListener('drop', e => {
                e.preventDefault();
                seat.classList.remove('drag-over');
                const studentId = e.dataTransfer.getData('text/plain');
                const student = document.querySelector(`[data-student-id="${studentId}"]`);
                
                if (student && !seat.querySelector('.student-info')) {
                    const studentInfo = createStudentInfo(student);
                    seat.appendChild(studentInfo);
                    student.style.opacity = '0.5';
                    student.setAttribute('data-assigned', 'true');
                }
            });
        });
    }

    // 生徒情報要素を作成する関数を修正
    function createStudentInfo(student) {
        const info = document.createElement('div');
        info.className = 'student-info';
        info.innerHTML = `
            <span class="student-number">${student.dataset.attendanceNumber}</span>
            <span class="student-base-number">${student.dataset.studentBaseNumber}</span>
            <span class="student-name">${student.dataset.name}</span>
        `;
        info.setAttribute('data-student-id', student.dataset.studentId);

        // 右クリックで削除できるように
        info.addEventListener('contextmenu', e => {
            e.preventDefault();
            const studentId = info.dataset.studentId;
            const originalStudent = document.querySelector(`[data-student-id="${studentId}"]`);
            if (originalStudent) {
                originalStudent.style.opacity = '1';
                originalStudent.removeAttribute('data-assigned');
            }
            info.remove();
        });

        return info;
    }

    // グローバル変数として追加
    let currentScheduleId = null;

    // スケジュール表示の更新関数を修正
    function updateScheduleDisplay(schedules) {
        const tbody = document.getElementById('schedule-body');
        tbody.innerHTML = '';

        // 時限分の行を作成
        const periods = ['1限', '2限', '3限', '4限', '5限', '6限', '夜間'];
        periods.forEach(period => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <th class="period-header">${period}</th>
                ${Array(6).fill('<td class="schedule-cell"><div class="cell-content"></div></td>').join('')}
            `;
            tbody.appendChild(row);
        });

        // スケジュールを配置
        schedules.forEach(schedule => {
            const dayIndex = getDayIndex(schedule.day);
            const periodIndex = getPeriodIndex(schedule.period);
            
            if (dayIndex === -1 || periodIndex === -1) return;

            const cell = tbody.rows[periodIndex].cells[dayIndex + 1];
            const content = cell.querySelector('.cell-content');
            const scheduleData = JSON.stringify(schedule).replace(/"/g, '&quot;');
            
            content.innerHTML = `
                <div class="schedule-content" data-schedule='${scheduleData}'>
                    <div class="subject-name">${schedule.subject_name}</div>
                    <div class="teacher-name">${schedule.teacher_name}</div>
                    <div class="classroom-number">${schedule.classroom_id}教室</div>
                    <div class="seating-buttons">
                        <button class="btn btn-sm btn-outline-primary new-seating-btn">新規作成</button>
                        <input type="file" class="pdf-input" accept="application/pdf" style="display: none;">
                        <button class="btn btn-sm btn-outline-secondary pdf-ref-btn">PDF参照</button>
                    </div>
                </div>
            `;

            // ボタンのイベントハンドラを設定
            const scheduleContent = content.querySelector('.schedule-content');
            const newSeatingBtn = content.querySelector('.new-seating-btn');
            const pdfRefBtn = content.querySelector('.pdf-ref-btn');
            const pdfInput = content.querySelector('.pdf-input');

            newSeatingBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                const scheduleObj = JSON.parse(this.closest('.schedule-content').dataset.schedule);
                showScheduleModal(scheduleObj);
            });

            pdfRefBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                pdfInput.click();
            });

            pdfInput.addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (file) {
                    const scheduleObj = JSON.parse(this.closest('.schedule-content').dataset.schedule);
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        const pdfData = e.target.result;
                        savePDFToServer({
                            schedule_id: scheduleObj.schedule_id,
                            pdf_data: pdfData,
                            pdf_name: file.name
                        });
                    };
                    reader.readAsDataURL(file);
                }
            });
        });
    }

    function getDayIndex(day) {
        const days = {
            '月曜': 0,
            '火曜': 1,
            '水曜': 2,
            '木曜': 3,
            '金曜': 4,
            '土曜': 5
        };
        return days[day] ?? -1;
    }

    function getPeriodIndex(period) {
        const periods = {
            '1限': 0,
            '2限': 1,
            '3限': 2,
            '4限': 3,
            '5限': 4,
            '6限': 5,
            '夜間': 6
        };
        return periods[period] ?? -1;
    }

    // 全期間の時間割を取得する関数
    function fetchAllSchedules(classId) {
        fetch(`/schedule-pdf/get-all-schedules/${classId}`)
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    throw new Error(data.error);
                }
                updateListView(data.schedules);
            })
            .catch(error => {
                console.error('Error:', error);
                alert('時間割の取得に失敗しました');
            });
    }

    // リスト表示の更新関数を修正
    function updateListView(schedules) {
        const listContainer = document.getElementById('schedule-list');
        listContainer.innerHTML = '';

        schedules.forEach(schedule => {
            const scheduleData = JSON.stringify(schedule).replace(/"/g, '&quot;');
            const item = document.createElement('div');
            item.className = 'schedule-item mb-3 p-3 border rounded';
            item.innerHTML = `
                <div class="schedule-content" data-schedule='${scheduleData}'>
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <div class="fw-bold text-primary">${schedule.day} ${schedule.period}</div>
                            <div class="subject-name">${schedule.subject_name}</div>
                            <small class="text-muted">
                                ${schedule.teacher_name} (${schedule.classroom_id}教室)
                            </small>
                        </div>
                    </div>
                    <div class="seating-buttons mt-2">
                        <button class="btn btn-sm btn-outline-primary new-seating-btn">新規作成</button>
                        <input type="file" class="pdf-input" accept="application/pdf" style="display: none;">
                        <button class="btn btn-sm btn-outline-secondary pdf-ref-btn">PDF参照</button>
                    </div>
                </div>
            `;

            // ボタンのイベントハンドラを設定
            const newSeatingBtn = item.querySelector('.new-seating-btn');
            const pdfRefBtn = item.querySelector('.pdf-ref-btn');
            const pdfInput = item.querySelector('.pdf-input');

            newSeatingBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                const scheduleObj = JSON.parse(this.closest('.schedule-content').dataset.schedule);
                showScheduleModal(scheduleObj);
            });

            pdfRefBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                pdfInput.click();
            });

            pdfInput.addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (file) {
                    const scheduleObj = JSON.parse(this.closest('.schedule-content').dataset.schedule);
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        const pdfData = e.target.result;
                        savePDFToServer({
                            schedule_id: scheduleObj.schedule_id,
                            pdf_data: pdfData,
                            pdf_name: file.name
                        });
                    };
                    reader.readAsDataURL(file);
                }
            });

            listContainer.appendChild(item);
        });
    }

    // PDF.js を読み込む
    pdfjsLib.GlobalWorkerOptions.workerSrc = '//cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.min.js';

    // モーダル表示関数を修正
    function showScheduleModal(schedule) {
        const modalEl = document.getElementById('scheduleDetailModal');
        const modal = new bootstrap.Modal(modalEl);

        // モーダルのレイアウトを修正
        modalEl.querySelector('.modal-dialog').classList.add('modal-xl');
        modalEl.querySelector('.modal-content').innerHTML = `
            <div class="container p-4">
                <div class="bg-white p-8 rounded-lg shadow-lg">
                    <h1 class="text-2xl font-bold mb-4 text-center">
                        ${schedule.class_name} 担任：${schedule.teacher_name}
                    </h1>
                    
                    <div class="seating-controls mb-4 text-center">
                        <div class="btn-group">
                            <button class="btn btn-outline-primary" onclick="autoAssignSeats('sequential')">
                                出席番号順
                            </button>
                            <button class="btn btn-outline-primary" onclick="autoAssignSeats('horizontal')">
                                横方向
                            </button>
                            <button class="btn btn-outline-primary" onclick="autoAssignSeats('vertical')">
                                縦方向
                            </button>
                        </div>
                        <button class="btn btn-danger ms-2" onclick="clearAllSeats()">クリア</button>
                        <button class="btn btn-success ms-2" onclick="exportToPDF()">PDF出力</button>
                    </div>

                    <div class="seating-layout">
                        <div class="classroom-info text-center mb-4">
                            <div class="podium mb-4">教卓</div>
                            <div class="seats-container">
                                ${generateSeatsHTML()}
                            </div>
                        </div>
                    </div>

                    <div class="mt-4 text-center text-muted">
                        <p>${schedule.classroom_id}教室</p>
                        <p>定員: ${schedule.capacity || 65}名</p>
                        <p>${new Date().toLocaleDateString('ja-JP')} 作成</p>
                    </div>
                </div>
            </div>
        `;

        // スタイルを適用
        const style = document.createElement('style');
        style.textContent = `
            .modal-xl {
                max-width: 1200px;
            }
            .container {
                max-width: 1000px;
                margin: 0 auto;
            }
            .seating-layout {
                background: white;
                padding: 2rem;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .seats-container {
                display: grid;
                grid-template-columns: repeat(6, 1fr);
                gap: 1rem;
                max-width: 800px;
                margin: 0 auto;
            }
            .seat {
                aspect-ratio: 1;
                border: 2px solid #dee2e6;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 0.5rem;
                font-size: 0.9rem;
                background: white;
                cursor: pointer;
                transition: all 0.2s;
            }
            .seat:hover {
                border-color: #0d6efd;
                box-shadow: 0 0 0 2px rgba(13,110,253,0.25);
            }
            .podium {
                width: 150px;
                height: 40px;
                background: #f8f9fa;
                border: 2px solid #dee2e6;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 2rem;
                font-weight: 500;
            }
            .text-2xl {
                font-size: 1.5rem;
            }
            .font-bold {
                font-weight: 700;
            }
            .mb-4 {
                margin-bottom: 1.5rem;
            }
            .p-8 {
                padding: 2rem;
            }
            .rounded-lg {
                border-radius: 0.5rem;
            }
            .shadow-lg {
                box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
            }
        `;
        document.head.appendChild(style);

        modal.show();
    }

    // 座席表選択モーダルを表示
    window.showSeatingSelection = function() {
        // 既存の座席表一覧を取得して表示するモーダル
        const selectionModal = new bootstrap.Modal(document.createElement('div'));
        selectionModal.element.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">座席表選択</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="list-group" id="seatingPlanList">
                            <div class="text-center">
                                <div class="spinner-border text-primary" role="status">
                                    <span class="visually-hidden">Loading...</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(selectionModal.element);

        // 座席表一覧を取得
        fetch('/api/seating-plans')
            .then(response => response.json())
            .then(plans => {
                const listContainer = selectionModal.element.querySelector('#seatingPlanList');
                listContainer.innerHTML = plans.map(plan => `
                    <button class="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                            onclick="loadSeatingPlan(${plan.id})">
                        ${plan.name}
                        <small class="text-muted">${plan.created_at}</small>
                    </button>
                `).join('') || '<div class="text-center p-3">保存された座席表はありません</div>';
            });

        selectionModal.show();
    };

    // 新規座席表作成モードを開始
    window.createNewSeating = function() {
        // 現在の座席配置をクリア
        clearAllSeats();
        
        // 作成モードを有効化
        document.querySelector('.seating-layout').classList.add('creation-mode');
        
        // 保存ボタンを追加
        const optionsContainer = document.querySelector('.seating-options');
        const saveBtn = document.createElement('button');
        saveBtn.className = 'btn btn-sm btn-success ms-2';
        saveBtn.textContent = '座席表を保存';
        saveBtn.onclick = saveSeatingPlan;
        optionsContainer.appendChild(saveBtn);
    };

    // 座席表を保存
    function saveSeatingPlan() {
        const name = prompt('座席表の名前を入力してください：');
        if (!name) return;

        const seatingData = {
            name: name,
            layout: getSeatingLayout(),
            schedule_id: currentScheduleId  // グローバル変数として追加が必要
        };

        fetch('/api/save-seating-plan', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(seatingData)
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                alert('座席表を保存しました');
                document.querySelector('.seating-layout').classList.remove('creation-mode');
                document.querySelector('.btn-success').remove();  // 保存ボタンを削除
            } else {
                alert('保存に失敗しました');
            }
        });
    }

    // 座席表を読み込む
    window.loadSeatingPlan = function(planId) {
        fetch(`/api/seating-plan/${planId}`)
            .then(response => response.json())
            .then(plan => {
                clearAllSeats();
                applySeatingPlan(plan.layout);
                bootstrap.Modal.getInstance(document.querySelector('.modal:last-child')).hide();
            });
    };

    // 座席配置を適用
    function applySeatingPlan(layout) {
        layout.forEach(assignment => {
            const seat = document.querySelector(`[data-seat-number="${assignment.seatNumber}"]`);
            const student = document.querySelector(`[data-student-id="${assignment.studentId}"]`);
            if (seat && student) {
                const studentInfo = createStudentInfo(student);
                seat.appendChild(studentInfo);
                student.style.opacity = '0.5';
                student.setAttribute('data-assigned', 'true');
            }
        });
    }

    // 現在の座席レイアウトを取得
    function getSeatingLayout() {
        const assignments = [];
        document.querySelectorAll('.seat').forEach(seat => {
            const studentInfo = seat.querySelector('.student-info');
            if (studentInfo) {
                assignments.push({
                    seatNumber: seat.dataset.seatNumber,
                    studentId: studentInfo.dataset.studentId
                });
            }
        });
        return assignments;
    }

    // 座席番号の割り当てを修正
    function generateSeatsHTML() {
        // 座席グループの配置を定義（合計65席）
        const rightGroups = [3, 4, 4, 3, 3];  // 右側：17席
        const centerGroups = Array(6).fill(4);  // 中央：24席（6グループ×4席）
        const leftGroups = Array(6).fill(2);    // 左側：12席（6グループ×2席）

        let seatHtml = '';
        let seatNumber = 1;
        const totalRows = 6;
        const totalCols = 11;  // 左2列 + 中央4列 + 右5列
        
        // 席番号を右から左に、各行で右から始まるように割り当て
        const seatNumbers = Array(totalRows).fill().map(() => Array(totalCols).fill(0));
        for (let row = 0; row < totalRows; row++) {
            for (let col = totalCols - 1; col >= 0; col--) {
                seatNumbers[row][col] = seatNumber++;
            }
        }

        // 左側の座席を生成（6グループ×2席）
        seatHtml += '<div class="seats-left">';
        leftGroups.forEach((seats, groupIndex) => {
            seatHtml += '<div class="seat-group">';
            for (let i = 0; i < seats; i++) {
                const seatNum = seatNumbers[groupIndex][i];
                seatHtml += `
                    <div class="seat" data-seat-number="${seatNum}">
                        <span class="seat-number">${seatNum}</span>
                    </div>
                `;
            }
            seatHtml += '</div>';
        });
        seatHtml += '</div>';

        // 中央の座席を生成（6グループ×4席）
        seatHtml += '<div class="seats-center">';
        centerGroups.forEach((seats, groupIndex) => {
            seatHtml += '<div class="seat-group">';
            for (let i = 0; i < seats; i++) {
                const seatNum = seatNumbers[groupIndex][2 + i];
                seatHtml += `
                    <div class="seat" data-seat-number="${seatNum}">
                        <span class="seat-number">${seatNum}</span>
                    </div>
                `;
            }
            seatHtml += '</div>';
        });
        seatHtml += '</div>';

        // 右側の座席を生成（6グループ×3-4席）
        seatHtml += '<div class="seats-right">';
        rightGroups.forEach((seats, groupIndex) => {
            seatHtml += '<div class="seat-group">';
            for (let i = 0; i < seats; i++) {
                const seatNum = seatNumbers[groupIndex][totalCols - seats + i];
                seatHtml += `
                    <div class="seat" data-seat-number="${seatNum}">
                        <span class="seat-number">${seatNum}</span>
                    </div>
                `;
            }
            seatHtml += '</div>';
        });
        seatHtml += '</div>';

        return seatHtml;
    }

    // 座席のスタイルを修正
    function addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .seats-container {
                display: flex;
                gap: 30px;
                justify-content: center;
                flex-direction: row;  /* 左から右の配置に戻す */
            }
            .seats-left, .seats-center, .seats-right {
                display: flex;
                flex-direction: column;
                gap: 15px;
            }
            .seat-group {
                display: flex;
                gap: 10px;
                justify-content: flex-start;  /* 左寄せに戻す */
            }
            .seat {
                width: 45px;
                height: 45px;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 2px solid #dee2e6;
                border-radius: 6px;
                background: white;
                font-size: 0.9rem;
                position: relative;
                cursor: pointer;
            }
            .seat-number {
                position: absolute;
                top: 2px;
                right: 2px;
                font-size: 0.7rem;
                color: #6c757d;
            }
            .student-list-container {
                border: 1px solid #dee2e6;
                border-radius: 6px;
                overflow: hidden;
                margin-right: 20px;
            }
            .student-list {
                height: calc(100vh - 300px);
                overflow-y: auto;
            }
        `;
        document.head.appendChild(style);
    }

    // PDF出力機能を追加
    window.exportToPDF = function() {
        const seatingLayout = document.querySelector('.seating-layout');
        const scheduleInfo = document.querySelector('#selectedScheduleInfo').textContent;
        
        // A4サイズの横向きPDFを作成
        html2canvas(seatingLayout).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('l', 'mm', 'a4');
            
            // PDFのメタデータを設定
            pdf.setProperties({
                title: '座席表',
                subject: scheduleInfo,
                creator: 'Classroom Seating System'
            });

            // ヘッダー情報を追加
            pdf.setFontSize(16);
            pdf.text(scheduleInfo, 20, 20);
            
            // 座席表の画像を追加
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const aspectRatio = canvas.width / canvas.height;
            
            let imgWidth = pdfWidth - 40;
            let imgHeight = imgWidth / aspectRatio;
            
            // 画像が大きすぎる場合は高さに合わせて調整
            if (imgHeight > pdfHeight - 60) {
                imgHeight = pdfHeight - 60;
                imgWidth = imgHeight * aspectRatio;
            }
            
            // 画像を中央に配置
            const x = (pdfWidth - imgWidth) / 2;
            const y = 30;
            
            pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
            
            // フッター情報を追加
            pdf.setFontSize(10);
            const today = new Date().toLocaleDateString('ja-JP');
            pdf.text(`作成日: ${today}`, 20, pdfHeight - 10);
            
            // PDFを保存
            pdf.save('classroom-seating-chart.pdf');
        });
    };

    // SVGが読み込まれた後の処理
    document.getElementById('seatMap').addEventListener('load', function() {
        const svgDoc = this.contentDocument;
        
        // SVG内の要素を操作できるようになります
        const seats = svgDoc.querySelectorAll('.seat'); // 座席を表すクラスに応じて変更してください
        
        seats.forEach(seat => {
            seat.addEventListener('click', function(e) {
                // 座席クリック時の処理
                const seatId = this.getAttribute('id');
                console.log(`座席 ${seatId} がクリックされました`);
                
                // ここに座席選択時の処理を追加
            });
        });
    });

    // 座席表作成方法の切り替え処理
    document.querySelectorAll('input[name="seating-method"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const pdfUploadSection = document.getElementById('pdf-upload-section');
            const seatingChartSection = document.getElementById('seating-chart-section');
            
            if (this.value === 'pdf') {
                pdfUploadSection.style.display = 'block';
                seatingChartSection.style.display = 'none';
            } else {
                pdfUploadSection.style.display = 'none';
                seatingChartSection.style.display = 'block';
            }
        });
    });

    // PDFファイルアップロード処理
    document.getElementById('pdf-file').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const pdfData = e.target.result;
                // PDFデータをサーバーに送信
                savePDFToServer({
                    schedule_id: currentScheduleId,
                    pdf_data: pdfData,
                    pdf_name: file.name
                });
            };
            reader.readAsDataURL(file);
        }
    });

    function savePDFToServer(data) {
        fetch('/schedule-pdf/api/seating/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                alert('PDFが保存されました');
            } else {
                alert('PDFの保存に失敗しました: ' + result.error);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('エラーが発生しました');
        });
    }
}); 