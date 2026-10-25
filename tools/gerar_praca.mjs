// Gera data/maps/map_baixo_orvalho_praca.json (layout PROVISÓRIO da praça de Baixo Orvalho para a cena-modelo; o 06 é o dono do layout
// final). Determinístico: terreno por regras (praça de calçamento, caminhos de terra, musgo) + objetos por semente.
// Uso: node tools/gerar_praca.mjs
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { jsonCompacto } from './lib/json_compacto.mjs';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..'), N = 48, C = { x: 24, z: 24 };
let s = 20241; const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
const ruido = (x, z) => { const f = (a, b) => { const h = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return h - Math.floor(h); }; const xi = Math.floor(x), zi = Math.floor(z), fx = x - xi, fz = z - zi, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz); return f(xi, zi) * (1 - u) * (1 - v) + f(xi + 1, zi) * u * (1 - v) + f(xi, zi + 1) * (1 - u) * v + f(xi + 1, zi + 1) * u * v; };
const distSeg = (px, pz, ax, az, bx, bz) => { const dx = bx - ax, dz = bz - az, t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz))); return Math.hypot(px - ax - t * dx, pz - az - t * dz); };
const caminhos = [[24, 0, 24, 17], [24, 31, 24, 48], [0, 24, 17, 24], [31, 24, 48, 24], [31, 24, 38, 31], [38, 31, 38, 48]];

const planta = [];
for (let z = 0; z < N; z++) { let row = ''; for (let x = 0; x < N; x++) {
  const cx = x + 0.5, cz = z + 0.5, r = Math.hypot(cx - C.x, cz - C.z) - (ruido(cx * 0.5, cz * 0.5) - 0.5) * 1.6;
  let t = 'g';
  if (caminhos.some(([a, b, c, d]) => distSeg(cx, cz, a, b, c, d) - (ruido(cx * 0.4 + 9, cz * 0.4) - 0.5) < 1.5)) t = 't';
  if (r < 7.4) t = 'c';
  else if (r < 8.6 && t !== 't') t = ruido(cx * 0.8, cz * 0.8) > 0.5 ? 'c' : 'g';
  if (t === 'g' && ruido(cx * 0.25 + 40, cz * 0.25) > 0.66) t = 'm';
  row += t; } planta.push(row); }

