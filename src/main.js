// src/main.js

/**
 * Ponto de entrada e orquestrador principal da aplicação de xadrez.
 * Responsabilidades:
 * - Gerenciar o estado da aplicação (cor do jogador, nível de dificuldade, etc.).
 * - Inicializar os módulos de UI, Jogo e Motor.
 * - Orquestrar o fluxo do jogo (turno do jogador, turno do motor).
 * - Lidar com as interações do usuário (cliques nos botões, movimentos no tabuleiro).
 * - Gerenciar o salvamento e carregamento do estado do jogo no localStorage.
 */

// Importa funções dos outros módulos (assumindo que eles exportam o necessário)
import * as ui from './modules/ui.js';
import * as game from './modules/game.js';
import * as engine from './modules/engine.js';
import { playSound, audioMove, audioStart, audioGameOver } from './modules/audio.js'; // Supondo um módulo de áudio

// --- Estado da Aplicação ---
let playerColor = 'w';
let stockfishSkillLevel = 12;
let selectedSquare = null;
let pendingPromotionMove = null;
let isEngineTurn = false;
let gameStarted = false;

// --- Inicialização ---

function init() {
    ui.init(handleSquareClick); // Passa a função de callback para cliques no tabuleiro
    engine.initEngine(handleEngineMessage); // Passa a função de callback para mensagens do motor

    // Mapeamento de botões para funções
    const listeners = {
        'playWhiteButton': () => startGame('w'),
        'playBlackButton': () => startGame('b'),
        'resetButton': resetGame,
        'modalResetButton': resetGame,
        'copyPgnButton': () => ui.copyPgn(game.getPgn()),
        'continueGameButton': resumeGame,
        'importPgnButton': importPgnGame,
    };

    for (const id in listeners) {
        document.getElementById(id)?.addEventListener('click', listeners[id]);
    }
    
    ui.checkForSavedGame(localStorage.getItem('chessGameState'));
}

// --- Lógica de Fluxo de Jogo ---

function startGame(chosenColor, pgn = null) {
    game.reset();
    if (pgn && !game.loadPgn(pgn)) {
        alert("PGN inválido. Começando um novo jogo.");
        ui.updatePgnInputValue('');
    }

    playerColor = chosenColor;
    stockfishSkillLevel = ui.getDifficultyLevel();
    isEngineTurn = false;
    selectedSquare = null;
    pendingPromotionMove = null;
    gameStarted = true;

    ui.setupAndDisplayGame(playerColor, game.getHistory());
    playSound(audioStart);
    updateAllDisplays();

    // Se o jogador escolheu as pretas, ou se carregou um PGN onde é a vez das brancas
    if ((!pgn && playerColor === 'b') || (pgn && game.getTurn() === 'w' && playerColor === 'b')) {
        makeBotMove();
    }
}

function resetGame() {
    gameStarted = false;
    game.reset();
    ui.resetUI();
    localStorage.removeItem('chessGameState');
    ui.checkForSavedGame(null);
}

// --- Manipuladores de Eventos ---

/**
 * Lida com cliques nos quadrados do tabuleiro. Chamado pelo módulo UI.
 * @param {string} squareName - O nome do quadrado clicado (ex: "e4").
 */
function handleSquareClick(squareName) {
    if (isEngineTurn || !gameStarted || game.isGameOver()) return;

    if (selectedSquare) {
        // Verifica se é um movimento de promoção válido
        if (game.isPromotionMove(selectedSquare, squareName)) {
            pendingPromotionMove = { from: selectedSquare, to: squareName };
            ui.showPromotionModal(playerColor, handlePromotionSelect);
            selectedSquare = null;
            ui.clearHighlights();
            return;
        }

        // Tenta fazer um movimento normal
        const move = { from: selectedSquare, to: squareName };
        const result = game.makeMove(move);
        selectedSquare = null;
        ui.clearHighlights();

        if (result) {
            processMoveResult(result);
        }
    } else {
        const piece = game.getPiece(squareName);
        if (piece && piece.color === playerColor) {
            selectedSquare = squareName;
            ui.highlightMoves(squareName, game.getValidMoves(squareName));
        }
    }
}

