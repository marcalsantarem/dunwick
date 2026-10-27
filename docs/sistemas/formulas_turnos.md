# Fórmulas do combate por turnos (M1)

> **Dono:** 06 Design de Combate e Classes · **Status:** RASCUNHO v0.1 (BL-004, D-028/D-031) · 2026-10-27
> **Fonte única das fórmulas de batalha.** Substitui `formulas.md` no combate (o que cai e o que fica: §1). Os exemplos resolvidos da §9 viram testes; foram calculados por script.
> **Alinhado com `docs/combate_turnos.md` (03) em 2026-10-27:** nomes de parâmetro, eventos e IDs do 03 valem; o que o 03 precisa mudar está na §11.
> Rodada estilo Breath of Fire: todo o grupo escolhe o comando, depois todos agem em ordem de agilidade. Sem tempo real, sem quadros.

---

## 1. O que sai e o que fica

| Sai (era tempo real) | Fica (com adaptação) |
|---|---|
| Fôlego e correr gastando fôlego; esquiva e invencibilidade; golpe forte | **4 atributos** (vigor, força, destreza, mente), com novos papéis (§2) |
| Quadros: aviso, ativo, recuperação, pós-dano | **Mana** (PM); sem regeneração por segundo (§3) |
| Postura, QUEBRADO, `resist_recuo`, bônus de costas | **Tipos de dano e resistências** [−0,50 ; +0,75]; imunidade só com justificativa |
| Mana por acerto; recargas em segundos | **Estados** (duração em rodadas, §8); acúmulo determinístico |
| Telegraph por quadros (o aviso vira "anúncio" do chefe, BL-021) | **Curva de XP** `100 × n^1,6`; **multiplicadores de dificuldade** (`mult_dano_causado`, `mult_dano_recebido`) |
| Velocidades em tiles/s e métricas de combate em tile | **Sem aleatoriedade no dano** (legível e testável). Aleatório só em fuga e IA, com semente |

## 2. Atributos e recursos

| ID | Papel na batalha |
|---|---|
| `vigor` | vida máxima e defesa |
| `forca` | dano de golpes físicos |
| `destreza` | **agilidade** (ordem de turno) |
| `mente` | mana máxima e efeito de magias e curas |

```
vida_max  = 30 + 10 × vigor + bonus_itens                    (nos dados: vida, vida_max; na tela: PV)
mana_max  = 5 + 3 × mente + bonus_itens                      (nos dados: mana, mana_max; na tela: PM)
defesa    = vigor + armadura_equipada
agilidade = destreza + bonus_itens                          (o 03 usa agilidade_efetiva)
regen_mana_rodada = 1 + piso(mente / 4)                     (no FIM_DE_RODADA, só atores vivos, até mana_max)
```
Pisos: todo atributo ≥ 1; `vida_max` ≥ 1. Teto de atributo no slice: 30. A vida **não** enche sozinha; a mana regenera por rodada **só em batalha** (Edric +1, Grace +3). Vida e mana enchem ao subir de nível e no ponto de salvamento.

### Ficha de nível 1

| | Edric (guerreiro **[classe em aberto]**) | Grace (curandeira) |
|---|---|---|
| Vigor · Força · Destreza · Mente | 7 · 8 · 6 · 3 | 4 · 3 · 5 · 8 |
| Vida máx · Mana máx | **100 · 14** | **70 · 29** |
| Mana por rodada | **+1** | **+3** |
| Defesa (armadura) | **9** (vigor 7 + túnica 2) | **5** (vigor 4 + manto 1) |
| Agilidade | **6** | **5** |
| Arma (poder) · tipo | espada **14** · `corte` | cajado **8** · `impacto` |
| Habilidade do M1 | `skill_golpe_firme` | `skill_cura` |

**Crescimento por nível (provisório, automático pela classe; sem pontos para distribuir no slice):** Edric vigor +2, força +2, destreza +1, mente +1; Grace vigor +1, força +1 a cada 2 níveis, destreza +1, mente +2. A evolução do Edric (fixa, escolha ou por uso, BL-001) fica **aberta**.

## 3. Dano

