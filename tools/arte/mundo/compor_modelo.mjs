// ITEM-MODELO do mapa de mundo de cima (v0.1.3b, 07): trecho de 12×12 tiles (docs/arte/mapa_de_mundo.md §11) composto por código e gravado em docs/arte/mundo/:
//   item_modelo_1080p_dia.png / _tarde.png (tela inteira ×2, 30×17 tiles de arte), item_modelo_1x.png (recorte 1:1, 384×384), item_modelo_x2.png, item_modelo_anim.gif (≥ 4 s).
// Função da planta + sementes; nada de imagem de entrada além do sprite do herói de mundo. Uso: node tools/arte/mundo/compor_modelo.mjs [--so=dia|tarde|gif|1x]
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { codificarPng, decodificarPng } from '../../lib/png.mjs';
import { novaImagem, R, hash, vn, fbm, rng, lim, mix, passo, pintar, colar, SOMBRA_MUNDO } from './lib.mjs';
import { pintarTerreno, prepararMundo, PX } from './terreno.mjs';
import * as O from './objetos.mjs';
import { codificarGif } from './gif.mjs';

const RAIZ = new URL('../../../', import.meta.url), SAIDA = new URL('docs/arte/mundo/', RAIZ);
mkdirSync(SAIDA, { recursive: true });
const SO = (process.argv.find((a) => a.startsWith('--so=')) ?? '--so=tudo').slice(5);

// ---------------- planta do item-modelo (§11.1) dentro de uma tela de 30×17 tiles de mar ----------------
const MODELO = ['nnnnhggiggpa', 'nnnhggiiggpa', 'nnhggfiggppa', 'mmhgfgiggcpa', 'mmggggigcccp', 'mrggeewegggp', 'rgggegiggggp', 'rggfegiiggpa', 'gggVVggiiiaa', 'gggVVfggppaa', 'gggpppppppaa', 'pppppaaaaaaa'].map((r) => r.padEnd(12, 'a').slice(0, 12));
const TELA = [30, 17], OFF = [9, 2];
const planta = Array.from({ length: TELA[1] }, (_, z) => Array.from({ length: TELA[0] }, (_, x) => { const mx = x - OFF[0], mz = z - OFF[1]; return mx >= 0 && mz >= 0 && mx < 12 && mz < 12 ? MODELO[mz][mx] : 'a'; }).join(''));
const mapa = { tamanho: TELA, planta }, mundo = prepararMundo(mapa, 7);
const T = (x, z) => [(OFF[0] + x) * PX, (OFF[1] + z) * PX]; // tile do modelo → pixel de arte na tela

// ---------------- objetos de pé ----------------
const objetos = []; // { sp, x, y (âncora no mundo, px), altura de sombra, tipo }
const poe = (sp, x, y, extra = {}) => objetos.push({ sp, x: Math.round(x), y: Math.round(y), ...extra });
const em = (tx, tz) => T(tx, tz);

// cordilheira nos tiles `n` (canto noroeste): três massas que se sobrepõem em ~50 %
{ const a = em(2.1, 3.4), b = em(0.8, 2.6), c = em(3.5, 1.9);
  poe(O.montanha({ largura: 160, fundo: 60, sem: 2, picos: [{ x: 80, y: 32, alt: 84, raio: 66 }, { x: 40, y: 34, alt: 46, raio: 38 }, { x: 118, y: 34, alt: 56, raio: 40 }] }), a[0], a[1], { tipo: 'montanha' });
  poe(O.montanha({ largura: 112, fundo: 50, sem: 5, picos: [{ x: 56, y: 28, alt: 56, raio: 52 }, { x: 24, y: 30, alt: 32, raio: 30 }] }), b[0], b[1] - 6, { tipo: 'montanha' });
  poe(O.montanha({ largura: 132, fundo: 50, sem: 8, picos: [{ x: 56, y: 28, alt: 62, raio: 54 }, { x: 88, y: 30, alt: 36, raio: 30 }] }), c[0], c[1] - 10, { tipo: 'montanha' }); }
