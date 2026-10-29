// Reprodução da fila de eventos do controlador de batalha no ritmo da apresentação (combate_turnos.md "Integração" §B, roteiro).
// Lógica pura (sem three nem DOM, testável em Node): recebe o controlador, ASSINA seus eventos (não esvazia a fila dele: quem chama
// `esvaziarFila()` é a UI do 15) e toca UM ATO POR VEZ, mantendo o estado
// VISUAL de cada ator (pose, posição, brilho, transparência, vida mostrada). A cena de batalha só lê `atores`; a UI (15) assina `eventos`,
// que repete os eventos do controlador no INSTANTE em que devem aparecer (dano/cura no impacto, queda depois) e acrescenta `ato_inicio`/`ato_fim`.
// Regra de ouro: quem chama `ctrl.executar()` (UI ou política automática) só o faz com `ocioso === true`.
import { criarEventos } from '../jogo/eventos.js';

const RESULTADO_DO_ATO = new Set(['dano', 'curou', 'vida_mudou', 'caiu', 'mana_gasta', 'mana_mudou', 'item_usado', 'defendeu', 'fuga_tentada', 'ato_falhou']);
const FIM_DO_ATO = new Set(['ato_executado', 'turno_iniciou', 'execucao_iniciou', 'rodada_terminou', 'rodada_iniciou', 'venceu', 'perdeu', 'fugiu', 'empate', 'batalha_terminou', 'ato_cancelado', 'comando_pedido', 'comando_escolhido']);
const suave = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
const lerp = (a, b, t) => a + (b - a) * t;

/**
 * @param ctrl controlador (criarControladorBatalha / mundo.jogo.batalha)
 * @param opcoes.cfg `dados.config.batalha` · `acoes` = `dados.combate.acoes`
 * @param opcoes.infoPose (uid, pose) → { duracao_s, impacto_s } do atlas (opcional; sem ele usa padrões)
 * @param opcoes.externo true = o relógio é de FORA (a UI do 15 toca a fila no ritmo dela e entrega cada evento por `alimentar(ev)` no instante certo): o toque não assina o controlador, e animação e UI começam o ato juntos
 * @param opcoes.reduzirFlashes sem clarão de acerto (acessibilidade)
 * @param opcoes.reduzirMovimento sem deslize de entrada nem avanço (só a pose)
 */
