// Programa principal: carrega dados/assets, monta mundo + cena + entrada + áudio e roda o laço (passo fixo 60 Hz, desenho interpolado).
// __DEV__ (definido no build) liga o debug; no build de produção todo o código de debug é removido.
import * as THREE from 'three';
import { lerManifesto, criarCarregador, carregarRecursos } from './carregador.js';
import { criarTextos } from '../jogo/textos.js';
import { criarEventos } from '../jogo/eventos.js';
import { criarMundo } from '../jogo/mundo.js';
import { criarEntradaLogica } from '../jogo/entrada_logica.js';
import { Acumulador } from '../jogo/acumulador.js';
import { criarRenderizador } from '../motor/renderizador.js';
import { criarCena } from '../motor/cena.js';
import { criarCenaBatalha } from '../motor/cena_batalha.js';
import { criarApresentacao } from './apresentacao.js';
import { ligarEntradaDom } from './entrada_dom.js';
import { criarAudio } from './audio.js';
import { criarBatalhaUi } from '../ui/batalha_ui.js';

async function iniciar() {
  const marcas = { inicio: performance.now() }; // só desenvolvimento: tempos de cada etapa da carga
  const manifesto = lerManifesto(), carregador = criarCarregador(manifesto), P = new URLSearchParams(location.search);
  const dados = await carregador.dados(); marcas.dados = performance.now();
  const t = criarTextos(dados.textos['pt-BR']);
  const recursos = await carregarRecursos(carregador, dados); marcas.assets = performance.now();
  const cfg = dados.config.jogo, eventos = criarEventos(), mundo = criarMundo(dados, eventos, recursos.metas, { sementeEncontros: (crypto.getRandomValues(new Uint32Array(1))[0] || 1) });

  if (__DEV__ && P.get('hora')) { mundo.hora = Number(P.get('hora')); mundo.cicloLigado = false; } // ?hora=21 para olhar a noite
  const cfgEntrada = __DEV__ ? dados.config.entrada : { ...dados.config.entrada, debug: {} };
  const entrada = criarEntradaLogica(cfgEntrada, cfg);

  // ---------- perfil de qualidade (dados): padrão do arquivo, ?perfil=perfil_baixo na URL ou F12 no debug ----------
  const perfis = dados.config.perfis.perfis;
  let iPerfil = Math.max(0, perfis.findIndex((p) => p.id === (P.get('perfil') ?? dados.config.perfis.padrao)));

  // ---------- renderização ----------
  const canvas = document.getElementById('tela');
  const ren = criarRenderizador(canvas, cfg, perfis[iPerfil], P.get('modo') ?? undefined);
  const redimensionar = () => ren.ajustar(innerWidth, innerHeight, window.devicePixelRatio || 1);
  redimensionar(); addEventListener('resize', redimensionar);
  const cena = criarCena({ dados, mundo, recursos, perfil: perfis[iPerfil], opcoes: { texelsPorTile: Number(P.get('texel') ?? 64), chaoNearest: P.get('chao') === 'nearest' } });
  // batalha (BL-008): arena separada, câmera e resolução de arte próprias; a plataforma troca de vista por névoa (apresentacao.js)
  const temBatalha = !!(mundo.jogo && dados.cenarios && dados.config.sprites_batalha);
  const cenaBat = temBatalha ? criarCenaBatalha({ dados, recursos, perfil: perfis[iPerfil], opcoes: { texelsPorTile: Number(P.get('texel') ?? 64) } }) : null;
  const apr = temBatalha ? criarApresentacao({ mundo, dados, cenaBatalha: cenaBat, ren, container: document.getElementById('ui'), opcoes: { reduzirMovimento: P.get('reduzir') === '1' || matchMedia('(prefers-reduced-motion: reduce)').matches } }) : null;
  const aplicarPerfil = () => { ren.definirPerfil(perfis[iPerfil]); cena.aplicarPerfil(perfis[iPerfil]); cenaBat?.aplicarPerfil(perfis[iPerfil]); };
  aplicarPerfil(); marcas.cena = performance.now();

  // ---------- áudio desbloqueado por clique/tecla ----------
  const audio = criarAudio(recursos.sfxPing);
  const aviso = document.getElementById('aviso'); aviso.textContent = t('ui_comecar');
  let desbloqueando = false;
  const aoGesto = () => { if (desbloqueando || audio.estado === 'running') return; desbloqueando = true; audio.desbloquear().then((ok) => { desbloqueando = false; if (ok) aviso.remove(); }); };
  const ponte = ligarEntradaDom({ entrada, canvas, eventos, aoGesto });
  // UI da batalha por turnos (15): só aparece com mundo.jogo.modo === 'batalha'; no desenvolvimento, ] dispara o próximo encontro de teste
  const batalhaUi = mundo.jogo ? criarBatalhaUi({ mundo, dados, t, debug: __DEV__ }) : null;
  if (batalhaUi && apr) { apr.assumirComandos(); batalhaUi.definirProjecao((p) => { const q = cenaBat.projetarPonto(p); return { x: q.x * 100, y: q.y * 100 }; }); batalhaUi.definirEspera(() => !!apr.toque && !apr.toque.ocioso); } // a UI escolhe os comandos e fecha a batalha; a apresentação só toca as animações e troca a vista

  // ---------- debug (só desenvolvimento) ----------
  let debug = null, debugDesenho = null;
  if (__DEV__) {
    const [{ criarDebugUi }, { criarDebugDesenho }] = await Promise.all([import('../ui/debug_ui.js'), import('../motor/debug_desenho.js')]);
    debug = criarDebugUi({ mundo, entrada, t, cfg, infoGpu: () => ren.infoGpu(), acoesExternas: { proximoPerfil: () => { iPerfil = (iPerfil + 1) % perfis.length; aplicarPerfil(); }, aoPausar: () => {} } });
    debugDesenho = criarDebugDesenho(cena.cena, mundo);
    eventos.em('gamepad_desconectado', () => debug.avisarGamepadFora());
  }

  // Compila shaders e sobe texturas ANTES do primeiro quadro (sem engasgo no começo)
  cena.atualizar(1, 0); await ren.renderer.compileAsync(cena.cena, cena.camera); ren.desenhar(cena.cena, cena.camera, cena.visual);
  if (cenaBat) { cenaBat.preparar(); await ren.renderer.compileAsync(cenaBat.cena, cenaBat.camera); cenaBat.desligar(); }
  marcas.compilado = performance.now();

  // ---------- cursor do mouse → ponto no chão e inimigo sob ele ----------
  const heroiNdc = new THREE.Vector3();
  function atualizarCursor() {
    const p = ponte.ponteiro, r = canvas.getBoundingClientRect(), e = ren.estado, bx = (p.x - r.left) * (canvas.width / r.width), by = (p.y - r.top) * (canvas.height / r.height);
    const topo = e.altura - e.vy - e.vh, nx = ((bx - e.vx) / e.vw) * 2 - 1, ny = 1 - ((by - topo) / e.vh) * 2, dentro = p.dentro && nx >= -1 && nx <= 1 && ny >= -1 && ny <= 1;
    const c = cena.pegarCursor(nx, ny, mundo.entidades); entrada.definirCursor(c.x, c.z, dentro ? c.alvo : null, dentro && c.valido);
    cena.definirAlvoSob(dentro ? c.alvo : null); canvas.style.cursor = dentro && c.alvo ? 'crosshair' : 'default'; return c;
  }

  // ---------- laço de passo fixo ----------
  const sincronizar = __DEV__ && P.get('sync') === '1', glFinish = () => ren.renderer.getContext().finish();
  const acum = new Acumulador(cfg.passo_logico_hz, cfg.max_passos_por_quadro);
  let cursor = { x: 0, z: 0, alvo: null }, ultimo = performance.now(), oculto = document.hidden, ultimoSnap = null, proximoTexto = 0, tempoS = 0;
  document.addEventListener('visibilitychange', () => {
    oculto = document.hidden;
    if (oculto) { entrada.soltarTudo(); audio.suspender(); } else { ultimo = performance.now(); acum.resetar(); audio.retomar(); } // volta sem simular o tempo perdido
  });

  function quadro(agora) {
    requestAnimationFrame(quadro);
    if (oculto) return;
    const dtMs = agora - ultimo; ultimo = agora;
    ponte.amostrarGamepad(); if (apr?.visao !== 'batalha') cursor = atualizarCursor();
    let passos, alfa;
    if (__DEV__) for (const a of entrada.drenarDebug()) debug.tratar(a);
    if (__DEV__ && debug.pausado) { passos = debug.consumirPasso() ? 1 : 0; acum.resetar(); alfa = 1; }
    else { passos = acum.avancar(dtMs / 1000, __DEV__ ? debug.fatorTempo() : 1); alfa = acum.alfa; tempoS += Math.min(dtMs, 100) / 1000; }
    for (let i = 0; i < passos; i++) { ultimoSnap = entrada.amostrar(mundo.ticks); mundo.passo(ultimoSnap, entrada.buffer); }
    // encontro natural (passos) e de depuração entram pelo mesmo caminho: jogo.batalha novo → a UI liga a ele (antes só a tecla ] ligava, e em produção a batalha ficava sem UI)
    if (batalhaUi && mundo.jogo.modo === 'batalha' && mundo.jogo.batalha && batalhaUi.controlador !== mundo.jogo.batalha) batalhaUi.ligar(mundo.jogo.batalha);
    batalhaUi?.atualizar(Math.min(dtMs, 100) / 1000);
    const dtS = Math.min(dtMs, 100) / 1000;
    if (apr) {
      const pausado = __DEV__ && debug.pausado;
      apr.atualizar(pausado ? (passos ? 1 / cfg.passo_logico_hz : 0) : dtS * (__DEV__ ? debug.fatorTempo() : 1));
      apr.layoutUi(canvas);
    }
    if (apr?.visao === 'batalha') {
      cenaBat.atualizar(dtS, tempoS, mundo.hora); const ex = cenaBat.extrasDesenho();
      ren.desenhar(cenaBat.cena, cenaBat.camera, cenaBat.visual, ex.focoY, { faixa: ex.faixa, vinhetaExtra: ex.vinhetaExtra, cobertura: apr.cobertura, corCobertura: cenaBat.visual.ciclo.nevoa });
    } else {
      cena.atualizar(alfa, tempoS, dtS);
      if (__DEV__) debugDesenho.atualizar(debug.estado.caixas, alfa);
      heroiNdc.set(mundo.heroi.x, 1, mundo.heroi.z).project(cena.camera);
      ren.desenhar(cena.cena, cena.camera, cena.visual, heroiNdc.y * 0.5 + 0.5, apr ? { cobertura: apr.cobertura, corCobertura: cena.visual.ciclo.nevoa } : {});
    }
    if (__DEV__ && sincronizar) glFinish();
    if (__DEV__) {
      debug.registrarQuadro(dtMs);
      if (agora >= proximoTexto) { proximoTexto = agora + 100; debug.atualizarTexto({ mover: ultimoSnap?.mover ?? { x: 0, z: 0 }, perfil: t(perfis[iPerfil].nome_txt), audio: t('ui_debug_audio', { estado: audio.estado }), cursor, resolucao: ren.estado }); }
    }
  }
  requestAnimationFrame(quadro);

  if (__DEV__) {
    // Gancho para testes automáticos e medições (tools/testar_navegador.mjs). NÃO existe no build de produção.
    window.__dunwick = {
      mundo, entrada, debug, ren, audio, cena, acum, perfis, t, marcas, eventos, apr, cenaBat, jogo: mundo.jogo, batalhaUi,
      ticks: () => mundo.ticks, exportarTempos: () => debug.exportar(false), estatisticasGl: () => ren.estatisticas(), escala: () => ren.escala, perfilAtual: () => perfis[iPerfil].id,
      textosFaltando: () => [...t.faltando], redimensionar, modo: () => ren.modo, atualizarCursor,
      definirModo: (m) => ren.definirModo(m, innerWidth, innerHeight, window.devicePixelRatio || 1),
      /** Converte um ponto do mundo em coordenadas de tela (px CSS) para os testes clicarem em lugares exatos. */
      mundoParaTela(x, y, z) {
        const v = new THREE.Vector3(x, y, z).project(cena.camera), e = ren.estado, r = canvas.getBoundingClientRect(), topo = e.altura - e.vy - e.vh;
        return { x: r.left + ((e.vx + ((v.x + 1) / 2) * e.vw) * r.width) / canvas.width, y: r.top + ((topo + ((1 - v.y) / 2) * e.vh) * r.height) / canvas.height };
      },
    };
  }
  document.documentElement.dataset.pronto = '1';
}

iniciar().catch((e) => {
  console.error(e);
  const el = document.getElementById('aviso'); if (el) el.textContent = `Não foi possível carregar o jogo: ${e.message}`;
  document.documentElement.dataset.erro = '1';
});
