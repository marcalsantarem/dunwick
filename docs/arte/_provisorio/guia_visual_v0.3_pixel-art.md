# Guia Visual

> **Status:** etapa 1 — RASCUNHO v0.2 (BRF-002) + adendo A1 (§13, alinhamento com o gameplay v0.1). Autor: 10 Diretor de Arte.
> v0.2: alerta de UI separado do perigo (D-007); paleta v0.2.
> v0.3: direção de clima **A · Lanterna e Musgo** escolhida pelo usuário (D-008); §7.1 = tabela de cor padrão.
> Vale para 04 Sprites, 07 Cenários e UI e para os spikes do 08. Hierarquia: usuário > Bíblia > este guia.
> **[ETAPA 2]** = depende da premissa/mundo (D-006); até lá vale o padrão escrito ao lado.
> **[TRAVA 08]** = requisito visual cujo limite numérico espera os spikes do 08 (BRF-001); não está travado.
> Clima visual: **decidido pelo usuário (D-008)** — base **A · Lanterna e Musgo**; a masmorra pode puxar para **B · Cinza e Brasa** e a região aberta de dia para **C · Iluminura**. Detalhes em [direcoes_clima.md](direcoes_clima.md).

## 1. Pilares

**diorama vivo · pixel nítido · luz que conta**

1. **Diorama vivo** — cada tela é uma maquete iluminada: há planos de profundidade, ar (névoa, poeira) e algo sempre se move (folha, chama, água).
2. **Pixel nítido** — o pixel art nunca é borrado, girado nem escalado em valor quebrado; o "moderno" vem da luz e do pós, não de suavizar o sprite.
3. **Luz que conta** — a luz guia o olho (caminho, perigo, interativo) e dá o tom; sombra é cor (fria), não preto.

Os pilares não dependem da premissa. Se a premissa pedir, o 3º pode ganhar outra palavra **[ETAPA 2]**.

## 2. Palavras-chave e anti-palavras

| Palavras-chave | Anti-palavras |
|---|---|
| maquete, miniatura, pedra, madeira, tecido, artesanal, luz quente, sombra fria, ar visível, silhueta clara | plástico, cromado, neon, glow em tudo, preto puro, gradiente de UI genérico, pixel borrado, "mix de resoluções", ruído sem função |

**Clima (direção A, D-008):**

| Palavras-chave | Anti-palavras |
|---|---|
| entardecer, musgo, lanterna, pedra úmida, poeira no ar, maquete de mesa, calor humano | neon, cromado, sangue, céu azul-cartão-postal, preto puro, glow em tudo |

Quando uma região puxar para B ou C, vale a lista daquela direção em [direcoes_clima.md](direcoes_clima.md), só naquela região.

## 3. Especificação (requisitos)

| Item | Requisito | Situação |
|---|---|---|
| Densidade | **1 tile = 1 unidade do mundo = 32×32 px de arte**, em sprites, texturas, UI e efeitos | travado |
| Área visível | referência **640×360 px de arte**; escala **inteira** (2× em 720p, 3× em 1080p, 4× em 1440p, 6× em 4K) | travado; em telas fora de proporção, sobra vira moldura ou mais mundo, nunca escala quebrada |
| Filtro | vizinho mais próximo em tudo que é pixel art (sprites, texturas, UI, VFX) | travado |
| Câmera de jogo | 3/4 inclinada **35°** (faixa aceitável 30–45°), campo de visão estreito (≈ 15–25°, aparência de maquete), fixa | ângulo final **[TRAVA 08]** (depende de como o pixel fica nítido no spike) |
| Herói e NPCs | célula **64×64**, corpo **44–48 px**, **2,5–3 cabeças** de altura, âncora nos pés **(32,60)** | travado |
| Inimigos | 32–96 px de altura; chefe 128–256 px; célula múltipla de 32 | travado |
| Direções | 4 desenhadas: S, N, L; O espelhada; diagonais usam o lado | travado |
| Animação | 8–12 fps, tempo por quadro ajustável nos metadados | travado |
| Alpha | só 0 ou 255 (sem semitransparência pintada) | travado |
| Paleta | mestra ≤ 64 cores em rampas; **16–32 cores por sprite**; sombras frias, luzes quentes | provisória ([paleta.json](paleta.json)); final **[ETAPA 2]** |
| Contorno | **seletivo (selout)**: escuro na base e nas bordas externas, sem contorno preto contínuo; o tom do contorno é o passo mais escuro da rampa do material | travado |
| Luz desenhada | **suave, frontal-superior**, volume em 2–3 passos; pouca sombra pintada — a sombra forte vem da cena | travado |
| Mapas extras | **normal map** por sprite (todo quadro) + **máscara de brilho** opcional (olhos, runas, lâminas, chamas) | convenção do normal map: **[TRAVA 08]** (ADR-001) |
| Sprite no mundo | plano vertical voltado para a câmera, ancorado nos pés, com **sombra projetada** da silhueta + **sombra de contato** no chão | travado como requisito; técnica com o 08 |
| Cenário | geometria 3D simples (blocos, rampas, telhados, rochas) com texturas pixel art de 32 px por tile | travado |

