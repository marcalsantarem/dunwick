// Cena 3D do jogo: terreno, luzes (com sombra), sprites, marcadores de aviso e câmera ortográfica a 35°.
// Lê o estado da simulação a cada quadro (com interpolação) e nunca o altera.
import * as THREE from 'three';
import { construirTerreno } from './terreno.js';
import { criarSpriteFactory } from './sprites.js';

const COR_AVISO = 0xd01a8f, COR_AVISO_BORDA = 0xffa0e6; // magenta reservado a perigo (gameplay.md §6.2)

export function criarCena({ dados, mundo, recursos }) {
  const cfg = dados.config.jogo, ppt = cfg.pixels_por_tile, mapaDados = mundo.mapa.dados;
  const cena = new THREE.Scene();
  cena.background = new THREE.Color(0x14161c);

  // ---------- câmera ortográfica a 35° (ADR-001 D3): 1 unidade do mundo = 1 tile ----------
  const ang = (cfg.camera.angulo_graus * Math.PI) / 180;
  const [aw, ah] = cfg.camera.area_tiles;
  const camera = new THREE.OrthographicCamera(-aw / 2, aw / 2, ah / 2, -ah / 2, cfg.camera.near, cfg.camera.far);
  const frente = new THREE.Vector3(0, -Math.sin(ang), -Math.cos(ang)), direita = new THREE.Vector3(1, 0, 0), cima = new THREE.Vector3(0, Math.cos(ang), -Math.sin(ang));
  const _p = new THREE.Vector3(), _q = new THREE.Vector3();
  /** Cola um ponto do mundo à grade de pixel interna (1/ppt de tile) no plano da imagem; a profundidade não muda. */
  function colar(p, saida = _q) {
    const r = Math.round(p.dot(direita) * ppt) / ppt, u = Math.round(p.dot(cima) * ppt) / ppt, f = p.dot(frente);
    return saida.copy(direita).multiplyScalar(r).addScaledVector(cima, u).addScaledVector(frente, f);
  }
  const quatCamera = new THREE.Quaternion().setFromAxisAngle(direita, -ang); // olha para (0, -sen, -cos): inclinada 35°, fixa
  camera.quaternion.copy(quatCamera);
  const alvoCamera = new THREE.Vector3();
  function posicionarCamera(x, y, z) {
    colar(_p.set(x, y, z), alvoCamera);
    camera.position.copy(alvoCamera).addScaledVector(frente, -cfg.camera.distancia);
    camera.quaternion.copy(quatCamera); camera.updateMatrixWorld();
  }

  // ---------- terreno ----------
  const atlasTex = recursos.atlas.albedo.clone(), atlasNrm = recursos.atlas.normal.clone();
  atlasTex.colorSpace = THREE.SRGBColorSpace; atlasNrm.colorSpace = THREE.NoColorSpace; atlasTex.needsUpdate = atlasNrm.needsUpdate = true;
  const matTerreno = new THREE.MeshStandardMaterial({ map: atlasTex, normalMap: atlasNrm, roughness: 0.92, metalness: 0 });
  // Oclusão da câmera (gameplay.md §8.1, spike do 08): o que cobre o herói fica recortado em pontilhado (dither 4×4) num círculo em
  // volta dele. Só geometria ACIMA dos pés do herói (as paredes), para não furar o chão; a sombra projetada não muda (passe de sombra).
  const ocl = { tela: { value: new THREE.Vector2(-999, -999) }, raio: { value: 0 }, prof: { value: 0 }, y: { value: 0 }, alpha: { value: cfg.camera.oclusao_alpha } };
  matTerreno.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, { uOclTela: ocl.tela, uOclRaio: ocl.raio, uOclProf: ocl.prof, uOclY: ocl.y, uOclAlpha: ocl.alpha });
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying float vYMundo;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvYMundo = (modelMatrix * vec4(transformed, 1.0)).y;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
      varying float vYMundo; uniform vec2 uOclTela; uniform float uOclRaio, uOclProf, uOclY, uOclAlpha;
      const float BAYER[16] = float[16](0.0, 8.0, 2.0, 10.0, 12.0, 4.0, 14.0, 6.0, 3.0, 11.0, 1.0, 9.0, 15.0, 7.0, 13.0, 5.0);`)
      .replace('void main() {', `void main() {
      if (uOclRaio > 0.0 && gl_FragCoord.z < uOclProf - 0.0005 && vYMundo > uOclY + 0.55) {
        vec2 d = gl_FragCoord.xy - uOclTela; float r = length(d) / uOclRaio;
        if (r < 1.0) {
          float manter = mix(uOclAlpha, 1.0, smoothstep(0.6, 1.0, r));
          int i = int(mod(floor(gl_FragCoord.x), 4.0)) + 4 * int(mod(floor(gl_FragCoord.y), 4.0));
          if ((BAYER[i] + 0.5) / 16.0 > manter) discard;
        }
      }`);
  };
  const terreno = construirTerreno(mundo.mapa, recursos.atlas.meta, matTerreno);
  cena.add(terreno);

  // ---------- luzes ----------
  const luzes = mapaDados.luzes;
  cena.add(new THREE.HemisphereLight(luzes.hemisferica.cor_ceu, luzes.hemisferica.cor_chao, luzes.hemisferica.intensidade));
  const sol = new THREE.DirectionalLight(luzes.principal.cor, luzes.principal.intensidade);
  const dirSol = new THREE.Vector3(...luzes.principal.direcao).normalize(), paraSol = dirSol.clone().negate();
  const TEXEL_FATIA = 16; // meia-largura do volume de sombra (tiles)
  Object.assign(sol.shadow.camera, { left: -TEXEL_FATIA, right: TEXEL_FATIA, top: TEXEL_FATIA, bottom: -TEXEL_FATIA, near: 1, far: 80 });
  sol.shadow.bias = -0.0006; sol.shadow.normalBias = 0.02;
  cena.add(sol, sol.target);
  const heroiDados = Object.values(dados.personagens)[0];
  let lanterna = null;
  if (heroiDados.luz) { lanterna = new THREE.PointLight(heroiDados.luz.cor, heroiDados.luz.intensidade, heroiDados.luz.alcance_tiles, 2); lanterna.shadow.bias = -0.002; cena.add(lanterna); }
  const _s = new THREE.Vector3(), _dir = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0), _l = new THREE.Vector3(), _r = new THREE.Vector3(), _u = new THREE.Vector3();
  /** Posiciona o sol seguindo o alvo, em passos de 1 texel do mapa de sombra (a sombra não "nada" ao andar). */
  function posicionarSol(tx, ty, tz) {
    const texel = (2 * TEXEL_FATIA) / (sol.shadow.mapSize.x || 1024);
    _l.copy(paraSol); _r.crossVectors(_up, _l).normalize(); _u.crossVectors(_l, _r);
    _s.set(tx, ty, tz); const a = Math.round(_s.dot(_r) / texel) * texel, b = Math.round(_s.dot(_u) / texel) * texel, c = _s.dot(_l);
    _dir.set(0, 0, 0).addScaledVector(_r, a).addScaledVector(_u, b).addScaledVector(_l, c);
    sol.target.position.copy(_dir); sol.position.copy(_dir).addScaledVector(_l, 40);
    sol.target.updateMatrixWorld();
  }

  // ---------- sprites, sombra de contato e avisos ----------
  const fabrica = criarSpriteFactory(ppt);
  const sombraTex = recursos.fx.sombra.clone(); sombraTex.colorSpace = THREE.SRGBColorSpace; sombraTex.needsUpdate = true;
  const geoSombra = new THREE.PlaneGeometry(1.1, 0.55).rotateX(-Math.PI / 2);
  const matSombra = new THREE.MeshBasicMaterial({ map: sombraTex, transparent: true, depthWrite: false });
  const atores = [];
  function novoAtor(entidade, folha) {
    const sprite = fabrica.criar(folha, quatCamera), sombra = new THREE.Mesh(geoSombra, matSombra);
    sombra.renderOrder = 1; cena.add(sprite.malha, sombra);
    const ator = { entidade, sprite, sombra, aviso: null };
    const g = entidade.dados?.golpe;
    if (g) {
      const disco = new THREE.Mesh(new THREE.CircleGeometry(g.raio_tiles, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: COR_AVISO, transparent: true, opacity: 0.55, depthWrite: false }));
      const anel = new THREE.Mesh(new THREE.RingGeometry(g.raio_tiles * 0.94, g.raio_tiles, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: COR_AVISO_BORDA, transparent: true, opacity: 0.95, depthWrite: false }));
      disco.renderOrder = 2; anel.renderOrder = 3; disco.visible = anel.visible = false; cena.add(disco, anel);
      ator.aviso = { disco, anel };
    }
    atores.push(ator); return ator;
  }
  const heroiAtor = novoAtor(mundo.heroi, recursos.folhas[heroiDados.sprite]);
  for (const e of mundo.entidades) novoAtor(e, recursos.folhas[e.dados.sprite]);

  const _v = new THREE.Vector3();
  const lerp = (a, b, t) => a + (b - a) * t;
  /** Atualiza o desenho a partir da simulação. `alfa` = fração do próximo passo (interpolação). */
  function atualizar(alfa) {
    const { camera: cam, heroi } = mundo;
    const cx = lerp(cam.ox, cam.x, alfa), cz = lerp(cam.oz, cam.z, alfa), cy = lerp(cam.oy, cam.y, alfa);
    posicionarCamera(cx, cy, cz);
    posicionarSol(cx, cy, cz);
    for (const a of atores) {
      const e = a.entidade, ehHeroi = e === heroi;
      const x = ehHeroi ? lerp(e.ox, e.x, alfa) : e.x, z = ehHeroi ? lerp(e.oz, e.z, alfa) : e.z, y = ehHeroi ? lerp(e.oaltura, e.altura, alfa) : e.altura;
      colar(_v.set(x, y, z)); a.sprite.malha.position.copy(_v);
      colar(_v.set(x, y + 0.02, z)); a.sombra.position.copy(_v);
      if (ehHeroi) { // ciclo de passos: o quadro 0 é a pose parada; andando percorre 1..N-1 (correr acelera o ciclo)
        const ciclo = Math.floor(heroi.quadroEstado * (a.sprite.meta.fps / 60) * (heroi.estado === 'CORRER' ? 1.6 : 1));
        a.sprite.definir(heroi.estado === 'PARADO' ? 0 : 1 + (ciclo % (a.sprite.meta.quadros - 1)), heroi.direcaoSprite());
      }
      else a.sprite.definir(0, e.dir);
      if (a.aviso) {
        const ativo = e.estado === 'AVISO' || e.estado === 'ATIVO', p = e.estado === 'ATIVO' ? 1 : e.aviso;
        a.aviso.disco.visible = a.aviso.anel.visible = ativo;
        if (ativo) { a.aviso.disco.scale.set(p, 1, p); for (const m of [a.aviso.disco, a.aviso.anel]) m.position.set(x, y + 0.03, z); }
      }
    }
    // recorte de oclusão: posição do herói na imagem interna (pixels), profundidade e altura dos pés
    _v.set(lerp(heroi.ox, heroi.x, alfa), lerp(heroi.oaltura, heroi.altura, alfa) + 0.9, lerp(heroi.oz, heroi.z, alfa)); const hy = _v.y - 0.9; colar(_v); _v.project(camera);
    ocl.tela.value.set((_v.x * 0.5 + 0.5) * cfg.resolucao_interna[0], (_v.y * 0.5 + 0.5) * cfg.resolucao_interna[1]);
    ocl.prof.value = _v.z * 0.5 + 0.5; ocl.y.value = hy; ocl.raio.value = cfg.camera.oclusao_raio_tiles * ppt;
    if (lanterna) { colar(_v.set(lerp(heroi.ox, heroi.x, alfa), lerp(heroi.oaltura, heroi.altura, alfa) + heroiDados.luz.altura_tiles, lerp(heroi.oz, heroi.z, alfa))); lanterna.position.copy(_v); }
  }

  /** Perfil de qualidade (dados): sombras do sol e da lanterna. */
  function aplicarPerfil(perfil) {
    const liga = perfil.sombra_sol_px > 0;
    sol.castShadow = liga;
    if (liga && sol.shadow.mapSize.x !== perfil.sombra_sol_px) { sol.shadow.mapSize.set(perfil.sombra_sol_px, perfil.sombra_sol_px); sol.shadow.map?.dispose(); sol.shadow.map = null; }
    if (!liga) { sol.shadow.map?.dispose(); sol.shadow.map = null; }
    if (lanterna) {
      const ligaL = perfil.luzes_com_sombra > 0;
      lanterna.castShadow = ligaL;
      if (ligaL && lanterna.shadow.mapSize.x !== perfil.sombra_pontual_px) { lanterna.shadow.mapSize.set(perfil.sombra_pontual_px, perfil.sombra_pontual_px); lanterna.shadow.map?.dispose(); lanterna.shadow.map = null; }
      if (!ligaL) { lanterna.shadow.map?.dispose(); lanterna.shadow.map = null; }
      lanterna.visible = perfil.luzes_pontuais_max > 0;
    }
    cena.traverse((o) => { if (o.material) { const ms = Array.isArray(o.material) ? o.material : [o.material]; for (const m of ms) m.needsUpdate = true; } });
  }

  return { cena, camera, atualizar, aplicarPerfil, atores, posicionarCamera, colar };
}
