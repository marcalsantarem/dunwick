// Laço de passo fixo 60 Hz + medição. Igual para todas as opções de motor.
// O motor entra com duas funções: simular(dt) e desenhar(alfa).
export const PASSO = 1 / 60;
export const MAX_PASSOS_POR_QUADRO = 5;

export function parametros() {
  const q = new URLSearchParams(location.search);
  return {
    spike: q.get('spike') || 'diorama',
    perfil: q.get('perfil') || 'alto',
    escala: Number(q.get('escala') || 3),
    camera: q.get('camera') || 'orto', // persp (FOV estreito) | orto
    res: q.get('res') || 'nativa', // nativa | baixa (640×360 escalada)
    snap: q.get('snap') !== '0',
    luzes: Number(q.get('luzes') || 4),
    mover: q.get('mover') === '1',
    teste: q.get('teste') || '', // nitidez | ''
    recorte: q.get('recorte') !== '0',
    partIlum: q.get('partilum') === '1',
    w: Number(q.get('w') || 1920),
    h: Number(q.get('h') || 1080),
  };
}

// Perfis de qualidade (BRF-001 / 08 §8). Valores iniciais a confirmar pelos números.
export const PERFIS = {
  alto: { sombraSol: 2048, luzesComSombra: 2, sombraPontual: 512, dof: 'completo', bloom: 1, volumetrica: true, particulas: 150, msaa: 4 },
  medio: { sombraSol: 1024, luzesComSombra: 1, sombraPontual: 256, dof: 'tiltshift', bloom: 0.5, volumetrica: false, particulas: 100, msaa: 0 },
  baixo: { sombraSol: 0, luzesComSombra: 0, sombraPontual: 0, dof: 'nenhum', bloom: 0, volumetrica: false, particulas: 50, msaa: 0 },
};

// Coletor de tempos de quadro, sem alocar por quadro.
export class Medidor {
  constructor(max = 20000) {
    this.tempos = new Float32Array(max); this.cpu = new Float32Array(max);
    this.n = 0; this.ativo = false; this.ticks = 0; this.chamadas = 0; this.triangulos = 0;
  }
  iniciar() { this.n = 0; this.ativo = true; this.t0 = performance.now(); }
  registrar(dt, cpu) {
    if (!this.ativo || this.n >= this.tempos.length) return;
    this.tempos[this.n] = dt; this.cpu[this.n] = cpu; this.n++;
  }
  resultado() {
    const n = this.n, dur = (performance.now() - this.t0) / 1000;
    const ord = Array.from(this.tempos.subarray(0, n)).sort((a, b) => a - b);
    const p99 = ord[Math.min(n - 1, Math.floor(n * 0.99))];
    const pior1 = ord.slice(Math.floor(n * 0.99));
    const mediaPior1 = pior1.reduce((s, v) => s + v, 0) / Math.max(1, pior1.length);
    const cpuOrd = Array.from(this.cpu.subarray(0, n)).sort((a, b) => a - b);
    const mem = performance.memory ? performance.memory.usedJSHeapSize / 1048576 : null;
    return {
      quadros: n, segundos: +dur.toFixed(2), fpsMedio: +(n / dur).toFixed(1),
      fpsPior1: +(1000 / mediaPior1).toFixed(1), // média do 1 % de quadros mais lentos
      p99ms: +p99.toFixed(2), quadrosAcima22ms: ord.filter((v) => v > 22.2).length,
      cpuMedianaMs: +cpuOrd[Math.floor(n / 2)].toFixed(2), cpuP99Ms: +cpuOrd[Math.floor(n * 0.99)].toFixed(2),
      chamadasDesenho: this.chamadas, triangulos: this.triangulos, heapJsMB: mem && +mem.toFixed(1), ticks: this.ticks,
    };
  }
}

// Laço com acumulador. Aba em segundo plano pausa e não simula o tempo perdido.
export function iniciarLaco({ simular, desenhar, aoPausar, aoVoltar }) {
  const medidor = new Medidor();
  let acum = 0, ultimo = performance.now(), pausado = false;
  document.addEventListener('visibilitychange', () => {
    pausado = document.hidden;
    if (pausado) aoPausar?.(); else { ultimo = performance.now(); acum = 0; aoVoltar?.(); }
  });
  function quadro(agora) {
    requestAnimationFrame(quadro);
    if (pausado) return;
    const dt = agora - ultimo; ultimo = agora;
    const ini = performance.now();
    acum += Math.min(dt / 1000, PASSO * MAX_PASSOS_POR_QUADRO);
    let passos = 0;
    while (acum >= PASSO && passos < MAX_PASSOS_POR_QUADRO) { simular(PASSO); acum -= PASSO; passos++; medidor.ticks++; }
    desenhar(acum / PASSO, medidor);
    medidor.registrar(dt, performance.now() - ini);
  }
  requestAnimationFrame(quadro);
  window.__medidor = medidor;
  return medidor;
}

// Nitidez: lê o canvas e mede quantos blocos escala×escala (pixel de arte) são uniformes.
// Procura o deslocamento da grade que maximiza blocos uniformes. Só conta blocos totalmente
// dentro da caixa do sprite e que não sejam só fundo.
export function medirNitidez(canvas, caixa, escala, fundo) {
  const c2 = document.createElement('canvas');
  c2.width = caixa.w; c2.height = caixa.h;
  const g = c2.getContext('2d', { willReadFrequently: true });
  g.drawImage(canvas, caixa.x, caixa.y, caixa.w, caixa.h, 0, 0, caixa.w, caixa.h);
  const d = g.getImageData(0, 0, caixa.w, caixa.h).data;
  const ehFundo = (i) => Math.abs(d[i] - fundo[0]) + Math.abs(d[i + 1] - fundo[1]) + Math.abs(d[i + 2] - fundo[2]) < 6;
  let melhor = { uniformes: 0, total: 1, desvio: 0 };
  for (let oy = 0; oy < escala; oy++) for (let ox = 0; ox < escala; ox++) {
    let uni = 0, tot = 0, somaDesvio = 0;
    for (let by = oy; by + escala <= caixa.h; by += escala) for (let bx = ox; bx + escala <= caixa.w; bx += escala) {
      const i0 = (by * caixa.w + bx) * 4;
      let todosFundo = true, igual = true, minL = 255, maxL = 0;
      for (let y = 0; y < escala; y++) for (let x = 0; x < escala; x++) {
        const i = ((by + y) * caixa.w + bx + x) * 4;
        if (!ehFundo(i)) todosFundo = false;
        if (Math.abs(d[i] - d[i0]) + Math.abs(d[i + 1] - d[i0 + 1]) + Math.abs(d[i + 2] - d[i0 + 2]) > 3) igual = false;
        const l = (d[i] + d[i + 1] + d[i + 2]) / 3; minL = Math.min(minL, l); maxL = Math.max(maxL, l);
      }
      if (todosFundo) continue;
      tot++; if (igual) uni++; somaDesvio += maxL - minL;
    }
    if (tot && uni / tot > melhor.uniformes / melhor.total) melhor = { uniformes: uni, total: tot, desvio: somaDesvio / tot };
  }
  return { blocosUniformesPct: +((100 * melhor.uniformes) / melhor.total).toFixed(1), blocos: melhor.total, variacaoLumDentroDoTexel: +melhor.desvio.toFixed(1) };
}

export function hud(texto) {
  let el = document.getElementById('hud');
  if (!el) { el = document.createElement('pre'); el.id = 'hud'; document.body.appendChild(el); }
  el.textContent = texto; // nunca innerHTML
}
