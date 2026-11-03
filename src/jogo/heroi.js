// Herói (Edric): movimento por clique ou teclado, combo de ataques, golpe forte e rolamento — TUDO em dados (data/characters/hero_*.json).
// Máquina de estados em quadros a 60 Hz. Dano, fôlego e atributos são do 03/06: aqui o golpe só gera o evento `golpe_acertou`.
// Coordenadas do mundo: x (leste) e z (sul); a câmera isométrica olha de +x,+z, então "para baixo na tela" = (+x,+z).
export const ESTADOS_HEROI = Object.freeze({ PARADO: 'PARADO', ANDAR: 'ANDAR', CORRER: 'CORRER', ATAQUE: 'ATAQUE', ESQUIVA: 'ESQUIVA' });

const S2 = Math.SQRT1_2;
/** Vetor de tela (direita, baixo) → vetor de mundo. Direita na tela = (+x, −z); baixo na tela = (+x, +z). */
export const telaParaMundo = (sx, sy) => ({ x: (sx + sy) * S2, z: (sy - sx) * S2 });
/** Índice de 8 direções NA TELA (0 = L, 1 = SE, 2 = S, 3 = SO, 4 = O, 5 = NO, 6 = N, 7 = NE) para um vetor do mundo (já com o achatamento 2:1). */
export function dir8DeMundo(vx, vz) { const sx = vx - vz, sy = (vx + vz) * 0.5; return ((Math.round(Math.atan2(sy, sx) / (Math.PI / 4)) % 8) + 8) % 8; }
const DIR_SPRITE = [['l', false], ['se', false], ['s', false], ['se', true], ['l', true], ['ne', true], ['n', false], ['ne', false]]; // 5 desenhadas, 3 espelhadas
export const spriteDeDir8 = (k) => ({ dir: DIR_SPRITE[k][0], espelhar: DIR_SPRITE[k][1] });

export const FACE_DE_DIRECAO = { s: Math.atan2(1, 1), n: Math.atan2(-1, -1), l: Math.atan2(-1, 1), o: Math.atan2(1, -1) }; // ângulo no mundo (atan2(z, x))

