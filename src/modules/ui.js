// src/modules/ui.js

import { PIECES, PIECE_VALUES, PROMOTION_PIECES, OPENING_BOOK, APP_VERSION } from './config.js';
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
    mainBoardContainer: document.querySelector('.board-container'),
    undoButton: document.getElementById('undoButton'),
    versionCard: document.getElementById('versionCard'),
    currentVersionDisplay: document.getElementById('currentVersionDisplay'),
    changelogModal: document.getElementById('changelogModal'),
    changelogContent: document.getElementById('changelogContent'),
    closeChangelogButton: document.getElementById('closeChangelogButton'),
    toastContainer: document.getElementById('toastContainer'),
    popOutWidgetBtn: document.getElementById('popOutWidgetBtn'),
    restoreWindowBtn: document.getElementById('restoreWindowBtn'),
    appOverlay: document.getElementById('appOverlay'),
    
    // --- ELEMENTOS DO EXPLORADOR ---
    openOpeningExplorerBtn: document.getElementById('openOpeningExplorerBtn'),
    openingExplorerModal: document.getElementById('openingExplorerModal'),
    closeExplorerBtn: document.getElementById('closeExplorerBtn'),
    explorerCategories: document.getElementById('explorerCategories'),
    explorerList: document.getElementById('explorerList'),
    explorerPlaceholder: document.getElementById('explorerPlaceholder'),
    explorerSearchInput: document.getElementById('explorerSearchInput'),
    selectedOpeningName: document.getElementById('selectedOpeningName'),
    selectedVariantName: document.getElementById('selectedVariantName'),
    clearOpeningBtn: document.getElementById('clearOpeningBtn'),
};

let uiHandlers = {}; 
let widgetWindowRef = null; 
let activeCategory = null; 

function safeAddEventListener(id, event, handler) {
    const el = document.getElementById(id);
    if (el) el.addEventListener(event, handler);
}

// ==========================================================
// LÓGICA DO EXPLORADOR DE ABERTURAS
// ==========================================================

function initOpeningExplorer() {
    if (!elements.explorerCategories) return;
    elements.explorerCategories.innerHTML = '';
    
    if(elements.explorerSearchInput) elements.explorerSearchInput.value = '';

    OPENING_BOOK.forEach((category, index) => {
        const btn = document.createElement('button');
        const baseClass = "w-full text-left p-4 border-b border-gray-200 transition-colors flex flex-col gap-1 focus:outline-none";
        const inactiveClass = "text-gray-600 hover:bg-white hover:text-gray-800";
        const activeClass = "bg-white text-gray-900 border-l-4 border-l-blue-600 shadow-sm";
        
        btn.className = `${baseClass} ${index === 0 ? activeClass : inactiveClass}`;
        
        btn.innerHTML = `
            <span class="font-bold text-sm sm:text-base pointer-events-none">${category.label}</span>
            <span class="text-xs text-gray-400 truncate pointer-events-none">${category.description}</span>
        `;
        
        btn.onclick = () => {
            Array.from(elements.explorerCategories.children).forEach(c => {
                c.className = `${baseClass} ${inactiveClass}`;
            });
            btn.className = `${baseClass} ${activeClass}`;
            
            activeCategory = category;
            renderCategoryContent(category);
        };

        elements.explorerCategories.appendChild(btn);
    });

    if (OPENING_BOOK.length > 0) {
        activeCategory = OPENING_BOOK[0];
        renderCategoryContent(OPENING_BOOK[0]);
    }
}

