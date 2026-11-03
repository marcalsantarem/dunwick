// Gera o mapa de mundo "Campos de Baixo Orvalho" (v0.1.3b, D-045/D-048; 14 — Níveis e Mundo): data/maps/map_mundo_orvalho.json.
// 48×48 tiles, isométrico 3D denso (D-048): a FLORESTA e as MONTANHAS vêm do terreno (o relevo do 07 cobre mata rala e montanha), então o
// mapa não leva objetos de árvore nem de pico; só rochas, ponte e marcadores. Composição (D-046 §10, ajustada ao 3D):
//   cordilheira ao norte e a oeste com um passo onde fica a caverna; costa recortada a leste e ao sul (baías, penínsulas, ilhotas) com praia;
//   lago no interior ao norte da vila, alimentado por um riacho da serra; rio sinuoso do lago até a foz a leste; florestas em massas
//   grandes com clareiras (o bosque numa delas, a noroeste); a vila numa clareira aberta no meio-sul; estradas curvas com ponte e trilha.
// Água e montanha bloqueiam (`solidos`); mata rala e areia são andáveis. Marcadores: vila (portal ativo ↔ vão sul de map_baixo_orvalho),
// bosque e caverna (portais inativos = interditados). Sem encontros (v0.1.5), sem baús, sem NPCs. Objetos só com tipo no kit (cfg_kit.pegadas, 07).
// Determinístico. Uso: node tools/gerar_mundo.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { jsonCompacto } from './lib/json_compacto.mjs';

const N = 48, RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..'), ORIGEM = 'tools/gerar_mundo.mjs (14, mapa de mundo v0.1.3b — D-045/D-048)';
const LEG = { g: 'grama', r: 'mata_rala', e: 'estrada', a: 'agua', n: 'montanha', p: 'areia' }, SOLIDOS = ['a', 'n']; // água e montanha bloqueiam
// marcadores (centro do tile): vila no meio-sul, bosque a noroeste (dentro da mata), caverna no passo da cordilheira ao norte; livre = raio da clareira
const LOCAIS = [
  { id: 'vila', tipo: 'marcador_vila', x: 20, z: 30, ativo: true, destino: { mapa: 'map_baixo_orvalho', portal: 'saida_sul' }, nome_txt: 'txt_mundo_marcador_vila_nome', livre: 5 },
  { id: 'bosque', tipo: 'marcador_bosque', x: 10, z: 15, ativo: false, destino: { mapa: 'map_bosque_orvalho', portal: 'entrada' }, nome_txt: 'txt_mundo_marcador_bosque_nome', aviso_txt: 'txt_mundo_marcador_bosque_aviso', livre: 2.6 },
  { id: 'caverna', tipo: 'marcador_caverna', x: 33, z: 8, ativo: false, destino: { mapa: 'map_caverna_hollowpaw', portal: 'entrada' }, nome_txt: 'txt_mundo_marcador_caverna_nome', aviso_txt: 'txt_mundo_marcador_caverna_aviso', livre: 2.6 },
];
// estradas (polilinhas em tiles): vila → bosque (curva para noroeste); vila → ponte → caverna; vereda vila → praia ao sul
const ESTRADAS = [
  [[20, 31], [20, 26], [17.5, 23], [14, 21.5], [12, 18.5], [10.5, 16.5]],
  [[20, 26], [23, 22.5], [27, 21], [34, 21], [36, 18], [35.5, 13], [33, 9.5]], // trecho reto em z 21 cruza o rio (ponte em x)
  [[20, 31], [21, 34], [23.5, 37.5]],
];
const LAGO = { x: 26, z: 13, rx: 3.6, rz: 2.4 };
const RIOS = [
  [[24.5, 1], [25, 5], [24.5, 8], [25.5, 11]], // riacho da serra até o lago
  [[29, 14], [31.5, 16], [30.8, 19], [31, 23], [34, 26.5], [37.5, 27.5], [40, 30], [43, 31]], // do lago à foz (leste)
];
const ILHOTAS = [[45, 9, 1.4], [44.5, 21, 1.1], [34, 46, 1.3], [10, 46.3, 1.0]]; // [x, z, raio]
const FLORESTAS = [[10, 15, 9.5], [38, 13, 5.5], [8, 35, 6.5], [30, 37, 4.5], [17, 8, 4]]; // [x, z, raio]: massas grandes (bosque na 1ª)
let s = 4517; const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
const ruido = (x, z) => { const f = (a, b) => { const h = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return h - Math.floor(h); }; const xi = Math.floor(x), zi = Math.floor(z), fx = x - xi, fz = z - zi, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz); return f(xi, zi) * (1 - u) * (1 - v) + f(xi + 1, zi) * u * (1 - v) + f(xi, zi + 1) * (1 - u) * v + f(xi + 1, zi + 1) * u * v; };
const fbm = (x, z) => ruido(x, z) * 0.6 + ruido(x * 2.1 + 17, z * 2.1) * 0.3 + ruido(x * 4.3 + 31, z * 4.3) * 0.1;
const distSeg = (px, pz, ax, az, bx, bz) => { const dx = bx - ax, dz = bz - az, t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz))); return Math.hypot(px - ax - t * dx, pz - az - t * dz); };
const distLinha = (x, z, pts) => Math.min(...pts.slice(1).map((p, i) => distSeg(x, z, pts[i][0], pts[i][1], p[0], p[1])));

