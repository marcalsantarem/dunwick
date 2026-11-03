// v0.1.4 (D-050): o equipamento do ESTADO DO JOGO chega ao motor da batalha (dano, defesa, PV, mana). Exemplos E9–E10 e regras do 06 §12.1,
// agora pelo motor real (eventos `dano`), não só pelas fórmulas. Complementa tests/equipamento.test.mjs e tests/economia.test.mjs (06).
import test from 'node:test';
import assert from 'node:assert/strict';
import { carregarDados } from './_util.mjs';
import { criarEventos } from '../src/jogo/eventos.js';
import { criarEstadoJogo } from '../src/jogo/estado_jogo.js';
import { criarBatalha } from '../src/jogo/batalha/batalha.js';
import { heroiEquipado, derivadosHeroi } from '../src/jogo/batalha/formulas.js';

const novo = (ajustar) => { const d = carregarDados(); if (ajustar) ajustar(d); const ev = criarEventos(), reg = []; ev.em('equipamento_mudou', (x) => reg.push(x)); return { d, ev, reg, j: criarEstadoJogo(d, ev) }; };
/** Primeiro dano de `ator` em `alvo` numa batalha curta (Edric ataca, Grace defende; o lobo só morde) */
const danoDoEdric = (j, d, enc = 'enc_slime_1', alvo = 'enemy_slime') => {
  const c = j.iniciarBatalha(enc, { semente: 1 });
  c.enviarComando({ ator: 'hero_edric', comando: 'atacar', id: 'atk_edric_golpe', alvo }); c.enviarComando({ ator: 'hero_grace', comando: 'defender' });
  const r = c.executar().eventos.find((e) => e.nome === 'dano' && e.ator === 'hero_edric'); c.abandonar(); j.encerrarBatalha(); void d; return r.valor;
};

test('estado inicial: o equipamento vem da ficha e os números de nível 1 não mudam (Edric 100/14/def 9/poder 14; Grace 70/29/def 5/poder 8)', () => {
  const { j } = novo();
  assert.deepEqual(j.equipamentoDe('hero_edric'), { arma: 'item_espada_treino', armadura: 'item_tunica_remendada' });
  assert.deepEqual(j.equipamentoDe('hero_grace'), { arma: 'item_cajado_madeira', armadura: 'item_manto_simples' });
  const e = j.statsDe('hero_edric'), g = j.statsDe('hero_grace');
  assert.deepEqual([e.vida_max, e.mana_max, e.defesa, e.agilidade, e.poder_arma], [100, 14, 9, 6, 14]);
  assert.deepEqual([g.vida_max, g.mana_max, g.defesa, g.agilidade, g.poder_arma], [70, 29, 5, 5, 8]);
  assert.deepEqual(j.estado().equipamento.hero_edric, { arma: 'item_espada_treino', armadura: 'item_tunica_remendada' });
});

test('E9 pelo motor: Edric no slime — espada de treino 19; espada de ferro 24 (o antigo volta à mochila, o novo sai dela)', () => {
  const { d, j, reg } = novo();
  assert.equal(danoDoEdric(j, d), 19);
  j.adicionarItem('item_espada_ferro');
  const r = j.equipar('hero_edric', 'item_espada_ferro');
  assert.deepEqual([r.ok, r.slot, r.anterior, r.stats.poder_arma], [true, 'arma', 'item_espada_treino', 18]);
  assert.equal(j.inventario.item_espada_ferro, undefined, 'saiu da mochila'); assert.equal(j.inventario.item_espada_treino, 1, 'a antiga voltou');
  assert.equal(j.equipamentoDe('hero_edric').arma, 'item_espada_ferro'); assert.equal(j.equipadoPor('item_espada_ferro'), 'hero_edric'); assert.equal(j.equipadoPor('item_espada_treino'), null);
  assert.equal(danoDoEdric(j, d), 24);
  assert.deepEqual([reg[0].heroi, reg[0].slot, reg[0].de, reg[0].para], ['hero_edric', 'arma', 'item_espada_treino', 'item_espada_ferro']);
  assert.equal(j.equipar('hero_edric', 'item_espada_treino').ok, true, 'dá para voltar à espada antiga'); assert.equal(danoDoEdric(j, d), 19);
});

