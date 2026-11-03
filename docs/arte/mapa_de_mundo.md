# Mapa de mundo — direção visual

> **Status:** v1.1 — **ajustado à câmera isométrica (D-048)** · 2026-11-02 · Autor: 10 Direção de Arte e VFX. A v1.0 (câmera de cima 2D, D-047) ficou **arquivada como alternativa**; o usuário viu o item-modelo v1 do 07 em isométrico 3D denso e aprovou seguir assim ("depois refinamos mais").
> Arquivos irmãos: [paleta_mundo.json](paleta_mundo.json) · [guia_visual.md](guia_visual.md) (regras gerais valem onde não conflitam) · `data/config/cfg_mundo.json` · `data/maps/map_mundo_orvalho.json`.
> **Só este documento e a paleta.** Nada foi produzido nem alterado no código. A execução é do 07 (arte), 08 (render), 14 (mapa) e 04 (herói de mundo). **Decisões que mudam o combinado** (câmera do mundo, escala, tamanho do mapa) estão em §12 para o Produtor registrar.

## 0. Como ler este documento depois da D-048

| Seção | Situação |
|---|---|
| §1 Diagnóstico | **vale** (os mesmos problemas, menos o "pixel girado") |
| **§2A Decisão isométrica (nova)** | **vale: é a direção atual** |
| §2 Decisão câmera de cima (v1.0) | **arquivada** (opção A) |
| §3 Terreno por pixel e bordas orgânicas | **vale, adaptado**: as bordas orgânicas são em **espaço de mundo contínuo**, não por degrau de tile |
| §4 Materiais | **vale** (legenda do 14 já adotada) |
| §5 Objetos | **vale, adaptado**: 3D estilizado denso do 07 (não sprites 3/4) |
| §6 Vida, luz e profundidade | **vale** (nuvens, água, vento, fumaça) |
| §7 Moldura | **vale** |
| §8 Leitura | **vale** |
| §9 Herói | **adaptado**: tamanho e escala em §2A.3 |
| §10 Composição | **vale** |
| §11 Item-modelo | **cumprido (v1)**; revisão e refinos em **§15** |
| §12 Decisões | **arquivadas** (D-047); as vigentes estão em §2A |
| Paleta ([paleta_mundo.json](paleta_mundo.json)) | **vale** |

## 2A. Decisão vigente: isométrica 3D estilizada densa (D-048)

### 2A.1 Câmera e estilo
- **Câmera isométrica** do mundo (giro 45°, inclinação 35° em `cfg_mundo.json`; o 08 pode ajustar a inclinação até ~30°), segue o herói, sem giro nem zoom do jogador. **Coerente com a vila e a batalha.**
- **Estilo:** **3D estilizado denso** (relevo de verdade, floresta em instâncias, montanhas com volume) com **textura de detalhe pintada por código** e bordas orgânicas. Terreno em shader do 08, objetos do 07.
- **Pixel nítido:** o buffer do mundo é de arte (`camera.arte` = 960×540), ampliação inteira, filtro *nearest* (como já está).

### 2A.2 O que o item-modelo v1 já acertou (manter)
Floresta em massa com 2 espécies, relevo da montanha com neve, rio sinuoso com margem de espuma, mar com ondas e brilho animados, estrada com sulcos, ponte, escala geral do mapa.

### 2A.3 Escala e herói (mudança pedida)
- Hoje `pixels_por_unidade` = **14** e o herói tem ≈ **22 px** de altura na tela de 1280×720 (≈ **0,5 tile**): **pequeno demais** para o jogador achar quem se move.
- **Alvo:** herói com **≥ 1 tile de altura (≈ 40–45 px a 1280×720)**. Duas alavancas (o 07/08 escolhem): (a) `pixels_por_unidade` de **14 para ~20** (aproxima a câmera ~40 %; o mundo continua com ≈ 34×19 unidades visíveis) e (b) `escala_mundo` do herói **1,4–1,6**. Meta: o herói ocupa ≈ **6–7 % da altura da tela** (hoje ≈ 3 %).
- **Contraste do herói:** gibão `musgo_edric`, contorno escuro, **sombra elíptica** sob os pés e, sobre grama clara, um **halo de contorno claro de 1 px** de baixa opacidade (como na oclusão do guia §9.1).

## 1. Por que a captura atual é feia (diagnóstico)

Capturado em `build/qa/mobile/mundo_PC.png`:

| Problema | Causa | Efeito |
|---|---|---|
| Terreno "chapado" | uma cor por material + ruído de 8 px/tile, sem transição nem textura | parece planilha, não mundo |
| Montanhas de cones | 2–3 cones de baixa contagem de polígonos, sem relevo | leem-se como cones de trânsito, não como cordilheira |
| Árvores soltas | uma esfera escura por árvore, pontuais | floresta vira "pontinhos" |
| Herói minúsculo | câmera a 14 px/unidade (o sprite de 32 px vira ~14 px) | ninguém vê quem se move |
| Mar plano e borda vazia | plano azul único, a borda do mapa termina no "nada" | parece uma maquete flutuando |
| Visão em losango rotacionado | o terreno de 8 px/tile é girado 45° | pixel girado serrilha e perde o charme 16-bit |
| Sem vida nem luz | sem animação, sem sombra, sem profundidade | morto |

