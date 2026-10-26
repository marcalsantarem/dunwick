// Áudio: contexto criado e desbloqueado SÓ após clique/tecla (política de autoplay do navegador). Canais (mestre, sfx, música),
// pausa com a aba oculta. No M1 só há um SFX de teste (som real é do 05).
export function criarAudio(bytesPing) {
  let ctx = null, ping = null, mestre = null, sfx = null, musica = null, pedidoDeDecodificacao = null;

  function criarContexto() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return false;
    ctx = new Ctx({ latencyHint: 'interactive' });
    mestre = ctx.createGain(); sfx = ctx.createGain(); musica = ctx.createGain();
    sfx.connect(mestre); musica.connect(mestre); mestre.connect(ctx.destination);
    pedidoDeDecodificacao = ctx.decodeAudioData(bytesPing.slice(0)).then((b) => { ping = b; }).catch(() => {});
    return true;
  }
  function tocar(buffer, canal = sfx) { if (!ctx || !buffer || ctx.state !== 'running') return; const s = ctx.createBufferSource(); s.buffer = buffer; s.connect(canal); s.start(); }

  return {
    /** Chamar de dentro de um evento de clique/tecla. Resolve true quando o contexto está "running". */
    async desbloquear() {
      if (!ctx && !criarContexto()) return false;
      if (ctx.state !== 'running') { try { await ctx.resume(); } catch { /* bloqueado: tenta no próximo gesto */ } }
      if (ctx.state === 'running') { await pedidoDeDecodificacao; tocar(ping); return true; }
      return false;
    },
    suspender() { if (ctx && ctx.state === 'running') ctx.suspend(); },
    retomar() { if (ctx && ctx.state === 'suspended') ctx.resume(); },
    tocarSfx: (nome) => { if (nome === 'sfx_teste_ping') tocar(ping); },
    get estado() { return ctx ? ctx.state : 'nao_criado'; },
    canais: () => ({ mestre, sfx, musica }),
  };
}
