# Combate por turnos — especificação do M1 (BL-004)

> **Dono:** 03 Combate por turnos e IA · **Status:** RASCUNHO v0.1 · 2026-10-27 · base: D-028 (turnos, estilo Breath of Fire), D-031 (rodadas, encontro aleatório, Grace luta), D-032, D-023.
> Sem stack e sem código. Todo número abaixo é **dado** (vai para `data/`); os marcados **[06]** são do 06 (fórmulas e atributos), e o 03 só dá um valor inicial para destravar a BL-008.
> Reaproveita do combate de ação arquivado (`docs/arquivo/combate_acao/`): o **pipeline de dano** em ordem fixa, atributos, tipos de dano e resistências, habilidades por ID, XP e `formulas.md` §4/§9/§10. Cai: quadros, hitboxes, esquiva, fôlego, aviso em tempo real.
> Textos por ID; tempos em **segundos** (nunca quadros); IDs: `hero_`, `enemy_`, `enc_`, `atk_`, `skill_`, `item_`, `fx_`, `sfx_`.

---

## 1. A rodada (estilo Breath of Fire)

```
BATALHA_INICIA → [ RODADA: COMANDOS → EXECUÇÃO → FIM_DE_RODADA ] × n → BATALHA_TERMINA
```

| Fase | O que acontece |
|---|---|
| **COMANDOS** | Cada membro **vivo** do grupo escolhe um comando, na ordem fixa do grupo (Edric, Grace). `cancelar` volta ao membro anterior e refaz a escolha. Ao confirmar o último, a rodada trava os comandos. **Os inimigos escolhem a ação no mesmo instante** (IA, §7), sem ver os comandos do grupo |
| **EXECUÇÃO** | Todos os atores vivos agem **um por vez**, em ordem de iniciativa (§3). Cada ato resolve por inteiro (custo, alvo, dano, eventos) antes do próximo |
| **FIM_DE_RODADA** | Limpa `defendendo`; aplica `regen_mana_rodada` = `1 + piso(mente / 4)` a cada vivo (Edric +1, Grace +3; evento `mana_mudou`); checa `rodadas_max`; abre a rodada seguinte |

- Tudo é **determinístico** em regras (dano, ordem, empates). A aleatoriedade existe só na **IA**, na **fuga** e nos **drops**, sempre por PRNG com **semente da batalha** (`semente_batalha`, gravada no resultado), para os testes e o 06 repetirem qualquer batalha.
- Segurança: `rodadas_max` = 50; passou disso, a batalha termina como `empate` (volta ao mapa sem recompensa).
- `modo_automatico` (só para teste e simulação do 06/09): a IA também controla o grupo, sem UI.

---

## 2. Comandos do M1

| Comando | Alvo | Custo | Efeito |
|---|---|---|---|
| **Atacar** | 1 inimigo vivo | — | Ataque básico do ator (`atk_*`), dano físico pela fórmula do 06 |
| **Habilidade** | conforme `alvo_tipo` da habilidade | mana **[06]** | Lista do ator (`skill_*`); sem mana suficiente, o item da lista fica desabilitado e não pode ser escolhido |
| **Item** | conforme o item | consome 1 | Só itens com `uso_batalha` = sim; M1: poção (cura 1 aliado vivo) |
| **Defender** | si mesmo | — | Dano recebido × `defender_mult_dano` (0,5) até o fim da rodada; **age antes dos demais** (`prioridade_comando` +1) |
| **Fugir** (opcional, ligado no M1) | — | — | Tenta fugir (§6.4); desabilitado em batalha de chefe (`pode_fugir` = não) |

Habilidades do M1 (1 de cada, números **[06]**): Edric `skill_golpe_firme` (alvo `inimigo_1`, 4 de mana, `mult_dano` 1,8) e Grace `skill_cura` (alvo `aliado_1`, custo mana, cura escalada por Mente). Os ataques básicos são `atk_edric_golpe` e `atk_grace_cajado` (Grace bate fraco).

`alvo_tipo`: `inimigo_1` · `inimigos_todos` · `aliado_1` · `aliados_todos` · `si`. Habilidade que reviver (caído) fica fora do M1.

---

## 3. Ordem de ação e empates

```
iniciativa = agilidade_efetiva × (1 + bonus_comando)            (decimal; sem arredondar)
ordem      = ordenar por: prioridade_comando (maior primeiro) → iniciativa (maior primeiro) → desempate
```

| Chave | Valor | Observação |
|---|---|---|
| `prioridade_comando` | Defender +1 · demais 0 | Fugir 0; ajustável por habilidade (campo `prioridade`) |
| `iniciativa_variacao` | 0 | Fração de sorteio ±; **0 no M1** (ordem 100 % previsível). Existe para o 06 ligar depois |
| `desempate` | lado → posição | 1º: **grupo antes dos inimigos**; 2º: menor número de posição (Edric 1, Grace 2; inimigo slot 1, 2, 3) |

