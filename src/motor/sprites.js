// Sprites 2D no mundo 3D: plano voltado à câmera, âncora nos pés, albedo + normal map + máscara de brilho, sombra de silhueta.
// Animação por DESLOCAMENTO DE TEXTURA (uniforme por sprite): nenhum vértice é tocado por quadro (ADR-001 §8). Mirror (direção O)
// inverte a UV e o X da normal. Posição de desenho é "colada" à grade de pixel interna (sem tremor, M1-17).
import * as THREE from 'three';

const DIR_LINHA = { s: 0, n: 1, l: 2, o: 2 };

export function criarSpriteFactory(escalaPixelsPorTile) {
  const geometrias = new Map();
  const geometria = (meta) => {
    const chave = meta.celula.join('x') + '@' + meta.ancora.join(',');
    if (!geometrias.has(chave)) {
      const [cw, ch] = meta.celula, [ax, ay] = meta.ancora, g = new THREE.PlaneGeometry(cw / escalaPixelsPorTile, ch / escalaPixelsPorTile);
      g.translate((cw / 2 - ax) / escalaPixelsPorTile, (ay - ch / 2) / escalaPixelsPorTile, 0); // âncora nos pés = origem do objeto
      geometrias.set(chave, g);
    }
    return geometrias.get(chave);
  };

  /** @param {{meta, albedo, normal, brilho}} folha  texturas já carregadas (compartilham a mesma imagem na GPU) */
  function criar(folha, quaternionCamera) {
    const { meta } = folha, linhas = meta.direcoes.length;
    const t = (tex, cor) => { const c = tex.clone(); c.colorSpace = cor ? THREE.SRGBColorSpace : THREE.NoColorSpace; c.repeat.set(1 / meta.quadros, 1 / linhas); c.needsUpdate = true; return c; };
    const mat = new THREE.MeshStandardMaterial({ map: t(folha.albedo, true), normalMap: t(folha.normal, false), emissiveMap: t(folha.brilho, true), emissive: 0xffffff, alphaTest: 0.5, roughness: 0.85, metalness: 0 });
    mat.shadowSide = THREE.DoubleSide; // o quad só tem a face frontal; sem isto o sprite não projeta a sombra da silhueta
    const malha = new THREE.Mesh(geometria(meta), mat);
    malha.castShadow = true;
    malha.quaternion.copy(quaternionCamera);
    const sprite = { malha, meta, quadro: -1, direcao: '' };
    sprite.definir = (quadro, direcao) => {
      const q = ((quadro % meta.quadros) + meta.quadros) % meta.quadros, chave = q + direcao;
      if (sprite.quadro === chave) return; sprite.quadro = chave;
      const espelhar = direcao === 'o', linha = DIR_LINHA[direcao] ?? 0, rx = (espelhar ? -1 : 1) / meta.quadros;
      for (const tex of [mat.map, mat.normalMap, mat.emissiveMap]) tex.offset.set((q + (espelhar ? 1 : 0)) / meta.quadros, 1 - (linha + 1) / linhas), tex.repeat.x = rx;
      mat.normalScale.set(espelhar ? -1 : 1, 1);
    };
    sprite.definir(0, 's');
    return sprite;
  }
  return { criar };
}
