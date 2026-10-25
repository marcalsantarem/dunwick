# Análise do protótipo "Vale de Dunwick" (do usuário)

> Autor: 01 Produtor · 2026-10-24 · Fonte: https://dunwick.netlify.app (cópia local: `referencia/prototipo/index.html`, 1 arquivo, ~228 KB de JavaScript, 171 funções)
> **Este é o alvo visual e de jogabilidade do usuário** ("aquela ideia, só que mais bonito e polido"). O esqueleto cinza em Three.js foi **rejeitado** (D-024).

## 1. O que o protótipo é
- **Canvas 2D puro** (sem biblioteca), 1280×720, visão **isométrica 2:1** (`TILE_W 64 · TILE_H 32`), mapa 80×80 tiles em blocos de 16, semente fixa.
- **Tudo é gerado por código ao carregar** ("Pintando o vale… 0–100 %", ~25 s): sprites, cenário, texturas, minimapa. Nenhum arquivo de imagem.
- Ciclo **dia/noite** (300 s; tecla N), tochas e luzes de chama, névoa leve, pássaros, tufos de grama, partículas (faíscas, poeira, texto flutuante).
- Salvamento local, gamepad, toque (controles na tela), tela cheia.

## 2. Gráfico (o que o usuário gosta)
- **Cenário rico e colorido:** vila de casas enxaimel (madeira + reboco) com telhados de telha laranja e de ardósia azul, chaminés, poço de pedra, **torre do sino**, forja, cercas, caixotes, barris, pórtico com bandeiras vermelhas, árvores variadas (carvalho, pinheiro, pinheiro-prateado, árvore queimada), arbustos, pedras, flores, estradas de terra e **calçamento de pedra** na praça. Chão com ruído (grama em 3 tons, terra, pedra) e sombras suaves sob objetos.
- **Paleta saturada e quente de dia** (`grass #5E8C3A…`, `tile #C2643A…`, `slate #4A5A78…`, `gold #C9A24A…`, contorno marrom-escuro translúcido). Contorno suave, sem preto puro.
- **Personagens:** humanoides **desenhados por código com partes** (cabeça grande, tronco, membros), cabelo/cor trocáveis (herói, aldeões, Mira, Bruna), **5 direções** (as de lado espelhadas), animações: idle 4q, walk 8q, run 8q, ataque 3 × 6q, rolamento 6q, dano 2q, morte 5q. Animais (lobo, alfa, javali, javali-rei, filhote) com a mesma técnica.
- **UI com identidade própria:** painéis de madeira escura com moldura **dourada**, título com degradê dourado e serifa (Georgia), **retrato circular** do herói com barras de vida e fôlego, **ícones de habilidade circulares** (Q giratório, E investida), **minimapa redondo com borda de ouro**, caixa de diálogo, missão no canto, botões grandes vermelhos com borda dourada, borrão do fundo no título.

## 3. Jogabilidade (o que o usuário quer manter)
| Ação | Controle |
|---|---|
| Mover | WASD / setas |
| Correr | Shift (gasta fôlego) |
| Atacar (combo ×3) | Espaço / clique |
| Golpe giratório | Q (recarga 6 s) |
| Investida | E (recarga 8 s) |
| Esquiva (rolamento) | Ctrl / C / botão direito (custa 20 de fôlego) |
| Interagir | F |
| Mapa · Pausa · Dia/noite · Depuração | M · Esc · N · F3 |

- Movimento **livre em 8 direções** no plano isométrico (andar 2,2 · correr 3,5 tiles/s), mira pelo mouse.
- Números: vida 100, fôlego 100, dano 12, combo [12, 14, 20], crítico 10 %, regeneração de vida após 5 s sem dano.
- **Inimigos:** lobo (vida 40), lobo-alfa (250, chefe), javali (55), lobo acuado, **javali-rei** (340, chefe). Patrulha, visão, perseguição.
- Estrutura em **fases** (Fase 1 "Lobos do Vale", "A Noite do Sino", "Mata de Cinzaprata"), com NPCs (Mestre Odran, ferreira Bruna, Mira), loja, baús, diálogos, ondas de inimigos, resgate de filhote.
- Lê-se **ação em tempo real simples e tátil**, tipo hack'n'slash isométrico, com HUD sempre visível.

## 4. Diferenças em relação ao que o time construiu até aqui (e por que o usuário não gostou)
| | Protótipo (alvo) | Esqueleto cinza (rejeitado) |
|---|---|---|
| Visão | **Isométrica 2:1 fixa**, câmera segue o herói | Ortográfica 3D a 35°, sala vazia |
| Cenário | Pintado, rico, vivo (vila, árvores, objetos) | Caixas cinza |
| Sprite | Personagem grande e legível, 5 direções, animação fluida | Boneco placeholder |
| Resolução | 1280×720 nativa, nítida | 640×360 ×3 |
| Cor | Quente, saturada, de "jogo de fantasia" | Cinza, sombrio |
| UI | Madeira + ouro, retrato, ícones, minimapa | Texto de debug |
| Controles | Combo, giro, investida, rolamento, interagir, mapa | Só andar |

## 5. O que o usuário pediu
Manter **aquela ideia** de gráfico e jogabilidade e deixar **mais bonito e polido**: **sprites bem feitas**, **cenário e UI melhores**. A história atual (Edric, Baixo Orvalho, o Sino de Cobre, Maren, Torvan, Grace…) **continua valendo**; o protótipo é **referência de estilo e de jogo**, não de enredo (embora tenha sino, forja, lobos e um mestre, que podem inspirar a vila e os inimigos).

## 6. Pontos que os agentes devem decidir/propor (cada um no seu documento)
- Como chegar a um acabamento **mais polido** sem perder o que o protótipo tem (sprites melhores, luz, partículas, sombras, profundidade, transições, UI refinada).
- Como combinar **o visual do protótipo** com a direção **A · Lanterna e Musgo** já escolhida (D-008) e com os telegraphs obrigatórios (aviso magenta etc.).
- Como o **combate do protótipo** (combo, giro, investida, rolamento, fôlego) convive com as regras do projeto (aviso em todo golpe inimigo, quadros a 60 Hz, dados fora do código).
