# Casos de unidade derivados de `formulas.md` (TC-FRM)

> **Status:** RASCUNHO v0.1 · Dono: 09 QA · 2026-10-24 · Fonte: `docs/sistemas/formulas.md` v0.1 (06). Critério: M1-22b.
> Cada linha é um caso de teste automático de **função pura** (entrada → saída), sem render. O 03 implementa; o 09 confere os resultados e os arredondamentos. A execução depende do executor de testes [aguarda 08].
> Convenção: `arred(x) = piso(x + 0,5)` (formulas §0), com tolerância de ponto flutuante.
> Conferi a aritmética de todos os exemplos abaixo à mão: todos fecham com o texto do 06.

| Marco | Significado |
|---|---|
| **M1** | pode e deve rodar no protótipo cinza |
| **M2+** | a função existe nos dados, mas o conteúdo que a usa só aparece depois |

## Dano (formulas §4.2)
| ID | Origem | Entrada | Esperado | Marco |
|---|---|---|---|---|
| TC-FRM-001 | D1 | `atk_hero_leve_1`, destreza 5, resist 0 | 13 | M1 |
| TC-FRM-002 | D2 | `atk_hero_leve_3`, destreza 5 | 20 | M1 |
| TC-FRM-003 | D3 | `atk_hero_forte`, força 5 | 33 | M1 |
| TC-FRM-004 | D4 | forte, força 15, resist 0,25 | 29 (29,25) | M1 |
| TC-FRM-005 | D5 | `skill_disparo`, mente 12, resist −0,5 | 27 (26,784) | M1 (função pura; 03 §13) |
| TC-FRM-006 | D6 | dano base 1, escala 0, resist 0,75 | 1 (piso) | M1 |
| TC-FRM-007 | D7 | golpe de `enemy_boneco_golpe`, base 18, Normal | 18 | M1 |
| TC-FRM-008 | D8 | D7 com `mult_dano_recebido` 0,6 | 11 (10,8) | M1 (função pura; multiplicador de dificuldade ainda não decidido) |
| TC-FRM-009 | D9 | D1 pelas costas + alvo Quebrado | 25 (24,75) | M2+ |
| TC-FRM-010 | D10 | D1 com buffs ×4,0 (limitado a 3,0) | 40 (39,6) | M1 (teto) |
| TC-FRM-011 | D11 | alvo imune ao tipo | 0 (sem piso) | M1 |
| TC-FRM-012 | §4.3 | combo leve completo nível 1 | 13 + 13 + 20 = 46 | M1 |
| TC-FRM-013 | §4.1 | mesma entrada 100× | mesmo resultado (sem aleatoriedade, sem crítico) | M1 |

## Recursos (formulas §3)
| ID | Origem | Entrada | Esperado | Marco |
|---|---|---|---|---|
| TC-FRM-020 | V1 | vigor 5 | `vida_max` 140 | M1 |
| TC-FRM-021 | V2 | vigor 20, item +30 | 350 | M2+ |
| TC-FRM-022 | M1–M3 | mente 5 / 15 / 20 | mana 45 / 95; regen 0,75 e 1,5 por s | M2+ |
| TC-FRM-023 | F1, F2 | destreza 5 / 20 | `folego_max` 100 / 130 | M1 |
| TC-FRM-024 | F3 | gasto 25, não exausto | cheio em 68 quadros | M1 |
| TC-FRM-025 | F4 | gasto 100, exausto | 210 quadros | M1 |
| TC-FRM-026 | §3.3 | 5 esquivas seguidas (custo 25) com 100 | 4 saem, a 5ª não | M1 |
| TC-FRM-029 | F5 | `atk_hero_forte` (custo 20) com fôlego 100 | fôlego 80; volta a 100 em 30 + 30 = 60 quadros | M1 |
| TC-FRM-060 | F6 | fôlego 24 e `esquivar` (custo 25); depois fôlego 25 | com 24: não sai, não gasta, fica no buffer até expirar; com 25: sai e deixa 0 (exausto) | M1 |
| TC-FRM-061 | F7 | 4 esquivas seguidas (100 → 0, exausto), regeneração até 25 | a 5ª só sai 60 + 38 = 98 quadros depois do último gasto (≈ 1,6 s) | M1 |
| TC-FRM-027 | 03 §4.4 | ação sem fôlego suficiente (esquiva ou forte) | não executa, não gasta, fica no buffer até expirar e emite `sem_folego` | M1 |
| TC-FRM-028 | 03 §4.4 | `folego_custo_ativo` = não | nenhum gasto de fôlego | M1 |