- A ordem é calculada **uma vez**, ao travar os comandos. A agilidade não muda no meio da rodada no M1 (sem estados de velocidade).
- Ator que cai antes de agir **perde o ato** (evento `ato_cancelado`); o custo não é cobrado.
- Exemplos resolvidos (viram testes **O1–O4**):

| # | Entrada | Ordem de execução |
|---|---|---|
| O1 | Edric ag 10 (Atacar), Grace ag 8 (Atacar), Lobo ag 12 | Lobo (12) → Edric (10) → Grace (8) |
| O2 | O1, mas Grace escolhe **Defender** | Grace (prioridade +1) → Lobo → Edric |
| O3 | Edric ag 10, Lobo ag 10 | Edric, Lobo (empate: grupo primeiro) |
| O4 | Slime 1 ag 4 e Slime 2 ag 4, Edric ag 10 | Edric → Slime 1 → Slime 2 (empate: menor posição) |

---

## 4. Estados dos atores

| Estado | Condição | Regras |
|---|---|---|
| `vivo` | vida > 0 | Age, pode ser alvo |
| `caido` | vida = 0 | Não age, não é alvo de comando (inimigo sai da cena; aliado fica no chão), perde o ato pendente |
| `defendendo` | marca temporária | Dura até `FIM_DE_RODADA` |

- Estados de status do 06 (queimando, lento etc.) **fora do M1**; o campo `estados` existe vazio em cada ator para o 06 ligar depois.
- Vida e mana ficam presas em `[0, máx]`. Cura não revive caído (no M1).
- **Fim de batalha com vitória:** aliados `caido` voltam com `caido_pos_batalha_vida` = 1 de vida; mana e vida restantes seguem para o mapa.

---

## 5. Pipeline de dano e cura (reaproveitado, em ordem fixa)

Para cada ato:
1. **Validar:** ator vivo? comando ainda possível (mana, item em estoque)? Se não → `ato_falhou`, nada é cobrado.
2. **Resolver alvos:** alvo morto no meio da rodada → **redireciona** para o próximo da mesma lista que esteja vivo (inimigo: menor posição; cura: o aliado vivo com **menor fração de vida**); sem alvo válido → `ato_falhou`.
3. **Pagar o custo** (mana, item).
4. **Para cada alvo:** (a) todo ato **acerta** (sem chance de errar no M1); (b) **dano** = fórmula do 06 §4.1 sem os termos de ação: `arred(dano_base × (1 + escala × atributo/100) × 100/(100 + defesa_do_alvo) × mult_defender × mult_dificuldade × (1 − resistência_ao_tipo))`, mínimo 1; `dano_base` = `dano_base` do ataque (inimigo) ou `mult_dano × poder_arma` (herói), `escala` 5, campo `defesa` nos dados de heróis e inimigos; (c) aplica; (d) estados (fora do M1).
5. **Eventos** (§8), na ordem em que acontecem.
6. **Checar queda** (vida 0 → `caiu`), depois **fim de batalha** (§6).

- Cura: `arred(cura_base × (1 + escala × mente/100) × mult_cura)`, limitada ao que falta de vida (06 §9). Sem crítico, sem variação aleatória.
- `mult_defender` vale para o alvo que está `defendendo` (0,5), também para golpes em área (futuros).

---

## 6. Fim da batalha

### 6.1 Vitória
Todos os inimigos `caidos`. Checada **após cada ato**, então a rodada termina na hora (os atos restantes não acontecem). Evento `venceu` com a recompensa.

### 6.2 Derrota
Todos do grupo `caidos`. Evento `perdeu`; a tela de game over (15) oferece **reiniciar do último ponto salvo** (13/08). Sem penalidade extra no M1.

### 6.3 Recompensas
| Item | Regra |
|---|---|
| XP | Soma do `xp` de cada inimigo derrotado; **cada membro vivo recebe o total** (caído não recebe, `xp_caido_fracao` = 0). Níveis: 06 §10 |
| Ouro | Soma do `ouro` dos inimigos **[06]** |
| Drops | `drops: [{item, chance, qtd}]` por inimigo, sorteio por PRNG com semente; resultado aparece na tela de recompensa |

### 6.4 Fuga
`chance = limitar(fugir_base + (ag_media_grupo − ag_media_inimigos) × fugir_por_ponto + falhas_na_batalha × fugir_bonus_falha, fugir_min, fugir_max)`; com `fugir_base` 0,5 · `fugir_por_ponto` 0,05 · `fugir_bonus_falha` 0,10 (cada tentativa que falhou) · `fugir_min` 0,1 · `fugir_max` 0,9. Sorteio por PRNG. Sucesso: o ator some da rodada e **toda a batalha termina** como `fugiu` (sem XP, drops nem ouro); falha: o ato é gasto. Em chefe, `pode_fugir` = não. Exemplos **O5** (ag médias 10 e 8, sem falhas → 0,5 + 2 × 0,05 = 0,60), **O6** (grupo 5 contra 20 → 0,5 − 0,75 = −0,25 → 0,1, piso) e **O7** (como O5 depois de 2 falhas → 0,60 + 0,20 = 0,80).

