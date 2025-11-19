// src/modules/engine.js

import { STOCKFISH_WORKER_PATH } from './config.js';

let stockfish;
let onMessageCallback;

/**
 * Cria um Web Worker a partir de uma URL externa contornando CORS.
 * Baixa o script como texto/blob e cria uma URL local temporária.
 */
async function createWorkerFromUrl(url) {
    try {
        console.log(`[Engine] Baixando script do motor: ${url}`);
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Erro de rede ao baixar engine: ${response.status} ${response.statusText}`);
        }

        const scriptContent = await response.text();
        // Cria um Blob (arquivo na memória) com o conteúdo do script
        const blob = new Blob([scriptContent], { type: 'application/javascript' });
        // Cria uma URL interna (blob:https://...) que o navegador considera segura
        return new Worker(URL.createObjectURL(blob));
    } catch (error) {
        throw error;
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

    // Inicia o processo de carga (assíncrono)
    createWorkerFromUrl(STOCKFISH_WORKER_PATH)
        .then(worker => {
            stockfish = worker;
            console.log("[Engine] Worker criado com sucesso via Blob Proxy!");

            stockfish.onmessage = (event) => {
                // Log de diagnóstico
                if (event.data && (typeof event.data === 'string') && (event.data.startsWith('bestmove') || event.data.includes('error'))) {
                     console.log(`[Engine -> Main] ${event.data}`);
                }
                
                if (onMessageCallback) {
                    onMessageCallback(event.data);
                }
            };

            stockfish.onerror = (error) => {
                console.error("[Engine ERROR] Falha interna no Worker:", error);
            };

            // Envia comando inicial para confirmar que está vivo
            sendMessage('uci');
        })
        .catch(error => {
            console.error("[Engine ERROR] Falha fatal ao carregar Stockfish:", error);
            alert("Não foi possível carregar o motor de xadrez. Verifique o console (F12).");
        });
}

function sendMessage(message) {
    if (stockfish) {
        console.log(`[Main -> Engine] Comando: ${message}`);
        stockfish.postMessage(message);
    } else {
        // Se o worker ainda estiver baixando (o fetch pode demorar uns segundos), avisamos
        console.warn("[Engine WARNING] Tentativa de envio falhou. Worker ainda carregando ou falhou.");
    }
}

export function requestMove(fen, skillLevel) {
    // Se o stockfish ainda não carregou, tentamos novamente em breve
    if (!stockfish) {
        console.log("[Engine] Worker não pronto. Tentando novamente em 500ms...");
        setTimeout(() => requestMove(fen, skillLevel), 500);
        return;
    }

    console.log(`[Engine] Solicitando cálculo para nível ${skillLevel}`);
    sendMessage(`position fen ${fen}`);
    sendMessage(`setoption name Skill Level value ${skillLevel}`);
    sendMessage('go depth 15'); 
}

export function requestEvaluation(fen) {
    if (!stockfish) return;
    sendMessage(`position fen ${fen}`);
    sendMessage('go depth 12'); 
}
