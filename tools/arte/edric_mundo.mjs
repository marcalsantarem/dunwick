// Edric DE MUNDO (mapa-múndi, v0.1.3 / D-045): boneco minúsculo (~20 px numa célula 32×32), pixel a pixel por regras simples + sombreado em 4 tons e contorno.
// Mesmo visual-assinatura do Edric (cabelo castanho, gibão verde-musgo, calça terra, botas, espada nas costas), sem rosto detalhado.
// 5 direções desenhadas (s, se, l, ne, n) com os mesmos ids do hero_edric, para o motor usar o mesmo mapeamento de 8 direções (o. e sw/nw por espelho).
// Animações: idle (2q), andar (4q), correr (4q, mais rápido e inclinado). Âncora nos pés (16,29). Cores só das rampas da paleta (RAMPAS do edric.mjs).
// Uso: node tools/arte/edric_mundo.mjs [--previa] [--saida=<raiz>]
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { codificarPng, novaImagem } from '../lib/png.mjs';
import { RAMPAS } from './edric.mjs';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const CEL = 32, ANC = [16, 29], COLUNAS = 8;
const DIRS = ['s', 'se', 'l', 'ne', 'n'];
const ANIMS = { idle: { quadros: 2, fps: 3, loop: true }, andar: { quadros: 4, fps: 8, loop: true, eventos: [{ quadro: 0, tipo: 'passo' }, { quadro: 2, tipo: 'passo' }] }, correr: { quadros: 4, fps: 12, loop: true, eventos: [{ quadro: 0, tipo: 'passo' }, { quadro: 2, tipo: 'passo' }] } };
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

/** Grade de materiais: g[y][x] = [material, tom fixo | null]. */
function nova() { return Array.from({ length: CEL }, () => Array(CEL).fill(null)); }
const poe = (g, x, y, m, t = null) => { if (x >= 0 && y >= 0 && x < CEL && y < CEL) g[y][x] = [m, t]; };
const ret = (g, x0, y0, x1, y1, m, t) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) poe(g, x, y, m, t); };

