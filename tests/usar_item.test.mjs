// Usar consumível FORA de batalha (menu, D-040, 06 §12.6: EQ9–EQ12) pelo estado do jogo.
import test from 'node:test';
import assert from 'node:assert/strict';
import { carregarDados } from './_util.mjs';
import { criarEventos } from '../src/jogo/eventos.js';
import { criarEstadoJogo } from '../src/jogo/estado_jogo.js';

const novo = () => { const d = carregarDados(), ev = criarEventos(), reg = []; for (const n of ['item_usado', 'inventario_mudou']) ev.em(n, (x) => reg.push([n, x])); return { d, reg, j: criarEstadoJogo(d, ev) }; };

test('EQ9: poção em 60/100 → vida 100, 1 poção a menos; emite inventario_mudou e item_usado', () => {
  const { j, reg } = novo(); j.grupo.hero_edric.vida = 60;
  const r = j.usarItem('hero_edric', 'item_pocao_ervas');
  assert.deepEqual([r.ok, r.efeito, r.valor, r.vida, r.mana], [true, 'cura', 40, 100, 14]);
  assert.equal(j.grupo.hero_edric.vida, 100); assert.equal(j.inventario.item_pocao_ervas, 1);
  assert.deepEqual(reg.map(([n]) => n), ['inventario_mudou', 'item_usado']);
  assert.deepEqual(reg[1][1], { heroi: 'hero_edric', item: 'item_pocao_ervas', efeito: 'cura', valor: 40, vida: 100, mana: 14 });
});
test('EQ10: poção com vida cheia executa, gasta 1 e cura 0 (D-040)', () => {
  const { j } = novo(); const r = j.usarItem('hero_grace', 'item_pocao_ervas');
  assert.deepEqual([r.ok, r.valor, r.bruto, r.vida], [true, 0, 40, 70]); assert.equal(j.inventario.item_pocao_ervas, 1);
});
test('EQ11: tônico (60) em 70/100 → cura 30 (limitada ao que falta) e o tônico some da mochila', () => {
  const { j } = novo(); j.adicionarItem('item_tonico_vigor'); j.grupo.hero_edric.vida = 70;
  const r = j.usarItem('hero_edric', 'item_tonico_vigor'); assert.deepEqual([r.valor, r.bruto, r.vida], [30, 60, 100]); assert.equal(j.inventario.item_tonico_vigor, undefined);
});
test('a cura respeita o equipamento: com o gibão (+10 de vida máxima) a poção em 60/110 cura 40 → 100', () => {
  const { j } = novo(); j.adicionarItem('item_gibao_couro'); j.equipar('hero_edric', 'item_gibao_couro'); j.grupo.hero_edric.vida = 60;
  assert.equal(j.usarItem('hero_edric', 'item_pocao_ervas').vida, 100);
  j.grupo.hero_edric.vida = 95; j.adicionarItem('item_pocao_ervas'); assert.equal(j.usarItem('hero_edric', 'item_pocao_ervas').vida, 110, 'o máximo agora é 110');
});
test('EQ12 e erros: sem o item · equipamento/lembrança usados como item · fora do mapa · herói inválido — nada muda', () => {
  const { j, reg } = novo(); j.adicionarItem('item_espada_ferro'); j.adicionarItem('item_lembranca_edric'); reg.length = 0; const antes = j.estado();
  assert.equal(j.usarItem('hero_edric', 'item_sopa_ervas').erro, 'sem_item');
  assert.equal(j.usarItem('hero_edric', 'item_espada_ferro').erro, 'sem_efeito');
  assert.equal(j.usarItem('hero_edric', 'item_lembranca_edric').erro, 'sem_efeito');
  assert.equal(j.usarItem('hero_edric', 'item_inexistente').erro, 'sem_item');
  assert.equal(j.usarItem('hero_fantasma', 'item_pocao_ervas').erro, 'heroi_invalido');
  assert.deepEqual(j.estado(), antes); assert.equal(reg.length, 0);
  const c = j.iniciarBatalha('enc_slime_1', { semente: 1 }); assert.equal(j.usarItem('hero_edric', 'item_pocao_ervas').erro, 'fora_do_mapa'); c.abandonar(); j.encerrarBatalha();
  assert.equal(j.usarItem('hero_edric', 'item_pocao_ervas').ok, true);
});
