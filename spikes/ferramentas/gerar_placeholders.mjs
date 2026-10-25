// Gera os placeholders dos spikes (BRF-001): sprites + normal map + máscara de brilho,
// atlas de cenário, partículas e áudio. Sem dependências: PNG com zlib nativo, WAV à mão,
// compressão de áudio pelo ffmpeg do sistema (se existir).
// Uso: node ferramentas/gerar_placeholders.mjs
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets');

// ---------- PNG ----------
const TAB_CRC = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = TAB_CRC[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function bloco(tipo, dados) {
  const t = Buffer.from(tipo, 'ascii');
  const len = Buffer.alloc(4); len.writeUInt32BE(dados.length);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, dados])));
  return Buffer.concat([len, t, dados, crc]);
}
function salvarPng(caminho, img) {
  const { w, h, px } = img;
  const cru = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    cru[y * (w * 4 + 1)] = 0;
    px.copy ? px.copy(cru, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4)
      : cru.set(px.subarray(y * w * 4, (y + 1) * w * 4), y * (w * 4 + 1) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; // RGBA 8 bits
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    bloco('IHDR', ihdr), bloco('IDAT', deflateSync(cru, { level: 9 })), bloco('IEND', Buffer.alloc(0)),
  ]);
  mkdirSync(dirname(caminho), { recursive: true });
  writeFileSync(caminho, png);
}
const novaImg = (w, h) => ({ w, h, px: new Uint8Array(w * h * 4) });
function pintar(img, x, y, [r, g, b, a = 255]) {
  if (x < 0 || y < 0 || x >= img.w || y >= img.h) return;
  const i = (y * img.w + x) * 4;
  img.px[i] = r; img.px[i + 1] = g; img.px[i + 2] = b; img.px[i + 3] = a;
}

// Ruído determinístico (sem Math.random: placeholders reproduzíveis)
function rng(semente) {
  let s = semente >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

// ---------- Personagem chibi (célula 64×64, âncora 32,60) ----------
// Cada parte: elipse com altura em domo -> albedo + mapa de altura -> normal map.
const DIRS = ['s', 'n', 'l'];
const QUADROS = 8;

function desenharPersonagem(paleta, forma, semente) {
  const W = 64 * QUADROS, H = 64 * DIRS.length;
  const alb = novaImg(W, H), brilho = novaImg(W, H);
  const altura = new Float32Array(W * H);
  const r = rng(semente);
  DIRS.forEach((dir, linha) => {
    for (let q = 0; q < QUADROS; q++) {
      const ox = q * 64, oy = linha * 64;
      const fase = Math.sin((q / QUADROS) * Math.PI * 2);
      const bob = Math.round(Math.abs(fase) * 1);
      const partes = [];
      // pernas (alternam)
      const passo = Math.round(fase * 3);
      partes.push({ cx: 27 + (dir === 'l' ? passo : 0), cy: 55 - (dir !== 'l' ? Math.max(0, passo) : 0), rx: 3.5, ry: 5.5, cor: paleta.calca });
      partes.push({ cx: 37 - (dir === 'l' ? passo : 0), cy: 55 - (dir !== 'l' ? Math.max(0, -passo) : 0), rx: 3.5, ry: 5.5, cor: paleta.calca });
      // corpo
      partes.push({ cx: 32, cy: 43 - bob, rx: forma.corpoRx, ry: 8, cor: paleta.roupa });
      // braços
      partes.push({ cx: 32 - forma.corpoRx - 1, cy: 43 - bob - passo * 0.5, rx: 2.5, ry: 5, cor: paleta.pele });
      partes.push({ cx: 32 + forma.corpoRx + 1, cy: 43 - bob + passo * 0.5, rx: 2.5, ry: 5, cor: paleta.pele });
      // cabeça grande
      partes.push({ cx: 32 + (dir === 'l' ? 2 : 0), cy: 23 - bob, rx: forma.cabecaR, ry: forma.cabecaR - 0.5, cor: dir === 'n' ? paleta.cabelo : paleta.pele });
      // cabelo / topo
      partes.push({ cx: 32 + (dir === 'l' ? 0 : 0), cy: 15 - bob, rx: forma.cabecaR - 1, ry: 5, cor: paleta.cabelo });
      for (const p of partes) {
        for (let y = Math.floor(p.cy - p.ry); y <= Math.ceil(p.cy + p.ry); y++) {
          for (let x = Math.floor(p.cx - p.rx); x <= Math.ceil(p.cx + p.rx); x++) {
            const dx = (x + 0.5 - p.cx) / p.rx, dy = (y + 0.5 - p.cy) / p.ry;
            const d2 = dx * dx + dy * dy;
            if (d2 > 1) continue;
            const hgt = Math.sqrt(1 - d2) * Math.min(p.rx, p.ry);
            const i = (oy + y) * W + ox + x;
            const base = altura[i];
            if (alb.px[i * 4 + 3] && hgt + 3 < base) continue; // parte de trás fica atrás
            altura[i] = Math.max(base, hgt + 3);
            const ruido = (r() - 0.5) * 10;
            pintar(alb, ox + x, oy + y, p.cor.map((c) => Math.max(0, Math.min(255, c + ruido))));
          }
        }
      }
      // olhos (só S e L) + máscara de brilho nos olhos
      if (dir !== 'n') {
        const olhos = dir === 's' ? [27, 37] : [38];
        for (const ex of olhos) for (let dy = 0; dy < 3; dy++) {
          pintar(alb, ox + ex, oy + 23 - bob + dy, paleta.olho);
          pintar(brilho, ox + ex, oy + 23 - bob + dy, forma.olhoBrilha ? [255, 255, 255, 255] : [0, 0, 0, 255]);
        }
      }
      // contorno escuro de 1 px
      const contorno = [];
      for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
        const i = ((oy + y) * W + ox + x) * 4;
        if (alb.px[i + 3]) continue;
        const viz = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => {
          const xx = x + a, yy = y + b;
          return xx >= 0 && yy >= 0 && xx < 64 && yy < 64 && alb.px[((oy + yy) * W + ox + xx) * 4 + 3];
        });
        if (viz) contorno.push([ox + x, oy + y]);
      }
      for (const [x, y] of contorno) { pintar(alb, x, y, paleta.contorno); altura[y * W + x] = 1; }
    }
  });
  // Normal map (convenção OpenGL: R = +X direita, G = +Y para cima, B = +Z para fora)
  const nrm = novaImg(W, H);
  const hA = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? 0 : altura[y * W + x]);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!alb.px[(y * W + x) * 4 + 3]) { pintar(nrm, x, y, [128, 128, 255, 0]); continue; }
    const dx = (hA(x + 1, y) - hA(x - 1, y)) * 0.5;
    const dy = (hA(x, y - 1) - hA(x, y + 1)) * 0.5; // imagem cresce para baixo; +Y é para cima
    let nx = -dx, ny = -dy, nz = 1.6;
    const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l;
    pintar(nrm, x, y, [Math.round((nx * 0.5 + 0.5) * 255), Math.round((ny * 0.5 + 0.5) * 255), Math.round((nz * 0.5 + 0.5) * 255), 255]);
  }
  for (let i = 3; i < brilho.px.length; i += 4) if (!brilho.px[i]) { brilho.px[i - 3] = brilho.px[i - 2] = brilho.px[i - 1] = 0; brilho.px[i] = 255; }
  return { alb, nrm, brilho };
}

