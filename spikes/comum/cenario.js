// Descrição do cenário dos spikes, independente de motor: módulos = listas de caixas.
// Cada caixa: { x, y, z, lado, topo, sx, sy, sz } com índices de tile no atlas 16×16 (32 px por tile).
export const TILE = { grama: 0, pedra: 1, terra: 2, madeira: 3, telhado: 4, parede: 5, agua: 6, folhas: 7 };
export const TOCHAS = [[-5, -3], [5, -3], [-5, 4], [5, 4], [0, -7], [-8, 0], [8, 0], [0, 8]];
const cubo = (x, y, z, lado, topo = lado, sx = 1, sy = 1, sz = 1) => ({ x, y, z, lado, topo, sx, sy, sz });
const modulo = (caixas, oclusor = false) => ({ caixas, oclusor });
function casa(x, z) {
  const p = [];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) for (let k = 0; k < 2; k++) p.push(cubo(x + i + 0.5, k, z + j + 0.5, TILE.parede));
  for (let i = -1; i < 4; i++) for (let j = 0; j < 3; j++) p.push(cubo(x + i * 0.75 + 0.9, 2 + (j === 1 ? 0.6 : 0), z + j + 0.5, TILE.telhado, TILE.telhado, 0.8, 0.5, 1));
  p.push(cubo(x + 1.5, 0, z + 3.05, TILE.madeira, TILE.madeira, 0.8, 1.4, 0.1));
  return modulo(p);
}
function arvore(x, z) {
  const p = [cubo(x, 0, z, TILE.madeira, TILE.madeira, 0.5, 1.5, 0.5)];
  for (const [a, b, c] of [[0, 1.5, 0], [-0.6, 1.8, 0], [0.6, 1.8, 0], [0, 1.8, 0.6], [0, 1.8, -0.6], [0, 2.4, 0]]) p.push(cubo(x + a, b, z + c, TILE.folhas));
  return modulo(p);
}
const poste = (x, z) => modulo([cubo(x, 0, z, TILE.madeira, TILE.madeira, 0.25, 1.8, 0.25), cubo(x, 1.8, z, TILE.pedra, TILE.pedra, 0.45, 0.35, 0.45)]);
function cerca(x, z, n) { const p = []; for (let i = 0; i < n; i++) p.push(cubo(x + i, 0, z, TILE.madeira, TILE.madeira, 0.15, 0.8, 0.15), cubo(x + i + 0.5, 0.5, z, TILE.madeira, TILE.madeira, 1, 0.12, 0.1)); return modulo(p); }
const caixa = (x, z) => modulo([cubo(x, 0, z, TILE.madeira, TILE.madeira, 0.8, 0.8, 0.8)]);
function poco(x, z) { const p = []; for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) if (i || j) p.push(cubo(x + i * 0.7, 0, z + j * 0.7, TILE.pedra, TILE.pedra, 0.7, 0.8, 0.7)); p.push(cubo(x, 0, z, TILE.agua, TILE.agua, 0.7, 0.5, 0.7)); return modulo(p); }
function muroFrente(x, z) { const p = []; for (let i = 0; i < 6; i++) for (let k = 0; k < 3; k++) p.push(cubo(x + i + 0.5, k, z, TILE.pedra)); return modulo(p, true); } // oclusor: recortado perto do herói
// 30 módulos
export function praca() {
  const m = [casa(-10, -10), casa(-4, -11), casa(4, -10), casa(9, -6), poco(0, -1)];
  for (const [x, z] of [[-11, -3], [-11, 3], [11, 3], [-7, 8], [9, 9], [-12, 9]]) m.push(arvore(x, z));
  for (const [x, z] of TOCHAS.slice(0, 6)) m.push(poste(x, z));
  m.push(cerca(-8, 6, 4), cerca(3, 6, 4), cerca(-12, -6, 3), cerca(10, -2, 3), cerca(-3, 10, 5));
  m.push(caixa(6, -5), caixa(6.9, -5), caixa(-6, -6), modulo([cubo(-2, 0, 3, TILE.madeira, TILE.madeira, 2, 0.5, 0.6)]), modulo([cubo(2, 0, 3, TILE.madeira, TILE.madeira, 2, 0.5, 0.6)]));
  m.push(modulo([cubo(7, 0, 2, TILE.madeira, TILE.madeira, 2, 1, 1), cubo(7, 1, 2, TILE.telhado, TILE.telhado, 2.4, 0.2, 1.4)]));
  m.push(modulo([cubo(-7, 0, -1, TILE.pedra, TILE.pedra, 1, 0.6, 1), cubo(-7, 0.6, -1, TILE.pedra, TILE.pedra, 0.5, 1.4, 0.5)]));
  m.push(muroFrente(-3, 5.2));
  return m;
}
export function chaoTiles(n = 32) {
  const t = [];
  for (let i = -n / 2; i < n / 2; i++) for (let j = -n / 2; j < n / 2; j++) { const d = Math.hypot(i, j); t.push({ x: i + 0.5, z: j + 0.5, tile: d < 5 ? TILE.pedra : d < 7 ? TILE.terra : TILE.grama }); }
  return t;
}
// Geometria crua (sem motor) de uma lista de caixas: posições, normais, UVs do atlas, índices.
const FACES = [ // +x -x +y -y +z -z ; cada face: normal e 4 cantos (u,v)
  { n: [1, 0, 0], c: [[1, 0, 1, 0, 0], [1, 0, 0, 1, 0], [1, 1, 0, 1, 1], [1, 1, 1, 0, 1]] },
  { n: [-1, 0, 0], c: [[0, 0, 0, 0, 0], [0, 0, 1, 1, 0], [0, 1, 1, 1, 1], [0, 1, 0, 0, 1]] },
  { n: [0, 1, 0], c: [[0, 1, 1, 0, 0], [1, 1, 1, 1, 0], [1, 1, 0, 1, 1], [0, 1, 0, 0, 1]] },
  { n: [0, -1, 0], c: [[0, 0, 0, 0, 0], [1, 0, 0, 1, 0], [1, 0, 1, 1, 1], [0, 0, 1, 0, 1]] },
  { n: [0, 0, 1], c: [[0, 0, 1, 0, 0], [1, 0, 1, 1, 0], [1, 1, 1, 1, 1], [0, 1, 1, 0, 1]] },
  { n: [0, 0, -1], c: [[1, 0, 0, 0, 0], [0, 0, 0, 1, 0], [0, 1, 0, 1, 1], [1, 1, 0, 0, 1]] },
];
export function geometriaCaixas(caixas) {
  const pos = [], nor = [], uv = [], idx = [];
  for (const c of caixas) {
    FACES.forEach((f, fi) => {
      const tile = fi === 2 ? c.topo : c.lado, tx = tile % 16, ty = Math.floor(tile / 16), base = pos.length / 3;
      for (const [px, py, pz, u, v] of f.c) {
        pos.push(c.x + (px - 0.5) * c.sx, c.y + py * c.sy, c.z + (pz - 0.5) * c.sz); nor.push(...f.n);
        uv.push((tx + 0.002 + u * 0.996) / 16, 1 - (ty + 0.002 + (1 - v) * 0.996) / 16); // v da imagem cresce para baixo
      }
      idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
    });
  }
  return { pos: new Float32Array(pos), nor: new Float32Array(nor), uv: new Float32Array(uv), idx: new Uint32Array(idx) };
}
export function geometriaChao(tiles) {
  const caixas = tiles.map((t) => ({ x: t.x, y: -0.001, z: t.z, lado: t.tile, topo: t.tile, sx: 1, sy: 0.001, sz: 1 }));
  return geometriaCaixas(caixas);
}
