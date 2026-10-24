# Fórmulas, atributos, recursos, dano e estados

> **Dono:** 06 Sistemas e Níveis · **Status:** RASCUNHO v0.1 (BRF-004, onda 0) · 2026-10-24
> **Fonte única** de toda fórmula do jogo. O 03 implementa daqui; o 09 transforma os exemplos resolvidos em testes.
> Respeita: D-004 (sem vocações; kit fixo, habilidades por ID), D-005 (só Normal, multiplicadores expostos), D-007 (**sem dano aleatório nem crítico**, sem bloqueio/aparar, combo leve 3 + forte, 3 habilidades).
> Alinhado com `docs/gameplay.md` v0.1 (03): mesmas chaves e IDs. Métricas de espaço em `docs/niveis/metricas.md`.
> Nomes de mundo são provisórios e marcados **[aguarda 02]**. Formato final em `data/` = ADR-001 (08).

---

## 0. Convenções numéricas (valem para todas as fórmulas)

| Regra | Definição |
|---|---|
| Arredondamento | **Um só, no fim de cada fórmula**: `arred(x) = piso(x + 0,5)` (meio para cima). Intermediários em número real. A implementação tolera erro de ponto flutuante (ex.: `piso(x + 0,5 + 1e-9)`). |
| Tempo | Lógica em **quadros a 60 Hz**; documentos mostram também segundos. `quadros = arred(segundos × 60)` |
| Distância | tiles |
| Percentuais | Em dados como fração (0,25 = 25 %) |
| Aleatoriedade | **Nenhuma no dano** (D-007). Só a IA escolhe padrões ao acaso, com semente (03/08). |
| Piso e teto | Toda fórmula declara o seu (resumo §11). |
| Sem números mágicos | Todo valor aqui vira campo em `data/`: `regras_combate`, `hero_principal`, `atk_*`, `skill_*`, `estados`, `dificuldade`. |

---

## 1. Pilares e fantasia (Fase 1)

**Fantasia do jogador:** *"Sou um combatente ágil que lê o inimigo e pune no momento certo."* Ganha quem observa e escolhe a hora, não quem tem o número maior. Isso casa com o pilar da Bíblia "Combate preciso" e com os pilares do 03 (preciso, responsivo, justo).

| Horizonte | O que o jogador decide | Sistema que sustenta |
|---|---|---|
| **A cada ~10 s** | Atacar, esquivar ou recuar. Gastar fôlego agora (esquiva, golpe forte) ou guardar. Fechar o combo ou cancelar com esquiva. Usar habilidade agora ou esperar a recarga. Ir pelas costas do pesado. | Fôlego (§3.3), postura (§7), aviso dos golpes, recargas (§8) |
| **A cada ~10 min** | Quando beber poção. Seguir a rota principal ou entrar no desvio. Onde pôr os pontos de atributo ganhos no nível. | Atributos (§2), cura (§9), resistências (§5) |
| **Por sessão** | Qual estilo o herói vai ter (Força, Destreza ou Mente). Qual região ou missão fazer agora. Onde gastar moedas (fora deste documento). | Progressão (§10) |

**Regras de desenho derivadas:**
1. Cada atributo alimenta um recurso **e** escala um grupo de golpes do kit (§2). Nenhum é inútil.
2. Nenhum domina: todos escalam no mesmo ritmo (2 % por ponto). Recarga e resistência têm retorno decrescente ou teto.
3. A defesa é **esquiva + posicionamento** (sem bloqueio, D-007).

---

## 2. Atributos (Fase 2)

| ID | Nome | Recurso que alimenta | Golpes que escala (slice) |
|---|---|---|---|
| `vigor` | Vigor | vida máxima | — (sobrevivência pura) |
| `forca` | Força | — | `atk_hero_forte`, `skill_giro`, `skill_investida` |
| `destreza` | Destreza | fôlego máximo | `atk_hero_leve_1/2/3` |
| `mente` | Mente | mana máxima e regeneração | `skill_disparo`, curas de habilidade |

Cada **ataque** declara em dados `atributo` e `escala`. O atributo fica ligado ao **golpe**, não ao herói: isso prepara as vocações (D-004).