```
dano_final = max(1, arred(
      poder_do_golpe × mult_golpe
    × (1 + 0,05 × atributo_do_golpe)
    × 100 / (100 + defesa_do_alvo)
    × mult_defender               (0,5 se o alvo está defendendo; `defender_mult_dano` do 03)
    × mult_situacional            (exposto ×1,2; outros em §8)
    × mult_dificuldade            (dano_causado do grupo; dano_recebido do grupo)
    × (1 − resistência_ao_tipo)   (limitada a [−0,50 ; +0,75])
))
imune ao tipo → 0 (sem piso)
```
Arredondamento único, no fim (`piso(x + 0,5)`). Mesmo pipeline do 03 (§5), com **`escala` = 5** nos dados (a parcela `1 + escala × atributo / 100`) e **um termo a mais: a defesa**. A defesa tem retorno decrescente (`100 / (100 + defesa)`: nunca zera o dano). `poder_do_golpe × mult_golpe` = `poder_arma` do ator × `mult_dano` do `atk_*`/`skill_*` (heróis) ou o `dano_base` do `atk_*` (inimigos, `mult` = 1); `atributo_do_golpe` é `forca` nos golpes físicos e `mente` nas magias. Inimigos usam o `poder` do ataque na ficha e a `forca` deles.

### Cura
```
cura = max(1, arred( cura_base × (1 + escala × mente / 100) × mult_cura ))     escala = 5; envenenado: ×0,7 (fora do M1)
vida_curada = min(cura, vida_max − vida)          caído (PV 0) não recebe cura no M1
```

### Defender
Comando de rodada (como no 03): `prioridade_comando` +1 (age antes dos demais) e fica `defendendo` até o `FIM_DE_RODADA`: dano recebido × `defender_mult_dano` = **0,5**. Sem custo e sem ganho de mana. É a escolha de quem está em risco, e a Grace é a que mais precisa (70 PV).

## 4. Ordem de turno (igual ao 03 §3)

```
ordem = ordenar por prioridade_comando (Defender +1, demais 0) → iniciativa = agilidade_efetiva × (1 + bonus_comando) → desempate
desempate: grupo antes de inimigo; depois menor posição (Edric 1, Grace 2; slot do inimigo)
```
A ordem é calculada uma vez, ao travar os comandos. `iniciativa_variacao` = 0 no M1 (sem sorteio). Quem cai antes de agir perde o ato (`ato_cancelado`). Os valores de agilidade desta ficha (Edric 6, Grace 5, lobo 9, slime 3) são os que valem nos dados; os 10/8/12/4 do 03 eram provisórios.

## 5. Fugir

```
chance_fuga = limitar( fugir_base + (ag_média_grupo − ag_média_inimigos) × fugir_por_ponto + fugir_bonus_falha × tentativas_falhas ; fugir_min ; fugir_max )
valores: fugir_base 0,50 · fugir_por_ponto 0,05 · fugir_bonus_falha 0,10 · fugir_min 0,10 · fugir_max 0,90
sucesso: a batalha termina como `fugiu`, sem XP, ouro nem drops; falha: o ato é gasto (e a próxima tentativa fica 10 % mais fácil)
chefe: não se foge (chance 0)
```
Único sorteio do jogador no combate; usa a `semente_batalha` do 03. **O 03 usava `fugir_por_ponto` 0,02 e sem bônus por falha**: com as agilidades desta ficha (diferenças de 3 a 6 pontos), 0,05 dá resultados que se sentem.

## 6. Fim de batalha
- **Vitória:** todos os inimigos com PV 0. Cada membro **vivo ao fim** recebe o XP total (`xp_caido_fracao` = 0: caído não recebe); caídos voltam com `caido_pos_batalha_vida` = **1**. (Bate com o 03 §4 e §6.3.) Moedas e itens vão ao grupo.
- **Derrota:** todo o grupo com PV 0 → volta ao último ponto de salvamento, perdendo parte das moedas (06 §3, regra de morte).
- XP do M1: `enemy_slime` **12**, `enemy_lobo` **20** (provisório, calibra com a economia).

## 7. Habilidades do M1

