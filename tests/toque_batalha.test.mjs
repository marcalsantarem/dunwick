// Reprodução da fila de batalha (src/motor/toque_batalha.js): ritmo, ordem, estado visual e fim — com o controlador e a política reais.
import test from 'node:test';
import assert from 'node:assert/strict';
import { carregarDados } from './_util.mjs';
import { criarControladorBatalha } from '../src/jogo/batalha/controlador.js';
import { decidirSimples } from '../src/jogo/batalha/politica.js';
import { criarToque } from '../src/motor/toque_batalha.js';

const DT = 1 / 60;

/** Joga a batalha inteira pelo toque, como a plataforma: só executa a rodada quando ocioso. Devolve o registro temporizado. */
function jogar(encontro, semente = 7, opcoes = {}) {
  const dados = carregarDados(), ctrl = criarControladorBatalha(dados, { encontro, semente }); ctrl.iniciar();
  const toque = criarToque(ctrl, { cfg: dados.config.batalha, acoes: dados.combate.acoes, ...opcoes }), reg = [];
  let t = 0; toque.eventos.em('ato_inicio', (e) => reg.push({ n: 'ato_inicio', t, ...e }));
  for (const n of ['dano', 'curou', 'caiu', 'venceu', 'perdeu', 'ato_fim']) toque.eventos.em(n, (e) => reg.push({ n, t, ...e }));
  for (let i = 0; i < 60 * 600 && !toque.terminou; i++) {
    toque.avancar(DT); t += DT;
    if (toque.ocioso && !ctrl.fim) {
      const vez = ctrl.consultar().vez;
      if (vez) ctrl.enviarComando({ ator: vez, ...decidirSimples(ctrl, dados, vez) });
      if (ctrl.pronto) ctrl.executar();
    }
  }
  return { dados, ctrl, toque, reg, t };
}

test('a batalha automática termina pelo toque e fecha o resultado', () => {
  const { ctrl, toque, t } = jogar('enc_misto_1');
  assert.ok(toque.terminou && ctrl.fim); assert.ok(t > 3 && t < 120, `duração plausível (${t.toFixed(1)} s)`);
  assert.equal(ctrl.encerrar().resultado, 'vitoria');
});

test('dano chega no instante do impacto do ato, não antes', () => {
  const { reg } = jogar('enc_slime_1');
  const ini = reg.find((e) => e.n === 'ato_inicio'), dano = reg.find((e) => e.n === 'dano' && e.t >= ini.t);
  assert.ok(dano, 'há dano'); const atraso = dano.t - ini.t;
  assert.ok(Math.abs(atraso - ini.impacto_s) < 2 * DT + 1e-6, `dano a ${atraso.toFixed(3)} s do início, impacto previsto ${ini.impacto_s.toFixed(3)} s`);
});

test('os atos não se sobrepõem: o próximo só começa depois do fim do anterior', () => {
  const { reg } = jogar('enc_misto_1'); let aberto = false;
  for (const e of reg) { if (e.n === 'ato_inicio') { assert.equal(aberto, false, 'ato iniciado com outro aberto'); aberto = true; } if (e.n === 'ato_fim') aberto = false; }
  assert.ok(reg.filter((e) => e.n === 'ato_inicio').length >= 4);
});

test('o atacante corpo a corpo vai até o contato e volta ao slot', () => {
  const dados = carregarDados(), ctrl = criarControladorBatalha(dados, { encontro: 'enc_slime_1', semente: 3 }); ctrl.iniciar();
  const toque = criarToque(ctrl, { cfg: dados.config.batalha, acoes: dados.combate.acoes }); let maxDx = 0;
  for (let i = 0; i < 60 * 30 && !toque.terminou; i++) {
    toque.avancar(DT); const e = toque.atores.get('hero_edric'); if (e) maxDx = Math.min(maxDx, e.dx);
    if (toque.ocioso && !ctrl.fim) { const v = ctrl.consultar().vez; if (v) ctrl.enviarComando({ ator: v, ...decidirSimples(ctrl, dados, v) }); if (ctrl.pronto) ctrl.executar(); }
  }
  assert.ok(maxDx < -3.5, `Edric avançou até perto do inimigo (dx mínimo ${maxDx.toFixed(2)})`);
  assert.equal(toque.atores.get('hero_edric').dx, 0, 'voltou ao slot');
});

