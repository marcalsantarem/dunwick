// Item-modelo do mapa de mundo (D-046, docs/arte/mapa_de_mundo.md §11): trecho de 12×12 tiles em volta da vila, ajustado pelo 14 a partir
// da planta sugerida pelo 10 e das respostas dele (escala 32 px/tile, marcadores 3×3, clareira da vila ~7×7 com a estrada saindo pelo sul,
// ponte 3×1). O 07 renderiza este trecho; o mapa inteiro (64×64) só sai depois da aprovação. x → leste, z → sul.
// Árvores e montanhas NÃO são objetos: o 07 as espalha por semente sobre `m`/`r` e `n`. A ponte é estrada na planta + objeto ponte_mundo.
export const LEGENDA_MUNDO = {
  a: 'agua', i: 'rio', l: 'lago', p: 'praia', g: 'grama', f: 'prado_flores', c: 'cultivo', m: 'mata_densa', r: 'mata_rala',
  e: 'estrada', t: 'trilha', h: 'colina', n: 'montanha', x: 'penhasco',
};
export const SOLIDOS_MUNDO = ['a', 'i', 'l', 'm', 'n', 'x']; // água (mar, rio, lago), mata densa, montanha e penhasco bloqueiam

export const PLANTA_ITEM_MODELO = [
  'nnnnhhgmegpa', // z0  cordilheira e colinas a noroeste; a estrada sobe para a caverna (passo ao norte)
  'nnnhhggmegpa', // z1  mancha de mata densa encostada na estrada
  'xnhhggggegpa', // z2  penhasco
  'iiiiiiiieiia', // z3  rio (vem do lago a oeste) cruza para a foz a leste; ponte 3×1 no x 8 (z 2–4)
  'ggfgggggegpa', // z4  clareira da vila: x 2–8, z 4–10 (~7×7)
  'mgffggggegpa', // z5
  'mrggggggegpa', // z6  marcador da vila 3×3: x 4–6, z 6–8
  'mrggggggegpa', // z7
  'rrggggggegpa', // z8
  'ttgggeeeegpa', // z9  estrada sai da vila pelo sul (x 5) e vira para a ponte; trilha para o bosque a oeste
  'rgccffccgppa', // z10 cultivo e prado ao sul da vila
  'ppppppppppaa', // z11 praia e mar
];
export const OBJETOS_ITEM_MODELO = [
  { id: 'marcador_vila', tipo: 'marcador_vila', x: 5.5, z: 7.5, rot: 0, seed: 1 },
  { id: 'ponte_rio', tipo: 'ponte_mundo', x: 8.5, z: 3.5, w: 3, rot: 90, seed: 1 }, // atravessa em z
];
// portal 3×3 sobre o marcador; chegada 2 tiles ao sul do centro (na estrada, fora do retângulo); herói da captura parado na estrada
export const PORTAL_ITEM_MODELO = { id: 'marcador_vila', x: 5.5, z: 7.5, w: 3, d: 3, chegada: { x: 5.5, z: 9.5, direcao: 's' } };
export const HEROI_ITEM_MODELO = { x: 8.5, z: 5.5, direcao: 'n' };
