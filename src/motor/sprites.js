// Sprites 2D no mundo 3D: plano voltado à câmera (vertical NA TELA), âncora nos pés, atlas de quadros (5 direções, as de oeste espelhadas).
// Luz: a "normal" vem do alfa borrado (mip alto) por derivadas de tela, então o sprite responde ao sol e às lanternas sem baixar normal map.
// Sombra de silhueta (alfa recortado) + silhueta atrás de objetos (passe com depth GREATER) + brilho de acerto. Animação por offset de
// textura (uniforme por sprite): nenhum vértice é tocado por quadro.
import * as THREE from 'three';

export function criarSpriteFactory(pixelsPorUnidade, quatCamera) {
  const geometrias = new Map();
  const geometria = (meta) => {
    const chave = `${meta.celula}@${meta.ancora}@${meta.arte_escala}`;
    if (!geometrias.has(chave)) {
      const [cw, ch] = meta.celula, [ax, ay] = meta.ancora, u = pixelsPorUnidade * meta.arte_escala, g = new THREE.PlaneGeometry(cw / u, ch / u);
      g.translate((cw / 2 - ax) / u, (ay - ch / 2) / u, 0); geometrias.set(chave, g);
    }
    return geometrias.get(chave);
  };
  const VERT_SIL = 'varying vec2 vUv; uniform mat3 uvT; void main(){ vUv = (uvT * vec3(uv, 1.0)).xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
  const FRAG_SIL = 'varying vec2 vUv; uniform sampler2D map; uniform vec3 cor; uniform float alfa; void main(){ float a = texture2D(map, vUv).a; if (a < 0.45) discard; gl_FragColor = vec4(cor, alfa); }';

  /** `atlas` = { meta, textura }. `opcoes.silhueta` liga o passe "atrás de objetos"; `opcoes.msaa` usa alpha-to-coverage. */
  function criar(atlas, opcoes = {}) {
    const { meta, textura } = atlas, [cw, ch] = meta.celula, W = textura.image.width, H = textura.image.height;
    const tex = textura.clone(); tex.needsUpdate = true; tex.repeat.set(cw / W, ch / H); tex.matrixAutoUpdate = true;
    const mat = new THREE.MeshStandardMaterial({ map: tex, alphaTest: opcoes.msaa ? 0.01 : 0.45, alphaToCoverage: !!opcoes.msaa, roughness: 0.9, metalness: 0, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.3 });
    mat.shadowSide = THREE.DoubleSide; // o quad só tem a face frontal; sem isto não projeta a sombra da silhueta
    const luz = { acerto: 0, realce: 0, bulge: opcoes.bulge ?? 2.2 };
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.uBulge = { value: luz.bulge }; mat.userData.sh = sh;
      sh.fragmentShader = sh.fragmentShader.replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        { float ab = texture2D(map, vMapUv, 3.5).a; vec2 gr = vec2(dFdx(ab), dFdy(ab)); normal = normalize(normal + vec3(-gr.x, -gr.y, 0.0) * uBulge * 40.0); }`)
        .replace('#include <common>', '#include <common>\nuniform float uBulge;');
    };
    const malha = new THREE.Mesh(geometria(meta), mat); malha.castShadow = true; malha.quaternion.copy(quatCamera); malha.name = meta.id;
    let silhueta = null;
    if (opcoes.silhueta) {
      const m = new THREE.ShaderMaterial({ uniforms: { map: { value: tex }, uvT: { value: tex.matrix }, cor: { value: new THREE.Color(0x9fd8ff) }, alfa: { value: opcoes.silhuetaAlfa ?? 0.55 } }, vertexShader: VERT_SIL, fragmentShader: FRAG_SIL, transparent: true, depthWrite: false, depthFunc: THREE.GreaterDepth });
      silhueta = new THREE.Mesh(malha.geometry, m); silhueta.quaternion.copy(quatCamera); silhueta.renderOrder = 20;
    }
    const sprite = { malha, silhueta, meta, luz, quadro: -1, tex };
    /** Define o quadro: anim (nome), índice na animação, direção de arte ('s','se','l','ne','n') e espelho. */
    sprite.definir = (anim, quadro, dir = 's', espelhar = false) => {
      const a = meta.anims[anim], di = Math.max(0, meta.direcoes.indexOf(dir)), q = ((quadro % a.quadros) + a.quadros) % a.quadros, chave = `${anim}:${q}:${di}:${espelhar}`;
      if (sprite.quadro === chave) return; sprite.quadro = chave;
      const idx = a.inicio + di * a.quadros + q, col = idx % meta.colunas, lin = Math.floor(idx / meta.colunas);
      tex.repeat.x = (espelhar ? -1 : 1) * (cw / W); tex.offset.x = (col + (espelhar ? 1 : 0)) * (cw / W); tex.offset.y = 1 - (lin + 1) * (ch / H);
      tex.updateMatrix();
    };
    const idleA = Object.keys(meta.anims)[0]; sprite.definir(idleA, 0, 's');
    return sprite;
  }
  return { criar };
}
