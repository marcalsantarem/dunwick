// Poses de batalha da Grace, do Slime e do Lobo (BL-009/BL-010), no mesmo método do Edric: volumes 3D lançados por raios (um por pixel), sombreados em 4 tons,
// contorno seletivo e luz de borda; cabeça da Grace em molde de pixels (rostos.mjs). Cada pose usa UMA direção (L, voltado para a direita); o motor espelha.
// Saída por personagem: assets/sprites/<id>/<id>.png + .meta.json (anims = poses, compatível com o carregador e com o validar_assets) e cópias <id>_batalha.*; prévia em docs/arte/sprites/.
// Uso: node tools/arte/personagens_batalha.mjs [--previa] [--saida=<raiz>]
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { codificarPng, novaImagem } from '../lib/png.mjs';
import { prims, elip, esfera, cadeia, renderizar, acabar, CP, colarCabeca, CELULA, ANCORA, SC } from './edric.mjs';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..'), rad = Math.PI / 180, PHI = Math.PI / 2;
const mix = (p, q, t) => p.map((v, i) => v + (q[i] - v) * t);
/** Joelho por dois ossos (L1, L2): `sinal` +1 dobra para a frente, −1 para trás. Pontos em [f, l, u]. */
function joelho(hip, foot, L1, L2, sinal) {
  const dfx = foot[0] - hip[0], dfu = foot[2] - hip[2], d = Math.hypot(dfx, dfu) || 1, m = (L1 + L2) / 2, h = Math.sqrt(Math.max(0.3, m * m - (d / 2) ** 2));
  return [(hip[0] + foot[0]) / 2 - sinal * dfu / d * h, hip[1], (hip[2] + foot[2]) / 2 + sinal * dfx / d * h];
}

