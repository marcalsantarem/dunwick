# BRF v0.1.2b — Casa do Edric, boneco de treino e limpeza dos interiores

> Origem: pedidos do usuário ao ver a vila (2026-10-29). Decisões: D-043. Cada agente lê **só a sua seção**. Sem commit; relatório ao Produtor por SendMessage (entregue · validação · suposições · não testado). Econômico.

## Decisões (resumo)
1. **Casa do Edric** (D-043): ele mora **sozinho**, numa casinha **pequena e rudimentar por fora**, **explorável e detalhada por dentro** (simples, mobiliada), **perto da casa da Maren e do pátio do Torvan**. Posição **definida pelo X do usuário** no esboço (recebido): **centro ≈ (x 4,8 ; z 7,2)**, no canto noroeste da vila, a oeste da casa da Maren (x 11–17, z 8–13) e ao norte do Torvan (8,5;17). Casa ~3×3 centrada ali; porta voltada para o leste/sul, com caminho de terra até a casa da Maren e ao pátio do Torvan. O 14 ajusta o detalhe e as árvores/pedras que estão no local (árvore em ~ (4,8), pedra em ~ (6,7.5)).
2. **Mochila infinita**: o baú da casa é **só tesouro** (achado único, o item vai para a mochila), **não** é baú de guardar itens.
3. **Pátio do Torvan**: fica **só 1 boneco de treino**, o do lado **oposto ao poço**.
4. **Novo inimigo `enemy_boneco_treino`**: não ataca, só recebe dano, ~200 PV, **não dá XP nem moedas nem drops**. Clicar no boneco do pátio inicia a batalha `enc_boneco_treino`; o boneco **não some**, e a batalha pode ser repetida **sem limite** (o grupo volta com PV/PM cheios ao fim, para poder testar sempre).
5. **Interiores**: **remover a porta desenhada e o rótulo "Sair"**; ficam só a **marcação no chão** (capacho/mancha de luz) e o portal.

## 14 Níveis (dados dos mapas)
- Mapa `map_baixo_orvalho`: nova `edificio` **casa_edric** (casinha ~3×3 a 4×3, `estilo` rústico), porta, POI `casa_edric`, interior `map_casa_edric_interior` (cômodo ~8×6: cama simples, mesa, banco, estante com livros, **armas simples nas paredes**, **baú de tesouro**, capacho de saída). Ajuste o entorno para combinar: caminho de terra até a porta, lenha, varal, pequena horta/canteiro, cerca baixa; resolva sobreposições com árvores e caminhos; confira acesso a pé (validador).
- Pátio do Torvan: remova os bonecos extras, **deixe 1** (o mais distante do poço) como objeto interativo `boneco_treino`; atualize props e o esboço (`tools/esboco_vila.mjs`, regerar PNG).
- Registre o ponto do baú (`bau_casa_edric`, tipo `bau_tesouro`) e o objeto `boneco_treino` no mapa conforme contrato do 08/13. Atualize `docs/niveis/props_vila_v012.md`. Vila segue 100 % segura.

## 07 Cenários (visual)
- **Remover** de todos os interiores a porta desenhada e o rótulo "Sair" (e o código/texto `ui_sair` se ficar sem uso); **manter** o capacho/mancha de luz no chão e o portal.
- **Casa do Edric por fora**: pequena, rudimentar (madeira/palha ou telhado remendado, poucas janelas, chaminé fina, porta simples), diferente das casas de pedra/enxaimel; props do entorno (lenha, varal com roupas, canteiro, balde, cerca baixa).
- **Interior** detalhado: cama simples com cobertor remendado, mesa e banco, estante com livros, **armas simples nas paredes** (espada de treino, escudo velho, arco), tapete, prateleira com objetos pessoais, vela; **baú de tesouro** (modelo `bau_tesouro`, abre com animação simples de tampa; modelo fechado/aberto) — não é baú de armazenar.
- Mantenha orçamento (≤ 80 chamadas de desenho, 60 fps, download ≤ ~10 MB), testes e capturas.

## 13 Exploração (lógica)
- **Boneco de treino**: clicar (ou tecla E) no objeto `boneco_treino` aproxima o herói e dispara `iniciarBatalha('enc_boneco_treino')`; ao fim (vitória, fuga ou o que houver) volta ao mapa, o boneco continua, e pode ser repetido sempre. Sem carência de encontro, sem contagem de passos.
- **Baú de tesouro** (`bau_tesouro`): interagir abre, entrega o item definido nos dados (mochila infinita, sem tela de armazenar), estado `aberto` no estado serializável (não reaparece). Este é o **primeiro baú** do jogo: deixe o mecanismo reutilizável para os baús da v0.1.3.
- Testes unitários, estado serializável, contrato por mensagem curta com 03, 14, 15.

## 03 Combate por turnos (motor)
- Suportar **inimigo sem ações** (passa a vez, sem erro) e **encontro de treino** (`treino: true` no encontro): **sem XP, moedas e drops**, **PV/PM do grupo restaurados ao fim**, repetível. O boneco não dá XP nem moedas por dados (`recompensa` zerada); a derrota do boneco (PV 0) = vitória do grupo normal. Testes e simulação (`tools/simular_batalha.mjs`). Alinhe campos com o 06.

## 06 Design de combate (dados e documentação)
- **Ficha do boneco** (bestiário, `docs/sistemas/bestiario_slice.md` ou o arquivo vigente, igual a um inimigo comum): `enemy_boneco_treino`, ~200 PV, defesa baixa, agilidade 0, sem ações, recompensa zero, `treino: true`, nome/descrição por ID em `data/texts/pt-BR.json`. Dados em `data/enemies` + `data/combate/encontros` (`enc_boneco_treino`, 1 inimigo), validáveis; se faltar campo, proponha ao 03/08.
- **Item do baú** da casa do Edric (tesouro único, algo simples e com cara de lembrança de infância: ex. um amuleto/medalhão/ferramenta de caça). Defina em `data/items` com efeito pequeno ou nenhum, ID `item_...`, texto por ID. Registre no backlog/decisões o que for relevante.

## 04 Sprites
- Sprite de **batalha** do `enemy_boneco_treino` (atlas próprio, mesmo formato dos outros inimigos: `bat_parado`, `bat_dano` com balanço e `bat_morte` — tomba/quebra e depois volta ao normal na próxima batalha; sem ataque), e, se preciso, o sprite do boneco no mapa (hoje há `enemy_boneco_alvo`; reuse se servir). Prévia em `docs/arte/sprites/`, `.meta.json`, mesmo estilo do item-modelo. Documentação como a dos outros inimigos (nota no plano de sprites, ids). Sem pedir ferramenta externa.

## 15 UI/UX
- **Janela de achado** ao abrir o baú de tesouro ("Você encontrou X", ícone/nome por ID, um botão OK por mouse/toque/teclado), reutilizável nos baús da v0.1.3. Se a UI de batalha precisar de ajuste para inimigo que não age (log "não faz nada"), por ID.
