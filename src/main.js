// src/main.js

import * as ui from './modules/ui.js';
import * as game from './modules/game.js';
import * as engine from './modules/engine.js';
import * as audio from './modules/audio.js';
import * as utils from './modules/utils.js';
import { OPENING_FENS } from './modules/config.js'; // NOVO: Importa as FENs

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
    
    // 1. SEMPRE RESETAMOS ANTES DE TENTAR CARREGAR O FEN
    game.reset(); 

    // --- LÓGICA DE ABERTURA ---
    const openingKey = ui.getOpeningKey();
    const openingData = OPENING_FENS[openingKey];
    
    let gameLoadedSuccessfully = false;

    if (openingKey !== 'standard' && openingData) {
        // Tentativa de carregar o FEN
        gameLoadedSuccessfully = game.loadFen(openingData.fen);
        if (gameLoadedSuccessfully) {
            console.log(`[Main] Jogo iniciado com a abertura: ${openingData.name}`);
        } else {
            console.error("[Main] Falha ao carregar FEN da abertura. Resetando para padrão.");
            game.reset(); // Volta para o padrão se falhar
        }
    } 
    // -------------------------
    
    ui.setupAndDisplayGame(appState.playerColor);
    updateAllDisplays();

    // 2. MELHORIA UX CRÍTICA: Solicita avaliação da posição inicial,
    // o que atualiza o display e confirma que o motor está ativo.
    if (!game.isGameOver()) {
        engine.requestEvaluation(game.getFen());
    }

    // 3. Verifica se é a vez da IA
    if (game.getTurn() !== appState.playerColor) {
        console.log("[Main] É a vez da IA. Solicitando lance...");
        requestEngineMove();
    } else {
        // Se for a vez do Humano, garante que o cursor está pronto
        ui.setBoardCursor('pointer'); 
        console.log("[Main] É a vez do Humano. Aguardando clique...");
    }
}

function handleSquareClick(squareName) {
    // Se for a vez da IA, bloqueia cliques do humano
    if (game.isGameOver() || appState.isEngineTurn) {
        return;
    }
    
    if (appState.selectedSquare) {
        const move = { from: appState.selectedSquare, to: squareName };
        
        // Verifica Promoção
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
            audio.playSound(audio.audioMove); // USANDO O OBJETO DO MÓDULO AUDIO
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
        audio.playSound(audio.audioMove); // USANDO O OBJETO DO MÓDULO AUDIO
        updateAllDisplays();
        utils.saveGameState(game, appState.playerColor, appState.skillLevel);
        if (!game.isGameOver()) {
            requestEngineMove();
        }
    }
}

function handleEngineMessage(message) {
    if (message.startsWith('bestmove')) {
        // Se recebermos um bestmove, mas a flag isEngineTurn for falsa,
        // significa que foi apenas o resultado da análise de avaliação. Ignoramos o lance.
        if (!appState.isEngineTurn) {
            console.log("[Main] bestmove recebido de análise/avaliação. Ignorando lance físico.");
            return;
        }

        const bestMoveStr = message.split(' ')[1];
        const move = game.makeMove(bestMoveStr);
        
        if (move) {
            console.log(`[Main] IA jogou: ${bestMoveStr}`);
            audio.playSound(audio.audioMove); // USANDO O OBJETO DO MÓDULO AUDIO
            updateAllDisplays();
            utils.saveGameState(game, appState.playerColor, appState.skillLevel);
            
            // 1. Desligamos a flag POIS A VEZ AGORA É DO HUMANO
            appState.isEngineTurn = false;
            ui.setBoardCursor('pointer');

            // 2. Solicitamos a avaliação DEPOIS de desligar a flag.
            if (!game.isGameOver()) {
                engine.requestEvaluation(game.getFen());
            }
        }
    } else if (message.startsWith("info depth")) {
        // Atualiza a barra de avaliação visualmente enquanto pensa
        const scoreMatch = message.match(/score (cp|mate) (-?\d+)/);
        if (scoreMatch) {
            const type = scoreMatch[1];
            let score = parseInt(scoreMatch[2], 10);
            // Ajusta pontuação para perspectiva das brancas
            if (game.getTurn() === 'b' && type === 'cp') {
                score = -score;
            }
            ui.updateEvaluationDisplay(type, score);
        }
    }
}

function requestEngineMove() {
    appState.isEngineTurn = true; // Liga o semáforo: "Próximo bestmove é um lance real"
    ui.setBoardCursor('wait');
    
    console.log("[Main] Vez da IA. Aguardando cálculo...");
    
    // Pequeno delay visual
    setTimeout(() => {
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
        audio.playSound(audio.audioGameOver); // USANDO O OBJETO DO MÓDULO AUDIO
        utils.clearGameState();
        appState.isEngineTurn = false; // Garante que para de jogar
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
        
        // Importante: definir turno correto ao carregar
        appState.isEngineTurn = (game.getTurn() !== appState.playerColor);
        
        ui.setupAndDisplayGame(appState.playerColor);
        updateAllDisplays();
        
        // Solicita a avaliação da posição ao resumir
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
        // Assume que quem importa quer continuar jogando contra a engine
        appState.playerColor = turn; 
        appState.isEngineTurn = false;
        
        ui.setupAndDisplayGame(appState.playerColor);
        updateAllDisplays();
        
        // Avalia a posição importada
        engine.requestEvaluation(game.getFen());
        ui.setBoardCursor('pointer');
    } else {
        alert("PGN inválido!");
    }
}

document.addEventListener('DOMContentLoaded', init);