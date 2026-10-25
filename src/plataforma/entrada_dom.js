// Ponte navegador → entrada lógica: teclado e mouse por eventos (fila), cursor por movimento do ponteiro, gamepad por amostragem a cada quadro.
// Não captura atalhos do navegador: com Ctrl/Meta/Alt a tecla passa direto; F5/F11 não existem no mapeamento. Botão direito é do jogo SÓ sobre o canvas.
export function ligarEntradaDom({ entrada, canvas, eventos, aoGesto }) {
  const usaModificador = (e) => e.ctrlKey || e.metaKey || e.altKey;
  const ponteiro = { x: 0, y: 0, dentro: false };
  addEventListener('keydown', (e) => { aoGesto(); if (e.repeat || usaModificador(e)) return; if (entrada.teclaAbaixo(e.code)) e.preventDefault(); }, { capture: true });
  addEventListener('keyup', (e) => { entrada.teclaAcima(e.code); });
  canvas.addEventListener('mousedown', (e) => { aoGesto(); ponteiro.x = e.clientX; ponteiro.y = e.clientY; ponteiro.dentro = true; if (entrada.teclaAbaixo(`mouse:${e.button}`)) e.preventDefault(); });
  addEventListener('mouseup', (e) => entrada.teclaAcima(`mouse:${e.button}`));
  addEventListener('mousemove', (e) => { ponteiro.x = e.clientX; ponteiro.y = e.clientY; ponteiro.dentro = e.target === canvas; });
  canvas.addEventListener('mouseleave', () => { ponteiro.dentro = false; });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  canvas.addEventListener('wheel', (e) => e.preventDefault(), { passive: false }); // a câmera é fixa: a roda não rola a página sobre o jogo
  canvas.addEventListener('dragstart', (e) => e.preventDefault());
  addEventListener('pointerdown', aoGesto, { capture: true });
  addEventListener('blur', () => entrada.soltarTudo());
  addEventListener('gamepaddisconnected', () => { entrada.atualizarGamepad(null); eventos.emitir('gamepad_desconectado', {}); });
  addEventListener('gamepadconnected', () => eventos.emitir('gamepad_conectado', {}));
  function amostrarGamepad() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : []; let pad = null; for (const p of pads) if (p && p.connected) { pad = p; break; }
    if (!pad) { if (entrada.gamepadConectado) { entrada.atualizarGamepad(null); eventos.emitir('gamepad_desconectado', {}); } return; }
    entrada.atualizarGamepad({ botoes: pad.buttons.map((b) => b.pressed), eixos: Array.from(pad.axes) });
  }
  return { amostrarGamepad, ponteiro };
}