## 4. Paleta

- Arquivo: [paleta.json](paleta.json) — **provisória e neutra** (v0.2), só para placeholders e spikes. 64 cores em 15 rampas: neutros frios e quentes, 3 tons de pele, aço, latão, madeira, pedra, vegetação, terra, **perigo**, **brilho**, UI e **alerta de UI**.
- Gerador e validador: [_provisorio/gerar_paleta.py](_provisorio/gerar_paleta.py) (fica aí até o ADR-001 definir a ferramenta dos geradores).
- Construída em espaço de cor perceptual (OKLCH) com **deslocamento de matiz**: o passo escuro de cada rampa puxa para azul/violeta, o claro para amarelo. Isso já põe "sombra fria, luz quente" dentro do pixel.
- **Rampas reservadas** (não usar em roupa, cenário ou decoração):
  - `perigo_*` (magenta quente) → **100 % para golpe vindo no mundo**: avisos de golpe e zonas de dano. **Nunca na UI** (D-007).
  - `brilho_*` (dourado claro) → interativos, coletáveis, luzes de destaque e **foco da UI** (a UI conta como interativo).
  - `alerta_ui_*` (vermelho-brasa) → **só UI/HUD**: erro de UI e vida baixa, sempre com **forma + ícone + texto**. Nunca no mundo.
- **Por que o perigo é magenta, e não vermelho:** no teste de daltonismo (protanopia, deuteranopia e tritanopia simuladas), o vermelho se confundia com musgo, pedra e terra. O magenta ficou distinto de todo chão da paleta nos 4 modos de visão. De quebra, não colide com fogo (laranja) nem com sangue/ferimento. **Proposta para revisão com 03/06/07.**
- Validação embutida no próprio JSON (`validacao`), nos 4 modos de visão (normal, protanopia, deuteranopia, tritanopia):
  - contraste sobre o painel da UI: texto 16,2:1, secundário 9,6:1, borda 3,7:1, alerta 5,1:1;
  - distância ≥ 0,10 ΔE OKLab entre perigo × chão (pior 0,125), brilho × chão (0,115), perigo × brilho (0,187) e alerta de UI × perigo/brilho (0,104).
- O alerta de UI fica perto do limite contra o perigo em tritanopia. Isso é aceitável porque os dois **nunca dividem a mesma camada** (um só no mundo, o outro só na UI) e o alerta sempre vem com ícone e texto.
- **[ETAPA 2]:** cor-assinatura do herói (recomendação para a direção A: fria, azul/ciano), acentos de inimigos/facções, cores por região, rampas de VFX por escola de magia, ajuste final para 64.

## 5. Sprites

