// src/modules/utils.js

import { PIECES } from './config.js';

const PGN_COPY_BUTTON_ID = 'copyPgnButton'; 
const GAME_STATE_KEY = 'savedChessGameState';

// --- Funções de Persistência (Salvar/Carregar Jogo) ---

export function saveGameState(game, playerColor, skillLevel) {
    if (!game) return;
    try {
        const state = {
            pgn: game.getPgn(), 
            playerColor: playerColor,
            skillLevel: skillLevel,
            timestamp: new Date().getTime()
        };
        localStorage.setItem(GAME_STATE_KEY, JSON.stringify(state));
    } catch (e) {
        console.error("Failed to save game state:", e);
    }
}

export function loadGameState() {
    try {
        const savedState = localStorage.getItem(GAME_STATE_KEY);
        return savedState ? JSON.parse(savedState) : null;
    } catch (e) {
        console.error("Failed to load game state:", e);
        return null;
    }
}

export function clearGameState() {
    localStorage.removeItem(GAME_STATE_KEY);
}


// --- Funções de Interação com a Área de Transferência ---

function fallbackCopy(text, successCallback, errorCallback) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            if (successCallback) successCallback("PGN copiado!");
        } else {
            if (errorCallback) errorCallback("Falha ao copiar PGN.");
        }
    } catch (err) {
        if (errorCallback) errorCallback(err);
    }
    document.body.removeChild(textArea);
}

export function copyPgn(pgn, successCallback, errorCallback) {
    if (!pgn) {
        if (errorCallback) errorCallback('Nenhum lance para copiar!');
        return;
    }

    // Tenta usar API moderna
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(pgn)
            .then(() => successCallback && successCallback("PGN copiado para a área de transferência!"))
            .catch(() => fallbackCopy(pgn, successCallback, errorCallback));
    } else {
        fallbackCopy(pgn, successCallback, errorCallback);
    }
}

// --- Funções de Exportação DOC ---

function generateBoardHtmlTable(boardArray) {
    if (!boardArray) return '';
    
    let html = '<table border="0" cellspacing="0" cellpadding="0" style="border: 2px solid #333; margin: 20px auto;">';
    
    const lightColor = '#f0d9b5';
    const darkColor = '#b58863';
    
    for (let r = 0; r < 8; r++) {
        html += '<tr>';
        for (let c = 0; c < 8; c++) {
            const isDark = (r + c) % 2 === 1;
            const bgColor = isDark ? darkColor : lightColor;
            const piece = boardArray[r][c];
            const symbol = piece ? PIECES[piece.color][piece.type] : '';
            
            // Estilo inline essencial para Word
            html += `<td style="width: 40px; height: 40px; background-color: ${bgColor}; text-align: center; font-size: 24px; color: #000; border: none;">${symbol}</td>`;
        }
        html += '</tr>';
    }
    html += '</table>';
    return html;
}

export function downloadHistoryAsDoc(pgn, boardArray) {
    const boardDiagram = boardArray ? generateBoardHtmlTable(boardArray) : '';

    const content = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='utf-8'><title>Partida de Xadrez</title></head>
        <body style="font-family: Arial, sans-serif;">
            <h1 style="text-align:center">Registro de Partida de Xadrez</h1>
            <p style="text-align:center"><strong>Data:</strong> ${new Date().toLocaleDateString()}</p>
            <hr>
            <h3 style="text-align:center">Posição Final</h3>
            ${boardDiagram}
            <hr>
            <h3>Notação (PGN)</h3>
            <div style="background:#f4f4f4; padding:10px; border:1px solid #ddd; font-family: monospace; font-size: 14px;">
                ${pgn}
            </div>
            <br>
            <p style="font-size: 10px; color: #888; text-align: center;">Gerado por Xadrez vs Stockfish</p>
        </body>
        </html>
    `;

    const blob = new Blob([content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = `Partida_Xadrez_${new Date().getTime()}.doc`;
    
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// --- DIAGNÓSTICO: LAYOUT LOGGER (Anti-Jitter) ---

export function initLayoutLogger() {
    console.log("[LayoutLogger] Iniciando monitoramento de estabilidade...");
    
    // Elementos críticos para observar
    const targets = [
        document.getElementById('board'),
        document.querySelector('.board-container'),
        document.getElementById('gameContainer'),
        document.body
    ];

    const observer = new ResizeObserver(entries => {
        for (let entry of entries) {
            // Ignora a inicialização (tamanho 0 para tamanho real)
            // Filtra mudanças minúsculas (sub-pixel rendering) que podem não ser visíveis
            if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
                const id = entry.target.id || entry.target.className || entry.target.tagName;
                
                // Formata para facilitar leitura
                const w = entry.contentRect.width.toFixed(2);
                const h = entry.contentRect.height.toFixed(2);
                
                // Opcional: Filtrar apenas body ou board se o log estiver muito ruidoso
                console.warn(
                    `[JITTER DETECTADO] Elemento: ${id} | Nova Dimensão: ${w} x ${h}`
                );

                // Dica visual de debug: borda vermelha momentânea
                // Nota: Pode ser comentado em produção se desejar
                if (entry.target.style) {
                    const originalOutline = entry.target.style.outline;
                    entry.target.style.outline = "2px solid red";
                    setTimeout(() => {
                        entry.target.style.outline = originalOutline;
                    }, 200);
                }
            }
        }
    });

    targets.forEach(el => {
        if (el) observer.observe(el);
    });
}