export function criarToque(ctrl, { cfg, acoes = {}, infoPose = null, reduzirMovimento = false, reduzirFlashes = false, externo = false, entradaDeslize = { distancia: 8, duracao_s: 0.45 } }) {
  const eventos = criarEventos(), T = cfg.tempos, fila = [], atores = new Map();
  // o controlador decora `ato_executado` com tempos só na fila dele; aqui calculamos os mesmos (duração ÷ velocidade)
  const decorar = (ev) => { if (ev.nome !== 'ato_executado' || ev.duracao_real_s !== undefined) return ev; const v = ctrl.velocidade ?? 1, d = ev.duracao_s / v; return { ...ev, duracao_real_s: d, impacto_s: d * cfg.fracao_impacto, intervalo_s: T.t_intervalo_ato / v }; };
  if (!externo) { for (const ev of ctrl.log) fila.push(decorar(ev)); /* o que já aconteceu (iniciar()) */ ctrl.assinar('*', (ev) => fila.push(decorar(ev))); }
  const est = { ato: null, espera: 0, terminou: false, fimAnunciado: false, entrada: null };
  const ini = ctrl.consultar();
  for (const a of ini.atores) {
    atores.set(a.uid, {
      uid: a.uid, id: a.id, lado: a.lado, slot: a.slot, nome_txt: a.nome_txt, base: [a.posicao_cena[0], a.posicao_cena[1]],
      dx: 0, dz: 0, empurrao: 0, pose: 'bat_parado', tPose: 0, loop: true, poseAte: 0, caido: !!a.caido, alfa: 1, brilho: 0, sombraSomente: false,
      vida: a.vida, vida_max: a.vida_max, mana: a.mana, mana_max: a.mana_max, defendendo: a.defendendo,
    });
  }
  const A = (uid) => atores.get(uid);
  const emitir = (nome, dados) => eventos.emitir(nome, { nome, ...dados });
  const info = (uid, pose) => ({ duracao_s: 0.4, impacto_s: 0.15, ...(infoPose?.(uid, pose) ?? {}) });
  const definirPose = (a, pose, loop = false, ate = 0) => { a.pose = pose; a.tPose = 0; a.loop = loop; a.poseAte = ate; };
  const parado = (a) => { if (a.caido) definirPose(a, 'bat_caido'); else definirPose(a, 'bat_parado', true); };

  // ---------- entrada: os atores deslizam de fora da tela até o slot ----------
  function entrar() {
    est.entrada = reduzirMovimento ? null : { t: 0, ...entradaDeslize };
    est.espera = reduzirMovimento ? 0.15 : entradaDeslize.duracao_s;
    atualizarEntrada(0);
  }
  function atualizarEntrada(dt) {
    const e = est.entrada; if (!e) return;
    e.t += dt; const k = 1 - suave(e.t / e.duracao_s);
    for (const a of atores.values()) { a.dx = (a.lado === 'grupo' ? 1 : -1) * e.distancia * k; if (a.dx !== 0 && e.t < e.duracao_s) a.pose = 'bat_avanca'; else if (a.pose === 'bat_avanca' && !est.ato) parado(a); }
    if (e.t >= e.duracao_s) { est.entrada = null; for (const a of atores.values()) { a.dx = 0; if (!est.ato && a.pose === 'bat_avanca') parado(a); } }
  }
  if (!reduzirMovimento) entrar(); else est.espera = 0.15;

  // ---------- atos ----------
  function iniciarAto(ev, resultados) {
    const ator = A(ev.ator), alvo = A(ev.alvos?.[0]) ?? null, acao = ev.id ? acoes[ev.id] : null;
    const corpoACorpo = !!acao && acao.efeito === 'dano' && alvo && alvo.lado !== ator.lado && ['atacar', 'habilidade'].includes(ev.tipo);
    const D = ev.duracao_real_s ?? ev.duracao_s ?? 0.9, I = Math.min(ev.impacto_s ?? D * 0.45, D), pose = ev.pose ?? (corpoACorpo ? 'bat_ataque' : 'bat_parado');
    const ip = info(ev.ator, pose), fases = { D, I, aproxima: 0, retornaEm: D };
    let contato = null;
    if (corpoACorpo && !reduzirMovimento) {
      const ax = ator.base[0], az = ator.base[1], bx = alvo.base[0], bz = alvo.base[1], d = Math.hypot(ax - bx, az - bz) || 1;
      contato = [bx + ((ax - bx) / d) * cfg.dist_contato_tiles, bz + ((az - bz) / d) * cfg.dist_contato_tiles];
      fases.aproxima = Math.min(Math.max(0.1, I - ip.impacto_s), D * 0.35);
      fases.retornaEm = Math.min(Math.max(fases.aproxima + ip.duracao_s, I + 0.1), D - 0.2);
    }
    est.ato = { ev, ator, alvo, resultados, t: 0, fases, contato, pose, ip, aplicado: false, fugaPara: 0, iniciouPose: false };
    if (contato) definirPose(ator, 'bat_avanca', true); else if (ev.tipo === 'fugir') definirPose(ator, 'bat_avanca', true); else if (pose !== 'bat_parado') { definirPose(ator, pose); est.ato.iniciouPose = true; }
    emitir('ato_inicio', { ator: ev.ator, tipo: ev.tipo, id: ev.id, alvos: ev.alvos, pose, duracao_real_s: D, impacto_s: I });
  }
  function aplicarResultados(ato) {
    for (const r of ato.resultados) {
      const alvo = A(r.alvo ?? r.ator);
      if (r.nome === 'dano' && alvo) { alvo.brilho = reduzirFlashes ? 0 : 1; alvo.empurrao = reduzirMovimento ? 0 : (alvo.lado === 'grupo' ? 0.45 : -0.45); if (!alvo.caido) definirPose(alvo, 'bat_dano', false, T.t_dano); }
      else if (r.nome === 'curou' && alvo) alvo.brilho = 0.6;
      else if (r.nome === 'vida_mudou' && alvo) alvo.vida = r.vida;
      else if (r.nome === 'mana_mudou' && alvo) alvo.mana = r.mana;
      else if (r.nome === 'defendeu' && alvo) alvo.defendendo = true;
      else if (r.nome === 'caiu') { const c = A(r.alvo); if (c) { c.caido = true; c.queda = { t: 0 }; definirPose(c, 'bat_caido'); } }
      else if (r.nome === 'fuga_tentada') ato.fugaPara = r.sucesso ? 1 : 0;
      emitir(r.nome, r);
    }
  }
  function avancarAto(dt) {
    const ato = est.ato, f = ato.fases; ato.t += dt;
    const { ator } = ato;
    if (ato.contato) { // vai até o contato, golpeia no instante certo e volta
      if (ato.t < f.aproxima) { const k = suave(ato.t / f.aproxima); ator.dx = (ato.contato[0] - ator.base[0]) * k; ator.dz = (ato.contato[1] - ator.base[1]) * k; }
      else if (!ato.iniciouPose) { ato.iniciouPose = true; ator.dx = ato.contato[0] - ator.base[0]; ator.dz = ato.contato[1] - ator.base[1]; definirPose(ator, ato.pose); }
      if (ato.t >= f.retornaEm) { const k = suave((ato.t - f.retornaEm) / Math.max(0.05, f.D - f.retornaEm)); ator.dx = (ato.contato[0] - ator.base[0]) * (1 - k); ator.dz = (ato.contato[1] - ator.base[1]) * (1 - k); if (ator.pose !== 'bat_avanca') definirPose(ator, 'bat_avanca', true); }
    } else if (ato.ev.tipo === 'fugir') {
      const k = suave(ato.t / f.D); ator.dx = (ator.lado === 'grupo' ? 1 : -1) * 6 * (ato.fugaPara ? k : Math.sin(k * Math.PI) * 0.5);
    }
    if (!ato.aplicado && ato.t >= f.I) { ato.aplicado = true; aplicarResultados(ato); }
    if (ato.t >= f.D + (ato.ev.intervalo_s ?? T.t_intervalo_ato)) {
      if (!ato.aplicado) { ato.aplicado = true; aplicarResultados(ato); }
      if (!ator.caido) { ator.dx = 0; ator.dz = 0; if (!ator.defendendo || ato.ev.tipo !== 'defender') parado(ator); }
      emitir('ato_fim', { ator: ato.ev.ator });
      est.ato = null;
    }
  }

  function processar(ev) {
    if (ev.nome === 'ato_executado') {
      const resultados = []; while (fila.length && !FIM_DO_ATO.has(fila[0].nome)) { const p = fila.shift(); if (RESULTADO_DO_ATO.has(p.nome)) resultados.push(p); else emitir(p.nome, p); }
      iniciarAto(ev, resultados); emitir('ato_executado', ev); return;
    }
    if (ev.nome === 'rodada_terminou') for (const a of atores.values()) if (a.defendendo) a.defendendo = false;
    if (ev.nome === 'venceu') { for (const a of atores.values()) if (a.lado === 'grupo' && !a.caido) definirPose(a, 'bat_vitoria', true); est.espera = T.t_vitoria; }
    else if (ev.nome === 'perdeu') est.espera = 1;
    else if (ev.nome === 'fugiu') est.espera = T.t_fuga ?? 0.8;
    else if (ev.nome === 'empate') est.espera = 0.6;
    else if (ev.nome === 'vida_mudou') { const a = A(ev.ator); if (a) { a.vida = ev.vida; if (a.caido && ev.vida > 0) { a.caido = false; parado(a); } } } // vitória: o caído volta com 1 de vida
    else if (ev.nome === 'mana_mudou') { const a = A(ev.ator); if (a) a.mana = ev.mana; }
    emitir(ev.nome, ev);
  }

  function efeitosVisuais(dt) {
    for (const a of atores.values()) {
      a.tPose += dt;
      if (a.brilho > 0) a.brilho = Math.max(0, a.brilho - dt / 0.12); // clarão curto (~7 quadros, 2–3 em branco pleno): ≤ 3 flashes/s por regra
      if (a.empurrao !== 0) { const k = Math.max(0, 1 - dt / 0.18); a.empurrao *= k; if (Math.abs(a.empurrao) < 0.01) a.empurrao = 0; }
      if (a.poseAte > 0 && a.tPose >= a.poseAte) { a.poseAte = 0; if (!(est.ato && est.ato.ator === a)) parado(a); }
      if (a.queda) { a.queda.t += dt; if (a.lado === 'inimigos') { const k = (a.queda.t - T.t_cair) / 0.3; a.alfa = Math.max(0, Math.min(1, 1 - k)); if (a.alfa <= 0) a.sombraSomente = true; } }
    }
  }

  const toque = {
    eventos, atores,
    /** Modo externo: entrega um evento (já decorado pela UI/controlador) no instante em que a UI o toca. */
    alimentar(ev) { if (externo && RESULTADO_DO_ATO.has(ev.nome)) aplicarResultados({ resultados: [ev], fugaPara: 0 }); /* a UI já esperou o impacto: reage agora */ else fila.push(decorar(ev)); },
    /** Nada tocando e nada pendente (os eventos de `executar()` entram na hora: o menu só abre depois de tocar tudo). */
    get ocioso() { return !est.ato && fila.length === 0 && est.espera <= 0 && !est.entrada; },
    get terminou() { return est.terminou; },
    /** Segundos de reprodução: chamar a cada quadro. Toca a fila própria (alimentada pela assinatura do controlador). */
    avancar(dt) {
      efeitosVisuais(dt); atualizarEntrada(dt);
      if (est.espera > 0) { est.espera -= dt; if (est.espera > 0) return; }
      for (let guarda = 0; guarda < 200; guarda++) {
        if (est.ato) { avancarAto(dt); dt = 0; if (est.ato) return; }
        if (est.espera > 0) return;
        if (!fila.length) { if (ctrl.fim && !est.fimAnunciado) { est.fimAnunciado = true; est.terminou = true; emitir('toque_terminou', {}); } return; }
        processar(fila.shift());
        if (est.ato) { avancarAto(0); if (est.ato) return; }
        if (est.espera > 0) return;
      }
    },
  };
  return toque;
}
