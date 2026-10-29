// Minimapa (D-041): a transformação mundo → minimapa gira com a tela (cima do minimapa = cima da tela da câmera isométrica).
import test from 'node:test';
import assert from 'node:assert/strict';
import { mundoParaMini, miniParaMundo, anguloSeta, maisProximo } from '../src/ui/minimapa_geo.js';
import { carregarDados } from './_util.mjs';

const G = carregarDados().config.jogo.camera.giro_graus, g = (G * Math.PI) / 180;
const P = { cx: 20, cz: 30, giroGraus: G, escala: 4, meio: 80 };
const perto = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} ≠ ${b}`);

test('"cima da tela" no chão vai para cima no minimapa; "direita da tela" vai para a direita', () => {
  // a câmera fica em (sen g, cos g) do alvo e olha para o lado oposto: cima da tela no chão = (−sen g, −cos g); direita = (cos g, −sen g)
  const cima = mundoParaMini(P.cx - Math.sin(g) * 5, P.cz - Math.cos(g) * 5, P), dir = mundoParaMini(P.cx + Math.cos(g) * 5, P.cz - Math.sin(g) * 5, P);
  perto(cima.x, P.meio); perto(cima.y, P.meio - 5 * P.escala);
  perto(dir.x, P.meio + 5 * P.escala); perto(dir.y, P.meio);
});

test('centro vai ao meio, escala em px por tile, e a inversa devolve o ponto do mundo', () => {
  const c = mundoParaMini(P.cx, P.cz, P); perto(c.x, P.meio); perto(c.y, P.meio);
  for (const [x, z] of [[0, 0], [47, 3], [21.5, 29.25], [10, 44]]) { const m = mundoParaMini(x, z, P), w = miniParaMundo(m.x, m.y, P); perto(w.x, x, 1e-9); perto(w.z, z, 1e-9); }
  const um = mundoParaMini(P.cx + 1, P.cz, P); perto(Math.hypot(um.x - P.meio, um.y - P.meio), P.escala); // 1 tile = escala px em qualquer direção
});

test('seta do herói: olhar para "cima da tela" aponta para cima (−90°) no minimapa; giro 0 não muda nada', () => {
  const faceCima = Math.atan2(-Math.cos(g), -Math.sin(g)), a = anguloSeta(faceCima, G);
  perto(Math.cos(a), 0); perto(Math.sin(a), -1);
  perto(anguloSeta(1.234, 0), 1.234);
  const p0 = { ...P, giroGraus: 0 }, m = mundoParaMini(P.cx + 2, P.cz + 3, p0); perto(m.x, P.meio + 8); perto(m.y, P.meio + 12);
});

test('ponto de interesse mais próximo dentro do raio', () => {
  const pois = [{ id: 'a', x: 1, z: 1 }, { id: 'b', x: 5, z: 5 }];
  assert.equal(maisProximo(pois, 4.5, 4.6, 1)?.id, 'b'); assert.equal(maisProximo(pois, 3, 3, 1), null);
});