// =====================================================================  GRACE
const GG = { lean: 2, dz: 1.2, pe: [[-3.5, 0], [3.5, 0]], maoD: [6, 7.6, 26], maoE: [2, -7.8, 22], theta: 90 };
const mg = (o) => ({ ...GG, ...o });
function montarGrace(P = {}) {
  prims.length = 0;
  const esc = 0.94, lean = P.lean ?? 2, dz = P.dz ?? 1.2, rot = P.rot ?? 0, cr = Math.cos(rot), sr = Math.sin(rot), sh = P.shift ?? [0, 0];
  const T = (f, l, u) => { f *= esc; l *= esc; u *= esc; const k = Math.min(1, Math.max(0, u) / 19), uu = u - dz * k, ff = f + lean * Math.max(0, u) / 36; return [ff * cr - uu * sr + sh[0], l, ff * sr + uu * cr + sh[1]]; };
  const a = Math.abs(rot), c2 = Math.cos(a) ** 2, s2 = Math.sin(a) ** 2;
  const Ee = (c, r, m, id, dec, off) => elip(T(...c), [r[0] * c2 + r[2] * s2, r[1], r[2] * c2 + r[0] * s2].map((v) => v * esc), m, id, rot ? null : dec, off);
  const Ch = (p, q, r0, r1, m, id, dec, off) => cadeia(T(...p), T(...q), r0, r1, m, id, dec, off);
  const pe = P.pe ?? GG.pe;
  for (const s of [-1, 1]) {
    const [ff, fu] = pe[(s + 1) / 2], hip = T(0.4, s * 3.7, 19), foot = T(ff, s * 3.8, fu + 3.5), kn = joelho(hip, foot, 8, 8, 1);
    cadeia(hip, kn, 3.0, 2.7, 'calca', 'perna' + s); cadeia(kn, foot, 2.7, 2.8, 'couro', 'bota' + s, null, -1);
    elip([foot[0] + 2.4, s * 3.8, foot[2] - 1.5], [4.2, 2.7, 2.1].map((v) => v * 1), 'couro', 'pe' + s, null, -1);
  }
  Ee([0, 0, 13.5], [6.2, 6.9, 7.2], 'linho', 'saia'); Ee([0, 0, 25], [4.5, 5.2, 6.4], 'linho', 'torso'); Ee([0, 0, 29.5], [4.7, 6.0, 4.4], 'linho', 'torso_a');
  Ee([0, 0, 20.8], [5.3, 6.1, 1.3], 'verde', 'faixa'); Ee([2.4, -6.2, 19.4], [2.2, 1.7, 2.6], 'couro', 'bolsa'); Ee([2.4, -6.2, 22], [0.9, 0.9, 1.5], 'verde', 'erva'); Ee([1.8, 6.6, 19.8], [1.2, 0.9, 2.4], 'couro', 'caderno');
  Ee([-0.6, 0, 32.8], [5.8, 8.6, 3.4], 'lilas', 'capa_ombros'); Ee([-4.4, 0, 21], [3.2, 8.2, 13.5], 'lilas', 'capa_costas'); Ee([-4.8, 0, 8.5], [3.4, 8.8, 5.5], 'lilas', 'capa_barra');
  Ee([0.2, 0, 35], [3.0, 3.2, 2.4], 'pele', 'pescoco', (p) => (p[2] > 35 ? { m: 'pele', d: -1 } : null)); Ee([0.5, 0, 34], [3.6, 4.6, 1.2], 'linho', 'gola');
  const maoD = P.maoD ?? GG.maoD, maoE = P.maoE ?? GG.maoE, eD = [maoD[0] / 2 - 1.6, 7.6, (31.5 + maoD[2]) / 2 - 2], eE = [maoE[0] / 2 - 1.6, -7.6, (31.5 + maoE[2]) / 2 - 2];
  const braco = (lado, e, m) => { const pu = mix(e, m, 0.78); Ch([0, lado * 6.6, 31.5], e, 3.2, 3.0, 'linho', 'manga' + lado); Ch(e, pu, 3.0, 2.6, 'linho', 'manga2' + lado); Ch(pu, m, 2.0, 2.0, 'pele', 'pulso' + lado); esfera(T(...m), 2.2 * esc, 'pele', 'mao' + lado); };
  braco(1, eD, maoD); braco(-1, eE, maoE);
  if (P.frasco) { Ee([maoE[0] + 1.2, maoE[1], maoE[2] + 2.4], [1.6, 1.6, 2.6], 'verde', 'frasco'); Ee([maoE[0] + 1.2, maoE[1], maoE[2] + 5.2], [1.0, 1.0, 0.9], 'latao', 'rolha'); }
  const th = (P.theta ?? 90) * rad, d = [Math.cos(th), 0.06, Math.sin(th)], at = (t) => [maoD[0] + d[0] * t, maoD[1] + d[1] * t, maoD[2] + d[2] * t];
  Ch(at(-24), at(12), 1.2, 1.2, 'couro', 'cajado'); Ee(at(13), [2.0, 2.0, 2.0], 'latao', 'nó'); Ee(at(10), [1.3, 1.3, 1.3], 'verde', 'folha');
  const c0 = T(1, 0, 45.8);
  return { dx: SC * (c0[0] - 1), dy: -SC * (c0[2] - 45.8) * CP };
}
function quadroGrace(P) { const h = montarGrace(P), px = acabar(renderizar(PHI)); colarCabeca(px, 'g', Math.round(h.dx + (P.hdx || 0)), Math.round(h.dy + (P.hdy || 0)), P.giros || 0); return px; }
const walk = (i, n, A, extra) => { const ph = i / n * Math.PI * 2, s = Math.sin(ph), c = Math.cos(ph); return { pe: [[2 - A * s, Math.max(0, -c) * 4], [2 + A * s, Math.max(0, c) * 4]], dzc: Math.abs(c), s, ...extra }; };
const GRACE = [
  { id: 'bat_parado', fps: 6, loop: true, q: [0, 1, 2, 3].map((i) => { const b = [0, 0.5, 1, 0.5][i]; return mg({ dz: 1.4 - 0.4 * b, maoE: [2, -7.8, 22 + 0.3 * b] }); }) },
  { id: 'bat_avanca', fps: 10, loop: true, ev: [{ quadro: 0, tipo: 'passo' }, { quadro: 3, tipo: 'passo' }], q: [0, 1, 2, 3, 4, 5].map((i) => { const w = walk(i, 6, 6); return mg({ lean: 5, dz: 1.2 + 0.4 * w.dzc, pe: w.pe, maoD: [4, 7.6, 25], theta: 60, maoE: [2 - 3 * w.s, -7.6, 24] }); }) },
  { id: 'bat_ataque', fps: 12, loop: false, ev: [{ quadro: 3, tipo: 'impacto' }], q: [
    mg({ lean: -1, dz: 2, theta: 130, maoD: [0, 7.6, 36], pe: [[-4, 0], [3, 0]] }), mg({ theta: 110, maoD: [-1, 7.6, 40] }), mg({ lean: 3, dz: 2.5, theta: 50, maoD: [6, 7.6, 36], pe: [[-4, 0], [6, 0]] }),
    mg({ lean: 6, dz: 3, theta: -5, maoD: [10, 7.6, 28], maoE: [3, -7.6, 24], pe: [[-4, 0], [8, 0]], shift: [-5, 0] }), mg({ lean: 4, dz: 2.5, theta: -40, maoD: [8, 7.6, 22], pe: [[-4, 0], [7, 0]] })] },
  { id: 'bat_habilidade', fps: 10, loop: false, ev: [{ quadro: 4, tipo: 'solta_efeito' }], q: [
    mg({ lean: -2, dz: 3, theta: 100, maoD: [1, 7.6, 30], maoE: [3, -6, 28] }), mg({ theta: 95, maoD: [2, 7.6, 38], maoE: [4, -6, 36] }), mg({ theta: 88, maoD: [4, 7.6, 42], maoE: [6, -5, 40] }),
    mg({ lean: 1, theta: 80, maoD: [5, 7.6, 44], maoE: [8, -5, 42] }), mg({ lean: 4, dz: 2.5, theta: 45, maoD: [9, 7.6, 36], maoE: [11, -4, 34], shift: [-3, 0] }), mg({ lean: 3, theta: 60, maoD: [7, 7.6, 36], maoE: [9, -4, 32] })] },
  { id: 'bat_cura', fps: 10, loop: false, ev: [{ quadro: 3, tipo: 'solta_efeito' }], q: [[4, -6, 22], [6, -5.5, 28], [8, -5, 34], [9, -4.5, 38], [9, -4.5, 38], [6, -6, 28]].map((m, i) => mg({ lean: i === 3 || i === 4 ? 2.5 : 1.5, maoD: [3, 7.6, 28], maoE: m })) },
  { id: 'bat_item', fps: 8, loop: false, ev: [{ quadro: 3, tipo: 'usa' }], q: [
    mg({ maoD: [5, 7.6, 26], maoE: [1, -6.2, 21] }), mg({ maoD: [5, 7.6, 26], maoE: [1.5, -6.5, 21], frasco: true }), mg({ maoD: [5, 7.6, 26], maoE: [4, -5, 30], frasco: true }), mg({ lean: 3, maoD: [5, 7.6, 26], maoE: [6, -3.5, 38], frasco: true })] },
  { id: 'bat_defender', fps: 8, loop: false, manter: true, q: [mg({ lean: 2, dz: 3, theta: 70, maoD: [6, 7.6, 32], maoE: [5, -6, 30], pe: [[-4, 0], [5, 0]] }), mg({ lean: 3.5, dz: 4, theta: 75, maoD: [7, 7.6, 34], maoE: [6, -6, 31], pe: [[-4.5, 0], [5.5, 0]] })] },
  { id: 'bat_dano', fps: 8, loop: false, q: [mg({ lean: -7, dz: 0.5, theta: 150, maoD: [0, 8, 30], maoE: [-3, -8, 27], pe: [[-5, 0], [2, 0]], hdx: -1, hdy: -1 }), mg({ lean: -3, dz: 2, theta: 120, maoD: [2, 8, 28], pe: [[-4, 0], [3, 0]] })] },
  { id: 'bat_caido', fps: 1, loop: false, q: [mg({ lean: 0, dz: 0, rot: 90 * rad, shift: [24, 8], giros: 1, theta: -80, maoD: [3, 9, 22], maoE: [3, -9, 22], pe: [[-3, 0], [3, 0]] })] },
  { id: 'bat_levanta', fps: 8, loop: false, q: [0.7, 0.4, 0.08].map((s, i) => mg({ lean: 0, dz: [0, 3, 4][i], rot: s * 90 * rad, shift: [24 * s, 5 * s], giros: s > 0.5 ? 1 : 0, theta: -60, maoD: [4, 8, 24], maoE: [3, -8, 24] })) },
  { id: 'bat_vitoria', fps: 6, loop: true, q: [0, 1, 2, 3].map((i) => { const salto = i === 2 ? 2 : 0; return mg({ lean: 0, dz: [2, 0.5, -0.5, 0.5][i], theta: 82, maoD: [7, 7.6, 46], maoE: [1, -8, 22], pe: [[-3, salto], [4, salto]] }); }) },
];

