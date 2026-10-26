# Métricas de nível e sala de teste do M1


> **Dono:** 06 Sistemas e Níveis · **Status:** RASCUNHO v0.1 (BRF-004, onda 0) · 2026-10-24
> Alinhado com `docs/gameplay.md` v0.1 (03): mesmos nomes de chave. Valores iniciais, que o playtest ajusta.
> Fórmulas e números de combate: `docs/sistemas/formulas.md`. Formato final em `data/maps/` = ADR-001 (08); até lá, tabelas.

Unidades: **tiles** (1 tile = 1 unidade do mundo = 32×32 px de arte), **segundos** e **quadros a 60 Hz**. Plano do chão (x, z) + altura em tiles.

---

## 1. Escala

| Item | Valor | Observação |
|---|---|---|
| Tile | 1,0 × 1,0 | 32 px de arte |
| Célula de sprite do herói/NPC | a rever com 04/10 (câmera isométrica) | âncora nos pés |
| Altura visual do herói | ~1,5 tile (≈ 48 px) | personagem compacto, cabeça grande |
| Área visível | a definir pelo 08/10 (resolução e câmera isométrica; antes 20 × 11,25 tiles) | `camera_area_visivel_tiles` (03 §8.1) |
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

## 5-A. Projeção isométrica (D-025)

Câmera isométrica fixa. **Parâmetros provisórios** (08/10 confirmam no ADR-002): `camera_yaw` 45° (a câmera fica a **sudeste** olhando para **noroeste**; +x = leste, +z = sul; o fundo da tela é o noroeste) e `camera_pitch` ≈ 30° (o tile vira um losango 2:1). Todas as medidas continuam em **tiles do mundo**; só o desenho se projeta. Hitboxes, alcances e telegraphs são formas no chão (03).

| Efeito da projeção | Regra | Com pitch 30° |
|---|---|---|
| Losango do tile | largura : altura = 1 : sen θ | **2 : 1** |
| Altura x chão | 1 tile de altura sobe cos θ na tela; 1 tile de chão ao longo de um eixo sobe sen θ × 0,71 | altura 1,0 → 0,87 · passo de 1 tile em x ou z → 0,35 na vertical e 0,71 na horizontal |
| Velocidade na tela | constante no mundo; ao longo do fundo da tela (diagonal do mundo) o movimento parece **metade** do lateral (sen θ = 0,5) | a antecipação da câmera (03) compensa; não se muda a velocidade |
| Círculo no chão (aviso, área) | vira elipse com semieixos r (horizontal) e r · sen θ (vertical) | aviso de r 2,0: 4 tiles de largura × 2 de altura na tela |
| **Sombra de oclusão** | objeto de altura h esconde o chão atrás dele, na direção da vista, até **h / tan θ** | h 0,75 → 1,3 · h 1,0 → 1,7 · h 2,0 → 3,5 tiles (≈ 2,4 em x e 2,4 em z) |

**Regras de nível (valem para todo mapa):**
1. **Fundo alto, frente baixa:** plataformas, mirantes e paredes grandes ficam no **noroeste** (longe da câmera); a frente (sul e leste) fica aberta.
2. **Rampas e escadas sobem para longe da câmera** (norte ou oeste), para a superfície aparecer inteira.
3. **Paredes voltadas para a câmera** (lados sul e leste de uma área jogável): altura ≤ **0,75** (mureta) ou recorte/transparência automática (`camera_oclusao_alpha`, 07).
4. **Nada importante na sombra de oclusão** de um objeto com altura ≥ 1,0: inimigo, baú, NPC, portal, ponto de salvamento, porta e armadilha. Cada mapa é validado por script (a sala de teste, §8.5). O telegraph desenha por cima do chão e nunca é coberto (guia do 10 §9).
5. **Duas alturas sobrepostas na tela:** o caminho no nível baixo atrás de uma plataforma de altura h fica a pelo menos h / tan θ da borda (1,7 tiles para h = 1) ou tem recorte.
6. **Grade alinhada aos eixos:** corredores, salas e muros seguem x ou z (na tela viram diagonais). Nada de diagonais na grade lógica.
7. **Mouse:** o clique vira ponto no chão na altura do tile clicado (plataformas incluídas); a mira usa o mesmo ponto.

---

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

## 8. Sala de teste do M1 — `map_sala_teste` (isométrica)

