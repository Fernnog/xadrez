// src/modules/ui.js

import { PIECES, PIECE_VALUES, PROMOTION_PIECES, OPENING_FENS } from './config.js'; 

// Centraliza a seleção de todos os elementos do DOM
const elements = {
    board: document.getElementById('board'),
    status: document.getElementById('status'),
    evaluationValue: document.getElementById('evaluationValue'),
    moveHistory: document.getElementById('moveHistory'),
    capturedForWhite: document.getElementById('capturedForWhite'),
    capturedForBlack: document.getElementById('capturedForBlack'),
    gameContainer: document.getElementById('gameContainer'),
    colorSelectionModal: document.getElementById('colorSelectionModal'),
    gameOverModal: document.getElementById('gameOverModal'),
    promotionModal: document.getElementById('promotionModal'),
    promotionOptions: document.getElementById('promotionOptions'),
    modalTitle: document.getElementById('modalTitle'),
    modalMessage: document.getElementById('modalMessage'),
    copyPgnButton: document.getElementById('copyPgnButton'),
    mainBoardContainer: document.querySelector('.flex.flex-col.w-full.lg\\:w-auto.items-center'),
    rankLabels: document.querySelector('.rank-labels'),
    fileLabels: document.querySelector('.file-labels'),
    openingSelect: document.getElementById('openingSelect'),
    openingFilter: document.getElementById('openingFilter'),
    undoButton: document.getElementById('undoButton'),
};

// Sons da interface (Mantido por compatibilidade com o main.js que usa playSound)
const audioMove = new Audio(''); 
const audioStart = new Audio(''); 
const audioGameOver = new Audio(''); 
let isAudioInitialized = false;

function initAudio() {
    // Implementação real da inicialização deve vir de audio.js
}

// --- ESTADO E HELPERS INTERNOS ---

let uiHandlers = {}; 

function safeAddEventListener(id, event, handler) {
    const el = document.getElementById(id);
    if (el) {
        el.addEventListener(event, handler);
    } else {
        console.warn(`[UI Warning] Elemento com ID '${id}' não encontrado.`);
    }
}

/**
 * Preenche dinamicamente o seletor de aberturas, com filtro opcional.
 * @param {string} [filterText=''] - Texto para filtrar as aberturas.
 */
function populateOpeningSelector(filterText = '') {
    if (!elements.openingSelect) return;
    
    const filter = filterText.toLowerCase().trim();
    elements.openingSelect.innerHTML = '';

    // 1. Agrupa as aberturas pela propriedade 'category'
    const groupedOpenings = {};
    for (const key in OPENING_FENS) {
        const opening = OPENING_FENS[key];
        const category = opening.category || 'Outras';
        if (!groupedOpenings[category]) {
            groupedOpenings[category] = [];
        }
        groupedOpenings[category].push({ key, ...opening });
    }

    // 2. Define a ordem de exibição das categorias
    const categoryOrder = [
        'Padrão', 
        'Aberturas de Peão Rei (1. e4)', 
        'Aberturas de Peão Dama (1. d4)',
        'Outras Aberturas',
        'Outras'
    ];

    let hasVisibleOptions = false;

    // 3. Cria e anexa os <optgroup> e <option> filtrados
    categoryOrder.forEach(categoryName => {
        if (!groupedOpenings[categoryName]) return;

        const openingsInCategory = groupedOpenings[categoryName];
        
        // Filtra as aberturas com base no texto de busca
        const matchingOpenings = openingsInCategory.filter(data =>
            filter === '' ||
            data.name.toLowerCase().includes(filter) ||
            data.pgn.toLowerCase().includes(filter)
        );

        if (matchingOpenings.length === 0) return; // Pula a categoria se não houver correspondências

        hasVisibleOptions = true;

        // A categoria "Padrão" é uma opção normal, não um grupo
        if (categoryName === 'Padrão') {
            const openingData = matchingOpenings[0];
            const option = document.createElement('option');
            option.value = openingData.key;
            option.textContent = openingData.name;
            elements.openingSelect.appendChild(option);
            return;
        }
        
        const optgroup = document.createElement('optgroup');
        optgroup.label = categoryName;

        matchingOpenings.forEach(data => {
            const option = document.createElement('option');
            option.value = data.key;
            
            const fenParts = data.fen.split(' ');
            const turn = fenParts.length > 1 && fenParts[1] === 'w' ? '(Brancas Movem)' : '(Pretas Movem)';
            option.textContent = `${data.name} (${data.pgn}) ${turn}`;
            
            optgroup.appendChild(option);
        });
        
        elements.openingSelect.appendChild(optgroup);
    });

    if (!hasVisibleOptions) {
        const option = document.createElement('option');
        option.disabled = true;
        option.textContent = 'Nenhuma abertura encontrada';
        elements.openingSelect.appendChild(option);
    }
}