- **Proporção:** cabeça ≈ 40 % da altura; cabeça e cabelo carregam a personalidade (ver Bíblia §Referências: proporção 16-bit, não personagens).
- **Silhueta:** reconhecível só pelo preenchimento escuro — teste obrigatório "silhueta preta sobre fundo médio".
- **Contraste interno:** a cabeça e as mãos/arma são as áreas de maior contraste; roupa de base em valores médios.
- **Luz desenhada:** frontal-superior suave; nada de luz lateral pintada (a cena faz isso pelo normal map).
- **Sombra:** sem sombra no chão desenhada no sprite (vem da cena); sombra interna mínima (1–2 passos).
- **Normal map:** um por quadro, mesmo tamanho e mesma âncora; o volume deve "ler" como bola/cilindro (cabeça redonda, tronco cilíndrico), sem ruído de pixel a pixel. A codificação (eixos, verde para cima ou para baixo) quem define é o 08 **[TRAVA 08]**.
- **Máscara de brilho:** só áreas que emitem luz; 1 bit (liga/desliga).
- **Eventos de quadro** (passo, hit_start/hit_end, som, efeito) ficam nos `.meta.json` — combinar com 03/04.

## 6. Cenários

- **Densidade de textura:** 32 px por tile em toda superfície; paredes e telhados alinhados à grade de tiles para não distorcer o pixel.
- **Geometria:** formas simples e chanfradas; volume vem da luz, não de polígonos. Nada de curvas lisas de alta contagem.
- **Leitura do chão:** caminho andável com valor e textura mais calmos; bordas e quedas com contorno de luz/sombra claro.
- **Vegetação:** grama e arbustos como sprites no mundo (planos voltados para a câmera) ou cartões cruzados; balanço leve de vento; nunca mais alta que a cintura do herói no plano de combate (não esconder perigo).
- **Água:** superfície em pixel art animada com reflexo simplificado; brilho especular limitado ao limiar do bloom.
- **Primeiro plano:** objetos entre câmera e herói (galhos, colunas) recebem desfoque e ficam **translúcidos/recortados** quando cobrem o herói ou um inimigo.
- Materiais e kit modular por região: **[ETAPA 2]** com o 07.

## 7. Luz e pós-processamento (requisitos) — [TRAVA 08]

O que cada recurso **precisa fazer**. Custos, resolução de sombra e quantidades saem dos números do 08.

| Recurso | Requisito visual | Alto | Médio | Baixo |
|---|---|---|---|---|
| Luz-chave (sol/lua) | 1 direcional com sombra; define a hora do dia | sombra suave de boa resolução | sombra menor, borda dura | **sem sombra projetada**; só sombra de contato |
| Luzes pontuais | tochas, janelas, magia; sprites reagem pelo normal map | várias, algumas com sombra | várias sem sombra | poucas, sem sombra |
| Sombra de contato (blob) | todo personagem e prop móvel | sim | sim | sim (**obrigatória**) |
| Profundidade de campo / tilt-shift | foco na faixa do herói; desfoque no primeiro plano e no fundo | desfoque de qualidade | desfoque simplificado | **gradiente de névoa/escurecimento** no lugar do desfoque |
| Bloom | tochas, magia, cristais, sol; limiar alto | sim | reduzido | desligado (luz emissiva pintada) |
| Névoa de distância | profundidade e clima | sim | sim | sim (barata, linear) |
| Luz volumétrica | florestas, cavernas, catedrais | sim | desligada | desligada |
| Oclusão ambiente | assentar props no chão | sim | pré-calculada | pré-calculada/pintada |
| Correção de cor por região | identidade emocional (tabela de cor) | sim | sim | sim (é barata) |
| Vinheta | moldura sutil de diorama | sim | sim | sim |
| Partículas de ambiente | poeira, folhas, brasas, vaga-lumes | 100 % | ~60 % | ~30 % |

**Regras para todos os perfis:**
- Os **três perfis precisam ficar bonitos.** O Baixo não é o "Alto quebrado": troca desfoque por névoa e tons de profundidade, e troca bloom por emissivo pintado.
- O desfoque **nunca** atinge a faixa de combate (herói, inimigos próximos, avisos) nem a UI.
- Névoa nunca reduz o contraste de aviso/perigo abaixo do mínimo; avisos são desenhados **depois** da névoa.
- Bloom não estoura branco em áreas grandes (conta para o limite de flashes).
- Valores por região (sol, névoa, tabela de cor): **[ETAPA 2]**; até lá vale a tabela padrão do §7.1.

