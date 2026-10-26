# Guia Visual

> **Status:** etapa 1 — RASCUNHO v0.4 (BRF-002) + adendo A1 (§13, alinhamento com o gameplay v0.1). Autor: 10 Diretor de Arte.
> v0.2: alerta de UI separado do perigo (D-007); paleta v0.2.
> v0.3: direção de clima **A · Lanterna e Musgo** escolhida pelo usuário (D-008); §7.1 = tabela de cor padrão.
> **v0.4 (D-025): câmera isométrica.** O estilo continua **HD-2D** (sprites de pixel art nítido em cena 3D com luz, sombra, profundidade e névoa); a v0.3 foi **restaurada** e só mudou o que a câmera isométrica pede: ângulo, área visível, direções do sprite, leitura de profundidade/sobreposição/oclusão, marcadores do mouse e níveis de polimento. Marcado **[ISO]** onde mudou. O protótipo do usuário é **só referência do estilo isométrico**, não se copia (a tentativa baseada nele está em `_provisorio/d024_descartado_prototipo/`).
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
| Densidade | **1 tile = 1 unidade do mundo = 32×32 px de arte** em **sprites, UI e efeitos**. Texturas de **chão e parede**: ver a linha abaixo | travado (sprites/UI/FX) |
| Texturas de chão e parede **[ISO]** | com a câmera girada 45° e achatada, uma textura de 32 px/tile vira **menos de 1 pixel de tela por texel** e **serrilha/pisca** ao mover. Requisito: chão e parede **nítidos e sem tremer** em movimento. Recomendação: **64 texels por tile** (2× o sprite), pintadas em pixel art, com mipmap e filtro que preserve a nitidez (a mistura "sprite de pixel nítido em mundo mais detalhado" é a própria assinatura do HD-2D); alternativa: tiles isométricos pré-assados em losango. **O 08 testa as duas no ADR-002.** Muda a regra "densidade única" do CLAUDE.md (Produtor decide) | **[TRAVA 08]** |
| Área visível **[ISO]** | referência **960×540 px de arte** (era 640×360): em isométrico 1 tile é um losango de **≈ 45×23 px** e a tela mostra **≈ 21 tiles na diagonal horizontal × ≈ 24 na vertical** (visão de ação à Diablo). Escala **inteira** do pixel de arte: **2× em 1080p**, 4× em 4K. Em outras telas, fator inteiro mais próximo; sobra ou falta vira mais/menos mundo (entre 0,8× e 1,5× da referência) ou moldura, nunca escala quebrada | proposta do 10; **[TRAVA 08]** (confirmar no ADR-002) |
| Filtro | vizinho mais próximo em tudo que é pixel art (sprites, UI, VFX); pós-processamento e mundo em resolução nativa da tela | travado |
| Câmera de jogo **[ISO]** | **isométrica fixa**: giro **45°** + inclinação **30°** (o chão vira losango **2:1**, 30° é a inclinação que dá exatamente 2:1); projeção **ortográfica ou de campo de visão muito estreito (≈ 10–15°)** para o pixel não variar com a distância; **segue o herói** com suavização; sem rotação nem zoom do jogador. Movimento de câmera (aproximação, tremor) só em cenas, entrada de chefe e golpes especiais | ângulo final e tipo de projeção **[TRAVA 08]** (spike de nitidez do pixel) |
| Projeção no chão **[ISO]** | eixo +x do mundo → tela **(+22,6; +11,3) px por tile**; +y → **(−22,6; +11,3)**; altura +z → **(0; −27,7) px por unidade** (cos 30° × 32). Ordenação de desenho por profundidade `x + y` do ponto dos pés | travado como requisito (números exatos com o 08) |
| Herói e NPCs | célula **64×64**, corpo **44–48 px**, **2,5–3 cabeças** de altura, âncora nos pés **(32,60)** | travado |
| Inimigos | 32–96 px de altura; chefe 128–256 px; célula múltipla de 32 | travado |
| Direções **[ISO]** | **5 desenhadas**: S, SE, E, NE, N; as outras 3 espelhadas. No isométrico as **diagonais é que dominam a tela**, então o "só frente/costas/lado" da v0.3 não serve. Movimento livre em 8 direções (e mira do mouse) usa a direção mais próxima; o ataque trava a direção no 1º quadro | travado (alinhado ao plano do 04) |
| Animação | 8–12 fps, tempo por quadro ajustável nos metadados | travado |
| Alpha | só 0 ou 255 (sem semitransparência pintada) | travado |
| Paleta | mestra ≤ 64 cores em rampas; **16–32 cores por sprite**; sombras frias, luzes quentes | provisória ([paleta.json](paleta.json)); final **[ETAPA 2]** |
| Contorno | **seletivo (selout)**: escuro na base e nas bordas externas, sem contorno preto contínuo; o tom do contorno é o passo mais escuro da rampa do material | travado |
| Luz desenhada | **suave, frontal-superior**, volume em 2–3 passos; pouca sombra pintada — a sombra forte vem da cena | travado |
| Mapas extras | **normal map** por sprite (todo quadro) + **máscara de brilho** opcional (olhos, runas, lâminas, chamas) | convenção do normal map: **[TRAVA 08]** (ADR-001) |
| Sprite no mundo **[ISO]** | plano **vertical na tela** (inclinado para compensar os 30°), ancorado nos pés, com **sombra projetada** da silhueta + **sombra de contato** no chão; **posição em pixel de arte inteiro** para não tremer | travado como requisito; técnica com o 08 |
| Luz-chave **[ISO]** | fixa em relação à tela: vem do **alto-esquerda-atrás**; faces voltadas para a esquerda ficam claras, as da direita escuras; sombras caem para **baixo-direita na tela**. A hora do dia muda **cor, altura (comprimento da sombra) e intensidade**, não a direção | travado |
| Cenário | geometria 3D simples (blocos, rampas, telhados, rochas) com texturas pixel art (densidade na linha "Texturas de chão e parede") | travado |
| Altura do cenário **[ISO]** | em isométrico o que está **mais perto da câmera tapa o que está atrás**; por isso: parede na faixa de combate **≤ 2× a altura do herói (≈ 90 px)**, sem muros altos "na frente" de áreas de luta; construções grandes só nas bordas e com **corte/recorte** (§9.1) | travado |

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
- **5 direções [ISO]:** S, SE, E, NE, N (o resto espelhado). O personagem é visto de cima-de-lado, então **cabeça e ombros ocupam mais área** que numa visão frontal; o desenho precisa funcionar em **3/4** (rosto, ombreira e arma legíveis nas diagonais). Assimetrias do herói (ombreira só no ombro direito, faixa no antebraço esquerdo) **não se resolvem só espelhando**: o espelho vale para a pose, a ombreira e a faixa invertem no desenho.
- **Silhueta no chão:** a base do sprite (pés + sombra de contato) deve ocupar um **losango/elipse 2:1** sob o personagem para ancorá-lo ao chão e mostrar para onde ele está virado.
- **Luz desenhada:** frontal-superior suave; nada de luz lateral pintada (a cena faz isso pelo normal map).
- **Sombra:** sem sombra no chão desenhada no sprite (vem da cena); sombra interna mínima (1–2 passos).
- **Normal map:** um por quadro, mesmo tamanho e mesma âncora; o volume deve "ler" como bola/cilindro (cabeça redonda, tronco cilíndrico), sem ruído de pixel a pixel. A codificação (eixos, verde para cima ou para baixo) quem define é o 08 **[TRAVA 08]**.
- **Máscara de brilho:** só áreas que emitem luz; 1 bit (liga/desliga).
- **Eventos de quadro** (passo, hit_start/hit_end, som, efeito) ficam nos `.meta.json` — combinar com 03/04.