const objetos = []; const add = (o) => { objetos.push(o); return o; };
// estruturas (x, z = centro; w, d = tamanho em tiles; rot em graus)
add({ id: 'casa_maren', tipo: 'casa', x: 16.5, z: 17, w: 4, d: 3, rot: 0, telhado: 'musgo', janelas: 3, chamine: true, seed: 3 });
add({ id: 'taverna', tipo: 'casa', x: 32.5, z: 17, w: 5, d: 4, rot: 0, telhado: 'telha', janelas: 4, chamine: true, seed: 5 });
add({ id: 'forja', tipo: 'casa', x: 33, z: 31, w: 4, d: 3, rot: 90, telhado: 'ardosia', janelas: 2, chamine: true, seed: 7 });
add({ id: 'posto_escrivao', tipo: 'casa', x: 16, z: 31, w: 3, d: 3, rot: 180, telhado: 'ardosia', janelas: 2, chamine: false, seed: 11 });
add({ id: 'casa_a', tipo: 'casa', x: 9.5, z: 36.5, w: 3, d: 3, rot: 90, telhado: 'telha', janelas: 2, chamine: true, seed: 13 });
add({ id: 'casa_b', tipo: 'casa', x: 40, z: 9, w: 3, d: 3, rot: 270, telhado: 'musgo', janelas: 2, chamine: true, seed: 17 });
add({ id: 'casa_c', tipo: 'casa', x: 8.5, z: 12, w: 3, d: 4, rot: 0, telhado: 'telha', janelas: 3, chamine: true, seed: 19 });
add({ id: 'torre_sino', tipo: 'torre_sino', x: 24, z: 13.5, rot: 0, seed: 2 });
add({ id: 'poco', tipo: 'poco', x: 24, z: 24, rot: 0, seed: 4 });
// lanternas ao redor da praça e nos caminhos
for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + 0.2; add({ id: `lanterna_${i}`, tipo: 'lanterna', x: +(C.x + Math.cos(a) * 8.6).toFixed(2), z: +(C.z + Math.sin(a) * 8.6).toFixed(2), rot: 0, seed: i }); }
for (const [x, z] of [[24, 6], [24, 42], [6, 24], [42, 24]]) add({ id: `lanterna_c${x}_${z}`, tipo: 'lanterna', x, z, rot: 0, seed: 1 });
// pátio de treino (oeste): cerca em U + dois bonecos
for (const [x0, z0, x1, z1] of [[7, 20.5, 19, 20.5], [7, 27.5, 19, 27.5], [7, 20.5, 7, 27.5]]) add({ id: `cerca_treino_${objetos.length}`, tipo: 'cerca', x0, z0, x1, z1, rot: 0, seed: 1 });
add({ id: 'enemy_boneco_alvo', tipo: 'inimigo', x: 11.5, z: 24, rot: 0, seed: 1 });
add({ id: 'enemy_boneco_golpe', tipo: 'inimigo', x: 16.5, z: 24, rot: 0, seed: 1 });
// adereços
for (const [i, x, z] of [[1, 30.5, 33.5], [2, 35.5, 28.5], [3, 31.5, 34.5]]) add({ id: `barril_${i}`, tipo: 'barril', x, z, rot: 0, seed: i });
for (const [i, x, z] of [[1, 34.8, 33.6], [2, 29.2, 29.6], [3, 18.4, 15.2]]) add({ id: `caixote_${i}`, tipo: 'caixote', x, z, rot: 17 * i, seed: i });
add({ id: 'cerca_horta', tipo: 'cerca', x0: 10, z0: 40.5, x1: 18, z1: 40.5, rot: 0, seed: 2 });
// vegetação por semente, fora da praça, dos caminhos e das construções
const ocupado = (x, z, r) => objetos.some((o) => o.tipo !== 'lanterna' && Math.hypot(o.x ?? ((o.x0 + o.x1) / 2) - x, (o.z ?? o.z0) - z) < (o.tipo === 'casa' ? Math.max(o.w, o.d) * 0.8 + r : o.tipo === 'cerca' ? 2 + r : 1.8 + r));
const tipoChao = (x, z) => planta[Math.min(N - 1, Math.floor(z))][Math.min(N - 1, Math.floor(x))];
let arv = 0, tent = 0;
while (arv < 52 && tent++ < 4000) { const x = 1 + rnd() * 46, z = 1 + rnd() * 46, d = Math.hypot(x - C.x, z - C.z); if (d < 12 || tipoChao(x, z) === 't' || tipoChao(x, z) === 'c' || ocupado(x, z, 1.2)) continue;
  const pinheiro = rnd() < 0.3; add({ id: `${pinheiro ? 'pinheiro' : 'arvore'}_${arv}`, tipo: pinheiro ? 'pinheiro' : 'arvore', x: +x.toFixed(2), z: +z.toFixed(2), rot: Math.floor(rnd() * 360), escala: +(0.85 + rnd() * 0.5).toFixed(2), seed: Math.floor(rnd() * 1000) }); arv++; }
let arb = 0; tent = 0;
while (arb < 40 && tent++ < 4000) { const x = 1 + rnd() * 46, z = 1 + rnd() * 46; if (Math.hypot(x - C.x, z - C.z) < 9.5 || tipoChao(x, z) === 't' || tipoChao(x, z) === 'c' || ocupado(x, z, 0.5)) continue; const pedra = rnd() < 0.35; add({ id: `${pedra ? 'pedra' : 'arbusto'}_${arb}`, tipo: pedra ? 'pedra' : 'arbusto', x: +x.toFixed(2), z: +z.toFixed(2), rot: Math.floor(rnd() * 360), escala: +(0.7 + rnd() * 0.7).toFixed(2), seed: Math.floor(rnd() * 1000) }); arb++; }

const mapa = {
  id: 'map_baixo_orvalho_praca', versao: 1, nome_txt: 'txt_map_praca_nome',
  origem: 'tools/gerar_praca.mjs (08, layout provisório da cena-modelo; o 06 é o dono do layout final)',
  tamanho: [N, N],
  legenda: { g: 'grama', t: 'terra', c: 'calcada', m: 'musgo' },
  planta, objetos,
  inicio_jogador: { tile: [24, 28], direcao: 's' },
  limites_camera: [0, 0, N, N],
};
writeFileSync(join(RAIZ, 'data/maps/map_baixo_orvalho_praca.json'), jsonCompacto(mapa));
console.log('praça:', objetos.length, 'objetos —', { arvores: arv, arbustos: arb });