### 7.1 Tabela de cor padrão (direção A · Lanterna e Musgo, D-008)

Valores de partida para os spikes, a cena-modelo e as regiões que ainda não têm roteiro. Provisórios: o roteiro de cor de cada região (`cor_<regiao>.md`, etapa 2) pode sobrescrever qualquer linha. Os valores numéricos finais saem dos números do 08 **[TRAVA 08]**.

| Parâmetro | Padrão (A) | Variação B · Cinza e Brasa (ex.: masmorra) | Variação C · Iluminura (ex.: região aberta de dia) |
|---|---|---|---|
| Hora | fim de tarde (sol baixo) | indiferente (luz fraca/encoberta) | meio-dia a meio da manhã |
| Luz-chave | sol baixo lateral, âmbar (~3000–3500 K), elevação ~15–25° | céu difuso ~7000 K, sem sombra direcional forte | sol alto branco-quente (~5000 K), elevação ~50–60° |
| Cor da sombra | azul-esverdeada escura (passos frios de `neutro_frio` e `vegetacao`), nunca preto | azul-acinzentada | azul-clara |
| Luzes pontuais | quentes (lanternas, janelas, tochas) acendendo; cor em `metal_latao`/`brilho` claros | fogo é a luz principal: poças quentes num mundo frio | poucas, só como acento |
| Névoa | leve, **cor de mel** (âmbar claro), começa longe | densa, cinza-azulada, encurta a vista | quase nenhuma |
| Contraste geral | médio-alto, guiado pela luz | alto localmente, baixo no geral | médio, uniforme |
| Saturação | média; picos na luz e na vegetação | baixa; cor só em fogo, magia, herói e perigo | alta |
| Tilt-shift/desfoque | médio | médio | forte (aparência de miniatura) |
| Bloom | suave, limiar alto | reforçado só nas luzes de fogo | baixo |
| Vinheta | leve | média | leve |
| Partículas de ambiente | poeira e pólen dourados, folhas | cinza, brasas, vapor | pétalas, borboletas |
| Cor-assinatura do herói | **fria** (azul/ciano), para saltar sobre o fundo quente — cor exata **[ETAPA 2]** | idem | idem |

Regras de uso:
1. A direção A é a base de **todo** o jogo; B e C são variações de região, nunca de interface. Moldura de UI, perigo, brilho e alerta (§4, §8, §9) **não mudam** entre direções.
2. Leitura em combate vem antes de clima: em B, a névoa e o escuro ganham luz de preenchimento na faixa de combate para o perigo nunca sumir (§7).
3. Transição entre regiões: a cor do sol e da névoa interpola ao longo de alguns tiles; nada de corte brusco.

## 8. UI (resumo; detalhes com o 07)

- **Moldura:** madeira escura e pergaminho/linho com cantos de metal (latão) — material **do mundo**, não "janela de sistema". **Proibido:** janela azul em degradê, molduras e ícones reconhecíveis de outros jogos.
- **Cores:** rampa `ui_*` (painel escuro quente, borda, texto secundário, texto); destaque e foco em `brilho_*` (a UI conta como interativo).
- **Alerta na UI (erro, vida baixa):** cor `alerta_ui_2` (vermelho-brasa), com contorno ou fundo em `alerta_ui_1`. **Sempre com forma + ícone + texto**, nunca só a cor. Exemplos: barra de vida baixa ganha ícone de coração rachado e pulso lento (≤ 1 Hz); mensagem de erro com ícone de "!" em losango e texto. **Magenta (`perigo_*`) nunca aparece na UI:** ele é exclusivo de golpe vindo no mundo (D-007).
- **Fonte:** pixel font legível, desenhada na grade de 32 px; tamanho mínimo de texto ≈ 8 px de arte de altura de x (validar a 2×). Fonte específica: com o 07; com licença checada pelo 08/01.
- **Ícones:** 16×16 ou 32×32 px, silhueta antes de detalhe, mesma luz frontal-superior.
- **Espaço:** +40 % para texto (CLAUDE.md); nunca frases montadas por concatenação.
- HUD nunca cobre avisos de golpe nem o herói.

