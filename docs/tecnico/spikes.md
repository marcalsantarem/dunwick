# Spikes técnicos — resultados (BRF-001)

> **Status:** v1.0 · Dono: 08 Arquiteto · 2026-10-24 · Entrada para o [ADR-001](decisoes/ADR-001.md) (proposto; quem decide é o usuário).
> Código em `spikes/` (descartável; **não** é o esqueleto M1). Como rodar: `spikes/README.md`. Dados brutos: `spikes/resultados/<opcao>/*.json` + capturas `.png`.

## 1. Resumo (10 linhas)

1. **Os dois motores testados (Three.js, Babylon.js) fazem o visual diorama** (sprite com normal map + máscara de brilho, sombra de silhueta, tochas, névoa, bloom, profundidade de campo, partículas) **com os 5 spikes rodando**.
2. **A resolução interna decide o desempenho, não o motor.** Na máquina de referência (Radeon integrada), a cena de multidão (40 inimigos + 150 projéteis, 4 tochas) no perfil **Alto** roda a **176 fps em 640×360 interno** (Three.js; pior 1 % = 120) contra **34 fps em 1080p nativo**. Com **todos** os pós ligados, o custo extra em 640×360 é ≈ 0,6 ms.
3. **Câmera ortográfica**: pixel nítido (100 % dos blocos uniformes) em qualquer profundidade e escala. **Perspectiva** só é nítida no plano focal: sprites 3–6 tiles mais perto/longe ficam com 16–44 % dos blocos uniformes em 2×/3×. Snap da câmera não muda a nitidez; o que importa é **uma única grade de pixel** (ver §6, resposta 1).
4. **Peso e partida:** Three.js 121 KB (brotli) vs Babylon.js 342 KB; primeira tela em ≈ 1,6–2,1 s vs 3,7–4,2 s; download inicial medido 1,75 MB vs 1,97 MB (com 1 música + 20 SFX).
5. **Babylon.js** é mais rápido em 1080p nativo (1,3–1,9×; o compositor do Three paga HDR+MSAA), mas teve quadros lentos (40–50 ms) causados por **atualizar UVs por sprite** (padrão do meu código; vale para os dois, resolve-se animando por shader/instância) e falha com ≥ 12 luzes pontuais no material padrão (limite de uniformes/`maxSimultaneousLights`).
6. **Recomendação:** Three.js, resolução interna 640×360 (×3 inteiro → 1080p; ×2 → 720p, ×4 → 1440p), câmera ortográfica 35°. Babylon.js é a 2ª opção válida. Godot/Unity ficam de fora (renderizador sem pós / licença). Detalhes no ADR-001.
7. **Não testado:** Firefox, Safari, Edge, macOS, computador fraco, memória de GPU, vsync real a 60 Hz, gamepad (ver §8).

## 2. Método e máquina

| Item | Valor |
|---|---|
| CPU / GPU | AMD Ryzen 3 5300G (4 núcleos / 8 threads) · **AMD Radeon Graphics integrada** (0x1638, Vega, driver 31.0.12002.92) |
| RAM / SO | 31,4 GB · Windows 11 Pro 10.0.26200 |
| Navegador | **Chrome 155.0.8059.85**, `headless=new`, ANGLE **Direct3D11** (GPU real, não SwiftShader), WebGL2 |
| Janela | 1920×1080, DPR 1 |
| Software | Node 24.16.0 · three **0.186.1** (r186) · @babylonjs/core **9.32.0** · esbuild 0.28.2 · puppeteer-core 25.16.0 (versões fixas em `spikes/package.json`) |
| Laço | Passo fixo 60 Hz com acumulador (máx. 5 passos/quadro), desenho interpolável; igual nas duas opções (`comum/laco.js`) |
| fps | quadros/s medidos por `requestAnimationFrame` **sem limite de vsync**, com `gl.finish()` no fim de cada quadro (mede CPU + GPU). "Pior 1 %" = fps da **média do 1 % de quadros mais lentos**. 2,5 s de aquecimento + 6–12 s medidos por caso |
| Cena comum | 30 módulos (casas, árvores, postes, cercas, poço…), piso 32×32 tiles, atlas 32 px/tile com normal map, 6 sprites 64×64 (8 quadros × 3 direções) com normal map + máscara de brilho, sombra de contato, partículas |
| Simulação | `comum/simulacao.js`: 40 inimigos com separação O(n²) + 150 projéteis em pool, tudo em arrays tipados, **sem alocação por passo** |
| Perfis | Alto: sol 2048, 2 pontuais com sombra 512, DoF completo (24 amostras), bloom, volumétrica, MSAA 4×, 150 partículas · Médio: sol 1024, 1 pontual com sombra 256, tilt-shift (8 amostras), bloom ½, sem volumétrica, 100 partículas · Baixo: sem sombra projetada (só contato), sem desfoque, sem bloom/volumétrica, 50 partículas. Todos: 4 tochas, névoa, correção de cor/vinheta |

