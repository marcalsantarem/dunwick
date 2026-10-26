// Spikes do ADR-001 — opção Babylon.js. Mesmos spikes, mesmos placeholders, mesmo laço e medidor da opção Three.js.
// Importações por caminho (tree-shaking) para que o peso do download seja comparável.
import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { Vector3, Matrix, Quaternion, Color3, Color4 } from '@babylonjs/core/Maths/math';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { Camera } from '@babylonjs/core/Cameras/camera';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { PointLight } from '@babylonjs/core/Lights/pointLight';
import { ShadowGenerator } from '@babylonjs/core/Lights/Shadows/shadowGenerator';
import '@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import { VertexBuffer } from '@babylonjs/core/Buffers/buffer';
import '@babylonjs/core/Meshes/thinInstanceMesh';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { Constants } from '@babylonjs/core/Engines/constants';
import { DefaultRenderingPipeline } from '@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/defaultRenderingPipeline';
import '@babylonjs/core/PostProcesses/RenderPipeline/postProcessRenderPipelineManagerSceneComponent';
import { VolumetricLightScatteringPostProcess } from '@babylonjs/core/PostProcesses/volumetricLightScatteringPostProcess';
import '@babylonjs/core/Rendering/depthRendererSceneComponent';
import { SceneInstrumentation } from '@babylonjs/core/Instrumentation/sceneInstrumentation';
import { parametros, PERFIS, iniciarLaco, medirNitidez, hud } from '../comum/laco.js';
import { criarSimulacao } from '../comum/simulacao.js';
import { criarAudio } from '../comum/audio.js';
import { praca as praçaDesc, chaoTiles, geometriaCaixas, geometriaChao, TOCHAS } from '../comum/cenario.js';

const P = parametros();
const perfil = { ...PERFIS[P.perfil] };
const Q = new URLSearchParams(location.search);
const posOverride = Q.get('pos');
const POS = posOverride !== null ? new Set(posOverride.split(',').filter(Boolean))
  : new Set([perfil.dof !== 'nenhum' && 'dof', perfil.bloom && 'bloom', perfil.volumetrica && 'vol', 'nevoa', 'cor'].filter(Boolean));
const ASSETS = '../assets/';
const PITCH = (35 * Math.PI) / 180;
const T0 = performance.now();
const estado = (window.__estado = { pronto: false, opcao: 'babylon', versao: Engine.Version, params: P, perfil, pos: [...POS] });

const baixa = P.res === 'baixa';
const iw = baixa ? Math.round(P.w / P.escala) : P.w, ih = baixa ? Math.round(P.h / P.escala) : P.h;
const ppu = baixa ? 32 : 32 * P.escala;
const canvas = document.getElementById('tela');
canvas.width = P.w; canvas.height = P.h;
const engine = new Engine(canvas, false, { preserveDrawingBuffer: !!P.teste, powerPreference: 'high-performance', stencil: false }, false);
engine.setHardwareScalingLevel(baixa ? P.escala : 1); // buffer 640×360 esticado pelo navegador (CSS pixelated)
engine.setSize(iw, ih);
const scene = new Scene(engine); window.__scene = scene;
scene.useRightHandedSystem = true; // mesma convenção de eixos da opção Three.js
scene.clearColor = P.teste ? new Color4(0x20 / 255, 0x40 / 255, 0x60 / 255, 1) : new Color4(0x9f / 255, 0xb4 / 255, 0xc8 / 255, 1);
scene.skipPointerMovePicking = true; scene.autoClear = true; scene.blockMaterialDirtyMechanism = false;
const sombras = perfil.sombraSol > 0 && P.spike !== 'audio' && P.teste !== 'nitidez';