// =====================================================================  SLIME  (corpo gelatinoso, verde; olhos grandes e simpáticos)
const CEL_SLIME = [88, 64], ANC_SLIME = [40, 50];
function montarSlime(P = {}) {
  prims.length = 0;
  const w = P.w ?? 1, h = P.h ?? 1, lift = P.lift ?? 0, sf = P.sf ?? 0, tilt = P.tilt ?? 0, olho = P.olho ?? 'aberto', uo = 8.6 * h + lift;
  const dec = (p) => {
    if (olho === 'nenhum' || p[0] - sf < 2.6 * w) return null;
    for (const s of [-1, 1]) {
      const x = Math.abs(p[1]) - 5.4, y = p[2] - uo;
      if (Math.sign(p[1]) !== s || Math.abs(x) > 1.8) continue;
      if (olho === 'fechado') { if (Math.abs(y - 0.4 * Math.abs(x)) < 0.55) return { m: 'aco', t: 0 }; continue; }
      if ((x / 2.1) ** 2 + (y / 2.8) ** 2 <= 1) return (x < 0.2 && x > -1.0 && y > 0.4 && y < 1.5) ? { m: 'linho', t: 3 } : { m: 'aco', t: 0 };
    }
    if (olho === 'aberto' && Math.abs(p[2] - (uo - 3.4)) < 0.5 && Math.abs(p[1]) < 1.7) return { m: 'aco', t: 1 };           // boquinha
    return null;
  };
  elip([sf, 0, 1.0], [11.5 * w, 9.5 * Math.min(w, 1.2), 1.3], 'verde', 'poca', null, -1);
  elip([sf, 0, 7 * h + lift], [12 * w, 10.5 * Math.min(w, 1.2), 7.5 * h], 'verde', 'corpo', dec);
  elip([sf - 1.2 + tilt, 0, 11.5 * h + lift], [8.4 * w, 7.6 * Math.min(w, 1.2), 5.6 * h], 'verde', 'topo', dec);
  for (const [f, u, r] of P.gotas ?? []) elip([sf + f, 0, u], [r * 1.3, r, r * 0.6], 'verde', 'gota');
  return {};
}
const quadroSlime = (P) => { montarSlime(P); return acabar(renderizar(PHI, CEL_SLIME, ANC_SLIME)); };
const SLIME = [
  { id: 'bat_parado', fps: 6, loop: true, q: [0, 1, 2, 3].map((i) => ({ w: [1, 0.985, 0.97, 0.985][i], h: [1, 1.05, 1.1, 1.05][i] })) },
  { id: 'bat_avanca', fps: 10, loop: true, ev: [{ quadro: 2, tipo: 'passo' }], q: [{ lift: 0, h: 0.8, w: 1.12 }, { lift: 6, h: 1.2, w: 0.92, sf: 3 }, { lift: 9, h: 1.05, w: 0.98, sf: 6 }, { lift: 3, h: 0.85, w: 1.1, sf: 3 }] },
  { id: 'bat_ataque', fps: 12, loop: false, ev: [{ quadro: 3, tipo: 'impacto' }], q: [{ h: 0.65, w: 1.2, tilt: -1 }, { h: 1.35, w: 0.85, lift: 9 }, { lift: 7, sf: 7, tilt: 2 }, { sf: 13, h: 0.7, w: 1.25 }, { sf: 5, h: 0.9, w: 1.05 }] },
  { id: 'bat_espera', fps: 8, loop: false, q: [{ sf: -1 }, { sf: 1, w: 1.08, h: 0.94 }, { sf: -1, w: 0.94, h: 1.08 }, { sf: 1, w: 1.06, h: 0.96 }] },
  { id: 'bat_dano', fps: 8, loop: false, q: [{ w: 1.3, h: 0.65, sf: -4, olho: 'fechado' }, { w: 1.1, h: 0.85, sf: -2 }] },
  { id: 'bat_morte', fps: 7, loop: false, q: [{ w: 1.15, h: 0.7, sf: -2, olho: 'fechado' }, { w: 1.45, h: 0.5, olho: 'fechado' }, { w: 1.7, h: 0.3, olho: 'nenhum', gotas: [[-9, 2, 1.6], [8, 1.6, 1.2]] }, { w: 1.9, h: 0.18, olho: 'nenhum', gotas: [[-12, 1.8, 1.8], [10, 1.6, 1.4], [-2, 4, 1]] }] },
];

