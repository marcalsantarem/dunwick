# Revisão visual v0.1.4 (10, 2026-11-03) — **APROVADO COM RESSALVAS**

Base: `docs/arte/sprites/previa_npcs_vila.png`, `build/qa/menu_principal/pc_status.png`, `build/qa/menus_mapa/pc_dialogo.png` e `pc_loja_comprar.png` (capturas estáticas; só PC revisado, iPhone não aberto).

## 1. NPCs (04)
Aprovado: seis silhuetas distintas (idoso de bengala, mulher de touca lilás com xale, ferreiro de martelo, taverneira de avental xadrez, escrivão de óculos e Marene), cores de roupa variadas, 5 direções legíveis, rosto mínimo funciona.
Ressalvas:
- Rampas fora da paleta mestra (tijolo, tinta, brasa): **aprovadas como extensões** desde que entrem no `paleta.json`/`paleta_mundo.json` com id, em rampa crescente de luminosidade, e passem na checagem de daltonismo contra o chão da vila (pedra, terra, grama). Pendente: ver os hex propostos.
- Xadrez do avental e xale da touca criam ruído de 1 px na escala do jogo: simplificar para 2 tons com padrão de 2 px.
- Ajustes da Marene (cabeça de "garrafa", NE igual a N, contorno completo, cabelo esfriado) valem para todos; conferir NE ≠ N nos 6.
- Em jogo o escrivão e o idoso (azul-acinzentado) têm valor próximo ao da pedra; exigir contorno escuro e luz de borda.

## 2. Menu principal (15)
Aprovado: pergaminho escuro/madeira/latão coerente com §8 do guia, hierarquia clara (item ativo mais claro com losango), retratos com barras de Vida/Mana legíveis, números alinhados.
Ressalvas: 1) texto pequeno e fino em 1280×720 (rótulos e valores); aumentar a fonte-base e o espaçamento (+40 % de reserva); 2) metade direita do painel vazia na aba Status: usar para retrato maior ou resistências; 3) barra de Experiência quase invisível; 4) Mana lilás sobre fundo marrom: conferir contraste e não depender só da cor (já há texto).

## 3. Diálogo e loja (15)
Diálogo: caixa legível, nome em etiqueta, indicação de continuar, estilo próprio. Ressalvas: 1) **oclusão**: Edric e Marene ficam sob o telhado do arco, com uma mancha azul-clara sobre o herói; aplicar silhueta/dither do guia §9.1 (alpha 0,35) e corrigir o artefato; 2) o herói está pequeno no mundo; 3) a caixa cobre a base da cena, aceitável, mas não pode cobrir o alvo do diálogo.
Loja: boa estrutura (abas, preço, total, quantidade). Ressalvas: 1) itens sem moeda ficam esmaecidos demais (nome e preço quase ilegíveis, contraste < 3:1) enquanto "Você tem" fica mais brilhante: inverter a ênfase e marcar "sem moedas" com ícone+texto (`alerta_ui`); 2) o fundo escuro da loja mostra um cenário quase invisível: clarear levemente o véu; 3) o campo "x 3" e os botões −/+ são pequenos para toque.