const PERSONAGENS = [
  ['hero_placeholder', { pele: [236, 188, 150], roupa: [64, 110, 170], calca: [80, 60, 50], cabelo: [120, 70, 40], olho: [30, 30, 40], contorno: [28, 22, 30] }, { corpoRx: 7, cabecaR: 11, olhoBrilha: false }],
  ['enemy_placeholder_a', { pele: [120, 170, 90], roupa: [70, 110, 60], calca: [50, 70, 40], cabelo: [60, 90, 50], olho: [250, 230, 90], contorno: [20, 30, 20] }, { corpoRx: 9, cabecaR: 10, olhoBrilha: true }],
  ['enemy_placeholder_b', { pele: [170, 120, 200], roupa: [100, 60, 140], calca: [60, 40, 90], cabelo: [80, 40, 110], olho: [255, 120, 120], contorno: [30, 20, 40] }, { corpoRx: 6, cabecaR: 12, olhoBrilha: true }],
  ['enemy_placeholder_c', { pele: [200, 200, 210], roupa: [150, 150, 160], calca: [90, 90, 100], cabelo: [180, 180, 190], olho: [120, 220, 255], contorno: [30, 30, 40] }, { corpoRx: 8, cabecaR: 9, olhoBrilha: true }],
  ['enemy_placeholder_d', { pele: [210, 140, 80], roupa: [170, 90, 40], calca: [110, 60, 30], cabelo: [140, 70, 30], olho: [255, 250, 200], contorno: [40, 20, 10] }, { corpoRx: 10, cabecaR: 10, olhoBrilha: true }],
  ['enemy_placeholder_e', { pele: [90, 130, 160], roupa: [50, 80, 110], calca: [30, 50, 70], cabelo: [40, 60, 90], olho: [200, 255, 160], contorno: [15, 20, 30] }, { corpoRx: 7, cabecaR: 11, olhoBrilha: true }],
];
PERSONAGENS.forEach(([id, pal, forma], k) => {
  const { alb, nrm, brilho } = desenharPersonagem(pal, forma, 1000 + k);
  salvarPng(join(RAIZ, 'sprites', id, `${id}.png`), alb);
  salvarPng(join(RAIZ, 'sprites', id, `${id}_n.png`), nrm);
  salvarPng(join(RAIZ, 'sprites', id, `${id}_e.png`), brilho);
  writeFileSync(join(RAIZ, 'sprites', id, `${id}.meta.json`), JSON.stringify({
    id, celula: [64, 64], ancora: [32, 60], direcoes: DIRS, espelhar: { o: 'l' }, quadros: QUADROS, fps: 10,
    normal_map: 'opengl_y_cima', eventos: [{ quadro: 2, tipo: 'passo' }, { quadro: 6, tipo: 'passo' }],
  }, null, 2));
});