// ---------- Câmera ortográfica 35° (o spike de nitidez mostrou que perspectiva só é nítida no plano focal) ----------
const DIST = 40;
const camera = new FreeCamera('cam', new Vector3(0, 10, 10), scene);
camera.mode = Camera.ORTHOGRAPHIC_CAMERA;
camera.orthoLeft = -iw / 2 / ppu; camera.orthoRight = iw / 2 / ppu; camera.orthoTop = ih / 2 / ppu; camera.orthoBottom = -ih / 2 / ppu;
camera.minZ = 1; camera.maxZ = 120;
const frente = new Vector3(0, -Math.sin(PITCH), -Math.cos(PITCH)), direita = new Vector3(1, 0, 0), cima = new Vector3(0, Math.cos(PITCH), -Math.sin(PITCH));
const ALT = 0.875;
function posicionarCamera(x, y, z) {
  let r = x * direita.x + y * direita.y + z * direita.z, u = x * cima.x + y * cima.y + z * cima.z;
  const f = x * frente.x + y * frente.y + z * frente.z;
  if (P.snap) { r = Math.round(r * ppu) / ppu; u = Math.round(u * ppu) / ppu; }
  const tx = direita.x * r + cima.x * u + frente.x * f, ty = direita.y * r + cima.y * u + frente.y * f, tz = direita.z * r + cima.z * u + frente.z * f;
  camera.position.set(tx - frente.x * DIST, ty - frente.y * DIST, tz - frente.z * DIST);
  camera.setTarget(new Vector3(tx, ty, tz));
}
const mirarHeroi = (x, z) => posicionarCamera(x + cima.x * ALT, cima.y * ALT, z + cima.z * ALT);
mirarHeroi(0, 0);
const rotCam = Quaternion.RotationAxis(new Vector3(1, 0, 0), -PITCH); // orientação fixa dos sprites

// ---------- Texturas e materiais ----------
const tex = (c, cor = true) => { const t = new Texture(ASSETS + c, scene, true, true, Texture.NEAREST_NEAREST); t.wrapU = t.wrapV = Texture.CLAMP_ADDRESSMODE; return new Promise((ok) => t.onLoadObservable.addOnce(() => ok(t))); };
async function matSprite(id) {
  const [d, n, e] = await Promise.all([tex(`sprites/${id}/${id}.png`), tex(`sprites/${id}/${id}_n.png`, false), tex(`sprites/${id}/${id}_e.png`)]);
  const m = new StandardMaterial('spr_' + id, scene);
  m.diffuseTexture = d; m.diffuseTexture.hasAlpha = true; m.useAlphaFromDiffuseTexture = true;
  m.transparencyMode = StandardMaterial.MATERIAL_ALPHATEST; m.alphaCutOff = 0.5;
  m.specularColor = Color3.Black(); m.maxSimultaneousLights = 16; m.backFaceCulling = false;
  if (!(P.teste === 'nitidez' && Q.get('luz') !== '1')) { m.bumpTexture = n; m.bumpTexture.level = 1; m.emissiveTexture = e; m.emissiveColor = Color3.White(); }
  else { m.disableLighting = true; m.emissiveTexture = d; m.emissiveColor = Color3.White(); }
  return m;
}
const COLS = 8, LINHAS = 3, DIR_LINHA = [0, 1, 2, 2];
function criarSprite(mat) {
  const m = new Mesh('spr', scene), vd = new VertexData();
  vd.positions = [-1, -0.125, 0, 1, -0.125, 0, -1, 1.875, 0, 1, 1.875, 0]; // 64 px = 2 tiles, âncora nos pés (32,60)
  vd.normals = [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1]; vd.uvs = [0, 0, 1, 0, 0, 1, 1, 1]; vd.indices = [0, 1, 2, 1, 3, 2];
  vd.applyToMesh(m, true);
  m.material = mat; m.rotationQuaternion = rotCam.clone(); m.userData = { quadro: -1 };
  return m;
}
function definirQuadro(m, q, dir) {
  if (Q.get('noquad') === '1') return; // diagnóstico
  const chave = q * 4 + dir; if (m.userData.quadro === chave) return; m.userData.quadro = chave;
  const linha = DIR_LINHA[dir]; let u0 = q / COLS, u1 = (q + 1) / COLS; if (dir === 3) [u0, u1] = [u1, u0];
  const v1 = 1 - linha / LINHAS, v0 = 1 - (linha + 1) / LINHAS;
  m.updateVerticesData(VertexBuffer.UVKind, [u0, v0, u1, v0, u0, v1, u1, v1]);
}
function meshDe(g, nome, mat) {
  const m = new Mesh(nome, scene), vd = new VertexData();
  const ix = g.idx.slice(); if (Q.get('winding') !== '0') for (let i = 0; i < ix.length; i += 3) { const t = ix[i + 1]; ix[i + 1] = ix[i + 2]; ix[i + 2] = t; } // Babylon: face frontal = sentido oposto ao da opção Three
  vd.positions = g.pos; vd.normals = g.nor; vd.uvs = g.uv; vd.indices = ix; vd.applyToMesh(m);
  m.material = mat; m.receiveShadows = true; m.freezeWorldMatrix(); return m;
}

