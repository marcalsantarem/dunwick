# Métricas de nível e sala de teste do M1

> ⚠ **A ATUALIZAR (D-024, 2026-10-24):** tile de 32 px, câmera a 35°, velocidades 3,5 / 6 e a sala 48×32 caem (protótipo: tile isométrico 64×32, 1280×720, 2,2 / 3,5 tiles/s). O que fica e o que muda está em `docs/sistemas/reconciliacao_prototipo.md` §6. Os números do chefe da §9 também mudam (§4 de lá).

> **Dono:** 06 Sistemas e Níveis · **Status:** RASCUNHO v0.1 (BRF-004, onda 0) · 2026-10-24
> Alinhado com `docs/gameplay.md` v0.1 (03): mesmos nomes de chave. Valores iniciais, que o playtest ajusta.
> Fórmulas e números de combate: `docs/sistemas/formulas.md`. Formato final em `data/maps/` = ADR-001 (08); até lá, tabelas.

Unidades: **tiles** (1 tile = 1 unidade do mundo = 32×32 px de arte), **segundos** e **quadros a 60 Hz**. Plano do chão (x, z) + altura em tiles.

---

## 1. Escala

| Item | Valor | Observação |
|---|---|---|
| Tile | 1,0 × 1,0 | 32 px de arte |
| Célula de sprite do herói/NPC | 2 × 2 tiles (64 × 64 px) | âncora nos pés (32, 60) |
| Altura visual do herói | ~1,5 tile (≈ 48 px) | personagem compacto, cabeça grande |
| Área visível | 20 × 11,25 tiles | `camera_area_visivel_tiles` (03 §8.1); 08/10 confirmam |
| Zona de ação sem HUD | 12 × 6,75 tiles (60 % × 60 %) | D-007 |

## 2. Herói (confirma `gameplay.md` §4.3)

| Chave | Valor | Status |
|---|---|---|
| `pushbox_raio_tiles` | 0,35 (diâmetro 0,7) | **confirmado** |
| `hurtbox_raio_tiles` | 0,30 | **confirmado** |
| `hurtbox_altura_tiles` | 0,0 – 1,4 | **confirmado** (abaixo da altura visual de ~1,5) |
| `raio_interacao_tiles` | 1,0 | confirmado |
| `esquiva_distancia_tiles` | 3,0 | confirmado |
| Alcance do herói | 1,3 (leve) · 1,5 (leve_3) · 1,7 (forte) | do 03 §5.3; base para medir arenas e corredores |

## 3. Movimento e tempo de travessia

| Chave | Valor | 10 tiles em… |
|---|---|---|
| `vel_andar` | 3,5 tiles/s | 2,9 s |
| `vel_correr` | 6,0 tiles/s | 1,7 s |
| Esquiva | 3 tiles em 18 quadros | — |

**Regra de ritmo:** tempo máximo sem acontecimento = **10–15 s**, ou seja, **35–52 tiles andando** ou **60–90 tiles correndo**. Nenhum trecho de rota principal passa disso sem algo para ver, pegar ou enfrentar.

## 4. Espaço horizontal

| Métrica | Valor | Por quê |
|---|---|---|
| Passagem mínima (exploração) | **2 tiles** | diâmetro do pushbox (0,7) + folga para não travar em quinas |
| Corredor de combate (mínimo) | **3 tiles** | esquiva lateral de 3 tiles cabe; inimigo e herói se cruzam |
| Porta comum / porta em rota de combate | 2 / 3 tiles | — |
| Rampa e escada (largura) | ≥ 2 tiles; **3 na rota principal** | — |
| Arena pequena / média / grande | **10×8 / 16×12 / 22×16** | o menor lado (8) ≥ 2 esquivas + 2 de margem |
| Distância de parede a parede para lutar | ≥ 8 tiles no menor lado | herói esquiva duas vezes sem bater |
| Cobertura (pilar) | 2×2 tiles, **parede alta** (≥ 2,0) | bloqueia movimento, golpes e projéteis; transparência de câmera se ficar entre câmera e herói |
| Espaço livre ao redor de NPC, baú, alavanca | 1 tile em pelo menos 2 lados | interação (cone de 90°, raio 1,0) |

## 5. Altura