| ID | Quem | Custo | Alvo | Efeito | Verbo · risco |
|---|---|---|---|---|---|
| `skill_golpe_firme` | Edric | **4 PM** | `inimigo_1` | dano = arma × **1,8**, tipo `corte` | golpear com peso · gasta o pouco mana que ele tem (14 = 3 usos) |
| `skill_cura` (nome na tela "Mão Boa", provisório [aguarda 02]) | Grace | **5 PM** | `aliado_1` (vivo) | cura base **14**, escala `mente` | curar · a rodada dela não ataca |

Ataques básicos: `atk_edric_golpe` (poder_arma 14, `corte`, `mult_dano` 1,0, atributo `forca`) e `atk_grace_cajado` (poder_arma 8, `impacto`, `mult_dano` 1,0, atributo `forca`). Todos com `escala` 5.
Evolução em 3 níveis e uso (BL-001) ficam para o briefing de classes: aqui só o que o M1 precisa.
**Item:** `item_pocao_ervas` cura **40** PV fixos, consome o turno de quem usa (valores de itens antes 50/30/25 → agora 40/25/20 na escala de PV de 100: ver histórico).

## 8. Estados em rodadas (fora do M1; conversão para uso futuro)

Acúmulo determinístico mantido: cada golpe soma `acumulo_do_golpe × (1 − resistência_ao_estado)`; ao chegar a 100 o estado dispara e o acúmulo zera; o acúmulo cai 20 por rodada sem ganho. Efeitos de controle seguidos têm 2 rodadas de imunidade depois.

| Estado | Efeito | Duração | Contra-jogo |
|---|---|---|---|
| `est_queimando` | no fim da rodada, 6 % do `vida_max` (mín. 1) | 3 rodadas | água, Defender não ajuda |
| `est_envenenado` | no fim da rodada, 4 % do `vida_max` por pilha (até 3); cura recebida ×0,7 | 4 rodadas | antídoto |
| `est_lento` | agilidade −40 % | 3 rodadas | tempo, fogo remove |
| `est_atordoado` | perde a próxima ação | 1 rodada | agir antes (agilidade) |
| `est_exposto` | dano recebido ×1,2 | 3 rodadas | tempo |

## 9. Inimigos do M1 (escolhidos pelo usuário: Slime e Lobo)

Valores **de referência**; a simulação (§10) ajusta uma alavanca por vez. **IA e pesos do 03 §7** (simulados): slime = `atk_slime_golpe` 70 / `skill_slime_balanco` 30 (passa a vez); lobo = `atk_lobo_mordida` 70 (alvo `misto`, 50 % no de menor vida) / `skill_lobo_investida` 30 (dano ×1,5, só da rodada 2, alvo aleatório).

| ID | Papel (D-023) | PV | Força | Defesa | Agilidade | Ataque (poder · tipo) | Resistências | XP · moedas |
|---|---|---|---|---|---|---|---|---|
| `enemy_slime` | Emboscador | **70** | 4 | **3** | **3** | `atk_slime_golpe` **12** `impacto` | nenhuma | 12 · 4 |
| `enemy_lobo` | Combatente | **90** | 6 | **4** | **9** | `atk_lobo_mordida` **15** `corte`; investida **22,5** | nenhuma | 20 · 7 |

Drops (M1): slime nenhum; lobo `item_pocao_ervas` chance 0,15, qtd 1.

Identidade em 1 segundo: o **lobo** age primeiro (agilidade 9) e morde forte; o **slime** é lento e aguenta pancada. Contra-jogo: Defender na rodada em que o lobo mira o frágil; cura da Grace; Golpe Firme no lobo antes que ele dobre o dano na Grace.

### Exemplos resolvidos (viram testes)