// ---------- Atlas de cenário (tiles 32×32, 16×16 tiles = 512×512) ----------
const TILES = [
  { nome: 'grama', base: [86, 140, 70], var: 26, relevo: 0.6 },
  { nome: 'pedra', base: [130, 125, 120], var: 18, relevo: 1.2, juntas: true },
  { nome: 'terra', base: [130, 98, 64], var: 22, relevo: 0.5 },
  { nome: 'madeira', base: [120, 80, 50], var: 16, relevo: 0.8, tabuas: true },
  { nome: 'telhado', base: [150, 60, 50], var: 14, relevo: 1.0, telhas: true },
  { nome: 'parede', base: [210, 196, 170], var: 10, relevo: 0.4 },
  { nome: 'agua', base: [60, 110, 160], var: 12, relevo: 0.3 },
  { nome: 'folhas', base: [50, 105, 55], var: 30, relevo: 1.0 },
];
function gerarAtlas() {
  const N = 512, alb = novaImg(N, N), nrm = novaImg(N, N);
  const alt = new Float32Array(N * N);
  const r = rng(77);
  for (let ty = 0; ty < 16; ty++) for (let tx = 0; tx < 16; tx++) {
    const t = TILES[(ty * 16 + tx) % TILES.length];
    const r2 = rng(ty * 31 + tx * 7 + 3);
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
      let h = r2() * t.relevo;
      if (t.juntas && (x % 16 === 0 || (y % 8 === 0))) h = -1;
      if (t.tabuas && x % 8 === 0) h = -1;
      if (t.telhas && y % 6 === 0) h = -0.8;
      // dithering 2×2 controlado: pixel art com poucas cores
      const q = Math.round((r() - 0.5) * 2) * (t.var / 2);
      const c = t.base.map((v) => Math.max(0, Math.min(255, v + q + h * 8)));
      pintar(alb, tx * 32 + x, ty * 32 + y, c);
      alt[(ty * 32 + y) * N + tx * 32 + x] = h;
    }
  }
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const a = (xx, yy) => alt[Math.min(N - 1, Math.max(0, yy)) * N + Math.min(N - 1, Math.max(0, xx))];
    let nx = -(a(x + 1, y) - a(x - 1, y)), ny = (a(x, y + 1) - a(x, y - 1)), nz = 2.5;
    const l = Math.hypot(nx, ny, nz);
    pintar(nrm, x, y, [(nx / l * 0.5 + 0.5) * 255, (-ny / l * 0.5 + 0.5) * 255, (nz / l * 0.5 + 0.5) * 255, 255].map(Math.round));
  }
  salvarPng(join(RAIZ, 'env', 'atlas_placeholder.png'), alb);
  salvarPng(join(RAIZ, 'env', 'atlas_placeholder_n.png'), nrm);
  writeFileSync(join(RAIZ, 'env', 'atlas_placeholder.meta.json'), JSON.stringify({ tile: 32, colunas: 16, tiles: TILES.map((t) => t.nome) }, null, 2));
}
gerarAtlas();

// ---------- Partícula, sombra de contato ----------
{
  const p = novaImg(8, 8);
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
    const d = Math.hypot(x - 3.5, y - 3.5);
    pintar(p, x, y, d < 2 ? [255, 240, 200, 255] : d < 3.5 ? [255, 180, 90, 255] : [0, 0, 0, 0]);
  }
  salvarPng(join(RAIZ, 'fx', 'fx_placeholder_brasa.png'), p);
  const s = novaImg(32, 16);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 32; x++) {
    const d = Math.hypot((x - 15.5) / 16, (y - 7.5) / 8);
    pintar(s, x, y, [0, 0, 0, d < 1 ? Math.round(150 * (1 - d * d)) : 0]);
  }
  salvarPng(join(RAIZ, 'fx', 'fx_sombra_contato.png'), s);
}

