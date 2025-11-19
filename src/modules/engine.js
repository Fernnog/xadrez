// src/modules/engine.js

import { STOCKFISH_WORKER_PATH } from './config.js';

let stockfish;
let onMessageCallback;

export function initEngine(callback) {
    console.log("[Engine] Inicializando módulo...");
    onMessageCallback = callback;
    
    if (typeof(Worker) === "undefined") {
        console.error("[Engine ERROR] Web Workers não suportados neste navegador.");
        alert("Seu navegador não suporta Web Workers.");
        return;
    }

    try {
        console.log(`[Engine] Tentando carregar worker de: ${STOCKFISH_WORKER_PATH}`);
        stockfish = new Worker(STOCKFISH_WORKER_PATH);
        
        stockfish.onmessage = (event) => {
            // Loga mensagens críticas
            if (event.data && (typeof event.data === 'string') && (event.data.startsWith('bestmove') || event.data.includes('error'))) {
                 console.log(`[Engine -> Main] ${event.data}`);
            }
            
            if (onMessageCallback) {
                onMessageCallback(event.data);
            }
        };

        stockfish.onerror = (error) => {
            console.error("[Engine ERROR] Ocorreu um erro no Worker:", error);
            console.error("Caminho tentado:", STOCKFISH_WORKER_PATH);
            alert("Falha ao carregar o motor de xadrez. Verifique sua conexão com a internet (usando CDN).");
        };

        sendMessage('uci');
    } catch (error) {
        console.error("[Engine ERROR] Exceção ao criar Worker:", error);
    }
}

function sendMessage(message) {
    if (stockfish) {
        console.log(`[Main -> Engine] Comando: ${message}`);
        stockfish.postMessage(message);
    } else {
        console.warn("[Engine WARNING] Tentativa de envio falhou. Worker não inicializado.");
    }
}

export function requestMove(fen, skillLevel) {
    console.log(`[Engine] Solicitando cálculo para nível ${skillLevel}`);
    sendMessage(`position fen ${fen}`);
    sendMessage(`setoption name Skill Level value ${skillLevel}`);
    // Ajuste de profundidade para resposta mais rápida no teste
    sendMessage('go depth 15'); 
}

export function requestEvaluation(fen) {
    sendMessage(`position fen ${fen}`);
    sendMessage('go depth 12'); 
}