**Limites do método:** uma máquina; **uma execução por caso** (comparando duas rodadas do mesmo caso do Three, a média variou ≈ ±2 % e o pior 1 % até ±20 %); headless sem vsync (mede capacidade, não "60 fps travados"); placeholders de arte procedurais (atlas com ruído, mais pesado em PNG que arte real).

## 3. Opções avaliadas

Versões/licenças consultadas em 2026-10-24 (npm registry; páginas oficiais quando indicado).

| Opção | Versão atual | Licença | Verificação | Spikes |
|---|---|---|---|---|
| **Three.js** | 0.186.1 (2026-09-24) | MIT | npm | **5/5** |
| **Babylon.js** | 9.32.0 (2026-10-22) | Apache-2.0 | npm | **5/5** |
| PlayCanvas (engine) | 2.23.3 (2026-10-23) | MIT | npm | não (papel) |
| Godot | 4.7.2 (2026-08-18) | MIT (conhecimento prévio; não reverificado) | godotengine.org | não (eliminada, ver abaixo) |
| Unity | 6.6 (relato secundário) | proprietária; Pro US$ 2.310/ano/assento | unity.com/pricing | não (eliminada) |
| Protótipo Dunwick | — | — | D-001: não existe | — |

**Godot (eliminada pelo critério "faz o visual"):** a exportação web só roda **WebGL 2 com o renderizador de compatibilidade**; a documentação (4.7) lista como **não suportados nesse renderizador: desfoque de profundidade de campo e névoa volumétrica**; luzes pontuais limitadas a 8 por malha; a exportação com threads exige `SharedArrayBuffer` (cabeçalhos COOP/COEP) — ruim para "sem depender de um portal"; C# não exporta para web. Tamanho do download **não medido** (documentação só diz que o WASM comprime a ~¼ com gzip).
**Unity (eliminada pelo critério de licença/preferência por aberto):** licença proprietária e custo por assento acima de um teto de receita; WebGPU opcional desde o 6.1, WebGL 2 é o padrão. Tamanho do build **não medido**.
**PlayCanvas:** motor MIT, mas o fluxo normal é um editor em nuvem; não faz spike porque duplicaria o trabalho sem hipótese de ganho em relação às duas bibliotecas já medidas. Fica como plano C documentado.

## 4. Resultados por spike

### 4.1 Spike 1 — Sprite iluminado (e nitidez 1×/2×/3×)

**Pixel nítido.** Métrica: % de blocos `escala×escala` da região do sprite com cor uniforme (100 % = cada pixel de arte vira exatamente `escala×escala` pixels de tela). Todas as combinações com `snap` ligado/desligado, câmera parada/andando, nativa/640×360 deram:

