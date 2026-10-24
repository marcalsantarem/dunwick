# BRIEFING BRF-002: 10 Diretor de Arte — Guia visual, etapa 1

- **Onda:** 0 · **Prioridade:** P0 · **Emitido:** 2026-10-24 pelo Produtor
- **Objetivo:** fixar a linguagem visual que não depende da história (escala, pixel, luz, pós, leitura), para que 04, 07 e o spike do 08 tenham uma base comum. As cores por região e a paleta final ficam para a etapa 2, depois do mundo (D-006).
- **Ler antes:** `agentes-rpg/10_direcao-de-arte-e-vfx.md` (§2–§7), `CLAUDE.md`, `docs/00_biblia_projeto.md`, `docs/04_decisoes.md` (D-006).

## Especificação
- Seguir o modelo de `docs/arte/guia_visual.md` (§7) e marcar como **[ETAPA 2]** tudo o que depende da premissa/mundo.
- **Direções de clima:** 2–3 direções visuais (palavras-chave, anti-palavras, temperatura de luz, contraste, descrição de uma cena típica), com **uma recomendada**. A escolha é do usuário.
- **Paleta neutra provisória:** rampas-base (pele, metal, madeira, pedra, vegetação, UI, alerta/perigo) suficientes para placeholders e spikes, em `docs/arte/paleta.json` marcada como provisória.
- Especificação da §4 (densidade 32 px/tile, célula 64×64, contorno, normal map, sombra) e pós/luz da §5 com perfis Alto/Médio/Baixo, como **requisitos**. Os limites reais vêm dos números do 08 (BRF-001); não trave a spec antes disso.
- Convenções de leitura (cor + forma = significado: perigo, telegraph, interativo, coletável) em rascunho, para revisão com 03/06/07.
- Originalidade: nenhuma paleta, moldura ou ícone reconhecível de outro jogo (nada da janela azul em degradê).

## Itens (lista fechada)
1. `docs/arte/guia_visual.md` (etapa 1, com as seções [ETAPA 2] marcadas)
2. `docs/arte/direcoes_clima.md` (2–3 opções + recomendação)
3. `docs/arte/paleta.json` (provisória, neutra)

## Fora de escopo
Roteiro de cor por região, itens-modelo, cena-modelo, VFX, qualquer sprite/textura.

## Pronto quando
- [ ] Guia com pilares, spec, luz/pós com perfis, convenções de leitura, faça/não faça
- [ ] 2–3 direções de clima com recomendação, prontas para eu levar ao usuário
- [ ] Paleta provisória em JSON válido
- [ ] Lista de perguntas ao 08 sobre limites de luz/pós (eu repasso)
- [ ] Entrega no formato: entregue · validação · suposições · não testado · próximo passo

## Depende de
Nada para começar. A trava final da spec depende do BRF-001 (08).
