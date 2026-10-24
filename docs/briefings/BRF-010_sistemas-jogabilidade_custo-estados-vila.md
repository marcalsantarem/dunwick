# BRIEFING BRF-010: 06 Sistemas e 03 Jogabilidade — Custo dos 3 estados da vila e da cena do urso

- **Prioridade:** P1 · **Emitido:** 2026-10-24 pelo Produtor · **Decisões do usuário:** D-017 e D-018 (`docs/04_decisoes.md`)
- **Objetivo:** dizer, com custo e risco, se o que a história decidiu cabe no slice e como implementar, **antes** de qualquer mapa ou cena ser desenhado. Resposta curta, sem produzir conteúdo novo.
- **Ler antes:** `docs/narrativa/missao_principal_slice.md` (v4), `docs/narrativa/perguntas_abertas.md` (x, w, t), `docs/narrativa/personagens/boss_urso_musgo.md`, `docs/narrativa/personagens/npc_cuidadora.md`, `docs/gameplay.md` (§5 e §9), `docs/niveis/metricas.md`.

## O que a história exige
1. **`map_baixo_orvalho` em 3 estados:** dia (jogável), **adormecida** (a vila inteira dorme; só a casa da Cuidadora é interativa) e **acordada** (epílogo livre, secundárias da vila e saída por "Partir/Ficar"). Proposta do 02: mesmo mapa, NPCs trocam de pose, a luz muda.
2. **Sem estado "adormecido" jogável:** os aldeões dormindo são cenário, sem IA, sem ataque, sem dano.
3. **Cena de morte do urso-musgo** (chefe) com o sino mudo e o memento das armaduras (ação opcional).
4. **Cura do sino na feira e uso do sino limpo na praça** (cenas, sem mecânica nova).
5. **5 missões** (1 principal em 3 partes + 4 secundárias).

## Respostas pedidas (cada um no seu documento, uma seção "Respostas ao Produtor")
- **06 (em `docs/niveis/metricas.md` ou `docs/sistemas/`):** (a) custo de dados/mapa dos 3 estados: por estado de mapa ou por flags? (b) as flags `flag_vila_acordada`, `flag_epilogo_partir` e demais do 02 cabem no esquema de missões? (c) recompensas só em item: confirmar os dois itens novos (`item_carimbo_honorario`, `item_doce_limao`) e valores iniciais; (d) o urso-musgo como chefe: arquétipo, fases (3 por vida), resumo de golpes e telegraph coerentes com `boss_urso_musgo.md` (só resumo, a ficha completa vem depois).
- **03 (em `docs/gameplay.md`, §Interação e §Chefe):** (e) como a simulação lê os 3 estados (carregamento de mapa × troca de estado em tempo de execução); (f) cena de morte do chefe e o memento (ação opcional com `interagir`); (g) risco de soft-lock na vila adormecida e no epílogo; (h) o que muda no "M1 precisa ter" (nada, se o M1 só tiver a sala de teste).

## Fora de escopo
Desenhar mapas, escrever os dados completos do bestiário, implementar. Só a análise de custo e a recomendação.

## Pronto quando
- [ ] Cada pergunta (a)–(h) respondida em 2–5 linhas, com custo (baixo/médio/alto) e recomendação
- [ ] Qualquer item de custo alto vem com uma alternativa mais barata, para o usuário decidir
- [ ] Nenhuma contradição entre as duas respostas (alinhem pelo documento um do outro)
- [ ] Entrega no formato: entregue · validação · suposições · não testado · próximo passo

## Depende de
Nada. Perguntas entre vocês: me avise, não se peçam trabalho. Uma única mensagem curta ao entregar.
