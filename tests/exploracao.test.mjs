// Exploração da vila (13, v0.1.2): colisão dos prédios, rota do clique, portas ida e volta, portal inativo, troca manual (08),
// interagir com objeto e estado serializável. Simulação pura, com os mapas reais de data/maps.
import test from 'node:test';
import assert from 'node:assert/strict';
import { carregarDados, carregarMetas, novoMundo, entrada, colocar, rodar, DV } from './_util.mjs';
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
  colocar(mundo, 14 + DV, 42.5 + DV); // ao sul da casa_sul_1 (x 12–16, z 36–40, + DV)
  rodar(ctx, 300, entrada({ x: 1, z: -1 })); // −z no mundo
  assert.ok(mundo.heroi.z >= 40 + DV + r - 0.01, `entrou na casa: z=${mundo.heroi.z}`);
});

test('clique atrás de uma casa: a rota contorna o prédio e chega; nunca fica dentro de colisão', () => {
  const ctx = novoMundo(), { mundo } = ctx, h = mundo.heroi;
  colocar(mundo, 14 + DV, 42.5 + DV); rodar(ctx, 1, clique(14 + DV, 34.5 + DV));
  let dentro = false; assert.ok(ate(ctx, () => { if (!mundo.mapa.livre(h.x, h.z, h.raioPush - 0.02)) dentro = true; return !h.destino && h.velocidade() < 0.01; }));
  assert.ok(Math.hypot(h.x - 14 - DV, h.z - 34.5 - DV) < 0.3, `chegou? ${h.x},${h.z}`); assert.equal(dentro, false);
});

test('não prende: 40 cliques aleatórios pela vila sempre terminam parados, fora de colisão e no mapa da vila', () => {
  const ctx = novoMundo(), { mundo } = ctx, h = mundo.heroi; let s = 12345; const rnd = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (let k = 0; k < 40; k++) {
    const x = DV + 2 + rnd() * 44, z = DV + 3 + rnd() * 42, alvoPortal = mundo.portais && (mundo.mapa.dados.portais.some((p) => Math.abs(p.x - x) < 2 && Math.abs(p.z - z) < 2) || mundo.mapa.dados.edificios.some((e) => Math.abs(e.x - x) < e.w / 2 + 0.5 && Math.abs(e.z - z) < e.d / 2 + 0.5));
    if (alvoPortal) continue; // clicar em porta/prédio entra no interior (testado à parte)
    rodar(ctx, 1, clique(x, z)); assert.ok(ate(ctx, () => !h.destino && h.velocidade() < 0.01, 2400), `clique ${k} (${x.toFixed(1)}, ${z.toFixed(1)}) não terminou`);
    assert.equal(mundo.mapaId, VILA); assert.ok(mundo.mapa.livre(h.x, h.z, h.raioPush - 0.02), `preso em colisão em ${h.x},${h.z}`);
  }
});

test('porta ida e volta: clicar na casa da Maren entra pelo portal; sair leva à porta, virado para fora; portal de retorno no estado', () => {
  const ctx = novoMundo(), { mundo } = ctx, h = mundo.heroi, ev = registrar(ctx);
  const porta = mundo.mapa.dados.portais.find((p) => p.id === 'porta_casa_maren');
  colocar(mundo, 20 + DV, 20 + DV); rodar(ctx, 1, clique(14 + DV, 10.5 + DV)); // no meio do prédio
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
  const ctx = novoMundo(), { mundo } = ctx; colocar(mundo, 14 + DV, 15.5 + DV);
  assert.ok(ate(ctx, () => mundo.mapaId === MAREN, 300, entrada({ x: 1, z: -1 })));
});