// ---------- Luzes ----------
let solLuz = null, gerSol = null; const geradores = [];
function luzes(n) {
  const h = new HemisphericLight('h', new Vector3(0, 1, 0), scene); h.intensity = 0.8; h.diffuse = new Color3(0.78, 0.85, 0.94); h.groundColor = new Color3(0.31, 0.25, 0.19);
  solLuz = new DirectionalLight('sol', new Vector3(8, -14, -6).normalize(), scene);
  solLuz.position = new Vector3(-8, 14, 6); solLuz.intensity = 1.9; solLuz.diffuse = new Color3(1, 0.94, 0.85);
  solLuz.autoUpdateExtends = false; Object.assign(solLuz, { orthoLeft: -16, orthoRight: 16, orthoTop: 16, orthoBottom: -16, shadowMinZ: 1, shadowMaxZ: 40 });
  if (sombras) { gerSol = new ShadowGenerator(perfil.sombraSol, solLuz); gerSol.usePercentageCloserFiltering = true; gerSol.bias = 0.0005; gerSol.normalBias = 0.02; geradores.push(gerSol); }
  const tochas = [];
  for (let i = 0; i < n; i++) {
    const [x, z] = TOCHAS[i % TOCHAS.length];
    const l = new PointLight('t' + i, new Vector3(x + (i >= TOCHAS.length ? 0.5 : 0), 2.1, z), scene);
    l.diffuse = new Color3(1, 0.63, 0.31); l.intensity = 6; l.range = 7;
    if (sombras && i < perfil.luzesComSombra) { const g = new ShadowGenerator(perfil.sombraPontual, l); g.usePercentageCloserFiltering = true; g.bias = 0.002; geradores.push(g); }
    tochas.push(l);
  }
  return tochas;
}

// ---------- Sombras de contato e partículas (thin instances: 1 chamada) ----------
async function quadInstanciado(nome, arq, n, w, h, { aditivo = false, aceitaLuz = false, deitado = false } = {}) {
  const t = await tex(arq);
  const m = MeshBuilder.CreatePlane(nome, { width: w, height: h }, scene);
  if (deitado) { m.bakeTransformIntoVertices(Matrix.RotationX(Math.PI / 2)); }
  const mat = new StandardMaterial(nome, scene); mat.diffuseTexture = t; mat.diffuseTexture.hasAlpha = true; mat.useAlphaFromDiffuseTexture = true;
  mat.specularColor = Color3.Black(); mat.backFaceCulling = false;
  if (!aceitaLuz) { mat.disableLighting = true; mat.emissiveTexture = t; mat.emissiveColor = Color3.White(); }
  mat.maxSimultaneousLights = 16;
  if (aditivo) { mat.alphaMode = Constants.ALPHA_ADD; mat.disableDepthWrite = true; mat.transparencyMode = StandardMaterial.MATERIAL_ALPHABLEND; }
  else if (deitado) { mat.transparencyMode = StandardMaterial.MATERIAL_ALPHABLEND; mat.disableDepthWrite = true; }
  else { mat.transparencyMode = StandardMaterial.MATERIAL_ALPHATEST; mat.alphaCutOff = 0.5; }
  m.material = mat; m.alwaysSelectAsActiveMesh = true; m.isPickable = false;
  const buf = new Float32Array(16 * n); for (let i = 0; i < n; i++) { buf.set(Matrix.Identity().asArray(), i * 16); }
  m.thinInstanceSetBuffer('matrix', buf, 16, false);
  const rot = new Matrix(); rotCam.toRotationMatrix(rot);
  return { m, buf, n, rot };
}
const _mat = new Matrix();
function colocar(q, i, x, y, z, camada = false) {
  if (camada) { Matrix.TranslationToRef(x, y, z, _mat); } else { _mat.copyFrom(q.rot); _mat.setTranslationFromFloats(x, y, z); }
  _mat.copyToArray(q.buf, i * 16);
}
const atualizar = (q) => { if (Q.get('nothin') !== '1') q.m.thinInstanceBufferUpdated('matrix'); };