---

## 7. IA dos inimigos (simples)

- Cada inimigo escolhe **uma ação por rodada**, no início dela, por **peso**, entre as ações cuja `condicao` é verdadeira. A IA **só vê o estado público** (vida e mana atuais, quem está caído); **nunca** lê os comandos do grupo nem trapaceia.
- `alvo_regra` por ação: `aleatorio` (uniforme entre vivos) · `menor_vida` (menor fração de vida) · `maior_ameaca` (maior dano médio causado na batalha, só se houver dado) · `misto` (`prob_menor_vida` de escolher o de menor vida, senão aleatório).
- Se o alvo cai antes do ato, redireciona como no §5 (para um vivo, conforme a mesma regra).

Dados (exemplo, vão para `data/enemies/enemy_*.json` e seguem `inimigo.schema.json` + campo `ia`):

```json
{ "id": "enemy_lobo", "ia": [
  { "acao": "atk_lobo_mordida", "peso": 70, "alvo_regra": "misto", "prob_menor_vida": 0.5 },
  { "acao": "skill_lobo_investida", "peso": 30, "alvo_regra": "aleatorio", "condicao": { "rodada_min": 2 } } ] }
```

| Inimigo (D-023) | Arquétipo | Ações e pesos | Alvo | Observação |
|---|---|---|---|---|
| `enemy_slime` | Emboscador | `atk_slime_golpe` 70 · `skill_slime_balanco` 30 (passa a vez; só animação) | aleatório | Lento (agilidade baixa), dano baixo, vida baixa; é o inimigo do tutorial |
| `enemy_lobo` | Combatente | `atk_lobo_mordida` 70 · `skill_lobo_investida` 30 (dano ×1,5; só da rodada 2 em diante) | misto, 50 % menor vida | Ágil; ataca quase sempre antes do grupo |

**Chefe (fora do M1, gancho):** `fases: [{ vida_fracao_max, acoes, transicao }]`; ao cruzar o limite, a fase muda no **fim do ato** e o evento `fase_mudou` toca a cena (07/10). Hollowpaw terá 3 fases por vida.

---

## 8. Eventos para a apresentação

A simulação resolve cada ato **por inteiro** e emite os eventos na ordem; a apresentação toca uma **fila** e só libera o próximo ato quando termina (`ato_apresentado`). Nos testes e no `modo_automatico`, a fila é instantânea. A simulação **não conhece** tempos de animação, só o `duracao_s` sugerido em cada ato.

| Evento | Dados | Quem usa |
|---|---|---|
| `batalha_iniciou` | `encontro_id`, grupo, inimigos, semente | 07 (cena), 15, 05 (música) |
| `rodada_iniciou` | `n` | 15 (ordem da rodada) |
| `comando_pedido` | `ator`, comandos habilitados | 15 (menu) |
| `comando_escolhido` | `ator`, comando, alvo(s) | 15 |
| `execucao_iniciou` | `ordem` (lista de atores) | 15 (barra de ordem) |
| `turno_iniciou` | `ator` | 07/04 (destaque do ator) |
| `ato_executado` | `ator`, `tipo` (`atacar`/`habilidade`/`item`/`defender`/`fugir`/`espera`), `id`, alvos, `duracao_s` | 04 (pose), 05, 10 (fx) |
| `dano` | `ator`, `alvo`, `valor`, `tipo_dano`, `efetividade` (`fraco`/`normal`/`resistente`), `defendendo` | 15 (número), 05, 10 |
| `curou` | `ator`, `alvo`, `valor` | 15, 10 (fx de cura) |
| `mana_gasta`, `item_usado` | ator, valor / item | 15 |
| `defendeu` | `ator` | 04 (pose), 10 |
| `fuga_tentada` | `ator`, `sucesso` | 04, 05 |
| `ato_falhou`, `ato_cancelado` | `ator`, `motivo` | 15 (mensagem) |
| `caiu` | `alvo` | 04 (pose), 05 |
| `vida_mudou`, `mana_mudou` | `ator`, valor, máximo | 15 (caixas da HUD) |
| `fase_mudou` | `inimigo`, `fase` (chefe) | 07/10 |
| `rodada_terminou` | `n` | 15 |
| `venceu` | XP, ouro, itens, níveis | 15 (tela de recompensa), 05 (música) |
| `perdeu` / `fugiu` / `empate` | — | 15, 13 |
| `batalha_terminou` | `resultado`, `semente`, recompensas, vida/mana finais | 13 (volta ao mapa) |

---

## 9. Tempos de animação (segundos; todos em `cfg_batalha`)