## 6. Cenários

- **Densidade de textura [ISO]:** ver §3 (chão e parede: 64 texels/tile recomendados, **08 decide**); paredes e telhados alinhados à grade de tiles; as **linhas do chão correm em diagonal na tela**, então juntas de pedra, trilhas e muros devem seguir os eixos do mundo (nunca horizontais na tela).
- **Faces visíveis [ISO]:** só 2 faces de cada volume aparecem (esquerda clara, direita escura) + o topo. Dê a cada uma **material e luz próprios**; a face de trás nunca é vista, não gaste detalhe nela.
- **Telhados e interiores [ISO]:** telhado e parede da frente **desaparecem (fade ou corte)** quando o herói entra, para mostrar o interior; o interior é desenhado como **diorama cortado**.
- **Geometria:** formas simples e chanfradas; volume vem da luz, não de polígonos. Nada de curvas lisas de alta contagem.
- **Leitura do chão:** caminho andável com valor e textura mais calmos; bordas e quedas com contorno de luz/sombra claro.
- **Vegetação:** grama e arbustos como sprites no mundo (planos voltados para a câmera) ou cartões cruzados; balanço leve de vento; nunca mais alta que a cintura do herói no plano de combate (não esconder perigo).
- **Água:** superfície em pixel art animada com reflexo simplificado; brilho especular limitado ao limiar do bloom.
- **Primeiro plano:** objetos entre câmera e herói (galhos, colunas) recebem desfoque e ficam **translúcidos/recortados** quando cobrem o herói ou um inimigo (regras em §9.1).
- Materiais e kit modular por região: **[ETAPA 2]** com o 07.

