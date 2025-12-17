// src/modules/changelog.js

export const CHANGELOG = [
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
