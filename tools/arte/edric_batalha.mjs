// Poses de batalha do Edric (BL-007): 1 direção (L, voltado para a direita; o motor espelha para o grupo olhar à esquerda), 2–6 quadros por pose.
// Lista e fps vêm de docs/combate_turnos.md §10.2. Saída: assets/sprites/hero_edric/hero_edric_batalha.png + .meta.json e a prévia ampliada.
// Uso: node tools/arte/edric_batalha.mjs [--previa] [--saida=<raiz>]
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { codificarPng, novaImagem } from '../lib/png.mjs';
import { quadroPose, CELULA, ANCORA } from './edric.mjs';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..'), COLUNAS = 8, rad = Math.PI / 180;
const G = { lean: 2.5, dz: 1.2, pe: [[-4.5, 0], [6.5, 0]], maoD: [8.5, 7.6, 28], maoE: [4.5, -7.6, 26], theta: 30 };   // guarda de combate
const mk = (o) => ({ ...G, ...o });

const poses = [
  { id: 'bat_parado', fps: 6, loop: true, quadros: [0, 1, 2, 3].map((i) => { const b = [0, 0.6, 1.1, 0.6][i]; return mk({ dz: 1.6 - 0.5 * b, theta: 28 + 4 * b, maoD: [8.5, 7.6, 28 + 0.5 * b], maoE: [4.5, -7.6, 26 + 0.4 * b] }); }) },
  { id: 'bat_avanca', fps: 10, loop: true, eventos: [{ quadro: 0, tipo: 'passo' }, { quadro: 3, tipo: 'passo' }], quadros: [0, 1, 2, 3, 4, 5].map((i) => { const ph = i / 6 * Math.PI * 2, s = Math.sin(ph), c = Math.cos(ph); return mk({ lean: 6, dz: 1.5 + 0.5 * Math.abs(c), pe: [[2 - 7 * s, Math.max(0, -c) * 4], [2 + 7 * s, Math.max(0, c) * 4]], maoD: [4, 7.6, 25], theta: -10, maoE: [2 - 3 * s, -7.6, 25] }); }) },
  { id: 'bat_ataque', fps: 12, loop: false, eventos: [{ quadro: 3, tipo: 'impacto' }], quadros: [
    mk({ lean: -1, dz: 2.5, theta: 140, maoD: [-1, 7.6, 36], pe: [[-5, 0], [4, 0]] }),
    mk({ lean: 0, dz: 2, theta: 125, maoD: [-3, 7.6, 38] }),
    mk({ lean: 4, dz: 2.5, theta: 40, maoD: [6, 7.6, 36], pe: [[-5, 0], [7, 0]] }),
    mk({ lean: 7, dz: 3.5, theta: -10, maoD: [10, 7.6, 28], maoE: [2, -7.6, 24], pe: [[-5, 0], [9, 0]], shift: [-6, 0], hdx: 0 }),
    mk({ lean: 4, dz: 3, theta: -50, maoD: [8, 7.6, 22], pe: [[-5, 0], [8, 0]] })] },
  { id: 'bat_habilidade', fps: 10, loop: false, eventos: [{ quadro: 4, tipo: 'solta_efeito' }], quadros: [
    mk({ lean: -2, dz: 5, theta: 200, maoD: [-3, 7.6, 24], maoE: [-4, -6, 24], pe: [[-5, 0], [4, 0]] }),
    mk({ lean: -1, dz: 3, theta: 150, maoD: [-2, 7.6, 36], maoE: [-3, -6, 34] }),
    mk({ lean: 0, dz: 1, theta: 115, maoD: [-2, 7.6, 44], maoE: [-3, -6, 42] }),
    mk({ lean: 3, dz: 2.5, theta: 55, maoD: [6, 7.6, 38], maoE: [5, -6, 36], pe: [[-5, 0], [7, 0]] }),
    mk({ lean: 8, dz: 5, theta: -30, maoD: [11, 7.6, 26], maoE: [10, -6, 25], pe: [[-5, 0], [10, 0]], shift: [-6, 0] }),
    mk({ lean: 4, dz: 4, theta: -40, maoD: [9, 7.6, 23], maoE: [8, -6, 22], pe: [[-5, 0], [9, 0]] })] },
  { id: 'bat_item', fps: 8, loop: false, eventos: [{ quadro: 3, tipo: 'usa' }], quadros: [
    mk({ theta: -60, maoD: [3, 7.6, 19], maoE: [1, -6.2, 21] }),
    mk({ theta: -60, maoD: [3, 7.6, 19], maoE: [1.5, -6.5, 21], frasco: true }),
    mk({ theta: -60, maoD: [3, 7.6, 19], maoE: [4, -5, 30], frasco: true }),
    mk({ theta: -60, maoD: [3, 7.6, 19], maoE: [6, -3.5, 38], frasco: true, lean: 1.5 })] },
  { id: 'bat_defender', fps: 8, loop: false, manter_ultimo: true, quadros: [
    mk({ lean: 1.5, dz: 3, theta: 60, maoD: [6, 7.6, 33], maoE: [5.5, -6, 30], pe: [[-5, 0], [6, 0]] }),
    mk({ lean: 3.5, dz: 4, theta: 70, maoD: [7, 7.6, 35], maoE: [6, -6, 31], pe: [[-5.5, 0], [6.5, 0]] })] },
  { id: 'bat_dano', fps: 8, loop: false, quadros: [
    mk({ lean: -7, dz: 0.5, theta: -80, maoD: [1, 8, 24], maoE: [-3, -8, 27], pe: [[-6, 0], [2, 0]], hdx: -1, hdy: -1 }),
    mk({ lean: -3, dz: 2, theta: -70, maoD: [3, 8, 24], maoE: [0, -8, 26], pe: [[-5, 0], [4, 0]] })] },
  { id: 'bat_caido', fps: 1, loop: false, quadros: [mk({ lean: 0, dz: 0, rot: 90 * rad, shift: [26, 5], giros: 1, theta: -70, maoD: [3, 9, 22], maoE: [3, -9, 22], pe: [[-3, 0], [3, 0]] })] },
  { id: 'bat_levanta', fps: 8, loop: false, quadros: [0.7, 0.4, 0.08].map((s, i) => mk({ lean: 0, dz: [0, 3, 4][i], rot: s * 90 * rad, shift: [26 * s, 5 * s], giros: s > 0.5 ? 1 : 0, theta: -40, maoD: [4, 8, 24], maoE: [3, -8, 24] })) },
  { id: 'bat_vitoria', fps: 6, loop: true, quadros: [0, 1, 2, 3].map((i) => { const dzs = [2, 0.5, -0.5, 0.5][i], salto = i === 2 ? 2 : 0; return mk({ lean: 0, dz: dzs, theta: 80, maoD: [7, 7.6, 46], maoE: [1, -8, 22], pe: [[-3, salto], [4, salto]] }); }) },
];