// ---- Terreno ----
// mar: costa leste (3 baías) e sul (2 baías) recortadas + ilhotas; montanha: norte (grossa) e oeste, sem chegar ao mar
const costaL = (z) => 40.5 + 2.6 * Math.sin(z * 0.42 + 0.6) + (fbm(z * 0.35 + 50, 3) - 0.5) * 3.5 - (z > 34 ? (z - 34) * 0.5 : 0);
const costaS = (x) => 43 + 1.8 * Math.sin(x * 0.33 + 2) + (fbm(x * 0.35, 80) - 0.5) * 3 - (x > 30 ? (x - 30) * 0.18 : 0);
const ehMar = (cx, cz) => (cx > costaL(cz) || cz > costaS(cx)) && !ILHOTAS.some(([x, z, r]) => Math.hypot(cx - x, cz - z) < r + (fbm(cx, cz) - 0.5));
const clareira = (cx, cz) => LOCAIS.some((l) => Math.hypot(cx - l.x, cz - l.z) < l.livre + (fbm(cx * 0.8, cz * 0.8) - 0.5) * 1.2);
const grade = Array.from({ length: N }, () => Array(N).fill('g'));
for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) {
  const cx = x + 0.5, cz = z + 0.5;
  let t = 'g';
  // floresta: massas com borda orgânica e clareiras internas (o ruído fino abre buracos no miolo)
  const f = Math.min(...FLORESTAS.map(([fx, fz, r]) => Math.hypot(cx - fx, cz - fz) / r)) + (fbm(cx * 0.3 + 9, cz * 0.3) - 0.5) * 0.7;
  if (f < 1 && !(f > 0.25 && ruido(cx * 0.55 + 3, cz * 0.55) > 0.78)) t = 'r';
  else if (ruido(cx * 0.5 + 60, cz * 0.5) > 0.86) t = 'r'; // bosquetes soltos no campo
  // cordilheira: norte 4,5–8 tiles, oeste 2,5–5; o passo da caverna é a clareira do marcador
  const serraN = 4.5 + 3.5 * fbm(cx * 0.18, 5), serraO = 2.5 + 2.5 * fbm(7, cz * 0.2);
  if ((cz < serraN || cx < serraO) && !ehMar(cx, cz)) t = 'n';
  if (Math.hypot((cx - LAGO.x) / LAGO.rx, (cz - LAGO.z) / LAGO.rz) < 1 + (fbm(cx * 0.6, cz * 0.6) - 0.5) * 0.5) t = 'a';
  for (const [k, rio] of RIOS.entries()) if (distLinha(cx, cz, rio) < (k ? 0.75 : 0.55) + (ruido(cx * 0.5, cz * 0.5) - 0.3) * 0.4) t = 'a';
  if (ehMar(cx, cz)) t = 'a';
  if (clareira(cx, cz) && t !== 'a') t = 'g';
  grade[z][x] = t;
}
// praia: terra a 1–2 tiles do mar (não do rio nem do lago), fora da montanha
const marEm = (x, z) => x >= 0 && z >= 0 && x < N && z < N && ehMar(x + 0.5, z + 0.5);
for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) {
  if (grade[z][x] === 'a' || grade[z][x] === 'n') continue;
  const larg = 1 + (ruido(x * 0.4 + 5, z * 0.4) > 0.55 ? 1 : 0);
  let perto = false;
  for (let dz = -larg; dz <= larg && !perto; dz++) for (let dx = -larg; dx <= larg; dx++) if (Math.abs(dx) + Math.abs(dz) <= larg && marEm(x + dx, z + dz)) { perto = true; break; }
  if (perto) grade[z][x] = 'p';
}
// estradas por cima (a travessia do rio vira estrada + ponte; a vereda da praia some na areia); guarda os tiles de ponte
const pontes = [];
for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) {
  const cx = x + 0.5, cz = z + 0.5, principal = ESTRADAS.slice(0, 2).some((e) => distLinha(cx, cz, e) < 0.75);
  if (!principal && !(distLinha(cx, cz, ESTRADAS[2]) < 0.6 && grade[z][x] !== 'p')) continue;
  if (grade[z][x] === 'a') pontes.push([x, z]);
  grade[z][x] = 'e';
}
const planta = grade.map((l) => l.join(''));
const solido = (x, z) => SOLIDOS.includes(planta[Math.floor(z)]?.[Math.floor(x)] ?? 'n');

