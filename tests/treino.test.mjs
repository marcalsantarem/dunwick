// v0.1.2b: inimigo sem ações (passa a vez sem erro) e encontro de treino (sem recompensa, grupo restaurado, repetível).
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { carregarDados, RAIZ } from './_util.mjs';
import { criarEventos } from '../src/jogo/eventos.js';
import { criarBatalha } from '../src/jogo/batalha/batalha.js';
import { criarEstadoJogo } from '../src/jogo/estado_jogo.js';
import { jogarAutomatico, decidirSimples } from '../src/jogo/batalha/politica.js';
import { validarDados } from '../tools/validar_dados.mjs';

const evs = (b, nome) => b.log.filter((e) => e.nome === nome);

test('inimigo sem ações: passa a vez sem erro, por último (agilidade 0), com o texto "não faz nada" por ID', () => {
  const D = carregarDados(), b = criarBatalha(D, { encontro: 'enc_boneco_treino', semente: 1 }); b.iniciar();
  b.escolher('hero_edric', { comando: 'atacar', id: 'atk_edric_golpe', alvo: 'enemy_boneco_treino' }); b.escolher('hero_grace', { comando: 'defender' });
  assert.doesNotThrow(() => b.executar());
  assert.deepEqual(evs(b, 'execucao_iniciou')[0].ordem, ['hero_grace', 'hero_edric', 'enemy_boneco_treino']);
  const p = evs(b, 'ato_executado').find((e) => e.ator === 'enemy_boneco_treino');
  assert.deepEqual([p.tipo, p.motivo, p.msg_txt, p.nome_txt, p.alvos, p.duracao_s], ['passar', 'sem_acoes', 'ui_batalha_nao_faz_nada', 'txt_enemy_boneco_treino_nome', [], D.config.batalha.tempos.t_intervalo_ato]);
  assert.ok(D.textos['pt-BR'][p.msg_txt] && D.textos['pt-BR'][p.nome_txt], 'os textos existem');
  assert.equal(evs(b, 'dano').filter((e) => e.alvo.startsWith('hero_')).length, 0, 'o boneco não machuca ninguém');
  assert.equal(evs(b, 'ato_falhou').length, 0);
});

test('treino: vitória sem XP, moedas nem drops (mesmo que a ficha tivesse); PV/PM e estoque do grupo voltam ao que eram', () => {
  const D = carregarDados(); Object.assign(D.combate.inimigos.enemy_boneco_treino, { xp: 99, moedas: 99, drops: [{ item: 'item_pocao_ervas', chance: 1, qtd: 3 }] });
  const b = criarBatalha(D, { encontro: 'enc_boneco_treino', semente: 4, estadoGrupo: { hero_edric: { vida: 50, mana: 3 }, hero_grace: { vida: 20 } } }); b.iniciar();
  const u = b.escolher('hero_edric', { comando: 'item', id: 'item_pocao_ervas', alvo: 'hero_grace' }); assert.equal(u.pronto, false);
  b.escolher('hero_grace', { comando: 'defender' }); b.executar();
  assert.equal(b.inventario().item_pocao_ervas, 1, 'gastou a poção durante a batalha');
  for (let g = 0; !b.resultado && g < 50; g++) { for (let uid = b.atorDaVez(); uid; uid = b.atorDaVez()) b.escolher(uid, decidirSimples(b, D, uid)); b.executar(); }
  const r = b.resultado;
  assert.deepEqual([r.resultado, r.treino, r.xp, r.moedas, r.itens, r.niveis], ['vitoria', true, 0, 0, {}, []]);
  assert.deepEqual(r.grupo.map((g) => [g.id, g.vida, g.mana, g.caido, g.xp, g.nivel]), [['hero_edric', 100, 14, false, 0, 1], ['hero_grace', 70, 29, false, 0, 1]]);
  assert.equal(r.inventario.item_pocao_ervas, 2, 'a poção gasta volta: o treino não custa nada');
  const v = evs(b, 'venceu')[0]; assert.deepEqual([v.xp, v.moedas, v.itens, v.treino], [0, 0, {}, true]);
  assert.ok(evs(b, 'vida_mudou').some((e) => e.ator === 'hero_edric' && e.vida === 100), 'a restauração aparece como eventos');
});

