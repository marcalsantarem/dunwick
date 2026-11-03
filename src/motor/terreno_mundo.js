// Terreno do mapa de mundo (v0.1.3b): UM plano, UM passe. O chão é um mapa de índices (material, variante, profundidade por tile) + um atlas de tiles
// pintado POR CÓDIGO (px_por_tile pixels, filtro nearest) e um shader que, por pixel de arte:
//   · escolhe o tile e a variante; · faz as TRANSIÇÕES automáticas (o material de maior prioridade invade o vizinho com borda pontilhada e contorno,
//   como autotile desenhado: grama→areia→mar, estrada→grama); · anima a ÁGUA (ondas em faixas, brilhos, mais funda longe da costa, ESPUMA na margem);
//   · passa SOMBRAS DE NUVEM em movimento. Tudo em dados (data/config/cfg_mundo.json). Sem textura baixada: o atlas sai de funções puras (testáveis).
import * as THREE from 'three';

export const MAX_MATERIAIS = 12;
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const hash = (x, z, s = 0) => { let h = (x * 374761393 + z * 668265263 + s * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };

/** Ordem estável dos materiais (índice = linha do atlas = valor no mapa de índices). */
export const listaMateriais = (cfgT) => Object.keys(cfgT.materiais);

/** Pura: pixels RGBA do atlas (largura = variantes × px, altura = materiais × px). Um padrão por material (`padrao`), cores `cor`, `cor_b` (sombra), `cor_c` (luz). */
export function gerarAtlas(cfgT) {
  const T = cfgT.px_por_tile, V = cfgT.variantes, mats = listaMateriais(cfgT), W = V * T, H = mats.length * T, d = new Uint8ClampedArray(W * H * 4);
  const pr = (m, v, x, y, c) => { if (x < 0 || y < 0 || x >= T || y >= T) return; const o = ((m * T + y) * W + v * T + x) * 4; d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255; };
  mats.forEach((nome, m) => {
    const M = cfgT.materiais[nome], a = hex(M.cor), b = hex(M.cor_b ?? M.cor), c = hex(M.cor_c ?? M.cor);
    for (let v = 0; v < V; v++) {
      const s = m * 131 + v * 17, h = (x, y, k = 0) => hash(x, y, s + k);
      for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) pr(m, v, x, y, a);
      switch (M.padrao) {
        case 'relva': // pontinhos escuros/claros + tufos em "Y"
          for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const r = h(x, y); if (r < 0.12) pr(m, v, x, y, b); else if (r > 0.93) pr(m, v, x, y, c); }
          for (let k = 0; k < 3; k++) { const x = 1 + Math.floor(h(k, 1, 5) * (T - 2)), y = 2 + Math.floor(h(k, 2, 5) * (T - 3)); pr(m, v, x, y, b); pr(m, v, x - 1, y - 1, b); pr(m, v, x + 1, y - 1, b); pr(m, v, x, y - 1, c); }
          if (v === V - 1) { const x = 2 + Math.floor(h(9, 9) * (T - 4)), y = 2 + Math.floor(h(8, 8) * (T - 4)); pr(m, v, x, y, hex(M.flor ?? '#f4e27a')); pr(m, v, x + 1, y, hex(M.flor ?? '#f4e27a')); } // uma flor na última variante
          break;
        case 'folhas': // moitas: círculos de luz com sombra por baixo
          for (let k = 0; k < 5; k++) {
            const cx = Math.floor(h(k, 3, 7) * T), cy = Math.floor(h(k, 4, 7) * T), r = 2 + Math.floor(h(k, 5, 7) * 2);
            for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + 1) pr(m, v, (cx + x + T) % T, (cy + y + T) % T, y > 0 ? b : x + y < -r ? c : a);
          }
          break;
        case 'trilha': // terra batida: seixos e sulcos
          for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const r = h(x, y); if (r < 0.1) pr(m, v, x, y, b); else if (r > 0.94) pr(m, v, x, y, c); }
          for (let k = 0; k < 3; k++) { const x = Math.floor(h(k, 6, 9) * (T - 2)), y = Math.floor(h(k, 7, 9) * (T - 2)); pr(m, v, x, y, c); pr(m, v, x + 1, y, c); pr(m, v, x, y + 1, b); pr(m, v, x + 1, y + 1, b); }
          break;
        case 'rocha': // faces em faixas diagonais claras/escuras + rachaduras
          for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const f = Math.floor((x * 2 + y * 3 + v * 5) / 6) % 3; pr(m, v, x, y, f === 0 ? c : f === 1 ? a : b); if (h(x, y) < 0.06) pr(m, v, x, y, b); }
          break;
        case 'areia': // ondulações e grãos
          for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const r = h(x, y); if (r < 0.07) pr(m, v, x, y, b); else if (r > 0.95) pr(m, v, x, y, c); }
          for (let k = 0; k < 2; k++) { const y = Math.floor(h(k, 11, 3) * T), x0 = Math.floor(h(k, 12, 3) * (T - 6)); for (let x = 0; x < 5; x++) pr(m, v, x0 + x, y, b); }
          break;
        case 'agua': break; // a água é animada no shader; o atlas só guarda a cor-base
        default: for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const r = h(x, y); if (r < 0.1) pr(m, v, x, y, b); else if (r > 0.92) pr(m, v, x, y, c); }
      }
    }
  });
  return { largura: W, altura: H, dados: d };
}