| Parâmetro | Valor inicial |
|---|---|
| Valor de cada atributo no nível 1 | 5 |
| Pontos por nível | 3, distribuídos livremente |
| Teto por atributo (slice) | 30 |
| Total no nível 10 | 20 + 27 = 47 |
| Escala padrão dos golpes do herói | 2,0 (= +2 % de dano por ponto) |

**Nota:** "vigor" é **atributo**. O recurso de esquiva, corrida e golpe forte se chama **fôlego** (resposta 2 ao 03).

---

## 3. Recursos

O herói tem **vida, mana e fôlego** (resposta 2 ao 03). Chaves para `gameplay.md` §4.4: `vida_max`, `mana_max`, `folego_max` (substituem `recurso_max`).

### 3.1 Vida
```
vida_max = 80 + 12 × vigor + bonus_vida_itens
```
| # | Entrada | Saída |
|---|---|---|
| V1 | vigor 5, sem itens | **140** |
| V2 | vigor 20, item +30 | **350** |

Ao subir de nível, vida e mana enchem.

### 3.2 Mana (habilidades)
```
mana_max          = 20 + 5 × mente
regen_mana_por_s  = 0,5 + 0,05 × mente          (sempre ativa, também em combate)
mana_por_acerto   = 3                            (só atk_hero_*; 1× por golpe por alvo; só concede mana o alvo com concede_mana = sim nos dados: inimigos reais sim, boneco de treino não; o debug pode forçar sim)
```
| # | Entrada | Saída |
|---|---|---|
| M1 | mente 5 | mana_max **45**; regen **0,75/s** |
| M2 | mente 15 | mana_max **95** |
| M3 | mente 20 | regen **1,5/s** |

Mana **por acerto** recompensa trocar golpes e evita o padrão "esperar a mana encher".

### 3.3 Fôlego (esquiva e golpe forte)
```
folego_max = 90 + 2 × destreza
custos: esquiva_custo = 25 · atk_hero_forte = 20 · correr = 0 no slice (campo custo_folego_correr_s existe)
recarga: 40 por segundo, começa 30 quadros após o último gasto
exausto (fôlego chegou a 0): atraso de 60 quadros em vez de 30
ação só sai se fôlego ≥ custo
quadros_para_encher = atraso + teto(gasto / (40/60))
```
| # | Entrada | Saída |
|---|---|---|
| F1 | destreza 5 | folego_max **100** |
| F2 | destreza 20 | folego_max **130** |
| F3 | gastou 25 (1 esquiva), não exausto | volta ao máximo em **68 quadros** (≈ 1,13 s) |
| F4 | gastou 100, exausto | **210 quadros** (3,5 s) |
| F5 | `atk_hero_forte` (custo 20) com fôlego 100 | fôlego **80**; volta ao máximo em 30 + 30 = **60 quadros** |
| F6 | fôlego 24, `esquivar` (custo 25) | a esquiva **não sai** (fica no buffer até expirar); com fôlego 25 sai e deixa **0** |
| F7 | 4 esquivas seguidas (100 → 0, exausto), fôlego volta a 25 | a 5ª esquiva só sai após 60 + 38 = **98 quadros** (≈ 1,6 s) |

Com 100 de fôlego cabem **4 esquivas seguidas**. Somadas à `esquiva_recarga_quadros` (24) do 03, isso limita esquivar sem parar e mantém a pressão legível. Correr não gasta fôlego no slice, para a exploração não ter atrito (difere do padrão do 06, decisão minha, reavaliar em playtest).

---

## 4. Dano (passo 4 do pipeline)

### 4.1 Fórmula única
```
dano_base   = poder_arma × mult_dano_ataque              (mult da tabela §4.3; inimigos: dano_base direto na ficha)
dano_final  = max(1, arred(
      dano_base
    × (1 + escala × atributo_do_golpe / 100)
    × mult_buffs            (produto de buffs/debuffs do atacante; limitado a [0,25 ; 3,0]; no slice = 1,0)
    × mult_situacional      (costas, postura quebrada, exposto; §4.4)
    × mult_dificuldade      (mult_dano_causado se o herói ataca; mult_dano_recebido se o herói apanha; §6)
    × (1 − resistencia_do_alvo_ao_tipo)    (limitada a [−0,50 ; +0,75])
))
exceção: alvo IMUNE ao tipo → 0, sem piso (mostra "imune"; uso só com justificativa)
```
Sem variação aleatória e sem crítico (D-007): o mesmo golpe na mesma situação dá sempre o mesmo número. O slot `mult_critico` fica **reservado** (= 1,0) para uma reavaliação no M4.

