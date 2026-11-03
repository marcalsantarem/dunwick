// RELEVO do mapa de mundo (v0.1.3b, 07): montanhas em 3D e floresta em massa, somados ao chão em shader do 08 (terreno_mundo.js).
// `criarRelevoMundo(mapaDados, cfgR, opcoes)` → { malha: Group, terreno, definirReduzirMovimento(b) }.
//
// Como é feito (tudo por código, sem arquivo de imagem):
//  • TEXTURA de cores por pixel (`px_relevo` px/tile, sem filtro, estilo pixel art): o terreno da `planta` vira bordas ORGÂNICAS (peso bilinear dos 4 tiles
//    vizinhos + ruído, vence o maior), com costa de areia e espuma, água rasa/funda, estrada com seixos, grama em três tons com flores, mata escura,
//    montanha com estratos, luz/sombra pelas encostas e neve nos picos. O canal alfa guarda a máscara da água (0 água, ~100 espuma, 255 terra).
//  • MALHA DE ALTURA: só as montanhas sobem (distância até o chão andável); todo tile andável fica em y = 0, então o herói e a colisão não mudam.
//  • FLORESTA EM MASSA: árvores, pinheiros e moitas espalhados pelos tiles de mata rala (e no sopé das montanhas), fundidos numa só malha.
//  • SHADER leve no mesmo material: ondas e brilho na água (em passos de 1/16 de tile), espuma que pulsa e sombras de nuvem deslizando; sem sombra do sol.
// A parte pura (`gerarTerreno`) não usa DOM nem three: roda em Node (testes e prévia).
import * as THREE from 'three';

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const hash = (x, z, s = 0) => { let h = (x * 374761393 + z * 668265263 + s * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };
const suave = (t) => t * t * (3 - 2 * t), mix = (a, b, t) => a + (b - a) * t, lim = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
/** Ruído de valor 2D suave, 0..1. */
const vn = (x, z, s) => { const ix = Math.floor(x), iz = Math.floor(z), fx = suave(x - ix), fz = suave(z - iz); return mix(mix(hash(ix, iz, s), hash(ix + 1, iz, s), fx), mix(hash(ix, iz + 1, s), hash(ix + 1, iz + 1, s), fx), fz); };
const fbm = (x, z, s) => vn(x, z, s) * 0.55 + vn(x * 2.1, z * 2.1, s + 1) * 0.3 + vn(x * 4.3, z * 4.3, s + 2) * 0.15;

export const PALETA_RELEVO = {
  grama: ['#79ab4e', '#6c9f46', '#88b957'], mata: ['#4a7d3a', '#427233', '#53883f'], estrada: ['#c4a26e', '#b8955f', '#d1b07d'], areia: ['#e0cf9c', '#d4c28c', '#ebdcae'],
  rasa: '#58bdbb', media: '#3a8fb5', funda: '#2a639b', espuma: '#eef8f6',
  rocha: ['#8a8e98', '#767b87', '#a29f9c'], luz: '#bfb6a6', sombra: '#4b5367', neve: '#f3f7fa', sopé: '#5c7f46',
  flores: ['#f4f0d0', '#f2d56b', '#e99ab8', '#c9a0e8'],
};
const C = (h) => hex(h);

/** Classe do terreno (papel visual) a partir do nome do material da legenda. */
const PAPEL = { grama: 'grama', mata_rala: 'mata', agua: 'agua', estrada: 'estrada', montanha: 'montanha', areia: 'areia', terra: 'estrada', calcada: 'estrada', musgo: 'mata' };

/** Distância (em tiles, chanfro) de cada tile de montanha até o tile não-montanha mais próximo; 0 fora da montanha. */
function distanciaMontanha(papeis, L, A) {
  const d = new Float32Array(L * A).fill(1e6), ehM = (x, z) => x >= 0 && z >= 0 && x < L && z < A && papeis[z * L + x] === 'montanha';
  for (let z = 0; z < A; z++) for (let x = 0; x < L; x++) if (!ehM(x, z)) d[z * L + x] = 0;
  const passe = (dx, dz, c) => (x, z) => { const nx = x + dx, nz = z + dz; if (nx < 0 || nz < 0 || nx >= L || nz >= A) return; const v = d[nz * L + nx] + c; if (v < d[z * L + x]) d[z * L + x] = v; };
  const f = [passe(-1, 0, 1), passe(0, -1, 1), passe(-1, -1, 1.414), passe(1, -1, 1.414)], b = [passe(1, 0, 1), passe(0, 1, 1), passe(1, 1, 1.414), passe(-1, 1, 1.414)];
  for (let z = 0; z < A; z++) for (let x = 0; x < L; x++) for (const p of f) p(x, z);
  for (let z = A - 1; z >= 0; z--) for (let x = L - 1; x >= 0; x--) for (const p of b) p(x, z);
  for (let z = 0; z < A; z++) for (let x = 0; x < L; x++) if (papeis[z * L + x] === 'montanha' && d[z * L + x] > 1e5) d[z * L + x] = 8; // mapa todo de montanha
  return d;
}

/**
 * Parte pura: gera os pixels da textura (RGBA) e a função de altura. `cfgT`: { px_relevo (padrão 24), altura_montanha (padrão 0,5), paleta? , borda_material }.
 * Devolve { largura, altura, dados, alturaEm(x,z), papeis, L, A, P }.
 */
export function gerarTerreno(mapaDados, cfgT = {}) {
  const [L, A] = mapaDados.tamanho, P = cfgT.px_relevo ?? 24, W = L * P, H = A * P, dados = new Uint8ClampedArray(W * H * 4), pal = { ...PALETA_RELEVO, ...(cfgT.paleta ?? {}) };
  const Hm = cfgT.altura_montanha ?? 0.5, papelDe = (n) => PAPEL[n] ?? 'grama', semente = mapaDados.seed ?? 11;
  const papeis = Array.from({ length: L * A }, (_, i) => papelDe(mapaDados.legenda[mapaDados.planta[Math.floor(i / L)][i % L]]));
  const papelEm = (x, z) => (x < 0 || z < 0 || x >= L || z >= A ? 'agua' : papeis[z * L + x]);
  const dm = distanciaMontanha(papeis, L, A), dmEm = (x, z) => (x < 0 || z < 0 || x >= L || z >= A ? 0 : dm[z * L + x]);
  // fração de água suavizada (3×3) por tile: define profundidade
  const agua = new Float32Array(L * A); for (let z = 0; z < A; z++) for (let x = 0; x < L; x++) { let s = 0; for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) s += papelEm(x + i, z + j) === 'agua' ? 1 : 0; agua[z * L + x] = s / 25; }
  const aguaEm = (x, z) => (x < 0 || z < 0 || x >= L || z >= A ? 1 : agua[z * L + x]);

  /** Interpolação bilinear a partir dos centros dos tiles. */
  const bil = (f, x, z) => { const fx = x - 0.5, fz = z - 0.5, i = Math.floor(fx), j = Math.floor(fz), tx = fx - i, tz = fz - j; return mix(mix(f(i, j), f(i + 1, j), tx), mix(f(i, j + 1), f(i + 1, j + 1), tx), tz); };
  /** Altura do terreno em (x, z) de mundo: só montanha; zero em todo tile andável (o ramo começa na divisa). */
  const alturaEm = (x, z) => {
    const d = bil(dmEm, x, z) - 0.5; if (d <= 0) return 0;
    const cr = 0.5 + 0.5 * (1 - Math.abs(vn(x * 1.3, z * 1.3, semente + 5) * 2 - 1)); // cristas
    const pico = 0.55 + 0.9 * suave(vn(x * 0.42, z * 0.42, semente + 6)); // picos e selas
    return Hm * Math.pow(d, 0.9) * (0.6 + 0.5 * cr) * pico * 1.25 + Math.min(d, 1) * 0.1 * fbm(x * 3, z * 3, semente + 9);
  };
  const LUZ = [-0.35, 0.8, 0.5], nl = Math.hypot(...LUZ);
  const luzDe = (x, z) => { const e = 0.08, hx = alturaEm(x + e, z) - alturaEm(x - e, z), hz = alturaEm(x, z + e) - alturaEm(x, z - e), n = [-hx / (2 * e), 1, -hz / (2 * e)], ln = Math.hypot(...n); return (n[0] * LUZ[0] + n[1] * LUZ[1] + n[2] * LUZ[2]) / (ln * nl); };
  const alturaMax = Hm * Math.pow(Math.max(1, ...dm.filter((v) => v < 1e5)), 0.9) * 1.1 + 0.1, limiteNeve = alturaMax * (cfgT.neve ?? 0.62);
  const cores = Object.fromEntries(Object.entries(pal).map(([k, v]) => [k, Array.isArray(v) ? v.map(C) : C(v)]));
  const tom = (c, k) => [c[0] * k, c[1] * k, c[2] * k], misturar = (a, b, t) => [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)], escolher = (arr, r) => arr[Math.min(arr.length - 1, Math.floor(r * arr.length))];
  const PAPEIS = ['grama', 'mata', 'estrada', 'agua', 'montanha', 'areia'];

  for (let py = 0; py < H; py++) for (let px = 0; px < W; px++) {
    const x = (px + 0.5) / P, z = (py + 0.5) / P, fx = x - 0.5, fz = z - 0.5, i0 = Math.floor(fx), j0 = Math.floor(fz), tx = fx - i0, tz = fz - j0;
    // pesos por papel nos 4 tiles vizinhos
    const pesos = {}; const somar = (i, j, w) => { const p = papelEm(i, j); pesos[p] = (pesos[p] ?? 0) + w; };
    somar(i0, j0, (1 - tx) * (1 - tz)); somar(i0 + 1, j0, tx * (1 - tz)); somar(i0, j0 + 1, (1 - tx) * tz); somar(i0 + 1, j0 + 1, tx * tz);
    let venc = 'grama', melhor = -1, segundo = -1;
    for (const p in pesos) { const v = pesos[p] + (fbm(x * 3.1 + PAPEIS.indexOf(p) * 17, z * 3.1, semente + 21) - 0.5) * 0.55; if (v > melhor) { segundo = melhor; melhor = v; venc = p; } else if (v > segundo) segundo = v; }
    const margem = melhor - Math.max(segundo, 0), wAgua = pesos.agua ?? 0, wMont = pesos.montanha ?? 0;
    const grande = fbm(x * 0.35, z * 0.35, semente + 3), fino = hash(px, py, 5), o = (py * W + px) * 4;
    let cor, alfa = 255;
    if (venc === 'agua') {
      const prof = lim((bil(aguaEm, x, z) - 0.35) / 0.55), c0 = prof < 0.5 ? misturar(cores.rasa, cores.media, prof * 2) : misturar(cores.media, cores.funda, (prof - 0.5) * 2);
      cor = tom(c0, 0.92 + 0.12 * fbm(x * 2, z * 2, semente + 30)); alfa = 0;
      if (wAgua < 0.62 + 0.1 * fbm(x * 6, z * 6, semente + 8) && wAgua < 0.78) { cor = misturar(cor, cores.espuma, 0.85 * lim((0.78 - wAgua) / 0.25)); alfa = 100; } // espuma na margem
    } else if (venc === 'montanha') {
      const h = alturaEm(x, z), luz = luzDe(x, z), estrato = Math.sin((h * 9 + fbm(x * 4, z * 4, semente + 40) * 3) * 3) * 0.05, rocha = tom(escolher(cores.rocha, fbm(x * 5, z * 5, semente + 41)), 1);
      const l = lim(0.5 + luz * 0.65 + estrato, 0, 1.05); cor = l > 0.5 ? misturar(rocha, cores.luz, (l - 0.5) * 1.5) : misturar(cores.sombra, rocha, l * 2);
      const sopé = 1 - lim(h / (alturaMax * 0.2) + (fbm(x * 6, z * 6, semente + 42) - 0.5) * 0.7); if (sopé > 0.3) cor = misturar(cor, tom(cores.sopé, 0.8 + 0.3 * l), lim((sopé - 0.3) / 0.5));
      const neve = (h - limiteNeve) / (alturaMax * 0.1) + (fbm(x * 7, z * 7, semente + 43) - 0.5) * 1.2; if (neve > 0) cor = misturar(cor, tom(cores.neve, 0.78 + 0.28 * lim(luz + 0.4)), lim(neve));
      cor = tom(cor, 0.96 + fino * 0.08);
    } else {
      let base;
      if (venc === 'mata') { base = tom(escolher(cores.mata, grande), 0.85 + 0.15 * fbm(x * 8, z * 8, semente + 50)); if (fino < 0.06) base = tom(base, 0.78); }
      else if (venc === 'estrada') { base = tom(escolher(cores.estrada, grande + (fino - 0.5) * 0.3), 1); if (fino < 0.025) base = tom(cores.rocha[0], 1); else if (fino > 0.975) base = tom(cores.estrada[2], 1.06); if (margem < 0.18) base = misturar(base, escolher(cores.grama, grande), 1 - margem / 0.18 * 0.9); }
      else if (venc === 'areia') base = tom(escolher(cores.areia, grande), 0.97 + fino * 0.06);
      else { // grama: 3 tons por mancha grande + tufos escuros + flores raras
        base = tom(escolher(cores.grama, grande * 1.25 - 0.1), 0.94 + fino * 0.1); const tufo = vn(x * 11, z * 11, semente + 60); if (tufo > 0.72) base = tom(base, 0.88); else if (tufo < 0.2) base = tom(base, 1.07);
        if (fino > 0.9965) base = cores.flores[Math.floor(hash(px >> 1, py >> 1, 2) * cores.flores.length)];
      }
      if (wAgua > 0.12) { // costa de areia úmida na margem da água
        const t = lim((wAgua - 0.12) / 0.3 + (fbm(x * 5, z * 5, semente + 70) - 0.5) * 0.4); base = misturar(base, tom(escolher(cores.areia, fino), 0.95), t); if (wAgua > 0.38) base = tom(base, 0.88);
      }
      if (wMont > 0.1) base = misturar(base, tom(cores.sopé, 0.9), lim((wMont - 0.1) * 1.6) * 0.5); // sopé: encosta da montanha começa verde-escura
      cor = base;
    }
    dados[o] = cor[0]; dados[o + 1] = cor[1]; dados[o + 2] = cor[2]; dados[o + 3] = alfa;
  }
  return { largura: W, altura: H, dados, alturaEm, papeis, dm, L, A, P, semente, papelEm };
}

