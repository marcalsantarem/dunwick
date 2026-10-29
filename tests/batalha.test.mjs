// Combate por turnos (BL-008 etapa 1): exemplos resolvidos do 06 (T1–T24) e do 03 (O1–O7) viram testes, mais regras da rodada,
// fim de batalha, fuga, IA e simulação em lote (metas do 06). Simulação pura: nada de three nem DOM.
import test from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { carregarDados, RAIZ } from './_util.mjs';
import * as F from '../src/jogo/batalha/formulas.js';
import { criarBatalha, EVENTOS_BATALHA } from '../src/jogo/batalha/batalha.js';
import { criarPrng } from '../src/jogo/batalha/prng.js';
import { jogarAutomatico, simularLote } from '../src/jogo/batalha/politica.js';
import { validarDados } from '../tools/validar_dados.mjs';

const D = carregarDados(), CFG = D.config.batalha, f = CFG.formulas;
const ficha = (D2, id) => {
  const h = D2.combate.herois[id];
  if (h) { const d = F.derivadosHeroi(h, D2.config.batalha.formulas); return { forca: h.atributos.forca, mente: h.atributos.mente, defesa: d.defesa, agilidade: d.agilidade, poder_arma: h.arma.poder }; }
  const e = D2.combate.inimigos[id]; return { forca: e.forca, mente: e.mente ?? 0, defesa: e.defesa, agilidade: e.agilidade, poder_arma: 0 };
};
/** dano calculado pela mesma função do motor, com os dados reais */
const dano = (atorId, acaoId, alvoId, { defendendo = false, resistencia = 0 } = {}) => {
  const a = ficha(D, atorId), t = ficha(D, alvoId), ac = D.combate.acoes[acaoId];
  return F.danoFinal({ poder: ac.dano_base ?? a.poder_arma * ac.mult_dano, escala: ac.escala, atributo: a[ac.atributo], defesa: t.defesa, defendendo, defender_mult: CFG.defender_mult_dano, resistencia }, f);
};