O "Final Fantasy de 35 anos atrás" é bonito por **três coisas**: (1) **bordas orgânicas** entre materiais (nenhuma quina de tile visível), (2) **densidade** (cada tile tem textura própria; floresta e montanha são massas, não pontos), (3) **vida** (água que se move, nuvens, vento). A nossa meta é **mais rica que isso**: o dobro da resolução dos tiles (32 px em vez de 16), luz e sombra de verdade e animação.

## 2. Decisão (v1.0) — **ARQUIVADA pela D-048** (opção A, câmera de cima 2D)

### 2.1 Câmera e estilo — **recomendada: 2D de cima, pixel art densa (estilo 16-bit)**

| | **A · De cima 2D, pixel art 32 px/tile (recomendada)** | B · Isométrica densa (mantém 45°/35°) | C · Inclinada em perspectiva ("Mode 7") |
|---|---|---|---|
| Visual | o mais próximo dos mapas de mundo clássicos; **nítido e fiel ao pixel art** | continua igual ao resto do jogo; chão rotacionado | grande beleza no horizonte e profundidade |
| Pixel nítido | **sim**, sem rotação nem distorção | **não**: o chão gira 45° e achata, o pixel serrilha (já vimos) | só com filtro/mipmap (perde o pixel) |
| Leitura de caminhável × bloqueio | **a melhor** (tudo está num plano) | boa, mas as faces e a diagonal confundem a grade | boa perto, ruim longe |
| Custo de arte | médio (terreno por código + sprites de pé) | alto (objetos 3D, faces, 2 lados) | alto (plano em perspectiva + billboards em todo lugar) |
| Custo de render | **baixo** (quads 2D, textura estática) | médio (3D, instâncias) | médio |
| Risco | destoa da vila isométrica (aceitável: FF/Chrono/BoF faziam mapa de mundo e locais com vistas diferentes) | **repete o erro já reprovado** | novo risco de nitidez e de desempenho |
| Veredito | **recomendo** | não recomendo | opcional como P3 (efeito de horizonte) |

**Decisão do 10: A.** O mapa de mundo é um **modo próprio** (D-045), então pode ter câmera própria. A vila e os locais continuam isométricos; a **transição por portal** (névoa escura) já esconde a troca de vista.

**Como é a visão A** (descrito em termos de resultado; **como** é com o 08):
- Visão **ortogonal de cima**, norte para cima, **sem giro nem inclinação perceptível**. Objetos altos (montanha, árvore, casa) são **sprites desenhados em 3/4**, como nos mapas clássicos: a base fica no tile, o corpo "sobe" pela tela.
- **Ordenação por Y**: o que está mais embaixo na tela fica na frente.
- **Pixel perfeito:** 1 pixel de arte = N×N pixels de tela, **sem distorção de proporção** e sem sub-pixel; a câmera anda em múltiplos de 1 pixel de arte.

### 2.2 Resolução e escala

| Item | Valor |
|---|---|
| Tile | **32×32 px de arte** (o padrão do projeto; o dobro do 16 px do FF clássico = mais detalhe) |
| Tela de referência | **960×540** de arte, ampliação **inteira** (`cfg_jogo`: ×2 em 1080p) → **≈ 30 × 17 tiles visíveis** |
| Herói | sprite de mundo **32×32** na escala **1:1** com o tile (**1 tile de altura**, ≈ 28 px de corpo). O "minúsculo" de hoje vem de renderizar a 14 px/unidade; a 32 px o sprite que já existe passa a ter **2,3× o tamanho atual** (e 64 px na tela a 1080p) |
| Mapa | **64×64 tiles** recomendado (hoje 48×48): com tela de 30×17 o mapa precisa de mais área para ter "viagem". 08/14 podem ficar em 48×48 se o custo apertar |
| Textura do terreno | gerada em **resolução de arte** (32 px/tile): 64×64 tiles = 2048×2048 px, em **blocos de 16×16 tiles** (512×512 px) para memória e carga |
| Velocidade do herói | sensação: **atravessar a tela (≈ 30 tiles) em ≈ 9–10 s** → ≈ 3 tiles/s (valor final: 13/14) |

> Mudança em `cfg_mundo.json` (para o 08/14): `camera` deixa de ser `{giro 45°, inclinação 35°, 14 px/unidade}` e passa a "modo de cima, 32 px/unidade"; `terreno.px_por_tile` de 8 para 32.

### 2.3 Estilo

**Pixel art desenhada por código, 32 px/tile, bordas orgânicas, sombreamento em 3–4 passos, contorno escuro suave nos objetos.** Não é 3D: o relevo e a luz vêm do desenho (altura simulada por sombreamento) e de camadas de efeito.