| Câmera | 1× | 2× | 3× | Sprite fora do plano focal (±3, ±6 tiles em z) |
|---|---|---|---|---|
| **Ortográfica 35°** | 100 % | 100 % | 100 % | **100 %** em 2× e 3× |
| **Perspectiva 35°, FOV 20°** | 100 % | 100 % (no foco) | 100 % (no foco) | 2×: **38 / 35,5 / 44 %** · 3×: **23 / 16 / 35 %** |
| 640×360 interno esticado ×2/×3 | — | 100 % | 100 % | (ortográfica) 100 % |

Causa: em perspectiva a escala do sprite varia com a distância; só o plano focal tem escala inteira. Capturas: `spikes/resultados/three/nit_e{1,2,3}_orto_snap1_mov0_nativa.png`. (No Babylon só implementei a câmera ortográfica; os resultados "persp" dele repetem a ortográfica.)

**Iluminação do sprite:** `normal map` (convenção OpenGL, +Y para cima) + `emissiveMap` como máscara de brilho + luz direcional + tocha móvel; nos dois motores o volume "lê" como bola/cilindro; os olhos brilham sem depender da luz. Capturas: `spikes/resultados/{three,babylon}/sprite_alto.png`.
**Sombra de silhueta:** funciona nos dois (sol + tocha com sombra), com `alpha` recortado; no Three **é obrigatório `shadowSide = DoubleSide`** no material do sprite (o quad só tem face frontal e o mapa de sombras do Three usa a face de trás por padrão — sem isso o sprite não projeta sombra). Sombra de contato (blob instanciado) em todos os perfis.
Custo do spike isolado (1 sprite, 1080p, Alto): Three 809 fps / pior 1 % 321 · Babylon 708 / 262.

### 4.2 Spike 2 — Diorama (30 módulos, 4 luzes, névoa, DoF, bloom, 1080p nativo, `escala=3`)

| Perfil | Three.js fps (pior 1 %) | chamadas | Babylon.js fps (pior 1 %) | chamadas |
|---|---|---|---|---|
| Alto | **32,7** (15,9) | 144 | **45,2** (10,3) | 517 |
| Médio | **85,9** (41,6) | 111 | **77,5** (71,5) | 292 |
| Baixo | **158,5** (81,4) | 35 | **238,6** (186,5) | 35 |

Em 1080p nativo o Alto **não** chega a 60 fps nesta GPU integrada em nenhuma das duas opções. Em 640×360 interno passa com folga (ver §4.6).

### 4.3 Spike 3 — Multidão (40 inimigos animados com sombra + 150 projéteis + 4 tochas, câmera seguindo o herói)

| Perfil | Three.js fps (pior 1 %) | chamadas | Babylon.js fps (pior 1 %) | chamadas |
|---|---|---|---|---|
| Alto 1080p nativo | 34,5 (20,8) | 353 | 48,9 (11,2) | 1147 |
| Médio 1080p nativo | 73,6 (39,2) | 241 | 90,2 (15,1) | 645 |
| Baixo 1080p nativo | 137,8 (87,2) | 73 | 255,5 (9,8) | 72 |
| **Alto 640×360 ×3** | **175,8 (120,3)** | 323 | 150,0 (89,6) | 1147 |
| **Médio 640×360 ×3** | **204,0 (128,8)** | 228 | 252,8 (142,4) | 645 |
| **Baixo 640×360 ×3** | **478,0 (288,8)** | 73 | 659,4 (371,6) | 72 |
| Alto 720p nativo | 73,0 (50,7) | 323 | 97,3 (27,0) | 1147 |

