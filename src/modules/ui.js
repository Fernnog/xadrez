// src/modules/ui.js

import { PIECES, PIECE_VALUES, PROMOTION_PIECES } from './config.js';

// Centraliza a seleção de todos os elementos do DOM para melhor performance e organização
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
    mainBoardContainer: document.querySelector('.w-full.max-w-lg.lg\\:max-w-none.lg\\:w-2\\/3'),
    rankLabels: document.querySelector('.rank-labels'),
    fileLabels: document.querySelector('.file-labels'),
};

// Sons da interface (carregados uma vez)
// Nota: Os base64 foram omitidos/resumidos no prompt original, mas mantive a estrutura de inicialização.
// Certifique-se de que o arquivo audio.js está lidando com o carregamento real dos dados de áudio se eles vierem de lá,
// ou se eles são definidos aqui, mantenha suas strings base64 originais se você as tiver.
// Para este código, assumimos que a lógica de audio.js (importada no main) lida com o som pesado,
// e aqui lidamos apenas com triggers visuais ou sons simples se necessário.
// MANTENDO A ESTRUTURA ORIGINAL DO SEU ARQUIVO:
const audioMove = new Audio(''); // Preencha se necessário ou use o módulo audio.js
const audioStart = new Audio(''); 
const audioGameOver = new Audio(''); 
let isAudioInitialized = false;

function initAudio() {
    if (isAudioInitialized) return;
    // Tenta tocar um som silencioso para contornar políticas de autoplay dos navegadores
    audioMove.volume = 0;
    audioMove.play().catch(() => {});
    audioMove.volume = 1;
    isAudioInitialized = true;
}

// --- ESTADO E HELPERS INTERNOS ---

// Armazena as funções de callback enviadas pelo main.js
let uiHandlers = {}; 

/**
 * Helper para adicionar eventos com segurança.
 * Evita erros fatais se um ID mudar no HTML.
 */
function safeAddEventListener(id, event, handler) {
    const el = document.getElementById(id);
    if (el) {
        el.addEventListener(event, handler);
    } else {
        console.warn(`[UI Warning] Elemento com ID '${id}' não encontrado. O evento '${event}' não foi vinculado.`);
    }
}

// --- FUNÇÕES EXPORTADAS NECESSÁRIAS PARA O MAIN.JS (A CORREÇÃO) ---

/**
 * Registra os callbacks de eventos vindos da lógica do jogo.
 * Esta era a função faltante que causava o erro.
 */
export function registerUIHandlers(handlers) {
    uiHandlers = handlers;

    // UX: Wrapper para dar feedback visual imediato (cursor de espera) ao iniciar
    const onStartWrapper = (callback) => {
        document.body.style.cursor = 'wait'; 
        setTimeout(() => callback(), 10);
    };

    // Vincula os botões principais
    safeAddEventListener('playWhiteButton', 'click', () => onStartWrapper(handlers.onPlayWhite));
    safeAddEventListener('playBlackButton', 'click', () => onStartWrapper(handlers.onPlayBlack));
    safeAddEventListener('resetButton', 'click', handlers.onResetGame);
    
    // Vincula botões de modais e utilitários
    safeAddEventListener('modalResetButton', 'click', handlers.onResetGame);
    safeAddEventListener('continueGameButton', 'click', handlers.onContinueGame);
    safeAddEventListener('importPgnButton', 'click', handlers.onImportPgn);

    if (elements.copyPgnButton) {
        elements.copyPgnButton.addEventListener('click', handlers.onCopyPgn);
    }
}