test('E10 pelo motor: defesa do Edric 9 com a túnica e 15 com o gibão; a mordida do lobo (defendendo) cai de 9 para 8', () => {
  const golpe = (armadura) => {
    const D2 = carregarDados(); D2.combate.inimigos.enemy_lobo.ia = [{ acao: 'atk_lobo_mordida', peso: 1, alvo_regra: 'menor_vida' }];
    const ev = criarEventos(), jg = criarEstadoJogo(D2, ev); if (armadura) { jg.adicionarItem('item_gibao_couro'); assert.equal(jg.equipar('hero_edric', 'item_gibao_couro').ok, true); }
    const c = jg.iniciarBatalha('enc_lobo_1', { semente: 1 }); c.enviarComando({ ator: 'hero_edric', comando: 'defender' }); c.enviarComando({ ator: 'hero_grace', comando: 'defender' });
    const dano = c.executar().eventos.find((e) => e.nome === 'dano' && e.ator === 'enemy_lobo'); return { defesa: jg.statsDe('hero_edric').defesa, alvo: dano.alvo, valor: dano.valor, defendendo: dano.defendendo };
  };
  const a = golpe(false), b = golpe(true);
  assert.deepEqual([a.defesa, b.defesa], [9, 15]); assert.deepEqual([a.alvo, b.alvo], ['hero_edric', 'hero_edric']);
  assert.deepEqual([a.valor, b.valor], [9, 8], 'defendendo (×0,5): 17,89→9 e 16,96×0,5→8');
});

test('gibão: +10 de vida máxima (Edric 110, Grace 80), armadura 8; vida atual não sobe sozinha e cai se o máximo cai', () => {
  const { j } = novo();
  j.adicionarItem('item_gibao_couro', 2); j.grupo.hero_edric.vida = 60;
  assert.equal(j.equipar('hero_edric', 'item_gibao_couro').stats.vida_max, 110); assert.equal(j.grupo.hero_edric.vida, 60, 'a vida atual fica');
  assert.equal(j.equipar('hero_grace', 'item_gibao_couro').stats.vida_max, 80); assert.equal(j.statsDe('hero_grace').defesa, 4 + 8);
  j.grupo.hero_edric.vida = 110; j.equipar('hero_edric', 'item_tunica_remendada');
  assert.equal(j.statsDe('hero_edric').vida_max, 100); assert.equal(j.grupo.hero_edric.vida, 100, 'limitada ao novo máximo');
  assert.equal(j.inventario.item_gibao_couro, 1, 'o gibão tirado voltou à mochila');
});

test('cajado do freixo: poder 11 e +6 de mana para a Grace; o dano dela sobe (cajado 8 → 11) e a mana máxima vira 35', () => {
  const { d, j } = novo(); j.adicionarItem('item_cajado_freixo');
  const antes = j.statsDe('hero_grace'); assert.equal(antes.mana_max, 29);
  const r = j.equipar('hero_grace', 'item_cajado_freixo'); assert.deepEqual([r.stats.poder_arma, r.stats.mana_max], [11, 35]);
  const dano = (poderArma) => { const D2 = carregarDados(); const b = criarBatalha(D2, { encontro: 'enc_slime_1', semente: 1, equipamento: { hero_grace: poderArma } }); b.iniciar(); return b.ator('hero_grace').poder_arma; };
  assert.equal(dano({ arma: 'item_cajado_freixo', armadura: 'item_manto_simples' }), 11); assert.equal(dano(undefined), 8);
  const c = j.iniciarBatalha('enc_slime_1', { semente: 1 }); c.enviarComando({ ator: 'hero_edric', comando: 'defender' });
  c.enviarComando({ ator: 'hero_grace', comando: 'atacar', id: 'atk_grace_cajado', alvo: 'enemy_slime' });
  const g = c.executar().eventos.find((e) => e.nome === 'dano' && e.ator === 'hero_grace'); assert.equal(g.valor, 12, '11 × 1,15 × 100/103 = 12,28 → 12 (antes: 9)'); c.abandonar(); j.encerrarBatalha(); void d;
});

