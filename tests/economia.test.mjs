// Economia v0.1.4 (06): preços coerentes, lojas que só vendem o que existe e tem preço, equipamento inicial igual ao dos heróis,
// e os exemplos resolvidos de docs/sistemas/formulas_turnos.md §12 (E1–E10).
import test from 'node:test';
import assert from 'node:assert/strict';
import { RAIZ } from './_util.mjs';
import { empacotarDados } from '../tools/lib/dados.mjs';

const dados = empacotarDados(RAIZ), eco = dados.config.economia, itens = dados.combate.itens, herois = dados.combate.herois;
const arred = (x) => Math.floor(x + 0.5 + 1e-9);
const venda = (id) => eco.precos[id].venda;
const calcVenda = (compra) => Math.max(1, arred((compra * eco.venda_pct) / 100));

test('preço de venda = compra × venda_pct, meio para cima, mínimo 1, e nunca passa da compra (sem ganho comprando e vendendo)', () => {
  for (const [id, p] of Object.entries(eco.precos)) {
    assert.equal(p.venda, calcVenda(p.compra), `${id}: venda ${p.venda}`);
    assert.ok(p.venda < p.compra, `${id}: comprar e vender não pode dar lucro`);
    assert.ok(itens[id], `${id} existe em data/combate`);
  }
});

test('exemplos resolvidos E1–E5 (preços e arredondamento)', () => {
  assert.equal(calcVenda(20), 10);                 // E1 poção
  assert.equal(calcVenda(13), 7);                  // E2 13 × 0,5 = 6,5 → 7 (meio para cima)
  assert.equal(calcVenda(110), 55);                // E3 espada
  assert.equal(calcVenda(1), 1);                   // E4 piso de 1 Coroa
  assert.equal(eco.coroas_iniciais - eco.precos.item_pocao_ervas.compra * 2 - eco.precos.item_sopa_ervas.compra, 27); // E5 80 − 2×20 − 13
});

test('equipamento: tem slot, quem usa existe, e o stat bate com o slot', () => {
  for (const it of Object.values(itens).filter((x) => x.categoria === 'equipamento')) {
    assert.ok(['arma', 'armadura'].includes(it.slot), it.id);
    for (const h of it.para) assert.ok(herois[h], `${it.id}: herói ${h} não existe`);
    if (it.slot === 'arma') assert.ok(it.stats.poder_arma > 0 && it.stats.armadura === undefined, it.id);
    if (it.slot === 'armadura') assert.ok(it.stats.armadura >= 0 && it.stats.poder_arma === undefined, it.id);
  }
});

test('equipamento inicial de cada herói é igual a arma.poder e armadura dos dados; não tem preço', () => {
  for (const [id, h] of Object.entries(herois)) {
    if (!h.equipamento) continue;
    const arma = itens[h.equipamento.arma], arm = itens[h.equipamento.armadura];
    assert.equal(arma.stats.poder_arma, h.arma.poder, `${id} arma`);
    assert.equal(arm.stats.armadura, h.armadura, `${id} armadura`);
    assert.ok(arma.para.includes(id) && arm.para.includes(id), `${id} pode usar o equipamento inicial`);
    assert.equal(eco.precos[arma.id], undefined); assert.equal(eco.precos[arm.id], undefined);
  }
});

test('toda compra de equipamento melhora o slot (nada de "upgrade" pior) e custa mais que o inicial', () => {
  for (const it of Object.values(itens).filter((x) => x.categoria === 'equipamento' && eco.precos[x.id])) {
    for (const h of it.para) {
      const base = itens[herois[h].equipamento[it.slot]];
      if (it.slot === 'arma') assert.ok(it.stats.poder_arma > base.stats.poder_arma, `${it.id} vs ${base.id}`);
      else assert.ok(it.stats.armadura > base.stats.armadura, `${it.id} vs ${base.id}`);
    }
  }
});

test('lojas: o estoque existe, tem preço, e compra_tipos só vê tipos de item reais', () => {
  const tipos = new Set(Object.values(itens).map((x) => x.categoria ?? 'consumivel'));
  for (const l of Object.values(dados.lojas)) {
    const vistos = new Set();
    for (const e of l.estoque) { assert.ok(itens[e.item] && eco.precos[e.item], `${l.id}: ${e.item}`); assert.ok(!vistos.has(e.item), `${l.id}: ${e.item} repetido`); vistos.add(e.item); }
    for (const t of l.compra_tipos ?? []) assert.ok(tipos.has(t), `${l.id}: tipo ${t}`);
  }
});

test('o ferreiro vende 2–3 equipamentos básicos e a taverneira só consumíveis (D-049)', () => {
  const eqs = dados.lojas.shop_ferreiro.estoque.filter((e) => itens[e.item].categoria === 'equipamento');
  assert.ok(eqs.length >= 2 && eqs.length <= 3, `ferreiro vende ${eqs.length} equipamentos`);
  for (const e of dados.lojas.shop_taverneira.estoque) assert.equal(itens[e.item].categoria, 'consumivel');
});

test('Coroas iniciais: dão para o básico (poção + sopa), mas não para a melhor arma (E6, E7)', () => {
  assert.ok(eco.coroas_iniciais >= eco.precos.item_pocao_ervas.compra + eco.precos.item_sopa_ervas.compra);   // E6
  assert.ok(eco.coroas_iniciais < eco.precos.item_espada_ferro.compra);                                       // E7
});

test('cura por Coroa: o preço por ponto de vida de todo consumível fica entre 0,6× e 1,25× o da poção (E8)', () => {
  const porVida = (id) => eco.precos[id].compra / itens[id].cura_base;
  const pocao = porVida('item_pocao_ervas');
  for (const id of Object.keys(eco.precos).filter((i) => itens[i].efeito === 'cura')) assert.ok(porVida(id) <= pocao * 1.25 && porVida(id) >= pocao * 0.6, `${id}: ${porVida(id).toFixed(2)} Coroa/PV`);
});

test('E9–E10: efeito do equipamento no dano (fórmula do 06) e na defesa', () => {
  const f = dados.config.batalha.formulas, dano = (poder, forca, def) => Math.max(1, arred(poder * (1 + (5 * forca) / 100) * (f.defesa_constante / (f.defesa_constante + def))));
  assert.equal(dano(14, 8, 3), 19);                // E9 Edric nível 1, espada de treino, no slime
  assert.equal(dano(itens.item_espada_ferro.stats.poder_arma, 8, 3), 24);   // 18 × 1,4 × 100/103 = 24,47 → 24
  const defesa = (vig, arm) => vig + arm;
  assert.equal(defesa(7, itens.item_tunica_remendada.stats.armadura), 9);   // E10 com a túnica
  assert.equal(defesa(7, itens.item_gibao_couro.stats.armadura), 15);       // com o gibão
});
