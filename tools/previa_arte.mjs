// Monta uma folha de contato 1:1 com quadros do atlas do herói (build/qa/previa_heroi.png) para olhar a arte. Uso: node tools/previa_arte.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodificarPng, codificarPng, novaImagem } from './lib/png.mjs';
const R = join(dirname(fileURLToPath(import.meta.url)), '..'), base = join(R, 'assets/sprites/hero_edric/hero_edric');
const meta = JSON.parse(readFileSync(base + '.meta.json', 'utf8')), at = decodificarPng(readFileSync(base + '.png')), [cw, ch] = meta.celula;
const sel = [['idle', 0, 0], ['idle', 1, 0], ['idle', 2, 0], ['idle', 3, 0], ['idle', 4, 0], ['andar', 1, 2], ['correr', 2, 3], ['ataque1', 2, 3], ['ataque2', 1, 3], ['ataque3', 0, 3], ['rolar', 2, 3], ['dano', 1, 1]];
const cols = 6, lin = Math.ceil(sel.length / cols), out = novaImagem(cols * cw, lin * ch);
for (let i = 0; i < out.px.length; i += 4) { out.px[i] = 120; out.px[i + 1] = 150; out.px[i + 2] = 90; out.px[i + 3] = 255; }
sel.forEach(([anim, d, f], k) => { const a = meta.anims[anim], idx = a.inicio + d * a.quadros + f, sx = (idx % meta.colunas) * cw, sy = Math.floor(idx / meta.colunas) * ch, ox = (k % cols) * cw, oy = Math.floor(k / cols) * ch;
  for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) { const s = ((sy + y) * at.w + sx + x) * 4, o = ((oy + y) * out.w + ox + x) * 4, al = at.px[s + 3] / 255; for (let c = 0; c < 3; c++) out.px[o + c] = out.px[o + c] * (1 - al) + at.px[s + c] * al; } });
mkdirSync(join(R, 'build/qa'), { recursive: true }); writeFileSync(join(R, 'build/qa/previa_heroi.png'), codificarPng(out)); console.log('ok', out.w, out.h);
