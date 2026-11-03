// NPCs da vila no mapa (v0.1.4 / D-049): mesma célula (32×32), âncora (16,29) e esquema do hero_edric_mundo; 1 atlas por NPC em assets/sprites/<id>/<id>.png + .meta.json.
// Cada NPC: 5 direções (s, se, l, ne, n; o motor espelha as demais e vira o NPC para o herói) × anims parado (1q), idle_a (respira, 2q) e idle_b (gesto, 3q).
// Reaproveita a grade de materiais, o sombreado em 4 tons e o contorno do edric_mundo.mjs. Cores só das rampas da paleta (RAMPAS).
// Uso: node tools/arte/npcs_mundo.mjs [--so=npc_maren] [--previa] [--saida=<raiz>]
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { codificarPng, novaImagem } from '../lib/png.mjs';
import { CEL, ANC, nova, poe, ret, acabar, blit } from './edric_mundo.mjs';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..'), COLUNAS = 8, DIRS = ['s', 'se', 'l', 'ne', 'n'];
const ANIMS = { parado: { quadros: 1, fps: 1, loop: true }, idle_a: { quadros: 2, fps: 2, loop: true }, idle_b: { quadros: 3, fps: 4, loop: true } };
// poses: bob = tronco e cabeça descem 1 px (respirar); gesto = 0..2 (colher baixa, erguida, balançando)
const POSES = { parado: [{}], idle_a: [{ bob: 0 }, { bob: 1 }], idle_b: [{ gesto: 1 }, { gesto: 2 }, { gesto: 1, bob: 1 }] };