// ---------- Pós-processamento ----------
let pipeline = null;
function montarPos(tochas) {
  if (!POS.size) return;
  scene.imageProcessingConfiguration.toneMappingEnabled = false;
  if (POS.has('dof') || POS.has('bloom') || POS.has('cor')) {
    pipeline = new DefaultRenderingPipeline('pos', true, scene, [camera]);
    pipeline.samples = baixa ? 1 : perfil.msaa || 1; pipeline.fxaaEnabled = false;
    pipeline.bloomEnabled = POS.has('bloom'); if (pipeline.bloomEnabled) { pipeline.bloomThreshold = 0.8; pipeline.bloomWeight = 0.5 * (perfil.bloom || 1); pipeline.bloomKernel = 48; pipeline.bloomScale = 0.5; }
    pipeline.depthOfFieldEnabled = POS.has('dof');
    if (pipeline.depthOfFieldEnabled) { pipeline.depthOfFieldBlurLevel = perfil.dof === 'completo' || P.perfil === 'alto' ? 2 : 0; pipeline.depthOfField.focusDistance = DIST * 1000; pipeline.depthOfField.focalLength = 150; pipeline.depthOfField.fStop = 0.8; }
    scene.imageProcessingConfiguration.vignetteEnabled = POS.has('cor'); scene.imageProcessingConfiguration.vignetteWeight = 2.2; scene.imageProcessingConfiguration.vignetteColor = new Color4(0, 0, 0, 0);
  }
  if (POS.has('vol')) {
    const proxy = MeshBuilder.CreateSphere('sol_proxy', { diameter: 2 }, scene); proxy.position = new Vector3(-8, 14, 6).scale(2.5);
    const mat = new StandardMaterial('sp', scene); mat.emissiveColor = Color3.White(); mat.disableLighting = true; proxy.material = mat;
    const vls = new VolumetricLightScatteringPostProcess('vol', baixa ? 1 : 0.5, camera, proxy, 50, Texture.NEAREST_SAMPLINGMODE, engine, false, scene);
    vls.exposure = 0.15; vls.decay = 0.96815; vls.weight = 0.4; vls.density = 0.9;
  }
}

