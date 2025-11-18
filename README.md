# Xadrez: Humano vs. Stockfish

Uma interface web moderna e responsiva para jogar xadrez contra o motor Stockfish diretamente no seu navegador. Este projeto utiliza JavaScript puro (ES6 Modules), HTML5 e Tailwind CSS para criar uma experiência de jogo limpa e funcional.



[Acesse a demonstração ao vivo aqui!](https://seu-usuario.github.io/seu-repositorio/) <!-- Substitua com o seu link do GitHub Pages -->

---

## ✨ Funcionalidades

-   **Jogue contra a IA:** Desafie o poderoso motor Stockfish.
-   **Níveis de Dificuldade:** Escolha entre 4 níveis, do iniciante ao mestre.
-   **Escolha de Cores:** Comece o jogo jogando com as peças brancas ou pretas.
-   **Interface Limpa:** Tabuleiro e peças com design minimalista e responsivo.
-   **Destaque de Lances Válidos:** Clique em uma peça para ver todos os seus movimentos possíveis.
-   **Promoção de Peão:** Interface modal para escolher a peça de promoção.
-   **Histórico de Movimentos:** Acompanhe todos os lances da partida em notação algébrica.
-   **Captura de Peças:** Visualização das peças capturadas por cada jogador e a diferença de material.
-   **Análise em Tempo Real:** Barra de avaliação que mostra a vantagem de acordo com o Stockfish.
-   **Persistência de Jogo:** Salva automaticamente o jogo em andamento no seu navegador (`localStorage`).
-   **Importação de PGN:** Cole a notação de um jogo existente para analisá-lo ou continuá-lo.
-   **Copiar PGN:** Copie facilmente o PGN da partida atual para a área de transferência.

---

## 🚀 Como Executar Localmente

Para rodar este projeto, você precisa de um servidor web local. Isso é necessário porque os módulos JavaScript (ES6 Modules) não funcionam corretamente quando abertos diretamente do sistema de arquivos (usando o protocolo `file://`).

**Pré-requisitos:**
-   Um navegador moderno (Chrome, Firefox, etc.).
-   [Node.js](https://nodejs.org/) (opcional, para usar `npx serve`).

**Passos:**

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/seu-usuario/seu-repositorio.git
    cd seu-repositorio
    ```

2.  **Baixe o motor Stockfish:**
    -   Vá para [stockfishchess.org/download/wasm/](https://stockfishchess.org/download/wasm/).
    -   Baixe a "Normal Build".
    -   Extraia o arquivo `.zip` e copie os arquivos `stockfish.js` e `stockfish.wasm` para a pasta `src/assets/workers/`.

3.  **Inicie um servidor local:**
    -   **Opção 1: Usando `npx` (se você tem Node.js)**
        ```bash
        npx serve
        ```
    -   **Opção 2: Usando Python**
        ```bash
        # Python 3.x
        python -m http.server
        ```
    -   **Opção 3: Usando a extensão "Live Server" no VS Code**
        -   Instale a extensão e clique em "Go Live" no canto inferior direito do editor.

4.  **Abra no navegador:**
    Acesse o endereço fornecido pelo servidor (geralmente `http://localhost:8080` ou `http://localhost:5500`).

---

## 📁 Estrutura do Projeto

O código é organizado de forma modular para facilitar a manutenção e escalabilidade.

```
.
├── index.html          # Estrutura principal da página
├── css/
│   └── main.css        # Estilos customizados
└── src/
    ├── main.js         # Ponto de entrada, orquestrador da aplicação
    ├── modules/
    │   ├── ui.js       # Manipulação do DOM e interface do usuário
    │   ├── game.js     # Lógica do jogo (interação com chess.js)
    │   ├── engine.js   # Comunicação com o motor Stockfish (Web Worker)
    │   ├── config.js   # Constantes e configurações
    │   ├── audio.js    # Gerenciamento dos efeitos sonoros
    │   └── utils.js    # Funções utilitárias (localStorage, copiar PGN)
    └── assets/
        └── workers/
            └── stockfish.js # Motor Stockfish (obtido por download)
```

---

## 🛠️ Tecnologias Utilizadas

-   **HTML5**
-   **CSS3** com **Tailwind CSS** (via CDN)
-   **JavaScript** (ES6 Modules, sem frameworks)
-   **[Chess.js](https://github.com/jhlywa/chess.js/)**: Biblioteca para validação de regras, geração de FEN/PGN e gerenciamento de estado do xadrez.
-   **[Stockfish WASM](https://stockfishchess.org/blog/2021/stockfish-13-in-your-browser/)**: O motor de xadrez compilado para WebAssembly, rodando em um Web Worker para não travar a interface.

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.