/** Pura: mapa de índices, 1 pixel por tile — R material, G variante, B profundidade da água (distância à terra, 0..255), A 255. */
export function indicesTerreno(mapaDados, cfgT) {
  const [L, A] = mapaDados.tamanho, mats = listaMateriais(cfgT), V = cfgT.variantes, ag = mats.indexOf(cfgT.agua.material), d = new Uint8Array(L * A * 4);
  const mat = (x, z) => { const n = mapaDados.legenda[mapaDados.planta[z][x]]; const i = mats.indexOf(n); return i >= 0 ? i : mats.indexOf(cfgT.borda_material); };
  const prof = new Int16Array(L * A).fill(-1), fila = [];
  for (let z = 0; z < A; z++) for (let x = 0; x < L; x++) if (mat(x, z) !== ag) { prof[z * L + x] = 0; fila.push([x, z]); }
  for (let i = 0; i < fila.length; i++) { const [x, z] = fila[i], p = prof[z * L + x]; for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const a = x + dx, b = z + dz; if (a < 0 || b < 0 || a >= L || b >= A || prof[b * L + a] >= 0) continue; prof[b * L + a] = p + 1; fila.push([a, b]); } }
  for (let z = 0; z < A; z++) for (let x = 0; x < L; x++) { const o = (z * L + x) * 4, m = mat(x, z); d[o] = m; d[o + 1] = Math.floor(hash(x, z, 7) * V); d[o + 2] = m === ag ? Math.round((0.18 + 0.82 * Math.min(1, Math.max(0, prof[z * L + x] < 0 ? 1 : (prof[z * L + x] - 1) / 5))) * 255) : 0; d[o + 3] = 255; } // profundidade: terra 0 · água 0,18 na costa → 1 no mar aberto
  return { largura: L, altura: A, dados: d };
}