// ---------- Áudio ----------
const TAXA = 48000;
function salvarWav(caminho, canais) {
  const n = canais[0].length, nc = canais.length;
  const buf = Buffer.alloc(44 + n * nc * 2);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * nc * 2, 4); buf.write('WAVEfmt ', 8);
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(nc, 22);
  buf.writeUInt32LE(TAXA, 24); buf.writeUInt32LE(TAXA * nc * 2, 28); buf.writeUInt16LE(nc * 2, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(n * nc * 2, 40);
  for (let i = 0; i < n; i++) for (let c = 0; c < nc; c++) {
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, canais[c][i])) * 32767), 44 + (i * nc + c) * 2);
  }
  mkdirSync(dirname(caminho), { recursive: true });
  writeFileSync(caminho, buf);
}
// Loop de teste: 2 s exatos (96000 amostras), 440 Hz = 880 ciclos inteiros -> emenda perfeita no original.
function loopTeste() {
  const n = TAXA * 2, a = new Float32Array(n);
  for (let i = 0; i < n; i++) a[i] = 0.5 * Math.sin((2 * Math.PI * 440 * i) / TAXA);
  return [a, a];
}
// "Música" em duas camadas de 16 compassos (32 s a 120 bpm), mesma base harmônica.
function camadas() {
  const n = TAXA * 32, A = [new Float32Array(n), new Float32Array(n)], B = [new Float32Array(n), new Float32Array(n)];
  const notas = [220, 261.63, 329.63, 392, 349.23, 293.66, 246.94, 196];
  for (let i = 0; i < n; i++) {
    const t = i / TAXA, batida = Math.floor(t * 2), f = notas[batida % notas.length];
    const env = Math.exp(-((t * 2) % 1) * 3);
    const base = 0.25 * Math.sin(2 * Math.PI * 110 * t) + 0.18 * env * Math.sin(2 * Math.PI * f * t);
    const extra = 0.12 * env * Math.sign(Math.sin(2 * Math.PI * f * 2 * t)) * 0.5 + 0.08 * Math.sin(2 * Math.PI * 55 * t);
    A[0][i] = base; A[1][i] = base * 0.95;
    B[0][i] = base + extra; B[1][i] = (base + extra) * 0.95;
  }
  return { A, B };
}
function sfx(k) {
  const dur = 0.15 + (k % 4) * 0.1, n = Math.round(TAXA * dur), a = new Float32Array(n);
  const r = rng(500 + k);
  for (let i = 0; i < n; i++) {
    const t = i / TAXA, env = Math.exp(-t * (8 + k));
    a[i] = env * (0.5 * Math.sin(2 * Math.PI * (200 + k * 60) * t * (1 - t)) + 0.3 * (r() * 2 - 1));
  }
  return [a];
}
const AUD = join(RAIZ, 'audio');
salvarWav(join(AUD, 'teste', 'loop_teste.wav'), loopTeste());
const { A, B } = camadas();
salvarWav(join(AUD, 'mus_placeholder_camada_a.wav'), A);
salvarWav(join(AUD, 'mus_placeholder_camada_b.wav'), B);
for (let k = 0; k < 20; k++) salvarWav(join(AUD, 'sfx', `sfx_placeholder_${String(k).padStart(2, '0')}.wav`), sfx(k));

// Compressão: Opus/Ogg (principal candidato), MP3 e AAC só para o teste de emenda de loop.
function ffmpeg(args) { execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...args]); }
let temFfmpeg = true;
try { execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' }); } catch { temFfmpeg = false; }
if (temFfmpeg) {
  const t = join(AUD, 'teste', 'loop_teste');
  ffmpeg(['-i', `${t}.wav`, '-c:a', 'libopus', '-b:a', '96k', `${t}.ogg`]);
  ffmpeg(['-i', `${t}.wav`, '-c:a', 'libopus', '-b:a', '96k', `${t}.webm`]);
  ffmpeg(['-i', `${t}.wav`, '-c:a', 'libmp3lame', '-b:a', '128k', `${t}.mp3`]);
  ffmpeg(['-i', `${t}.wav`, '-c:a', 'aac', '-b:a', '128k', `${t}.m4a`]);
  for (const c of ['a', 'b']) {
    const f = join(AUD, `mus_placeholder_camada_${c}`);
    ffmpeg(['-i', `${f}.wav`, '-c:a', 'libopus', '-b:a', '96k', `${f}.ogg`]);
  }
  for (let k = 0; k < 20; k++) {
    const f = join(AUD, 'sfx', `sfx_placeholder_${String(k).padStart(2, '0')}`);
    ffmpeg(['-i', `${f}.wav`, '-c:a', 'libopus', '-b:a', '64k', `${f}.ogg`]);
  }
} else {
  console.warn('ffmpeg não encontrado: áudio só em WAV (teste de formatos comprimidos fica sem dados).');
}
console.log('placeholders gerados em', RAIZ, existsSync(join(AUD, 'teste', 'loop_teste.ogg')) ? '(com áudio comprimido)' : '');
