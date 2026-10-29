// Gera a vila de Baixo Orvalho (v0.1.2, D-041; 14 — Níveis e Mundo), substituindo tools/gerar_praca.mjs:
//   data/maps/map_baixo_orvalho.json (exterior 48×48, vila inteira segura — D-038),
//   data/maps/map_<lugar>_interior.json (5 interiores de um cômodo, sem NPCs) e
//   data/exploracao/z_enc_baixo_orvalho.json (sem zona de encontro; interiores não têm arquivo de zonas).
// Layout do esboço aprovado (docs/niveis/esboco_vila_v012.png). Contrato dos campos novos: 08 (edificios, portais, pois, sala, ambiente).
// Determinístico. Uso: node tools/gerar_vila.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { jsonCompacto } from './lib/json_compacto.mjs';
import { EDIFICIOS, PROPS_VILA, SALAS } from './lib/layout_vila.mjs';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..'), N = 48, C = { x: 24, z: 24 };
const ORIGEM = 'tools/gerar_vila.mjs (14, vila v0.1.2 — esboço aprovado em D-041)';
let s = 20241; const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
const ruido = (x, z) => { const f = (a, b) => { const h = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return h - Math.floor(h); }; const xi = Math.floor(x), zi = Math.floor(z), fx = x - xi, fz = z - zi, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz); return f(xi, zi) * (1 - u) * (1 - v) + f(xi + 1, zi) * u * (1 - v) + f(xi, zi + 1) * (1 - u) * v + f(xi + 1, zi + 1) * u * v; };
const distSeg = (px, pz, ax, az, bx, bz) => { const dx = bx - ax, dz = bz - az, t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz))); return Math.hypot(px - ax - t * dx, pz - az - t * dz); };
const salvar = (rel, obj) => writeFileSync(join(RAIZ, rel), jsonCompacto(obj));

const centro = ([x0, z0, x1, z1]) => ({ x: (x0 + x1 + 1) / 2, z: (z0 + z1 + 1) / 2, w: x1 - x0 + 1, d: z1 - z0 + 1 });
// porta no meio da parede do lado; gatilho = faixa de 1 tile colada à parede (2 tiles de largura); chegada = 1 tile além do gatilho
function porta(e) {
  const c = centro(e.r), [x0, z0, x1, z1] = e.r;
  const p = { s: { x: c.x, z: z1 + 1, dx: 0, dz: 1 }, n: { x: c.x, z: z0, dx: 0, dz: -1 }, l: { x: x1 + 1, z: c.z, dx: 1, dz: 0 }, o: { x: x0, z: c.z, dx: -1, dz: 0 } }[e.lado];
  const horiz = p.dz !== 0, gat = { x: p.x + p.dx * 0.5, z: p.z + p.dz * 0.5, w: horiz ? 2 : 1, d: horiz ? 1 : 2 };
  return { porta: { x: p.x, z: p.z, lado: e.lado }, gatilho: gat, chegada: { x: p.x + p.dx * 1.5, z: p.z + p.dz * 1.5, direcao: e.lado } };
}

// ---- Terreno: praça de calçada, trilha N–S, estrada até o escrivão, ramais até as portas, musgo ----
const caminhos = [[24, 0, 24, 17], [24, 31, 24, 48], [8, 24, 17, 24], [31, 24, 37, 24], [14, 13.5, 19, 18], [31.5, 13.5, 28, 18], [35.5, 13.5, 30, 18],
  [11.5, 17, 16, 19], [14, 35.5, 20, 31], [30, 38.5, 26, 33], [34.5, 37, 28, 31], [19, 39.5, 23, 37]];