/** Desenha um quadro. Parâmetros: dir, bob (corpo desce 1 px), passo (−1..1: fase da perna), erg (pé levantado: 0 | 1), corre. */
function desenhar(dir, { bob = 0, fase = 0, corre = false, parado = false }) {
  const g = nova(), y0 = bob, inc = corre ? 1 : 0;      // inc: tronco/cabeça avançam 1 px ao correr (só de perfil)
  const lado = dir === 'l', frente = dir === 's' || dir === 'se', costas = dir === 'n' || dir === 'ne', diag = dir === 'se' || dir === 'ne';
  const cx = 16, ox = diag ? 1 : 0;
  const pe = parado ? [0, 0] : [Math.round(Math.sin(fase * Math.PI * 2) * (corre ? 2 : 1.4)), Math.round(-Math.sin(fase * Math.PI * 2) * (corre ? 2 : 1.4))];
  const lev = parado ? [0, 0] : [Math.max(0, Math.round(Math.cos(fase * Math.PI * 2) * (corre ? 2 : 1))), Math.max(0, Math.round(-Math.cos(fase * Math.PI * 2) * (corre ? 2 : 1)))];
  // ---------- pernas e botas ----------
  const perna = (x, i, dx = 0) => { const lv = lev[i]; ret(g, x + dx, 25 - lv, x + dx + 1, 27 - lv, 'calca'); ret(g, x + dx, 28 - lv, x + dx + 1, 29 - lv, 'couro'); };
  if (lado) { perna(cx - 1, 0, pe[0]); perna(cx - 1, 1, pe[1]); }
  else { perna(cx - 3 + ox, 0); perna(cx + 1 + ox, 1); if (!parado) { /* passo: uma perna sobe 1 px */ } }
  // ---------- tronco ----------
  const ty = 19 + y0;
  if (lado) {
    ret(g, cx - 3 + inc, ty, cx + 1 + inc, ty + 5, 'musgo'); ret(g, cx - 3 + inc, ty + 4, cx + 1 + inc, ty + 4, 'couro');                                    // gibão e cinto
    const sw = parado ? 0 : Math.round(Math.sin(fase * Math.PI * 2) * (corre ? 2 : 1.5));                                                                      // braço balança
    ret(g, cx - 1 + inc + sw, ty + 1, cx + inc + sw, ty + 4, 'linho'); poe(g, cx - 1 + inc + sw, ty + 5, 'pele'); poe(g, cx + inc + sw, ty + 5, 'pele');
    poe(g, cx - 4 + inc, ty - 1, 'aco'); poe(g, cx - 5 + inc, ty, 'aco'); poe(g, cx - 5 + inc, ty + 1, 'couro');                                                // espada nas costas
  } else if (frente) {
    ret(g, cx - 3 + ox, ty, cx + 2 + ox, ty + 5, 'musgo'); ret(g, cx - 3 + ox, ty + 4, cx + 2 + ox, ty + 4, 'couro'); poe(g, cx + ox, ty + 4, 'latao');
    const sw = parado ? 0 : Math.round(Math.sin(fase * Math.PI * 2) * 1.2);
    ret(g, cx - 5 + ox, ty + 1 + sw, cx - 4 + ox, ty + 4 + sw, 'linho'); poe(g, cx - 5 + ox, ty + 5 + sw, 'pele'); poe(g, cx - 4 + ox, ty + 5 + sw, 'pele');
    ret(g, cx + 3 + ox, ty + 1 - sw, cx + 4 + ox, ty + 4 - sw, 'linho'); poe(g, cx + 3 + ox, ty + 5 - sw, 'pele'); poe(g, cx + 4 + ox, ty + 5 - sw, 'pele');
    poe(g, cx + 3 + ox, ty - 2, 'aco'); poe(g, cx + 3 + ox, ty - 1, 'latao');                                                                                   // cabo da espada sobre o ombro
  } else {
    ret(g, cx - 3 + ox, ty, cx + 2 + ox, ty + 5, 'musgo'); ret(g, cx - 3 + ox, ty + 4, cx + 2 + ox, ty + 4, 'couro');
    for (let k = 0; k < 6; k++) poe(g, cx - 3 + ox + k, ty + 1 + Math.floor(k * 0.8), 'aco');                                                                   // espada cruzada nas costas
    poe(g, cx - 4 + ox, ty, 'couro');
    const sw = parado ? 0 : Math.round(Math.sin(fase * Math.PI * 2) * 1.2);
    ret(g, cx - 5 + ox, ty + 1 - sw, cx - 4 + ox, ty + 4 - sw, 'linho'); poe(g, cx - 5 + ox, ty + 5 - sw, 'pele'); poe(g, cx - 4 + ox, ty + 5 - sw, 'pele');
    ret(g, cx + 3 + ox, ty + 1 + sw, cx + 4 + ox, ty + 4 + sw, 'linho'); poe(g, cx + 3 + ox, ty + 5 + sw, 'pele'); poe(g, cx + 4 + ox, ty + 5 + sw, 'pele');
  }
  // ---------- cabeça (grande: ~8×8) ----------
  const hy = 11 + y0;
  if (lado) {
    const hx = cx - 3 + inc; ret(g, hx, hy, hx + 7, hy + 7, 'pele'); ret(g, hx, hy, hx + 7, hy + 2, 'couro'); ret(g, hx, hy + 3, hx + 2, hy + 6, 'couro'); poe(g, hx + 7, hy + 2, 'pele');
    poe(g, hx + 5, hy + 4, 'aco', 0); poe(g, hx + 8, hy + 5, 'pele'); poe(g, hx + 6, hy + 7, 'pele', 1);
  } else if (frente) {
    const hx = cx - 4 + ox; ret(g, hx, hy, hx + 7, hy + 7, 'pele'); ret(g, hx, hy, hx + 7, hy + 2, 'couro'); poe(g, hx, hy + 3, 'couro'); poe(g, hx + 7, hy + 3, 'couro'); poe(g, hx + 1, hy + 3, 'couro'); poe(g, hx + 6, hy + 3, 'couro');
    poe(g, hx + (diag ? 3 : 2), hy + 4, 'aco', 0); poe(g, hx + (diag ? 6 : 5), hy + 4, 'aco', 0); poe(g, hx + 3 + (diag ? 1 : 0), hy + 6, 'pele', 1);
  } else {
    const hx = cx - 4 + ox; ret(g, hx, hy, hx + 7, hy + 7, 'couro'); ret(g, hx + 1, hy + 7, hx + 6, hy + 7, 'pele'); if (diag) { poe(g, hx + 7, hy + 4, 'pele'); poe(g, hx + 7, hy + 5, 'pele'); }
  }
  return g;
}