| Chave | Valor | Observação |
|---|---|---|
| `poder_arma` (arma inicial do herói) | 12 | itens e armas: briefing futuro |
| `escala` (golpes do herói) | 2,0 | §2 |

### 4.2 Exemplos resolvidos (viram testes)
| # | Entrada | Conta | Saída |
|---|---|---|---|
| D1 | `atk_hero_leve_1`, destreza 5, resist 0 | 12 × 1,0 × 1,10 = 13,2 | **13** |
| D2 | `atk_hero_leve_3`, destreza 5 | 12 × 1,5 × 1,10 = 19,8 | **20** |
| D3 | `atk_hero_forte`, força 5 | 12 × 2,5 × 1,10 = 33,0 | **33** |
| D4 | `atk_hero_forte`, força 15, resist 0,25 | 30 × 1,30 × 0,75 = 29,25 | **29** |
| D5 | `skill_disparo`, mente 12, resist −0,5 (fraqueza) | 12 × 1,2 × 1,24 × 1,5 = 26,784 | **27** |
| D6 | golpe de 1 de dano base, escala 0, resist 0,75 | 0,25 → arred 0 → piso | **1** |
| D7 | golpe inimigo base 18, tipo `impacto` (`enemy_boneco_golpe`), Normal | 18 | **18** |
| D8 | D7 com `mult_dano_recebido` 0,6 (só exemplo de M4, valor não decidido) | 10,8 | **11** |
| D9 | D1 pelas costas (1,25) em alvo Quebrado (1,5) | 13,2 × 1,875 = 24,75 | **25** |
| D10 | D1 com buffs somando ×4,0 → limitado a 3,0 | 13,2 × 3 = 39,6 | **40** |
| D11 | qualquer golpe em alvo imune ao tipo | — | **0** |

### 4.3 Multiplicadores e dados por ataque (resposta 8 ao 03)
Confirmo os `Mult. dano` do 03 §5.3 e completo com os campos do 06:

| ID | Mult. dano | Atributo | Escala | Tipo | Postura | Acúmulo de estado | Custo | Dano nv. 1 |
|---|---|---|---|---|---|---|---|---|
| `atk_hero_leve_1` | **1,0** | destreza | 2,0 | `corte` | 10 | — | — | 13 |
| `atk_hero_leve_2` | **1,0** | destreza | 2,0 | `corte` | 10 | — | — | 13 |
| `atk_hero_leve_3` | **1,5** | destreza | 2,0 | `corte` | 15 | — | — | 20 |
| `atk_hero_forte` | **2,5** | forca | 2,0 | `corte` | 30 | — | fôlego 20 | 33 |

Combo leve completo no nível 1: 13 + 13 + 20 = **46** em 57 quadros (≈ 0,95 s).

### 4.4 Multiplicadores situacionais (produto)
| ID | Condição | Valor |
|---|---|---|
| `costas` | atacante no setor traseiro de 120° do alvo | ×1,25 |
| `postura_quebrada` | alvo em QUEBRADO (§7) | ×1,5 |
| `exposto` | alvo com `est_exposto` (§5.3) | ×1,2 |
| `ponto_fraco` | golpe acerta a hurtbox de ponto fraco do alvo (só chefes; ex.: ombro do `boss_urso_musgo`) | ×1,25 |

Contra o herói, só `exposto` vale (ele não tem postura, e o inimigo não "procura" as costas no slice).