/** Maren: idosa miúda (~26 px), xale verde-musgo, saia terra, cabelo grisalho preso em coque com agulha, cesta de ervas, lamparina, colher de pau. */
function maren(dir, { bob = 0, gesto = 0 }) {
  const g = nova(), cx = 16, lado = dir === 'l', costas = dir === 'n' || dir === 'ne', diag = dir === 'se' || dir === 'ne', ox = diag ? 1 : 0, b = bob;
  // pés e saia
  if (lado) { ret(g, cx - 2, 28, cx + 1, 29, 'couro'); ret(g, cx - 4, 22, cx + 3, 27, 'calca'); }
  else { ret(g, cx - 3 + ox, 28, cx - 2 + ox, 29, 'couro'); ret(g, cx + 1 + ox, 28, cx + 2 + ox, 29, 'couro'); ret(g, cx - 5 + ox, 22, cx + 4 + ox, 27, 'calca'); }
  // xale (tronco)
  if (lado) { ret(g, cx - 4, 15 + b, cx + 3, 23, 'musgo'); poe(g, cx - 5, 18 + b, 'musgo'); poe(g, cx - 5, 19 + b, 'musgo'); }
  else { ret(g, cx - 5 + ox, 15 + b, cx + 4 + ox, 23, 'musgo'); ret(g, cx - 4 + ox, 14 + b, cx + 3 + ox, 14 + b, 'musgo'); }
  if (!lado && !costas) { poe(g, cx - 1 + ox, 15 + b, 'linho'); poe(g, cx + ox, 15 + b, 'linho'); for (let y = 17; y <= 22; y++) poe(g, cx + ox, y + (y < 22 ? b : 0), 'musgo', 1); }
  // braços, cesta e colher
  const mao = (x, y) => poe(g, x, y, 'pele');
  if (lado) {
    ret(g, cx + 1, 17 + b, cx + 3, 20 + b, 'musgo'); mao(cx + 4, 21 + b);                                                                      // braço da frente segura a cesta
    ret(g, cx + 4, 22, cx + 8, 25, 'couro'); ret(g, cx + 4, 21, cx + 8, 21, 'verde'); poe(g, cx + 5, 20, 'verde'); poe(g, cx + 7, 20, 'verde');
    poe(g, cx - 5, 22, 'latao'); poe(g, cx - 5, 23, 'latao', 1);                                                                                // lamparina na cintura, atrás
  } else {
    ret(g, cx - 7 + ox, 16 + b, cx - 6 + ox, 21 + b, 'musgo'); mao(cx - 7 + ox, 22 + b);                                                        // braço esquerdo + cesta
    ret(g, cx - 10 + ox, 23, cx - 6 + ox, 26, 'couro'); ret(g, cx - 10 + ox, 22, cx - 6 + ox, 22, 'verde'); poe(g, cx - 9 + ox, 21, 'verde'); poe(g, cx - 7 + ox, 21, 'verde');
    const hx = cx + 6 + ox;                                                                                                                      // braço direito + colher de pau
    if (gesto === 0) { ret(g, hx - 1, 16 + b, hx, 21 + b, 'musgo'); mao(hx - 1, 22 + b); ret(g, hx - 1, 23, hx - 1, 26, 'couro'); ret(g, hx - 2, 26, hx, 27, 'couro'); }
    else { const dx = gesto === 2 ? 1 : 0; ret(g, hx - 1, 15 + b, hx, 18 + b, 'musgo'); mao(hx - 1, 14 + b); ret(g, hx - 1 + dx, 8 + b, hx - 1 + dx, 13 + b, 'couro'); ret(g, hx - 2 + dx, 6 + b, hx + dx, 8 + b, 'couro'); }
    if (!costas) { poe(g, cx + 4 + ox, 23, 'latao'); poe(g, cx + 4 + ox, 24, 'latao', 1); }                                                    // lamparina na cintura
  }
  // cabeça (8×8): cabelo grisalho, coque com agulha, rosto pele
  const hy = 7 + b;
  if (lado) {
    ret(g, cx - 3, hy, cx + 4, hy + 7, 'pele'); ret(g, cx - 3, hy, cx + 4, hy + 2, 'linho'); ret(g, cx - 3, hy + 3, cx - 1, hy + 6, 'linho'); poe(g, cx + 4, hy + 2, 'pele');
    poe(g, cx + 3, hy + 4, 'aco', 0); poe(g, cx + 5, hy + 5, 'pele'); ret(g, cx - 4, hy - 2, cx - 2, hy - 1, 'linho'); poe(g, cx - 5, hy - 3, 'aco'); poe(g, cx - 4, hy - 3, 'aco');
  } else if (!costas) {
    const hx = cx - 4 + ox; ret(g, hx, hy, hx + 7, hy + 7, 'pele'); ret(g, hx, hy, hx + 7, hy + 2, 'linho'); poe(g, hx, hy + 3, 'linho'); poe(g, hx + 7, hy + 3, 'linho'); poe(g, hx + 1, hy + 3, 'linho'); poe(g, hx + 6, hy + 3, 'linho');
    poe(g, hx + (diag ? 3 : 2), hy + 4, 'aco', 0); poe(g, hx + (diag ? 6 : 5), hy + 4, 'aco', 0); poe(g, hx + 3 + ox, hy + 6, 'pele', 1);
    ret(g, hx + 3, hy - 3, hx + 5, hy - 1, 'linho'); poe(g, hx + 6, hy - 3, 'aco'); poe(g, hx + 7, hy - 4, 'aco');
  } else {
    const hx = cx - 4 + ox; ret(g, hx, hy, hx + 7, hy + 7, 'linho'); ret(g, hx + 1, hy + 7, hx + 6, hy + 7, 'pele'); ret(g, hx + 3, hy - 3, hx + 5, hy - 1, 'linho'); poe(g, hx + 6, hy - 3, 'aco'); poe(g, hx + 7, hy - 4, 'aco');
  }
  return g;
}

export const NPCS = { npc_maren: { nome: 'Maren', desenhar: maren, nota: 'Maren (D-049): idosa miúda de ~26 px, xale verde-musgo, saia terra, cabelo grisalho em coque com agulha, cesta de ervas, lamparina e colher de pau. Item-modelo dos NPCs da vila.' } };

export function gerarNpc(id) {
  const n = NPCS[id], quadros = [], anims = {};
  for (const [nome, a] of Object.entries(ANIMS)) { anims[nome] = { ...a, inicio: quadros.length }; for (const d of DIRS) for (let f = 0; f < a.quadros; f++) quadros.push(acabar(n.desenhar(d, POSES[nome][f]))); }
  const lin = Math.ceil(quadros.length / COLUNAS), img = novaImagem(COLUNAS * CEL, lin * CEL);
  quadros.forEach((q, k) => blit(img, q, (k % COLUNAS) * CEL, Math.floor(k / COLUNAS) * CEL));
  return { img, quadros, meta: { id, tipo: 'sprite_humanoide', celula: [CEL, CEL], ancora: ANC, arte_escala: 1, ref_celula: CEL, direcoes: DIRS, espelhar: { sw: 'se', o: 'l', nw: 'ne' }, colunas: COLUNAS, anims, nota: n.nota + ' Quadro = inicio + dir*quadros + q; 5 direções, o motor espelha as demais. Sem normal map.' } };
}

