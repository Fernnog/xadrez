// src/modules/ui.js

import { PIECES, PIECE_VALUES, PROMOTION_PIECES, OPENING_FENS, APP_VERSION } from './config.js';
import { CHANGELOG } from './changelog.js';

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
    downloadDocButton: document.getElementById('downloadDocButton'),
    mainBoardContainer: document.querySelector('.flex.flex-col.w-full.lg\\:w-auto.items-center'),
    rankLabels: document.querySelector('.rank-labels'),
    fileLabels: document.querySelector('.file-labels'),
    openingSelect: document.getElementById('openingSelect'),
    openingFilter: document.getElementById('openingFilter'),
    undoButton: document.getElementById('undoButton'),
    versionCard: document.getElementById('versionCard'),
    currentVersionDisplay: document.getElementById('currentVersionDisplay'),
    changelogModal: document.getElementById('changelogModal'),
    changelogContent: document.getElementById('changelogContent'),
    closeChangelogButton: document.getElementById('closeChangelogButton'),
    toastContainer: document.getElementById('toastContainer'),
    // --- ELEMENTOS NOVOS DO WIDGET E OVERLAY (v1.0.2) ---
    popOutWidgetBtn: document.getElementById('popOutWidgetBtn'),
    restoreWindowBtn: document.getElementById('restoreWindowBtn'),
    appOverlay: document.getElementById('appOverlay'),
};

// Sons da interface
let isAudioInitialized = false;

function initAudio() {
    // Implementação real da inicialização deve vir de audio.js
}

// --- ESTADO E HELPERS INTERNOS ---

let uiHandlers = {}; 
let widgetWindowRef = null;

function safeAddEventListener(id, event, handler) {
    const el = document.getElementById(id);
    if (el) {
        el.addEventListener(event, handler);
    }
}

/**
 * Preenche dinamicamente o seletor de aberturas, com filtro opcional.
 */
