// Spikes do ADR-001 — opção Three.js. Um arquivo para os 5 spikes, escolhidos por ?spike=.
// sprite | diorama | multidao | carregamento | audio   (ver spikes/README.md)
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { Pass, FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { parametros, PERFIS, iniciarLaco, medirNitidez, hud } from '../comum/laco.js';
import { criarSimulacao } from '../comum/simulacao.js';
import { criarAudio } from '../comum/audio.js';
import { praca as praçaDesc, chaoTiles, geometriaCaixas, geometriaChao, TOCHAS } from '../comum/cenario.js';

const P = parametros();
const perfil = { ...PERFIS[P.perfil] };
const posOverride = new URLSearchParams(location.search).get('pos'); // ex.: pos=dof,bloom,vol,nevoa
const POS = posOverride !== null ? new Set(posOverride.split(',').filter(Boolean))
  : new Set([perfil.dof !== 'nenhum' && 'dof', perfil.bloom && 'bloom', perfil.volumetrica && 'vol', 'nevoa', 'cor'].filter(Boolean));
const ASSETS = '../assets/';
const PITCH = THREE.MathUtils.degToRad(35);
const T0 = performance.now();
const estado = (window.__estado = { pronto: false, opcao: 'three', versao: THREE.REVISION, params: P, perfil, pos: [...POS] });

// ---------- Renderizador e resolução ----------
const baixa = P.res === 'baixa';
const iw = baixa ? Math.round(P.w / P.escala) : P.w, ih = baixa ? Math.round(P.h / P.escala) : P.h;
const ppu = baixa ? 32 : 32 * P.escala; // pixels por unidade (tile) na resolução interna
const canvas = document.getElementById('tela');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: !!P.teste });
renderer.setPixelRatio(1);
renderer.setSize(P.w, P.h, false);
renderer.info.autoReset = false;
const sombras = perfil.sombraSol > 0 && P.spike !== 'audio' && P.teste !== 'nitidez';
renderer.shadowMap.enabled = sombras;
renderer.shadowMap.type = THREE.PCFShadowMap;
const scene = new THREE.Scene();
scene.background = new THREE.Color(P.teste ? 0x204060 : 0x9fb4c8);

// ---------- Câmera 3/4 a 35°: ortográfica ou perspectiva de FOV estreito ----------
const FOV = 20;
const DIST = P.camera === 'orto' ? 40 : ih / (2 * ppu * Math.tan(THREE.MathUtils.degToRad(FOV / 2)));
const camera = P.camera === 'orto'
  ? new THREE.OrthographicCamera(-iw / 2 / ppu, iw / 2 / ppu, ih / 2 / ppu, -ih / 2 / ppu, 1, 120)
  : new THREE.PerspectiveCamera(FOV, iw / ih, 1, DIST + 60);
const frente = new THREE.Vector3(0, -Math.sin(PITCH), -Math.cos(PITCH));
const direita = new THREE.Vector3(1, 0, 0), cima = new THREE.Vector3().crossVectors(direita, frente); // +Y da câmera
const _alvo = new THREE.Vector3();
const ALT = 0.875; // centro do quad do herói acima dos pés, ao longo do 'cima' da câmera (o quad gira com ela)
const mirarHeroi = (x, z) => posicionarCamera(x + cima.x * ALT, cima.y * ALT, z + cima.z * ALT);
function posicionarCamera(x, y, z) {
  _alvo.set(x, y, z);
  if (P.snap) { // snap à grade de pixel interno, no plano da câmera
    const r = Math.round(_alvo.dot(direita) * ppu) / ppu, u = Math.round(_alvo.dot(cima) * ppu) / ppu, f = _alvo.dot(frente);
    _alvo.copy(direita).multiplyScalar(r).addScaledVector(cima, u).addScaledVector(frente, f);
  }
  camera.position.copy(_alvo).addScaledVector(frente, -DIST);
  camera.lookAt(_alvo);
}
posicionarCamera(0, 0, 0);

