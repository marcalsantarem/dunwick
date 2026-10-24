# BRIEFING BRF-006: 09 QA — Plano de testes e critérios por marco (rascunho)

- **Onda:** 0 · **Prioridade:** P1 · **Emitido:** 2026-10-24 pelo Produtor
- **Objetivo:** ter os critérios verificáveis do M1 prontos quando o protótipo cinza chegar, e o plano de testes do projeto em rascunho.
- **Ler antes:** `agentes-rpg/09_qa.md` (§3–§8), `agentes-rpg/01_produtor.md` §6, `CLAUDE.md`, `docs/00_biblia_projeto.md`, `docs/02_roadmap.md`.

## Especificação
- `docs/qa/plano_testes.md` no modelo da §4 (pirâmide, áreas da §5, ferramentas descritas sem nomear stack, ambiente). O que depende do ADR-001 fica marcado "[aguarda 08]".
- `docs/qa/criterios_marcos.md` (§8): **M1 detalhado** (verificável, com medida e método); M2 e M3 em rascunho; M4–M6 só tópicos.
- Critérios do M1 cobrindo, no mínimo: abre no navegador, 60 fps na sala cinza (meta do 08), passo fixo (aba em segundo plano pausa e não simula tempo perdido), entrada por teclado e gamepad, sensação de movimento/ataque (roteiro de playtest), modo debug.
- Playtests: até o usuário responder, assumir **usuário + bots** (roteiro curto de sessão e questionário de sensação para o M1).
- Template de relatório de bug (§3) pronto para uso.

## Itens (lista fechada)
1. `docs/qa/plano_testes.md`
2. `docs/qa/criterios_marcos.md`
3. `docs/qa/playtests/roteiro_m1.md`

## Fora de escopo
Bots, scripts, testes automatizados (dependem da stack); casos de teste de conteúdo (missões, chefe).

## Pronto quando
- [ ] Todo critério do M1 tem medida, método e limite de passa/não passa
- [ ] Critérios coerentes com o `01_produtor.md` §6 e as metas do 08
- [ ] Roteiro de playtest do M1 executável pelo usuário em ≤ 15 min
- [ ] Entrega no formato: entregue · validação · suposições · não testado · próximo passo

## Depende de
Nada para começar. Números finais de desempenho vêm do BRF-001 (08).