test('portal inativo (saída norte): bloqueia, avisa uma vez por contato com texto por ID, e o mapa não muda', () => {
  const ctx = novoMundo(), { mundo } = ctx, h = mundo.heroi, ev = registrar(ctx);
  colocar(mundo, 24 + DV, -5 + DV); rodar(ctx, 120, entrada({ x: 1, z: -1 })); // saída norte no vão da estacada (z −8 local)
  const b = ev.filter((e) => e.n === 'portal_bloqueado');
  assert.equal(b.length, 1); assert.equal(b[0].portal, 'saida_norte'); assert.equal(b[0].aviso_txt, 'txt_portal_interditado');
  assert.ok(ctx.dados.textos['pt-BR'].txt_portal_interditado);
  assert.ok(h.z >= -7.5 + DV + h.raioPush - 0.01); assert.equal(mundo.mapaId, VILA);
  rodar(ctx, 60, entrada({ x: -1, z: 1 })); rodar(ctx, 120, entrada({ x: 1, z: -1 }));
  assert.equal(ev.filter((e) => e.n === 'portal_bloqueado').length, 2, 'afastar e voltar avisa de novo');
  const c = novoMundo(), evc = registrar(c); colocar(c.mundo, 24 + DV, DV); rodar(c, 1, clique(24 + DV, -8 + DV)); ate(c, () => evc.length > 0);
  assert.equal(evc[0]?.n, 'portal_bloqueado', 'clicar no portal inativo também avisa');
});

test('troca manual (08): portal_usado congela o herói; nada muda até concluirPortal(), que emite mapa_trocado', () => {
  const dados = carregarDados(), eventos = criarEventos(), mundo = criarMundo(dados, eventos, carregarMetas(), { trocaManual: true });
  const ctx = { dados, eventos, mundo, buffer: new BufferEntrada(dados.config.jogo.entrada.buffer_entrada_quadros) }, ev = registrar(ctx);
  colocar(mundo, 14 + DV, 15.5 + DV); ate(ctx, () => ev.length > 0, 300, entrada({ x: 1, z: -1 }));
  assert.deepEqual(ev.map((e) => e.n), ['portal_usado']);
  const pos = [mundo.heroi.x, mundo.heroi.z]; rodar(ctx, 30, entrada({ x: 1 }));
  assert.deepEqual([mundo.heroi.x, mundo.heroi.z, mundo.mapaId], [...pos, VILA]);
  assert.equal(mundo.concluirPortal(), true); assert.equal(mundo.mapaId, MAREN); assert.equal(ev[1].n, 'mapa_trocado');
  assert.equal(mundo.concluirPortal(), false, 'sem troca pendente');
});

test('interagir: tecla perto do poço e clique no poço (anda até ele) emitem interagiu; longe não', () => {
  const ctx = novoMundo(), { mundo } = ctx, ev = registrar(ctx, ['interagiu']);
  colocar(mundo, 30 + DV, 30 + DV); rodar(ctx, 1, entrada({ apertou: ['interagir'] })); assert.equal(ev.length, 0);
  colocar(mundo, 24 + DV, 26 + DV); rodar(ctx, 1, entrada({ apertou: ['interagir'] }));
  assert.equal(ev.length, 1); assert.deepEqual([ev[0].id, ev[0].nome_txt, ev[0].mapa], ['poco', 'txt_poi_poco', VILA]);
  colocar(mundo, 30 + DV, 30 + DV); rodar(ctx, 1, clique(24 + DV, 24 + DV)); ate(ctx, () => ev.length > 1);
  assert.equal(ev.length, 2); assert.equal(ev[1].id, 'poco');
});