## 3. Como o terreno é construído (o que o 07 precisa entregar)

> **Isométrico (D-048):** a regra central continua, mas as fronteiras são **curvas contínuas em espaço de mundo** (campo de pesos + ruído de baixa e alta frequência), **não** degraus de tile. No item-modelo v1 as bordas de costa, rio, estrada e mata aparecem **em escada** (a grade 2:1 vaza): é o principal defeito a corrigir (§15, R4).

**Regra central: nenhum material termina em linha reta de tile.** O terreno é gerado **por pixel**, não "carimbando tiles":

1. **Mapa de materiais** (do `planta`) → **campo de pesos** por material, **suavizado e deformado por ruído** (a fronteira entre dois materiais vira uma linha orgânica, de 1–3 px de oscilação).
2. **Cada pixel** escolhe o material pelo peso dominante e recebe **textura própria** (§4). Pixels de fronteira recebem **cor de transição** (praia molhada, grama que avança sobre a terra, espuma).
3. **Variação sem repetição:** campos de ruído de baixa frequência escolhem **tons** (3 de grama, 2 de areia…), por zona; nenhum padrão de tile repete visivelmente em 3 telas.
4. **Relevo desenhado:** colinas e montanhas têm **mapa de altura simples**; a luz vem do **alto-esquerda**; o lado esquerdo clareia 1 passo e o direito escurece 1–2 passos; degraus e penhascos ganham contorno.
5. **Resultado:** uma textura estática por bloco de 16×16 tiles (barato), mais **camadas animadas** por cima (§6).

> Tudo isso é **função pura** de `planta` + sementes (como a `pixelsTerreno` atual, mas por pixel e com transições). O custo roda uma vez no carregamento; o 08 mede.

## 4. Materiais, por material (o que precisa existir)

Cores em [paleta_mundo.json](paleta_mundo.json). **Legenda nova de materiais** (o 14 mapeia as letras): `a` água funda, `i` rio/água corrente, `l` lago, `p` praia (areia), `g` grama, `f` prado com flores, `c` campo de cultivo, `m` mata densa (bloqueia), `r` bosque ralo (anda), `e` estrada, `t` trilha, `h` colina (anda), `n` montanha (bloqueia), `x` penhasco/rocha, `s` pântano (opcional).

| Material | Como deve parecer |
|---|---|
| **Água funda** | 4 tons por **profundidade** (distância à costa): costa turquesa (`agua_rasa`), meio (`agua_media`), mar aberto escuro (`agua_funda`); **ondas** desenhadas, **brilhos** (glints) no sol |
| **Costa** | faixa de **espuma animada** (onda que sobe e desce 1–2 px), **areia molhada** mais escura, **areia seca** clara; baías, penínsulas e ilhotas; **recifes** (rochas na água) |
| **Praia** | areia com 2 tons, conchas e pedrinhas raras, **pegadas de onda** |
| **Grama** | 6 tons; **tufos** de 3 px, grama alta em manchas, **flores** (amarelo, branco, rosa) em campos de flores; áreas mais secas (`prado_seco`); **sombra de floresta** onde há mata |
| **Campo de cultivo** | **fileiras** retas de terra e plantio (verde, dourado) em retângulos orgânicos perto da vila: dá **sinal de humano** |
| **Estrada** | corpo claro (`estrada_4`, **mais claro que a grama**), **sulcos de roda**, bordas irregulares com grama sobre a borda, pedrinhas; trilha: mais estreita e mais escura |
| **Rio e lago** | mesma água, mais rasa e clara; **margem** de lama/pedra; **fluxo** animado em direção à foz; **ponte** de madeira com sombra na água |
| **Colinas** | volume por sombreamento (luz do alto-esquerda), **cumeeira** mais clara, pequenos **afloramentos de rocha** |
| **Montanhas** | **massas grandes** (§5), com **pés de monte** (cascalho e grama seca) que dissolvem na grama; **neve** nos picos mais altos |
| **Mata densa** | **chão escuro** (`mata`) coberto por copas (§5); bloqueia: sempre com **silhueta alta** |
| **Pântano (opcional)** | água rasa verde com tufos e neblina baixa; só se o 14 precisar |

## 5. Objetos de pé (sprites; o que o 07 entrega)

Todos com **contorno escuro suave**, **luz do alto-esquerda**, **sombra projetada** para a direita-baixo (`sombra_mundo`), 3–4 passos de sombreamento, **2 quadros de vento** nos vegetais.

