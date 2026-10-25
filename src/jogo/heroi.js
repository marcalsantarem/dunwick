// Herói no M1: SÓ movimento (andar/correr, 8 direções normalizadas, aceleração/freada em dados, deslize em paredes, rampas).
// Combate, esquiva e fôlego são do 03 e entram sobre este módulo. Nenhum número aqui: tudo vem de data/characters/hero_*.json.
const DIRS8 = Array.from({ length: 8 }, (_, i) => ({ x: Math.cos((i * Math.PI) / 4), z: Math.sin((i * Math.PI) / 4) })); // 0 = leste, anti-horário no sentido x→z

export const ESTADOS_HEROI = Object.freeze({ PARADO: 'PARADO', ANDAR: 'ANDAR', CORRER: 'CORRER' });

/** Índice (0..7) da direção de 8 mais próxima do vetor (x, z). */
export function quantizar8(x, z) { return ((Math.round(Math.atan2(z, x) / (Math.PI / 4)) % 8) + 8) % 8; }

/** Direção do sprite (s, n, l, o) para um índice de 8 direções: diagonais usam o eixo horizontal (provisório; 03 pode revisar). */
export function direcaoSprite(i8) {
  const { x, z } = DIRS8[i8];
  if (Math.abs(x) > 1e-6) return x > 0 ? 'l' : 'o';
  return z > 0 ? 's' : 'n';
}

export function criarHeroi(dadosHeroi, mapa, cfgJogo) {
  const m = dadosHeroi.movimento, r = dadosHeroi.caixas.pushbox_raio_tiles, [ix, iz] = mapa.dados.inicio_jogador.tile;
  const dirInicial = { s: 2, n: 6, l: 0, o: 4 }[mapa.dados.inicio_jogador.direcao]; // índice de 8 direções
  const heroi = {
    id: dadosHeroi.id, x: ix + 0.5, z: iz + 0.5, altura: 0, vx: 0, vz: 0,
    dir8: dirInicial, estado: ESTADOS_HEROI.PARADO, quadroEstado: 0, correrAlternado: false, velMax: m.vel_andar,
    ox: 0, oz: 0, oaltura: 0, // posição do passo anterior (interpolação do desenho)
    raioPush: r, raioHurt: dadosHeroi.caixas.hurtbox_raio_tiles,
  };
  heroi.altura = mapa.alturaEm(heroi.x, heroi.z); heroi.ox = heroi.x; heroi.oz = heroi.z; heroi.oaltura = heroi.altura;
  const normal = { nx: 0, nz: 0 }, pos = { x: 0, z: 0 };

  /** Um passo lógico (dt = 1/passo_logico_hz). `entrada` = instantâneo de entrada_logica; `obstaculos` = círculos {x,z,r}. */
  function passo(entrada, obstaculos, dt) {
    heroi.ox = heroi.x; heroi.oz = heroi.z; heroi.oaltura = heroi.altura;
    // --- intenção ---
    const mag = Math.hypot(entrada.mover.x, entrada.mover.z), querMover = mag > 1e-6;
    let correr = entrada.segurando.has('correr');
    const modo = cfgJogo.entrada.correr_modo;
    if (modo === 'alternar') { if (entrada.apertou.includes('correr')) heroi.correrAlternado = !heroi.correrAlternado; if (!querMover) heroi.correrAlternado = false; correr = heroi.correrAlternado; }
    else if (modo === 'sempre') correr = !correr;
    let alvoX = 0, alvoZ = 0, velAlvo = 0;
    if (querMover) {
      heroi.dir8 = quantizar8(entrada.mover.x, entrada.mover.z); // 8 direções; diagonal já normalizada (cos/sin)
      velAlvo = correr ? m.vel_correr : m.vel_andar; heroi.velMax = velAlvo;
      alvoX = DIRS8[heroi.dir8].x * velAlvo; alvoZ = DIRS8[heroi.dir8].z * velAlvo;
    }
    // --- aceleração/freada: taxa = velocidade máxima do modo ÷ tempo de aceleração (ou freada) ---
    const dvx = alvoX - heroi.vx, dvz = alvoZ - heroi.vz, dist = Math.hypot(dvx, dvz);
    if (dist > 0) {
      const acelerando = velAlvo > Math.hypot(heroi.vx, heroi.vz) - 1e-9 && querMover;
      const taxa = heroi.velMax / (acelerando ? m.aceleracao_s : m.freada_s), degrau = taxa * dt;
      if (dist <= degrau) { heroi.vx = alvoX; heroi.vz = alvoZ; } else { heroi.vx += (dvx / dist) * degrau; heroi.vz += (dvz / dist) * degrau; }
    }
    // --- integração + colisão com deslize ---
    pos.x = heroi.x + heroi.vx * dt; pos.z = heroi.z + heroi.vz * dt;
    mapa.resolverCirculo(pos, heroi.raioPush, heroi.altura, obstaculos, normal);
    if (normal.nx !== 0 || normal.nz !== 0) { const vn = heroi.vx * normal.nx + heroi.vz * normal.nz; if (vn < 0) { heroi.vx -= vn * normal.nx; heroi.vz -= vn * normal.nz; } } // mantém a componente paralela
    heroi.x = pos.x; heroi.z = pos.z; heroi.altura = mapa.alturaEm(heroi.x, heroi.z);
    // --- estado ---
    const v = Math.hypot(heroi.vx, heroi.vz), novo = v < 0.05 && !querMover ? ESTADOS_HEROI.PARADO : correr && querMover ? ESTADOS_HEROI.CORRER : ESTADOS_HEROI.ANDAR;
    if (novo !== heroi.estado) { heroi.estado = novo; heroi.quadroEstado = 0; } else heroi.quadroEstado++;
  }
  heroi.passo = passo;
  heroi.velocidade = () => Math.hypot(heroi.vx, heroi.vz);
  heroi.direcaoSprite = () => direcaoSprite(heroi.dir8);
  return heroi;
}
