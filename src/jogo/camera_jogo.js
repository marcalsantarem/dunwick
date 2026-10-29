// Câmera de jogo isométrica (lógica pura, sem Three): onde ela olha. Seguimento com zona morta, antecipação, suavização e limites do
// mapa. A projeção (giro 45°, inclinação 30°) é montada no motor; aqui só há o ponto de foco no chão (x, z).
export function criarCameraJogo(cfgCamera, limites) {
  let [lx, lz, lw, lh] = limites; const cam = { x: 0, z: 0, alvoX: 0, alvoZ: 0, ox: 0, oz: 0 };
  const lim = (v, min, max) => (min > max ? (min + max) / 2 : Math.min(max, Math.max(min, v)));
  cam.limitarX = (x) => lim(x, lx, lx + lw); cam.limitarZ = (z) => lim(z, lz, lz + lh);
  /** Troca de mapa: novos limites (depois chame encaixar). */
  cam.definirLimites = (l) => { [lx, lz, lw, lh] = l; };
  /** Encaixa a câmera no herói sem suavização (início/reinício). */
  cam.encaixar = (heroi) => { cam.x = cam.alvoX = cam.limitarX(heroi.x); cam.z = cam.alvoZ = cam.limitarZ(heroi.z); cam.ox = cam.x; cam.oz = cam.z; };
  /** Um passo lógico. `velMax` normaliza a antecipação (olha para onde o herói vai). */
  cam.passo = (heroi, velMax, dt) => {
    cam.ox = cam.x; cam.oz = cam.z;
    const vel = Math.hypot(heroi.vx, heroi.vz), k = vel > 1e-6 ? (Math.min(1, vel / velMax) * cfgCamera.antecipacao_tiles) / vel : 0;
    let px = heroi.x + heroi.vx * k, pz = heroi.z + heroi.vz * k;
    const dx = px - cam.alvoX, dz = pz - cam.alvoZ, d = Math.hypot(dx, dz);
    if (d > cfgCamera.zona_morta_tiles) { px = cam.alvoX + (dx / d) * (d - cfgCamera.zona_morta_tiles); pz = cam.alvoZ + (dz / d) * (d - cfgCamera.zona_morta_tiles); cam.alvoX = px; cam.alvoZ = pz; }
    const a = cfgCamera.suavizacao_s > 0 ? 1 - Math.exp(-dt / cfgCamera.suavizacao_s) : 1;
    cam.x += (cam.limitarX(cam.alvoX) - cam.x) * a; cam.z += (cam.limitarZ(cam.alvoZ) - cam.z) * a;
  };
  return cam;
}