/** Sombreamento (luz à esquerda), luz de borda e contorno seletivo → RGBA 32×32. */
function acabar(g) {
  const img = novaImagem(CEL, CEL), cel = (x, y) => (x < 0 || y < 0 || x >= CEL || y >= CEL ? null : g[y][x]);
  for (let y = 0; y < CEL; y++) for (let x = 0; x < CEL; x++) {
    const c = g[y][x]; if (!c) continue;
    const [m, fixo] = c, L = cel(x - 1, y), R = cel(x + 1, y), U = cel(x, y - 1);
    let t = 2;
    if (!L || L[0] !== m) t = 3; else if (!R || R[0] !== m) t = 1;
    if (U && U[0] !== m && m !== 'pele') t = Math.min(t, 2);
    if (fixo != null) t = fixo;
    const cor = rgb(RAMPAS[m][t]), i = (y * CEL + x) * 4; img.px.set([...cor, 255], i);
  }
  for (let y = 0; y < CEL; y++) for (let x = 0; x < CEL; x++) {
    if (g[y][x]) continue;
    const viz = [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]].map(([a, b]) => cel(a, b)).filter(Boolean); if (!viz.length) continue;
    const m = viz[0][0], i = (y * CEL + x) * 4, t = y >= 1 && cel(x, y + 1) ? 0 : 0;
    img.px.set([...rgb(RAMPAS[m === 'pele' ? 'pele' : m][t]), 255], i);
  }
  return img;
}

function blit(dst, src, ox, oy) { for (let y = 0; y < CEL; y++) for (let x = 0; x < CEL; x++) { const s = (y * CEL + x) * 4; if (src.px[s + 3]) dst.px.set(src.px.subarray(s, s + 4), ((oy + y) * dst.w + ox + x) * 4); } }

export function gerarMundo() {
  const quadros = [], anims = {};
  for (const [nome, a] of Object.entries(ANIMS)) {
    anims[nome] = { ...a, inicio: quadros.length };
    for (const d of DIRS) for (let f = 0; f < a.quadros; f++) {
      const p = nome === 'idle' ? { parado: true, bob: f } : { fase: f / a.quadros, corre: nome === 'correr', bob: f % 2 === 1 ? 1 : 0 };
      quadros.push(acabar(desenhar(d, p)));
    }
  }
  const lin = Math.ceil(quadros.length / COLUNAS), img = novaImagem(COLUNAS * CEL, lin * CEL);
  quadros.forEach((q, k) => blit(img, q, (k % COLUNAS) * CEL, Math.floor(k / COLUNAS) * CEL));
  const meta = { id: 'hero_edric_mundo', tipo: 'sprite_humanoide', celula: [CEL, CEL], ancora: ANC, arte_escala: 1, ref_celula: CEL, direcoes: DIRS, espelhar: { sw: 'se', o: 'l', nw: 'ne' }, colunas: COLUNAS, anims,
    nota: 'Edric de mundo (D-045): minúsculo (~20 px de altura numa célula 32×32), sem poses de batalha. Mesmo esquema do hero_edric: quadro = inicio + dir*quadros + q; 5 direções, o motor espelha as demais. Sem normal map.' };
  return { img, meta, quadros };
}

