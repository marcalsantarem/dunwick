// Geometria do minimapa (pura: sem DOM). D-041: o minimapa GIRA com a tela — cima do minimapa = cima da tela.
// A câmera do mapa fica em (sen g, cos g) do alvo e olha para o lado oposto, então no chão:
//   "cima da tela"    = (−sen g, −cos g)        "direita da tela" = (cos g, −sen g)
// e o ponto (dx, dz) relativo ao centro vai para a tela do minimapa por uma rotação de +g (y para baixo):
//   px = dx·cos g − dz·sen g        py = dx·sen g + dz·cos g
// que é exatamente o `ctx.rotate(g)` do canvas. A seta do herói aponta para face + g (face = atan2(dz, dx) no mundo).

/** Mundo → minimapa (px), com o centro do minimapa em `meio` e `escala` px por tile. */
export function mundoParaMini(x, z, { cx, cz, giroGraus, escala, meio }) {
  const g = (giroGraus * Math.PI) / 180, dx = x - cx, dz = z - cz;
  return { x: meio + (dx * Math.cos(g) - dz * Math.sin(g)) * escala, y: meio + (dx * Math.sin(g) + dz * Math.cos(g)) * escala };
}

/** Minimapa (px) → mundo: inversa (para saber que ponto de interesse está sob o cursor ou o dedo). */
export function miniParaMundo(px, py, { cx, cz, giroGraus, escala, meio }) {
  const g = (giroGraus * Math.PI) / 180, a = (px - meio) / escala, b = (py - meio) / escala;
  return { x: cx + a * Math.cos(g) + b * Math.sin(g), z: cz - a * Math.sin(g) + b * Math.cos(g) };
}

/** Ângulo da seta do herói no minimapa (radianos, 0 = direita, π/2 = baixo). */
export const anguloSeta = (face, giroGraus) => face + (giroGraus * Math.PI) / 180;

/** Ponto de interesse mais próximo de (x, z) dentro de `raio` tiles, ou null. */
export function maisProximo(pontos, x, z, raio) {
  let melhor = null, dMin = raio;
  for (const p of pontos) { const d = Math.hypot(p.x - x, p.z - z); if (d <= dMin) { dMin = d; melhor = p; } }
  return melhor;
}