function populateOpeningSelector(filterText = '') {
    if (!elements.openingSelect) return;
    
    const filter = filterText.toLowerCase().trim();
    elements.openingSelect.innerHTML = '';

    const groupedOpenings = {};
    for (const key in OPENING_FENS) {
        const opening = OPENING_FENS[key];
        const category = opening.category || 'Outras';
        if (!groupedOpenings[category]) {
            groupedOpenings[category] = [];
        }
        groupedOpenings[category].push({ key, ...opening });
    }

    const categoryOrder = [
        'Padrão', 
        'Aberturas de Peão Rei (1. e4)', 
        'Aberturas de Peão Dama (1. d4)',
        'Outras Aberturas',
        'Outras'
    ];

    let hasVisibleOptions = false;

    categoryOrder.forEach(categoryName => {
        if (!groupedOpenings[categoryName]) return;

        const openingsInCategory = groupedOpenings[categoryName];
        
        const matchingOpenings = openingsInCategory.filter(data =>
            filter === '' ||
            data.name.toLowerCase().includes(filter) ||
            data.pgn.toLowerCase().includes(filter)
        );

        if (matchingOpenings.length === 0) return; 

        hasVisibleOptions = true;

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

// --- FUNÇÃO DE CHANGELOG ---
function renderChangelog() {
    if (!elements.currentVersionDisplay || !elements.changelogContent) return;
    
    elements.currentVersionDisplay.textContent = APP_VERSION || 'v1.0.6';
    elements.changelogContent.innerHTML = '';
    
    if (!CHANGELOG) return;

    CHANGELOG.forEach((log, index) => {
        const isLatest = index === 0;
        const entry = document.createElement('div');
        entry.className = `mb-6 ${!isLatest ? 'opacity-75 hover:opacity-100 transition-opacity' : ''}`;
        entry.innerHTML = `
            <div class="flex justify-between items-baseline mb-2">
                <div class="flex items-center gap-2">
                    <span class="font-bold text-lg ${isLatest ? 'text-blue-600' : 'text-gray-600'}">${log.version}</span>
                    ${isLatest ? '<span class="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">Atual</span>' : ''}
                </div>
                <span class="text-xs text-gray-500">${log.date}</span>
            </div>
            <ul class="list-disc list-inside text-sm text-gray-700 space-y-1 ml-1">
                ${log.changes.map(c => `<li>${c}</li>`).join('')}
            </ul>
        `;
        elements.changelogContent.appendChild(entry);
    });
}

// --- FUNÇÃO DE TOAST ---
export function showToast(message, type = 'info') {
    if (!elements.toastContainer) return;

    const toast = document.createElement('div');
    const bgClass = type === 'error' ? 'bg-red-600' : (type === 'success' ? 'bg-green-600' : 'bg-blue-600');
    
    toast.className = `toast pointer-events-auto px-4 py-3 rounded shadow-lg text-white text-sm font-bold flex items-center gap-2 ${bgClass}`;
    toast.innerHTML = `<span>${message}</span>`;
    
    elements.toastContainer.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add('toast-visible');
    });

    setTimeout(() => {
        toast.classList.remove('toast-visible');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// --- FUNÇÕES DE DESTAQUE DE COORDENADAS ---
function highlightCoordinates(squareName) {
    if (!squareName) return;
    const file = squareName[0];
    const rank = squareName[1];

    const fileLabel = document.getElementById(`label-file-${file}`);
    const rankLabel = document.getElementById(`label-rank-${rank}`);

    if (fileLabel) fileLabel.classList.add('label-highlight');
    if (rankLabel) rankLabel.classList.add('label-highlight');
}

function clearCoordinateHighlights() {
    document.querySelectorAll('.label-highlight').forEach(el => el.classList.remove('label-highlight'));
}

// --- FUNÇÃO DE ABRIR WIDGET (POP-OUT) ---
function openWidgetWindow() {
    const width = 450;
    const height = 550;
    const left = 20; 
    const top = window.screen.availHeight - height - 20; 

    const features = `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=no,status=no`;
    
    widgetWindowRef = window.open(`${window.location.pathname}?mode=widget`, 'ChessWidgetWindow', features);

    if (widgetWindowRef) {
        if (elements.appOverlay) elements.appOverlay.classList.remove('hidden');

        const checkTimer = setInterval(() => {
            if (widgetWindowRef.closed) {
                clearInterval(checkTimer);
                if (elements.appOverlay) elements.appOverlay.classList.add('hidden');
                
                window.dispatchEvent(new CustomEvent('widget-closed'));
            }
        }, 500);
    } else {
        showToast("Por favor, permita pop-ups para usar o modo Widget.", "error");
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
    safeAddEventListener('openingFilter', 'input', (e) => populateOpeningSelector(e.target.value));
    safeAddEventListener('undoButton', 'click', handlers.onUndo); 

    if (elements.copyPgnButton) {
        elements.copyPgnButton.addEventListener('click', handlers.onCopyPgn);
    }

    safeAddEventListener('downloadDocButton', 'click', handlers.onDownloadDoc);
    safeAddEventListener('versionCard', 'click', () => elements.changelogModal.classList.remove('hidden'));
    safeAddEventListener('closeChangelogButton', 'click', () => elements.changelogModal.classList.add('hidden'));
    
    // --- HANDLERS DO WIDGET ---
    if (elements.popOutWidgetBtn) {
        elements.popOutWidgetBtn.addEventListener('click', openWidgetWindow);
    }
    
    if (elements.restoreWindowBtn) {
        elements.restoreWindowBtn.addEventListener('click', () => {
            if (window.opener) {
                window.opener.focus();
            } else {
                window.open(window.location.pathname.replace('?mode=widget', ''), '_blank');
            }
            window.close();
        });
    }

    populateOpeningSelector(); 
    renderChangelog(); 
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

// MODIFICADO (v1.0.6): Renderiza imagens SVG via backgroundImage
export function renderBoard(boardState) {
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const squareName = 'abcdefgh'[c] + (8 - r);
            const squareElement = elements.board.querySelector(`[data-square="${squareName}"]`);
            const piece = boardState[r][c];
            
            if (squareElement) {
                squareElement.innerHTML = '';
                if (piece) {
                    // Mudança de span para div e uso de backgroundImage
                    const pieceElement = document.createElement('div');
                    pieceElement.className = 'piece'; // A cor não é mais uma classe, é definida pela URL
                    
                    // Assume que PIECES no config.js agora retorna URLs
                    pieceElement.style.backgroundImage = `url('${PIECES[piece.color][piece.type]}')`;
                    
                    if (elements.board.classList.contains('board-flipped')) {
                        pieceElement.style.transform = 'rotate(180deg)';
                    }
                    // O texto (Unicode) foi removido
                    squareElement.appendChild(pieceElement);
                }
            }
        }
    }
}

export function createBoard(onSquareClickCallback) {
    if (!elements.board) return;
    elements.board.innerHTML = '';

    const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

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

            if (!isTouchDevice) {
                square.addEventListener('mouseenter', () => highlightCoordinates(squareName));
                square.addEventListener('mouseleave', clearCoordinateHighlights);
            }

            elements.board.appendChild(square);
        }
    }
}

export function setupBoardOrientation(playerColor) {
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    
    if(elements.rankLabels) elements.rankLabels.innerHTML = '';
    if(elements.fileLabels) elements.fileLabels.innerHTML = '';

    const rList = playerColor === 'b' ? [...ranks].reverse() : ranks;
    const fList = playerColor === 'b' ? [...files].reverse() : files;

    if(elements.rankLabels) {
        rList.forEach(r => {
            elements.rankLabels.innerHTML += `<span id="label-rank-${r}" class="transition-all duration-200">${r}</span>`;
        });
    }
    if(elements.fileLabels) {
        fList.forEach(f => {
            elements.fileLabels.innerHTML += `<span id="label-file-${f}" class="transition-all duration-200">${f}</span>`;
        });
    }

    if (playerColor === 'b') {
        elements.board.classList.add('board-flipped');
    } else {
        elements.board.classList.remove('board-flipped');
    }
}

export function updateStatus(gameState, showGameOverCallback) {
    let statusText = '';
    const turn = gameState.turn === 'w' ? 'Brancas' : 'Pretas';
    const safeGameOverCall = showGameOverCallback || showGameOverModal;

    if (gameState.isGameOver) {
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

// MODIFICADO (v1.0.6): Prateleira de Captura com SVGs
export function updateCapturedPieces(history) {
    const captured = { w: [], b: [] };
    for (const move of history) {
        if (move && typeof move === 'object' && move.captured) {
            const capturedColor = move.color === 'w' ? 'b' : 'w';
            captured[capturedColor].push(move.captured);
        }
    }

    const render = (container, pieces, color) => {
        if(!container) return 0;
        container.innerHTML = '';
        let material = 0;
        const pieceOrder = { q: 1, r: 2, b: 3, n: 4, p: 5 };
        
        pieces.sort((a, b) => pieceOrder[a] - pieceOrder[b]).forEach(p => {
            // Usa div e backgroundImage em vez de texto e unicode
            const pieceEl = document.createElement('div');
            pieceEl.className = 'piece';
            pieceEl.style.backgroundImage = `url('${PIECES[color][p]}')`;
            container.appendChild(pieceEl);
            material += PIECE_VALUES[p];
        });
        return material;
    };

    const whiteMaterial = render(elements.capturedForBlack, captured.w, 'w');
    const blackMaterial = render(elements.capturedForWhite, captured.b, 'b');
    const diff = whiteMaterial - blackMaterial;

    if (elements.capturedForBlack && diff > 0) {
        const diffEl = document.createElement('span');
        diffEl.className = 'material-diff';
        diffEl.textContent = `+${diff}`;
        elements.capturedForBlack.appendChild(diffEl);
    } else if (elements.capturedForWhite && diff < 0) {
        const diffEl = document.createElement('span');
        diffEl.className = 'material-diff';
        diffEl.textContent = `+${Math.abs(diff)}`;
        elements.capturedForWhite.appendChild(diffEl);
    }
}

// MODIFICADO (v1.0.6): Modal de Promoção com SVGs
export function showPromotionModal(color) {
    if (!elements.promotionOptions || !elements.promotionModal) return;

    elements.promotionOptions.innerHTML = '';
    // PIECES[color] agora contém URLs
    const symbols = PIECES[color];

    PROMOTION_PIECES.forEach(type => {
        const button = document.createElement('button');
        // Adicionadas classes de tamanho (w-16 h-16) pois não há mais texto
        button.className = `piece w-16 h-16 mx-1 hover:scale-110 transition-transform bg-gray-200 rounded-lg`;
        button.style.backgroundImage = `url('${symbols[type]}')`;
        // Removemos button.textContent
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
