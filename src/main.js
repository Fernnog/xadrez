// src/main.js

import * as ui from './modules/ui.js';
import * as game from './modules/game.js';
import * as engine from './modules/engine.js';
import * as audio from './modules/audio.js';
import * as utils from './modules/utils.js';
// Removemos importação direta de OPENING_FENS pois agora o fluxo é via evento
import { CURRENT_VERSION } from './modules/changelog.js'; 

console.log("[Main] Módulo main.js carregado.");

// Estado da aplicação
let appState = {
    playerColor: 'w',
    skillLevel: 12,
    selectedSquare: null,
    isEngineTurn: false, 
    pendingPromotionMove: null,
};

// --- NOVO ESTADO: Armazena a Abertura Selecionada via Modal ---
let selectedOpeningPgn = ''; 

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
// 2. FUNÇÃO INIT (COM LOGICA DE WIDGET E SYNC v1.0.2)
// ==========================================================

function init() {
    console.log("[Main] Inicializando aplicação...");

    // INICIALIZAÇÃO DO DIAGNÓSTICO (LAYOUT LOGGER)
    // Isso vai monitorar e logar qualquer tremor no tabuleiro/body
    utils.initLayoutLogger();
    
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

    // --- LISTENER DO EXPLORADOR DE ABERTURAS ---
    window.addEventListener('opening-selected', (e) => {
        console.log(`[Main] Abertura definida via Explorer: ${e.detail.name}`);
        selectedOpeningPgn = e.detail.pgn;
        // Não iniciamos o jogo imediatamente, apenas guardamos o PGN para quando o usuário clicar em "Jogar"
    });

    // --- NOVA LÓGICA v1.0.2: Sincronização Live Sync ---
    window.addEventListener('storage', (event) => {
        // Ignora eventos que não sejam do nosso jogo
        if (event.key === 'savedChessGameState') {
            console.log("[Sync] Detectada alteração de estado em outra janela.");
            
            const newState = JSON.parse(event.newValue);
            if (!newState) return;

            // 1. Parar a engine local para evitar conflitos de cálculo se estiver pensando
            engine.stopCalculation();
            appState.isEngineTurn = false; 

            // 2. Carregar o novo PGN vindo do Storage
            game.loadPgn(newState.pgn);
            
            // 3. Atualizar Estado Local
            appState.playerColor = newState.playerColor;
            appState.skillLevel = newState.skillLevel;
            
            // 4. Atualizar UI (Sem tocar som para evitar eco)
            ui.renderBoard(game.getBoard());
            ui.updateStatus(game.getGameState());
            ui.updateMoveHistory(game.getHistory());
            ui.updateCapturedPieces(game.getHistory({verbose: true}));
            
            // 5. Verificar se agora é vez da engine (mas não disparamos o cálculo automaticamente na janela passiva)
            if (!game.isGameOver() && game.getTurn() !== appState.playerColor) {
                 appState.isEngineTurn = true; 
            } else {
                 appState.isEngineTurn = false;
            }

            // Atualiza a barra de avaliação com a nova posição
            engine.requestEvaluation(game.getFen());
        }
    });

    // --- NOVA LÓGICA v1.0.2: Listener para quando o Widget fecha (Modo Cinema) ---
    window.addEventListener('widget-closed', () => {
        console.log("[Main] Widget fechado. Retomando controle e atualizando estado.");
        resumeGame(); // Força recarregamento do último estado salvo
    });

    // --- LÓGICA DE DETECÇÃO DE MODO WIDGET ---
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

    // NOVO: Registro do Service Worker com versionamento via Query String
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register(`./sw.js?v=${CURRENT_VERSION}`)
            .then(reg => console.log(`[ServiceWorker] Registrado com versão: ${CURRENT_VERSION}`, reg))
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

    ui.setupAndDisplayGame(appState.playerColor);

    // --- NOVA LÓGICA DE INÍCIO: Verifica se há PGN do Explorador ---
    if (selectedOpeningPgn && selectedOpeningPgn.trim() !== '') {
        console.log(`[Main] Animando Abertura Selecionada`);
        playOpeningSequence(selectedOpeningPgn);
    } else {
        // Fluxo Padrão (Sem abertura selecionada ou "Standard")
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
    
    // Reseta estado da abertura para garantir um novo começo limpo se desejar
    selectedOpeningPgn = ''; 
    
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
