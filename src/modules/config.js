// src/modules/config.js

/**
 * Mapeamento dos tipos de peça para seus símbolos Unicode.
 * @type {{w: object, b: object}}
 */
export const PIECES = {
    w: { p: '♙', r: '♖', n: '♘', b: '♗', q: '♕', k: '♔' },
    b: { p: '♟', r: '♜', n: '♞', b: '♝', q: '♛', k: '♚' }
};

/**
 * Valores relativos de cada peça, usados para calcular a diferença de material.
 * @type {object}
 */
export const PIECE_VALUES = {
    p: 1,
    n: 3,
    b: 3,
    r: 5,
    q: 9
};

/**
 * Lista das peças disponíveis para promoção de um peão.
 * @type {string[]}
 */
export const PROMOTION_PIECES = ['q', 'r', 'b', 'n'];

/**
 * Caminho para o worker do Stockfish.
 * @type {string}
 */
export const STOCKFISH_WORKER_PATH = 'src/assets/workers/stockfish.js';
