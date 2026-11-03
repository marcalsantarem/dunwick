// Codificador GIF89a mínimo (sem dependências) para os clipes de prévia do mapa de mundo (07). Paleta global de até 256 cores, montada pelas cores mais frequentes
// (quantização em 5 bits por canal) de todos os quadros; as demais cores vão para a mais próxima. Loop infinito. `quadros`: [{ w, h, px: RGBA }], `atrasoCs`: centésimos.
function montarPaleta(quadros) {
  const freq = new Map();
  for (const q of quadros) for (let i = 0; i < q.px.length; i += 4 * 3) { const k = ((q.px[i] >> 3) << 10) | ((q.px[i + 1] >> 3) << 5) | (q.px[i + 2] >> 3); freq.set(k, (freq.get(k) ?? 0) + 1); }
  const top = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 256).map(([k]) => [((k >> 10) & 31) * 8 + 4, ((k >> 5) & 31) * 8 + 4, (k & 31) * 8 + 4]);
  while (top.length < 256) top.push([0, 0, 0]);
  return top;
}
function lzw(indices, minimo) {
  const limpar = 1 << minimo, fim = limpar + 1, saida = []; let buf = 0, nb = 0, tam = minimo + 1, prox = fim + 1, dic = new Map();
  const emitir = (c) => { buf |= c << nb; nb += tam; while (nb >= 8) { saida.push(buf & 255); buf >>= 8; nb -= 8; } };
  emitir(limpar); let p = indices[0];
  for (let i = 1; i < indices.length; i++) {
    const c = indices[i], k = (p << 8) | c, v = dic.get(k);
    if (v !== undefined) { p = v; continue; }
    emitir(p); if (prox < 4096) { dic.set(k, prox++); if (prox - 1 === (1 << tam) && tam < 12) tam++; } else { emitir(limpar); dic = new Map(); prox = fim + 1; tam = minimo + 1; }
    p = c;
  }
  emitir(p); emitir(fim); if (nb > 0) saida.push(buf & 255); return saida;
}
export function codificarGif(quadros, atrasoCs = 8) {
  const { w, h } = quadros[0], pal = montarPaleta(quadros), cache = new Map(), out = [];
  const mais = (r, g, b) => { const k = (r << 16) | (g << 8) | b; let v = cache.get(k); if (v !== undefined) return v; let m = 1e9; v = 0; for (let i = 0; i < 256; i++) { const d = (pal[i][0] - r) ** 2 + (pal[i][1] - g) ** 2 + (pal[i][2] - b) ** 2; if (d < m) { m = d; v = i; } } cache.set(k, v); return v; };
  const u16 = (n) => [n & 255, (n >> 8) & 255];
  out.push(...Buffer.from('GIF89a'), ...u16(w), ...u16(h), 0xf7, 0, 0); for (const c of pal) out.push(...c);
  out.push(0x21, 0xff, 0x0b, ...Buffer.from('NETSCAPE2.0'), 3, 1, 0, 0, 0);
  for (const q of quadros) {
    out.push(0x21, 0xf9, 4, 0, ...u16(atrasoCs), 0, 0, 0x2c, 0, 0, 0, 0, ...u16(w), ...u16(h), 0, 8);
    const idx = new Uint8Array(w * h); for (let i = 0; i < w * h; i++) idx[i] = mais(q.px[i * 4], q.px[i * 4 + 1], q.px[i * 4 + 2]);
    const dados = lzw(idx, 8); for (let i = 0; i < dados.length; i += 255) { const bloco = dados.slice(i, i + 255); out.push(bloco.length, ...bloco); } out.push(0);
  }
  out.push(0x3b); return Buffer.from(out);
}
