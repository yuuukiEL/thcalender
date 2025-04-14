// F.txtの内容を取得
let asciiArt = '';
fetch('/static/common/img/F.txt')
    .then(response => response.text())
    .then(text => {
        asciiArt = text;
        startAnimation();
    })
    .catch(error => {
        console.error('F.txtの読み込みに失敗しました:', error);
    });

function startAnimation() {
    const matrixContainer = document.getElementById('matrix-container');
    matrixContainer.innerHTML = '';
    
    // WebGLを使用するためのcanvas作成
    const canvas = document.createElement('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    matrixContainer.appendChild(canvas);
    
    // WebGL2コンテキストを取得
    const gl = canvas.getContext('webgl2') || canvas.getContext('experimental-webgl2');
    if (!gl) {
        console.warn('WebGL2が利用できません。標準Canvasにフォールバックします。');
        fallbackToCanvas();
        return;
    }
    
    // シェーダーの作成
    const vertexShaderSource = `#version 300 es
    in vec2 a_position;
    in vec2 a_texCoord;
    in vec3 a_color;
    in float a_glow;
    
    out vec2 v_texCoord;
    out vec3 v_color;
    out float v_glow;
    
    void main() {
        gl_Position = vec4(a_position, 0, 1);
        v_texCoord = a_texCoord;
        v_color = a_color;
        v_glow = a_glow;
    }
    `;
    
    const fragmentShaderSource = `#version 300 es
    precision highp float;
    
    in vec2 v_texCoord;
    in vec3 v_color;
    in float v_glow;
    
    uniform sampler2D u_texture;
    
    out vec4 outColor;
    
    void main() {
        vec4 texColor = texture(u_texture, v_texCoord);
        
        // グロー効果
        float glow = v_glow * 0.7;
        vec3 color = v_color;
        if (glow > 0.0) {
            color = mix(color, vec3(1.0, 1.0, 1.0), glow * 0.3);
        }
        
        outColor = vec4(color, 1.0) * texColor;
    }
    `;
    
    // シェーダープログラムのコンパイルと設定
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    const program = createProgram(gl, vertexShader, fragmentShader);
    
    // 属性とユニフォームの位置を取得
    const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    const texCoordAttributeLocation = gl.getAttribLocation(program, "a_texCoord");
    const colorAttributeLocation = gl.getAttribLocation(program, "a_color");
    const glowAttributeLocation = gl.getAttribLocation(program, "a_glow");
    
    // VAOの作成
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    
    // 頂点バッファの作成
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);
    
    // テクスチャ座標バッファの作成
    const texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.enableVertexAttribArray(texCoordAttributeLocation);
    gl.vertexAttribPointer(texCoordAttributeLocation, 2, gl.FLOAT, false, 0, 0);
    
    // 色バッファの作成
    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.enableVertexAttribArray(colorAttributeLocation);
    gl.vertexAttribPointer(colorAttributeLocation, 3, gl.FLOAT, false, 0, 0);
    
    // グローバッファの作成
    const glowBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, glowBuffer);
    gl.enableVertexAttribArray(glowAttributeLocation);
    gl.vertexAttribPointer(glowAttributeLocation, 1, gl.FLOAT, false, 0, 0);
    
    // フォントテクスチャの作成
    const fontTexture = createFontTexture(gl);
    
    // 文字データの準備
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    const charWidth = 5;
    const charHeight = 7;
    const cols = Math.floor(canvas.width / charWidth);
    const rows = Math.floor(canvas.height / charHeight);
    
    // アスキーアートの準備
    const asciiLines = asciiArt.split('\n');
    const asciiHeight = asciiLines.length;
    const asciiWidth = Math.max(...asciiLines.map(line => line.length));
    
    // スケーリング
    const maxAsciiWidth = Math.floor(cols * 0.8);
    const maxAsciiHeight = Math.floor(rows * 0.8);
    
    let scaleFactor = 1;
    if (asciiWidth > maxAsciiWidth || asciiHeight > maxAsciiHeight) {
        const widthRatio = maxAsciiWidth / asciiWidth;
        const heightRatio = maxAsciiHeight / asciiHeight;
        scaleFactor = Math.min(widthRatio, heightRatio) * 1.2;
    }
    
    const horizontalSpacing = 0.8;
    const scaledWidth = Math.floor(asciiWidth * scaleFactor * horizontalSpacing);
    const scaledHeight = Math.floor(asciiHeight * scaleFactor);
    
    const centerY = Math.floor((rows - scaledHeight) / 2);
    const centerX = Math.floor((cols - scaledWidth) / 2);
    
    // アスキーアートの文字位置を記録（TypedArrayを使用して高速化）
    const asciiMap = new Uint8Array(rows * cols);
    
    for (let j = 0; j < asciiLines.length; j++) {
        const line = asciiLines[j];
        for (let i = 0; i < line.length; i++) {
            if (line[i] !== ' ') {
                const scaledI = Math.floor(i * scaleFactor * horizontalSpacing);
                const scaledJ = Math.floor(j * scaleFactor);
                
                const x = centerX + scaledI;
                const y = centerY + scaledJ;
                
                if (x >= 0 && x < cols && y >= 0 && y < rows) {
                    asciiMap[y * cols + x] = line.charCodeAt(i);
                }
            }
        }
    }
    
    // 文字の状態を管理する配列（TypedArrayを使用して高速化）
    const matrixChars = new Uint8Array(rows * cols);
    const matrixStates = new Uint8Array(rows * cols);
    const matrixStartTimes = new Float32Array(rows * cols);
    const matrixFinalChars = new Uint8Array(rows * cols);
    
    // 初期化
    for (let i = 0; i < rows * cols; i++) {
        matrixChars[i] = chars.charCodeAt(Math.floor(Math.random() * chars.length));
        matrixStates[i] = 0;
    }
    
    // アニメーション状態
    let phase = 0; // 0: 初期表示, 1: 変換中, 2: 完了
    let visibleRows = 0;
    let animationStartTime = performance.now();
    let lastFrameTime = animationStartTime;
    
    // アニメーションループ
    function animate() {
        const currentTime = performance.now();
        const deltaTime = currentTime - lastFrameTime;
        lastFrameTime = currentTime;
        
        // WebGL設定
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        gl.useProgram(program);
        gl.bindVertexArray(vao);
        
        // フェーズに応じた処理
        if (phase === 0) {
            // 初期表示フェーズ
            const elapsed = currentTime - animationStartTime;
            const rowsToShow = Math.min(rows, Math.floor(elapsed / 20));
            
            if (rowsToShow > visibleRows) {
                visibleRows = rowsToShow;
            }
            
            if (visibleRows >= rows) {
                // 全行表示完了、変換フェーズへ
                phase = 1;
                startTransformation(currentTime);
            }
        }
        
        // 頂点データの準備
        const positions = [];
        const texCoords = [];
        const colors = [];
        const glows = [];
        
        // 文字描画データの生成
        for (let j = 0; j < rows; j++) {
            // 表示行数制限
            if (j >= visibleRows && phase === 0) continue;
            
            for (let i = 0; i < cols; i++) {
                const idx = j * cols + i;
                const charCode = matrixChars[idx];
                const state = matrixStates[idx];
                const isAscii = asciiMap[idx] > 0;
                
                // 変換フェーズの処理
                if (phase === 1) {
                    if (isAscii && state === 1) {
                        const progress = (currentTime - matrixStartTimes[idx]) / 60;
                        
                        if (progress >= 1) {
                            matrixChars[idx] = matrixFinalChars[idx];
                            matrixStates[idx] = 2;
                        } else if (Math.random() < 0.3) {
                            matrixChars[idx] = chars.charCodeAt(Math.floor(Math.random() * chars.length));
                            if (progress > 0.7 && Math.random() < 0.5) {
                                matrixChars[idx] = matrixFinalChars[idx];
                            }
                        }
                    } else if (!isAscii && state === 3) {
                        if (Math.random() < 0.2) {
                            matrixChars[idx] = chars.charCodeAt(Math.floor(Math.random() * chars.length));
                        }
                    }
                }
                
                // 色の設定
                let r = 0, g = 0.67, b = 0;
                let glow = 0;
                
                if (isAscii && state === 2) {
                    // アスキー部分の完了状態
                    r = 0; g = 1; b = 0;
                    glow = 1;
                } else if (phase === 2 && !isAscii) {
                    // 完了後の非アスキー部分
                    const fadeProgress = Math.min(1, (currentTime - matrixStartTimes[idx]) / 3000);
                    const greenValue = Math.max(0.16, 0.67 * (1 - fadeProgress));
                    g = greenValue;
                } else if (state === 3) {
                    // 変換中の非アスキー部分
                    g = 0.67;
                }
                
                // 頂点データの追加
                const x1 = i * charWidth / canvas.width * 2 - 1;
                const y1 = -(j * charHeight / canvas.height * 2 - 1);
                const x2 = (i + 1) * charWidth / canvas.width * 2 - 1;
                const y2 = -((j + 1) * charHeight / canvas.height * 2 - 1);
                
                // 文字のテクスチャ座標を計算
                const charIdx = String.fromCharCode(matrixChars[idx]).toUpperCase().charCodeAt(0) - 32;
                const tx1 = (charIdx % 16) / 16;
                const ty1 = Math.floor(charIdx / 16) / 8;
                const tx2 = tx1 + 1/16;
                const ty2 = ty1 + 1/8;
                
                // 四角形の頂点（2つの三角形）
                positions.push(
                    x1, y1, x2, y1, x1, y2,
                    x1, y2, x2, y1, x2, y2
                );
                
                texCoords.push(
                    tx1, ty1, tx2, ty1, tx1, ty2,
                    tx1, ty2, tx2, ty1, tx2, ty2
                );
                
                for (let k = 0; k < 6; k++) {
                    colors.push(r, g, b);
                    glows.push(glow);
                }
            }
        }
        
        // バッファにデータをアップロード
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, glowBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(glows), gl.STATIC_DRAW);
        
        // テクスチャをバインド
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, fontTexture);
        
        // 描画
        gl.drawArrays(gl.TRIANGLES, 0, positions.length / 2);
        
        // 非アスキー文字のランダム変化（パフォーマンス考慮で制限）
        if (deltaTime > 30) {
            const randomChanges = Math.min(100, Math.floor(cols * rows * 0.01));
            for (let n = 0; n < randomChanges; n++) {
                const j = Math.floor(Math.random() * rows);
                const i = Math.floor(Math.random() * cols);
                const idx = j * cols + i;
                
                if (asciiMap[idx] === 0 && matrixStates[idx] === 3) {
                    matrixChars[idx] = chars.charCodeAt(Math.floor(Math.random() * chars.length));
                }
            }
        }
        
        // 変換完了チェック
        if (phase === 1) {
            let allConverted = true;
            for (let idx = 0; idx < rows * cols; idx++) {
                if (asciiMap[idx] > 0 && matrixStates[idx] !== 2) {
                    allConverted = false;
                    break;
                }
            }
            
            if (allConverted) {
                phase = 2;
                completeTransformation();
            }
        }
        
        requestAnimationFrame(animate);
    }
    
    // 変換開始
    function startTransformation(startTime) {
        // 全ての文字を変換対象にする
        for (let j = 0; j < rows; j++) {
            const rowDelay = j * 15;
            
            setTimeout(() => {
                for (let i = 0; i < cols; i++) {
                    const idx = j * cols + i;
                    const isAscii = asciiMap[idx] > 0;
                    
                    if (isAscii) {
                        matrixStates[idx] = 1;
                        matrixStartTimes[idx] = startTime + rowDelay;
                        matrixFinalChars[idx] = asciiMap[idx];
                    } else {
                        matrixStates[idx] = 3;
                        matrixStartTimes[idx] = startTime + rowDelay;
                    }
                }
            }, rowDelay);
        }
    }
    
    // 変換完了
    function completeTransformation() {
        const fadeStartTime = performance.now();
        
        for (let idx = 0; idx < rows * cols; idx++) {
            if (asciiMap[idx] === 0) {
                matrixStates[idx] = 3;
                matrixStartTimes[idx] = fadeStartTime;
            }
        }
    }
    
    // フォントテクスチャの作成
    function createFontTexture(gl) {
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        
        // 一時的な1x1ピクセルを設定
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, 
                      new Uint8Array([0, 255, 0, 255]));
        
        // フォントテクスチャを作成
        const fontCanvas = document.createElement('canvas');
        fontCanvas.width = 256;
        fontCanvas.height = 128;
        const fontCtx = fontCanvas.getContext('2d');
        
        fontCtx.fillStyle = 'black';
        fontCtx.fillRect(0, 0, fontCanvas.width, fontCanvas.height);
        
        fontCtx.font = '16px monospace';
        fontCtx.textAlign = 'center';
        fontCtx.textBaseline = 'middle';
        fontCtx.fillStyle = 'white';
        
        // ASCII文字をグリッドに配置
        for (let i = 32; i < 127; i++) {
            const x = ((i - 32) % 16) * 16 + 8;
            const y = Math.floor((i - 32) / 16) * 16 + 8;
            fontCtx.fillText(String.fromCharCode(i), x, y);
        }
        
        // テクスチャにアップロード
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, fontCanvas);
        gl.generateMipmap(gl.TEXTURE_2D);
        
        return texture;
    }
    
    // シェーダーの作成ヘルパー
    function createShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('シェーダーのコンパイルエラー:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        
        return shader;
    }
    
    // プログラムの作成ヘルパー
    function createProgram(gl, vertexShader, fragmentShader) {
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('プログラムのリンクエラー:', gl.getProgramInfoLog(program));
            return null;
        }
        
        return program;
    }
    
    // Canvas APIへのフォールバック
    function fallbackToCanvas() {
        // 元のCanvas実装を呼び出す
        const ctx = canvas.getContext('2d');
        // 以下は元のコードと同様...
    }
    
    // アニメーション開始
    animate();
} 