| Chave | s | Observação |
|---|---|---|
| `t_entrada_batalha` | 1,0 | Transição do mapa + entrada dos sprites |
| `t_intervalo_ato` | 0,2 | Respiro entre atos |
| `t_atacar` | 0,9 | Avança 0,25 → golpe 0,25 (impacto em 0,40) → recua 0,25 |
| `t_habilidade` | 1,2 | Prepara 0,5 → efeito 0,7 (impacto em 0,7) |
| `t_cura` | 1,1 | Prepara 0,4 → brilho 0,7 |
| `t_item` | 0,9 | Pega 0,4 → usa 0,5 |
| `t_defender` | 0,4 | Assume a guarda e fica |
| `t_dano` | 0,3 | Recuo do alvo, no impacto |
| `t_cair` | 0,6 | Queda; inimigo some depois de 0,4 |
| `t_numero_dano` | 0,8 | Número flutuando |
| `t_barra_vida` | 0,4 | Barra desce animada |
| `t_pausa_impacto` | 0,06 | Congela a cena ao acertar (peso do golpe) |
| `t_fuga` | 0,8 | Corre para fora; tela some |
| `t_vitoria` | 1,6 | Pose de vitória antes da tela de recompensa |
| `velocidade_batalha` | 1× / 2× | Opção do jogador: divide todos os tempos |

Uma rodada com 3 atos dura ≈ 3 s a 1×. Acessibilidade: flashes ≤ 3/s (o limitador global do 10 descarta o excedente), tremor e partículas desligáveis.

---

## 10. Cena: posições e poses

### 10.1 Posições (plano de batalha, tiles; origem no centro do palco, **x** vai da esquerda para a direita da tela, **z** para a frente da câmera)
| Slot | Grupo (lado direito) | Inimigos (lado esquerdo) |
|---|---|---|
| 1 | (+3,0 ; 0,0) Edric | (−3,0 ; 0,0) |
| 2 | (+3,6 ; +1,6) Grace | (−3,6 ; −1,6) |
| 3 | (+3,6 ; −1,6) reservado (meta futura) | (−3,6 ; +1,6) |

- Até **3 inimigos** por batalha; o grupo do M1 tem 2 em campo.
- **Direção do sprite:** em batalha cada personagem usa **uma só direção**: o grupo olha para a esquerda da tela (**O**, o L espelhado) e os inimigos para a direita (**L**). Isso exige que a **câmera de batalha** (07) deixe o eixo x horizontal na tela. O sprite continua com as 4 direções para a exploração.
- **Contato:** ator corpo a corpo avança até `dist_contato_tiles` = 1,1 do alvo e volta; habilidades e cura são feitas do lugar.
- Altura do palco, fundo, luz e névoa: 07/10. Câmera de batalha **fixa**; movimento só em habilidades especiais e chefe.

### 10.2 Lista de poses (para 04, 07 e 10)
Uma direção por pose (a da batalha). `q` = quadros do sprite, `evento` = evento de quadro nos metadados (04).

| Pose (id) | Quem | Loop | q @ fps | Evento | Observação |
|---|---|---|---|---|---|
| `bat_parado` | todos | sim | 4 @ 6 | — | Guarda de combate (inimigo: respira/balança) |
| `bat_avanca` | Edric, Lobo | sim | 6 @ 10 | `passo` | Correr até o alvo; também usada na fuga (espelhada) |
| `bat_ataque` | Edric, Grace, Slime, Lobo | não | 5 @ 12 | `impacto` (q3) | Edric: golpe de espada · Grace: cajado · Slime: salto/pancada · Lobo: mordida |
| `bat_ataque_forte` | Lobo | não | 6 @ 10 | `impacto` (q4) | `skill_lobo_investida` |
| `bat_habilidade` | Edric, Grace | não | 6 @ 10 | `solta_efeito` (q4) | Golpe firme (Edric) / conjurar (Grace) |
| `bat_cura` | Grace | não | 6 @ 10 | `solta_efeito` (q3) | Mãos erguidas, brilho branco-esverdeado |
| `bat_espera` | Slime | não | 4 @ 8 | — | `skill_slime_balanco` (treme e não ataca) |
| `bat_item` | Edric, Grace | não | 4 @ 8 | `usa` (q3) | Pega e usa o item |
| `bat_defender` | Edric, Grace | **mantém último quadro** | 2 @ 8 | — | Assume a guarda até o fim da rodada |
| `bat_dano` | todos | não | 2 @ 8 | — | Recuo curto |
| `bat_caido` | Edric, Grace | não (1 quadro) | 1 | — | Caído no chão (permanece) |
| `bat_morte` | Slime, Lobo | não | 4 @ 7 | — | Slime derrete · Lobo tomba; some em seguida |
| `bat_levanta` | Edric, Grace | não | 3 @ 8 | — | Volta de caído na vitória |
| `bat_vitoria` | Edric, Grace | sim | 4 @ 6 | — | Comemoração curta |