### 4.5 Pipeline de dano — mesma ordem do `gameplay.md` §5.7 (= 03 §7.4)
| Passo | O que o 06 define |
|---|---|
| 1. Hitbox ativa encosta na hurtbox (plano + altura) | formas, alcances e alturas: `gameplay.md` §5.3 e `metricas.md` §2 |
| 2. Alvo já atingido por esta ativação? sai | — |
| 3. Alvo invencível (esquiva, pós-dano, transição)? sai | janela da esquiva com `mult_janela_esquiva` (§6.2) |
| 4. Calcula dano | 4a `dano_final` (§4.1) → 4b `dano_postura` (§7) → 4c ganho de acúmulo de estado (§5.2). Tudo determinístico. |
| 5. Aplica dano e estados | subtrai vida; soma acúmulo e dispara o estado se ≥ 100; `mana_por_acerto` ao herói |
| 6. Recuo e atordoamento | aplica `resist_recuo` (§7.2); postura ≤ 0 → QUEBRADO (§7.1) |
| 7. Feedback e eventos | — (03/05/10) |
| 8. Morte, se vida ≤ 0 | — |

---

## 5. Tipos de dano, resistências e estados (Fase 3)

### 5.1 Tipos de dano (genéricos)
| ID | Grupo | Nome provisório | Observação |
|---|---|---|---|
| `corte` | físico | Corte | espada do herói |
| `perfuracao` | físico | Perfuração | lança, flecha |
| `impacto` | físico | Impacto | ×1,5 no dano de postura (§7) |
| `elem_1` | elemental | Fogo **[aguarda 02]** | acúmulo de `est_queimando` |
| `elem_2` | elemental | Gelo **[aguarda 02]** | acúmulo de frio (`est_lento` → `est_congelado`) |
| `elem_3` | elemental | Raio **[aguarda 02]** | acúmulo de `est_atordoado` |
| `elem_4` | elemental | Veneno/natureza **[aguarda 02]** | acúmulo de `est_envenenado` |
| `elem_5`, `elem_6` | elemental | Luz / Sombra **[aguarda 02]** | reservados; só existem se o mundo tiver essas forças |

**Resistências:** de −0,50 (fraqueza) a +0,75. A imunidade é uma marca à parte e precisa de justificativa. Os inimigos se agrupam em **famílias** (bestiário futuro) e a UI mostra 4 graus com ícone: fraco / normal / resistente / imune.

### 5.2 Acúmulo de estado (determinístico)
Não há chance aleatória de aplicar estado (coerente com D-007): cada golpe soma **acúmulo** e o estado dispara ao chegar a 100. A UI pode mostrar uma barrinha.
```
ganho = arred(acumulo_do_golpe × (1 − resistencia_ao_estado))       resistência ao estado: [−0,50 ; +1,00]
dispara quando acumulo ≥ 100 → estado aplicado, acúmulo volta a 0
decaimento: −20 por segundo, começando 120 quadros após o último ganho
golpes_para_disparar = teto(100 / ganho)
```
| # | Entrada | Saída |
|---|---|---|
| A1 | 35 por golpe, resist 0 | ganho 35 → dispara no **3º** golpe |
| A2 | 35 por golpe, resist 0,4 | ganho 21 → dispara no **5º** golpe |
| A3 | 35 por golpe, resist −0,5 | ganho 53 → dispara no **2º** golpe |

### 5.3 Estados
Dano contínuo: **1 tique a cada 30 quadros (0,5 s)**.
```
dano_por_tique = max(1, arred(dps_do_estado × 0,5 × mult_dificuldade × (1 − resistencia_ao_tipo)))
```

| ID | Estado | Efeito | Duração | Reaplicar | Contra-jogo | Leitura visual (guia §9 do 10) |
|---|---|---|---|---|---|---|
| `est_queimando` | Queimando | dano contínuo, dps vem do golpe (padrão 6) | 240 q (4 s) | renova a duração, não acumula | esquiva apaga; água apaga | ícone no corpo. Chão em chamas = **zona de dano contínuo** (magenta tracejado, pulso ≤ 1 Hz) |
| `est_lento` | Lento (1º estágio do frio) | −40 % de velocidade de movimento, −25 % de velocidade de ataque | 180 q | — | sair da área; fogo remove | ícone |
| `est_congelado` | Congelado (preso) | sem ação nem movimento | 120 q (2 s) | não; dá imunidade a controle | qualquer golpe **quebra** (esse golpe leva ×1,25); herói preso: cada tecla de ação tira 6 q | ícone + casca |
| `est_envenenado` | Envenenado | 2 dps por pilha; cura recebida −30 % | 480 q (8 s) | acumula até **3** pilhas; nova pilha renova todas | antídoto; esperar | ícone com número de pilhas |
| `est_atordoado` | Atordoado | sem ação | 60 q (1 s) | não; dá imunidade a controle | evitar o golpe (aviso) | ícone sobre a cabeça |
| `est_exposto` | Exposto | recebe ×1,2 de dano | 300 q (5 s) | renova | afastar-se / esquivar até acabar | ícone |

