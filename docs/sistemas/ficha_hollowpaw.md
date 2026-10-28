# Ficha do chefe — Hollowpaw (`boss_urso_musgo`)

> **Dono:** 06 Design de Combate e Classes · **Status:** RASCUNHO v0.1 (BL-021, parte 06) · 2026-10-28
> Combate por turnos (D-028, D-031). Fórmulas: `formulas_turnos.md`; regras e IA: `docs/combate_turnos.md` (03). Papel e aparência: `docs/narrativa/personagens/boss_urso_musgo.md` (02). Números **de referência**: a simulação ajusta uma alavanca por vez.
> **O motor atual (`src/jogo/batalha`) ainda não tem fases nem aviso de chefe.** Os dados abaixo estão prontos; as 4 mudanças de motor estão na §8. Enquanto isso, o chefe fica em `data/propostas/hollowpaw/` e não é carregado pelo jogo.

## 1. Papel na história
Guardião involuntário da caverna e espelho do Edric: um urso solitário que guarda o sino de cobre (o da aldeia do herói) como um brinquedo, dominado aos poucos pela aura sombria do sino. Não é vilão: na fase 3 a aura se desprende, ele olha para o grupo e **morre** (D-018) tentando alcançar o sino. O nome vem de "pata oca"; tom melancólico, sem humor na luta.

## 2. Premissas do grupo
**Nível 3 (declarado)**: de 403 a 981 XP acumulados, ou 20 a 50 batalhas de ~20 XP, o que supõe passar boa parte da região antes da caverna; sem equipamento novo; 2 poções de ervas no inventário. O crescimento por nível ainda não está nos dados do motor; os números vêm de `formulas_turnos.md` §2:

| | Edric | Grace |
|---|---|---|
| Vigor · Força · Destreza · Mente | 11 · 12 · 8 · 5 | 6 · 4 · 7 · 12 |
| Vida · Mana | **140 · 20** | **90 · 41** |
| Defesa · Agilidade · Mana por rodada | **13 · 8 · +2** | **7 · 7 · +4** |
| Dano contra o chefe (fases 1–2 · fase 3) | Atacar **21 · 22** · Golpe Firme **37 · 39** | Atacar **9 · 9** · Mão Boa cura **22** |

## 3. Atributos do chefe
| Vida | Mana | Força | Mente | Defesa | Agilidade | Resistências |
|---|---|---|---|---|---|---|
| **420** | — | 12 | — | **8** (fase 3: **4**) | **6** (fases 2 e 3: **9**) | nenhuma |

- **Resistências:** o sistema já as suporta, mas o M1 só tem golpes de `corte` (Edric) e `impacto` (Grace); ficam vazias. Quando houver elementos, a sugestão é fraqueza a `elem_1` (fogo), que seca o musgo.
- **Agilidade:** na fase 1 ele age por último (6 < 7 e 8); da fase 2 em diante age **antes** do grupo (9), exceto contra quem usar **Defender** (prioridade +1). É a "velocidade maior" que o 02 pediu.
- **Defesa menor na fase 3:** a "janela de dano maior" do 02.
- Papel: `pesado` (esquema atual não tem `chefe`). `pode_fugir` = não.

## 4. Fases (por fração de vida; mudam no fim do ato, evento `fase_mudou`)
| Fase | Entra com vida ≤ | Em pontos de vida | Nome (texto) | O que muda |
|---|---|---|---|---|
| 1 · Território | 100 % | 420 | `txt_boss_hollowpaw_fase1_nome` | Golpes simples e o primeiro aviso de golpe pesado |
| 2 · Posse | 66 % | 277 | `…fase2_nome` | Agilidade 6 → **9**; entram os **Estilhaços** (área); texto `…transicao_2` |
| 3 · Verdade | 33 % | 138 | `…fase3_nome` | Defesa 8 → **4**; entra **Hesita** (perde o turno); mais avisos; texto `…transicao_3` |

## 5. Ações (todas em `data/attacks/`; dano pela fórmula de `formulas_turnos.md` §3, força 12, Normal)

