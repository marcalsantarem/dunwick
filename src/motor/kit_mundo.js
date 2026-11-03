// Peças do MAPA DE MUNDO (v0.1.3, 07): marcadores de local (vila, bosque, caverna) e poucos props (árvore, rocha, ponte, montanha).
// Escala de mundo: 1 tile = 1 unidade; o herói de mundo tem ~1 tile, então os marcadores são grandes (vila ≈ 4,6 tiles). Só materiais que o kit já tem
// (mais `brilho_fria`), sem chamada de desenho nova. Marcador `interditado:true`: corrente e cadeado de ferro na entrada, sem brilho de ativo.
import * as THREE from 'three';
import { rng, blobIco, folhagemGeo } from './kit.js';
import { ajudantes, telhadinho } from './kit_vila.js';

const M4 = new THREE.Matrix4(), mix = (a, b, t) => a + (b - a) * t;
const folha = (col, x, y, z, rad, seed, claro = 0.4) => col.geo('folha_mundo', folhagemGeo(blobIco(rad, 1, seed), null, 0, y + rad * 2, seed + 7, claro), M4.clone().makeTranslation(x, y, z), { escala: col.escalaUV * 0.5 });

/** Corrente e cadeado: correntes em X e cadeado de latão em (lx, y, lz) com largura `larg` (local +z = frente). */
function lacre(col, o, lx, y, lz, larg, alt = 0.5) {
  const a = ajudantes(col, o);
  a.v('metal', [lx - larg / 2, y - alt / 2, lz], [lx + larg / 2, y + alt / 2, lz], 0.06); a.v('metal', [lx - larg / 2, y + alt / 2, lz], [lx + larg / 2, y - alt / 2, lz], 0.06);
  a.b('latao', lx, y, lz + 0.04, 0.2, 0.22, 0.1); a.g('metal', new THREE.TorusGeometry(0.06, 0.018, 5, 8), lx, y + 0.15, lz + 0.04);
}

/** Casinha de enxaimel do marcador: base de pedra, paredes de reboco com travas de madeira, porta, janelinha, telhado de duas águas (`telha`/`ardosia`) e, com `chamine`, fumaça. */
function casinha(col, a, saida, { lx, lz, w, d, telha = 'telha_laranja', chamine = false, giro = 0 }) {
  const h = 0.62, c = Math.cos(giro), s = Math.sin(giro), loc = (px, pz) => [lx + px * c + pz * s, lz - px * s + pz * c];
  a.b('pedra', lx, 0.07, lz, w + 0.08, 0.14, d + 0.08, giro); a.b('reboco', lx, 0.14 + (h - 0.14) / 2, lz, w, h - 0.14, d, giro);
  for (const px of [-w / 2 + 0.05, 0, w / 2 - 0.05]) { const [x, z] = loc(px, d / 2 + 0.012); a.b('madeira', x, h / 2 + 0.07, z, 0.06, h - 0.14, 0.03, giro); }
  { const [x, z] = loc(0, d / 2 + 0.012); a.b('madeira', x, h - 0.07, z, w, 0.05, 0.03, giro); }
  { const [x, z] = loc(w * 0.2, d / 2 + 0.02); a.b('madeira_clara', x, 0.34, z, 0.2, 0.4, 0.03, giro); } // porta
  { const [x, z] = loc(-w * 0.25, d / 2 + 0.02); a.b('janela_dia', x, 0.4, z, 0.16, 0.16, 0.03, giro); }
  const [rx, rz] = a.L(...loc(0, 0)); telhadinho(col, telha, 'reboco', rx, h, rz, w + 0.22, d + 0.22, 0.42, a.ry + giro);
  if (chamine) { const [qx, qz] = a.L(...loc(w * 0.25, -d * 0.15)); col.caixa('pedra', qx, h + 0.3, qz, 0.14, 0.5, 0.14); col.caixa('pedra_negra', qx, h + 0.57, qz, 0.19, 0.05, 0.19); saida.chamines.push({ x: qx, y: h + 0.62, z: qz }); }
}

