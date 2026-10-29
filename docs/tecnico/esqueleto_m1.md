# Esqueleto do M1 — como rodar, testar e o que cada pasta é

> **Status:** v1.0 · Dono: 08 Arquiteto · 2026-10-24 · Entrega do BRF-009 · Stack: ADR-001 (Three.js 0.186.1, câmera ortográfica 35°, 640×360 interno ×N inteiro, JavaScript/Node 24).
> É a base sobre a qual o 03 implementa o M1 (combate) e o 10/04/07 montam a cena-modelo (M2). **Sem combate, IA, HUD, save nem áudio real.**

## 1. Comandos (na raiz do repositório)

```bash
npm install              # versões fixas (package.json / package-lock.json)
npm run dev              # http://localhost:5173 — build de DESENVOLVIMENTO (debug ligado), dados e assets lidos ao vivo
npm test                 # 41 testes automáticos (node:test, sem dependências), ~2 s
npm run validar          # esquema + regras cruzadas dos dados e dos assets
npm run build            # validar dados → validar assets → testes → empacotar → relatório de peso (build/prod)
npm run preview          # serve build/prod como na publicação (brotli, cache por hash)
npm run test:navegador   # abre o Chrome REAL, confere critérios do M1 no navegador (24 verificações; 27 com --medir)
npm run assets           # regenera os placeholders de assets/ (determinístico)
```

Variações úteis:

```bash
node --test tests/heroi.test.mjs                                   # um arquivo de teste
node --test --test-name-pattern="diagonal" tests/heroi.test.mjs    # um teste isolado
npm run test:navegador -- --medir=60                               # + 60 s de medição de fps numa rota (média, pior 1 %, quadros lentos)
npm run test:navegador -- --medir=30 --sem-vsync --perfil=perfil_baixo   # capacidade (sem limite do monitor, com gl.finish)
npm run test:navegador -- --medir=30 --janela=1280x720 --visivel        # outra janela; --visivel = janela real (headful)
npm run test:navegador -- --prod                                   # confere build/prod (sem debug, hash, F1/F5/Ctrl+W livres)
```
Requisitos: Node ≥ 24 e Chrome (caminho padrão do Windows; `--cromo=<exe>` ou variável `CHROME` para outro).

**No jogo (dev):** WASD/setas andam, Shift corre; **F1** caixas · **F2** estados/posição · **F3** fps · **F4** entrada/buffer · **F6** pausar · **F7** avançar 1 passo · **F8** câmera lenta · **F9** exportar tempos (baixa um JSON) · **F10** zerar contadores do alvo · **F12** trocar o perfil de qualidade. `?perfil=perfil_baixo` na URL escolhe o perfil. As teclas de debug **não existem** no build de produção.

## 2. Estrutura de pastas

```
data/                 conteúdo e configuração em JSON (nenhum número de gameplay no código)
  config/             cfg_jogo (laço, câmera, entrada, mundo) · cfg_perfis · cfg_entrada · cfg_orcamento
  characters/         hero_principal.json            enemies/   enemy_boneco_alvo, enemy_boneco_golpe
  maps/               map_sala_teste.json (48×32, do 06)     texts/   pt-BR.json (ID → texto)
  attacks/            vazia — atk_*.json do 03 entram aqui (esquema a criar com o 03)
  schemas/            JSON Schema 2020-12 de cada tipo (validados pelo Ajv no build)
assets/               sprites/<id>/ (albedo + _n normal + _e brilho + .meta.json) · env/ (atlas) · fx/ · audio/   [placeholders]
src/
  jogo/               SIMULAÇÃO (não conhece pixels nem WebGL): acumulador, mundo, mapa+colisão, herói, câmera de jogo,
                      entrada lógica, buffer, eventos, textos
  motor/              Three.js: renderizador (640×360 → escala inteira), cena, terreno, sprites, debug_desenho
  plataforma/         navegador: principal (laço), carregador, entrada_dom (teclado/mouse/gamepad), áudio, index.html, estilo.css
  ui/                 debug_ui (só em desenvolvimento)
tools/                validar_dados, validar_assets, build, servir, testar_navegador, gerar_placeholders, lib/ (png, wav, dados, …)
tests/                *.test.mjs (node:test) + _util.mjs
build/                saída gerada (dev/, prod/, qa/, relatorio_peso.*) — NÃO versionada, não editar à mão
spikes/               código descartável do BRF-001 (evidência do ADR-001; não é parte do jogo)
```

## 3. Arquitetura (o que o 03 precisa saber)

