// Equipamento e uso de consumível fora de batalha (06, D-050/D-040). Modelo de referência do 06: o 08 implementa em src/jogo/ e deve dar
// os mesmos resultados. Fórmulas: docs/sistemas/formulas_turnos.md §12.6 (exemplos EQ1–EQ12).
import test from 'node:test';
import assert from 'node:assert/strict';
import { RAIZ } from './_util.mjs';
import { empacotarDados } from '../tools/lib/dados.mjs';
import { derivadosHeroi, danoFinal, curaFinal } from '../src/jogo/batalha/formulas.js';

const dados = empacotarDados(RAIZ), itens = dados.combate.itens, f = dados.config.batalha.formulas;

// ---- modelo de referência ----
function heroiCom(id, equipado) {
  const h = structuredClone(dados.combate.herois[id]), a = itens[equipado.arma], r = itens[equipado.armadura];
  h.arma.poder = a.stats.poder_arma; h.armadura = r.stats.armadura;
  for (const it of [a, r]) for (const [k, v] of Object.entries(it.bonus_itens ?? {})) h.bonus_itens[k] += v;
  return h;
}
const derivados = (id, eq) => derivadosHeroi(heroiCom(id, eq), f);
const inicial = (id) => dados.combate.herois[id].equipamento;
/** Equipar: valida, troca o slot, devolve o antigo à mochila e limita vida/mana ao novo máximo (sem curar). */
function equipar(id, estado, itemId) {
  const it = itens[itemId];
  if (!it || it.categoria !== 'equipamento') return { erro: 'nao_e_equipamento' };
  if (!it.para.includes(id)) return { erro: 'nao_serve' };
  if ((estado.mochila[itemId] ?? 0) < 1) return { erro: 'nao_tem' };
  const mochila = { ...estado.mochila }, antigo = estado.equipado[it.slot];
  mochila[itemId] -= 1; if (!mochila[itemId]) delete mochila[itemId];
  mochila[antigo] = (mochila[antigo] ?? 0) + 1;
  const equipado = { ...estado.equipado, [it.slot]: itemId }, d = derivados(id, equipado);
  return { equipado, mochila, vida: Math.min(estado.vida, d.vida_max), mana: Math.min(estado.mana, d.mana_max) };
}
const novo = (id, mochila = {}) => { const d = derivados(id, inicial(id)); return { equipado: { ...inicial(id) }, mochila, vida: d.vida_max, mana: d.mana_max }; };

test('EQ1: sem equipamento novo os derivados batem com a ficha (Edric 100/14/9/6, Grace 70/29/5/5)', () => {
  assert.deepEqual(derivados('hero_edric', inicial('hero_edric')), { vida_max: 100, mana_max: 14, defesa: 9, agilidade: 6 });
  assert.deepEqual(derivados('hero_grace', inicial('hero_grace')), { vida_max: 70, mana_max: 29, defesa: 5, agilidade: 5 });
});

test('EQ2–EQ4: gibão soma 10 de vida e troca a armadura; cajado soma 6 de mana; espada só muda o poder', () => {
  const e = (arma, armadura) => ({ arma, armadura });
  assert.deepEqual(derivados('hero_edric', e('item_espada_treino', 'item_gibao_couro')), { vida_max: 110, mana_max: 14, defesa: 15, agilidade: 6 });   // EQ2
  assert.deepEqual(derivados('hero_grace', e('item_cajado_freixo', 'item_manto_simples')), { vida_max: 70, mana_max: 35, defesa: 5, agilidade: 5 });  // EQ3
  assert.deepEqual(derivados('hero_grace', e('item_cajado_madeira', 'item_gibao_couro')), { vida_max: 80, mana_max: 29, defesa: 12, agilidade: 5 });  // EQ4
  assert.equal(heroiCom('hero_edric', e('item_espada_ferro', 'item_tunica_remendada')).arma.poder, 18);
});

