// Mapa em grade de tiles com alturas (plataforma, rampa, escada) e colisão círculo × tiles com deslizamento.
// Coordenadas: x cresce para leste, z para sul (câmera), altura é y. O tile (x, z) ocupa [x, x+1) × [z, z+1). Tudo vem de dados.
const PISO_INDICE = { piso: 0, parede: 1, plataforma: 2, rampa: 3 }; // índice do tile no atlas

export function criarMapa(dados, cfgMundo) {
  const [L, A] = dados.tamanho;
  const solido = new Uint8Array(L * A), base = new Float32Array(L * A), piso = new Uint8Array(L * A), rampa = new Int16Array(L * A).fill(-1);
  for (let z = 0; z < A; z++) for (let x = 0; x < L; x++) {
    const def = dados.legenda[dados.planta[z][x]], i = z * L + x;
    solido[i] = def.solido ? 1 : 0; base[i] = def.altura_tiles; piso[i] = PISO_INDICE[def.piso];
  }
  dados.rampas.forEach((r, k) => { const [rx, rz, rw, rh] = r.retangulo; for (let z = rz; z < rz + rh; z++) for (let x = rx; x < rx + rw; x++) rampa[z * L + x] = k; });
  const dentro = (ix, iz) => ix >= 0 && iz >= 0 && ix < L && iz < A;

  /** Altura do chão no ponto (x, z) usando a definição do tile (ix, iz): plano, ou interpolada em rampa/escada. */
  function alturaNoTile(ix, iz, x, z) {
    const r = rampa[iz * L + ix];
    if (r < 0) return base[iz * L + ix];
    const { retangulo: [rx, rz, rw, rh], eixo, altura_no_inicio: h0, altura_no_fim: h1 } = dados.rampas[r];
    const t = Math.min(1, Math.max(0, eixo === 'x' ? (x - rx) / rw : (z - rz) / rh));
    return h0 + (h1 - h0) * t;
  }
  /** Altura do chão no ponto (x, z) (tile = parte inteira). */
  function alturaEm(x, z) {
    return alturaNoTile(Math.min(L - 1, Math.max(0, Math.floor(x))), Math.min(A - 1, Math.max(0, Math.floor(z))), x, z);
  }
  const solidoTile = (ix, iz) => !dentro(ix, iz) || solido[iz * L + ix] === 1;

  /** Tile bloqueia um herói na altura `h` se for sólido ou se o degrau no ponto mais próximo passa do máximo. */
  function bloqueia(ix, iz, px, pz, h) {
    if (solidoTile(ix, iz)) return true;
    const cx = Math.min(ix + 1 - 1e-6, Math.max(ix, px)), cz = Math.min(iz + 1 - 1e-6, Math.max(iz, pz));
    return Math.abs(alturaEm(cx, cz) - h) > cfgMundo.degrau_max_tiles;
  }

  /**
   * Empurra o círculo (raio r) para fora de tiles bloqueados e de obstáculos circulares. Altera pos {x,z} e devolve a normal
   * acumulada do empurrão ({nx,nz}, módulo 0 se nada empurrou) para o chamador remover a velocidade contra a parede (deslize).
   */
  function resolverCirculo(pos, r, h, obstaculos, saida) {
    saida.nx = 0; saida.nz = 0;
    for (let it = 0; it < cfgMundo.colisao_iteracoes; it++) {
      let moveu = false;
      const x0 = Math.floor(pos.x - r), x1 = Math.floor(pos.x + r), z0 = Math.floor(pos.z - r), z1 = Math.floor(pos.z + r);
      for (let iz = z0; iz <= z1; iz++) for (let ix = x0; ix <= x1; ix++) {
        if (!bloqueia(ix, iz, pos.x, pos.z, h)) continue;
        const cx = Math.min(ix + 1, Math.max(ix, pos.x)), cz = Math.min(iz + 1, Math.max(iz, pos.z));
        let dx = pos.x - cx, dz = pos.z - cz, d2 = dx * dx + dz * dz;
        if (d2 >= r * r) continue;
        if (d2 < 1e-12) { // centro dentro do tile: sai pela borda mais próxima
          const e = pos.x - ix, o = ix + 1 - pos.x, n = pos.z - iz, s = iz + 1 - pos.z, m = Math.min(e, o, n, s);
          if (m === e) { dx = -1; dz = 0; pos.x = ix - r; } else if (m === o) { dx = 1; dz = 0; pos.x = ix + 1 + r; } else if (m === n) { dx = 0; dz = -1; pos.z = iz - r; } else { dx = 0; dz = 1; pos.z = iz + 1 + r; }
          saida.nx += dx; saida.nz += dz; moveu = true; continue;
        }
        const d = Math.sqrt(d2), pen = r - d + 1e-6;
        pos.x += (dx / d) * pen; pos.z += (dz / d) * pen; saida.nx += dx / d; saida.nz += dz / d; moveu = true;
      }
      if (obstaculos) for (const o of obstaculos) {
        const dx = pos.x - o.x, dz = pos.z - o.z, soma = r + o.r, d2 = dx * dx + dz * dz;
        if (d2 >= soma * soma) continue;
        const d = Math.sqrt(d2) || 1e-6, pen = soma - d + 1e-6;
        pos.x += (dx / d) * pen; pos.z += (dz / d) * pen; saida.nx += dx / d; saida.nz += dz / d; moveu = true;
      }
      if (!moveu) break;
    }
    const m = Math.hypot(saida.nx, saida.nz);
    if (m > 0) { saida.nx /= m; saida.nz /= m; }
  }

  return {
    largura: L, altura: A, dados, piso, solido, base,
    alturaEm, alturaNoTile, solidoTile, bloqueia, resolverCirculo,
    caminhavel: (ix, iz) => dentro(ix, iz) && !solido[iz * L + ix],
    indicePiso: (ix, iz) => piso[iz * L + ix],
    rampaDe: (ix, iz) => (dentro(ix, iz) ? rampa[iz * L + ix] : -1),
    zonaDe(x, z) { return dados.zonas.filter((q) => x >= q.retangulo[0] && x < q.retangulo[0] + q.retangulo[2] && z >= q.retangulo[1] && z < q.retangulo[1] + q.retangulo[3]).map((q) => q.id); },
  };
}