Nome provisório (chave de texto `txt_map_sala_teste_nome`). Tamanho **48 × 32 tiles**. **+x = leste (direita), +z = sul (para a câmera)**; o fundo da tela é o noroeste. O tile (x, z) ocupa [x, x+1) × [z, z+1).
Esta versão segue as regras da §5-A: plataforma no fundo, rampa e escada que sobem para longe da câmera, nada importante em sombra de oclusão.

### 8.1 Planta (1 caractere = 1 tile)
```
    000000000011111111112222222222333333333344444444
    012345678901234567890123456789012345678901234567
  0 ################################################
  1 #^^^^^^^^^^^^............#######################
  2 #^^^^^B^^^^^^............#######################
  3 #^^^^^^^^^^^^HH..........#######################
  4 #^^^^^^^^^^^^HH..........#######################
  5 #^^^^^^^^^^^^HH..........#######################
  6 #^^^^^^^^^^^^............#######################
  7 #^^^^^^^^^^^^............#######################
  8 #^^^^^^^^^^^^............#######################
  9 #....///.................#######################
 10 #....///.................#######################
 11 #....///.................#######################
 12 #........N....######.....#######################
 13 #........................#######################
 14 #........................#######################
 15 #.....S......a....g......#######################
 16 #........................#######################
 17 #..V.....................#####,,,,,,,,,,,,,,,,##
 18 #........................#####,,,,,,,,,,,,,,,,##
 19 #.P......................#####,,,,,,,mmm,,e,,,##
 20 #........................#####,,,,##,,,,,,,,,,##
 21 #####...######################,,,,##,,,,,,,,,,##
 22 #####..........AAA...........D,,,,,,,,,,,,,,,,##
 23 #####..........AAA...........D,,,,,,,,E,,,,,,,##
 24 #####..........AAA...........D,,,,,,,,,,,,,##,##
 25 ##############################,,,,,,,,,,,,,##,##
 26 ##############################,,,,,,,,,,,,,,,,##
 27 ##############################,,,,,,,,,,,,f,Q,##
 28 ##############################,,,,,,,,,,,,,,,,##
 29 ################################################
 30 ################################################
 31 ################################################
```
Legenda: `.` chão (altura 0) · `^` plataforma (altura 1) · `/` rampa (0 → 1, **sobe para o norte**) · `H` escada (0 → 1, **sobe para o oeste**) · `#` parede (as faces sul e leste de áreas jogáveis são mureta 0,75 ou recorte; a parede solta e os pilares são **altos**, 2,0) · `m` meia-parede 0,75 · `,` chão da arena · `A` armadilha · `D` porta com chave · letras = objetos (§8.3).

### 8.2 Zonas (retângulos inclusivos, em tiles)
| ID | Zona | x | z | Tamanho | Altura | O que testa | M1? |
|---|---|---|---|---|---|---|---|
| `z_campo` | Campo aberto | 1–24 | 1–20 (fora da plataforma) | 24 × 20 | 0 | andar/correr, clique para mover, câmera, bonecos | **sim** |
| `z_parede_solta` | Parede solta (alta) | 14–19 | 12 | 6 × 1 | 2,0 | deslizar em parede, quinas, recorte de oclusão | **sim** |
| `z_plataforma` | Plataforma (no fundo) | 1–12 | 1–8 | 12 × 8 | 1 | borda com colisão, câmera em altura | **sim** |
| `z_rampa` | Rampa | 5–7 | 9–11 | 3 × 3 | 0 → 1 (sobe ao norte) | subir rampa, sombra no chão | **sim** |
| `z_escada` | Escada | 13–14 | 3–5 | 2 × 3 | 0 → 1 (sobe ao oeste) | descer escada; fecha o **laço** campo → rampa → plataforma → escada → campo | **sim** |
| `z_corredor` | Corredor de combate | 5–7 (z 21–24) e 5–28 (z 22–24) | — | **3 de largura** | 0 | corredor mínimo, armadilha | sim (sem armadilha) |
| `z_arena` | Arena média | 30–45 | 17–28 | **16 × 12** | 0 | encontro, cobertura, limites de câmera | sim (vazia, porta aberta) |

Pilares 2×2 **altos** na arena: (34–35, 20–21) e (43–44, 24–25). Meia-parede (0,75): (37–39, 19).