Magenta fica **só** para áreas e avisos de perigo no chão (D-007). Os ícones de estado no corpo **não** usam magenta.

**Frio em 2 estágios:** quando o acúmulo de `elem_2` chega a 100 pela primeira vez, aplica Lento. Se chegar a 100 de novo **com Lento ativo**, aplica Congelado.

**Imunidade após controle total:** ao terminar `est_atordoado` ou `est_congelado`, o alvo fica **180 q (3 s)** imune a ambos (os acúmulos não sobem). Ninguém fica preso em controle para sempre.

| # | Entrada | Saída |
|---|---|---|
| T1 | Queimando dps 6, resist 0, Normal | **3** por tique → 8 tiques → 24 em 4 s |
| T2 | Queimando dps 6, resist ao tipo 0,25 | 2,25 → **2** |
| T3 | Envenenado 3 pilhas (dps 6) | **3** por tique → 16 tiques → 48 em 8 s |
| T4 | Queimando dps 6, `mult_dano_recebido` 0,6 (exemplo M4) | 1,8 → **2** |
| T5 | dps 1 | 0,5 → **1** (piso) |

---

## 6. Dificuldade (D-005): multiplicadores expostos (resposta 1 ao 03)

No slice existe só **Normal** (todos = 1,0). Os campos existem em `data/dificuldade` para História/Desafio e assistências no M4. Os valores do M4 **não estão decididos**.

| Campo | Normal | Onde entra |
|---|---|---|
| `mult_dano_causado` | 1,0 | §4.1, golpe do herói (passo 4) |
| `mult_dano_recebido` | 1,0 | §4.1 e §5.3, todo dano no herói: golpes, estados e armadilhas (passo 4) |
| `mult_janela_esquiva` | 1,0 | §6.2, sobre `esquiva_invencivel_fim` (passo 3) |
| `mult_aviso_inimigo` | 1,0 | §6.3, duração do aviso (estado AVISO do inimigo) |
| `fichas_ataque_max` | 2 | IA (`gameplay.md` §6.3) |

**Regra:** a dificuldade só escala números. **Nunca** muda regra nem tira aviso.

### 6.2 Janela de invencibilidade da esquiva
O multiplicador age **sobre `esquiva_invencivel_fim`**, como o 03 propôs. O início não muda.
```
esquiva_invencivel_fim = esquiva_invencivel_inicio + arred(9 × mult_janela_esquiva) − 1
piso: 4 quadros de janela · teto: esquiva_duracao_quadros (18)
```
| # | Entrada | Saída |
|---|---|---|
| J1 | 1,0 (Normal) | fim **10** (2–10, 9 quadros, igual ao 03 §4.2) |
| J2 | 1,3 | fim **13** (12 quadros) |
| J3 | 0,8 | fim **8** (7 quadros) |
| J4 | 2,5 (exagero) | 2 + 23 − 1 = 24 → **18** (teto) |

### 6.3 Aviso (telegraph) dos inimigos
```
aviso_final = max(aviso_min_da_categoria, arred(aviso_base × mult_aviso_inimigo))
aviso_min_*: comum 18 · forte 36 · chefe 60 (gameplay.md §6.3), piso em qualquer dificuldade
```
| # | Entrada | Saída |
|---|---|---|
| W1 | comum, base 24, Normal | **24** |
| W2 | comum, base 24, ×1,25 | **30** |
| W3 | forte, base 40, ×0,8 (32) | **36** (piso da categoria) |
| W4 | comum, base 30, ×0,8 | **24** |

