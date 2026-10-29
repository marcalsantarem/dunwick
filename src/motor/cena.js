// Cena 3D do jogo (HD-2D isométrico): câmera ortográfica (giro 45° + inclinação 30° ⇒ chão em losango 2:1), chão, kit do cenário,
// luz do sol com sombra + lanternas, ciclo dia/noite, sprites 2D como planos voltados à câmera, telegraph e marcadores.
// Lê o estado da simulação com interpolação; nunca o altera.
import * as THREE from 'three';
import { criarSolo } from './solo.js';
import { construirKit } from './kit.js';
import { criarSpriteFactory } from './sprites.js';
import { criarParticulas } from './efeitos.js';
import { criarMateriais } from './materiais.js';
import { paredesInterior, ambienteInterior } from './interior.js';
import { estadoCiclo, lanternaAcesa } from '../jogo/ciclo.js';

const COR_AVISO = 0xd01a8f, COR_AVISO_BORDA = 0xffa0e6; // magenta reservado a perigo
const RAD = Math.PI / 180;

export function criarCena({ dados, mundo, recursos, perfil, opcoes = {} }) {
  const cfg = dados.config.jogo, kitDados = dados.config.kit, ciclo = dados.config.ciclo, ppu = cfg.pixels_por_unidade;
  // uma cena por MAPA (v0.1.2): exterior ou interior; `opcoes.mapaDados` / `opcoes.entidades` permitem montar mapas que não são o ativo
  const mapaDados = opcoes.mapaDados ?? mundo.mapa.dados, entidades = opcoes.entidades ?? mundo.entidades, interior = mapaDados.tipo_mapa === 'interior', ecInterior = interior ? ambienteInterior(mapaDados.ambiente) : null;
  const texelsPorTile = opcoes.texelsPorTile ?? 64;
  const cena = new THREE.Scene(); cena.background = new THREE.Color(0x202838); cena.fog = new THREE.Fog(0x202838, cfg.camera.distancia + 8, cfg.camera.distancia + 70); if (interior) { cena.fog.near = 1e5; cena.fog.far = 2e5; }

  // ---------- câmera ortográfica isométrica: a área visível em unidades do mundo é fixa (arte/32); a resolução só muda a nitidez ----------
  const [aw, ah] = cfg.resolucao.arte, meioW = aw / ppu / 2, meioH = ah / ppu / 2, giro = cfg.camera.giro_graus * RAD, incl = cfg.camera.inclinacao_graus * RAD;
  const camera = new THREE.OrthographicCamera(-meioW, meioW, meioH, -meioH, cfg.camera.near, cfg.camera.far);
  const offset = new THREE.Vector3(Math.cos(incl) * Math.sin(giro), Math.sin(incl), Math.cos(incl) * Math.cos(giro)).multiplyScalar(cfg.camera.distancia);
  const alvoCam = new THREE.Vector3(), _a = new THREE.Vector3(), _b = new THREE.Vector3();
  camera.position.copy(offset); camera.lookAt(0, 0, 0); camera.updateMatrixWorld();
  const quatCamera = camera.quaternion.clone(), direita = new THREE.Vector3(1, 0, 0).applyQuaternion(quatCamera), cima = new THREE.Vector3(0, 1, 0).applyQuaternion(quatCamera);
  /** Cola um ponto do mundo à grade do pixel de arte (1/32 de unidade) no plano da imagem; a profundidade não muda. */
  const eixoZ = cima.clone().cross(direita);
  const colar = (p, s = _b) => { const r = Math.round(p.dot(direita) * ppu) / ppu, u = Math.round(p.dot(cima) * ppu) / ppu, f = p.dot(eixoZ); return s.copy(direita).multiplyScalar(r).addScaledVector(cima, u).addScaledVector(eixoZ, f); };
  function posicionarCamera(x, z) { colar(_a.set(x, 0, z), alvoCam); camera.position.copy(alvoCam).add(offset); camera.quaternion.copy(quatCamera); camera.updateMatrixWorld(); }
  camera.quaternion.copy(quatCamera);

  // ---------- chão e kit ----------
  const solo = criarSolo(mapaDados, recursos.texturas, perfil, texelsPorTile, !!opcoes.chaoNearest, interior ? 0 : 90); cena.add(solo.malha);
  const kit = construirKit(mapaDados, kitDados, texelsPorTile);
  const T = recursos.texturas, { materiais, uniformesVento } = criarMateriais(T, perfil);
  for (const [nome, geo] of kit.grupos) { const m = new THREE.Mesh(geo, materiais[nome]); m.castShadow = true; m.receiveShadow = true; m.name = `kit_${nome}`; cena.add(m); }
  if (interior) for (const m of paredesInterior(mapaDados, materiais, texelsPorTile)) cena.add(m); // paredes de trás inteiras; as da frente somem (rodapé)

  // ---------- luz: hemisférica + sol com sombra (direção fixa na tela; a hora muda cor/altura/intensidade) + lanternas ----------
  const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1); cena.add(hemi);
  const sol = new THREE.DirectionalLight(0xffffff, 1); const COB = 26; Object.assign(sol.shadow.camera, { left: -COB, right: COB, top: COB, bottom: -COB, near: 1, far: 140 }); sol.shadow.bias = -0.0004; sol.shadow.normalBias = 0.03; sol.shadow.radius = 2; cena.add(sol, sol.target);
  const az = ciclo.sol_azimute_graus * RAD, _l = new THREE.Vector3(), _r = new THREE.Vector3(), _u = new THREE.Vector3(), _s = new THREE.Vector3(), _d = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);
  function posicionarSol(tx, tz, elev) { // segue a câmera em passos de 1 texel do mapa de sombra (a sombra não "nada")
    _l.set(Math.cos(az) * Math.cos(elev * RAD), Math.sin(elev * RAD), Math.sin(az) * Math.cos(elev * RAD));
    const texel = (2 * COB) / (sol.shadow.mapSize.x || 1024); _r.crossVectors(UP, _l).normalize(); _u.crossVectors(_l, _r); _s.set(tx, 0, tz);
    const a = Math.round(_s.dot(_r) / texel) * texel, b = Math.round(_s.dot(_u) / texel) * texel, c = _s.dot(_l);
    _d.set(0, 0, 0).addScaledVector(_r, a).addScaledVector(_u, b).addScaledVector(_l, c); sol.target.position.copy(_d); sol.position.copy(_d).addScaledVector(_l, 70); sol.target.updateMatrixWorld();
  }
  const FONTES = kitDados.fontes ?? {}, lanternas = kit.luzes.filter((l) => l.tipo === 'lanterna' || FONTES[l.tipo]), ll = kitDados.luz_lanterna; // lanternas (por hora) + fontes de ambiente (vela, lareira, forja: sempre acesas)
  const POOL = 8, luzesPontuais = Array.from({ length: POOL }, () => { const l = new THREE.PointLight(ll.cor, 0, ll.alcance_tiles, 2); l.visible = false; cena.add(l); return l; });
  const heroiDados = Object.values(dados.personagens)[0], luzHeroi = new THREE.PointLight(heroiDados.luz.cor, 0, heroiDados.luz.alcance_tiles, 2); cena.add(luzHeroi);

  // ---------- sprites, sombra de contato, telegraph, marcadores ----------
  const fabrica = criarSpriteFactory(ppu, quatCamera);
  const cvSombra = document.createElement('canvas'); cvSombra.width = 64; cvSombra.height = 64; { const c = cvSombra.getContext('2d'), g = c.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(14,20,10,0.55)'); g.addColorStop(1, 'rgba(14,20,10,0)'); c.fillStyle = g; c.fillRect(0, 0, 64, 64); }
  const texSombra = new THREE.CanvasTexture(cvSombra), matSombra = new THREE.MeshBasicMaterial({ map: texSombra, transparent: true, depthWrite: false }), geoSombra = new THREE.PlaneGeometry(1.5, 1.5).rotateX(-Math.PI / 2);
  const atores = [];
  function novoAtor(entidade, atlas, ehHeroi) {
    const sprite = fabrica.criar(atlas, { silhueta: ehHeroi, silhuetaAlfa: cfg.camera.oclusao_alpha, msaa: perfil.msaa > 0 }), sombra = new THREE.Mesh(geoSombra, matSombra); sombra.renderOrder = 1; cena.add(sprite.malha, sombra); if (sprite.silhueta) cena.add(sprite.silhueta);
    const ator = { entidade, sprite, sombra, aviso: null, ehHeroi }; const g = entidade.dados?.golpe;
    if (g) { const disco = new THREE.Mesh(new THREE.CircleGeometry(g.raio_tiles, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: COR_AVISO, transparent: true, opacity: 0.55, depthWrite: false, depthTest: false })); const anel = new THREE.Mesh(new THREE.RingGeometry(g.raio_tiles * 0.95, g.raio_tiles, 64).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: COR_AVISO_BORDA, transparent: true, opacity: 0.95, depthWrite: false, depthTest: false })); disco.renderOrder = 30; anel.renderOrder = 31; disco.visible = anel.visible = false; cena.add(disco, anel); ator.aviso = { disco, anel }; }
    atores.push(ator); return ator;
  }
  const atorHeroi = novoAtor(mundo.heroi, recursos.atlas[heroiDados.sprite], true);
  for (const e of entidades) novoAtor(e, recursos.atlas[e.dados.sprite], false);
  const mkAnel = (r0, r1, cor, op) => { const m = new THREE.Mesh(new THREE.RingGeometry(r0, r1, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: op, depthWrite: false, depthTest: false })); m.renderOrder = 25; m.visible = false; cena.add(m); return m; };
  const marcadorDestino = mkAnel(0.32, 0.42, 0xfff0d0, 0.9), anelAlvo = mkAnel(0.62, 0.72, 0xd8ecff, 0.9);
  let alvoSobId = null, destinoAnterior = null, destinoT = 0;

  // ---------- partículas (pólen/vaga-lumes e fumaça das chaminés) ----------
  const particulas = criarParticulas(cena, kit.chamines, perfil);

  // ---------- estado visual do ciclo (lido pelo pós) ----------
  const visual = { tom: [1, 1, 1], luzArtificial: 0, fundo: [0, 0, 0], ciclo: null };
  const _v = new THREE.Vector3(), lerp = (a, b, t) => a + (b - a) * t, cor = (c) => new THREE.Color(c[0], c[1], c[2]);
  const reuniao = lanternas.map((l) => new THREE.Vector3(l.x, l.y, l.z));

  function atualizar(alfa, tempoS, dtS = 0.016) {
    const { camera: cam, heroi } = mundo, cx = lerp(cam.ox, cam.x, alfa), cz = lerp(cam.oz, cam.z, alfa);
    posicionarCamera(cx, cz);
    const ec = ecInterior ?? estadoCiclo(ciclo, mundo.hora); visual.tom = ec.tom; visual.luzArtificial = ec.luzArtificial; visual.ciclo = ec;
    sol.color.setRGB(...ec.solCor); sol.intensity = ec.solInt; posicionarSol(cx, cz, ec.solElev); hemi.color.setRGB(...ec.hemiCeu); hemi.groundColor.setRGB(...ec.hemiChao); hemi.intensity = ec.hemiInt;
    cena.background.setRGB(...ec.fundo); cena.fog.color.setRGB(...ec.nevoa);
    materiais.janela.emissiveIntensity = ec.luzArtificial * 1.6; materiais.lampada.emissiveIntensity = Math.max(0.15, ec.luzArtificial) * 2.4; uniformesVento.uTempo.value = tempoS;
    // lanternas: as N mais próximas do foco ganham PointLight real (N do perfil); todas brilham pelo material emissivo
    const acesa = lanternaAcesa(kitDados, mundo.hora) || ec.luzArtificial > 0.3, n = Math.min(POOL, perfil.luzes_pontuais_max);
    const ordem = reuniao.map((p, i) => [Math.hypot(p.x - cx, p.z - cz), i]).sort((a, b) => a[0] - b[0]);
    luzesPontuais.forEach((l, i) => {
      const src = i < n && ordem[i] && ordem[i][0] < 26 ? lanternas[ordem[i][1]] : null, f = src && FONTES[src.tipo], ok = !!src && (f ? f.sempre || acesa : acesa);
      l.visible = ok; if (!ok) return; l.position.copy(reuniao[ordem[i][1]]);
      if (f) { l.color.set(f.cor); l.distance = f.alcance_tiles; l.intensity = f.intensidade * (1 + (f.oscila ?? 0) * (0.6 * Math.sin(tempoS * 9.1 + ordem[i][1] * 2.3) + 0.4 * Math.sin(tempoS * 17.3 + ordem[i][1]))); }
      else { l.color.set(ll.cor); l.distance = ll.alcance_tiles; l.intensity = ll.intensidade * ec.luzArtificial * (1 + 0.06 * Math.sin(tempoS * 9 + ordem[i][1] * 2.3)); }
    });
    if (materiais.brasa) { materiais.brasa.emissiveIntensity = 1.7 + 0.35 * Math.sin(tempoS * 7.3) + 0.15 * Math.sin(tempoS * 13.1); materiais.chama.emissiveIntensity = 2.4 + 0.5 * Math.sin(tempoS * 11.7); }
    // atores
    for (const a of atores) {
      const e = a.entidade, x = a.ehHeroi ? lerp(e.ox, e.x, alfa) : e.x, z = a.ehHeroi ? lerp(e.oz, e.z, alfa) : e.z;
      // o sprite é um plano voltado à câmera: puxa-o para perto dela (em ortográfica não muda a posição na tela) para os pés não afundarem no chão
      colar(_v.set(x, 0, z)); _v.addScaledVector(eixoZ, -cfg.camera.sprite_recuo_tiles); a.sprite.malha.position.copy(_v); if (a.sprite.silhueta) a.sprite.silhueta.position.copy(_v);
      colar(_v.set(x, 0.02, z)); a.sombra.position.copy(_v);
      if (a.ehHeroi) { const sd = heroi.spriteDir(); a.sprite.definir(heroi.anim.nome, heroi.anim.quadro, sd.dir, sd.espelhar); }
      else a.sprite.definir(e.anim.nome, e.anim.quadro, 's', false);
      const brilho = !a.ehHeroi && e.estado === 'DANO' ? 1 : 0, realce = a.entidade.id === alvoSobId ? 0.25 : 0; a.sprite.malha.material.emissiveIntensity = 0.3 + brilho * 0.8 + realce;
      if (a.aviso) { const ativo = e.estado === 'AVISO' || e.estado === 'ATIVO', p = e.estado === 'ATIVO' ? 1 : e.aviso; a.aviso.disco.visible = a.aviso.anel.visible = ativo; if (ativo) { a.aviso.disco.scale.set(Math.max(0.01, p), 1, Math.max(0.01, p)); a.aviso.disco.position.set(x, 0.04, z); a.aviso.anel.position.set(x, 0.045, z); } }
    }
    luzHeroi.position.set(lerp(heroi.ox, heroi.x, alfa), heroiDados.luz.altura_tiles, lerp(heroi.oz, heroi.z, alfa)).addScaledVector(eixoZ, -1.6); // um pouco à frente (lado da câmera): ilumina o corpo, não a testa
    luzHeroi.intensity = heroiDados.luz.intensidade * ec.luzArtificial * ec.luzArtificial; // só acende ao escurecer
    // marcadores no chão
    const d = heroi.destino; if (d && (!destinoAnterior || destinoAnterior.x !== d.x || destinoAnterior.z !== d.z)) destinoT = 0; destinoAnterior = d ? { x: d.x, z: d.z } : null; destinoT += dtS;
    marcadorDestino.visible = !!d; if (d) { marcadorDestino.position.set(d.x, 0.05, d.z); const k = 1 + 0.15 * Math.sin(destinoT * 8); marcadorDestino.scale.set(k, 1, k); }
    const al = alvoSobId ? entidades.find((e) => e.id === alvoSobId) : null; anelAlvo.visible = !!al; if (al) anelAlvo.position.set(al.x, 0.05, al.z);
    particulas.atualizar(dtS, tempoS, cx, cz, ec.luzArtificial);
  }

  const raio = new THREE.Raycaster(), plano = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), _p = new THREE.Vector3(), _q = new THREE.Vector3(), _h = new THREE.Vector3();
  /** Cursor em coordenadas normalizadas (−1..1) → ponto no chão e inimigo sob ele (caixa na tela do sprite). */
  function pegarCursor(ndcX, ndcY, entidades) {
    raio.setFromCamera({ x: ndcX, y: ndcY }, camera); const ok = raio.ray.intersectPlane(plano, _p) !== null; let alvo = null, melhor = 1e9;
    for (const e of entidades) { _q.set(e.x, 0, e.z).project(camera); _h.set(e.x, 2.1, e.z).project(camera); const hw = 0.7 / meioW, dentro = Math.abs(ndcX - _q.x) <= hw && ndcY >= _q.y - 0.03 && ndcY <= _h.y; if (dentro && Math.abs(ndcX - _q.x) < melhor) { melhor = Math.abs(ndcX - _q.x); alvo = e.id; } }
    return { x: _p.x, z: _p.z, valido: ok && _p.x >= 0 && _p.z >= 0 && _p.x <= mapaDados.tamanho[0] && _p.z <= mapaDados.tamanho[1], alvo };
  }
  /** Perfil de qualidade (dados): sombras, anisotropia, partículas, alpha-to-coverage dos sprites. */
  function aplicarPerfil(p) {
    perfil = p; const liga = p.sombra_sol_px > 0; sol.castShadow = liga;
    if (sol.shadow.mapSize.x !== p.sombra_sol_px && liga) { sol.shadow.mapSize.set(p.sombra_sol_px, p.sombra_sol_px); sol.shadow.map?.dispose(); sol.shadow.map = null; } if (!liga) { sol.shadow.map?.dispose(); sol.shadow.map = null; }
    for (const m of Object.values(materiais)) if (m.map) m.map.anisotropy = p.aniso; for (const t of Object.values(T)) t.anisotropy = p.aniso;
    for (const a of atores) { a.sprite.malha.material.alphaToCoverage = p.msaa > 0; a.sprite.malha.material.alphaTest = p.msaa > 0 ? 0.01 : 0.45; a.sprite.malha.material.needsUpdate = true; }
    cena.traverse((o) => { if (o.material && !o.material.isShaderMaterial) { for (const m of Array.isArray(o.material) ? o.material : [o.material]) m.needsUpdate = true; } });
    particulas.definirMax(p.particulas_max);
  }
  return { cena, camera, atualizar, aplicarPerfil, pegarCursor, visual, atores, kit, solo, texelsPorTile, definirAlvoSob: (id) => { alvoSobId = id; }, meioW, meioH, estatisticasKit: () => ({ grupos: kit.grupos.size, janelas: kit.janelas.length, chamines: kit.chamines.length, luzes: kit.luzes.length }) };
}