// ----------------------------------------------------------------------------------------------------------------------------------------------
// Floresta: árvores de copa redonda, pinheiros e moitas, geometria não indexada com cor por vértice, fundida numa malha só.
const FORMAS = {
  redonda: (r, e, lista, cx, cy, cz) => {
    const tr = new THREE.CylinderGeometry(0.05 * e, 0.08 * e, 0.45 * e, 5).translate(cx, cy + 0.22 * e, cz), cop = [];
    for (let k = 0; k < 3; k++) { const g = new THREE.IcosahedronGeometry((0.34 - k * 0.04) * e, 0).translate(cx + (r() - 0.5) * 0.18 * e, cy + (0.62 + k * 0.2) * e, cz + (r() - 0.5) * 0.18 * e); cop.push(g); }
    lista.push([tr, [0.36, 0.25, 0.16], 0.1]); for (const g of cop) lista.push([g, [0.27 + r() * 0.1, 0.52 + r() * 0.12, 0.2 + r() * 0.06], 0.18]);
  },
  pinheiro: (r, e, lista, cx, cy, cz) => {
    lista.push([new THREE.CylinderGeometry(0.04 * e, 0.07 * e, 0.4 * e, 5).translate(cx, cy + 0.2 * e, cz), [0.32, 0.22, 0.15], 0.1]);
    for (let k = 0; k < 3; k++) lista.push([new THREE.ConeGeometry((0.34 - k * 0.07) * e, 0.5 * e, 6).translate(cx, cy + (0.5 + k * 0.28) * e, cz), [0.14 + r() * 0.05, 0.38 + r() * 0.1, 0.24 + r() * 0.04], 0.12]);
  },
  betula: (r, e, lista, cx, cy, cz) => {
    lista.push([new THREE.CylinderGeometry(0.035 * e, 0.06 * e, 0.6 * e, 5).translate(cx, cy + 0.3 * e, cz), [0.82, 0.8, 0.72], 0.2]);
    for (let k = 0; k < 2; k++) lista.push([new THREE.IcosahedronGeometry((0.26 - k * 0.04) * e, 0).translate(cx + (r() - 0.5) * 0.1 * e, cy + (0.68 + k * 0.2) * e, cz + (r() - 0.5) * 0.1 * e), [0.5 + r() * 0.1, 0.66 + r() * 0.1, 0.28], 0.16]);
  },
  outono: (r, e, lista, cx, cy, cz) => {
    lista.push([new THREE.CylinderGeometry(0.05 * e, 0.08 * e, 0.45 * e, 5).translate(cx, cy + 0.22 * e, cz), [0.36, 0.25, 0.16], 0.1]);
    for (let k = 0; k < 3; k++) lista.push([new THREE.IcosahedronGeometry((0.33 - k * 0.04) * e, 0).translate(cx + (r() - 0.5) * 0.18 * e, cy + (0.62 + k * 0.2) * e, cz + (r() - 0.5) * 0.18 * e), [0.72 + r() * 0.12, 0.4 + r() * 0.14, 0.12], 0.18]);
  },
  moita: (r, e, lista, cx, cy, cz) => { for (let k = 0; k < 2; k++) lista.push([new THREE.IcosahedronGeometry((0.2 + r() * 0.08) * e, 0).translate(cx + (r() - 0.5) * 0.3, cy + 0.14 * e, cz + (r() - 0.5) * 0.3), [0.35 + r() * 0.1, 0.58 + r() * 0.1, 0.24], 0.15]); },
};

