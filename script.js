const canvas = document.getElementById('mazeCanvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const statusBar = document.getElementById('status-bar');
const timerEl = document.getElementById('timer');
const completedEl = document.getElementById('completed-count');
const themeBtn = document.getElementById('theme-btn');
const resetBtn = document.getElementById('reset-btn');
const backBtn = document.getElementById('back-btn');
const puzzleList = document.getElementById('puzzle-list');
const storyText = document.getElementById('story-text');
const storyChapter = document.getElementById('story-chapter');
const homeScreen = document.getElementById('home-screen');
const gameScreen = document.getElementById('game-screen');

let gameActive = false;
let isDragging = false;
let playerPath = [];
let completedCount = 0;
let startTime = null;
let timerInterval = null;
let selectedPuzzle = null;
let mazeState = null;
let mouseX = -50, mouseY = -50;
let gameStarted = false;
let startButtonVisible = true;
let lastCrossMessage = null;
let isResetting = false;

const puzzles = [
    {
        id: 'forest',
        name: 'The Enchanted Forest',
        emoji: '🧝',
        type: 'forest',
        colors: ['#2ecc71', '#27ae60'],
        bg: ['#d4f5e2', '#e8fdf5'],
        wall: ['#2d5a27', '#1e3d1a'],
        wallBorder: '#145214',
        goal: '#ffd700',
        deco: 'leaves',
        wallShadow: 'rgba(45,90,39,0.3)',
        difficulty: 'Easy',
        story: 'Deep in the enchanted forest, a brave mouse must find the golden acorn before the ancient trees wake from their slumber.',
        chapter: 'Chapter 1 • The Enchanted Forest',
        image: '🌳',
        trailColor: '#ff6b6b',
        winMessage: 'The forest spirits bless your journey!'
    },
    {
        id: 'ocean',
        name: 'Atlantis Rising',
        emoji: '🧜',
        type: 'ocean',
        colors: ['#0097a7', '#006064'],
        bg: ['#d4f0fc', '#eaf8ff'],
        wall: ['#045d7a', '#023a4c'],
        wallBorder: '#01455e',
        goal: '#ffab00',
        deco: 'waves',
        wallShadow: 'rgba(4,93,122,0.3)',
        difficulty: 'Medium',
        story: 'The lost city of Atlantis stirs beneath the waves. Navigate coral corridors to claim the legendary pearl.',
        chapter: 'Chapter 2 • Atlantis Rising',
        image: '🐚',
        trailColor: '#00d4ff',
        winMessage: 'The pearl of Atlantis glows in your hands!'
    },
    {
        id: 'space',
        name: 'Galactic Frontier',
        emoji: '🚀',
        type: 'space',
        colors: ['#5b4cc4', '#302b70'],
        bg: ['#e8e6ff', '#f5f4ff'],
        wall: ['#1a1a4e', '#0d0d2b'],
        wallBorder: '#09092b',
        goal: '#ffd740',
        deco: 'stars',
        wallShadow: 'rgba(26,26,78,0.3)',
        difficulty: 'Medium',
        story: 'Captain Mouse pilots through an asteroid field to reach the crystal powering the starship home.',
        chapter: 'Chapter 3 • Galactic Frontier',
        image: '⭐',
        trailColor: '#a8fffa',
        winMessage: 'Starship powered! Captain Mouse returns home a hero!'
    },
    {
        id: 'sunset',
        name: 'The Dragon Temple',
        emoji: '🐉',
        type: 'temple',
        colors: ['#ff7043', '#d84315'],
        bg: ['#fff3e0', '#ffe0b2'],
        wall: ['#bf360c', '#7a1f00'],
        wallBorder: '#5c1700',
        goal: '#ffeb3b',
        deco: 'sunbeams',
        wallShadow: 'rgba(191,54,12,0.25)',
        difficulty: 'Hard',
        story: 'At sunset, the ancient dragon temple reveals its sacred corridors. Only the pure-hearted can reach the eternal flame.',
        chapter: 'Chapter 4 • The Dragon Temple',
        image: '🔥',
        trailColor: '#ffae42',
        winMessage: 'The eternal flame burns bright! The dragon blesses your courage!'
    },
    {
        id: 'frozen',
        name: 'The Ice Palace',
        emoji: '❄️',
        type: 'ice',
        colors: ['#74b9ff', '#a29bfe'],
        bg: ['#e8f4ff', '#f0f8ff'],
        wall: ['#0984e3', '#0652a8'],
        wallBorder: '#03418a',
        goal: '#ffeaa7',
        deco: 'stars',
        wallShadow: 'rgba(9,132,227,0.3)',
        difficulty: 'Medium',
        story: 'The Ice Queen challenges you to navigate her frozen halls. Win a snowflake of eternal winter.',
        chapter: 'Chapter 5 • The Ice Palace',
        image: '👸',
        trailColor: '#c8f7ff',
        winMessage: 'The Ice Queen smiles! The eternal snowflake is yours!'
    },
    {
        id: 'mystic',
        name: 'The Wizard Tower',
        emoji: '🧙',
        type: 'wizard',
        colors: ['#a55eea', '#8854d0'],
        bg: ['#f0e6ff', '#f8f4ff'],
        wall: ['#4a0e78', '#2d0850'],
        wallBorder: '#1a0430',
        goal: '#ffd700',
        deco: 'sparkles',
        wallShadow: 'rgba(74,14,120,0.25)',
        difficulty: 'Hard',
        story: 'The Master Wizard seeks an apprentice to solve his tower maze. Win a spell book!',
        chapter: 'Chapter 6 • The Wizard Tower',
        image: '📚',
        trailColor: '#e0aaff',
        winMessage: 'You are now a wizard! The spell book reveals its secrets!'
    },
    {
        id: 'garden',
        name: 'The Secret Garden',
        emoji: '🌸',
        type: 'garden',
        colors: ['#fd79a8', '#e84393'],
        bg: ['#ffe8f0', '#fff5f8'],
        wall: ['#6c5ce7', '#4937b4'],
        wallBorder: '#35258a',
        goal: '#ffeaa7',
        deco: 'leaves',
        wallShadow: 'rgba(108,92,231,0.25)',
        difficulty: 'Easy',
        story: 'Behind old stone walls lies a magical garden. Find the golden key among fairy flowers.',
        chapter: 'Chapter 7 • The Secret Garden',
        image: '🗝️',
        trailColor: '#ff9ff3',
        winMessage: 'Garden gates open! The fairies dance for your victory!'
    }
];

function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createGridMaze(rows, cols, cellSize, offsetX, offsetY) {
    const walls = [];
    const cells = [];
    const wallThickness = 4;
    
    for (let r = 0; r < rows; r++) {
        cells[r] = [];
        for (let c = 0; c < cols; c++) {
            cells[r][c] = {
                x: offsetX + c * cellSize,
                y: offsetY + r * cellSize,
                visited: false,
                walls: { top: true, right: true, bottom: true, left: true }
            };
        }
    }

    function getNeighbors(row, col) {
        const neighbors = [];
        if (row > 0 && !cells[row - 1][col].visited) neighbors.push({ r: row - 1, c: col, dir: 'top' });
        if (row < rows - 1 && !cells[row + 1][col].visited) neighbors.push({ r: row + 1, c: col, dir: 'bottom' });
        if (col > 0 && !cells[row][col - 1].visited) neighbors.push({ r: row, c: col - 1, dir: 'left' });
        if (col < cols - 1 && !cells[row][col + 1].visited) neighbors.push({ r: row, c: col + 1, dir: 'right' });
        return neighbors;
    }

    function removeWall(row, col, dir) {
        const cell = cells[row][col];
        if (dir === 'top') { cell.walls.top = false; if (row > 0) cells[row - 1][col].walls.bottom = false; }
        else if (dir === 'bottom') { cell.walls.bottom = false; if (row < rows - 1) cells[row + 1][col].walls.top = false; }
        else if (dir === 'left') { cell.walls.left = false; if (col > 0) cells[row][col - 1].walls.right = false; }
        else if (dir === 'right') { cell.walls.right = false; if (col < cols - 1) cells[row][col + 1].walls.left = false; }
    }

    const stack = [];
    let cr = rand(0, rows - 1), cc = rand(0, cols - 1);
    cells[cr][cc].visited = true;
    stack.push({ r: cr, c: cc });

    while (stack.length > 0) {
        const current = stack[stack.length - 1];
        const neighbors = getNeighbors(current.r, current.c);
        if (neighbors.length === 0) {
            stack.pop();
        } else {
            const next = neighbors[rand(0, neighbors.length - 1)];
            cells[next.r][next.c].visited = true;
            removeWall(current.r, current.c, next.dir);
            stack.push({ r: next.r, c: next.c });
        }
    }

    const borderPadding = 8;
    const border = [
        { x: offsetX - borderPadding, y: offsetY - borderPadding, w: cols * cellSize + borderPadding * 2, h: 8 },
        { x: offsetX - borderPadding, y: offsetY + rows * cellSize, w: cols * cellSize + borderPadding * 2, h: 8 },
        { x: offsetX - borderPadding, y: offsetY - borderPadding, w: 8, h: rows * cellSize + borderPadding * 2 },
        { x: offsetX + cols * cellSize, y: offsetY - borderPadding, w: 8, h: rows * cellSize + borderPadding * 2 }
    ];

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const cell = cells[r][c];
            if (cell.walls.top) walls.push({ x: cell.x, y: cell.y, w: cellSize, h: wallThickness });
            if (cell.walls.bottom) walls.push({ x: cell.x, y: cell.y + cellSize - wallThickness, w: cellSize, h: wallThickness });
            if (cell.walls.left) walls.push({ x: cell.x, y: cell.y, w: wallThickness, h: cellSize });
            if (cell.walls.right) walls.push({ x: cell.x + cellSize - wallThickness, y: cell.y, w: wallThickness, h: cellSize });
        }
    }

    return { walls: [...walls, ...border], offsetX, offsetY, rows, cols, cellSize };
}

