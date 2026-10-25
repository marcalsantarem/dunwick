# Reconciliação com o protótipo "Vale de Dunwick" (BRF-011 / D-024)

> **Dono:** 06 Sistemas e Níveis · **Status:** PROPOSTA v0.1 · 2026-10-24 · aguarda o usuário nas perguntas da §7.
> Fonte dos números: `referencia/prototipo/index.html` (`PLAYER_STATS`, `ENEMY_TYPES`, classes do herói e do inimigo). Conversões para quadros a 60 Hz e os totais foram recalculados por script.
> Enquanto o usuário não responder, `formulas.md` e `metricas.md` ficam como estão, com aviso de "a atualizar" no topo. Depois da resposta eu os reescrevo a partir daqui.
> Regra: o jogo é o do protótipo ("mais bonito e polido"); o que o projeto exige (telegraph, passo fixo, números em dados, acessibilidade) entra **sem mudar a sensação**.

---

## 1. O que o protótipo realmente faz (lido no código)

| Item | Protótipo | Em quadros / tiles |
|---|---|---|
| Vida / fôlego do herói | 100 / 100 | — |
| Crescimento por nível | vida **+10**, dano **+2** (plano), XP seguinte ×1,45 a partir de 60 | sem atributos, sem mana |
| Andar / correr | 2,2 / 3,5 tiles/s | 10 tiles: 4,5 s / 2,9 s |
| Correr gasta fôlego | −18/s; fôlego regenera +22/s fora de correr; exausto até passar de 25 | — |
| Golpe do combo | 12 / 14 / 20 de dano; cada golpe 6/16 s | **23 q**; acerto no quadro 8 (frame 2); entrada do próximo aceita do quadro 8 em diante; 3º golpe recuo 6 (os outros 2,5) |
| Alcance e cone do golpe | 1,45 + raio do alvo; cone ≈ ±75° (dot ≥ 0,25); mira automática até 2,2 tiles | cabe no 03 §5.3 (1,3–1,7; 100–150°) |
| Giro (Q) | 0,45 s, acerta aos 0,12 s; raio 1,9; dano ×1,5 (**18**); recarga **6 s** | 27 q, acerto no q 7 |
| Investida (E) | 3 tiles em 0,22 s; raio 0,9; dano ×1,6 (**19**); invencível 0,3 s; recarga **8 s** | 13 q |
| Rolamento | 0,42 s, ~1,95 tiles (6,2 tiles/s caindo pela metade), invencível 0,3 s, **custo 20 de fôlego**, sem recarga | **25 q**, invencível q 1–18 |
| Dano no herói | invencível 0,5 s depois do golpe; estado "hurt" 0,25 s; recuo 5 | **30 q** / **15 q** |
| Regeneração de vida | +2/s depois de 5 s sem combate | — |
| Dano do herói | `dano × (crítico ? 2 : 1) × aleatório(0,92–1,08)`; **crítico 10 %** | variação em **todo** golpe, não só no crítico |
| Inimigos | lobo 40/8, lobo-alfa 250/18, javali 55/12, javali-rei 340/16, lobo acuado 34/9 | — |
| IA / aviso | golpe corpo a corpo: animação de 0,32 s antes do acerto; **investida do javali: aviso 0,55 s (linha no chão)**; alfa 0,8 s; pisão do javali-rei 0,55 s | 19 / 33 / 48 / 33 q |
| Ciclo de ataque do inimigo | acerta aos 0,32 s, volta a perseguir aos 0,62 s, espera 1,2 s antes do próximo | 19 q · 37 q · 72 q |
| Postura dos chefes | recuo ×0,35; não entram em "hurt" | ≈ `resist_recuo` 0,65 |

## 2. O que muda no 06 (e por quê)

