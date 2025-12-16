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
    'petroff_defense': {
        name: 'Defesa Petroff',
        pgn: '1. e4 e5 2. Nf3 Nf6',
        fen: 'rnbqkb1r/pppp1ppp/5n2/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3',
        category: 'Aberturas de Peão Rei (1. e4)'
    },
    'scotch_game': {
        name: 'Abertura Escocesa',
        pgn: '1. e4 e5 2. Nf3 Nc6 3. d4',
        fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/3PP3/5N2/PPP2PPP/RNBQKB1R b KQkq - 0 3',
        category: 'Aberturas de Peão Rei (1. e4)'
    },
    'scandinavian_defense': {
        name: 'Defesa Escandinava',
        pgn: '1. e4 d5',
        fen: 'rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
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
    'pirc_defense': {
        name: 'Defesa Pirc',
        pgn: '1. e4 d6 2. d4 Nf6 3. Nc3 g6',
        fen: 'rnbqkb1r/ppp1pp1p/3p1np1/8/3PP3/2N5/PPP2PPP/R1BQKBNR w KQkq - 0 4',
        category: 'Aberturas de Peão Rei (1. e4)'
    },
    'modern_defense': {
        name: 'Defesa Moderna',
        pgn: '1. e4 g6',
        fen: 'rnbqkbnr/pppppp1p/6p1/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
        category: 'Aberturas de Peão Rei (1. e4)'
    },
    'alekhine_defense': {
        name: 'Defesa Alekhine',
        pgn: '1. e4 Nf6',
        fen: 'rnbqkb1r/pppppppp/5n2/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
        category: 'Aberturas de Peão Rei (1. e4)'
    },

    // --- ABERTURAS DE PEÃO DAMA (1. d4) ---
    'queens_gambit_declined': { 
        name: 'Gambito da Rainha Recusado', 
        pgn: '1. d4 d5 2. c4 e6',
        fen: 'rnbqkbnr/ppp2ppp/4p3/3p4/2PP4/8/PP2PPPP/R1BQKBNR w KQkq - 0 3',
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
    'grunfeld_defense': {
        name: 'Defesa Grünfeld',
        pgn: '1. d4 Nf6 2. c4 g6 3. Nc3 d5',
        fen: 'rnbqkb1r/ppp1pp1p/5np1/3p4/2PP4/2N5/PP2PPPP/R1BQKBNR w KQkq - 0 4',
        category: 'Aberturas de Peão Dama (1. d4)'
    },
    'queens_indian_defense': {
        name: 'Defesa Índia da Dama',
        pgn: '1. d4 Nf6 2. c4 e6 3. Nf3 b6',
        fen: 'rnbqkb1r/p1pp1ppp/1p2pn2/8/2PP4/5N2/PP2PPPP/RNBQKB1R w KQkq - 0 4',
        category: 'Aberturas de Peão Dama (1. d4)'
    },
    'london_system': {
        name: 'Sistema London',
        pgn: '1. d4 d5 2. Nf3 Nf6 3. Bf4',
        fen: 'rnbqkb1r/ppp1pppp/5n2/3p4/3P1B2/5N2/PPP1PPPP/RN1QKB1R w KQkq - 2 4',
        category: 'Aberturas de Peão Dama (1. d4)'
    },
    'benoni_defense': {
        name: 'Defesa Benoni',
        pgn: '1. d4 Nf6 2. c4 c5 3. d5',
        fen: 'rnbqkb1r/pp1ppppp/5n2/2pP4/2P5/8/PP2PPPP/RNBQKBNR w KQkq - 0 4',
        category: 'Aberturas de Peão Dama (1. d4)'
    },
    'trompowsky_attack': {
        name: 'Ataque Trompowsky',
        pgn: '1. d4 Nf6 2. Bg5',
        fen: 'rnbqkb1r/pppppppp/5n2/6B1/3P4/8/PPP1PPPP/RN1QKBNR b KQkq - 1 2',
        category: 'Aberturas de Peão Dama (1. d4)'
    },
    
    // --- OUTRAS ABERTURAS ---
    'english_opening': { 
        name: 'Abertura Inglesa', 
        pgn: '1. c4',
        fen: 'rnbqkbnr/pppppppp/8/8/2P5/8/PP1PPPPP/RNBQKBNR b KQkq - 0 1',
        category: 'Outras Aberturas'
    },
    'reti_opening': {
        name: 'Abertura Réti',
        pgn: '1. Nf3 d5',
        fen: 'rnbqkbnr/ppp1pppp/8/3p4/8/5N2/PPPPPPPP/RNBQKB1R w KQkq - 0 2',
        category: 'Outras Aberturas'
    },
    'dutch_defense': {
        name: 'Defesa Holandesa',
        pgn: '1. d4 f5',
        fen: 'rnbqkbnr/ppppp1pp/8/5p2/3P4/8/PPP1PPPP/RNBQKBNR w KQkq - 0 2',
        category: 'Outras Aberturas'
    },
    'catalan_opening': {
        name: 'Abertura Catalã',
        pgn: '1. d4 Nf6 2. c4 e6 3. g3',
        fen: 'rnbqkb1r/pppp1ppp/4pn2/8/2PP4/6P1/PP2PP1P/RNBQKBNR w KQkq - 0 4',
        category: 'Outras Aberturas'
    }
};


/**
 * Caminho para o worker do Stockfish.
 */
export const STOCKFISH_WORKER_PATH = 'https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.0/stockfish.js';

// ATUALIZADO
export const APP_VERSION = 'v1.0.3';
export const CACHE_NAME = `chess-pwa-${APP_VERSION}`; 

// ATUALIZADO
export const CHANGELOG = [
    {
        version: 'v1.0.3',
        date: '2025-12-16',
        changes: [
            'UI Kit: Novo painel "Prateleira" para peças capturadas com alto contraste.',
            'Acessibilidade: Sombras dinâmicas para melhor visualização das peças pretas.',
            'Responsividade: Ajuste fluido do tamanho das peças no modo Widget (Clamp).',
            'UX: Animação de entrada ao capturar peças.'
        ]
    },
    {
        version: 'v1.0.2',
        date: '2025-12-15',
        changes: [
            'Live Sync: Sincronização em tempo real entre abas/janelas (Storage API).',
            'Modo Cinema: Bloqueio da janela principal quando o Widget está ativo.',
            'UX: Destaque visual dinâmico nas coordenadas (Ranks/Files) ao passar o mouse.',
            'Core: Correção de loop de áudio na sincronização.'
        ]
    },
    {
        version: 'v1.0.1',
        date: '2025-12-02',
        changes: [
            'Novo: Exportação de histórico para DOC com diagrama do tabuleiro.',
            'Novo: Histórico de versões interativo.',
            'UX: Notificações (Toasts) substituindo alertas.',
            'Sistema: Melhoria de cache e atualização automática.'
        ]
    },
    {
        version: 'v1.0.0',
        date: '2025-12-01',
        changes: ['Lançamento inicial.']
    }
];
