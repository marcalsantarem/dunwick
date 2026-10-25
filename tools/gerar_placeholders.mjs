// Gera os assets PLACEHOLDER do esqueleto M1 (arte final é do 04/07/10): 3 personagens chibi com normal map + máscara de
// brilho, atlas "sala cinza", sombra de contato e um SFX de teste. Determinístico, sem dependências.
// Uso: npm run assets   (regrava assets/ — os arquivos gerados SÃO versionados; arte real do 04 substitui estes)
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { codificarPng, novaImagem, pintar, rng } from './lib/png.mjs';
import { codificarWav } from './lib/wav.mjs';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets');
const gravar = (caminho, dados) => { mkdirSync(dirname(caminho), { recursive: true }); writeFileSync(caminho, dados); };

// ---------- Personagem chibi: célula 64×64, âncora nos pés (32,60), direções S/N/L, 8 quadros ----------
const DIRS = ['s', 'n', 'l'], QUADROS = 8;
function desenharPersonagem(paleta, forma, semente) {
  const W = 64 * QUADROS, H = 64 * DIRS.length;
  const alb = novaImagem(W, H), brilho = novaImagem(W, H), altura = new Float32Array(W * H), r = rng(semente);
  DIRS.forEach((dir, linha) => {
    for (let q = 0; q < QUADROS; q++) {
      const ox = q * 64, oy = linha * 64, fase = Math.sin((q / QUADROS) * Math.PI * 2), bob = Math.round(Math.abs(fase) * forma.balanco), passo = Math.round(fase * forma.passo);
      const partes = [
        { cx: 27 + (dir === 'l' ? passo : 0), cy: 55 - (dir !== 'l' ? Math.max(0, passo) : 0), rx: 3.5, ry: 5.5, cor: paleta.calca },
        { cx: 37 - (dir === 'l' ? passo : 0), cy: 55 - (dir !== 'l' ? Math.max(0, -passo) : 0), rx: 3.5, ry: 5.5, cor: paleta.calca },
        { cx: 32, cy: 43 - bob, rx: forma.corpoRx, ry: 8, cor: paleta.roupa },
        { cx: 32 - forma.corpoRx - 1, cy: 43 - bob - passo * 0.5, rx: 2.5, ry: 5, cor: paleta.pele },
        { cx: 32 + forma.corpoRx + 1, cy: 43 - bob + passo * 0.5, rx: 2.5, ry: 5, cor: paleta.pele },
        { cx: 32 + (dir === 'l' ? 2 : 0), cy: 23 - bob, rx: forma.cabecaR, ry: forma.cabecaR - 0.5, cor: dir === 'n' ? paleta.cabelo : paleta.pele },
        { cx: 32, cy: 15 - bob, rx: forma.cabecaR - 1, ry: 5, cor: paleta.cabelo },
      ];
      for (const p of partes) for (let y = Math.floor(p.cy - p.ry); y <= Math.ceil(p.cy + p.ry); y++) for (let x = Math.floor(p.cx - p.rx); x <= Math.ceil(p.cx + p.rx); x++) {
        const dx = (x + 0.5 - p.cx) / p.rx, dy = (y + 0.5 - p.cy) / p.ry, d2 = dx * dx + dy * dy;
        if (d2 > 1) continue;
        const hgt = Math.sqrt(1 - d2) * Math.min(p.rx, p.ry), i = (oy + y) * W + ox + x;
        if (alb.px[i * 4 + 3] && hgt + 3 < altura[i]) continue;
        altura[i] = Math.max(altura[i], hgt + 3);
        const ruido = (r() - 0.5) * 10;
        pintar(alb, ox + x, oy + y, p.cor.map((c) => Math.max(0, Math.min(255, Math.round(c + ruido)))));
      }
      if (dir !== 'n') for (const ex of dir === 's' ? [27, 37] : [38]) for (let dy = 0; dy < 3; dy++) {
        pintar(alb, ox + ex, oy + 23 - bob + dy, paleta.olho);
        if (forma.olhoBrilha) pintar(brilho, ox + ex, oy + 23 - bob + dy, [255, 255, 255, 255]);
      }
      const contorno = [];
      for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
        if (alb.px[((oy + y) * W + ox + x) * 4 + 3]) continue;
        if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => { const xx = x + a, yy = y + b; return xx >= 0 && yy >= 0 && xx < 64 && yy < 64 && alb.px[((oy + yy) * W + ox + xx) * 4 + 3]; })) contorno.push([ox + x, oy + y]);
      }
      for (const [x, y] of contorno) { pintar(alb, x, y, paleta.contorno); altura[y * W + x] = 1; }
    }
  });
  // Normal map: espaço do sprite, OpenGL (verde = +Y para cima), R=+X, B=+Z; alpha 0 fora da silhueta (ADR-001).
  const nrm = novaImagem(W, H), hA = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? 0 : altura[y * W + x]);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!alb.px[(y * W + x) * 4 + 3]) { pintar(nrm, x, y, [128, 128, 255, 0]); continue; }
    let nx = -(hA(x + 1, y) - hA(x - 1, y)) * 0.5, ny = (hA(x, y - 1) - hA(x, y + 1)) * 0.5, nz = 1.6;
    const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l;
    pintar(nrm, x, y, [Math.round((nx * 0.5 + 0.5) * 255), Math.round((ny * 0.5 + 0.5) * 255), Math.round((nz * 0.5 + 0.5) * 255), 255]);
  }
  for (let i = 0; i < brilho.px.length; i += 4) if (!brilho.px[i + 3]) brilho.px[i + 3] = 255; // fora do brilho = preto opaco
  return { alb, nrm, brilho };
}

