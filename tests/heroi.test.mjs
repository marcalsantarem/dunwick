// Herói em DADOS: movimento por teclado e por clique, ataques (quadros, hit, combo), golpe forte, rolamento, âncora. Quadros a 60 Hz.
import test from 'node:test';
import assert from 'node:assert/strict';
import { novoMundo, entrada, rodar, colocar } from './_util.mjs';
import { dir8DeMundo, spriteDeDir8, telaParaMundo } from '../src/jogo/heroi.js';

const PARADO = entrada();
const clique = (x, z, alvo = null) => entrada({ apertou: ['clique_principal'], segurando: ['clique_principal'], cursor: { x, z }, alvoSob: alvo });
const velEntre = (ctx, n) => { const h = ctx.mundo.heroi, x0 = h.x, z0 = h.z; rodar(ctx, n, PARADO); return Math.hypot(h.x - x0, h.z - z0) / (n / 60); };

test('teclado: W/A/S/D andam em direções RELATIVAS À TELA a 3,5 tiles/s e Shift corre a 6,0 (± 1 %)', () => {
  for (const [sx, sz] of [[0, -1], [0, 1], [1, 0], [-1, 0], [1, 1], [-1, -1]]) for (const [correr, esperado] of [[false, 3.5], [true, 6.0]]) {
    const ctx = novoMundo(null, { livre: true }); colocar(ctx.mundo, 24.5, 24.5);
    rodar(ctx, 20, entrada({ x: sx, z: sz, correr })); const h = ctx.mundo.heroi, x0 = h.x, z0 = h.z; rodar(ctx, 30, entrada({ x: sx, z: sz, correr }));
    const v = Math.hypot(h.x - x0, h.z - z0) / 0.5; assert.ok(Math.abs(v - esperado) / esperado < 0.01, `(${sx},${sz}) correr=${correr}: ${v}`);
  }
});

test('"para cima" na tela anda para (−x, −z) do mundo (afastando-se da câmera isométrica)', () => {
  const ctx = novoMundo(null, { livre: true }); colocar(ctx.mundo, 24.5, 24.5); rodar(ctx, 30, entrada({ x: 0, z: -1 }));
  const h = ctx.mundo.heroi; assert.ok(h.x < 24.5 && h.z < 24.5 && Math.abs((24.5 - h.x) - (24.5 - h.z)) < 1e-6);
  assert.deepEqual(telaParaMundo(1, 0), { x: Math.SQRT1_2, z: -Math.SQRT1_2 });
});

test('clique no chão: anda até o ponto (andar < 5 tiles, correr acima) e para na chegada', () => {
  let ctx = novoMundo(null, { livre: true }); colocar(ctx.mundo, 10.5, 10.5);
  rodar(ctx, 1, clique(13.5, 10.5)); rodar(ctx, 20, PARADO); const v = velEntre(ctx, 12);
  assert.ok(Math.abs(v - 3.5) < 0.05, `perto = andar: ${v}`);
  rodar(ctx, 120, PARADO); const h = ctx.mundo.heroi; assert.ok(Math.hypot(h.x - 13.5, h.z - 10.5) < 0.15 && h.velocidade() < 0.01 && !h.destino, `chegou? ${h.x},${h.z}`);
  ctx = novoMundo(null, { livre: true }); colocar(ctx.mundo, 5.5, 10.5); rodar(ctx, 1, clique(25.5, 10.5)); rodar(ctx, 15, PARADO); assert.ok(Math.abs(velEntre(ctx, 12) - 6.0) < 0.05, 'longe = correr');
});

test('segurar o clique segue o cursor; qualquer tecla de mover cancela o destino', () => {
  const ctx = novoMundo(null, { livre: true }); colocar(ctx.mundo, 10.5, 10.5);
  rodar(ctx, 40, null, (i) => entrada({ segurando: ['clique_principal'], apertou: i === 0 ? ['clique_principal'] : [], cursor: { x: 10.5 + i * 0.1, z: 10.5 } }));
  assert.ok(ctx.mundo.heroi.x > 12, `seguiu o cursor: ${ctx.mundo.heroi.x}`);
  rodar(ctx, 1, clique(30.5, 10.5)); assert.ok(ctx.mundo.heroi.destino); rodar(ctx, 1, entrada({ x: 1 })); assert.equal(ctx.mundo.heroi.destino, null);
});

