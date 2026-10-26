// Mapa da praça: terreno por tiles (material do chão) + colisores do kit (retângulo, círculo, cerca) com deslize. A pegada vem de
// data/config/cfg_kit.json (mesmo dado do visual). Coordenadas do mundo em tiles: x e z no plano do chão (câmera isométrica olha de +x,+z).
export const MATERIAIS = ['grama', 'terra', 'calcada', 'musgo']; // índice = canal do mapa de mistura do chão

/** Colisor do objeto de mapa segundo a pegada do kit, ou null se o objeto não bloqueia. */
export function colisorDe(o, kit) {
  const p = kit.pegadas[o.tipo]; if (!p) return null;
  const esc = o.escala ?? 1;
  if (p.forma === 'circ') return { forma: 'circ', x: o.x, z: o.z, r: p.raio * esc, id: o.id };
  if (p.forma === 'ret') {
    const w = p.w ?? o.w, d = p.d ?? o.d, giro = (((o.rot ?? 0) % 180) + 180) % 180 === 90, hw = (giro ? d : w) / 2, hd = (giro ? w : d) / 2;
    return { forma: 'ret', x0: o.x - hw, z0: o.z - hd, x1: o.x + hw, z1: o.z + hd, id: o.id };
  }
  if (p.forma === 'linha') return { forma: 'linha', ax: o.x0, az: o.z0, bx: o.x1, bz: o.z1, r: p.espessura / 2, id: o.id };
  return null;
}

export function criarMapa(dados, kit, cfgMundo) {
  const [L, A] = dados.tamanho;
  const colisores = dados.objetos.map((o) => colisorDe(o, kit)).filter(Boolean);
  const CEL = 4, nx = Math.ceil(L / CEL), nz = Math.ceil(A / CEL), grade = Array.from({ length: nx * nz }, () => []);
  const caixa = (c) => (c.forma === 'circ' ? [c.x - c.r, c.z - c.r, c.x + c.r, c.z + c.r] : c.forma === 'ret' ? [c.x0, c.z0, c.x1, c.z1] : [Math.min(c.ax, c.bx) - c.r, Math.min(c.az, c.bz) - c.r, Math.max(c.ax, c.bx) + c.r, Math.max(c.az, c.bz) + c.r]);
  for (const c of colisores) { const [a, b, e, f] = caixa(c); for (let j = Math.max(0, Math.floor(b / CEL)); j <= Math.min(nz - 1, Math.floor(f / CEL)); j++) for (let i = Math.max(0, Math.floor(a / CEL)); i <= Math.min(nx - 1, Math.floor(e / CEL)); i++) grade[j * nx + i].push(c); }
  const candidatos = (x, z, r) => { const s = new Set(); for (let j = Math.max(0, Math.floor((z - r) / CEL)); j <= Math.min(nz - 1, Math.floor((z + r) / CEL)); j++) for (let i = Math.max(0, Math.floor((x - r) / CEL)); i <= Math.min(nx - 1, Math.floor((x + r) / CEL)); i++) for (const c of grade[j * nx + i]) s.add(c); return s; };

  // ponto mais próximo do colisor ao ponto (px, pz) e a folga de raio (o círculo de raio r toca se dist < folga + r)
  function maisProximo(c, px, pz, saida) {
    if (c.forma === 'circ') { saida.x = c.x; saida.z = c.z; saida.folga = c.r; return; }
    if (c.forma === 'ret') { saida.x = Math.min(c.x1, Math.max(c.x0, px)); saida.z = Math.min(c.z1, Math.max(c.z0, pz)); saida.folga = 0; return; }
    const dx = c.bx - c.ax, dz = c.bz - c.az, t = Math.min(1, Math.max(0, ((px - c.ax) * dx + (pz - c.az) * dz) / (dx * dx + dz * dz || 1)));
    saida.x = c.ax + t * dx; saida.z = c.az + t * dz; saida.folga = c.r;
  }
  const pp = { x: 0, z: 0, folga: 0 };

  /**
   * Empurra o círculo (raio r) para fora dos colisores do mapa e de `obstaculos` circulares {x,z,r}; limites do mapa incluídos.
   * Devolve em `saida` a normal acumulada do empurrão (para remover a velocidade contra a parede e deslizar).
   */
  function resolverCirculo(pos, r, obstaculos, saida) {
    saida.nx = 0; saida.nz = 0;
    for (let it = 0; it < cfgMundo.colisao_iteracoes; it++) {
      let moveu = false;
      const empurra = (cx, cz, folga) => {
        let dx = pos.x - cx, dz = pos.z - cz; const d2 = dx * dx + dz * dz, lim = folga + r;
        if (d2 >= lim * lim) return;
        let d = Math.sqrt(d2);
        if (d < 1e-9) { dx = 1; dz = 0; d = 1; }
        const pen = lim - d + 1e-6; pos.x += (dx / d) * pen; pos.z += (dz / d) * pen; saida.nx += dx / d; saida.nz += dz / d; moveu = true;
      };
      for (const c of candidatos(pos.x, pos.z, r + 1)) {
        if (c.forma === 'ret' && pos.x > c.x0 && pos.x < c.x1 && pos.z > c.z0 && pos.z < c.z1) { // centro dentro do retângulo: sai pela borda mais próxima
          const e = pos.x - c.x0, o = c.x1 - pos.x, n = pos.z - c.z0, s = c.z1 - pos.z, m = Math.min(e, o, n, s);
          if (m === e) { pos.x = c.x0 - r; saida.nx -= 1; } else if (m === o) { pos.x = c.x1 + r; saida.nx += 1; } else if (m === n) { pos.z = c.z0 - r; saida.nz -= 1; } else { pos.z = c.z1 + r; saida.nz += 1; }
          moveu = true; continue;
        }
        maisProximo(c, pos.x, pos.z, pp); empurra(pp.x, pp.z, pp.folga);
      }
      if (obstaculos) for (const o of obstaculos) empurra(o.x, o.z, o.r);
      if (pos.x < r) { pos.x = r; saida.nx += 1; moveu = true; } if (pos.z < r) { pos.z = r; saida.nz += 1; moveu = true; }
      if (pos.x > L - r) { pos.x = L - r; saida.nx -= 1; moveu = true; } if (pos.z > A - r) { pos.z = A - r; saida.nz -= 1; moveu = true; }
      if (!moveu) break;
    }
    const m = Math.hypot(saida.nx, saida.nz); if (m > 0) { saida.nx /= m; saida.nz /= m; }
  }
  /** O círculo (x, z, r) cabe sem encostar em nada? */
  function livre(x, z, r) {
    if (x < r || z < r || x > L - r || z > A - r) return false;
    for (const c of candidatos(x, z, r + 1)) { if (c.forma === 'ret' && x > c.x0 && x < c.x1 && z > c.z0 && z < c.z1) return false; maisProximo(c, x, z, pp); if (Math.hypot(x - pp.x, z - pp.z) < pp.folga + r) return false; }
    return true;
  }
  const materialEm = (x, z) => dados.legenda[dados.planta[Math.min(A - 1, Math.max(0, Math.floor(z)))][Math.min(L - 1, Math.max(0, Math.floor(x)))]];
  return { largura: L, altura: A, dados, colisores, resolverCirculo, livre, materialEm };
}