## Esquiva e aviso (formulas §6)
| ID | Origem | Entrada | Esperado | Marco |
|---|---|---|---|---|
| TC-FRM-030 | J1 | `mult_janela_esquiva` 1,0 | fim 10 (quadros 2–10) | M1 |
| TC-FRM-031 | J2 | 1,3 | fim 13 | M1 (função pura) |
| TC-FRM-032 | J3 | 0,8 | fim 8 | M1 (função pura) |
| TC-FRM-033 | J4 | 2,5 | fim 18 (teto) | M1 (teto) |
| TC-FRM-034 | §6.2 | multiplicador muito baixo | janela nunca < 4 quadros (piso) | M1 |
| TC-FRM-035 | W1 | comum, base 24, ×1,0 | 24 | M1 |
| TC-FRM-036 | W2 | comum, base 24, ×1,25 | 30 | M2+ |
| TC-FRM-037 | W3 | forte, base 40, ×0,8 | 36 (piso da categoria) | M2+ |
| TC-FRM-038 | W4 | comum, base 30, ×0,8 | 24 | M2+ |
| TC-FRM-039 | §6.3 | qualquer ataque inimigo dos dados | aviso ≥ mínimo da categoria (18/36/60) | M1 (boneco), M3 (todos) |

## Postura, recuo, estados (formulas §5, §7)
| ID | Origem | Entrada | Esperado | Marco |
|---|---|---|---|---|
| TC-FRM-040 | P1–P4 | postura de leve 10, forte 30, forte pelas costas, investida (impacto) | 10 · 30 · 45 · 38 | M2+ |
| TC-FRM-041 | K1–K3 | `atk_hero_leve_3` (recuo 0,6; atord. 24) com `resist_recuo` 0 / 0,5 / 1,0 | recuo 0,6 · 0,3 · 0; atordoamento 24 · 12 · 0 (0 = não entra em DANO) | M1 (`enemy_boneco_alvo` precisa de `resist_recuo`) |
| TC-FRM-042 | A1–A3 | acúmulo 35 com resist 0 / 0,4 / −0,5 | dispara no 3º · 5º · 2º golpe | M2+ |
| TC-FRM-043 | T1–T5 | queimando e envenenado (formulas §5.3) | 3 · 2 · 3 · 2 · 1 por tique | M2+ |

## Recargas, cura, progressão (formulas §8–§10)
| ID | Origem | Entrada | Esperado | Marco |
|---|---|---|---|---|
| TC-FRM-050 | R1–R3 | recarga 8 s, redução 0 / 25 / 100 | 480 · 384 · 240 quadros | M2+ |
| TC-FRM-051 | H1–H4 | cura (poção 50; envenenado; habilidade; vida quase cheia) | 50 · 35 · 34 · vida_curada 20 | M2+ |
| TC-FRM-052 | §10.1 | `xp_para_nivel` n = 1…9 | 100, 303, 580, 919, 1313, 1758, 2250, 2786, 3363; soma 13372 | M2+ |
| TC-FRM-053 | §12 | erros até morrer, vida 140, golpe 18 | 8 golpes (140 → 14 → morte no 8º) | M1 (junto de M1-15h) |

## Encadeamento no jogo (integração, não só função)
| ID | O que prova | Esperado | Marco |
|---|---|---|---|
| TC-INT-001 | Pipeline na ordem do 03 §5.7 | Eventos `golpe_acertou` → `dano` → `estado_mudou` na ordem; um acerto por alvo por golpe | M1 |
| TC-INT-002 | Dano do herói no `enemy_boneco_alvo` | Contador F10 bate com TC-FRM-001…003 e 012 | M1 |
| TC-INT-003 | Dano do `enemy_boneco_golpe` no herói | 18 por acerto; vida do debug bate com TC-FRM-020 e 053 | M1 |

## Observações do QA sobre os documentos 03/06 (para o Produtor repassar)
Todas respondidas pelo 03 no `gameplay.md` v0.2 (D-010):
1. **Alcance:** medido da origem do golpe até a **borda** da hurtbox do alvo; `enemy_boneco_alvo` com hurtbox de raio 0,40 (a confirmar pelo 06 nas métricas). Aplicado no M1-15b.
2. **Reinício:** ≤ 3 s (`reinicio_apos_morte_max_s`). Aplicado no M1-15h.
3. **Fôlego:** entra no M1 (item 14b). M1-15i passou a obrigatório; TC-FRM-023…029, 060 e 061 são M1.
4. **Mana por acerto:** só com `concede_mana = sim`; sem efeito no M1. Falta o 06 trocar a frase em `formulas.md` §3.2 (pedido nº 5 do 03).
5. **Parede bloqueia golpe:** item 14c, coberto pelo M1-15j.
6. Confirmado em `metricas.md` §8.3: `enemy_boneco_alvo` com hurtbox de raio 0,40 e altura 0,0–1,4, `concede_mana` = não; `enemy_boneco_golpe` com dano base 18 do tipo `impacto`. Mana por acerto em `formulas.md` §3.2 agora usa `concede_mana`. **Resta:** o raio de hurtbox do `enemy_boneco_golpe` não está escrito nas métricas (só o do alvo); o M1-15d2 e o M1-15h não dependem dele, mas o teste de alcance contra esse boneco, se houver, sim.
5. **Nenhum erro aritmético** encontrado nos cerca de 60 exemplos resolvidos de formulas.md (D, V, M, F, J, W, P, K, A, T, R, H e a tabela de XP).
