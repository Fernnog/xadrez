// src/modules/engine.js

import { STOCKFISH_WORKER_PATH } from './config.js';

let stockfish;
let onMessageCallback;
let isEngineReady = false; // Flag de prontidão do motor
let commandQueue = []; // Fila para comandos pendentes

/**
 * Cria um Web Worker a partir de uma URL externa contornando CORS.
 */
async function createWorkerFromUrl(url) {
// ... [CÓDIGO INALTERADO] ...
}

/**
 * Processa a fila de comandos pendentes.
 */
function processQueue() {
    while (commandQueue.length > 0 && isEngineReady) {
        const message = commandQueue.shift();
        console.log(`[Main -> Engine] Executando comando da fila: ${message}`);
        stockfish.postMessage(message);
    }
}

function sendMessage(message) {
    if (stockfish) {
        // Se estiver pronto, envia imediatamente.
        if (isEngineReady) {
            console.log(`[Main -> Engine] Comando: ${message}`);
            stockfish.postMessage(message);
        } else {
            // Se não estiver pronto (no início), enfileira comandos de JOGO.
            // Os comandos UCI de setup (uci, isready) são tratados separadamente no initEngine.
            console.log(`[Main -> Engine] Enfileirando comando (motor não pronto): ${message}`);
            commandQueue.push(message);
        }
    } else {
        console.warn("[Engine WARNING] Tentativa de envio falhou. Worker ainda carregando ou falhou.");
    }
}


export function initEngine(callback) {
    console.log("[Engine] Inicializando módulo...");
    onMessageCallback = callback;
    
    if (typeof(Worker) === "undefined") {
// ... [CÓDIGO INALTERADO] ...
    }

    createWorkerFromUrl(STOCKFISH_WORKER_PATH)
        .then(worker => {
            stockfish = worker;
            console.log("[Engine] Worker criado com sucesso via Blob Proxy!");

            stockfish.onmessage = (event) => {
                const data = event.data;
                
                if (data === 'uciok') {
                    // CRÍTICO: Envia comandos de configuração e isready, BURLANDO a fila de espera,
                    // pois eles são essenciais para liberar a engine.
                    console.log("[Engine] Recebido uciok. Enviando opções...");
                    stockfish.postMessage('setoption name Use NNUE value true'); 
                    stockfish.postMessage('isready');
                }
                
                if (data === 'readyok' && !isEngineReady) {
                    // CRÍTICO: Engine está finalmente pronta.
                    isEngineReady = true;
                    console.log("[Engine READY] Motor pronto. Processando fila de comandos.");
                    processQueue();
                }

                if (data && (typeof data === 'string') && (data.startsWith('bestmove') || data.includes('error'))) {
                     console.log(`[Engine -> Main] ${data}`);
                }
                
                if (onMessageCallback) {
                    onMessageCallback(data);
                }
            };

            stockfish.onerror = (error) => {
                console.error("[Engine ERROR] Falha interna no Worker:", error);
            };

            // Comando inicial: Envia 'uci' para começar o handshake.
            stockfish.postMessage('uci'); 
        })
        .catch(error => {
// ... [CÓDIGO INALTERADO] ...
        });
}

/**
 * Solicita um movimento do Stockfish.
// ... [CÓDIGO INALTERADO] ...
}

export function requestEvaluation(fen) {
// ... [CÓDIGO INALTERADO] ...
}

/**
 * Envia o comando 'stop' para a engine, interrompendo o cálculo atual.
 */
export function stopCalculation() {
    sendMessage('stop');
}

/**
 * Envia o comando 'ucinewgame' para forçar o reset do estado interno do Stockfish.
 */
export function resetEngineState() {
    sendMessage('ucinewgame');
}