export function getSkillLevel() {
    const el = document.getElementById('difficultyLevel');
    return el ? parseInt(el.value, 10) : 12; // Default para 12 se falhar
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

/**
 * Prepara a UI para o jogo ativo.
 */
export function setupAndDisplayGame(playerColor) {
    // Reverte o cursor para o padrão (fim do carregamento)
    document.body.style.cursor = 'default';
    
    hideColorSelectionModal();
    hideGameOverModal();
    showGameContainer();
    
    setupBoardOrientation(playerColor);
    // Cria o tabuleiro e conecta o handler de clique nas casas
    createBoard(uiHandlers.onSquareClick);
}

// --- FUNÇÕES DE RENDERIZAÇÃO E VISUALIZAÇÃO (EXISTENTES) ---

/**
 * Renderiza o tabuleiro de xadrez com base no estado do jogo.
 */
export function renderBoard(boardState) {
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const squareName = 'abcdefgh'[c] + (8 - r);
            const squareElement = elements.board.querySelector(`[data-square="${squareName}"]`);
            const piece = boardState[r][c];
            
            if (squareElement) {
                squareElement.innerHTML = ''; // Limpa a casa
                if (piece) {
                    const pieceElement = document.createElement('span');
                    pieceElement.className = `piece ${piece.color === 'w' ? 'white-piece' : 'black-piece'}`;
                    // Adiciona rotação se o tabuleiro estiver invertido
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

/**
 * Cria a estrutura HTML do tabuleiro e adiciona os event listeners nas casas.
 */
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
            // Usa o callback passado (que agora vem via registerUIHandlers -> setupAndDisplayGame)
            if (onSquareClickCallback) {
                square.addEventListener('click', () => onSquareClickCallback(squareName));
            }
            elements.board.appendChild(square);
        }
    }
}

/**
 * Configura a orientação do tabuleiro e das legendas.
 */
export function setupBoardOrientation(playerColor) {
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    elements.rankLabels.innerHTML = '';
    elements.fileLabels.innerHTML = '';

    if (playerColor === 'b') {
        elements.board.classList.add('board-flipped');
        ranks.reverse().forEach(r => elements.rankLabels.innerHTML += `<span>${r}</span>`);
        files.reverse().forEach(f => elements.fileLabels.innerHTML += `<span>${f}</span>`);
        if(elements.capturedForWhite && elements.mainBoardContainer)
            elements.mainBoardContainer.insertBefore(elements.capturedForWhite, elements.mainBoardContainer.firstChild);
    } else {
        elements.board.classList.remove('board-flipped');
        ranks.forEach(r => elements.rankLabels.innerHTML += `<span>${r}</span>`);
        files.forEach(f => elements.fileLabels.innerHTML += `<span>${f}</span>`);
        if(elements.capturedForBlack && elements.mainBoardContainer)
            elements.mainBoardContainer.insertBefore(elements.capturedForBlack, elements.mainBoardContainer.firstChild);
    }
}

/**
 * Atualiza o texto de status do jogo.
 */
export function updateStatus(gameState, showGameOverCallback) {
    let statusText = '';
    const turn = gameState.turn === 'w' ? 'Brancas' : 'Pretas';

    // Se showGameOverCallback não for passado, usamos um interno seguro
    const safeGameOverCall = showGameOverCallback || showGameOverModal;

    if (gameState.isGameOver) {
        playSound('gameOver');
        if (gameState.isCheckmate) {
            const winner = gameState.turn === 'w' ? 'Pretas' : 'Brancas';
            statusText = `Xeque-mate! ${winner} vencem.`;
            safeGameOverCall(`Xeque-mate!`, `${winner} vencem.`);
        } else if (gameState.isStalemate) {
            statusText = 'Empate por Afogamento.';
            safeGameOverCall('Empate!', 'O jogo terminou em afogamento.');
        } else if (gameState.isDraw) { // Simplificado para cobrir repetição também se a flag vier true
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

/**
 * Destaca a casa de origem e os movimentos válidos possíveis.
 */
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
    for (let i = 0; i < history.length; i += 2) {
        movePairs.push({ white: history[i]?.san || '', black: history[i + 1]?.san || '' });
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
        if (move.captured) {
            const capturedColor = move.color === 'w' ? 'b' : 'w'; // Peça capturada é da cor oposta
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

/**
 * Exibe o modal para o jogador escolher a peça de promoção.
 * ATUALIZADO: Agora usa uiHandlers.onPromotionSelect
 */
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
    initAudio();
    switch (soundType) {
        case 'move':
            audioMove.currentTime = 0;
            audioMove.play().catch(()=>{});
            break;
        case 'start':
            audioStart.currentTime = 0;
            audioStart.play().catch(()=>{});
            break;
        case 'gameOver':
            audioGameOver.currentTime = 0;
            audioGameOver.play().catch(()=>{});
            break;
    }
}

// Funções de controle de visibilidade de modais e elementos
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
