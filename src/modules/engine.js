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
    try {
        console.log(`[Engine] Baixando script do motor: ${url}`);
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Erro de rede ao baixar engine: ${response.status} ${response.statusText}`);
        }

        const scriptContent = await response.text();
        const blob = new Blob([scriptContent], { type: 'application/javascript' });
        return new Worker(URL.createObjectURL(blob));
    } catch (error) {
        throw error;
    }
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
            // Se não estiver pronto (no início), enfileira.
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
        console.error("[Engine ERROR] Web Workers não suportados neste navegador.");
        alert("Seu navegador não suporta Web Workers.");
        return;
    }

    createWorkerFromUrl(STOCKFISH_WORKER_PATH)
        .then(worker => {
            stockfish = worker;
            console.log("[Engine] Worker criado com sucesso via Blob Proxy!");

            stockfish.onmessage = (event) => {
                const data = event.data;
                
                // CRÍTICO: Se o motor responde uciok, ele está pronto.
                if (data === 'uciok') {
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

            // Comandos iniciais (enfileirados se a engine não estiver pronta)
            sendMessage('uci');
            sendMessage('setoption name Use NNUE value true'); 
        })
        .catch(error => {
            console.error("[Engine ERROR] Falha fatal ao carregar Stockfish:", error);
            alert("Não foi possível carregar o motor de xadrez. Verifique o console (F12).");
        });
}

export function requestMove(fen, skillLevel) {
    console.log(`[Engine] Solicitando cálculo para nível ${skillLevel}`);
    sendMessage(`position fen ${fen}`);
    sendMessage(`setoption name Skill Level value ${skillLevel}`);
    sendMessage('go depth 15'); 
}

export function requestEvaluation(fen) {
    if (!stockfish) return;
    sendMessage(`position fen ${fen}`);
    sendMessage('go depth 8'); 
}