| Tema | Hoje (formulas/metricas v0.1) | Proposta | Por quê |
|---|---|---|---|
| Atributos (Vigor/Força/Destreza/Mente) | 4, 3 pontos por nível | **Removidos do slice.** Crescimento automático: vida +10, dano +2 por nível | O protótipo não tem; menos tela e menos regra. Os campos `atributo/escala` ficam nos dados (valor 0) para voltar no M4 |
| Mana | recurso de habilidades, mana por acerto | **Removida.** Habilidades só por recarga (giro 6 s, investida 8 s) | Idem. Fôlego é o único recurso além da vida |
| Fôlego | esquiva 25, forte 20, correr grátis, atraso 30 q | Do protótipo: **correr −18/s, rolamento −20, regenera +22/s** fora de correr e de ação, exausto até > 25 | É o ritmo que o usuário aprovou |
| Vida inicial | 140 | **100** (+10 por nível) | Idem |
| Dano | `base × (1 + escala × atributo/100)` | **Aditivo plano:** `dano_golpe + 2 × (nível−1) + bônus_itens`; combo 12/14/20, giro ×1,5, investida ×1,6 (§3) | Reproduz o protótipo; pipeline e ordem do 03 §7.4 continuam |
| Golpe forte | `atk_hero_forte`, custo de fôlego | **Cai**: o 3º golpe do combo (20) faz o papel de golpe forte | Não existe no protótipo; o 03 confirma |
| Mult. de dificuldade | expostos | **Mantidos** (dano causado/recebido, janela, aviso); a janela passa a ser sobre os 18 q de invencibilidade do rolamento | D-005 |
| Postura / QUEBRADO | inimigos, 90 q | **Mantida**, menor (§4): a investida e o 3º golpe quebram | Dá contra-jogo ao Pesado sem mudar a sensação |
| Estados | 6 | Mantidos, mas **fora do slice** os de controle (Congelado, Atordoado) ficam desligados: o protótipo só tem "stunned" do javali ao bater na parede | Escopo |
| Tipos de dano | `corte` etc. | Mantidos (corte, impacto; elementais desligados) | Resistência do besouro |
| Metas de balanceamento | tempo para matar 3–8 s; erros até morrer 5–9; chefe 3–6 min | **Ajuste ao ritmo do protótipo** (§5): comum 1–3 s, erros 8–15, chefe 1,5–3 min | O protótipo mata um lobo em ~1,1 s e dá 13 mordidas de margem |
| XP | `100 × n^1,6` | Do protótipo: 60, ×1,45 por nível (nível 1→9: 60, 87, 126, 183, 265, 384, 557, 808, 1172; total 3642) | Idem. Nível máximo do slice: ver pergunta 3 |
| Velocidades | 3,5 / 6 tiles/s | **2,2 / 3,5** | Do protótipo |
| Esquiva | 3 tiles em 18 q, invencível 9 q, recarga 24 q | **~2 tiles em 25 q, invencível 18 q, sem recarga, custo 20** | Idem |
| Pós-dano | invencível 60 q, travamento 20 q | **30 q / 15 q** | Idem (os dois chaves são do 03; aviso o Produtor) |

## 3. Fórmula de dano reconciliada (substitui §4 de `formulas.md`)

```
dano_golpe_do_herói = golpe_base + bônus_nível + bônus_itens
   combo: 12 / 14 / 20 · giro: arred(1,5 × (12 + bônus)) · investida: arred(1,6 × (12 + bônus))
   bônus_nível = 2 × (nível − 1)

dano_final = max(1, arred( dano_golpe × mult_crítico × mult_variação × mult_buffs × mult_situacional
                           × mult_dificuldade × (1 − resistência_ao_tipo) ))
mult_crítico  = 2,0 se crítico (10 %), senão 1,0           ← depende da pergunta 1
mult_variação = 0,92–1,08 uniforme                         ← depende da pergunta 1
```
Ordem do pipeline (03 §7.4) inalterada. Os testes fixam a semente (ou desligam crítico e variação).

| # | Entrada | Saída |
|---|---|---|
| E1 | combo 1º golpe, nível 1, sem crítico, sem variação | **12** |
| E2 | combo 3º golpe, nível 10 (bônus 18) | 20 + 18 = **38** |
| E3 | giro nível 1 (12 × 1,5) | **18**; nível 10 (30 × 1,5) = **45** |
| E4 | investida nível 1 (12 × 1,6 = 19,2) | **19**; nível 10 = **48** |
| E5 | combo 2º golpe vs besouro (`corte` 0,25 de resistência) | 14 × 0,75 = 10,5 → **11** |
| E6 | investida (`impacto`) vs besouro (fraqueza −0,25) | 19 × 1,25 = 23,75 → **24** |
| E7 | combo 1º golpe, crítico sem variação | 12 × 2 = **24** |
| E8 | combo 1º golpe, variação 0,92 / 1,08 | 11,04 → **11** / 12,96 → **13** |
| E9 | mordida do lobo base 8, `mult_dano_recebido` 1,0 | **8** |

Vida: `vida_max = 100 + 10 × (nível − 1) + bônus_itens` → nível 1 **100**, nível 10 **190**.

## 4. Valores iniciais dos inimigos (escala do protótipo: herói 100 de vida, combo 46 por ~1,1 s)

Valores **de referência** para a primeira versão e a simulação. Todos obedecem o telegraph do 03 §6.3 (comum ≥ 18 q, forte ≥ 36 q, chefe ≥ 60 q). Distâncias em tiles, tempos em quadros.

