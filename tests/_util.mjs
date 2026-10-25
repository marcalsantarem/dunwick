// Utilitários dos testes: dados reais do projeto + entrada falsa + mundo pronto.
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { empacotarDados } from '../tools/lib/dados.mjs';
import { criarEventos } from '../src/jogo/eventos.js';
import { criarMundo } from '../src/jogo/mundo.js';

export const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
export const carregarDados = () => structuredClone(empacotarDados(RAIZ));

/** Mundo pronto (dados reais; `ajustar(dados)` permite alterar valores antes de criar). */
export function novoMundo(ajustar) {
  const dados = carregarDados();
  if (ajustar) ajustar(dados);
  const eventos = criarEventos();
  return { dados, eventos, mundo: criarMundo(dados, eventos) };
}

/** Instantâneo de entrada no formato de entrada_logica.amostrar(). */
export function entrada({ x = 0, z = 0, correr = false, apertou = [] } = {}) {
  return { mover: { x, z }, segurando: new Set(correr ? ['correr'] : []), apertou, gamepad: false, tick: 0 };
}

/** Roda `n` passos com a mesma entrada. */
export function rodar(mundo, n, ent) { for (let i = 0; i < n; i++) mundo.passo(ent); }

/** Posiciona o herói (testes de movimento em área livre). */
export function colocar(mundo, x, z) { const h = mundo.heroi; h.x = h.ox = x; h.z = h.oz = z; h.vx = h.vz = 0; h.altura = h.oaltura = mundo.mapa.alturaEm(x, z); mundo.camera.encaixar(h); }