## 7. Luz e pós-processamento (requisitos) — [TRAVA 08]

O que cada recurso **precisa fazer**. Custos, resolução de sombra e quantidades saem dos números do 08.

| Recurso | Requisito visual | Alto | Médio | Baixo |
|---|---|---|---|---|
| Luz-chave (sol/lua) | 1 direcional com sombra; define a hora do dia | sombra suave de boa resolução | sombra menor, borda dura | **sem sombra projetada**; só sombra de contato |
| Luzes pontuais | tochas, janelas, magia; sprites reagem pelo normal map | várias, algumas com sombra | várias sem sombra | poucas, sem sombra |
| Sombra de contato (blob) | todo personagem e prop móvel | sim | sim | sim (**obrigatória**) |
| Profundidade de campo / tilt-shift **[ISO]** | foco numa **faixa diagonal** em volta do herói; em isométrico o "fundo" é a parte de **cima da tela** e o "primeiro plano" a de **baixo**, então o desfoque sobe pela borda superior e desce pela inferior (efeito de maquete) | desfoque de qualidade | desfoque simplificado | **gradiente de névoa/escurecimento** no lugar do desfoque |
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

### 7.0 Níveis de polimento — "bonito, polido e trabalhado" (HD-2D) [ISO]

O alvo é o acabamento HD-2D (sprite de pixel nítido em mundo iluminado), **não** o do protótipo. O slice precisa chegar ao **P2**; cada item tem interruptor no perfil de qualidade (§7), então o que não couber a 60 fps cai de perfil, **não de estilo**.

| Nível | O que é | Conteúdo |
|---|---|---|
| **P1 — base (mínimo para a cena-modelo)** | tudo que dá a cara de diorama iluminado | câmera isométrica, luz-chave com sombra projetada, sombra de contato, luzes pontuais (tochas, lanternas), névoa de distância, correção de cor por hora/região, vinheta, partículas de ambiente, normal map nos sprites |
| **P2 — meta do slice** | "mais polido e trabalhado" | **oclusão ambiente** na base de paredes e props, **sombra de copa** sobre o chão, **halo e poça de luz** de lanterna, **bloom** nas luzes, **tilt-shift** em faixa (perfil Alto), **luz volumétrica** em frestas (caverna/floresta), **rim light** e contorno hierárquico nos sprites, movimento secundário (cabelo, capa, bandeiras, vegetação ao vento), **marcadores de mouse** animados (§9.1), transições de UI de 150–250 ms, luz curta de impacto (A1.4) |
| **P3 — extra** | só se sobrar tempo e orçamento | reflexos na água, clima (chuva, neve), variantes sazonais, câmera dramática em golpes especiais |

