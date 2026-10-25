// Ponte navegador → entrada lógica: teclado e mouse por eventos (fila), gamepad por amostragem a cada quadro desenhado.
// Não captura atalhos do navegador: com Ctrl/Meta/Alt a tecla passa direto; F5/F11 não existem no mapeamento (M1-07).
export function ligarEntradaDom({ entrada, canvas, eventos, aoGesto }) {
  const usaModificador = (e) => e.ctrlKey || e.metaKey || e.altKey;
  addEventListener('keydown', (e) => {
    aoGesto();
    if (e.repeat || usaModificador(e)) return;
    if (entrada.teclaAbaixo(e.code)) e.preventDefault();
  }, { capture: true });
  addEventListener('keyup', (e) => { entrada.teclaAcima(e.code); });
  canvas.addEventListener('mousedown', (e) => { aoGesto(); if (entrada.teclaAbaixo(`mouse:${e.button}`)) e.preventDefault(); });
  addEventListener('mouseup', (e) => entrada.teclaAcima(`mouse:${e.button}`));
  canvas.addEventListener('contextmenu', (e) => e.preventDefault()); // clique direito = ataque forte, só sobre o jogo
  addEventListener('pointerdown', aoGesto, { capture: true });
  addEventListener('blur', () => entrada.soltarTudo());
  addEventListener('gamepaddisconnected', () => { entrada.atualizarGamepad(null); eventos.emitir('gamepad_desconectado', {}); });
  addEventListener('gamepadconnected', () => eventos.emitir('gamepad_conectado', {}));

  /** Uma amostra do primeiro gamepad ativo, por quadro desenhado (a API não tem eventos de botão). */
  function amostrarGamepad() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    let pad = null; for (const p of pads) if (p && p.connected) { pad = p; break; }
    if (!pad) { if (entrada.gamepadConectado) { entrada.atualizarGamepad(null); eventos.emitir('gamepad_desconectado', {}); } return; }
    entrada.atualizarGamepad({ botoes: pad.buttons.map((b) => b.pressed), eixos: Array.from(pad.axes) });
  }
  return { amostrarGamepad };
}
