// Renderizador. Dois modos de resolução (ADR-002): "arte" = cena em 960×540 ampliada por vizinho mais próximo em escala INTEIRA
// (pixel de arte nítido, 2× em 1080p); "nativa" = cena na resolução da janela (3D liso). Pós em poucos passes: bloom em ¼ de resolução,
// tilt-shift (desfoque de maquete por faixa), vinheta e grade de cor do ciclo dia/noite. Única parte do jogo que fala com WebGL.
import * as THREE from 'three';

const VERT = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
const FRAG_BRILHO = 'varying vec2 vUv; uniform sampler2D tCena; uniform float limiar; void main(){ vec3 c = texture2D(tCena, vUv).rgb; float l = max(max(c.r, c.g), c.b); gl_FragColor = vec4(c * smoothstep(limiar, limiar + 0.35, l), 1.0); }';
const FRAG_BLUR = `varying vec2 vUv; uniform sampler2D tEntrada; uniform vec2 passo;
void main(){ vec3 s = texture2D(tEntrada, vUv).rgb * 0.227027; s += (texture2D(tEntrada, vUv + passo * 1.3846).rgb + texture2D(tEntrada, vUv - passo * 1.3846).rgb) * 0.316216; s += (texture2D(tEntrada, vUv + passo * 3.2308).rgb + texture2D(tEntrada, vUv - passo * 3.2308).rgb) * 0.070270; gl_FragColor = vec4(s, 1.0); }`;
const FRAG_FINAL = `varying vec2 vUv; uniform sampler2D tCena, tBloom; uniform vec2 res; uniform float foco, faixa, raioDof, bloomForca, vinheta, cobertura, nitidez; uniform vec3 tom, corCob;
// "sharp bilinear": a imagem de arte (ex. 960×540) ampliada em escala CONTÍNUA com pixels nítidos — platô de cada texel e transição de 1 pixel de tela nas bordas; escala inteira = vizinho mais próximo puro
vec2 amostraNitida(vec2 uv) {
  if (nitidez <= 1.0001) return uv;
  vec2 pix = uv * res;
  if (abs(nitidez - floor(nitidez + 0.5)) < 0.01) return (floor(pix) + 0.5) / res;
  vec2 faixaPlato = vec2(0.5 - 0.5 / nitidez), d = fract(pix) - 0.5, f = (d - clamp(d, -faixaPlato, faixaPlato)) * nitidez + 0.5;
  return (floor(pix) + f) / res;
} uniform bool usaDof, usaBloom;
void main(){
  vec2 uvN = amostraNitida(vUv);
  vec3 c = texture2D(tCena, uvN).rgb;
  if (usaDof) { // tilt-shift: nítido numa faixa horizontal em volta de 'foco', desfoca para cima e para baixo (efeito de maquete)
    float k = smoothstep(faixa, faixa + 0.32, abs(vUv.y - foco)) * raioDof;
    if (k > 0.05) { vec3 s = c; float n = 1.0; for (int i = 0; i < 8; i++) { float a = float(i) * 0.785398 + 0.3927; vec2 o = vec2(cos(a), sin(a)) * k / res; s += texture2D(tCena, uvN + o).rgb + texture2D(tCena, uvN + o * 0.5).rgb; n += 2.0; } c = s / n; }
  }
  if (usaBloom) c += texture2D(tBloom, vUv).rgb * bloomForca;
  float v = smoothstep(0.9, 0.3, length(vUv - 0.5) * 1.25); c *= mix(1.0 - vinheta, 1.0, v);
  c *= tom;
  c = mix(c, corCob, cobertura); // transição mapa ↔ batalha: cobre a tela com a cor da névoa (sem flash branco)
  gl_FragColor = linearToOutputTexel(vec4(c, 1.0));
}`;