Sem nenhum pós (apenas a cena, `pos=` vazio), 1080p Alto: Three 71,6 · Babylon 170,2 — o Three paga alvo HDR + MSAA 4× + passe de saída mesmo sem efeitos (otimizável: ver ADR-001, consequências).
**Quadros lentos no Babylon (pior 1 % de 10–15 fps com média > 250):** isolados por bisseção: atualizar `VertexBuffer.UVKind` de 40 sprites por troca de quadro causa ≈ 144 quadros de 40–50 ms por 10 s; sem isso o pior 1 % sobe de 15,6 para 140,7. O mesmo padrão (UV por malha) existe no Three, onde não gerou soluços (pior 1 % de 87 com média 138). **Decisão de projeto para o esqueleto:** animar sprites por atributo de instância/shader (uma chamada por atlas), não por atualização de UV.
**Orçamento de entidades:** 40 inimigos + 150 projéteis cabem com sobra em 640×360 (Alto ≥ 150 fps nas duas opções). Custo da simulação isolada **não medido** (mediana do tempo de CPU do quadro inteiro, incluindo a espera da GPU: 5,3 ms no Babylon Alto sem pós).

### 4.4 Custo de cada pós (Three.js, multidão/diorama Alto)

Custo = diferença de tempo de quadro contra "sem pós" (1080p nativo: 11,6 ms; 640×360: 5,18 ms).

| Efeito | 1080p nativo | 640×360 ×3 |
|---|---|---|
| Névoa linear (nos materiais) | ≈ 0 ms | ≈ 0 ms |
| Correção de cor + vinheta (1 passe) | +3,5 ms | ≈ +0,1 ms |
| Bloom (UnrealBloom) | +5,6 ms | ≈ +0,0 ms |
| Profundidade de campo (24 amostras) | +4,6 ms | ≈ +0,1 ms |
| Volumétrica (32 amostras radiais) | +5,5 ms | +0,3 ms |
| **Todos juntos** | **+18,5 ms** (33,2 fps) | **+0,6 ms** (171,8 fps) |

Babylon.js (`DefaultRenderingPipeline`, 640×360, multidão): sem pós 188 fps → cor 183 → bloom 179 → DoF 165 → volumétrica 153 → todos 124 fps (+2,7 ms). Em 1080p nativo (diorama): sem pós 134 fps → todos 44 fps (+15,2 ms).

### 4.5 Luzes pontuais (sem pós; diorama 1080p nativo / multidão 640×360)

Tempo de quadro (ms) por número de pontuais (4 é o ponto de partida; o sol e a hemisférica são fixos):

| Pontuais | Three Alto 1080p | Three Baixo 1080p | Three Alto 640×360 | Three Baixo 640×360 | Babylon Alto 1080p | Babylon Baixo 1080p |
|---|---|---|---|---|---|---|
| 0 | 6,9 | 2,9 | — | — | 2,9 | 1,9 |
| 2 | 10,3 | 4,1 | — | — | 6,8 | 2,6 |
| 4 | 11,6 | 5,3 | 4,9 | 1,9 | 7,5 | 3,2 |
| 8 | 14,8 | 8,1 | 5,4 | 2,3 | 9,2 | 4,7 |
| 12 | 16,7 | 11,7 | — | — | **falha** | **falha** |
| 16 | 19,0 | 17,3 | 5,9 | 3,0 | **falha** | **falha** |

Custo ≈ 0,7–0,8 ms por luz extra em 1080p nativo (iluminação direta por pixel, sem deferred); em 640×360 ≈ 0,07 ms por luz. O Babylon não renderizou com 12+ pontuais (material padrão com `maxSimultaneousLights = 16` + 2 luzes fixas excede o limite de uniformes do shader nesta GPU; não investiguei contorno).

### 4.6 Resolução interna (pergunta 7 do 10) — os dois prints

Mesma cena, mesmo quadro lógico, mesma ampliação (3 px de tela por pixel de arte):

- `spikes/resultados/three/res_1080nativa_alto.png` — **1080p nativo** (sprites e texturas em escala inteira 3×, mas geometria, sombras, bloom e desfoque em 1920×1080): 34,5 fps.
- `spikes/resultados/three/res_640x360esc3_alto.png` — **640×360 esticado ×3** (tudo, incluindo sombras e pós, na grade de 3×3 pixels de tela): **175,8 fps**.