**Regras:** (1) leitura antes de brilho: nenhum efeito esconde o telegraph, o herói ou um inimigo; (2) um único ângulo de luz e uma única direção de sombra; (3) todo efeito tem versão reduzida (menos partículas, sem flash, sem tremor, sem desfoque).

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
| **Aviso de golpe (telegraph)** | `perigo` (magenta) com borda clara `perigo_4` e contorno escuro `perigo_1` | forma exata da zona no chão, **projetada em 2:1 [ISO]**: círculo de raio `r` tiles → **elipse** de semi-eixos `r·45,3 × r·22,6` px; cone → setor projetado; retângulo/linha → **paralelogramo** alinhado aos eixos do mundo (diagonais na tela); sempre com contorno | **enche da borda para o centro até o impacto**; mesma duração do aviso | acima do chão, abaixo dos personagens; nunca coberta por efeito do jogador; **visível mesmo sob objeto alto** (§9.1) |
| **Zona de dano contínuo** | `perigo` com menos saturação/opacidade de padrão (pontilhado/listras) | área com borda tracejada | pulsa lento (≤ 1 Hz) | chão |
| **Golpe iminente no corpo do inimigo** | brilho `perigo_4` curto na arma/olhos | pose de antecipação exagerada | 1 piscada (conta no limite de flashes) | corpo |
| **Herói** | maior contraste da tela + cor-assinatura **[ETAPA 2]** | silhueta mais limpa | — | — |
| **Inimigo** | acento de ameaça **[ETAPA 2]** (nunca magenta) | silhueta angulosa/assimétrica | idle mais agitado que o de NPC | — |
| **Interativo** (porta, alavanca, NPC com conversa) | `brilho` sutil | contorno de brilho + ícone ao aproximar | pulso lento | corpo/acima |
| **Coletável no chão** | `brilho` + cor de raridade **[ETAPA 2]** | coluna de luz curta + forma do item | flutua/gira lento | acima do chão |
| **Saída/portal** | luz direcional fixa, temperatura diferente da cena | arco/abertura de luz | partículas indo para fora | cenário |
| **Ponto de salvamento** | luz quente estável | marco no mundo **[ETAPA 2]** | chama/brilho calmo | cenário |

| **Alvo sob o cursor [ISO]** | contorno claro `neutro_frio_6` (nunca magenta nem dourado de brilho) | contorno de 1 px em volta da silhueta do inimigo/NPC/objeto sob o mouse + anel no chão | pulsa 1× ao entrar | corpo + chão |
| **Destino do clique [ISO]** | `neutro_quente_5` (branco quente) | **anel em losango 2:1** no ponto clicado | expande e some em ~0,4 s | chão, sob os personagens |
| **Mira / direção do ataque [ISO]** | `neutro_quente_5` | cursor próprio (mira pequena) + traço curto do herói até o cursor, só enquanto ataca | — | chão/acima |

### 9.1 Leitura em isométrico: profundidade, sobreposição e oclusão [ISO]

1. **Ordenação:** desenha-se por profundidade `x + y` do ponto dos pés (objeto grande: pela base). Sprites se sobrepõem de forma previsível; o de baixo da tela fica na frente.
2. **Herói sempre legível:** quando um objeto o cobre, mostra-se a **silhueta do herói por cima**, com contorno e preenchimento de ~35 % na **cor-assinatura fria** [ETAPA 2], e o objeto fica **recortado em pontilhado** (ou alpha 0,35, conforme o perfil) num raio ≈ 3 tiles em volta dele. Inimigos cobertos **não** ganham silhueta (o jogador não deve "ver através" de tudo), mas o **telegraph deles continua visível**.
3. **Telegraph sob objeto alto:** o contorno e o enchimento do aviso são redesenhados por cima do objeto em alpha ≈ 0,6; nunca ficam totalmente escondidos.
4. **Telegraph emissivo:** não escurece com a hora do dia nem recebe névoa; desenhado depois das camadas de cor da cena, mas **abaixo dos personagens** (o 08 define o método).
5. **Sobreposição entre inimigos e chefe:** o chefe grande (128–256 px) nunca cobre o herói por mais de ~30 % da área do herói; se cobrir, aplica-se a regra 2 também ao herói em relação ao chefe. Aglomeração: sombras de contato separam as figuras.
6. **Paredes e telhados:** na faixa de combate, parede ≤ 2× a altura do herói (§3). Edifício que cobre o herói **some em fade (telhado e parede da frente)**, não por recorte duro.
7. **Alturas diferentes:** degraus, rampas e plataformas mostram a **face lateral** (esquerda clara/direita escura) e **sombra de queda**; o herói em nível mais alto ganha **sombra de contato no próprio degrau**, nunca no chão de baixo.
8. **Objetos pequenos no chão** (itens, marcadores) ficam **sempre acima do chão e abaixo dos personagens**, com a coluna de luz/brilho que os separa do cenário.