// ---------- Montagem por spike ----------
async function montar() {
  if (P.spike === 'audio') return montarAudio();
  if (P.teste !== 'nitidez' && POS.has('nevoa')) { scene.fogMode = Scene.FOGMODE_LINEAR; scene.fogColor = new Color3(0.62, 0.71, 0.78); scene.fogStart = DIST + 4; scene.fogEnd = DIST + 30; }
  const ids = ['hero_placeholder', 'enemy_placeholder_a', 'enemy_placeholder_b', 'enemy_placeholder_c', 'enemy_placeholder_d', 'enemy_placeholder_e'];
  const mats = await Promise.all((P.spike === 'multidao' || P.spike === 'carregamento' ? ids : ids.slice(0, 1)).map(matSprite));
  const heroi = criarSprite(mats[0]);

  if (P.spike === 'carregamento') {
    const audio = criarAudio(); const nomes = ['mus_placeholder_camada_a.ogg', ...Array.from({ length: 20 }, (_, k) => `sfx/sfx_placeholder_${String(k).padStart(2, '0')}.ogg`)];
    estado.bytesAudio = 0;
    await Promise.all(nomes.map(async (n) => { const b = await (await fetch(ASSETS + 'audio/' + n)).arrayBuffer(); estado.bytesAudio += b.byteLength; await audio.ctx.decodeAudioData(b); }));
  }

  if (P.spike === 'sprite') {
    const ox = P.teste === 'nitidez' ? Number(Q.get('ox') || 0) : 0, oz = Number(Q.get('oz') || 0);
    const lit = P.teste !== 'nitidez' || Q.get('luz') === '1';
    let tocha = null, gerT = null;
    if (lit) {
      const h = new HemisphericLight('h', new Vector3(0, 1, 0), scene); h.intensity = 0.4;
      const sol = new DirectionalLight('sol', new Vector3(6, -10, -5).normalize(), scene); sol.position = new Vector3(-6, 10, 5); sol.intensity = 1.0;
      Object.assign(sol, { autoUpdateExtends: false, orthoLeft: -6, orthoRight: 6, orthoTop: 6, orthoBottom: -6, shadowMinZ: 1, shadowMaxZ: 30 });
      tocha = new PointLight('tocha', new Vector3(0, 1.2, 0), scene); tocha.diffuse = new Color3(1, 0.63, 0.31); tocha.intensity = 3; tocha.range = 6;
      if (sombras) { gerSol = new ShadowGenerator(perfil.sombraSol, sol); gerSol.usePercentageCloserFiltering = true; gerSol.addShadowCaster(heroi); if (perfil.luzesComSombra) { gerT = new ShadowGenerator(perfil.sombraPontual, tocha); gerT.addShadowCaster(heroi); gerT.usePercentageCloserFiltering = true; } }
      const piso = MeshBuilder.CreateGround('piso', { width: 14, height: 14 }, scene); const pm = new StandardMaterial('piso', scene); pm.diffuseColor = new Color3(0.42, 0.48, 0.35); pm.specularColor = Color3.Black(); pm.maxSimultaneousLights = 16; piso.material = pm; piso.receiveShadows = true;
    }
    heroi.position.set(ox, 0, oz); definirQuadro(heroi, 0, 0);
    let t = 0, cx = 0;
    return { sim: (dt) => { t += dt; if (P.mover) cx += 0.37 / ppu; tocha?.position.set(Math.cos(t) * 1.6 + ox, 1.2, Math.sin(t) * 1.6 + 0.4 + oz); }, desenhar: () => { mirarHeroi(cx, 0); } };
  }

  // diorama / multidão / carregamento
  const matCen = new StandardMaterial('atlas', scene);
  const [a, an] = await Promise.all([tex('env/atlas_placeholder.png'), tex('env/atlas_placeholder_n.png', false)]);
  matCen.diffuseTexture = a; matCen.bumpTexture = an; matCen.specularColor = Color3.Black(); matCen.maxSimultaneousLights = 16;
  const mods = praçaDesc(); const meshes = [];
  for (const m of mods) meshes.push(meshDe(geometriaCaixas(m.caixas), 'mod', matCen));
  estado.modulos = mods.length;
  const piso = meshDe(geometriaChao(chaoTiles()), 'chao', matCen);
  const tochas = luzes(P.luzes);
  for (const g of geradores) { for (const m of meshes) g.addShadowCaster(m); }
  const multidao = P.spike !== 'diorama';
  const sim = criarSimulacao({ inimigos: multidao ? 40 : 0, projeteis: multidao ? 150 : 0 });
  const inimigos = []; for (let i = 0; i < sim.E.n; i++) inimigos.push(criarSprite(mats[1 + (i % 5)]));
  for (const g of geradores) { g.addShadowCaster(heroi); for (const s of inimigos) g.addShadowCaster(s); }
  const contato = await quadInstanciado('contato', 'fx/fx_sombra_contato.png', 1 + sim.E.n, 1.1, 0.55, { deitado: true });
  const amb = await quadInstanciado('amb', 'fx/fx_placeholder_brasa.png', perfil.particulas, 0.25, 0.25, { aditivo: true });
  const proj = multidao ? await quadInstanciado('proj', 'fx/fx_placeholder_brasa.png', sim.P.n, 0.25, 0.25, P.partIlum ? { aceitaLuz: true } : { aditivo: true }) : null;
  montarPos(tochas);
  const ambSem = new Float32Array(perfil.particulas * 3).map((_, i) => ((i * 7919) % 1000) / 1000);
  let t = 0;
  return {
    sim: (dt) => { t += dt; sim.passo(dt); for (let i = 0; i < tochas.length; i++) tochas[i].intensity = 6 + Math.sin(t * 13 + i * 2.1) * 0.6 + Math.sin(t * 7.3 + i) * 0.4; },
    desenhar: () => {
      const hx = multidao ? sim.heroi.x : Math.cos(t * 0.4) * 2.5, hz = multidao ? sim.heroi.z : Math.sin(t * 0.4) * 2.5;
      heroi.position.set(hx, 0, hz); definirQuadro(heroi, Math.floor(t * 10) % 8, 0);
      if (P.mover) mirarHeroi(hx, hz); else mirarHeroi(0, 0);
      colocar(contato, 0, hx, 0.01, hz, true);
      for (let i = 0; i < inimigos.length; i++) { const s = inimigos[i]; s.position.set(sim.E.x[i], 0, sim.E.z[i]); definirQuadro(s, Math.floor(sim.E.quadro[i]), sim.E.dir[i]); colocar(contato, i + 1, sim.E.x[i], 0.01, sim.E.z[i], true); }
      atualizar(contato);
      for (let i = 0; i < perfil.particulas; i++) { const an = ambSem[i * 3] * 6.283 + t * 0.2, r = 2 + ambSem[i * 3 + 1] * 10; colocar(amb, i, Math.cos(an) * r, 0.3 + ((ambSem[i * 3 + 2] * 3 + t * 0.3) % 3), Math.sin(an) * r); }
      atualizar(amb);
      if (proj) { for (let k = 0; k < sim.P.n; k++) colocar(proj, k, sim.P.x[k], sim.P.vida[k] > 0 ? sim.P.y[k] : -50, sim.P.z[k]); atualizar(proj); }
      if (pipeline?.depthOfFieldEnabled) pipeline.depthOfField.focusDistance = DIST * 1000;
    },
  };
}
function montarAudio() {
  const a = criarAudio(); const b = document.createElement('button'); b.id = 'comecar'; b.textContent = 'Pressione para começar'; document.body.appendChild(b);
  b.addEventListener('click', async () => { b.remove(); estado.audio = await a.rodarTestes(); estado.audioPronto = true; });
  estado.audioInicial = a.ctx.state; return { sim: () => {}, desenhar: () => {} };
}