/** Posições e tipos da floresta (puro): mata rala = 2–3 por tile; grama = raras; sopé das montanhas = pinheiros. Devolve [{forma, x, y, z, e, seed}]. */
export function posicoesFloresta(t, cfgF = {}) {
  const { L, A, papelEm, dm, alturaEm, semente } = t, saida = [], dens = cfgF.densidade ?? 1, evitar = cfgF.evitar ?? []; // evitar: clareiras [{x, z, r}] (marcadores)
  const bil = (f, x, z) => { const fx = x - 0.5, fz = z - 0.5, i = Math.floor(fx), j = Math.floor(fz), tx = fx - i, tz = fz - j; return mix(mix(f(i, j), f(i + 1, j), tx), mix(f(i, j + 1), f(i + 1, j + 1), tx), tz); };
  const pesoDe = (papel) => (i, j) => (papelEm(i, j) === papel ? 1 : 0), wMata = pesoDe('mata'), wMont = pesoDe('montanha');
  const organico = (f, x, z) => bil(f, x, z) + (vn(x * 3.1, z * 3.1, semente + 21) - 0.5) * 0.5; // mesma ideia do chão: peso bilinear + ruído, > 0,5 = dentro
  for (let z = -1; z <= A; z++) for (let x = -1; x <= L; x++) {
    const n = (k) => hash(x, z, semente + k), p = papelEm(x, z);
    const poe = (forma, px, pz, e, ok) => { if (px < 0.1 || pz < 0.1 || px > L - 0.1 || pz > A - 0.1 || !ok(px, pz) || evitar.some((v) => (px - v.x) ** 2 + (pz - v.z) ** 2 < v.r * v.r)) return; saida.push({ forma, x: px, y: alturaEm(px, pz), z: pz, e, tinta: vn(px * 0.22, pz * 0.22, semente + 88), seed: Math.floor(n(99) * 1e6) + saida.length }); };
    const dentroMata = (px, pz) => organico(wMata, px, pz) > 0.5 && vn(px * 0.5, pz * 0.5, semente + 77) > 0.2 + (cfgF.clareiras ?? 0.1) && vn(px * 1.7, pz * 1.7, semente + 78) > 0.18, dentroMont = (px, pz) => organico(wMont, px, pz) > 0.5 && dm[Math.min(A - 1, Math.max(0, Math.floor(pz))) * L + Math.min(L - 1, Math.max(0, Math.floor(px)))] <= 2.4;
    const q = Math.round((2.6 + n(1) * 1.8) * dens);
    for (let k = 0; k < q; k++) { const u = n(10 + k), f = n(20 + k), px = x - 0.25 + n(30 + k) * 1.5, pz = z - 0.25 + n(40 + k) * 1.5; const bosque = vn(px * 0.3, pz * 0.3, semente + 91); poe(u < 0.4 ? 'redonda' : u < 0.7 ? 'pinheiro' : u < 0.8 ? 'betula' : u < 0.9 ? (bosque > 0.62 ? 'outono' : 'redonda') : 'moita', px, pz, 0.9 + f * 0.5, dentroMata); }
    if (p === 'grama' && n(2) < 0.045 * dens) poe(n(3) < 0.7 ? 'redonda' : 'moita', x + 0.2 + n(4) * 0.6, z + 0.2 + n(5) * 0.6, 0.8 + n(6) * 0.4, () => true);
    const qm = Math.round((1.5 + n(7) * 1.8) * dens);
    for (let k = 0; k < qm; k++) poe('pinheiro', x - 0.2 + n(50 + k) * 1.4, z - 0.2 + n(60 + k) * 1.4, 1.0 + n(70 + k) * 0.7, dentroMont);
  }
  return saida;
}