// =====================================================================  LOBO  (pelagem cinza, olhos âmbar; quadrúpede de perfil)
const CEL_LOBO = [112, 80], ANC_LOBO = [44, 66];
function montarLobo(P = {}) {
  prims.length = 0;
  const pit = P.pitch ?? 0, lift = P.lift ?? 0, sh = P.shift ?? [0, 0], cp = Math.cos(pit), sp = Math.sin(pit), jaw = P.jaw ?? 0, tail = P.tail ?? 2, orelha = P.orelha ?? 0;
  const T = (f, l, u) => { const x = f + 2, z = u - 13; return [x * cp - z * sp - 2 + sh[0], l, x * sp + z * cp + 13 + lift + sh[1]]; };
  const Ee = (c, r, m, id, dec, off) => elip(T(...c), r, m, id, dec, off), Ch = (p, q, r0, r1, m, id, dec, off) => cadeia(T(...p), T(...q), r0, r1, m, id, dec, off);
  const lo = T(0, 0, 10.2)[2], hi = T(0, 0, 17.8)[2], ec = T(16.9, 2.7, 21.3);
  const pelo = (p) => (p[2] < lo ? { m: 'pelagem', d: 1 } : p[2] > hi ? { m: 'pelagem', d: -1 } : null);
  const cabeca = (p) => {
    const x = (p[0] - ec[0]) / 1.5, y = (p[2] - ec[2]) / 1.0;
    if (p[1] > 1.2 && x * x + y * y <= 1) return P.olhoFechado ? (Math.abs(y) < 0.35 ? { m: 'aco', t: 0 } : null) : (Math.abs(y + 0.15) < 0.38 && Math.abs(x) < 0.5 ? { m: 'aco', t: 0 } : { m: 'latao', t: y > 0.4 ? 1 : 2 });
    return null;
  };
  const paws = P.paws ?? [[6.5, 0], [-6.5, 0], [4.5, 0], [-8.5, 0]];
  paws.forEach(([f, u], i) => {
    const dianteira = i === 0 || i === 2, lado = i < 2 ? 3.4 : -3.4, hip = T(dianteira ? 6 : -7, lado, dianteira ? 12 : 12.5), foot = [f, lado, u + 1.4], kn = joelho(hip, foot, 6.8, 6.8, dianteira ? -1 : 1), off = i < 2 ? 0 : -1;
    cadeia(hip, kn, 3.0, 2.3, 'pelagem', 'coxa' + i, null, off); cadeia(kn, foot, 2.3, 1.9, 'pelagem', 'canela' + i, null, off);
    elip([f + 1.2, lado, u + 0.9], [2.4, 1.7, 1.0], 'pelagem', 'pata' + i, null, off - 1);
  });
  Ch([-11, 0, 15], [-17, 0, 15 + tail], 2.8, 2.2, 'pelagem', 'cauda_a'); Ch([-17, 0, 15 + tail], [-22.5, 0, 12.5 + tail * 1.5], 2.2, 1.0, 'pelagem', 'cauda_b');
  Ee([0, 0, 13], [10.5, 4.8, 5.2], 'pelagem', 'corpo', pelo); Ee([6.5, 0, 14], [5, 5.2, 6], 'pelagem', 'peito', pelo); Ee([-7, 0, 13.5], [5, 5, 5.2], 'pelagem', 'anca', pelo);
  Ch([8, 0, 16.5], [12, 0, 20], 4.6, 3.8, 'pelagem', 'pescoco');
  Ee([14.8, 0, 20.5], [4.4, 3.5, 3.7], 'pelagem', 'cabeca', cabeca); Ee([19.2, 0, 19.3], [3.7, 2.3, 2.1], 'pelagem', 'focinho', cabeca); esfera(T(22.4, 0, 19.7), 1.2, 'aco', 'nariz');
  Ee([18.6, 0, 17.4 - jaw * 3.2], [3.2, 1.8, 1.1], 'pelagem', 'mandibula', null, -1);
  if (jaw > 0.2) for (const s of [-1, 1]) { Ee([20.4, s * 1.2, 18.0], [0.6, 0.5, 1.0], 'linho', 'presa' + s); Ee([20.0, s * 1.1, 17.4 - jaw * 2.6], [0.6, 0.5, 0.9], 'linho', 'dente' + s); }
  for (const s of [-1, 1]) Ch([13.2 + orelha * 1.5, s * 2.3, 23.5], [12.3 + orelha * 3.2, s * 2.7, 27.8 + orelha * 1.4], 1.6, 0.5, 'pelagem', 'orelha' + s, null, s < 0 ? -1 : 0);
  return {};
}
const quadroLobo = (P) => { montarLobo(P); return acabar(renderizar(PHI, CEL_LOBO, ANC_LOBO)); };
const PAT = [[6.5, 0], [-6.5, 0], [4.5, 0], [-8.5, 0]];
const gal = (i) => { const ph = i / 6 * Math.PI * 2, f = (a, b) => [a + 6.5 * Math.sin(ph + b), Math.max(0, Math.cos(ph + b)) * 5]; return { pitch: 0.06 * Math.sin(2 * ph), lift: 1.5 * Math.abs(Math.sin(ph)), tail: 3, paws: [f(6.5, 0), f(-6.5, 3), f(4.5, 0.4), f(-8.5, 3.4)] }; };
const LOBO = [
  { id: 'bat_parado', fps: 6, loop: true, q: [0, 1, 2, 3].map((i) => ({ pitch: -0.06, lift: [0, 0.4, 0.7, 0.4][i] - 1, tail: [1, 2, 3, 2][i] })) },
  { id: 'bat_avanca', fps: 10, loop: true, ev: [{ quadro: 0, tipo: 'passo' }, { quadro: 3, tipo: 'passo' }], q: [0, 1, 2, 3, 4, 5].map(gal) },
  { id: 'bat_ataque', fps: 12, loop: false, ev: [{ quadro: 3, tipo: 'impacto' }], q: [
    { pitch: -0.1, lift: -3, tail: 4, paws: [[5, 0], [-8, 0], [3, 0], [-10, 0]] }, { shift: [4, 0], pitch: 0.15, jaw: 0.5, paws: [[9, 0], [-9, 0], [7, 0], [-11, 0]] }, { shift: [8, 0], pitch: 0.2, jaw: 1, lift: 1, paws: [[12, 2], [-6, 0], [10, 2], [-8, 0]] },
    { shift: [10, 0], pitch: 0.05, jaw: 0.35, paws: [[13, 0], [-5, 0], [11, 0], [-7, 0]] }, { shift: [3, 0], paws: [[8, 0], [-7, 0], [6, 0], [-9, 0]] }] },
  { id: 'bat_ataque_forte', fps: 10, loop: false, ev: [{ quadro: 4, tipo: 'impacto' }], q: [
    { pitch: -0.15, lift: -4, tail: 5, paws: [[5, 0], [-8, 0], [3, 0], [-10, 0]] }, { pitch: -0.2, lift: -5, shift: [-2, 0], tail: 6, paws: [[4, 0], [-9, 0], [2, 0], [-11, 0]] }, { pitch: 0.25, lift: 3, shift: [4, 0], paws: [[10, 3], [-8, 2], [8, 3], [-10, 2]] },
    { pitch: 0.12, lift: 6, shift: [12, 0], jaw: 0.6, paws: [[14, 5], [-4, 4], [12, 5], [-6, 4]] }, { pitch: -0.1, lift: 1, shift: [16, 0], jaw: 0.5, paws: [[17, 0], [-2, 0], [15, 0], [-4, 0]] }, { shift: [8, 0], paws: [[11, 0], [-5, 0], [9, 0], [-7, 0]] }] },
  { id: 'bat_dano', fps: 8, loop: false, q: [{ pitch: 0.28, shift: [-3, 0], jaw: 0.5, olhoFechado: true, orelha: -1, paws: [[5, 0], [-7, 0], [3, 0], [-9, 0]] }, { pitch: 0.12, shift: [-1, 0], olhoFechado: true, orelha: -0.6 }] },
  { id: 'bat_morte', fps: 7, loop: false, q: [
    { pitch: 0.3, lift: -1, shift: [-2, 0], jaw: 0.6, olhoFechado: true, orelha: -1 }, { pitch: 0.1, lift: -5, olhoFechado: true, orelha: -1, tail: 0, paws: [[7, 0.8], [-9, 0.8], [5, 0.8], [-11, 0.8]] },
    { lift: -8, jaw: 0.3, olhoFechado: true, orelha: -1, tail: -2, paws: [[12, 1], [-12, 1], [9, 1], [-14, 1]] }, { lift: -8.5, jaw: 0.3, olhoFechado: true, orelha: -1, tail: -4, paws: [[12.5, 1], [-12.5, 1], [9.5, 1], [-14.5, 1]] }] },
];