## 9. Convenções de leitura (rascunho para revisão com 03/06/07)

Regra: **cor + forma + movimento = significado**; nunca só cor.
Prioridade de atenção: **perigo > herói > inimigos > interativos > cenário > decoração.**

| Significado | Cor | Forma | Movimento | Camada |
|---|---|---|---|---|
| **Aviso de golpe (telegraph)** | `perigo` (magenta) com borda clara `perigo_4` e contorno escuro `perigo_1` | forma exata da zona no chão (círculo, cone, retângulo, linha) | **enche da borda para o centro até o impacto**; mesma duração do aviso | acima do chão, abaixo dos personagens; nunca coberta por efeito do jogador |
| **Zona de dano contínuo** | `perigo` com menos saturação/opacidade de padrão (pontilhado/listras) | área com borda tracejada | pulsa lento (≤ 1 Hz) | chão |
| **Golpe iminente no corpo do inimigo** | brilho `perigo_4` curto na arma/olhos | pose de antecipação exagerada | 1 piscada (conta no limite de flashes) | corpo |
| **Herói** | maior contraste da tela + cor-assinatura **[ETAPA 2]** | silhueta mais limpa | — | — |
| **Inimigo** | acento de ameaça **[ETAPA 2]** (nunca magenta) | silhueta angulosa/assimétrica | idle mais agitado que o de NPC | — |
| **Interativo** (porta, alavanca, NPC com conversa) | `brilho` sutil | contorno de brilho + ícone ao aproximar | pulso lento | corpo/acima |
| **Coletável no chão** | `brilho` + cor de raridade **[ETAPA 2]** | coluna de luz curta + forma do item | flutua/gira lento | acima do chão |
| **Saída/portal** | luz direcional fixa, temperatura diferente da cena | arco/abertura de luz | partículas indo para fora | cenário |
| **Ponto de salvamento** | luz quente estável | marco no mundo **[ETAPA 2]** | chama/brilho calmo | cenário |

Reservas de cor:
- **Ninguém** usa magenta fora de golpe vindo no mundo. Isso vale para UI, VFX do herói e roupas.
- **Ninguém** usa o dourado de `brilho` em decoração estática.
- **Ninguém** usa `alerta_ui` fora da UI/HUD.

## 10. Faça / Não faça

| Faça | Não faça |
|---|---|
| Sprite em escala inteira e filtro sem suavização | Escalar 1,5×, girar sprite, usar filtro linear |
| Sombra pintada mínima; deixar a cena iluminar | Pintar sombra forte de um lado no sprite (briga com as luzes da cena) |
| Contorno seletivo, mais escuro na base | Contorno preto contínuo em volta de tudo |
| Sombra em azul/violeta escuro | Sombra em preto puro ou em cinza neutro |
| Perigo magenta + forma + enchimento animado | Aviso só com cor, ou vermelho que some no musgo |
| Desfoque só fora da faixa de combate | Desfocar inimigo próximo ou a UI |
| Perfil Baixo com névoa e tons de profundidade | Perfil Baixo como o Alto com tudo desligado e cara de "quebrado" |
| UI com materiais do mundo (madeira, linho, latão) | Janela azul em degradê ou qualquer UI reconhecível de outro jogo |
| Uma única densidade (32 px/tile) em tudo | Misturar arte de 16 px e 32 px por tile, ou UI em resolução de tela |
| Referência descrita em palavras | Usar sprite, paleta extraída, criatura ou símbolo de outro jogo como base |

## 11. Perguntas ao 08 (via Produtor)