// ---------- Texturas ----------
const loader = new THREE.TextureLoader();
function textura(caminho, cor = true) {
  return new Promise((ok, erro) => loader.load(ASSETS + caminho, (t) => {
    t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false;
    t.colorSpace = cor ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    ok(t);
  }, undefined, erro));
}
async function folhaSprite(id) {
  const [map, normalMap, emissiveMap] = await Promise.all([
    textura(`sprites/${id}/${id}.png`), textura(`sprites/${id}/${id}_n.png`, false), textura(`sprites/${id}/${id}_e.png`),
  ]);
  const mat = P.teste === 'nitidez' && new URLSearchParams(location.search).get('luz') !== '1'
    ? new THREE.MeshBasicMaterial({ map, alphaTest: 0.5 })
    : new THREE.MeshStandardMaterial({ map, normalMap, emissiveMap, emissive: 0xffffff, emissiveIntensity: 1, alphaTest: 0.5, roughness: 0.85, metalness: 0 });
  mat.shadowSide = THREE.DoubleSide; // o quad só tem a face frontal: sem isto o sprite não projeta a sombra da silhueta
  return mat;
}

// ---------- Sprite como plano voltado à câmera, âncora nos pés (32,60) ----------
const COLS = 8, LINHAS = 3, EPS = 0; // sem recuo de UV: recuar muda a escala do sprite (nearest não sangra; a célula tem borda transparente)
function criarSprite(mat) {
  const g = new THREE.PlaneGeometry(2, 2); // 64 px = 2 tiles
  g.translate(0, 1 - (64 - 60) / 32, 0);
  const m = new THREE.Mesh(g, mat);
  m.castShadow = true;
  m.userData.quadro = -1;
  return m;
}
const DIR_LINHA = [0, 1, 2, 2]; // s, n, l, o(espelha l)
function definirQuadro(m, q, dir) {
  const chave = q * 4 + dir;
  if (m.userData.quadro === chave) return;
  m.userData.quadro = chave;
  const uv = m.geometry.attributes.uv, linha = DIR_LINHA[dir];
  let u0 = q / COLS + EPS, u1 = (q + 1) / COLS - EPS;
  if (dir === 3) [u0, u1] = [u1, u0];
  const v1 = 1 - linha / LINHAS - EPS, v0 = 1 - (linha + 1) / LINHAS + EPS;
  uv.setXY(0, u0, v1); uv.setXY(1, u1, v1); uv.setXY(2, u0, v0); uv.setXY(3, u1, v0);
  uv.needsUpdate = true;
}

// ---------- Kit de cenário (descrição em comum/cenario.js) ----------
function geoThree(g) {
  const bg = new THREE.BufferGeometry();
  bg.setAttribute('position', new THREE.BufferAttribute(g.pos, 3)); bg.setAttribute('normal', new THREE.BufferAttribute(g.nor, 3));
  bg.setAttribute('uv', new THREE.BufferAttribute(g.uv, 2)); bg.setIndex(new THREE.BufferAttribute(g.idx, 1));
  return bg;
}
const praca = () => praçaDesc().map((m) => ({ g: geoThree(geometriaCaixas(m.caixas)), oclusor: m.oclusor }));
const chao = () => geoThree(geometriaChao(chaoTiles()));

// Recorte do primeiro plano (pergunta 8 do 10): pontilhado em tela perto do herói, só em oclusores.
const uRecorte = { heroiTela: { value: new THREE.Vector2(-999, -999) }, raio: { value: 70 }, profHeroi: { value: 0 } };
function aplicarRecorte(mat) {
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, { uHeroiTela: uRecorte.heroiTela, uRaio: uRecorte.raio, uProfHeroi: uRecorte.profHeroi });
    sh.fragmentShader = 'uniform vec2 uHeroiTela; uniform float uRaio; uniform float uProfHeroi;\n' + sh.fragmentShader.replace('void main() {', `void main() {
      { vec2 d = gl_FragCoord.xy - uHeroiTela; float bayer = mod(floor(gl_FragCoord.x) + floor(gl_FragCoord.y) * 2.0, 4.0) / 4.0;
        if (dot(d, d) < uRaio * uRaio && gl_FragCoord.z < uProfHeroi && bayer < 0.6) discard; }`);
  };
  mat.customProgramCacheKey = () => 'recorte';
}