function createForestMaze() {
    const maze = createGridMaze(8, 11, 48, 52, 52);
    return { walls: maze.walls, start: { x: 330, y: 56, r: 14 }, goal: { x: 548, y: 418, w: 40, h: 30 } };
}

function createOceanMaze() {
    const maze = createGridMaze(9, 13, 40, 50, 48);
    return { walls: maze.walls, start: { x: 315, y: 52, r: 14 }, goal: { x: 542, y: 408, w: 40, h: 30 } };
}

function createSpaceMaze() {
    const maze = createGridMaze(8, 10, 50, 58, 55);
    return { walls: maze.walls, start: { x: 328, y: 60, r: 14 }, goal: { x: 542, y: 438, w: 40, h: 30 } };
}

function createTempleMaze() {
    const walls = [];
    const cx = 330, cy = 270;
    
    for (let layer = 0; layer < 8; layer++) {
        const outerW = 520 - layer * 58;
        const outerH = 440 - layer * 50;
        const left = cx - outerW / 2;
        const top = cy - outerH / 2;
        
        if (layer === 0) {
            walls.push({ x: left, y: top, w: outerW, h: 4 });
            walls.push({ x: left, y: top + outerH - 4, w: outerW, h: 4 });
            walls.push({ x: left, y: top, w: 4, h: outerH });
            walls.push({ x: left + outerW - 4, y: top, w: 4, h: outerH });
        } else {
            const gapSides = [rand(0, 3), rand(0, 3)];
            
            if (!gapSides.includes(0)) {
                walls.push({ x: left, y: top, w: outerW, h: 4 });
            } else {
                const gapX = left + rand(30, outerW - 100);
                walls.push({ x: left, y: top, w: gapX - left, h: 4 });
                walls.push({ x: gapX + 80, y: top, w: outerW - (gapX - left + 80), h: 4 });
            }
            
            if (!gapSides.includes(1)) {
                walls.push({ x: left + outerW - 4, y: top, w: 4, h: outerH });
            } else {
                const gapY = top + rand(30, outerH - 100);
                walls.push({ x: left + outerW - 4, y: top, w: 4, h: gapY - top });
                walls.push({ x: left + outerW - 4, y: gapY + 80, w: 4, h: outerH - (gapY - top + 80) });
            }
            
            if (!gapSides.includes(2)) {
                walls.push({ x: left, y: top + outerH - 4, w: outerW, h: 4 });
            } else {
                const gapX = left + rand(30, outerW - 100);
                walls.push({ x: left, y: top + outerH - 4, w: gapX - left, h: 4 });
                walls.push({ x: gapX + 80, y: top + outerH - 4, w: outerW - (gapX - left + 80), h: 4 });
            }
            
            if (!gapSides.includes(3)) {
                walls.push({ x: left, y: top, w: 4, h: outerH });
            } else {
                const gapY = top + rand(30, outerH - 100);
                walls.push({ x: left, y: top, w: 4, h: gapY - top });
                walls.push({ x: left, y: gapY + 80, w: 4, h: outerH - (gapY - top + 80) });
            }
        }
    }
    
    const outerBorder = [
        { x: 30, y: 30, w: 600, h: 8 },
        { x: 30, y: 502, w: 600, h: 8 },
        { x: 30, y: 30, w: 8, h: 480 },
        { x: 622, y: 30, w: 8, h: 480 }
    ];
    
    return { 
        walls: [...walls, ...outerBorder], 
        start: { x: 330, y: 42, r: 14 }, 
        goal: { x: cx - 22, y: cy - 22, w: 44, h: 34 } 
    };
}

