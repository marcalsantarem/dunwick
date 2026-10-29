// Encontro aleatório por passos (13): zonas, zonas seguras, passos mínimos, carência pós-batalha, tabela por peso, semente repetível
// e a volta ao mapa no mesmo ponto. Simulação pura. A vila real é 100 % segura (D-038): os testes de sorteio usam zonas de teste.
import test from 'node:test';
import assert from 'node:assert/strict';
import { carregarDados, novoMundo, entrada, colocar } from './_util.mjs';
import { criarEventos } from '../src/jogo/eventos.js';
import { criarGatilhoEncontros } from '../src/jogo/exploracao/encontros.js';
import { decidirSimples } from '../src/jogo/batalha/politica.js';

const MAPA = 'map_baixo_orvalho';
/** Zonas de teste sobre a config real do mapa: bordas com encontro, centro e treino seguros. */
const comZonasTeste = (base) => Object.assign(base, {
  ligado: true,
  zonas_seguras: [{ id: 'z_seguro_praca', ret: [14, 14, 35, 34] }, { id: 'z_seguro_treino', ret: [6, 19, 20, 29] }],
  zonas_encontro: [
    { id: 'z_enc_norte', ret: [0, 0, 47, 9], tabela: [{ encontro: 'enc_slime_1', peso: 3 }, { encontro: 'enc_lobo_1', peso: 1 }] },
    { id: 'z_enc_sul', ret: [0, 38, 47, 47], tabela: [{ encontro: 'enc_slime_1', peso: 1 }, { encontro: 'enc_lobo_1', peso: 2 }, { encontro: 'enc_misto_1', peso: 1 }] },
    { id: 'z_enc_leste', ret: [38, 10, 47, 37], tabela: [{ encontro: 'enc_lobo_1', peso: 2 }, { encontro: 'enc_misto_1', peso: 1 }] },
    { id: 'z_enc_oeste', ret: [0, 10, 5, 37], tabela: [{ encontro: 'enc_slime_1', peso: 2 }, { encontro: 'enc_misto_1', peso: 1 }] },
  ],
});
/** Gatilho com um jogo falso (só troca o modo) e um herói falso que anda 1 tile por chamada. */
function novoGatilho(ajustar, semente = 1) {
  const cfg = comZonasTeste(carregarDados().exploracao.encontros[MAPA]); if (ajustar) ajustar(cfg);
  const eventos = criarEventos(), disparos = [], jogo = { modo: 'mapa', iniciarBatalha(id, { semente: s }) { disparos.push({ id, s }); this.modo = 'batalha'; } };
  const g = criarGatilhoEncontros(cfg, jogo, eventos, { semente }), heroi = { x: 10.5, z: 4.5, ox: 10.5, oz: 4.5 };
  const andar = (n, dx = 1, dz = 0) => { for (let i = 0; i < n; i++) { heroi.ox = heroi.x; heroi.oz = heroi.z; heroi.x += dx; heroi.z += dz; if (heroi.x > 40) heroi.x = 1.5, heroi.ox = heroi.x; g.passo(heroi); } };
  const voltar = () => { jogo.modo = 'mapa'; eventos.emitir('modo_mudou', { de: 'batalha', para: 'mapa' }); };
  return { cfg, eventos, jogo, g, heroi, andar, voltar, disparos };
}

test('dados reais: a vila inteira é segura e sem encontros (D-038); interiores não têm arquivo de zonas', () => {
  const d = carregarDados(), z = d.exploracao.encontros[MAPA];
  assert.equal(z.ligado, false); assert.deepEqual(z.zonas_encontro, []); assert.deepEqual(z.zonas_seguras.map((s) => s.ret), [[0, 0, 93, 93]]);
  for (const m of Object.values(d.mapas)) if (m.tipo_mapa === 'interior') assert.equal(d.exploracao.encontros[m.id], undefined, m.id);
});

test('zonas de teste: início e praça central seguros; bordas são zonas de encontro; segura vence encontro', () => {
  const { g, cfg } = novoGatilho();
  assert.equal(g.zonaEm(24.5, 28.5), null, 'início do jogador');
  assert.equal(g.zonaEm(12, 24), null, 'área de treino');
  assert.equal(g.zonaEm(10, 3).id, 'z_enc_norte'); assert.equal(g.zonaEm(30, 44).id, 'z_enc_sul');
  assert.equal(g.zonaEm(44, 20).id, 'z_enc_leste'); assert.equal(g.zonaEm(2, 20).id, 'z_enc_oeste');
  const usados = new Set(cfg.zonas_encontro.flatMap((z) => z.tabela.map((t) => t.encontro)));
  assert.deepEqual([...usados].sort(), ['enc_lobo_1', 'enc_misto_1', 'enc_slime_1']);
});