/** Vila (≈ 4,6 tiles de diâmetro): terreiro de terra batida, 5 casinhas (telha e ardósia), poço, pórtico ao sul com a viga e o gancho VAZIO do sino, cerca, bandeirolas,
 *  duas chaminés (fumaça) e um carvalho; sem `interditado`, um brilho dourado pulsa no chão (marcador ativo). `+z` = frente/sul. */
function marcadorVila(col, o, kit, saida) {
  const a = ajudantes(col, o), r = rng(o.seed ?? 1);
  a.g('terra_canteiro', new THREE.CylinderGeometry(2.3, 2.4, 0.05, 20), 0, 0.025, 0.15); a.g('pedra', new THREE.CylinderGeometry(0.34, 0.38, 0.34, 10), 0.1, 0.17, 0.35); // terreiro e poço
  a.g('agua', new THREE.CircleGeometry(0.26, 10).rotateX(-Math.PI / 2), 0.1, 0.33, 0.35, 0, 0, 0, { uv: false });
  for (const sx of [-1, 1]) a.b('madeira', 0.1 + sx * 0.3, 0.62, 0.35, 0.05, 0.56, 0.05); a.b('madeira', 0.1, 0.9, 0.35, 0.7, 0.05, 0.05); a.g('telha_laranja', new THREE.ConeGeometry(0.5, 0.24, 4).rotateY(Math.PI / 4), 0.1, 1.0, 0.35);
  for (const c of [{ lx: -1.35, lz: -1.1, w: 1.15, d: 0.95, telha: 'telha_laranja', chamine: true, giro: 0.08 }, { lx: 0.1, lz: -1.45, w: 1.25, d: 1.0, telha: 'ardosia' }, { lx: 1.5, lz: -0.8, w: 1.1, d: 0.95, telha: 'telha_laranja', chamine: true, giro: -0.1 },
    { lx: -1.45, lz: 0.55, w: 1.0, d: 0.9, telha: 'telha_laranja', giro: 0.2 }, { lx: 1.5, lz: 0.75, w: 1.05, d: 0.9, telha: 'ardosia', giro: -0.18 }]) casinha(col, a, saida, c);
  // pórtico: dois postes altos, viga e gancho vazio (o Sino de Cobre foi arrancado)
  for (const sx of [-1, 1]) { a.b('madeira', sx * 0.85, 0.6, 1.95, 0.13, 1.2, 0.13); a.b('pedra', sx * 0.85, 0.07, 1.95, 0.26, 0.14, 0.26); } a.b('madeira', 0, 1.2, 1.95, 1.9, 0.12, 0.14); a.b('madeira', 0, 1.3, 1.95, 2.0, 0.05, 0.18);
  a.v('metal', [0, 1.14, 1.95], [0, 0.95, 1.95], 0.035); a.g('metal', new THREE.TorusGeometry(0.07, 0.02, 5, 10), 0, 0.9, 1.95); // gancho vazio
  for (const sx of [-1, 1]) { for (let k = 0; k < 5; k++) a.b('madeira', sx * (1.2 + k * 0.28), 0.25, 1.95, 0.05, 0.5, 0.05); a.v('tabuas', [sx * 1.15, 0.38, 1.95], [sx * 2.5, 0.38, 1.95], 0.05); } // cerca baixa
  // bandeirolas entre o pórtico e a casa da direita
  a.v('madeira', [0.85, 1.15, 1.95], [1.5, 1.1, 0.75], 0.015); const cores = ['tecido_vinho', 'tecido_ocre', 'tecido_azul', 'papel', 'tecido_vinho'];
  for (let k = 0; k < 5; k++) { const t = (k + 0.5) / 5, x = mix(0.85, 1.5, t), z = mix(1.95, 0.75, t), y = mix(1.15, 1.1, t) - Math.sin(t * Math.PI) * 0.06; a.b(cores[k], x, y - 0.07, z, 0.07, 0.13, 0.015); }
  { const [x, z] = a.L(-2.0, -0.2); col.caixa('casca', x, 0.3, z, 0.18, 0.6, 0.18); for (const [dx, dy, rr] of [[0, 1.05, 0.55], [-0.35, 0.8, 0.4], [0.35, 0.8, 0.4]]) folha(col, x + dx, dy, z, rr, Math.floor(r() * 1e6), 0.3 + r() * 0.3); }
  if (!o.interditado) a.g('brilho_saida', new THREE.PlaneGeometry(5.4, 5.4).rotateX(-Math.PI / 2), 0, 0.07, 0.15, 0, 0, 0, { uv: false });
}