// ---------------------------------------------------------------------------------------------------- 06: T1–T24
test('T1–T6: dano de Edric e Grace (defesa 100/(100+def), arredondamento único)', () => {
  assert.equal(dano('hero_edric', 'atk_edric_golpe', 'enemy_slime'), 19);                       // T1
  assert.equal(dano('hero_edric', 'atk_edric_golpe', 'enemy_lobo'), 19);                        // T2
  assert.equal(dano('hero_edric', 'skill_golpe_firme', 'enemy_slime'), 34);                     // T3
  assert.equal(dano('hero_edric', 'skill_golpe_firme', 'enemy_slime', { resistencia: -0.5 }), 51); // T4
  assert.equal(dano('hero_edric', 'atk_edric_golpe', 'enemy_slime', { resistencia: 0.25 }), 14);  // T5
  assert.equal(dano('hero_grace', 'atk_grace_cajado', 'enemy_slime'), 9);                       // T6
});
test('T7–T11 e T23: dano dos inimigos, com e sem Defender (×0,5)', () => {
  assert.equal(dano('enemy_slime', 'atk_slime_golpe', 'hero_edric'), 13);                       // T7
  assert.equal(dano('enemy_slime', 'atk_slime_golpe', 'hero_edric', { defendendo: true }), 7);  // T8
  assert.equal(dano('enemy_slime', 'atk_slime_golpe', 'hero_grace'), 14);                       // T9
  assert.equal(dano('enemy_slime', 'atk_slime_golpe', 'hero_grace', { defendendo: true }), 7);
  assert.equal(dano('enemy_lobo', 'atk_lobo_mordida', 'hero_edric'), 18);                       // T10
  assert.equal(dano('enemy_lobo', 'atk_lobo_mordida', 'hero_edric', { defendendo: true }), 9);
  assert.equal(dano('enemy_lobo', 'atk_lobo_mordida', 'hero_grace'), 19);                       // T11
  assert.equal(dano('enemy_lobo', 'skill_lobo_investida', 'hero_edric'), 27);                   // T23
  assert.equal(dano('enemy_lobo', 'skill_lobo_investida', 'hero_edric', { defendendo: true }), 13);
  assert.equal(dano('enemy_lobo', 'skill_lobo_investida', 'hero_grace'), 28);
});
test('T12: piso de 1; imune dá 0; resistência é limitada a [−0,5; +0,75]', () => {
  assert.equal(F.danoFinal({ poder: 1, escala: 0, atributo: 0, defesa: 200 }, f), 1);
  assert.equal(F.danoFinal({ poder: 50, escala: 5, atributo: 8, defesa: 0, imune: true }, f), 0);
  assert.equal(F.danoFinal({ poder: 100, escala: 0, atributo: 0, defesa: 0, resistencia: 5 }, f), 25);   // 1 − 0,75
  assert.equal(F.danoFinal({ poder: 100, escala: 0, atributo: 0, defesa: 0, resistencia: -5 }, f), 150); // 1 + 0,5
});
test('T13–T15: cura (escala por Mente, limitada ao que falta; envenenado ×0,7)', () => {
  const g = ficha(D, 'hero_grace'), ac = D.combate.acoes.skill_cura;
  assert.equal(F.curaFinal({ cura_base: ac.cura_base, escala: ac.escala, atributo: g.mente, falta: 100 }).cura, 20);                       // T13
  assert.equal(F.curaFinal({ cura_base: ac.cura_base, escala: ac.escala, atributo: g.mente, mult_estado: 0.7, falta: 100 }).cura, 14);     // T14
  const r = F.curaFinal({ cura_base: ac.cura_base, escala: ac.escala, atributo: g.mente, falta: 10 }); assert.deepEqual([r.cura, r.curada], [20, 10]); // T15
});
test('T16: vida e mana do nível 1 (Edric 100/14, Grace 70/29), defesa e agilidade', () => {
  const e = F.derivadosHeroi(D.combate.herois.hero_edric, f), g = F.derivadosHeroi(D.combate.herois.hero_grace, f);
  assert.deepEqual([e.vida_max, e.mana_max, e.defesa, e.agilidade], [100, 14, 9, 6]);
  assert.deepEqual([g.vida_max, g.mana_max, g.defesa, g.agilidade], [70, 29, 5, 5]);
});
test('T17, T18 e T24: ordem da rodada', () => {
  const it = (uid, prioridade, agilidade, lado, pos) => ({ uid, prioridade, iniciativa: agilidade, lado, pos });
  const ag = (id) => ficha(D, id).agilidade;
  const ord = (l) => F.ordenar(l).map((x) => x.uid);
  assert.deepEqual(ord([it('edric', 0, ag('hero_edric'), 'grupo', 1), it('grace', 0, ag('hero_grace'), 'grupo', 2), it('lobo', 0, ag('enemy_lobo'), 'inimigos', 1), it('slime', 0, ag('enemy_slime'), 'inimigos', 2)]), ['lobo', 'edric', 'grace', 'slime']); // T17
  assert.deepEqual(ord([it('lobo', 0, 9, 'inimigos', 1), it('edric', 0, 9, 'grupo', 1), it('s1', 0, 3, 'inimigos', 2), it('s0', 0, 3, 'inimigos', 1)]), ['edric', 'lobo', 's0', 's1']); // T18
  assert.deepEqual(ord([it('grace', 1, ag('hero_grace'), 'grupo', 2), it('edric', 0, ag('hero_edric'), 'grupo', 1), it('lobo', 0, ag('enemy_lobo'), 'inimigos', 1)]), ['grace', 'lobo', 'edric']); // T24
});
test('T19, T20 e O5–O7: chance de fuga', () => {
  const fu = CFG.fuga, perto = (x, y) => assert.ok(Math.abs(x - y) < 1e-9, `${x} ≠ ${y}`);
  perto(F.chanceFuga(fu, 5.5, 9), 0.325);                 // T19
  perto(F.chanceFuga(fu, 5.5, 3), 0.625);                 // T20 (contra o slime)
  perto(F.chanceFuga(fu, 5.5, 9, 2), 0.525);              // T20 (lobo, depois de 2 falhas)
  perto(F.chanceFuga(fu, 10, 8), 0.6);                    // O5
  perto(F.chanceFuga(fu, 5, 20), 0.1);                    // O6 (piso)
  perto(F.chanceFuga(fu, 10, 8, 2), 0.8);                 // O7
  perto(F.chanceFuga(fu, 30, 1), 0.9);                    // teto
});
test('T21: mana por rodada (+1 Edric, +3 Grace), limitada ao máximo', () => {
  assert.equal(F.regenMana(CFG.regen_mana, D.combate.herois.hero_edric.atributos.mente), 1);
  assert.equal(F.regenMana(CFG.regen_mana, D.combate.herois.hero_grace.atributos.mente), 3);
});
test('T22: XP para o nível 2 e 3 (100 × n^1,6)', () => { assert.deepEqual([1, 2, 3].map((n) => F.xpParaNivel(n, CFG.xp)), [100, 303, 580]); });
test('O1–O4: exemplos de ordem do 03 (agilidades do documento)', () => {
  const it = (uid, prioridade, agilidade, lado, pos) => ({ uid, prioridade, iniciativa: agilidade, lado, pos });
  const ord = (l) => F.ordenar(l).map((x) => x.uid);
  assert.deepEqual(ord([it('edric', 0, 10, 'grupo', 1), it('grace', 0, 8, 'grupo', 2), it('lobo', 0, 12, 'inimigos', 1)]), ['lobo', 'edric', 'grace']);   // O1
  assert.deepEqual(ord([it('edric', 0, 10, 'grupo', 1), it('grace', 1, 8, 'grupo', 2), it('lobo', 0, 12, 'inimigos', 1)]), ['grace', 'lobo', 'edric']);   // O2
  assert.deepEqual(ord([it('edric', 0, 10, 'grupo', 1), it('lobo', 0, 10, 'inimigos', 1)]), ['edric', 'lobo']);                                          // O3
  assert.deepEqual(ord([it('edric', 0, 10, 'grupo', 1), it('s1', 0, 4, 'inimigos', 1), it('s2', 0, 4, 'inimigos', 2)]), ['edric', 's1', 's2']);           // O4
});

