// Mundo da simulação (passo fixo 60 Hz): herói, bonecos de treino, câmera, relógio do dia/noite e eventos. Não conhece pixels, shaders
// nem DOM. O combate é do 03: o herói gera `golpe_acertou`; os bonecos só reagem (estado DANO) e contam acertos.
// Vários mapas (v0.1.2): exterior e interiores ligados por portais (exploracao/portais.js). mundo.heroi e mundo.camera são sempre os
// mesmos objetos; mundo.mapa, mundo.mapaId, mundo.entidades e mundo.obstaculos passam a ser os do mapa atual a cada troca.
import { criarMapa } from './mapa.js';
import { criarHeroi } from './heroi.js';
import { criarCameraJogo } from './camera_jogo.js';
import { criarEstadoJogo } from './estado_jogo.js';
import { criarGatilhoEncontros } from './exploracao/encontros.js';
import { criarPortais } from './exploracao/portais.js';

export const VERSAO_ESTADO_EXPLORACAO = 1;
const DIRECOES = ['s', 'n', 'l', 'o'];

/**
 * `opcoes.sementeEncontros`: semente do encontro aleatório (a plataforma passa uma aleatória; os testes, fixa).
 * `opcoes.mapaInicial`: id do mapa (padrão: o primeiro `tipo_mapa: exterior`, senão o primeiro).
 * `opcoes.trocaManual`: portal só emite `portal_usado` e congela o herói; a troca acontece em mundo.concluirPortal() (tela coberta).
 */
