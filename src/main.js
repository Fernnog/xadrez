// src/main.js

import * as ui from './modules/ui.js';
import * as game from './modules/game.js';
import * as engine from './modules/engine.js';
import * as audio from './modules/audio.js';
import * as utils from './modules/utils.js';
import { OPENING_FENS } from './modules/config.js';

console.log("[Main] Módulo main.js carregado.");

// Estado da aplicação
let appState = {
    playerColor: 'w',
    skillLevel: 12,
    selectedSquare: null,
    isEngineTurn: false, 
    pendingPromotionMove: null,
};

function init() {
    console.log("[Main] Inicializando aplicação...");
    ui.registerUIHandlers({
        onPlayWhite: () => { console.log("[UI] Botão Jogar Brancas clicado"); startGame('w'); },
        onPlayBlack: () => { console.log("[UI] Botão Jogar Pretas clicado"); startGame('b'); },
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
    console.log(`[Main] Iniciando jogo. Cor do jogador: ${chosenColor}`);
    audio.initAudio();
    utils.clearGameState();
    
    appState.playerColor = chosenColor;
    appState.skillLevel = ui.getSkillLevel();
    appState.isEngineTurn = false; 
    
    game.reset(); 

    // --- LÓGICA DE ABERTURA ---
    const openingKey = ui.getOpeningKey();
    const openingData = OPENING_FENS[openingKey];
    
    let gameLoadedSuccessfully = false;

    if (openingKey !== 'standard' && openingData) {
        gameLoadedSuccessfully = game.loadFen(openingData.fen);
        if (gameLoadedSuccessfully) {
            console.log(`[Main] Jogo iniciado com a abertura: ${openingData.name}`);
        } else {
            console.error("[Main] Falha ao carregar FEN da abertura. Resetando para padrão.");
            game.reset(); 
        }
    } 
    // -------------------------
    
    ui.setupAndDisplayGame(appState.playerColor);
    updateAllDisplays();

    // 2. SOLICITA AVALIAÇÃO IMEDIATA (para feedback visual)
    if (!game.isGameOver()) {
        engine.requestEvaluation(game.getFen());
    }

    // 3. Verifica se é a vez da IA (o engine.js garante que o comando será executado quando pronto)
    if (game.getTurn() !== appState.playerColor) {
        console.log("[Main] É a vez da IA. Solicitando lance...");
        requestEngineMove();
    } else {
        ui.setBoardCursor('pointer'); 
        console.log("[Main] É a vez do Humano. Aguardando clique...");
    }
}

function handleSquareClick(squareName) {
    if (game.isGameOver() || appState.isEngineTurn) {
        return;
    }
    
    if (appState.selectedSquare) {
        const move = { from: appState.selectedSquare, to: squareName };
        
        if (game.isPromotionMove(appState.selectedSquare, squareName)) {
             appState.pendingPromotionMove = move;
             ui.clearHighlights();
             ui.showPromotionModal(appState.playerColor);
             appState.selectedSquare = null;
             return;
        }
        
        const result = game.makeMove(move);
        ui.clearHighlights();
        
        if (result) {
            console.log(`[Main] Humano jogou: ${move.from}-${move.to}`);
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
        if (!appState.isEngineTurn) {
            console.log("[Main] bestmove recebido de análise/avaliação. Ignorando lance físico.");
            return;
        }

        const bestMoveStr = message.split(' ')[1];
        const move = game.makeMove(bestMoveStr);
        
        if (move) {
            console.log(`[Main] IA jogou: ${bestMoveStr}`);
            audio.playSound(audio.audioMove);
            updateAllDisplays();
            utils.saveGameState(game, appState.playerColor, appState.skillLevel);
            
            appState.isEngineTurn = false;
            ui.setBoardCursor('pointer');

            if (!game.isGameOver()) {
                engine.requestEvaluation(game.getFen());
            }
        }
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
    
    console.log("[Main] Vez da IA. Aguardando cálculo...");
    
    // Pequeno delay visual
    setTimeout(() => {
        // Envia o comando, a Engine decide quando executá-lo via fila
        engine.requestMove(game.getFen(), appState.skillLevel);
    }, 250);
}

function updateAllDisplays() {
    const gameState = game.getGameState();
    const isGameOver = gameState.isGameOver;
    ui.renderBoard(game.getBoard());
    ui.updateStatus(gameState);
    ui.updateMoveHistory(game.getHistory());
    ui.updateCapturedPieces(game.getHistory({verbose: true}));

    if (isGameOver) {
        audio.playSound(audio.audioGameOver);
        utils.clearGameState();
        appState.isEngineTurn = false;
    }
}

function resetGame() {
    utils.clearGameState();
    ui.showColorSelectionModal();
    checkForSavedGame();
}

function checkForSavedGame() {
    const savedState = utils.loadGameState();
    ui.showContinueGameOption(!!savedState);
}

function resumeGame() {
    const savedState = utils.loadGameState();
    if (savedState && game.loadPgn(savedState.pgn)) {
        audio.initAudio();
        appState.playerColor = savedState.playerColor;
        appState.skillLevel = savedState.skillLevel;
        
        appState.isEngineTurn = (game.getTurn() !== appState.playerColor);
        
        ui.setupAndDisplayGame(appState.playerColor);
        updateAllDisplays();
        
        engine.requestEvaluation(game.getFen());
        
        if (appState.isEngineTurn) {
             requestEngineMove();
        } else {
             ui.setBoardCursor('pointer'); 
        }
    }
}

function importPgnGame() {
    const pgn = ui.getPgnInput();
    if (pgn && game.loadPgn(pgn)) {
        audio.initAudio();
        const turn = game.getTurn();
        appState.playerColor = turn; 
        appState.isEngineTurn = false;
        
        ui.setupAndDisplayGame(appState.playerColor);
        updateAllDisplays();
        
        engine.requestEvaluation(game.getFen());
        ui.setBoardCursor('pointer');
    } else {
        alert("PGN inválido!");
    }
}

document.addEventListener('DOMContentLoaded', init);