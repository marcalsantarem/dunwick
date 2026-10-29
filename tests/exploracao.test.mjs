// Exploração da vila (13, v0.1.2): colisão dos prédios, rota do clique, portas ida e volta, portal inativo, troca manual (08),
// interagir com objeto e estado serializável. Simulação pura, com os mapas reais de data/maps.
import test from 'node:test';
import assert from 'node:assert/strict';
import { carregarDados, carregarMetas, novoMundo, entrada, colocar, rodar } from './_util.mjs';
import { criarEventos } from '../src/jogo/eventos.js';
import { criarMundo } from '../src/jogo/mundo.js';
import { BufferEntrada } from '../src/jogo/buffer.js';

const VILA = 'map_baixo_orvalho', MAREN = 'map_casa_maren_interior';
const clique = (x, z) => entrada({ apertou: ['clique_principal'], cursor: { x, z } });
const PARADO = entrada();
function registrar(ctx, nomes = ['portal_usado', 'mapa_trocado', 'portal_bloqueado', 'interagiu']) { const ev = []; for (const n of nomes) ctx.eventos.em(n, (d) => ev.push({ n, ...d })); return ev; }
const ate = (ctx, cond, max = 1200, ent = PARADO) => { let i = 0; while (!cond() && i++ < max) ctx.mundo.passo(ent, ctx.buffer); return cond(); };

test('colisão: todo edifício bloqueia (pegada do objeto "casa"); andar contra uma casa fechada não entra nela', () => {
  const ctx = novoMundo(), { mundo } = ctx, m = mundo.mapa, r = mundo.heroi.raioPush;
  for (const e of m.dados.edificios) assert.equal(m.livre(e.x, e.z, r), false, `${e.id} deveria ser sólido`);
  colocar(mundo, 14, 42.5); // ao sul da casa_sul_1 (x 12–16, z 36–40)
  rodar(ctx, 300, entrada({ x: 1, z: -1 })); // −z no mundo
  assert.ok(mundo.heroi.z >= 40 + r - 0.01, `entrou na casa: z=${mundo.heroi.z}`);
});

test('clique atrás de uma casa: a rota contorna o prédio e chega; nunca fica dentro de colisão', () => {
  const ctx = novoMundo(), { mundo } = ctx, h = mundo.heroi;
  colocar(mundo, 14, 42.5); rodar(ctx, 1, clique(14, 34.5));
  let dentro = false; assert.ok(ate(ctx, () => { if (!mundo.mapa.livre(h.x, h.z, h.raioPush - 0.02)) dentro = true; return !h.destino && h.velocidade() < 0.01; }));
  assert.ok(Math.hypot(h.x - 14, h.z - 34.5) < 0.3, `chegou? ${h.x},${h.z}`); assert.equal(dentro, false);
});

test('não prende: 40 cliques aleatórios pela vila sempre terminam parados, fora de colisão e no mapa da vila', () => {
  const ctx = novoMundo(), { mundo } = ctx, h = mundo.heroi; let s = 12345; const rnd = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (let k = 0; k < 40; k++) {
    const x = 2 + rnd() * 44, z = 3 + rnd() * 42, alvoPortal = mundo.portais && (mundo.mapa.dados.portais.some((p) => Math.abs(p.x - x) < 2 && Math.abs(p.z - z) < 2) || mundo.mapa.dados.edificios.some((e) => Math.abs(e.x - x) < e.w / 2 + 0.5 && Math.abs(e.z - z) < e.d / 2 + 0.5));
    if (alvoPortal) continue; // clicar em porta/prédio entra no interior (testado à parte)
    rodar(ctx, 1, clique(x, z)); assert.ok(ate(ctx, () => !h.destino && h.velocidade() < 0.01, 2400), `clique ${k} (${x.toFixed(1)}, ${z.toFixed(1)}) não terminou`);
    assert.equal(mundo.mapaId, VILA); assert.ok(mundo.mapa.livre(h.x, h.z, h.raioPush - 0.02), `preso em colisão em ${h.x},${h.z}`);
  }
});

test('porta ida e volta: clicar na casa da Maren entra pelo portal; sair leva à porta, virado para fora; portal de retorno no estado', () => {
  const ctx = novoMundo(), { mundo } = ctx, h = mundo.heroi, ev = registrar(ctx);
  const porta = mundo.mapa.dados.portais.find((p) => p.id === 'porta_casa_maren');
  colocar(mundo, 20, 20); rodar(ctx, 1, clique(14, 10.5)); // no meio do prédio
  assert.ok(ate(ctx, () => mundo.mapaId === MAREN));
  assert.deepEqual(ev.map((e) => e.n), ['portal_usado', 'mapa_trocado']);
  assert.deepEqual({ ...ev[0], n: undefined }, { n: undefined, de_mapa: VILA, portal: 'porta_casa_maren', para_mapa: MAREN, para_portal: 'saida' });
  const saida = mundo.mapa.dados.portais.find((p) => p.id === 'saida');
  assert.deepEqual([h.x, h.z, h.direcao()], [saida.chegada.x, saida.chegada.z, saida.chegada.direcao]);
  assert.deepEqual(mundo.estadoExploracao().portal_retorno, { mapa: VILA, portal: 'porta_casa_maren' });
  rodar(ctx, 30, PARADO); assert.equal(mundo.mapaId, MAREN, 'chegar não dispara a volta');
  rodar(ctx, 1, clique(saida.x, saida.z)); assert.ok(ate(ctx, () => mundo.mapaId === VILA));
  assert.deepEqual([h.x, h.z, h.direcao()], [porta.chegada.x, porta.chegada.z, porta.chegada.direcao]);
  assert.equal(mundo.estadoExploracao().portal_retorno, null);
  assert.ok(mundo.mapa.dados.portais.every((p) => p.chegada.z !== undefined));
});