Total aproximado: Edric 11 poses, Grace 11, Slime 6, Lobo 7. Metadados: `fps`, `loop`, `evento_quadro`, âncora nos pés.

---

## 11. Encontros do M1 (Slime e Lobo)

**Proposta:** três encontros em `data/encounters/`, para testar tudo sem acrescentar custo de arte:

| Encontro | Composição | Para quê |
|---|---|---|
| `enc_slime_1` | 1 Slime | Tutorial: primeiro contato com os comandos |
| `enc_lobo_1` | 1 Lobo | Inimigo ágil: ordem de ação e Defender fazem diferença |
| `enc_misto_1` | 1 Lobo + 1 Slime | Alvos múltiplos (escolha de alvo), `skill_golpe_firme`, cura da Grace |

Gatilho no M1 (BL-008): ponto fixo do mapa para cada encontro, **sem tabela de encontros aleatórios** (13 define passos e pesos por zona depois). Cada encontro tem `pode_fugir`, `musica` e `cenario`.

---

## 12. Dados (o que vai para `data/`)

| Arquivo | Conteúdo |
|---|---|
| `data/config/cfg_batalha.json` | `rodadas_max`, `defender_mult_dano`, `prioridade_comando`, `iniciativa_variacao`, `desempate`, `caido_pos_batalha_vida`, `xp_caido_fracao`, fuga, tempos (§9), posições (§10.1), `dist_contato_tiles` |
| `data/encounters/enc_*.json` | `id`, `inimigos` (ids por slot), `pode_fugir`, `cenario`, `musica` |
| `data/enemies/enemy_slime.json`, `enemy_lobo.json` | vida, agilidade, resistências, `xp`, `ouro`, `drops`, `ia` |
| `data/characters/hero_edric.json`, `hero_grace.json` | atributos, kit (`atk_*`, `skill_*`), poses |
| `data/attacks/atk_*.json`, `skill_*.json` | `alvo_tipo`, `custo`, `mult_dano`, `atributo`, `escala`, `tipo_dano`, `prioridade`, `duracao_s`, `pose`, `fx`, `sfx` |

O 08 estende os esquemas (`inimigo`, `personagem`, `config`) e acrescenta `encontro` e `ataque`; o `npm run validar` reprova campo faltando ou fora de faixa.

### Valores iniciais (do 06: `docs/sistemas/formulas_turnos.md` §2 e §9)
| Ator | Vida | Mana | Agilidade | Defesa | Ataque (dado) | Observação |
|---|---|---|---|---|---|---|
| `hero_edric` | 100 | 14 | 6 | **[06]** | `atk_edric_golpe`: `mult_dano` × `poder_arma` 14 | `skill_golpe_firme` 4 de mana, ×1,8 |
| `hero_grace` | 70 | 29 | 5 | **[06]** | `atk_grace_cajado`: `mult_dano` × `poder_arma` 8 | `skill_cura`; mana +3 por rodada |
| `enemy_slime` | 70 | — | 3 | 3 | `atk_slime_golpe`: `dano_base` 12 | XP e ouro [06] |
| `enemy_lobo` | 90 | — | 4 | **[06]** | `atk_lobo_mordida`: `dano_base` 15; `skill_lobo_investida`: `dano_base` 22,5 | XP e ouro [06] |

Os exemplos de ordem O1–O4 usam outras agilidades só para ilustrar a regra; os dados reais são os desta tabela.

---|---|---|---|---|---|
| `hero_edric` | 140 | 45 | 10 | 12 (`corte`) | números de `formulas.md` §3 |
| `hero_grace` | 100 | 60 | 8 | 6 (`impacto`) | `skill_cura` cura 30 base |
| `enemy_slime` | 30 | — | 4 | 6 | XP e ouro [06] |
| `enemy_lobo` | 40 | — | 12 | 8 | XP e ouro [06]; vem do bestiário |

---

## 13. Testes previstos
- **Ordem:** O1–O4 (agilidade, Defender, empate de lado, empate de posição).
- **Dano e cura:** exemplos do 06 (D1–D11 adaptados) e `mult_defender`; cura limitada ao que falta; piso de 1.
- **Redirecionamento:** alvo cai antes do ato → próximo vivo; cura em quem caiu → aliado vivo de menor fração; sem alvo → `ato_falhou`.
- **Custo:** mana ou item faltando → ato falha sem cobrar; ator caído antes de agir → `ato_cancelado`.
- **Fim:** vitória e derrota checadas **após cada ato**; vitória encerra os atos restantes; `empate` em `rodadas_max`.
- **Fuga:** O5, O6, O7 e bloqueio em chefe.
- **Repetibilidade:** mesma semente → mesma batalha (IA, fuga, drops).
- **Simulação (06/09):** `modo_automatico` roda 1.000 batalhas por encontro sem travar e devolve taxa de vitória e rodadas médias.
- **Presentation:** fila de eventos tocada em modo instantâneo = mesmo resultado que animado.