// --- FUNÇÕES EXPORTADAS ---

export function registerUIHandlers(handlers) {
    uiHandlers = handlers;

    const onStartWrapper = (callback) => {
        document.body.style.cursor = 'wait'; 
        setTimeout(() => callback(), 10); 
    };

    safeAddEventListener('playWhiteButton', 'click', () => onStartWrapper(handlers.onPlayWhite));
    safeAddEventListener('playBlackButton', 'click', () => onStartWrapper(handlers.onPlayBlack));
    safeAddEventListener('resetButton', 'click', handlers.onResetGame);
    safeAddEventListener('modalResetButton', 'click', handlers.onResetGame);
    safeAddEventListener('continueGameButton', 'click', handlers.onContinueGame);
    safeAddEventListener('importPgnButton', 'click', handlers.onImportPgn);
    
    // Adiciona o listener para o filtro de aberturas
    safeAddEventListener('openingFilter', 'input', (e) => populateOpeningSelector(e.target.value));

    safeAddEventListener('undoButton', 'click', handlers.onUndo); 

    if (elements.copyPgnButton) {
        elements.copyPgnButton.addEventListener('click', handlers.onCopyPgn);
    }
    
    populateOpeningSelector(); // Chamada inicial para preencher a lista
}

export function getSkillLevel() {
    const el = document.getElementById('difficultyLevel');
    return el ? parseInt(el.value, 10) : 12;
}

export function getOpeningKey() {
    const el = document.getElementById('openingSelect');
    return el ? el.value : 'standard';
}

export function getPgnInput() {
    const el = document.getElementById('pgnInput');
    return el ? el.value : '';
}

export function setBoardCursor(cursor) {
    if (elements.board) {
        elements.board.style.cursor = cursor;
    }
}

export function showContinueGameOption(isVisible) {
    const container = document.getElementById('continueGameContainer');
    if (container) {
        if (isVisible) {
            container.classList.remove('hidden');
        } else {
            container.classList.add('hidden');
        }
    }
}

export function setupAndDisplayGame(playerColor) {
    document.body.style.cursor = 'default'; 
    
    hideColorSelectionModal();
    hideGameOverModal();
    showGameContainer();
    setupBoardOrientation(playerColor);
    createBoard(uiHandlers.onSquareClick);
}

export function renderBoard(boardState) {
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const squareName = 'abcdefgh'[c] + (8 - r);
            const squareElement = elements.board.querySelector(`[data-square="${squareName}"]`);
            const piece = boardState[r][c];
            
            if (squareElement) {
                squareElement.innerHTML = '';
                if (piece) {
                    const pieceElement = document.createElement('span');
                    pieceElement.className = `piece ${piece.color === 'w' ? 'white-piece' : 'black-piece'}`;
                    if (elements.board.classList.contains('board-flipped')) {
                        pieceElement.style.transform = 'rotate(180deg)';
                    }
                    pieceElement.textContent = PIECES[piece.color][piece.type];
                    squareElement.appendChild(pieceElement);
                }
            }
        }
    }
}

