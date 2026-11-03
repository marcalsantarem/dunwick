# BRF v0.1.3 — Mapa de mundo estilizado (D-044, D-045)

Branch de trabalho: **`dev-v013`** (não commitar; o Produtor commita). Não mexer em `dev`. Sem baús no mundo. Reportar por SendMessage ao Produtor. Linguagem: pt-BR; textos por ID; sem número mágico (dados em `data/`).

## Meta
Mapa de mundo "Campos de Baixo Orvalho", estilo Final Fantasy antigo: câmera **mais distante**, terreno em **tiles simples** (grama, mata rala, água, estrada, montanha), **herói minúsculo e lento** (sprite própria mais simples), **marcadores** de locais. Tocar/clicar/ir até o marcador da vila entra na vila (portal, névoa escura); sair pelo vão sul da vila volta ao marcador. Marcadores futuros (bosque, caverna do Hollowpaw) visíveis, **interditados** (aviso `txt_portal_interditado`). Sem encontros (v0.1.5), sem baús, sem NPCs.

## Por agente
- **08 Arquiteto:** novo `tipo_mapa: "mundo"` (esquema/validador), modo de render e câmera de mundo (zoom out, enquadramento pelo herói, limites do mapa), preencher a janela mantendo D-039; terreno em tiles leves e barato (60 fps; pior 1 % ≥ 45; baixo/médio/alto); carregar o mapa de mundo junto aos outros; transição mundo↔local reaproveitando portais; `mapa_entrou` com nome do mapa.
- **14 Níveis:** `map_mundo_orvalho` em dados (gerado por `tools/`, tamanho sugerido 48×48 tiles de mundo): terreno, estradas, mar/rio, montanhas na borda; marcador da vila (portal ativo → `map_baixo_orvalho`, chegada no vão sul), marcadores interditados do bosque e da caverna; ajustar o vão sul da vila para levar ao mundo (portal ativo); colisão do terreno (água/montanha); `inicio_jogador` do mundo não é usado (o jogo ainda começa na vila).
- **07 Cenários:** visual dos tiles de mundo, marcadores (vila, bosque, caverna), pequenos props (árvores/rochas/ponte) de baixa contagem; luz e névoa de mundo, coerentes com a paleta existente; peso baixo.
- **04 Sprites:** sprite do herói **de mundo** (minúscula, simples, 4 direções, 2–4 quadros de andar), mesmo `hero_edric` (escala/arquivo próprio, gerada por código), âncora nos pés, previa.
- **13 Exploração:** velocidade de andar do mundo (mais lenta, em `data/`), interação com marcadores (clicar/ir/E), aviso nos interditados, `mapa_trocado` e estado no save futuro; herói do mundo usa o atlas de mundo; colisão de terreno; sem encontros.
- **15 UI/UX:** minimapa **desligado** no mundo (botão/atalho M some ou fica inativo), banner com o nome do mapa ("Campos de Baixo Orvalho"), nome do marcador ao aproximar/apontar, pausa e celular coerentes.
- **02 Roteirista:** nome e textos de `map_mundo_orvalho` e dos 3 marcadores (vila Baixo Orvalho; bosque e caverna com nomes provisórios), aviso de local ainda inacessível. Revisar textos provisórios.
- **09 QA / 03 / 06 / 10 / 05 / 11:** sem tarefa nesta versão.

## Critérios de saída
npm test, validar e build passam; testes de navegador (PC e celular) com: ir da vila ao mundo e voltar, banner do mapa, marcadores interditados, herói minúsculo animado, FPS ≥ meta nos 3 perfis; README/CHANGELOG ao fim.