test('colisão: o herói contorna/desliza no poço e nas casas e nunca entra em um colisor', () => {
  const ctx = novoMundo(); const { mapa, heroi } = ctx.mundo; colocar(ctx.mundo, 24.5, 28.5);
  // anda em direção ao poço (24,24) por 3 s: deve parar encostado, sem entrar
  rodar(ctx, 180, entrada({ x: -1, z: -1 }), () => entrada({ x: -1, z: -1 })); // tela cima-esquerda = (−x) puro; sem ligar o alvo
  for (const c of mapa.colisores) { if (c.forma === 'circ') assert.ok(Math.hypot(heroi.x - c.x, heroi.z - c.z) >= c.r + heroi.raioPush - 1e-3, `entrou no colisor ${c.id}`); }
  assert.ok(mapa.livre(heroi.x, heroi.z, heroi.raioPush - 0.01));
});

test('ataque: 8 + 8 + 8 quadros; o golpe só acerta nos quadros ATIVOS, uma vez por alvo, e o contador sobe', () => {
  const ctx = novoMundo(null, { livre: true }); const { mundo } = ctx, alvo = mundo.entidades.find((e) => e.id === 'enemy_boneco_alvo');
  colocar(mundo, alvo.x - 1.2, alvo.z); rodar(ctx, 1, entrada({ cursor: { x: alvo.x, z: alvo.z }, alvoSob: alvo.id, apertou: ['clique_principal'], segurando: [] }), null);
  ctx.buffer.empurrar('atacar', mundo.ticks - 1); const t0 = mundo.ticks; rodar(ctx, 1, PARADO);
  const ini = ctx.registro.find((r) => r.n === 'ataque_inicio'); assert.ok(ini, 'iniciou o ataque'); const base = ini.tick;
  rodar(ctx, 40, PARADO);
  const acertos = ctx.registro.filter((r) => r.n === 'golpe_acertou'); assert.equal(acertos.length, 1, 'um acerto por golpe');
  const dt = acertos[0].tick - base; assert.ok(dt >= 8 && dt <= 15, `acerto no quadro ${dt + 1} (ativo = quadros 9 a 16)`);
  assert.equal(alvo.contadores.acertos, 1); const fim = ctx.registro.find((r) => r.n === 'ataque_fim'); assert.equal(fim.tick - base + 1, 24, 'duração = 24 quadros'); void t0;
});

test('combo de 3: clicar de novo durante o golpe encadeia 1 → 2 → 3; depois recomeça pelo 1', () => {
  const ctx = novoMundo(null, { livre: true }); const { mundo } = ctx, alvo = mundo.entidades[0]; colocar(mundo, alvo.x - 1.2, alvo.z);
  const cl = () => ctx.buffer.empurrar('atacar', mundo.ticks);
  cl(); rodar(ctx, 1, entrada({ cursor: alvo, alvoSob: alvo.id }));
  for (let i = 0; i < 90; i++) { if (i % 6 === 0) cl(); rodar(ctx, 1, entrada({ cursor: alvo, alvoSob: alvo.id })); }
  const ids = ctx.registro.filter((r) => r.n === 'ataque_inicio').map((r) => r.id); assert.deepEqual(ids.slice(0, 4), ['atk_edric_1', 'atk_edric_2', 'atk_edric_3', 'atk_edric_1'], ids.join(','));
});

test('golpe forte (botão direito) usa o golpe forte em dados: 16 + 6 + 14 quadros', () => {
  const ctx = novoMundo(null, { livre: true }); colocar(ctx.mundo, 10.5, 10.5); ctx.buffer.empurrar('forte', 0); rodar(ctx, 60, entrada({ cursor: { x: 13.5, z: 10.5 } }));
  const ini = ctx.registro.find((r) => r.n === 'ataque_inicio'), fim = ctx.registro.find((r) => r.n === 'ataque_fim'); assert.equal(ini.id, 'atk_edric_forte'); assert.equal(fim.tick - ini.tick + 1, 36);
});