test('treino: caído também é restaurado; fuga restaura; derrota vira fuga (nunca game over)', () => {
  const D = carregarDados();
  const fu = criarBatalha(D, { encontro: 'enc_boneco_treino', semente: 1, estadoGrupo: { hero_grace: { vida: 0 } } }); fu.iniciar();
  fu.abandonar(); assert.deepEqual(fu.resultado.grupo.map((g) => [g.vida, g.caido]), [[100, false], [70, false]]); assert.equal(fu.resultado.resultado, 'fugiu');
  const D2 = carregarDados(); D2.combate.inimigos.enemy_boneco_treino.ia = [{ acao: 'skill_lobo_investida', peso: 1, alvo_regra: 'aleatorio' }]; D2.combate.inimigos.enemy_boneco_treino.forca = 99;
  const r = jogarAutomatico(D2, { encontro: 'enc_boneco_treino', semente: 2, estadoGrupo: { hero_edric: { vida: 1 }, hero_grace: { vida: 1 } } }, (b, d, uid) => ({ comando: 'defender' })).resultado;
  assert.equal(r.resultado, 'fugiu', 'derrota no treino vira fuga'); assert.ok(r.grupo.every((g) => !g.caido && g.vida === g.vida_max));
});

test('treino repetível sem limite pelo estado do jogo: 6 treinos seguidos deixam grupo, XP, moedas e inventário iguais', () => {
  const D = carregarDados(), ev = criarEventos(), reg = []; ev.em('batalha_encerrada', (x) => reg.push(x));
  const j = criarEstadoJogo(D, ev), antes = j.estado();
  for (let i = 0; i < 6; i++) {
    const c = j.iniciarBatalha('enc_boneco_treino');
    for (let g = 0; !c.fim && g < 60; g++) { for (let u = c.atorDaVez(); u; u = c.atorDaVez()) assert.ok(c.enviarComando({ ator: u, ...decidirSimples(c, D, u) }).ok); c.executar(); }
    const r = j.encerrarBatalha(); assert.deepEqual([r.resultado, r.treino, j.modo], ['vitoria', true, 'mapa']);
  }
  assert.deepEqual(j.estado(), antes); assert.equal(reg.length, 6); assert.ok(reg.every((x) => x.treino === true && x.xp === 0));
});

test('batalha comum não é afetada: sem `treino` o XP, as moedas e os drops continuam valendo', () => {
  const D = carregarDados(); const r = jogarAutomatico(D, { encontro: 'enc_lobo_1', semente: 9 }).resultado;
  assert.deepEqual([r.treino, r.xp, r.moedas], [false, 20, 7]);
});

test('o boneco de treino cai com ~200 PV em poucas rodadas e o simulador mostra o aviso de treino', () => {
  const D = carregarDados(); const n = [];
  for (let s = 1; s <= 200; s++) n.push(jogarAutomatico(D, { encontro: 'enc_boneco_treino', semente: s }).resultado.rodadas);
  const media = n.reduce((a, b) => a + b, 0) / n.length; assert.ok(media >= 4 && media <= 8, `rodadas médias ${media}`);
  const saida = execFileSync(process.execPath, [join(RAIZ, 'tools/simular_batalha.mjs'), 'enc_boneco_treino', '--semente=1', '--resumo'], { encoding: 'utf8' });
  assert.match(saida, /TREINO/); assert.match(saida, /xp 0 · moedas 0/);
});

test('dados: inimigo de treino com XP/ia, ou encontro sem `treino` contendo-o, é recusado com arquivo e campo', () => {
  const copia = (arq, editar) => { const tmp = mkdtempSync(join(tmpdir(), 'dunwick-')); cpSync(join(RAIZ, 'data'), join(tmp, 'data'), { recursive: true }); cpSync(join(RAIZ, 'assets'), join(tmp, 'assets'), { recursive: true }); const p = join(tmp, 'data', arq), o = JSON.parse(readFileSync(p, 'utf8')); editar(o); writeFileSync(p, JSON.stringify(o)); return tmp; };
  let tmp = copia('combate/enemy_boneco_treino.json', (o) => { o.xp = 5; });
  assert.ok(validarDados(tmp).erros.some((e) => e.includes('enemy_boneco_treino.json') && e.includes('/treino')), 'xp ≠ 0'); rmSync(tmp, { recursive: true });
  tmp = copia('combate/enc_boneco_treino.json', (o) => { o.treino = false; });
  assert.ok(validarDados(tmp).erros.some((e) => e.includes('enc_boneco_treino.json') && e.includes('/treino'))); rmSync(tmp, { recursive: true });
  tmp = copia('combate/cfg_batalha.json', (o) => { o.msg_nao_faz_nada_txt = 'ui_nao_existe'; });
  assert.ok(validarDados(tmp).erros.some((e) => e.includes('ui_nao_existe'))); rmSync(tmp, { recursive: true });
});
