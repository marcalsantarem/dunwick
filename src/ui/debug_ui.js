// Modo debug (SÓ no build de desenvolvimento). Texto por ID (data/texts), nunca innerHTML.
// F1 caixas · F2 estados · F3 fps · F4 entrada · F6 pausar · F7 passo · F8 lento · F9 exportar tempos · F10 zerar · F12 perfil · ` hora · \ ciclo.

export function criarDebugUi({ mundo, entrada, t, cfg, acoesExternas, infoGpu }) {
  const el = document.createElement('pre'); el.id = 'debug'; el.setAttribute('aria-hidden', 'true'); document.body.appendChild(el);
  const ajuda = t('ui_debug_ajuda');
  const estadoUi = { caixas: false, estados: true, fps: true, entrada: false, pausado: false, lento: false, passoPendente: false };
  const maxQuadros = cfg.debug.gravacao_max_s * 240; // cobre o teto de 240 fps durante gravacao_max_s
  let tempos = new Float32Array(maxQuadros), nTempos = 0, inicioGravacao = performance.now(), ticksInicio = 0, foraAte = 0;
  const janela = new Float32Array(600); let nJanela = 0, iJanela = 0;

  function registrarQuadro(dtMs) {
    if (nTempos < maxQuadros) tempos[nTempos++] = dtMs;
    janela[iJanela] = dtMs; iJanela = (iJanela + 1) % janela.length; nJanela = Math.min(janela.length, nJanela + 1);
  }
  function resumo(arr, n) {
    if (n === 0) return { fpsMedio: 0, fpsPior1: 0, p99ms: 0, quadrosAcima50ms: 0, quadros: 0 };
    const v = Array.from(arr.subarray ? arr.subarray(0, n) : arr.slice(0, n)).sort((a, b) => a - b), soma = v.reduce((s, x) => s + x, 0);
    const pior = v.slice(Math.floor(n * 0.99)), mediaPior = pior.reduce((s, x) => s + x, 0) / Math.max(1, pior.length);
    return { fpsMedio: +(1000 / (soma / n)).toFixed(1), fpsPior1: +(1000 / mediaPior).toFixed(1), p99ms: +v[Math.min(n - 1, Math.floor(n * 0.99))].toFixed(2), quadrosAcima50ms: v.filter((x) => x > 50).length, quadros: n };
  }
  const resumoJanela = () => resumo(janela, nJanela), resumoGravacao = () => resumo(tempos, nTempos);

  function exportar(baixar = true) {
    const dados = {
      formato: 'dunwick-tempos-quadro', versao: 2, iniciado_em: new Date(Date.now() - (performance.now() - inicioGravacao)).toISOString(),
      duracao_s: +((performance.now() - inicioGravacao) / 1000).toFixed(2), ticks_inicio: ticksInicio, ticks_fim: mundo.ticks,
      gpu: infoGpu(), agente: navigator.userAgent, dpr: window.devicePixelRatio, janela: [innerWidth, innerHeight],
      resumo: resumoGravacao(), quadros_ms: Array.from(tempos.subarray(0, nTempos), (x) => +x.toFixed(2)),
    };
    if (baixar) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(dados)], { type: 'application/json' })); a.download = `tempos-quadro-${Date.now()}.json`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); }
    nTempos = 0; inicioGravacao = performance.now(); ticksInicio = mundo.ticks; return dados;
  }

  function tratar(acao) {
    switch (acao) {
      case 'debug_caixas': estadoUi.caixas = !estadoUi.caixas; break; case 'debug_estados': estadoUi.estados = !estadoUi.estados; break;
      case 'debug_fps': estadoUi.fps = !estadoUi.fps; break; case 'debug_entrada': estadoUi.entrada = !estadoUi.entrada; break;
      case 'debug_pausar': estadoUi.pausado = !estadoUi.pausado; acoesExternas.aoPausar?.(estadoUi.pausado); break;
      case 'debug_passo': if (estadoUi.pausado) estadoUi.passoPendente = true; break;
      case 'debug_lento': estadoUi.lento = !estadoUi.lento; break; case 'debug_exportar': exportar(true); break;
      case 'debug_contadores': mundo.zerarContadores(); break; case 'debug_perfil': acoesExternas.proximoPerfil(); break;
      case 'debug_hora': mundo.avancarHora(1); break; case 'debug_ciclo': mundo.cicloLigado = !mundo.cicloLigado; break;
    }
  }

  const f1 = (n) => (Math.round(n * 100) / 100).toFixed(2);
  function atualizarTexto(extra) {
    const linhas = [ajuda];
    if (estadoUi.pausado) linhas.push(t('ui_debug_pausado'));
    if (estadoUi.lento) linhas.push(t('ui_debug_lento', { fator: cfg.debug.lento_fator }));
    if (extra.perfil) linhas.push(t('ui_debug_perfil', { perfil: extra.perfil }));
    if (extra.resolucao) linhas.push(t('ui_debug_resolucao', { w: extra.resolucao.rw, h: extra.resolucao.rh, escala: f1(extra.resolucao.escala), modo: extra.resolucao.modo }));
    if (estadoUi.fps) { const r = resumoJanela(); linhas.push(t('ui_debug_fps', { media: r.fpsMedio, pior: r.fpsPior1, ms: janela[(iJanela + janela.length - 1) % janela.length].toFixed(1), ticks: mundo.ticks })); }
    linhas.push(t('ui_debug_hora', { hora: f1(mundo.hora), ligado: mundo.cicloLigado ? '▶' : '⏸' }));
    const h = mundo.heroi;
    if (estadoUi.estados) {
      linhas.push(t('ui_debug_posicao', { x: f1(h.x), z: f1(h.z), vel: f1(h.velocidade()) }));
      linhas.push(t('ui_debug_estado_heroi', { estado: h.estado, direcao: h.spriteDir().dir + (h.spriteDir().espelhar ? '*' : '') }));
      linhas.push(t('ui_debug_acao', { acao: h.acao ? (h.acao.def.id ?? h.acao.tipo) : '-', quadro: h.acao ? h.acao.t : 0, combo: h.combo }));
      for (const e of mundo.entidades) linhas.push(t('ui_debug_estado_entidade', { id: e.id, estado: e.estado, quadro: e.quadroEstado }));
      linhas.push(t('ui_debug_contador', { acertos: mundo.entidades[0]?.contadores.acertos ?? 0 }));
      if (extra.cursor) linhas.push(t('ui_debug_cursor', { x: f1(extra.cursor.x), z: f1(extra.cursor.z), alvo: extra.cursor.alvo ?? '-' }));
      if (extra.audio) linhas.push(extra.audio);
    }
    if (estadoUi.entrada) linhas.push(t('ui_debug_entrada', { x: f1(extra.mover.x), z: f1(extra.mover.z), segurando: [...entrada.segurando].join(',') || '-', buffer: entrada.buffer.conteudo(mundo.ticks).join(',') || '-' }));
    if (performance.now() < foraAte) linhas.push(t('ui_debug_gamepad_fora'));
    el.textContent = linhas.join('\n');
  }
  return {
    estado: estadoUi, registrarQuadro, tratar, atualizarTexto, exportar, resumoJanela, resumoGravacao,
    get pausado() { return estadoUi.pausado; }, fatorTempo: () => (estadoUi.lento ? cfg.debug.lento_fator : 1),
    consumirPasso() { const p = estadoUi.passoPendente; estadoUi.passoPendente = false; return p; }, avisarGamepadFora() { foraAte = performance.now() + 4000; },
  };
}
