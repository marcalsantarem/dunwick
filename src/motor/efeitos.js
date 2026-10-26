// Partículas do cenário (só apresentação, não afetam a simulação): pólen de dia e vaga-lumes à noite ao redor da câmera, fumaça das
// chaminés. Um único `Points` com shader próprio (círculo suave, tamanho em px, alfa por ponto). Sem alocação por quadro.
import * as THREE from 'three';

const VERT = `attribute float tam; attribute float alfa; attribute vec3 cor; varying float vA; varying vec3 vC; uniform float uEscala;
void main(){ vA = alfa; vC = cor; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = tam * uEscala; }`;
const FRAG = `varying float vA; varying vec3 vC; void main(){ float d = length(gl_PointCoord - 0.5) * 2.0; float a = smoothstep(1.0, 0.2, d) * vA; if (a < 0.01) discard; gl_FragColor = vec4(vC, a); }`;

export function criarParticulas(cena, chamines, perfil) {
  const MAX_POLEN = 200, FUMACA_POR = 7, nFumaca = chamines.length * FUMACA_POR, N = MAX_POLEN + nFumaca;
  const pos = new Float32Array(N * 3), tam = new Float32Array(N), alfa = new Float32Array(N), cor = new Float32Array(N * 3), fase = new Float32Array(N), vel = new Float32Array(N * 3);
  let s = 77; const r = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < MAX_POLEN; i++) { pos[i * 3] = r(); pos[i * 3 + 1] = r(); pos[i * 3 + 2] = r(); fase[i] = r() * 6.28; vel[i * 3] = (r() - 0.5) * 0.4; vel[i * 3 + 1] = (r() - 0.3) * 0.2; vel[i * 3 + 2] = (r() - 0.5) * 0.4; }
  for (let k = 0; k < nFumaca; k++) fase[MAX_POLEN + k] = (k % FUMACA_POR) / FUMACA_POR;
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage)); g.setAttribute('tam', new THREE.BufferAttribute(tam, 1).setUsage(THREE.DynamicDrawUsage)); g.setAttribute('alfa', new THREE.BufferAttribute(alfa, 1).setUsage(THREE.DynamicDrawUsage)); g.setAttribute('cor', new THREE.BufferAttribute(cor, 3).setUsage(THREE.DynamicDrawUsage));
  const mat = new THREE.ShaderMaterial({ uniforms: { uEscala: { value: 1 } }, vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, depthTest: true });
  const pts = new THREE.Points(g, mat); pts.frustumCulled = false; pts.renderOrder = 40; cena.add(pts);
  let maxPolen = perfil.particulas_max; const AREA = 17;
  return {
    definirMax(n) { maxPolen = Math.min(MAX_POLEN, n); },
    /** `escala` = pixels de tela por pixel de arte (tamanho dos pontos acompanha a resolução). */
    atualizar(dt, t, cx, cz, noite, escala = 1) {
      mat.uniforms.uEscala.value = escala;
      for (let i = 0; i < MAX_POLEN; i++) {
        if (i >= maxPolen) { alfa[i] = 0; continue; }
        const o = i * 3, ph = fase[i];
        let x = pos[o] + (vel[o] + Math.sin(t * 0.7 + ph) * 0.25) * dt / AREA, y = pos[o + 1] + (vel[o + 1] + Math.sin(t * 0.9 + ph * 2) * 0.12) * dt / 6, z = pos[o + 2] + (vel[o + 2] + Math.cos(t * 0.6 + ph) * 0.25) * dt / AREA;
        x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z); pos[o] = x; pos[o + 1] = y; pos[o + 2] = z; // posição normalizada [0,1) dentro do volume ao redor da câmera
        g.attributes.position.array[o] = cx + (x - 0.5) * 2 * AREA; g.attributes.position.array[o + 1] = 0.5 + y * 4.5; g.attributes.position.array[o + 2] = cz + (z - 0.5) * 2 * AREA;
        const pisca = 0.55 + 0.45 * Math.sin(t * 2.2 + ph * 3);
        tam[i] = (noite > 0.5 ? 5 : 3.2) * (0.7 + 0.3 * pisca); alfa[i] = noite > 0.5 ? 0.15 + 0.85 * pisca * noite : 0.5;
        if (noite > 0.5) { cor[o] = 0.85; cor[o + 1] = 1; cor[o + 2] = 0.45; } else { cor[o] = 1; cor[o + 1] = 0.95; cor[o + 2] = 0.75; }
      }
      for (let k = 0; k < nFumaca; k++) {
        const i = MAX_POLEN + k, ch = chamines[Math.floor(k / FUMACA_POR)], p = (fase[i] + t * 0.12) % 1, o = i * 3;
        g.attributes.position.array[o] = ch.x + p * 1.4 + Math.sin(t + k) * 0.15; g.attributes.position.array[o + 1] = ch.y + p * 3.2; g.attributes.position.array[o + 2] = ch.z + p * 0.8;
        tam[i] = 7 + p * 22; alfa[i] = (1 - p) * 0.38 * Math.min(1, p * 8); const c = 0.62 - noite * 0.3; cor[o] = c; cor[o + 1] = c; cor[o + 2] = c + 0.04;
      }
      g.attributes.position.needsUpdate = g.attributes.tam.needsUpdate = g.attributes.alfa.needsUpdate = g.attributes.cor.needsUpdate = true;
    },
  };
}