export function gerarBatalha() {
  const frames = [], meta = { id: 'hero_edric', tipo: 'sprite_batalha', celula: [CELULA, CELULA], ancora: ANCORA, arte_escala: 1, colunas: COLUNAS, direcao: 'l', voltado_para: 'direita',
    nota: 'Uma só direção (L, voltado para a direita); o motor espelha para o grupo (que olha à esquerda). Pose = quadros curtos; sem normal map.', poses: {} };
  for (const p of poses) {
    meta.poses[p.id] = { quadros: p.quadros.length, fps: p.fps, loop: p.loop, inicio: frames.length, ...(p.manter_ultimo ? { manter_ultimo: true } : {}), ...(p.eventos ? { eventos: p.eventos } : {}) };
    for (const q of p.quadros) frames.push(quadroPose(q));
  }
  const linhas = Math.ceil(frames.length / COLUNAS), img = novaImagem(COLUNAS * CELULA, linhas * CELULA);
  frames.forEach((f, k) => { const col = k % COLUNAS, lin = Math.floor(k / COLUNAS); for (let y = 0; y < CELULA; y++) for (let x = 0; x < CELULA; x++) { const s = (y * CELULA + x) * 4; img.px.set(f.subarray(s, s + 4), ((lin * CELULA + y) * img.w + col * CELULA + x) * 4); } });
  return { img, meta, frames };
}

