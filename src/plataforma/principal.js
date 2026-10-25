// Programa principal: carrega dados/assets, monta mundo + cena + entrada + áudio, e roda o laço (passo fixo 60 Hz, desenho interpolado).
// __DEV__ (definido no build) liga o debug; no build de produção todo o código de debug é removido.
import { lerManifesto, criarCarregador, carregarRecursos } from './carregador.js';
import { criarTextos } from '../jogo/textos.js';
import { criarEventos } from '../jogo/eventos.js';
import { criarMundo } from '../jogo/mundo.js';
import { criarEntradaLogica } from '../jogo/entrada_logica.js';
import { Acumulador } from '../jogo/acumulador.js';
import { criarRenderizador } from '../motor/renderizador.js';
import { criarCena } from '../motor/cena.js';
import { ligarEntradaDom } from './entrada_dom.js';
import { criarAudio } from './audio.js';

async function iniciar() {
  const marcas = { inicio: performance.now() }; // só desenvolvimento: tempos de cada etapa da carga
  const manifesto = lerManifesto(), carregador = criarCarregador(manifesto);
  const dados = await carregador.dados();
  marcas.dados = performance.now();
  const t = criarTextos(dados.textos['pt-BR']);
  const recursos = await carregarRecursos(carregador, dados);
  marcas.assets = performance.now();
  const cfg = dados.config.jogo, eventos = criarEventos(), mundo = criarMundo(dados, eventos);

  // ---------- entrada (teclas de debug só existem no build de desenvolvimento) ----------
  const cfgEntrada = __DEV__ ? dados.config.entrada : { ...dados.config.entrada, debug: {} };
  const entrada = criarEntradaLogica(cfgEntrada, cfg);

  // ---------- renderização ----------
  const canvas = document.getElementById('tela');
  const ren = criarRenderizador(canvas, cfg);
  const redimensionar = () => ren.ajustar(innerWidth, innerHeight, window.devicePixelRatio || 1);
  redimensionar(); addEventListener('resize', redimensionar);
  const cena = criarCena({ dados, mundo, recursos });

  // ---------- perfil de qualidade (dados): padrão do arquivo, ?perfil=perfil_baixo na URL ou F12 no debug ----------
  const perfis = dados.config.perfis.perfis;
  let iPerfil = Math.max(0, perfis.findIndex((p) => p.id === (new URLSearchParams(location.search).get('perfil') ?? dados.config.perfis.padrao)));
  const aplicarPerfil = () => { const p = perfis[iPerfil]; cena.aplicarPerfil(p); ren.definirVinheta(p.pos_vinheta); };
  aplicarPerfil();
  marcas.cena = performance.now();

  // ---------- áudio desbloqueado por clique/tecla ----------
  const audio = criarAudio(recursos.sfxPing);
  const aviso = document.getElementById('aviso'); aviso.textContent = t('ui_comecar');
  let desbloqueando = false;
  const aoGesto = () => {
    if (desbloqueando || audio.estado === 'running') return;
    desbloqueando = true;
    audio.desbloquear().then((ok) => { desbloqueando = false; if (ok) aviso.remove(); });
  };
  const ponte = ligarEntradaDom({ entrada, canvas, eventos, aoGesto });

  // ---------- debug (só desenvolvimento) ----------
  let debug = null, debugDesenho = null;
  if (__DEV__) {
    const [{ criarDebugUi }, { criarDebugDesenho }] = await Promise.all([import('../ui/debug_ui.js'), import('../motor/debug_desenho.js')]);
    debug = criarDebugUi({ mundo, entrada, t, cfg, infoGpu: () => ren.infoGpu(), acoesExternas: { proximoPerfil: () => { iPerfil = (iPerfil + 1) % perfis.length; aplicarPerfil(); }, aoPausar: () => {} } });
    debugDesenho = criarDebugDesenho(cena.cena, mundo);
    eventos.em('gamepad_desconectado', () => debug.avisarGamepadFora());
  }

  // Compila shaders e sobe texturas ANTES do primeiro quadro: sem engasgo no começo (M1-03).
  cena.atualizar(1);
  await ren.renderer.compileAsync(cena.cena, cena.camera);
  ren.desenhar(cena.cena, cena.camera);
  marcas.compilado = performance.now();

  // ---------- laço de passo fixo ----------
  const sincronizar = __DEV__ && new URLSearchParams(location.search).get('sync') === '1', glFinish = () => ren.renderer.getContext().finish();
  const acum = new Acumulador(cfg.passo_logico_hz, cfg.max_passos_por_quadro);
  let ultimo = performance.now(), oculto = document.hidden, ultimoSnap = null, proximoTexto = 0;
  document.addEventListener('visibilitychange', () => {
    oculto = document.hidden;
    if (oculto) { entrada.soltarTudo(); audio.suspender(); }
    else { ultimo = performance.now(); acum.resetar(); audio.retomar(); } // volta sem simular o tempo perdido
  });

  function quadro(agora) {
    requestAnimationFrame(quadro);
    if (oculto) return;
    const dtMs = agora - ultimo; ultimo = agora;
    ponte.amostrarGamepad();
    let passos, alfa;
    if (__DEV__) for (const a of entrada.drenarDebug()) debug.tratar(a);
    if (__DEV__ && debug.pausado) { passos = debug.consumirPasso() ? 1 : 0; acum.resetar(); alfa = 1; }
    else { passos = acum.avancar(dtMs / 1000, __DEV__ ? debug.fatorTempo() : 1); alfa = acum.alfa; }
    for (let i = 0; i < passos; i++) { ultimoSnap = entrada.amostrar(mundo.ticks); mundo.passo(ultimoSnap); }
    cena.atualizar(alfa);
    if (__DEV__) debugDesenho.atualizar(debug.estado.caixas, alfa);
    ren.desenhar(cena.cena, cena.camera);
    if (__DEV__ && sincronizar) glFinish(); // medição de capacidade: espera a GPU (sem isto o fps sem vsync mede só a CPU)
    if (__DEV__) {
      debug.registrarQuadro(dtMs);
      if (agora >= proximoTexto) { proximoTexto = agora + 100; debug.atualizarTexto({ mover: ultimoSnap?.mover ?? { x: 0, z: 0 }, perfil: t(perfis[iPerfil].nome_txt), audio: t('ui_debug_audio', { estado: audio.estado }) }); }
    }
  }
  requestAnimationFrame(quadro);

  if (__DEV__) {
    // Gancho para testes automáticos e medições (tools/testar_navegador.mjs). NÃO existe no build de produção.
    window.__dunwick = {
      mundo, entrada, debug, ren, audio, cena, acum, perfis, t, marcas,
      ticks: () => mundo.ticks, exportarTempos: () => debug.exportar(false),
      estatisticasGl: () => ren.estatisticas(), escala: () => ren.escala, perfilAtual: () => perfis[iPerfil].id,
      textosFaltando: () => [...t.faltando],
    };
  }
  document.documentElement.dataset.pronto = '1';
}

iniciar().catch((e) => {
  console.error(e);
  const el = document.getElementById('aviso'); if (el) el.textContent = `Não foi possível carregar o jogo: ${e.message}`;
  document.documentElement.dataset.erro = '1';
});