// florestas em massa (mata densa `m`) e bosque ralo (`r`): pontos com jitter, aceitos por peso de mata + ruído (borda irregular), as de trás mais escuras
{ const r = rng(77), pesoMata = (x, z) => mundo.bil((i, j) => (mundo.grupo(i, j) === 'mata' ? 1 : 0), x, z), pesoRalo = (x, z) => mundo.bil((i, j) => (mundo.grupo(i, j) === 'ralo' ? 1 : 0), x, z);
  for (let n = 0; n < 700; n++) { const x = r() * 12, z = r() * 12, w = pesoMata(x + OFF[0], z + OFF[1]) + (vn(x * 2.5, z * 2.5, 31) - 0.5) * 0.5; if (w <= 0.55) continue; const [px, py] = T(x, z), k = Math.floor(r() * 7), esc = 0.95 + r() * 0.35; poe(k < 3 ? O.pinheiro(k + 1, esc) : O.carvalho(k + 3, esc), px, py, { tipo: 'arvore' }); }
  for (let n = 0; n < 160; n++) { const x = r() * 12, z = r() * 12, w = pesoRalo(x + OFF[0], z + OFF[1]) + (vn(x * 2.2, z * 2.2, 33) - 0.5) * 0.6; if (w <= 0.62 || r() > 0.2) continue; const [px, py] = T(x, z), k = Math.floor(r() * 4); poe(k === 0 ? O.betula(2 + n % 3) : k === 1 ? O.pinheiro(n % 3 + 1, 0.9) : O.carvalho(n % 5 + 7, 0.9), px, py, { tipo: 'arvore' }); } }
// árvores soltas, arbustos e rochas pela planície (poucos, para dar vida sem poluir)
for (const [tx, tz, f] of [[3.6, 4.3, () => O.betula(5)], [8.3, 3.2, () => O.carvalho(21, 1.1)], [9.4, 6.4, () => O.outonal(2, 1)], [6.2, 6.9, () => O.arbusto(3)], [3.2, 7.0, () => O.arbusto(6)], [1.6, 8.7, () => O.carvalho(30, 1)], [10.2, 4.8, () => O.arbusto(9)], [7.7, 9.8, () => O.arbusto(2)], [2.2, 1.6, () => O.rocha(1)], [3.3, 3.9, () => O.rocha(2)], [4.5, 7.4, () => O.rocha(3)], [9.6, 1.4, () => O.carvalho(40, 1.2)]]) { const [px, py] = T(tx, tz); poe(f(), px, py, { tipo: 'solto' }); }
// ponte sobre o rio na estrada (tile w = (6, 5)); camada do chão
const pt = O.ponte(3), [pbx, pby] = T(6.5, 5.5); const ponte = { sp: pt, x: pbx, y: pby + 14 };
// marcador da vila (3×3): âncora no centro da base
const vila = O.marcadorVila(1), [vx, vy] = T(4.0, 9.0); poe(vila, vx, vy + 26, { tipo: 'vila' });

// ---------------- herói de mundo (atlas existente, 32×32, âncora nos pés) ----------------
const atlas = decodificarPng(readFileSync(new URL('assets/sprites/hero_edric_mundo/hero_edric_mundo.png', RAIZ))), meta = JSON.parse(readFileSync(new URL('assets/sprites/hero_edric_mundo/hero_edric_mundo.meta.json', RAIZ), 'utf8'));
const celula = (i) => { const c = meta.colunas, im = novaImagem(32, 32); for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) { const s = (((Math.floor(i / c)) * 32 + y) * atlas.w + (i % c) * 32 + x) * 4; im.px.set(atlas.px.subarray(s, s + 4), (y * 32 + x) * 4); } return im; };
const D = { s: 0, se: 1, l: 2, ne: 3, n: 4 }, heroiQuadro = (anim, dir, f) => celula((meta.anims[anim].inicio ?? 0) + D[dir] * meta.anims[anim].quadros + (f % meta.anims[anim].quadros));

// ---------------- composição de um quadro ----------------
const fundo = [0, 1, 2, 3].map((q) => pintarTerreno(mapa, { quadro: q, mundo }));
const nuvens = (() => { const W = 2048, H = 2048, im = new Float32Array(W * H); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const n = fbm(x / 160, y / 160, 91) * 0.7 + fbm(x / 70 + 30, y / 70, 93) * 0.3; im[y * W + x] = lim((n - 0.5) / 0.14); } return { W, H, im }; })();