const VS_EXTRA = '#include <common>\nvarying vec2 vXZ;', VS_BODY = '#include <begin_vertex>\nvXZ = (modelMatrix * vec4(transformed, 1.0)).xz;';
// Fronteiras ORGÂNICAS: cada ponto escolhe o material entre os 4 tiles mais próximos (pesos bilineares → cantos arredondados e diagonais), com viés de
// prioridade (o material "de cima" avança um pouco) e ruído de baixa/alta frequência por candidato. Nunca sobra o degrau reto de tile.
const FS_COMUM = `#include <common>
varying vec2 vXZ;
uniform sampler2D tIdx, tAtlas; uniform vec2 uMapa, uVento; uniform float uBorda, uT, uVar, uNmat, uAgua, uTempo, uBrilho, uPrio[${MAX_MATERIAIS}];
uniform float uBias, uRuido, uContorno, uNuvI, uNuvE, uNuvL, uPontos, uZona, uNivel; uniform vec3 uLuz, uRasa, uFunda, uOnda, uEspuma;
float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
vec4 ladrilho(vec2 t){ vec2 k = clamp(t, vec2(0.0), uMapa - 1.0); vec4 e = texture2D(tIdx, (k + 0.5) / uMapa); if (any(notEqual(k, t))) { float p = e.b > 0.0 ? e.b : 0.18; return vec4((uBorda + 0.01) / 255.0, 0.0, min(1.0, p + length(t - k) * 0.16), 1.0); } return e; } // fora do mapa: o material de borda (mar) até o horizonte
vec3 mat(float m, float v, vec2 px){ return texture2D(tAtlas, vec2((v + px.x) / uVar, (m + px.y) / uNmat)).rgb; }
float idM(vec4 t){ return floor(t.r * 255.0 + 0.5); }
// devolve (material, variante, profundidade interpolada)
vec3 escolher(vec2 pw){
  vec2 q = pw - 0.5, b = floor(q), f = fract(q);
  vec4 w = vec4((1.0 - f.x) * (1.0 - f.y), f.x * (1.0 - f.y), (1.0 - f.x) * f.y, f.x * f.y);
  vec4 t0 = ladrilho(b), t1 = ladrilho(b + vec2(1.0, 0.0)), t2 = ladrilho(b + vec2(0.0, 1.0)), t3 = ladrilho(b + vec2(1.0, 1.0));
  float m0 = idM(t0), m1 = idM(t1), m2 = idM(t2), m3 = idM(t3);
  float s0 = w.x + (m1 == m0 ? w.y : 0.0) + (m2 == m0 ? w.z : 0.0) + (m3 == m0 ? w.w : 0.0);
  float s1 = w.y + (m0 == m1 ? w.x : 0.0) + (m2 == m1 ? w.z : 0.0) + (m3 == m1 ? w.w : 0.0);
  float s2 = w.z + (m0 == m2 ? w.x : 0.0) + (m1 == m2 ? w.y : 0.0) + (m3 == m2 ? w.w : 0.0);
  float s3 = w.w + (m0 == m3 ? w.x : 0.0) + (m1 == m3 ? w.y : 0.0) + (m2 == m3 ? w.z : 0.0);
  float n = uRuido;
  s0 += uPrio[int(m0)] * uBias + (vn(pw * 2.1) - 0.5) * n + (vn(pw * 6.3) - 0.5) * n * 0.5;
  s1 += uPrio[int(m1)] * uBias + (vn(pw * 2.1 + 17.0) - 0.5) * n + (vn(pw * 6.3 + 5.0) - 0.5) * n * 0.5;
  s2 += uPrio[int(m2)] * uBias + (vn(pw * 2.1 + 31.0) - 0.5) * n + (vn(pw * 6.3 + 11.0) - 0.5) * n * 0.5;
  s3 += uPrio[int(m3)] * uBias + (vn(pw * 2.1 + 47.0) - 0.5) * n + (vn(pw * 6.3 + 23.0) - 0.5) * n * 0.5;
  vec4 t = t0; float s = s0;
  if (s1 > s) { s = s1; t = t1; } if (s2 > s) { s = s2; t = t2; } if (s3 > s) { s = s3; t = t3; }
  return vec3(idM(t), floor(t.g * 255.0 + 0.5), dot(w, vec4(t0.b, t1.b, t2.b, t3.b)));
}`;
const FS_MAIN = `
  vec2 pix = (floor(vXZ * uT) + 0.5) / uT, pq = floor(fract(vXZ) * uT) / uT;
  vec3 s = escolher(pix); float m = s.x; bool agua = abs(m - uAgua) < 0.5;
  vec3 c = mat(m, s.y, pq);
  if (agua) { // água: cor pela profundidade, ondas tortas em faixas, brilhos, espuma na margem (onde a profundidade interpolada é pequena)
    c = mix(uRasa, uFunda, clamp((s.z - 0.18) / 0.82, 0.0, 1.0));
    vec2 pw = pix + vec2(vn(pix * 0.9 + uTempo * 0.1), vn(pix * 0.9 - uTempo * 0.1 + 7.0)) * 1.6;
    float w = sin(pw.x * 2.2 + pw.y * 1.1 + uTempo * 1.0) * 0.5 + sin(pw.x * 1.1 - pw.y * 2.6 + uTempo * 0.7) * 0.5 + (vn(pw * 1.7) - 0.5) * 0.5;
    c = mix(c, uOnda, step(0.86, w) * 0.42);
    c = mix(c, vec3(1.0), step(1.0 - uPontos, h21(floor(vXZ * uT) + floor(uTempo * 2.0))));
    float lim = 0.125 + 0.022 * sin(uTempo * 1.7 + (pix.x + pix.y) * 0.8);
    c = mix(c, uEspuma, step(s.z, lim) * 0.92);
  } else { // variação de tom por zona (campos de baixa frequência: sem repetição visível)
    float z = vn(pix * 0.07) * 0.6 + vn(pix * 0.19 + 9.0) * 0.4;
    c *= 1.0 + (z - 0.5) * uZona * vec3(1.1, 1.0, 0.8);
  }
  if (uNivel > 0.5) { // contorno escuro fino onde este material (de maior prioridade) encontra outro: borda de autotile desenhado
    float d = 1.0 / uT, pm = uPrio[int(m)]; bool borda = false;
    vec3 a = escolher(pix + vec2(d, 0.0)), b = escolher(pix + vec2(-d, 0.0)), e = escolher(pix + vec2(0.0, d)), f = escolher(pix + vec2(0.0, -d));
    if (abs(a.x - m) > 0.5 && uPrio[int(a.x)] < pm) borda = true; if (abs(b.x - m) > 0.5 && uPrio[int(b.x)] < pm) borda = true;
    if (abs(e.x - m) > 0.5 && uPrio[int(e.x)] < pm) borda = true; if (abs(f.x - m) > 0.5 && uPrio[int(f.x)] < pm) borda = true;
    if (borda && !agua) c *= uContorno;
  }
  float nn = vn(vXZ * uNuvE + uVento * uTempo) * 0.65 + vn(vXZ * uNuvE * 2.3 - uVento * uTempo * 1.3) * 0.35; // sombras de nuvem em 3 degraus
  c *= 1.0 - uNuvI * floor(smoothstep(uNuvL, uNuvL + 0.14, nn) * 3.0 + 0.5) / 3.0;
  diffuseColor.rgb *= c * uLuz * uBrilho;`;