test('estado serializável: JSON ida e volta restaura mapa, posição, direção, portal de retorno e encontros; inválido é recusado', () => {
  const ctx = novoMundo(), { mundo } = ctx; colocar(mundo, 14 + DV, 15.5 + DV);
  ate(ctx, () => mundo.mapaId === MAREN, 300, entrada({ x: 1, z: -1 })); rodar(ctx, 20, entrada({ x: -1 }));
  const salvo = JSON.parse(JSON.stringify(mundo.estadoExploracao()));
  assert.equal(salvo.mapa, MAREN); assert.deepEqual(salvo.portal_retorno, { mapa: VILA, portal: 'porta_casa_maren' }); assert.ok(salvo.encontros);
  const outro = novoMundo(); outro.mundo.restaurarExploracao(salvo);
  assert.deepEqual(JSON.parse(JSON.stringify(outro.mundo.estadoExploracao())), salvo);
  assert.equal(outro.mundo.mapa.dados.id, MAREN);
  // a volta usa o portal de retorno restaurado
  const saida = outro.mundo.mapa.dados.portais[0]; rodar(outro, 1, clique(saida.x, saida.z)); assert.ok(ate(outro, () => outro.mundo.mapaId === VILA));
  for (const ruim of [null, { ...salvo, versao: 99 }, { ...salvo, mapa: 'map_nao_existe' }, { ...salvo, x: 'a' }, { ...salvo, direcao: 'x' }, { ...salvo, portal_retorno: { mapa: 3 } }]) assert.throws(() => outro.mundo.restaurarExploracao(ruim));
  const preso = { ...salvo, mapa: VILA, x: 14 + DV, z: 10.5 + DV, portal_retorno: null }; outro.mundo.restaurarExploracao(preso); // dentro de um prédio → início do mapa
  const ini = outro.mundo.mapa.dados.inicio_jogador.tile; assert.deepEqual([outro.mundo.heroi.x, outro.mundo.heroi.z], [ini[0] + 0.5, ini[1] + 0.5]);
});

// ---- v0.1.2b: boneco de treino e baú de tesouro (dados do 14 ainda a caminho: injetados em memória) ----
const ENC_TREINO = 'enc_slime_1', ITEM_BAU = 'item_pocao_ervas'; // substitutos até chegarem enc_boneco_treino e o item do 06
const comInterativos = (d) => {
  (d.mapas[VILA].pois ??= []).push({ id: 'boneco_treino', tipo: 'boneco_treino', x: 24 + DV, z: 31 + DV, nome_txt: 'txt_poi_poco', encontro: ENC_TREINO });
  (d.mapas[MAREN].pois ??= []).push({ id: 'bau_teste', tipo: 'bau_tesouro', x: 5, z: 3, nome_txt: 'txt_poi_poco', item: ITEM_BAU, quantidade: 2 });
};
const vencer = (ctx) => { ctx.mundo.jogo.batalha.abandonar(); return ctx.mundo.jogo.encerrarBatalha(); }; // termina já (fuga): o que importa aqui é a volta ao mapa

test('boneco de treino: E ao lado (ou clique) inicia a batalha; ao voltar o boneco segue lá, repete sem limite e o contador de encontros não muda', () => {
  const ctx = novoMundo(comInterativos, { encontros: true }), { mundo } = ctx, jogo = mundo.jogo, ev = registrar(ctx, ['treino_iniciado', 'batalha_iniciada']);
  mundo.encontros.carregar({ passos: 30, passos_desde: 7, carencia: 0 });
  for (let k = 0; k < 3; k++) {
    colocar(mundo, 24 + DV, 29.5 + DV); rodar(ctx, 1, entrada({ apertou: ['interagir'] }));
    assert.equal(jogo.modo, 'batalha', `rodada ${k}`); assert.equal(jogo.batalha.consultar().encontro, ENC_TREINO);
    vencer(ctx); assert.equal(jogo.modo, 'mapa');
    assert.deepEqual(mundo.encontros.salvar(), { passos: 30, passos_desde: 7, carencia: 0 }, 'sem carência nem passos');
  }
  assert.equal(ev.filter((e) => e.n === 'treino_iniciado').length, 3);
  assert.ok(mundo.mapa.dados.pois.some((p) => p.id === 'boneco_treino'), 'o boneco continua no mapa');
  colocar(mundo, 30 + DV, 30 + DV); rodar(ctx, 1, clique(24 + DV, 31 + DV)); assert.ok(ate(ctx, () => jogo.modo === 'batalha'), 'clique: anda até o boneco e inicia');
});

