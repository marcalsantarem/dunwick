# Bestiário do slice — 5 inimigos comuns (D-023) e referência do Hollowpaw

> **Combate por turnos (D-028):** os números de slime e lobo para o M1 estão em `formulas_turnos.md` §9; esta tabela (tempo real) fica como base de um modo de ação.
> **Dono:** 06 Sistemas e Níveis · **Status:** RASCUNHO v0.1 (D-025, 2026-10-24)
> Escala dos sistemas combinados: herói nível 1 com vida 140, combo 13 / 13 / 20 (destreza 5), `formulas.md` v0.1 e D-007/D-009. Valores **de referência**: servem para a primeira versão e para a simulação, que ajusta uma alavanca por vez.
> Fichas completas (ataques por quadro, IA, drops) saem no briefing de bestiário; aqui estão papel, números e contra-jogo.
> Telegraph (03 §6.3 / `formulas.md` §6.3): comum ≥ 18 q, forte ≥ 36 q, chefe ≥ 60 q; zona do golpe em magenta com a forma exata.

## 1. Tabela de números

| ID | Papel | Vida | Dano base · tipo | Vel. perseguição (tiles/s) | Percepção (tiles) | Alcance | Aviso | Ativo | Recup. | Intervalo | Postura · `resist_recuo` | Resistências |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `enemy_lobo` | Combatente | **70** | **18** `corte` | 4,5 | 6 | 1,0 | **24** | 4 | 24 | 90 q | 40 · 0 | — |
| `enemy_morcego` | Rápido | **40** | **16** `corte` | 5,5 (voo errático) | 6 | 0,8 (mergulho) | **18** | 3 | 20 | 100 q | 20 · 0 | — |
| `enemy_slime` | Emboscador | **80** | **16** `impacto` | 2,0 | 2,0 (escondido) | 0,9 | **24** (pulo, marcador no chão) | 5 | 30 | 100 q | 40 · 0,5 | — |
| `enemy_besouro` | Pesado | **100** | **28** `impacto` | 2,2 | 5 | 1,2 | **40** | 5 | 36 | 150 q | 80 · 1,0 | `corte` +0,25 · `impacto` −0,25 |
| `enemy_goblin_arqueiro` | Atirador | **55** | **18** `perfuracao` (flecha 7 tiles/s, vive 1,3 s) | 3,0 (recua se herói < 3) | 8 | 8 (distância preferida 6) | **30** (linha de mira no chão) | — | 24 | 130 q | 30 · 0 | — |

Chaves a repetir nos dados: `fichas_ataque_max` 2, percepção pelas costas = metade, desistir da perseguição a > 9 tiles do herói ou 15 do ponto de origem (`metricas.md` §6).

## 2. Contra-jogo e leitura em 1 segundo

- **Lobo (Combatente):** rodeia e morde. Esquiva no aviso (24 q = 0,4 s) e pune a recuperação. Boa lição de ritmo da estrada.
- **Morcego (Rápido):** mergulha e sai. O aviso é curto (18 q), por isso o dano é baixo e o morcego cai em 3 golpes. Hurtbox em altura 0,6–1,2: golpes só no chão podem errar. Contra-jogo: esquiva no mergulho; vem em bando de 2–3.
- **Slime (Emboscador):** parado como poça até o herói chegar a 2 tiles, com som e brilho 1 s antes do pulo. Persegue devagar (2,0), então fugir sempre funciona. Contra-jogo: observar o ambiente.
- **Besouro (Pesado):** couraça frontal. O combo leve faz pouco (resistência a `corte`); o golpe forte e a investida (`impacto`) rendem mais e derrubam a postura (80), e pelas costas ×1,25. Contra-jogo: paciência, esquiva lateral e punir.
- **Goblin arqueiro (Atirador):** linha de mira magenta de 30 q, flecha lenta. A 6 tiles chega em ~0,9 s. Fica longe e recua de perto. Contra-jogo: cobertura (pilares altos), fechar a distância, esquiva no tiro.