const planta = [];
for (let z = 0; z < N; z++) { let row = ''; for (let x = 0; x < N; x++) {
  const cx = x + 0.5, cz = z + 0.5, r = Math.hypot(cx - C.x, cz - C.z) - (ruido(cx * 0.5, cz * 0.5) - 0.5) * 1.6;
  let t = 'g';
  if (caminhos.some(([a, b, c, d]) => distSeg(cx, cz, a, b, c, d) - (ruido(cx * 0.4 + 9, cz * 0.4) - 0.5) < 1.3)) t = 't';
  if (r < 7.4) t = 'c';
  else if (r < 8.6 && t !== 't') t = ruido(cx * 0.8, cz * 0.8) > 0.5 ? 'c' : 'g';
  if (t === 'g' && ruido(cx * 0.25 + 40, cz * 0.25) > 0.66) t = 'm';
  row += t; } planta.push(row); }

// ---- Objetos do kit ----
const objetos = []; const add = (o) => { objetos.push(o); return o; };
for (const e of EDIFICIOS) { const c = centro(e.r); add({ id: e.id, tipo: 'casa', x: c.x, z: c.z, w: c.w, d: c.d, rot: 0, telhado: e.telhado, janelas: e.janelas, chamine: e.chamine, seed: e.seed, ...(e.interior ? { lado: e.lado } : {}), ...(e.deco ? { deco: e.deco } : {}), ...(e.estilo ? { estilo: e.estilo } : {}), ...(e.fechada ? { fechada: true } : {}) }); }
add({ id: 'poco', tipo: 'poco', x: 24, z: 24, rot: 0, seed: 4 });
for (const [i, [x, z]] of [[19, 19], [29, 19], [19, 29], [29, 29]].entries()) add({ id: `lanterna_${i}`, tipo: 'lanterna', x, z, rot: 0, seed: i });
for (const [x, z] of [[24, 6], [24, 42], [6, 24]]) add({ id: `lanterna_c${x}_${z}`, tipo: 'lanterna', x, z, rot: 0, seed: 1 });
// pátio de treino do Torvan (oeste): cerca em U aberta para a praça + dois bonecos (posições do M1, usadas pelos testes)
for (const [i, [x0, z0, x1, z1]] of [[7, 20.5, 19, 20.5], [7, 27.5, 19, 27.5], [7, 20.5, 7, 27.5]].entries()) add({ id: `cerca_treino_${i + 1}`, tipo: 'cerca', x0, z0, x1, z1, rot: 0, seed: 1 });
add({ id: 'enemy_boneco_alvo', tipo: 'inimigo', x: 11.5, z: 24, rot: 0, seed: 1 });
add({ id: 'enemy_boneco_golpe', tipo: 'inimigo', x: 16.5, z: 24, rot: 0, seed: 1 });
// adereços: barris da taverna, carga da forja, caixotes do posto
for (const [i, x, z] of [[1, 35.6, 8], [2, 35.6, 9.1], [3, 35.4, 17.2]]) add({ id: `barril_${i}`, tipo: 'barril', x, z, rot: 0, seed: i });
for (const [i, x, z] of [[1, 41.6, 17.4], [2, 36.6, 27.6], [3, 37.6, 27.9]]) add({ id: `caixote_${i}`, tipo: 'caixote', x, z, rot: 17 * i, seed: i });
const kit = JSON.parse(readFileSync(join(RAIZ, 'data/config/cfg_kit.json'), 'utf8'));
const esquema = JSON.parse(readFileSync(join(RAIZ, 'data/schemas/mapa.schema.json'), 'utf8')), tiposEsquema = esquema.properties.objetos.items.properties.tipo.enum;
const noKit = (p) => !!kit.pegadas[p.tipo] && (!tiposEsquema || tiposEsquema.includes(p.tipo));
for (const p of PROPS_VILA.filter(noKit)) add({ ...p, rot: 0, seed: 1 });