// =====================================================================  atlas, meta, prévia, validação
const COL = 8;
function montar(id, cel, anc, poses, quadro, nota) {
  const frames = [], meta = { id, tipo: 'sprite_batalha', celula: cel, ancora: anc, arte_escala: 1, ref_celula: cel[0], direcoes: ['l'], espelhar: { o: 'l' }, colunas: COL, anims: {}, poses: {}, nota };
  for (const p of poses) {
    const d = { quadros: p.q.length, fps: p.fps, loop: p.loop, inicio: frames.length, ...(p.manter ? { manter_ultimo: true } : {}), ...(p.ev ? { eventos: p.ev } : {}) };
    meta.anims[p.id] = d; meta.poses[p.id] = d; for (const q of p.q) frames.push(quadro(q));
  }
  const lin = Math.ceil(frames.length / COL), img = novaImagem(COL * cel[0], lin * cel[1]);
  frames.forEach((f, k) => { const c = k % COL, l = Math.floor(k / COL); for (let y = 0; y < cel[1]; y++) for (let x = 0; x < cel[0]; x++) { const s = (y * cel[0] + x) * 4; img.px.set(f.subarray(s, s + 4), ((l * cel[1] + y) * img.w + c * cel[0] + x) * 4); } });
  return { img, meta, frames };
}
function pix(img, x, y, c) { if (x < 0 || y < 0 || x >= img.w || y >= img.h) return; const i = (y * img.w + x) * 4; img.px[i] = c[0]; img.px[i + 1] = c[1]; img.px[i + 2] = c[2]; img.px[i + 3] = 255; }
const DIG = ['111101101101111', '010110010010111', '111001111100111', '111001111001111', '101101111001001', '111100111001111', '111100111101111', '111001001001001', '111101111101111', '111101111001111'];
function numero(img, n, x0, y0, e) { let x = x0; for (const ch of String(n)) { const g = DIG[+ch]; for (let k = 0; k < 15; k++) if (g[k] === '1') for (let a = 0; a < e; a++) for (let b = 0; b < e; b++) pix(img, x + (k % 3) * e + a, y0 + Math.floor(k / 3) * e + b, [235, 240, 225]); x += 4 * e; } }
function previa({ frames, meta }, E) {
  const [cw, ch] = meta.celula, maxq = Math.max(...Object.values(meta.poses).map((p) => p.quadros)), larg = 56, mg_ = 12, linha = ch * E + 10, nP = Object.keys(meta.poses).length, W = larg + maxq * (cw * E + mg_), H = nP * linha + 12;
  const img = novaImagem(W, H); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) pix(img, x, y, [86, 98, 84]);
  Object.values(meta.poses).forEach((p, r) => {
    numero(img, r + 1, 10, r * linha + 20, 5);
    for (let q = 0; q < p.quadros; q++) {
      const ox = larg + q * (cw * E + mg_), oy = r * linha + 4, f = frames[p.inicio + q], ax = meta.ancora[0], ay = meta.ancora[1];
      for (let y = -5 * E; y <= 5 * E; y++) for (let x = -24 * E; x <= 24 * E; x++) if ((x / (24 * E)) ** 2 + (y / (5 * E)) ** 2 <= 1) pix(img, ox + ax * E + x, oy + ay * E + y, [74, 86, 72]);
      for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) { const s = (y * cw + x) * 4; if (!f[s + 3]) continue; for (let a = 0; a < E; a++) for (let b = 0; b < E; b++) pix(img, ox + x * E + a, oy + y * E + b, [f[s], f[s + 1], f[s + 2]]); }
    }
  });
  return img;
}
function validar({ frames, meta }) {
  const [cw, ch] = meta.celula, erros = [], cores = new Set();
  frames.forEach((f, k) => { let a0 = 99, a1 = -1, b0 = 99, b1 = -1; for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) { const i = (y * cw + x) * 4, al = f[i + 3]; if (al !== 0 && al !== 255) erros.push(`quadro ${k}: alpha ${al}`); if (al) { cores.add((f[i] << 16) | (f[i + 1] << 8) | f[i + 2]); a0 = Math.min(a0, x); a1 = Math.max(a1, x); b0 = Math.min(b0, y); b1 = Math.max(b1, y); } } if (a0 < 1 || b0 < 1 || a1 > cw - 2 || b1 > ch - 2) erros.push(`quadro ${k}: encosta na borda (${a0},${b0})-(${a1},${b1})`); });
  if (cores.size > 40) erros.push(`${cores.size} cores (máx. 40)`);
  return { erros, cores: cores.size };
}