export function criarRenderizador(canvas, cfg, perfil, modoInicial) {
  let [AW, AH] = cfg.resolucao.arte; const arteBase = [AW, AH];
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', alpha: false });
  renderer.setPixelRatio(1); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap; renderer.info.autoReset = false; renderer.setClearColor(0x000000, 1);
  let modo = modoInicial ?? cfg.resolucao.modo, rtCena = null, rtB0 = null, rtB1 = null;
  const quadMat = (frag, uniforms) => { const m = new THREE.ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: frag, depthTest: false, depthWrite: false }); return m; };
  const U = { tCena: { value: null }, tBloom: { value: null }, tEntrada: { value: null }, limiar: { value: 0.78 }, passo: { value: new THREE.Vector2() }, res: { value: new THREE.Vector2(AW, AH) }, foco: { value: 0.5 }, faixa: { value: 0.18 }, raioDof: { value: 3.2 }, bloomForca: { value: 0.55 }, vinheta: { value: 0 }, tom: { value: new THREE.Vector3(1, 1, 1) }, usaDof: { value: false }, usaBloom: { value: false }, cobertura: { value: 0 }, nitidez: { value: 1 }, corCob: { value: new THREE.Vector3(0.5, 0.45, 0.35) } };
  const mBrilho = quadMat(FRAG_BRILHO, U), mBlur = quadMat(FRAG_BLUR, U), mFinal = quadMat(FRAG_FINAL, U);
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mBrilho); quad.frustumCulled = false; const cenaQ = new THREE.Scene(); cenaQ.add(quad); const camQ = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const est = { largura: 0, altura: 0, escala: 1, rw: AW, rh: AH, vx: 0, vy: 0, vw: AW, vh: AH, perdeuContexto: false, modo };

  function refazerAlvos() {
    for (const rt of [rtCena, rtB0, rtB1]) rt?.dispose();
    const filtro = THREE.LinearFilter; // o "nítido" do modo arte é feito no shader final (amostraNitida)
    rtCena = new THREE.WebGLRenderTarget(est.rw, est.rh, { minFilter: filtro, magFilter: filtro, depthBuffer: true, samples: perfil.msaa, generateMipmaps: false });
    const bw = Math.max(16, Math.round(est.rw / 4)), bh = Math.max(16, Math.round(est.rh / 4)), opB = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false, generateMipmaps: false };
    rtB0 = new THREE.WebGLRenderTarget(bw, bh, opB); rtB1 = new THREE.WebGLRenderTarget(bw, bh, opB); U.res.value.set(est.rw, est.rh);
  }
  /** Ajusta o buffer à janela (pixels de dispositivo) e recalcula tamanho de renderização, escala inteira e viewport. */
  let ultimaJanela = [innerWidth, innerHeight, 1];
  function ajustar(cssW, cssH, dpr = 1) {
    ultimaJanela = [cssW, cssH, dpr];
    const bw = Math.max(64, Math.round(cssW * dpr)), bh = Math.max(64, Math.round(cssH * dpr)); renderer.setSize(bw, bh, false);
    est.largura = bw; est.altura = bh; est.modo = modo;
    // o jogo preenche a janela: maior retângulo 16:9 que cabe (escala CONTÍNUA). "arte": desenha na resolução de arte e amplia nítido; "nativa": desenha na resolução do retângulo
    const ar = AW / AH, w = Math.min(bw, Math.round(bh * ar)), h = Math.round(w / ar), vx = Math.floor((bw - w) / 2), vy = Math.floor((bh - h) / 2);
    if (modo === 'arte') Object.assign(est, { escala: w / AW, rw: AW, rh: AH, vw: w, vh: h, vx, vy });
    else Object.assign(est, { escala: h / AH, rw: w, rh: h, vw: w, vh: h, vx, vy });
    refazerAlvos();
  }
  const copiaMat = new THREE.MeshBasicMaterial();
  function desenhar(cena, camera, visual, focoY = 0.5, extra = {}) {
    renderer.info.reset();
    renderer.setRenderTarget(rtCena); renderer.setScissorTest(false); renderer.render(cena, camera);
    U.tom.value.set(visual.tom[0], visual.tom[1], visual.tom[2]); U.vinheta.value = perfil.pos_vinheta + (extra.vinhetaExtra ?? 0); U.nitidez.value = modo === 'arte' ? est.vw / est.rw : 1; U.foco.value = focoY; U.faixa.value = extra.faixa ?? 0.18; U.cobertura.value = extra.cobertura ?? 0; if (extra.corCobertura) U.corCob.value.set(...extra.corCobertura); U.usaDof.value = perfil.pos_dof; U.usaBloom.value = perfil.pos_bloom;
    U.raioDof.value = 3.2 * (est.rh / AH) * (extra.raioDofMult ?? 1); U.bloomForca.value = 0.35 + 0.55 * visual.luzArtificial;
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
    /** Resolução de ARTE por cena (batalha 640×360, mapa 960×540): refaz os alvos de desenho; a escala continua inteira. */
    definirArte(w, h) { if (w === AW && h === AH) return; AW = w; AH = h; ajustar(...ultimaJanela); },
    get arte() { return [AW, AH]; }, arteBase,
    estatisticas: () => ({ chamadas: renderer.info.render.calls, triangulos: renderer.info.render.triangles, texturas: renderer.info.memory.textures, geometrias: renderer.info.memory.geometries }),
    infoGpu() { const gl = renderer.getContext(), e = gl.getExtension('WEBGL_debug_renderer_info'); return e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : 'desconhecida'; },
  };
}