function renderCategoryContent(category, searchTerm = '') {
    elements.explorerPlaceholder.classList.add('hidden');
    elements.explorerList.classList.remove('hidden');
    elements.explorerList.innerHTML = '';

    let openingsToRender = [];
    let titleText = category ? category.label : 'Resultados da Busca';

    if (searchTerm.trim().length > 0) {
        const term = searchTerm.toLowerCase();
        titleText = `Resultados para "${searchTerm}"`;
        
        OPENING_BOOK.forEach(cat => {
            cat.openings.forEach(op => {
                const matchName = op.name.toLowerCase().includes(term);
                const matchEco = op.eco && op.eco.toLowerCase().includes(term);
                const matchVariant = op.variants.some(v => v.name.toLowerCase().includes(term));
                
                if (matchName || matchEco || matchVariant) {
                    openingsToRender.push(op);
                }
            });
        });
    } else {
        openingsToRender = category.openings;
    }

    const title = document.createElement('h2');
    title.className = "text-2xl font-bold text-gray-800 mb-6 pb-2 border-b border-gray-100";
    title.textContent = titleText;
    elements.explorerList.appendChild(title);

    if (openingsToRender.length === 0) {
        const noRes = document.createElement('p');
        noRes.className = "text-gray-500 text-center mt-10";
        noRes.textContent = "Nenhuma abertura encontrada.";
        elements.explorerList.appendChild(noRes);
        return;
    }

    openingsToRender.forEach(opening => {
        const card = document.createElement('div');
        card.className = "bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden mb-4";
        
        const header = document.createElement('div');
        header.className = "bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center";
        header.innerHTML = `
            <div>
                <div class="flex items-center gap-2">
                    <h3 class="font-bold text-lg text-gray-800">${opening.name}</h3>
                    ${opening.eco ? `<span class="text-xs font-mono bg-gray-200 text-gray-600 px-2 py-0.5 rounded border border-gray-300" title="Código ECO">${opening.eco}</span>` : ''}
                </div>
            </div>
            <span class="text-gray-400 text-xs font-semibold uppercase tracking-wide">${opening.variants.length} variantes</span>
        `;
        
        const variantsContainer = document.createElement('div');
        variantsContainer.className = "p-4 flex flex-wrap gap-2";
        
        opening.variants.forEach(variant => {
            const chip = document.createElement('button');
            chip.className = "group relative px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-semibold rounded-full border border-blue-100 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all cursor-pointer";
            chip.textContent = variant.name;
            
            chip.onclick = () => selectOpening(opening, variant);
            
            variantsContainer.appendChild(chip);
        });

        card.appendChild(header);
        card.appendChild(variantsContainer);
        elements.explorerList.appendChild(card);
    });
}

function selectOpening(opening, variant) {
    if (elements.selectedOpeningName) elements.selectedOpeningName.textContent = opening.name;
    if (elements.selectedVariantName) elements.selectedVariantName.textContent = variant.name;

    elements.openingExplorerModal.classList.add('hidden');
    showToast(`Abertura selecionada: ${opening.name}`, 'success');

    const event = new CustomEvent('opening-selected', { 
        detail: { 
            pgn: variant.pgn, 
            name: `${opening.name} - ${variant.name}`,
            fen: variant.fen || null
        } 
    });
    window.dispatchEvent(event);
}

// ==========================================================
// FUNÇÕES AUXILIARES DE UI (GENÉRICAS)
// ==========================================================

