// Mapa da praça: terreno por tiles (material do chão) + colisores do kit (retângulo, círculo, cerca) com deslize. A pegada vem de
// data/config/cfg_kit.json (mesmo dado do visual). Coordenadas do mundo em tiles: x e z no plano do chão (câmera isométrica olha de +x,+z).
export const MATERIAIS = ['grama', 'terra', 'calcada', 'musgo']; // índice = canal do mapa de mistura do chão

/** Colisor(es) do objeto de mapa segundo a pegada do kit: um colisor, uma lista (pórtico = 2 postes) ou null. */
export function colisorDe(o, kit) {
  const p = kit.pegadas[o.tipo]; if (!p) return null;
  const esc = o.escala ?? 1;
  if (p.forma === 'circ') return { forma: 'circ', x: o.x, z: o.z, r: p.raio * esc, id: o.id };
  if (p.forma === 'ret') {
    const w = p.w ?? o.w, d = p.d ?? o.d, giro = (((o.rot ?? 0) % 180) + 180) % 180 === 90, hw = (giro ? d : w) / 2, hd = (giro ? w : d) / 2;
    return { forma: 'ret', x0: o.x - hw, z0: o.z - hd, x1: o.x + hw, z1: o.z + hd, id: o.id };
  }
  if (p.forma === 'linha') return { forma: 'linha', ax: o.x0, az: o.z0, bx: o.x1, bz: o.z1, r: p.espessura / 2, id: o.id };
  if (p.forma === 'dupla') { // pórtico: dois postes nas pontas do vão `w` (eixo x; com rot 90, eixo z); o meio fica livre
    const giro = (((o.rot ?? 0) % 180) + 180) % 180 === 90, dx = giro ? 0 : o.w / 2, dz = giro ? o.w / 2 : 0;
    return [{ forma: 'circ', x: o.x - dx, z: o.z - dz, r: p.raio, id: `${o.id}_a` }, { forma: 'circ', x: o.x + dx, z: o.z + dz, r: p.raio, id: `${o.id}_b` }];
  }
  return null;
}

