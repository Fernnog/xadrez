// src/modules/engine.js

/**
 * Módulo para gerenciar a comunicação com o motor de xadrez Stockfish (Web Worker).
 * Responsabilidades:
 * - Iniciar o worker.
 * - Enviar comandos para o motor (análise de posição, cálculo do melhor lance).
 * - Receber mensagens do motor e encaminhá-las via callback.
 */

let stockfish;
let onMessageCallback;

/**
 * Inicializa o Web Worker do Stockfish.
 * @param {Function} callback - Função a ser chamada quando o worker envia uma mensagem.
 */
export function initEngine(callback) {
    onMessageCallback = callback;
    const stockfishWorkerPath = 'src/assets/workers/stockfish.js'; // Caminho para o worker

    // Verifica se o navegador suporta Web Workers
    if (typeof(Worker) === "undefined") {
        console.error("Seu navegador não suporta Web Workers. O motor Stockfish não pode ser carregado.");
        alert("Desculpe, seu navegador não suporta Web Workers. O motor não funcionará.");
        return;
    }

    try {
        stockfish = new Worker(stockfishWorkerPath);
        stockfish.onmessage = (event) => {
            if (onMessageCallback) {
                onMessageCallback(event.data);
            }
        };

        // Envia o comando inicial para preparar o motor
        sendMessage('uci');
    } catch (error) {
        console.error("Erro ao carregar o worker do Stockfish:", error);
        alert("Ocorreu um erro ao carregar o motor de xadrez. Verifique o console para mais detalhes.");
    }
}

/**
 * Envia uma mensagem/comando para o motor Stockfish.
 * @param {string} message - O comando a ser enviado (no formato UCI).
 */
function sendMessage(message) {
    if (stockfish) {
        stockfish.postMessage(message);
    } else {
        console.warn("Tentativa de enviar mensagem para o motor Stockfish antes de ser inicializado.");
    }
}

/**
 * Solicita ao motor que calcule o melhor lance para a posição atual.
 * @param {string} fen - A posição atual do tabuleiro no formato FEN.
 * @param {number} skillLevel - O nível de dificuldade do motor (0-20).
 */
export function requestMove(fen, skillLevel) {
    sendMessage(`position fen ${fen}`);
    sendMessage(`setoption name Skill Level value ${skillLevel}`);
    // A profundidade pode ser ajustada ou baseada no nível de dificuldade
    sendMessage('go depth 15'); 
}

/**
 * Solicita ao motor uma avaliação rápida da posição atual.
 * @param {string} fen - A posição atual do tabuleiro no formato FEN.
 */
export function requestEvaluation(fen) {
    sendMessage(`position fen ${fen}`);
    // Uma profundidade menor para uma avaliação mais rápida
    sendMessage('go depth 12'); 
}