---

## 7. Postura e resistência a recuo (passo 6; resposta 3 ao 03)

### 7.1 Postura (só inimigos)
```
dano_postura = arred(postura_do_golpe × mult_tipo × mult_costas)
   mult_tipo: impacto 1,5 · outros 1,0        mult_costas: 1,5 nas costas · 1,0 de frente
postura ≤ 0 → estado QUEBRADO: sem ação por 90 q (1,5 s) e recebe ×1,5 de dano; ao sair, postura volta cheia
regeneração: após 120 q sem dano de postura, recupera 25 % da postura máxima por segundo
```
| # | Entrada | Saída |
|---|---|---|
| P1 | `atk_hero_leve_1` (postura 10) de frente | **10** (inimigo com postura 60 quebra no 6º golpe) |
| P2 | `atk_hero_forte` (postura 30) de frente | **30** (postura 60 quebra no 2º golpe) |
| P3 | `atk_hero_forte` pelas costas | **45** |
| P4 | `skill_investida` (postura 25, `impacto`) de frente | 37,5 → **38** |

QUEBRADO **não** é `est_atordoado`: não conta para a imunidade de controle. A máquina de estados do inimigo precisa de um estado **QUEBRADO**, separado de DANO.

### 7.2 Resistência a recuo (`resist_recuo`, de 0 a 1, na ficha do inimigo)
```
recuo_final         = recuo_do_golpe × (1 − resist_recuo)
atordoamento_final  = arred(atordoamento_do_golpe × (1 − resist_recuo))
atordoamento_final = 0 → o alvo NÃO entra em DANO (só feedback: flash, pausa de impacto, som)
em QUEBRADO, resist_recuo vale 0
herói: resist_recuo = 0 sempre; DANO dura max(dano_travamento_min_quadros, atordoamento_final) (gameplay.md §4.4)
```
| # | Entrada (`atk_hero_leve_3`: recuo 0,6, atordoamento 24) | Saída |
|---|---|---|
| K1 | resist_recuo 0 (ex.: rápido) | recuo **0,6**, atordoamento **24** |
| K2 | resist_recuo 0,5 (ex.: combatente) | recuo **0,3**, atordoamento **12** |
| K3 | resist_recuo 1,0 (ex.: pesado) | recuo **0**, atordoamento **0** → não entra em DANO; só a postura o derruba |

Com isso o pesado tem contra-jogo: o combo leve não o trava, então é preciso quebrar a postura (golpe forte, impacto, costas).

---

## 8. Recargas e custos das habilidades (resposta 8 ao 03)

```
recarga_quadros = arred(recarga_base_s × 60 × 100 / (100 + reducao_recarga))      reducao_recarga ≥ 0 (pontos)
```
| # | Entrada | Saída |
|---|---|---|
| R1 | 8 s, redução 0 | **480** quadros |
| R2 | 8 s, redução 25 | **384** quadros |
| R3 | 8 s, redução 100 | **240** (metade; nunca chega a 0) |

Habilidades do slice (mecânicas do 03 §5.4; **números provisórios**, os verbos finais saem na Fase 4):

| ID | Verbo | Mult. dano | Atributo | Tipo | Postura | Acúmulo | Custo | Recarga | Dano nv. 1 |
|---|---|---|---|---|---|---|---|---|---|
| `skill_giro` | limpar o cerco (área em volta) | 1,8 | forca | `corte` | 20 | — | mana 15 | 6 s (360 q) | 24 |
| `skill_disparo` | atingir de longe | 1,2 | mente | `elem_1` **[aguarda 02]** | 5 | 35 (queimando) | mana 8 | 1,5 s (90 q) | 16 |
| `skill_investida` (opcional) | fechar distância e quebrar postura | 2,0 | forca | `impacto` | 25 (→ 38) | — | mana 12 | 8 s (480 q) | 26 |

Com mana 45 no nível 1 dá para: 3 giros, **ou** 5 disparos, **ou** 1 giro + 1 investida + 2 disparos. A regeneração (0,75/s) mais a mana por acerto (+3) devolvem ~1 giro a cada ~10 s de luta. Isso é escolha, não spam.

