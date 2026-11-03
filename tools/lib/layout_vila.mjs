// Layout da vila de Baixo Orvalho (14): dados de desenho lidos por tools/gerar_vila.mjs (gera data/maps) e tools/esboco_vila.mjs (PNG).
// Coordenadas LOCAIS da vila em tiles (x = leste, z = sul): o núcleo da vila ocupa 0–48; a casa do Edric e o anel até a estacada
// ficam em coordenadas negativas/além de 48. O gerador desloca tudo para dentro do mapa (margem de mata, ver MARGEM em gerar_vila.mjs).
// ---- Edifícios: retângulo de tiles inclusivo [x0, z0, x1, z1] + lado da porta; interior = largura × altura do cômodo ----
// `lado` 's' (+z) e 'l' (+x) são as paredes que a câmera isométrica vê: a porta com interior fica numa delas (07). `deco`, `estilo` e `fechada` vão para o kit (07).
const EDRIC = [-4, -5, -1, -3], ex = (dx) => EDRIC[0] + dx, ez = (dz) => EDRIC[1] + dz; // entorno do Edric relativo ao canto noroeste da casa
export const EDIFICIOS = [
  { id: 'casa_maren', tipo: 'casa', r: [11, 8, 16, 12], lado: 's', deco: 'maren', telhado: 'musgo', janelas: 3, chamine: true, seed: 3, interior: [10, 8] },
  { id: 'taverna', tipo: 'taverna', r: [28, 7, 34, 12], lado: 's', deco: 'taverna', telhado: 'telha', janelas: 4, chamine: true, seed: 5, interior: [14, 10] },
  { id: 'forja', tipo: 'forja', r: [36, 12, 40, 16], lado: 's', deco: 'forja', telhado: 'ardosia', janelas: 2, chamine: true, seed: 7, interior: [10, 8] },
  { id: 'casa_torvan', tipo: 'casa', r: [6, 15, 10, 18], lado: 'l', deco: 'torvan', telhado: 'telha', janelas: 2, chamine: true, seed: 19, interior: [10, 8] },
  { id: 'posto_escrivao', tipo: 'posto', r: [38, 21, 42, 26], lado: 's', deco: 'escrivao', telhado: 'ardosia', janelas: 2, chamine: false, seed: 11, interior: [10, 8] },
  // casa do Edric (D-043; afastada no pedido do usuário de 29/10): casinha rústica isolada no canto noroeste, ≥ 10 tiles da Maren e do Torvan, porta a leste (lado visível), mora sozinho
  { id: 'casa_edric', tipo: 'casa', r: EDRIC, lado: 'l', estilo: 'rustica', deco: 'edric', telhado: 'palha', janelas: 1, chamine: true, seed: 31, interior: [8, 6] },
  // casas de moradores do sul: fechadas (sem interior)
  { id: 'casa_sul_1', tipo: 'casa', r: [12, 36, 15, 39], lado: 'n', fechada: true, telhado: 'telha', janelas: 2, chamine: true, seed: 13 },
  { id: 'casa_sul_2', tipo: 'casa', r: [17, 40, 20, 43], lado: 'n', fechada: true, estilo: 'enegrecida', telhado: 'musgo', janelas: 2, chamine: true, seed: 17 },
  { id: 'casa_nova', tipo: 'casa', r: [28, 39, 31, 42], lado: 'n', fechada: true, estilo: 'nova', telhado: 'telha', janelas: 2, chamine: false, seed: 23 },
  { id: 'casa_sul_4', tipo: 'casa', r: [35, 35, 38, 38], lado: 'o', fechada: true, telhado: 'ardosia', janelas: 2, chamine: true, seed: 29 },
];

// props novos do 07 (docs/niveis/props_vila_v012.md): entram no mapa só quando o tipo existir em cfg_kit.pegadas (e no enum do esquema)
export const PROPS_VILA = [
  { id: 'portico', tipo: 'portico', x: 24, z: 19.5, w: 4 },
  { id: 'quadro_avisos', tipo: 'quadro_avisos', x: 28.5, z: 21 },
  { id: 'quadro_editais', tipo: 'quadro_avisos', x: 37, z: 21.2 },
  { id: 'forja_brasa', tipo: 'forja_brasa', x: 43.5, z: 14.6 },
  { id: 'canteiro_maren', tipo: 'canteiro', x: 18.5, z: 10.5, w: 2, d: 3 },
  { id: 'rack_armas_patio', tipo: 'rack_armas', x: 9.5, z: 21.3 },
  { id: 'arvore_queimada', tipo: 'arvore_queimada', x: 26, z: 36 },
  { id: 'muro_fuligem', tipo: 'muro_fuligem', x0: 8, z0: 42.5, x1: 15, z1: 42.5 },
  { id: 'pedra_enegrecida', tipo: 'pedra_enegrecida', x: 33, z: 41, w: 2, d: 4 },
  // entorno da casa do Edric (lado sul/sudoeste, visível pela câmera)
  { id: 'lenha_edric', tipo: 'lenha', x: ex(2.6), z: ez(3.7) },
  { id: 'balde_edric', tipo: 'balde', x: ex(4.6), z: ez(3.4) },
  { id: 'varal_edric', tipo: 'varal', x: ex(-1.1), z: ez(4.6), w: 2.4, d: 0.3 },
  { id: 'canteiro_edric', tipo: 'canteiro', x: ex(1.4), z: ez(5.4), w: 2, d: 1 },
  { id: 'cerca_edric', tipo: 'cerca', x0: ex(0.2), z0: ez(6.3), x1: ex(2.6), z1: ez(6.3) },
  // pátio do Torvan: 1 boneco interativo (o mais distante do poço); substitui os 2 bonecos `inimigo` do M1 quando enc_boneco_treino existir (06)
  { id: 'boneco_treino', tipo: 'boneco_treino', x: 11.5, z: 24, encontro: 'enc_boneco_treino', substitui: ['enemy_boneco_alvo', 'enemy_boneco_golpe'] },
];
// item do baú de tesouro da casa do Edric: ID definido pelo 06 (o baú só entra no mapa quando o item existir em data/combate)
// quintal do Edric sem árvores (retângulo local) e caminho de terra até a trilha da Maren
export const QUINTAL_EDRIC = [ex(-2.5), ez(-1.5), ex(7), ez(7.5)];
export const CAMINHO_EDRIC = [[ex(4.5), ez(1.5), 9, 3], [9, 3, 9, 13.8], [9, 13.8, 14, 13.8]];
export const ITEM_BAU_EDRIC = 'item_lembranca_edric';