Reservas de cor:
- **Ninguém** usa magenta fora de golpe vindo no mundo. Isso vale para UI, VFX do herói e roupas.
- **Ninguém** usa o dourado de `brilho` em decoração estática.
- **Ninguém** usa `alerta_ui` fora da UI/HUD.

## 10. Faça / Não faça

| Faça | Não faça |
|---|---|
| Sprite em escala inteira e filtro sem suavização; posição em pixel de arte inteiro | Escalar 1,5×, girar sprite, usar filtro linear, deixar o sprite "nadar" em subpixel quando a câmera segue o herói |
| Linhas do cenário nos eixos do mundo (diagonais na tela) | Juntas, trilhas e muros horizontais na tela, que quebram a perspectiva |
| Telegraph como losango/elipse 2:1 projetado no chão | Círculo "redondo" de tela ou aviso desenhado sob parede |
| Muro e edifício baixos na faixa de combate; fade ao entrar | Parede alta na frente de uma arena de luta |
| Marcadores de mouse discretos (destino, alvo) | Cursor ou marcador com magenta ou com o dourado de interativo |
| Sombra pintada mínima; deixar a cena iluminar | Pintar sombra forte de um lado no sprite (briga com as luzes da cena) |
| Contorno seletivo, mais escuro na base | Contorno preto contínuo em volta de tudo |
| Sombra em azul/violeta escuro | Sombra em preto puro ou em cinza neutro |
| Perigo magenta + forma + enchimento animado | Aviso só com cor, ou vermelho que some no musgo |
| Desfoque só fora da faixa de combate | Desfocar inimigo próximo ou a UI |
| Perfil Baixo com névoa e tons de profundidade | Perfil Baixo como o Alto com tudo desligado e cara de "quebrado" |
| UI com materiais do mundo (madeira, linho, latão) | Janela azul em degradê ou qualquer UI reconhecível de outro jogo |
| Sprite, UI e FX em 32 px/tile; chão e parede em densidade escolhida no ADR-002 (§3) | Misturar arte de 16 px e 32 px por tile, ou UI em resolução de tela |
| Referência descrita em palavras | Usar sprite, paleta extraída, criatura ou símbolo de outro jogo como base |

## 11. Perguntas ao 08 (via Produtor)

Para fechar os itens **[TRAVA 08]**:
1. **Câmera isométrica [ISO]:** com giro 45° e inclinação 30° (losango 2:1), em **ortográfica** ou perspectiva de FOV ≈ 10–15°, o pixel do sprite fica nítido em escala inteira (1×, 2×)? Precisa de *snap* da câmera/sprites à grade de pixel de arte para não tremer ao seguir o herói? Qual das duas projeções recomenda?
1a. **Textura de chão e parede [ISO]:** o chão de 32 px/tile girado 45° serrilha/pisca. Medir **64 texels/tile com mipmap** contra **tiles pré-assados em losango** (nitidez, peso, custo). Qual recomenda?
1b. **Área visível [ISO]:** a referência de **960×540 px de arte (×2 em 1080p)** é viável (custo de desenho de ~21×24 tiles visíveis, ~40 inimigos)? Ou prefere outra base?
1c. **Oclusão [ISO]:** como desenhar a **silhueta do herói atrás de objetos** e o **telegraph por cima de objetos altos** (passada extra, máscara, stencil)? Custo.
2. **Sprites iluminados:** é viável um normal map por quadro, mais a máscara de brilho, nas ~40 entidades na tela? Qual a convenção de normal map (verde para cima ou para baixo, espaço do sprite)?
3. **Sombras:** quantas luzes com sombra projetada por perfil? O sprite consegue projetar a sombra da **silhueta** (com alpha recortado) a partir do sol e das tochas?
4. **Pós:** custo medido de tilt-shift/profundidade de campo, bloom, névoa e volumétrica por perfil. Qual é o perfil Baixo realista (desfoque desligado é o bastante?)
5. **Luzes pontuais:** quantas sem sombra cabem por perfil a 60 fps (para tochas e magias simultâneas)?
6. **Partículas:** o orçamento de ~150 partículas/projéteis cabe nos 3 perfis? Partículas recebem luz da cena ou só emitem?
7. **Resolução interna:** o mundo é renderizado em resolução **nativa da tela** (3D liso, com o sprite em escala inteira de pixel de arte — recomendado para o HD-2D) ou numa base baixa depois escalada (pixel perfeito, mas o 3D fica serrilhado)? Preciso dos dois prints no spike para decidir o visual.
8. **Translucidez do primeiro plano:** dá para recortar ou deixar translúcido um objeto que cobre o herói sem custo alto?