export function validar({ quadros }) {
  const erros = [], cores = new Set();
  quadros.forEach((q, k) => { let a0 = 99, a1 = -1, b0 = 99, b1 = -1; for (let y = 0; y < CEL; y++) for (let x = 0; x < CEL; x++) { const i = (y * CEL + x) * 4, al = q.px[i + 3]; if (al !== 0 && al !== 255) erros.push(`quadro ${k}: alpha ${al}`); if (al) { cores.add((q.px[i] << 16) | (q.px[i + 1] << 8) | q.px[i + 2]); a0 = Math.min(a0, x); a1 = Math.max(a1, x); b0 = Math.min(b0, y); b1 = Math.max(b1, y); } } if (a0 < 1 || b0 < 1 || a1 > CEL - 2 || b1 > CEL - 2) erros.push(`quadro ${k}: encosta na borda`); if (b1 > ANC[1] + 1) erros.push(`quadro ${k}: passa dos pés (y ${b1})`); });
  if (cores.size > 32) erros.push(`${cores.size} cores (máx. 32)`);
  return { erros, cores: cores.size };
}

function previa(r, E = 6) {
  const nomes = Object.keys(r.meta.anims), cols = 8 + 1, W = (cols * 5 + 2) * 0 + 0; void W;
  const lin = nomes.length * DIRS.length, w = 10 * (CEL * E + 6) + 6, h = lin * (CEL * E + 6) + 6, img = novaImagem(w, h);
  for (let i = 0; i < w * h; i++) img.px.set([86, 98, 84, 255], i * 4);
  let r0 = 0;
  for (const nome of nomes) { const a = r.meta.anims[nome]; for (let d = 0; d < DIRS.length; d++, r0++) for (let f = 0; f < a.quadros; f++) {
    const q = r.quadros[a.inicio + d * a.quadros + f], ox = 6 + f * (CEL * E + 6), oy = 6 + r0 * (CEL * E + 6);
    for (let y = -2 * E; y <= 2 * E; y++) for (let x = -7 * E; x <= 7 * E; x++) if ((x / (7 * E)) ** 2 + (y / (2 * E)) ** 2 <= 1) img.px.set([74, 86, 72, 255], ((oy + ANC[1] * E + y) * w + ox + ANC[0] * E + x) * 4);
    for (let y = 0; y < CEL; y++) for (let x = 0; x < CEL; x++) { const s = (y * CEL + x) * 4; if (!q.px[s + 3]) continue; for (let a2 = 0; a2 < E; a2++) for (let b = 0; b < E; b++) img.px.set(q.px.subarray(s, s + 4), ((oy + y * E + b) * w + ox + x * E + a2) * 4); }
  } }
  return img;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const raiz = (process.argv.find((a) => a.startsWith('--saida=')) ?? '').split('=')[1] || RAIZ, r = gerarMundo(), v = validar(r);
  const dir = join(raiz, 'assets/sprites/hero_edric_mundo'); mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'hero_edric_mundo.png'), codificarPng(r.img)); writeFileSync(join(dir, 'hero_edric_mundo.meta.json'), JSON.stringify(r.meta, null, 2) + '\n');
  console.log(`hero_edric_mundo: ${r.img.w}×${r.img.h}, ${r.quadros.length} quadros, ${v.cores} cores`);
  if (process.argv.includes('--previa')) { const d2 = join(raiz, 'docs/arte/sprites'); mkdirSync(d2, { recursive: true }); writeFileSync(join(d2, 'previa_hero_edric_mundo.png'), codificarPng(previa(r))); }
  if (v.erros.length) { console.error('✗ ' + [...new Set(v.erros)].slice(0, 10).join(' | ')); process.exit(1); }
}
