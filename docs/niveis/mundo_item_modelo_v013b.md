# Item-modelo do mapa de mundo — planta 12×12 (14, D-046)

> **Obsoleto (D-048):** o usuário aprovou o mundo isométrico 3D denso. Esta planta 12×12 com câmera 2D não será usada; o mapa vigente está em `props_mundo_v013.md`.

Planta do 14 a partir da sugestão do 10 (`docs/arte/mapa_de_mundo.md` §11.1) e das respostas dele: 32 px/tile, câmera ≈ 30×17 tiles, marcadores 3×3, clareira da vila de ~7×7 com a estrada saindo pelo sul e ponte 3×1.

- **Dados:** `tools/lib/mundo_item_modelo.mjs`, que exporta:
  - `PLANTA_ITEM_MODELO`, `LEGENDA_MUNDO`, `SOLIDOS_MUNDO`;
  - `OBJETOS_ITEM_MODELO`, `PORTAL_ITEM_MODELO`, `HEROI_ITEM_MODELO`.
- **Prévia de disposição** (cor chapada; a arte é do 07): `docs/niveis/item_modelo_mundo_v013b.png`.

```
     x: 0 1 2 3 4 5 6 7 8 9 10 11
z=0   : n n n n h h g m e g p  a
z=1   : n n n h h g g m e g p  a
z=2   : x n h h g g g g e g p  a
z=3   : i i i i i i i i e i i  a
z=4   : g g f g g g g g e g p  a
z=5   : m g f f g g g g e g p  a
z=6   : m r g g V V V g e g p  a
z=7   : m r g g V V V g e g p  a
z=8   : r r g g V V V g e g p  a
z=9   : t t g g g e e e e g p  a
z=10  : r g c c f f c c g p p  a
z=11  : p p p p p p p p p p a  a
```

`V` = marcador da vila. Na planta esses tiles são grama `g`.

**Legenda** (letras do 10, §4):

| Letra | Material | Bloqueia? |
|---|---|---|
| a | agua (mar) | sim |
| i | rio | sim |
| l | lago | sim |
| p | praia | não |
| g | grama | não |
| f | prado_flores | não |
| c | cultivo | não |
| m | mata_densa | sim |
| r | mata_rala | não |
| e | estrada | não |
| t | trilha | não |
| h | colina | não |
| n | montanha | sim |
| x | penhasco | sim |

`solidos` = `a i l m n x`.

## Composição
- **Vila:** clareira x 2–8, z 4–10, com o marcador 3×3 no meio (x 4–6, z 6–8). Objeto e portal `marcador_vila` têm 3×3 de área e centro em (5,5; 7,5).
- **Chegada:** em (5,5; 9,5), 2 tiles ao sul do centro, já na estrada e fora do portal.
- **Estrada:** sai da vila pelo sul (x 5, z 9), vira para leste e sobe em x 8.
  - Cruza o rio pela ponte `ponte_mundo` 3×1, em (8,5; 3,5), rot 90, w 3. Na planta, os tiles debaixo dela são `e`; a colisão vem do tile.
  - Segue para o norte, rumo à caverna, por um passo na cordilheira.
  - Há uma coluna de grama entre a estrada e a praia, porque estrada e areia têm valor parecido.
- **Rio:** vem do lago a oeste (fora do trecho), atravessa o trecho e chega à foz no mar a leste.
- **Bosque:** a trilha `t` sai da vila para oeste e leva ao bosque ralo.
- **Florestas e montanhas:** só terreno (`m`/`r`, `n`). O 07 espalha árvores e picos por semente; não há objeto de árvore nem de montanha.
- **Herói da captura:** parado na estrada, em (8,5; 5,5), olhando para o norte.

## Pendências
- **08:** o enum de materiais do `mapa.schema` precisa aceitar `rio`, `lago`, `praia`, `prado_flores`, `cultivo`, `mata_densa`, `trilha`, `colina` e `penhasco`. Os nomes de campo não mudam.
- **14:** depois da aprovação do item-modelo (10 e usuário), refazer o `map_mundo_orvalho` em 64×64 com esta legenda (§10).