/** Bosque: arco de árvores GIGANTES e clareira de entrada ao sul (+z); interditado: corrente e cadeado entre os troncos do arco e copas mais escuras. */
function marcadorBosque(col, o) {
  const a = ajudantes(col, o), r = rng(o.seed ?? 3), claro = o.interditado ? 0.3 : 0.45;
  a.g('terra_canteiro', new THREE.CylinderGeometry(1.5, 1.6, 0.04, 16), 0, 0.02, 1.0);
  const gigante = (lx, lz, k, tipo) => {
    const [x, z] = a.L(lx, lz), H = 1.7 * k; col.geo('casca', new THREE.CylinderGeometry(0.17 * k, 0.28 * k, H, 8), M4.clone().makeTranslation(x, H / 2, z));
    if (tipo === 'pinho') for (let i = 0; i < 4; i++) col.geo('folha_mundo', folhagemGeo(new THREE.ConeGeometry((1.05 - i * 0.2) * k, 0.9 * k, 8), null, 0.4, H * 1.5, Math.floor(r() * 1e6), 0.1 + claro * 0.5), M4.clone().makeTranslation(x, H * 0.55 + i * 0.5 * k, z), { escala: col.escalaUV * 0.5 });
    else for (const [dx, dy, rr] of [[0, 1.2, 0.95], [-0.7, 0.9, 0.7], [0.7, 0.9, 0.7], [0, 1.7, 0.7]]) folha(col, x + dx * k, H * 0.72 + dy * k * 0.5, z, rr * k, Math.floor(r() * 1e6), 0.1 + claro * r());
  };
  gigante(-1.15, 0.9, 1.65, 'pinho'); gigante(1.15, 0.9, 1.65, 'carvalho'); gigante(-1.95, -0.2, 1.4, 'carvalho'); gigante(1.95, -0.15, 1.45, 'pinho'); gigante(-0.95, -1.25, 1.35, 'pinho'); gigante(0.95, -1.2, 1.4, 'carvalho');
  gigante(-2.4, 1.3, 1.0, 'pinho'); gigante(2.4, 1.2, 1.05, 'carvalho'); // arco: o vão do meio fica livre, com a trilha de pedras
  for (let i = 0; i < 5; i++) a.g('pedra', new THREE.DodecahedronGeometry(0.13 + r() * 0.06, 0), -0.55 + i * 0.28 + r() * 0.1, 0.1, 1.6 + r() * 0.5); // trilha de pedras de entrada
  if (o.interditado) lacre(col, o, 0, 0.7, 0.95, 1.9, 0.7); else a.g('brilho_saida', new THREE.PlaneGeometry(2.6, 2.6).rotateX(-Math.PI / 2), 0, 0.06, 0.7, 0, 0, 0, { uv: false });
}