function sombra(img, o) { // sombra projetada para a direita-baixo (sombra_mundo a 38 %), só dos objetos altos
  const { sp } = o, k = o.tipo === 'montanha' ? [0.62, 0.22] : o.tipo === 'vila' ? [0.4, 0.16] : [0.5, 0.2];
  for (let y = 0; y < sp.img.h; y++) for (let x = 0; x < sp.img.w; x++) { if (!sp.img.px[(y * sp.img.w + x) * 4 + 3]) continue; const h = sp.ay - y; if (h < 3) continue; pintar(img, o.x + (x - sp.ax) + h * k[0], o.y + h * k[1] - 1, SOMBRA_MUNDO, 255 * 0.38 * (o.tipo === 'montanha' ? 0.8 : 1)); }
  for (let y = Math.max(0, sp.ay - 3); y < sp.ay + 1; y++) for (let x = 0; x < sp.img.w; x++) if (sp.img.px[(y * sp.img.w + x) * 4 + 3] && (o.tipo === 'arvore' || o.tipo === 'solto')) pintar(img, o.x + (x - sp.ax) + 2, o.y + 1, SOMBRA_MUNDO, 255 * 0.3);
}
function fumaca(img, x0, y0, t) { // coluna de fumaça: 7 puffs que sobem, se alargam e somem, derivando para a direita
  for (let k = 0; k < 7; k++) { const f = ((t * 0.55 + k / 7) % 1), x = x0 + f * 12 + Math.sin((t + k) * 2) * 1.5, y = y0 - f * 30, r = 1.6 + f * 3.2, a = (1 - f) * 0.85;
    for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) if (dx * dx + dy * dy <= r * r) pintar(img, x + dx, y + dy, R.fumaca[dx + dy < -1 ? 2 : dx + dy < 2 ? 1 : 0], 255 * a); }
}
function bandeirolas(img, x0, y0, x1, t) {
  const cores = [R.telha[3], R.brilho[1], R.ardosia[2], R.espuma[1], R.outono[1]];
  for (let x = x0; x <= x1; x++) { const f = (x - x0) / (x1 - x0), y = y0 + Math.sin(f * Math.PI) * 4; pintar(img, x, y, R.madeira[0]); if ((x - x0) % 5 === 2) { const bal = Math.sin(t * 3 + x * 0.5) > 0 ? 1 : 0; for (let k = 0; k < 4; k++) pintar(img, x + (k > 1 ? bal : 0), y + 1 + k, cores[((x - x0) / 5 | 0) % cores.length]); } }
}