Leitura: em 640×360 as bordas de sombra, luz e geometria ficam "em degraus" de pixel de arte (coerentes com o sprite e a textura: uma só grade); em nativo, sprites/texturas são 3×3 mas sombras, bordas 3D e brilho ficam lisos (a "mistura de pixels" que o 10 queria evitar). **Recomendação técnica: 640×360** (decisão visual final é do usuário/10).

### 4.7 Spike 4 — Carregamento

Pacote medido (servidor local com brotli; `carga_*.json`): 1 música (32 s, estéreo, Opus 96 kbps = 510 KB) + 20 SFX (≈ 40 KB, Opus 64 kbps) + 6 sprites × (albedo + normal + brilho ≈ 38 KB) + atlas (PNG 874 KB: ruído de placeholder, arte real comprime mais) + JS.

| | Three.js | Babylon.js |
|---|---|---|
| JS do motor+spike | 574 KB (min) · **121 KB brotli** · 147 KB gzip | 1919 KB (min) · **342 KB brotli** · 449 KB gzip |
| Download inicial (46 requisições) | **1.752 KB** | **1.973 KB** |
| Tempo até a primeira tela (local, sem limitar rede) | **1,6–2,1 s** | **3,7–4,2 s** |
| Montagem da cena (parcela do anterior) | 0,74–1,14 s | 0,62–1,04 s |
| Heap JS | 15–17 MB | 20–30 MB |
| Memória total do navegador (multidão Alto, 640×360) | 476 MB | 521 MB |

Estimativa em 10 Mbps (1,25 MB/s): 1,75 MB ≈ 1,4 s de transferência → Three ≈ 3–3,5 s até jogar; Babylon ≈ 5–5,6 s. Os dois dentro de ≤ 5–8 s; o orçamento "≈ 10 MB inicial" tem folga de ~5×.
**Áudio inicial:** 549 KB (música + 20 SFX) cabe com folga no **limite de 2,5 MB**: cada música de 32 s estéreo a 96 kbps ≈ 0,5 MB → ≈ 4 músicas ou 1 música + ~1,9 MB de SFX.

### 4.8 Memória

Soma de **toda a árvore de processos do Chrome** lançado pelo medidor (8 processos: navegador, GPU, renderizador, utilitários), cena de multidão no perfil Alto, depois da janela de medição (`ferramentas/memoria.ps1`):

| Caso | Three.js (working set / privada) | Babylon.js (working set / privada) |
|---|---|---|
| 1080p nativo | 667 / 761 MB | 741 / 861 MB |
| 640×360 ×3 | **476 / 417 MB** | **521 / 463 MB** |
| Sprite único (spike 1) | 583 / 560 MB | — |

Leitura: o orçamento de **≤ 400–600 MB** é cumprido em 640×360 e estourado em 1080p nativo (alvos de render e MSAA maiores). **Limite do método:** inclui o consumo-base do próprio Chrome (não medi uma aba em branco) e a variação entre execuções é grande (o "sprite único" deu mais que a multidão em 640×360); trate como ordem de grandeza, não como número fino. Heap JS (`performance.memory`): 15–17 MB (Three), 20–30 MB (Babylon).

### 4.9 Spike 5 — Áudio (Web Audio, Chrome 155)

| Teste | Resultado |
|---|---|
| Contexto antes do gesto | `suspended`; após clique/tecla: `running` em **10 ms** (Three) / 26 ms (Babylon) — o desbloqueio é Web Audio puro, independe do motor |
| Loop de 2 s (96.000 amostras, 440 Hz) | Chrome decodifica **exatamente 96.000 amostras** em WAV, Ogg-Opus, WebM-Opus, MP3 e AAC (os preenchimentos de codec são removidos) |
| Emenda do loop (salto na junção ÷ maior passo normal) | WAV 1,00 · **Ogg-Opus 1,07** · WebM-Opus 1,07 · MP3 1,10 · **AAC/m4a 1,51** (limiar de clique audível não medido; Opus/MP3 ≈ 7–10 % acima do ruído do próprio sinal) |
| Tamanho (2 s) | WAV 384 KB · Ogg-Opus 30 KB · WebM-Opus 31 KB · MP3 33 KB · AAC 34 KB |
| Troca de camada de música (A↔B, mesma base, rampa 1 s) | camadas de 32 s com **mesma duração** (1.536.000 amostras), decodificação 100 ms; maior passo na troca 0,17 (suave) |
| Aba em segundo plano | `AudioContext.suspend()` ligado a `visibilitychange` (implementado; **não verificado em teste automatizado**) |

