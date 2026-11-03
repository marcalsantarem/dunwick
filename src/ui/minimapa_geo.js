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

// tipos de objeto que viram linha de muro/cerca no minimapa (segmentos x0,z0 → x1,z1 no mapa)
const MUROS = ['muralha_baixa', 'estacada', 'muro_fuligem', 'cerca'];
/** Pura: o que o minimapa precisa de um mapa (dados de data/maps), montado uma vez por mapa. `interativos(md)` = objetos com que se
 * interage (boneco, baú) + pois, do 13. Quando a plataforma tiver `mapaAtivo()` (08), ele pode substituir isto. */
export function fonteDoMapa(md, giroGraus, interativos = (m) => m.pois ?? []) {
  const muros = (md.objetos ?? []).filter((o) => MUROS.includes(o.tipo) && Number.isFinite(o.x0)).map((o) => ({ tipo: o.tipo, x0: o.x0, z0: o.z0, x1: o.x1, z1: o.z1 }));
  return Object.freeze({
    id: md.id, nome_txt: md.nome_txt, tamanho: md.tamanho, planta: md.planta, legenda: md.legenda, interior: md.tipo_mapa === 'interior', giro_graus: giroGraus,
    edificios: (md.edificios ?? []).map((e) => ({ x: e.x, z: e.z, w: e.w, d: e.d, rot: e.rot ?? 0, porta: e.porta ?? null })),
    portais: (md.portais ?? []).map((p) => ({ id: p.id, x: p.x, z: p.z, w: p.w, d: p.d, interditado: p.ativo === false, nome_txt: p.nome_txt ?? null })),
    pois: interativos(md).filter((p) => p.nome_txt && Number.isFinite(p.x)).map((p) => ({ id: p.id, tipo: p.tipo, x: p.x, z: p.z, nome_txt: p.nome_txt })),
    muros,
  });
}