function renderChangelog() {
    if (!elements.currentVersionDisplay || !elements.changelogContent) return;
    elements.currentVersionDisplay.textContent = APP_VERSION || 'v1.0.7';
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

export function showToast(message, type = 'info') {
    if (!elements.toastContainer) return;
    const toast = document.createElement('div');
    const bgClass = type === 'error' ? 'bg-red-600' : (type === 'success' ? 'bg-green-600' : 'bg-blue-600');
    toast.className = `toast pointer-events-auto px-4 py-3 rounded shadow-lg text-white text-sm font-bold flex items-center gap-2 ${bgClass}`;
    toast.innerHTML = `<span>${message}</span>`;
    elements.toastContainer.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('toast-visible'));
    setTimeout(() => {
        toast.classList.remove('toast-visible');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function highlightCoordinates(squareName) {
    if (!squareName) return;
}

function clearCoordinateHighlights() {
}

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
    safeAddEventListener('undoButton', 'click', handlers.onUndo); 

    if (elements.copyPgnButton) {
        elements.copyPgnButton.addEventListener('click', handlers.onCopyPgn);
    }
    safeAddEventListener('downloadDocButton', 'click', handlers.onDownloadDoc);
    safeAddEventListener('versionCard', 'click', () => elements.changelogModal.classList.remove('hidden'));
    safeAddEventListener('closeChangelogButton', 'click', () => elements.changelogModal.classList.add('hidden'));
    
    if (elements.popOutWidgetBtn) elements.popOutWidgetBtn.addEventListener('click', openWidgetWindow);
    
    if (elements.restoreWindowBtn) {
        elements.restoreWindowBtn.addEventListener('click', () => {
            if (window.opener) window.opener.focus();
            else window.open(window.location.pathname.replace('?mode=widget', ''), '_blank');
            window.close();
        });
    }

    if (elements.openOpeningExplorerBtn) {
        elements.openOpeningExplorerBtn.addEventListener('click', () => {
            elements.openingExplorerModal.classList.remove('hidden');
            initOpeningExplorer();
        });
    }
    if (elements.closeExplorerBtn) {
        elements.closeExplorerBtn.addEventListener('click', () => elements.openingExplorerModal.classList.add('hidden'));
    }
    if (elements.clearOpeningBtn) {
        elements.clearOpeningBtn.addEventListener('click', () => {
             elements.selectedOpeningName.textContent = 'Padrão (Início)';
             elements.selectedVariantName.textContent = '--';
             
             const event = new CustomEvent('opening-selected', { detail: { pgn: '', name: 'Standard' } });
             window.dispatchEvent(event);
             
             showToast("Abertura redefinida para Padrão.", "info");
        });
    }
    if (elements.explorerSearchInput) {
        elements.explorerSearchInput.addEventListener('input', (e) => {
             renderCategoryContent(activeCategory, e.target.value);
        });
    }

    renderChangelog(); 
}

export function getSkillLevel() {
    const el = document.getElementById('difficultyLevel');
    return el ? parseInt(el.value, 10) : 12;
}

export function getPgnInput() {
    const el = document.getElementById('pgnInput');
    return el ? el.value : '';
}

export function setBoardCursor(cursor) {
    if (elements.board) elements.board.style.cursor = cursor;
}

export function showContinueGameOption(isVisible) {
    const container = document.getElementById('continueGameContainer');
    if (container) isVisible ? container.classList.remove('hidden') : container.classList.add('hidden');
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
                // Remove apenas peças antigas, preservando coordenadas
                const existingPiece = squareElement.querySelector('.piece');
                if (existingPiece) existingPiece.remove();

                if (piece) {
                    const pieceElement = document.createElement('div');
                    pieceElement.className = 'piece';
                    pieceElement.style.backgroundImage = `url('${PIECES[piece.color][piece.type]}')`;
                    
                    if (elements.board.classList.contains('board-flipped')) {
                        pieceElement.style.transform = 'rotate(180deg)';
                    }
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
    
    // Injeta coordenadas
    const isFlipped = elements.board.classList.contains('board-flipped');
    updateCoordinates(isFlipped ? 'b' : 'w');
}

export function setupBoardOrientation(playerColor) {
    if (playerColor === 'b') {
        elements.board.classList.add('board-flipped');
    } else {
        elements.board.classList.remove('board-flipped');
    }
    // Redesenha coordenadas com lógica de cor atualizada
    updateCoordinates(playerColor);
}

// LÓGICA DE COORDENADAS INTERNAS
function updateCoordinates(playerColor) {
    // Remove coordenadas antigas
    document.querySelectorAll('.coord-label').forEach(el => el.remove());

    const squares = document.querySelectorAll('.square');
    
    squares.forEach(square => {
        const squareName = square.dataset.square; 
        const file = squareName[0]; 
        const rank = squareName[1]; 

        // Lógica de bordas visuais
        // Se Brancas: Esquerda é 'a', Base é '1'
        // Se Pretas (Flipped): Esquerda visual é 'h', Base visual é '8'
        const isLeftEdge = (playerColor === 'w' && file === 'a') || (playerColor === 'b' && file === 'h');
        const isBottomEdge = (playerColor === 'w' && rank === '1') || (playerColor === 'b' && rank === '8');

        // Adicionar Número (Rank)
        if (isLeftEdge) {
            const rankLabel = document.createElement('span');
            rankLabel.className = 'coord-label coord-rank';
            rankLabel.innerText = rank;
            square.appendChild(rankLabel);
        }

        // Adicionar Letra (File)
        if (isBottomEdge) {
            const fileLabel = document.createElement('span');
            fileLabel.className = 'coord-label coord-file';
            fileLabel.innerText = file;
            square.appendChild(fileLabel);
        }
    });
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
    if (fromElement) fromElement.classList.add('selected-square');
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
        if(!container) return 0; 
        container.innerHTML = '';
        let material = 0;
        const pieceOrder = { q: 1, r: 2, b: 3, n: 4, p: 5 };
        
        pieces.sort((a, b) => pieceOrder[a] - pieceOrder[b]).forEach(p => {
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

    const createBadge = (score) => {
        const diffEl = document.createElement('span');
        diffEl.className = 'material-diff';
        diffEl.textContent = `+${Math.abs(score)}`;
        diffEl.title = "Vantagem Material (Pontos baseados no valor das peças)"; 
        return diffEl;
    };

    if (elements.capturedForBlack && diff > 0) {
        elements.capturedForBlack.appendChild(createBadge(diff));
    } else if (elements.capturedForWhite && diff < 0) {
        elements.capturedForWhite.appendChild(createBadge(diff));
    }
}

export function showPromotionModal(color) {
    if (!elements.promotionOptions || !elements.promotionModal) return;
    elements.promotionOptions.innerHTML = '';

    PROMOTION_PIECES.forEach(type => {
        const button = document.createElement('button');
        button.className = `piece w-16 h-16 mx-1 hover:scale-110 transition-transform bg-gray-200 rounded-lg`;
        button.style.backgroundImage = `url('${PIECES[color][type]}')`;
        
        button.onclick = () => {
            if (uiHandlers.onPromotionSelect) uiHandlers.onPromotionSelect(type);
        };
        elements.promotionOptions.appendChild(button);
    });

    elements.promotionModal.classList.remove('hidden');
}

export function hidePromotionModal() {
    elements.promotionModal.classList.add('hidden');
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