function createIceMaze() {
    const maze = createGridMaze(9, 12, 46, 48, 45);
    return { walls: maze.walls, start: { x: 320, y: 50, r: 14 }, goal: { x: 542, y: 428, w: 40, h: 30 } };
}

function createWizardMaze() {
    const maze = createGridMaze(8, 10, 52, 50, 48);
    return { walls: maze.walls, start: { x: 322, y: 52, r: 14 }, goal: { x: 548, y: 440, w: 40, h: 30 } };
}

function createGardenMaze() {
    const maze = createGridMaze(8, 10, 50, 52, 52);
    return { walls: maze.walls, start: { x: 318, y: 56, r: 14 }, goal: { x: 540, y: 430, w: 40, h: 30 } };
}

function createMaze(theme) {
    let data;
    switch (theme.type) {
        case 'forest': data = createForestMaze(); break;
        case 'ocean': data = createOceanMaze(); break;
        case 'space': data = createSpaceMaze(); break;
        case 'temple': data = createTempleMaze(); break;
        case 'ice': data = createIceMaze(); break;
        case 'wizard': data = createWizardMaze(); break;
        case 'garden': data = createGardenMaze(); break;
        default: data = createForestMaze();
    }
    return { ...data, theme };
}

function drawBackground(theme) {
    const [bg1, bg2] = theme.bg;
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, bg1);
    grad.addColorStop(1, bg2);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawWalls(walls) {
    if (!selectedPuzzle) return;
    
    ctx.shadowColor = selectedPuzzle.wallShadow || 'rgba(0,0,0,0.2)';
    ctx.shadowBlur = 3;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;

    for (const w of walls) {
        const grad = ctx.createLinearGradient(w.x, w.y, w.x + w.w, w.y + w.h);
        grad.addColorStop(0, selectedPuzzle.wall[0]);
        grad.addColorStop(0.5, selectedPuzzle.wall[1]);
        grad.addColorStop(1, selectedPuzzle.wall[0]);
        ctx.fillStyle = grad;
        ctx.fillRect(w.x, w.y, w.w, w.h);
        
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.fillRect(w.x, w.y, w.w * 0.3, w.h);
        
        ctx.strokeStyle = selectedPuzzle.wallBorder;
        ctx.lineWidth = 0.5;
        ctx.strokeRect(w.x, w.y, w.w, w.h);
    }

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
}

