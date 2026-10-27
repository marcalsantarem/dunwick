# Roadmap

> Mantido pelo Produtor (01). Avança-se de marco só com critérios atendidos **ou** riscos aceitos pelo usuário (registrados em `04_decisoes.md`).

| Marco | Entrega | Pronto quando | Status |
|---|---|---|---|
| **M0 Fundação** | Bíblia, guia visual (10), spec técnica + ADR-001 (08), mundo base (02), lista de assets | Usuário aprovou | **quase concluído** (faltam lista de assets e revisão final; proposta: lista de assets passa ao M2, BL-018) |
| **M1 Protótipo de batalha** | Mapa isométrico (esqueleto aprovado, D-027) + **uma batalha por turnos jogável**: Edric + Grace contra 1 inimigo comum, entrando pelo mapa e voltando a ele (D-028, D-031) | Batalha jogável do início ao fim no navegador (vitória e derrota), testes e build passando, sensação aprovada pelo usuário em playtest | **próximo** (Onda 1 proposta) |
| **M2 Cena-modelo** | 1 cena de batalha e 1 trecho do mapa com arte final: Edric e Grace, 1 inimigo, cenário, luz, efeitos, UI e som de golpes | O "diorama" convence o usuário e roda a 60 fps na máquina de referência | — |
| **M3 Vertical slice** | Vila (3 estados) + região + masmorra + Hollowpaw, 5 inimigos, encontros aleatórios, missões, save, som e história | Jogável do início ao fim sem erro grave | — |
| **M4 Polimento** | Game feel, áudio final, UI, tutorial, acessibilidade, inglês | Checklist de polimento ok | — |
| **M5 Beta** | QA completo, balanceamento, navegadores testados | Zero bug crítico | — |
| **M6 Lançamento** | Versão publicada | Testada fora do ambiente de desenvolvimento | — |

## M0 — tarefas e ordem

| # | Tarefa | Dono | Depende de | Status |
|---|---|---|---|---|
| 0 | Aviso de abertura aos 9 agentes (ler instrução + Bíblia, aguardar briefing) | 01 | — | ✅ 9/9 confirmaram (2026-10-24); respostas em D-004–D-006 |
| 1 | Bíblia do Projeto v1 aprovada (premissa, pilares) | 01 + usuário | premissa do usuário | ✅ aprovada 2026-10-24 (nome ainda provisório) |
| 2 | Spikes técnicos + ADR-001 (stack) + esqueleto que roda no navegador | 08 | 1 | ✅ D-016, D-027 |
| 3 | Guia visual: paleta mestra, escala, luz, pós | 10 | 1 | ✅ etapa 1 (D-008) |
| 4 | Mundo base: região, vila, herói, antagonista, missão principal | 02 | 1 | ✅ D-013 a D-023 |
| 5 | Lista de assets do slice com donos | 01 | 3, 4 | planejado |
| 6 | Revisão de consistência M0 + aprovação | 01 + usuário | 2–5 | planejado |

Itens 2, 3 e 4 podem correr em paralelo depois da Bíblia aprovada.

## M1 — Onda 1 (proposta pelo 11, 2026-10-27)

Combate por turnos (D-028/D-031). Critérios de pronto e custos em [03_backlog.md](03_backlog.md); quadro em [05_quadro.md](05_quadro.md).

| Ordem | ID | Tarefa | Dono (apoio) | Custo |
|---|---|---|---|---|
| 1 | BL-004 | Especificação do combate por turnos do M1 | 03 (06) | M |
| 2 | BL-005 | UI de batalha | 15 (10) | M |
| 2 | BL-006 | Cena de batalha 3D | 07 (10) | M |
| 2 | BL-007 | Poses de batalha do Edric | 04 (10) | M |
| 3 | BL-008 | Controlador de batalha + transição mundo ↔ batalha | 03 (13, 08) | G |

Onda 2 (fecha o M1): Grace (BL-009), inimigo do M1 (BL-010), playtest (BL-011).

## Onda 0 — trabalho que não depende da premissa (liberada pelo usuário em 2026-10-24)

| BRF | Agente | Entrega | Status |
|---|---|---|---|
| [BRF-001](briefings/BRF-001_arquiteto_spikes-adr001.md) | 08 Arquiteto | Spikes + ADR-001 (proposto) | enviado |
| [BRF-002](briefings/BRF-002_diretor-arte_guia-visual-etapa1.md) | 10 Diretor de Arte | Guia visual etapa 1 + direções de clima + paleta provisória | ✅ validado |
| [BRF-003](briefings/BRF-003_jogabilidade_gameplay-rascunho.md) | 03 Jogabilidade | `docs/gameplay.md` v0.1 | ✅ validado (v0.2 entregue) |
| [BRF-004](briefings/BRF-004_sistemas_formulas-metricas.md) | 06 Sistemas | `formulas.md` + `metricas.md` | ✅ validado |
| [BRF-005](briefings/BRF-005_cenario_inventario-ui.md) | 07 Cenario | Inventário de telas + controles/acessibilidade | ✅ validado |
| [BRF-006](briefings/BRF-006_qa_plano-testes.md) | 09 QA | Plano de testes + critérios por marco + roteiro M1 | ✅ validado |