| ID | Alvo | Base · tipo | Dano em Edric · Grace | Defendendo | Fases | Papel |
|---|---|---|---|---|---|---|
| `atk_hollowpaw_pancada` | 1 herói | 22 · `impacto` | **31 · 33** | 16 · 16 | 1–3 | pressão normal; pune o frágil |
| `skill_hollowpaw_varrida` | todo o grupo | 12 · `corte` | **17 · 18** | 8 · 9 | 1–2 | dano leve em área |
| `skill_hollowpaw_estilhacos` | todo o grupo | 13 · `perfuracao` | **18 · 19** | 9 · 10 | 2–3 | área recorrente (cristais) |
| `skill_hollowpaw_ergue` | si | — (passa o turno) | — | — | 1–3 | **AVISO** do golpe pesado |
| `skill_hollowpaw_desaba` | todo o grupo | 30 · `impacto` | **42 · 45** | **21 · 22** | 1–3 | golpe pesado: **sempre** logo depois do aviso |
| `skill_hollowpaw_hesita` | si | — (passa o turno) | — | — | 3 | respiro e melancolia |

### Aviso de golpe forte (telegraph em turnos)
1. Na rodada N ele usa **Ergue a pata** (texto `txt_boss_hollowpaw_aviso_desaba` na tela, pose de espera, sem dano).
2. Na rodada N+1 ele usa **Desabamento**, **sempre**, em todo o grupo (ação forçada; a IA não sorteia).
3. O jogador sabe disso já na rodada N+1, ao escolher comandos. Respostas: **Defender** (age primeiro, dano 21/22 em vez de 42/45), **curar antes** quem está abaixo de ~50 %, ou aceitar o dano com vida alta. Dois **Defender** custam a rodada de ataque; um **Defender** e uma **Mão Boa** é o meio-termo.
4. Depois do Desabamento ele nunca ergue a pata de novo na rodada seguinte (descanso mínimo de uma rodada).

## 6. Decisão de IA (determinística por semente, para o 03)
Escolhe 1 ação por rodada, no início dela, entre as válidas, por peso; se existir uma opção `forcar` válida, ela vale sozinha. Condições novas: `apos_acao` (só se a última ação dele foi X), `nao_apos_acao` (não se a última foi X), `rodada_min`.

| Ação | Fase 1 | Fase 2 | Fase 3 | Alvo |
|---|---|---|---|---|
| `atk_hollowpaw_pancada` | 55 | 35 | 25 | fases 1–2 `misto` (50 % no de menor vida); fase 3 `menor_vida` |
| `skill_hollowpaw_varrida` | 25 | 10 | — | todos |
| `skill_hollowpaw_estilhacos` | — | 30 | 25 | todos |
| `skill_hollowpaw_ergue` | 20 (só a partir da rodada 2; `nao_apos_acao` desaba) | 25 | 30 | si |
| `skill_hollowpaw_hesita` | — | — | 20 | si |
| `skill_hollowpaw_desaba` | forçada após `ergue` | idem | idem | todos |

## 7. Recompensas
XP **120** (para cada vivo ao fim; o nível 3 → 4 pede 580); moedas **60**; drop `item_pocao_ervas` ×2 (chance 1). O **sino de cobre** (`item_sino_antigo`) é item de missão (`flag_sino_recolhido`, 13), não drop. A cena de morte e o memento das armaduras vêm depois da vitória (13/07); nada disso é combate.

## 8. Mudanças de motor pedidas ao 03 (sem tocar em `src/` aqui; já testadas numa cópia no scratchpad)
1. **Fases:** `fases[]` (vida_fracao_max decrescente, `ia`, e opcionais `agilidade`, `defesa`, `transicao_txt`) no lugar de `ia`; após cada ato, se a fração de vida cruzou o limite, troca a fase, aplica os overrides e emite `fase_mudou` (já existe na lista de eventos). Pode pular duas fases num ato.
2. **Condições de IA:** `apos_acao` e `nao_apos_acao` (guardar `ultima_acao` do ator, gravada na escolha) além de `rodada_min`.
3. **Ação forçada:** `forcar: true` numa opção válida ignora os pesos.
4. **Aviso:** `anuncio_txt` na opção de IA vira campo do evento `ato_executado` para a UI mostrar a frase.
5. **Esquemas e registro (08):** aceitar `boss_` em `inimigo_batalha` e em `encontro.inimigos` (ou usar o esquema proposto `chefe_batalha.schema.json`), e registrar `boss_*.json` em `tools/lib/dados.mjs`.

