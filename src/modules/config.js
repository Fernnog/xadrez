// src/modules/config.js

/**
 * Mapeamento dos tipos de peça para seus símbolos Unicode.
 * NOTA: Usamos os glifos "Pretos" (sólidos) para ambos os lados.
 * O CSS cuidará de pintar as peças brancas de branco.
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
 */
export const STOCKFISH_WORKER_PATH = 'https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.0/stockfish.js';