| Objeto | Tamanho (tiles) | Notas |
|---|---|---|
| **Árvores** — carvalho, pinheiro, bétula/prateada, arbusto, árvore de outono | 1×1,5 a 2×2,5 | 3 variantes cada; copa em **blocos de folhas** com luz no alto-esquerda; pinheiro mais estreito e escuro |
| **Floresta (massa)** | manchas de 6–20 tiles | **copas sobrepostas em ~40 %**, posições com jitter (nunca em grade), **bordas irregulares**, falhas de luz; as de trás **mais escuras**; por baixo o chão `mata` escuro |
| **Montanha** | 3×3 a 5×4 | **3 formas × 3 variantes**; **face esquerda clara, direita escura**, cristas, **neve** nos picos, **sombra** longa à direita; **cordilheira** = fileira com sobreposição de ~50 % (nunca cones soltos); topos azulados ao longe |
| **Rochas e afloramentos** | 1×1 | 3 variantes; musgo no lado da sombra |
| **Marcador da vila** | **3×3** | **5–6 casas** de enxaimel e telha (variações), **pórtico com a viga e o gancho vazio** do sino (a pista de lore), muro baixo/cerca, **poço**, **árvore**, **fumaça animada** de 2 chaminés, **bandeirolas** que balançam, estrada que entra pelo sul |
| **Marcador do bosque** | 3×3 | **arco de árvores gigantes** e clareira de entrada, luz de dentro, trilha; **interditado:** correntes, cadeado e **névoa baixa** parada |
| **Marcador da caverna** | 3×3 | **boca de rocha** com batente de madeira, luz fria `sino_aqua` vazando de dentro, musgo, ossos/entulho; **interditado:** idem |
| **Ponte** | 3×1 a 4×1 | madeira, guarda-corpos, **sombra na água** |
| **Placa e marco** | 1×1 | placa de direção (usa os textos do banner); marcos de pedra ao longo da estrada |
| **Extras P2** | 2×2 | moinho, celeiro (junto ao cultivo), farol na costa, ruína, acampamento (fogueira com fumaça) |
| **Moldura (nuvens baixas)** | 4×2 | nuvens translúcidas que passam nas bordas (§6) |

## 6. Vida, luz e profundidade (o que torna "polido")

| Efeito | Especificação | Perfil |
|---|---|---|
| **Água animada** | 4 quadros a **4 fps** (deslocamento das ondas), **brilhos** que aparecem e somem, **espuma da costa** oscilando ±2 px a ~0,5 Hz, rio com **fluxo** | Alto: tudo; Médio: 4 quadros sem brilho; Baixo: 2 quadros |
| **Sombras de nuvem** | textura de ruído suave, escurece ~18 % (`rgba(16,40,60,0.18)`), **deriva ~0,4 tile/s na diagonal** (2 camadas, velocidades diferentes) | Alto/Médio; Baixo: desligada |
| **Sombra projetada** | de objetos de pé: elipse/forma para a direita-baixo, `sombra_mundo` a 38 % | todos (barata) |
| **Vento** | grama e copas balançam 1 px (2 quadros), bandeirolas e fumaça | Alto/Médio |
| **Partículas** | pólen dourado, **pássaros** sobre campos e costa (P2), **borboletas** em flores, fumaça de chaminé, brilho no sol sobre a água | Alto 100 % / Médio 60 % / Baixo 30 % |
| **Luz e grade** | **dia claro com toque quente** (grade multiply `#FFF6E4`); sol fixo no alto-esquerda; sombra azul-esverdeada (direção A). **Variação:** manhã, dia, fim de tarde dourado e noite via `cfg_ciclo` quando o 08 ligar (não obrigatório na v0.1.3); por região: mata sombreada (grade azul-esverdeada), costa brilhante (bloom leve), colinas douradas | todos |
| **Profundidade** | névoa leve de mar nas bordas da tela, **vinheta** sutil, nuvens baixas passando nas bordas; **tilt-shift** em faixa (P3) | Alto |
| **Herói** | **sombra elíptica** sob os pés, **poeira** ao andar (terra/estrada), **respingo** na praia, **pegadas** na areia (P2) | todos |
| **Marcadores ativos** | brilho `brilho_*` pulsante lento (≤ 1 Hz) + **nome ao aproximar**; interditado sem brilho | todos |

Regras: **flashes ≤ 3/s**; todos os efeitos desligáveis; o banner e a placa nunca ficam sob efeito.

## 7. Moldura e borda do mundo (sem "fim do mundo")

- O mapa é uma **ilha/península** cercada por **mar aberto**; o **terreno é estendido por ≥ 24 tiles** além da planta (mar procedural com ondas e brilhos, mais escuro e calmo longe da costa).
- **Montanhas formam o paredão natural** ao norte e a oeste (cordilheira densa em 2–3 fileiras, névoa nos pés).
- A **câmera** é limitada para mostrar sempre **mar ou montanha nas bordas** (nunca o "vazio"); `limites_camera` atual (4..40) sobe proporcionalmente.
- Horizonte: **névoa azul-clara** nas bordas da tela e **nuvens baixas** passando.

## 8. Leitura (jogabilidade) no mapa de mundo