// ---- Vegetação por semente, só onde não atrapalha: fora da praça, de caminhos, prédios (+ folga), portas, pátio e saídas ----
const LIVRE = [...EDIFICIOS.map((e) => [e.r[0] - 1.5, e.r[1] - 1.5, e.r[2] + 2.5, e.r[3] + 2.5]),
  [6, 19.5, 20, 28.5], [20, 0, 28, 4], [20, 44, 28, 48], [24, 34, 28, 38] /* árvore queimada */, [31, 38, 35, 44] /* ruína */, [7, 41, 16, 44] /* muro */, [42.5, 13, 48, 21] /* linha de visão da câmera (+x,+z) até a forja_brasa */];
const tipoChao = (x, z) => planta[Math.min(N - 1, Math.floor(z))][Math.min(N - 1, Math.floor(x))];
const proibido = (x, z, r) => LIVRE.some(([a, b, c, d]) => x > a - r && x < c + r && z > b - r && z < d + r)
  || objetos.some((o) => o.tipo !== 'casa' && o.x !== undefined && Math.hypot(o.x - x, o.z - z) < 1.8 + r);
let arv = 0, tent = 0;
while (arv < 52 && tent++ < 6000) { const x = 1 + rnd() * 46, z = 1 + rnd() * 46; if (Math.hypot(x - C.x, z - C.z) < 12 || tipoChao(x, z) !== 'g' && tipoChao(x, z) !== 'm' || proibido(x, z, 1.2)) continue;
  const pinheiro = rnd() < 0.3; add({ id: `${pinheiro ? 'pinheiro' : 'arvore'}_${arv}`, tipo: pinheiro ? 'pinheiro' : 'arvore', x: +x.toFixed(2), z: +z.toFixed(2), rot: Math.floor(rnd() * 360), escala: +(0.85 + rnd() * 0.5).toFixed(2), seed: Math.floor(rnd() * 1000) }); arv++; }
let arb = 0; tent = 0;
while (arb < 36 && tent++ < 6000) { const x = 1 + rnd() * 46, z = 1 + rnd() * 46; if (Math.hypot(x - C.x, z - C.z) < 9.5 || tipoChao(x, z) !== 'g' && tipoChao(x, z) !== 'm' || proibido(x, z, 0.5)) continue;
  const pedra = rnd() < 0.35; add({ id: `${pedra ? 'pedra' : 'arbusto'}_${arb}`, tipo: pedra ? 'pedra' : 'arbusto', x: +x.toFixed(2), z: +z.toFixed(2), rot: Math.floor(rnd() * 360), escala: +(0.7 + rnd() * 0.7).toFixed(2), seed: Math.floor(rnd() * 1000) }); arb++; }

// ---- Portais: portas dos 5 interiores + saídas norte/sul (inativas até a v0.1.3) ----
const idInterior = (e) => `map_${e.id}_interior`;
const portais = [], edificios = [];
for (const e of EDIFICIOS) {
  const c = centro(e.r), p = porta(e);
  edificios.push({ id: e.id, tipo: e.tipo, x: c.x, z: c.z, w: c.w, d: c.d, porta: p.porta, interior: e.interior ? idInterior(e) : null });
  if (e.interior) portais.push({ id: `porta_${e.id}`, ...p.gatilho, destino: { mapa: idInterior(e), portal: 'saida' }, chegada: p.chegada, ativo: true });
}
portais.push({ id: 'saida_norte', x: 24, z: 0.5, w: 4, d: 1, destino: { mapa: 'map_campos_norte', portal: 'saida_vila' }, chegada: { x: 24, z: 2.5, direcao: 's' }, ativo: false });
portais.push({ id: 'saida_sul', x: 24, z: 47.5, w: 4, d: 1, destino: { mapa: 'map_campos_sul', portal: 'saida_vila' }, chegada: { x: 24, z: 45.5, direcao: 'n' }, ativo: false });

