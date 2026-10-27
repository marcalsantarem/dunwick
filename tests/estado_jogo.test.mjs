// Contrato apresentação ↔ batalha (controlador) e ponte mundo ↔ batalha (estado do jogo). Simulação pura.
import test from 'node:test';
import assert from 'node:assert/strict';
import { carregarDados, novoMundo, entrada } from './_util.mjs';
import { criarEventos } from '../src/jogo/eventos.js';
import { criarEstadoJogo } from '../src/jogo/estado_jogo.js';
import { criarControladorBatalha } from '../src/jogo/batalha/controlador.js';
import { EVENTOS_BATALHA } from '../src/jogo/batalha/batalha.js';
import { decidirSimples } from '../src/jogo/batalha/politica.js';

const novoCtrl = (ajustar, op = {}) => { const d = carregarDados(); if (ajustar) ajustar(d); const c = criarControladorBatalha(d, { encontro: 'enc_lobo_1', semente: 1, ...op }); c.iniciar(); return { d, c }; };
const loboSoMorde = (d) => { d.combate.inimigos.enemy_lobo.ia = [{ acao: 'atk_lobo_mordida', peso: 1, alvo_regra: 'menor_vida' }]; };
const jogar = (c, d) => { let g = 0; while (!c.fim) { for (let u = c.atorDaVez(); u; u = c.atorDaVez()) assert.equal(c.enviarComando({ ator: u, ...decidirSimples(c, d, u) }).ok, true); c.executar(); assert.ok(++g < 100); } return c.encerrar(); };
const atacarEdric = { ator: 'hero_edric', comando: 'atacar', id: 'atk_edric_golpe', alvo: 'enemy_lobo' };

test('comando recusado volta como { ok:false, erro } (sem exceção) e não muda o estado', () => {
  const { c } = novoCtrl(null, { estadoGrupo: { hero_edric: { mana: 3 } } });
  assert.deepEqual(c.enviarComando({ ator: 'hero_grace', comando: 'defender' }), { ok: false, erro: 'nao_e_a_vez' });
  assert.equal(c.enviarComando({ ator: 'hero_edric', comando: 'habilidade', id: 'skill_golpe_firme', alvo: 'enemy_lobo' }).erro, 'sem_mana');
  assert.equal(c.enviarComando({ ator: 'hero_edric', comando: 'atacar', id: 'atk_edric_golpe', alvo: 'hero_grace' }).erro, 'alvo_invalido');
  assert.equal(c.enviarComando({ ator: 'hero_edric', comando: 'dancar' }).erro, 'comando_invalido');
  assert.equal(c.enviarComando({ ator: 'hero_edric', comando: 'item', id: 'item_inexistente' }).erro, 'item_invalido');
  assert.equal(c.executar().erro, 'comandos_incompletos');
  assert.equal(c.atorDaVez(), 'hero_edric');
  assert.deepEqual(c.enviarComando(atacarEdric), { ok: true, pronto: false, proximo: 'hero_grace' });
});

test('consultar(): vez, comandos com motivo, ordem prevista (Defender sobe), escolhas do grupo sem vazar a IA, posições da cena', () => {
  const { c } = novoCtrl(null, { estadoGrupo: { hero_edric: { mana: 3 } } });
  let q = c.consultar();
  assert.deepEqual([q.vez, q.rodada, q.fase, q.velocidade, q.pode_fugir, q.fim], ['hero_edric', 1, 'comandos', 1, true, false]);
  assert.deepEqual([q.comandos.habilidade[0].habilitada, q.comandos.habilidade[0].motivo], [false, 'sem_mana']);
  assert.equal(q.comandos.atacar.motivo, null);
  assert.deepEqual(q.ordem_prevista, ['enemy_lobo', 'hero_edric', 'hero_grace']);
  assert.deepEqual(q.escolhas, {}, 'a escolha do inimigo não aparece');
  const lobo = q.atores.find((a) => a.uid === 'enemy_lobo'), edric = q.atores.find((a) => a.uid === 'hero_edric');
  assert.deepEqual(lobo.posicao_cena, [-3, 0]); assert.deepEqual(edric.posicao_cena, [3, 0]); assert.equal(lobo.lado, 'inimigos');
  c.enviarComando(atacarEdric); c.enviarComando({ ator: 'hero_grace', comando: 'defender' });
  q = c.consultar();
  assert.deepEqual(q.ordem_prevista, ['hero_grace', 'enemy_lobo', 'hero_edric']);
  assert.deepEqual(q.escolhas.hero_grace, { comando: 'defender', id: null, alvo: null });
  assert.equal(q.vez, null); assert.equal(q.fase, 'pronto'); assert.equal(c.pronto, true);
});

