// Tela de início ("Clique/Toque para começar"): o gesto do jogador destrava o áudio, pede tela cheia + paisagem (onde existir) e só então a
// simulação começa. Aqui está a LÓGICA e um markup mínimo (#inicio); o visual final é da UI (15), que pode estilizar as classes .inicio-*
// ou montar a própria tela e chamar `plataforma.inicio.comecar()` dentro de um gesto.
export function criarInicio({ t, versao, movel, aoComecar, pai = document.body }) {
  const raiz = document.createElement('div'); raiz.id = 'inicio'; raiz.className = 'inicio'; raiz.setAttribute('role', 'button'); raiz.tabIndex = 0;
  const el = (tag, cls, txt) => { const e = document.createElement(tag); e.className = cls; if (txt) e.textContent = txt; raiz.append(e); return e; };
  el('h1', 'inicio-titulo', t('ui_inicio_titulo')); el('p', 'inicio-chamada', t(movel ? 'ui_inicio_toque' : 'ui_inicio_clique')); el('small', 'inicio-versao', t('ui_versao', { versao }));
  pai.append(raiz);
  let feito = false;
  const api = {
    elemento: raiz,
    get pendente() { return !feito; },
    /** Chamar DENTRO de um gesto (clique, toque, tecla). Uma vez só. */
    comecar() { if (feito) return false; feito = true; raiz.remove(); aoComecar(); return true; },
  };
  raiz.addEventListener('click', () => api.comecar());
  raiz.addEventListener('touchend', (e) => { e.preventDefault(); api.comecar(); }, { passive: false }); // preventDefault: sem clique duplicado depois
  addEventListener('keydown', (e) => { if (!feito && !e.ctrlKey && !e.metaKey && !e.altKey && !['F5', 'F11', 'F12'].includes(e.code)) { e.preventDefault(); api.comecar(); } }, { capture: true });
  return api;
}

/** Pausa por motivos (início, menu de pausa da UI...): enquanto houver algum, a simulação e o áudio param; o acumulador não guarda o tempo parado. */
export function criarPausa({ audio }) {
  const motivos = new Set();
  return {
    pausar(motivo = 'ui') { if (!motivos.size) audio.suspender(); motivos.add(motivo); },
    retomar(motivo = 'ui') { motivos.delete(motivo); if (!motivos.size) audio.retomar(); },
    get pausado() { return motivos.size > 0; },
    motivos: () => [...motivos],
  };
}
