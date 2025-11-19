# Xadrez: Humano vs. Stockfish

Uma interface web moderna e responsiva para jogar xadrez contra o motor Stockfish diretamente no seu navegador. Este projeto utiliza JavaScript puro (ES6 Modules), HTML5 e Tailwind CSS.

O motor de xadrez é carregado dinamicamente via **CDN**, eliminando a necessidade de configurações complexas de backend ou downloads manuais de binários.

[Acesse a demonstração ao vivo aqui!](https://seu-usuario.github.io/seu-repositorio/) <!-- Substitua com o seu link do GitHub Pages -->

---

## ✨ Funcionalidades

-   **Jogue contra a IA:** Desafie o poderoso motor Stockfish 10 (via Web Assembly).
-   **Níveis de Dificuldade:** Escolha entre 4 níveis, do iniciante ao mestre.
-   **Interface Limpa:** Design minimalista e responsivo com Tailwind CSS.
-   **Destaque de Lances:** Visualização clara de movimentos possíveis e último lance.
-   **Promoção de Peão:** Interface modal para escolha da peça.
-   **Histórico de Partida:** Lista completa de lances em notação algébrica (SAN).
-   **Análise em Tempo Real:** Barra de avaliação mostrando a vantagem atual.
-   **Persistência:** O jogo salva automaticamente no navegador para você continuar depois.
-   **Importação/Exportação:** Copie o PGN ou cole um jogo existente para análise.

---

## 🚀 Como Executar Localmente

Para rodar este projeto, você precisa de um servidor web local. Isso é necessário porque os módulos JavaScript (ES6 Modules) não funcionam quando abertos diretamente do sistema de arquivos (protocolo `file://`).

**Pré-requisitos:**
-   Um navegador moderno.
-   Conexão com a internet (para carregar o Tailwind CSS e o Stockfish via CDN).

**Passos:**

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/seu-usuario/seu-repositorio.git
    cd seu-repositorio
    ```

2.  **Inicie um servidor local:**
    -   **Opção 1: Usando a extensão "Live Server" no VS Code (Recomendado)**
        -   Instale a extensão "Live Server".
        -   Clique com o botão direito no `index.html` e selecione "Open with Live Server".
    
    -   **Opção 2: Usando Python**
        ```bash
        # Python 3.x
        python -m http.server
        ```

    -   **Opção 3: Usando Node.js**
        ```bash
        npx serve
        ```

3.  **Abra no navegador:**
    Acesse o endereço local (geralmente `http://localhost:5500` ou `http://localhost:8000`).

---

## 📁 Estrutura do Projeto

O código é organizado de forma modular (ES Modules).