| ID | Papel (D-023) | Vida | Dano | Vel. perseguição | Percepção | Alcance | Aviso | Ativo | Recup. | Intervalo | Postura · resist. recuo |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `enemy_lobo` | Combatente | **40** | **8** `corte` | 3,1 | 6 | 1,0 | **19** | 4 | 18 | 72 q | 40 · 0 |
| `enemy_morcego` | Rápido | **22** | **6** `corte` | 4,5 (voo, errático) | 6 | 0,8 (mergulho) | **18** | 4 | 24 | 84 q | 20 · 0 |
| `enemy_slime` | Emboscador | **45** | **7** `impacto` | 1,6 | 2,0 (escondido) | 0,9 | **24** (pulo, marcador no chão) | 5 | 30 | 90 q | 30 · 0,5 |
| `enemy_besouro` | Pesado | **70** | **14** `impacto` | 1,8 | 5 | 1,2 | **36** | 5 | 36 | 130 q | 60 · 1,0 |
| `enemy_goblin_arqueiro` | Atirador | **30** | **9** `perfuracao` (flecha 7 tiles/s, vive 1,2 s) | 2,6 (recua se herói < 3) | 8 | 8 (distância preferida 6) | **30** (linha de mira no chão) | — | 24 | 120 q | 20 · 0 |

Fichas rápidas (contra-jogo e identidade em 1 segundo):
- **Lobo:** igual ao protótipo (40/8). Rodeia e morde; esquiva no aviso e punir a recuperação. O lobo-alfa e o lobo acuado do protótipo ficam **fora do slice**.
- **Morcego:** mergulha e sai; dá dois golpes de combo. Contra-jogo: esquiva no mergulho ou giro quando vêm em bando. Hurtbox na faixa de altura 0,6–1,2: golpes baixos podem errar.
- **Slime:** parado como poça até o herói chegar a 2 tiles; pula com marcador no chão. Depois persegue devagar. Contra-jogo: não passar por poças suspeitas (som e brilho 1 s antes); sai fácil por velocidade.
- **Besouro:** couraça: resistência `corte` 0,25, fraqueza `impacto` −0,25, postura 60 e `resist_recuo` 1,0 (o combo não o trava). O 3º golpe ou a investida fazem a postura cair; pelas costas ×1,25. Contra-jogo: esquiva lateral e punir.
- **Goblin arqueiro:** aviso em linha magenta; flecha lenta o bastante para esquiva (a 6 tiles chega em ~0,86 s). Corre dos golpes de perto. Contra-jogo: cobertura e fechar distância.

**Postura do herói em dano de postura:** combo 8 / 8 / 16, giro 14, investida 20 (`impacto` ×1,5 = 30). Regeneração: 120 q sem ser atingido, 25 %/s.

**Cálculos de conferência (herói nível 1):** lobo 3 golpes (~1,1 s); morcego 2 (~0,75 s); slime 3 (~1,1 s); besouro 6 golpes (~2,3 s); goblin 3 (~1,1 s). Mordidas até morrer: lobo 13, morcego 17, slime 15, besouro 8, goblin 12.

### Hollowpaw (`boss_urso_musgo`) — resumo no ritmo do protótipo

| Item | Valor inicial |
|---|---|
| Papel | Pesado (+ Atirador na fase 2). 3 fases por vida: 100–66 % · 66–33 % · 33–0 %. Transição: invencível ~2 s |
| Vida | **1000** (faixa 800–1200). Protótipo: 250 e 340; ver pergunta 4 |
| Postura · `resist_recuo` | 120 · 0,65 (como o protótipo: recuo ×0,35). QUEBRADO 90 q, depois 10 s sem acumular postura |
| Ponto fraco | ombro esquerdo, `ponto_fraco` ×1,25 (já em `formulas.md` §4.4) |
| Tempo de luta | duração-alvo **1,5–3 min** (~25 s de dano puro com combo; resto é esquiva) |
| Taxa de vitória | 20–40 % na 1ª tentativa |

| Golpe | Forma | Aviso | Ativo | Recup. | Dano | Fases |
|---|---|---|---|---|---|---|
| pancada | círculo r 2,0 | **90** | 8 | 55 | **20** `impacto` | 1–3 |
| varrida | cone 120°, alcance 3,0 | **72** | 6 | 45 | **14** `corte` | 1–3 |
| investida | retângulo 6 × 1,6 | **100** | 12 | 70 | **18** `impacto` | 1–3 |
| estouro de cristais | arco 180°, alcance 4,5 | **66** | 6 | 50 | **12** `perfuracao` | 2–3 |

