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
 * Openings pre-definidas (FEN após alguns lances).
 * FEN: Posição | Turno | Castling | En Passant | Halfmove clock | Fullmove number
 */
export const OPENING_FENS = {
    // FEN: Posição | Turno | Castling | En Passant | Halfmove clock | Fullmove number
    'standard': { name: 'Jogo Padrão (Início)', fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' },
    // 1. e4 e5 2. Nf3 Nc6 3. Bc4
    'italian_game': { name: 'Jogo Italiano', fen: 'r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4' }, 
    // 1. d4 d5 2. c4 e6 3. Nc3 Nf6
    'queens_gambit_declined': { name: 'Gambito da Rainha Recusado', fen: 'rnbqkb1r/ppp2ppp/4pn2/3p4/2PP4/2N5/PP2PPPP/R1BQKBNR w KQkq - 0 4' },
    // 1. d4 Nf6 2. c4 e6 3. Nc3 Bb4
    'nimzo_indian': { name: 'Defesa Nimzo-Índia', fen: 'rnbqk2r/pppp1ppp/4pn2/8/2PP4/2N5/PP2PPPP/R1BQKBNR w KQkq - 0 4' }, 
    // 1. c4
    'english_opening': { name: 'Abertura Inglesa', fen: 'rnbqkbnr/pppppppp/8/8/2P5/8/PP1PPPPP/RNBQKBNR b KQkq - 0 1' }, 
    // 1. e4 c6 2. d4 d5
    'caro_kann': { name: 'Defesa Caro-Kann', fen: 'rnbqkbnr/pp2pppp/2p5/3p4/3PP3/8/PPP2PPP/RNBQKBNR w KQkq - 0 3' } 
};

/**
 * Caminho para o worker do Stockfish.
 */
export const STOCKFISH_WORKER_PATH = 'https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.0/stockfish.js';