/** Caverna: morro de rocha (≈ 3 tiles) com a boca voltada ao sul (+z), batente de madeira e luz fria (sino_aqua) saindo de dentro; musgo e entulho. */
function marcadorCaverna(col, o) {
  const a = ajudantes(col, o), r = rng(o.seed ?? 5);
  for (const [lx, lz, s] of [[-1.0, -0.4, 1.0], [1.0, -0.3, 0.95], [0, -0.9, 1.5], [-0.5, 0.0, 1.15], [0.6, 0.0, 1.1], [-1.55, 0.3, 0.7], [1.55, 0.4, 0.7]]) {
    const g = blobIco(0.9 * s, 1, Math.floor(r() * 1e6), 0.3); g.scale(1.05, 0.95, 1); a.g(r() < 0.35 ? 'pedra_negra' : 'pedra', g, lx, 0.55 * s, lz);
  }
  a.b('carvao', 0, 0.55, 0.88, 1.15, 1.1, 0.3); a.g('carvao', new THREE.CylinderGeometry(0.575, 0.575, 0.3, 10, 1, false, 0, Math.PI).rotateX(Math.PI / 2).rotateZ(Math.PI / 2), 0, 1.1, 0.88);
  for (const sx of [-1, 1]) a.b('madeira', sx * 0.65, 0.62, 1.05, 0.15, 1.3, 0.2); a.b('madeira', 0, 1.3, 1.05, 1.5, 0.16, 0.22); a.b('madeira_clara', 0, 1.42, 1.05, 1.7, 0.07, 0.3);
  a.g('brilho_fria', new THREE.PlaneGeometry(1.8, 1.8).rotateX(-Math.PI / 2), 0, 0.06, 1.55, 0, 0, 0, { uv: false }); a.b('brilho_fria', 0, 0.55, 0.78, 0.9, 0.9, 0.02);
  for (let i = 0; i < 6; i++) a.g('papel', new THREE.IcosahedronGeometry(0.06, 0), -0.7 + i * 0.28 + (r() - 0.5) * 0.1, 0.06, 1.35 + r() * 0.4); // ossos e entulho
  if (o.interditado) lacre(col, o, 0, 0.55, 1.2, 1.05, 0.7);
}

/** Árvore de mundo: tronco curto e uma copa só. */
function arvoreMundo(col, o) { const r = rng(o.seed ?? 1), e = o.escala ?? 1; col.caixa('casca', o.x, 0.2 * e, o.z, 0.12 * e, 0.4 * e, 0.12 * e); folha(col, o.x, 0.4 * e + 0.3 * e, o.z, (0.34 + r() * 0.08) * e, Math.floor(r() * 1e6), 0.25 + r() * 0.3); }

/** Montanha de mundo: 2 a 3 picos de rocha com topo claro (`escala` 1 ≈ 2 tiles de base); `x`, `z` no centro. */
function montanhaMundo(col, o) {
  const r = rng(o.seed ?? 1), e = o.escala ?? 1, n = 2 + (r() < 0.5 ? 1 : 0);
  for (let i = 0; i < n; i++) {
    const h = (1.3 + r() * 0.8) * e, rad = (0.8 + r() * 0.3) * e, x = o.x + (i - (n - 1) / 2) * 0.7 * e + (r() - 0.5) * 0.2, z = o.z + (r() - 0.5) * 0.5 * e;
    col.geo(i === 1 ? 'pedra' : 'pedra_negra', new THREE.ConeGeometry(rad, h, 5).translate(0, h / 2, 0), M4.clone().makeTranslation(x, 0, z));
    col.geo('pedra', new THREE.ConeGeometry(rad * 0.38, h * 0.3, 5).translate(0, h * 0.85, 0), M4.clone().makeTranslation(x, 0, z));
  }
}

/** Rocha de mundo: um bloco arredondado. */
function rochaMundo(col, o) { const r = rng(o.seed ?? 1), e = o.escala ?? 1, g = blobIco(0.4 * e, 1, Math.floor(r() * 1e6), 0.25); g.scale(1.2, 0.7, 1); col.geo('pedra', g, M4.clone().makeTranslation(o.x, 0.2 * e, o.z)); }

/** Ponte de mundo sobre água: `rot` 0 = atravessa em x, 90 = em z. Comprimento `w` (padrão 2). */
function ponteMundo(col, o) {
  const a = ajudantes(col, o), w = o.w ?? 2, n = Math.round(w / 0.25);
  for (let i = 0; i < n; i++) a.b('tabuas', -w / 2 + (i + 0.5) * (w / n), 0.07, 0, w / n - 0.02, 0.06, 0.62);
  for (const s of [-1, 1]) { a.b('madeira', 0, 0.2, s * 0.33, w, 0.05, 0.05); for (const e of [-1, 1]) a.b('madeira', e * (w / 2 - 0.05), 0.15, s * 0.33, 0.06, 0.3, 0.06); }
}

export const PECAS_MUNDO = { marcador_vila: marcadorVila, marcador_bosque: marcadorBosque, marcador_caverna: marcadorCaverna, arvore_mundo: arvoreMundo, rocha_mundo: rochaMundo, montanha_mundo: montanhaMundo, ponte_mundo: ponteMundo };