---

## 14. Perguntas
**Ao usuário (via Produtor):**
1. **Fugir** entra no M1 (recomendado: sim, desligado em chefe)?
2. **Encontros** do M1: os 3 propostos (Slime sozinho, Lobo sozinho, misto)? Ou só o misto?

**Ao 06:** feito em `formulas_turnos.md` (alinhado em 2026-10-27, §11). Resta a `defesa` de Edric, Grace e Lobo.
**Ao 08:** esquemas `encontro`, `ataque`, `cfg_batalha`; PRNG com semente; fila de eventos instantânea para teste.
**Ao 07/10/15:** câmera de batalha com eixo x horizontal (§10.1); poses e HUD (BL-005/006/007); número de dano e barra de ordem.

---

## Histórico
- v0.1 (2026-10-27) — primeira versão (BL-004).
- v0.2 (2026-10-27) — alinhado ao `formulas_turnos.md` §11: fator de defesa no dano, `skill_golpe_firme` no lugar do giro, valores iniciais do 06, mana por rodada, fuga com bônus por falha, `dano_base` e `mult_dano × poder_arma`.

## Implementação (BL-008 etapa 1, 2026-10-27)
- **Motor:** `src/jogo/batalha/` (`batalha.js` controlador, `formulas.js`, `prng.js`, `politica.js` modo automático). API: `criarBatalha(dados, { encontro, semente })` → `iniciar()` → `escolher(ator, comando)` de cada herói (`voltar()` desfaz) → `executar()`; `.log` guarda os eventos; `.resultado` ao fim.
- **Dados:** `data/combate/` (`cfg_batalha`, `hero_*`, `enemy_*`, `enc_*`, `item_*`) e `data/attacks/` (`atk_*`, `skill_*`); esquemas `cfg_batalha`, `heroi_batalha`, `inimigo_batalha`, `encontro`, `item_batalha`, `acao_batalha`. Prefixo novo `enc_` aceito no validador.
- **Ferramenta:** `node tools/simular_batalha.mjs enc_misto_1 --semente=7` (registro dos eventos) ou `--lote=1000` (resumo). Testes: `tests/batalha.test.mjs`.
- **Fora da etapa 1:** ligação ao mapa, à cena e à UI (etapa 2); estados de status, chefe em fases e subida de atributos por nível (o motor só soma XP e avisa o nível).

---

## Integração (contrato) — BL-008 etapa 2a (2026-10-27)

> Quem consome: 08 (cena e laço), 13 (gatilho no mapa), 15 (UI), 05 (som), 10 (efeitos). **Código:** `src/jogo/estado_jogo.js` (ponte mundo ↔ batalha) e `src/jogo/batalha/controlador.js` (apresentação ↔ batalha); simulação pura, sem three nem DOM. **Testes:** `tests/estado_jogo.test.mjs`. A apresentação **só lê** estado e eventos e **só escreve** pelos métodos abaixo.

### A. Mundo ↔ batalha (`mundo.jogo`)
`criarMundo` cria `mundo.jogo` (`criarEstadoJogo(dados, eventos)`). O modo é `mapa | batalha | cena | game_over`; **fora de `mapa` o mundo não simula** (só `mundo.ticks` anda; herói, bonecos, câmera e relógio dia/noite ficam parados).

| Chamada | Quando | O que faz |
|---|---|---|
| `jogo.iniciarBatalha(encontroId, { semente? })` | modo `mapa` (o 13 chama no gatilho; ponto fixo no M1) | Cria o controlador com o grupo e o inventário atuais, passa a `batalha`, **já iniciado**; devolve o controlador. Sem `semente`, usa `sementeBase + contador` (a plataforma passa `sementeBase` aleatória; os testes, fixa) |
| `jogo.encerrarBatalha()` | modo `batalha`, **depois** de `controlador.fim` | Aplica ao grupo vida, mana, XP e nível finais; inventário e moedas; volta a `mapa` (ou vai a `game_over` na derrota); devolve o resultado |
| `jogo.tentarDeNovo()` | modo `game_over` | Restaura grupo, inventário e moedas do último `salvarPonto()` e volta a `mapa` |
| `jogo.salvarPonto()` | o 13, nos pontos de salvamento (no M1 vale o estado inicial) | Guarda o retorno da derrota |
| `jogo.entrarCena(id)` / `sairCena()` | o 13, nas cenas | Modo `cena` (mapa congelado) e volta |
| `jogo.depurarEncontro(id?)` | só depuração (ver D) | Dispara o próximo de `cfg_batalha.debug.encontros` (ou `id`); fora do `mapa` devolve `null` |
| `jogo.estado()` | sempre | `{ modo, grupo: { id: {vida, mana, nivel, xp} }, inventario, moedas, cena }` (cópia) |