export function createBoard(onSquareClickCallback) {
    if (!elements.board) return;
    elements.board.innerHTML = '';
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const square = document.createElement('div');
            const squareName = 'abcdefgh'[c] + (8 - r);
            const colorClass = (r + c) % 2 === 0 ? 'light' : 'dark';
            square.className = `square ${colorClass}`;
            square.dataset.square = squareName;
            if (onSquareClickCallback) {
                square.addEventListener('click', () => onSquareClickCallback(squareName));
            }
            elements.board.appendChild(square);
        }
    }
}

export function setupBoardOrientation(playerColor) {
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    elements.rankLabels.innerHTML = '';
    elements.fileLabels.innerHTML = '';

    if (playerColor === 'b') {
        elements.board.classList.add('board-flipped');
        ranks.reverse().forEach(r => elements.rankLabels.innerHTML += `<span>${r}</span>`);
        files.reverse().forEach(f => elements.fileLabels.innerHTML += `<span>${f}</span>`);
    } else {
        elements.board.classList.remove('board-flipped');
        ranks.forEach(r => elements.rankLabels.innerHTML += `<span>${r}</span>`);
        files.forEach(f => elements.fileLabels.innerHTML += `<span>${f}</span>`);
    }
}

export function updateStatus(gameState, showGameOverCallback) {
    let statusText = '';
    const turn = gameState.turn === 'w' ? 'Brancas' : 'Pretas';
    const safeGameOverCall = showGameOverCallback || showGameOverModal;

    if (gameState.isGameOver) {
        // playSound('gameOver');
        if (gameState.isCheckmate) {
            const winner = gameState.turn === 'w' ? 'Pretas' : 'Brancas';
            statusText = `Xeque-mate! ${winner} vencem.`;
            safeGameOverCall(`Xeque-mate!`, `${winner} vencem.`);
        } else if (gameState.isStalemate) {
            statusText = 'Empate por Afogamento.';
            safeGameOverCall('Empate!', 'O jogo terminou em afogamento.');
        } else if (gameState.isDraw) {
            statusText = 'Empate.';
            safeGameOverCall('Empate!', 'Material insuficiente, repetição ou regra dos 50 lances.');
        }
    } else if (gameState.inCheck) {
        statusText = `XEQUE! É a vez das ${turn}.`;
    } else {
        statusText = `É a vez das ${turn}.`;
    }
    elements.status.textContent = statusText;
}

export function highlightMoves(fromSquare, moves) {
    clearHighlights();
    const fromElement = elements.board.querySelector(`[data-square="${fromSquare}"]`);
    if (fromElement) {
        fromElement.classList.add('selected-square');
    }
    moves.forEach(move => {
        const toElement = elements.board.querySelector(`[data-square="${move.to}"]`);
        if (toElement) {
            const marker = document.createElement('div');
            marker.className = 'valid-move-marker';
            toElement.appendChild(marker);
        }
    });
}

export function clearHighlights() {
    document.querySelectorAll('.selected-square').forEach(el => el.classList.remove('selected-square'));
    document.querySelectorAll('.valid-move-marker').forEach(el => el.remove());
}

export function updateMoveHistory(history) {
    elements.moveHistory.innerHTML = '';
    const movePairs = [];
    
    const getSan = (move) => {
        if (!move) return '';
        if (typeof move === 'string') return move;
        return move.san || '';
    };

    for (let i = 0; i < history.length; i += 2) {
        movePairs.push({ 
            white: getSan(history[i]), 
            black: getSan(history[i + 1]) 
        });
    }

    movePairs.reverse().forEach((pair, index) => {
        const moveNumber = movePairs.length - index;
        const moveItem = document.createElement('div');
        moveItem.className = 'move-list-item';
        moveItem.innerHTML = `
            <span class="move-number">${moveNumber}.</span>
            <span>${pair.white}</span>
            <span>${pair.black}</span>
        `;
        elements.moveHistory.appendChild(moveItem);
    });
    elements.moveHistory.scrollTop = 0;
}