export function gerarTodos() {
  const mk = (id, cel, anc, poses, quadro, nota) => montar(id, cel, anc, poses.map((p) => ({ ...p })), quadro, nota);
  return [
    { ...mk('hero_grace', [CELULA, CELULA], ANCORA, GRACE, quadroGrace, 'Grace: poses de batalha numa só direção (L, voltada para a direita); o motor espelha. Sem normal map.'), esc: 3 },
    { ...mk('enemy_slime', CEL_SLIME, ANC_SLIME, SLIME, quadroSlime, 'Slime: poses de batalha numa só direção (L); o motor espelha. Sem normal map.'), esc: 4 },
    { ...mk('enemy_lobo', CEL_LOBO, ANC_LOBO, LOBO, quadroLobo, 'Lobo: poses de batalha numa só direção (L); o motor espelha. Sem normal map.'), esc: 3 },
  ];
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const arg = (n) => (process.argv.find((a) => a.startsWith(`--${n}=`)) ?? '').split('=')[1], raiz = arg('saida') || RAIZ;
  let falhou = false;
  for (const r of gerarTodos()) {
    const id = r.meta.id, dir = join(raiz, 'assets/sprites', id), png = codificarPng(r.img), js = JSON.stringify(r.meta, null, 2) + '\n', v = validar(r);
    mkdirSync(dir, { recursive: true });
    for (const base of [id, id + '_batalha']) { writeFileSync(join(dir, base + '.png'), png); writeFileSync(join(dir, base + '.meta.json'), js); }
    console.log(`${id}: ${r.img.w}×${r.img.h}, ${r.frames.length} quadros, ${Object.keys(r.meta.poses).length} poses, ${v.cores} cores · ` + Object.entries(r.meta.poses).map(([k, p]) => `${k.replace('bat_', '')} ${p.quadros}`).join(', '));
    if (process.argv.includes('--previa')) { const d2 = join(raiz, 'docs/arte/sprites'); mkdirSync(d2, { recursive: true }); writeFileSync(join(d2, `previa_${id}_batalha.png`), codificarPng(previa(r, r.esc))); }
    if (v.erros.length) { falhou = true; console.error(`✗ ${id}: ` + [...new Set(v.erros)].slice(0, 10).join(' | ')); }
  }
  if (falhou) process.exit(1);
}