- **Anda × bloqueia nunca é ambíguo:** bloqueios (água funda, rio, montanha, mata densa) têm **silhueta alta** ou **espuma/margem** visível; o que anda é **plano e liso**. Água rasa de costa é decorativa e bloqueia (como hoje, `solidos`).
- **Estrada** é mais clara que a grama (valor, não só cor) e **liga os marcadores**: o jogador deve ver o caminho de longe.
- **Marcadores** têm **forma própria** (casas, árvores, boca de caverna) e **contorno escuro**; o ativo brilha; o interditado tem cadeado.
- **Herói:** gibão `musgo_edric` escuro e azulado com **contorno escuro de 1 px**, sombra elíptica; destaca-se do chão (**ΔL ≥ 0,2** sobre grama, estrada e areia; validado em [paleta_mundo.json](paleta_mundo.json)).
- **Nada de magenta** no mundo (não há telegraph aqui).
- **Cor + forma:** nenhum significado depende só de cor; cuidado com daltonismo (estrada × grama ficou boa por valor, não por matiz).

## 9. Herói do mundo (04)

> **D-048:** o tamanho vem de §2A.3 (escala do mundo e `escala_mundo`), não de 32 px a 1:1. O resto abaixo (andar 6 quadros, rim light, assinatura do Edric) vale.

`hero_edric_mundo`: 32×32 (mantém), âncora nos pés, **5 direções** (S, SE, E, NE, N; espelhadas), **andar 6 quadros** (antes menos), **idle 2–4 quadros** (respiração, olha em volta no tempo ocioso), **contorno escuro**, **rim light** sutil, **gibão musgo azulado + faixa de linho + ombreira** (a assinatura do Edric). **Sombra e poeira são do 08/10 (efeito), não do sprite.** Se o playtest ainda achar pequeno: escala **1,25** (40 px) sem refazer arte.

## 10. Composição do mapa (para o 14)

- **Costa recortada:** ≥ 3 baías e 2 penínsulas; **ilhotas** e recifes.
- **Rio sinuoso** da cordilheira ao mar (com **foz** em delta pequeno), **lago** no interior, **ponte** na estrada principal.
- **Florestas em manchas** (6–20 tiles) com **clareiras**; bosque como mancha maior ao noroeste (marcador do bosque).
- **Colinas** entre planície e montanha; **cordilheira** ao norte/oeste com **passo** (onde fica o marcador da caverna).
- **Campos de cultivo** e **prados de flores** em torno da vila; **estrada** ligando vila → ponte → caverna, e **trilha** ao bosque.
- **A vila em destaque:** no centro-sul, em terreno aberto e claro, com estrada saindo para o norte e uma praia a sul/leste.
- **Tamanho:** 64×64 recomendado. Mantém `map_mundo_orvalho`, portais, marcadores (ids, posições relativas), `inicio_jogador` e `limites_camera` recalculados.

## 11. Item-modelo (12×12 tiles) — o que o 07 entrega e como o 10 aprova

**Nada de produção em massa antes.** O item-modelo é **um trecho de 12×12 tiles** (384×384 px de arte, 768×768 px na tela a ×2) com **todas** as técnicas, para o usuário ver.

### 11.1 Planta sugerida (o 14 ajusta; coordenadas x→leste, z→sul)

```
     x: 0 1 2 3 4 5 6 7 8 9 10 11
z=0   : n n n n h g g i g g p  a
z=1   : n n n h g g i i g g p  a
z=2   : n n h g g f i g g g p  a
z=3   : m m h g f g i g c c p  a
z=4   : m m g g g g i g c c p  a
z=5   : m r g g e e w e e g p  a
z=6   : r g g g e g i g g g p  a
z=7   : r g g f e g i i g p p  a
z=8   : g g g V V g g i i i a  a
z=9   : g g g V V f g g p p a  a
z=10  : g g g p p p p p p a a  a
z=11  : p p p p p a a a a a a  a
```
Legenda: `n` montanha · `h` colina · `m` mata densa · `r` bosque ralo · `g` grama · `f` prado com flores · `c` cultivo · `e` estrada · `w` ponte sobre o rio · `i` rio · `p` praia · `a` mar · `V` marcador da vila (3×3 sobre as casas `V` e arredores).

Ele mostra: cordilheira com neve e pés de monte, colinas, rio sinuoso com foz e ponte, estrada, campo de cultivo, prado de flores, bosque (mata densa + ralo), praia e mar com espuma, marcador da vila, **o herói** parado na estrada.

### 11.2 Entregas do item-modelo
1. **Captura 1080p** (tela inteira a ×2, sem HUD) e **recorte 1:1** do trecho de 12×12.
2. **Variação de luz:** dia e uma segunda hora (fim de tarde), mesma cena.
3. **Animação:** clipe/GIF curto (≥ 4 s) mostrando água, nuvens, vento, fumaça e o herói andando.
4. **Medição:** FPS e peso da textura do trecho, nos 3 perfis (08).
5. **Lista:** o que foi gerado por código e as sementes.

