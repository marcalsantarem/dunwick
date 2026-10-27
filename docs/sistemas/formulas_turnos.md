# Fórmulas do combate por turnos (M1)

> **Dono:** 06 Design de Combate e Classes · **Status:** RASCUNHO v0.1 (BL-004, D-028/D-031) · 2026-10-27
> **Fonte única das fórmulas de batalha.** Substitui `formulas.md` no combate (o que cai e o que fica: §1). Os exemplos resolvidos da §9 viram testes; foram calculados por script.
> Combine os nomes de parâmetro com `docs/combate_turnos.md` (03). Onde divergir, o Produtor decide.
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
pv_max   = 30 + 10 × vigor + bonus_itens
pm_max   = 5 + 3 × mente + bonus_itens
defesa   = vigor + armadura_equipada
agilidade = destreza + bonus_itens
```
Pisos: todo atributo ≥ 1; `pv_max` ≥ 1. Teto de atributo no slice: 30. Vida e mana **não** enchem sozinhas; sobem ao subir de nível (cheias) e voltam no ponto de salvamento.

### Ficha de nível 1

| | Edric (guerreiro **[classe em aberto]**) | Grace (curandeira) |
|---|---|---|
| Vigor · Força · Destreza · Mente | 7 · 8 · 6 · 3 | 4 · 3 · 5 · 8 |
| PV máx · PM máx | **100 · 14** | **70 · 29** |
| Defesa (armadura) | **9** (vigor 7 + túnica 2) | **5** (vigor 4 + manto 1) |
| Agilidade | **6** | **5** |
| Arma (poder) · tipo | espada **14** · `corte` | cajado **8** · `impacto` |
| Habilidade do M1 | `skill_golpe_firme` | `skill_mao_boa` |

**Crescimento por nível (provisório, automático pela classe; sem pontos para distribuir no slice):** Edric vigor +2, força +2, destreza +1, mente +1; Grace vigor +1, força +1 a cada 2 níveis, destreza +1, mente +2. A evolução do Edric (fixa, escolha ou por uso, BL-001) fica **aberta**.

## 3. Dano

```
dano_final = max(1, arred(
      poder_do_golpe × mult_golpe
    × (1 + 0,05 × atributo_do_golpe)
    × 100 / (100 + defesa_do_alvo)
    × mult_situacional            (defendendo ×0,5 no alvo; exposto ×1,2; outros em §8)
    × mult_dificuldade            (dano_causado do grupo; dano_recebido do grupo)
    × (1 − resistência_ao_tipo)   (limitada a [−0,50 ; +0,75])
))
imune ao tipo → 0 (sem piso)
```
Arredondamento único, no fim (`piso(x + 0,5)`). A defesa tem retorno decrescente (`100 / (100 + defesa)`: nunca zera o dano). `poder_do_golpe` é o da arma (golpes físicos) ou o da habilidade; `atributo_do_golpe` é `forca` nos golpes físicos e `mente` nas magias. Inimigos usam o `poder` do ataque na ficha e a `forca` deles.

### Cura
```
cura = max(1, arred( cura_base × (1 + 0,05 × mente) × mult_cura_recebida ))     envenenado: ×0,7
vida_curada = min(cura, pv_max − pv_atual)          caído (PV 0) não recebe cura no M1
```

### Defender
Comando de rodada. O personagem fica `defendendo` **desde o início da rodada até o fim dela**: dano recebido ×0,5 e **+2 PM** (limitado ao máximo). Sem custo. É a escolha de quem está em risco ou sem mana, e a Grace é a que mais precisa (70 PV).

## 4. Ordem de turno

```
a cada rodada: todos escolhem o comando (grupo e inimigos); depois todos agem em ordem decrescente de agilidade
empate: aliado antes de inimigo; depois pela posição na formação (menor primeiro)
quem morreu antes de agir perde o turno; ação sobre alvo já caído redireciona ao primeiro alvo vivo válido
```
Sem aleatoriedade e sem prioridade por comando no M1 (Defender vale a rodada inteira, então não precisa agir antes).

## 5. Fugir

```
chance_fuga = clamp(0,10 ; 0,90 ; 0,50 + 0,05 × (agilidade_média_do_grupo − agilidade_média_dos_inimigos) + 0,10 × tentativas_falhas_na_batalha)
sucesso: a batalha termina sem XP; falha: o turno é perdido
chefe: não se foge (chance 0)
```
Único sorteio do jogador no combate; usa a semente do 03 (injetável nos testes).

## 6. Fim de batalha
- **Vitória:** todos os inimigos com PV 0. Cada membro **vivo** recebe o XP total (o total vem dos inimigos); caídos voltam com **1 PV** e sem XP. Moedas e itens vão ao grupo.
- **Derrota:** todo o grupo com PV 0 → volta ao último ponto de salvamento, perdendo parte das moedas (06 §3, regra de morte).
- XP do M1: `enemy_slime` **12**, `enemy_lobo` **20** (provisório, calibra com a economia).

## 7. Habilidades do M1

| ID | Quem | Custo | Alvo | Efeito | Verbo · risco |
|---|---|---|---|---|---|
| `skill_golpe_firme` | Edric | **4 PM** | 1 inimigo | dano = arma × **1,8**, tipo `corte` | golpear com peso · gasta o pouco mana que ele tem (14 = 3 usos) |
| `skill_mao_boa` (nome provisório [aguarda 02]) | Grace | **5 PM** | 1 aliado vivo | cura base **14**, escala `mente` | curar · a rodada dela não ataca |

Evolução em 3 níveis e uso (BL-001) ficam para o briefing de classes: aqui só o que o M1 precisa.
**Item:** `item_pocao_ervas` cura **40** PV fixos, consome o turno de quem usa (valores de itens antes 50/30/25 → agora 40/25/20 na escala de PV de 100: ver histórico).

## 8. Estados em rodadas (fora do M1; conversão para uso futuro)

Acúmulo determinístico mantido: cada golpe soma `acumulo_do_golpe × (1 − resistência_ao_estado)`; ao chegar a 100 o estado dispara e o acúmulo zera; o acúmulo cai 20 por rodada sem ganho. Efeitos de controle seguidos têm 2 rodadas de imunidade depois.

| Estado | Efeito | Duração | Contra-jogo |
|---|---|---|---|
| `est_queimando` | no fim da rodada, 6 % do `pv_max` (mín. 1) | 3 rodadas | água, Defender não ajuda |
| `est_envenenado` | no fim da rodada, 4 % do `pv_max` por pilha (até 3); cura recebida ×0,7 | 4 rodadas | antídoto |
| `est_lento` | agilidade −40 % | 3 rodadas | tempo, fogo remove |
| `est_atordoado` | perde a próxima ação | 1 rodada | agir antes (agilidade) |
| `est_exposto` | dano recebido ×1,2 | 3 rodadas | tempo |

## 9. Inimigos do M1 (escolhidos pelo usuário: Slime e Lobo)

Valores **de referência**; a simulação (§10) ajusta uma alavanca por vez. IA mínima (03 confirma): cada turno usa o único ataque num herói vivo escolhido ao acaso (com semente).

| ID | Papel (D-023) | PV | Força | Defesa | Agilidade | Ataque (poder · tipo) | Resistências | XP · moedas |
|---|---|---|---|---|---|---|---|---|
| `enemy_slime` | Emboscador | **70** | 4 | **3** | **3** | `atk_slime_golpe` **12** `impacto` | nenhuma | 12 · 4 |
| `enemy_lobo` | Combatente | **90** | 6 | **4** | **9** | `atk_lobo_mordida` **15** `corte` | nenhuma | 20 · 7 |

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
| T13 | `skill_mao_boa` (base 14, mente 8) | 14 × 1,40 = 19,6 | **20** |
| T14 | `skill_mao_boa` em envenenado | 19,6 × 0,7 = 13,72 | **14** |
| T15 | cura em alvo com 90/100 PV | cura 20 | **vida_curada 10** |
| T16 | PV/PM nível 1 (Edric · Grace) | 30+10×7 · 5+3×3 · 30+10×4 · 5+3×8 | **100 · 14 · 70 · 29** |
| T17 | Ordem (agilidade Edric 6, Grace 5, lobo 9, slime 3) | decrescente | **lobo, Edric, Grace, slime** |
| T18 | Empate: Edric 9 e lobo 9; dois slimes (posição 0 e 1) | aliado antes; menor posição | **Edric, lobo; slime0, slime1** |
| T19 | Fuga: grupo média 5,5 contra lobo 9 | 0,50 + 0,05 × (−3,5) | **0,325** |
| T20 | Fuga contra slime (3), e contra lobo após 2 falhas | 0,50 + 0,05 × 2,5 · 0,325 + 0,20 | **0,625 · 0,525** |
| T21 | Defender: Edric com 13/14 PM | +2 limitado ao máximo | **14 PM** |
| T22 | XP para o nível 2 · 3 | `arred(100 × n^1,6)` | **100 · 303** |

## 10. Metas de balanceamento e simulação

Simulação por script (política simples: Edric usa Golpe Firme no inimigo de mais PV quando há mana e ataca o mais ferido; Grace cura quem estiver abaixo de 50 % e senão ataca; inimigos miram ao acaso; 5.000 batalhas com semente fixa):

| Encontro | Vitória | Rodadas (média) | PV do grupo no fim |
|---|---|---|---|
| 1 slime | 100 % | **2,0** | 92 % |
| 2 slimes | 100 % | **5,0** | 59 % |
| 1 lobo | 100 % | **3,0** | 67 % |
| lobo + slime | 100 % | **5,3** | 37 % |
| 2 lobos | 20 % | 6,5 | 14 % |

**Metas do M1:** batalha comum de **3 a 6 rodadas** (~15–20 s por rodada com menus ⇒ **1–2 min**); grupo termina com **35–65 % dos PV**; vitória ≥ 90 % com a política simples. **Encontro padrão do M1: 1 a 2 inimigos** (slime, lobo ou lobo + slime). **2 lobos fica fora do M1** (20 %), reservado para áreas posteriores.
Golpes para o inimigo derrubar: Edric (100 PV): slime 8, lobo 6; Grace (70 PV): slime 5, lobo 4. Para matar um slime: 4 `Atacar` do Edric ou 3 `Golpe Firme`; o lobo: 5 `Atacar` ou 3 `Golpe Firme`.
Nível 2 após ~3–4 batalhas (lobo + slime dá 32 XP). Ajuste: uma alavanca por vez (PV, `poder` ou `escala`), registrada abaixo.

## 11. Nomes de parâmetro propostos para combinar com o 03
`pv`, `pv_max`, `pm`, `pm_max`, `defesa`, `agilidade`, `ordem_turno`, `comando` (`atacar`, `habilidade`, `item`, `defender`, `fugir`), `defendendo`, `caido`, `chance_fuga`, `mult_dano_causado`, `mult_dano_recebido`, `atk_*` (ataques de inimigos), `skill_*`. Eventos: `rodada_inicio`, `acao`, `dano`, `cura`, `caiu`, `batalha_fim`. Se o `combate_turnos.md` usar outros, o Produtor define; eu ajusto aqui.

## Histórico de mudanças
| Data | Mudança | Antes → depois | Motivo |
|---|---|---|---|
| 2026-10-27 | Criação para turnos (BL-004) | tempo real → rodadas | D-028, D-031 |
| 2026-10-27 | Escala de PV | vida `80 + 12 × vigor` (140) → `30 + 10 × vigor` (100) | números legíveis por turno |
| 2026-10-27 | Escala dos atributos | +2 % por ponto → +5 % por ponto | poucos pontos, efeito perceptível |
| 2026-10-27 | Inimigos do M1 | slime 80/16 e lobo 70/18 (`bestiario_slice.md`) → slime 70 PV poder 12 e lobo 90 PV poder 15 | rodadas, não segundos |
| 2026-10-27 | Poção de ervas | cura 50 → 40 | escala de PV |
