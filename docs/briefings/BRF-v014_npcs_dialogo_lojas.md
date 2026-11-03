# BRF v0.1.4 — NPCs, diálogo, lojas e moeda (D-049)

Branch **`dev-v014`** (já ativa; não troque; **não commite**, o Produtor commita). Reportar por SendMessage. pt-BR; textos por ID (+40 % de espaço, sem concatenação); sem número mágico (dados em `data/`); IDs `npc_`, `item_`, `txt_`, `shop_`.

## Meta
Andar pela vila e **falar** com os NPCs (caixa de texto), **comprar e vender** com o ferreiro e a taverneira usando **Coroas**. Os outros NPCs (Maren, Torvan, escrivão, Ysolt) só conversam. Sem missões (v0.1.6), sem save de verdade (v0.1.5), sem classe nova (v0.1.5). Estado de moedas e inventário já existe em `estado_jogo.js` (`moedas`, `inventario`); a loja usa os mesmos, serializável para o save futuro.

## Por agente
- **02 Roteirista:** textos de diálogo de cada NPC (2–4 falas curtas por NPC, tom de cada ficha em `docs/narrativa/personagens/`, sem spoilers da trama), falas de loja (saudação, comprou, vendeu, sem moedas, despedida), nomes e cores de falante; descrição e nome dos itens novos; moeda "Coroa" nos textos (`{preco}` como variável inteira).
- **06 Design de Combate e Classes:** moeda Coroa (valores, quanto os inimigos dão — hoje 60 no chefe), **tabela de preços** (compra e venda a ~50 %) em `data/`, estoque do ferreiro (consumíveis + 2–3 equipamentos básicos, com stats e slots mínimos de arma/armadura para Edric e Grace, sem classes) e da taverneira (poções, comida/tônico); Coroas iniciais do herói; fórmulas e testes; simulação de balanceamento rápida.
- **04 Sprites:** sprites dos NPCs da vila (Maren, Torvan, Ysolt, ferreiro, taverneira, escrivão) no estilo do item-modelo, mesma célula/âncora do herói de mapa, 1 atlas por NPC (parado + 2 poses de idle), previa; item-modelo (1 NPC) para o 10 aprovar antes dos demais.
- **15 UI/UX:** caixa de diálogo (embaixo, nome do falante, avançar por clique/toque/tecla, mouse e teclado, celular deitado), **tela de loja** (comprar/vender, quantidade, Coroas, estoque, teclado/gamepad/mouse), **menu/inventário mínimo** que a loja exige (abrir fora de batalha), banners e placas existentes preservados; testes de UI no Chrome (PC e celular).
- **08 Arquiteto:** esquemas e validadores (`npc`, `dialogo`, `loja`, ligação a mapas/interiores), carregamento dos atlas de NPC, render dos NPCs no mapa (sprite, sombra, colisão pequena), estado serializável (diálogo/loja não persiste; moedas/inventário sim), desempenho (≥ 60 fps).
- **13 Exploração:** NPCs como objetos interativos (clique/andar até/`E`), vira o NPC para o herói, abre diálogo e loja, bloqueia o movimento durante o diálogo, eventos (`dialogo_iniciado/encerrado`, `compra`, `venda`); colisão dos NPCs.
- **14 Níveis:** posiciona os NPCs na vila e nos interiores (Maren, Torvan e Ysolt, escrivão, ferreiro na forja, taverneira na taverna), dados de ligação, atualização de esboço/props/plano de teste.
- **10 Diretor de Arte:** só aprova a arte dos NPCs (item-modelo) quando o 04 entregar.
- 03, 07, 05, 09, 11: sem tarefa.

## Critérios de saída
npm test, validar e build passam; testes de navegador (PC e celular): conversar com cada NPC, comprar e vender no ferreiro e na taverneira, Coroas e inventário atualizados, sem moedas suficientes, menu de inventário, FPS ≥ meta; README/CHANGELOG ao fim.
