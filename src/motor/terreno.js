// Malha do mapa: topo de cada tile (com a altura de rampas/escadas por canto) + faces laterais onde o vizinho é mais baixo.
// Uma única geometria (1 chamada de desenho). UV exata no atlas (sem recuo): 1 texel de arte = 1 pixel da resolução interna.
import * as THREE from 'three';

const PAREDE = 1; // índice do tile de parede no atlas, usado nas laterais

export function construirTerreno(mapa, atlas, materialBase) {
  const L = mapa.largura, A = mapa.altura, colunas = atlas.colunas;
  const pos = [], nor = [], uv = [], idx = [];
  const us = [[0, 0], [1, 0], [1, 1], [0, 1]];

  // Quadrilátero com 4 cantos; `n` é a normal desejada (para fora). O enrolamento dos índices é ajustado pela geometria (Newell).
  const quad = (v, n, tile) => {
    const b = pos.length / 3;
    for (let k = 0; k < 4; k++) { pos.push(...v[k]); nor.push(...n); uv.push((tile + us[k][0]) / colunas, us[k][1]); }
    let gx = 0, gy = 0, gz = 0;
    for (let k = 0; k < 4; k++) { const p = v[k], q = v[(k + 1) % 4]; gx += (p[1] - q[1]) * (p[2] + q[2]); gy += (p[2] - q[2]) * (p[0] + q[0]); gz += (p[0] - q[0]) * (p[1] + q[1]); }
    if (gx * n[0] + gy * n[1] + gz * n[2] >= 0) idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
    else idx.push(b, b + 2, b + 1, b, b + 3, b + 2);
  };
  const normalizar = (v) => { const m = Math.hypot(...v) || 1; return v.map((c) => c / m); };
  // altura do topo num ponto do tile: sólido = altura da parede (plana); senão a do tile (rampa/escada interpola)
  const alturaTopo = (ix, iz, x, z) => (mapa.solido[iz * L + ix] ? mapa.base[iz * L + ix] : mapa.alturaNoTile(ix, iz, x, z));

  for (let iz = 0; iz < A; iz++) for (let ix = 0; ix < L; ix++) {
    const h = (x, z) => alturaTopo(ix, iz, x, z), tile = mapa.indicePiso(ix, iz);
    const h00 = h(ix, iz), h10 = h(ix + 1, iz), h11 = h(ix + 1, iz + 1), h01 = h(ix, iz + 1);
    // normal do topo: gradiente da altura (rampa) → (-dh/dx, 1, -dh/dz)
    quad([[ix, h00, iz], [ix + 1, h10, iz], [ix + 1, h11, iz + 1], [ix, h01, iz + 1]], normalizar([-(h10 - h00 + h11 - h01) / 2, 1, -(h01 - h00 + h11 - h10) / 2]), tile);
    // laterais: se o topo deste tile é mais alto que o do vizinho ao longo da borda, desenha o degrau (face para fora)
    for (const { dx, dz, a, nrm } of [
      { dx: 1, dz: 0, a: [[ix + 1, iz], [ix + 1, iz + 1]], nrm: [1, 0, 0] },
      { dx: -1, dz: 0, a: [[ix, iz + 1], [ix, iz]], nrm: [-1, 0, 0] },
      { dx: 0, dz: 1, a: [[ix + 1, iz + 1], [ix, iz + 1]], nrm: [0, 0, 1] },
      { dx: 0, dz: -1, a: [[ix, iz], [ix + 1, iz]], nrm: [0, 0, -1] },
    ]) {
      const nx = ix + dx, nz = iz + dz;
      if (nx < 0 || nz < 0 || nx >= L || nz >= A) continue; // borda do mapa nunca é vista
      const ha = a.map(([x, z]) => h(x, z)), hb = a.map(([x, z]) => alturaTopo(nx, nz, x, z));
      if (ha[0] <= hb[0] + 1e-6 && ha[1] <= hb[1] + 1e-6) continue;
      quad([[a[0][0], hb[0], a[0][1]], [a[1][0], hb[1], a[1][1]], [a[1][0], ha[1], a[1][1]], [a[0][0], ha[0], a[0][1]]], nrm, PAREDE);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  const malha = new THREE.Mesh(g, materialBase);
  malha.castShadow = true; malha.receiveShadow = true;
  return malha;
}
