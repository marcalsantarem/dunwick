// Tela cheia (Fullscreen API com prefixo webkit) + trava de paisagem quando existir. iPhone/Safari não tem Fullscreen para páginas:
// `suportada` = false e a UI deve esconder o botão. Só funciona dentro de um gesto do usuário (clique/toque).
export function criarTelaCheia(raiz = document.documentElement) {
  const doc = document, pedir = raiz.requestFullscreen ?? raiz.webkitRequestFullscreen, sair = doc.exitFullscreen ?? doc.webkitExitFullscreen;
  const ouvintes = new Set(), elemento = () => doc.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
  const avisar = () => { for (const f of [...ouvintes]) f(!!elemento()); };
  doc.addEventListener('fullscreenchange', avisar); doc.addEventListener('webkitfullscreenchange', avisar);
  const api = {
    get suportada() { return typeof pedir === 'function'; },
    ativa: () => !!elemento(),
    async entrar() {
      if (!api.suportada || elemento()) return !!elemento();
      try { await pedir.call(raiz, { navigationUI: 'hide' }); } catch { return false; }
      try { await screen.orientation?.lock?.('landscape'); } catch { /* sem trava (iOS, desktop): segue */ }
      return true;
    },
    async sair() { if (!elemento() || typeof sair !== 'function') return; try { screen.orientation?.unlock?.(); await sair.call(doc); } catch { /* idem */ } },
    /** Liga/desliga; devolve o estado depois (true = em tela cheia). */
    async alternar() { if (elemento()) await api.sair(); else await api.entrar(); return !!elemento(); },
    aoMudar(fn) { ouvintes.add(fn); return () => ouvintes.delete(fn); },
  };
  return api;
}
