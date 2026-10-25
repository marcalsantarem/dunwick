// M1-07..M1-11: ações lógicas, fila entre passos, buffer de entrada (7 sim, 8 não), gamepad conecta/desconecta.
import test from 'node:test';
import assert from 'node:assert/strict';
import { carregarDados } from './_util.mjs';
import { criarEntradaLogica } from '../src/jogo/entrada_logica.js';
import { BufferEntrada } from '../src/jogo/buffer.js';

const nova = () => { const d = carregarDados(); return criarEntradaLogica(d.config.entrada, d.config.jogo); };

test('teclado: mover por WASD/setas, diagonal, ações por tecla e mouse', () => {
  const e = nova();
  e.teclaAbaixo('KeyD'); e.teclaAbaixo('KeyS');
  let s = e.amostrar(0); assert.deepEqual([s.mover.x, s.mover.z], [1, 1]);
  e.teclaAcima('KeyD'); e.teclaAbaixo('ArrowLeft'); s = e.amostrar(1); assert.deepEqual([s.mover.x, s.mover.z], [-1, 1]);
  e.teclaAbaixo('mouse:0'); s = e.amostrar(2); assert.ok(s.apertou.includes('clique_principal') && s.segurando.has('clique_principal'));
  e.teclaAbaixo('ShiftLeft'); assert.ok(e.amostrar(3).segurando.has('correr'));
});

test('aperto curto entre dois passos NÃO se perde (fila)', () => {
  const e = nova();
  e.teclaAbaixo('KeyL'); e.teclaAcima('KeyL'); // apertou e soltou antes do passo
  const s = e.amostrar(5);
  assert.deepEqual(s.apertou, ['esquivar']); assert.ok(!s.segurando.has('esquivar'));
  assert.deepEqual(e.amostrar(6).apertou, [], 'só reporta uma vez');
});

test('duas teclas da mesma ação: soltar uma não solta a ação (forte = clique direito ou K)', () => {
  const e = nova();
  e.teclaAbaixo('KeyK'); e.teclaAbaixo('mouse:2'); e.teclaAcima('KeyK');
  assert.ok(e.amostrar(0).segurando.has('forte')); e.teclaAcima('mouse:2'); assert.ok(!e.amostrar(1).segurando.has('forte'));
});

test('à Diablo: clique sobre inimigo vira intenção de atacar no buffer; clique no chão, não', () => {
  const e = nova();
  e.definirCursor(5, 5, null); e.teclaAbaixo('mouse:0'); let s = e.amostrar(0); assert.ok(s.apertou.includes('clique_principal')); assert.deepEqual(e.buffer.conteudo(0), []); assert.equal(s.alvoSob, null);
  e.teclaAcima('mouse:0'); e.amostrar(1); e.definirCursor(11.5, 24, 'enemy_boneco_alvo'); e.teclaAbaixo('mouse:0'); s = e.amostrar(2);
  assert.deepEqual(e.buffer.conteudo(2), ['atacar(0)']); assert.equal(s.alvoSob, 'enemy_boneco_alvo'); assert.deepEqual([s.cursor.x, s.cursor.z], [11.5, 24]);
});

test('teclas do navegador (F5, F11) e Ctrl+W não são do jogo (preventDefault só para teclas do jogo)', () => {
  const e = nova();
  assert.equal(e.teclaAbaixo('F5'), false); assert.equal(e.teclaAbaixo('F11'), false); assert.equal(e.teclaAbaixo('KeyW'), true);
  assert.equal(e.teclaAbaixo('F1'), true, 'F1 é do debug (só o build de desenvolvimento intercepta)');
});

test('gamepad: zona morta do analógico, botões por posição, desconexão solta tudo no mesmo passo (M1-08/09)', () => {
  const e = nova(), btn = (...i) => { const b = Array(17).fill(false); i.forEach((k) => (b[k] = true)); return b; };
  e.atualizarGamepad({ botoes: btn(), eixos: [0.15, -0.1, 0, 0] });
  let s = e.amostrar(0); assert.deepEqual([s.mover.x, s.mover.z], [0, 0], 'analógico solto não anda sozinho');
  e.atualizarGamepad({ botoes: btn(2, 6), eixos: [1, 0, 0, 0] });
  s = e.amostrar(1); assert.ok(s.mover.x > 0.99); assert.ok(s.apertou.includes('atacar') && s.segurando.has('correr'));
  e.atualizarGamepad(null); // desconectou
  s = e.amostrar(2); assert.deepEqual([s.mover.x, s.mover.z], [0, 0]); assert.ok(!s.segurando.has('correr') && !s.segurando.has('atacar'));
  e.atualizarGamepad({ botoes: btn(), eixos: [0, 0, 0, 0] }); assert.equal(e.gamepadConectado, true);
});

test('soltarTudo() (perdeu o foco): nada fica pressionado', () => {
  const e = nova(); e.teclaAbaixo('KeyD'); e.teclaAbaixo('ShiftLeft'); e.soltarTudo();
  const s = e.amostrar(0); assert.deepEqual([s.mover.x, s.mover.z], [0, 0]); assert.equal(s.segurando.size, 0); assert.equal(s.apertou.length, 0);
});

test('buffer: apertada N passos antes executa para N ≤ 7 e não para N ≥ 8 (M1-11)', () => {
  for (let n = 1; n <= 10; n++) {
    const b = new BufferEntrada(7); b.empurrar('atacar', 0);
    assert.equal(b.consumir(n, new Set(['atacar'])), n <= 7 ? 'atacar' : null, `N = ${n}`);
  }
});

test('buffer: vale a mais recente; empate no mesmo passo: esquivar > forte > atacar; sem ação dupla', () => {
  const b = new BufferEntrada(7); b.empurrar('atacar', 2); b.empurrar('forte', 4);
  assert.equal(b.consumir(5, ['atacar', 'forte']), 'forte');
  const c = new BufferEntrada(7); c.empurrar('atacar', 3); c.empurrar('forte', 3); c.empurrar('esquivar', 3);
  assert.equal(c.consumir(4, ['atacar', 'forte', 'esquivar']), 'esquivar');
  assert.equal(c.consumir(4, ['esquivar']), null, 'a consumida não executa duas vezes');
});

test('buffer pelo caminho real: ação com buffer:true entra no buffer; sem buffer não', () => {
  const e = nova();
  e.teclaAbaixo('KeyJ'); e.teclaAbaixo('KeyE'); e.amostrar(10);
  assert.deepEqual(e.buffer.conteudo(10), ['atacar(0)']);
  assert.equal(e.buffer.consumir(17, ['atacar']), 'atacar'); // 7 passos depois ainda vale
});
