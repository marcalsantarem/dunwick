// Utilitários dos testes: dados reais + metas de sprite reais + entrada falsa + mundo pronto.
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync, readdirSync } from 'node:fs';
import { empacotarDados } from '../tools/lib/dados.mjs';
import { criarEventos } from '../src/jogo/eventos.js';
import { criarMundo } from '../src/jogo/mundo.js';
import { BufferEntrada } from '../src/jogo/buffer.js';

export const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
export const carregarDados = () => structuredClone(empacotarDados(RAIZ));
export const carregarMetas = () => Object.fromEntries(readdirSync(join(RAIZ, 'assets/sprites')).map((id) => [id, JSON.parse(readFileSync(join(RAIZ, 'assets/sprites', id, `${id}.meta.json`), 'utf8'))]));

/** Mundo pronto. `livre: true` remove cenário e deixa só os bonecos (campo aberto para testar movimento). */
export function novoMundo(ajustar, { livre = false } = {}) {
  const dados = carregarDados();
  if (livre) for (const m of Object.values(dados.mapas)) m.objetos = m.objetos.filter((o) => o.tipo === 'inimigo');
  if (ajustar) ajustar(dados);
  const eventos = criarEventos(), mundo = criarMundo(dados, eventos, carregarMetas()), buffer = new BufferEntrada(dados.config.jogo.entrada.buffer_entrada_quadros), registro = [];
  for (const n of ['golpe_acertou', 'ataque_inicio', 'ataque_fim', 'esquiva_inicio', 'aviso_inicio', 'golpe_ativo', 'golpe_fim']) eventos.em(n, (d) => registro.push({ n, ...d, tick: mundo.ticks }));
  return { dados, eventos, mundo, buffer, registro };
}

/** Instantâneo de entrada (mover em eixos de TELA: x direita, z baixo). */
export function entrada({ x = 0, z = 0, correr = false, apertou = [], segurando = [], cursor = null, alvoSob = null, ancorar = false } = {}) {
  const seg = new Set(segurando); if (correr) seg.add('correr'); if (ancorar) seg.add('ancorar');
  return { mover: { x, z }, segurando: seg, apertou, gamepad: false, tick: 0, cursor: cursor ? { ...cursor, valido: true } : { x: 0, z: 0, valido: false }, alvoSob };
}

/** Roda `n` passos; `f(i)` pode devolver a entrada de cada passo (senão `ent` fixa). Devolve nada. */
export function rodar(ctx, n, ent, f) { for (let i = 0; i < n; i++) ctx.mundo.passo(f ? f(i) : ent ?? entrada(), ctx.buffer); }
export function colocar(mundo, x, z) { const h = mundo.heroi; h.x = h.ox = x; h.z = h.oz = z; h.vx = h.vz = 0; h.destino = null; h.alvoId = null; h.acao = null; mundo.camera.encaixar(h); }