// ---- Objetos (só tipos do kit; marcador interditado ganha lacre do 07). Árvores e picos vêm do relevo do terreno (D-048): nada de objeto ----
const kit = JSON.parse(readFileSync(join(RAIZ, 'data/config/cfg_kit.json'), 'utf8'));
const objetos = []; const add = (o) => { if (kit.pegadas[o.tipo]) objetos.push(o); };
for (const l of LOCAIS) add({ id: `marcador_${l.id}`, tipo: l.tipo, x: l.x, z: l.z, rot: 0, seed: 1, ...(l.ativo ? {} : { interditado: true }) });
if (pontes.length) { // uma ponte só, no meio dos tiles de estrada sobre a água (a estrada cruza o rio em x)
  const mx = pontes.reduce((a, p) => a + p[0], 0) / pontes.length + 0.5, mz = pontes.reduce((a, p) => a + p[1], 0) / pontes.length + 0.5;
  add({ id: 'ponte_rio', tipo: 'ponte_mundo', x: +mx.toFixed(2), z: +mz.toFixed(2), w: 2.5, rot: 0, seed: 1 });
}
const livreDeObj = (x, z, r) => !objetos.some((o) => Math.hypot(o.x - x, o.z - z) < r);
const pegarTile = (x, z) => planta[Math.floor(z)]?.[Math.floor(x)] ?? 'n';
const juntoDe = (x, z, ch) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => pegarTile(x + dx, z + dz) === ch);
// rochas: no sopé da serra, na praia junto ao mar e raras no campo; nunca na estrada nem nas clareiras dos marcadores
let roc = 0;
for (let k = 0; k < 8000 && roc < 34; k++) {
  const x = 1 + rnd() * (N - 2), z = 1 + rnd() * (N - 2), t = pegarTile(x, z);
  if (t === 'e' || solido(x, z) || clareira(x, z) || ESTRADAS.some((e) => distLinha(x, z, e) < 1.3) || !livreDeObj(x, z, 1.6)) continue;
  const chance = juntoDe(x, z, 'n') ? 1 : t === 'p' && juntoDe(x, z, 'a') ? 0.6 : t === 'g' ? 0.08 : 0;
  if (rnd() > chance) continue;
  add({ id: `rocha_mundo_${roc}`, tipo: 'rocha_mundo', x: +x.toFixed(2), z: +z.toFixed(2), rot: Math.floor(rnd() * 360), escala: +(0.7 + rnd() * 0.6).toFixed(2), seed: Math.floor(rnd() * 1000) }); roc++;
}

