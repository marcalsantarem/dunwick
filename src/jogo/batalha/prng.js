// PRNG com semente (mulberry32): a única fonte de sorteio da batalha (IA, fuga, drops). Mesma semente, mesma batalha.
export function criarPrng(semente) {
  let a = (semente >>> 0) || 1;
  return {
    semente,
    /** número em [0, 1) */
    proximo() {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    /** inteiro em [0, n) */
    inteiro(n) { return Math.floor(this.proximo() * n); },
  };
}
