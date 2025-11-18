// src/modules/engine.js

let stockfish;
let onMessageCallback;

export function initEngine(callback) {
    console.log("[Engine] Inicializando módulo...");
    onMessageCallback = callback;
    
    // ATENÇÃO: O caminho aqui é crítico. Se estiver no GitHub Pages em um subdiretório,
    // o caminho pode precisar ser ajustado.
    const stockfishWorkerPath = 'src/assets/workers/stockfish.js'; 

    if (typeof(Worker) === "undefined") {
        console.error("[Engine ERROR] Web Workers não suportados neste navegador.");
        alert("Seu navegador não suporta Web Workers.");
        return;
    }

    try {
        console.log(`[Engine] Tentando carregar worker de: ${stockfishWorkerPath}`);
        stockfish = new Worker(stockfishWorkerPath);
        
        stockfish.onmessage = (event) => {
            // Loga apenas mensagens importantes para não travar o console com spam de 'info'
            if (event.data.startsWith('bestmove') || event.data.includes('error')) {
                 console.log(`[Engine -> Main] ${event.data}`);
            }
            
            if (onMessageCallback) {
                onMessageCallback(event.data);
            }
        };

        stockfish.onerror = (error) => {
            console.error("[Engine ERROR] Ocorreu um erro no Worker:", error);
            console.error("Caminho tentado:", stockfishWorkerPath);
            alert("Falha ao carregar o motor de xadrez (404 ou erro de script). Verifique o console.");
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
    sendMessage('go depth 15'); 
}

export function requestEvaluation(fen) {
    sendMessage(`position fen ${fen}`);
    sendMessage('go depth 12'); 
}