// obj: [tipo, x, z, w?, d?, {extra}?]; `aplique` = vela na parede de trás (rot 0 = norte, 90 = oeste); a porta de saída é desenhada pelo kit no portal `saida`; tipos ainda fora do kit ficam de fora até o 07 entregá-los (mesma regra dos props da vila)
export const SALAS = {
  casa_maren: { piso: 'calcada', parede: 'madeira', luz: ['#ffd9a0', 0.9, '#1c140e'], obj: [['aplique', 5, 0, null, null, { rot: 0 }], ['aplique', 0, 4, null, null, { rot: 90 }], ['caixote', 1, 6.2],
    ['estante', 1.6, 0.6], ['estante', 3.2, 0.6], ['canteiro', 6.5, 0.6, 1.6, 0.6], ['mesa', 5, 3, 1.6, 0.9, { itens: 'vela' }], ['cadeira', 5, 3.9], ['cama', 8.8, 1.6]] },
  taverna: { piso: 'calcada', parede: 'madeira', luz: ['#ffc27a', 1.0, '#1a110a'], obj: [['aplique', 7, 0, null, null, { rot: 0 }], ['aplique', 0, 5, null, null, { rot: 90 }], ['castical', 4, 2, null, null, { alt: 1.04 }], ['barril', 0.9, 1], ['barril', 0.9, 2], ['barril', 1.9, 1], ['caixote', 12.8, 8.6],
    ['balcao', 5, 2, 4, 0.7], ['lareira', 11.5, 0.6], ['mesa', 3.5, 6, 1.6, 0.9, { itens: 'taverna' }], ['cadeira', 3.5, 6.9], ['mesa', 10, 6, 1.6, 0.9, { itens: 'taverna' }], ['cadeira', 10, 6.9], ['mesa', 11.8, 3.6, 1.6, 0.9, { itens: 'taverna' }], ['banco', 11.8, 4.5]] },
  forja: { piso: 'terra', parede: 'pedra', luz: ['#ff9a5a', 1.1, '#140c08'], obj: [['aplique', 5, 0, null, null, { rot: 0 }], ['aplique', 0, 4, null, null, { rot: 90 }], ['barril', 8.8, 6.6], ['caixote', 1.1, 6.6], ['caixote', 2.1, 6.7],
    ['fornalha', 2, 1], ['bigorna', 4.5, 3.2], ['bancada', 7.5, 0.6], ['rack_armas', 9, 3]] },
  casa_torvan: { piso: 'calcada', parede: 'reboco', luz: ['#f2dcb0', 0.85, '#16120e'], obj: [['aplique', 3, 0, null, null, { rot: 0 }], ['aplique', 0, 4, null, null, { rot: 90 }], ['caixote', 8.6, 6.4],
    ['cama', 1, 1.6], ['rack_armas', 5, 0.5], ['mesa', 7.5, 3.5, 1.6, 0.9, { itens: 'papeis' }], ['cadeira', 7.5, 4.4]] },
  casa_edric: { piso: 'calcada', parede: 'madeira', luz: ['#ffd29a', 0.85, '#18120c'], obj: [['aplique', 4, 0, null, null, { rot: 0 }], ['aplique', 0, 3, null, null, { rot: 90 }],
    ['cama', 0.8, 1.6, null, null, { itens: 'remendada', cor: 'ocre' }], ['armas_parede', 2.9, 0, null, null, { rot: 0 }], ['prateleira', 0, 3.6, 1.4, null, { rot: 90, alt: 1.5 }],
    ['estante', 4.8, 0.6], ['bau_tesouro', 7, 0.7, null, null, { id: 'bau_casa_edric', item: ITEM_BAU_EDRIC, aberto: false }],
    ['mesa', 5.8, 1.9, 1.6, 0.9, { itens: 'vela' }], ['banco', 5.8, 2.7], ['tapete', 3.4, 3.4, 2, 1.4, { cor: 'verde' }], ['caixote', 7.3, 4.6]] },
  posto_escrivao: { piso: 'calcada', parede: 'pedra', luz: ['#e8e2c8', 0.9, '#121214'], obj: [['aplique', 3.2, 0, null, null, { rot: 0 }], ['aplique', 0, 4, null, null, { rot: 90 }], ['castical', 4.2, 3, null, null, { alt: 1.04 }], ['caixote', 1.1, 6.5], ['caixote', 8.9, 6.5],
    ['balcao', 5, 3, 4, 0.7], ['arquivo', 1.5, 0.6], ['arquivo', 8.5, 0.6], ['quadro_avisos', 5, 0.4]] },
};
