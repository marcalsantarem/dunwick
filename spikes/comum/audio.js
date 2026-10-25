// Spike 5 (áudio): desbloqueio por gesto, emenda de loop por formato, troca de camada.
// Web Audio puro: os motores avaliados só embrulham esta mesma API.
const BASE = '../assets/audio/';
const AMOSTRAS_LOOP = 96000; // loop_teste: 2 s a 48 kHz

export function criarAudio() {
  const ctx = new AudioContext({ latencyHint: 'interactive', sampleRate: 48000 });
  const r = { estadoInicial: ctx.state, desbloqueioMs: null, formatos: {}, camadas: null, pausaAba: null };
  const t0 = performance.now();
  const desbloquear = async () => {
    if (ctx.state === 'running') return;
    const ini = performance.now();
    await ctx.resume();
    r.desbloqueioMs = +(performance.now() - ini).toFixed(1);
    r.estadoAposGesto = ctx.state;
  };
  addEventListener('pointerdown', desbloquear); addEventListener('keydown', desbloquear);
  document.addEventListener('visibilitychange', () => { document.hidden ? ctx.suspend() : ctx.resume(); });

  async function carregar(nome) {
    const ini = performance.now();
    const resp = await fetch(BASE + nome);
    const bytes = await resp.arrayBuffer();
    const tamanho = bytes.byteLength; // decodeAudioData esvazia o buffer
    const buf = await ctx.decodeAudioData(bytes);
    return { buf, bytes: tamanho, decodMs: performance.now() - ini };
  }

  // Emenda: renderiza o loop offline por 2 voltas e mede o salto na emenda vs. o maior passo normal.
  async function testarEmenda(buf) {
    const off = new OfflineAudioContext(1, buf.length * 2 + 10, buf.sampleRate);
    const src = off.createBufferSource(); src.buffer = buf; src.loop = true; src.connect(off.destination); src.start();
    const out = (await off.startRendering()).getChannelData(0);
    let passoMax = 0;
    for (let i = 1000; i < buf.length - 1000; i++) passoMax = Math.max(passoMax, Math.abs(out[i] - out[i - 1]));
    let salto = 0;
    for (let i = buf.length - 4; i < buf.length + 4; i++) salto = Math.max(salto, Math.abs(out[i] - out[i - 1]));
    return { amostras: buf.length, diferencaAmostras: buf.length - AMOSTRAS_LOOP, saltoNaEmenda: +salto.toFixed(4), passoNormalMax: +passoMax.toFixed(4), semEmenda: salto <= passoMax * 1.05 };
  }

  async function rodarTestes() {
    for (const ext of ['wav', 'ogg', 'webm', 'mp3', 'm4a']) {
      try {
        const { buf, bytes } = await carregar(`teste/loop_teste.${ext}`);
        r.formatos[ext] = { bytes, ...(await testarEmenda(buf)) };
        // Correção por metadados: recortar para o comprimento original conhecido (loopEnd).
        if (buf.length !== AMOSTRAS_LOOP) {
          const cortado = ctx.createBuffer(1, AMOSTRAS_LOOP, buf.sampleRate);
          const atraso = buf.length - AMOSTRAS_LOOP; // supõe preenchimento no início ou no fim: testa os dois
          const ini = buf.getChannelData(0);
          const fim = Math.max(0, atraso);
          cortado.copyToChannel(ini.subarray(fim, fim + AMOSTRAS_LOOP), 0);
          const a = await testarEmenda(cortado);
          cortado.copyToChannel(ini.subarray(0, AMOSTRAS_LOOP), 0);
          const b = await testarEmenda(cortado);
          r.formatos[ext].comLoopPorMetadado = a.semEmenda || b.semEmenda;
        }
      } catch (e) { r.formatos[ext] = { erro: String(e) }; }
    }
    // Camadas: A e B começam na mesma amostra; troca com rampa de 1 s; mede salto no meio da troca.
    const [a, b] = await Promise.all([carregar('mus_placeholder_camada_a.ogg'), carregar('mus_placeholder_camada_b.ogg')]);
    const off = new OfflineAudioContext(1, 48000 * 4, 48000);
    const ga = off.createGain(), gb = off.createGain();
    gb.gain.value = 0;
    for (const [src, g, x] of [[off.createBufferSource(), ga, a], [off.createBufferSource(), gb, b]]) {
      src.buffer = x.buf; src.connect(g).connect(off.destination); src.start(0);
    }
    ga.gain.setValueAtTime(1, 1.5); ga.gain.linearRampToValueAtTime(0, 2.5);
    gb.gain.setValueAtTime(0, 1.5); gb.gain.linearRampToValueAtTime(1, 2.5);
    const out = (await off.startRendering()).getChannelData(0);
    let passoMax = 0;
    for (let i = 48000; i < 48000 * 3.5; i++) passoMax = Math.max(passoMax, Math.abs(out[i] - out[i - 1]));
    r.camadas = { bytesA: a.bytes, bytesB: b.bytes, decodMsA: +a.decodMs.toFixed(0), duracaoS: +a.buf.duration.toFixed(3), mesmaDuracao: a.buf.length === b.buf.length, maiorPassoNaTroca: +passoMax.toFixed(4) };
    // Toca de verdade (no contexto real) para validar no ouvido, se desbloqueado.
    if (ctx.state === 'running') {
      const g = ctx.createGain(); g.gain.value = 0.2; g.connect(ctx.destination);
      const src = ctx.createBufferSource(); src.buffer = a.buf; src.loop = true; src.connect(g); src.start();
    }
    r.prontoMs = +(performance.now() - t0).toFixed(0);
    return r;
  }
  return { ctx, r, rodarTestes };
}