| # | Entrada | Conta | Saída |
|---|---|---|---|
| T1 | Edric `Atacar` no slime (arma 14, força 8, defesa 3) | 14 × 1,40 × 100/103 = 19,03 | **19** |
| T2 | Edric `Atacar` no lobo (defesa 4) | 14 × 1,40 × 100/104 = 18,85 | **19** |
| T3 | Edric `skill_golpe_firme` no slime | 14 × 1,8 × 1,40 × 100/103 = 34,25 | **34** |
| T4 | Golpe Firme no slime com fraqueza −0,5 (hipotético) | 34,25 × 1,5 → 51,38 | **51** |
| T5 | Edric `Atacar` com resistência +0,25 (hipotético) | 19,03 × 0,75 = 14,27 | **14** |
| T6 | Grace `Atacar` no slime (cajado 8, força 3) | 8 × 1,15 × 100/103 = 8,93 | **9** |
| T7 | Slime ataca Edric (poder 12, força 4, defesa 9) | 12 × 1,20 × 100/109 = 13,21 | **13** |
| T8 | Slime ataca Edric `defendendo` | 13,21 × 0,5 = 6,61 | **7** |
| T9 | Slime ataca Grace (defesa 5) · `defendendo` | 13,71 · 6,86 | **14** · **7** |
| T10 | Lobo ataca Edric (poder 15, força 6, defesa 9) · `defendendo` | 17,89 · 8,95 | **18** · **9** |
| T11 | Lobo ataca Grace (defesa 5) | 15 × 1,30 × 100/105 = 18,57 | **19** |
| T12 | piso: poder 1 contra defesa 200 | 0,33 → 0 → piso | **1** |
| T13 | `skill_cura` (base 14, mente 8) | 14 × 1,40 = 19,6 | **20** |
| T14 | `skill_cura` em envenenado (fora do M1) | 19,6 × 0,7 = 13,72 | **14** |
| T15 | cura em alvo com 90/100 PV | cura 20 | **vida_curada 10** |
| T16 | PV/PM nível 1 (Edric · Grace) | 30+10×7 · 5+3×3 · 30+10×4 · 5+3×8 | **100 · 14 · 70 · 29** |
| T17 | Ordem sem Defender (agilidade Edric 6, Grace 5, lobo 9, slime 3) | decrescente | **lobo, Edric, Grace, slime** |
| T18 | Empate: Edric 9 e lobo 9; dois slimes (posição 0 e 1) | aliado antes; menor posição | **Edric, lobo; slime0, slime1** |
| T19 | Fuga: grupo média 5,5 contra lobo 9 | 0,50 + 0,05 × (−3,5) | **0,325** |
| T20 | Fuga contra slime (3), e contra lobo após 2 falhas | 0,50 + 0,05 × 2,5 · 0,325 + 0,20 | **0,625 · 0,525** |
| T21 | Mana por rodada: Edric 13/14 · Grace 27/29 | +1 · +3 limitados ao máximo | **14 · 29** |
| T23 | Lobo `skill_lobo_investida` (dano_base 22,5) em Edric · `defendendo` · em Grace | 26,83 · 13,42 · 27,86 | **27** · **13** · **28** |
| T24 | Ordem com Defender: Grace `defender`, Edric e lobo `atacar` | prioridade +1 primeiro | **Grace, lobo, Edric** |
| T22 | XP para o nível 2 · 3 | `arred(100 × n^1,6)` | **100 · 303** |

## 10. Metas de balanceamento e simulação

Simulação por script com a **IA do 03** (slime passa a vez em 30 %; lobo investe ×1,5 em 30 % a partir da rodada 2), mana por rodada e política simples do grupo (Edric usa Golpe Firme no inimigo de mais vida quando há mana e ataca o mais ferido; Grace cura quem estiver abaixo de 50 % e senão ataca; 5.000 batalhas, semente fixa):

| Encontro | Vitória | Rodadas (média) | Vida do grupo no fim |
|---|---|---|---|
| `enc_slime_1` | 100 % | **2,0** | 94 % |
| `enc_lobo_1` | 100 % | **3,0** | 64 % |
| 2 slimes | 100 % | **4,5** | 70 % |
| `enc_misto_1` (lobo + slime) | 98,5 % | **5,4** | 42 % |
| 2 lobos | 3 % | 7,2 | 9 % |