## 3. Conferência (herói nível 1, destreza 5; calculado por script)

| Inimigo | Golpes do combo para matar | Tempo de ataque puro | Tempo para matar a 35 % de ataque | Golpes dele para matar o herói (140) |
|---|---|---|---|---|
| lobo | 5 | 1,6 s | **~4,5 s** | 8 |
| morcego | 3 | 0,95 s | **~2,7 s** | 9 |
| slime | 6 | 1,9 s | **~5,4 s** | 9 |
| besouro (com a resistência) | 9 | 2,85 s | **~8,1 s** (menos com golpe forte e postura quebrada) | 5 |
| goblin arqueiro | 4 | 1,3 s | **~3,6 s** | 8 |

Metas (06 §10): tempo para matar o comum 3–8 s (o besouro está no teto; a postura quebrada, ×1,5 de dano, o põe dentro); erros graves até morrer 5–9 ✓ (5 a 9).

## 4. Hollowpaw (`boss_urso_musgo`)

Os números e o resumo dos golpes estão em `docs/niveis/metricas.md` §9 (d), na escala acima: vida de referência ~2800, 3 fases por vida, postura 200 com `resist_recuo` 1,0, ponto fraco ×1,25, quatro golpes (pancada 90 q, varrida 72 q, investida 100 q, estouro de cristais 66 q) e aviso nunca abaixo de 60 q. A ficha completa vem depois, com os outros chefes.

## 5. Boneco de treino (`enemy_boneco_treino`) — v0.1.2b, combate por turnos

Igual a um inimigo comum no sistema; o que o faz boneco está nos dados (`data/combate/enemy_boneco_treino.json` e `enc_boneco_treino.json`, validados). Valores do 03 **aprovados** pelo 06.

| Campo | Valor | Por quê |
|---|---|---|
| Vida · Defesa · Agilidade | **200 · 1 · 0** | ~5 rodadas contra o grupo nível 1 (simulação: 5,0 rodadas, 16 s de animação, vitória 100 %); defesa baixa deixa os números do herói quase crus (Atacar 19, Golpe Firme 35, Grace 9) |
| Força · ataques | 0 · nenhum (`ia: []`) | passa a vez, por último; a UI mostra "{nome} não faz nada." |
| Resistências · imunidades | nenhuma | o treino mostra o dano cheio |
| XP · moedas · drops | **0 · 0 · nenhum** | o validador exige tudo zerado quando `treino: true` |
| Papel | `combatente` (o esquema não tem "boneco") | só para o campo ficar preenchido |
| `treino` | **sim**, no inimigo e no encontro | sem recompensa; grupo volta com vida e mana cheias; repetível; derrota vira `fugiu` |
| Nome · descrição | `txt_enemy_boneco_treino_nome` · `txt_enemy_boneco_treino_desc` | "Boneco de Treino" · "Palha, corda e remendos. Aguenta tudo e não revida." |

Uso: teste de dano e de habilidades sem risco (e referência de dano para o 09). Como o boneco não age, a Mão Boa e o Defender não têm o que testar; para isso valem os encontros com lobo e slime.

## 6. Item do baú da casa do Edric (`item_lembranca_edric`)

**Pião Entalhado** (nome provisório, 02 revisa): lembrança de infância entalhada pelo pai do Edric. **Sem efeito**, valor 0 (não vende), categoria `lembranca`, não usável em batalha. Dados em `data/combate/item_lembranca_edric.json` (ID combinado com o 14). Para caber no esquema, `item_batalha` agora aceita `efeito: "nenhum"` (e `categoria`, `desc_txt`, `valor`) sem exigir campos de cura; a poção continua igual. Itens de missão do 02 (sino, livro, contrato) podem usar o mesmo molde.

## Histórico de mudanças
| Data | Mudança | Motivo |
|---|---|---|
| 2026-10-24 | Criação com os 5 inimigos de D-023 | D-025 (as fichas do BRF-011 voltam à escala dos sistemas combinados) |