### 11.3 Checklist de aprovação do 10
- [ ] **Nenhuma quina de tile visível** nas transições (grama↔areia↔água, estrada↔grama, montanha↔grama)
- [ ] **Densidade:** floresta e montanha lidas como **massas**, não pontos; textura sem repetição visível
- [ ] **Água** com 3 profundidades, espuma e brilho animados; rio flui; costa recortada
- [ ] **Montanha** com face clara/escura, neve e sombra projetada; cordilheira, não cones
- [ ] **Relevo:** colinas com volume por luz do alto-esquerda
- [ ] **Estrada** legível de longe (valor mais claro que a grama) e **bloqueios** inequívocos
- [ ] **Marcador da vila** reconhecível a 3 tiles, com fumaça e bandeirolas
- [ ] **Herói** com 1 tile de altura, contraste ΔL ≥ 0,2, sombra e poeira
- [ ] **Sombras de nuvem** e vento presentes e sutis (nada pisca; flashes ≤ 3/s)
- [ ] **Pixel nítido** a ×2 (sem distorção, sem tremor ao andar)
- [ ] **Perfil Baixo** continua bonito (sem nuvem e com água de 2 quadros)
- [ ] **60 fps** (pior 1 % ≥ 45) na máquina de referência, peso dentro do orçamento
- [ ] **Originalidade:** nada de sprite, tile ou mapa de outro jogo
- [ ] **Melhor que a captura atual** em todos os pontos do §1

Resultado: **aprovado / aprovado com ajustes / reprovado**, com motivos. O Produtor leva a captura ao **usuário antes** de liberar o resto.

## 12. Decisões da v1.0 (D-047) — **arquivadas pela D-048**

1. **Câmera do mapa de mundo: de cima 2D** (no lugar da isométrica 45°/35°). Só o modo mundo; a vila e os locais continuam isométricos.
2. **Escala: 32 px de arte por unidade** (no lugar de 14) e **terreno em resolução de arte** (32 px/tile, no lugar de 8).
3. **Mapa maior: 64×64** (recomendado; 48×48 se o custo apertar) e **legenda de materiais ampliada** (§4).
4. **Herói do mundo a 1 tile** (escala 1:1 da sprite existente), com andar de 6 quadros (04).
5. Nova **paleta do mundo** ([paleta_mundo.json](paleta_mundo.json)); as regras da paleta mestra continuam (nada de magenta no mundo, brilho reservado a marcadores ativos, sino_aqua só para o sino).

**Se o usuário preferir manter a câmera isométrica (opção B):** o item-modelo muda para o terreno por pixel em perspectiva isométrica e objetos 3D facetados; o risco de pixel serrilhado volta. Recomendo **A**.

## 13. Pedidos aos agentes (coordenação direta autorizada pelo Produtor no BRF v0.1.3b)

| Para | Pedido |
|---|---|
| **08 Arquiteto** | modo de render do mundo "de cima": pixel perfeito, ordenação por Y, terreno em blocos de 16×16 tiles (512 px), camadas animadas (água 4 quadros, espuma, nuvens), efeitos e perfis, câmera limitada; orçamento de memória (2048²) e FPS |
| **07 Cenários** | gerador do terreno por pixel (§3), sprites de objetos (§5), marcadores, ponte, moldura; **item-modelo 12×12** (§11) |
| **14 Níveis** | refazer `map_mundo_orvalho` (§10) com a legenda nova; manter ids, portais e marcadores |
| **04 Sprites** | `hero_edric_mundo` v2 (§9) |

## 14. Pendências (atualizadas pela D-048)
- Refinos do §15 (R1–R14) pelo 07, com o 08 nos itens de shader e escala; nova captura nos mesmos 3 ângulos.
- 14: planta final do mapa (64×64 ou 48×48) com a legenda nova; remover os objetos antigos `arvore_mundo` e `montanha_mundo`.
- 04: `hero_edric_mundo` v2 (contorno, rim light, 6 quadros) já foi pedido; o tamanho final depende de §2A.3.
- Ciclo dia/noite no mundo (P2) e FPS nos 3 perfis e no celular: 08.

### (Antigas, v1.0)
- Aprovação da opção A e dos itens do §12 (Produtor/usuário).
- Resposta do 08 sobre custo (blocos, camadas, nuvens) e sobre o método de pixel perfeito.
- Item-modelo (07) → aprovação do 10 → captura ao usuário → produção em massa.
- Ciclo dia/noite no mundo (P2): depende do 08.

## 15. Revisão do item-modelo v1 do 07 (10, 2026-11-02) — **aprovado com ajustes**

Capturas: `docs/arte/mundo/mundo_vila.png`, `mundo_costa.png`, `mundo_montanha.png`. O usuário aprovou seguir ("já melhorou bastante; depois refinamos").