## 5. Descobertas dos spikes (defeitos meus corrigidos e lições)

- Recuar UVs do sprite em ε muda a escala (1,6 %) e destrói a nitidez; **UV da célula = exata**, sem recuo (o `nearest` não sangra; a célula tem borda transparente).
- O quad do sprite gira com a câmera: o ponto focal da câmera é o **centro do quad (pés + 0,875 tile ao longo do "cima" da câmera)**, não um ponto no mundo — senão a escala deixa de ser inteira.
- Three: `shadowSide = DoubleSide` nos sprites; Babylon: faces com enrolamento oposto ao do Three e o esbuild descarta módulos que se auto-registram se `sideEffects` for respeitado (usar `ignoreAnnotations` no build do Babylon, ou importar o motor inteiro).
- `decodeAudioData` esvazia o buffer: medir o tamanho antes.

## 6. Respostas ao 10 (guia_visual.md §11)

1. **Câmera 35°, FOV estreito, pixel nítido?** Em **perspectiva (FOV 20°) só no plano focal**; sprites fora dele quebram (§4.1). Em **ortográfica**, 100 % em 1×/2×/3× e em qualquer profundidade → **usar ortográfica** (a aparência de "maquete" vem do tilt-shift/DoF e das luzes, não da perspectiva). **Snap:** não é necessário para manter blocos uniformes (translação com escala inteira não distorce). O que é preciso é **uma única grade de pixel**: em **640×360 interno isso é automático** (1 pixel interno = 1 texel). Se a opção for 1080p nativo, é preciso arredondar câmera **e** posição de desenho dos sprites ao passo de 1 texel (1/32 tile) — só na apresentação, nunca na simulação — para não haver "mixels" entre sprite e chão (isso **não** foi medido; é argumento de projeto).
2. **Normal map por quadro + máscara nas ~40 entidades?** Viável: 1 textura de normal + 1 de brilho por folha, todas as folhas de 6 personagens cabem em ≈ 230 KB; 40 sprites animados + sombras fecham em ≥ 150 fps no perfil Alto em 640×360. **Convenção:** espaço da tangente do quad do sprite, **OpenGL (verde = +Y para cima)**, R = +X (direita da imagem), B = +Z (para fora, rumo à câmera), `RGB = n·0,5+0,5` em 8 bits, alpha 0 fora da silhueta, mesma âncora e tamanho do albedo; máscara de brilho em sufixo `_e` (RGB = quanto emite). Funciona sem inversões nos dois motores. **Atenção ao espelhamento (direção O):** além de espelhar a UV, é preciso **inverter o X da normal** (`normalScale.x = −1` no Three) — **não testado**; exigir no esqueleto e testar.
3. **Sombras:** perfil **Alto: sol 2048 + 2 pontuais com sombra (512)**; **Médio: sol 1024 + 1 pontual (256)**; **Baixo: só sombra de contato** (blob). O sprite **projeta a sombra da silhueta** com alpha recortado (sol e tocha) — provado nos dois motores (§4.1). Custo: ver §4.2/4.3 (Alto→Baixo ≈ 5× em 1080p).
4. **Custo de cada pós e perfil Baixo:** §4.4. Em **640×360 o conjunto inteiro custa ≈ 0,6 ms**, então os pós podem ficar **todos ligados nos três perfis** quando a resolução interna é 640×360; em 1080p nativo o conjunto custa 18,5 ms (inviável a 60 fps nesta GPU). **Perfil Baixo realista:** sem desfoque, sem bloom, sem volumétrica, sem sombra projetada (só contato), menos partículas — **478 fps** em 640×360, **138 fps** em 1080p nativo na máquina de referência. Desligar só o desfoque **não** basta em 1080p nativo (bloom e volumétrica custam o mesmo).
5. **Luzes pontuais sem sombra:** em 640×360 ≈ 0,07 ms por luz → **16 pontuais custam 1 ms** (limite prático = limite do material: **16 no Three** sem alterar shader; o Babylon falhou com 12+). Em 1080p nativo ≈ 0,75 ms por luz (8 pontuais = +6 ms). **Proposta:** Alto 16 · Médio 12 · Baixo 6 (todas sem sombra, exceto as 2/1/0 com sombra).
6. **Partículas:** 150 projéteis + 150 ambientais cabem nos 3 perfis (aditivas, 1 chamada cada, `Points` ou instâncias). **Iluminadas:** possível (quads instanciados com material iluminado, `partilum=1`, +1 chamada) mas **não medi o custo isolado**; recomendação: emissivas por padrão (efeitos de magia) e iluminadas só para folhas/poeira sob decisão do 10.
7. **Resolução interna:** **640×360 esticado em inteiro** (§4.6). Estética coerente com a grade do sprite, 5× mais rápido que 1080p nativo, e a única que garante pixel perfeito sem lógica extra. A área visível 20×11,25 tiles do 03 é exatamente 640×360 ÷ 32. Telas maiores: ×3 (1080p), ×4 (1440p), ×2 (720p); fração de escala não inteira → barras pretas (letterbox) ou recorte, nunca interpolar.
8. **Translucidez do primeiro plano:** **recorte pontilhado em tela (dither 4×4) perto do herói**, feito no shader do material "oclusor" (descarta fragmentos dentro de um raio em torno da projeção do herói e **mais perto que ele**): custo mensurável não separou do ruído (< 0,1 ms em 640×360); implementado no Three (`recorte=1`, muro oclusor na praça; **não implementado no Babylon**). Translucidez real (alpha) exigiria ordenação e custa mais; não recomendo.