// ---- Portais (mesmo id do marcador e do POI, contrato do 13; 2×2 sobre o marcador; inativo = colisor e aviso) e POIs ----
const portais = LOCAIS.map((l) => ({ id: `marcador_${l.id}`, x: l.x, z: l.z, w: 2, d: 2, destino: l.destino, chegada: { x: l.x, z: l.z + 2, direcao: 's' }, ...(l.aviso_txt ? { nome_txt: l.nome_txt, aviso_txt: l.aviso_txt } : {}), ativo: l.ativo }));
const pois = LOCAIS.map((l) => ({ id: `marcador_${l.id}`, tipo: 'marcador', x: l.x, z: l.z, nome_txt: l.nome_txt }));
const vila = LOCAIS[0];
const mundo = {
  id: 'map_mundo_orvalho', versao: 2, nome_txt: 'txt_map_mundo_orvalho_nome', origem: ORIGEM, tipo_mapa: 'mundo', estado: 'dia',
  tamanho: [N, N], legenda: LEG, solidos: SOLIDOS, planta, objetos, portais, pois,
  inicio_jogador: { tile: [vila.x, vila.z + 2], direcao: 's' }, // não usado: o jogo começa na vila
  limites_camera: [4, 4, N - 8, N - 8],
};
writeFileSync(join(RAIZ, 'data/maps/map_mundo_orvalho.json'), jsonCompacto(mundo));
const conta = Object.fromEntries(Object.keys(LEG).map((k) => [LEG[k], planta.join('').split(k).length - 1]));
console.log(`mundo ${N}×${N}: ${JSON.stringify(conta)}; ${objetos.length} objetos (${roc} rochas, ${pontes.length ? 1 : 0} ponte sobre ${pontes.length} tiles), ${portais.length} portais`);
console.log(planta.join('\n'));

// ---- Esboço (docs/niveis/esboco_mundo_v013.png): 12 px/tile, cores de cfg_mundo; objetos em ponto, marcadores em quadrado (vermelho = interditado) ----
const { novaImagem, pintar, codificarPng } = await import('./lib/png.mjs');
const cores = JSON.parse(readFileSync(join(RAIZ, 'data/config/cfg_mundo.json'), 'utf8')).terreno.materiais, PX = 12;
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const img = novaImagem(N * PX, N * PX), ret = (x0, z0, w, h, c) => { for (let y = Math.max(0, Math.round(z0)); y < Math.min(N * PX, Math.round(z0 + h)); y++) for (let x = Math.max(0, Math.round(x0)); x < Math.min(N * PX, Math.round(x0 + w)); x++) pintar(img, x, y, c); };
for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) { const c = hex(cores[LEG[planta[z][x]]]?.cor ?? '#ff00ff'); ret(x * PX, z * PX, PX, PX, (x + z) % 2 ? c : c.map((v) => v * 0.94)); }
const corObj = { rocha_mundo: [150, 150, 150], ponte_mundo: [120, 80, 40] };
for (const o of objetos) if (corObj[o.tipo]) ret(o.x * PX - (o.tipo === 'ponte_mundo' ? 15 : 3), o.z * PX - 3, o.tipo === 'ponte_mundo' ? 30 : 6, 6, corObj[o.tipo]);
for (const p of portais) ret((p.x - 1) * PX, (p.z - 1) * PX, 2 * PX, 2 * PX, p.ativo ? [250, 230, 90] : [200, 40, 40]);
writeFileSync(join(RAIZ, 'docs/niveis/esboco_mundo_v013.png'), codificarPng(img));
