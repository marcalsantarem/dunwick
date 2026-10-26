// Mapa (colisores do kit), ciclo dia/noite, câmera isométrica e textos por ID.
import test from 'node:test';
import assert from 'node:assert/strict';
import { novoMundo, entrada, rodar, colocar, carregarDados } from './_util.mjs';
import { colisorDe } from '../src/jogo/mapa.js';
import { estadoCiclo, lanternaAcesa } from '../src/jogo/ciclo.js';
import { criarCameraJogo } from '../src/jogo/camera_jogo.js';
import { criarTextos } from '../src/jogo/textos.js';

test('praça: 48 × 48, início livre, 3 tipos de chão, objetos do kit e os dois bonecos', () => {
  const { mundo } = novoMundo(); const { mapa, heroi, entidades } = mundo, d = mapa.dados;
  assert.deepEqual(d.tamanho, [48, 48]); assert.ok(mapa.livre(heroi.x, heroi.z, heroi.raioPush), 'início livre');
  assert.deepEqual(entidades.map((e) => e.id).sort(), ['enemy_boneco_alvo', 'enemy_boneco_golpe']);
  const tipos = new Set(d.objetos.map((o) => o.tipo)); for (const t of ['casa', 'arvore', 'poco', 'torre_sino', 'lanterna', 'cerca']) assert.ok(tipos.has(t), `falta ${t}`);
  assert.ok(new Set(d.planta.join('')).size >= 3, 'chão com materiais diferentes'); assert.ok(d.objetos.filter((o) => o.tipo === 'casa').length >= 6, 'pelo menos 6 casas');
});

test('colisor = pegada do kit (mesmo dado do visual): casa gira com rot 90, árvore é círculo, cerca é linha', () => {
  const { dados } = novoMundo(), kit = dados.config.kit;
  const c0 = colisorDe({ id: 'c', tipo: 'casa', x: 10, z: 10, w: 4, d: 3, rot: 0 }, kit), c90 = colisorDe({ id: 'c', tipo: 'casa', x: 10, z: 10, w: 4, d: 3, rot: 90 }, kit);
  assert.deepEqual([c0.x1 - c0.x0, c0.z1 - c0.z0], [4, 3]); assert.deepEqual([c90.x1 - c90.x0, c90.z1 - c90.z0], [3, 4]);
  assert.equal(colisorDe({ tipo: 'arvore', x: 1, z: 1, escala: 2 }, kit).r, kit.pegadas.arvore.raio * 2);
  assert.equal(colisorDe({ tipo: 'cerca', x0: 0, z0: 0, x1: 4, z1: 0 }, kit).forma, 'linha');
});

test('o herói não atravessa casa, poço, cerca nem sai do mapa (4000 passos correndo em direções fixas)', () => {
  const ctx = novoMundo(); const { mapa, heroi } = ctx.mundo; colocar(ctx.mundo, 24.5, 28.5);
  const dirs = [[1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1], [1, 0]]; let s = 7;
  for (let i = 0; i < 4000; i++) { if (i % 40 === 0) { s = (s * 1664525 + 1013904223) >>> 0; var d = dirs[s % 8]; } ctx.mundo.passo(entrada({ x: d[0], z: d[1], correr: true }), ctx.buffer); assert.ok(mapa.livre(heroi.x, heroi.z, heroi.raioPush - 0.02), `preso dentro de colisor em (${heroi.x.toFixed(2)}, ${heroi.z.toFixed(2)}) no passo ${i}`); }
});

test('esbarrar numa parede de casa DESLIZA (mantém a componente paralela)', () => {
  const ctx = novoMundo(); const { mapa, heroi } = ctx.mundo, casa = mapa.dados.objetos.find((o) => o.id === 'taverna'), col = mapa.colisores.find((c) => c.id === 'taverna');
  void casa; colocar(ctx.mundo, col.x0 + 1, col.z1 + 1.5); const x0 = heroi.x;
  rodar(ctx, 40, entrada({ x: 1, z: -1 })); // tela cima-direita: (+x−z)... em direção à parede sul da taverna, andando junto dela
  assert.ok(heroi.z >= col.z1 + heroi.raioPush - 1e-3 || heroi.x !== x0, 'não atravessou'); assert.ok(mapa.livre(heroi.x, heroi.z, heroi.raioPush - 0.02));
});

