// Mundo da simulação (passo fixo 60 Hz): herói, bonecos de treino, câmera, relógio do dia/noite e eventos. Não conhece pixels, shaders
// nem DOM. O combate é do 03: o herói gera `golpe_acertou`; os bonecos só reagem (estado DANO) e contam acertos.
import { criarMapa } from './mapa.js';
import { criarHeroi } from './heroi.js';
import { criarCameraJogo } from './camera_jogo.js';

export function criarMundo(dados, eventos, metasSprite) {
  const cfg = dados.config.jogo, kit = dados.config.kit, ciclo = dados.config.ciclo, mapaDados = Object.values(dados.mapas)[0];
  const mapa = criarMapa(mapaDados, kit, cfg.mundo);
  const heroiDados = Object.values(dados.personagens)[0];
  const heroi = criarHeroi(heroiDados, mapa, cfg, metasSprite[heroiDados.sprite]);
  const camera = criarCameraJogo(cfg.camera, mapaDados.limites_camera);
  camera.encaixar(heroi);

  const entidades = [];
  for (const o of mapaDados.objetos) {
    if (o.tipo !== 'inimigo') continue;
    const d = dados.inimigos[o.id];
    entidades.push({
      id: o.id, tipo: d.tipo, x: o.x, z: o.z, dados: d, raioPush: d.caixas.pushbox_raio_tiles, raioHurt: d.caixas.hurtbox_raio_tiles,
      estado: 'PARADO', quadroEstado: 0, anim: { nome: 'idle', quadro: 0 }, danoAte: -1, contadores: { acertos: 0 }, aviso: 0,
    });
  }
  const obstaculos = entidades.map((e) => ({ x: e.x, z: e.z, r: e.raioPush }));
  const mundo = { ticks: 0, dados, mapa, heroi, camera, entidades, eventos, dt: 1 / cfg.passo_logico_hz, hora: ciclo.hora_inicial, cicloLigado: ciclo.ligado };
  const alvos = entidades; // alvos do herói: todos os bonecos

  eventos.em('golpe_acertou', ({ alvo }) => { const e = entidades.find((x) => x.id === alvo); if (e) { e.contadores.acertos++; e.danoAte = mundo.ticks + 18; e.estado = 'DANO'; e.quadroEstado = 0; } });

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
    heroi.passo(entrada, { obstaculos, alvos, eventos, buffer, tick: mundo.ticks });
    for (const e of entidades) passoEntidade(e);
    camera.passo(heroi, heroiDados.movimento.vel_correr, mundo.dt);
    if (mundo.cicloLigado) mundo.hora = (mundo.hora + (mundo.dt * 24) / ciclo.duracao_dia_s) % 24;
    mundo.ticks++;
  };
  mundo.zerarContadores = () => { for (const e of entidades) e.contadores.acertos = 0; };
  mundo.avancarHora = (h = 1) => { mundo.hora = (mundo.hora + h) % 24; };
  return mundo;
}