```
plataforma/principal.js  → laço: rAF → Acumulador.avancar(dt) → N × { entrada.amostrar(tick); mundo.passo(entrada) } → cena.atualizar(alfa) → desenhar
jogo/ (simulação 60 Hz)  → mundo.passo(): herói.passo → bonecos → câmera.passo → ticks++   (eventos: aviso_inicio, golpe_ativo, golpe_fim)
motor/ (apresentação)    → lê o estado com interpolação; nunca altera a simulação; única parte que importa `three`
```

- **Passo fixo 60 Hz** (`jogo/acumulador.js`): máx. **5 passos por quadro desenhado**, o excesso é **descartado** (sem espiral de atraso); desenho interpolado por `alfa`; aba oculta pausa simulação e áudio e **não simula o tempo perdido** (`resetar()` ao voltar).
- **Fronteira**: `src/jogo/` **não importa** `three` nem DOM → roda em Node (é o que os testes fazem). Para estender o herói/combate: `jogo/heroi.js` (`heroi.passo(entrada, obstaculos, dt)`), novos estados e o pipeline de dano entram em `jogo/`; a apresentação assina eventos de `mundo.eventos`.
- **Entrada lógica** (`jogo/entrada_logica.js`): o jogo só conhece **ações** (`mover`, `correr`, `atacar`, `forte`, `esquivar`, `habilidade_1..3`, `item`, `interagir`, `menu`, `inventario`, `missoes`); teclas/botões vêm de `data/config/cfg_entrada.json` (remapear = editar dados). Teclado/mouse por **fila de eventos** (aperto curto entre passos não se perde); gamepad **amostrado uma vez por quadro desenhado**; desconectar solta tudo no mesmo instante. `entrada.buffer` (`jogo/buffer.js`) guarda ações com `buffer: true` por `buffer_entrada_quadros` (7): vale a mais recente, empate `esquivar > habilidade > forte > atacar`; `consumir(tick, permitidas)` para o 03.
- **Mapa e colisão** (`jogo/mapa.js`): grade de tiles com **altura** (plataforma 1,0; rampa/escada por interpolação) e colisão **círculo × tiles com deslize**, feita pela simulação (sem biblioteca, como proposto no ADR-001 §10.7). Degrau máximo e iterações vêm de `cfg_jogo.mundo`. Bloqueia por parede sólida ou por degrau > `degrau_max_tiles` (a borda da plataforma bloqueia).
- **Câmera**: ortográfica, 35° fixa, área visível 20 × 11,25 tiles (= 640×360 ÷ 32), seguimento com zona morta, antecipação, suavização e **limites do mapa** (`jogo/camera_jogo.js`). A imagem é **colada à grade de pixel** (sem tremor). **Oclusão**: geometria acima dos pés do herói que o cobre é recortada em pontilhado (parâmetros `oclusao_alpha`/`oclusao_raio_tiles` em dados).
- **Sprites** (`motor/sprites.js`): plano voltado à câmera, âncora nos pés, **normal map + máscara de brilho**, sombra de silhueta (`shadowSide = DoubleSide`), sombra de contato no chão; animação por **deslocamento de textura** (nada de tocar vértices por quadro); direção O por espelhamento (UV **e** X da normal). Para dezenas de inimigos (M3) o 03/08 migram para instâncias — decisão do ADR-001 §8.
- **Perfis** (`data/config/cfg_perfis.json`): sombra do sol (px), luzes pontuais máx./com sombra, vinheta. Aplicados em `cena.aplicarPerfil`. **Não há** detecção automática no primeiro uso (fica para o M4).
- **Render**: cena → alvo 640×360 (sem filtro) → ampliação por vizinho mais próximo em **escala inteira** (barras pretas se sobrar); passe final único (vinheta + saída sRGB) onde os pós do 10 entram no M2.
- **Textos**: só por ID (`data/texts/pt-BR.json`, variáveis `{nome}`); `criarTextos` registra IDs ausentes (o teste de navegador exige 0).

## 4. Dados, IDs e validação

