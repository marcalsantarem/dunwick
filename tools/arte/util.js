// Utilitários do gerador de arte (roda no Chrome headless, ver tools/gerar_arte.mjs): aleatório com semente, ruído tileável, cores.
export function rng(semente) { let s = semente >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;

export function hex(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
export function rgb(r, g, b) { return '#' + ((1 << 24) | (clamp(r | 0, 0, 255) << 16) | (clamp(g | 0, 0, 255) << 8) | clamp(b | 0, 0, 255)).toString(16).slice(1); }
/** Clareia (amt > 0) ou escurece (amt < 0) uma cor hex. */
export function sombra(h, amt) { const [r, g, b] = hex(h); return amt >= 0 ? rgb(r + (255 - r) * amt, g + (255 - g) * amt, b + (255 - b) * amt) : rgb(r * (1 + amt), g * (1 + amt), b * (1 + amt)); }
export function misturar(a, b, t) { const A = hex(a), B = hex(b); return rgb(lerp(A[0], B[0], t), lerp(A[1], B[1], t), lerp(A[2], B[2], t)); }
export function rgba(h, a) { const [r, g, b] = hex(h); return `rgba(${r},${g},${b},${a})`; }

/** Ruído de valor TILEÁVEL (período `per` em células): mesma saída nas bordas opostas. */
export function criarRuido(semente, per = 16) {
  const r = rng(semente), g = new Float32Array(per * per); for (let i = 0; i < g.length; i++) g[i] = r();
  const suave = (t) => t * t * (3 - 2 * t);
  const v = (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), fx = suave(x - xi), fy = suave(y - yi);
    const a = (i, j) => g[(((j % per) + per) % per) * per + (((i % per) + per) % per)];
    return lerp(lerp(a(xi, yi), a(xi + 1, yi), fx), lerp(a(xi, yi + 1), a(xi + 1, yi + 1), fx), fy);
  };
  /** fBm tileável em [0,1]: (u, v) em [0,1) cobrindo exatamente `per`×escala células. */
  return (u, w, oitavas = 4) => { let s = 0, a = 0.5, n = 0, f = 1; for (let o = 0; o < oitavas; o++) { s += a * v(u * per * f, w * per * f); n += a; a *= 0.5; f *= 2; } return s / n; };
}

export function tela(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
