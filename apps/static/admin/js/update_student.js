// 学科データの定義
const departmentData = {
    "昼間部": {
        "四年制課程": {
            "ゲーム学科": {
                "ゲーム制作": {
                    "VR・3Dゲームプログラマー専攻": "AT",
                    "オンラインゲームプログラマー専攻": "AO",
                    "スマートフォンゲームプログラマー専攻": "AM"
                },
                "ゲーム企画": {
                    "ゲームプランナー専攻": "AP",
                    "ゲームシナリオライター専攻": "AS",
                    "ゲームディレクター専攻": "AR"
                },
                "ゲームデザイン": {
                    "ゲームデザイナー専攻": "AD",
                    "3Dキャラクターデザイナー専攻": "AC",
                    "スマートフォンゲームデザイナー専攻": "AF"
                }
            },
            "CGデザイン・アニメ学科": {
                "CG映像": {
                    "3DCGクリエイター専攻": "CT",
                    "VFXアーティスト専攻": "CV"
                },
                "グラフィックデザイン": {
                    "CGデザイナー専攻": "CG"
                },
                "イラスト": {
                    "イラストレーター専攻": "CI"
                },
                "アニメーション": {
                    "アニメーター専攻": "CA",
                    "デジタル作画専攻": "CD"
                }
            },
            "カーデザイン学科": {
                "カーデザイン": {
                    "カーデザイナー専攻": "VD",
                    "次世代モビリティ開発専攻": "VN"
                },
                "カーモデラー": {
                    "カーモデラー専攻": "VM"
                }
            },
            "高度情報学科": {
                "高度情報処理": {
                    "高度システムエンジニア専攻": "IH",
                    "IoTネットワーク専攻": "IN",
                    "サイバーセキュリティ専攻": "IS"
                },
                "WEB開発": {
                    "WEB開発エンジニア専攻": "IW",
                    "スマートフォンアプリ開発専攻": "IM",
                    "WEBデザイナー専攻": "ID"
                },
                "AIシステム開発": {
                    "AIエンジニア専攻": "IA",
                    "次世代ロボティクス専攻": "IR",
                    "データサイエンス専攻": "IV"
                }
            },
            "ミュージック学科": {
                "サウンドエンジニア": {
                    "サウンドエンジニア専攻": "SE"
                },
                "サウンドクリエイター": {
                    "サウンドクリエイター専攻": "SC",
                    "ゲームミュージック専攻": "SG"
                }
            }
        },
        "二年制課程": {
            "ゲーム学科": {
                "ゲームプログラム専攻": "GP",
                "キャラクターデザイン専攻": "GC"
            },
            "CG学科": {
                "CGアニメーション専攻": "DA",
                "CGデザイン専攻": "DG"
            },
            "WEB学科": {
                "WEBプログラム専攻": "PW",
                "WEBデザイン専攻": "PD"
            },
            "情報処理学科": {
                "情報処理プログラム専攻": "PI",
                "ネットワークセキュリティ専攻": "PS"
            },
            "ミュージック学科": {
                "コンピュータミュージック専攻": "MC",
                "PA・レコーディング専攻": "MR"
            }
        }
    },
    "夜間部": {
        "ゲーム学科": {
            "ゲーム専攻": "NG"
        },
        "CG映像学科": {
            "CG映像専攻": "NV"
        },
        "グラフィックデザイン学科": {
            "グラフィックデザイン専攻": "ND"
        },
        "WEBデザイン学科": {
            "WEBデザイン専攻": "NW"
        },
        "ネットワーク学科": {
            "ネットワーク専攻": "NN"
        },
        "情報処理学科": {
            "情報処理専攻": "NI"
        }
    }
};

let currentPath = [];
let currentData = departmentData;

// 学科コードを生成
function generateDepartmentCode(code) {
    const courseType = currentPath[0] === "夜間部" ? "2" : "1";
    return `${code}_${courseType}3`;
}

// 学科を選択
function selectDepartment(name, code) {
    const departmentCode = generateDepartmentCode(code);
    document.getElementById('department_letters').value = code;
    document.getElementById('department_number').value = "13";
    document.getElementById('class_letter').value = 'A';
    
    // 選択された学科の完全なパスを表示
    const fullPath = [...currentPath, name].join(' > ');
    document.querySelector('.department-display').textContent = fullPath;
    document.getElementById('department').value = departmentCode;
    closeDepartmentModal();
}

function openDepartmentModal() {
    document.getElementById('departmentModal').style.display = 'block';
    currentPath = [];
    currentData = departmentData;
    renderCurrentLevel();
}

function closeDepartmentModal() {
    document.getElementById('departmentModal').style.display = 'none';
}

function renderCurrentLevel() {
    const modalContent = document.querySelector('.modal-content');
    let html = '<div class="department-navigation">';
    
    if (currentPath.length > 0) {
        html += '<div class="breadcrumb">';
        html += '<span onclick="navigateToRoot()">トップ</span>';
        for (let i = 0; i < currentPath.length; i++) {
            html += ' > ';
            html += `<span onclick="navigateToLevel(${i})">${currentPath[i]}</span>`;
        }
        html += '</div>';
    }
    
    html += '<div class="nav-items">';
    for (const [key, value] of Object.entries(currentData)) {
        const hasChildren = typeof value === 'object';
        const classes = [
            'nav-item',
            hasChildren ? 'has-children' : 'final'
        ].filter(Boolean).join(' ');
        
        if (typeof value === 'string') {
            html += `<div class="${classes}" onclick="selectDepartment('${key}', '${value}')">${key}</div>`;
        } else {
            html += `<div class="${classes}" onclick="navigateToSubcategory('${key}')">${key}</div>`;
        }
    }
    html += '</div>';
    
    html += '</div>';
    modalContent.innerHTML = html;
}

function navigateToRoot() {
    currentPath = [];
    currentData = departmentData;
    renderCurrentLevel();
}

function navigateToLevel(level) {
    currentPath = currentPath.slice(0, level + 1);
    currentData = departmentData;
    for (const path of currentPath) {
        currentData = currentData[path];
    }
    renderCurrentLevel();
}

function navigateToSubcategory(category) {
    currentPath.push(category);
    currentData = currentData[category];
    renderCurrentLevel();
}

// 画像プレビュー機能
function previewImage(input) {
    const preview = document.getElementById('preview');
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(input.files[0]);
    } else {
        preview.src = '';
        preview.style.display = 'none';
    }
}

// モーダル外クリックで閉じる
window.onclick = function(event) {
    const modal = document.getElementById('departmentModal');
    if (event.target == modal) {
        closeDepartmentModal();
    }
} 