// M1-14e / gameplay.md §11.1-1: o mapa vem de dados e é coerente com o desenho do 06 (metricas.md §8).
import test from 'node:test';
import assert from 'node:assert/strict';
import { novoMundo } from './_util.mjs';

test('map_sala_teste: 48 × 32, início em (4, 7), bonecos em (11, 4) e (16, 4)', () => {
  const { mundo } = novoMundo(); const { mapa, entidades, heroi } = mundo;
  assert.equal(mapa.largura, 48); assert.equal(mapa.altura, 32);
  assert.deepEqual([Math.floor(heroi.x), Math.floor(heroi.z)], [4, 7]);
  const por = Object.fromEntries(entidades.map((e) => [e.id, e]));
  assert.deepEqual([Math.floor(por.enemy_boneco_alvo.x), Math.floor(por.enemy_boneco_alvo.z)], [11, 4]);
  assert.deepEqual([Math.floor(por.enemy_boneco_golpe.x), Math.floor(por.enemy_boneco_golpe.z)], [16, 4]);
  assert.equal(por.enemy_boneco_golpe.x - por.enemy_boneco_alvo.x, 5, 'bonecos a 5 tiles um do outro');
});

test('alturas: rampa 0 → 1 (x 21–24), plataforma 1, escada 1 → 0 (z 9–11), pátio e campo 0', () => {
  const { mapa } = novoMundo().mundo;
  const perto = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} ≠ ${b}`);
  perto(mapa.alturaEm(21, 4), 0); perto(mapa.alturaEm(22.5, 4), 0.5); perto(mapa.alturaEm(24, 4), 1);
  perto(mapa.alturaEm(30, 4), 1); perto(mapa.alturaEm(34, 9), 1); perto(mapa.alturaEm(34, 10), 0.5); perto(mapa.alturaEm(34, 11), 0);
  perto(mapa.alturaEm(10, 10), 0); perto(mapa.alturaEm(25, 12), 0);
});

test('zonas do M1 existem e estão nos lugares da planta', () => {
  const { mapa } = novoMundo().mundo;
  assert.deepEqual(mapa.zonaDe(10, 5), ['z_campo']);
  assert.ok(mapa.zonaDe(14.5, 9.5).includes('z_parede_solta') && mapa.solidoTile(14, 9));
  assert.ok(mapa.zonaDe(22, 4).includes('z_rampa'));
  assert.ok(mapa.zonaDe(30, 4).includes('z_plataforma'));
  assert.ok(mapa.zonaDe(34, 9.5).includes('z_escada'));
  assert.ok(mapa.zonaDe(30, 12).includes('z_patio'));
  assert.ok(mapa.zonaDe(38, 23).includes('z_arena'));
  assert.ok(mapa.solidoTile(37, 20) && mapa.solidoTile(34, 21) && mapa.solidoTile(40, 25), 'meia-parede e pilares da arena');
});

test('todo tile andável é alcançável do início e volta a ele a pé (impossível ficar preso)', () => {
  const { mundo } = novoMundo(), { mapa } = mundo; const L = mapa.largura, A = mapa.altura, idx = (x, z) => z * L + x;
  const [sx, sz] = mapa.dados.inicio_jogador.tile, vistos = new Set([idx(sx, sz)]), fila = [[sx, sz]];
  for (let k = 0; k < fila.length; k++) for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const x = fila[k][0] + dx, z = fila[k][1] + dz;
    if (mapa.caminhavel(x, z) && !vistos.has(idx(x, z))) { vistos.add(idx(x, z)); fila.push([x, z]); }
  }
  let andaveis = 0; for (let z = 0; z < A; z++) for (let x = 0; x < L; x++) if (mapa.caminhavel(x, z)) andaveis++;
  assert.equal(vistos.size, andaveis, `${andaveis - vistos.size} tiles andáveis inalcançáveis`);
  // O script de referência do 06 (metricas.md §8.5) conta 740: são os 742 andáveis menos os 2 tiles ocupados pelos bonecos.
  assert.equal(andaveis - mundo.entidades.length, 740);
});

test('largura do corredor e da porta: 3 tiles (cabe o herói de diâmetro 0,7)', () => {
  const { mapa, heroi } = novoMundo().mundo;
  for (const z of [22, 23, 24]) assert.ok(mapa.caminhavel(29, z), `porta (29, ${z})`);
  assert.ok(mapa.solidoTile(29, 21) && mapa.solidoTile(29, 25));
  for (const x of [5, 6, 7]) assert.ok(mapa.caminhavel(x, 18));
  assert.ok(3 > heroi.raioPush * 2);
});
