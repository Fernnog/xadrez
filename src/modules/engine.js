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
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const script = await response.text();
        const blob = new Blob([script], { type: 'application/javascript' });
        const blobUrl = URL.createObjectURL(blob);
        return new Worker(blobUrl);
    } catch (error) {
        console.error('Failed to create worker from URL:', error);
        alert('Não foi possível carregar o motor de xadrez. Verifique sua conexão com a internet e tente recarregar a página.');
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
        alert("Desculpe, seu navegador não suporta Web Workers, que são necessários para rodar o Stockfish.");
        return;
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
            console.error("[Engine FATAL] Não foi possível carregar o worker do Stockfish:", error);
        });
}

/**
 * Solicita um movimento do Stockfish.
 * @param {string} fen - A posição atual do tabuleiro em notação FEN.
 * @param {number} skillLevel - O nível de dificuldade (0-20).
 * @param {number} moveTime - O tempo em ms que a engine tem para pensar.
 */
export function requestMove(fen, skillLevel, moveTime = 1000) {
    sendMessage(`position fen ${fen}`);
    sendMessage(`setoption name Skill Level value ${skillLevel}`);
    sendMessage(`go movetime ${moveTime}`);
}

/**
 * Solicita uma avaliação da posição atual.
 * @param {string} fen - A posição atual do tabuleiro em notação FEN.
 */
export function requestEvaluation(fen) {
    if (isEngineReady) {
        sendMessage(`position fen ${fen}`);
        sendMessage('go depth 15');
    } else {
        // Adiciona na fila se a engine não estiver pronta.
        commandQueue.push(`position fen ${fen}`);
        commandQueue.push('go depth 15');
    }
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
