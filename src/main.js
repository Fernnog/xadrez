// src/main.js

import * as ui from './modules/ui.js';
import * as game from './modules/game.js';
import * as engine from './modules/engine.js';
import * as audio from './modules/audio.js'; // <-- IMPORTAÇÃO CORRIGIDA
import * as utils from './modules/utils.js'; // <-- NOVA IMPORTAÇÃO

// Estado da aplicação
let appState = {
    playerColor: 'w',
    skillLevel: 12,
    selectedSquare: null,
    isEngineTurn: false,
    pendingPromotionMove: null,
};

function init() {
    // Registra os handlers da UI (funções que main.js provê para a UI chamar)
    ui.registerUIHandlers({
        onPlayWhite: () => startGame('w'),
        onPlayBlack: () => startGame('b'),
        onResetGame: resetGame,
        onCopyPgn: () => utils.copyPgn(game.getPgn()),
        onContinueGame: resumeGame,
        onImportPgn: importPgnGame,
        onSquareClick: handleSquareClick,
        onPromotionSelect: handlePromotion,
    });
    
    engine.initEngine(handleEngineMessage);
    checkForSavedGame();
}

function startGame(chosenColor) {
    audio.initAudio(); // Inicializa o áudio no primeiro clique do usuário
    utils.clearGameState();
    
    appState.playerColor = chosenColor;
    appState.skillLevel = ui.getSkillLevel();
    
    game.reset();
    ui.setupAndDisplayGame(appState.playerColor);
    updateAllDisplays();

    if (game.getTurn() !== appState.playerColor) {
        requestEngineMove();
    }
}

function handleSquareClick(squareName) {
    if (game.isGameOver() || appState.isEngineTurn) return;
    
    // Lógica completa de clique (seleção, movimento, promoção)
    // ... (esta lógica é complexa, vamos simplificar por enquanto)

    if (appState.selectedSquare) {
        const move = { from: appState.selectedSquare, to: squareName };
        
        if (game.isPromotionMove(appState.selectedSquare, squareName)) {
            const tempMove = { ...move, promotion: 'q' };
            if (game.isValidMove(tempMove)) {
                appState.pendingPromotionMove = move;
                ui.clearHighlights();
                ui.showPromotionModal(appState.playerColor);
                appState.selectedSquare = null;
                return;
            }
        }
        
        const result = game.makeMove(move);
        ui.clearHighlights();
        
        if (result) {
            audio.playSound(audio.audioMove);
            updateAllDisplays();
            utils.saveGameState(game, appState.playerColor, appState.skillLevel);
            if (!game.isGameOver()) {
                requestEngineMove();
            }
        }
        appState.selectedSquare = null;

    } else {
        const piece = game.getPiece(squareName);
        if (piece && piece.color === appState.playerColor) {
            appState.selectedSquare = squareName;
            const validMoves = game.getValidMoves(squareName);
            ui.highlightMoves(squareName, validMoves);
        } else {
            appState.selectedSquare = null;
        }
    }
}

function handlePromotion(pieceType) {
    ui.hidePromotionModal();
    if (!appState.pendingPromotionMove) return;

    const move = { ...appState.pendingPromotionMove, promotion: pieceType };
    const result = game.makeMove(move);
    appState.pendingPromotionMove = null;

    if (result) {
        audio.playSound(audio.audioMove);
        updateAllDisplays();
        utils.saveGameState(game, appState.playerColor, appState.skillLevel);
        if (!game.isGameOver()) {
            requestEngineMove();
        }
    }
}

function handleEngineMessage(message) {
    if (message.startsWith('bestmove')) {
        const bestMoveStr = message.split(' ')[1];
        const move = game.makeMove(bestMoveStr);
        
        if (move) {
            audio.playSound(audio.audioMove);
            // ui.animateMove(move, () => { ... });
            updateAllDisplays();
            engine.requestEvaluation(game.getFen());
            utils.saveGameState(game, appState.playerColor, appState.skillLevel);
        }
        appState.isEngineTurn = false;
        ui.setBoardCursor('pointer');

    } else if (message.startsWith("info depth")) {
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

function requestEngineMove() {
    appState.isEngineTurn = true;
    ui.setBoardCursor('wait');
    setTimeout(() => {
        engine.requestMove(game.getFen(), appState.skillLevel);
    }, 250);
}

function updateAllDisplays() {
    const isGameOver = game.isGameOver();
    ui.renderBoard(game.getBoard());
    ui.updateStatus(game);
    ui.updateMoveHistory(game.getHistory());
    ui.updateCapturedPieces(game.getHistory({verbose: true}));

    if (isGameOver) {
        audio.playSound(audio.audioGameOver);
        utils.clearGameState();
    }
}

function resetGame() {
    utils.clearGameState();
    ui.showColorSelectionModal();
    checkForSavedGame();
}

function checkForSavedGame() {
    const savedState = utils.loadGameState();
    if(savedState) {
        ui.showContinueGameOption(true);
    } else {
        ui.showContinueGameOption(false);
    }
}

function resumeGame() {
    const savedState = utils.loadGameState();
    if (savedState && game.loadPgn(savedState.pgn)) {
        audio.initAudio();
        appState.playerColor = savedState.playerColor;
        appState.skillLevel = savedState.skillLevel;
        ui.setupAndDisplayGame(appState.playerColor);
        updateAllDisplays();
    }
}

function importPgnGame() {
    const pgn = ui.getPgnInput();
    if (pgn && game.loadPgn(pgn)) {
        audio.initAudio();
        const turn = game.getTurn();
        // Assume o jogador controla a cor do turno atual no PGN
        startGame(turn);
    } else {
        alert("PGN inválido!");
    }
}

// Inicia a aplicação
document.addEventListener('DOMContentLoaded', init);
