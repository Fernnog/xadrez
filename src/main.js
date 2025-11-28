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

// ==========================================================
// 1. FUNÇÕES DE CALLBACK
// ==========================================================

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

function handleUndo() {
    if (appState.isEngineTurn) {
        engine.stopCalculation();
        appState.isEngineTurn = false;
        ui.setBoardCursor('pointer');
    }
    
    const historyLength = game.getHistory().length;
    
    if (historyLength >= 2) {
        game.undoMove(); 
        game.undoMove(); 
        console.log("[Main] Desfeito o lance da IA e do Humano.");
    } else if (historyLength === 1) {
        game.undoMove(); 
        console.log("[Main] Desfeito o último lance (apenas um no histórico).");
    } else {
        console.log("[Main] Nenhum lance para desfazer.");
        ui.showToast("Nenhum lance para desfazer.", "error"); // UX Upgrade
        return;
    }
    
    appState.selectedSquare = null;
    ui.clearHighlights();
    utils.saveGameState(game, appState.playerColor, appState.skillLevel);
    updateAllDisplays();
    
    engine.requestEvaluation(game.getFen());
    ui.setBoardCursor('pointer');
}

// ==========================================================
// 2. FUNÇÃO INIT
// ==========================================================

function init() {
    console.log("[Main] Inicializando aplicação...");
    
    // Registrar Handlers da UI com lógica de UX (Toasts)
    ui.registerUIHandlers({
        onPlayWhite: () => { console.log("[UI] Jogar Brancas"); startGame('w'); },
        onPlayBlack: () => { console.log("[UI] Jogar Pretas"); startGame('b'); },
        onResetGame: resetGame,
        onContinueGame: resumeGame,
        onImportPgn: importPgnGame,
        onSquareClick: handleSquareClick,
        onPromotionSelect: handlePromotion,
        onUndo: handleUndo,
        
        // Handler Atualizado: Copiar PGN com Feedback
        onCopyPgn: () => {
            utils.copyPgn(
                game.getPgn(),
                (msg) => ui.showToast(msg, 'success'),
                (msg) => ui.showToast(msg, 'error')
            );
        },
        
        // Handler Novo: Download DOC com Diagrama
        onDownloadDoc: () => {
            const pgn = game.getPgn();
            if (!pgn) {
                ui.showToast('Não há lances para baixar.', 'error');
                return;
            }
            const board = game.getBoard(); // Obtém estado atual para o diagrama
            utils.downloadHistoryAsDoc(pgn, board);
            ui.showToast('Download do DOC iniciado!', 'success');
        }
    });
    
    engine.initEngine(handleEngineMessage);
    checkForSavedGame();

    // Registro do Service Worker para Cache (Feature 2.a)
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('[ServiceWorker] Registrado.', reg))
            .catch(err => console.error('[ServiceWorker] Falha.', err));
    }
}

// ==========================================================
// 3. FUNÇÕES PRINCIPAIS E ANIMAÇÃO
// ==========================================================

// Função auxiliar para pausa (delay) na animação
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Nova lógica de animação de abertura
async function playOpeningSequence(pgn) {
    // 1. Carrega o PGN na engine apenas para extrair a lista de movimentos limpa
    game.loadPgn(pgn);
    const history = game.getHistory(); // Obtém lista de lances (ex: ['e4', 'c5', ...])
    
    // 2. Reseta o tabuleiro visual para o início
    game.reset();
    ui.renderBoard(game.getBoard());
    ui.updateStatus(game.getGameState());
    ui.updateMoveHistory([]); // Limpa histórico visual
    
    // Bloqueia interações durante a animação
    appState.isEngineTurn = true; 
    ui.setBoardCursor('wait');

    // 3. Loop de animação
    for (const move of history) {
        await sleep(800); // Espera 800ms entre lances (ajustável)
        
        game.makeMove(move);
        audio.playSound(audio.audioMove);
        
        // Atualiza UI passo a passo
        updateAllDisplays();
    }

    // 4. Animação finalizada: Libera o jogo
    appState.isEngineTurn = (game.getTurn() !== appState.playerColor);
    
    if (!game.isGameOver()) {
        engine.requestEvaluation(game.getFen());
    }

    if (appState.isEngineTurn) {
        requestEngineMove();
    } else {
        ui.setBoardCursor('pointer');
    }
}

function startGame(chosenColor) {
    console.log(`[Main] Iniciando jogo. Cor: ${chosenColor}`);
    audio.initAudio();
    utils.clearGameState();
    
    engine.resetEngineState(); 
    
    appState.playerColor = chosenColor;
    appState.skillLevel = ui.getSkillLevel();
    appState.isEngineTurn = false; 
    
    game.reset(); 

    const openingKey = ui.getOpeningKey();
    const openingData = OPENING_FENS[openingKey];
    
    ui.setupAndDisplayGame(appState.playerColor);

    // Lógica condicional: Se tem PGN de abertura, anima. Se não, inicia normal.
    if (openingKey !== 'standard' && openingData && openingData.pgn) {
        console.log(`[Main] Animando Abertura: ${openingData.name}`);
        // Inicia a animação (assíncrona)
        playOpeningSequence(openingData.pgn);
    } else {
        // Fluxo padrão (sem animação, ou apenas FEN carregado anteriormente se necessário)
        if (openingKey !== 'standard' && openingData && openingData.fen && !openingData.pgn) {
             game.loadFen(openingData.fen);
        }

        updateAllDisplays();

        if (!game.isGameOver()) {
            engine.requestEvaluation(game.getFen());
        }

        if (game.getTurn() !== appState.playerColor) {
            requestEngineMove(true); 
        } else {
            ui.setBoardCursor('pointer'); 
        }
    }
}

function handleEngineMessage(message) {
    if (message.startsWith('bestmove')) {
        if (!appState.isEngineTurn) return;

        const bestMoveStr = message.split(' ')[1];
        const move = game.makeMove(bestMoveStr);
        
        if (move) {
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
    setTimeout(() => {
        if (isStartingMove) {
            engine.requestMove(game.getFen(), appState.skillLevel, 50); 
        } else {
            engine.requestMove(game.getFen(), appState.skillLevel);
        }
    }, 250);
}

function updateAllDisplays() {
    const gameState = game.getGameState();
    ui.renderBoard(game.getBoard());
    ui.updateStatus(gameState);
    ui.updateMoveHistory(game.getHistory());
    ui.updateCapturedPieces(game.getHistory({verbose: true}));

    if (gameState.isGameOver) {
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
        engine.resetEngineState();
        
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
        engine.resetEngineState(); 
        
        const turn = game.getTurn();
        appState.playerColor = turn; 
        appState.isEngineTurn = false;
        
        ui.setupAndDisplayGame(appState.playerColor);
        updateAllDisplays();
        engine.requestEvaluation(game.getFen());
        ui.setBoardCursor('pointer');
        
        ui.showToast("Jogo importado com sucesso!", "success");
    } else {
        ui.showToast("PGN inválido!", "error");
    }
}

document.addEventListener('DOMContentLoaded', init);