function drawPlayerTrail() {
    if (playerPath.length < 2 || !selectedPuzzle) return;

    ctx.save();
    ctx.beginPath();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.moveTo(playerPath[0].x, playerPath[0].y);
    
    for (let i = 1; i < playerPath.length; i++) {
        ctx.lineTo(playerPath[i].x, playerPath[i].y);
    }

    ctx.strokeStyle = selectedPuzzle.trailColor || '#ff6b6b';
    ctx.lineWidth = 5;
    ctx.shadowColor = 'rgba(255,255,255,0.8)';
    ctx.shadowBlur = 10;
    ctx.globalAlpha = 0.85;
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 0.5;
    ctx.stroke();
    ctx.restore();
}

function drawCursorDot() {
    if (mouseX < 0 || mouseY < 0 || !selectedPuzzle) return;

    const glow = ctx.createRadialGradient(mouseX, mouseY, 2, mouseX, mouseY, 12);
    glow.addColorStop(0, 'rgba(255,255,255,0.95)');
    glow.addColorStop(0.3, selectedPuzzle.trailColor || '#ff6b6b');
    glow.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(mouseX, mouseY, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(mouseX, mouseY, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#34495e';
    ctx.lineWidth = 1;
    ctx.stroke();
}

function drawStartButton() {
    if (!mazeState || !startButtonVisible) return;

    const btnX = mazeState.start.x - 50;
    const btnY = mazeState.start.y - 50;
    const btnW = 100;
    const btnH = 40;

    ctx.fillStyle = 'rgba(46, 204, 113, 0.95)';
    ctx.shadowColor = 'rgba(46,204,113,0.5)';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.roundRect(btnX, btnY, btnW, btnH, 12);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('▶ START', btnX + btnW / 2, btnY + btnH / 2);
    ctx.textAlign = 'start';
}

function drawPopupMessage() {
    if (!lastCrossMessage || !selectedPuzzle) return;
    
    const elapsed = Date.now() - lastCrossMessage.time;
    let alpha;
    
    if (elapsed < 250) {
        alpha = elapsed / 250;
    } else if (elapsed < 1000) {
        alpha = 1;
    } else if (elapsed < 1300) {
        alpha = 1 - (elapsed - 1000) / 300;
    } else {
        lastCrossMessage = null;
        return;
    }

    ctx.save();
    ctx.globalAlpha = alpha;
    
    const msg = lastCrossMessage.text;
    const msgWidth = Math.max(ctx.measureText(msg).width + 40, 320);
    const msgHeight = 50;
    const msgX = canvas.width / 2 - msgWidth / 2;
    const msgY = canvas.height / 2 - msgHeight / 2;

    ctx.fillStyle = 'rgba(231, 76, 60, 0.95)';
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 3;
    ctx.beginPath();
    ctx.roundRect(msgX, msgY, msgWidth, msgHeight, 14);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(msg, canvas.width / 2, canvas.height / 2);
    ctx.textAlign = 'start';
    
    ctx.restore();
}

function drawScene() {
    if (!mazeState || !selectedPuzzle) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground(selectedPuzzle);
    drawPlayerTrail();
    drawWalls(mazeState.walls);

    const sg = ctx.createRadialGradient(mazeState.start.x, mazeState.start.y, 3, mazeState.start.x, mazeState.start.y, 20);
    sg.addColorStop(0, 'rgba(255,255,255,1)');
    sg.addColorStop(0.4, 'rgba(255,255,255,0.4)');
    sg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.arc(mazeState.start.x, mazeState.start.y, 20, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#1a252f';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(mazeState.start.x, mazeState.start.y, mazeState.start.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    if (startButtonVisible && !gameStarted) {
        ctx.strokeStyle = 'rgba(46,204,113,0.6)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(mazeState.start.x, mazeState.start.y, mazeState.start.r + 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
    }
    
    ctx.fillStyle = '#1a252f';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🐭', mazeState.start.x, mazeState.start.y);

    const gg = ctx.createRadialGradient(mazeState.goal.x + mazeState.goal.w / 2, mazeState.goal.y + mazeState.goal.h / 2, 5,
        mazeState.goal.x + mazeState.goal.w / 2, mazeState.goal.y + mazeState.goal.h / 2, 26);
    gg.addColorStop(0, selectedPuzzle.goal);
    gg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gg;
    ctx.beginPath();
    ctx.arc(mazeState.goal.x + mazeState.goal.w / 2, mazeState.goal.y + mazeState.goal.h / 2, 26, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = '28px sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText(selectedPuzzle.image, mazeState.goal.x + mazeState.goal.w / 2, mazeState.goal.y + mazeState.goal.h / 2);

    drawStartButton();
    drawCursorDot();
    drawPopupMessage();
    ctx.textAlign = 'start';
}

function buildPuzzleCards() {
    puzzleList.innerHTML = '';
    puzzles.forEach((puzzle) => {
        const btn = document.createElement('button');
        btn.className = 'puzzle-card';
        btn.style.background = `linear-gradient(135deg, ${puzzle.colors[0]}dd, ${puzzle.colors[1]}dd)`;
        btn.innerHTML = `
            <div style="font-size:3rem; margin-bottom:8px;">${puzzle.emoji}</div>
            <div style="font-weight:700; font-size:1.05rem; margin-bottom:4px;">${puzzle.name}</div>
            <span class="difficulty-badge">${puzzle.difficulty}</span>
        `;
        btn.addEventListener('click', () => startGame(puzzle));
        puzzleList.appendChild(btn);
    });
}

function startGame(puzzle) {
    selectedPuzzle = puzzle;
    homeScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    storyChapter.textContent = puzzle.chapter;
    storyText.textContent = puzzle.story;
    statusBar.textContent = '👆 Click the START button to begin!';
    statusBar.style.color = '';
    completedCount = 0;
    completedEl.textContent = '0';
    resetGame(false);
}

function goBack() {
    gameActive = false;
    isDragging = false;
    gameStarted = false;
    startButtonVisible = true;
    isResetting = false;
    clearInterval(timerInterval);
    gameScreen.classList.add('hidden');
    homeScreen.classList.remove('hidden');
    selectedPuzzle = null;
    mazeState = null;
    playerPath = [];
    mouseX = -50;
    mouseY = -50;
    lastCrossMessage = null;
}

function resetGame(keepStats = true) {
    gameActive = false;
    isDragging = false;
    gameStarted = false;
    startButtonVisible = true;
    isResetting = false;
    playerPath = [];
    startTime = null;
    clearInterval(timerInterval);
    timerEl.textContent = '0.0';
    if (!keepStats) {
        completedCount = 0;
        completedEl.textContent = completedCount;
    }
    mazeState = createMaze(selectedPuzzle);
    statusBar.textContent = '👆 Click the START button to begin!';
    statusBar.style.color = '';
    mouseX = -50;
    mouseY = -50;
    lastCrossMessage = null;
    drawScene();
}

function handleCrossLine() {
    gameActive = false;
    isDragging = false;
    isResetting = true;
    clearInterval(timerInterval);
    
    lastCrossMessage = { text: '⚠️ You crossed the line! Resetting...', time: Date.now() };
    statusBar.textContent = '⚠️ You crossed the line! Puzzle will reset...';
    statusBar.style.color = '#e74c3c';
    
    setTimeout(() => {
        if (isResetting) {
            resetGame(true);
        }
    }, 1300);
}

backBtn.addEventListener('click', goBack);
themeBtn.addEventListener('click', () => {
    document.documentElement.setAttribute('data-theme',
        document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    if (mazeState && selectedPuzzle) drawScene();
});
resetBtn.addEventListener('click', () => resetGame(true));

function updateTimer() {
    if (startTime) timerEl.textContent = ((Date.now() - startTime) / 1000).toFixed(1);
}

function isOnWall(x, y) {
    if (!mazeState || !mazeState.walls) return false;
    for (const w of mazeState.walls) {
        if (x >= w.x - 1 && x <= w.x + w.w + 1 && y >= w.y - 1 && y <= w.y + w.h + 1) return true;
    }
    return false;
}

function isOnGoal(x, y) {
    if (!mazeState || !mazeState.goal) return false;
    const g = mazeState.goal;
    return x >= g.x - 5 && x <= g.x + g.w + 5 && y >= g.y - 5 && y <= g.y + g.h + 5;
}

function isOnStartButton(x, y) {
    if (!mazeState || !startButtonVisible) return false;
    const btnX = mazeState.start.x - 50;
    const btnY = mazeState.start.y - 50;
    const btnW = 100;
    const btnH = 40;
    return x >= btnX && x <= btnX + btnW && y >= btnY && y <= btnY + btnH;
}

function isNearStart(x, y) {
    if (!mazeState) return false;
    const dx = x - mazeState.start.x;
    const dy = y - mazeState.start.y;
    return Math.sqrt(dx * dx + dy * dy) <= mazeState.start.r + 18;
}

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = Math.floor(e.clientX - rect.left);
    mouseY = Math.floor(e.clientY - rect.top);
    
    if (!mazeState || !selectedPuzzle) return;

    if (gameActive && isDragging && !isResetting) {
        const lastPoint = playerPath[playerPath.length - 1] || { x: mouseX, y: mouseY };
        const dx = mouseX - lastPoint.x;
        const dy = mouseY - lastPoint.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 0) {
            const steps = Math.max(1, Math.ceil(dist / 1.5));
            for (let i = 1; i <= steps; i++) {
                const t = i / steps;
                const px = lastPoint.x + dx * t;
                const py = lastPoint.y + dy * t;
                
                if (isOnWall(px, py)) {
                    handleCrossLine();
                    return;
                }
                playerPath.push({ x: px, y: py });
            }
        }

        if (isOnGoal(mouseX, mouseY)) {
            gameActive = false;
            isDragging = false;
            gameStarted = false;
            startButtonVisible = true;
            isResetting = false;
            clearInterval(timerInterval);
            completedCount++;
            completedEl.textContent = completedCount;
            statusBar.textContent = `🏆 ${selectedPuzzle.winMessage} (${timerEl.textContent}s)`;
            statusBar.style.color = '#3498db';
        }
    }

    drawScene();
});

canvas.addEventListener('mousedown', (e) => {
    if (isResetting) return;
    
    const rect = canvas.getBoundingClientRect();
    const clickX = Math.floor(e.clientX - rect.left);
    const clickY = Math.floor(e.clientY - rect.top);
    
    if (!mazeState || !selectedPuzzle) return;

    if (isOnStartButton(clickX, clickY)) {
        startButtonVisible = false;
        gameStarted = true;
        gameActive = true;
        isDragging = false;
        isResetting = false;
        playerPath = [];
        startTime = Date.now();
        clearInterval(timerInterval);
        timerInterval = setInterval(updateTimer, 100);
        statusBar.textContent = `🏃 ${selectedPuzzle.name}: Click and drag from START to navigate!`;
        statusBar.style.color = '#2ecc71';
        drawScene();
    } else if (gameStarted && isNearStart(clickX, clickY)) {
        isDragging = true;
        playerPath.push({ x: clickX, y: clickY });
    }
});

canvas.addEventListener('mouseup', () => {
    isDragging = false;
});

canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

document.addEventListener('mouseup', () => {
    isDragging = false;
});

buildPuzzleCards();
requestAnimationFrame(animate);

function animate() {
    if (gameScreen.classList.contains('hidden')) {
        requestAnimationFrame(animate);
        return;
    }
    drawScene();
    requestAnimationFrame(animate);
}
