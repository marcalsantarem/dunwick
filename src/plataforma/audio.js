// Áudio: contexto criado e desbloqueado SÓ após clique/tecla (política de autoplay do navegador). Canais (mestre, sfx, música),
// pausa com a aba oculta. No M1 só há um SFX de teste (som real é do 05).
export function criarAudio(bytesPing) {
  let ctx = null, ping = null, mestre = null, sfx = null, musica = null, pedidoDeDecodificacao = null, volume = 0.8;

  function criarContexto() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return false;
    ctx = new Ctx({ latencyHint: 'interactive' });
    mestre = ctx.createGain(); sfx = ctx.createGain(); musica = ctx.createGain();
    sfx.connect(mestre); musica.connect(mestre); mestre.connect(ctx.destination); mestre.gain.value = volume;
    pedidoDeDecodificacao = ctx.decodeAudioData(bytesPing.slice(0)).then((b) => { ping = b; }).catch(() => {});
    return true;
  }
  function tocar(buffer, canal = sfx) { if (!ctx || !buffer || ctx.state !== 'running') return; const s = ctx.createBufferSource(); s.buffer = buffer; s.connect(canal); s.start(); }

  return {
    /** Chamar de dentro de um evento de clique/tecla. Resolve true quando o contexto está "running". */
    async desbloquear() {
      if (!ctx && !criarContexto()) return false;
      // iOS/Safari: resume() e um som (mudo) precisam sair SÍNCRONOS de dentro do gesto (touchend/click), antes de qualquer await
      let retomada = null;
      if (ctx.state !== 'running') { try { retomada = ctx.resume(); const b = ctx.createBuffer(1, 1, 22050), s = ctx.createBufferSource(); s.buffer = b; s.connect(ctx.destination); s.start(0); } catch { /* bloqueado: tenta no próximo gesto */ } }
      if (retomada) { try { await retomada; } catch { /* idem */ } }
      if (ctx.state === 'running') { await pedidoDeDecodificacao; tocar(ping); return true; }
      return false;
    },
    /** Volume mestre 0..1 (vale também antes de o contexto existir). */
    definirVolume(v) { volume = Math.min(1, Math.max(0, v)); if (mestre) mestre.gain.value = volume; },
    get volume() { return volume; },
    suspender() { if (ctx && ctx.state === 'running') ctx.suspend(); },
    retomar() { if (ctx && ctx.state === 'suspended') ctx.resume(); },
    tocarSfx: (nome) => { if (nome === 'sfx_teste_ping') tocar(ping); },
    get estado() { return ctx ? ctx.state : 'nao_criado'; },
    canais: () => ({ mestre, sfx, musica }),
  };
}