### 15.1 Checklist (§11.3 adaptado à isométrica)
| Item | Resultado |
|---|---|
| Bordas orgânicas nas transições | **não**: costa, rio, estrada e mata em **escada** (grade 2:1 vaza) |
| Densidade (floresta e montanha como massas) | **sim** (2 espécies de árvore, massas coesas); falta variar espécie e altura |
| Água: 3 profundidades, espuma e brilho animados, rio que flui | **parcial**: espuma e glints bons; profundidades em **faixas diagonais chapadas**; brilhos distantes lembram **estrelas** |
| Montanha com faces clara/escura, neve e sombra | **parcial**: relevo e neve bons, mas é **uma pirâmide lisa de baixo contraste** |
| Relevo e colinas | **parcial** (montanha ok; colinas quase não se leem) |
| Estrada legível e bloqueios inequívocos | **sim**, mas cor **laranja saturada** e bordas em escada |
| Marcador da vila reconhecível a 3 tiles | **não**: disco cinza com um telhado, ≈ 1,4 tile |
| Herói legível (≥ 1 tile, contraste) | **não**: ≈ 22 px, 0,5 tile |
| Sombras de nuvem e vento | **não visíveis** nas capturas |
| Cor: grama | **saturada e chapada**: uma só cor viva (≈ `#5BB033`) em tudo |
| Pixel nítido, flashes ≤ 3/s | sim |
| Borrões pretos | **sim, defeito**: objetos antigos `arvore_mundo`/`montanha_mundo` e sombras de copa pretas |
| Originalidade | sim |

### 15.2 Refinos pedidos (prioridade e alvo mensurável)

**P1 — antes da próxima captura**
- **R1 · Borrões pretos:** remover os objetos antigos `arvore_mundo`/`montanha_mundo` e fazer a sombra de copa `sombra_mundo` translúcida (38 %), nunca preta. *Alvo:* nenhum pixel `#000` em área ≥ 4×4 px na captura.
- **R2 · Grama menos saturada e mais variada:** base em **`grama_3`/`grama_4`** com **manchas de 6–12 tiles** de **`prado_seco`** (verde-amarelado) e de **`grama_2`** (sombra azul-esverdeada), micro-detalhe de tufos e flores **em tufos agrupados** (não pontos soltos). Baixar `pos.saturacao` de **1,08 para ≈ 0,94**. *Alvo:* saturação média da grama ≈ 40–50 % (hoje ≈ 70 %); ≥ 3 tons visíveis a 1:1.
- **R3 · Mata densa com borda orgânica:** o chão da mata é hoje um losango escuro de **bordas serrilhadas e retas**. Fazer o chão com **serrapilheira e dissolvido na grama** (pontilhado/ruído), **clareiras** e **falhas** de densidade; **bordas irregulares** da copa. *Alvo:* nenhuma aresta reta ≥ 3 tiles.
- **R4 · Bordas contínuas (costa, rio, estrada, mata):** parar de seguir a grade; **campo de distância em espaço de mundo + ruído** (2 oitavas, amplitude ≈ 0,3 tile) e espuma contínua de 2–3 px. *Alvo:* nenhuma "escada" regular de período de 1 tile ao longo de ≥ 6 tiles de costa.
- **R5 · Marcadores legíveis e maiores:** **vila ≥ 3×3 tiles** com **5–6 casas** (telha e ardósia), **pórtico com a viga e o gancho vazio do sino**, **fumaça** de 2 chaminés, cerca, **poço**, bandeirolas, **clareira** de ~7×7; **bosque** (arco de árvores gigantes) e **caverna** (boca de rocha com batente e luz fria `sino_aqua`), interditados com correntes e cadeado. *Alvo:* a vila é reconhecível sem legenda a 3 tiles e tem altura ≥ 1,5× o herói.
- **R6 · Herói legível:** §2A.3 (≥ 1 tile, ~6–7 % da altura da tela), sombra elíptica sob os pés e poeira ao andar. *Alvo:* ΔL ≥ 0,2 sobre grama, estrada e areia (validado em `paleta_mundo.json`).

**P2 — em seguida**
- **R7 · Montanha como cordilheira:** **3–5 picos** com **selas**, alturas diferentes, **estratos e cristas** (luz do alto-esquerda: faces claras e escuras, contraste ≥ 2 passos), **linha de neve irregular**, **pés de monte** de cascalho e floresta; sombra projetada dos picos; topos azulados ao longe. *Alvo:* sem silhueta de pirâmide única.
- **R8 · Água:** **3 profundidades suaves** (ruído + pontilhado, não faixas diagonais), **brilhos** só em ondas **horizontais alongadas** (nada de pontos brancos "estrelas" no mar fundo), espuma animada, rio com **margem de lama/pedra** e **fluxo** visível.
- **R9 · Estrada:** cor de `estrada_3`/`estrada_4` (**mais clara e menos laranja**), sulcos, grama invadindo a borda, pedrinhas; borda orgânica (R4).
- **R10 · Costa rochosa:** a faixa cinza com **listras de "trilho"** (artefato periódico) vira **rocha com ruído** ou areia com espuma.
- **R11 · Sombras de nuvem e vento:** **2 camadas** de nuvem (deriva ≈ 0,4 tile/s, ≈ 18 %) e vento nos vegetais; precisam **aparecer** em captura. *Alvo:* sombra de nuvem visível em ≥ 1 quadro de 4 s.
- **R12 · Variedade de vegetação e props:** mais espécies (bétula, outono), **rochas com musgo**, **campos de cultivo** em fileiras, **flores** em tufos, arbustos de borda.
- **R13 · Colinas:** volume por sombreamento (suave, luz do alto-esquerda), cumeeira clara; hoje não se leem.
- **R14 · Moldura:** névoa de borda, nuvens baixas passando, vinheta leve (já em §6/§7).

