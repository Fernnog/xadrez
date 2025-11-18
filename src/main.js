// src/main.js

import * as ui from './modules/ui.js';
import * as game from './modules/game.js';
import * as engine from './modules/engine.js';
import * as audio from './modules/audio.js';
import * as utils from './modules/utils.js';

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
    console.log(`[Main] Nível de habilidade definido para: ${appState.skillLevel}`);
    
    game.reset();
    ui.setupAndDisplayGame(appState.playerColor);
    updateAllDisplays();

    if (game.getTurn() !== appState.playerColor) {
        console.log("[Main] É a vez da IA (Pretas). Solicitando lance...");
        requestEngineMove();
    } else {
        console.log("[Main] É a vez do Humano (Brancas). Aguardando clique...");
    }
}

function handleSquareClick(squareName) {
    if (game.isGameOver() || appState.isEngineTurn) {
        console.log("[Main] Clique ignorado (Jogo acabou ou vez da IA).");
        return;
    }
    
    console.log(`[Main] Casa clicada: ${squareName}`);

    if (appState.selectedSquare) {
        const move = { from: appState.selectedSquare, to: squareName };
        
        // Verifica Promoção
        if (game.isPromotionMove(appState.selectedSquare, squareName)) {
            const tempMove = { ...move, promotion: 'q' };
            if (game.isValidMove && game.isValidMove(tempMove)) { // Verifica se isValidMove existe antes
                appState.pendingPromotionMove = move;
                ui.clearHighlights();
                ui.showPromotionModal(appState.playerColor);
                appState.selectedSquare = null;
                return;
            }
             // Fallback se isValidMove não existir (versões antigas do chess.js ou game.js incompleto)
             // Assumimos que getValidMoves já filtrou.
             appState.pendingPromotionMove = move;
             ui.clearHighlights();
             ui.showPromotionModal(appState.playerColor);
             appState.selectedSquare = null;
             return;
        }
        
        console.log(`[Main] Tentando movimento: ${JSON.stringify(move)}`);
        const result = game.makeMove(move);
        ui.clearHighlights();
        
        if (result) {
            console.log("[Main] Movimento VÁLIDO realizado.");
            audio.playSound(audio.audioMove); // Tenta tocar som via módulo audio (se exportado assim) ou ui.playSound
            // Se audio.audioMove não funcionar, tente: ui.playSound('move');
            
            updateAllDisplays();
            utils.saveGameState(game, appState.playerColor, appState.skillLevel);
            
            if (!game.isGameOver()) {
                requestEngineMove();
            } else {
                console.log("[Main] Jogo terminou após lance do humano.");
            }
        } else {
            console.log("[Main] Movimento INVÁLIDO.");
        }
        appState.selectedSquare = null;

    } else {
        // Seleção de peça
        const piece = game.getPiece(squareName);
        if (piece && piece.color === appState.playerColor) {
            console.log(`[Main] Peça selecionada em ${squareName}`);
            appState.selectedSquare = squareName;
            const validMoves = game.getValidMoves(squareName);
            ui.highlightMoves(squareName, validMoves);
        } else {
            appState.selectedSquare = null;
        }
    }
}

function handlePromotion(pieceType) {
    console.log(`[Main] Promoção selecionada: ${pieceType}`);
    ui.hidePromotionModal();
    if (!appState.pendingPromotionMove) return;

    const move = { ...appState.pendingPromotionMove, promotion: pieceType };
    const result = game.makeMove(move);
    appState.pendingPromotionMove = null;

    if (result) {
        ui.playSound('move'); // Usando via UI para garantir
        updateAllDisplays();
        utils.saveGameState(game, appState.playerColor, appState.skillLevel);
        if (!game.isGameOver()) {
            requestEngineMove();
        }
    }
}

function handleEngineMessage(message) {
    // console.log(`[Engine Msg] ${message}`); // Comentado para não poluir demais, descomente se necessário
    
    if (message.startsWith('bestmove')) {
        console.log(`[Main] Engine respondeu com bestmove: ${message}`);
        const bestMoveStr = message.split(' ')[1];
        const move = game.makeMove(bestMoveStr);
        
        if (move) {
            console.log(`[Main] Movimento da IA aplicado: ${bestMoveStr}`);
            ui.playSound('move'); 
            updateAllDisplays();
            engine.requestEvaluation(game.getFen());
            utils.saveGameState(game, appState.playerColor, appState.skillLevel);
        } else {
            console.error(`[Main ERROR] Movimento da IA inválido ou falhou: ${bestMoveStr}`);
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
    console.log("[Main] Solicitando movimento da Engine...");
    appState.isEngineTurn = true;
    ui.setBoardCursor('wait');
    
    // Pequeno delay para a UI renderizar antes de bloquear (se não usar Worker corretamente)
    setTimeout(() => {
        const fen = game.getFen();
        console.log(`[Main] Enviando FEN para Engine: ${fen}`);
        engine.requestMove(fen, appState.skillLevel);
    }, 250);
}

function updateAllDisplays() {
    const isGameOver = game.isGameOver();
    ui.renderBoard(game.getBoard());
    ui.updateStatus(game.getGameState()); // Passando o estado completo
    ui.updateMoveHistory(game.getHistory());
    ui.updateCapturedPieces(game.getHistory({verbose: true}));

    if (isGameOver) {
        console.log("[Main] Jogo Terminou (updateAllDisplays).");
        ui.playSound('gameOver');
        utils.clearGameState();
    }
}

function resetGame() {
    console.log("[Main] Resetando jogo.");
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
    console.log("[Main] Retomando jogo salvo...");
    const savedState = utils.loadGameState();
    if (savedState && game.loadPgn(savedState.pgn)) {
        audio.initAudio();
        appState.playerColor = savedState.playerColor;
        appState.skillLevel = savedState.skillLevel;
        ui.setupAndDisplayGame(appState.playerColor);
        updateAllDisplays();
        
        // Se for a vez da IA ao retomar
        if (game.getTurn() !== appState.playerColor) {
             requestEngineMove();
        }
    }
}

function importPgnGame() {
    const pgn = ui.getPgnInput();
    if (pgn && game.loadPgn(pgn)) {
        audio.initAudio();
        const turn = game.getTurn();
        startGame(turn); // Simplificação
    } else {
        alert("PGN inválido!");
    }
}

// Inicia a aplicação
document.addEventListener('DOMContentLoaded', init);
