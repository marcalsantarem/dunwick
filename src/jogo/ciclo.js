// Ciclo dia/noite (matemática pura): interpola os pontos de data/config/cfg_ciclo.json pela hora (0–24, circular).
// Devolve cores como [r,g,b] em 0..1 e números; o motor só aplica. Sem Three, sem DOM.
const hex = (h) => { const n = parseInt(h.slice(1), 16); return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; };
const mix = (a, b, t) => a + (b - a) * t, mix3 = (a, b, t) => [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)];

export function estadoCiclo(ciclo, hora) {
  const p = ciclo.pontos, h = ((hora % 24) + 24) % 24;
  // acha o par (a, b) que envolve h; antes do 1º ponto e depois do último, interpola de forma circular (24 h)
  let a = p[p.length - 1], b = p[0], ha = a.hora - 24, hb = b.hora;
  for (let i = 0; i < p.length; i++) { if (h < p[i].hora) { b = p[i]; hb = b.hora; a = i ? p[i - 1] : p[p.length - 1]; ha = i ? a.hora : a.hora - 24; break; } if (i === p.length - 1) { a = p[i]; ha = a.hora; b = p[0]; hb = b.hora + 24; } }
  const t = hb === ha ? 0 : (h - ha) / (hb - ha), s = t * t * (3 - 2 * t);
  return {
    hora: h, solCor: mix3(hex(a.sol_cor), hex(b.sol_cor), s), solInt: mix(a.sol_int, b.sol_int, s), solElev: mix(a.sol_elev, b.sol_elev, s),
    hemiCeu: mix3(hex(a.hemi_ceu), hex(b.hemi_ceu), s), hemiChao: mix3(hex(a.hemi_chao), hex(b.hemi_chao), s), hemiInt: mix(a.hemi_int, b.hemi_int, s),
    fundo: mix3(hex(a.fundo), hex(b.fundo), s), nevoa: mix3(hex(a.nevoa), hex(b.nevoa), s), tom: mix3(a.tom, b.tom, s), luzArtificial: mix(a.luz_artificial, b.luz_artificial, s),
  };
}

/** Lanterna acesa entre acende_hora e apaga_hora (atravessa a meia-noite). */
export const lanternaAcesa = (kit, hora) => { const { acende_hora: a, apaga_hora: b } = kit.luz_lanterna; return a < b ? hora >= a && hora < b : hora >= a || hora < b; };
