# Quadro de tarefas

> Mantido pelo Gestor de Backlog (11). Atualizado **só nos marcos e quando o Produtor pede** (economia). Detalhe de cada item em [03_backlog.md](03_backlog.md); marcos em [02_roadmap.md](02_roadmap.md).
> Custo: **P** = 1 passada curta · **M** = 1–2 passadas com arquivos · **G** = várias passadas, código e teste no navegador.
> Última atualização: 2026-10-27.

## Onda atual — Onda 1 (PROPOSTA, aguarda aprovação do Produtor/usuário)

Alvo: **M1 = uma batalha por turnos jogável** (Edric + Grace contra 1 inimigo comum), entrando a partir do mapa isométrico.

| Ordem | ID | Tarefa | Dono (apoio) | Custo | Depende de |
|---|---|---|---|---|---|
| 1 | BL-004 | Especificação do combate por turnos do M1 | 03 (06) | M | — |
| 2 | BL-005 | UI de batalha: layout, comandos, caixas de vida/mana | 15 (10) | M | BL-004 |
| 2 | BL-006 | Cena de batalha 3D (palco, luz, câmera, posições) | 07 (10) | M | BL-004 (posições) |
| 2 | BL-007 | Poses de batalha do Edric | 04 (10 aprova) | M | BL-004 (lista de poses) |
| 3 | BL-008 | Controlador de batalha + transição mundo ↔ batalha | 03 (13, 08) | G | BL-004; usa BL-005/006/007 ou substitutos |

Itens 2 podem correr em paralelo assim que a BL-004 sair. Critérios de pronto no backlog.

## Backlog (fora da onda)

| ID | Item | P | Marco |
|---|---|---|---|
| BL-009 | Sprite + poses de batalha da Grace | P0 | M1 (onda 2) |
| BL-010 | Sprite + poses do inimigo do M1 | P0 | M1 (onda 2) |
| BL-011 | Playtest do M1 (roteiro, medição, passa/não passa) | P0 | M1 (onda 2) |
| BL-012 | Bíblia e CLAUDE.md alinhados aos turnos (D-028/D-031) | P0 | M1 |
| BL-013 | Revisão dos documentos dos agentes pós-turnos | P1 | M1–M2 |
| BL-014 | CHANGELOG + versão v0.1.0 do esqueleto | P1 | M1 |
| BL-015 | Pendências do Edric (oeste espelhado, relevo, 5 cores) | P1 | M2 |
| BL-016 | Polir animação e gráficos do esqueleto (D-027) | P1 | M2 |
| BL-017 | Cena-modelo de batalha com efeitos e som | P1 | M2 |
| BL-018 | Lista de assets do slice com donos | P1 | M2 |
| BL-019 | Encontros aleatórios e zonas de encontro | P1 | M3 |
| BL-020 | Os 5 inimigos comuns (fichas, IA, sprites) | P1 | M3 |
| BL-021 | Chefe Hollowpaw (ficha, IA, sprite, cena) | P1 | M3 |
| BL-022 | Mapas do slice (vila 3 estados, região, masmorra) | P1 | M3 |
| BL-023 | Missões, diálogos e textos do slice | P1 | M3 |
| BL-024 | Save local completo | P1 | M3 |
| BL-025 | Música e SFX do slice | P1 | M3 |
| BL-026 | Itens, inventário e progressão do slice | P1 | M3 |
| BL-001 | Habilidades que evoluem pelo uso | P2 | depois do M3 |
| BL-003 | Remaster com arte refeita | P3 | futuro |

## A fazer
_Vazio até a Onda 1 ser aprovada._

## Em produção
_Nada ativo (2026-10-27)._

## Em revisão
_Nada._

## Feito

| Entrega | Referência |
|---|---|
| Bíblia do Projeto v1 aprovada | `00_biblia_projeto.md`, 2026-10-24 |
| História e nomes do slice (Edric, Baixo Orvalho, Grace, Hollowpaw…) | D-013 a D-021, D-023; `docs/narrativa/` |
| Guia visual e paleta (direção A · Lanterna e Musgo) | D-008, BRF-002; `docs/arte/` |
| Stack e esqueleto técnico (Three.js, ADR-001) | D-016, BRF-009 |
| Esqueleto isométrico HD-2D (praça de Baixo Orvalho) aprovado | D-027 |
| Combate por turnos decidido: formato, encontros, grupo | D-028, D-031 (ação arquivada na tag `combate-acao-v1`) |
| Arte 100 % por código | D-029 |
| Edric aprovado (pose parada, 5 direções, célula 96) | D-030 |
| README do repositório | commit `a6234ae` |
| Publicação na Netlify e fluxo `main`/`dev` (PR #1) | `docs/tecnico/publicacao.md` |
| Nova estrutura de agentes (03/13, 06/14, 07/15, 11) | D-032 |