test('EQ5: trocar de arma devolve a antiga à mochila e consome a nova', () => {
  const r = equipar('hero_edric', novo('hero_edric', { item_espada_ferro: 1 }), 'item_espada_ferro');
  assert.equal(r.equipado.arma, 'item_espada_ferro'); assert.deepEqual(r.mochila, { item_espada_treino: 1 });
});

test('EQ6: vida e mana nunca sobem ao equipar e são limitadas ao novo máximo ao tirar', () => {
  let s = novo('hero_edric', { item_gibao_couro: 1 }); s.vida = 100;
  s = equipar('hero_edric', s, 'item_gibao_couro');
  assert.equal(s.vida, 100);                        // máximo foi a 110, mas a vida não cura sozinha
  s.vida = 108; const r = equipar('hero_edric', { ...s, mochila: { item_tunica_remendada: 1 } }, 'item_tunica_remendada');
  assert.equal(r.vida, 100);                        // 108 → limitado ao máximo de 100
});

test('EQ7: recusas — item de outro herói, item que não tem, item que não é equipamento', () => {
  assert.equal(equipar('hero_grace', novo('hero_grace', { item_espada_ferro: 1 }), 'item_espada_ferro').erro, 'nao_serve');
  assert.equal(equipar('hero_edric', novo('hero_edric'), 'item_espada_ferro').erro, 'nao_tem');
  assert.equal(equipar('hero_edric', novo('hero_edric', { item_pocao_ervas: 1 }), 'item_pocao_ervas').erro, 'nao_e_equipamento');
});

test('EQ8: o equipamento muda o dano dado e recebido (lobo morde 18 → 17 com gibão; Edric no slime 19 → 24 com a espada)', () => {
  const dano = (poder, forca, def) => danoFinal({ poder, escala: 5, atributo: forca, defesa: def }, f);
  assert.equal(dano(15, 6, derivados('hero_edric', inicial('hero_edric')).defesa), 18);
  assert.equal(dano(15, 6, derivados('hero_edric', { arma: 'item_espada_treino', armadura: 'item_gibao_couro' }).defesa), 17);
  assert.equal(dano(14, 8, 3), 19); assert.equal(dano(itens.item_espada_ferro.stats.poder_arma, 8, 3), 24);
});

// ---- consumível fora de batalha (D-040): executa e gasta mesmo com a vida cheia ----
function usarFora(itemId, estado) {
  const it = itens[itemId];
  if (it?.efeito !== 'cura' || !(estado.mochila[itemId] > 0)) return { erro: 'nao_pode' };
  const { curada } = curaFinal({ cura_base: it.cura_base, escala: it.escala, atributo: 0, falta: estado.vida_max - estado.vida });
  const mochila = { ...estado.mochila, [itemId]: estado.mochila[itemId] - 1 };
  return { vida: estado.vida + curada, curada, mochila };
}
test('EQ9–EQ12: poção cura e some; com vida cheia executa, gasta o item e cura 0; cura limitada ao que falta; sem item não faz nada', () => {
  assert.equal(usarFora('item_pocao_ervas', { vida: 60, vida_max: 100, mochila: { item_pocao_ervas: 2 } }).vida, 100);   // EQ9 40 → 100
  const cheia = usarFora('item_pocao_ervas', { vida: 100, vida_max: 100, mochila: { item_pocao_ervas: 2 } });          // EQ10 D-040
  assert.equal(cheia.vida, 100); assert.equal(cheia.curada, 0); assert.equal(cheia.mochila.item_pocao_ervas, 1);
  const tonico = usarFora('item_tonico_vigor', { vida: 70, vida_max: 100, mochila: { item_tonico_vigor: 1 } });         // EQ11 60 mas faltam 30
  assert.equal(tonico.curada, 30); assert.equal(tonico.mochila.item_tonico_vigor, 0);
  assert.equal(usarFora('item_pocao_ervas', { vida: 50, vida_max: 100, mochila: {} }).erro, 'nao_pode');               // EQ12
  assert.equal(usarFora('item_espada_ferro', { vida: 50, vida_max: 100, mochila: { item_espada_ferro: 1 } }).erro, 'nao_pode');
});
