# Guia Visual

> **Status:** v1.0 — RASCUNHO para aprovação (BRF-011 / D-024). Autor: 10 Diretor de Arte · 2026-10-24.
> **Reescrito a partir do protótipo "Vale de Dunwick"** (`referencia/prototipo/index.html`, https://dunwick.netlify.app), **combinado com a direção A · Lanterna e Musgo** (D-008) e com o **ciclo dia/noite**. Substitui a v0.3 (pixel art 640×360 em 3D a 35°), arquivada em `_provisorio/guia_visual_v0.3_pixel-art.md`.
> Vale para 04 Sprites, 07 Cenários e UI e para o 08 (ADR-002). Hierarquia: usuário > Bíblia > este guia.
> **[ETAPA 2]** = depende do roteiro de cor por região. **[ADR-002]** = requisito visual cujo limite numérico espera o 08. **[USUÁRIO]** = decisão que sobe ao usuário (§14).
> Arquivos irmãos: [paleta.json](paleta.json) · [direcoes_clima.md](direcoes_clima.md) · [itens_modelo.md](itens_modelo.md) · [cena_modelo_praca.md](cena_modelo_praca.md).

## 0. O que muda e o que fica (v0.3 → v1.0)

| Tema | v0.3 (rejeitada) | v1.0 (alvo do protótipo) |
|---|---|---|
| Visão | 3/4 ortográfica a 35°, cenário 3D | **Isométrica 2:1 fixa**, câmera 2D que segue o herói |
| Resolução | 640×360 de arte, escala 3× | **1280×720 nativos**; tile **64×32** (sem grade de 32 px) |
| Estilo do sprite | pixel art 16-bit, 4 direções, alpha 0/255 | **Pintura suave por código**: contorno suave, sombreamento em passos, **5 direções** espelhadas |
| Cor | neutra, sombria, 64 cores | **Quente e saturada de dia** + direção A (fim de tarde, sombra azul-esverdeada, lanternas) |
| Luz | 3D com normal map | **Camadas 2D**: grade de cor, luz aditiva, sombras projetadas, rim light pintado no sprite |
| UI | rascunho pergaminho/latão | **Madeira escura + ouro** do protótipo, mais refinada |
| Telegraph | magenta | **Magenta (mantido)**, em losangos/elipses isométricos |
| Mantém | pilares de leitura, telegraph obrigatório, flashes ≤ 3/s, efeitos desligáveis, originalidade, tudo por código, convenções D-007 (perigo só no mundo; alerta de UI à parte), IDs `fx_` e luz curta de impacto (A1), 3 perfis de qualidade |
| Cai | 640×360, 35°, 32 px/tile, 4 direções, "sem filtro" de pixel, normal map por sprite, 64 cores |

## 1. Pilares

**diorama vivo · forma limpa · luz que conta**

1. **Diorama vivo** — a tela é uma maquete quente e densa: casas, árvores, bandeiras, flores, fumaça, pássaros. Sempre há algo se movendo (chama, folha, bandeira, água).
2. **Forma limpa** — silhueta clara, contorno suave e uniforme, bordas sem serrilhado nem borrão; personagens grandes que se leem de relance.
3. **Luz que conta** — luz e sombra guiam o olho e dão a hora e o humor; sombra é cor (azul-esverdeada), nunca preto.

## 2. Palavras-chave e anti-palavras

| Palavras-chave | Anti-palavras |
|---|---|
| enxaimel, telha e ardósia, calçamento, madeira e ouro, entardecer, musgo, lanterna, orvalho, poeira dourada, bandeirola, maquete viva, calor humano | neon, cromado, plástico, sangue gráfico, preto puro, céu azul-cartão-postal, glow em tudo, gradiente de janela azul, pixel borrado, cinza-sem-vida |

Humor do jogo: **aventura acolhedora com melancolia** (a vila adormecida, o sino). O visual deve **acolher primeiro** e entristecer só quando a história pedir (estado "adormecida", §5.3).

## 3. Especificação (requisitos)

| Item | Requisito | Situação |
|---|---|---|
| Resolução de arte | **1280×720** nativos (16:9). A janela escala o quadro final; sprites e texturas são desenhados já no tamanho final | travado como alvo; método de escala **[ADR-002]** |
| Projeção | **isométrica 2:1**: `tela_x = (x − y)·32`, `tela_y = (x + y)·16`; 1 tile = losango **64×32 px**; unidade do mundo = 1 tile | travado (igual ao protótipo) |
| Câmera | fixa na inclinação; **segue o herói** com suavização (≈ 0,1) e leve antecipação; sem rotação nem zoom do jogador. Movimentos de câmera (aproximação, tremor) só em cenas, entrada de chefe e golpes especiais (§11) | travado; valores com 03 |
| Ordenação | por profundidade `x + y` do ponto dos pés; um objeto grande ordena por sua base | travado |
| Mapa | grade de tiles; blocos de 16×16 em cache; 80×80 no protótipo (tamanho do slice: 06/07) | proposta |
| Filtro | suave **dentro** do desenho (antialias); no mundo, sprites e tiles são posicionados em **pixel inteiro** para não tremer ao mover a câmera | travado |
| Escala da janela | qualquer; sem borrão perceptível a 1,0× e 1,5×; prefira fator inteiro quando couber (2× em 1440p) | **[ADR-002]** |
| Herói e NPCs | célula **128×128**, âncora nos pés **(64,112)**, corpo ≈ **70 px**, cabeça ≈ **24 px (≈ 1/3 da altura)** | proposta do 04, **confirmado pelo 10**; **[USUÁRIO]** Q3 |
| Inimigos | pequeno 96×96 (36–48 px); médio 128×128 (48–64 px); chefe **320×320** (≈ 200 px) | confirmado (plano do 04) |
| Direções | **5 desenhadas** (S, SE, E, NE, N); as outras 3 espelhadas. Movimento livre em 8 direções usa a direção mais próxima (`DIR8→DIR5`) | travado |
| Animação | idle 6 fps · walk 10 · run 14 · ataques 16 · rolamento 15 (protótipo); tempo por quadro ajustável nos metadados | travado como ponto de partida |
| Contorno | **1 px translúcido, marrom-escuro** (`rgba(42,30,20,0.7)`), mais escuro na base e no contorno externo, mais fraco onde a luz bate. Nunca preto puro | travado |
| Sombreamento (personagens) | **3–4 passos por material**, luz fixa **frontal-superior-esquerda**, passo de sombra fria / luz quente; bordas suaves (supersampling 4× reduzido) | proposta do 04, confirmada |
| Rim light | luz de borda fria de 1–2 px no lado oposto à luz principal; no noite/tocha vira quente do lado da fonte | requisito novo |
| Sombra no chão | **não pintada no sprite**: elipse de contato (camada à parte) + sombra projetada (§4) | travado |
| Cenário: escala | parede ≥ **1,8×** a altura do herói; porta ≈ **1,35×**; telhado do enxaimel ocupa 40 % da altura da casa; árvore média ≈ 2,5× herói | proposta; ajustar na cena-modelo |
| Paleta | por **rampas de material** (3–6 passos) em [paleta.json](paleta.json); sem limite de 64 cores | provisória |
| Peso | todo o visual **por código**, sem imagem externa; orçamento por área vem do 08 (download ≤ ~10 MB) | **[ADR-002]** |

## 4. O que é "mais polido" (nível de polimento)

O protótipo é a régua. "Mais bonito e polido" tem **3 níveis**; o slice precisa chegar ao **P2**.

| Nível | Significado | Conteúdo |
|---|---|---|
| **P1 — paridade** | tão bom quanto o protótipo | isométrico 2:1, vila rica, grama em 3 tons, calçamento, sombras de objeto, ciclo dia/noite, tochas, UI madeira e ouro |
| **P2 — polimento do slice (meta)** | o que o usuário pediu: "mais bonito, sprites bem feitas, cenário e UI melhores" | tudo abaixo |
| **P3 — extra** | só se sobrar tempo/orçamento | tilt-shift, reflexos, clima (chuva), variantes sazonais |

### 4.1 Tabela de polimento (P2)

| Dimensão | Protótipo (P1) | Meta do slice (P2) | Como verifico |
|---|---|---|---|
| **Personagens** | cápsulas uniformes, rosto de 2 pontos, 1 gradiente por parte | membros afilados com articulação, rosto com olhos/sobrancelha/boca, mãos com polegar, cabeça ≈ 1/3, cel-shading de 3–4 passos, rim light, movimento secundário (cabelo, capa, recibo do cinto) | itens-modelo (`itens_modelo.md` M1) lado a lado com o protótipo |
| **Animação** | pose por quadro | antecipação → golpe → recuperação, rastro (smear) da arma, squash & stretch leve, rolamento enrolado com poeira, morte em 2 tempos | revisão quadro a quadro |
| **Luz** | grade multiply por hora + brilho aditivo em janelas e tochas | **5 horas** (§5.1) com cor de luz, sombra e névoa próprias; luz de lanterna com **halo + poça de luz no chão**; luz curta de impacto (§11); luz do herói sempre sobe um pouco a leitura em combate | cena-modelo nas 3 horas |
| **Sombras** | polígono achatado sob objeto, elipse sob entidade | **sombra projetada** por objeto com **comprimento e cor da hora** (longa e azul-esverdeada ao fim da tarde), **bordas suaves** (pré-renderizada), **oclusão ambiente** (faixa escura de 6–10 px na base de paredes), **sombra de copa** manchando o chão | cena-modelo; zoom 1:1 |
| **Partículas** | faíscas, poeira, texto flutuante, pássaros | + poeira dourada e pólen ao fim da tarde, folhas, fumaça de chaminé, vaga-lumes e brasas à noite, respingos, gotas de orvalho, faíscas da forja | lista de `amb_`/`fx_` (§11) com orçamento |
| **Profundidade** | ordenação e sombras | + **névoa em camadas** nas bordas do mapa (cor de mel ao fim da tarde), vinheta, cena com **3 planos** (primeiro plano, plano de combate, fundo), objetos entre câmera e herói **recortados em pontilhado/alpha 0,35** | cena-modelo; captura sem HUD |
| **Cenário** | casas, árvores e props variados | **variação por tile** (sem repetição visível a 3 telas), bordas de transição grama↔terra↔pedra, detalhes (flores, pedras, capim, cacos, teias), **vida** (bandeiras balançando, fumaça, pássaros, aldeões em rotina) | checklist de kit (§8) |
| **UI** | painéis madeira e ouro, retrato, minimapa | madeira com **veios gerados**, ouro **biselado** (realce + sombra interna), cantos com **ornamento próprio** (sino e gota de orvalho), rebites, retrato com expressão, barras com **barra de atraso** e brilho, ícones com símbolo próprio e brilho de prontidão, **transições de 150–250 ms** | telas do 07 contra a tabela §9 |
| **Feedback** | número flutuante, pausa de impacto | + tingimento do alvo no acerto, tremor curto desligável, luz curta, faíscas por força (§11) | fichas `fx_` |
| **Carregamento** | ~25 s pintando ao abrir | sprites gerados **em build** (04) e carga rápida; barra com a mesma identidade visual | meta do 08 (ADR-002) |

### 4.2 Regras para não "polir demais"
1. **Leitura antes de brilho:** nenhum efeito, luz, névoa ou partícula esconde o telegraph, o herói ou um inimigo.
2. **Orçamento primeiro:** cada item do P2 tem um interruptor no perfil de qualidade (§5.4). Se não couber a 60 fps na máquina de referência, cai de perfil, não de estilo.
3. **Coerência:** um único ângulo de luz (esquerda-cima-frente), uma única direção de sombra por hora, uma única escala de contorno.

## 5. Luz, hora e pós-processamento

### 5.1 As 5 horas (tabela de partida; valores em [paleta.json](paleta.json) → `luz_por_hora`)

| Hora | Direção | Grade (multiply) | Sombra projetada | Névoa | Luzes artificiais | Partículas típicas |
|---|---|---|---|---|---|---|
| **Manhã** | C/A | `#FFE8CC` | azul-esverdeada, comprimento 1,4 | `#DDE8E0` leve | apagadas | orvalho, pólen |
| **Dia** | C | `#FFFFFF` | neutra-verde, comprimento 0,8 | `#E6EEF0` mínima | apagadas | pétalas, borboletas |
| **Fim de tarde (hora-base)** | **A** | `#FFC892` | azul-esverdeada, comprimento 1,6 | `#F2D3A0` cor de mel | começam a acender (35 %) | poeira dourada, folhas |
| **Crepúsculo** | A→B | `#E0A890` | azul-arroxeada, comprimento 1,8 | `#B8A8C8` | acesas (80 %) | vaga-lumes, brasas |
| **Noite** | B | `#5F6B98` | azul-escura, comprimento 0,5 | `#6A78A8` | acesas (100 %) | vaga-lumes, brasas, fumaça |

- O grade de **noite não pode ser mais escuro que o do protótipo** (luminância ≥ 0,149). Combate à noite continua legível: luz do herói (raio ≈ 150 px, como no protótipo) e **luz de preenchimento na faixa de combate**.
- O ciclo é **contínuo e interpola** as horas (nada de corte seco). Duração de partida: **300 s** (protótipo); tecla N liga/desliga; o 06/03 decide se a hora afeta jogo (não afeta no slice).
- **Combinação com a direção A:** o **fim de tarde** é a hora-base do jogo (Baixo Orvalho aparece nela por padrão, §5.3); **dia** vem do protótipo e da direção C (região aberta); **noite** é a direção B (masmorra e cenas tristes).

### 5.2 Camadas de desenho (ordem)

| # | Camada | Observação |
|---|---|---|
| 0 | fundo / borrão do título | só em telas |
| 1 | **chão**: tiles, ruído, estradas, calçamento, flores | em cache por bloco |
| 2 | **decalques e sombras**: contato, projetada, oclusão ambiente, marcas | |
| 3 | **telegraph e zonas de dano** | **emissivo** (§10) |
| 4 | **objetos e entidades** ordenados por profundidade | com recorte quando cobrem herói/inimigo |
| 5 | **partículas e efeitos do mundo**, texto flutuante | |
| 6 | **grade de cor** da hora (multiply) | |
| 7 | **luzes aditivas** (`lighter`): janelas, lanternas, tochas, forja, luz de impacto, sino | com halo e poça no chão |
| 8 | **névoa em camadas e vinheta** | |
| 9 | **HUD e diálogo** | nunca recebe grade nem névoa |

### 5.3 Estados da vila (D-019) e a hora

| Estado | Luz padrão | Efeito emocional |
|---|---|---|
| **Dia** (parte 1) | fim de tarde dourado (A), ciclo opcional | acolhedor, vivo |
| **Adormecida** | crepúsculo azulado **parado** (B suave), lanternas acesas, sem partículas animadas além de poeira | quieto, estranho, melancólico |
| **Acordada** | manhã clara (C/A), orvalho, pássaros | alívio |

Regra: o estado muda **grade, sombra e partículas**, nunca a identidade (casas, paleta de material).

### 5.4 Perfis de qualidade (requisitos; custos reais **[ADR-002]**)

| Recurso | Alto | Médio | Baixo |
|---|---|---|---|
| Sombra projetada de objeto | suave, comprimento por hora | dura, opacidade fixa | só sombra de contato (elipse) |
| Oclusão ambiente na base das paredes | sim | sim | pintada no tile |
| Grade de cor por hora | interpolada | interpolada | 3 passos (dia, tarde, noite) |
| Luzes aditivas (halo + poça) | todas visíveis | só as 12 mais próximas | só tochas e a luz do herói |
| Névoa | em camadas + cor de mel | 1 camada | gradiente linear no topo |
| Tilt-shift / desfoque do fundo | leve (P3) | desligado | desligado |
| Vinheta | sim | sim | sim |
| Partículas de ambiente | 100 % | 60 % | 30 % |
| Rim light e cel-shading | no sprite (sempre) | sempre | sempre |
| Recorte de objeto sobre o herói | pontilhado | alpha 0,35 | alpha 0,35 |

Os **três perfis precisam ficar bonitos.** O Baixo troca halo/névoa por tons de profundidade e emissivo pintado; o sprite, o contorno e a paleta **não mudam**. Opções do menu: qualidade de efeitos, reduzir flashes, reduzir tremor, reduzir partículas, desligar desfoque (CLAUDE.md).

## 6. Paleta

- Arquivo: [paleta.json](paleta.json) — **provisória (v1.0.0-rascunho)**: 25 rampas por material (grama, copa de pinheiro, terra, pedra, madeira, reboco, ardósia, telha, rubi, ouro, aço, couro, linho, 3 tons de pele, cabelo, gibão do Edric, sombra azul-esverdeada, luz de fogo, sino) + rampas **reservadas** + a **tabela de luz por hora**.
- Cores de partida **lidas do protótipo** (`PAL`: grama `#5E8C3A…`, telha `#C2643A…`, ardósia `#4A5A78…`, ouro `#C9A24A…`, contorno marrom-escuro) e **estendidas** com os passos escuros azul-esverdeados da direção A.
- **Reservadas:**
  - `perigo_*` (magenta): **100 % para golpe vindo no mundo** (telegraph e zona de dano). **Nunca na UI** (D-007).
  - `brilho_*` (dourado claro): interativos, coletáveis e foco da UI.
  - `alerta_ui_*` (vermelho-brasa): só UI/HUD (erro, vida baixa), sempre com ícone + texto.
  - `sino_aqua_*` (azul-esverdeado): só o Sino de Cobre, a marca do Edric e a Bênção.
- **Por que o perigo continua magenta:** o vermelho e o laranja já ocupam o cenário (telhas, bandeiras, chamas) e se confundem com musgo e terra no daltonismo; o magenta ficou distinto em todos os modos.
- **Validação (no próprio JSON, 4 modos de visão):** contraste da UI (texto 13:1, secundário 10:1, borda 6,8:1); ΔE perigo × chão ≥ 0,12; brilho × chão ≥ 0,10; perigo × vermelhos do cenário ≥ 0,12; gibão do Edric × chão (ΔL ≥ 0,19); noite ≥ protótipo.
- **Atenção às flores rosadas do protótipo:** só tons claros e dessaturados, fora da faixa do magenta (`perigo_2`, `perigo_3`); nunca em área grande.
- **[ETAPA 2]:** cores por região (floresta, estrada, caverna, feira), acentos de inimigos e facções, rampas de VFX por escola.

## 7. Sprites (o que o 10 exige; execução com o 04 em `sprites/plano_sprites_v2.md`)

- **Proporção:** cabeça ≈ 1/3; silhueta única por personagem (herói: **uma ombreira só**); teste obrigatório "silhueta preta sobre grama, terra e calçamento".
- **Contraste de leitura:** o herói é o ponto de maior contraste da tela. Como o gibão do Edric é verde-musgo e a grama é verde, ele usa o **musgo azulado e escuro** (`musgo_edric`), **rim light**, **faixa de linho clara** no antebraço e a **ombreira de couro** (ΔL ≥ 0,19 contra o chão típico).
- **Luz desenhada:** frontal-superior-esquerda em 3–4 passos; sombra fria, luz quente; rim light frio (dia/tarde) ou quente (noite/tocha).
- **Sombra no chão:** não pintada; vem da cena (elipse de contato e projetada).
- **Rosto:** olhos com brilho, sobrancelha e boca; expressão por animação (dano, ataque, medo).
- **Movimento secundário:** cabelo, capa, cachecol, recibo do cinto do Edric, xale da Maren (atraso de 1–2 quadros).
- **Aviso de golpe do inimigo:** pose exagerada + retenção de 3–6 quadros + brilho de contorno (`perigo_4`, curto); o **telegraph no chão** é do VFX (§10), o sprite dá só a pose.
- **Eventos de quadro** (passo, hit_start/hit_end, som, efeito) ficam nos `.meta.json` (D-003/04).
- **Marca do Edric:** desenho de sino no antebraço esquerdo, **aqua** (`sino_aqua`) quando brilha; escondida pela faixa de linho.
- **Variações por troca de paleta** (aldeões, cores de lobo) são permitidas; identidades de personagem-história não.

## 8. Cenários (o que o 10 exige; kit com o 07)

- **Kit isométrico:** casas enxaimel (madeira + reboco), telhado de **telha laranja** e de **ardósia azul**, chaminés de tijolo, janelas com luz de noite, **torre do sino** (aqui, o pórtico com o gancho vazio do Sino de Cobre), poço de pedra, forja, cercas, caixotes e barris, pórtico com bandeirolas, bancas, quadro de avisos, lanternas, árvores (carvalho, pinheiro, pinheiro-prateado, árvore queimada), arbustos, pedras, flores, capim, estradas de terra, calçamento da praça.
- **Variação:** 3 variantes por casa (tamanho, telhado, chaminé, janelas, vasos), tiles de grama em 3 tons com ruído, 3 estados de vila (D-019).
- **Chão:** caminho andável com valor e textura mais calmos; **transições suaves** entre grama, terra e pedra (sem emendas retas visíveis).
- **Vegetação:** copa **balançando** (vento), sombra de copa no chão; arbusto e capim ao redor do plano de combate **nunca escondem** telegraph nem inimigo.
- **Oclusão:** objeto alto entre a câmera e o herói/inimigo é **recortado** (alpha 0,35 / pontilhado), conforme o perfil.
- **Cartaz de lugar:** cada região tem uma **cor-assinatura** [ETAPA 2] e um **detalhe-assinatura** (ex.: Baixo Orvalho — telhados de musgo, lanternas, poço da praça).
- **Detalhes de vida:** fumaça de chaminé, bandeirolas, pássaros, aldeões em rotina, roupa no varal, lanternas que acendem no fim da tarde.

## 9. UI (resumo; detalhes com o 07)

**Identidade:** madeira escura + ouro, **ornamento próprio: sino e gota de orvalho** (cantos, divisores, ícone de salvar). Nada de janela azul em degradê nem moldura de outro jogo.

| Elemento | Requisito |
|---|---|
| Painel | gradiente madeira (`ui_madeira_*`) com **veios gerados**, moldura de ouro **biselada** (2–3 px, realce + sombra interna), cantos com ornamento (losango no protótipo → **sino/gota**), rebites; sombra projetada suave |
| Título | serifa com degradê dourado e contorno marrom (como o protótipo), sem pixel borrado |
| Texto | linho (`linho_3`) sobre painel, secundário `linho_2`, destaque `ouro_5`; **≥ 14 px** (secundário) e **≥ 16 px** (diálogo) em 1280×720; opção de escala 100–150 %; reservar **+40 %** de espaço |
| Retrato | circular, borda de ouro, **expressão por estado** (normal, ferido, cansado) |
| Barras | pílula com **barra de atraso** (perda recente), brilho no topo; vida em `rubi`, fôlego em amarelo-ouro; **vida baixa** = pulso lento (≤ 1 Hz) + ícone de coração rachado + texto, em `alerta_ui` |
| Ícones de habilidade | circulares, símbolo próprio (giro, investida), **setor de recarga** com número, **brilho de prontidão** curto, tecla em selo |
| Minimapa | redondo, borda de ouro, rosa dos ventos, rotação opcional |
| Botão primário | `rubi_4` com borda `ouro_3`, realce interno, **estado de foco** em `brilho_*` e de pressionado (desce 1 px) |
| Diálogo | caixa de madeira com nome em ouro, retrato, indicador de "continuar" que pulsa |
| Missão / aviso | painel pequeno no canto, abre/fecha com fade + deslize de 180 ms |
| Prompt de interação | painel pequeno acima do alvo com tecla em destaque (como o protótipo), pulsa levemente |
| Movimento | painéis: 180 ms ease-out (escala 0,96→1 + fade); barras suavizam; **nenhum flash** de tela cheia |
| Acessibilidade | contraste ≥ 4,5:1; alerta sempre com ícone + texto; opção de reduzir movimento da UI |

## 10. Convenções de leitura (rascunho; revisão com 03/06/07)

Regra: **cor + forma + movimento = significado**; nunca só cor.
Prioridade de atenção: **perigo > herói > inimigos > interativos > cenário > decoração.**

| Significado | Cor | Forma (no plano isométrico) | Movimento | Camada |
|---|---|---|---|---|
| **Telegraph de golpe** | `perigo_2` com borda `perigo_3` e contorno escuro `perigo_1` | zona exata no chão, **projetada em 2:1**: círculo → **elipse** (semi-eixos `r·45,3 × r·22,6` px por tile de raio); cone → setor projetado; retângulo/linha → **paralelogramo**; sempre com contorno | **enche da borda para o centro até o impacto**; mesma duração do aviso | acima do chão, abaixo dos personagens; **emissivo** (não escurece com a hora nem recebe névoa); nunca coberto por efeito do jogador |
| **Zona de dano contínuo** | `perigo` menos saturado | área com borda tracejada e padrão de listras | pulsa lento (≤ 1 Hz) | chão |
| **Golpe iminente no corpo** | brilho `perigo_4` curto na arma/olhos | pose de antecipação | 1 piscada | corpo |
| **Herói** | maior contraste da tela (musgo azulado + linho + rim) | silhueta com 1 ombreira | — | — |
| **Inimigo** | acento de ameaça [ETAPA 2], nunca magenta | silhueta angulosa/assimétrica | idle mais agitado que o de NPC | — |
| **Interativo** | `brilho` sutil | contorno de brilho + **prompt de tecla** ao aproximar | pulso lento | corpo/acima |
| **Coletável** | `brilho` + cor de raridade [ETAPA 2] | coluna de luz curta + forma do item | flutua/gira lento | acima do chão |
| **Saída/portal** | luz direcional fixa, temperatura diferente da cena | arco/abertura de luz | partículas indo para fora | cenário |
| **Ponto de salvamento** | luz quente estável | marco no mundo [ETAPA 2] | chama calma | cenário |

Reservas: **ninguém** usa magenta fora de golpe vindo no mundo (UI, VFX do herói, roupa, flores grandes); **ninguém** usa o dourado de `brilho` em decoração estática; **ninguém** usa `alerta_ui` fora da UI/HUD.

## 11. Efeitos visuais (resumo; fichas em `docs/arte/vfx/fx_<id>.md` depois dos itens-modelo)

- **Linguagem das escolas de magia:** tabela do documento do 10 §10.1 (fogo, gelo, raio, natureza, marcial) com as cores de `luz_fogo` e `sino_aqua`; elementos fixos **Fogo, Gelo, Raio, Natureza** (D-015); a **Bênção** é cor do rito (branco-dourado), não elemento.
- **IDs propostos (adendo A1 mantido):** `fx_impacto_leve`, `fx_impacto_medio`, `fx_impacto_forte`, `fx_impacto_critico` (só se o 06 mantiver crítico, D-007), `fx_impacto_bloqueio`, `fx_quebra_postura`, `fx_poeira_passo`, `fx_poeira_esquiva`, `fx_aviso_circulo/cone/retangulo/linha`, e `fx_<escola>_impacto` [ETAPA 2]. Ambiente: `amb_poeira_dourada`, `amb_folhas`, `amb_vagalumes`, `amb_fumaca_chamine`, `amb_faiscas_forja`, `amb_orvalho`.
- **Luz curta de impacto** (raios agora em px do tile 64×32):

| Força | Duração (quadros) | Raio (px) | Intensidade (tocha = 1,0) | Cor |
|---|---|---|---|---|
| leve | 4 | 64 | 0,6 | `luz_fogo_5` |
| médio | 6 | 96 | 0,9 | `luz_fogo_5` |
| forte | 8 | 144 | 1,3 | `ouro_5` |
| magia | conforme a ficha | — | ≤ 1,5 | cor da escola |

  Curva: pico no quadro do acerto, queda quadrática; **máx. 4** luzes de impacto simultâneas (pool); desligada no perfil Baixo e em "reduzir flashes"; telegraph nunca recebe essa luz.
- **Flash do alvo no acerto:** **tingimento do sprite** (não flash de tela), não conta no limite de 3/s; contam: flash de tela, bloom/halo de área grande e luz forte (limitador global). Com "reduzir flashes", o tingimento vira tom médio por 1 quadro.
- **Câmera especial** (entrada/transição de chefe, golpe especial): aproximação até **1,15×**, retorno suave ao padrão, **desligável**; tremor por nível (03 §8.2) em px (leve ≈ 3, médio ≈ 6, forte ≈ 12).
- **Orçamento:** ~150 partículas lógicas simultâneas (CLAUDE.md), 1 efeito de tela cheia por vez, flashes ≤ 3/s, tremor curto e desligável.

## 12. Faça / Não faça

| Faça | Não faça |
|---|---|
| Sprite com contorno suave uniforme e cel-shading de 3–4 passos | Gradiente linear único por parte, ou pixel art misturado com vetor |
| Cabeça ≈ 1/3, silhueta única, rim light | Personagem pequeno que some no cenário |
| Sombra em azul-esverdeado na direção A | Sombra preta ou cinza neutra |
| Telegraph magenta + forma isométrica exata + enchimento animado | Aviso só com cor, ou desenhado sob o grade da noite |
| Luz de lanterna com halo e poça no chão | Glow em tudo (bloom geral) |
| Cenário rico com variação e vida | Tiles repetidos em xadrez, vila "vazia" |
| UI em madeira e ouro com sino e gota de orvalho | Janela azul em degradê, moldura de outro jogo |
| Posicionar sprites em pixel inteiro no mundo | Câmera ou sprite tremendo por subpixel |
| 3 perfis bonitos | Perfil Baixo com cara de "quebrado" |
| Referência descrita em palavras | Cores, formas ou nomes de outros jogos |

## 13. Perguntas ao 08 (ADR-002), via Produtor

1. **Escala da janela:** o quadro de 1280×720 é escalado com qual filtro? Como evitar borrão a 1080p (1,5×) e manter sprites sem tremor (posição em pixel inteiro)?
2. **Sprites:** gerar em build para arquivo com `.meta.json` (recomendado) ou ao abrir? Atlas indexado? Cabe ~6–8 MB de sprites no teto de ~10 MB?
3. **Luz em Canvas 2D:** custo medido, na máquina de referência (Ryzen 3 5300G), de: grade multiply tela cheia, luzes aditivas com gradiente radial (quantas simultâneas?), halo + poça no chão, névoa em camadas, vinheta, por perfil.
4. **Sombras suaves:** sombra projetada pré-renderizada com borda suave por objeto/estado (cache) vs desenhada ao vivo; como variar comprimento e cor por hora sem recalcular tudo?
5. **Oclusão:** recorte de objetos que cobrem o herói/inimigos (pontilhado e alpha 0,35): custo e método.
6. **Telegraph emissivo:** melhor forma de não escurecê-lo com o grade (compensação de cor ao desenhar vs recomposição depois do grade com máscara de personagens)?
7. **Partículas:** o orçamento de ~150 cabe nos 3 perfis? Recebem luz da cena?
8. **Dia/noite:** custo da interpolação contínua do grade e da cor da sombra; ciclo desligável (N) sem salto.
9. **Tilt-shift/desfoque** do fundo (P3): viável barato em 2D (camada pré-borrada) ou fica de fora do slice?
10. **WebGL:** vale um caminho opcional com luz por normal map nos sprites (P3), ou fica só em 2D com rim light pintado?

## 14. Perguntas ao usuário (via Produtor)

1. **Estilo dos sprites** [USUÁRIO]: manter o desenho **suave do protótipo** (pintura por código, contorno suave; **recomendado**, é o que você aprovou) ou voltar ao **pixel art de pixels visíveis**?
2. **Hora-base de Baixo Orvalho** [USUÁRIO]: **fim de tarde dourado** (direção A que você escolheu, com ciclo dia/noite opcional pela tecla N; **recomendado**) ou **começar ao meio-dia** como no protótipo?
3. **Tamanho e proporção dos personagens** [USUÁRIO]: **maiores e com cabeça grande** (corpo ≈ 70 px, cabeça ≈ 1/3; **recomendado**, mais legível e expressivo) ou **iguais ao protótipo** (≈ 50 px, cabeça menor)?

## 15. Pendências

- Aprovação do usuário (§14) e do ADR-002 (§13) → travam a spec numérica (sombra, luz, escala).
- Aprovação dos **itens-modelo** (`itens_modelo.md`) e da **cena-modelo** (`cena_modelo_praca.md`) antes de qualquer produção em massa.
- Etapa 2: roteiro de cor por região (`cor_<regiao>.md`), acentos de inimigos, VFX por escola.
- Revisão das convenções de leitura (§10) com 03, 06 e 07; revisão dos nomes de ID de cenário (`env_`, `prop_`) com 07/Produtor.
- Atualizar `CLAUDE.md`/Bíblia (densidade 32 px/tile, 640×360, 4 direções) quando o ADR-002 for aceito (Produtor).

## Histórico
- v1.0 (2026-10-24) — reescrita a partir do protótipo (D-024); carrega a decisão da direção A (D-008), D-007 (perigo × alerta de UI) e o adendo A1 (IDs `fx_`, luz de impacto, flash).
- v0.1–v0.3 — pixel art 640×360 em 3D (arquivada em `_provisorio/`).
