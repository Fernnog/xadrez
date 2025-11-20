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

// NOVO:
/**
 * Carrega um jogo a partir de uma string FEN.
 * @param {string} fen - A string FEN da posição.
 * @returns {boolean} - True se o FEN foi carregado com sucesso, false caso contrário.
 */
export function loadFen(fen) {
    return game.load(fen);
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

// --- FUNÇÕES ADICIONADAS PARA CORRIGIR O ERRO ---

/**
 * Verifica se o jogo terminou.
 * @returns {boolean}
 */
export function isGameOver() {
    return game.game_over();
}

/**
 * Retorna de quem é a vez ('w' para brancas, 'b' para pretas).
 * @returns {string}
 */
export function getTurn() {
    return game.turn();
}

/**
 * Retorna o array 2D representando o tabuleiro.
 * @returns {object[][]}
 */
export function getBoard() {
    return game.board();
}

/**
 * Retorna o histórico de movimentos.
 * @param {object} options - Opções (ex: { verbose: true }).
 * @returns {string[] | object[]}
 */
export function getHistory(options) {
    return game.history(options);
}

/**
 * Retorna a string FEN da posição atual (usado pelo Stockfish).
 * @returns {string}
 */
export function getFen() {
    return game.fen();
}

// ------------------------------------------------

/**
 * Retorna um objeto contendo o estado completo atual do jogo.
 * Útil para atualizações em massa da UI.
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
        isDraw: game.in_draw(), // Cobre empate por regra dos 50 lances ou material insuficiente
        inCheck: game.in_check()
    };
}

/**
 * Verifica repetição tripla de posições.
 * @returns {boolean}
 */
export function inThreefoldRepetition() {
    return game.in_threefold_repetition();
}

/**
 * Retorna a notação PGN completa do jogo.
 * @returns {string}
 */
export function getPgn() {
    return game.pgn();
}