// ---------- Pós-processamento ----------
class PassoShader extends Pass {
  constructor(frag, uniforms) {
    super();
    this.uniforms = { tCor: { value: null }, tProf: { value: null }, resolucao: { value: new THREE.Vector2(iw, ih) }, ...uniforms };
    this.quad = new FullScreenQuad(new THREE.ShaderMaterial({
      uniforms: this.uniforms, depthTest: false, depthWrite: false,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: frag,
    }));
  }
  render(r, escrita, leitura) {
    this.uniforms.tCor.value = leitura.texture; this.uniforms.tProf.value = leitura.depthTexture;
    r.setRenderTarget(this.renderToScreen ? null : escrita);
    this.quad.render(r);
  }
}
const LINEARIZA = `uniform float perto, longe; uniform bool orto;
  float profLinear(float d){ return orto ? perto + d * (longe - perto) : (perto * longe) / (longe - d * (longe - perto)); }`;
function passoDof(modo) {
  const taps = modo === 'completo' ? 24 : 8;
  return new PassoShader(`varying vec2 vUv; uniform sampler2D tCor, tProf; uniform vec2 resolucao; uniform float foco, faixa, raioMax; ${LINEARIZA}
    void main(){
      vec4 c = texture2D(tCor, vUv);
      float coc;
      ${modo === 'completo'
        ? 'coc = clamp(abs(profLinear(texture2D(tProf, vUv).x) - foco) / faixa, 0.0, 1.0);'
        : 'coc = clamp((abs(vUv.y - 0.5) - 0.22) / 0.25, 0.0, 1.0);'} // tilt-shift: só pela altura na tela
      if (coc < 0.01) { gl_FragColor = c; return; }
      vec3 soma = c.rgb; float peso = 1.0;
      for (int i = 0; i < ${taps}; i++) {
        float a = float(i) * 2.39996, r = sqrt(float(i) + 0.5) / sqrt(${taps}.0);
        vec2 o = vec2(cos(a), sin(a)) * r * raioMax * coc / resolucao;
        soma += texture2D(tCor, vUv + o).rgb; peso += 1.0;
      }
      gl_FragColor = vec4(soma / peso, 1.0);
    }`, { foco: { value: DIST }, faixa: { value: 9 }, raioMax: { value: 6 * (iw / 640) }, perto: { value: camera.near }, longe: { value: camera.far }, orto: { value: P.camera === 'orto' } });
}
function passoVolumetrica() { // raios de luz em espaço de tela (borrão radial das áreas claras)
  return new PassoShader(`varying vec2 vUv; uniform sampler2D tCor; uniform vec2 centro; uniform float forca;
    void main(){
      vec4 c = texture2D(tCor, vUv); vec2 d = (vUv - centro) / 32.0; vec2 uv = vUv; vec3 acc = vec3(0.0); float dec = 1.0;
      for (int i = 0; i < 32; i++) { uv -= d; vec3 s = texture2D(tCor, uv).rgb; acc += max(s - 0.75, 0.0) * dec; dec *= 0.95; }
      gl_FragColor = vec4(c.rgb + acc * forca / 32.0 * 4.0, 1.0);
    }`, { centro: { value: new THREE.Vector2(0.15, 1.1) }, forca: { value: 0.6 } });
}
function passoCor() { // cor por região + vinheta
  return new PassoShader(`varying vec2 vUv; uniform sampler2D tCor; uniform vec3 ganho, elevacao; uniform float vinheta;
    void main(){
      vec3 c = texture2D(tCor, vUv).rgb; c = c * ganho + elevacao * (1.0 - c);
      float v = smoothstep(0.85, 0.35, length(vUv - 0.5) * 1.2); c *= mix(1.0 - vinheta, 1.0, v);
      gl_FragColor = vec4(c, 1.0);
    }`, { ganho: { value: new THREE.Vector3(1.04, 1.0, 0.95) }, elevacao: { value: new THREE.Vector3(0.02, 0.02, 0.05) }, vinheta: { value: 0.35 } });
}

