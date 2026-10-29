// Arena da batalha (src/motor/arena.js): regras de ouro do 07 sobre a faixa de combate e o mapa sintético do palco.
import test from 'node:test';
import assert from 'node:assert/strict';
import { carregarDados } from './_util.mjs';
import { montarMapaArena, pecasNaFaixaDeCombate, cenarioDoEncontro } from '../src/motor/arena.js';

test('cen_praca: faixa de combate limpa (nada do kit em |x| ≤ 5, z de −5,5 a +6, exceto lanterna nos flancos)', () => {
  const cen = carregarDados().cenarios.cen_praca;
  assert.deepEqual(pecasNaFaixaDeCombate(cen).map((o) => o.id), []);
});

test('mapa sintético: calçada no centro, musgo na borda, planta com o tamanho do palco, peças deslocadas pela origem', () => {
  const cen = carregarDados().cenarios.cen_praca, m = montarMapaArena(cen), [L, A] = cen.palco.tamanho, [ox, oz] = cen.palco.origem;
  assert.equal(m.planta.length, A); assert.ok(m.planta.every((l) => l.length === L));
  assert.equal(m.planta[Math.floor(oz)][Math.floor(ox)], 'c');
  assert.ok(m.planta.some((l) => l.includes('m')), 'tem borda de musgo');
  const casa = m.objetos.find((o) => o.id === 'casa_a'); assert.equal(casa.x, -6 + ox); assert.equal(casa.z, -8.5 + oz);
  assert.ok(m.objetos.every((o) => o.x > 0 && o.z > 0 && o.x < L && o.z < A), 'tudo dentro do palco');
});

test('encontros do M1 sem cenário próprio caem no cenário padrão', () => {
  const dados = carregarDados(); assert.equal(cenarioDoEncontro(dados, 'enc_misto_1').id, 'cen_praca');
});

test('os 6 slots do cfg_batalha ficam na faixa de combate do cenário', () => {
  const dados = carregarDados(), cen = dados.cenarios.cen_praca;
  for (const lado of ['grupo', 'inimigos']) for (const [x, z] of dados.config.batalha.posicoes[lado]) { assert.ok(Math.abs(x) <= 6 && z >= -2.5 && z <= 2.5, `${lado} (${x}; ${z})`); }
  assert.ok(cen.camera.arte[0] === 640);
});

test('enc_misto_1 (Lobo + Slime): inimigos afastados ≥ 3 tiles em x (anéis e sprites não se tocam); Edric e Grace afastados ≥ 2 tiles', () => {
  const P = carregarDados().config.batalha.posicoes;
  assert.ok(Math.abs(P.inimigos[0][0] - P.inimigos[1][0]) >= 3, 'Lobo × Slime'); assert.ok(Math.hypot(P.grupo[0][0] - P.grupo[1][0], P.grupo[0][1] - P.grupo[1][1]) >= 2.5, 'Edric × Grace');
  const raioMarca = carregarDados().cenarios.cen_praca.palco.marca_raio;
  for (const lado of ['grupo', 'inimigos']) for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) assert.ok(Math.hypot(P[lado][i][0] - P[lado][j][0], P[lado][i][1] - P[lado][j][1]) >= 2 * raioMarca + 0.4, `anéis ${lado} ${i + 1}×${j + 1} não se sobrepõem`);
});

test('slots sem sobreposição: mesmo lado separados ≥ 1,5 tile em x; lados opostos ≥ 4 tiles; marcas dentro do palco', () => {
  const P = carregarDados().config.batalha.posicoes;
  for (const lado of ['grupo', 'inimigos']) for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) assert.ok(Math.abs(P[lado][i][0] - P[lado][j][0]) >= 1.5 || Math.abs(P[lado][i][1] - P[lado][j][1]) >= 3.2, `${lado} ${i + 1}×${j + 1}`);
  for (const [gx] of P.grupo) for (const [ix] of P.inimigos) assert.ok(gx - ix >= 4, 'grupo e inimigos separados');
});
