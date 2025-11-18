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
const audioMove = new Audio('data:audio/wav;base64,...'); // Base64 completo do seu arquivo
const audioStart = new Audio('data:audio/wav;base64,...'); // Base64 completo do seu arquivo
const audioGameOver = new Audio('data:audio/wav;base64,...'); // Base64 completo do seu arquivo
let isAudioInitialized = false;

function initAudio() {
    if (isAudioInitialized) return;
    // Tenta tocar um som silencioso para contornar políticas de autoplay dos navegadores
    audioMove.volume = 0;
    audioMove.play().catch(() => {});
    audioMove.volume = 1;
    isAudioInitialized = true;
}

/**
 * Renderiza o tabuleiro de xadrez com base no estado do jogo.
 * @param {object[][]} boardState - O array 2D do estado do tabuleiro, vindo do `game.js`.
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
 * @param {(squareName: string) => void} onSquareClickCallback - Função a ser chamada quando uma casa é clicada.
 */
export function createBoard(onSquareClickCallback) {
    elements.board.innerHTML = '';
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const square = document.createElement('div');
            const squareName = 'abcdefgh'[c] + (8 - r);
            const colorClass = (r + c) % 2 === 0 ? 'light' : 'dark';
            square.className = `square ${colorClass}`;
            square.dataset.square = squareName;
            square.addEventListener('click', () => onSquareClickCallback(squareName));
            elements.board.appendChild(square);
        }
    }
}

/**
 * Configura a orientação do tabuleiro e das legendas com base na cor do jogador.
 * @param {'w' | 'b'} playerColor - A cor do jogador humano.
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
        // Move a caixa de peças capturadas brancas para o topo
        elements.mainBoardContainer.insertBefore(elements.capturedForWhite, elements.mainBoardContainer.firstChild);
    } else {
        elements.board.classList.remove('board-flipped');
        ranks.forEach(r => elements.rankLabels.innerHTML += `<span>${r}</span>`);
        files.forEach(f => elements.fileLabels.innerHTML += `<span>${f}</span>`);
        // Move a caixa de peças capturadas pretas para o topo
        elements.mainBoardContainer.insertBefore(elements.capturedForBlack, elements.mainBoardContainer.firstChild);
    }
}

/**
 * Atualiza o texto de status do jogo.
 * @param {object} gameState - O objeto de estado retornado por `game.getGameState()`.
 * @param {(title: string, msg: string) => void} showGameOverCallback - Função para mostrar o modal de fim de jogo.
 */
export function updateStatus(gameState, showGameOverCallback) {
    let statusText = '';
    const turn = gameState.turn === 'w' ? 'Brancas' : 'Pretas';

    if (gameState.isGameOver) {
        playSound('gameOver');
        if (gameState.isCheckmate) {
            const winner = gameState.turn === 'w' ? 'Pretas' : 'Brancas';
            statusText = `Xeque-mate! ${winner} vencem.`;
            showGameOverCallback(`Xeque-mate!`, `${winner} vencem.`);
        } else if (gameState.isStalemate) {
            statusText = 'Empate por Afogamento.';
            showGameOverCallback('Empate!', 'O jogo terminou em afogamento.');
        } else if (game.in_threefold_repetition()) {
            statusText = 'Empate por Repetição Tripla.';
            showGameOverCallback('Empate!', 'O jogo terminou por repetição tripla.');
        } else if (gameState.isDraw) {
            statusText = 'Empate.';
            showGameOverCallback('Empate!', 'Material insuficiente ou regra dos 50 movimentos.');
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
 * @param {string} fromSquare - A casa de origem selecionada.
 * @param {object[]} moves - A lista de movimentos válidos.
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

/**
 * Remove todos os destaques de seleção e movimentos válidos do tabuleiro.
 */
export function clearHighlights() {
    document.querySelectorAll('.selected-square').forEach(el => el.classList.remove('selected-square'));
    document.querySelectorAll('.valid-move-marker').forEach(el => el.remove());
}


/**
 * Atualiza o histórico de lances na interface.
 * @param {object[]} history - Histórico detalhado do `game.js`.
 */
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

/**
 * Atualiza a exibição das peças capturadas e a diferença de material.
 * @param {object[]} history - Histórico detalhado do `game.js`.
 */
export function updateCapturedPieces(history) {
    const captured = { w: [], b: [] };
    for (const move of history) {
        if (move.captured) {
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


/**
 * Exibe o modal para o jogador escolher a peça de promoção.
 * @param {'w' | 'b'} color - A cor do peão que está sendo promovido.
 * @param {(pieceType: string) => void} onPromotionSelectCallback - Função a ser chamada com a peça escolhida.
 */
export function showPromotionModal(color, onPromotionSelectCallback) {
    elements.promotionOptions.innerHTML = '';
    const symbols = PIECES[color];

    PROMOTION_PIECES.forEach(type => {
        const button = document.createElement('button');
        button.className = `piece ${color === 'w' ? 'white-piece' : 'black-piece'} text-5xl sm:text-6xl p-3 rounded hover:scale-105 transition-transform`;
        button.textContent = symbols[type];
        button.onclick = () => onPromotionSelectCallback(type);
        elements.promotionOptions.appendChild(button);
    });

    elements.promotionModal.classList.remove('hidden');
}

/**
 * Esconde o modal de promoção.
 */
export function hidePromotionModal() {
    elements.promotionModal.classList.add('hidden');
}


/**
 * Toca um som específico da interface.
 * @param {'move' | 'start' | 'gameOver'} soundType - O tipo de som a tocar.
 */
export function playSound(soundType) {
    initAudio();
    switch (soundType) {
        case 'move':
            audioMove.currentTime = 0;
            audioMove.play();
            break;
        case 'start':
            audioStart.currentTime = 0;
            audioStart.play();
            break;
        case 'gameOver':
            audioGameOver.currentTime = 0;
            audioGameOver.play();
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

/**
 * Atualiza o display da avaliação do Stockfish.
 * @param {string} type - 'cp' (centipawns) ou 'mate'.
 * @param {number} score - O valor da avaliação.
 */
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
