// Chão do mapa: um único plano com mistura de 4 materiais (grama, terra, calçamento, musgo) guiada por um mapa de pesos gerado do
// `planta` (8 px/tile, suavizado) e perturbada por ruído para bordas orgânicas. Texturas tileáveis com mipmap + anisotropia
// (ADR-002: 64 texels/tile). Recebe luz, sombra e névoa como qualquer material padrão (shader padrão remendado).
import * as THREE from 'three';

export const PIXELS_MAPA_MISTURA = 8;

export function gerarMapaMistura(mapaDados) {
  const [L, A] = mapaDados.tamanho, P = PIXELS_MAPA_MISTURA, cv = document.createElement('canvas'); cv.width = L * P; cv.height = A * P;
  const c = cv.getContext('2d'), cor = { grama: '#000000', terra: '#ff0000', calcada: '#00ff00', musgo: '#0000ff' };
  c.fillStyle = '#000'; c.fillRect(0, 0, cv.width, cv.height);
  for (let z = 0; z < A; z++) for (let x = 0; x < L; x++) { c.fillStyle = cor[mapaDados.legenda[mapaDados.planta[z][x]]]; c.fillRect(x * P, z * P, P, P); }
  const out = document.createElement('canvas'); out.width = cv.width; out.height = cv.height; const o = out.getContext('2d'); o.filter = `blur(${P * 0.45}px)`; o.drawImage(cv, 0, 0); // bordas suaves entre materiais
  return out;
}

export function criarSolo(mapaDados, tex, perfil, texelsPorTile, nearest = false) {
  const [L, A] = mapaDados.tamanho, repeticaoTiles = 256 / texelsPorTile;
  const ajustar = (t) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = perfil.aniso; if (nearest) { t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; } else { t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; } t.needsUpdate = true; return t; };
  const mistura = new THREE.CanvasTexture(gerarMapaMistura(mapaDados)); mistura.colorSpace = THREE.NoColorSpace; mistura.flipY = false; // linha z da planta = v do mapa (sem inverter): o chão fica como desenhado no `planta` mistura.minFilter = mistura.magFilter = THREE.LinearFilter; mistura.generateMipmaps = false;
  const T = { gramaA: ajustar(tex.grama_a), gramaB: ajustar(tex.grama_b), terra: ajustar(tex.terra), calcada: ajustar(tex.calcada) };
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95, metalness: 0 });
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, { tGA: { value: T.gramaA }, tGB: { value: T.gramaB }, tTerra: { value: T.terra }, tCal: { value: T.calcada }, tMist: { value: mistura }, uRep: { value: repeticaoTiles }, uMapa: { value: new THREE.Vector2(L, A) } });
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vXZ;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvXZ = (modelMatrix * vec4(transformed, 1.0)).xz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec2 vXZ; uniform sampler2D tGA, tGB, tTerra, tCal, tMist; uniform float uRep; uniform vec2 uMapa;')
      .replace('#include <map_fragment>', `
      vec2 uvT = vXZ / uRep;
      float ruido = texture2D(tGB, vXZ * 0.045).r;
      vec3 g = mix(texture2D(tGA, uvT).rgb, texture2D(tGB, uvT * 0.83 + 0.37).rgb, smoothstep(0.35, 0.65, ruido));
      vec3 w = texture2D(tMist, vXZ / uMapa).rgb;
      vec3 b = smoothstep(vec3(0.5 - 0.2), vec3(0.5 + 0.2), w + (texture2D(tGA, vXZ * 0.11).r - 0.5) * 0.55);
      vec3 musgo = g * vec3(0.62, 0.92, 0.84) + vec3(0.0, 0.02, 0.03);
      vec3 c = g; c = mix(c, musgo, b.b); c = mix(c, texture2D(tTerra, uvT).rgb, b.r); c = mix(c, texture2D(tCal, uvT).rgb, b.g);
      diffuseColor.rgb *= c;`);
  };
  const BORDA = 90; // o chão continua além do mapa (grama) para a borda nunca mostrar o céu; a câmera é limitada pelo mapa
  const malha = new THREE.Mesh(new THREE.PlaneGeometry(L + BORDA * 2, A + BORDA * 2).rotateX(-Math.PI / 2).translate(L / 2, 0, A / 2), mat);
  malha.receiveShadow = true; malha.name = 'solo';
  return { malha, trocarTexel(novoTexel) { mat.userData.rep = 256 / novoTexel; } };
}