## 7. O que falta decidir/medir (resumo)

Ver ADR-001 §9 (itens abertos) e §8 abaixo.

## 8. Não testado / limitações

- **Navegadores:** só Chrome 155 (headless, ANGLE/D3D11). **Firefox, Edge, Safari, macOS: não testados** — o formato de áudio (Ogg-Opus) **não foi verificado no Safari** (pesquisa: suporte do Safari a Opus/Ogg no Web Audio ficou **sem evidência conclusiva**; o caniuse marca "parcial"). Risco aberto de áudio (ADR-001 §9).
- **Máquina:** uma única (Ryzen 3 5300G + Radeon integrada). **Computador fraco e computador bom não testados.** Memória de GPU não medida.
- **vsync/60 Hz real, jitter de apresentação, gamepad, tela cheia, perda de contexto WebGL, aba em segundo plano (teste automatizado): não testados.**
- **Execução única** por caso (variância ≈ ±2 % na média, até ±20 % no pior 1 %).
- Pós do Three: **implementações simples e minhas** (DoF por profundidade/tilt-shift, volumétrica radial em tela, cor/vinheta) — qualidade final é decisão do 10; o Babylon usa o `DefaultRenderingPipeline` pronto (DoF em ortográfica com pouco efeito sem ajuste).
- Babylon: sem câmera em perspectiva, sem recorte do primeiro plano; luzes ≥ 12 falham.
- Perfil "alto" etc. são **os meus valores iniciais**, ainda não validados com o 10.
- Placeholders são procedurais; o custo de PNG/atlas com arte real vai diferir.
