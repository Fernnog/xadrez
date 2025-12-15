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
        ui.showToast("Nenhum lance para desfazer.", "error");
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
// 2. FUNÇÃO INIT (COM LOGICA DE WIDGET ATUALIZADA)
// ==========================================================

function init() {
    console.log("[Main] Inicializando aplicação...");
    
    // Registrar Handlers da UI
    ui.registerUIHandlers({
        onPlayWhite: () => { console.log("[UI] Jogar Brancas"); startGame('w'); },
        onPlayBlack: () => { console.log("[UI] Jogar Pretas"); startGame('b'); },
        onResetGame: resetGame,
        onContinueGame: resumeGame,
        onImportPgn: importPgnGame,
        onSquareClick: handleSquareClick,
        onPromotionSelect: handlePromotion,
        onUndo: handleUndo,
        
        onCopyPgn: () => {
            utils.copyPgn(
                game.getPgn(),
                (msg) => ui.showToast(msg, 'success'),
                (msg) => ui.showToast(msg, 'error')
            );
        },
        
        onDownloadDoc: () => {
            const pgn = game.getPgn();
            if (!pgn) {
                ui.showToast('Não há lances para baixar.', 'error');
                return;
            }
            const board = game.getBoard();
            utils.downloadHistoryAsDoc(pgn, board);
            ui.showToast('Download do DOC iniciado!', 'success');
        }
    });
    
    engine.initEngine(handleEngineMessage);

    // --- NOVA LÓGICA: Detecção de Modo Widget e Auto-Resume ---
    const urlParams = new URLSearchParams(window.location.search);
    const isWidgetMode = urlParams.get('mode') === 'widget';

    if (isWidgetMode) {
        document.body.classList.add('widget-mode');
        console.log("[Main] Modo Widget Detectado via URL.");

        // Verifica imediatamente se há um jogo para continuar
        const savedState = utils.loadGameState();
        
        if (savedState) {
            console.log("[Main] Estado salvo encontrado. Iniciando Auto-Resume no Widget.");
            
            // ATENÇÃO: Chamamos resumeGame() diretamente, pulando o checkForSavedGame() e o modal
            resumeGame();
            
            // Interrompe o restante da inicialização padrão para não abrir o modal de menu
            return; 
        } else {
            console.warn("[Main] Modo Widget ativo, mas sem jogo salvo. Mostrando menu padrão.");
        }
    }
    // ------------------------------------------------------------

    // Fluxo Padrão (só executa se não entrou no return acima)
    checkForSavedGame();

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('[ServiceWorker] Registrado.', reg))
            .catch(err => console.error('[ServiceWorker] Falha.', err));
    }
}

// ==========================================================
// 3. FUNÇÕES PRINCIPAIS E ANIMAÇÃO
// ==========================================================

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function playOpeningSequence(pgn) {
    game.loadPgn(pgn);
    const history = game.getHistory();
    
    game.reset();
    ui.renderBoard(game.getBoard());
    ui.updateStatus(game.getGameState());
    ui.updateMoveHistory([]);
    
    appState.isEngineTurn = true; 
    ui.setBoardCursor('wait');

    for (const move of history) {
        await sleep(800);
        
        game.makeMove(move);
        audio.playSound(audio.audioMove);
        updateAllDisplays();
    }

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

    if (openingKey !== 'standard' && openingData && openingData.pgn) {
        console.log(`[Main] Animando Abertura: ${openingData.name}`);
        playOpeningSequence(openingData.pgn);
    } else {
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
        console.log("[Main] Jogo resumido com sucesso.");
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