export function criarMundo(dados, eventos, metasSprite, { sementeEncontros = 1, mapaInicial, trocaManual = false } = {}) {
  const cfg = dados.config.jogo, kit = dados.config.kit, ciclo = dados.config.ciclo;
  const listaMapas = Object.values(dados.mapas);
  const idInicial = mapaInicial ?? (listaMapas.find((m) => m.tipo_mapa === 'exterior') ?? listaMapas[0]).id;

  // cada mapa é preparado uma vez (colisão, rota, bonecos) e reaproveitado nas voltas
  const preparados = new Map();
  function preparar(id) {
    let p = preparados.get(id); if (p) return p;
    const md = dados.mapas[id]; if (!md) throw new Error(`mapa "${id}" não existe em dados.mapas`);
    const entidades = [];
    for (const o of md.objetos) {
      if (o.tipo !== 'inimigo') continue;
      const d = dados.inimigos[o.id];
      entidades.push({
        id: o.id, tipo: d.tipo, x: o.x, z: o.z, dados: d, raioPush: d.caixas.pushbox_raio_tiles, raioHurt: d.caixas.hurtbox_raio_tiles,
        estado: 'PARADO', quadroEstado: 0, anim: { nome: 'idle', quadro: 0 }, danoAte: -1, contadores: { acertos: 0 }, aviso: 0,
      });
    }
    p = { mapa: criarMapa(md, kit, cfg.mundo), entidades, obstaculos: entidades.map((e) => ({ x: e.x, z: e.z, r: e.raioPush })) };
    preparados.set(id, p); return p;
  }

  const ini = preparar(idInicial);
  const heroiDados = Object.values(dados.personagens)[0];
  const heroi = criarHeroi(heroiDados, ini.mapa, cfg, metasSprite[heroiDados.sprite]);
  const camera = criarCameraJogo(cfg.camera, ini.mapa.dados.limites_camera);
  camera.encaixar(heroi);
  const mundo = { ticks: 0, dados, mapaId: idInicial, mapa: ini.mapa, heroi, camera, entidades: ini.entidades, obstaculos: ini.obstaculos, eventos, dt: 1 / cfg.passo_logico_hz, hora: ciclo.hora_inicial, cicloLigado: ciclo.ligado };

  // ponte mundo ↔ batalha (BL-008): modo mapa | batalha | cena | game_over. Fora do modo `mapa` a exploração fica congelada (só o relógio de ticks anda).
  mundo.jogo = dados.combate && dados.config.batalha ? criarEstadoJogo(dados, eventos) : null;
  // encontro aleatório por passos (13): um gatilho só (semente contínua); a config muda com o mapa (data/exploracao/z_enc_<mapa>.json; sem arquivo = sem encontro)
  const cfgEncDe = (id) => dados.exploracao?.encontros?.[id] ?? null;
  mundo.encontros = mundo.jogo ? criarGatilhoEncontros(cfgEncDe(idInicial), mundo.jogo, eventos, { semente: sementeEncontros }) : null;
  // volta da batalha no mesmo ponto, parado (clique antigo esquecido; tecla ainda segurada volta a mover no passo seguinte)
  eventos.em('modo_mudou', ({ para }) => { if (para === 'mapa') { heroi.vx = heroi.vz = 0; heroi.destino = null; heroi.rota = null; heroi.alvoId = null; heroi.ox = heroi.x; heroi.oz = heroi.z; } });

  eventos.em('golpe_acertou', ({ alvo }) => { const e = mundo.entidades.find((x) => x.id === alvo); if (e) { e.contadores.acertos++; e.danoAte = mundo.ticks + 18; e.estado = 'DANO'; e.quadroEstado = 0; } });

  /** Troca o mapa atual e põe o herói em (x, z) virado para `direcao`. Base do portal e do carregar. */
  function trocarMapa(id, x, z, direcao) {
    const p = preparar(id);
    mundo.mapaId = id; mundo.mapa = p.mapa; mundo.entidades = p.entidades; mundo.obstaculos = p.obstaculos;
    heroi.definirMapa(p.mapa, x, z, direcao);
    camera.definirLimites(p.mapa.dados.limites_camera); camera.encaixar(heroi);
    if (mundo.encontros) mundo.encontros.definirConfig(cfgEncDe(id));
  }
  mundo.portais = criarPortais({ mundo, dados, eventos, trocarMapa, trocaManual, cfg: dados.config.exploracao });
  /** Com `trocaManual`: faz a troca pendente (depois de cobrir a tela) e emite `mapa_trocado`. */
  mundo.concluirPortal = () => mundo.portais.concluir();

  function passoEntidade(e) {
    const g = e.dados.golpe;
    if (e.estado === 'DANO') { if (mundo.ticks >= e.danoAte) { e.estado = 'PARADO'; e.quadroEstado = 0; } else e.quadroEstado++; e.anim.nome = 'dano'; e.anim.quadro = Math.min(2, Math.floor(e.quadroEstado / 6)); e.aviso = 0; return; }
    if (!g) { e.anim.nome = 'idle'; e.anim.quadro = Math.floor(mundo.ticks / 30) % 2; return; }
    const t = mundo.ticks % g.ciclo_quadros, iAviso = g.ciclo_quadros - g.aviso_quadros - g.ativo_quadros, iAtivo = g.ciclo_quadros - g.ativo_quadros;
    let novo, aviso = 0;
    if (t < iAviso) novo = 'ESPERA'; else if (t < iAtivo) { novo = 'AVISO'; aviso = (t - iAviso + 1) / g.aviso_quadros; } else novo = 'ATIVO';
    if (novo !== e.estado) {
      e.estado = novo; e.quadroEstado = 0;
      if (novo === 'AVISO') eventos.emitir('aviso_inicio', { id: e.id, forma: g.forma, raio: g.raio_tiles, quadros: g.aviso_quadros, x: e.x, z: e.z });
      else if (novo === 'ATIVO') eventos.emitir('golpe_ativo', { id: e.id, forma: g.forma, raio: g.raio_tiles, quadros: g.ativo_quadros, x: e.x, z: e.z, dano_base: g.dano_base, tipo_dano: g.tipo_dano });
      else eventos.emitir('golpe_fim', { id: e.id });
    } else e.quadroEstado++;
    e.aviso = aviso;
    if (e.estado === 'ATIVO') { e.anim.nome = 'golpe'; e.anim.quadro = Math.min(5, 3 + Math.floor(e.quadroEstado / 2)); } else if (e.estado === 'AVISO') { e.anim.nome = 'golpe'; e.anim.quadro = Math.min(2, Math.floor(e.aviso * 3)); } else { e.anim.nome = 'idle'; e.anim.quadro = Math.floor(mundo.ticks / 30) % 2; }
  }

  /** Um passo lógico completo. `entrada` = instantâneo de entrada_logica.amostrar(tick); `buffer` = entrada.buffer. */
  mundo.passo = (entrada, buffer) => {
    if ((mundo.jogo && mundo.jogo.modo !== 'mapa') || mundo.portais.pendente) { mundo.ticks++; return; }
    const ent = mundo.portais.antesDoHeroi(entrada); // clique em porta/portal/poi vira destino + intenção
    heroi.passo(ent, { obstaculos: mundo.obstaculos, alvos: mundo.entidades, eventos, buffer, tick: mundo.ticks });
    if (mundo.encontros) mundo.encontros.passo(heroi);
    mundo.portais.depoisDoHeroi(ent); // entrar em portal, aviso de portal inativo, interagir
    for (const e of mundo.entidades) passoEntidade(e);
    camera.passo(heroi, heroiDados.movimento.vel_correr, mundo.dt);
    if (mundo.cicloLigado) mundo.hora = (mundo.hora + (mundo.dt * 24) / ciclo.duracao_dia_s) % 24;
    mundo.ticks++;
  };
  mundo.zerarContadores = () => { for (const e of mundo.entidades) e.contadores.acertos = 0; };
  mundo.avancarHora = (h = 1) => { mundo.hora = (mundo.hora + h) % 24; };

  /** Estado serializável da exploração (base do save da v0.1.5): só JSON simples. */
  mundo.estadoExploracao = () => ({
    versao: VERSAO_ESTADO_EXPLORACAO, mapa: mundo.mapaId, x: heroi.x, z: heroi.z, direcao: heroi.direcao(),
    portal_retorno: mundo.portais.retorno ? { ...mundo.portais.retorno } : null,
    encontros: mundo.encontros ? mundo.encontros.salvar() : null,
  });
  /** Restaura um estado de estadoExploracao() com validação rígida; inválido lança erro e não muda nada. Posição bloqueada vira o início do mapa. */
  mundo.restaurarExploracao = (e) => {
    const num = (v) => typeof v === 'number' && Number.isFinite(v);
    if (!e || typeof e !== 'object' || e.versao !== VERSAO_ESTADO_EXPLORACAO) throw new Error('estado de exploração: versão inválida');
    if (typeof e.mapa !== 'string' || !Object.hasOwn(dados.mapas, e.mapa)) throw new Error(`estado de exploração: mapa "${e.mapa}" não existe`);
    if (!num(e.x) || !num(e.z) || !DIRECOES.includes(e.direcao)) throw new Error('estado de exploração: posição ou direção inválida');
    const r = e.portal_retorno;
    if (r !== null && r !== undefined && (typeof r !== 'object' || typeof r.mapa !== 'string' || typeof r.portal !== 'string' || !Object.hasOwn(dados.mapas, r.mapa))) throw new Error('estado de exploração: portal_retorno inválido');
    const m = preparar(e.mapa).mapa;
    let { x, z } = e, direcao = e.direcao;
    if (!m.livre(x, z, heroi.raioPush)) { const [ix, iz] = m.dados.inicio_jogador.tile; x = ix + 0.5; z = iz + 0.5; direcao = m.dados.inicio_jogador.direcao; }
    mundo.portais.cancelar();
    trocarMapa(e.mapa, x, z, direcao);
    mundo.portais.retorno = r ? { mapa: r.mapa, portal: r.portal } : null;
    mundo.portais.rearmar();
    if (mundo.encontros && e.encontros) mundo.encontros.carregar(e.encontros);
  };
  return mundo;
}
