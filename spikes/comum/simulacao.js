// Simulação de multidão no plano de chão (x, z), sem conhecer o motor.
// Arrays tipados pré-alocados: nada criado por passo.
export function criarSimulacao({ inimigos = 40, projeteis = 150, raioArena = 9, semente = 7 }) {
  let s = semente;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  const E = {
    n: inimigos, x: new Float32Array(inimigos), z: new Float32Array(inimigos), vx: new Float32Array(inimigos), vz: new Float32Array(inimigos),
    dir: new Uint8Array(inimigos), recarga: new Int16Array(inimigos), quadro: new Float32Array(inimigos),
  };
  const P = { n: projeteis, x: new Float32Array(projeteis), z: new Float32Array(projeteis), y: new Float32Array(projeteis), vx: new Float32Array(projeteis), vz: new Float32Array(projeteis), vida: new Int16Array(projeteis) };
  for (let i = 0; i < inimigos; i++) {
    const a = rnd() * Math.PI * 2, r = 3 + rnd() * (raioArena - 3);
    E.x[i] = Math.cos(a) * r; E.z[i] = Math.sin(a) * r; E.recarga[i] = (rnd() * 120) | 0; E.quadro[i] = rnd() * 8;
  }
  const heroi = { x: 0, z: 0, t: 0, acertos: 0 };
  let proximo = 0;
  function passo(dt) {
    heroi.t += dt;
    heroi.x = Math.cos(heroi.t * 0.5) * 2.5; heroi.z = Math.sin(heroi.t * 0.5) * 2.5;
    for (let i = 0; i < E.n; i++) {
      let dx = heroi.x - E.x[i], dz = heroi.z - E.z[i];
      const d = Math.hypot(dx, dz) || 1;
      let ax = (dx / d) * (d > 2 ? 1 : -1), az = (dz / d) * (d > 2 ? 1 : -1);
      for (let j = 0; j < E.n; j++) { // separação O(n²): 1600 pares, barato
        if (j === i) continue;
        const ex = E.x[i] - E.x[j], ez = E.z[i] - E.z[j], d2 = ex * ex + ez * ez;
        if (d2 < 0.81 && d2 > 1e-6) { ax += ex / d2 * 0.3; az += ez / d2 * 0.3; }
      }
      E.vx[i] += (ax * 1.5 - E.vx[i]) * 0.1; E.vz[i] += (az * 1.5 - E.vz[i]) * 0.1;
      E.x[i] += E.vx[i] * dt; E.z[i] += E.vz[i] * dt;
      E.dir[i] = Math.abs(E.vx[i]) > Math.abs(E.vz[i]) ? (E.vx[i] > 0 ? 2 : 3) : (E.vz[i] > 0 ? 0 : 1); // s,n,l,o
      E.quadro[i] = (E.quadro[i] + dt * 10) % 8;
      if (--E.recarga[i] <= 0) {
        E.recarga[i] = 24 + ((rnd() * 16) | 0); // ~1,4 disparos/passo -> pool de 150 sempre cheio
        const k = proximo; proximo = (proximo + 1) % P.n;
        P.x[k] = E.x[i]; P.z[k] = E.z[i]; P.y[k] = 0.8; P.vx[k] = (dx / d) * 5; P.vz[k] = (dz / d) * 5; P.vida[k] = 120;
      }
    }
    for (let k = 0; k < P.n; k++) {
      if (P.vida[k] <= 0) continue;
      P.vida[k]--; P.x[k] += P.vx[k] * dt; P.z[k] += P.vz[k] * dt;
      const hx = P.x[k] - heroi.x, hz = P.z[k] - heroi.z;
      if (hx * hx + hz * hz < 0.09) { P.vida[k] = 0; heroi.acertos++; }
    }
  }
  return { E, P, heroi, passo };
}
