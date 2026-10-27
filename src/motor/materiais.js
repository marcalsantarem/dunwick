// Materiais do kit do cenário (compartilhados pela cena de exploração e pela arena de batalha): texturas tileáveis com mipmap + anisotropia,
// folhagem com vento por vértice, janelas e lâmpadas emissivas (a intensidade vem do ciclo dia/noite).
import * as THREE from 'three';

export function criarMateriais(T, perfil) {
  const uniformesVento = { uTempo: { value: 0 }, uVento: { value: 1 } };
  const aj = (t) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = perfil.aniso; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter; t.needsUpdate = true; return t; };
  const std = (map, extra = {}) => new THREE.MeshStandardMaterial({ map: aj(map), roughness: 0.9, metalness: 0, ...extra });
  const materiais = {
    reboco: std(T.reboco), madeira: std(T.madeira), telha_laranja: std(T.telha_laranja), telha_musgo: std(T.telha_musgo), ardosia: std(T.ardosia), pedra: std(T.pedra), casca: std(T.casca), tabuas: std(T.tabuas),
    folhagem: std(T.folhagem, { vertexColors: true, roughness: 1 }), metal: new THREE.MeshStandardMaterial({ color: 0x3a3a40, roughness: 0.45, metalness: 0.7 }),
    janela: new THREE.MeshStandardMaterial({ color: 0x1c2230, emissive: 0xffc070, emissiveIntensity: 0, roughness: 0.2 }), lampada: new THREE.MeshStandardMaterial({ color: 0xffe0a0, emissive: 0xffb050, emissiveIntensity: 0, roughness: 0.4 }),
    agua: new THREE.MeshStandardMaterial({ color: 0x1d2c3a, roughness: 0.15, metalness: 0.2 }),
  };
  materiais.folhagem.color.setRGB(1.75, 1.7, 1.55);
  materiais.folhagem.onBeforeCompile = (sh) => { // vento: balanço da copa pelo peso do vértice
    Object.assign(sh.uniforms, uniformesVento);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float balanco; uniform float uTempo, uVento;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed.xz += vec2(sin(uTempo * 1.3 + position.x * 0.8 + position.z * 0.4), cos(uTempo * 1.1 + position.z * 0.7)) * balanco * 0.07 * uVento;');
  };
  return { materiais, uniformesVento };
}
