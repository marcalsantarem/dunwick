// Preferências (src/plataforma/preferencias.js): padrão, validação, persistência e tolerância a armazenamento quebrado.
import test from 'node:test';
import assert from 'node:assert/strict';
import { criarPreferencias, PADRAO } from '../src/plataforma/preferencias.js';

const memoria = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v), m }; };

test('sem nada salvo: valores padrão', () => { assert.deepEqual(criarPreferencias(memoria()).todas(), PADRAO); });

test('definir valida, persiste e a próxima sessão lê de volta', () => {
  const arm = memoria(), p = criarPreferencias(arm);
  assert.equal(p.definir('velocidade_batalha', 2), true); assert.equal(p.definir('reduzir_movimento', true), true);
  assert.equal(p.definir('velocidade_batalha', 3), false, 'valor inválido recusado'); assert.equal(p.definir('volume', 1.5), false); assert.equal(p.definir('nao_existe', 1), false);
  const q = criarPreferencias(arm); assert.equal(q.obter('velocidade_batalha'), 2); assert.equal(q.obter('reduzir_movimento'), true); assert.equal(q.obter('volume'), PADRAO.volume);
});

test('ouvintes recebem só mudanças reais', () => {
  const p = criarPreferencias(memoria()), vistos = []; const cancelar = p.aoMudar((k, v) => vistos.push([k, v]));
  p.definir('volume', 0.5); p.definir('volume', 0.5); cancelar(); p.definir('volume', 0.2);
  assert.deepEqual(vistos, [['volume', 0.5]]);
});

test('armazenamento ilegível, de versão antiga ou que lança: cai no padrão sem quebrar', () => {
  const ruim = { getItem: () => '{não é json', setItem: () => { throw new Error('cota'); } };
  const p = criarPreferencias(ruim); assert.deepEqual(p.todas(), PADRAO); assert.equal(p.definir('volume', 0.3), true, 'vale na sessão mesmo sem gravar');
  const antigo = { getItem: () => JSON.stringify({ versao: 0, valores: { volume: 0.1 } }), setItem() {} }; assert.equal(criarPreferencias(antigo).obter('volume'), PADRAO.volume);
  assert.deepEqual(criarPreferencias(null).todas(), PADRAO);
});

test('valores inválidos gravados são ignorados campo a campo', () => {
  const arm = { getItem: () => JSON.stringify({ versao: 1, valores: { volume: 7, velocidade_batalha: 2 } }), setItem() {} }, p = criarPreferencias(arm);
  assert.equal(p.obter('volume'), PADRAO.volume); assert.equal(p.obter('velocidade_batalha'), 2);
});