Para fechar os itens **[TRAVA 08]**:
1. **Câmera:** com 35° de inclinação e FOV estreito, o pixel do sprite e da textura de chão fica nítido em escala inteira (1×, 2×, 3×)? Precisa de *snap* da câmera/sprites à grade de pixel de arte para não tremer em movimento?
2. **Sprites iluminados:** é viável um normal map por quadro, mais a máscara de brilho, nas ~40 entidades na tela? Qual a convenção de normal map (verde para cima ou para baixo, espaço do sprite)?
3. **Sombras:** quantas luzes com sombra projetada por perfil? O sprite consegue projetar a sombra da **silhueta** (com alpha recortado) a partir do sol e das tochas?
4. **Pós:** custo medido de tilt-shift/profundidade de campo, bloom, névoa e volumétrica por perfil. Qual é o perfil Baixo realista (desfoque desligado é o bastante?)
5. **Luzes pontuais:** quantas sem sombra cabem por perfil a 60 fps (para tochas e magias simultâneas)?
6. **Partículas:** o orçamento de ~150 partículas/projéteis cabe nos 3 perfis? Partículas recebem luz da cena ou só emitem?
7. **Resolução interna:** o mundo é renderizado em 640×360 e depois escalado (pixel perfeito, mas o 3D fica serrilhado), ou em resolução nativa com o sprite em escala inteira (3D liso, pixel misturado)? Preciso dos dois prints no spike para decidir o visual.
8. **Translucidez do primeiro plano:** dá para recortar ou deixar translúcido um objeto que cobre o herói sem custo alto?

## 12. Pendências

- ~~Escolha da direção de clima~~ — **resolvida (D-008):** A · Lanterna e Musgo como base; masmorra pode puxar para B, região aberta de dia para C. Tabela de cor padrão no §7.1.
- Etapa 2 (depois do mundo do 02; premissa do usuário ainda pendente): roteiro de cor por região (`cor_<regiao>.md`) dizendo qual região usa A, B ou C, cor-assinatura do herói, acentos, paleta final.
- Trava da spec de câmera, luz e pós depois dos números do 08 (BRF-001).
- Convenções de leitura: revisão com 03, 06 e 07.

## 13. Adendo A1 — respostas ao `docs/gameplay.md` v0.1 (03, §12.3 e §5.6)

> 2026-10-24 · pedido do Produtor. Propostas; o 03 aplica nos dados e o 08 confirma custos.

### A1.1 Câmera
- **`camera_angulo_graus = 35`: confirmado** pelo lado visual. Fica provisório até o spike do 08 mostrar o pixel nítido em 1×/2×/3× (§11, perguntas 1 e 7).
- **`camera_area_visivel_tiles = 20 × 11,25`: confirmado** — é exatamente a referência de 640×360 px de arte ÷ 32 px por tile (§3).
- **`camera_oclusao_alpha = 0,35`:** de acordo como valor. Proponho que o objeto oculto seja recortado com **pontilhado em grade de pixel de arte** (dither ordenado), e não com uma transparência suave, para manter a linguagem do pixel; alpha suave só se o dither custar caro (08 decide).

### A1.2 Direção do sprite nas diagonais (divergência com a §4.6 do 03)
O 03 propõe que diagonais usem S/N. Este guia (§3) e o documento do 10 dizem "diagonais usam o lado". **Proposta de meio-termo:**
- **Na diagonal, mantém a direção atual se ela for uma das duas componentes** (ex.: andando para L e virando para SE continua L; vindo de S e virando para SE continua S). Isso evita o sprite piscar entre poses.
- **Partindo de PARADO direto na diagonal:** usa o **lado** (L/O). O perfil mostra melhor o movimento e o arco da arma no setor de ataque diagonal.
- Ataque: vira para a direção mais próxima do alvo/mira no 1º quadro e não troca durante o golpe.
Decisão final do Produtor, com o 03 e o 04.

### A1.3 IDs de efeitos de impacto e de combate (slice)
Padrão: `fx_<categoria>_<variante>`. Cada ficha vai em `docs/arte/vfx/fx_<id>.md` (§10.3 do documento do 10).

