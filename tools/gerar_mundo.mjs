// Gera o mapa de mundo "Campos de Baixo Orvalho" (v0.1.3, D-045; 14 — Níveis e Mundo): data/maps/map_mundo_orvalho.json.
// 48×48 tiles de mundo, estilo mapa antigo: montanhas fechando a borda (mais grossas ao norte), mar a leste, um rio que desce das
// montanhas ao mar, estradas de terra ligando os 3 marcadores e uma ponte onde a estrada cruza o rio. Água e montanha bloqueiam
// (`solidos`). Marcadores: vila (portal ativo ↔ vão sul de map_baixo_orvalho), bosque e caverna (portais inativos = interditados).
// Sem encontros (v0.1.5), sem baús, sem NPCs. Objetos só com tipo no kit (cfg_kit.pegadas, 07). Determinístico. Uso: node tools/gerar_mundo.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { jsonCompacto } from './lib/json_compacto.mjs';

const N = 48, RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..'), ORIGEM = 'tools/gerar_mundo.mjs (14, mapa de mundo v0.1.3 — D-045)';
const LEG = { g: 'grama', r: 'mata_rala', e: 'estrada', a: 'agua', n: 'montanha' }, SOLIDOS = ['a', 'n']; // água e montanha bloqueiam; mata rala é passável
// marcadores (centro do tile): vila no meio-sul, bosque a noroeste, caverna no pé das montanhas a nordeste
const LOCAIS = [
  { id: 'vila', tipo: 'marcador_vila', x: 20, z: 30, ativo: true, destino: { mapa: 'map_baixo_orvalho', portal: 'saida_sul' }, nome_txt: 'txt_mundo_marcador_vila_nome' },
  { id: 'bosque', tipo: 'marcador_bosque', x: 10, z: 15, ativo: false, destino: { mapa: 'map_bosque_orvalho', portal: 'entrada' }, nome_txt: 'txt_mundo_marcador_bosque_nome', aviso_txt: 'txt_mundo_marcador_bosque_aviso' },
  { id: 'caverna', tipo: 'marcador_caverna', x: 33, z: 8, ativo: false, destino: { mapa: 'map_caverna_hollowpaw', portal: 'entrada' }, nome_txt: 'txt_mundo_marcador_caverna_nome', aviso_txt: 'txt_mundo_marcador_caverna_aviso' },
];
const RAIO_LIVRE = 3; // em volta do marcador: grama, sem montanha/água/objeto
// estradas (polilinhas em tiles) e rio (polilinha das montanhas ao mar)
const ESTRADAS = [[[20, 31], [20, 26], [15, 21], [11, 16.5]], [[20, 26], [22, 17], [30, 17], [33, 9.5]]]; // a estrada NE cruza o rio em x (ponte reta)
const RIO = [[27, 2], [27, 8], [25.5, 14], [27, 20], [32, 25], [36, 28], [42, 30]];
let s = 4517; const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
const ruido = (x, z) => { const f = (a, b) => { const h = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return h - Math.floor(h); }; const xi = Math.floor(x), zi = Math.floor(z), fx = x - xi, fz = z - zi, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz); return f(xi, zi) * (1 - u) * (1 - v) + f(xi + 1, zi) * u * (1 - v) + f(xi, zi + 1) * (1 - u) * v + f(xi + 1, zi + 1) * u * v; };
const distSeg = (px, pz, ax, az, bx, bz) => { const dx = bx - ax, dz = bz - az, t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz))); return Math.hypot(px - ax - t * dx, pz - az - t * dz); };
const distLinha = (x, z, pts) => Math.min(...pts.slice(1).map((p, i) => distSeg(x, z, pts[i][0], pts[i][1], p[0], p[1])));