test('nunca dispara antes de passos_minimos, mesmo com taxa 1; dispara no passo seguinte e emite encontro_disparado', () => {
  const t = novoGatilho((c) => { c.taxa_por_passo = 1; c.passos_minimos = 12; });
  const ev = []; t.eventos.em('encontro_disparado', (d) => ev.push(d));
  t.andar(12); assert.equal(t.disparos.length, 0);
  t.andar(1); assert.equal(t.disparos.length, 1);
  assert.equal(ev.length, 1); assert.equal(ev[0].zona, 'z_enc_norte'); assert.equal(ev[0].encontro_id, t.disparos[0].id); assert.equal(ev[0].semente, t.disparos[0].s);
  t.andar(30); assert.equal(t.disparos.length, 1, 'fora do modo mapa não conta');
});

test('zona segura: passos não contam (nem no total) e não aproximam o encontro', () => {
  const t = novoGatilho((c) => { c.taxa_por_passo = 1; c.passos_minimos = 0; });
  t.heroi.x = t.heroi.ox = 16.5; t.heroi.z = t.heroi.oz = 20.5; // praça central
  t.andar(15); assert.equal(t.disparos.length, 0); assert.deepEqual([t.g.estado().passos_desde, t.g.estado().passos], [0, 0]);
});

test('mapa sem config (interior) ou sem zonas de encontro: nunca dispara; trocar de config mantém o contador', () => {
  const t = novoGatilho((c) => { c.taxa_por_passo = 1; c.passos_minimos = 5; });
  t.andar(3); assert.equal(t.g.estado().passos_desde, 3);
  t.g.definirConfig(null); t.andar(50); assert.equal(t.disparos.length, 0);
  t.g.definirConfig({ ...t.cfg, zonas_encontro: [] }); t.andar(50); assert.equal(t.disparos.length, 0);
  t.g.definirConfig(t.cfg); t.andar(2); assert.equal(t.disparos.length, 0); t.andar(1); assert.equal(t.disparos.length, 1);
});

test('carência pós-batalha: depois de voltar ao mapa, passos_carencia_pos_batalha passos não contam; o contador zera', () => {
  const t = novoGatilho((c) => { c.taxa_por_passo = 1; c.passos_minimos = 0; c.passos_carencia_pos_batalha = 8; });
  t.andar(1); assert.equal(t.disparos.length, 1);
  t.voltar(); t.andar(8); assert.equal(t.disparos.length, 1);
  t.andar(1); assert.equal(t.disparos.length, 2);
});

test('mesma semente + mesmo caminho = mesmos encontros; tabela respeita os pesos e só usa os encontros da zona', () => {
  const seq = (semente) => { const t = novoGatilho((c) => { c.passos_carencia_pos_batalha = 0; }, semente); for (let i = 0; i < 400; i++) { t.andar(1); if (t.jogo.modo !== 'mapa') t.voltar(); } return t.disparos; };
  const a = seq(7), b = seq(7), c = seq(8);
  assert.deepEqual(a, b); assert.notDeepEqual(a, c); assert.ok(a.length > 5);
  const t = novoGatilho((c) => { c.taxa_por_passo = 1; c.passos_minimos = 0; c.passos_carencia_pos_batalha = 0; }, 3);
  for (let i = 0; i < 2000; i++) { t.andar(1); t.voltar(); }
  const n = {}; for (const d of t.disparos) n[d.id] = (n[d.id] ?? 0) + 1;
  assert.deepEqual(Object.keys(n).sort(), ['enc_lobo_1', 'enc_slime_1'], 'z_enc_norte só tem slime e lobo');
  const fr = n.enc_slime_1 / t.disparos.length; assert.ok(fr > 0.7 && fr < 0.8, `slime ${fr} (peso 3:1 → 0,75)`);
});