/** Funde as árvores numa BufferGeometry (posição, normal, cor) — pura (usa só three/geometria). */
export function geometriaFloresta(posicoes) {
  const pos = [], nor = [], cor = [];
  for (const q of posicoes) {
    let s = q.seed >>> 0; const r = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }, lista = [];
    FORMAS[q.forma](r, q.e, lista, q.x, q.y, q.z);
    for (const [g, c, v] of lista) { const ni = g.index ? g.toNonIndexed() : g; ni.computeVertexNormals(); const p = ni.attributes.position.array, n = ni.attributes.normal.array;
      for (let i = 0; i < p.length; i += 3) { pos.push(p[i], p[i + 1], p[i + 2]); nor.push(n[i], n[i + 1], n[i + 2]); const k = Math.max(1.0, 1.22 + (p[i + 1] - q.y) * 0.22 + (r() - 0.5) * v), ti = q.tinta ?? 0.5; cor.push(c[0] * k * (0.9 + ti * 0.25), c[1] * k * (1.04 - ti * 0.06), c[2] * k * (1.1 - ti * 0.3)); } g.dispose(); ni.dispose(); } // tinta por zona: verde-amarelado ↔ azulado; sem sombra preta (k ≥ 1)
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(cor, 3)); return geo;
}

// ----------------------------------------------------------------------------------------------------------------------------------------------
const GLSL_RUIDO = `
float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h21(i), h21(i + vec2(1,0)), f.x), mix(h21(i + vec2(0,1)), h21(i + vec2(1,1)), f.x), f.y); }`;