**Metas do M1:** batalha comum de **2 a 6 rodadas**. Uma rodada leva ~10 s (comandos ~5 s + ~3–4 s de animação, 03 §9), então a batalha dura **20 s a 1 min**, abaixo do 1–3 min pedido. Para chegar a 1–1,5 min seria preciso subir as vidas, mas slime 90 / lobo 110 derruba o encontro misto para 72 % de vitória; não recomendo agora. O grupo termina com **40–95 % da vida**; vitória ≥ 90 % com a política simples. **Encontros do M1: os três do 03** (`enc_slime_1`, `enc_lobo_1`, `enc_misto_1`). **2 lobos fica fora do M1** (3 %).
Golpes para o inimigo derrubar: Edric (100 PV): slime 8, lobo 6; Grace (70 PV): slime 5, lobo 4. Para matar um slime: 4 `Atacar` do Edric ou 3 `Golpe Firme`; o lobo: 5 `Atacar` ou 3 `Golpe Firme`.
Nível 2 após ~4 batalhas (o misto dá 32 XP; o slime 12; o lobo 20). Ajuste: uma alavanca por vez (PV, `poder` ou `escala`), registrada abaixo.

## 11. Alinhamento com `combate_turnos.md` (03)

**Adotei os nomes do 03:** `vida`, `vida_max`, `mana`, `mana_max`, `agilidade_efetiva`, `prioridade_comando`, `defender_mult_dano`, `defendendo`, `caido`, `caido_pos_batalha_vida`, `xp_caido_fracao`, `fugir_base/por_ponto/min/max`, `pode_fugir`, `atk_*`, `skill_*`, `mult_dano`, `escala`, `atributo`, `tipo_dano`, `alvo_tipo`, `semente_batalha`, `enc_*`, os eventos do 03 §8 e os IDs `atk_edric_golpe`, `atk_grace_cajado`, `skill_cura`.
**Já bate:** XP total a cada vivo, caído sem XP, caídos voltam com 1 de vida, todo ato acerta, cura não revive, Defender ×0,5 com prioridade +1, empates, fuga sem XP, chefe sem fuga, IA do 03 (já simulada).

**O que o 03 precisa mudar** (só isto):
1. **§5 passo 4b:** acrescentar o fator da defesa, `× 100 / (100 + defesa_do_alvo)`; campo `defesa` nos dados de heróis e inimigos.
2. **§2 e §12:** a habilidade do Edric é `skill_golpe_firme` (`alvo_tipo` `inimigo_1`, 4 de mana, `mult_dano` 1,8), não `skill_giro` em área. A pose `bat_habilidade` fica; muda só o nome na descrição ("golpe firme" no lugar de "giro de espada") e o ataque em área sai da §10.1.
3. **§12 "valores iniciais":** trocar a tabela pelos valores desta ficha (§2 e §9): Edric 100 vida/14 mana/agilidade 6, Grace 70/29/5, slime 70/agilidade 3/`defesa` 3, lobo 90/9/4.
4. **Fim de rodada:** `regen_mana_rodada` = `1 + piso(mente / 4)` (Edric +1, Grace +3), com evento `mana_mudou`.
5. **Fuga:** `fugir_por_ponto` 0,05 (era 0,02) e novo `fugir_bonus_falha` 0,10; refazer os exemplos O5/O6.
6. **Campos de ataque:** `atk_*` de inimigo usa `dano_base` (12 slime, 15 lobo; investida 22,5); os de herói usam `mult_dano` sobre `poder_arma` (14 Edric, 8 Grace); todos com `escala` 5.
7. **Valores de agilidade** dos exemplos O1–O4 podem continuar (são exemplos de ordem), mas os dados reais são os de cima.

## Histórico de mudanças
| Data | Mudança | Antes → depois | Motivo |
|---|---|---|---|
| 2026-10-27 | Criação para turnos (BL-004) | tempo real → rodadas | D-028, D-031 |
| 2026-10-27 | Escala de PV | vida `80 + 12 × vigor` (140) → `30 + 10 × vigor` (100) | números legíveis por turno |
| 2026-10-27 | Escala dos atributos | +2 % por ponto → +5 % por ponto | poucos pontos, efeito perceptível |
| 2026-10-27 | Inimigos do M1 | slime 80/16 e lobo 70/18 (`bestiario_slice.md`) → slime 70 PV poder 12 e lobo 90 PV poder 15 | rodadas, não segundos |
| 2026-10-27 | Poção de ervas | cura 50 → 40 | escala de PV |
| 2026-10-27 | Alinhamento com `combate_turnos.md` | Defender +2 PM → sem ganho, prioridade +1; mana só por rodada; IA do 03; `skill_mao_boa` → `skill_cura`; metas de tempo | divergências do 03 |