test('baú de tesouro: abre uma vez, item na mochila, emite achado e bau_aberto; de novo só bau_vazio; aberto entra no estado e volta no carregar', () => {
  const ctx = novoMundo(comInterativos), { mundo } = ctx, jogo = mundo.jogo, ev = registrar(ctx, ['achado', 'bau_aberto', 'bau_vazio', 'inventario_mudou']);
  colocar(mundo, 14 + DV, 15.5 + DV); ate(ctx, () => mundo.mapaId === MAREN, 300, entrada({ x: 1, z: -1 }));
  const antes = jogo.inventario[ITEM_BAU] ?? 0;
  colocar(mundo, 5, 4.5); rodar(ctx, 1, entrada({ apertou: ['interagir'] }));
  assert.equal(jogo.inventario[ITEM_BAU], antes + 2);
  assert.deepEqual(ev.map((e) => e.n), ['inventario_mudou', 'bau_aberto', 'achado']);
  assert.deepEqual({ ...ev[2], n: undefined }, { n: undefined, origem: 'bau_teste', item: ITEM_BAU, qtd: 2 });
  rodar(ctx, 1, entrada({ apertou: ['interagir'] }));
  assert.equal(jogo.inventario[ITEM_BAU], antes + 2); assert.equal(ev[ev.length - 1].n, 'bau_vazio');
  const salvo = JSON.parse(JSON.stringify(mundo.estadoExploracao()));
  assert.equal(salvo.versao, 2); assert.deepEqual(salvo.objetos, { baus_abertos: [`${MAREN}/bau_teste`] });
  const outro = novoMundo(comInterativos), ev2 = registrar(outro, ['achado', 'bau_vazio']);
  outro.mundo.restaurarExploracao(salvo); assert.equal(outro.mundo.objetos.aberto(MAREN, 'bau_teste'), true);
  colocar(outro.mundo, 5, 4.5); rodar(outro, 1, entrada({ apertou: ['interagir'] })); assert.deepEqual(ev2.map((e) => e.n), ['bau_vazio'], 'não reaparece');
  assert.throws(() => outro.mundo.restaurarExploracao({ ...salvo, objetos: { baus_abertos: ['<script>'] } }));
  assert.equal(outro.mundo.objetos.aberto(MAREN, 'bau_teste'), true, 'estado inválido não muda nada');
  const v1 = { ...salvo, versao: 1 }; delete v1.objetos; outro.mundo.restaurarExploracao(v1); assert.equal(outro.mundo.objetos.aberto(MAREN, 'bau_teste'), false, 'versão 1 migra sem baús abertos');
});

test('contrato do 14: poi e objeto com o mesmo id viram um interativo só (encontro/item do objeto, nome do poi)', async () => {
  const { interativosDe } = await import('../src/jogo/exploracao/portais.js');
  const md = { objetos: [{ id: 'boneco_treino', tipo: 'boneco_treino', x: 11.5, z: 24, encontro: 'enc_x' }, { id: 'barril_1', tipo: 'barril', x: 1, z: 1 }], pois: [{ id: 'boneco_treino', tipo: 'boneco_treino', x: 11.5, z: 24, nome_txt: 'txt_y' }, { id: 'poco', tipo: 'poco', x: 3, z: 3, nome_txt: 'txt_p' }] };
  const l = interativosDe(md);
  assert.deepEqual(l.map((o) => o.id).sort(), ['boneco_treino', 'poco']);
  assert.deepEqual(l.find((o) => o.id === 'boneco_treino'), { id: 'boneco_treino', tipo: 'boneco_treino', x: 11.5, z: 24, encontro: 'enc_x', nome_txt: 'txt_y' });
});