// ---------- prévia ×3: uma linha por pose (numerada na ordem da lista), quadros lado a lado ----------
const DIG = ['111101101101111', '010110010010111', '111001111100111', '111001111001111', '101101111001001', '111100111001111', '111100111101111', '111001001001001', '111101111101111', '111101111001111'];
function pixel(img, x, y, c) { if (x < 0 || y < 0 || x >= img.w || y >= img.h) return; const i = (y * img.w + x) * 4; img.px[i] = c[0]; img.px[i + 1] = c[1]; img.px[i + 2] = c[2]; img.px[i + 3] = 255; }
function numero(img, n, x0, y0, esc) { let x = x0; for (const ch of String(n)) { const g = DIG[+ch]; for (let k = 0; k < 15; k++) if (g[k] === '1') for (let a = 0; a < esc; a++) for (let b = 0; b < esc; b++) pixel(img, x + (k % 3) * esc + a, y0 + Math.floor(k / 3) * esc + b, [235, 240, 225]); x += 4 * esc; } }
export function gerarPreviaBatalha({ frames, meta }) {
  const E = 3, margem = 16, maxq = Math.max(...Object.values(meta.poses).map((p) => p.quadros)), larg = 56, W = larg + maxq * (CELULA * E + margem), linha = CELULA * E + 12, nP = Object.keys(meta.poses).length, H = nP * linha + 20;
  const img = novaImagem(W, H); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) pixel(img, x, y, [86, 98, 84]);
  Object.values(meta.poses).forEach((p, r) => {
    numero(img, r + 1, 10, r * linha + 20, 5);
    for (let q = 0; q < p.quadros; q++) {
      const ox = larg + q * (CELULA * E + margem), oy = r * linha + 6, f = frames[p.inicio + q];
      for (let y = -5 * E; y <= 5 * E; y++) for (let x = -24 * E; x <= 24 * E; x++) if ((x / (24 * E)) ** 2 + (y / (5 * E)) ** 2 <= 1) pixel(img, ox + ANCORA[0] * E + x, oy + ANCORA[1] * E + y, [74, 86, 72]);
      for (let y = 0; y < CELULA; y++) for (let x = 0; x < CELULA; x++) { const s = (y * CELULA + x) * 4; if (!f[s + 3]) continue; for (let a = 0; a < E; a++) for (let b = 0; b < E; b++) pixel(img, ox + x * E + a, oy + y * E + b, [f[s], f[s + 1], f[s + 2]]); }
    }
  });
  return img;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const arg = (n) => (process.argv.find((a) => a.startsWith(`--${n}=`)) ?? '').split('=')[1], raiz = arg('saida') || RAIZ, r = gerarBatalha();
  const dir = join(raiz, 'assets/sprites/hero_edric'); mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'hero_edric_batalha.png'), codificarPng(r.img)); writeFileSync(join(dir, 'hero_edric_batalha.meta.json'), JSON.stringify(r.meta, null, 2) + '\n');
  console.log(`hero_edric_batalha: ${r.img.w}×${r.img.h}, ${r.frames.length} quadros, ${Object.keys(r.meta.poses).length} poses`);
  // validação: alpha, tamanho, borda da célula, cores ≤ 40
  const erros = [], cores = new Set();
  r.frames.forEach((f, k) => { let minX = 99, maxX = -1, minY = 99, maxY = -1; for (let y = 0; y < CELULA; y++) for (let x = 0; x < CELULA; x++) { const i = (y * CELULA + x) * 4, a = f[i + 3]; if (a !== 0 && a !== 255) erros.push(`quadro ${k}: alpha ${a}`); if (a) { cores.add((f[i] << 16) | (f[i + 1] << 8) | f[i + 2]); minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); } } if (minX < 1 || minY < 1 || maxX > CELULA - 2 || maxY > CELULA - 2) erros.push(`quadro ${k}: encosta na borda (${minX},${minY})-(${maxX},${maxY})`); });
  if (cores.size > 40) erros.push(`${cores.size} cores`); console.log(`${cores.size} cores`);
  if (process.argv.includes('--previa')) { const d2 = join(raiz, 'docs/arte/sprites'); mkdirSync(d2, { recursive: true }); const p = gerarPreviaBatalha(r); writeFileSync(join(d2, 'previa_edric_batalha.png'), codificarPng(p)); console.log(`prévia: docs/arte/sprites/previa_edric_batalha.png (${p.w}×${p.h})`); }
  if (erros.length) { console.error('✗ ' + [...new Set(erros)].slice(0, 12).join('\n✗ ')); process.exit(1); }
}