function validar({ quadros }) {
  const erros = [], cores = new Set();
  quadros.forEach((q, k) => { let a0 = 99, a1 = -1, b0 = 99, b1 = -1; for (let y = 0; y < CEL; y++) for (let x = 0; x < CEL; x++) { const i = (y * CEL + x) * 4, al = q.px[i + 3]; if (al !== 0 && al !== 255) erros.push(`quadro ${k}: alpha ${al}`); if (al) { cores.add((q.px[i] << 16) | (q.px[i + 1] << 8) | q.px[i + 2]); a0 = Math.min(a0, x); a1 = Math.max(a1, x); b0 = Math.min(b0, y); b1 = Math.max(b1, y); } } if (a0 < 1 || b0 < 1 || a1 > CEL - 2 || b1 > CEL - 2) erros.push(`quadro ${k}: encosta na borda (${a0},${b0})-(${a1},${b1})`); if (b1 > ANC[1] + 1) erros.push(`quadro ${k}: passa dos pés`); });
  if (cores.size > 32) erros.push(`${cores.size} cores (máx. 32)`);
  return { erros, cores: cores.size };
}
function previa(r, E = 8) {
  const m = 6, w = 7 * (CEL * E + m) + m, h = 5 * (CEL * E + m) + m, img = novaImagem(w, h); for (let i = 0; i < w * h; i++) img.px.set([86, 98, 84, 255], i * 4);
  const seq = [['parado', 0], ['idle_a', 0], ['idle_a', 1], ['idle_b', 0], ['idle_b', 1], ['idle_b', 2]];
  for (let d = 0; d < 5; d++) seq.forEach(([nome, f], c) => {
    const a = r.meta.anims[nome], q = r.quadros[a.inicio + d * a.quadros + f], ox = m + c * (CEL * E + m), oy = m + d * (CEL * E + m);
    for (let y = -2 * E; y <= 2 * E; y++) for (let x = -7 * E; x <= 7 * E; x++) if ((x / (7 * E)) ** 2 + (y / (2 * E)) ** 2 <= 1) img.px.set([74, 86, 72, 255], ((oy + ANC[1] * E + y) * w + ox + ANC[0] * E + x) * 4);
    for (let y = 0; y < CEL; y++) for (let x = 0; x < CEL; x++) { const s = (y * CEL + x) * 4; if (!q.px[s + 3]) continue; for (let a2 = 0; a2 < E; a2++) for (let b2 = 0; b2 < E; b2++) img.px.set(q.px.subarray(s, s + 4), ((oy + y * E + b2) * w + ox + x * E + a2) * 4); }
  });
  return img;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const arg = (n) => (process.argv.find((a) => a.startsWith(`--${n}=`)) ?? '').split('=')[1], raiz = arg('saida') || RAIZ, so = arg('so');
  let falhou = false;
  for (const id of Object.keys(NPCS)) {
    if (so && so !== id) continue;
    const r = gerarNpc(id), v = validar(r), dir = join(raiz, 'assets/sprites', id); mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, id + '.png'), codificarPng(r.img)); writeFileSync(join(dir, id + '.meta.json'), JSON.stringify(r.meta, null, 2) + '\n');
    console.log(`${id}: ${r.img.w}×${r.img.h}, ${r.quadros.length} quadros, ${v.cores} cores`);
    if (process.argv.includes('--previa')) { const d2 = join(raiz, 'docs/arte/sprites'); mkdirSync(d2, { recursive: true }); writeFileSync(join(d2, `previa_${id}.png`), codificarPng(previa(r))); }
    if (v.erros.length) { falhou = true; console.error(`✗ ${id}: ` + [...new Set(v.erros)].slice(0, 8).join(' | ')); }
  }
  if (falhou) process.exit(1);
}