function montarComposer() {
  const rt = new THREE.WebGLRenderTarget(iw, ih, {
    type: THREE.HalfFloatType, samples: baixa ? 0 : perfil.msaa,
    minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthTexture: new THREE.DepthTexture(iw, ih),
  });
  const comp = new EffectComposer(renderer, rt);
  comp.setPixelRatio(1); comp.setSize(iw, ih);
  comp.addPass(new RenderPass(scene, camera));
  const passos = {};
  if (POS.has('dof')) comp.addPass((passos.dof = passoDof(perfil.dof === 'nenhum' ? 'completo' : perfil.dof)));
  if (POS.has('vol')) comp.addPass((passos.vol = passoVolumetrica()));
  if (POS.has('bloom')) comp.addPass(new UnrealBloomPass(new THREE.Vector2(iw * (perfil.bloom || 1), ih * (perfil.bloom || 1)), 0.5, 0.4, 0.85));
  if (POS.has('cor')) comp.addPass(passoCor());
  comp.addPass(new OutputPass());
  return { comp, passos };
}

// Saída sem pós (teste de nitidez): resolução baixa vai para um alvo e é escalada com vizinho mais próximo.
let rtBaixa, quadCopia;
function desenharDireto() {
  if (!baixa) { renderer.setRenderTarget(null); renderer.render(scene, camera); return; }
  if (!rtBaixa) {
    rtBaixa = new THREE.WebGLRenderTarget(iw, ih, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
    quadCopia = new FullScreenQuad(new THREE.MeshBasicMaterial({ map: rtBaixa.texture }));
  }
  renderer.setRenderTarget(rtBaixa); renderer.render(scene, camera);
  renderer.setRenderTarget(null); quadCopia.render(renderer);
}

// ---------- Luzes ----------
function luzes(n) {
  scene.add(new THREE.HemisphereLight(0xc8d8f0, 0x504030, 0.7));
  const sol = new THREE.DirectionalLight(0xfff0d8, 1.6);
  sol.position.set(-8, 14, 6); sol.target.position.set(0, 0, 0);
  if (sombras) {
    sol.castShadow = true; sol.shadow.mapSize.set(perfil.sombraSol, perfil.sombraSol);
    Object.assign(sol.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 1, far: 40 });
    sol.shadow.bias = -0.0005; sol.shadow.normalBias = 0.02;
  }
  scene.add(sol, sol.target);
  const tochas = [];
  for (let i = 0; i < n; i++) {
    const [x, z] = TOCHAS[i % TOCHAS.length];
    const l = new THREE.PointLight(0xffa050, 6, 7, 2);
    l.position.set(x + (i >= TOCHAS.length ? 0.5 : 0), 2.1, z);
    if (sombras && i < perfil.luzesComSombra) { l.castShadow = true; l.shadow.mapSize.set(perfil.sombraPontual, perfil.sombraPontual); l.shadow.bias = -0.002; }
    scene.add(l); tochas.push(l);
  }
  return { sol, tochas };
}

// Sombras de contato (todos os perfis): instâncias de um blob no chão.
async function criarSombrasContato(n) {
  const map = await textura('fx/fx_sombra_contato.png');
  const m = new THREE.InstancedMesh(new THREE.PlaneGeometry(1.1, 0.55).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false }), n);
  m.renderOrder = 1; scene.add(m);
  return m;
}
const _m4 = new THREE.Matrix4();
function posicionarInstancia(inst, i, x, y, z) { _m4.makeTranslation(x, y, z); inst.setMatrixAt(i, _m4); }