test('regras: só no mapa, só equipamento, só quem pode, só o que está na mochila; erro não muda nada', () => {
  const { j } = novo(); const antes = j.estado();
  assert.equal(j.equipar('hero_edric', 'item_espada_ferro').erro, 'nao_tem');
  j.adicionarItem('item_cajado_freixo'); assert.equal(j.equipar('hero_edric', 'item_cajado_freixo').erro, 'nao_serve');
  assert.equal(j.equipar('hero_edric', 'item_pocao_ervas').erro, 'nao_e_equipamento'); assert.equal(j.equipar('hero_edric', 'item_inexistente').erro, 'nao_e_equipamento');
  assert.equal(j.equipar('hero_fantasma', 'item_espada_ferro').erro, 'heroi_invalido');
  j.adicionarItem('item_espada_ferro'); const c = j.iniciarBatalha('enc_slime_1', { semente: 1 });
  assert.equal(j.equipar('hero_edric', 'item_espada_ferro').erro, 'fora_do_mapa', 'não troca de equipamento no meio da batalha'); c.abandonar(); j.encerrarBatalha();
  assert.equal(j.equipamentoDe('hero_edric').arma, 'item_espada_treino');
  assert.equal(antes.equipamento.hero_edric.arma, 'item_espada_treino');
});

test('pré-visualização: statsDe(heroi, { arma }) mostra o efeito sem equipar (para a loja e o menu)', () => {
  const { j } = novo();
  const atual = j.statsDe('hero_edric'), novoStats = j.statsDe('hero_edric', { arma: 'item_espada_ferro', armadura: 'item_gibao_couro' });
  assert.deepEqual([atual.poder_arma, atual.defesa, atual.vida_max], [14, 9, 100]); assert.deepEqual([novoStats.poder_arma, novoStats.defesa, novoStats.vida_max], [18, 15, 110]);
  assert.equal(j.equipamentoDe('hero_edric').arma, 'item_espada_treino', 'nada mudou');
});

test('equipamento vale na batalha inteira e persiste: "tentar de novo" restaura o equipamento do último ponto salvo', () => {
  const { d, j } = novo((dd) => { dd.combate.inimigos.enemy_lobo.vida_max = 9999; dd.combate.inimigos.enemy_lobo.defesa = 9999; });
  j.adicionarItem('item_espada_ferro'); j.salvarPonto();
  j.equipar('hero_edric', 'item_espada_ferro'); assert.equal(j.statsDe('hero_edric').poder_arma, 18);
  const c = j.iniciarBatalha('enc_lobo_1', { semente: 3 }); assert.equal(c.ator('hero_edric').poder_arma, 18, 'a batalha usa o equipamento atual');
  for (let g = 0; !c.fim && g < 100; g++) { for (let u = c.atorDaVez(); u; u = c.atorDaVez()) c.enviarComando({ ator: u, comando: 'defender' }); c.executar(); }
  j.encerrarBatalha(); assert.equal(j.modo, 'game_over', 'derrota');
  j.tentarDeNovo(); assert.equal(j.equipamentoDe('hero_edric').arma, 'item_espada_treino'); assert.equal(j.inventario.item_espada_ferro, 1); assert.equal(j.statsDe('hero_edric').poder_arma, 14); void d;
});

test('heroiEquipado é puro: sem equipamento usa a ficha; item sem o valor do slot não zera; bônus de vida, mana e agilidade somam', () => {
  const D = carregarDados(), h = D.combate.herois.hero_edric, copia = structuredClone(h);
  assert.deepEqual(heroiEquipado(h, { arma: null, armadura: null }, D.combate.itens).arma, h.arma);
  const itens = { ...D.combate.itens, item_x: { id: 'item_x', bonus_itens: { agilidade: 2, vida: 5 } }, item_y: { id: 'item_y', bonus_itens: { agilidade: 1, mana: 3 }, stats: { armadura: 4 } } };
  const e = heroiEquipado(h, { arma: 'item_x', armadura: 'item_y' }, itens);
  assert.deepEqual([e.arma.poder, e.armadura, e.bonus_itens], [14, 4, { vida: 5, mana: 3, agilidade: 3 }]);
  assert.deepEqual(h, copia, 'não altera a ficha'); assert.equal(derivadosHeroi(e, D.config.batalha.formulas).agilidade, 6 + 3);
});
