// Renderizador. Dois modos de resolução (ADR-002): "arte" = cena em 960×540 ampliada por vizinho mais próximo em escala INTEIRA
// (pixel de arte nítido, 2× em 1080p); "nativa" = cena na resolução da janela (3D liso). Pós em poucos passes: bloom em ¼ de resolução,
// tilt-shift (desfoque de maquete por faixa), vinheta e grade de cor do ciclo dia/noite. Única parte do jogo que fala com WebGL.
import * as THREE from 'three';

const VERT = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
const FRAG_BRILHO = 'varying vec2 vUv; uniform sampler2D tCena; uniform float limiar; void main(){ vec3 c = texture2D(tCena, vUv).rgb; float l = max(max(c.r, c.g), c.b); gl_FragColor = vec4(c * smoothstep(limiar, limiar + 0.35, l), 1.0); }';
const FRAG_BLUR = `varying vec2 vUv; uniform sampler2D tEntrada; uniform vec2 passo;
void main(){ vec3 s = texture2D(tEntrada, vUv).rgb * 0.227027; s += (texture2D(tEntrada, vUv + passo * 1.3846).rgb + texture2D(tEntrada, vUv - passo * 1.3846).rgb) * 0.316216; s += (texture2D(tEntrada, vUv + passo * 3.2308).rgb + texture2D(tEntrada, vUv - passo * 3.2308).rgb) * 0.070270; gl_FragColor = vec4(s, 1.0); }`;
const FRAG_FINAL = `varying vec2 vUv; uniform sampler2D tCena, tBloom; uniform vec2 res; uniform float foco, faixa, raioDof, bloomForca, vinheta; uniform vec3 tom; uniform bool usaDof, usaBloom;
void main(){
  vec3 c = texture2D(tCena, vUv).rgb;
  if (usaDof) { // tilt-shift: nítido numa faixa horizontal em volta de 'foco', desfoca para cima e para baixo (efeito de maquete)
    float k = smoothstep(faixa, faixa + 0.32, abs(vUv.y - foco)) * raioDof;
    if (k > 0.05) { vec3 s = c; float n = 1.0; for (int i = 0; i < 8; i++) { float a = float(i) * 0.785398 + 0.3927; vec2 o = vec2(cos(a), sin(a)) * k / res; s += texture2D(tCena, vUv + o).rgb + texture2D(tCena, vUv + o * 0.5).rgb; n += 2.0; } c = s / n; }
  }
  if (usaBloom) c += texture2D(tBloom, vUv).rgb * bloomForca;
  float v = smoothstep(0.9, 0.3, length(vUv - 0.5) * 1.25); c *= mix(1.0 - vinheta, 1.0, v);
  c *= tom;
  gl_FragColor = linearToOutputTexel(vec4(c, 1.0));
}`;