test('assinar: evento do catálogo, "*" e cancelamento; evento desconhecido é erro', () => {
  const { c } = novoCtrl(loboSoMorde); const todos = [], danos = [];
  const off = c.assinar('*', (e) => todos.push(e.nome)); c.assinar('dano', (e) => danos.push(e.valor));
  assert.throws(() => c.assinar('explodiu', () => {}), /não existe/);
  c.enviarComando(atacarEdric); c.enviarComando({ ator: 'hero_grace', comando: 'defender' });
  c.executar();
  assert.ok(todos.includes('dano') && todos.includes('rodada_terminou')); assert.equal(danos.length, 2);
  off(); const antes = todos.length;
  c.enviarComando({ ator: 'hero_edric', comando: 'defender' }); c.enviarComando({ ator: 'hero_grace', comando: 'defender' }); c.executar();
  assert.equal(todos.length, antes, 'cancelado: não recebe mais nada');
  assert.ok(danos.length >= 3, 'o assinante de "dano" segue ativo');
  assert.ok(todos.every((n) => EVENTOS_BATALHA.includes(n)));
});

test('fila e velocidade: esvaziarFila entrega tudo em ordem; 2× divide a duração e o impacto fica na fração dos dados', () => {
  const { d, c } = novoCtrl(loboSoMorde);
  const inicio = c.esvaziarFila(); assert.deepEqual(inicio.map((e) => e.nome).slice(0, 3), ['batalha_iniciou', 'rodada_iniciou', 'comando_pedido']);
  assert.equal(c.esvaziarFila().length, 0);
  assert.equal(c.definirVelocidade(3), false); assert.equal(c.definirVelocidade(2), true); assert.equal(c.velocidade, 2);
  c.enviarComando(atacarEdric); c.enviarComando({ ator: 'hero_grace', comando: 'defender' });
  const r = c.executar(), ato = r.eventos.find((e) => e.nome === 'ato_executado' && e.ator === 'hero_edric');
  assert.equal(ato.duracao_s, d.config.batalha.tempos.t_atacar); assert.equal(ato.duracao_real_s, d.config.batalha.tempos.t_atacar / 2);
  assert.ok(Math.abs(ato.impacto_s - ato.duracao_real_s * d.config.batalha.fracao_impacto) < 1e-9);
  assert.ok(c.esvaziarFila().length >= r.eventos.length);
  assert.throws(() => criarControladorBatalha(d, { encontro: 'enc_lobo_1', velocidade: 5 }), /velocidade/);
});

test('batalha inteira pelo contrato: encerrar() devolve { resultado, xp, itens, moedas, grupo… }; abandonar() e empate viram "fuga"', () => {
  const { d, c } = novoCtrl(null, { semente: 9 }); const r = jogar(c, d);
  assert.equal(r.resultado, 'vitoria'); assert.deepEqual([r.xp, r.moedas], [20, 7]); assert.equal(r.grupo.length, 2); assert.ok(r.grupo.every((g) => g.vida > 0));
  assert.equal(c.encerrar().resultado, 'vitoria'); assert.equal(c.fim, true);
  const outro = novoCtrl(); assert.equal(outro.c.encerrar(), null, 'antes do fim não há resultado');
  const f = outro.c.abandonar(); assert.deepEqual([f.resultado, f.xp], ['fuga', 0]);
  const fo = novoCtrl((dd) => { dd.config.batalha.rodadas_max = 1; loboSoMorde(dd); dd.combate.inimigos.enemy_lobo.vida_max = 9999; });
  fo.c.enviarComando({ ator: 'hero_edric', comando: 'defender' }); fo.c.enviarComando({ ator: 'hero_grace', comando: 'defender' });
  const e = fo.c.executar().resultado; assert.deepEqual([e.resultado, e.motivo], ['fuga', 'empate']);
});

// ---------------------------------------------------------------------------------------------------- ponte mundo ↔ batalha
const novoJogo = (ajustar) => {
  const d = carregarDados(); if (ajustar) ajustar(d);
  const ev = criarEventos(), reg = [];
  for (const n of ['modo_mudou', 'batalha_iniciada', 'batalha_encerrada', 'ponto_restaurado']) ev.em(n, (x) => reg.push([n, x]));
  return { d, ev, reg, j: criarEstadoJogo(d, ev) };
};

test('mundo: começa em "mapa"; em batalha a exploração congela (só os ticks andam) e volta ao mapa com o resultado aplicado', () => {
  const { dados: d, mundo: m, buffer } = novoMundo(null, { livre: true });
  assert.equal(m.jogo.modo, 'mapa');
  const ent = entrada({ x: 1 }), passo = () => m.passo(ent, buffer);
  passo(); const x1 = m.heroi.x;
  const c = m.jogo.iniciarBatalha('enc_slime_1', { semente: 5 }); assert.equal(m.jogo.modo, 'batalha');
  const t0 = m.ticks; passo(); passo();
  assert.equal(m.heroi.x, x1, 'o herói não anda durante a batalha'); assert.equal(m.ticks, t0 + 2);
  assert.equal(jogar(c, d).resultado, 'vitoria');
  m.jogo.encerrarBatalha(); assert.equal(m.jogo.modo, 'mapa');
  passo(); passo(); assert.notEqual(m.heroi.x, x1, 'o mapa volta a simular');
});