## 9. Duração-alvo e teste de aceitação
**Alvo:** 10 a 15 rodadas, ~2 a 2,5 min (≈ 40 s de animação + comandos). Taxa de vitória: **80–90 % para quem usa Defender no aviso e cura**, **15–30 % para quem ignora o aviso** (a derrota é possível), e o nível importa muito (nível 2 quase não vence, nível 4 vence quase sempre).

**Simulação** (cópia do motor com fases no scratchpad; 3.000 batalhas, nível 3, 2 poções; Edric usa Golpe Firme com mana, Grace cura abaixo de 50 %):

| Política | Vitória | Rodadas | Vida do grupo no fim | Heróis caídos por batalha |
|---|---|---|---|---|
| **simples** (nunca defende; é o `decidirSimples` do 03) | **21 %** | 10,0 | 13 % | 1,7 |
| **informada** (Defender no aviso, cura abaixo de 55 %, poção abaixo de 30 %) | **86 %** | 14,8 | 27 % | 0,8 |

Variações da informada: **nível 2: 21 %** · **nível 4: 100 %** · **sem poção: 53 %** · **4 poções: 89 %**. Fase 2 começa por volta da rodada 4–5 e a fase 3 por volta da 9.
**Invariantes** (1.000 batalhas): todo Desabamento vem logo depois de Ergue a pata; nunca há Ergue depois de Desabamento; fases 2 e 3 acontecem nessa ordem.

**Quando o 03 implementar o §8, os testes de aceitação serão:** (a) invariantes acima; (b) exemplos da §5 (31, 33, 16, 17, 18, 42, 45, 21, 22, 18, 19; Edric 21/37 e 22/39 na fase 3; Grace 9; cura 22); (c) mesma semente = mesmo registro; (d) `fugir` recusado; (e) `node tools/simular_batalha.mjs enc_hollowpaw --lote=2000` com o grupo no nível 3: política simples entre 15 e 30 %, informada entre 80 e 90 %, rodadas entre 10 e 16. Os scripts de simulação do 06 passam para `tools/simulacoes/` nesse momento.

## 10. Decisões criativas em aberto (você decide; adotei a 1ª opção para simular)
1. **O que ele faz na fase 3?**
   - **A (adotada, recomendada):** ataques mais fortes, defesa menor e uma ação **Hesita** (20 %) em que ele perde o turno olhando o sino. Dá fôlego ao jogador e conta a melancolia sem texto.
   - **B:** pressão total, sem Hesita. Mais tensa, mais difícil (derruba a vitória informada para ~75 %).
   - **C:** na fase 3 ele para de atacar quando chega a 10 % de vida e a luta termina com um comando especial "acabar com o sofrimento". Mais emocional, mas exige comando novo e cena (fora do M1).
2. **O jogador pode tentar poupar o Hollowpaw?** O D-018 diz que ele morre. Opção: manter a morte automática (recomendado, sem custo) ou, depois do M1, uma escolha na cena (13/02) sem efeito no combate.
3. **Nome na tela:** os textos usam "Hollowpaw" literal (D-021). Se o nome mudar, trocar nos textos (`txt_boss_*`), não nos dados.

## 11. Arquivos
- `data/attacks/atk_hollowpaw_pancada.json`, `skill_hollowpaw_{varrida,estilhacos,ergue,desaba,hesita}.json` — **válidos hoje** (esquema `acao_batalha`).
- `data/texts/pt-BR.json` — 16 chaves novas `txt_boss_*`, `txt_enc_hollowpaw_nome`, `txt_*_hollowpaw_*` (provisórias, 02 revisa o tom).
- `data/propostas/hollowpaw/boss_urso_musgo.json`, `enc_hollowpaw.json`, `chefe_batalha.schema.json` — proposta; o chefe validou contra o esquema proposto (ações, textos e fases existem). Não entram em `npm run validar` até o 08 registrar.

## Histórico
| Data | Mudança | Motivo |
|---|---|---|
| 2026-10-28 | Criação | BL-021 |
| 2026-10-28 | Dano base de pancada 16 → 22, varrida 9 → 12, desaba 22 → 30, estilhaços 10 → 13 | A 1ª simulação dava 97 % de vitória para quem nunca defende; o aviso não pesava |