### 15.3 Cores (aprovação com o 07)
- Material por material, **usar as rampas de [paleta_mundo.json](paleta_mundo.json)**: grama `grama_2..5` + `prado_seco`; água `agua_funda/media/rasa` + `espuma`; mata `mata_*` e `pinheiro_*`; estrada `estrada_3/4`; rocha `rocha_*` e `neve_*`; vila `telha_*`, `ardosia_*`, `reboco_*`, `madeira_*`.
- **Aprovado:** o azul do mar e o turquesa da costa; o verde dos pinheiros; o cinza-azulado da montanha e a neve; o tom da madeira da ponte.
- **A corrigir:** a grama e a estrada (R2, R9); a **mata densa** muito escura e chapada (R3); o **preto** (R1).
- **Contrastes obrigatórios (já validados na paleta):** estrada × grama por **valor** (ΔL ≥ 0,1); marcador com contorno escuro de 1 px (o telhado `telha_4` tem o mesmo valor da grama); `brilho` só sobre grama e estrada, com contorno.

### 15.4 Próxima aprovação
Nova captura (mesmos 3 ângulos + um de **herói e vila a 1:1**) com **R1–R6**; depois **R7–R14**. Cada refino tem alvo mensurável acima; eu aprovo pelo checklist do §15.1 e o Produtor leva ao usuário só quando os P1 estiverem verdes. **Nenhuma produção em massa antes disso.**

## 16. Revisão 2 do item-modelo (10, 2026-11-03) — **P1 aprovado com 3 pendências**

Capturas: `mundo_vila.png`, `mundo_bosque.png`, `mundo_caverna.png` (câmera 26 px/unidade só na captura). FPS informado pelo 07 (headless, Chrome, 1280×720, 48×48): Alto 57,2 / pior 1 % 54,6; Médio 56,9 / 53,8; Baixo 56,9 / 54,1 (meta: pior 1 % ≥ 45: **ok**); `npm run validar` e `npm test` (170/170) verdes.

| Refino | Resultado |
|---|---|
| R1 borrões pretos | **ok** (copas com cor por vértice, sem preto) |
| R2 grama e estrada | **ok**: manchas de prado, estrada areia clara; campo aberto ainda um pouco liso (variar mais nas manchas grandes) |
| R3 mata orgânica | **ok**: bordas irregulares, clareiras e falhas |
| R4 bordas contínuas | **ok** nas capturas: costa, praia com espuma, rio e estrada sem a "escada" |
| R5 marcadores | **vila ok** (≈ 4,6 tiles, 5 casas, fumaça, pórtico, brilho dourado); **caverna ok** (luz `sino_aqua` ainda fraca); **bosque não**: o arco dos gigantes vira uma massa verde escura e lisa |
| R6 herói ≥ 1 tile | **pendente**: ainda ≈ 30 px a 26 px/unidade (≈ 0,7 tile) |
| Água | 3 profundidades suaves e turquesa na costa: **muito melhor**; ainda há **pontos brancos tipo estrelas** no mar fundo e uma **faixa diagonal clara fixa na tela** sobre a água (efeito de pós a revisar) |

**Pendências do P1:** (a) **R6** herói maior (escala do herói 1,5 e `pixels_por_unidade` ~20; 08/13/04); (b) **bosque legível**: trocar a massa por **8 gigantes individuais** com arco, tronco visível, folhas em 2 tons e luz entrando pela clareira; (c) **faixa diagonal e "estrelas"** na água (08/07).
**P2 (já pedido, em ordem):** R7 cordilheira (a montanha ainda é uma encosta lisa com neve só na crista), R8 brilhos alongados na água, R12 variedade (bétula, outono, rochas com musgo, cultivo), R13 colinas, R14 moldura; **fim de tarde** com luz dourada e sombras longas (hoje só escurece); ponte com tabuado e sombra na água.

**Atualização (2026-11-03, 08):** o 08 já aplicou `pixels_por_unidade` = 20 e `escala_mundo` do herói = 1,5 (pendência **R6** atendida; falta eu ver a captura) e confirmou o terreno em shader com fronteira orgânica por campo de pesos + ruído + contorno fino, também na mata. Restam as pendências (b) bosque legível e (c) faixa diagonal e "estrelas" na água.