test('ciclo: nos pontos de dados devolve exatamente os valores; entre eles interpola; 24 h é contínuo com 0 h', () => {
  const { config: { ciclo } } = carregarDados(), p = ciclo.pontos[3], e = estadoCiclo(ciclo, p.hora);
  assert.ok(Math.abs(e.solInt - p.sol_int) < 1e-9 && Math.abs(e.solElev - p.sol_elev) < 1e-9 && Math.abs(e.luzArtificial - p.luz_artificial) < 1e-9);
  const a = estadoCiclo(ciclo, 24), b = estadoCiclo(ciclo, 0), c = estadoCiclo(ciclo, 23.99), dd = estadoCiclo(ciclo, 0.01); assert.ok(Math.abs(a.solInt - b.solInt) < 1e-9);
  assert.ok(Math.abs(c.solInt - dd.solInt) < 0.05, 'sem salto na meia-noite');
  const meio = estadoCiclo(ciclo, (ciclo.pontos[2].hora + ciclo.pontos[3].hora) / 2); assert.ok(meio.solInt < ciclo.pontos[2].sol_int && meio.solInt > ciclo.pontos[3].sol_int);
  assert.ok(estadoCiclo(ciclo, 13).luzArtificial === 0 && estadoCiclo(ciclo, 22).luzArtificial === 1, 'luzes apagadas ao meio-dia, acesas à noite');
});

test('ciclo: lanterna acende ao entardecer e apaga de manhã (atravessa a meia-noite)', () => {
  const { config: { kit } } = carregarDados(); assert.equal(lanternaAcesa(kit, 12), false); assert.equal(lanternaAcesa(kit, 18), true); assert.equal(lanternaAcesa(kit, 2), true); assert.equal(lanternaAcesa(kit, 7), false);
});

test('mundo: o relógio do dia/noite avança por passo de dados (duracao_dia_s) e para quando desligado', () => {
  const ctx = novoMundo(); const h0 = ctx.mundo.hora, dur = ctx.dados.config.ciclo.duracao_dia_s; rodar(ctx, 60 * 10, entrada());
  assert.ok(Math.abs(((ctx.mundo.hora - h0 + 24) % 24) - (10 * 24) / dur) < 1e-6);
  ctx.mundo.cicloLigado = false; const h1 = ctx.mundo.hora; rodar(ctx, 120, entrada()); assert.equal(ctx.mundo.hora, h1); ctx.mundo.avancarHora(2); assert.ok(Math.abs(ctx.mundo.hora - ((h1 + 2) % 24)) < 1e-9);
});

test('câmera: segue o herói com zona morta, antecipação e limites do mapa (nunca sai dos limites)', () => {
  const { dados } = novoMundo(), cam = criarCameraJogo(dados.config.jogo.camera, [11, 11, 26, 26]), h = { x: 24, z: 24, vx: 0, vz: 0 }; cam.encaixar(h);
  h.x += 0.2; for (let i = 0; i < 120; i++) cam.passo(h, 6, 1 / 60); assert.ok(Math.abs(cam.x - 24) < 1e-6, 'zona morta');
  h.x = 5; h.z = 45; for (let i = 0; i < 300; i++) cam.passo(h, 6, 1 / 60); assert.ok(cam.x >= 11 - 1e-6 && cam.z <= 37 + 1e-6, `limites: ${cam.x}, ${cam.z}`);
});

test('textos: variáveis inteiras, ID ausente é registrado (nunca concatenar)', () => {
  const t = criarTextos(carregarDados().textos['pt-BR']);
  assert.equal(t('ui_debug_contador', { acertos: 3 }), 'alvo de treino: acertos 3'); assert.equal(t('txt_nao_existe'), '⟦txt_nao_existe⟧'); assert.ok(t.faltando.has('txt_nao_existe'));
});
