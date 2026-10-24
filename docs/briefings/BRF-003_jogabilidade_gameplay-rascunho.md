# BRIEFING BRF-003: 03 Jogabilidade — Rascunho do documento de gameplay

- **Onda:** 0 · **Prioridade:** P0 · **Emitido:** 2026-10-24 pelo Produtor
- **Objetivo:** ter a Fase 1 do 03 (pilares, loop, controles, parâmetros) pronta antes da stack, para que o protótipo cinza (M1) comece direto na implementação.
- **Ler antes:** `agentes-rpg/03_jogabilidade.md` (§4–§7, §11–§13), `CLAUDE.md`, `docs/00_biblia_projeto.md`, `docs/04_decisoes.md` (D-004, D-005, D-006).

## Especificação
- `docs/gameplay.md` no modelo da §5, **sem nomear ferramenta ou stack**.
- Herói provisório: corpo a corpo com espada + esquiva + 2–3 habilidades, sem vocações (D-004, D-006); só dificuldade Normal (D-005).
- Controles por dispositivo (teclado + mouse, gamepad), ações lógicas e buffer de entrada.
- Parâmetros do herói e do combate em **tabelas de dados** (valores iniciais da §6.1 e §7.3, em tiles/segundos/quadros a 60 Hz), marcados "ajustar em playtest".
- Máquina de estados do herói, câmera (ângulo, distância, limites), caixas e pipeline de dano (§7.4) **descritos**, com nota de alinhamento pendente com `docs/sistemas/formulas.md` (BRF-004).
- Escopo do M1 explícito: o que o protótipo cinza precisa ter para o playtest de sensação.
- Status de cada sistema: pendente.

## Itens (lista fechada)
1. `docs/gameplay.md` (rascunho v0.1)

## Fora de escopo
Código, IA de inimigos específicos, chefe, missões, HUD final. Nomes de inimigos ou do mundo (a premissa não existe).

## Pronto quando
- [ ] Todas as seções da §5 presentes (as que dependem de outros, marcadas com o dono)
- [ ] Nenhum número no texto sem tabela de dados correspondente
- [ ] Lista "M1 precisa ter" verificável
- [ ] Perguntas para 06 (fórmulas) e 08 (entrada/laço) listadas para eu repassar
- [ ] Entrega no formato: entregue · validação · suposições · não testado · próximo passo

## Depende de
Nada para começar. Alinhamento final com 06 (BRF-004) e 08 (BRF-001).
