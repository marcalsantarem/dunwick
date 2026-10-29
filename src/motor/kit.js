// Kit isométrico do cenário, gerado por código a partir de data/config/cfg_kit.json + objetos do mapa. Cada peça vira geometria
// já posicionada no mundo e FUNDIDA por material (poucas chamadas de desenho). Só as faces +x e +z (as que a câmera vê) ganham detalhe.
// Unidades: tiles. Aleatório sempre por semente (reprodutível). Nada aqui conhece a simulação.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { PECAS_VILA, materiaisCasa, decorarCasa } from './kit_vila.js';
import { PECAS_INTERIOR } from './kit_interior.js';

export const rng = (s) => { let x = (s >>> 0) || 1; return () => ((x = (x * 1664525 + 1013904223) >>> 0) / 4294967296); };
const M4 = new THREE.Matrix4(), V3 = new THREE.Vector3(), Q = new THREE.Quaternion(), E = new THREE.Euler();
const COPAS = ['#2E5434', '#3F6B2A', '#4F7A30', '#5E8C3A', '#6FA046'].map((h) => new THREE.Color(h));

/** Coletor: acumula geometrias por chave de material e as funde no fim. */
export function criarColetor(texelsPorTile) {
  const grupos = new Map(), escalaUV = (256 / texelsPorTile) ** -1; // 1 repetição de textura = 256/texelsPorTile tiles
  const lista = (k) => grupos.get(k) ?? grupos.set(k, []).get(k);
  const projetarUV = (g, escala = escalaUV) => { // UV planar por eixo dominante da normal, em unidades de mundo
    const p = g.attributes.position, n = g.attributes.normal, uv = new Float32Array(p.count * 2);
    for (let i = 0; i < p.count; i++) { const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i)); let u, v; if (ay >= ax && ay >= az) { u = p.getX(i); v = p.getZ(i); } else if (ax >= az) { u = p.getZ(i); v = p.getY(i); } else { u = p.getX(i); v = p.getY(i); } uv[i * 2] = u * escala; uv[i * 2 + 1] = v * escala; }
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); return g;
  };
  const col = {
    grupos, escalaUV, projetarUV,
    /** Adiciona geometria (já em coordenadas de mundo após `m`) ao grupo `mat`. `uv: false` mantém o UV original. */
    geo(mat, g, m = null, { uv = true, escala } = {}) {
      let x = g.index ? g.toNonIndexed() : g.clone(); if (m) x.applyMatrix4(m);
      if (uv) projetarUV(x, escala); else if (!x.attributes.uv) x.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(x.attributes.position.count * 2), 2));
      for (const k of Object.keys(x.attributes)) if (!['position', 'normal', 'uv', 'color', 'balanco'].includes(k)) x.deleteAttribute(k);
      lista(mat).push(x); return x;
    },
    caixa(mat, cx, cy, cz, w, h, d, ry = 0, extra) { M4.compose(V3.set(cx, cy, cz), Q.setFromEuler(E.set(0, ry, 0)), new THREE.Vector3(1, 1, 1)); return col.geo(mat, new THREE.BoxGeometry(w, h, d), M4.clone(), extra); },
    /** Viga/barra de p0 a p1 com seção esp × esp. */
    viga(mat, p0, p1, esp) { const a = new THREE.Vector3(...p0), b = new THREE.Vector3(...p1), dir = b.clone().sub(a), len = dir.length(); Q.setFromUnitVectors(new THREE.Vector3(1, 0, 0), dir.normalize()); M4.compose(a.add(b).multiplyScalar(0.5), Q, new THREE.Vector3(1, 1, 1)); return col.geo(mat, new THREE.BoxGeometry(len, esp, esp), M4.clone()); },
    fundir() { const out = new Map(); for (const [k, l] of grupos) if (l.length) { const g = mergeGeometries(l, false); out.set(k, g); } return out; },
  };
  return col;
}