---

## 9. Cura
```
cura = arred(cura_base × (1 + escala × mente / 100) × mult_cura_recebida × (0,7 se envenenado; senão 1,0))
vida_curada = min(cura, vida_max − vida_atual)
itens: escala 0 (valor fixo) · habilidades de cura: escala da ficha
```
| # | Entrada | Saída |
|---|---|---|
| H1 | poção 50 | **50** |
| H2 | poção 50, envenenado | **35** |
| H3 | habilidade 30, escala 1,0, mente 12 | 33,6 → **34** |
| H4 | poção 50, vida 120/140 | cura 50, **vida_curada 20** |

---

## 10. Progressão do herói (kit fixo, sem vocações — D-004)

### 10.1 Experiência
```
xp_para_nivel(n) = arred(100 × n^1,6)       xp para ir do nível n ao n+1; nível máximo do slice = 10
```
| n | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | total 1→10 |
|---|---|---|---|---|---|---|---|---|---|---|
| xp | **100** | **303** | **580** | **919** | **1313** | **1758** | **2250** | **2786** | **3363** | **13372** |

Ao subir de nível: +3 pontos de atributo, vida e mana enchem. As fontes de XP entram com bestiário e economia, em briefing futuro.

**Peso do atributo:** com 15 pontos num atributo (nível ~6), o golpe ligado a ele faz ~+27 % de dano (ex.: leve 13 → 17). É perceptível sem tornar o equipamento inútil.

### 10.2 Kit e habilidades por ID
- `hero_principal.kit` = `atk_hero_leve_1..3`, `atk_hero_forte`, esquiva, `habilidades: [skill_giro, skill_disparo, skill_investida]` (3 slots, `habilidade_4` reservada) e `item_rapido`.
- Cada habilidade é um registro **independente** em `data/skills` que referencia ataques por ID. Ela **não** referencia o herói.
- Campo reservado `origem` (vazio no slice) para a vocação de onde a habilidade vem (P2). Trocar o kit é trocar a lista de IDs.

---

## 11. Pisos e tetos (resumo)
| Grandeza | Piso | Teto |
|---|---|---|
| Dano por golpe | 1 (0 só se imune) | — |
| `mult_buffs` | 0,25 | 3,0 |
| Resistência a tipo | −0,50 | +0,75 |
| Resistência a estado | −0,50 | +1,00 |
| `resist_recuo` | 0 | 1 |
| Atributo | 5 | 30 |
| Janela de invencibilidade da esquiva | 4 q | 18 q |
| Aviso de inimigo | mínimo da categoria (18/36/60) | — |
| Dano por tique | 1 | — |
| Recarga | > 0 (retorno decrescente) | base |
| Controle total seguido | — | depois de cada um, 180 q de imunidade |

## 12. Checagem contra as metas (06 §10), com valores de referência
Valores **só para calibrar**, não são inimigos definidos:
- **Erros graves até morrer:** herói nv. 1, vida 140. Golpe comum base 18 → 7,8 → **8 golpes** (meta 5–9 ✓). Golpe forte base 30 → **5** (no limite ✓). Com `invencivel_pos_dano_quadros` = 60, dois inimigos não "somam" golpes no mesmo instante.
- **Tempo para matar o comum (3–8 s):** combo 46 em ~0,95 s. Um comum com ~90 de vida cai em ~1,9 s de ataque puro. Com ~35 % do tempo atacando, dá **~5 s** ✓. Confirmar no bestiário e na simulação.

---

## 13. Respostas ao 03 (`gameplay.md` §12.1)

