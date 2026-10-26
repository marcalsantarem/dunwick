// M1-04 / M1-18: passo fixo de 60 Hz independente da taxa de quadros, com limite de passos e sem simular tempo perdido.
import test from 'node:test';
import assert from 'node:assert/strict';
import { Acumulador } from '../src/jogo/acumulador.js';

function ticksEm(segundos, fps, fator = 1) {
  const a = new Acumulador(60, 5); let ticks = 0;
  for (let i = 0; i < Math.round(segundos * fps); i++) ticks += a.avancar(1 / fps, fator);
  return ticks;
}

test('600 ± 1 passos em 10 s a 60, 30, 120, 144 e 75 quadros/s', () => {
  for (const fps of [60, 30, 120, 144, 75]) assert.ok(Math.abs(ticksEm(10, fps) - 600) <= 1, `fps ${fps}: ${ticksEm(10, fps)}`);
});

test('quadro longo é limitado a 5 passos e o excesso é descartado (sem espiral de atraso)', () => {
  const a = new Acumulador(60, 5);
  assert.equal(a.avancar(1.0), 5);
  assert.ok(a.passosDescartados >= 50);
  assert.equal(a.avancar(0), 0, 'nada acumulado de sobra');
});

test('alfa de interpolação fica em [0, 1) e cresce entre passos', () => {
  const a = new Acumulador(60, 5);
  assert.equal(a.avancar(1 / 120), 0); assert.ok(Math.abs(a.alfa - 0.5) < 1e-9);
  assert.equal(a.avancar(1 / 120), 1); assert.ok(a.alfa < 1e-6);
});

test('câmera lenta: fator 0,25 → 1/4 dos passos', () => {
  assert.ok(Math.abs(ticksEm(10, 60, 0.25) - 150) <= 1);
});

test('resetar() (aba voltou a ficar visível) descarta o tempo acumulado', () => {
  const a = new Acumulador(60, 5);
  a.avancar(0.05); a.resetar();
  assert.equal(a.avancar(0), 0);
});
