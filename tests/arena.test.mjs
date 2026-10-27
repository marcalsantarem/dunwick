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
  for (const lado of ['grupo', 'inimigos']) for (const [x, z] of dados.config.batalha.posicoes[lado]) { assert.ok(Math.abs(x) <= 4.6 && z >= -2 && z <= 2, `${lado} (${x}; ${z})`); }
  assert.ok(cen.camera.arte[0] === 640);
});