test('inimigo derrotado some (alfa 0) e o grupo vencedor fica em pose de vitória', () => {
  const { toque } = jogar('enc_slime_1');
  assert.ok([...toque.atores.values()].filter((a) => a.lado === 'inimigos').every((a) => a.alfa === 0 && a.sombraSomente));
  assert.ok([...toque.atores.values()].some((a) => a.lado === 'grupo' && a.pose === 'bat_vitoria'));
});

test('reduzir movimento: sem deslize nem avanço', () => {
  const { toque } = jogar('enc_slime_1', 3, { reduzirMovimento: true });
  assert.ok(toque.terminou); for (const a of toque.atores.values()) assert.equal(a.dx, 0);
});

test('modo externo: a reação ao golpe (pose de dano, clarão, barra) acontece no instante em que a UI entrega o resultado', () => {
  const dados = carregarDados(), ctrl = criarControladorBatalha(dados, { encontro: 'enc_slime_1', semente: 3 }); ctrl.iniciar();
  const toque = criarToque(ctrl, { cfg: dados.config.batalha, acoes: dados.combate.acoes, externo: true, reduzirMovimento: true }), alvo = toque.atores.get('enemy_slime'), vida0 = alvo.vida;
  const vistos = []; toque.eventos.em('dano', (e) => vistos.push(e));
  for (let i = 0; i < 40; i++) toque.avancar(DT); // entrada
  toque.alimentar({ nome: 'ato_executado', ator: 'hero_edric', tipo: 'atacar', id: 'atk_edric_golpe', alvos: ['enemy_slime'], duracao_s: 0.9, duracao_real_s: 0.9, impacto_s: 0.405, intervalo_s: 0.2, pose: 'bat_ataque' });
  for (let t = 0; t < 0.405; t += DT) toque.avancar(DT);
  assert.equal(alvo.vida, vida0); assert.equal(alvo.brilho, 0); assert.equal(vistos.length, 0);
  toque.alimentar({ nome: 'dano', ator: 'hero_edric', alvo: 'enemy_slime', valor: 10, aplicado: 10, acao: 'atk_edric_golpe' }); // a UI entrega no impacto
  toque.alimentar({ nome: 'vida_mudou', ator: 'enemy_slime', vida: vida0 - 10, vida_max: alvo.vida_max, delta: -10 });
  assert.equal(vistos.length, 1); assert.equal(alvo.vida, vida0 - 10, 'barra desce NO instante do impacto'); assert.equal(alvo.brilho, 1, 'clarão'); assert.equal(alvo.pose, 'bat_dano'); assert.equal(alvo.empurrao, 0, 'reduzir movimento: sem recuo');
  for (let t = 0; t < 0.2; t += DT) toque.avancar(DT); assert.equal(alvo.brilho, 0, 'clarão some em ~7 quadros');
});

test('reduzir flashes: o acerto não gera clarão', () => {
  const dados = carregarDados(), ctrl = criarControladorBatalha(dados, { encontro: 'enc_slime_1', semente: 3 }); ctrl.iniciar();
  const toque = criarToque(ctrl, { cfg: dados.config.batalha, acoes: dados.combate.acoes, externo: true, reduzirMovimento: true, reduzirFlashes: true });
  for (let i = 0; i < 40; i++) toque.avancar(DT);
  toque.alimentar({ nome: 'ato_executado', ator: 'hero_edric', tipo: 'atacar', id: 'atk_edric_golpe', alvos: ['enemy_slime'], duracao_s: 0.9, duracao_real_s: 0.9, impacto_s: 0.1, intervalo_s: 0.2, pose: 'bat_ataque' });
  toque.alimentar({ nome: 'dano', ator: 'hero_edric', alvo: 'enemy_slime', valor: 5 });
  let max = 0; for (let t = 0; t < 0.5; t += DT) { toque.avancar(DT); max = Math.max(max, toque.atores.get('enemy_slime').brilho); }
  assert.equal(max, 0);
});