// ---- Terreno ----
const grade = Array.from({ length: N }, () => Array(N).fill('g'));
const perto = (x, z) => LOCAIS.some((l) => Math.hypot(x - l.x, z - l.z) < RAIO_LIVRE);
for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) {
  const cx = x + 0.5, cz = z + 0.5, borda = Math.min(cx, cz, N - cx, N - cz);
  const montanha = 2 + (cz < 24 ? 3 * (1 - cz / 24) : 0) + ruido(cx * 0.35, cz * 0.35) * 2.2; // espessura da cordilheira (norte mais grosso)
  const costa = 39 + (ruido(cz * 0.3 + 50, 3) - 0.5) * 5 + (cz > 30 ? -(cz - 30) * 0.35 : 0); // mar a leste, avançando a sudeste
  let t = ruido(cx * 0.22 + 20, cz * 0.22) > 0.6 ? 'r' : 'g';
  if (cx > costa) t = 'a';
  if (distLinha(cx, cz, RIO) < 0.8 + ruido(cx * 0.5, cz * 0.5) * 0.4) t = 'a';
  if (borda < montanha && cx <= costa + 1) t = 'n';
  if (perto(cx, cz)) t = 'g';
  grade[z][x] = t;
}
// estradas por cima (a travessia do rio vira estrada + ponte); guarda os tiles de ponte
const pontes = [];
for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) {
  const cx = x + 0.5, cz = z + 0.5;
  if (!ESTRADAS.some((e) => distLinha(cx, cz, e) < 0.75)) continue;
  if (grade[z][x] === 'a') pontes.push([x, z]);
  grade[z][x] = 'e';
}
const planta = grade.map((l) => l.join(''));
const solido = (x, z) => SOLIDOS.includes(planta[Math.floor(z)]?.[Math.floor(x)] ?? 'n');

// ---- Objetos (só tipos do kit; marcador interditado ganha lacre do 07) ----
const kit = JSON.parse(readFileSync(join(RAIZ, 'data/config/cfg_kit.json'), 'utf8'));
const objetos = []; const add = (o) => { if (kit.pegadas[o.tipo]) objetos.push(o); };
for (const l of LOCAIS) add({ id: `marcador_${l.id}`, tipo: l.tipo, x: l.x, z: l.z, rot: 0, seed: 1, ...(l.ativo ? {} : { interditado: true }) });
if (pontes.length) { // uma ponte só, no meio dos tiles de estrada sobre a água (estrada NE cruza o rio quase em x)
  const mx = pontes.reduce((a, p) => a + p[0], 0) / pontes.length + 0.5, mz = pontes.reduce((a, p) => a + p[1], 0) / pontes.length + 0.5;
  add({ id: 'ponte_rio', tipo: 'ponte_mundo', x: +mx.toFixed(2), z: +mz.toFixed(2), w: 2.5, rot: 0, seed: 1 });
}
const livreDeObj = (x, z, r) => !objetos.some((o) => Math.hypot(o.x - x, o.z - z) < r);
const pegarTile = (x, z) => planta[Math.floor(z)][Math.floor(x)];
let arv = 0, roc = 0;
for (let k = 0; k < 6000 && (arv < 70 || roc < 24); k++) {
  const x = 1 + rnd() * (N - 2), z = 1 + rnd() * (N - 2), t = pegarTile(x, z);
  if (t === 'e' || solido(x, z) || perto(x, z) || ESTRADAS.some((e) => distLinha(x, z, e) < 1.3)) continue;
  const juntoMontanha = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => pegarTile(Math.min(N - 1, Math.max(0, x + dx)), Math.min(N - 1, Math.max(0, z + dz))) === 'n');
  if (t === 'r' && arv < 70 && livreDeObj(x, z, 0.9)) { add({ id: `arvore_mundo_${arv}`, tipo: 'arvore_mundo', x: +x.toFixed(2), z: +z.toFixed(2), rot: 0, escala: +(0.8 + rnd() * 0.5).toFixed(2), seed: Math.floor(rnd() * 1000) }); arv++; }
  else if (juntoMontanha && roc < 24 && livreDeObj(x, z, 1.2)) { add({ id: `rocha_mundo_${roc}`, tipo: 'rocha_mundo', x: +x.toFixed(2), z: +z.toFixed(2), rot: Math.floor(rnd() * 360), escala: +(0.7 + rnd() * 0.6).toFixed(2), seed: Math.floor(rnd() * 1000) }); roc++; }
}