const PERSONAGENS = [
  ['hero_principal', { pele: [236, 188, 150], roupa: [64, 110, 170], calca: [80, 60, 50], cabelo: [120, 70, 40], olho: [30, 30, 40], contorno: [28, 22, 30] }, { corpoRx: 7, cabecaR: 11, olhoBrilha: false, balanco: 1, passo: 3 }],
  ['enemy_boneco_alvo', { pele: [214, 178, 112], roupa: [186, 150, 92], calca: [150, 118, 70], cabelo: [160, 128, 76], olho: [60, 40, 20], contorno: [50, 34, 18] }, { corpoRx: 9, cabecaR: 10, olhoBrilha: false, balanco: 0, passo: 0 }],
  ['enemy_boneco_golpe', { pele: [190, 120, 120], roupa: [150, 70, 80], calca: [100, 50, 60], cabelo: [120, 60, 70], olho: [255, 230, 120], contorno: [44, 20, 28] }, { corpoRx: 10, cabecaR: 10, olhoBrilha: true, balanco: 0, passo: 0 }],
];
PERSONAGENS.forEach(([id, pal, forma], k) => {
  const { alb, nrm, brilho } = desenharPersonagem(pal, forma, 1000 + k), base = join(RAIZ, 'sprites', id, id);
  gravar(`${base}.png`, codificarPng(alb)); gravar(`${base}_n.png`, codificarPng(nrm)); gravar(`${base}_e.png`, codificarPng(brilho));
  gravar(`${base}.meta.json`, JSON.stringify({
    id, celula: [64, 64], ancora: [32, 60], direcoes: DIRS, espelhar: { o: 'l' }, quadros: QUADROS, fps: 10,
    normal_map: 'opengl_y_cima', eventos: [{ quadro: 2, tipo: 'passo' }, { quadro: 6, tipo: 'passo' }],
  }, null, 2) + '\n');
});

// ---------- Atlas "sala cinza": 4 tiles de 32×32 em faixa 128×32 (piso, parede, plataforma, rampa) ----------
const TILES = [
  { nome: 'piso', base: [138, 138, 142], var: 10, grade: true },
  { nome: 'parede', base: [92, 92, 100], var: 14, tijolo: true },
  { nome: 'plataforma', base: [168, 168, 172], var: 8, grade: true },
  { nome: 'rampa', base: [150, 146, 140], var: 8, listras: true },
];
{
  const alb = novaImagem(128, 32), nrm = novaImagem(128, 32), alt = new Float32Array(128 * 32), r = rng(77);
  TILES.forEach((t, tx) => {
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
      let h = 0, claro = 0;
      if (t.grade && (x === 0 || y === 0)) { h = -1; claro = -22; }
      if (t.tijolo && (y % 8 === 0 || (x + (Math.floor(y / 8) % 2) * 8) % 16 === 0)) { h = -1; claro = -18; }
      if (t.listras && (x + y) % 8 < 2) { h = -0.6; claro = -14; }
      const q = Math.round((r() - 0.5) * 2) * (t.var / 2) + claro;
      pintar(alb, tx * 32 + x, y, t.base.map((v) => Math.max(0, Math.min(255, v + q))));
      alt[y * 128 + tx * 32 + x] = h;
    }
  });
  const a = (x, y) => alt[Math.min(31, Math.max(0, y)) * 128 + Math.min(127, Math.max(0, x))];
  for (let y = 0; y < 32; y++) for (let x = 0; x < 128; x++) {
    let nx = -(a(x + 1, y) - a(x - 1, y)), ny = a(x, y - 1) - a(x, y + 1), nz = 2.5; const l = Math.hypot(nx, ny, nz);
    pintar(nrm, x, y, [(nx / l * 0.5 + 0.5) * 255, (ny / l * 0.5 + 0.5) * 255, (nz / l * 0.5 + 0.5) * 255, 255].map(Math.round));
  }
  gravar(join(RAIZ, 'env', 'atlas_sala_cinza.png'), codificarPng(alb));
  gravar(join(RAIZ, 'env', 'atlas_sala_cinza_n.png'), codificarPng(nrm));
  gravar(join(RAIZ, 'env', 'atlas_sala_cinza.meta.json'), JSON.stringify({ tile: 32, colunas: 4, tiles: TILES.map((t) => t.nome) }, null, 2) + '\n');
}

// ---------- Sombra de contato (blob) ----------
{
  const s = novaImagem(32, 16);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 32; x++) { const d = Math.hypot((x - 15.5) / 16, (y - 7.5) / 8); pintar(s, x, y, [0, 0, 0, d < 1 ? Math.round(150 * (1 - d * d)) : 0]); }
  gravar(join(RAIZ, 'fx', 'fx_sombra_contato.png'), codificarPng(s));
}

// ---------- SFX de teste (canal de áudio): 0,15 s, mono, 24 kHz ----------
{
  const taxa = 24000, n = Math.round(taxa * 0.15), a = new Float32Array(n);
  for (let i = 0; i < n; i++) { const t = i / taxa; a[i] = Math.exp(-t * 18) * 0.5 * Math.sin(2 * Math.PI * (660 + 440 * t) * t); }
  gravar(join(RAIZ, 'audio', 'sfx_teste_ping.wav'), codificarWav([a], taxa));
}
console.log('placeholders gerados em', RAIZ);