// Partículas: Points emissivos (1 chamada) ou quads iluminados instanciados.
async function criarParticulas(n, iluminadas) {
  const map = await textura('fx/fx_placeholder_brasa.png');
  if (iluminadas) {
    const m = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.25, 0.25), new THREE.MeshStandardMaterial({ map, alphaTest: 0.5, roughness: 1 }), n);
    m.frustumCulled = false; scene.add(m);
    return { tipo: 'inst', m };
  }
  const pos = new Float32Array(n * 3);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(g, new THREE.PointsMaterial({ map, size: 8 * (baixa ? 1 : P.escala), sizeAttenuation: false, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, alphaTest: 0.1 }));
  pts.frustumCulled = false; scene.add(pts);
  return { tipo: 'pts', m: pts, pos };
}
function moverParticulas(p, i, x, y, z) {
  if (p.tipo === 'pts') { p.pos[i * 3] = x; p.pos[i * 3 + 1] = y; p.pos[i * 3 + 2] = z; }
  else { _m4.makeRotationFromQuaternion(camera.quaternion).setPosition(x, y, z); p.m.setMatrixAt(i, _m4); }
}
function fimParticulas(p) { if (p.tipo === 'pts') p.m.geometry.attributes.position.needsUpdate = true; else p.m.instanceMatrix.needsUpdate = true; }