| ID | Gatilho (evento) | Camada | Observação |
|---|---|---|---|
| `fx_impacto_leve` | `golpe_acertou` com força leve | corpo | faísca curta + 4 partículas |
| `fx_impacto_medio` | força média | corpo | + arco de corte curto na direção do golpe |
| `fx_impacto_forte` | força forte | corpo + chão | + anel de poeira no chão |
| `fx_impacto_critico` | acerto crítico (se o 06 tiver crítico) | corpo | variante do forte com forma própria (estrela de 4 pontas); sem flash extra |
| `fx_impacto_bloqueio` | golpe bloqueado / sem dano | corpo | faíscas para fora, cor `metal_aco` |
| `fx_quebra_postura` | postura/atordoamento do alvo quebrado | acima | marca em volta da cabeça do alvo |
| `fx_poeira_passo` | evento de quadro `passo` (correr) | chão | 1–2 partículas; desliga no perfil Baixo |
| `fx_poeira_esquiva` | `esquiva_inicio` | chão | rastro curto na direção da esquiva |
| `fx_aviso_circulo` / `fx_aviso_cone` / `fx_aviso_retangulo` / `fx_aviso_linha` | `aviso_inicio` (forma) | chão (acima do chão, abaixo dos personagens) | enche até o impacto; cor `perigo` (§9) |

- Os IDs de impacto da §5.6 do 03 (`fx_impacto_leve/medio/forte`) ficam **como estão**.
- Golpes físicos usam a linguagem **marcial** (branco/cinza, cortes, sem luz colorida). Impactos de magia herdam a escola: `fx_<escola>_impacto` **[ETAPA 2]**, quando as escolas do mundo existirem.

### A1.4 Regra da luz curta de impacto
Luz pontual **sem sombra**, criada no ponto do acerto (`ponto` do evento `golpe_acertou`), a 0,5 tile do chão.

| Força | Duração (quadros) | Raio (tiles) | Intensidade de pico (relativa à tocha padrão = 1,0) | Cor |
|---|---|---|---|---|
| leve | 4 | 1,5 | 0,6 | `neutro_quente_4` (branco quente) |
| médio | 6 | 2,0 | 0,9 | `neutro_quente_4` |
| forte | 8 | 3,0 | 1,3 | `brilho_3` (branco-dourado) |
| magia | conforme a ficha | — | ≤ 1,5 | cor da escola **[ETAPA 2]** |

Regras:
1. **Curva:** pico no quadro do acerto e queda suave (quadrática) até zero; nunca pisca liga/desliga.
2. **Teto:** a intensidade nunca passa do limiar do bloom em mais que um pequeno halo. Nada de estourar branco em área grande.
3. **Limite simultâneo:** máximo de **4 luzes de impacto** ao mesmo tempo (número final do 08). A 5ª reaproveita a mais antiga (pool), nunca cria luz nova.
4. **Avisos imunes:** marcadores de aviso (`fx_aviso_*`) são desenhados sem receber luz (emissivos). Luz de impacto e bloom nunca reduzem a leitura do aviso.
5. **Perfil Baixo / "reduzir flashes":** sem luz de impacto; o próprio sprite do efeito carrega o brilho (pintado). No perfil Médio, a luz só aparece em médio e forte.

### A1.5 Flash branco do alvo e o limite de ≤ 3 flashes/s
O combo leve acerta várias vezes por segundo e, com vários alvos, passaria de 3 flashes/s. Proposta:
- O "flash branco" da §5.6 é um **tingimento do sprite do alvo** (área pequena), em tom claro da paleta (`neutro_frio_6`), e **não um flash de tela**. Não conta no limite.
- **Contam no limite de 3/s:** flash de tela, bloom de área grande e luz de impacto forte. Um limitador global descarta o excedente: o efeito acontece, só que sem o pico de luz.
- Com "reduzir flashes" ligado, o tingimento troca o branco por um tom médio (`neutro_frio_4`) por 1 quadro.
