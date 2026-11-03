// NPCs, diálogo e loja (13, v0.1.4): colisão, falar (E/clique), virar um para o outro, mapa travado durante a conversa, loja com
// compra e venda em Coroas. Simulação pura. Dados do 02/06/14 ainda a caminho: NPCs, loja e preços de teste em memória.
import test from 'node:test';
import assert from 'node:assert/strict';
import { novoMundo, entrada, colocar, rodar } from './_util.mjs';

const POCAO = 'item_pocao_ervas', LEMBRANCA = 'item_lembranca_edric';
let NX, NZ; // ponto livre perto do início da vila (calculado no ajuste)
function comNpcs(d) {
  const vila = Object.values(d.mapas).find((m) => m.tipo_mapa === 'exterior'), [ix, iz] = vila.inicio_jogador.tile;
  NX = ix + 0.5; NZ = iz + 3.5;
  vila.npcs = [{ id: 'npc_falante', x: NX, z: NZ, dir: 'n' }, { id: 'npc_vendedor', x: NX + 4, z: NZ, dir: 's' }];
  d.npcs = {
    npc_falante: { id: 'npc_falante', nome_txt: 'txt_poi_poco', cor: '#a0c0ff', raio: 0.35, falas: ['txt_f1', 'txt_f2', 'txt_f3'] },
    npc_vendedor: { id: 'npc_vendedor', nome_txt: 'txt_poi_poco', cor: '#ffc080', raio: 0.35, falas: ['txt_v1'], loja: 'shop_teste' },
  };
  d.lojas = { shop_teste: { id: 'shop_teste', nome_txt: 'txt_poi_poco', mult_venda: 0.5, itens: [{ item: POCAO, preco: 10 }] } };
  d.combate.itens[POCAO].preco = 10; if (d.combate.itens[LEMBRANCA]) d.combate.itens[LEMBRANCA].vendavel = false;
}
const novo = () => { const ctx = novoMundo(comNpcs), ev = []; for (const n of ['dialogo_iniciado', 'fala_mudou', 'loja_oferecida', 'loja_aberta', 'compra', 'venda', 'loja_fechada', 'dialogo_encerrado']) ctx.eventos.em(n, (d) => ev.push({ n, ...d })); return { ...ctx, ev }; };
const E = entrada({ apertou: ['interagir'] });

test('NPC é sólido: o herói não atravessa e a rota do clique contorna', () => {
  const ctx = novo(), { mundo } = ctx, h = mundo.heroi;
  assert.equal(mundo.mapa.livre(NX, NZ, h.raioPush), false);
  colocar(mundo, NX, NZ - 2); rodar(ctx, 120, entrada({ x: -1, z: 1 })); // +z no mundo, direto no NPC
  assert.ok(Math.hypot(h.x - NX, h.z - NZ) >= 0.35 + h.raioPush - 0.02, 'atravessou o NPC');
});

test('E perto do NPC: abre o diálogo, um vira para o outro, o mapa trava; avançar passa as falas e a última encerra', () => {
  const ctx = novo(), { mundo, ev } = ctx, h = mundo.heroi, c = mundo.conversa, n = mundo.npcs.find((q) => q.id === 'npc_falante');
  colocar(mundo, NX, NZ - 1.2); rodar(ctx, 1, E);
  assert.equal(c.ativa, true); assert.deepEqual([ev[0].n, ev[0].npc, ev[0].falas.length, ev[0].loja], ['dialogo_iniciado', 'npc_falante', 3, null]);
  assert.ok(Math.abs(Math.sin(h.face) - 1) < 1e-6, 'herói olha para o NPC (+z)'); assert.ok(Math.abs(Math.sin(n.face) + 1) < 1e-6, 'NPC olha para o herói (−z)'); assert.equal(n.falando, true);
  const pos = [h.x, h.z]; rodar(ctx, 60, entrada({ x: 1 })); assert.deepEqual([h.x, h.z], pos, 'mapa travado');
  c.avancar(); c.avancar(); assert.deepEqual(ev.filter((e) => e.n === 'fala_mudou').map((e) => e.fala_txt), ['txt_f2', 'txt_f3']);
  c.avancar(); assert.equal(c.ativa, false); assert.equal(ev[ev.length - 1].n, 'dialogo_encerrado'); assert.equal(n.falando, false);
  rodar(ctx, 30, entrada({ x: 1 })); assert.notDeepEqual([h.x, h.z], pos, 'volta a andar');
});

