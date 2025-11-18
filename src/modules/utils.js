// src/modules/utils.js

const PGN_COPY_BUTTON_ID = 'copyPgnButton'; // Evita strings mágicas

// --- Funções de Persistência (Salvar/Carregar Jogo) ---

const GAME_STATE_KEY = 'savedChessGameState';

export function saveGameState(game, playerColor, skillLevel) {
    if (!game) return;
    try {
        // CORREÇÃO AQUI: O módulo game.js exporta a função como 'getPgn', não 'pgn'.
        // Usar game.pgn() causava o erro pois o objeto 'game' aqui é o módulo importado.
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
            successCallback();
        } else {
            errorCallback();
        }
    } catch (err) {
        errorCallback(err);
    }
    document.body.removeChild(textArea);
}

export function copyPgn(pgn) {
    const button = document.getElementById(PGN_COPY_BUTTON_ID);
    if (!button) return;

    if (!pgn) {
        button.textContent = 'Nenhum lance!';
        setTimeout(() => { button.textContent = 'Copiar PGN'; }, 2000);
        return;
    }

    const showSuccess = () => {
        const originalText = 'Copiar PGN';
        button.textContent = 'Copiado!';
        // Remove classes antigas antes de adicionar novas para evitar conflitos
        button.classList.remove('bg-blue-600', 'hover:bg-blue-700');
        button.classList.add('bg-green-600', 'hover:bg-green-700');
        
        setTimeout(() => {
            button.textContent = originalText;
            button.classList.remove('bg-green-600', 'hover:bg-green-700');
            button.classList.add('bg-blue-600', 'hover:bg-blue-700');
        }, 2500);
    };

    const showFail = () => alert('Erro ao copiar PGN.');

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(pgn).then(showSuccess, () => fallbackCopy(pgn, showSuccess, showFail));
    } else {
        fallbackCopy(pgn, showSuccess, showFail);
    }
}
