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
 * Openings pre-definidas (PGN após alguns lances).
 * A PGN garante que o histórico de lances seja carregado corretamente.
 * A propriedade "category" é usada para agrupar as opções na UI.
 */
export const OPENING_FENS = {
    // Padrão
    'standard': { 
        name: 'Jogo Padrão (Início)', 
        pgn: '', 
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        category: 'Padrão'
    },
    
    // --- ABERTURAS DE PEÃO REI (1. e4) ---
    'ruy_lopez': {
        name: 'Ruy Lopez (Espanhola)',
        pgn: '1. e4 e5 2. Nf3 Nc6 3. Bb5',
        fen: 'r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 4',
        category: 'Aberturas de Peão Rei (1. e4)'
    },
    'italian_game': { 
        name: 'Jogo Italiano', 
        pgn: '1. e4 e5 2. Nf3 Nc6 3. Bc4',
        fen: 'r1bqk1nr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',
        category: 'Aberturas de Peão Rei (1. e4)'
    }, 
    'sicilian_defense': {
        name: 'Defesa Siciliana (Aberta)',
        pgn: '1. e4 c5 2. Nf3 d6 3. d4',
        fen: 'rnbqkbnr/pp2pp1p/3p4/2p5/3PP3/5N2/PPP2PPP/RNBQKB1R b KQkq - 0 3',
        category: 'Aberturas de Peão Rei (1. e4)'
    },
    'french_defense': {
        name: 'Defesa Francesa (Avanço)',
        pgn: '1. e4 e6 2. d4 d5 3. e5',
        fen: 'rnbqkbnr/ppp2ppp/4p3/3pP3/3P4/8/PPP2PPP/RNBQKBNR b KQkq - 0 3',
        category: 'Aberturas de Peão Rei (1. e4)'
    },
    'caro_kann': { 
        name: 'Defesa Caro-Kann', 
        pgn: '1. e4 c6 2. d4 d5',
        fen: 'rnbqkbnr/pp2pppp/2p5/3p4/3PP3/8/PPP2PPP/RNBQKBNR w KQkq - 0 3',
        category: 'Aberturas de Peão Rei (1. e4)'
    }, 

    // --- ABERTURAS DE PEÃO DAMA (1. d4) ---
    'queens_gambit_declined': { 
        name: 'Gambito da Rainha Recusado', 
        pgn: '1. d4 d5 2. c4 e6 3. Nc3 Nf6',
        fen: 'rnbqkb1r/ppp2ppp/4pn2/3p4/2PP4/2N5/PP2PPPP/R1BQKBNR w KQkq - 0 4',
        category: 'Aberturas de Peão Dama (1. d4)'
    },
    'queens_gambit_accepted': {
        name: 'Gambito da Rainha Aceito',
        pgn: '1. d4 d5 2. c4 dxc4',
        fen: 'rnbqkbnr/ppp1pppp/8/8/2pP4/8/PP2PPPP/R1BQKBNR w KQkq - 0 3',
        category: 'Aberturas de Peão Dama (1. d4)'
    },
    'slav_defense': {
        name: 'Defesa Eslava',
        pgn: '1. d4 d5 2. c4 c6',
        fen: 'rnbqkbnr/pp2pppp/2p5/3p4/2PP4/8/PP2PPPP/RNBQKBNR w KQkq - 0 3',
        category: 'Aberturas de Peão Dama (1. d4)'
    },
    'kings_indian_defense': {
        name: 'Defesa Indiana do Rei',
        pgn: '1. d4 Nf6 2. c4 g6 3. Nc3',
        fen: 'rnbqkb1r/pppppp1p/5np1/8/2PP4/2N5/PP2PPPP/R1BQKBNR w KQkq - 0 3',
        category: 'Aberturas de Peão Dama (1. d4)'
    },
    'nimzo_indian': { 
        name: 'Defesa Nimzo-Índia', 
        pgn: '1. d4 Nf6 2. c4 e6 3. Nc3 Bb4',
        fen: 'rnbqk2r/pppp1ppp/4pn2/8/2PP4/2N5/PP2PPPP/R1BQKBNR w KQkq - 0 4',
        category: 'Aberturas de Peão Dama (1. d4)'
    },
    
    // --- OUTRAS ABERTURAS ---
    'english_opening': { 
        name: 'Abertura Inglesa (Simétrica)', 
        pgn: '1. c4 e5',
        fen: 'rnbqkbnr/pppp1ppp/8/4p3/2P5/8/PP1PPPPP/RNBQKBNR w KQkq - 0 2',
        category: 'Outras Aberturas'
    } 
};


/**
 * Caminho para o worker do Stockfish.
 */
export const STOCKFISH_WORKER_PATH = 'https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.0/stockfish.js';
