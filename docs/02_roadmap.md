# Roadmap

> Mantido pelo Produtor (01). Avança-se de marco só com critérios atendidos **ou** riscos aceitos pelo usuário (registrados em `04_decisoes.md`).

| Marco | Entrega | Pronto quando | Status |
|---|---|---|---|
| **M0 Fundação** | Bíblia, guia visual (10), spec técnica + ADR-001 (08), mundo base (02), lista de assets | Usuário aprovou | **em andamento** |
| **M1 Protótipo cinza** | Herói se move e ataca numa sala 3D cinza com luz e câmera | Sensação aprovada em playtest | — |
| **M2 Cena-modelo** | 1 cena com herói, 1 inimigo, cenário final, luz e efeitos | O "diorama" convence e roda a 60 fps | — |
| **M3 Vertical slice** | Vila + região + masmorra + chefe, com som e história | Jogável do início ao fim sem erro grave | — |
| **M4 Polimento** | Game feel, áudio final, UI, tutorial, acessibilidade, inglês | Checklist de polimento ok | — |
| **M5 Beta** | QA completo, balanceamento, navegadores testados | Zero bug crítico | — |
| **M6 Lançamento** | Versão publicada | Testada fora do ambiente de desenvolvimento | — |

## M0 — tarefas e ordem

| # | Tarefa | Dono | Depende de | Status |
|---|---|---|---|---|
| 0 | Aviso de abertura aos 9 agentes (ler instrução + Bíblia, aguardar briefing) | 01 | — | ✅ 9/9 confirmaram (2026-10-24); respostas em D-004–D-006 |
| 1 | Bíblia do Projeto v1 aprovada (premissa, pilares) | 01 + usuário | premissa do usuário | ✅ aprovada 2026-10-24 (nome ainda provisório) |
| 2 | Spikes técnicos + ADR-001 (stack) + esqueleto que roda no navegador | 08 | 1 | planejado |
| 3 | Guia visual: paleta mestra, escala, luz, pós | 10 | 1 | planejado |
| 4 | Mundo base: região, vila, herói, antagonista, missão principal | 02 | 1 | planejado |
| 5 | Lista de assets do slice com donos | 01 | 3, 4 | planejado |
| 6 | Revisão de consistência M0 + aprovação | 01 + usuário | 2–5 | planejado |

Itens 2, 3 e 4 podem correr em paralelo depois da Bíblia aprovada.

## Onda 0 — trabalho que não depende da premissa (liberada pelo usuário em 2026-10-24)

| BRF | Agente | Entrega | Status |
|---|---|---|---|
| [BRF-001](briefings/BRF-001_arquiteto_spikes-adr001.md) | 08 Arquiteto | Spikes + ADR-001 (proposto) | enviado |
| [BRF-002](briefings/BRF-002_diretor-arte_guia-visual-etapa1.md) | 10 Diretor de Arte | Guia visual etapa 1 + direções de clima + paleta provisória | ✅ validado |
| [BRF-003](briefings/BRF-003_jogabilidade_gameplay-rascunho.md) | 03 Jogabilidade | `docs/gameplay.md` v0.1 | ✅ validado (v0.2 entregue) |
| [BRF-004](briefings/BRF-004_sistemas_formulas-metricas.md) | 06 Sistemas | `formulas.md` + `metricas.md` | ✅ validado |
| [BRF-005](briefings/BRF-005_cenario_inventario-ui.md) | 07 Cenario | Inventário de telas + controles/acessibilidade | ✅ validado |
| [BRF-006](briefings/BRF-006_qa_plano-testes.md) | 09 QA | Plano de testes + critérios por marco + roteiro M1 | ✅ validado |