// ---------- Execução ----------
const cena = await montar();
const instr = new SceneInstrumentation(scene);
const gl = engine._gl, SINCRONIZAR = Q.get('sync') !== '0';
if (P.spike !== 'audio') await scene.whenReadyAsync();
const medidor = iniciarLaco({
  simular: cena.sim,
  desenhar: (alfa, m) => {
    cena.desenhar(alfa);
    if (P.spike !== 'audio') { engine.beginFrame(); scene.render(); engine.endFrame(); if (SINCRONIZAR) gl.finish(); m.chamadas = instr.drawCallsCounter.current; m.triangulos = 0; }
    if (!estado.pronto) { estado.pronto = true; estado.primeiraTelaMs = Math.round(performance.now()); estado.montagemMs = Math.round(performance.now() - T0); }
  },
});
estado.nitidez = (fundo = [0x20, 0x40, 0x60]) => {
  const s = scene.meshes.find((o) => o.name === 'spr'); s.computeWorldMatrix(true);
  const vp = camera.viewport.toGlobal(iw, ih), M = scene.getTransformMatrix(), cs = s.getBoundingInfo().boundingBox.vectorsWorld.map((v) => Vector3.Project(v, Matrix.Identity(), M, vp));
  const k = P.w / iw, xs = cs.map((c) => c.x * k), ys = cs.map((c) => c.y * k);
  const caixa = { x: Math.floor(Math.min(...xs)) - 2, y: Math.floor(Math.min(...ys)) - 2 };
  caixa.w = Math.ceil(Math.max(...xs)) + 2 - caixa.x; caixa.h = Math.ceil(Math.max(...ys)) + 2 - caixa.y;
  return { caixa, ...medirNitidez(canvas, caixa, P.escala, fundo) };
};
estado.info = () => ({ meshes: scene.meshes.length, materiais: scene.materials.length, texturas: scene.textures.length, internaResolucao: [iw, ih] });
if (Q.get('hud') !== '0') setInterval(() => { const r = medidor.n > 10 ? medidor.resultado() : {}; hud(`babylon ${Engine.Version} · ${P.spike} · ${P.perfil} · ${iw}×${ih}\nfps ${r.fpsMedio ?? '-'} · chamadas ${medidor.chamadas}`); }, 1000);