/** Sombra de nuvem deslizando (todos os materiais do mundo) + água animada (só o terreno). */
function aplicarEfeitos(mat, uniformes, { terreno, tex, tamanho }) {
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, uniformes, terreno ? { tMundo: { value: tex }, uTam: { value: new THREE.Vector2(...tamanho) } } : {});
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vXZ;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvXZ = (modelMatrix * vec4(transformed, 1.0)).xz;');
    const cabeca = `#include <common>\nvarying vec2 vXZ; uniform float uTempo; uniform float uNuvem;${terreno ? ' uniform sampler2D tMundo; uniform vec2 uTam;' : ''}\n${GLSL_RUIDO}`;
    let frag = sh.fragmentShader.replace('#include <common>', cabeca);
    const nuvem = `{ float n = vnoise(vXZ * 0.085 + vec2(uTempo * 0.28, uTempo * 0.11)) * 0.65 + vnoise(vXZ * 0.19 - vec2(uTempo * 0.2, 0.0)) * 0.35; diffuseColor.rgb *= 1.0 - uNuvem * smoothstep(0.5, 0.72, n); }`;
    if (terreno) frag = frag.replace('#include <map_fragment>', `
      vec4 tx = texture2D(tMundo, vXZ / uTam); vec3 col = tx.rgb; float agua = 1.0 - smoothstep(0.0, 0.2, tx.a) * 1.0; float espuma = step(0.15, tx.a) * step(tx.a, 0.6);
      vec2 q = floor(vXZ * 16.0) / 16.0;
      if (tx.a < 0.6) {
        float o1 = sin(dot(q, vec2(2.1, 1.3)) * 2.6 + uTempo * 1.1 + sin(q.x * 1.7 + uTempo * 0.5) * 1.6), o2 = sin(dot(q, vec2(-1.7, 2.4)) * 3.4 - uTempo * 0.8 + vnoise(q * 0.9) * 4.0);
        float brilho = smoothstep(0.86, 0.99, o1 * 0.5 + 0.5) * 0.55 + smoothstep(0.9, 1.0, o2 * 0.5 + 0.5) * 0.35;
        col = col * (1.0 + 0.05 * o1) + vec3(0.6, 0.82, 0.9) * brilho * (1.0 - espuma);
        col = mix(col, vec3(0.95, 0.99, 0.98), espuma * (0.1 + 0.2 * (0.5 + 0.5 * sin(uTempo * 1.4 + q.x * 3.0 + q.y * 2.0))));
      }
      diffuseColor.rgb *= col; ${nuvem}`);
    else frag = frag.replace('#include <color_fragment>', `#include <color_fragment>\n${nuvem}`);
    sh.fragmentShader = frag;
  };
}