**Resultado** (`encerrarBatalha()` e `controlador.encerrar()`): `{ resultado: 'vitoria'|'derrota'|'fuga', motivo: null|'empate', xp, moedas, itens: {item: qtd}, niveis: [{ator, de, para}], semente, rodadas, tempo_animacao_s, grupo: [{id, vida, vida_max, mana, mana_max, caido, nivel, xp}], inventario }`. `empate` (passou de `rodadas_max`) volta como `fuga` com `motivo: 'empate'`. Vitória: caído volta com 1 de vida e não recebe XP. **Fuga e empate: sem XP, moedas nem drops**; vida e mana finais valem.
**Eventos do mundo** (bus `eventos` do mundo): `modo_mudou {de, para, ...}` · `batalha_iniciada {encontro_id, semente}` · `batalha_encerrada {resultado, xp, moedas, itens, niveis, grupo}` · `ponto_restaurado {grupo, inventario, moedas}`.
**Derrota no M1:** `game_over` simples. A UI mostra "Tentar de novo" (`tentarDeNovo()`); o estado visível no game over é o da derrota; sem perda de moedas por ora (regra de morte do 06 depois).

### B. Apresentação ↔ batalha (`controlador`, devolvido por `iniciarBatalha`)
Criar direto (testes, ferramentas): `criarControladorBatalha(dados, { encontro: 'enc_*', semente, grupo?: ['hero_edric','hero_grace'], estadoGrupo?, inventario?, velocidade? })` e `iniciar()`.

| Chamada | Detalhe |
|---|---|
| `assinar(nome, fn) → cancelar()` | `nome` é um dos **25 eventos** (abaixo) ou `'*'`. Evento desconhecido lança erro. `fn` recebe `{ nome, rodada, ...campos }` |
| `esvaziarFila() → eventos[]` | Eventos ainda não consumidos, **em ordem**. A UI/cena toca a fila no seu ritmo; a simulação já terminou o ato. Inclui os do `iniciar()` |
| `enviarComando({ ator, comando, id?, alvo? })` | **Campos exatos:** `ator` = uid do herói da vez (`consultar().vez`); `comando` = `atacar` \| `habilidade` \| `item` \| `defender` \| `fugir`; `id` = `skill_*` ou `item_*` (em `atacar`, opcional: usa o ataque do kit); `alvo` = uid de um inimigo vivo (`inimigo_1`) ou de um aliado vivo (`aliado_1`); omitido, o motor escolhe o primeiro inimigo / o aliado de menor fração de vida. Devolve `{ ok: true, pronto, proximo }` ou **`{ ok: false, erro }`** (nunca lança por regra do jogo) |
| `voltar() → bool` | Desfaz a última escolha e pede de novo ao herói anterior |
| `executar() → { ok, eventos, resultado }` | Só com `pronto`; roda a rodada inteira. Sem `pronto`: `{ ok:false, erro:'comandos_incompletos' }`. `resultado` vem preenchido se a batalha acabou; senão a rodada seguinte já começou (novo `comando_pedido`) |
| `consultar()` | Ver abaixo |
| `definirVelocidade(1\|2) → bool`, `velocidade` | Opções de `cfg_batalha.velocidades_batalha`; só afeta `duracao_real_s`, `impacto_s` e `intervalo_s` dos eventos **novos** |
| `fim`, `pronto`, `rodada` | Leitura |
| `encerrar() → resultado\|null` | Resultado no formato do mundo (`null` antes do fim) |
| `abandonar()` | Depuração: termina como `fuga` agora |

**Erros de `enviarComando`:** `fase_invalida` · `nao_e_a_vez` · `comando_invalido` · `habilidade_invalida` · `item_invalido` · `sem_mana` · `sem_item` · `sem_alvo` · `nao_pode_fugir` · `alvo_invalido`. A UI deve **desabilitar** o que `consultar()` marca com `motivo`, e usar o `erro` só como rede de segurança.

**`consultar()`** devolve (sem vazar a IA):
```
{ encontro, semente, rodada, fase ('comandos'|'pronto'|'execucao'|'fim'), velocidade, pode_fugir, fim,
  vez: uid | null,                         // quem escolhe agora
  comandos: { atacar:{id,nome_txt,alvo_tipo,habilitado,motivo}, habilidade:[{id,nome_txt,custo,alvo_tipo,habilitada,motivo}],
              item:[{id,nome_txt,qtd,alvo_tipo,habilitado,motivo}], defender:{habilitado}, fugir:{habilitado,motivo} } | null,
  ordem_prevista: [uid…],                  // ordem da execução com o que o grupo já escolheu (inimigos com prioridade 0)
  escolhas: { uid: {comando,id,alvo} },    // só do grupo
  atores: [{ uid,id,nome_txt,lado,slot,posicao_cena:[x,z],vida,vida_max,mana,mana_max,defendendo,caido,nivel }],
  inventario: { item: qtd } }
```
`motivo` ∈ `sem_mana · sem_alvo · sem_item · item_invalido · nao_pode_fugir` (ou `null`). `posicao_cena` vem de `cfg_batalha.posicoes` (§10.1).

