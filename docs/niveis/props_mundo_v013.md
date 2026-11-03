# Props do mapa de mundo — v0.1.3 (14 → 07, D-048)

Fonte: `tools/gerar_mundo.mjs`, que gera `data/maps/map_mundo_orvalho.json` (48 × 48, `tipo_mapa: mundo`, `versao: 2`) e o esboço `docs/niveis/esboco_mundo_v013.png`. Para regerar: `node tools/gerar_mundo.mjs`. Coordenadas em tiles, com `x` = leste e `z` = sul; `x, z` é o centro.

**D-048:** floresta e montanhas **não são objetos**. O terreno 3D (`terreno_mundo_relevo.js`, do 07) as gera em massa sobre os tiles `mata_rala` e `montanha`. Por isso `arvore_mundo` e `montanha_mundo` saíram do mapa. Esses tipos continuam no kit, mas nenhum mapa os usa.

## Terreno (legenda da planta)

| Letra | Material | Bloqueia | Tiles |
|---|---|---|---|
| g | grama | não | 626 |
| r | mata_rala (floresta em massa) | não | 445 |
| e | estrada | não | 88 |
| a | agua (mar, rio, lago) | sim | 662 |
| n | montanha (serra) | sim | 374 |
| p | areia (praia) | não | 109 |

## Composição
- **Costa:** a leste há 3 baías e ao sul 2. Uma praia de 1 a 2 tiles separa a terra do mar, e há 4 ilhotas.
- **Serra:** cobre o norte e o oeste, colada à borda, e fecha o mapa.
- **Lago e rio:**
  - lago em (26, 13), alimentado por um córrego que desce da serra;
  - o rio sai do lago, serpenteia até a foz a leste em (43, 31) e é cruzado por uma ponte.
- **Florestas:** 5 massas com clareiras abertas por ruído, mais bosquetes soltos. A maior fica a oeste, em volta do bosque.
- **Estradas:**
  - vila → bosque (oeste);
  - vila → ponte → caverna (norte);
  - uma trilha curta da vila até a praia (sul).
- **Clareiras dos marcadores:**
  - a da vila tem raio 5;
  - as do bosque e da caverna têm raio 2,6.

## Objetos

| ID | Tipo | Centro (x, z) | Pegada | Observação |
|---|---|---|---|---|
| `marcador_vila` | `marcador_vila` | 20, 30 | 2 × 2 | portal ativo para `map_baixo_orvalho` / `saida_sul` |
| `marcador_bosque` | `marcador_bosque` | 10, 15 | 2 × 2 | `interditado`, com aviso `txt_mundo_marcador_bosque_aviso` |
| `marcador_caverna` | `marcador_caverna` | 33, 8 | 2 × 2 | `interditado`, com aviso `txt_mundo_marcador_caverna_aviso` |
| `ponte_rio` | `ponte_mundo` | 31, 21 | w 2,5, rot 0 | cobre 4 tiles de estrada sobre o rio; a colisão vem do tile |
| `rocha_*` (34) | `rocha_mundo` | por semente | do kit | junto à serra, na praia rente ao mar e, raramente, na grama; nunca sobre estrada, clareira ou chegada |

## Portais (ida e volta)

| Portal | Gatilho | Destino | Chegada |
|---|---|---|---|
| `marcador_vila` (mundo) | 2 × 2 em (20, 30) | `map_baixo_orvalho` / `saida_sul` | (20, 32), virado para o sul |
| `saida_sul` (vila) | 4 × 1 em (47, 79) | `map_mundo_orvalho` / `marcador_vila` | (47, 77), virado para o norte |
| `marcador_bosque` | 2 × 2, inativo | `map_bosque_orvalho` / `entrada` | (10, 17) |
| `marcador_caverna` | 2 × 2, inativo | `map_caverna_hollowpaw` / `entrada` | (33, 10) |

Na vila, a saída sul ficou aberta: as toras do vão sul saíram e o portal está ativo. A saída norte continua fechada (portal inativo, só avisa).

`inicio_jogador` do mundo fica em (20, 32), mas não é usado, porque o jogo começa na vila. `limites_camera` vai de [4, 4] a [40, 40].
