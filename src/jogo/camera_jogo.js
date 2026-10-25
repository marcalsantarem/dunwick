// Câmera de jogo (lógica pura, sem Three): seguimento com zona morta, antecipação, suavização e limites do mapa (gameplay.md §8.1).
// O ângulo e a área visível vêm de dados; aqui só se calcula ONDE ela olha (centro no chão + altura).
export function criarCameraJogo(cfgCamera, limites) {
  const [lx, lz, lw, lh] = limites;
  const ang = (cfgCamera.angulo_graus * Math.PI) / 180;
  // Área visível no plano da imagem (tiles) → no chão: largura igual, profundidade ÷ sen(ângulo de inclinação).
  const meioX = cfgCamera.area_tiles[0] / 2, meioZ = cfgCamera.area_tiles[1] / 2 / Math.sin(ang);
  const cam = { x: 0, z: 0, y: 0, alvoX: 0, alvoZ: 0, meioX, meioZ, ox: 0, oz: 0, oy: 0 };

  const limitar = (v, min, max, meio) => (min + meio > max - meio ? (min + max) / 2 : Math.min(max - meio, Math.max(min + meio, v)));
  cam.limitarX = (x) => limitar(x, lx, lx + lw, meioX);
  cam.limitarZ = (z) => limitar(z, lz, lz + lh, meioZ);

  /** Encaixa a câmera no herói sem suavização (início/reinício). */
  cam.encaixar = (heroi) => {
    cam.x = cam.alvoX = cam.limitarX(heroi.x); cam.z = cam.alvoZ = cam.limitarZ(heroi.z); cam.y = heroi.altura;
    cam.ox = cam.x; cam.oz = cam.z; cam.oy = cam.y;
  };

  /** Um passo lógico. `velMax` = velocidade de corrida (normaliza a antecipação). */
  cam.passo = (heroi, velMax, dt) => {
    cam.ox = cam.x; cam.oz = cam.z; cam.oy = cam.y;
    const vel = Math.hypot(heroi.vx, heroi.vz), k = vel > 1e-6 ? Math.min(1, vel / velMax) * cfgCamera.antecipacao_tiles / vel : 0;
    let px = heroi.x + heroi.vx * k, pz = heroi.z + heroi.vz * k;
    // zona morta: a câmera só se mexe quando o ponto sai de um círculo em volta do centro atual
    const dx = px - cam.alvoX, dz = pz - cam.alvoZ, d = Math.hypot(dx, dz);
    if (d > cfgCamera.zona_morta_tiles) { px = cam.alvoX + (dx / d) * (d - cfgCamera.zona_morta_tiles); pz = cam.alvoZ + (dz / d) * (d - cfgCamera.zona_morta_tiles); cam.alvoX = px; cam.alvoZ = pz; }
    const a = cfgCamera.suavizacao_s > 0 ? 1 - Math.exp(-dt / cfgCamera.suavizacao_s) : 1;
    cam.x += (cam.limitarX(cam.alvoX) - cam.x) * a;
    cam.z += (cam.limitarZ(cam.alvoZ) - cam.z) * a;
    cam.y += (heroi.altura - cam.y) * a;
  };
  return cam;
}
