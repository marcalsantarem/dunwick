// Peças do MAPA DE MUNDO (v0.1.3, 07): marcadores de local (vila, bosque, caverna) e poucos props (árvore, rocha, ponte, montanha).
// Lidas de cima e de longe: silhuetas simples e grandes, poucos polígonos, só materiais que o kit já tem (sem chamada de desenho nova).
// Marcador `interditado:true` ganha corrente e cadeado de ferro na entrada. Os marcadores ocupam ~2 tiles de mundo.
import * as THREE from 'three';
import { rng, blobIco, folhagemGeo } from './kit.js';
import { ajudantes } from './kit_vila.js';

const M4 = new THREE.Matrix4();
const folha = (col, x, y, z, rad, seed, claro = 0.4) => col.geo('folhagem', folhagemGeo(blobIco(rad, 1, seed), null, 0, y + rad * 2, seed + 7, claro), M4.clone().makeTranslation(x, y, z), { escala: col.escalaUV * 0.5 });

/** Corrente e cadeado na entrada de um local interditado (local +z = frente). */
function lacre(col, o, lx, y, lz, larg) {
  const a = ajudantes(col, o);
  a.v('metal', [lx - larg / 2, y - 0.25, lz], [lx + larg / 2, y + 0.25, lz], 0.07); a.v('metal', [lx - larg / 2, y + 0.25, lz], [lx + larg / 2, y - 0.25, lz], 0.07);
  a.b('latao', lx, y, lz + 0.03, 0.22, 0.24, 0.1);
}

/** Vila: três casinhas de telha laranja num anel de cerca, com o pórtico aberto para o sul (+z). */
function marcadorVila(col, o) {
  const a = ajudantes(col, o), r = rng(o.seed ?? 1);
  for (const [lx, lz, w, d, h] of [[-0.55, -0.35, 0.8, 0.7, 0.55], [0.5, -0.25, 0.7, 0.8, 0.5], [0, 0.35, 0.6, 0.55, 0.45]]) {
    a.b('reboco', lx, h / 2, lz, w, h, d); a.g('telha_laranja', new THREE.ConeGeometry(Math.max(w, d) * 0.78, 0.4, 4).rotateY(Math.PI / 4), lx, h + 0.2, lz);
  }
  for (const s of [-1, 1]) a.b('madeira', s * 0.28, 0.3, 0.95, 0.1, 0.6, 0.1); a.b('madeira', 0, 0.62, 0.95, 0.66, 0.08, 0.1); // pórtico
  a.g('pedra', new THREE.CylinderGeometry(1.15, 1.25, 0.1, 10), 0, 0.05, 0.05); void r;
}

/** Bosque: moita escura de árvores altas e baixas, com uma clareira de entrada ao sul. */
function marcadorBosque(col, o) {
  const a = ajudantes(col, o), r = rng(o.seed ?? 3);
  for (let i = 0; i < 7; i++) {
    const ang = 0.4 + (i / 7) * (Math.PI * 2 - 0.8) + Math.PI / 2, d = 0.35 + r() * 0.55, lx = Math.cos(ang) * d, lz = -Math.sin(ang) * d - 0.1, rad = 0.38 + r() * 0.2;
    a.b('casca', lx, 0.2, lz, 0.14, 0.4, 0.14); const [x, z] = a.L(lx, lz); folha(col, x, 0.4 + rad * 0.7, z, rad, Math.floor(r() * 1e6), o.interditado ? 0 : 0.1 + r() * 0.25);
  }
  a.g('pedra', new THREE.CylinderGeometry(0.2, 0.26, 0.08, 6), 0, 0.04, 0.95); // marco de entrada
  if (o.interditado) lacre(col, o, 0, 0.55, 0.95, 0.7);
}