- JSON UTF-8 + **JSON Schema 2020-12** por tipo (`data/schemas/`), validado pelo **Ajv 8.20.0 (MIT)** em `npm run validar`, no build e ao editar dados no `npm run dev`. Erro sempre aponta **arquivo e campo**, p. ex.: `data/characters/hero_principal.json /movimento/vel_andar: must be number`.
- Regras cruzadas (`tools/validar_dados.mjs`): nome do arquivo = `id`; IDs minúsculos com prefixo conhecido; sprites referenciados existem em `assets/`; textos referenciados existem; planta × tamanho × legenda; rampas só sobre tiles de rampa/escada; início/objetos fora de paredes; inimigos do mapa existem; aviso do boneco ≥ `aviso_min_comum_quadros` (18); teclas únicas por contexto; F5/F11 livres.
- **Prefixos novos neste esqueleto (a registrar nas convenções, com o 01):** `cfg_` (configuração), `perfil_` (perfis de qualidade), `z_` (zonas do mapa). `atk_` já confirmado (D-007); ainda **sem esquema** — o 03 define o formato dos ataques e eu crio o esquema.
- **Validador de assets** (`tools/validar_assets.mjs`): célula 64×64, âncora na célula, `direcoes` s/n/l, `normal_map: opengl_y_cima`, tamanhos coerentes entre albedo/normal/brilho, **alpha só 0/255**, normal com alpha 0 fora da silhueta, texturas ≤ 2048, atlas múltiplo do tile, áudio WAV 16 bits ou Ogg.
- **Mapa**: `map_sala_teste.json` foi transcrito por mim da planta do 06 (`metricas.md` §8.1) **por script** (posições conferidas); **o 06 continua dono do layout**. A contagem de 740 tiles andáveis do 06 bate (742 menos os 2 tiles dos bonecos).

## 5. Build e peso

`npm run build` → `build/prod/` com **JS, CSS, dados e assets com hash no nome** (cache longo), `index.html` sem cache longo, CSP restritiva (`default-src 'self'`, sem scripts inline). Falha se o orçamento de `data/config/cfg_orcamento.json` for excedido.

| Medida (relatório `build/relatorio_peso.md`) | Valor | Orçamento |
|---|---|---|
| **Download inicial** (todos os assets do M1) | **233,7 KB** | ≤ 10 MB |
| Código (JS + CSS + HTML, brotli) | 118,5 KB (JS bruto ≈ 550 KB) | ≤ 500 KB |
| Dados (brotli) | 2,6 KB | ≤ 256 KB |
| Áudio | 7,1 KB | ≤ 2,5 MB |
| Sprites (3 entidades, albedo+normal+brilho+meta) | 37,5 / 32,1 / 32,8 KB | ≤ 80 KB por entidade |

## 6. Testes e medições

**41 testes automáticos** (`npm test`): laço (600 ± 1 passos/10 s a 30/60/75/120/144 quadros/s, limite de 5, descarte, câmera lenta, reset), herói (velocidades ±1 %, diagonal nas 8 direções, aceleração em 4 e freada em 3 passos, deslize, 2000 passos sem atravessar parede, rampa, borda de plataforma, **percurso até a arena a pé**, tudo de dados), mapa (zonas, alturas, 742 tiles alcançáveis e com volta), entrada (fila, buffer 7 sim/8 não, prioridades, gamepad, perda de foco), câmera (limites nos 4 cantos), textos, e dados (aceita os reais e **recusa** tipo errado, campo desconhecido, referência quebrada, aviso < 18, tecla repetida, planta inválida).

**Teste no Chrome real** (`npm run test:navegador`: 24 verificações, 27 com `--medir`; produção: 4): abre sem erro em **0,56 s** (critério ≤ 8 s) · console limpo · 599,7 ticks em 10 s · andar 3,500 e correr 6,000 tiles/s · aba oculta (+0 ticks em 3 s, sem "corrida" ao voltar, teclas soltas) · F6/F7/F8/F9/F1/F12 · escala inteira (1280×720→2, 1920×1080→3, 2560×1440→4, menor→1) · gamepad simulado (zona morta, direita, desconectar para em ≤ 150 ms) · áudio só criado/desbloqueado após tecla/clique · capturas em `build/qa/` (sala, rampa, plataforma, escada, arena, corredor, com e sem caixas).

**Medições de fps** (máquina desta sessão: Ryzen 3 5300G + Radeon integrada, Windows 11, Chrome 155.0.8059.85, monitor 59 Hz; perfil Alto; rota correndo pela sala):

| Condição | Média | Pior 1 % | Maior quadro |
|---|---|---|---|
| 1080p, vsync, 60 s (11 rodadas) | **56,5–56,8 fps** | 52,5–53,5 nas 9 rodadas limpas (36 e 41 nas 2 com um quadro lento) | 19–25 ms (179 e 200 ms em 2 rodadas) |
| 720p, vsync, 30 s | 56,8 fps | 52,9 | 20,2 ms |
| **Capacidade** (sem vsync, com `gl.finish`): Alto / Médio / Baixo | **1049 / 1416 / 2038 fps** | 337 / 422 / 259 | 5 / 4 / 31 ms |