### 8.3 Objetos
| ID | Tipo | Tile (x, z) | Altura | Propriedades | M1? |
|---|---|---|---|---|---|
| `inicio_jogador` | início | (6, 15) | 0 | direção S | **sim** |
| `enemy_boneco_alvo` | alvo de treino | (13, 15) | 0 | fixo, não ataca; hurtbox raio 0,40 e altura 0,0–1,4; `concede_mana` = não (debug pode forçar sim); vida infinita no debug; contador F10 | **sim** |
| `enemy_boneco_golpe` | boneco que ataca | (18, 15) | 0 | fixo; hurtbox raio 0,40 e altura 0,0–1,4 (igual ao alvo); golpe a cada 120 q com aviso ≥ `aviso_min_comum_quadros`; dano de teste base 18, tipo `impacto` | **sim** |
| `npc_teste` | NPC | (9, 12) | 0 | fala 1 linha (`txt_npc_teste_1`) | não |
| `salvamento_teste` | ponto de salvamento | (3, 17) | 0 | luz quente | não |
| `bau_teste` | baú | (6, 2) | 1 | no fundo da plataforma; contém `item_chave_teste`; luz-guia | não |
| `porta_teste` | porta com chave | (29, 22–24) | 0 | 3 de largura; exige `item_chave_teste`; **no M1 começa aberta** (`aberta_inicial: sim`) | sim (aberta) |
| `armadilha_teste` | espinhos periódicos | (15–17, 22–24) | 0 | aviso 30 q (magenta, enche) → ativo 20 q → inativo 90 q; dano base 15, `impacto` | não |
| `encontro_teste_1` | encontro | centro (38, 23), raio 6 | 0 | 2 inimigos de teste em (42, 19) e (42, 27) | não |
| `portal_teste_a` | portal | (44, 27) | 0 | destino `portal_teste_b`; aceso só com `flag_teste_encontro_1` | não |
| `portal_teste_b` | portal | (2, 19) | 0 | destino `portal_teste_a`; mesma flag | não |
| `limites_camera` | retângulo | x 0–48, z 0–32 | — | câmera nunca mostra fora (03 §8.1) | **sim** |
| `luz_principal` | direcional | — | — | ângulo/cor pelo 10 | **sim** |
| `luz_bau`, `luz_porta`, `luz_salvamento` | pontuais | junto ao objeto | — | luz guia o caminho | não |
| `zona_musica_campo` / `zona_musica_arena` | zonas | `z_campo` / `z_arena` | — | `mus_teste_exploracao` / `mus_teste_combate` (placeholders) | não |

Os bonecos ficam a 5 tiles um do outro e a ≥ 7 tiles do início. O aviso do `enemy_boneco_golpe` não alcança o `enemy_boneco_alvo`.

### 8.4 Fluxo pensado (depois do M1, com interação)
`inicio` → NPC indica o baú → **rampa** → plataforma → **baú (chave)** → **escada** → campo → corredor → **armadilha** → **porta** → **arena** (encontro) → portal aceso → volta ao campo.

### 8.5 Validação (script de referência do 06: BFS em grade com 4 vizinhos + sombras de oclusão)
| Verificação | Resultado |
|---|---|
| Todo tile andável é alcançável do início | ✓ (733 tiles) |
| De todo tile andável há caminho a pé de volta ao início, sem portal | ✓ (impossível ficar preso) |
| Arena alcançável sem a chave | ✗, como esperado; baú alcançável sem a chave ✓ (13 passos) |
| Corredor e porta com 3 tiles de largura | ✓ |
| **Objetos importantes em sombra de oclusão** (oclusores altos: parede solta e 2 pilares, h = 2,0, sombra de 3,5 tiles; meia-parede h = 0,75, sombra de 1,3) | **nenhum** ✓ |
| Início → baú | 13 passos ≈ 3,7 s andando |
| Baú → arena (centro) | 32 passos ≈ 9 s andando / 5,3 s correndo, com a armadilha no caminho |

A distância é contada em 4 direções, então é o limite de cima. A sombra de oclusão usa pitch 30° e yaw 45° (provisórios): se o ADR-002 mudar a câmera, o script é rodado de novo.

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
| 2026-10-24 | §5-A projeção isométrica e §8 sala isométrica | planta 3/4 → planta isométrica | D-025 |
| 2026-10-24 | §9 Respostas ao Produtor (BRF-010) | — | D-017/D-018; `formulas.md` §4.4 ganha `ponto_fraco` ×1,25 |