test('teleporte (salto > 2 tiles num passo) não conta como passo; desligado não dispara; salvar/carregar o contador', () => {
  const t = novoGatilho((c) => { c.taxa_por_passo = 1; c.passos_minimos = 0; });
  t.heroi.ox = 10.5; t.heroi.x = 30.5; t.g.passo(t.heroi); assert.equal(t.g.estado().passos, 0);
  const d = novoGatilho((c) => { c.ligado = false; c.taxa_por_passo = 1; c.passos_minimos = 0; }); d.andar(50); assert.equal(d.disparos.length, 0);
  const s = novoGatilho((c) => { c.passos_minimos = 40; }); s.andar(7); const salvo = JSON.parse(JSON.stringify(s.g.salvar()));
  const u = novoGatilho(); u.g.carregar(salvo); assert.deepEqual(u.g.salvar(), salvo);
  assert.throws(() => u.g.carregar({ passos: -1, passos_desde: 0, carencia: 0 }));
});

test('mundo real: andar com W A S D na zona norte dispara a batalha; ao encerrar volta ao mapa no mesmo ponto, parado, com carência', () => {
  const ctx = novoMundo((d) => { const z = comZonasTeste(d.exploracao.encontros[MAPA]); z.taxa_por_passo = 1; z.passos_minimos = 3; z.passos_carencia_pos_batalha = 5; z.zonas_encontro[0].tabela = [{ encontro: 'enc_slime_1', peso: 1 }]; }, { livre: true, encontros: true });
  const { mundo, eventos } = ctx, jogo = mundo.jogo, ev = [];
  for (const n of ['encontro_disparado', 'batalha_iniciada', 'batalha_encerrada']) eventos.em(n, (d) => ev.push({ n, ...d }));
  colocar(mundo, 10.5, 4.5);
  let i = 0; while (jogo.modo === 'mapa' && i++ < 2000) mundo.passo(entrada({ x: 1 }), ctx.buffer); // direita na tela
  assert.equal(jogo.modo, 'batalha');
  assert.deepEqual(ev.map((e) => e.n), ['encontro_disparado', 'batalha_iniciada']);
  assert.equal(ev[0].encontro_id, 'enc_slime_1'); assert.equal(ev[1].semente, ev[0].semente);
  assert.equal(mundo.encontros.estado().passos, 4);
  const pos = { x: mundo.heroi.x, z: mundo.heroi.z };
  for (let k = 0; k < 30; k++) mundo.passo(entrada({ x: 1 }), ctx.buffer);
  assert.deepEqual({ x: mundo.heroi.x, z: mundo.heroi.z }, pos, 'mapa congelado na batalha');
  const c = jogo.batalha; let g = 0;
  while (!c.fim) { for (let u = c.atorDaVez(); u; u = c.atorDaVez()) c.enviarComando({ ator: u, ...decidirSimples(c, ctx.dados, u) }); c.executar(); assert.ok(++g < 100); }
  const r = jogo.encerrarBatalha(); if (r.resultado === 'derrota') jogo.tentarDeNovo();
  assert.equal(jogo.modo, 'mapa');
  assert.deepEqual({ x: mundo.heroi.x, z: mundo.heroi.z, vx: mundo.heroi.vx, destino: mundo.heroi.destino }, { ...pos, vx: 0, destino: null });
  const antes = mundo.encontros.estado().passos;
  i = 0; while (mundo.encontros.estado().passos < antes + 5 && i++ < 2000) mundo.passo(entrada({ x: -1 }), ctx.buffer);
  assert.equal(jogo.modo, 'mapa', 'carência: 5 passos sem encontro');
  i = 0; while (jogo.modo === 'mapa' && i++ < 2000) mundo.passo(entrada({ x: -1 }), ctx.buffer);
  assert.equal(jogo.modo, 'batalha'); assert.equal(mundo.encontros.estado().passos, antes + 5 + 4, 'carência 5 + mínimo 3 + 1');
});

test('mundo real com a vila de verdade: andar pela vila inteira nunca dispara encontro (D-038)', () => {
  const ctx = novoMundo(null, { encontros: true }), { mundo } = ctx; let disparos = 0;
  ctx.eventos.em('encontro_disparado', () => disparos++);
  for (const dir of [{ x: 1 }, { z: 1 }, { x: -1 }, { z: -1 }]) for (let k = 0; k < 600; k++) mundo.passo(entrada({ ...dir, correr: true }), ctx.buffer);
  assert.equal(disparos, 0); assert.equal(mundo.jogo.modo, 'mapa');
});