// ---------- Montagem por spike ----------
async function montar() {
  if (P.spike === 'audio') return montarAudio();
  if (P.teste !== 'nitidez') { scene.fog = POS.has('nevoa') ? new THREE.Fog(0x9fb4c8, DIST + 4, DIST + 30) : null; }
  const atlas = P.teste === 'nitidez' ? null : await Promise.all([textura('env/atlas_placeholder.png'), textura('env/atlas_placeholder_n.png', false)]);
  const matCenario = atlas && new THREE.MeshStandardMaterial({ map: atlas[0], normalMap: atlas[1], roughness: 0.9 });
  const matOclusor = atlas && matCenario.clone();
  if (matOclusor && P.recorte) aplicarRecorte(matOclusor);

  const ids = ['hero_placeholder', 'enemy_placeholder_a', 'enemy_placeholder_b', 'enemy_placeholder_c', 'enemy_placeholder_d', 'enemy_placeholder_e'];
  const mats = await Promise.all((P.spike === 'multidao' || P.spike === 'carregamento' ? ids : ids.slice(0, 1)).map(folhaSprite));
  const heroi = criarSprite(mats[0]); scene.add(heroi);

  let audio = null;
  if (P.spike === 'carregamento') { // áudio inicial real: 1 música + 20 SFX (orçamento ≤ 2,5 MB)
    audio = criarAudio();
    const nomes = ['mus_placeholder_camada_a.ogg', ...Array.from({ length: 20 }, (_, k) => `sfx/sfx_placeholder_${String(k).padStart(2, '0')}.ogg`)];
    estado.bytesAudio = 0;
    await Promise.all(nomes.map(async (n) => { const b = await (await fetch(ASSETS + 'audio/' + n)).arrayBuffer(); estado.bytesAudio += b.byteLength; await audio.ctx.decodeAudioData(b); }));
  }

  // --- Spike 1: sprite iluminado / teste de nitidez ---
  if (P.spike === 'sprite') {
    const luzSprite = new URLSearchParams(location.search).get('luz') === '1';
    if (P.teste !== 'nitidez' || luzSprite) {
      scene.add(new THREE.HemisphereLight(0xc8d8f0, 0x504030, 0.35));
      const sol = new THREE.DirectionalLight(0xfff0d8, 1.6); sol.position.set(-6, 10, 5);
      if (sombras) { sol.castShadow = true; sol.shadow.mapSize.set(perfil.sombraSol, perfil.sombraSol); Object.assign(sol.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6 }); }
      scene.add(sol);
    }
    if (P.teste !== 'nitidez') {
      const piso = new THREE.Mesh(new THREE.PlaneGeometry(14, 14).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x6a7a5a, roughness: 1 }));
      piso.receiveShadow = true; scene.add(piso);
    }
    const tocha = new THREE.PointLight(0xffa050, 8, 6, 2);
    if (sombras && perfil.luzesComSombra) { tocha.castShadow = true; tocha.shadow.mapSize.set(perfil.sombraPontual, perfil.sombraPontual); }
    if (P.teste !== 'nitidez' || luzSprite) scene.add(tocha);
    const contato = await criarSombrasContato(1);
    if (P.teste === 'nitidez') contato.visible = false;
    // Sprite fora do centro: em perspectiva a escala só é inteira no ponto focal.
    const ox = P.teste === 'nitidez' ? Number(new URLSearchParams(location.search).get('ox') || 0) : 0;
    const oz = Number(new URLSearchParams(location.search).get('oz') || 0);
    heroi.position.set(ox, 0, oz); definirQuadro(heroi, 0, 0);
    posicionarInstancia(contato, 0, ox, 0.01, oz); contato.instanceMatrix.needsUpdate = true;
    let t = 0, cx = 0;
    const sim = (dt) => { t += dt; if (P.mover) cx += 0.37 / ppu; tocha.position.set(Math.cos(t) * 1.6 + ox, 1.2, Math.sin(t) * 1.6 + 0.4 + oz); };
    const desenhar = () => {
      mirarHeroi(cx, 0); // foco fixo na origem; o sprite pode estar em outra profundidade (oz)
      heroi.quaternion.copy(camera.quaternion);
            desenharDireto();
    };
    return { sim, desenhar, extra: { ox } };
  }

  // --- Spikes 2/3/4: diorama, multidão, carregamento ---
  const mods = praca();
  for (const { g, oclusor } of mods) {
    const m = new THREE.Mesh(g, oclusor ? matOclusor : matCenario);
    m.castShadow = true; m.receiveShadow = true; scene.add(m);
  }
  estado.modulos = mods.length;
  const piso = new THREE.Mesh(chao(), matCenario); piso.receiveShadow = true; scene.add(piso);
  const { tochas } = luzes(P.luzes);
  const multidao = P.spike !== 'diorama';
  const sim = criarSimulacao({ inimigos: multidao ? 40 : 0, projeteis: multidao ? 150 : 0 });
  const inimigos = [];
  for (let i = 0; i < sim.E.n; i++) { const s = criarSprite(mats[1 + (i % 5)].clone()); scene.add(s); inimigos.push(s); }
  // materiais clonados com o mesmo programa: cada inimigo pode ter o próprio quadro sem trocar shader
  const contato = await criarSombrasContato(1 + sim.E.n);
  const nAmb = perfil.particulas;
  const amb = await criarParticulas(nAmb, false);
  const proj = multidao ? await criarParticulas(sim.P.n, P.partIlum) : null;
  const ambSem = new Float32Array(nAmb * 3).map((_, i) => ((i * 7919) % 1000) / 1000);
  let t = 0;
  const passo = (dt) => {
    t += dt; sim.passo(dt);
    for (let i = 0; i < tochas.length; i++) tochas[i].intensity = 6 + Math.sin(t * 13 + i * 2.1) * 0.6 + Math.sin(t * 7.3 + i) * 0.4;
  };
  const _v = new THREE.Vector3();
  const desenhar = (alfa) => {
    const hx = multidao ? sim.heroi.x : Math.cos(t * 0.4) * 2.5, hz = multidao ? sim.heroi.z : Math.sin(t * 0.4) * 2.5;
    heroi.position.set(hx, 0, hz);
    definirQuadro(heroi, Math.floor(t * 10) % 8, 0);
    if (P.mover) mirarHeroi(hx, hz); else mirarHeroi(0, 0);
    heroi.quaternion.copy(camera.quaternion);
    posicionarInstancia(contato, 0, hx, 0.01, hz);
    for (let i = 0; i < inimigos.length; i++) {
      const s = inimigos[i]; s.position.set(sim.E.x[i], 0, sim.E.z[i]); s.quaternion.copy(camera.quaternion);
      definirQuadro(s, Math.floor(sim.E.quadro[i]), sim.E.dir[i]);
      posicionarInstancia(contato, i + 1, sim.E.x[i], 0.01, sim.E.z[i]);
    }
    contato.instanceMatrix.needsUpdate = true;
    for (let i = 0; i < nAmb; i++) {
      const a = ambSem[i * 3] * 6.283 + t * 0.2, r = 2 + ambSem[i * 3 + 1] * 10;
      moverParticulas(amb, i, Math.cos(a) * r, 0.3 + ((ambSem[i * 3 + 2] * 3 + t * 0.3) % 3), Math.sin(a) * r);
    }
    fimParticulas(amb);
    if (proj) { for (let k = 0; k < sim.P.n; k++) moverParticulas(proj, k, sim.P.x[k], sim.P.vida[k] > 0 ? sim.P.y[k] : -50, sim.P.z[k]); fimParticulas(proj); }
    // recorte: posição do herói na tela (pixels do alvo interno)
    _v.set(hx, 0.9, hz).project(camera);
    uRecorte.heroiTela.value.set((_v.x * 0.5 + 0.5) * iw, (_v.y * 0.5 + 0.5) * ih);
    uRecorte.raio.value = 2.2 * ppu; uRecorte.profHeroi.value = _v.z * 0.5 + 0.5;
    if (composer.passos.dof) composer.passos.dof.uniforms.foco.value = camera.position.distanceTo(heroi.position);
    composer.comp.render();
  };
  const composer = montarComposer();
  return { sim: passo, desenhar, audio };
}

