# Changelog

## v0.1.4 — NPCs, diálogos, lojas, moeda e menu principal (em andamento)
- 6 NPCs na vila e nos interiores (Maren, Torvan, Ysolt, ferreiro, taverneira e escrivão), com sprites próprios, sombra, poses de idle e conversa por clique, toque ou `E`.
- Caixa de diálogo (nome do falante, texto aos poucos, avanço por clique, toque ou tecla) e lojas do ferreiro e da taverneira (comprar e vender, quantidade, total, mouse, teclado, toque e gamepad).
- Moeda **Coroa** (80 iniciais; venda a 50 %), tabela de preços e 9 itens novos, com equipamento de arma e armadura ligado ao motor de batalha.
- Menu principal de tela cheia (`C`, `Tab`, `I` ou ☰): Itens (usar em um personagem), Equipamento (comparar e trocar), Status e Sistema.
- Plataforma: esquemas de NPC, diálogo e loja, `plataforma.menu`, estado de moedas, mochila e equipamento sempre atual; tecla `0` soma Coroas só no modo de desenvolvimento.
- Decisões D-049 e D-050.

## v0.1.3 — Mapa de mundo (2026-11-03)
- Mapa de mundo estilizado "Campos de Baixo Orvalho": costa, praia com espuma, rio com ponte, lago, estradas, cordilheira em 3D com neve, floresta em massa com variedade de árvores, campos de cultivo e rochas com musgo; bordas orgânicas e água animada, sombras de nuvem e mar até o horizonte.
- Vila, bosque e caverna aparecem como marcadores no mundo; a vila é entrada pelo portal (saída sul da vila ↔ marcador), e o bosque e a caverna ficam interditados, com aviso.
- Edric de mundo (sprite própria, mais lento e maior), colisão do terreno (água e montanha), placa com o nome do marcador, banner "Campos de Baixo Orvalho" e minimapa desligado no mundo.
- Plataforma: tipo de mapa `mundo`, câmera e render de mundo, pré-compilação por mapa e perfis de densidade da floresta; FPS ~57 (pior 1 % ≥ 53 na maioria das rodadas).
- Decisões D-044, D-045, D-046 e D-048 (mundo aberto simples + locais ricos; baús só em locais; visual refeito).

## v0.1.2 — Vila completa com interiores e minimapa (2026-11-03)
- Vila de Baixo Orvalho completa (94×94): casas, taverna, forja, posto do escrivão, praça, poço e quadro, cercada por mata densa, cerca, muralha e estacada (sem "fim do mundo").
- Interiores com troca de mapa por portal (névoa escura): casas da Maren, do Torvan e do Edric, taverna, forja e posto do escrivão; só marcação no chão como saída. Vila 100% segura (sem encontros).
- Casa do Edric isolada no canto noroeste, com baú de tesouro (Pião Entalhado) e mochila infinita.
- Boneco de treino no pátio do Torvan: clique ou `E` abre uma batalha de treino repetível, sem XP, moedas ou drops (novo inimigo `enemy_boneco_treino`).
- Edric a 70% do tamanho no mapa; banner com o nome do mapa ao entrar em qualquer mapa.
- Minimapa girado com a câmera (tecla `M` ou botão ▦), com portas, locais e o cômodo inteiro nos interiores.
- Plataforma: luzes sem recompilar materiais (fim das travadas), shaders pré-compilados por mapa, `plataforma.mapaAtivo()`; FPS ~57 (teto do monitor), pior 1 % ≥ 53 nos 3 perfis.
- Decisões D-034 a D-044 (roteiro da demo, mundo aberto simples + locais ricos) registradas.

## v0.1.1 — Batalha por turnos jogável (2026-10-29)
- Batalha por turnos (Edric e Grace contra Slime e Lobo): rodadas, comandos, habilidades, itens, defender e fugir; encontro por passos no mapa; vitória, derrota e recompensas.
- Cena de batalha 3D com sprites próprios, dano no instante do golpe, números e barras ao vivo.
- Jogável só com mouse ou toque; celular em paisagem ocupando a tela (aviso "Gire o celular" em pé).
- Jogo preenche a janela (escala contínua), tela de início, pausa (Esc/⏸), dica de controles, tela cheia e preferências salvas.
- Animação de andar, correr e parado do Edric no mapa.
- Ficha do chefe Hollowpaw e roteiro da demo v0.1.1–v0.1.8 (docs).

## v0.1.0 — Esqueleto
- Praça de Baixo Orvalho isométrica, herói andando, base técnica (Three.js, dados validados, build e testes).
