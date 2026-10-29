# Roadmap

> Mantido pelo Produtor (01). Avança-se de marco só com critérios atendidos **ou** riscos aceitos pelo usuário (registrados em `04_decisoes.md`).

| Marco | Entrega | Pronto quando | Status |
|---|---|---|---|
| **M0 Fundação** | Bíblia, guia visual (10), spec técnica + ADR-001 (08), mundo base (02), lista de assets | Usuário aprovou | **quase concluído** (faltam lista de assets e revisão final; proposta: lista de assets passa ao M2, BL-018) |
| **M1 Protótipo de batalha** | Mapa isométrico (esqueleto aprovado, D-027) + **uma batalha por turnos jogável**: Edric + Grace contra 1 inimigo comum, entrando pelo mapa e voltando a ele (D-028, D-031) | Batalha jogável do início ao fim no navegador (vitória e derrota), testes e build passando, sensação aprovada pelo usuário em playtest | **próximo** (Onda 1 proposta) |
| **Demo v0.1.1–v0.1.8** | Recorte jogável (~30 min) do slice, em versões pequenas (D-034) | v0.1.8: jogável da vila ao Hollowpaw sem erro grave | **definida** (seção abaixo) |
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

## Demo jogável — versões v0.1.x (D-034, 2026-10-28)

Recorte do slice para ter algo jogável antes dele: **cerca de 30 minutos**, da vila ao Hollowpaw. Cada versão fecha com **um pull request `dev → main`** (o usuário aprova) e uma **tag**. A arte final (M2) vem **depois** da demo (D-037); a demo usa a arte do esqueleto.

| Versão | Entrega (pedido do usuário) | Requisitos técnicos obrigatórios (incluídos pelo Produtor) | Dono principal |
|---|---|---|---|
| **v0.1.0** | Como está na `main` hoje (esqueleto) | — | ✅ |
| **v0.1.1** | Batalha por turnos básica como está, **após o usuário validar** | Correção do bug de produção (UI em encontro por passos) conferida no Netlify; `test:navegador` cobrindo encontro natural; README e CHANGELOG (BL-014) atualizados | 01, 08, 09 |
| **v0.1.2** | Resto do mapa da vila (com **interiores**, D-041) · **minimapa girado** (etapa 2, depois do mapa, D-042) | Mapa da vila em dados (14); **troca de mapa por portal** (porta ↔ interior), vários mapas carregáveis (08); interiores simples da Maren, taverna, forja, Torvan e escrivão (14, 07); minimapa em `src/ui` lendo o mapa (liga/desliga, acessível, barato); colisão dos prédios e **vila 100 % segura** (13) | 14, 07, 15, 08, 13 |
| **v0.1.3** | Mapa ao redor (campos e planícies) · **baús de tesouro** | **Troca de mapa** (portais, carregamento sem travar) e vários mapas em dados; objetos interativos (baú) com **estado do mundo serializável** (baú aberto não reaparece) desde já, para o save da v0.1.5; itens por ID (`item_`) | 14, 13, 08 |
| **v0.1.4** | NPCs da vila · **janelas de diálogo** · **lojas** · **moeda** | Sprites dos NPCs (04, estilo do item-modelo); diálogo e textos só por ID, com +40 % de espaço e sem concatenação (02, 15); **inventário** e menu (15) necessários à loja; moeda definida (nome, valores, preços em `data/`, 06 com 02); tela de loja com compra e venda, teclado e gamepad | 02, 04, 13, 15, 06 |
| **v0.1.5** | **Encontros aleatórios** no entorno · **classe do Edric** e habilidades · **subir de nível por XP** (D-036) · **save** e recuperação no mapa · **recompensas** pós-batalha | **Save local completo** (BL-024): versão, migração, escrita segura, backup, exportar/importar, validação rígida; modo de recuperação definido (decisão sua: estalagem, fonte, ponto de descanso ou item); tabela de XP e crescimento por nível em `data/` com testes (06); zonas de encontro do entorno (14); tela de resultado já existente reaproveitada; balanceamento por simulação | 06, 03, 13, 08, 15 |
| **v0.1.6** | **3 ou 4 missões** na vila (coletar presas de lobo, eliminar slimes, eliminar monstros numa área, coletar flores) · **sistema de missões** · só ao fim delas o **desafio de guerreiro** do mestre fica disponível | Sistema de missões (13): estados, contadores por evento (`golpe_acertou`, `morreu`, `item_coletado`), **diário de missões** na UI (15), persistência no save; drops e coletáveis do mapa (presas, flores) com IDs; porta do desafio condicionada às missões; textos e diálogos (02) | 13, 02, 15, 06 |
| **v0.1.7** | **Mapa da dungeon**: bosque que leva à caverna do Hollowpaw (D-035) | Mapas do bosque e da caverna (14, 07), luz e clima pelo 10 (paleta Cinza e Brasa na caverna); nomes da região e da caverna (02, decisão sua); encontros próprios; checagem de desempenho com mapas maiores (60 fps, pior 1 % ≥ 45) | 14, 07, 10, 02 |
| **v0.1.8** | **Cena de encontro com o boss** · **batalha contra o boss** · **cena pós-batalha** (matar ou poupar, D-037) · **volta à vila** com o resultado | **Motor com fases** (03: `fase_mudou`, ação forçada, aviso de golpe pesado) e **esquema `boss_`** aceito (08); sprite e poses do Hollowpaw (04, 10); cena de batalha do chefe (07); **sistema de cenas** (câmera e diálogo, só aqui a câmera se move); duas cenas pós-batalha e consequência na vila (02); **playtest completo do QA (09)** com roteiro de ponta a ponta, medição de peso (≤ ~10 MB) e de fps | 03, 08, 04, 07, 02, 09 |

**Em toda versão (critério de saída):** `npm test`, `npm run validar` e `npm run build` passando; `test:navegador` sem erro; jogada no navegador real pelo usuário; README, quadro e decisões atualizados; PR `dev → main` aprovado pelo usuário; tag no merge.

**Fora da demo (continua no slice):** vila em 3 estados, 5 inimigos comuns (a demo usa os que existirem), música e efeitos sonoros completos (BL-025), arte final (M2), inglês, tutorial e acessibilidade avançada.

**Decisões suas ainda abertas para a demo:** classe do Edric (v0.1.5), modo de recuperação (v0.1.5), nome e valor da moeda (v0.1.4), nomes da região e da caverna (v0.1.7), som mínimo na demo.

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