| # | Pergunta do 03 | Resposta do 06 |
|---|---|---|
| 1 | Fórmula do passo 4 e onde entram os multiplicadores de dificuldade; o de janela de esquiva pode agir sobre `esquiva_invencivel_fim`? | Fórmula em §4.1, exemplos D1–D11. `mult_dano_causado` e `mult_dano_recebido` entram como fatores no passo 4 (também em estados e armadilhas). **Sim:** `mult_janela_esquiva` age só sobre `esquiva_invencivel_fim` (§6.2, J1–J4), no passo 3. `mult_aviso_inimigo` age na duração do AVISO (§6.3). |
| 2 | A esquiva custa recurso? Recurso único ou mana + vigor? | **Custa:** `esquiva_custo` = **25 de fôlego**. Três recursos: **vida, mana, fôlego**. "Vigor" é atributo, não recurso. Golpe forte custa 20 de fôlego; habilidades custam mana. Trocar `recurso_max` por `mana_max` + `folego_max` (§3). |
| 3 | Inimigos têm poise? Como entra no passo 6? | **Sim, duas peças:** `postura` (barra que quebra → estado QUEBRADO, §7.1) e `resist_recuo` (0–1, reduz recuo e atordoamento; com atordoamento 0 o alvo não entra em DANO, §7.2). Os dois entram no passo 6. Pede um estado **QUEBRADO** na máquina do inimigo. |
| 4 | `dano_travamento_min_quadros` (antes `dano_atordoamento_min_quadros`, renomeado no gameplay v0.2) e `invencivel_pos_dano_quadros`: com o 03 ou com o 06? | **Ficam com o 03** (são sensação e estado do herói), com valores 20 e 60. Como mexem na meta de "erros até morrer", **qualquer mudança passa pelo 06** antes (registro antes → depois → motivo). |
| 5 | Dano aleatório ou crítico? | Não (D-007). §4.1 é determinístico; slot `mult_critico` reservado (= 1,0) para o M4. Estados também sem sorte (acúmulo, §5.2). |
| 6 | Bloqueio/aparar? | Não (D-007). Defesa = esquiva + posição. |
| 7 | Tamanhos do herói e sala de teste | **Confirmados** `pushbox_raio_tiles` 0,35, `hurtbox_raio_tiles` 0,30, `hurtbox_altura_tiles` 0,0–1,4 (`metricas.md` §2). Sala `map_sala_teste` 48×32 com paredes, parede solta, rampa, plataforma, escada, corredor de 3, arena 16×12 e os dois bonecos `enemy_boneco_alvo` (11, 4) e `enemy_boneco_golpe` (16, 4) (`metricas.md` §8). |
| 8 | Multiplicadores dos ataques (§5.3) e custos/recargas (§5.4) | Mult. do 03 **confirmados** (1,0 / 1,0 / 1,5 / 2,5), com atributo, tipo, postura e custo em §4.3. Habilidades com custo, recarga e mult. em §8. |

**Pedidos de ajuste ao `gameplay.md` (via Produtor):**
1. §4.2: `esquiva_custo` = 25 (fôlego). §4.4: `recurso_max` → `mana_max`, `folego_max`.
2. §5.3: coluna "Custo" do `atk_hero_forte` = fôlego 20. Somar as colunas `atributo`, `escala`, `tipo_dano` e `postura` (tabela §4.3 daqui).
3. §6.1: incluir o estado QUEBRADO no inimigo (entra quando postura ≤ 0; dura 90 q; sai para PARADO com postura cheia).
4. Nome da coluna "Atordoamento" dos ataques: sugiro `travamento_quadros`, para não confundir com o estado `est_atordoado`. Se o 03 preferir manter, aqui chamo de "atordoamento do golpe".
5. Golpes corpo a corpo não atravessam parede nem meia-parede (`metricas.md` §5). O 03 confirma como testar (linha do atacante ao alvo no plano?).

## 14. Perguntas ao 02 (via Produtor)
1. Quais forças elementais existem no mundo (§5.1: `elem_1`…`elem_6`)? Há "luz/sombra"? O slice precisa de 3 a 5 tipos no total.
2. Os nomes **Vigor, Força, Destreza, Mente, Fôlego, Mana** combinam com o tom, ou "mana" deve ter outro nome?
3. Os estados (queimar, congelar, envenenar, atordoar, expor) combinam com a magia e as criaturas do mundo?

## Histórico de mudanças
| Data | Mudança | Antes → depois | Motivo |
|---|---|---|---|
| 2026-10-24 | Criação (BRF-004) | — | Onda 0 |
| 2026-10-24 | Crítico removido; alinhamento com `gameplay.md` v0.1 | crítico 5–40 % (rascunho interno) → sem crítico, slot reservado | D-007 |
