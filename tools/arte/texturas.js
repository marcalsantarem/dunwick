// Texturas tileáveis do cenário (256×256), geradas por código: grama, terra, calçamento musgoso, reboco, madeira, telhas, casca, pedra,
// folhagem, tábuas. Ruído com semente e período inteiro ⇒ emendam nas bordas. Paleta: direção A "Lanterna e Musgo".
import { tela, criarRuido, rng, hex, lerp, clamp, misturar } from './util.js';

const N = 256;
function pintar(semente, fn) {
  const cv = tela(N, N), c = cv.getContext('2d'), img = c.createImageData(N, N), D = img.data, ruido = criarRuido(semente, 8), r = rng(semente + 1);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const o = (y * N + x) * 4, col = fn(x / N, y / N, x, y, ruido, r); D[o] = col[0]; D[o + 1] = col[1]; D[o + 2] = col[2]; D[o + 3] = 255; }
  c.putImageData(img, 0, 0); return cv;
}
const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const H = hex;

export function gramas() {
  const tons = [['#2E5434', '#4F7A30', '#6FA046'], ['#2F5638', '#527E32', '#7AA94C'], ['#33583A', '#58823A', '#6A9A44']];
  return tons.map((t, k) => {
    const c0 = H(t[0]), c1 = H(t[1]), c2 = H(t[2]);
    const cv = pintar(11 + k * 7, (u, v, x, y, ru) => {
      const base = ru(u, v, 5), fino = ru(u * 4 % 1, v * 4 % 1, 3), m = mix3(c0, c1, clamp(base * 1.3 - 0.1, 0, 1));
      return mix3(m, c2, clamp((fino - 0.5) * 1.4 + 0.15, 0, 0.7)).map((q) => q + (fino - 0.5) * 14);
    });
    // lâminas de capim por cima (tileáveis: desenha 3×3 deslocado)
    const c = cv.getContext('2d'), r = rng(500 + k); c.lineCap = 'round';
    for (let i = 0; i < 900; i++) { const x = r() * N, y = r() * N, h = 3 + r() * 6, s = (r() - 0.5) * 3, claro = r() < 0.5; c.strokeStyle = claro ? 'rgba(150,200,90,0.55)' : 'rgba(30,70,32,0.5)'; c.lineWidth = 1 + r() * 0.8;
      for (const [ox, oy] of [[0, 0], [N, 0], [-N, 0], [0, N], [0, -N]]) { c.beginPath(); c.moveTo(x + ox, y + oy); c.lineTo(x + s + ox, y - h + oy); c.stroke(); } }
    return cv;
  });
}

export function terra() {
  const a = H('#8A6B45'), b = H('#A3845A'), d = H('#5E4630');
  const cv = pintar(31, (u, v, x, y, ru) => { const n = ru(u, v, 5), g = ru(u * 6 % 1, v * 6 % 1, 2); return mix3(mix3(d, a, clamp(n * 1.5 - 0.2, 0, 1)), b, clamp((g - 0.45) * 2, 0, 0.6)); });
  const c = cv.getContext('2d'), r = rng(32);
  for (let i = 0; i < 160; i++) { const x = r() * N, y = r() * N, w = 1.5 + r() * 3.5; for (const [ox, oy] of [[0, 0], [N, 0], [-N, 0], [0, N], [0, -N]]) { c.fillStyle = 'rgba(30,20,12,0.4)'; c.beginPath(); c.ellipse(x + 0.8 + ox, y + 0.8 + oy, w, w * 0.65, 0, 0, 7); c.fill(); c.fillStyle = ['#9A958A', '#7D786E', '#B3AEA2'][i % 3]; c.beginPath(); c.ellipse(x + ox, y + oy, w, w * 0.65, 0, 0, 7); c.fill(); } }
  return cv;
}

export function calcada() {
  // pedras arredondadas em células jitteradas (6×6), juntas escuras com musgo azul-esverdeado
  const celulas = 6, r = rng(41), pts = []; for (let j = 0; j < celulas; j++) for (let i = 0; i < celulas; i++) pts.push([(i + 0.2 + r() * 0.6) / celulas, (j + 0.2 + r() * 0.6) / celulas, 0.82 + r() * 0.3, r()]);
  const ru2 = criarRuido(42, 8), pedra = [H('#9A958A'), H('#7D786E'), H('#B3AEA2')], junta = H('#3A3A32'), musgo = H('#3F6B4A');
  return pintar(43, (u, v, x, y, ru) => {
    let d1 = 9, d2 = 9, id = 0, ix = 0;
    for (let k = 0; k < pts.length; k++) { for (const ou of [-1, 0, 1]) for (const ov of [-1, 0, 1]) { const dx = u - (pts[k][0] + ou), dy = v - (pts[k][1] + ov), d = Math.hypot(dx, dy) * pts[k][2]; if (d < d1) { d2 = d1; d1 = d; id = pts[k][3]; ix = k; } else if (d < d2) d2 = d; } }
    const borda = (d2 - d1) * celulas; // distância relativa à junta
    const base = pedra[id < 0.4 ? 0 : id < 0.75 ? 1 : 2], vari = (ru2(u * 3 % 1, v * 3 % 1, 3) - 0.5) * 36, luz = clamp(borda * 2.2, 0, 1);
    let col = base.map((q) => q + vari + (luz - 0.5) * 18 + (ix % 3) * 3);
    if (borda < 0.1) { col = mix3(junta, musgo, clamp(ru(u, v, 4) * 1.4 - 0.15, 0, 1) * 0.8); } else if (borda < 0.18) col = mix3(col, junta, 0.45);
    const m = clamp((ru(u * 2 % 1, v * 2 % 1, 4) - 0.55) * 2.4, 0, 0.55); if (m > 0 && borda < 0.5) col = mix3(col, musgo, m * 0.7);
    return col;
  });
}