/** Raio (tiles) da clareira que a floresta deixa em volta de cada marcador (R5: clareira de ~7×7 para a vila). */
const RAIO_CLAREIRA = { marcador_vila: 3.6, marcador_bosque: 2.4, marcador_caverna: 2.2 };

/** Relevo do mundo (montanhas em 3D + floresta em massa), para somar ao terreno em shader do 08 (que continua sendo o chão): só as células com altura > 0 viram malha,
 *  com a textura de rocha/neve/sopé deste módulo; o resto (água, costa, estrada) fica com o 08. `opcoes.reduzirMovimento`: função ou booleano (nuvens paradas). */
export function criarRelevoMundo(mapaDados, cfgR = {}, opcoes = {}) {
  const t = gerarTerreno(mapaDados, cfgR), { L, A, largura, altura, dados } = t, passos = cfgR.celulas_por_tile ?? 3;
  const tex = new THREE.DataTexture(dados, largura, altura, THREE.RGBAFormat); tex.colorSpace = THREE.SRGBColorSpace; tex.magFilter = tex.minFilter = THREE.NearestFilter; tex.generateMipmaps = false; tex.flipY = false; tex.needsUpdate = true;
  const uniformes = { uTempo: { value: 0 }, uNuvem: { value: cfgR.sombra_nuvem ?? 0.2 } };
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, metalness: 0, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }); aplicarEfeitos(mat, uniformes, { terreno: true, tex, tamanho: [L, A] });
  const nx = L * passos, nz = A * passos, pos = [], idx = [], id = new Map(), vert = (i, j) => { const k = j * (nx + 1) + i; if (!id.has(k)) { const x = (i / nx) * L, z = (j / nz) * A; id.set(k, pos.length / 3); pos.push(x, t.alturaEm(x, z), z); } return id.get(k); };
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const x0 = (i / nx) * L, x1 = ((i + 1) / nx) * L, z0 = (j / nz) * A, z1 = ((j + 1) / nz) * A;
    if (Math.max(t.alturaEm(x0, z0), t.alturaEm(x1, z0), t.alturaEm(x0, z1), t.alturaEm(x1, z1)) <= 0 && t.papelEm(Math.floor((x0 + x1) / 2), Math.floor((z0 + z1) / 2)) !== 'montanha') continue;
    const a = vert(i, j), b = vert(i + 1, j), c = vert(i, j + 1), d = vert(i + 1, j + 1); idx.push(a, c, b, b, c, d);
  }
  const grupo = new THREE.Group(); grupo.name = 'relevo_mundo';
  if (idx.length) { const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals(); const m = new THREE.Mesh(geo, mat); m.name = 'montanhas_mundo'; grupo.add(m); }
  if (cfgR.floresta !== false) {
    const matF = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0, flatShading: true }); aplicarEfeitos(matF, uniformes, { terreno: false });
    const f = new THREE.Mesh(geometriaFloresta(posicoesFloresta(t, { ...cfgR, densidade: (cfgR.densidade ?? 1) * (opcoes.densidade ?? 1), evitar: (mapaDados.objetos ?? []).filter((o) => RAIO_CLAREIRA[o.tipo]).map((o) => ({ x: o.x, z: o.z, r: RAIO_CLAREIRA[o.tipo] })) })), matF); f.name = 'floresta_mundo'; grupo.add(f);
  }
  let parado = false, t0 = 0; const lerParado = () => parado || !!(typeof opcoes.reduzirMovimento === 'function' ? opcoes.reduzirMovimento() : opcoes.reduzirMovimento);
  grupo.onBeforeRender = () => { if (!lerParado()) t0 = (typeof performance !== 'undefined' ? performance.now() : 0) / 1000; uniformes.uTempo.value = t0; };
  for (const m of grupo.children) m.onBeforeRender = grupo.onBeforeRender;
  return { malha: grupo, terreno: t, definirReduzirMovimento(b) { parado = !!b; } };
}
