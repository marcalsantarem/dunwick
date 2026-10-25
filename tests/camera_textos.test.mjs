// M1-14c: câmera nunca mostra fora da sala; zona morta, antecipação e suavização. + textos por ID.
import test from 'node:test';
import assert from 'node:assert/strict';
import { novoMundo, entrada, rodar, colocar } from './_util.mjs';
import { criarCameraJogo } from '../src/jogo/camera_jogo.js';
import { criarTextos } from '../src/jogo/textos.js';
import { carregarDados } from './_util.mjs';

test('os 4 cantos da sala: a área visível no chão nunca sai dos limites', () => {
  const { mundo } = novoMundo(); const { camera: c } = mundo;
  for (const [x, z] of [[1.5, 1.5], [46.5, 1.5], [1.5, 30.5], [46.5, 30.5], [24, 16]]) {
    colocar(mundo, x, z); rodar(mundo, 120, entrada());
    assert.ok(c.x - c.meioX >= -1e-6 && c.x + c.meioX <= 48 + 1e-6, `x ${c.x} em (${x}, ${z})`);
    assert.ok(c.z - c.meioZ >= -1e-6 && c.z + c.meioZ <= 32 + 1e-6, `z ${c.z} em (${x}, ${z})`);
  }
});

test('área visível = 20 × 11,25 tiles na imagem (≈ 19,6 tiles de profundidade no chão a 35°)', () => {
  const { dados, mundo } = novoMundo();
  assert.equal(mundo.camera.meioX * 2, dados.config.jogo.camera.area_tiles[0]);
  assert.ok(Math.abs(mundo.camera.meioZ * 2 - 11.25 / Math.sin((35 * Math.PI) / 180)) < 1e-9);
});

test('zona morta: movimentos pequenos do herói não mexem a câmera; grandes mexem', () => {
  const { dados } = novoMundo(); const cam = criarCameraJogo(dados.config.jogo.camera, [0, 0, 48, 32]);
  const h = { x: 24, z: 16, vx: 0, vz: 0, altura: 0 }; cam.encaixar(h);
  h.x += 0.2; for (let i = 0; i < 120; i++) cam.passo(h, 6, 1 / 60); assert.ok(Math.abs(cam.x - 24) < 1e-6, `moveu na zona morta: ${cam.x}`);
  h.x += 3; for (let i = 0; i < 240; i++) cam.passo(h, 6, 1 / 60); assert.ok(Math.abs(cam.x - (24 + 3.2 - 0.25)) < 0.05, `x = ${cam.x}`);
});

test('antecipação: correndo, a câmera olha ~1 tile à frente (valor dos dados)', () => {
  const { mundo } = novoMundo(); colocar(mundo, 4.5, 7.5);
  rodar(mundo, 60, entrada({ x: 1, correr: true }));
  assert.ok(mundo.camera.x > mundo.heroi.x - 1.4 && mundo.camera.x < mundo.heroi.x + 0.5, `camera ${mundo.camera.x} herói ${mundo.heroi.x}`);
});

test('textos: variáveis inteiras, ID ausente é registrado (nunca concatenar)', () => {
  const t = criarTextos(carregarDados().textos['pt-BR']);
  assert.equal(t('ui_debug_contador', { acertos: 3, dano: 40 }), 'alvo de treino: acertos 3  dano 40');
  assert.equal(t('txt_nao_existe'), '⟦txt_nao_existe⟧'); assert.ok(t.faltando.has('txt_nao_existe'));
  assert.equal(t('ui_debug_contador'), 'alvo de treino: acertos {acertos}  dano {dano}');
});
