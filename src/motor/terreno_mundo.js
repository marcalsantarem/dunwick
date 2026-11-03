// Terreno do mapa de mundo (v0.1.3): UM plano com uma textura de cores gerada da `planta` (px_por_tile pixels por tile, filtro nearest = "tiles simples"),
// paleta por material em data/config/cfg_mundo.json e ruído leve por pixel (determinístico). Sem texturas do kit, sem mistura, sem sombra:
// o custo é uma malha de 2 triângulos + uma textura pequena. Além da borda do mapa o chão continua com a cor do material de borda (mar).
import * as THREE from 'three';

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const hash = (x, z, s) => { let h = (x * 374761393 + z * 668265263 + s * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };

/** Pura (sem DOM): pixels RGBA da textura do terreno. Devolve { largura, altura, dados: Uint8ClampedArray }. */
export function pixelsTerreno(mapaDados, cfgT) {
  const [L, A] = mapaDados.tamanho, P = cfgT.px_por_tile, W = L * P, H = A * P, dados = new Uint8ClampedArray(W * H * 4), cores = {};
  for (const [mat, c] of Object.entries(cfgT.materiais)) cores[mat] = hex(c.cor);
  for (let z = 0; z < A; z++) for (let x = 0; x < L; x++) {
    const base = cores[mapaDados.legenda[mapaDados.planta[z][x]]] ?? cores[cfgT.borda_material], tile = (hash(x, z, 7) - 0.5) * cfgT.variacao_tile;
    for (let j = 0; j < P; j++) for (let i = 0; i < P; i++) {
      const k = 1 + tile + (hash(x * P + i, z * P + j, 3) - 0.5) * cfgT.ruido, o = ((z * P + j) * W + x * P + i) * 4;
      dados[o] = base[0] * k; dados[o + 1] = base[1] * k; dados[o + 2] = base[2] * k; dados[o + 3] = 255;
    }
  }
  return { largura: W, altura: H, dados };
}

export function criarTerrenoMundo(mapaDados, cfgT, perfil) {
  const [L, A] = mapaDados.tamanho, { largura, altura, dados } = pixelsTerreno(mapaDados, cfgT), B = cfgT.borda_tiles;
  const tex = new THREE.DataTexture(dados, largura, altura, THREE.RGBAFormat); tex.colorSpace = THREE.SRGBColorSpace; tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.NearestFilter; tex.generateMipmaps = false; tex.flipY = false; tex.needsUpdate = true;
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 1, metalness: 0 });
  const malha = new THREE.Mesh(new THREE.PlaneGeometry(L, A).rotateX(-Math.PI / 2).translate(L / 2, 0, A / 2), mat); malha.name = 'solo';
  const c = hex(cfgT.materiais[cfgT.borda_material].cor), matB = new THREE.MeshStandardMaterial({ color: new THREE.Color(c[0] / 255, c[1] / 255, c[2] / 255), roughness: 1, metalness: 0 });
  const borda = new THREE.Mesh(new THREE.PlaneGeometry(L + B * 2, A + B * 2).rotateX(-Math.PI / 2).translate(L / 2, -0.02, A / 2), matB); borda.name = 'solo_borda';
  const grupo = new THREE.Group(); grupo.add(malha, borda); void perfil;
  return { malha: grupo, trocarTexel() {} };
}