function montarAudio() {
  const a = criarAudio();
  const botao = document.createElement('button');
  botao.id = 'comecar'; botao.textContent = 'Pressione para começar';
  document.body.appendChild(botao);
  botao.addEventListener('click', async () => { botao.remove(); estado.audio = await a.rodarTestes(); estado.audioPronto = true; });
  estado.audioInicial = a.ctx.state;
  window.__audio = a;
  return { sim: () => {}, desenhar: () => {}, audio: a };
}

// ---------- Execução ----------
const gl = renderer.getContext();
const SINCRONIZAR = new URLSearchParams(location.search).get('sync') !== '0';
const cena = await montar();
if (P.spike !== 'audio') renderer.compile(scene, camera);
const medidor = iniciarLaco({
  simular: cena.sim,
  desenhar: (alfa, m) => {
    renderer.info.reset();
    cena.desenhar(alfa);
    if (SINCRONIZAR) gl.finish(); // sem isso o rAF sem limite de vsync mede só a CPU
    m.chamadas = renderer.info.render.calls; m.triangulos = renderer.info.render.triangles;
    if (!estado.pronto) {
      estado.pronto = true; estado.primeiraTelaMs = Math.round(performance.now());
      estado.montagemMs = Math.round(performance.now() - T0);
    }
  },
});
estado.nitidez = (fundo = [0x20, 0x40, 0x60]) => {
  // caixa do sprite em pixels da tela final
  const s = scene.children.find((o) => o.isMesh && o.geometry.type === 'PlaneGeometry');
  s.geometry.computeBoundingBox();
  const bb = s.geometry.boundingBox, cantos = [];
  for (const x of [bb.min.x, bb.max.x]) for (const y of [bb.min.y, bb.max.y]) cantos.push(new THREE.Vector3(x, y, 0).applyMatrix4(s.matrixWorld).project(camera));
  const xs = cantos.map((c) => (c.x * 0.5 + 0.5) * P.w), ys = cantos.map((c) => (1 - (c.y * 0.5 + 0.5)) * P.h);
  const caixa = { x: Math.floor(Math.min(...xs)) - 2, y: Math.floor(Math.min(...ys)) - 2 };
  caixa.w = Math.ceil(Math.max(...xs)) + 2 - caixa.x; caixa.h = Math.ceil(Math.max(...ys)) + 2 - caixa.y;
  return { caixa, ...medirNitidez(canvas, caixa, P.escala, fundo) };
};
estado.info = () => ({ ...renderer.info.memory, programas: renderer.info.programs?.length, internaResolucao: [iw, ih] });
if (new URLSearchParams(location.search).get('hud') !== '0') setInterval(() => { const r = medidor.n > 10 ? medidor.resultado() : {}; hud(`three r${THREE.REVISION} · ${P.spike} · ${P.perfil} · ${iw}×${ih}\nfps ${r.fpsMedio ?? '-'} · chamadas ${medidor.chamadas}`); }, 1000);