| Métrica | Valor | Regra |
|---|---|---|
| Altura de um andar (plataforma) | **1,0 tile** | desníveis só em múltiplos de 1,0 no slice |
| Rampa | ≥ **2 tiles** de comprimento por 1 de altura (≤ ~27°) | sombra do herói sempre no chão (03 M1 §11.1-2) |
| Escada | ≥ **2 tiles** de comprimento por 1 de altura | mesma velocidade da rampa; diferença só visual e de som (05) |
| Borda de plataforma | **sempre com colisão** | sem queda e sem pulo no slice (03 §4.1); borda visível (mureta, pedra, guarda-corpo) |
| Meia-parede (cobertura) | **0,75 tile** | bloqueia movimento e projéteis (faixa 0,3–1,0 do 03 §5.5); não bloqueia visão |
| Parede alta | ≥ **2,0 tiles** | bloqueia tudo; se ficar entre câmera e herói, transparência (`camera_oclusao_alpha`, 07) |
| Degrau decorativo sem colisão | ≤ 0,25 tile | não muda a altura lógica |

**Regra do diorama (06 §11.6):** a altura serve para composição e mirantes; o **combate acontece num plano só** (sem combate em rampa ou escada no slice).

## 6. Encontros e perigos

| Métrica | Valor | Por quê |
|---|---|---|
| Distância de percepção do inimigo (frente) | **5 tiles** | a meia-altura da tela é ~5,6 tiles: o inimigo é visto antes de reagir, também no eixo z |
| Percepção pelas costas | 2,5 tiles | dá para chegar pelas costas (contra-jogo do Pesado) |
| Desistir da perseguição | > 9 tiles do herói ou > 15 do ponto de origem | volta a patrulhar; nada de perseguir pelo mapa todo |
| Espaço entre grupos de encontro | **≥ 14 tiles** (2 × percepção + 4) | um grupo não puxa o outro sem querer |
| Inimigos atacando ao mesmo tempo | 2 (`fichas_ataque_max`) | 03 §6.3 |
| Velocidade de projétil inimigo | 5–8 tiles/s | a 5 tiles de distância, ≥ 0,6 s para reagir |
| Aviso de armadilha/perigo de cenário | ≥ **30 quadros** (0,5 s) | convenção do 10: zona **magenta** com a forma exata no chão, preenchendo até o disparo; zona contínua tracejada, pulso ≤ 1 Hz |
| Respiro depois de encontro difícil | baú, atalho ou ponto de salvamento a ≤ 15 tiles | 06 §9.3 |
| Distância entre pontos de salvamento | 2–4 min de jogo | — |
| Inimigo "dorme" | fora da tela + 4 tiles | `dormir_alem_camera_tiles` (03 §6.3) |

## 7. Leitura e navegação
- Saída ou objetivo **iluminado**; perigo na penumbra **com sinal** (forma + magenta), nunca escondido por primeiro plano.
- Toda porta trancada, portão ou bloqueio é **sinalizado** (fechadura visível, ícone). Nada de parede invisível.
- **Impossível ficar preso:** de qualquer tile andável existe caminho a pé de volta ao início da área (validado por script na sala do M1, §8.5).
- Coordenadas sempre em tiles; todo portal tem par; todo ID referenciado existe.

---

## 8. Sala de teste do M1 — `map_sala_teste`

Nome provisório (chave de texto `txt_map_sala_teste_nome`). Tamanho **48 × 32 tiles**. Origem no canto noroeste; **x cresce para leste** (direita da tela), **z cresce para sul** (em direção à câmera). O tile (x, z) ocupa [x, x+1) × [z, z+1); o centro é (x + 0,5, z + 0,5).

