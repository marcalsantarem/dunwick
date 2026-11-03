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
  // ---- v0.1.2 (D-041): vila completa e interiores. Variações por cor sobre as mesmas texturas (nada de textura nova) + materiais emissivos fixos (brasa, chama, vela)
  const cor = (c, extra = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.95, metalness: 0, ...extra });
  const emi = (c, e, i, extra = {}) => new THREE.MeshStandardMaterial({ color: c, emissive: e, emissiveIntensity: i, roughness: 0.5, ...extra });
  Object.assign(materiais, {
    pedra_negra: std(T.pedra, { color: 0x6a635b }), carvao: std(T.casca, { color: 0x4a423c }), reboco_novo: std(T.reboco, { color: 0xfff1d6 }), reboco_sujo: std(T.reboco, { color: 0x6b625a }),
    madeira_clara: std(T.madeira, { color: 0xe0bf8c }), palha_telha: std(T.tabuas, { color: 0xc2a35a }), terra_canteiro: std(T.terra ?? T.pedra, { color: 0x6f5a46 }),
    papel: cor(0xe6d8b0), lacre: cor(0xa8262b), latao: new THREE.MeshStandardMaterial({ color: 0xc9a24a, roughness: 0.4, metalness: 0.6 }),
    tecido_vinho: cor(0x8a2f36, { side: THREE.DoubleSide }), tecido_azul: cor(0x365a86, { side: THREE.DoubleSide }), tecido_ocre: cor(0xc08a3e), linho: cor(0xe4dcc8), palha: cor(0xb89a5a), ceramica: cor(0xcdbb9a), cera: cor(0xefe6cf),
    flor_amarela: cor(0xf2d35a), flor_branca: cor(0xf4efe6), flor_laranja: cor(0xd9702e),
    livro_a: cor(0x6e3b2a), livro_b: cor(0x3a5a3c), livro_c: cor(0x2f4660), livro_d: cor(0x8a6a2e),
    tapete_vinho: cor(0x7a3a30), tapete_ocre: cor(0xa8772f), tapete_verde: cor(0x3f5d3a), lareira_vao: cor(0x0d0a09), fundo_int: cor(0x16120f),
    brasa: emi(0x4a1408, 0xff5a1a, 1.8), chama: emi(0xffe9a0, 0xffc060, 2.6), janela_vela: emi(0x2a1c10, 0xffb050, 1.7, { roughness: 0.2 }), janela_dia: emi(0xaec6dc, 0x9fc0e0, 0.55, { roughness: 0.2 }),
  });
  { // luz de fora entrando pela porta de saída: mancha no chão, forte junto à porta e sumindo para dentro do cômodo (aditiva, sem sombra); em Node (testes) sem textura
    let t = null;
    if (typeof document !== 'undefined') {
      const cv = document.createElement('canvas'); cv.width = 32; cv.height = 64; const c = cv.getContext('2d'), g = c.createLinearGradient(0, 0, 0, 64);
      g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,255,255,1)'); c.fillStyle = g; c.fillRect(0, 0, 32, 64);
      c.globalCompositeOperation = 'destination-in'; const h = c.createLinearGradient(0, 0, 32, 0); h.addColorStop(0, 'rgba(0,0,0,0)'); h.addColorStop(0.3, 'rgba(0,0,0,1)'); h.addColorStop(0.7, 'rgba(0,0,0,1)'); h.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = h; c.fillRect(0, 0, 32, 64);
      t = new THREE.CanvasTexture(cv);
    }
    materiais.brilho_saida = new THREE.MeshBasicMaterial({ map: t, color: 0xffe6a8, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
  }
  materiais.folhagem.color.setRGB(1.75, 1.7, 1.55);
  materiais.folhagem.onBeforeCompile = (sh) => { // vento: balanço da copa pelo peso do vértice
    Object.assign(sh.uniforms, uniformesVento);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float balanco; uniform float uTempo, uVento;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed.xz += vec2(sin(uTempo * 1.3 + position.x * 0.8 + position.z * 0.4), cos(uTempo * 1.1 + position.z * 0.7)) * balanco * 0.07 * uVento;');
  };
  return { materiais, uniformesVento };
}
