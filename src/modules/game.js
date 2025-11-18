// src/modules/game.js

// A biblioteca Chess.js é carregada via CDN no index.html,
// então o construtor `Chess` está disponível globalmente.
const game = new Chess();

/**
 * Reinicia o jogo para a posição inicial.
 */
export function reset() {
    game.reset();
}

/**
 * Carrega um jogo a partir de uma notação PGN.
 * @param {string} pgn - A string PGN do jogo.
 * @returns {boolean} - True se o PGN foi carregado com sucesso, false caso contrário.
 */
export function loadPgn(pgn) {
    return game.load_pgn(pgn);
}

/**
 * Tenta realizar um movimento no tabuleiro.
 * Aceita notação de casa (e.g., 'e4') ou um objeto de movimento (para promoções).
 * @param {string | { from: string, to: string, promotion?: string }} move - O movimento a ser feito.
 * @returns {object | null} - O objeto de movimento se for válido, senão null.
 */
export function makeMove(move) {
    // A opção { sloppy: true } permite usar lances como 'e2e4' diretamente
    return game.move(move, { sloppy: true });
}

/**
 * Desfaz o último movimento.
 */
export function undoMove() {
    game.undo();
}

/**
 * Obtém uma lista de movimentos válidos para uma determinada casa.
 * @param {string} square - A casa (e.g., 'e2').
 * @returns {object[]} - Um array de objetos de movimento detalhados.
 */
export function getValidMoves(square) {
    return game.moves({ square: square, verbose: true });
}

/**
 * Retorna a peça em uma determinada casa.
 * @param {string} square - A casa (e.g., 'a1').
 * @returns {object | null} - O objeto da peça ou null se a casa estiver vazia.
 */
export function getPiece(square) {
    return game.get(square);
}

/**
 * Verifica se um movimento de um peão é uma promoção.
 * @param {string} from - Casa de origem.
 * @param {string} to - Casa de destino.
 * @returns {boolean} - True se for um movimento de promoção.
 */
export function isPromotionMove(from, to) {
    const piece = getPiece(from);
    if (!piece || piece.type !== 'p') return false;

    const targetRank = to[1];
    return (piece.color === 'w' && from[1] === '7' && targetRank === '8') ||
           (piece.color === 'b' && from[1] === '2' && targetRank === '1');
}

/**
 * Retorna um objeto contendo o estado atual do jogo.
 * @returns {{
 *  fen: string,
 *  turn: 'w' | 'b',
 *  board: object[][],
 *  history: object[],
 *  isGameOver: boolean,
 *  isCheckmate: boolean,
 *  isStalemate: boolean,
 *  isDraw: boolean,
 *  inCheck: boolean
 * }}
 */
export function getGameState() {
    return {
        fen: game.fen(),
        turn: game.turn(),
        board: game.board(),
        history: game.history({ verbose: true }),
        isGameOver: game.game_over(),
        isCheckmate: game.in_checkmate(),
        isStalemate: game.in_stalemate(),
        isDraw: game.in_draw(),
        inCheck: game.in_check()
    };
}

/**
 * Retorna a notação PGN completa do jogo.
 * @returns {string}
 */
export function getPgn() {
    return game.pgn();
}