test('porta andando: entrar no retângulo da porta com o teclado também troca de mapa', () => {
  const ctx = novoMundo(), { mundo } = ctx; colocar(mundo, 14, 15.5);
  assert.ok(ate(ctx, () => mundo.mapaId === MAREN, 300, entrada({ x: 1, z: -1 })));
});

test('portal inativo (saída norte): bloqueia, avisa uma vez por contato com texto por ID, e o mapa não muda', () => {
  const ctx = novoMundo(), { mundo } = ctx, h = mundo.heroi, ev = registrar(ctx);
  colocar(mundo, 24, 3); rodar(ctx, 120, entrada({ x: 1, z: -1 }));
  const b = ev.filter((e) => e.n === 'portal_bloqueado');
  assert.equal(b.length, 1); assert.equal(b[0].portal, 'saida_norte'); assert.equal(b[0].aviso_txt, 'txt_portal_interditado');
  assert.ok(ctx.dados.textos['pt-BR'].txt_portal_interditado);
  assert.ok(h.z >= 1 + h.raioPush - 0.01); assert.equal(mundo.mapaId, VILA);
  rodar(ctx, 60, entrada({ x: -1, z: 1 })); rodar(ctx, 120, entrada({ x: 1, z: -1 }));
  assert.equal(ev.filter((e) => e.n === 'portal_bloqueado').length, 2, 'afastar e voltar avisa de novo');
  const c = novoMundo(), evc = registrar(c); colocar(c.mundo, 24, 8); rodar(c, 1, clique(24, 0.5)); ate(c, () => evc.length > 0);
  assert.equal(evc[0]?.n, 'portal_bloqueado', 'clicar no portal inativo também avisa');
});

test('troca manual (08): portal_usado congela o herói; nada muda até concluirPortal(), que emite mapa_trocado', () => {
  const dados = carregarDados(), eventos = criarEventos(), mundo = criarMundo(dados, eventos, carregarMetas(), { trocaManual: true });
  const ctx = { dados, eventos, mundo, buffer: new BufferEntrada(dados.config.jogo.entrada.buffer_entrada_quadros) }, ev = registrar(ctx);
  colocar(mundo, 14, 15.5); ate(ctx, () => ev.length > 0, 300, entrada({ x: 1, z: -1 }));
  assert.deepEqual(ev.map((e) => e.n), ['portal_usado']);
  const pos = [mundo.heroi.x, mundo.heroi.z]; rodar(ctx, 30, entrada({ x: 1 }));
  assert.deepEqual([mundo.heroi.x, mundo.heroi.z, mundo.mapaId], [...pos, VILA]);
  assert.equal(mundo.concluirPortal(), true); assert.equal(mundo.mapaId, MAREN); assert.equal(ev[1].n, 'mapa_trocado');
  assert.equal(mundo.concluirPortal(), false, 'sem troca pendente');
});

test('interagir: tecla perto do poço e clique no poço (anda até ele) emitem interagiu; longe não', () => {
  const ctx = novoMundo(), { mundo } = ctx, ev = registrar(ctx, ['interagiu']);
  colocar(mundo, 30, 30); rodar(ctx, 1, entrada({ apertou: ['interagir'] })); assert.equal(ev.length, 0);
  colocar(mundo, 24, 26); rodar(ctx, 1, entrada({ apertou: ['interagir'] }));
  assert.equal(ev.length, 1); assert.deepEqual([ev[0].id, ev[0].nome_txt, ev[0].mapa], ['poco', 'txt_poi_poco', VILA]);
  colocar(mundo, 30, 30); rodar(ctx, 1, clique(24, 24)); ate(ctx, () => ev.length > 1);
  assert.equal(ev.length, 2); assert.equal(ev[1].id, 'poco');
});

test('estado serializável: JSON ida e volta restaura mapa, posição, direção, portal de retorno e encontros; inválido é recusado', () => {
  const ctx = novoMundo(), { mundo } = ctx; colocar(mundo, 14, 15.5);
  ate(ctx, () => mundo.mapaId === MAREN, 300, entrada({ x: 1, z: -1 })); rodar(ctx, 20, entrada({ x: -1 }));
  const salvo = JSON.parse(JSON.stringify(mundo.estadoExploracao()));
  assert.equal(salvo.mapa, MAREN); assert.deepEqual(salvo.portal_retorno, { mapa: VILA, portal: 'porta_casa_maren' }); assert.ok(salvo.encontros);
  const outro = novoMundo(); outro.mundo.restaurarExploracao(salvo);
  assert.deepEqual(JSON.parse(JSON.stringify(outro.mundo.estadoExploracao())), salvo);
  assert.equal(outro.mundo.mapa.dados.id, MAREN);
  // a volta usa o portal de retorno restaurado
  const saida = outro.mundo.mapa.dados.portais[0]; rodar(outro, 1, clique(saida.x, saida.z)); assert.ok(ate(outro, () => outro.mundo.mapaId === VILA));
  for (const ruim of [null, { ...salvo, versao: 99 }, { ...salvo, mapa: 'map_nao_existe' }, { ...salvo, x: 'a' }, { ...salvo, direcao: 'x' }, { ...salvo, portal_retorno: { mapa: 3 } }]) assert.throws(() => outro.mundo.restaurarExploracao(ruim));
  const preso = { ...salvo, mapa: VILA, x: 14, z: 10.5, portal_retorno: null }; outro.mundo.restaurarExploracao(preso); // dentro de um prédio → início do mapa
  const ini = outro.mundo.mapa.dados.inicio_jogador.tile; assert.deepEqual([outro.mundo.heroi.x, outro.mundo.heroi.z], [ini[0] + 0.5, ini[1] + 0.5]);
});