Fase 2: avisos −20 % (nunca abaixo de 60). Fase 3: pares de golpes, recuperação +20 q, aviso nunca some. Golpes até morrer: pancada 5 · varrida 8 · investida 6 · estouro 9. Os números do chefe substituem os do `metricas.md` §9, ajustados à vida de 100 do herói (eram para 140).

## 5. Metas de balanceamento ajustadas ao ritmo do protótipo

| Meta | Era | Passa a ser |
|---|---|---|
| Tempo para matar comum | 3–8 s | **1–3 s** (o lobo cai em ~1,1 s) |
| Erros graves até morrer (inimigo comum) | 5–9 | **8–15**; chefe **5–9** |
| Elite | 25–45 s | **8–15 s** |
| Chefe do slice | 3–6 min | **1,5–3 min** |
| Tempo por nível (início) | 8–15 min | **~5 min** (lobo = 25 de XP; nível 2 com 60) |
| Telegraph | comum ≥ 18, forte ≥ 36, chefe ≥ 60 | igual |

**Telegraph x protótipo (conflitos a corrigir quando for reimplementar):** a investida do javali (33 q) e a do alfa (48 q) ficam abaixo do mínimo da categoria (36 forte / 60 chefe); o pisão do javali-rei (33 q) idem. Proponho 36 / 60 / 60. As mordidas comuns (19 q) cumprem.

## 6. Métricas de nível: o que cai e o que fica

- **Cai:** a sala de teste 48 × 32 (`map_sala_teste`) com tile de 32 px e câmera ortográfica; a velocidade de 3,5 / 6; a esquiva de 3 tiles; "área visível 20 × 11 tiles".
- **Fica (em tiles e segundos):** raio de interação 1,0; passagem 2 / corredor de combate 3; arenas 10×8 / 16×12 / 22×16 (revalidar com a cena-modelo); `fichas_ataque_max` 2; percepção 5–9; respiros e salvamento a cada 2–4 min; "impossível ficar preso"; pushbox ≈ 0,28–0,35 (protótipo: 0,28).
- **Muda:** com tile isométrico 64 × 32 em 1280 × 720 cabem **~900 tiles de chão** na tela (eram 225). Tempo máximo sem acontecimento 10–15 s equivale a **22–33 tiles andando** ou **35–52 correndo**. Travessia de 10 tiles: 4,5 s andando / 2,9 s correndo.
- A **sala de teste nova** será uma praça isométrica com os mesmos testes (campo, corredor de 3, arena, rampa, porta, 2 bonecos); eu a redesenho depois do ADR-002 e da cena-modelo do 10.

## 7. Perguntas ao usuário (decisões criativas)

1. **Crítico e variação de dano:** o protótipo tem crítico de 10 % (×2) **e** variação de ±8 % em todo golpe. O D-007 dizia "sem aleatório". **Recomendo manter como no protótipo, só no dano do herói** (inimigos sempre fixos; avisos nunca dependem de sorte; o teste usa semente). Alternativas: (B) só crítico, sem variação; (C) nada aleatório.
2. **Modelo do herói:** confirma o jogo **sem pontos de atributo e sem mana**, com crescimento automático por nível (+10 vida, +2 dano) e habilidades só por recarga? Recomendo sim (é o protótipo). Alternativa: manter atributos e voltar no M4.
3. **Habilidades e nível máximo:** o protótipo tem **2** (giro Q, investida E). A Bíblia fala em 2–3. Fica em 2 no slice, ou quer uma 3ª (ex.: disparo)? E o nível máximo do slice: sugiro **8** (com a curva do protótipo, 808 de XP no último).
4. **Duração do chefe:** os chefes do protótipo caem em ~30–60 s (250 e 340 de vida). Para a luta final do slice (Hollowpaw) propus **1,5–3 min** (vida 1000, 3 fases). Prefere a luta curta do protótipo (~1 min, vida ~400)?

## 8. Para repassar (via Produtor)
- **03:** chaves que mudam (pós-dano 30 q, travamento mínimo 15 q, esquiva 25 q com invencibilidade q 1–18, sem recarga, custo 20); `atk_hero_forte` e `habilidade_3` caem se as respostas 2/3 forem sim; avisos de 33 q e 48 q do protótipo precisam subir para 36 e 60.
- **04/10:** os 5 inimigos têm tamanhos e voos diferentes (morcego em altura 0,6–1,2; besouro pesado; slime baixo). Hollowpaw ocupa ≈ 3 × 3 tiles.
- **09:** metas e exemplos E1–E9 viram testes; semente fixa se a pergunta 1 mantiver o crítico.

## Histórico
| Data | Mudança | Motivo |
|---|---|---|
| 2026-10-24 | Criação | BRF-011 / D-024 |