export function updateCapturedPieces(history) {
    const captured = { w: [], b: [] };
    for (const move of history) {
        if (move && typeof move === 'object' && move.captured) {
            const capturedColor = move.color === 'w' ? 'b' : 'w';
            captured[capturedColor].push(move.captured);
        }
    }

    const render = (container, pieces, color) => {
        container.innerHTML = '';
        let material = 0;
        const pieceOrder = { q: 1, r: 2, b: 3, n: 4, p: 5 };
        pieces.sort((a, b) => pieceOrder[a] - pieceOrder[b]).forEach(p => {
            const pieceEl = document.createElement('span');
            pieceEl.className = `piece ${color === 'w' ? 'white-piece' : 'black-piece'}`;
            pieceEl.textContent = PIECES[color][p];
            container.appendChild(pieceEl);
            material += PIECE_VALUES[p];
        });
        return material;
    };

    const whiteMaterial = render(elements.capturedForBlack, captured.w, 'w');
    const blackMaterial = render(elements.capturedForWhite, captured.b, 'b');
    const diff = whiteMaterial - blackMaterial;

    if (diff > 0) {
        const diffEl = document.createElement('span');
        diffEl.className = 'material-diff';
        diffEl.textContent = `+${diff}`;
        elements.capturedForBlack.appendChild(diffEl);
    } else if (diff < 0) {
        const diffEl = document.createElement('span');
        diffEl.className = 'material-diff';
        diffEl.textContent = `+${Math.abs(diff)}`;
        elements.capturedForWhite.appendChild(diffEl);
    }
}

export function showPromotionModal(color) {
    if (!elements.promotionOptions || !elements.promotionModal) return;

    elements.promotionOptions.innerHTML = '';
    const symbols = PIECES[color];

    PROMOTION_PIECES.forEach(type => {
        const button = document.createElement('button');
        button.className = `piece ${color === 'w' ? 'white-piece' : 'black-piece'} text-5xl sm:text-6xl p-3 rounded hover:scale-105 transition-transform`;
        button.textContent = symbols[type];
        button.onclick = () => {
            if (uiHandlers.onPromotionSelect) {
                uiHandlers.onPromotionSelect(type);
            }
        };
        elements.promotionOptions.appendChild(button);
    });

    elements.promotionModal.classList.remove('hidden');
}

export function hidePromotionModal() {
    elements.promotionModal.classList.add('hidden');
}

export function playSound(soundType) {
    // Implementação removida/comentada para usar o módulo audio.js diretamente no main.js
}

export function showGameContainer() { elements.gameContainer.classList.remove('hidden'); }
export function hideGameContainer() { elements.gameContainer.classList.add('hidden'); }
export function showColorSelectionModal() { elements.colorSelectionModal.classList.remove('hidden'); }
export function hideColorSelectionModal() { elements.colorSelectionModal.classList.add('hidden'); }

export function showGameOverModal(title, message) {
    elements.modalTitle.textContent = title;
    elements.modalMessage.textContent = message;
    elements.gameOverModal.classList.remove('hidden');
}
export function hideGameOverModal() { elements.gameOverModal.classList.add('hidden'); }

export function updateEvaluationDisplay(type, score) {
    let displayText = '';
    if (type === 'mate') {
        displayText = `M${Math.abs(score)}`;
        elements.evaluationValue.textContent = score > 0 ? `+${displayText}` : `-${displayText}`;
    } else {
        const pawnValue = (score / 100).toFixed(2);
        displayText = pawnValue >= 0 ? `+${pawnValue}` : pawnValue;
        elements.evaluationValue.textContent = displayText;
    }
}