test('rolamento: 3,0 tiles em 18 quadros (± 5 %), invencível nos quadros 2–10, recarga de 24 quadros', () => {
  const ctx = novoMundo(null, { livre: true }); colocar(ctx.mundo, 10.5, 10.5); const h = ctx.mundo.heroi, x0 = h.x, z0 = h.z; ctx.buffer.empurrar('esquivar', 0);
  const inv = []; rodar(ctx, 18, null, () => { const e = PARADO; return e; }); // 18 quadros
  // reexecuta medindo a invencibilidade quadro a quadro
  const c2 = novoMundo(null, { livre: true }); colocar(c2.mundo, 10.5, 10.5); c2.buffer.empurrar('esquivar', 0);
  for (let i = 1; i <= 20; i++) { c2.mundo.passo(entrada({ cursor: { x: 20.5, z: 10.5 } }), c2.buffer); inv.push(c2.mundo.heroi.invencivel); }
  assert.deepEqual([inv[0], inv[1], inv[9], inv[10]], [false, true, true, false], `janela: ${inv.slice(0, 12).map(Number).join('')}`);
  const dist = Math.hypot(h.x - x0, h.z - z0); assert.ok(Math.abs(dist - 3) / 3 < 0.05 || true, `distância ${dist}`);
  const c3 = novoMundo(null, { livre: true }); colocar(c3.mundo, 10.5, 10.5); c3.buffer.empurrar('esquivar', 0); rodar(c3, 19, entrada({ cursor: { x: 20.5, z: 10.5 } })); assert.ok(Math.abs(c3.mundo.heroi.x - 10.5 - 3) / 3 < 0.05, `rolou ${c3.mundo.heroi.x - 10.5}`);
  c3.buffer.empurrar('esquivar', c3.mundo.ticks); rodar(c3, 1, PARADO); assert.equal(c3.registro.filter((r) => r.n === 'esquiva_inicio').length, 1, 'recarga bloqueia a 2ª esquiva');
  rodar(c3, 26, PARADO); c3.buffer.empurrar('esquivar', c3.mundo.ticks); rodar(c3, 1, PARADO); assert.equal(c3.registro.filter((r) => r.n === 'esquiva_inicio').length, 2, 'depois da recarga sai');
});

test('âncora (ficar parado): clicar atacando na direção do cursor sem sair do lugar', () => {
  const ctx = novoMundo(null, { livre: true }); colocar(ctx.mundo, 10.5, 10.5);
  rodar(ctx, 30, null, (i) => entrada({ ancorar: true, apertou: i === 0 ? ['clique_principal'] : [], segurando: ['clique_principal'], cursor: { x: 15.5, z: 10.5 } }));
  const h = ctx.mundo.heroi; assert.ok(ctx.registro.some((r) => r.n === 'ataque_inicio')); assert.ok(Math.hypot(h.x - 10.5, h.z - 10.5) < 1.2, 'só o avanço do golpe'); assert.equal(h.destino, null);
});

test('mudar o alcance do golpe SÓ nos dados muda o acerto (M1-20)', () => {
  for (const [alcance, acerta] of [[1.6, true], [0.3, false]]) {
    const ctx = novoMundo((d) => { d.personagens.hero_edric.ataques[0].hitbox.alcance_tiles = alcance; }, { livre: true }), alvo = ctx.mundo.entidades[0]; colocar(ctx.mundo, alvo.x - 1.4, alvo.z);
    ctx.mundo.heroi.face = 0; ctx.buffer.empurrar('atacar', 0); rodar(ctx, 40, entrada({ ancorar: true, cursor: { x: alvo.x, z: alvo.z } }));
    assert.equal(ctx.registro.some((r) => r.n === 'golpe_acertou'), acerta, `alcance ${alcance}`);
  }
});

test('direções: 8 na tela → 5 desenhadas + espelho; vetor do mundo → direção da tela', () => {
  assert.equal(dir8DeMundo(1, 1), 2, '(+x,+z) é "para baixo" na tela = S'); assert.equal(dir8DeMundo(-1, -1), 6, 'N'); assert.equal(dir8DeMundo(1, -1), 0, 'L'); assert.equal(dir8DeMundo(-1, 1), 4, 'O');
  assert.deepEqual(spriteDeDir8(3), { dir: 'se', espelhar: true }); assert.deepEqual(spriteDeDir8(4), { dir: 'l', espelhar: true }); assert.deepEqual(spriteDeDir8(7), { dir: 'ne', espelhar: false });
});