test('iniciar/encerrar: eventos do mundo, XP e inventário aplicados ao grupo; regras de modo', () => {
  const { d, reg, j } = novoJogo();
  assert.throws(() => j.encerrarBatalha(), /precisa estar em "batalha"/); assert.throws(() => j.iniciarBatalha('enc_fantasma'), /não existe/);
  const c = j.iniciarBatalha('enc_misto_1', { semente: 13 });
  assert.throws(() => j.iniciarBatalha('enc_lobo_1'), /precisa estar em "mapa"/); assert.throws(() => j.encerrarBatalha(), /ainda não terminou/);
  const r = jogar(c, d); assert.equal(j.estado().modo, 'batalha');
  const fim = j.encerrarBatalha(), depois = j.estado();
  assert.deepEqual([fim.resultado, depois.modo, depois.moedas], ['vitoria', 'mapa', 11]);
  assert.equal(depois.grupo.hero_edric.xp, 32); assert.equal(depois.grupo.hero_grace.xp, 32);
  assert.equal(depois.grupo.hero_edric.vida, r.grupo.find((g) => g.id === 'hero_edric').vida);
  assert.equal(depois.inventario.item_pocao_ervas, r.inventario.item_pocao_ervas);
  assert.deepEqual(reg.map(([n]) => n), ['modo_mudou', 'batalha_iniciada', 'modo_mudou', 'batalha_encerrada']);
  assert.deepEqual([reg[0][1].de, reg[0][1].para, reg[2][1].para], ['mapa', 'batalha', 'mapa']);
});

test('fuga volta ao mapa sem XP e mantém a vida e a mana finais', () => {
  const { j } = novoJogo(); const c = j.iniciarBatalha('enc_lobo_1', { semente: 2 });
  c.enviarComando(atacarEdric); c.enviarComando({ ator: 'hero_grace', comando: 'defender' }); c.executar();
  assert.equal(c.abandonar().resultado, 'fuga'); j.encerrarBatalha();
  assert.equal(j.modo, 'mapa'); assert.equal(j.grupo.hero_edric.xp, 0); assert.ok(j.grupo.hero_edric.vida < 100 || j.grupo.hero_grace.vida < 70);
});

test('derrota no M1: game over simples; "tentar de novo" volta ao último ponto salvo (grupo, inventário e moedas daquele momento)', () => {
  const { d, j, reg } = novoJogo((dd) => { dd.combate.inimigos.enemy_lobo.vida_max = 9999; dd.combate.inimigos.enemy_lobo.defesa = 9999; });
  j.grupo.hero_edric.vida = 40; j.salvarPonto();
  const c = j.iniciarBatalha('enc_lobo_1', { semente: 3 }); const r = jogar(c, d);
  assert.equal(r.resultado, 'derrota'); j.encerrarBatalha(); assert.equal(j.modo, 'game_over');
  assert.throws(() => j.iniciarBatalha('enc_slime_1'), /precisa estar em "mapa"/);
  assert.equal(j.grupo.hero_edric.vida, 0, 'o estado da derrota fica visível no game over');
  j.tentarDeNovo();
  assert.equal(j.modo, 'mapa'); assert.equal(j.grupo.hero_edric.vida, 40); assert.equal(j.inventario.item_pocao_ervas, 2); assert.equal(j.moedas, 0);
  assert.equal(reg.filter(([n]) => n === 'ponto_restaurado').length, 1);
  assert.throws(() => j.tentarDeNovo(), /precisa estar em "game_over"/);
});

test('cena: o mapa não simula durante a cena; sair volta ao mapa; não dá para começar batalha em cena', () => {
  const { j } = novoJogo(); j.entrarCena('cena_teste'); assert.equal(j.modo, 'cena');
  assert.throws(() => j.iniciarBatalha('enc_slime_1'), /precisa estar em "mapa"/);
  j.sairCena(); assert.equal(j.modo, 'mapa'); assert.equal(j.estado().cena, null);
});

test('depuração: depurarEncontro() percorre cfg_batalha.debug.encontros e ignora fora do mapa', () => {
  const { d, j } = novoJogo(); const lista = d.config.batalha.debug.encontros, vistos = [];
  for (let i = 0; i < lista.length + 1; i++) {
    const c = j.depurarEncontro(); vistos.push(c.consultar().encontro);
    assert.equal(j.depurarEncontro(), null, 'já em batalha: ignora');
    c.abandonar(); j.encerrarBatalha();
  }
  assert.deepEqual(vistos, [...lista, lista[0]]);
  assert.equal(j.iniciarBatalha('enc_lobo_1', { semente: 1 }).consultar().semente, 1);
});

test('sementes: sementeBase + contador torna cada batalha repetível', () => {
  const rodar = () => { const { d, j } = novoJogo(); return jogar(j.iniciarBatalha('enc_misto_1'), d); };
  assert.deepEqual(rodar(), rodar());
});
