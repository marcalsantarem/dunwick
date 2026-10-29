// Utilitários dos testes: dados reais + metas de sprite reais + entrada falsa + mundo pronto.
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync, readdirSync } from 'node:fs';
import { empacotarDados } from '../tools/lib/dados.mjs';
import { criarEventos } from '../src/jogo/eventos.js';
import { criarMundo } from '../src/jogo/mundo.js';
import { BufferEntrada } from '../src/jogo/buffer.js';

/** Deslocamento da vila no mapa (14): o núcleo da vila (0–48 no layout) fica a DV tiles da borda, atrás da faixa de mata (94 × 94). */
export const DV = 23;
export const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
export const carregarDados = () => structuredClone(empacotarDados(RAIZ));
export const carregarMetas = () => Object.fromEntries(readdirSync(join(RAIZ, 'assets/sprites')).map((id) => [id, JSON.parse(readFileSync(join(RAIZ, 'assets/sprites', id, `${id}.meta.json`), 'utf8'))]));

/** Mundo pronto. `livre: true` remove cenário e deixa só os bonecos (campo aberto para testar movimento). `encontros: true` liga o
 * encontro aleatório (desligado por padrão para os testes de movimento não caírem numa batalha). */
export function novoMundo(ajustar, { livre = false, encontros = false, sementeEncontros = 1 } = {}) {
  const dados = carregarDados();
  if (!encontros) for (const z of Object.values(dados.exploracao.encontros)) z.ligado = false;
  // os bonecos de teste (enemy_boneco_alvo/golpe) saem da vila na v0.1.2b; os testes de movimento e ataque ainda contam com eles
  const vila = Object.values(dados.mapas).find((m) => m.tipo_mapa === 'exterior');
  if (vila && !vila.objetos.some((o) => o.tipo === 'inimigo')) vila.objetos.push({ id: 'enemy_boneco_alvo', tipo: 'inimigo', x: 11.5, z: 24, rot: 0, seed: 1 }, { id: 'enemy_boneco_golpe', tipo: 'inimigo', x: 16.5, z: 24, rot: 0, seed: 1 });
  if (livre) for (const m of Object.values(dados.mapas)) { m.objetos = m.objetos.filter((o) => o.tipo === 'inimigo'); m.edificios = []; m.portais = []; m.pois = []; }
  if (ajustar) ajustar(dados);
  const eventos = criarEventos(), mundo = criarMundo(dados, eventos, carregarMetas(), { sementeEncontros }), buffer = new BufferEntrada(dados.config.jogo.entrada.buffer_entrada_quadros), registro = [];
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