export function reboco() {
  const a = H('#E8DCC0'), b = H('#D6C7A6'), m = H('#8F8A6A');
  return pintar(51, (u, v, x, y, ru) => { const n = ru(u, v, 5), g = (ru(u * 8 % 1, v * 8 % 1, 2) - 0.5) * 16; const base = mix3(b, a, clamp(n * 1.4 - 0.1, 0, 1)); const mancha = clamp((ru(u * 3 % 1 + 0.3, v * 2 % 1, 4) - 0.62) * 3, 0, 0.5); return mix3(base, m, mancha).map((q) => q + g); });
}

export function madeira() {
  const a = H('#6B4428'), b = H('#855632'), d = H('#4A2E1A');
  return pintar(61, (u, v, x, y, ru) => { const veio = ru(u * 2 % 1, (v * 20) % 1 + v * 0.1, 3), n = ru(u, v, 4); const t = clamp(veio * 1.3 - 0.15 + (n - 0.5) * 0.5, 0, 1); return mix3(mix3(d, a, t), b, clamp((n - 0.55) * 2, 0, 0.5)); });
}

function telha(semente, cores, musgo) {
  const [c0, c1, c2] = cores.map(H), mu = H('#4C7A52');
  return pintar(semente, (u, v, x, y, ru) => {
    const fil = 16, alt = N / fil, row = Math.floor(y / alt), ty = (y % alt) / alt, off = (row % 2) * 0.5, tx = (((u * 8 + off) % 1) + 1) % 1; // telhas em escamas
    const borda = Math.min(tx, 1 - tx) * 6, base = mix3(c0, c1, ru(((u * 8 + off) | 0) / 8, row / fil, 2)), fundo = clamp(1 - ty * 1.2, 0, 1), curva = 1 - Math.pow(Math.abs(tx - 0.5) * 2, 2);
    let col = mix3(mix3(base, c2, fundo * 0.6), [255, 235, 200], curva * 0.12).map((q) => q);
    if (borda < 0.3) col = mix3(col, [20, 12, 8], 0.45 - borda);
    if (musgo) { const m = clamp((ru(u * 2 % 1, v * 2 % 1, 4) - 0.5) * 3, 0, 0.7) * (0.4 + fundo * 0.6); col = mix3(col, mu, m); }
    return col;
  });
}
export const telhaLaranja = (musgo = false) => telha(71 + (musgo ? 9 : 0), ['#C2643A', '#D97A48', '#9E4B2A'], musgo);
export const ardosia = (musgo = false) => telha(81 + (musgo ? 9 : 0), ['#4A5A78', '#5C6E8F', '#3A4762'], musgo);

export function casca() { const a = H('#5A3C24'), b = H('#7A5535'), d = H('#33231A'); return pintar(91, (u, v, x, y, ru) => { const f = ru(u * 6 % 1, v * 2 % 1, 3), n = ru(u, v, 4); return mix3(mix3(d, a, clamp(f * 1.6 - 0.2, 0, 1)), b, clamp((n - 0.5) * 1.6, 0, 0.6)); }); }

export function pedra() {
  const L = [H('#9A958A'), H('#8A857A'), H('#A8A296')], jun = H('#4A4A42'), mu = H('#4C7A52');
  return pintar(101, (u, v, x, y, ru) => { const fil = 6, row = Math.floor(v * fil), off = (row % 2) * 0.5, col = (((u * 4 + off) % 1) + 1) % 1, id = ru(Math.floor(u * 4 + off) / 4 % 1, row / fil, 2); const base = L[id < 0.33 ? 0 : id < 0.66 ? 1 : 2], n = (ru(u * 5 % 1, v * 5 % 1, 3) - 0.5) * 34; let c = base.map((q) => q + n); const bx = Math.min(col, 1 - col) * 4, by = Math.min((v * fil) % 1, 1 - ((v * fil) % 1)) * 5; if (bx < 0.1 || by < 0.12) c = mix3(c, jun, 0.7); const m = clamp((ru(u * 2 % 1, v * 2 % 1, 4) - 0.55) * 2.5, 0, 0.5) * (1 - v * 0.3); return mix3(c, mu, m); });
}

export function folhagem() { const a = H('#2E5434'), b = H('#4F7A30'), c2 = H('#7AA94C'); return pintar(111, (u, v, x, y, ru) => { const n = ru(u * 3 % 1, v * 3 % 1, 4), f = ru(u * 10 % 1, v * 10 % 1, 2); return mix3(mix3(a, b, clamp(n * 1.5 - 0.15, 0, 1)), c2, clamp((f - 0.55) * 2.2, 0, 0.7)); }); }

export function tabuas() { const a = H('#7A5232'), b = H('#9A6A3E'), d = H('#3A2414'); return pintar(121, (u, v, x, y, ru) => { const t = Math.floor(u * 6), local = (u * 6) % 1, veio = ru(t / 6, (v * 4) % 1, 3), n = ru(u, v, 4); let c = mix3(mix3(a, b, clamp(veio * 1.3, 0, 1)), d, clamp((0.5 - n) * 0.6, 0, 0.4)); if (local < 0.04 || local > 0.96) c = mix3(c, d, 0.75); return c; }); }

export function todasTexturas() {
  const g = gramas();
  return { grama_a: g[0], grama_b: g[1], grama_c: g[2], terra: terra(), calcada: calcada(), reboco: reboco(), madeira: madeira(), telha_laranja: telhaLaranja(false), telha_musgo: telhaLaranja(true), ardosia: ardosia(false), casca: casca(), pedra: pedra(), folhagem: folhagem(), tabuas: tabuas() };
}
void misturar;