**Leitura honesta do critério M1-02 (média ≥ 58 fps):** nesta máquina **uma página em branco** também roda a só **56,6–56,8 fps** no Chrome (headless e janela real; o Windows informa 59 Hz) — esse é o **teto de apresentação do ambiente**; o jogo roda a **99,6–100,4 % do teto** e com folga de capacidade de ~18×. O critério literal (58) **não é atingível aqui por nenhuma página**; sugiro ao QA/Produtor reescrevê-lo como "≥ 98 % do ritmo de uma página em branco no mesmo monitor/navegador (e ≥ 58 se o monitor ≥ 60 Hz)". Quadros lentos: em 2 de 11 rodadas houve **um** quadro de 179–200 ms (nas 4 últimas rodadas, com observador de tarefas longas ligado, nenhum); **causa não identificada** — não é reproduzível e não apareceu como tarefa longa da thread principal nas rodadas limpas. M1-03 ("≤ 1 quadro > 50 ms por minuto; nenhum > 250 ms") passou em todas. O "pior 1 %" por média dos 1 % mais lentos é **muito sensível a um único quadro ruim** (um quadro de 200 ms em 3.250 derruba o valor de 53 para 41).

## 7. Cobertura dos critérios do QA (M1)

| Critério | Estado |
|---|---|
| M1-01 abre sem erro ≤ 8 s | ✅ automático (0,56 s; **só Chrome/Windows**) |
| M1-02 / M1-03 fps e engasgos | ✅ com a ressalva do teto do monitor (§6); Edge/Firefox **não medidos** |
| M1-04 passo fixo · M1-05 aba oculta | ✅ teste unitário + Chrome (monitor de 120/144 Hz **não testado** em hardware real; simulado por teste unitário) |
| M1-06 redimensionar/escala inteira | ✅ lógica e capturas; **tela cheia (F11) manual não testada** |
| M1-07 teclado · M1-08/09 gamepad | ✅ ações reconhecidas por teste e por F4; gamepad **só simulado** (nenhum controle real) |
| M1-10/11 resposta e buffer | ✅ buffer (7 sim / 8 não); "ação começa no tick seguinte" depende das ações do 03 |
| M1-12/13/14a/14b/14e/14c | ✅ testes (velocidade, diagonal, paredes, percurso, câmera nos 4 cantos); 14c "herói sempre visível": oclusão em pontilhado implementada, **julgamento visual é do QA/10** |
| M1-14d pés não deslizam | ⬜ placeholder com ciclo de 8 quadros; ajuste fino é do 04 |
| M1-16/17/18 visual | capturas geradas; **avaliação do QA** (nitidez em 1×/2×/3×, tremor em movimento) |
| M1-19 debug completo | ✅ F1–F4, F6–F10 (+F12) |
| M1-20/21/22 dados, validação, teste | ✅ |
| M1-22b fórmulas · M1-15* combate · M1-23 15 min | **não é deste esqueleto** (03/06) / **não rodado** |

## 8. Não implementado / pendências conhecidas

- **Fora do escopo do BRF:** combate, esquiva, fôlego, IA, HUD, save, interação/NPC/baú/armadilha/portais (objetos existem no mapa com `m1: false` e são ignorados), áudio real (só `sfx_teste_ping.wav` para provar o desbloqueio), música.
- **Os bonecos não causam nem recebem dano**: `enemy_boneco_golpe` cicla ESPERA → AVISO (24 quadros) → ATIVO (6) a cada 120, emite eventos e desenha o marcador magenta no chão; `enemy_boneco_alvo` só tem contadores (zerados por F10) para o 03 ligar ao pipeline de dano.
- **Remapeamento de teclas pelo jogador**: só por dados; a tela e a persistência (configurações em `localStorage`, ADR-001 §10.6) ficam para depois do M1.
- **Áudio no build**: placeholders em WAV; compressão para Ogg-Opus (ffmpeg) entra quando houver áudio real (05); **Safari continua sem teste**.
- **Navegadores/máquinas**: só Chrome 155 em uma máquina; Firefox, Edge, Safari, macOS, gamepad real, computador fraco/bom, tela cheia e monitores de 120/144 Hz **não testados**. Memória do navegador não medida neste esqueleto (heap JS ≈ 15 MB).
- **Pixel/mixels e snap**: câmera e sprites colados à grade interna; a **avaliação visual** de tremor em movimento (M1-17) é do QA.
- `spikes/` permanece no repositório como evidência (ignora `node_modules`, `dist` e `assets` regeneráveis).