export const folhagemGeo = (g, centro, baseY, topoY, seed, claro = 0.5) => { // cor por vértice (variação de verde) + peso de balanço pelo vento
  const r = rng(seed), p = g.attributes.position, cor = new Float32Array(p.count * 3), bal = new Float32Array(p.count);
  for (let i = 0; i < p.count; i++) { const t = Math.min(1, Math.max(0, (p.getY(i) - baseY) / Math.max(0.01, topoY - baseY))), k = Math.min(4, Math.max(0, (t * 0.7 + claro * 0.3 + (r() - 0.5) * 0.35) * 5)), a = COPAS[Math.floor(k)], b = COPAS[Math.min(4, Math.floor(k) + 1)], c = a.clone().lerp(b, k - Math.floor(k)); cor[i * 3] = c.r; cor[i * 3 + 1] = c.g; cor[i * 3 + 2] = c.b; bal[i] = Math.min(1, Math.max(0, (p.getY(i) - baseY * 0.6) / Math.max(0.5, topoY))); }
  g.setAttribute('color', new THREE.BufferAttribute(cor, 3)); g.setAttribute('balanco', new THREE.BufferAttribute(bal, 1)); void centro; return g;
};
export function blobIco(raio, detalhe, semente, amp = 0.18) { // esfera irregular
  const g = new THREE.IcosahedronGeometry(raio, detalhe), p = g.attributes.position, r = rng(semente), mapa = new Map();
  for (let i = 0; i < p.count; i++) { const k = `${p.getX(i).toFixed(3)},${p.getY(i).toFixed(3)},${p.getZ(i).toFixed(3)}`; if (!mapa.has(k)) mapa.set(k, 1 + (r() - 0.5) * 2 * amp); const f = mapa.get(k); p.setXYZ(i, p.getX(i) * f, p.getY(i) * f * 0.9, p.getZ(i) * f); }
  g.computeVertexNormals(); return g;
}