test('clique no NPC de longe: anda até ele e abre o diálogo', () => {
  const ctx = novo(), { mundo } = ctx; colocar(mundo, NX - 4, NZ - 3);
  rodar(ctx, 1, entrada({ apertou: ['clique_principal'], cursor: { x: NX, z: NZ } }));
  let i = 0; while (!mundo.conversa.ativa && i++ < 1200) rodar(ctx, 1, entrada());
  assert.equal(mundo.conversa.npc, 'npc_falante');
});

test('loja: depois das falas oferece; comprar com e sem Coroas, vender pela metade, não vendável e sem item recusados; Sair fecha tudo', () => {
  const ctx = novo(), { mundo, ev } = ctx, c = mundo.conversa, jogo = mundo.jogo;
  colocar(mundo, NX + 4, NZ - 1.2); rodar(ctx, 1, E); assert.equal(c.loja, 'shop_teste');
  assert.deepEqual(c.comprar(POCAO, 1), { ok: false, erro: 'loja_fechada' });
  c.avancar(); assert.equal(ev[ev.length - 1].n, 'loja_oferecida'); assert.equal(c.ativa, true);
  c.abrirLoja(); const la = ev.find((e) => e.n === 'loja_aberta'); assert.deepEqual(la.itens, [{ item: POCAO, nome_txt: ctx.dados.combate.itens[POCAO].nome_txt, preco: 10 }]);
  const moedas0 = jogo.moedas, mochila0 = jogo.inventario[POCAO] ?? 0;
  if (moedas0 < 20) jogo.alterarMoedas(20 - moedas0); jogo.alterarMoedas(-jogo.moedas); // começa com 0
  assert.deepEqual(c.comprar(POCAO, 1), { ok: false, erro: 'sem_moedas' }); assert.equal(jogo.inventario[POCAO] ?? 0, mochila0);
  jogo.alterarMoedas(25);
  assert.deepEqual(c.comprar(POCAO, 2), { ok: true, moedas: 5, qtd_mochila: mochila0 + 2 });
  assert.deepEqual(c.vender(POCAO, 1), { ok: true, moedas: 10, qtd_mochila: mochila0 + 1 }, 'venda = 50 % de 10');
  assert.equal(c.precoVenda(POCAO), 5);
  for (const [args, erro] of [[[POCAO, 0], 'qtd_invalida'], [['item_nao_existe', 1], 'item_invalido'], [[POCAO, 999], 'sem_item']]) assert.equal(c.vender(...args).erro, erro);
  if (ctx.dados.combate.itens[LEMBRANCA]) { jogo.adicionarItem(LEMBRANCA, 1); assert.equal(c.vender(LEMBRANCA, 1).erro, 'nao_vendavel'); }
  assert.deepEqual(ev.filter((e) => e.n === 'compra' || e.n === 'venda').map((e) => [e.n, e.qtd, e.total, e.moedas]), [['compra', 2, 20, 5], ['venda', 1, 5, 10]]);
  c.encerrar(); assert.deepEqual(ev.slice(-2).map((e) => e.n), ['loja_fechada', 'dialogo_encerrado']); assert.equal(c.ativa, false);
  assert.equal(jogo.estado().moedas, 10, 'moedas no estado do jogo (serializável)');
  assert.equal(JSON.stringify(mundo.estadoExploracao()).includes('conversa'), false, 'conversa e loja não entram no save');
});

test('contrato do 15 em mundo.jogo: dialogo/loja lidos ao vivo; avancarDialogo na última fala abre a loja; comprar/vender com motivo; fecharLoja', () => {
  const ctx = novo(), { mundo } = ctx, jogo = mundo.jogo;
  assert.equal(jogo.dialogo, null); assert.equal(jogo.loja, null);
  colocar(mundo, NX + 4, NZ - 1.2); rodar(ctx, 1, E);
  assert.deepEqual(jogo.dialogo, { npc: 'npc_vendedor', nome_txt: 'txt_poi_poco', cor: '#ffc080', falas: ['txt_v1'], i: 0, loja: 'shop_teste' });
  assert.deepEqual(jogo.estoqueLoja('shop_teste'), [{ item: POCAO, preco: 10, estoque: null }]); assert.deepEqual(jogo.estoqueLoja('shop_nada'), []);
  jogo.avancarDialogo(); assert.equal(jogo.dialogo, null); assert.deepEqual(jogo.loja, { id: 'shop_teste', npc: 'npc_vendedor', nome_txt: 'txt_poi_poco' });
  jogo.alterarMoedas(-jogo.moedas);
  assert.equal(jogo.comprar('shop_teste', POCAO, 1).motivo, 'sem_moedas'); assert.equal(jogo.comprar('shop_outra', POCAO, 1).motivo, 'loja_fechada');
  jogo.alterarMoedas(10); assert.equal(jogo.comprar('shop_teste', POCAO, 1).ok, true); assert.equal(jogo.moedas, 0);
  assert.equal(jogo.precoVenda(POCAO), 5); assert.equal(jogo.vender('shop_teste', POCAO, 1).ok, true); assert.equal(jogo.moedas, 5);
  jogo.fecharLoja(); assert.equal(jogo.loja, null); assert.equal(mundo.conversa.ativa, false);
  colocar(mundo, NX, NZ - 1.2); rodar(ctx, 1, E); jogo.avancarDialogo(); jogo.avancarDialogo(); jogo.avancarDialogo();
  assert.equal(jogo.dialogo, null, 'sem loja: a última fala encerra'); assert.equal(jogo.loja, null);
});