export function criarRenderizador(canvas, cfg, perfil, modoInicial) {
  const [AW, AH] = cfg.resolucao.arte;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', alpha: false });
  renderer.setPixelRatio(1); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap; renderer.info.autoReset = false; renderer.setClearColor(0x000000, 1);
  let modo = modoInicial ?? cfg.resolucao.modo, rtCena = null, rtB0 = null, rtB1 = null;
  const quadMat = (frag, uniforms) => { const m = new THREE.ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: frag, depthTest: false, depthWrite: false }); return m; };
  const U = { tCena: { value: null }, tBloom: { value: null }, tEntrada: { value: null }, limiar: { value: 0.78 }, passo: { value: new THREE.Vector2() }, res: { value: new THREE.Vector2(AW, AH) }, foco: { value: 0.5 }, faixa: { value: 0.18 }, raioDof: { value: 3.2 }, bloomForca: { value: 0.55 }, vinheta: { value: 0 }, tom: { value: new THREE.Vector3(1, 1, 1) }, usaDof: { value: false }, usaBloom: { value: false } };
  const mBrilho = quadMat(FRAG_BRILHO, U), mBlur = quadMat(FRAG_BLUR, U), mFinal = quadMat(FRAG_FINAL, U);
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mBrilho); quad.frustumCulled = false; const cenaQ = new THREE.Scene(); cenaQ.add(quad); const camQ = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const est = { largura: 0, altura: 0, escala: 1, rw: AW, rh: AH, vx: 0, vy: 0, vw: AW, vh: AH, perdeuContexto: false, modo };

  function refazerAlvos() {
    for (const rt of [rtCena, rtB0, rtB1]) rt?.dispose();
    const filtro = modo === 'arte' ? THREE.NearestFilter : THREE.LinearFilter;
    rtCena = new THREE.WebGLRenderTarget(est.rw, est.rh, { minFilter: filtro, magFilter: filtro, depthBuffer: true, samples: perfil.msaa, generateMipmaps: false });
    const bw = Math.max(16, Math.round(est.rw / 4)), bh = Math.max(16, Math.round(est.rh / 4)), opB = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false, generateMipmaps: false };
    rtB0 = new THREE.WebGLRenderTarget(bw, bh, opB); rtB1 = new THREE.WebGLRenderTarget(bw, bh, opB); U.res.value.set(est.rw, est.rh);
  }
  /** Ajusta o buffer à janela (pixels de dispositivo) e recalcula tamanho de renderização, escala inteira e viewport. */
  function ajustar(cssW, cssH, dpr = 1) {
    const bw = Math.max(64, Math.round(cssW * dpr)), bh = Math.max(64, Math.round(cssH * dpr)); renderer.setSize(bw, bh, false);
    est.largura = bw; est.altura = bh; est.modo = modo;
    if (modo === 'arte') { const esc = Math.max(1, Math.floor(Math.min(bw / AW, bh / AH))); Object.assign(est, { escala: esc, rw: AW, rh: AH, vw: AW * esc, vh: AH * esc, vx: Math.floor((bw - AW * esc) / 2), vy: Math.floor((bh - AH * esc) / 2) }); }
    else { const ar = AW / AH, w = Math.min(bw, Math.round(bh * ar)), h = Math.round(w / ar); Object.assign(est, { escala: h / AH, rw: w, rh: h, vw: w, vh: h, vx: Math.floor((bw - w) / 2), vy: Math.floor((bh - h) / 2) }); }
    refazerAlvos();
  }
  const copiaMat = new THREE.MeshBasicMaterial();
  function desenhar(cena, camera, visual, focoY = 0.5) {
    renderer.info.reset();
    renderer.setRenderTarget(rtCena); renderer.setScissorTest(false); renderer.render(cena, camera);
    U.tom.value.set(visual.tom[0], visual.tom[1], visual.tom[2]); U.vinheta.value = perfil.pos_vinheta; U.foco.value = focoY; U.usaDof.value = perfil.pos_dof; U.usaBloom.value = perfil.pos_bloom;
    U.raioDof.value = 3.2 * (est.rh / AH); U.bloomForca.value = 0.35 + 0.55 * visual.luzArtificial;
    if (perfil.pos_bloom) {
      quad.material = mBrilho; U.tCena.value = rtCena.texture; renderer.setRenderTarget(rtB0); renderer.render(cenaQ, camQ);
      quad.material = mBlur; U.tEntrada.value = rtB0.texture; U.passo.value.set(1 / rtB0.width, 0); renderer.setRenderTarget(rtB1); renderer.render(cenaQ, camQ);
      U.tEntrada.value = rtB1.texture; U.passo.value.set(0, 1 / rtB1.height); renderer.setRenderTarget(rtB0); renderer.render(cenaQ, camQ); U.tBloom.value = rtB0.texture;
    }
    quad.material = mFinal; U.tCena.value = rtCena.texture;
    renderer.setRenderTarget(null); renderer.setScissorTest(false); renderer.setViewport(0, 0, est.largura, est.altura); renderer.clear();
    renderer.setViewport(est.vx, est.vy, est.vw, est.vh); renderer.render(cenaQ, camQ); void copiaMat;
  }
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); est.perdeuContexto = true; });
  canvas.addEventListener('webglcontextrestored', () => location.reload()); // recarrega a página (no M1 não há save a perder)
  return {
    renderer, estado: est, ajustar, desenhar,
    get escala() { return est.escala; }, get modo() { return modo; },
    definirModo(m, cssW, cssH, dpr) { modo = m; ajustar(cssW, cssH, dpr); },
    definirPerfil(p) { perfil = p; refazerAlvos(); },
    estatisticas: () => ({ chamadas: renderer.info.render.calls, triangulos: renderer.info.render.triangles, texturas: renderer.info.memory.textures, geometrias: renderer.info.memory.geometries }),
    infoGpu() { const gl = renderer.getContext(), e = gl.getExtension('WEBGL_debug_renderer_info'); return e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : 'desconhecida'; },
  };
}