function compor(quadro, { grade, tarde = false, comHeroi = true, tempo = quadro / 12 }) {
  const img = novaImagem(TELA[0] * PX, TELA[1] * PX); img.px.set(fundo[Math.floor(quadro / 3) % 4].px);
  colar(img, ponte.sp.img, ponte.x - ponte.sp.ax, ponte.y - ponte.sp.ay);
  for (let y = 0; y < ponte.sp.img.h; y++) for (let x = 0; x < ponte.sp.img.w; x++) if (ponte.sp.img.px[(y * ponte.sp.img.w + x) * 4 + 3] && y > 24) pintar(img, ponte.x - ponte.sp.ax + x + 2, ponte.y - ponte.sp.ay + y + 5, SOMBRA_MUNDO, 255 * 0.38); // sombra na água
  const lista = objetos.slice(); const [hx0, hy0] = T(4.4, 5.55), vel = 1.15 * 32; // o herói caminha pela estrada para leste
  let heroi = null; if (comHeroi) { const hx = hx0 + ((tempo * vel) % (4.2 * 32)), im = heroiQuadro('andar', 'l', Math.floor(tempo * 8)); heroi = { sp: { img: im, ax: 16, ay: 29 }, x: Math.round(hx), y: hy0 + 16, tipo: 'heroi' }; lista.push(heroi); }
  lista.sort((a, b) => a.y - b.y);
  for (const o of lista) if (o.tipo !== 'heroi') sombra(img, o);
  if (heroi) for (let dy = -2; dy <= 2; dy++) for (let dx = -7; dx <= 7; dx++) if ((dx / 7) ** 2 + (dy / 2.4) ** 2 <= 1) pintar(img, heroi.x + dx, heroi.y + dy, SOMBRA_MUNDO, 255 * 0.4); // sombra elíptica
  if (heroi) for (let k = 0; k < 3; k++) { const f = ((tempo * 4 + k / 3) % 1); pintar(img, heroi.x - 6 - f * 9, heroi.y - 1 - f * 3, R.estrada[3], 255 * (1 - f) * 0.8); pintar(img, heroi.x - 7 - f * 9, heroi.y - 1 - f * 3, R.estrada[2], 255 * (1 - f) * 0.5); } // poeira
  for (const o of lista) { colar(img, o.sp.img, o.x - o.sp.ax, o.y - o.sp.ay); if (o.tipo === 'vila') { for (const [fx, fy] of o.sp.fumaca) fumaca(img, o.x - o.sp.ax + fx, o.y - o.sp.ay + fy, tempo); for (const [x0, y0, x1] of o.sp.bandeiras) bandeirolas(img, o.x - o.sp.ax + x0, o.y - o.sp.ay + y0, o.x - o.sp.ax + x1, tempo); } }
  // partículas: pólen dourado à deriva e brilhos
  const rp = rng(5); for (let k = 0; k < 28; k++) { const bx = rp() * img.w, by = rp() * img.h, ph = rp() * 6.28, x = (bx + tempo * 6 + Math.sin(tempo + ph) * 5) % img.w, y = by + Math.sin(tempo * 1.3 + ph) * 4; if (mundo.costa(x / PX, y / PX) > 0.4) pintar(img, x, y, R.brilho[1], 255 * (0.35 + 0.4 * Math.sin(tempo * 2 + ph) ** 2)); }
  // sombras de nuvem (duas camadas, deriva ~0,4 tile/s na diagonal) e grade de cor
  const dx = Math.floor(tempo * 13), dy = Math.floor(tempo * 6);
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) {
    const i = (y * img.w + x) * 4, n = nuvens.im[(((y + dy) % nuvens.H) * nuvens.W + ((x + dx) % nuvens.W))] * 0.18, n2 = nuvens.im[(((y * 2 + dy * 2) % nuvens.H) * nuvens.W + ((x * 2 + dx * 1.4) % nuvens.W | 0))] * 0.1, k = 1 - (n + n2) * (tarde ? 0.8 : 1);
    const vx = (x / img.w - 0.5), vy = (y / img.h - 0.5), vig = 1 - Math.max(0, (vx * vx + vy * vy) - 0.12) * 0.9;
    for (let c = 0; c < 3; c++) img.px[i + c] = lim(img.px[i + c] * k * grade[c] * vig + (c === 2 && tarde ? 4 : 0), 0, 255);
  }
  return img;
}
function ampliar(img, n, x0 = 0, y0 = 0, w = img.w, h = img.h) { const o = novaImagem(w * n, h * n); for (let y = 0; y < h * n; y++) for (let x = 0; x < w * n; x++) { const s = (((y0 + Math.floor(y / n)) * img.w + x0 + Math.floor(x / n)) * 4); o.px.set(img.px.subarray(s, s + 4), (y * o.w + x) * 4); } return o; }
const salvar = (nome, img) => { writeFileSync(new URL(nome, SAIDA), codificarPng(img)); console.log('✓', nome); };
const DIA = [255 / 255, 246 / 255, 228 / 255], TARDE = [1.0, 0.78, 0.58];

if (SO === 'tudo' || SO === 'dia') {
  const f = compor(2, { grade: DIA }); salvar('item_modelo_1080p_dia.png', ampliar(f, 2, 0, 2, 960, 540));
  const [cx, cz] = T(0, 0); salvar('item_modelo_1x.png', ampliar(f, 1, cx, cz, 12 * PX, 12 * PX)); salvar('item_modelo_x2.png', ampliar(f, 2, cx, cz, 12 * PX, 12 * PX));
}
if (SO === 'tudo' || SO === 'tarde') { const f = compor(2, { grade: TARDE, tarde: true }); salvar('item_modelo_1080p_tarde.png', ampliar(f, 2, 0, 2, 960, 540)); }
if (SO === 'tudo' || SO === 'gif') {
  const [cx, cz] = T(0, 0), quadros = []; for (let q = 0; q < 52; q++) { const f = compor(q, { grade: DIA }); quadros.push(ampliar(f, 1, cx, cz, 12 * PX, 12 * PX)); }
  const buf = codificarGif(quadros, 8); writeFileSync(new URL('item_modelo_anim.gif', SAIDA), buf); console.log('✓ item_modelo_anim.gif', (buf.length / 1024 / 1024).toFixed(2), 'MB, 52 quadros a 12,5 fps (4,2 s)');
}