const tex = (r, nearest = true) => { const t = new THREE.DataTexture(r.dados, r.largura, r.altura, THREE.RGBAFormat); t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; t.flipY = false; t.needsUpdate = true; void nearest; return t; };

export function criarTerrenoMundo(mapaDados, cfgT, perfil, luzMundo = [1, 1, 1]) {
  const [L, A] = mapaDados.tamanho, B = cfgT.borda_tiles, mats = listaMateriais(cfgT), N = cfgT.nuvens, W = cfgT.agua;
  if (mats.length > MAX_MATERIAIS) throw new Error(`cfg_mundo: no máximo ${MAX_MATERIAIS} materiais`);
  const atlas = tex(gerarAtlas(cfgT)); atlas.colorSpace = THREE.SRGBColorSpace;
  const idx = tex(indicesTerreno(mapaDados, cfgT)); idx.colorSpace = THREE.NoColorSpace;
  const cor3 = (h) => { const c = hex(h); return new THREE.Color().setRGB(c[0] / 255, c[1] / 255, c[2] / 255, THREE.SRGBColorSpace); };
  const U = {
    tIdx: { value: idx }, tAtlas: { value: atlas }, uMapa: { value: new THREE.Vector2(L, A) }, uT: { value: cfgT.px_por_tile }, uVar: { value: cfgT.variantes }, uNmat: { value: mats.length }, uAgua: { value: mats.indexOf(W.material) }, uBorda: { value: mats.indexOf(cfgT.borda_material) },
    uTempo: { value: 0 }, uBrilho: { value: cfgT.brilho }, uPrio: { value: Array.from({ length: MAX_MATERIAIS }, (_, i) => cfgT.materiais[mats[i]]?.prioridade ?? 0) },
    uBias: { value: cfgT.transicao.vies }, uRuido: { value: cfgT.transicao.ruido }, uContorno: { value: cfgT.transicao.contorno }, uZona: { value: cfgT.variacao_zona }, uNivel: { value: 1 },
    uNuvI: { value: N.ligado ? N.intensidade : 0 }, uNuvE: { value: N.escala }, uNuvL: { value: N.limiar }, uVento: { value: new THREE.Vector2(...N.vento) },
    uPontos: { value: W.brilhos }, uRasa: { value: cor3(W.cor_rasa) }, uFunda: { value: cor3(W.cor_funda) }, uOnda: { value: cor3(W.cor_onda) }, uEspuma: { value: cor3(W.espuma) }, uLuz: { value: new THREE.Vector3(...luzMundo) },
  };
  const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false });
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', VS_EXTRA).replace('#include <begin_vertex>', VS_BODY);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', FS_COMUM).replace('#include <map_fragment>', FS_MAIN);
  };
  const malha = new THREE.Mesh(new THREE.PlaneGeometry(L + B * 2, A + B * 2).rotateX(-Math.PI / 2).translate(L / 2, 0, A / 2), mat); malha.name = 'solo'; // maior que o mapa: fora dele o shader desenha o mar
  const c = cor3(cfgT.materiais[cfgT.borda_material].cor), matB = new THREE.MeshBasicMaterial({ color: c, fog: false });
  const borda = new THREE.Mesh(new THREE.PlaneGeometry(L + B * 2, A + B * 2).rotateX(-Math.PI / 2).translate(L / 2, -0.02, A / 2), matB); borda.name = 'solo_borda';
  const grupo = new THREE.Group(); grupo.add(malha, borda); U.uNivel.value = perfil?.id === 'perfil_baixo' ? 0 : 1;
  return { malha: grupo, trocarTexel() {}, /** perfil Baixo: sem contorno (4 avaliações a menos por pixel) */ aplicarPerfil(p) { U.uNivel.value = p.id === 'perfil_baixo' ? 0 : 1; }, /** relógio das animações (água, nuvens), em segundos */ atualizar(tempoS) { U.uTempo.value = tempoS; } };
}