### 8.1 Planta (1 caractere = 1 tile)
```
    000000000011111111112222222222333333333344444444
    012345678901234567890123456789012345678901234567
  0 ################################################
  1 #....................###^^^^^^^^^^^^############
  2 #......N.............###^^^^^^^^^^B^############
  3 #....................///^^^^^^^^^^^^############
  4 #..........a....g....///^^^^^^^^^^^^############
  5 #....................///^^^^^^^^^^^^############
  6 #....................###^^^^^^^^^^^^############
  7 #...S................###^^^^^^^^^^^^############
  8 #....................###^^^^^^^^^^^^############
  9 #...........######...############HHH############
 10 #.....V..............############HHH############
 11 #........................................#######
 12 #........................................#######
 13 #.P......................................#######
 14 #........................................#######
 15 #####...########################################
 16 #####...########################################
 17 #####...########################################
 18 #####...######################,,,,,,,,,,,,,,,,##
 19 #####...######################,,,,,,,,,,,,,,,,##
 20 #####...######################,,,,,,,mmm,,,,,,##
 21 #####...######################,,,,##,,,,,,e,,,##
 22 #####..........AAA...........D,,,,##,,,,,,,,,,##
 23 #####..........AAA...........D,,,,,,,,E,,,,,,,##
 24 #####..........AAA...........D,,,,,,,,,,,,,,,,##
 25 ##############################,,,,,,,,,,##,,,,##
 26 ##############################,,,,,,,,,,##,,,,##
 27 ##############################,,,,,,,,,,,,f,,,##
 28 ##############################,,,,,,,,,,,,,,Q,##
 29 ##############################,,,,,,,,,,,,,,,,##
 30 ################################################
 31 ################################################
```
Legenda: `.` chão (altura 0) · `^` plataforma (altura 1) · `/` rampa (0→1, sobe para leste) · `H` escada (1→0, desce para sul) · `#` parede alta/rocha · `m` meia-parede 0,75 · `,` chão da arena (altura 0) · `A` armadilha · `D` porta com chave · letras = objetos (§8.3).

### 8.2 Zonas (retângulos inclusivos, em tiles)
| ID | Zona | x | z | Tamanho | Altura | O que testa | M1? |
|---|---|---|---|---|---|---|---|
| `z_campo` | Campo aberto | 1–20 | 1–14 | 20 × 14 | 0 | andar/correr em 8 direções, câmera, bonecos | **sim** |
| `z_parede_solta` | Parede solta | 12–17 | 9 | 6 × 1 | parede alta | deslizar em parede, quinas, oclusão de câmera | **sim** |
| `z_rampa` | Rampa | 21–23 | 3–5 | 3 × 3 | 0 → 1 | subir rampa, sombra no chão | **sim** |
| `z_plataforma` | Plataforma | 24–35 | 1–8 | 12 × 8 | 1 | borda com colisão, câmera em altura | **sim** |
| `z_escada` | Escada | 33–35 | 9–10 | 3 × 2 | 1 → 0 | descer escada; fecha o **laço** campo → plataforma → pátio | **sim** |
| `z_patio` | Pátio | 21–40 | 11–14 | 20 × 4 | 0 | volta do laço | **sim** |
| `z_corredor` | Corredor de combate | 5–7 (z 15–24) e 5–28 (z 22–24) | — | **3 de largura** | 0 | corredor mínimo, armadilha | sim (sem armadilha) |
| `z_arena` | Arena média | 30–45 | 18–29 | **16 × 12** | 0 | encontro, cobertura, câmera com limites | sim (vazia, porta aberta) |

Pilares 2×2 na arena, **parede alta**: (34–35, 21–22) e (40–41, 25–26). Meia-parede (0,75): (37–39, 20).

### 8.3 Objetos
| ID | Tipo | Tile (x, z) | Altura | Propriedades | M1? |
|---|---|---|---|---|---|
| `inicio_jogador` | início | (4, 7) | 0 | direção S | **sim** |
| `enemy_boneco_alvo` | alvo de treino (03 §11.1-11) | (11, 4) | 0 | fixo, não ataca; hurtbox raio 0,40 e altura 0,0–1,4; `concede_mana` = não (debug pode forçar sim); vida infinita no debug; contador F10 | **sim** |
| `enemy_boneco_golpe` | boneco que ataca (03 §11.1-12) | (16, 4) | 0 | fixo; hurtbox raio 0,40 e altura 0,0–1,4 (igual ao alvo); golpe a cada 120 q com aviso ≥ `aviso_min_comum_quadros`; dano de teste base 18, tipo `impacto` | **sim** |
| `npc_teste` | NPC | (7, 2) | 0 | fala 1 linha (`txt_npc_teste_1`) | não (interação fora do M1) |
| `salvamento_teste` | ponto de salvamento | (6, 10) | 0 | luz quente | não |
| `bau_teste` | baú | (34, 2) | 1 | contém `item_chave_teste`; luz-guia pontual | não |
| `porta_teste` | porta com chave | (29, 22–24) | 0 | 3 de largura; exige `item_chave_teste`; **no M1 começa aberta** (`aberta_inicial: sim`) | sim (aberta) |
| `armadilha_teste` | espinhos periódicos | (15–17, 22–24) | 0 | ciclo: aviso 30 q (magenta, enche) → ativo 20 q → inativo 90 q; dano base 15, `impacto`, passa pela fórmula com `mult_dano_recebido` | não |
| `encontro_teste_1` | encontro | centro (38, 23), raio 6 | 0 | 2 inimigos de teste em (42, 21) e (42, 27); IDs no bestiário (futuro) | não |
| `portal_teste_a` | portal | (44, 28) | 0 | destino `portal_teste_b`; aceso só com a flag `flag_teste_encontro_1` (atalho de volta) | não |
| `portal_teste_b` | portal | (2, 13) | 0 | destino `portal_teste_a`; mesma flag | não |
| `limites_camera` | retângulo | x 0–48, z 0–32 | — | câmera nunca mostra fora (03 §8.1) | **sim** |
| `luz_principal` | direcional | — | — | ângulo/cor pelo 10 | **sim** |
| `luz_bau`, `luz_porta`, `luz_salvamento` | pontuais | junto ao objeto | — | luz guia o caminho | não |
| `zona_musica_campo` / `zona_musica_arena` | zonas | `z_campo`+`z_patio` / `z_arena` | — | `mus_teste_exploracao` / `mus_teste_combate` (05, placeholders) | não |