## 12. Pendências

- ~~Escolha da direção de clima~~ — **resolvida (D-008):** A · Lanterna e Musgo como base; masmorra pode puxar para B, região aberta de dia para C. Tabela de cor padrão no §7.1.
- Etapa 2 (depois do mundo do 02; premissa do usuário ainda pendente): roteiro de cor por região (`cor_<regiao>.md`) dizendo qual região usa A, B ou C, cor-assinatura do herói, acentos, paleta final.
- Trava da spec de câmera, luz e pós depois dos números do 08 (ADR-002, perguntas 1–1c do §11).
- Convenções de leitura (§9, §9.1): revisão com 03, 06 e 07.
- **Decisões que sobem ao usuário/Produtor [ISO]:** (1) **mudar a regra "densidade única 32 px/tile"** do CLAUDE.md para "sprite, UI e FX 32 px/tile; chão e parede conforme ADR-002" (recomendado 64 texels/tile); (2) **área visível 960×540** no lugar de 640×360. Ambas são propostas do 10 até o 08 medir.
- Atualizar `gameplay.md`: `camera_angulo_graus=35` e `camera_area_visivel_tiles=20×11,25` caem (ver A1.1); 03 define marcadores de mouse e tecla de "ficar parado/atacar sem mover" à Diablo.
- Itens-modelo e cena-modelo: **a refazer** para o HD-2D (`itens_modelo.md`, `cena_modelo_praca.md`) depois que o Produtor liberar; a versão baseada no protótipo está em `_provisorio/d024_descartado_prototipo/`.

## 13. Adendo A1 — respostas ao `docs/gameplay.md` v0.1 (03, §12.3 e §5.6)

> 2026-10-24 · pedido do Produtor. Propostas; o 03 aplica nos dados e o 08 confirma custos.

### A1.1 Câmera — **atualizado pela D-025 (isométrica)**
- ~~`camera_angulo_graus = 35`~~ → **`camera_giro_graus = 45` e `camera_inclinacao_graus = 30`** (losango 2:1); projeção ortográfica ou FOV ≈ 10–15° (08 decide). Fica provisório até o spike do 08 (§11, perguntas 1–1c).
- ~~`camera_area_visivel_tiles = 20 × 11,25`~~ → **referência 960×540 px de arte** (≈ 21 tiles na diagonal horizontal × ≈ 24 na vertical, tile ≈ 45×23 px). Em dados: `camera_area_visivel_arte_px = 960×540`.
- **`camera_oclusao_alpha = 0,35`:** de acordo como valor. Proponho que o objeto oculto seja recortado com **pontilhado em grade de pixel de arte** (dither ordenado), e não com uma transparência suave, para manter a linguagem do pixel; alpha suave só se o dither custar caro (08 decide).

### A1.2 Direção do sprite nas diagonais — **substituído pela D-025 (isométrico)**
No isométrico as diagonais dominam a tela e o sprite tem **5 direções** (S, SE, E, NE, N; resto espelhado). Movimento em 8 direções e mira do mouse usam a direção desenhada mais próxima; o ataque trava a direção no 1º quadro. A regra de histerese do meio-termo anterior continua útil só para **não piscar** ao virar entre duas direções vizinhas: mantém a direção atual se ela ainda for uma das duas mais próximas do vetor de movimento. A tabela `DIR8→DIR5` fica com o 03/04.

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
