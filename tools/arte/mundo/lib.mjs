// Utilidades do mapa de mundo de cima (v0.1.3b, 07): paleta do 10 (docs/arte/paleta_mundo.json), ruído determinístico, imagem RGBA e pintura em rampas com
// pontilhado ordenado (Bayer 4×4), no estilo pixel art. Tudo função pura de semente; nada de arquivo de imagem como entrada (exceto o sprite do herói, na composição).
import { readFileSync } from 'node:fs';
import { novaImagem } from '../../lib/png.mjs';

export { novaImagem };
const RAIZ = new URL('../../../', import.meta.url);
const paletaJson = JSON.parse(readFileSync(new URL('docs/arte/paleta_mundo.json', RAIZ), 'utf8'));
export const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
/** Rampas da paleta: R.grama = [[r,g,b], ...] do mais escuro ao mais claro. */
export const R = Object.fromEntries(paletaJson.rampas.map((r) => [r.nome, r.cores.map((c) => hex(c.hex))]));
export const SOMBRA_MUNDO = [14, 34, 48];

export const hash = (x, z, s = 0) => { let h = (Math.imul(x | 0, 374761393) + Math.imul(z | 0, 668265263) + Math.imul(s | 0, 2147483647)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };
export const mix = (a, b, t) => a + (b - a) * t;
export const lim = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
const suave = (t) => t * t * (3 - 2 * t);
export const vn = (x, z, s = 0) => { const ix = Math.floor(x), iz = Math.floor(z), fx = suave(x - ix), fz = suave(z - iz); return mix(mix(hash(ix, iz, s), hash(ix + 1, iz, s), fx), mix(hash(ix, iz + 1, s), hash(ix + 1, iz + 1, s), fx), fz); };
export const fbm = (x, z, s = 0) => vn(x, z, s) * 0.55 + vn(x * 2.07, z * 2.07, s + 1) * 0.3 + vn(x * 4.3, z * 4.3, s + 2) * 0.15;
export function rng(semente) { let s = (semente >>> 0) || 1; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
/** Índice de uma rampa para o valor contínuo t em [0, n-1], com pontilhado ordenado entre dois passos vizinhos. */
export function passo(n, t, px, py) { const v = lim(t, 0, n - 1), i = Math.floor(v), f = v - i; return i >= n - 1 ? n - 1 : f > (BAYER[(py & 3) * 4 + (px & 3)] + 0.5) / 16 ? i + 1 : i; }
export const cor = (rampa, t, px, py) => R[rampa][passo(R[rampa].length, t, px, py)];
export const escurecer = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
export const misturar = (a, b, t) => [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)];

export function pintar(img, x, y, c, a = 255) {
  x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= img.w || y >= img.h) return;
  const i = (y * img.w + x) * 4;
  if (a >= 255) { img.px[i] = c[0]; img.px[i + 1] = c[1]; img.px[i + 2] = c[2]; img.px[i + 3] = 255; return; }
  const k = a / 255, da = img.px[i + 3] / 255, oa = k + da * (1 - k); if (oa <= 0) return;
  for (let j = 0; j < 3; j++) img.px[i + j] = (c[j] * k + img.px[i + j] * da * (1 - k)) / oa; img.px[i + 3] = oa * 255;
}
export const ler = (img, x, y) => { if (x < 0 || y < 0 || x >= img.w || y >= img.h) return null; const i = (y * img.w + x) * 4; return [img.px[i], img.px[i + 1], img.px[i + 2], img.px[i + 3]]; };
/** Cola `src` em `dst` com origem em (ox, oy), alpha normal; `tint` opcional [r,g,b,a] substitui a cor (sombras). */
export function colar(dst, src, ox, oy, tint) {
  for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) { const i = (y * src.w + x) * 4, a = src.px[i + 3]; if (!a) continue; pintar(dst, ox + x, oy + y, tint ?? [src.px[i], src.px[i + 1], src.px[i + 2]], tint ? (tint[3] ?? 255) * (a / 255) : a); }
}
/** Contorno de 1 px FORA da silhueta (4 vizinhos), na cor dada. */
export function contorno(img, c) {
  const marca = [];
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) { if (img.px[(y * img.w + x) * 4 + 3]) continue; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const q = ler(img, x + dx, y + dy); if (q && q[3] > 200) { marca.push([x, y]); break; } } }
  for (const [x, y] of marca) pintar(img, x, y, c);
}
