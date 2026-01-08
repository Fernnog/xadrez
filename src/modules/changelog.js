// src/modules/changelog.js

// 1. Defina a versão aqui (Fonte da Verdade)
export const CURRENT_VERSION = 'v1.0.8';

export const CHANGELOG = [
    {
        version: 'v1.0.8',
        date: '2025-12-20',
        changes: [
            'UX/UI: Modernização das coordenadas do tabuleiro, movendo-as para dentro das casas (Estilo Chess.com/Lichess) para economizar espaço e evitar cortes no layout.',
            'Bug Fix: Correção da orientação das coordenadas (Rank/File) ao jogar com as Pretas. Agora os números e letras giram corretamente para ficarem legíveis.',
            'Acessibilidade: Adição de sombra sutil e contraste inteligente (cor inversa à casa) nas coordenadas para garantir leitura em qualquer tela.',
            'Refatoração: Remoção de containers HTML antigos, tornando a renderização do tabuleiro mais leve e autossuficiente.'
        ]
    },
    {
        version: 'v1.0.7',
        date: '2025-12-19',
        changes: [
            'Novo Recurso: "Explorador de Aberturas" - Uma biblioteca visual e hierárquica para navegar por estratégias de jogo.',
            'UX: Substituição da lista de seleção longa por um Modal interativo organizado por categorias (Peão do Rei, Peão da Dama, etc.).',
            'Funcionalidade: Busca instantânea (Real-time Search) de aberturas por nome, variante ou código ECO.',
            'Arquitetura: Nova estrutura de dados aninhada para suportar múltiplas variantes por abertura.',
            'Sistema: Implementação de Event Bus para desacoplar a seleção de abertura do motor de jogo.'
        ]
    },
    {
        version: 'v1.0.6',
        date: '2025-12-18',
        changes: [
            'Visual: Migração completa de peças de fonte Unicode para imagens Vetoriais (SVG) de alta definição.',
            'UI: Remoção dos rótulos de texto ("Pretas"/"Brancas") nos painéis de captura para garantir simetria visual perfeita.',
            'Sistema: Refatoração da renderização de peças utilizando CSS Background Image para consistência entre dispositivos.',
            'UX: Melhoria na nitidez e alinhamento vertical das peças no tabuleiro e na prateleira de capturas.'
        ]
    },
    {
        version: 'v1.0.5',
        date: '2025-12-17',
        changes: [
            'Visual: Correção do "corte" no topo das peças (Rei/Rainha).',
            'Conteúdo: Nova abertura adicionada: Gambito do Rei.',
            'Sistema: Melhoria na responsividade das peças em telas móveis.'
        ]
    },
    {
        version: 'v1.0.4',
        date: '2023-10-29',
        changes: [
            'UX: Nova animação "Pop-in" elástica ao capturar peças.',
            'Arquitetura: Implementação de Variáveis CSS (Design Tokens).',
            'Sistema: Separação do histórico de versões para facilitar a manutenção.',
            'Sistema: Preparação para suporte a múltiplos temas visuais.'
        ]
    },
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