/**
 * Lida com a seleção de uma peça no modal de promoção.
 * @param {string} pieceType - O tipo da peça escolhida ('q', 'r', 'b', ou 'n').
 */
function handlePromotionSelect(pieceType) {
    if (!pendingPromotionMove) return;

    const move = { ...pendingPromotionMove, promotion: pieceType };
    const result = game.makeMove(move);
    pendingPromotionMove = null;
    
    if (result) {
        processMoveResult(result);
    }
}

/**
 * Processa as mensagens recebidas do motor Stockfish.
 * @param {string} message - A mensagem do worker.
 */
function handleEngineMessage(message) {
    if (message.startsWith('bestmove')) {
        isEngineTurn = false;
        ui.setBoardCursor('default');
        
        const bestMoveStr = message.split(' ')[1];
        const move = game.parseMove(bestMoveStr); // Módulo game deve saber converter "e7e8q" para objeto
        const result = game.makeMove(move);

        if (result) {
            processMoveResult(result);
        }
    } else if (message.startsWith('info depth')) {
        const scoreMatch = message.match(/score (cp|mate) (-?\d+)/);
        if (scoreMatch) {
            const type = scoreMatch[1];
            let score = parseInt(scoreMatch[2], 10);
            if (game.getTurn() === 'b' && type === 'cp') {
                score = -score;
            }
            ui.updateEvaluationDisplay(type, score);
        }
    }
}

// --- Funções Auxiliares ---

/**
 * Centraliza as ações a serem tomadas após um lance válido (do jogador ou do motor).
 * @param {object} moveResult - O objeto de resultado do lance retornado por chess.js.
 */
function processMoveResult(moveResult) {
    playSound(audioMove);
    ui.animateMove(moveResult, () => {
        updateAllDisplays();
        saveGameState();

        if (game.isGameOver()) {
            playSound(audioGameOver);
            ui.showGameOverModal(game.getGameOverState());
        } else if (game.getTurn() !== playerColor) {
            makeBotMove();
        } else {
            // Se for a vez do jogador, solicita uma avaliação
            engine.requestEvaluation(game.getFen());
        }
    });
}

function makeBotMove() {
    isEngineTurn = true;
    ui.setBoardCursor('wait');
    // Atraso para dar uma sensação mais natural
    setTimeout(() => {
        engine.requestMove(game.getFen(), stockfishSkillLevel);
    }, 500);
}

function updateAllDisplays() {
    const gameState = {
        board: game.getBoard(),
        history: game.getHistory({ verbose: true }),
        turn: game.getTurn(),
        isGameOver: game.isGameOver(),
        inCheck: game.inCheck(),
        gameOverState: game.getGameOverState(),
    };
    ui.renderBoard(gameState.board);
    ui.updateStatus(gameState);
    ui.updateMoveHistory(game.getHistory());
    ui.updateCapturedPieces(gameState.history);
}

// --- Gerenciamento de Estado (LocalStorage) ---

function saveGameState() {
    if (!gameStarted) return;
    const state = {
        pgn: game.getPgn(),
        playerColor: playerColor,
        skillLevel: stockfishSkillLevel,
    };
    localStorage.setItem('chessGameState', JSON.stringify(state));
}

function resumeGame() {
    const savedState = JSON.parse(localStorage.getItem('chessGameState'));
    if (savedState) {
        ui.setDifficultyLevel(savedState.skillLevel);
        startGame(savedState.playerColor, savedState.pgn);
    }
}

function importPgnGame() {
    const pgn = ui.getPgnInputValue();
    if (pgn) {
        // Ao importar, assumimos que o jogador quer jogar com as peças que devem mover
        const tempGame = new Chess();
        if (tempGame.load_pgn(pgn)) {
            const nextPlayer = tempGame.turn() === 'w' ? 'w' : 'b';
            startGame(nextPlayer, pgn);
        } else {
            alert('PGN inválido ou incompleto.');
        }
    }
}

// --- Ponto de Entrada da Aplicação ---
document.addEventListener('DOMContentLoaded', init);