/** Caverna: morro de rocha com a boca escura voltada ao sul (+z). */
function marcadorCaverna(col, o) {
  const a = ajudantes(col, o), r = rng(o.seed ?? 5);
  for (const [lx, lz, s] of [[-0.4, -0.2, 0.7], [0.45, -0.1, 0.6], [0, -0.45, 0.85], [0, 0, 0.9]]) { const g = blobIco(0.6 * s, 1, Math.floor(r() * 1e6), 0.25); g.scale(1, 0.85, 1); a.g(o.interditado || r() < 0.3 ? 'pedra_negra' : 'pedra', g, lx, 0.4 * s, lz); }
  a.b('carvao', 0, 0.28, 0.5, 0.55, 0.56, 0.12); a.b('madeira', 0, 0.62, 0.55, 0.78, 0.1, 0.16); for (const s of [-1, 1]) a.b('madeira', s * 0.34, 0.3, 0.55, 0.1, 0.6, 0.14); // boca com batente
  if (o.interditado) lacre(col, o, 0, 0.3, 0.62, 0.6);
}

/** Árvore de mundo: tronco curto e uma copa só. */
function arvoreMundo(col, o) { const r = rng(o.seed ?? 1), e = o.escala ?? 1; col.caixa('casca', o.x, 0.2 * e, o.z, 0.12 * e, 0.4 * e, 0.12 * e); folha(col, o.x, 0.4 * e + 0.3 * e, o.z, (0.34 + r() * 0.08) * e, Math.floor(r() * 1e6), 0.25 + r() * 0.3); }

/** Montanha de mundo: 2 a 3 picos de rocha com topo claro (`escala` 1 ≈ 2 tiles de base); `x`, `z` no centro. */
function montanhaMundo(col, o) {
  const r = rng(o.seed ?? 1), e = o.escala ?? 1, n = 2 + (r() < 0.5 ? 1 : 0);
  for (let i = 0; i < n; i++) { const h = (1.3 + r() * 0.8) * e, rad = (0.8 + r() * 0.3) * e, x = o.x + (i - (n - 1) / 2) * 0.7 * e + (r() - 0.5) * 0.2, z = o.z + (r() - 0.5) * 0.5 * e;
    col.geo(i === 1 ? 'pedra' : 'pedra_negra', new THREE.ConeGeometry(rad, h, 5).translate(0, h / 2, 0), M4.clone().makeTranslation(x, 0, z));
    col.geo('pedra', new THREE.ConeGeometry(rad * 0.38, h * 0.3, 5).translate(0, h * 0.85, 0), M4.clone().makeTranslation(x, 0, z)); }
}

/** Rocha de mundo: um bloco arredondado. */
function rochaMundo(col, o) { const r = rng(o.seed ?? 1), e = o.escala ?? 1, g = blobIco(0.4 * e, 1, Math.floor(r() * 1e6), 0.25); g.scale(1.2, 0.7, 1); col.geo('pedra', g, M4.clone().makeTranslation(o.x, 0.2 * e, o.z)); }

/** Ponte de mundo sobre 1 tile de água: `rot` 0 = atravessa em x, 90 = em z. Comprimento `w` (padrão 2). */
function ponteMundo(col, o) {
  const a = ajudantes(col, o), w = o.w ?? 2, n = Math.round(w / 0.25);
  for (let i = 0; i < n; i++) a.b('tabuas', -w / 2 + (i + 0.5) * (w / n), 0.07, 0, w / n - 0.02, 0.06, 0.62);
  for (const s of [-1, 1]) { a.b('madeira', 0, 0.2, s * 0.33, w, 0.05, 0.05); for (const e of [-1, 1]) a.b('madeira', e * (w / 2 - 0.05), 0.15, s * 0.33, 0.06, 0.3, 0.06); }
}

export const PECAS_MUNDO = { marcador_vila: marcadorVila, marcador_bosque: marcadorBosque, marcador_caverna: marcadorCaverna, arvore_mundo: arvoreMundo, rocha_mundo: rochaMundo, montanha_mundo: montanhaMundo, ponte_mundo: ponteMundo };
