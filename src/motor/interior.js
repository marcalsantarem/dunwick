// Interiores (v0.1.2): um cômodo por mapa `tipo_mapa: "interior"`. As paredes de TRÁS (norte e oeste, as que a câmera isométrica vê por dentro)
// são inteiras; as da FRENTE (sul e leste) não existem — só um rodapé baixo — para nunca tapar o herói (o "corte" das paredes da frente).
// A luz é própria do interior (`ambiente` no dado do mapa), sem ciclo dia/noite, sem névoa.
import * as THREE from 'three';
import { criarColetor } from './kit.js';

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);

/** Malhas das paredes (material do kit por `sala.parede`) — fundidas por material. */
export function paredesInterior(m, materiais, texelsPorTile = 64) {
  const [L, A] = m.tamanho, s = m.sala, esp = 0.3, h = s.altura_parede, col = criarColetor(texelsPorTile);
  col.caixa(s.parede, L / 2, h / 2, -esp / 2, L + esp, h, esp); // norte (atrás)
  col.caixa(s.parede, -esp / 2, h / 2, A / 2, esp, h, A); // oeste (atrás)
  col.caixa('pedra', L / 2, 0.15, A + 0.1, L + 0.2, 0.3, 0.2); // rodapé sul (frente)
  col.caixa('pedra', L + 0.1, 0.15, A / 2, 0.2, 0.3, A); // rodapé leste (frente)
  return [...col.fundir()].map(([k, geo]) => { const me = new THREE.Mesh(geo, materiais[k]); me.castShadow = true; me.receiveShadow = true; me.name = `sala_${k}`; return me; });
}

/** Estado de luz do interior no mesmo formato de `estadoCiclo` (cena.js lê os mesmos campos). */
export function ambienteInterior(amb) {
  const cor = hex(amb.cor_luz), k = amb.intensidade, fundo = hex(amb.fundo).map((c) => c ** 2.2); // fundo sRGB → linear (escuro de verdade)
  return { tom: [1, 0.98, 0.94], luzArtificial: 1, solCor: [0, 0, 0], solInt: 0, solElev: 60, hemiCeu: cor.map((c) => c * k), hemiChao: cor.map((c) => c * k * 0.55), hemiInt: 1, fundo, nevoa: fundo };
}