const poiDe = (id, tipo, x, z) => ({ id, tipo, x, z, nome_txt: `txt_poi_${id}` });
const portaDe = (id) => edificios.find((e) => e.id === id).porta;
const pois = [
  poiDe('poco', 'poco', 24, 24), poiDe('portico', 'portico', 24, 19.5), poiDe('quadro_avisos', 'quadro_avisos', 28.5, 21),
  ...['casa_maren', 'taverna', 'forja', 'posto_escrivao'].map((id) => poiDe(id, 'edificio', portaDe(id).x, portaDe(id).z)),
  poiDe('patio_torvan', 'patio', 13, 24), poiDe('saida_norte', 'saida', 24, 0.5), poiDe('saida_sul', 'saida', 24, 47.5),
];

const vila = {
  id: 'map_baixo_orvalho', versao: 2, nome_txt: 'txt_map_baixo_orvalho_nome', origem: ORIGEM, tipo_mapa: 'exterior', estado: 'dia',
  tamanho: [N, N], legenda: { g: 'grama', t: 'terra', c: 'calcada', m: 'musgo' }, planta, objetos, edificios, portais, pois,
  inicio_jogador: { tile: [24, 28], direcao: 's' }, limites_camera: [0, 0, N, N],
};
salvar('data/maps/map_baixo_orvalho.json', vila);

// ---- Interiores: um cômodo; saída na borda sul (gatilho 2×1), chegada 2 tiles acima; mobília só com tipos do kit (o resto: props_vila_v012.md) ----
for (const e of EDIFICIOS.filter((x) => x.interior)) {
  const [L, A] = e.interior, sala = SALAS[e.id], ch = sala.piso === 'terra' ? 't' : 'c', vilaPortal = `porta_${e.id}`;
  salvar(`data/maps/${idInterior(e)}.json`, {
    id: idInterior(e), versao: 1, nome_txt: `txt_${idInterior(e)}_nome`, origem: ORIGEM, tipo_mapa: 'interior',
    tamanho: [L, A], legenda: { [ch]: sala.piso }, planta: Array.from({ length: A }, () => ch.repeat(L)),
    objetos: sala.obj.map(([tipo, x, z, w, d, extra], i) => ({ id: `${tipo}_${i + 1}`, tipo, x, z, ...(w ? { w, d } : {}), rot: 0, seed: i + 1, ...(extra ?? {}) })).filter(noKit),
    portais: [{ id: 'saida', x: L / 2, z: A - 0.5, w: 2, d: 1, destino: { mapa: 'map_baixo_orvalho', portal: vilaPortal }, chegada: { x: L / 2, z: A - 2.5, direcao: 'n' }, ativo: true }],
    sala: { altura_parede: 3, parede: sala.parede, piso: sala.piso }, ambiente: { cor_luz: sala.luz[0], intensidade: sala.luz[1], fundo: sala.luz[2] },
    inicio_jogador: { tile: [L / 2, Math.floor(A / 2)], direcao: 'n' }, limites_camera: [0, 0, L, A],
  });
}

// ---- Zonas: a vila inteira é segura (D-038); encontros só fora da vila (campos, v0.1.3) ----
salvar('data/exploracao/z_enc_baixo_orvalho.json', {
  id: 'z_enc_baixo_orvalho', versao: 2,
  nota: 'Vila de Baixo Orvalho: 100 % segura (D-038/D-041). Sem zonas de encontro; os encontros voltam nos campos fora da vila (v0.1.3). Interiores não têm arquivo de zonas.',
  mapa: 'map_baixo_orvalho', ligado: false, tiles_por_passo: 1, passos_minimos: 12, passos_carencia_pos_batalha: 8, taxa_por_passo: 0.08,
  zonas_seguras: [{ id: 'z_seguro_vila', ret: [0, 0, N - 1, N - 1] }], zonas_encontro: [],
});
console.log(`vila: ${objetos.length} objetos (${arv} árvores, ${arb} arbustos/pedras), ${edificios.length} edifícios, ${portais.length} portais, ${pois.length} pois; ${EDIFICIOS.filter((x) => x.interior).length} interiores`);
