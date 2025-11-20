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
        onUndo: handleUndo,
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

    // --- LÓGICA DE ABERTURA MODIFICADA ---
    const openingKey = ui.getOpeningKey();
    const openingData = OPENING_FENS[openingKey];
    
    if (openingKey !== 'standard' && openingData && openingData.pgn) {
        // Tentamos carregar PGN para obter o histórico completo
        if (!game.loadPgn(openingData.pgn)) {
            console.error("[Main] Falha ao carregar PGN da abertura. Tentando FEN...");
            // Fallback para FEN
            if (!game.loadFen(openingData.fen)) {
                 console.error("[Main] Falha ao carregar FEN. Resetando para padrão.");
                 game.reset(); 
            }
        } else {
            console.log(`[Main] Jogo iniciado com a abertura: ${openingData.name}`);
        }
    } 
    // ------------------------------------
    
    ui.setupAndDisplayGame(appState.playerColor);
    updateAllDisplays();

    // 1. Inicia a avaliação imediata (para feedback visual)
    if (!game.isGameOver()) {
        engine.requestEvaluation(game.getFen());
    }

    // 2. Verifica se é a vez da IA
    if (game.getTurn() !== appState.playerColor) {
        console.log("[Main] É a vez da IA. Solicitando lance...");
        
        // Chamamos requestEngineMove com tempo fixo (50ms) para forçar o primeiro lance da IA.
        requestEngineMove(true); 
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
            
            // MELHORIA UX: Inverte o score se o jogador for preto, para exibir a vantagem do ponto de vista do jogador.
            if (appState.playerColor === 'b' && type === 'cp') {
                score = -score;
            }
            
            ui.updateEvaluationDisplay(type, score);
        }
    }
}

function requestEngineMove(isStartingMove = false) {
    appState.isEngineTurn = true; 
    ui.setBoardCursor('wait');
    
    console.log("[Main] Vez da IA. Aguardando cálculo...");
    
    // Pequeno delay visual
    setTimeout(() => {
        if (isStartingMove) {
            // Se for o lance inicial, pedimos um 'movetime' muito baixo (50ms) para garantir a jogada imediata.
            engine.requestMove(game.getFen(), appState.skillLevel, 50); 
        } else {
            // Para lances normais, usamos o padrão (depth 15)
            engine.requestMove(game.getFen(), appState.skillLevel);
        }
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

/**
 * Manipula a ação de Desfazer (Undo).
 * Desfaz o último par de lances (IA + Humano) ou apenas o último lance do Humano.
 */
function handleUndo() {
    if (appState.isEngineTurn) {
        // 1. Se a IA estiver pensando, pare imediatamente
        engine.stopCalculation();
        appState.isEngineTurn = false;
        ui.setBoardCursor('pointer');
    }
    
    const historyLength = game.getHistory().length;
    
    // 2. Lógica de Desfazer: Se o jogo tem pelo menos 2 lances (IA+Humano), desfaz 2. Senão, desfaz 1.
    if (historyLength >= 2) {
        game.undoMove(); // Desfaz o lance da IA
        game.undoMove(); // Desfaz o lance do Humano
        console.log("[Main] Desfeito o lance da IA e do Humano.");
    } else if (historyLength === 1) {
        game.undoMove(); // Desfaz apenas o lance do Humano
        console.log("[Main] Desfeito o último lance (apenas um no histórico).");
    } else {
        console.log("[Main] Nenhum lance para desfazer.");
        return;
    }
    
    // 3. Atualiza o estado
    appState.selectedSquare = null;
    ui.clearHighlights();
    utils.saveGameState(game, appState.playerColor, appState.skillLevel);
    updateAllDisplays();
    
    // 4. Solicita nova avaliação para a posição revertida
    engine.requestEvaluation(game.getFen());
    
    // 5. Garante que o usuário pode jogar
    ui.setBoardCursor('pointer');
}

document.addEventListener('DOMContentLoaded', init);