Os bonecos ficam a 5 tiles um do outro e a ≥ 7 tiles do início. O aviso do `enemy_boneco_golpe` não alcança o `enemy_boneco_alvo`, então dá para testar alcance e esquiva separadamente.

### 8.4 Fluxo pensado (depois do M1, quando houver interação)
`inicio` → NPC indica o baú → rampa → plataforma → **baú (chave)** → escada → pátio → corredor → **armadilha** (esquivar no tempo) → **porta** → **arena** (encontro) → portal aceso → volta ao campo.
Fluxo da masmorra em miniatura (06 §11.5): fechadura, chave, desafio e atalho de volta.

### 8.5 Validação (script de referência do 06, BFS em grade com 4 vizinhos)
| Verificação | Resultado |
|---|---|
| Todo tile andável é alcançável do início | ✓ (740 tiles) |
| De todo tile andável existe caminho a pé de volta ao início (sem portal) | ✓ (impossível ficar preso) |
| Arena alcançável sem a chave | ✗, como esperado (porta fecha) |
| Baú alcançável sem a chave | ✓ (a chave nunca fica atrás da própria porta) |
| Corredor e porta com 3 tiles de largura | ✓ |
| Início → baú | 35 tiles ≈ 10 s andando |
| Baú → arena (centro) | 55 tiles ≈ 15,7 s andando / 9,2 s correndo, com a armadilha no meio (ritmo ok) |
| Arena → início a pé (sem portal) | 61 tiles ≈ 17 s; com o portal, 0 s (atalho que se nota) |

A distância é contada por passos em 4 direções, então é o limite de cima. Com 8 direções o percurso real fica mais curto.

---

## 9. Respostas ao Produtor (BRF-010: 3 estados da vila e o urso-musgo)

> Base: `missao_principal_slice.md` v4, `boss_urso_musgo.md`, D-017/D-018. Custos: baixo / médio / alto. A resposta (e) do 03 ainda não existe; assumi **estado resolvido no carregamento do mapa + cenas que trocam objeto por objeto** e o 03 confirma.

**(a) Três estados de `map_baixo_orvalho`: por flags, num único mapa. Custo médio.**
O mapa (layout, colisão, portais, luzes-base) é um só. O estado é uma tabela `estados_mapa` com `condição` (flags) e, por objeto, `visivel`, `pose`, `interativo`, `luz` e `musica`:
`adormecida` = `flag_vila_dorme` e não `flag_vila_curada`; `acordada` = `flag_vila_acordada`; senão `dia`.
Dados: baixo (6–8 NPCs × 3 linhas). Implementação: médio (o 03 resolve o estado ao carregar). Arte: **alto se cada NPC ganhar pose de dormir** (6–8 sprites extras do 04).
**Alternativa barata (recomendada):** adormecida = pose parada atual + luz fria + partículas "zz" do 10, sem sprite novo; poses dedicadas só se sobrar orçamento. `acordada` não custa arte: usa as poses normais, luz de manhã e os `txt_epi_*`.

