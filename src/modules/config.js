// src/modules/config.js

/**
 * Mapeamento dos tipos de peça para seus símbolos Unicode.
 * OBS: As peças brancas ('w') agora usam os símbolos sólidos (preenchidos).
 * A diferenciação de cor será feita inteiramente via CSS (color: white + text-shadow).
 */
export const PIECES = {
    w: { p: '♟', r: '♜', n: '♞', b: '♝', q: '♛', k: '♚' },
    b: { p: '♟', r: '♜', n: '♞', b: '♝', q: '♛', k: '♚' }
};

/**
 * Valores relativos de cada peça.
 */
export const PIECE_VALUES = {
    p: 1,
    n: 3,
    b: 3,
    r: 5,
    q: 9
};

/**
 * Lista das peças disponíveis para promoção.
 */
export const PROMOTION_PIECES = ['q', 'r', 'b', 'n'];

/**
 * Caminho para o worker do Stockfish.
 * Mantido via CDN público e estável.
 */
export const STOCKFISH_WORKER_PATH = 'https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.0/stockfish.js';
