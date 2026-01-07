// src/modules/config.js

import { CURRENT_VERSION } from './changelog.js';

// Base URL para peças SVG (Wikimedia Commons - Domínio Público)
const BASE_URL = 'https://upload.wikimedia.org/wikipedia/commons';

/**
 * Mapeamento dos tipos de peça para seus arquivos SVG.
 */
export const PIECES = {
    w: { 
        p: `${BASE_URL}/4/45/Chess_plt45.svg`, 
        r: `${BASE_URL}/7/72/Chess_rlt45.svg`, 
        n: `${BASE_URL}/7/70/Chess_nlt45.svg`, 
        b: `${BASE_URL}/b/b1/Chess_blt45.svg`, 
        q: `${BASE_URL}/1/15/Chess_qlt45.svg`, 
        k: `${BASE_URL}/4/42/Chess_klt45.svg` 
    },
    b: { 
        p: `${BASE_URL}/c/c7/Chess_pdt45.svg`, 
        r: `${BASE_URL}/f/ff/Chess_rdt45.svg`, 
        n: `${BASE_URL}/e/ef/Chess_ndt45.svg`, 
        b: `${BASE_URL}/9/98/Chess_bdt45.svg`, 
        q: `${BASE_URL}/4/47/Chess_qdt45.svg`, 
        k: `${BASE_URL}/f/f0/Chess_kdt45.svg` 
    }
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
 * OPENING_BOOK (v1.0.7)
 * Estrutura hierárquica para o Explorador de Aberturas.
 * Substitui a antiga lista plana OPENING_FENS.
 */
export const OPENING_BOOK = [
    {
        id: 'e4',
        label: 'Aberturas de Peão Rei (1. e4)',
        description: 'Jogos abertos, táticos e dinâmicos.',
        openings: [
            {
                name: 'Ruy Lopez (Espanhola)',
                eco: 'C60',
                variants: [
                    { name: 'Linha Principal (Fechada)', pgn: '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6' },
                    { name: 'Defesa Berlim', pgn: '1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6' },
                    { name: 'Variante das Trocas', pgn: '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Bxc6' }
                ]
            },
            {
                name: 'Defesa Siciliana',
                eco: 'B20',
                variants: [
                    { name: 'Aberta (Najdorf)', pgn: '1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6' },
                    { name: 'Dragão', pgn: '1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 g6' },
                    { name: 'Alapin (Anti-Siciliana)', pgn: '1. e4 c5 2. c3' }
                ]
            },
            {
                name: 'Defesa Francesa',
                eco: 'C00',
                variants: [
                    { name: 'Variante do Avanço', pgn: '1. e4 e6 2. d4 d5 3. e5' },
                    { name: 'Variante das Trocas', pgn: '1. e4 e6 2. d4 d5 3. exd5 exd5' },
                    { name: 'Winawer', pgn: '1. e4 e6 2. d4 d5 3. Nc3 Bb4' }
                ]
            },
            {
                name: 'Defesa Caro-Kann',
                eco: 'B10',
                variants: [
                    { name: 'Linha Principal', pgn: '1. e4 c6 2. d4 d5 3. Nc3 dxe4 4. Nxe4' },
                    { name: 'Avanço', pgn: '1. e4 c6 2. d4 d5 3. e5' }
                ]
            },
            {
                name: 'Defesa Escandinava',
                eco: 'B01',
                variants: [
                    { name: 'Linha Principal', pgn: '1. e4 d5 2. exd5 Qxd5' },
                    { name: 'Gambito Moderno', pgn: '1. e4 d5 2. exd5 Nf6' }
                ]
            }
        ]
    },
    {
        id: 'd4',
        label: 'Aberturas de Peão Dama (1. d4)',
        description: 'Jogos fechados, estratégicos e posicionais.',
        openings: [
            {
                name: 'Gambito da Dama',
                eco: 'D06',
                variants: [
                    { name: 'Recusado (QGD)', pgn: '1. d4 d5 2. c4 e6' },
                    { name: 'Aceito (QGA)', pgn: '1. d4 d5 2. c4 dxc4' },
                    { name: 'Defesa Eslava', pgn: '1. d4 d5 2. c4 c6' }
                ]
            },
            {
                name: 'Defesa Índia do Rei',
                eco: 'E60',
                variants: [
                    { name: 'Clássica', pgn: '1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6' },
                    { name: 'Ataque Sämisch', pgn: '1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. f3' }
                ]
            },
            {
                name: 'Defesa Nimzo-Índia',
                eco: 'E20',
                variants: [
                    { name: 'Linha Principal', pgn: '1. d4 Nf6 2. c4 e6 3. Nc3 Bb4' }
                ]
            },
            {
                name: 'Sistema London',
                eco: 'D02',
                variants: [
                    { name: 'Configuração Padrão', pgn: '1. d4 d5 2. Nf3 Nf6 3. Bf4' }
                ]
            }
        ]
    },
    {
        id: 'others',
        label: 'Outras Aberturas (Flanco)',
        description: 'Sistemas hipermodernos e não convencionais.',
        openings: [
            {
                name: 'Abertura Inglesa',
                eco: 'A10',
                variants: [
                    { name: 'Simétrica', pgn: '1. c4 c5' },
                    { name: 'Siciliana Invertida', pgn: '1. c4 e5' }
                ]
            },
            {
                name: 'Abertura Réti',
                eco: 'A04',
                variants: [
                    { name: 'Sistema Réti', pgn: '1. Nf3 d5 2. c4' }
                ]
            },
            {
                name: 'Abertura Bird',
                eco: 'A02',
                variants: [
                    { name: 'Holandesa Invertida', pgn: '1. f4 d5' }
                ]
            }
        ]
    }
];

/**
 * Caminho para o worker do Stockfish.
 */
export const STOCKFISH_WORKER_PATH = 'https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.0/stockfish.js';

// Versão da Aplicação (Atualizada para v1.0.7)
export const APP_VERSION = 'v1.0.7';
export const CACHE_NAME = `chess-pwa-${APP_VERSION}`;
