# NPCs da vila — v0.1.4 (14, D-049)

Fonte: `NPCS` em `tools/lib/layout_vila.mjs`. Com `node tools/gerar_vila.mjs`, o campo `npcs` é gravado nos mapas. Esboço: `docs/niveis/esboco_vila_v014_dados.png`, gerado por `node tools/esboco_vila.mjs`.

Formato do campo, conforme o `mapa.schema` do 08:
```json
"npcs": [{ "id": "npc_maren", "x": 41.5, "z": 36.2, "dir": "s" }]
```
A posição é o ponto dos pés, em tiles. A ficha (`data/npcs/npc_*.json`, do 08 e do 13) traz o nome, o sprite, o diálogo e a loja. O gerador grava cada NPC só quando o esquema aceita `npcs` e a ficha `data/npcs/<id>.json` já existe; é a mesma regra dos props do kit. Em 03/11 ainda não há fichas, então os mapas saem sem NPCs. Quando as fichas existirem, basta rodar o gerador de novo. O esboço desenha as posições planejadas.

| NPC | Mapa | Posição no mapa (x, z) | Olha | Onde / por quê |
|---|---|---|---|---|
| `npc_maren` | `map_baixo_orvalho` | 41,5, 36,2 (local 18,5, 13,2) | s | junto ao canteiro de ervas, a leste da própria porta |
| `npc_torvan` | `map_baixo_orvalho` | 36,5, 45,8 (local 13,5, 22,8) | s | no pátio de treino, a 2 tiles do boneco |
| `npc_ysolt` | `map_baixo_orvalho` | 54, 44,8 (local 31, 21,8) | s | **provisório**: de passagem, ao lado do quadro de avisos, onde depois fica o cartaz dela. No slice ela fica na feira da região aberta |
| `npc_escrivao` | `map_posto_escrivao_interior` | 5, 2 | s | atrás do balcão do posto |
| `npc_ferreiro` | `map_forja_interior` | 5,6, 2,6 | s | ao lado da bigorna, de frente para a porta (loja) |
| `npc_taverneira` | `map_taverna_interior` | 5, 1 | s | atrás do balcão (loja) |

A casa da Maren e a do Torvan ficam sem NPC, porque os dois estão do lado de fora.

## Regras (métricas §5)
- Cada NPC tem 1 tile livre em pelo menos 2 lados. O NPC não fica em porta, chegada, caminho estreito, nem na sombra de oclusão de um prédio.
- O herói chega a ≤ 0,75 tile de cada NPC, e o ponto à frente dele é alcançável a pé.
- Com os NPCs no lugar, todas as chegadas continuam livres e todos os portais ativos continuam alcançáveis.

## Pedidos aos outros agentes
- **13:** para o escrivão e a taverneira, que atendem atrás do balcão, poder falar por cima do balcão, com alcance de cerca de 1,8 tile. Hoje o herói consegue contornar o balcão e chegar a 0,7 tile, então funciona sem isso, mas não é o ideal. O campo `alcance` está só no layout; ele entra no mapa se o 08 o aceitar.
- **08:** o campo da direção tem nomes diferentes:
  - o esquema e o `mapa.js` usam `dir`;
  - o `src/jogo/mundo.js` lê `n.direcao`, na linha 41.

  Os dados seguem `dir`.
- **02 / Produtor:** confirmar Ysolt na vila na v0.1.4. Narrativamente, ela é da feira.