**(b) Flags: cabem no esquema de missões sem mudança. Custo baixo.**
São 11 flags principais + 11 das secundárias (booleanas ou inteiros 0–3, padrão 0), e gatilhos com E de flags (ex.: cura = `flag_sino_limpo` E `flag_grace_no_grupo` dentro da vila). `flag_epilogo_partir` só liga a tela de encerramento.
**Pedido ao 02:** `flag_vila_curada` e `flag_vila_acordada` se sobrepõem (cena 3.4 e corte para a 3.5). Sugiro manter só uma, ou dizer qual liga cada coisa; senão há dois estados possíveis para o mesmo instante.

**(c) Itens e recompensas só em item: confirmado. Custo baixo.** Valores iniciais (provisórios, sem economia ainda; vida do herói nv. 1 = 140):

| ID | Tipo | Efeito / valor | Venda |
|---|---|---|---|
| `item_doce_limao` | consumível, empilha 9 | cura **25** (H-fórmula §9 do formulas) | 6 |
| `item_sopa_ervas` | consumível, empilha 9 | cura **30** | 8 |
| `item_pocao_ervas` | consumível, empilha 9 | cura **50** ("cura pequena" da 27-B = 2 desta) | 12 |
| `item_carimbo_honorario` | lore, não empilha | sem efeito, valor 0 | não vende |
| `item_sino_antigo`, `item_sino_limpo`, `item_livro_cuidadora`, `item_contrato_ysolt` | chave/lore | sem efeito; não vende nem descarta | não vende |

Sem moedas como recompensa (só trocam de mão na secundária do viajante). **Alternativa barata:** doce, sopa e poção partilham o ícone de cura com cor diferente (menos arte para o 07/04).

**(d) Urso-musgo (`boss_urso_musgo`). Custo médio na lógica; alto só no sprite do 04.**
- **Arquétipo:** Pesado, com Atirador na fase 2 (estilhaços). Pergunta: "tenho paciência?". Contra-jogo: esquivar e punir a recuperação, quebrar a postura, atacar o ombro esquerdo.
- **Fases por vida:** 100–66 % território · 66–33 % posse (cristais) · 33–0 % verdade. Transição: invencível ~2 s, flash ≤ 3/s.
- **Golpes (resumo, em quadros; telegraph ≥ 60 e forma exata no chão, convenção do 10):**

| Golpe | Forma | Aviso | Ativo | Recup. | Dano base | Fases |
|---|---|---|---|---|---|---|
| pancada | círculo r 2,0 | 90 | 8 | 55 | 28 `impacto` | 1–3 |
| varrida | cone 120°, alcance 3,0 | 72 | 6 | 45 | 20 `corte` | 1–3 |
| investida | retângulo 6 × 1,6 | 100 | 12 | 70 | 24 `impacto` | 1–3 |
| estouro de cristais | arco 180°, alcance 4,5 | 66 | 6 | 50 | 18 `perfuracao` | 2–3 |

  Fase 2: avisos −20 %, mas nunca abaixo de 60 (o aviso não encurta além disso, para o 02 "telegraph mantido"). Fase 3: combina 2 golpes em sequência, recuperação +20 q (janela de dano maior), sem tirar o aviso.
- **Números de referência (a calibrar em simulação):** vida ~2800 (faixa 2400–3200), duração-alvo 3–6 min, vitória 20–40 % na 1ª tentativa. Postura 200, `resist_recuo` 1,0 (o combo leve não o trava), QUEBRADO 90 q com ×1,5 de dano e **10 s sem acumular postura depois de quebrar** (regra nova para chefes, para não encadear). Meta: 1 quebra por fase.
- **Ponto fraco (ombro esquerdo):** segunda hurtbox com `ponto_fraco` ×1,25 (nova linha em `formulas.md` §4.4); brilha na fase 2+. **Alternativa barata:** sem ponto fraco, só quebra de postura.
- **Arena:** câmara circular de ~18 tiles de diâmetro (entre as arenas média e grande). O chefe ocupa ≈ 3 × 3 tiles (hurtbox r ≈ 1,2). Pilares só como cobertura, sem obstáculo grande.
- **Morte e memento:** vida 0 → cena sem controle (o 03 define o corte). Sem mecânica de dano nela; o memento é interação opcional, sem recompensa em número.

---

## Histórico de mudanças
| Data | Mudança | Antes → depois | Motivo |
|---|---|---|---|
| 2026-10-24 | Criação (BRF-004) | — | Onda 0; alinhado ao `gameplay.md` v0.1 |
| 2026-10-24 | §9 Respostas ao Produtor (BRF-010) | — | D-017/D-018; `formulas.md` §4.4 ganha `ponto_fraco` ×1,25 |
