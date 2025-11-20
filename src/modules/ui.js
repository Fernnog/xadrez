// src/modules/config.js (Conteúdo pressuposto)

// ...
export const PIECES = {
// ...
};

export const PIECE_VALUES = {
// ...
};

export const PROMOTION_PIECES = ['q', 'r', 'b', 'n'];

/**
 * Openings pre-definidas (FEN após alguns lances).
 */
export const OPENING_FENS = {
    'standard': { name: 'Jogo Padrão (Início)', fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' },
    'italian_game': { name: 'Jogo Italiano', fen: 'r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4' }, 
    'queens_gambit_declined': { name: 'Gambito da Rainha Recusado', fen: 'rnbqkb1r/ppp2ppp/4pn2/3p4/2PP4/2N5/PP2PPPP/R1BQKBNR w KQkq - 0 4' },
    'nimzo_indian': { name: 'Defesa Nimzo-Índia', fen: 'rnbqk2r/pppp1ppp/4pn2/8/2PP4/2N5/PP2PPPP/R1BQKBNR w KQkq - 0 4' }, 
    'english_opening': { name: 'Abertura Inglesa', fen: 'rnbqkbnr/pppppppp/8/8/2P5/8/PP1PPPPP/RNBQKBNR b KQkq - 0 1' }, 
    'caro_kann': { name: 'Defesa Caro-Kann', fen: 'rnbqkbnr/pp2pppp/2p5/3p4/3PP3/8/PPP2PPP/RNBQKBNR w KQkq - 0 3' } 
};

export const STOCKFISH_WORKER_PATH = 'https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.0/stockfish.js';