export function criarMapa(dados, kit, cfgMundo) {
  const [L, A] = dados.tamanho;
  const colisores = dados.objetos.flatMap((o) => { const c = colisorDe(o, kit); return Array.isArray(c) ? c : c ? [c] : []; });
  // portais inativos bloqueiam a passagem (o mundo dá o aviso ao encostar)
  const ret = (r, id, extra) => ({ forma: 'ret', x0: r[0], z0: r[1], x1: r[2], z1: r[3], id, ...extra });
  // contrato v0.1.2 (08): retângulo por centro+tamanho {x,z,w,d} (ou `ret` [x0,z0,x1,z1])
  const retDe = (o) => o.ret ?? [o.x - o.w / 2, o.z - o.d / 2, o.x + o.w / 2, o.z + o.d / 2];
  // edifícios: a pegada já vem do objeto "casa" (kit, com rot); não duplicar aqui
  for (const p of dados.portais ?? []) if (p.ativo === false) colisores.push(ret(retDe(p), p.id, { portal: true }));
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
  /** O segmento a→b cabe para um círculo de raio r (amostras a cada 1/4 de tile)? */
  function segmentoLivre(ax, az, bx, bz, r) {
    const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) * 4));
    for (let i = 1; i <= n; i++) { const t = i / n; if (!livre(ax + (bx - ax) * t, az + (bz - az) * t, r)) return false; }
    return true;
  }
  // rota do clique: A* numa grade de meio tile (8 vizinhos, sem cortar quina) + corte de cantos por linha de visão. Destino dentro de
  // algo sólido vai para a célula livre mais próxima; sem caminho devolve null. Grade calculada sob demanda por raio (cache).
  const PASSO = 0.5, gx = Math.floor(L / PASSO), gz = Math.floor(A / PASSO), cacheLivre = new Map();
  const centro = (i) => (i + 0.5) * PASSO;
  function gradeLivre(r) {
    let g = cacheLivre.get(r); if (g) return g;
    g = new Uint8Array(gx * gz); for (let j = 0; j < gz; j++) for (let i = 0; i < gx; i++) g[j * gx + i] = livre(centro(i), centro(j), r + 0.02) ? 1 : 0;
    cacheLivre.set(r, g); return g;
  }
  function celulaLivreProxima(g, x, z, raioMax) {
    const ci = Math.min(gx - 1, Math.max(0, Math.floor(x / PASSO))), cj = Math.min(gz - 1, Math.max(0, Math.floor(z / PASSO)));
    if (g[cj * gx + ci]) return cj * gx + ci;
    let melhor = -1, dm = Infinity; const R = Math.ceil(raioMax / PASSO);
    for (let j = Math.max(0, cj - R); j <= Math.min(gz - 1, cj + R); j++) for (let i = Math.max(0, ci - R); i <= Math.min(gx - 1, ci + R); i++) {
      if (!g[j * gx + i]) continue; const d = Math.hypot(centro(i) - x, centro(j) - z); if (d < dm) { dm = d; melhor = j * gx + i; }
    }
    return melhor;
  }
  /** Pontos de passagem [{x,z}…] de (ax,az) até (bx,bz) para um círculo de raio r; o último é o destino (ou a célula livre mais próxima). */
  function rota(ax, az, bx, bz, r) {
    if (livre(bx, bz, r) && segmentoLivre(ax, az, bx, bz, r)) return [{ x: bx, z: bz }];
    const g = gradeLivre(r), ini = celulaLivreProxima(g, ax, az, 2), fim = celulaLivreProxima(g, bx, bz, 6);
    if (ini < 0 || fim < 0) return null;
    const custo = new Float64Array(gx * gz).fill(Infinity), de = new Int32Array(gx * gz).fill(-1), fechado = new Uint8Array(gx * gz);
    const fi = fim % gx, fj = (fim / gx) | 0, h = (k) => { const dx = Math.abs((k % gx) - fi), dz = Math.abs(((k / gx) | 0) - fj); return Math.max(dx, dz) + 0.4142 * Math.min(dx, dz); };
    const heap = [], push = (k, f) => { heap.push([f, k]); let i = heap.length - 1; while (i > 0) { const pai = (i - 1) >> 1; if (heap[pai][0] <= heap[i][0]) break; [heap[pai], heap[i]] = [heap[i], heap[pai]]; i = pai; } };
    const pop = () => { const top = heap[0], ult = heap.pop(); if (heap.length) { heap[0] = ult; let i = 0; for (;;) { const a = 2 * i + 1, b = a + 1; let m = i; if (a < heap.length && heap[a][0] < heap[m][0]) m = a; if (b < heap.length && heap[b][0] < heap[m][0]) m = b; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top[1]; };
    custo[ini] = 0; push(ini, h(ini));
    while (heap.length) {
      const k = pop(); if (fechado[k]) continue; fechado[k] = 1; if (k === fim) break;
      const i = k % gx, j = (k / gx) | 0;
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
        if (!di && !dj) continue; const ni = i + di, nj = j + dj; if (ni < 0 || nj < 0 || ni >= gx || nj >= gz) continue;
        const n = nj * gx + ni; if (!g[n] || fechado[n]) continue;
        if (di && dj && (!g[j * gx + ni] || !g[nj * gx + i])) continue;
        const c = custo[k] + (di && dj ? 1.4142 : 1); if (c < custo[n]) { custo[n] = c; de[n] = k; push(n, c + h(n)); }
      }
    }
    if (!fechado[fim]) return null;
    const cel = []; for (let k = fim; k !== -1; k = de[k]) cel.push({ x: centro(k % gx), z: centro((k / gx) | 0) }); cel.reverse();
    const destino = livre(bx, bz, r) ? { x: bx, z: bz } : cel[cel.length - 1]; cel[cel.length - 1] = destino;
    const pontos = []; let ox = ax, oz = az, i = 0;
    while (i < cel.length) { let k = cel.length - 1; while (k > i && !segmentoLivre(ox, oz, cel[k].x, cel[k].z, r)) k--; pontos.push(cel[k]); ox = cel[k].x; oz = cel[k].z; i = k + 1; }
    return pontos;
  }
  const materialEm = (x, z) => dados.legenda[dados.planta[Math.min(A - 1, Math.max(0, Math.floor(z)))][Math.min(L - 1, Math.max(0, Math.floor(x)))]];
  return { largura: L, altura: A, dados, colisores, resolverCirculo, livre, segmentoLivre, rota, materialEm };
}