test('NPC nasce virado para o `dir` do mapa; venda usa o preço `venda` do 06 quando a loja traz', () => {
  const ctx = novoMundo((d) => { comNpcs(d); d.lojas.shop_teste.itens[0].venda = 3; }), { mundo } = ctx, jogo = mundo.jogo;
  const n = mundo.npcs.find((q) => q.id === 'npc_falante'); assert.ok(Math.abs(Math.cos(n.face) + Math.SQRT1_2) < 1e-6 && Math.abs(Math.sin(n.face) + Math.SQRT1_2) < 1e-6, 'dir n');
  colocar(mundo, NX + 4, NZ - 1.2); rodar(ctx, 1, E); jogo.avancarDialogo(); assert.equal(jogo.precoVenda(POCAO), 3);
});

test('menu principal (D-050): trava o mapa e emite menu_aberto/fechado; não abre em batalha, diálogo/loja nem troca de mapa pendente', () => {
  const ctx = novo(), { mundo } = ctx, h = mundo.heroi, m = mundo.menu, ev = []; for (const n of ['menu_aberto', 'menu_fechado']) ctx.eventos.em(n, () => ev.push(n));
  colocar(mundo, NX - 4, NZ - 3); rodar(ctx, 10, entrada({ x: 1 }));
  assert.equal(m.abrir(), true); assert.equal(h.velocidade(), 0); const pos = [h.x, h.z];
  rodar(ctx, 30, entrada({ x: 1 })); assert.deepEqual([h.x, h.z], pos, 'travado'); assert.equal(m.abrir(), false, 'já aberto');
  assert.equal(m.fechar(), true); rodar(ctx, 10, entrada({ x: 1 })); assert.notDeepEqual([h.x, h.z], pos); assert.deepEqual(ev, ['menu_aberto', 'menu_fechado']);
  colocar(mundo, NX, NZ - 1.2); rodar(ctx, 1, E); assert.equal(mundo.conversa.ativa, true); assert.equal(m.abrir(), false, 'diálogo'); mundo.conversa.encerrar();
  mundo.jogo.depurarEncontro(); assert.equal(mundo.jogo.modo, 'batalha'); assert.equal(m.abrir(), false, 'batalha');
  assert.deepEqual(ev, ['menu_aberto', 'menu_fechado']);
});

test('estoque limitado (qtd na loja): acaba e recusa com sem_estoque; estoqueLoja mostra o que resta; item equipado não está na mochila para vender', () => {
  const ctx = novoMundo((d) => { comNpcs(d); d.lojas.shop_teste.itens[0].qtd = 2; }), { mundo } = ctx, jogo = mundo.jogo;
  colocar(mundo, NX + 4, NZ - 1.2); rodar(ctx, 1, E); jogo.avancarDialogo(); jogo.alterarMoedas(100);
  assert.equal(jogo.estoqueLoja('shop_teste')[0].estoque, 2);
  assert.equal(jogo.comprar('shop_teste', POCAO, 3).motivo, 'sem_estoque'); assert.equal(jogo.comprar('shop_teste', POCAO, 2).ok, true);
  assert.equal(jogo.estoqueLoja('shop_teste')[0].estoque, 0); assert.equal(jogo.comprar('shop_teste', POCAO, 1).motivo, 'sem_estoque');
  const equip = Object.values(ctx.dados.combate.itens).find((i) => i.categoria === 'equipamento' && i.para?.includes('hero_edric'));
  if (equip) { jogo.adicionarItem(equip.id, 1); jogo.fecharLoja(); assert.equal(jogo.equipar('hero_edric', equip.id).ok, true); assert.equal(jogo.inventario[equip.id] ?? 0, 0, 'equipado sai da mochila (não vende)'); }
});