// ---------------------------------------------------------------- peças
function casa(col, o, kit, saida) {
  const M = materiaisCasa(o);
  const v = kit.visual.casa, giro = (((o.rot ?? 0) % 180) + 180) % 180 === 90, w = giro ? o.d : o.w, d = giro ? o.w : o.d;
  const h = v.parede_altura, base = v.base_pedra, rh = v.telhado_altura, bei = v.beiral, cx = o.x, cz = o.z, r = rng(o.seed ?? 1);
  const mTelha = { telha: 'telha_laranja', ardosia: 'ardosia', musgo: 'telha_musgo' }[o.telhado];
  col.caixa(M.pedra, cx, base / 2, cz, w + 0.18, base, d + 0.18);
  col.caixa(M.reboco, cx, base + (h - base) / 2, cz, w, h - base, d);
  const zf = cz + d / 2 + 0.035, xf = cx + w / 2 + 0.035, esp = 0.13, yTopo = h - 0.06;
  // enxaimel nas faces visíveis (+z e +x): postes, vigas horizontais e travessas em X
  const face = (comp, fixo, ehZ) => {
    const n = Math.max(2, Math.round(comp / 1.25)), p0 = (ehZ ? cx - w / 2 : cz - d / 2);
    const P = (t, y) => (ehZ ? [p0 + t, y, fixo] : [fixo, y, p0 + t]);
    for (let i = 0; i <= n; i++) col.viga(M.madeira, P((comp * i) / n, base), P((comp * i) / n, yTopo), esp);
    col.viga(M.madeira, P(0, base + 0.05), P(comp, base + 0.05), esp); col.viga(M.madeira, P(0, yTopo), P(comp, yTopo), esp); col.viga(M.madeira, P(0, (base + h) / 2 + 0.2), P(comp, (base + h) / 2 + 0.2), esp * 0.8);
    for (let i = 0; i < n; i++) if ((i + (o.seed ?? 0)) % 2 === 0) col.viga(M.madeira, P((comp * i) / n, base + 0.05), P((comp * (i + 1)) / n, (base + h) / 2 + 0.2), esp * 0.7);
  };
  face(w, zf, true); face(d, xf, false);
  // porta (+z) e janelas
  // porta no MEIO da parede do `lado` ('s' = +z, 'l' = +x, 'o' = −x, 'n' = −z; padrão 's'): é onde o gatilho do portal está colado (layout do 14).
  // Só 's' e 'l' aparecem para a câmera; 'o' e 'n' ficam nas costas da casa (desenhadas, mas escondidas).
  const lado = o.lado ?? 's', dh = 1.75; r(); // r() consumido para não mudar as outras sementes
  { const e = 0.035, ez = lado === 's' ? cz + d / 2 + e : cz - d / 2 - e, ex = lado === 'l' ? cx + w / 2 + e : cx - w / 2 - e, sg = lado === 's' || lado === 'l' ? 1 : -1, topo = base + dh + 0.05;
    if (lado === 's' || lado === 'n') {
      col.caixa('tabuas', cx, base + dh / 2, ez + 0.02 * sg, 0.95, dh, 0.06, 0, { uv: true }); for (const t of [-0.5, 0.5]) col.viga(M.madeira, [cx + t, base, ez + 0.05 * sg], [cx + t, topo, ez + 0.05 * sg], 0.1);
      col.viga(M.madeira, [cx - 0.5, topo, ez + 0.05 * sg], [cx + 0.5, topo, ez + 0.05 * sg], 0.1); col.caixa(M.pedra, cx, 0.08, ez + 0.3 * sg, 1.2, 0.16, 0.5);
    } else {
      col.caixa('tabuas', ex + 0.02 * sg, base + dh / 2, cz, 0.06, dh, 0.95, 0, { uv: true }); for (const t of [-0.5, 0.5]) col.viga(M.madeira, [ex + 0.05 * sg, base, cz + t], [ex + 0.05 * sg, topo, cz + t], 0.1);
      col.viga(M.madeira, [ex + 0.05 * sg, topo, cz - 0.5], [ex + 0.05 * sg, topo, cz + 0.5], 0.1); col.caixa(M.pedra, ex + 0.3 * sg, 0.08, cz, 0.5, 0.16, 1.2);
    } }
  const px = lado === 's' ? cx : null;
  let nj = o.janelas ?? 2;
  const slots = [];
  for (let i = 0; i < Math.max(1, Math.floor((w - 1) / 1.6)); i++) { const sx = cx - w / 2 + 1.0 + i * 1.6; if (px === null || Math.abs(sx - px) > 1.1) slots.push({ ehZ: true, a: sx }); }
  for (let i = 0; i < Math.max(1, Math.floor((d - 0.6) / 1.5)); i++) { const sz = cz - d / 2 + 0.9 + i * 1.5; if (lado !== 'l' || Math.abs(sz - cz) > 1.1) slots.push({ ehZ: false, a: sz }); }
  for (const s of slots) { if (nj-- <= 0) break;
    const y = base + 1.15, gw = 0.55, gh = 0.62;
    if (s.ehZ) { col.geo('janela', new THREE.PlaneGeometry(gw, gh), new THREE.Matrix4().makeTranslation(s.a, y, zf + 0.012), { uv: false }); for (const [dx, dy, ww, hh] of [[0, gh / 2, gw + 0.14, 0.07], [0, -gh / 2, gw + 0.14, 0.07], [-gw / 2, 0, 0.07, gh], [gw / 2, 0, 0.07, gh], [0, 0, 0.04, gh]]) col.caixa(M.madeira, s.a + dx, y + dy, zf + 0.03, ww, hh, 0.07); saida.janelas.push({ x: s.a, y, z: zf + 0.1 }); }
    else { M4.compose(new THREE.Vector3(xf + 0.012, y, s.a), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 2, 0)), new THREE.Vector3(1, 1, 1)); col.geo('janela', new THREE.PlaneGeometry(gw, gh), M4.clone(), { uv: false }); for (const [dz, dy, ww, hh] of [[0, gh / 2, gw + 0.14, 0.07], [0, -gh / 2, gw + 0.14, 0.07], [-gw / 2, 0, 0.07, gh], [gw / 2, 0, 0.07, gh], [0, 0, 0.04, gh]]) col.caixa(M.madeira, xf + 0.03, y + dy, s.a + dz, 0.07, hh, ww); saida.janelas.push({ x: xf + 0.1, y, z: s.a }); } }
  // telhado de duas águas: cumeeira ao longo do lado maior
  const L = Math.max(w, d), S = Math.min(w, d), e = S / 2 + bei, y0 = h, y1 = h + rh, l0 = -L / 2 - bei, l1 = L / 2 + bei, comp = Math.hypot(e, rh), esc = col.escalaUV;
  const plano = (sinal) => { const g = new THREE.BufferGeometry(); const z0 = sinal * e, P = [[l0, y0, z0], [l1, y0, z0], [l1, y1, 0], [l0, y1, 0]];
    g.setAttribute('position', new THREE.Float32BufferAttribute(P.flat(), 3)); const ny = e / comp, nz = (sinal * rh) / comp; g.setAttribute('normal', new THREE.Float32BufferAttribute(Array(4).fill([0, ny, nz]).flat(), 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute([l0 * esc, 0, l1 * esc, 0, l1 * esc, comp * esc, l0 * esc, comp * esc], 2)); g.setIndex(sinal > 0 ? [0, 1, 2, 0, 2, 3] : [0, 2, 1, 0, 3, 2]); return g; };
  const empena = (x, sinal) => { const g = new THREE.BufferGeometry(), hw = S / 2; g.setAttribute('position', new THREE.Float32BufferAttribute([x, y0, -hw, x, y0, hw, x, y1, 0], 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(Array(3).fill([sinal, 0, 0]).flat(), 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, S * esc, 0, S * esc / 2, rh * esc], 2)); g.setIndex(sinal > 0 ? [0, 2, 1] : [0, 1, 2]); return g; };
  const ang = d > w ? -Math.PI / 2 : 0, T = new THREE.Matrix4().makeTranslation(cx, 0, cz).multiply(new THREE.Matrix4().makeRotationY(ang));
  col.geo(mTelha, plano(1), T, { uv: false }); col.geo(mTelha, plano(-1), T, { uv: false }); col.geo(M.reboco, empena(L / 2, 1), T, { uv: false }); col.geo(M.reboco, empena(-L / 2, -1), T, { uv: false });
  // espessura do telhado e cumeeira
  for (const sinal of [1, -1]) { const pa = new THREE.Vector3(l0, y0, sinal * e).applyMatrix4(T), pb = new THREE.Vector3(l1, y0, sinal * e).applyMatrix4(T); col.viga(M.madeira, [pa.x, pa.y, pa.z], [pb.x, pb.y, pb.z], 0.14); }
  { const pa = new THREE.Vector3(l0, y1 + 0.04, 0).applyMatrix4(T), pb = new THREE.Vector3(l1, y1 + 0.04, 0).applyMatrix4(T); col.viga(M.madeira, [pa.x, pa.y, pa.z], [pb.x, pb.y, pb.z], 0.18); }
  if (o.chamine) { const qx = cx + (giro ? 0 : w / 2 - 0.9), qz = cz + (giro ? d / 2 - 0.9 : -0.2), top = y0 + rh * 0.75 + 0.9; col.caixa(M.pedra, qx, (top + y0) / 2 - 0.2, qz, 0.6, top - y0 + 0.4, 0.6); col.caixa(M.pedra, qx, top + 0.08, qz, 0.78, 0.16, 0.78); saida.chamines.push({ x: qx, y: top + 0.2, z: qz }); }
}

