// Mundo da simulação (passo fixo 60 Hz): herói, bonecos de teste, câmera e eventos. Não conhece pixels, shaders nem DOM.
// O combate é do 03: aqui os bonecos só têm estado/ciclo e emitem eventos (aviso_inicio, golpe_ativo, golpe_fim).
import { criarMapa } from './mapa.js';
import { criarHeroi } from './heroi.js';
import { criarCameraJogo } from './camera_jogo.js';

export function criarMundo(dados, eventos) {
  const cfg = dados.config.jogo, mapaDados = Object.values(dados.mapas)[0];
  const mapa = criarMapa(mapaDados, cfg.mundo);
  const heroiDados = Object.values(dados.personagens)[0];
  const heroi = criarHeroi(heroiDados, mapa, cfg);
  const camera = criarCameraJogo(cfg.camera, mapaDados.limites_camera);
  camera.encaixar(heroi);

  // Entidades fixas do M1 (a partir dos objetos do mapa marcados m1 e do tipo inimigo)
  const entidades = [];
  for (const o of mapaDados.objetos) {
    if (!o.m1 || o.tipo !== 'inimigo') continue;
    const d = dados.inimigos[o.id];
    const e = {
      id: o.id, tipo: d.tipo, x: o.tile[0] + 0.5, z: o.tile[1] + 0.5, altura: 0, dados: d,
      raioPush: d.caixas.pushbox_raio_tiles, raioHurt: d.caixas.hurtbox_raio_tiles, hurtAltura: d.caixas.hurtbox_altura_tiles,
      estado: 'PARADO', quadroEstado: 0, dir: 's',
      contadores: { acertos: 0, dano: 0 }, // do alvo de treino; o 03 incrementa pelo pipeline de dano, F10 zera
      aviso: 0, // 0..1 enquanto o aviso do golpe enche (apresentação desenha o marcador no chão)
    };
    e.altura = mapa.alturaEm(e.x, e.z);
    entidades.push(e);
  }
  const obstaculos = entidades.map((e) => ({ x: e.x, z: e.z, r: e.raioPush }));

  const mundo = { ticks: 0, dados, mapa, heroi, camera, entidades, eventos, dt: 1 / cfg.passo_logico_hz };

  function passoBoneco(e) {
    const g = e.dados.golpe;
    if (!g) return;
    const t = mundo.ticks % g.ciclo_quadros, inicioAviso = g.ciclo_quadros - g.aviso_quadros - g.ativo_quadros, inicioAtivo = g.ciclo_quadros - g.ativo_quadros;
    let novo, aviso = 0;
    if (t < inicioAviso) novo = 'ESPERA';
    else if (t < inicioAtivo) { novo = 'AVISO'; aviso = (t - inicioAviso + 1) / g.aviso_quadros; }
    else novo = 'ATIVO';
    if (novo !== e.estado) {
      e.estado = novo; e.quadroEstado = 0;
      if (novo === 'AVISO') eventos.emitir('aviso_inicio', { id: e.id, forma: g.forma, raio: g.raio_tiles, quadros: g.aviso_quadros, x: e.x, z: e.z });
      else if (novo === 'ATIVO') eventos.emitir('golpe_ativo', { id: e.id, forma: g.forma, raio: g.raio_tiles, quadros: g.ativo_quadros, x: e.x, z: e.z, dano_base: g.dano_base, tipo_dano: g.tipo_dano });
      else eventos.emitir('golpe_fim', { id: e.id });
    } else e.quadroEstado++;
    e.aviso = aviso;
  }

  /** Um passo lógico completo. `entrada` = instantâneo de entrada_logica.amostrar(tick). */
  mundo.passo = (entrada) => {
    heroi.passo(entrada, obstaculos, mundo.dt);
    for (const e of entidades) passoBoneco(e);
    camera.passo(heroi, heroiDados.movimento.vel_correr, mundo.dt);
    mundo.ticks++;
  };
  mundo.zerarContadores = () => { for (const e of entidades) { e.contadores.acertos = 0; e.contadores.dano = 0; } };
  return mundo;
}