export function criarHeroi(dadosHeroi, mapaInicial, cfgJogo, metaSprite) {
  let mapa = mapaInicial;
  const m = dadosHeroi.movimento, r = dadosHeroi.caixas.pushbox_raio_tiles, [ix, iz] = mapa.dados.inicio_jogador.tile, dt = 1 / cfgJogo.passo_logico_hz;
  const cfgE = cfgJogo.entrada, ataques = dadosHeroi.ataques, esq = dadosHeroi.esquiva;
  const faceInicial = FACE_DE_DIRECAO[mapa.dados.inicio_jogador.direcao];
  const h = {
    id: dadosHeroi.id, x: ix + 0.5, z: iz + 0.5, vx: 0, vz: 0, ox: ix + 0.5, oz: iz + 0.5,
    face: faceInicial, estado: ESTADOS_HEROI.PARADO, quadroEstado: 0, raioPush: r, raioHurt: dadosHeroi.caixas.hurtbox_raio_tiles,
    velMax: m.vel_andar, correndoClique: false, destino: null, rota: null, alvoId: null, chaveRota: null,
    acao: null, // { tipo: 'ataque'|'esquiva', idx, def, t, total, acertou: Set }
    combo: 0, comboAte: -1, esqRecarga: 0, invencivel: false, travadoSemProgresso: 0,
    anim: { nome: dadosHeroi.animacoes.parado, quadro: 0 }, dir8: dir8DeMundo(Math.cos(faceInicial), Math.sin(faceInicial)),
  };
  const normal = { nx: 0, nz: 0 }, pos = { x: 0, z: 0 };
  const dirMundo = () => ({ x: Math.cos(h.face), z: Math.sin(h.face) });
  const totalDe = (def) => def.quadros.preparacao + def.quadros.ativo + def.quadros.recuperacao;

  function iniciarAtaque(def, idx, entrada, alvo, tick, ev) {
    // direção travada no 1º quadro: para o alvo, senão para o cursor, senão a atual
    let dx = 0, dz = 0;
    if (alvo) { dx = alvo.x - h.x; dz = alvo.z - h.z; } else if (entrada.cursor.valido) { dx = entrada.cursor.x - h.x; dz = entrada.cursor.z - h.z; }
    if (Math.hypot(dx, dz) > 1e-6) h.face = Math.atan2(dz, dx);
    h.acao = { tipo: 'ataque', idx, def, t: 1, total: totalDe(def), acertou: new Set() }; // quadro 1 = o quadro em que o golpe começa
    h.estado = ESTADOS_HEROI.ATAQUE; h.destino = null; h.quadroEstado = 0;
    if (!entrada.segurando.has('clique_principal')) h.alvoId = null; // um clique = um golpe; só SEGURAR o clique repete (Diablo)
    const mov = def.avanco_tiles / (def.quadros.preparacao + def.quadros.ativo) / dt; h.vx = Math.cos(h.face) * mov; h.vz = Math.sin(h.face) * mov; // o avanço já vale neste quadro
    ev.emitir('ataque_inicio', { id: def.id, idx, tick });
  }
  function iniciarEsquiva(entrada, tick, ev) {
    let dx = 0, dz = 0;
    if (h.mover.x || h.mover.z) { dx = h.mover.x; dz = h.mover.z; } else if (entrada.cursor.valido) { dx = entrada.cursor.x - h.x; dz = entrada.cursor.z - h.z; } else { dx = Math.cos(h.face); dz = Math.sin(h.face); }
    if (Math.hypot(dx, dz) > 1e-6) h.face = Math.atan2(dz, dx);
    h.acao = { tipo: 'esquiva', t: 1, total: esq.duracao_quadros, def: esq };
    h.estado = ESTADOS_HEROI.ESQUIVA; h.destino = null; h.alvoId = null; h.quadroEstado = 0; h.esqRecarga = esq.recarga_quadros; h.invencivel = 1 >= esq.invencivel_quadros[0] && 1 <= esq.invencivel_quadros[1];
    const v = esq.distancia_tiles / esq.duracao_quadros / dt; h.vx = Math.cos(h.face) * v; h.vz = Math.sin(h.face) * v;
    ev.emitir('esquiva_inicio', { tick });
  }
  const dentroArco = (alvo, def) => {
    const dx = alvo.x - h.x, dz = alvo.z - h.z, d = Math.hypot(dx, dz), hb = def.hitbox;
    if (d - alvo.raioHurt > hb.alcance_tiles) return false;
    if (d < 1e-6) return true;
    const cos = (dx * Math.cos(h.face) + dz * Math.sin(h.face)) / d, a = Math.acos(Math.min(1, Math.max(-1, cos))) * (180 / Math.PI);
    // o alvo tem largura: tolera o ângulo subtendido pelo raio dele
    return a <= hb.abertura_graus / 2 + Math.asin(Math.min(1, alvo.raioHurt / Math.max(d, alvo.raioHurt))) * (180 / Math.PI);
  };

  /**
   * Um passo lógico. entrada = instantâneo (entrada_logica.amostrar); ctx = { obstaculos, alvos (entidades com x,z,raioHurt,id), eventos, buffer, tick }.
   */
  h.passo = (entrada, ctx) => {
    const { obstaculos, alvos, eventos: ev, buffer, tick } = ctx;
    h.ox = h.x; h.oz = h.z;
    if (h.esqRecarga > 0 && !(h.acao?.tipo === 'esquiva')) h.esqRecarga--;
    h.mover = entrada.mover.x || entrada.mover.z ? telaParaMundo(entrada.mover.x, entrada.mover.z) : { x: 0, z: 0 };
    const temMover = h.mover.x !== 0 || h.mover.z !== 0, correrSeg = entrada.segurando.has('correr');
    const alvoSob = entrada.alvoSob ? alvos.find((a) => a.id === entrada.alvoSob) : null, ancorado = entrada.segurando.has('ancorar');
    const pressionou = entrada.apertou.includes('clique_principal'), segura = entrada.segurando.has('clique_principal');
    if (temMover) { h.destino = null; h.alvoId = null; }
    else if (!ancorado) {
      if (pressionou) { if (alvoSob) { h.alvoId = alvoSob.id; h.destino = null; } else if (entrada.cursor.valido) { h.irPara(entrada.cursor.x, entrada.cursor.z); h.alvoId = null; h.correndoClique = false; } }
      else if (segura && !alvoSob && !h.alvoId && entrada.cursor.valido) { const k = `${Math.floor(entrada.cursor.x * 2)},${Math.floor(entrada.cursor.z * 2)}`; if (k !== h.chaveRota || !h.destino) h.irPara(entrada.cursor.x, entrada.cursor.z); } // segurar = seguir o cursor (rota refeita só quando o cursor muda de célula)
    }
    const alvoPerseguido = h.alvoId ? alvos.find((a) => a.id === h.alvoId) : null; if (h.alvoId && !alvoPerseguido) h.alvoId = null;

    // ---------- ação em curso ----------
    if (h.acao) {
      const a = h.acao; a.t++;
      if (a.tipo === 'ataque') {
        const { preparacao: p, ativo: at } = a.def.quadros, def = a.def;
        if (a.t > p && a.t <= p + at) for (const al of alvos) if (!a.acertou.has(al.id) && dentroArco(al, def)) { a.acertou.add(al.id); ev.emitir('golpe_acertou', { atacante: h.id, alvo: al.id, ataque: def.id, tick }); }
        const mov = a.t <= p + at ? def.avanco_tiles / (p + at) / dt : 0; h.vx = Math.cos(h.face) * mov; h.vz = Math.sin(h.face) * mov;
        const depoisAtivo = a.t >= p + at;
        if (depoisAtivo && h.acao.tipo === 'ataque') {
          if (buffer.consumir(tick, ['esquivar']) && h.esqRecarga === 0) { iniciarEsquiva(entrada, tick, ev); }
          else if (buffer.consumir(tick, ['forte'])) iniciarAtaque(dadosHeroi.forte, -1, entrada, alvoSob ?? alvoPerseguido, tick, ev);
          else if (a.idx >= 0 && a.idx + 1 < ataques.length && buffer.consumir(tick, ['atacar'])) { h.combo = a.idx + 1; iniciarAtaque(ataques[h.combo], h.combo, entrada, alvoSob ?? alvoPerseguido, tick, ev); }
        }
        if (h.acao && h.acao.tipo === 'ataque' && h.acao.t >= h.acao.total) { h.comboAte = a.idx >= 0 ? tick + a.def.janela_combo_quadros : -1; h.combo = a.idx >= 0 ? a.idx + 1 : 0; h.acao = null; h.estado = ESTADOS_HEROI.PARADO; h.quadroEstado = 0; ev.emitir('ataque_fim', { id: a.def.id, tick }); }
      } else {
        h.invencivel = a.t >= esq.invencivel_quadros[0] && a.t <= esq.invencivel_quadros[1];
        const v = esq.distancia_tiles / esq.duracao_quadros / dt; h.vx = Math.cos(h.face) * v; h.vz = Math.sin(h.face) * v;
        if (a.t >= a.total) { h.acao = null; h.invencivel = false; h.estado = ESTADOS_HEROI.PARADO; h.quadroEstado = 0; h.pararAposMover = true; } // o último quadro ainda anda; zera depois da integração
      }
    }

    // ---------- decisão (livre) ----------
    if (!h.acao) {
      let comboIdx = tick <= h.comboAte ? h.combo : 0; if (comboIdx >= ataques.length) comboIdx = 0;
      if (h.esqRecarga === 0 && buffer.consumir(tick, ['esquivar'])) iniciarEsquiva(entrada, tick, ev);
      else if (buffer.consumir(tick, ['forte'])) iniciarAtaque(dadosHeroi.forte, -1, entrada, alvoSob ?? alvoPerseguido, tick, ev);
      else if (ancorado && (pressionou || segura) && !alvoSob) { buffer.esvaziar(); iniciarAtaque(ataques[comboIdx], comboIdx, entrada, null, tick, ev); }
      else if (alvoPerseguido && Math.hypot(alvoPerseguido.x - h.x, alvoPerseguido.z - h.z) - alvoPerseguido.raioHurt <= ataques[comboIdx].hitbox.alcance_tiles * 0.9 && !temMover) { buffer.esvaziar(); iniciarAtaque(ataques[comboIdx], comboIdx, entrada, alvoPerseguido, tick, ev); }
      else if (buffer.consumir(tick, ['atacar'])) { const al = alvoSob ?? alvoPerseguido ?? null; if (al && Math.hypot(al.x - h.x, al.z - h.z) - al.raioHurt > ataques[comboIdx].hitbox.alcance_tiles * 0.9 && !ancorado) h.alvoId = al.id; else iniciarAtaque(ataques[comboIdx], comboIdx, entrada, al, tick, ev); }
    }

    // ---------- locomoção (só sem ação) ----------
    let querMover = false;
    if (!h.acao) {
      let alvoX = 0, alvoZ = 0, velAlvo = 0, correr = correrSeg;
      if (temMover) {
        const k = 1 / Math.hypot(h.mover.x, h.mover.z); querMover = true; // 8 direções: a entrada de teclado já é 8; analógico é quantizado
        const ang = Math.round(Math.atan2(h.mover.z, h.mover.x) / (Math.PI / 4)) * (Math.PI / 4); void k;
        alvoX = Math.cos(ang); alvoZ = Math.sin(ang);
      } else {
        const t = alvoPerseguido ?? h.destino;
        if (t) {
          const dx = t.x - h.x, dz = t.z - h.z, d = Math.hypot(dx, dz), chega = alvoPerseguido ? alvoPerseguido.raioHurt + ataques[0].hitbox.alcance_tiles * 0.8 : cfgE.chegada_tiles;
          if (d <= chega) { if (!alvoPerseguido) { h.destino = h.rota?.length ? h.rota.shift() : null; } }
          else { querMover = true; alvoX = dx / d; alvoZ = dz / d; if (d > cfgE.clique_corrida_distancia_tiles) h.correndoClique = true; correr = correr || h.correndoClique; }
        }
      }
      const velAlvoMod = correr ? m.vel_correr : m.vel_andar;
      if (querMover) { velAlvo = velAlvoMod; h.velMax = velAlvo; h.face = Math.atan2(alvoZ, alvoX); alvoX *= velAlvo; alvoZ *= velAlvo; } else h.correndoClique = false;
      const dvx = alvoX - h.vx, dvz = alvoZ - h.vz, dist = Math.hypot(dvx, dvz);
      if (dist > 0) {
        const acelerando = velAlvo > Math.hypot(h.vx, h.vz) - 1e-9 && querMover, taxa = h.velMax / (acelerando ? m.aceleracao_s : m.freada_s), degrau = taxa * dt;
        if (dist <= degrau) { h.vx = alvoX; h.vz = alvoZ; } else { h.vx += (dvx / dist) * degrau; h.vz += (dvz / dist) * degrau; }
      }
    }

    // ---------- integração + colisão com deslize ----------
    const x0 = h.x, z0 = h.z; pos.x = h.x + h.vx * dt; pos.z = h.z + h.vz * dt;
    mapa.resolverCirculo(pos, h.raioPush, obstaculos, normal);
    if (normal.nx !== 0 || normal.nz !== 0) { const vn = h.vx * normal.nx + h.vz * normal.nz; if (vn < 0) { h.vx -= vn * normal.nx; h.vz -= vn * normal.nz; } }
    h.x = pos.x; h.z = pos.z;
    if (h.pararAposMover) { h.vx = h.vz = 0; h.pararAposMover = false; }
    // destino inalcançável (parede no caminho): desiste depois de meio segundo sem progresso
    if (querMover && !temMover && Math.hypot(h.x - x0, h.z - z0) < 0.002) { if (++h.travadoSemProgresso > 30) { h.destino = null; h.travadoSemProgresso = 0; } } else h.travadoSemProgresso = 0;

    // ---------- estado e animação ----------
    if (!h.acao) { const v = Math.hypot(h.vx, h.vz), novo = v < 0.05 && !querMover ? ESTADOS_HEROI.PARADO : v > m.vel_andar + 0.3 ? ESTADOS_HEROI.CORRER : ESTADOS_HEROI.ANDAR; if (novo !== h.estado) { h.estado = novo; h.quadroEstado = 0; } else h.quadroEstado++; }
    else h.quadroEstado++;
    h.dir8 = dir8DeMundo(Math.cos(h.face), Math.sin(h.face));
    const an = dadosHeroi.animacoes, ac = h.acao;
    if (ac) { const meta = metaSprite.anims[ac.def.anim ?? esq.anim], n = meta.quadros; h.anim.nome = ac.def.anim ?? esq.anim; h.anim.quadro = Math.min(n - 1, Math.floor((ac.t / ac.total) * n)); }
    else { const nome = h.estado === 'PARADO' ? an.parado : h.estado === 'CORRER' ? an.correr : an.andar, meta = metaSprite.anims[nome]; h.anim.nome = nome; h.anim.quadro = h.estado === 'PARADO' ? Math.floor(h.quadroEstado * meta.fps / 60) % meta.quadros : Math.floor(h.quadroEstado * meta.fps / 60 * (h.estado === 'CORRER' ? 1 : 1)) % meta.quadros; }
  };
  /** Andar até (x, z) contornando o que é sólido (rota do mapa); destino inalcançável vira o ponto livre mais próximo. Devolve se há rota. */
  h.irPara = (x, z) => {
    h.chaveRota = `${Math.floor(x * 2)},${Math.floor(z * 2)}`;
    const r = mapa.rota(h.x, h.z, x, z, h.raioPush);
    if (!r || !r.length) { h.destino = null; h.rota = null; return false; }
    h.destino = r.shift(); h.rota = r; h.travadoSemProgresso = 0; return true;
  };
  /** Troca de mapa (portal) ou carregamento: novo mapa lógico (opcional), posição e direção; parado, sem rota nem ação. */
  h.definirMapa = (novoMapa, x, z, direcao) => {
    if (novoMapa) mapa = novoMapa;
    h.x = h.ox = x; h.z = h.oz = z; h.vx = h.vz = 0; h.destino = null; h.rota = null; h.alvoId = null; h.acao = null; h.chaveRota = null;
    if (direcao) { h.face = FACE_DE_DIRECAO[direcao]; h.dir8 = dir8DeMundo(Math.cos(h.face), Math.sin(h.face)); }
    h.estado = ESTADOS_HEROI.PARADO; h.quadroEstado = 0;
  };
  /** Direção cardinal (s | n | l | o) mais próxima da face (para o save). */
  h.direcao = () => Object.entries(FACE_DE_DIRECAO).reduce((m, [k, a]) => { const d = Math.abs(Math.atan2(Math.sin(h.face - a), Math.cos(h.face - a))); return d < m[1] ? [k, d] : m; }, ['s', Infinity])[0];
  h.velocidade = () => Math.hypot(h.vx, h.vz);
  h.spriteDir = () => spriteDeDir8(h.dir8);
  h.mover = { x: 0, z: 0 };
  return h;
}