**Eventos (25):** `batalha_iniciou · rodada_iniciou · comando_pedido · comando_escolhido · execucao_iniciou · turno_iniciou · ato_executado · dano · curou · mana_gasta · item_usado · defendeu · fuga_tentada · ato_falhou · ato_cancelado · caiu · vida_mudou · mana_mudou · fase_mudou · rodada_terminou · venceu · perdeu · fugiu · empate · batalha_terminou`. Campos como no §8. `ato_executado` ganha, para a apresentação: `duracao_real_s` (= `duracao_s` ÷ velocidade), `impacto_s` (= `duracao_real_s` × `fracao_impacto`, o instante em que tocam `dano`/`curou` do ato) e `intervalo_s` (respiro antes do próximo ato) e `pose` (a pose do ator). Os eventos de resultado (`dano`, `curou`, `vida_mudou`, `caiu`, `mana_*`) vêm **logo depois** do `ato_executado` que os causou e pertencem a ele.

**Roteiro da apresentação (cada quadro):**
1. `esvaziarFila()`; tocar os eventos em ordem (um ato por vez: pose do ator, esperar `impacto_s`, aplicar `dano`/`curou`/`vida_mudou`/`caiu`, esperar o resto de `duracao_real_s` + `intervalo_s`).
2. Com a fila vazia e `consultar().vez` ≠ `null`: abrir o menu do herói; ao confirmar, `enviarComando`; `cancelar` chama `voltar()`.
3. Quando `pronto`: `executar()`; voltar ao passo 1. Ao `fim`: tocar `venceu`/`perdeu`/`fugiu`, mostrar a recompensa e chamar `jogo.encerrarBatalha()`.
A UI **não** chama `executar()` enquanto ainda toca a fila anterior (é ela que dá o ritmo; nos testes e na simulação a fila é consumida de uma vez).

### C. Dados novos
`cfg_batalha`: `fracao_impacto` (0,45) e `debug: { tecla_proximo_encontro: 'BracketRight', encontros: [enc_slime_1, enc_lobo_1, enc_misto_1] }`.

### D. Gancho de depuração para o 08 (sem tocar o motor)
Disparar um encontro por tecla, sem o gatilho do mapa: no tratamento das teclas de debug de `src/plataforma/principal.js`, quando `e.code === dados.config.batalha.debug.tecla_proximo_encontro` (`BracketRight`; só no build de desenvolvimento, como as demais teclas de debug), chamar `const c = mundo.jogo.depurarEncontro()`. Se `c` não for `null`, a cena de batalha liga ao controlador `c` (passos 1–3 acima). Ao `c.fim`, chamar `mundo.jogo.encerrarBatalha()`; na derrota, `mundo.jogo.tentarDeNovo()` depois do "Tentar de novo". Cada pressionar avança para o próximo encontro da lista. O laço do mundo já congela a exploração nos modos ≠ `mapa`; a plataforma só precisa **desenhar a cena de batalha quando `mundo.jogo.modo === 'batalha'`** e a de mapa nos demais.

### Inimigo sem ações e encontro de treino (v0.1.2b)
- **Inimigo sem ações** (`ia: []`, ex.: `enemy_boneco_treino`): a cada rodada passa a vez, sempre por último (agilidade 0), sem erro. O ato sai como `ato_executado` com `tipo: 'passar'`, `alvos: []`, `motivo: 'sem_acoes'`, `nome_txt` do inimigo e `msg_txt` = `cfg_batalha.msg_nao_faz_nada_txt` (`ui_batalha_nao_faz_nada`: "{nome} não faz nada."), `duracao_s` = `t_intervalo_ato`. A UI mostra a mensagem e não anima o inimigo.
- **Encontro de treino** (`enc_*` com `"treino": true`): vitória **sem XP, moedas nem drops** (mesmo que a ficha do inimigo tenha); ao fim (vitória, fuga ou empate) o grupo volta com **PV/PM cheios, ninguém caído e o estoque de itens como era no início**; derrota, se um dia acontecer, vira `fugiu` (nunca game over). `venceu`, `batalha_terminou` e o resultado do mundo trazem `treino: true`; o estado do jogo não muda (XP, nível, moedas e inventário iguais), então o treino se repete sem limite. Cada batalha recria o boneco com a vida cheia.
- **Dados:** `data/combate/enemy_boneco_treino.json` (200 PV, defesa 1, agilidade 0, `treino: true`, xp/moedas/drops zerados) e `data/combate/enc_boneco_treino.json` (1 inimigo, `treino: true`); o validador exige a coerência (inimigo de treino zerado; encontro com ele marcado como treino). **Valores do 03 só para destravar: o 06 ajusta a ficha.** O `cenario` do treino ainda é o do campo (`cen_campo_baixo_orvalho`); se o pátio do Torvan tiver cenário próprio, o 07/13 trocam no dado.