// ---------------------------------------------------------------------------------------------------- controlador
const novo = (ajustar, opcoes = {}) => { const d = carregarDados(); if (ajustar) ajustar(d); return { d, b: criarBatalha(d, { encontro: 'enc_lobo_1', semente: 1, ...opcoes }) }; };
const loboSoMorde = (d) => { d.combate.inimigos.enemy_lobo.ia = [{ acao: 'atk_lobo_mordida', peso: 1, alvo_regra: 'menor_vida' }]; };
const nomes = (b) => b.log.map((e) => e.nome);
const evs = (b, nome) => b.log.filter((e) => e.nome === nome);

test('rodada: o grupo escolhe na ordem, "voltar" refaz, e a execução segue a agilidade (lobo, Edric, Grace)', () => {
  const { d, b } = novo(loboSoMorde); b.iniciar();
  assert.equal(b.atorDaVez(), 'hero_edric');
  assert.throws(() => b.escolher('hero_grace', { comando: 'defender' }), /não é a vez/);
  b.escolher('hero_edric', { comando: 'atacar', id: 'atk_edric_golpe', alvo: 'enemy_lobo' });
  assert.equal(b.atorDaVez(), 'hero_grace');
  assert.equal(b.voltar(), true); assert.equal(b.atorDaVez(), 'hero_edric');
  b.escolher('hero_edric', { comando: 'atacar', id: 'atk_edric_golpe', alvo: 'enemy_lobo' });
  assert.equal(b.escolher('hero_grace', { comando: 'atacar', id: 'atk_grace_cajado', alvo: 'enemy_lobo' }).pronto, true);
  b.executar();
  assert.deepEqual(evs(b, 'execucao_iniciou')[0].ordem, ['enemy_lobo', 'hero_edric', 'hero_grace']);
  assert.deepEqual(evs(b, 'turno_iniciou').map((e) => e.ator), ['enemy_lobo', 'hero_edric', 'hero_grace']);
  void d;
});
test('Defender age primeiro e reduz o dano à metade (T10: 9 em vez de 18)', () => {
  const { b } = novo(loboSoMorde); b.iniciar();
  b.escolher('hero_edric', { comando: 'defender' }); b.escolher('hero_grace', { comando: 'atacar', id: 'atk_grace_cajado', alvo: 'enemy_lobo' }); b.executar();
  assert.deepEqual(evs(b, 'execucao_iniciou')[0].ordem, ['hero_edric', 'enemy_lobo', 'hero_grace']);
  const d1 = evs(b, 'dano').find((e) => e.ator === 'enemy_lobo');
  assert.deepEqual([d1.alvo, d1.valor, d1.defendendo], ['hero_edric', 9, true]);
  assert.equal(b.ator('hero_edric').vida, 91);
  assert.equal(b.ator('hero_edric').defendendo, false, 'a guarda acaba no fim da rodada');
});
test('mana: custo, recusa sem mana e regeneração por rodada (+1 Edric, Grace já no máximo)', () => {
  const { b } = novo(loboSoMorde); b.iniciar();
  b.escolher('hero_edric', { comando: 'habilidade', id: 'skill_golpe_firme', alvo: 'enemy_lobo' }); b.escolher('hero_grace', { comando: 'defender' }); b.executar();
  assert.equal(evs(b, 'mana_gasta')[0].valor, 4);
  assert.equal(b.ator('hero_edric').mana, 11, '14 − 4 + 1 por rodada');
  assert.equal(b.ator('hero_grace').mana, 29);
  const baixo = novo(null, { estadoGrupo: { hero_edric: { mana: 3 } } }); baixo.b.iniciar();
  assert.throws(() => baixo.b.escolher('hero_edric', { comando: 'habilidade', id: 'skill_golpe_firme', alvo: 'enemy_lobo' }), /sem_mana/);
  assert.equal(baixo.b.comandosDe('hero_edric').habilidade[0].habilitada, false);
});
test('cura da Grace e Poção: limitadas ao que falta; o estoque diminui', () => {
  const { b } = novo(loboSoMorde, { estadoGrupo: { hero_edric: { vida: 60 } } }); b.iniciar();
  b.escolher('hero_edric', { comando: 'item', id: 'item_pocao_ervas', alvo: 'hero_edric' });
  b.escolher('hero_grace', { comando: 'habilidade', id: 'skill_cura', alvo: 'hero_edric' });
  b.executar();
  const c = evs(b, 'curou'); assert.equal(c.length, 2);
  // o lobo age primeiro (Edric 60 → 42); a poção cura 40 (→ 82); a cura da Grace vale 20, mas só cabem 18
  assert.equal(b.ator('hero_edric').vida, 100);
  assert.deepEqual([c[0].ator, c[0].valor, c[0].bruto], ['hero_edric', 40, 40]);
  assert.deepEqual([c[1].ator, c[1].valor, c[1].bruto], ['hero_grace', 18, 20]);
  assert.equal(b.inventario().item_pocao_ervas, 1);
});
test('redirecionamento: alvo que caiu antes do ato vai para o próximo vivo (inimigo e cura)', () => {
  const { b } = novo((d) => { loboSoMorde(d); d.combate.inimigos.enemy_lobo.vida_max = 1; }, { encontro: 'enc_misto_1' });
  b.iniciar();
  b.escolher('hero_edric', { comando: 'atacar', id: 'atk_edric_golpe', alvo: 'enemy_lobo' });
  b.escolher('hero_grace', { comando: 'atacar', id: 'atk_grace_cajado', alvo: 'enemy_lobo' });
  b.executar();
  const danos = evs(b, 'dano').filter((e) => e.ator.startsWith('hero_'));
  assert.deepEqual(danos.map((e) => e.alvo), ['enemy_lobo', 'enemy_slime'], 'Grace bate no slime porque o lobo já caiu');
  const cura = novo(loboSoMorde, { estadoGrupo: { hero_edric: { vida: 20 } } }); cura.b.iniciar();
  cura.b.escolher('hero_edric', { comando: 'defender' }); cura.b.escolher('hero_grace', { comando: 'habilidade', id: 'skill_cura', alvo: 'hero_edric' });
  cura.b.executar();
  assert.equal(evs(cura.b, 'curou')[0].alvo, 'hero_edric');
});
test('ato de quem caiu antes de agir é cancelado e não cobra mana', () => {
  const { b } = novo(loboSoMorde, { estadoGrupo: { hero_edric: { vida: 1 } } }); b.iniciar();
  b.escolher('hero_edric', { comando: 'habilidade', id: 'skill_golpe_firme', alvo: 'enemy_lobo' }); b.escolher('hero_grace', { comando: 'defender' });
  b.executar();
  assert.deepEqual(evs(b, 'ato_cancelado').map((e) => [e.ator, e.motivo]), [['hero_edric', 'caido']]);
  assert.equal(evs(b, 'mana_gasta').length, 0);
  assert.equal(evs(b, 'caiu')[0].alvo, 'hero_edric');
});
test('vitória: encerra os atos restantes; XP só a quem está vivo; caído volta com 1 de vida; drops com semente', () => {
  const { b } = novo((d) => { d.combate.inimigos.enemy_lobo.vida_max = 1; d.combate.inimigos.enemy_lobo.drops = [{ item: 'item_pocao_ervas', chance: 1, qtd: 1 }]; }, { estadoGrupo: { hero_grace: { vida: 0 } } });
  b.iniciar();
  assert.equal(b.atorDaVez(), 'hero_edric', 'caído não escolhe comando');
  const r0 = b.escolher('hero_edric', { comando: 'atacar', id: 'atk_edric_golpe', alvo: 'enemy_lobo' }); assert.equal(r0.pronto, true);
  const r = b.executar();
  assert.equal(r.resultado, 'vitoria');
  const nm = nomes(b); assert.equal(nm.indexOf('venceu') > nm.lastIndexOf('caiu'), true);
  assert.ok(evs(b, 'turno_iniciou').length <= 2, 'os atos depois da vitória não acontecem');
  const g = Object.fromEntries(r.grupo.map((x) => [x.id, x]));
  assert.equal(g.hero_edric.xp, 20); assert.equal(g.hero_grace.xp, 0, 'caído não recebe XP');
  assert.deepEqual([g.hero_grace.vida, g.hero_grace.caido], [1, false]);
  assert.deepEqual(r.itens, { item_pocao_ervas: 1 }); assert.equal(r.inventario.item_pocao_ervas, 3);
  assert.equal(r.moedas, 7);
});
test('derrota: todos caídos; sem XP; caídos continuam caídos', () => {
  const r = jogarAutomatico((() => { const d = carregarDados(); d.combate.inimigos.enemy_lobo.vida_max = 9999; d.combate.inimigos.enemy_lobo.defesa = 9999; return d; })(), { encontro: 'enc_lobo_1', semente: 3, estadoGrupo: { hero_edric: { vida: 5 }, hero_grace: { vida: 5 } } }).resultado;
  assert.equal(r.resultado, 'derrota'); assert.equal(r.xp, 0); assert.ok(r.grupo.every((g) => g.caido && g.vida === 0));
});
test('fugir: sucesso termina a batalha sem recompensa; falha gasta o ato; chefe/encontro sem fuga recusa', () => {
  const ok = novo((d) => { d.config.batalha.fuga = { base: 1, por_ponto: 0, bonus_falha: 0, min: 1, max: 1 }; }); ok.b.iniciar();
  ok.b.escolher('hero_edric', { comando: 'fugir' }); ok.b.escolher('hero_grace', { comando: 'defender' });
  const r = ok.b.executar(); assert.deepEqual([r.resultado, r.xp, r.moedas], ['fugiu', 0, 0]); assert.ok(nomes(ok.b).includes('fugiu'));
  const nao = novo((d) => { d.config.batalha.fuga = { base: 0, por_ponto: 0, bonus_falha: 0, min: 0, max: 0 }; loboSoMorde(d); }); nao.b.iniciar();
  nao.b.escolher('hero_edric', { comando: 'fugir' }); nao.b.escolher('hero_grace', { comando: 'defender' });
  assert.equal(nao.b.executar(), null); assert.equal(evs(nao.b, 'fuga_tentada')[0].sucesso, false); assert.equal(nao.b.rodada, 2);
  const chefe = novo((d) => { d.combate.encontros.enc_lobo_1.pode_fugir = false; }); chefe.b.iniciar();
  assert.equal(chefe.b.comandosDe('hero_edric').fugir.habilitado, false);
  assert.throws(() => chefe.b.escolher('hero_edric', { comando: 'fugir' }), /nao_pode_fugir/);
});
test('rodadas_max: batalha que não termina vira empate, sem recompensa', () => {
  const { b } = novo((d) => { d.config.batalha.rodadas_max = 2; d.combate.inimigos.enemy_lobo.ia = [{ acao: 'skill_slime_balanco', peso: 1, alvo_regra: 'aleatorio' }]; }); b.iniciar();
  for (let i = 0; i < 2; i++) { b.escolher('hero_edric', { comando: 'defender' }); b.escolher('hero_grace', { comando: 'defender' }); b.executar(); }
  assert.equal(b.resultado.resultado, 'empate'); assert.equal(b.resultado.rodadas, 2); assert.equal(b.resultado.xp, 0);
});
test('IA: pesos respeitados, condicao rodada_min (investida só a partir da rodada 2) e alvo "menor_vida"', () => {
  const D2 = carregarDados(); const cont = { atk_lobo_mordida: 0, skill_lobo_investida: 0 }; let investidaNaRodada1 = 0;
  for (let s = 1; s <= 600; s++) {
    const b = criarBatalha(D2, { encontro: 'enc_lobo_1', semente: s }); b.iniciar();
    const ev = b.log.find((e) => e.nome === 'rodada_iniciou'); void ev;
    const esc = b.estado().escolhas['enemy_lobo']; cont[esc.id]++; if (esc.id === 'skill_lobo_investida') investidaNaRodada1++;
  }
  assert.equal(investidaNaRodada1, 0, 'a investida só entra a partir da rodada 2');
  // rodada 2 em diante: ~30 % de investida
  let inv = 0, tot = 0;
  for (let s = 1; s <= 600; s++) {
    const b = criarBatalha(D2, { encontro: 'enc_lobo_1', semente: s }); b.iniciar();
    b.escolher('hero_edric', { comando: 'defender' }); b.escolher('hero_grace', { comando: 'defender' }); b.executar();
    const esc = b.estado().escolhas['enemy_lobo']; tot++; if (esc.id === 'skill_lobo_investida') inv++;
  }
  assert.ok(inv / tot > 0.24 && inv / tot < 0.36, `fração de investida ${inv / tot}`);
  const { b } = novo((d) => { d.combate.inimigos.enemy_lobo.ia = [{ acao: 'atk_lobo_mordida', peso: 1, alvo_regra: 'menor_vida' }]; }, { estadoGrupo: { hero_grace: { vida: 10 } } }); b.iniciar();
  assert.equal(b.estado().escolhas.enemy_lobo.alvo, 'hero_grace', 'menor fração de vida');
});
test('mesma semente, mesma batalha (IA, fuga, drops); eventos só do catálogo; duração do ato vem dos dados', () => {
  const a = jogarAutomatico(D, { encontro: 'enc_misto_1', semente: 42 }), c = jogarAutomatico(carregarDados(), { encontro: 'enc_misto_1', semente: 42 });
  assert.deepEqual(a.log, c.log);
  for (const n of nomes(a)) assert.ok(EVENTOS_BATALHA.includes(n), `evento fora do catálogo: ${n}`);
  for (const n of ['batalha_iniciou', 'rodada_iniciou', 'comando_pedido', 'comando_escolhido', 'execucao_iniciou', 'turno_iniciou', 'ato_executado', 'dano', 'caiu', 'vida_mudou', 'mana_gasta', 'mana_mudou', 'rodada_terminou', 'venceu', 'batalha_terminou']) assert.ok(nomes(a).includes(n), `faltou o evento ${n}`);
  assert.equal(evs(a, 'ato_executado').find((e) => e.tipo === 'atacar').duracao_s, CFG.tempos.t_atacar);
  assert.ok(a.resultado.tempo_animacao_s > CFG.tempos.t_entrada_batalha);
  assert.deepEqual([criarPrng(5).proximo(), criarPrng(5).proximo()].map((x) => x === criarPrng(5).proximo()), [true, true]);
});
test('o motor não importa three nem DOM', () => {
  for (const arq of ['batalha.js', 'formulas.js', 'politica.js', 'prng.js']) { const t = readFileSync(join(RAIZ, 'src/jogo/batalha', arq), 'utf8'); assert.ok(!/from ['"]three|document\.|window\./.test(t), arq); }
});

// ---------------------------------------------------------------------------------------------------- metas do 06 (simulação em lote)
test('lote (1.500 batalhas por encontro): metas do 06 §10 — rodadas, vitória e vida do grupo', () => {
  const s = simularLote(D, 'enc_slime_1', 1500), l = simularLote(D, 'enc_lobo_1', 1500), m = simularLote(D, 'enc_misto_1', 1500);
  assert.ok(s.vitoria >= 0.99 && Math.abs(s.rodadas_media - 2.0) < 0.15, JSON.stringify(s));
  assert.ok(l.vitoria >= 0.99 && Math.abs(l.rodadas_media - 3.0) < 0.2, JSON.stringify(l));
  assert.ok(m.vitoria >= 0.9 && m.rodadas_media >= 4.5 && m.rodadas_media <= 6, JSON.stringify(m));
  for (const r of [s, l, m]) { assert.ok(r.rodadas_media >= 2 && r.rodadas_media <= 6, 'batalha comum de 2 a 6 rodadas'); assert.ok(r.vida_grupo_fim >= 0.3 && r.vida_grupo_fim <= 0.95, `vida no fim ${r.vida_grupo_fim}`); }
});

// ---------------------------------------------------------------------------------------------------- dados
function copiaComEdicao(arquivoRel, editar) {
  const tmp = mkdtempSync(join(tmpdir(), 'dunwick-')); cpSync(join(RAIZ, 'data'), join(tmp, 'data'), { recursive: true }); cpSync(join(RAIZ, 'assets'), join(tmp, 'assets'), { recursive: true });
  const p = join(tmp, 'data', arquivoRel), o = JSON.parse(readFileSync(p, 'utf8')); editar(o); writeFileSync(p, JSON.stringify(o)); return tmp;
}
test('dados de combate: dado inválido ou referência quebrada é recusado com arquivo e campo', () => {
  let tmp = copiaComEdicao('combate/cfg_batalha.json', (o) => { o.fuga.por_ponto = 'muito'; });
  assert.ok(validarDados(tmp).erros.some((e) => e.includes('combate/cfg_batalha.json') && e.includes('/fuga/por_ponto')), 'texto no lugar de número'); rmSync(tmp, { recursive: true });
  tmp = copiaComEdicao('combate/enemy_lobo.json', (o) => { o.ia[0].acao = 'atk_nao_existe'; });
  assert.ok(validarDados(tmp).erros.some((e) => e.includes('enemy_lobo.json') && e.includes('atk_nao_existe'))); rmSync(tmp, { recursive: true });
  tmp = copiaComEdicao('attacks/atk_lobo_mordida.json', (o) => { o.tempo = 't_inexistente'; delete o.dano_base; });
  const e = validarDados(tmp).erros.join('\n'); rmSync(tmp, { recursive: true });
  assert.ok(e.includes('t_inexistente') && e.includes('dano_base'), e);
  tmp = copiaComEdicao('combate/enc_misto_1.json', (o) => { o.inimigos = ['enemy_fantasma']; });
  assert.ok(validarDados(tmp).erros.some((x) => x.includes('enc_misto_1.json') && x.includes('enemy_fantasma'))); rmSync(tmp, { recursive: true });
});