// picos sobre a cordilheira (sem colisão própria: o tile de montanha já bloqueia); só no miolo, para não invadir a grama
let pic = 0;
for (let gz = 0.5; gz < N; gz += 2.5) for (let gx = 0.5; gx < N; gx += 2.5) {
  const x = Math.min(N - 0.6, gx + rnd() * 1.2), z = Math.min(N - 0.6, gz + rnd() * 1.2);
  if (![[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dz]) => (planta[Math.floor(z + dz)]?.[Math.floor(x + dx)] ?? 'n') === 'n')) continue;
  add({ id: `montanha_mundo_${pic}`, tipo: 'montanha_mundo', x: +x.toFixed(2), z: +z.toFixed(2), rot: 0, escala: +(0.8 + rnd() * 0.5).toFixed(2), seed: Math.floor(rnd() * 1000) }); pic++;
}

// ---- Portais (mesmo id do marcador e do POI, contrato do 13; 2×2 sobre o marcador; inativo = colisor e aviso txt_portal_interditado) e POIs ----
const portais = LOCAIS.map((l) => ({ id: `marcador_${l.id}`, x: l.x, z: l.z, w: 2, d: 2, destino: l.destino, chegada: { x: l.x, z: l.z + 2, direcao: 's' }, ...(l.aviso_txt ? { nome_txt: l.nome_txt, aviso_txt: l.aviso_txt } : {}), ativo: l.ativo }));
const pois = LOCAIS.map((l) => ({ id: `marcador_${l.id}`, tipo: 'marcador', x: l.x, z: l.z, nome_txt: l.nome_txt }));
const vila = LOCAIS[0];
const mundo = {
  id: 'map_mundo_orvalho', versao: 1, nome_txt: 'txt_map_mundo_orvalho_nome', origem: ORIGEM, tipo_mapa: 'mundo', estado: 'dia',
  tamanho: [N, N], legenda: LEG, solidos: SOLIDOS, planta, objetos, portais, pois,
  inicio_jogador: { tile: [vila.x, vila.z + 2], direcao: 's' }, // não usado: o jogo começa na vila
  limites_camera: [4, 4, N - 8, N - 8],
};
writeFileSync(join(RAIZ, 'data/maps/map_mundo_orvalho.json'), jsonCompacto(mundo));
const conta = Object.fromEntries(Object.keys(LEG).map((k) => [LEG[k], planta.join('').split(k).length - 1]));
console.log(`mundo ${N}×${N}: ${JSON.stringify(conta)}; ${objetos.length} objetos (${arv} árvores, ${roc} rochas, ${pic} picos, ${pontes.length ? 1 : 0} ponte sobre ${pontes.length} tiles), ${portais.length} portais`);
console.log(planta.join('\n'));

// ---- Esboço (docs/niveis/esboco_mundo_v013.png): 12 px/tile, cores de cfg_mundo; objetos em ponto, marcadores em quadrado (vermelho = interditado) ----
const { novaImagem, pintar, codificarPng } = await import('./lib/png.mjs');
const cores = JSON.parse(readFileSync(join(RAIZ, 'data/config/cfg_mundo.json'), 'utf8')).terreno.materiais, PX = 12;
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const img = novaImagem(N * PX, N * PX), ret = (x0, z0, w, h, c) => { for (let y = Math.max(0, Math.round(z0)); y < Math.min(N * PX, Math.round(z0 + h)); y++) for (let x = Math.max(0, Math.round(x0)); x < Math.min(N * PX, Math.round(x0 + w)); x++) pintar(img, x, y, c); };
for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) { const c = hex(cores[LEG[planta[z][x]]]?.cor ?? '#ff00ff'); ret(x * PX, z * PX, PX, PX, (x + z) % 2 ? c : c.map((v) => v * 0.94)); }
const corObj = { arvore_mundo: [30, 70, 30], rocha_mundo: [150, 150, 150], montanha_mundo: [90, 80, 70], ponte_mundo: [120, 80, 40] };
for (const o of objetos) if (corObj[o.tipo]) ret(o.x * PX - (o.tipo === 'ponte_mundo' ? 15 : 3), o.z * PX - 3, o.tipo === 'ponte_mundo' ? 30 : 6, 6, corObj[o.tipo]);
for (const p of portais) ret((p.x - 1) * PX, (p.z - 1) * PX, 2 * PX, 2 * PX, p.ativo ? [250, 230, 90] : [200, 40, 40]);
writeFileSync(join(RAIZ, 'docs/niveis/esboco_mundo_v013.png'), codificarPng(img));
