// Modo celular/tablet de toque (só nele; o PC fica exatamente como está). Detecção: ponteiro grosso + sem hover + tela pequena
// (?mobile=1 / ?mobile=0 forçam, para testes). Faz: área útil = visualViewport menos safe-area, canvas encaixado nela (o renderizador
// escolhe o maior retângulo 16:9 dentro), sem rolagem/zoom/pull-to-refresh, tela cheia + trava de paisagem no 1º toque (onde existir)
// e, em RETRATO, uma tela "Gire o celular" que pausa o jogo. Escolha de projeto: NÃO girar a apresentação por CSS no retrato —
// exigiria remapear toda coordenada de toque (canvas, menu, placas) e é frágil em Safari/iOS; o aviso é à prova de erro e some ao girar.
export function detectarMovel(P) {
  const f = P.get('mobile'); if (f === '1') return true; if (f === '0') return false;
  const m = (q) => typeof matchMedia === 'function' && matchMedia(q).matches;
  return m('(pointer: coarse)') && m('(hover: none)') && Math.min(screen.width, screen.height) <= 1100;
}

export function criarMovel({ P, canvas, t, aoMudar }) {
  const ativo = detectarMovel(P), vv = () => window.visualViewport;
  const est = { ativo, retrato: false, dprMax: ativo ? 2 : Infinity };
  if (!ativo) { est.area = () => ({ x: 0, y: 0, w: innerWidth, h: innerHeight }); return est; }
  const raiz = document.documentElement; raiz.classList.add('movel');
  // sonda de safe-area (env() só existe em CSS): lê os paddings calculados
  const seguro = document.createElement('div'); seguro.id = 'seguro'; document.body.append(seguro);
  const gire = document.createElement('div'); gire.id = 'gire'; gire.setAttribute('role', 'alert'); gire.textContent = t('ui_gire_celular'); document.body.append(gire);
  est.area = () => {
    const v = vv(), W = v?.width ?? innerWidth, H = v?.height ?? innerHeight, cs = getComputedStyle(seguro), n = (k) => parseFloat(cs[k]) || 0;
    const e = n('paddingLeft'), d = n('paddingRight'), c = n('paddingTop'), b = n('paddingBottom');
    return { x: (v?.offsetLeft ?? 0) + e, y: (v?.offsetTop ?? 0) + c, w: Math.max(64, W - e - d), h: Math.max(64, H - c - b) };
  };
  function layout() {
    const a = est.area(), s = canvas.style; s.left = `${a.x}px`; s.top = `${a.y}px`; s.width = `${a.w}px`; s.height = `${a.h}px`;
    est.retrato = a.h > a.w; raiz.classList.toggle('retrato', est.retrato); aoMudar();
  }
  addEventListener('resize', layout); addEventListener('orientationchange', () => setTimeout(layout, 120)); vv()?.addEventListener('resize', layout);
  // sem zoom por pinça/duplo toque, sem pull-to-refresh (iOS ignora user-scalable=no)
  for (const g of ['gesturestart', 'gesturechange', 'gestureend']) document.addEventListener(g, (e) => e.preventDefault());
  document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
  document.addEventListener('contextmenu', (e) => e.preventDefault());
  // 1º toque (gesto do usuário): tela cheia + trava de paisagem onde o navegador deixa (Chrome/Android); Safari/iOS ignora
  let tentou = false;
  est.aoGesto = () => {
    if (tentou) return; tentou = true;
    try { const r = raiz.requestFullscreen?.({ navigationUI: 'hide' }); Promise.resolve(r).then(() => screen.orientation?.lock?.('landscape')).catch(() => {}); } catch { /* sem tela cheia: segue */ }
  };
  layout();
  return est;
}
