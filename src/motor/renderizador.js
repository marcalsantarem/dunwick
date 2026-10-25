// Renderizador: cena 3D em resolução INTERNA fixa (640×360) → alvo de render → ampliação por vizinho mais próximo em escala INTEIRA
// (ADR-001 D2). A janela maior que o múltiplo inteiro ganha barras pretas; nunca se interpola. Única parte do jogo que fala com WebGL.
import * as THREE from 'three';

const VERT = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
// Passe final: vinheta (do perfil) + saída sRGB. Ponto único de pós na resolução interna (pós do 10 entram aqui no M2).
const FRAG = `uniform sampler2D tCor; uniform float vinheta; varying vec2 vUv;
  void main(){
    vec4 c = texture2D(tCor, vUv);
    float v = smoothstep(0.85, 0.35, length(vUv - 0.5) * 1.2); c.rgb *= mix(1.0 - vinheta, 1.0, v);
    gl_FragColor = linearToOutputTexel(vec4(c.rgb, 1.0));
  }`;

export function criarRenderizador(canvas, cfg) {
  const [W, H] = cfg.resolucao_interna;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', alpha: false });
  renderer.setPixelRatio(1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.info.autoReset = false;
  renderer.setClearColor(0x000000, 1);

  const alvo = new THREE.WebGLRenderTarget(W, H, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: true, samples: 0, generateMipmaps: false });
  const material = new THREE.ShaderMaterial({ uniforms: { tCor: { value: alvo.texture }, vinheta: { value: 0 } }, vertexShader: VERT, fragmentShader: FRAG, depthTest: false, depthWrite: false });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  quad.frustumCulled = false;
  const cenaQuad = new THREE.Scene(); cenaQuad.add(quad);
  const camQuad = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const estado = { largura: 0, altura: 0, escala: 1, vx: 0, vy: 0, vw: W, vh: H, perdeuContexto: false };

  /** Ajusta o buffer ao tamanho da janela em pixels de dispositivo e recalcula a escala inteira. */
  function ajustar(cssW, cssH, dpr = 1) {
    const bw = Math.max(W, Math.round(cssW * dpr)), bh = Math.max(H, Math.round(cssH * dpr));
    renderer.setSize(bw, bh, false);
    const escala = Math.max(1, Math.floor(Math.min(bw / W, bh / H)));
    Object.assign(estado, { largura: bw, altura: bh, escala, vw: W * escala, vh: H * escala, vx: Math.floor((bw - W * escala) / 2), vy: Math.floor((bh - H * escala) / 2) });
  }

  function desenhar(cena, camera) {
    renderer.info.reset();
    renderer.setRenderTarget(alvo);
    renderer.setScissorTest(false);
    renderer.render(cena, camera);
    renderer.setRenderTarget(null);
    renderer.setScissorTest(false);
    renderer.setViewport(0, 0, estado.largura, estado.altura);
    renderer.clear();
    renderer.setViewport(estado.vx, estado.vy, estado.vw, estado.vh);
    renderer.render(cenaQuad, camQuad);
  }

  // Perda do contexto gráfico: o jogo recarrega a página sem perder o save (não há save no M1; o estado é recriado do zero).
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); estado.perdeuContexto = true; });
  canvas.addEventListener('webglcontextrestored', () => location.reload());

  return {
    renderer, estado, ajustar, desenhar, alvo,
    definirVinheta(v) { material.uniforms.vinheta.value = v; },
    get escala() { return estado.escala; },
    estatisticas: () => ({ chamadas: renderer.info.render.calls, triangulos: renderer.info.render.triangles, texturas: renderer.info.memory.textures, geometrias: renderer.info.memory.geometries }),
    infoGpu() { const gl = renderer.getContext(), e = gl.getExtension('WEBGL_debug_renderer_info'); return e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : 'desconhecida'; },
  };
}