## 8b. Cena de batalha (BL-008 etapa 2b)

Quando `mundo.jogo.modo === 'batalha'` a plataforma desenha a arena em vez do mapa. Peças (todas em `src/motor/` e `src/plataforma/`; a simulação continua pura):

| Arquivo | Papel |
|---|---|
| `data/cenarios/cen_praca.json` (+ esquema `cenario`) | arena: câmera (giro 0°, 25°, arte 640×360, alvo), palco elíptico, peças do kit em coordenadas locais, luz (sombra ±14, preenchimento), névoa por z (0 → −30), foco. Encontros cujo `cenario` não existe caem no cenário `padrao` |
| `data/combate/cfg_sprites_batalha.json` | qual atlas de batalha cada ator usa; `provisorio` = atlas do Edric com tinta e escala (Grace, Slime, Lobo) até o 04 entregar; `poses_alias` (ex.: `bat_cura` → `bat_habilidade`). **Trocar o provisório por `atlas` própria é só editar esta entrada** (o atlas mora em `assets/sprites/<personagem>/<id>_batalha.*`) |
| `motor/arena.js` | puro: monta o mapa sintético do palco e confere a faixa de combate limpa |
| `motor/cena_batalha.js` | cena 3D da arena, vistas dos atores (pool, sem criar nada por quadro), `projetarSlot`/`slots`, pós (foco por faixa, vinheta +0,05) |
| `motor/toque_batalha.js` | **reprodução da fila**: um ato por vez, `impacto_s` → dano/cura, queda, vitória; mantém o estado VISUAL dos atores (pose, deslocamento, brilho, vida mostrada). Puro e testado |
| `plataforma/apresentacao.js` | decide a vista, transição por névoa (cobre 0,35 s → troca → revela 0,65 s; sem flash; "reduzir movimento": 0,15 s), liga o toque, fecha com `jogo.encerrarBatalha()`; sem UI registrada joga com a política automática |

**Para a UI (15):** (1) monte DOM em `#ui` (id fixo, `pointer-events: none`): ele acompanha o retângulo do jogo e define `--arte-w/--arte-h` (px de arte: 640×360 na batalha) e `--k` (px CSS por px de arte); `data-visao` = `mapa|batalha`. (2) o toque **assina** o controlador (`ctrl.log` + `assinar('*')`) e **não** chama `esvaziarFila()`, então a UI continua dona da fila dela; `batalha_ui.js` hoje reproduz a fila por conta própria e ainda calcula a posição dos rótulos sozinha — para alinhar com os sprites, use `apr.slots()` e `toque.atores`. Com a UI montada, `principal.js` chama `apr.assumirComandos()` (política automática desligada; a UI fecha a batalha). `window.__dunwick.apr` (só dev): `assumirComandos()` desliga a política automática; `toque` (existe só na batalha): `toque.eventos.em(nome, fn)` recebe os eventos do controlador **no instante da apresentação** (`dano`/`curou`/`vida_mudou`/`caiu` no impacto) mais `ato_inicio`/`ato_fim`/`toque_terminou`; `toque.atores.get(uid)` traz `vida/mana/pose/caido` visuais; **só chame `ctrl.executar()` / abra o menu com `toque.ocioso === true`**; `apr.slots()` → posição dos 6 slots em px de arte e CSS (pés e cabeça); `apr.aoGameOver = fn` para mostrar "Tentar de novo". (3) Em produção o acesso é por injeção (`criarApresentacao` devolve o objeto); o `window.__dunwick` não existe.
**Depuração:** `]` (`BracketRight`, só dev) dispara o próximo encontro de `cfg_batalha.debug.encontros`.
**Medido (Chrome real, 1080p, 1920×1080 de janela, teto 56,6 fps):** arena a 57 fps, pior 1 % 18,5 ms nos 3 perfis; 48/45/29 chamadas de desenho (Alto/Médio/Baixo).

## 9. Trecho sugerido para o `CLAUDE.md` (seção "Estado atual do repositório")

> Há código: esqueleto M1 (Three.js, ADR-001). `npm install`; `npm run dev` (http://localhost:5173, debug ligado); `npm test` (node:test; um arquivo: `node --test tests/heroi.test.mjs`; um teste: `--test-name-pattern`); `npm run validar`; `npm run build` (validar → testes → empacotar → peso, saída em `build/prod`); `npm run test:navegador` (Chrome real; `-- --medir=60`). Detalhes em `docs/tecnico/esqueleto_m1.md`. `src/jogo/` é simulação pura (sem three/DOM); `src/motor/` é a única camada que importa `three`.