function arvore(col, o, kit) {
  const v = kit.visual.arvore, r = rng(o.seed ?? 1), esc = o.escala ?? 1, th = v.tronco_altura * esc, R = v.copa_raio * esc, ry = ((o.rot ?? 0) * Math.PI) / 180;
  const tr = new THREE.CylinderGeometry(0.15 * esc, 0.27 * esc, th, 7, 1); M4.makeTranslation(o.x, th / 2, o.z); col.geo('casca', tr, M4.clone());
  const topoY = th + R * 1.6; folhagemCopas(col, o, v.copas, R, th, topoY, r, ry);
}
function folhagemCopas(col, o, n, R, th, topoY, r, ry) {
  for (let i = 0; i < n; i++) { const a = ry + (i / n) * Math.PI * 2 + r(), rad = R * (0.5 + r() * 0.35), dist = i === 0 ? 0 : R * (0.45 + r() * 0.25), y = th + R * (0.5 + (i === 0 ? 0.65 : r() * 0.5));
    const g = folhagemGeo(blobIco(rad, 1, Math.floor(r() * 1e6)), null, th, topoY, Math.floor(r() * 1e6), 0.3 + r() * 0.5); M4.makeTranslation(o.x + Math.cos(a) * dist, y, o.z + Math.sin(a) * dist); col.geo('folhagem', g, M4.clone(), { escala: col.escalaUV * 0.5 }); }
}
function pinheiro(col, o, kit) {
  const v = kit.visual.pinheiro, r = rng(o.seed ?? 1), esc = o.escala ?? 1, H = v.altura * esc, tr = new THREE.CylinderGeometry(0.1 * esc, 0.2 * esc, H * 0.35, 6); M4.makeTranslation(o.x, H * 0.175, o.z); col.geo('casca', tr, M4.clone());
  for (let i = 0; i < v.camadas; i++) { const t = i / v.camadas, ch = H * 0.42, rad = (1.25 - t * 0.8) * esc, y = H * 0.22 + t * H * 0.55 + ch / 2; const g = folhagemGeo(new THREE.ConeGeometry(rad, ch, 8), null, H * 0.15, H, Math.floor(r() * 1e6), 0.15 + t * 0.4); M4.makeTranslation(o.x, y, o.z); col.geo('folhagem', g, M4.clone(), { escala: col.escalaUV * 0.5 }); }
}
function arbusto(col, o) { const r = rng(o.seed ?? 1), esc = o.escala ?? 1; for (let i = 0; i < 3; i++) { const rad = (0.32 + r() * 0.22) * esc, g = folhagemGeo(blobIco(rad, 1, Math.floor(r() * 1e6)), null, 0, 0.9 * esc, Math.floor(r() * 1e6), 0.2 + r() * 0.6); M4.makeTranslation(o.x + (r() - 0.5) * 0.7 * esc, rad * 0.75, o.z + (r() - 0.5) * 0.7 * esc); col.geo('folhagem', g, M4.clone(), { escala: col.escalaUV * 0.5 }); } }
function pedra(col, o) { const r = rng(o.seed ?? 1), esc = o.escala ?? 1, g = blobIco(0.5 * esc, 1, Math.floor(r() * 1e6), 0.28); g.scale(1.15, 0.7, 1); M4.compose(new THREE.Vector3(o.x, 0.2 * esc, o.z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ((o.rot ?? 0) * Math.PI) / 180, 0)), new THREE.Vector3(1, 1, 1)); col.geo('pedra', g, M4.clone()); }
function poco(col, o) {
  const x = o.x, z = o.z; col.geo('pedra', new THREE.CylinderGeometry(1.1, 1.18, 0.95, 16, 1), new THREE.Matrix4().makeTranslation(x, 0.475, z)); col.geo('agua', new THREE.CircleGeometry(0.85, 16).rotateX(-Math.PI / 2), new THREE.Matrix4().makeTranslation(x, 0.9, z), { uv: false });
  for (const s of [-1, 1]) col.caixa('madeira', x + s * 1.0, 1.7, z, 0.16, 1.5, 0.16); col.viga('madeira', [x - 1.05, 2.45, z], [x + 1.05, 2.45, z], 0.18);
  for (const s of [-1, 1]) { const a = new THREE.BufferGeometry(); const hw = 1.0, y0 = 2.45, y1 = 3.1; a.setAttribute('position', new THREE.Float32BufferAttribute([x - 1.2, y0, z + s * hw, x + 1.2, y0, z + s * hw, x + 1.2, y1, z, x - 1.2, y1, z], 3)); const comp = Math.hypot(hw, 0.65); a.setAttribute('normal', new THREE.Float32BufferAttribute(Array(4).fill([0, hw / comp, (s * 0.65) / comp]).flat(), 3)); a.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1.2, 0, 1.2, 0.8, 0, 0.8], 2)); a.setIndex(s > 0 ? [0, 1, 2, 0, 2, 3] : [0, 2, 1, 0, 3, 2]); col.geo('telha_laranja', a, null, { uv: false }); }
  col.viga('madeira', [x, 2.4, z], [x, 1.5, z], 0.04); col.geo('madeira', new THREE.CylinderGeometry(0.17, 0.13, 0.25, 8), new THREE.Matrix4().makeTranslation(x, 1.35, z));
}
function torreSino(col, o, kit, saida) {
  const v = kit.visual.torre_sino, H = v.altura, x = o.x, z = o.z, hw = 1.0;
  col.caixa('pedra', x, 0.35, z, 2.4, 0.7, 2.4);
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) col.caixa('madeira', x + sx * hw * 0.85, H / 2 + 0.3, z + sz * hw * 0.85, 0.28, H - 0.6, 0.28);
  for (const y of [2.2, 4.2, 6.1]) for (const [a, b] of [[[-1, -1], [1, -1]], [[1, -1], [1, 1]], [[1, 1], [-1, 1]], [[-1, 1], [-1, -1]]]) col.viga('madeira', [x + a[0] * hw * 0.85, y, z + a[1] * hw * 0.85], [x + b[0] * hw * 0.85, y, z + b[1] * hw * 0.85], 0.16);
  for (const [a, b] of [[[1, 1], [-1, 1]], [[1, -1], [1, 1]]]) { col.viga('madeira', [x + a[0] * hw * 0.85, 2.2, z + a[1] * hw * 0.85], [x + b[0] * hw * 0.85, 4.2, z + b[1] * hw * 0.85], 0.12); col.viga('madeira', [x + b[0] * hw * 0.85, 2.2, z + b[1] * hw * 0.85], [x + a[0] * hw * 0.85, 4.2, z + a[1] * hw * 0.85], 0.12); }
  col.caixa('tabuas', x, 6.1, z, 2.0, 0.12, 2.0);
  // telhado em pirâmide + gancho vazio do sino (o Sino de Cobre foi arrancado)
  const cone = new THREE.ConeGeometry(1.9, 1.6, 4); cone.rotateY(Math.PI / 4); col.geo('telha_musgo', cone, new THREE.Matrix4().makeTranslation(x, H - 0.4, z));
  col.viga('madeira', [x, 6.1, z], [x, 6.7, z], 0.14); col.viga('madeira', [x - 0.9, 6.55, z], [x + 0.9, 6.55, z], 0.2);
  col.geo('metal', new THREE.TorusGeometry(0.16, 0.035, 6, 14), new THREE.Matrix4().makeTranslation(x, 5.55, z), { uv: false }); col.viga('metal', [x, 5.7, z], [x, 6.5, z], 0.05);
  saida.luzes.push({ x, y: 6.2, z, tipo: 'sino' });
}
export function lanterna(col, o, kit, saida) {
  const h = kit.visual.lanterna.altura, x = o.x, z = o.z;
  col.geo('madeira', new THREE.CylinderGeometry(0.07, 0.11, h, 6), new THREE.Matrix4().makeTranslation(x, h / 2, z)); col.viga('madeira', [x, h - 0.15, z], [x + 0.3, h - 0.15, z], 0.07);
  col.caixa('metal', x + 0.3, h - 0.42, z, 0.3, 0.05, 0.3); col.caixa('lampada', x + 0.3, h - 0.27, z, 0.22, 0.3, 0.22); col.caixa('metal', x + 0.3, h - 0.08, z, 0.3, 0.05, 0.3);
  saida.luzes.push({ x: x + 0.3, y: h - 0.27, z, tipo: 'lanterna', id: o.id });
}
function barril(col, o) { const x = o.x, z = o.z; col.geo('tabuas', new THREE.CylinderGeometry(0.34, 0.3, 0.85, 10), new THREE.Matrix4().makeTranslation(x, 0.425, z)); for (const y of [0.18, 0.67]) col.geo('metal', new THREE.CylinderGeometry(0.355, 0.355, 0.05, 10), new THREE.Matrix4().makeTranslation(x, y, z), { uv: false }); }
function caixote(col, o) { col.caixa('tabuas', o.x, 0.4, o.z, 0.8, 0.8, 0.8, ((o.rot ?? 0) * Math.PI) / 180); }
function cerca(col, o) {
  const dx = o.x1 - o.x0, dz = o.z1 - o.z0, len = Math.hypot(dx, dz), n = Math.max(1, Math.round(len / 1.3));
  for (let i = 0; i <= n; i++) { const t = i / n, x = o.x0 + dx * t, z = o.z0 + dz * t; col.caixa('madeira', x, 0.55, z, 0.14, 1.1, 0.14); }
  for (const y of [0.4, 0.85]) col.viga('tabuas', [o.x0, y, o.z0], [o.x1, y, o.z1], 0.1);
}

/** Constrói o kit do mapa. Devolve { grupos: Map(mat → geometria fundida), luzes, janelas, chamines }. */
export function construirKit(mapaDados, kit, texelsPorTile = 64) {
  const col = criarColetor(texelsPorTile), saida = { luzes: [], janelas: [], chamines: [] };
  for (const o of mapaDados.objetos) {
    switch (o.tipo) {
      case 'casa': { const j0 = saida.janelas.length; casa(col, o, kit, saida); decorarCasa(col, o, kit, saida, saida.janelas.slice(j0)); break; } case 'arvore': arvore(col, o, kit); break; case 'pinheiro': pinheiro(col, o, kit); break; case 'arbusto': arbusto(col, o); break;
      case 'pedra': pedra(col, o); break; case 'poco': poco(col, o); break; case 'torre_sino': torreSino(col, o, kit, saida); break; case 'lanterna': lanterna(col, o, kit, saida); break;
      case 'barril': barril(col, o); break; case 'caixote': caixote(col, o); break; case 'cerca': cerca(col, o); break;
      default: (PECAS_VILA[o.tipo] ?? PECAS_INTERIOR[o.tipo])?.(col, o, kit, saida);
    }
  }
  saida.grupos = col.fundir(); return saida;
}
