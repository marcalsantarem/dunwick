// Cena 3D da batalha (docs/cenarios/cena_batalha.md): arena separada do mapa, vista de lado (giro 0°, inclinação do cenário), mesma luz do ciclo
// dia/noite, mesmo kit e mesmas texturas da exploração, 6 slots, sprites de batalha de uma direção. Lê o estado VISUAL do toque
// (toque_batalha.js) — nunca a simulação — e não conhece a UI (15), que usa `projetarSlot`/`slots`.
import * as THREE from 'three';
import { criarSolo } from './solo.js';
import { construirKit } from './kit.js';
import { criarSpriteFactory } from './sprites.js';
import { criarParticulas } from './efeitos.js';
import { criarMateriais } from './materiais.js';
import { montarMapaArena, cenarioDoEncontro } from './arena.js';
import { estadoCiclo, lanternaAcesa } from '../jogo/ciclo.js';

const RAD = Math.PI / 180;

export function criarCenaBatalha({ dados, recursos, perfil, opcoes = {} }) {
  const cfg = dados.config.jogo, kitDados = dados.config.kit, ciclo = dados.config.ciclo, cfgB = dados.config.batalha, cfgS = dados.config.sprites_batalha, ppu = cfg.pixels_por_unidade;
  const cen = cenarioDoEncontro(dados, null), mapaArena = montarMapaArena(cen), [ox, oz] = mapaArena.origem, T = recursos.texturas;
  const texelsPorTile = opcoes.texelsPorTile ?? 64;
  const cena = new THREE.Scene(); cena.background = new THREE.Color(0x202838); cena.fog = new THREE.Fog(0x202838, 1, 2);

  // ---------- câmera ortográfica de lado (fixa); 1 unidade = 32 px de arte ----------
  const [aw, ah] = cen.camera.arte, meioW = aw / ppu / 2, meioH = ah / ppu / 2, giro = cen.camera.giro_graus * RAD, incl = cen.camera.inclinacao_graus * RAD;
  const camera = new THREE.OrthographicCamera(-meioW, meioW, meioH, -meioH, cfg.camera.near, cfg.camera.far);
  const offset = new THREE.Vector3(Math.cos(incl) * Math.sin(giro), Math.sin(incl), Math.cos(incl) * Math.cos(giro)).multiplyScalar(cfg.camera.distancia);
  const alvo = new THREE.Vector3(ox + cen.camera.alvo[0], 0, oz + cen.camera.alvo[1]);
  camera.position.copy(alvo).add(offset); camera.lookAt(alvo); camera.updateMatrixWorld();
  const quatCamera = camera.quaternion.clone(), direita = new THREE.Vector3(1, 0, 0).applyQuaternion(quatCamera), cima = new THREE.Vector3(0, 1, 0).applyQuaternion(quatCamera), eixoZ = cima.clone().cross(direita);
  const olhar = offset.clone().negate().normalize(), _a = new THREE.Vector3(), _b = new THREE.Vector3();
  const colar = (p, s = _b) => { const r = Math.round(p.dot(direita) * ppu) / ppu, u = Math.round(p.dot(cima) * ppu) / ppu, f = p.dot(eixoZ); return s.copy(direita).multiplyScalar(r).addScaledVector(cima, u).addScaledVector(eixoZ, f); };
  const profundidade = (z) => _a.set(ox, 0, oz + z).sub(camera.position).dot(olhar); // profundidade de vista de um ponto do chão (para a névoa por z)
  cena.fog.near = profundidade(cen.nevoa.z_inicio); cena.fog.far = profundidade(cen.nevoa.z_fim);

  // ---------- chão, kit, materiais ----------
  const solo = criarSolo(mapaArena, T, perfil, texelsPorTile, false); cena.add(solo.malha);
  const kit = construirKit(mapaArena, kitDados, texelsPorTile), { materiais, uniformesVento } = criarMateriais(T, perfil);
  for (const [nome, geo] of kit.grupos) { const m = new THREE.Mesh(geo, materiais[nome]); m.castShadow = true; m.receiveShadow = true; m.name = `arena_${nome}`; cena.add(m); }

  // ---------- luz: a do ciclo, com sombra de área menor; a direção acompanha a rotação da câmera (mesma luz-chave na tela) ----------
  const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1); cena.add(hemi);
  const sol = new THREE.DirectionalLight(0xffffff, 1), COB = cen.luz.sombra_cobertura;
  Object.assign(sol.shadow.camera, { left: -COB, right: COB, top: COB, bottom: -COB, near: 1, far: 140 }); sol.shadow.bias = -0.0004; sol.shadow.normalBias = 0.03; sol.shadow.radius = 2; cena.add(sol, sol.target);
  const az = (ciclo.sol_azimute_graus + cfg.camera.giro_graus - cen.camera.giro_graus) * RAD;
  sol.target.position.copy(alvo); sol.target.updateMatrixWorld();
  const lanternas = kit.luzes.filter((l) => l.tipo === 'lanterna'), ll = kitDados.luz_lanterna, POOL = 8;
  const luzes = Array.from({ length: POOL }, () => { const l = new THREE.PointLight(ll.cor, 0, ll.alcance_tiles, 2); l.visible = false; cena.add(l); return l; });
  const particulas = criarParticulas(cena, kit.chamines, perfil);

  // ---------- sprites de batalha ----------
  const fabrica = criarSpriteFactory(ppu, quatCamera);
  const cvSombra = document.createElement('canvas'); cvSombra.width = 64; cvSombra.height = 64; { const c = cvSombra.getContext('2d'), g = c.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(14,20,10,0.6)'); g.addColorStop(1, 'rgba(14,20,10,0)'); c.fillStyle = g; c.fillRect(0, 0, 64, 64); }
  const texSombra = new THREE.CanvasTexture(cvSombra), geoSombra = new THREE.PlaneGeometry(1.7, 1.7).rotateX(-Math.PI / 2);
  // marcas de posição: discretas, sob cada slot (cor reservada: nada de magenta)
  const marcasMat = new THREE.MeshBasicMaterial({ color: 0xe8d9a8, transparent: true, opacity: 0.16, depthWrite: false });
  const marcas = new Map(); // só os slots ocupados mostram a marca
  for (const lado of ['grupo', 'inimigos']) for (const [i, [x, z]] of cfgB.posicoes[lado].entries()) { const m = new THREE.Mesh(new THREE.RingGeometry(cen.palco.marca_raio * 0.82, cen.palco.marca_raio, 40).rotateX(-Math.PI / 2), marcasMat); m.position.set(ox + x, 0.03, oz + z); m.renderOrder = 1; m.visible = false; marcas.set(`${lado}${i + 1}`, m); cena.add(m); }

  const normalizar = (meta) => ({ ...meta, anims: meta.poses, direcoes: [meta.direcao ?? 'l'] });
  const metaDe = (id) => { const e = cfgS.atores[id]; return recursos.atlasBatalha[e.atlas ?? e.provisorio.base].meta; };
  const resolverPose = (id, nome) => { const poses = metaDe(id).poses; if (poses[nome]) return nome; for (const alt of cfgS.poses_alias[nome] ?? []) if (poses[alt]) return alt; return poses.bat_parado ? 'bat_parado' : Object.keys(poses)[0]; };
  /** Duração e instante do impacto de uma pose (do atlas), para o toque sincronizar o golpe com o quadro certo. */
  const infoPoseDe = (ctrl) => { const ids = new Map(ctrl.consultar().atores.map((a) => [a.uid, a.id])); return (uid, nome) => { const id = ids.get(uid), n = resolverPose(id, nome), p = metaDe(id).poses[n], ev = (p.eventos ?? []).find((e) => e.tipo === 'impacto' || e.tipo === 'solta_efeito'); return { duracao_s: p.quadros / p.fps, impacto_s: ev ? ev.quadro / p.fps : (p.quadros / p.fps) * 0.5 }; }; };

  const pool = new Map(); // id do ator → vistas livres/usadas (sem criar nada por quadro)
  function vistaDe(id) {
    const lista = pool.get(id) ?? pool.set(id, []).get(id); let v = lista.find((x) => !x.usada);
    if (!v) {
      const e = cfgS.atores[id], prov = e.provisorio, at = recursos.atlasBatalha[e.atlas ?? prov.base];
      const sprite = fabrica.criar({ meta: normalizar(at.meta), textura: at.textura }, { msaa: perfil.msaa > 0 });
      const sombra = new THREE.Mesh(geoSombra, new THREE.MeshBasicMaterial({ map: texSombra, transparent: true, depthWrite: false })); sombra.renderOrder = 2;
      const escala = prov?.escala ?? 1; sprite.malha.scale.setScalar(escala);
      if (prov) { sprite.malha.material.color.set(prov.tinta); sprite.malha.material.emissive.set(prov.tinta); }
      const corBase = prov ? prov.tinta : '#ffffff';
      sprite.malha.material.alphaToCoverage = perfil.msaa > 0; sprite.malha.material.alphaTest = perfil.msaa > 0 ? 0.01 : 0.45;
      cena.add(sprite.malha, sombra); v = { id, sprite, sombra, usada: false, escala, fade: false, corBase }; lista.push(v);
    }
    v.usada = true; v.sprite.malha.visible = v.sombra.visible = true; return v;
  }
  let ligados = [];
  const _v = new THREE.Vector3(), lerp = (a, b, t) => a + (b - a) * t;
  const visual = { tom: [1, 1, 1], luzArtificial: 0, fundo: [0, 0, 0], ciclo: null };

  /** Mostra os atores do toque nos slots (criando as vistas só na primeira vez de cada tipo). */
  function ligar(toque) {
    desligar(); ligados = [...toque.atores.values()].map((a) => ({ a, v: vistaDe(a.id) })); for (const { a } of ligados) marcas.get(`${a.lado}${a.slot}`).visible = true;
  }
  function desligar() { for (const m of marcas.values()) m.visible = false; for (const { v } of ligados) { v.usada = false; v.sprite.malha.visible = v.sombra.visible = false; } ligados = []; }

  function atualizar(dtS, tempoS, hora) {
    const ec = estadoCiclo(ciclo, hora); visual.tom = ec.tom; visual.luzArtificial = ec.luzArtificial; visual.ciclo = ec;
    _a.set(Math.cos(az) * Math.cos(ec.solElev * RAD), Math.sin(ec.solElev * RAD), Math.sin(az) * Math.cos(ec.solElev * RAD)); sol.position.copy(alvo).addScaledVector(_a, 70);
    sol.color.setRGB(...ec.solCor); sol.intensity = ec.solInt; hemi.color.setRGB(...ec.hemiCeu); hemi.groundColor.setRGB(...ec.hemiChao); hemi.intensity = ec.hemiInt + cen.luz.preenchimento;
    cena.background.setRGB(...ec.fundo); cena.fog.color.setRGB(...ec.nevoa);
    materiais.janela.emissiveIntensity = ec.luzArtificial * 1.6; materiais.lampada.emissiveIntensity = Math.max(0.15, ec.luzArtificial) * 2.4; uniformesVento.uTempo.value = tempoS;
    const acesa = lanternaAcesa(kitDados, hora) || ec.luzArtificial > 0.3, n = Math.min(POOL, perfil.luzes_pontuais_max, cen.luz.lanternas_por_perfil[perfil.id] ?? 2);
    luzes.forEach((l, i) => { const ok = i < n && acesa && lanternas[i]; l.visible = !!ok; if (ok) { l.position.set(lanternas[i].x, lanternas[i].y, lanternas[i].z); l.intensity = ll.intensidade * ec.luzArtificial * (1 + 0.06 * Math.sin(tempoS * 9 + i * 2.3)); } });
    for (const { a, v } of ligados) {
      const x = ox + a.base[0] + a.dx + a.empurrao, z = oz + a.base[1] + a.dz;
      colar(_v.set(x, 0, z)); _v.addScaledVector(eixoZ, -cfg.camera.sprite_recuo_tiles); v.sprite.malha.position.copy(_v);
      colar(_v.set(x, 0.02, z)); v.sombra.position.copy(_v);
      const nomePose = resolverPose(a.id, a.pose), p = metaDe(a.id).poses[nomePose], q = Math.floor(a.tPose * p.fps), quadro = p.loop ? q % p.quadros : Math.min(p.quadros - 1, q);
      v.sprite.definir(nomePose, quadro, normalizar(metaDe(a.id)).direcoes[0], a.lado === 'grupo' && cfgS.alinhamento?.grupo_espelha !== false);
      const m = v.sprite.malha.material, fade = a.alfa < 1;
      if (fade !== v.fade) { v.fade = fade; m.transparent = fade; m.alphaToCoverage = !fade && perfil.msaa > 0; m.alphaTest = fade || perfil.msaa <= 0 ? (fade ? 0.01 : 0.45) : 0.01; m.needsUpdate = true; }
      m.opacity = a.alfa; const claro = a.brilho > 0.4; m.emissive.set(claro ? 0xffffff : v.corBase); m.emissiveIntensity = claro ? 1.6 : 0.3 + a.brilho * 0.8; /* acerto: clarão branco curto */ v.sprite.malha.visible = a.alfa > 0.01;
      const so = a.queda ? Math.max(0, Math.min(1, 1 - (a.queda.t - cfgB.tempos.t_cair - 0.3) / 0.3)) : 1; v.sombra.material.opacity = a.lado === 'inimigos' && a.queda ? so : (a.caido ? 0.6 : 1); v.sombra.visible = v.sombra.material.opacity > 0.01;
      v.sombra.scale.setScalar(v.escala);
    }
    particulas.atualizar(dtS, tempoS, ox, oz, ec.luzArtificial);
  }

  const _p = new THREE.Vector3();
  const paraArte = (v) => ({ x: ((v.x + 1) / 2) * aw, y: ((1 - v.y) / 2) * ah });
  /** Posição de um slot na tela, em pixels de ARTE (0..640 × 0..360): pés e cabeça (para nomes, setas de alvo e números). `css` aplica a escala atual. */
  function projetarSlot(lado, slot, escalaCss = 1) {
    const pos = cfgB.posicoes[lado][slot - 1]; if (!pos) return null;
    const pes = paraArte(_p.set(ox + pos[0], 0, oz + pos[1]).project(camera)), esc = lado === 'grupo' ? 1 : 1;
    const topo = { x: pes.x, y: pes.y - 2.0 * ppu * esc };
    return { lado, slot, pes, cabeca: topo, css: { pes: { x: pes.x * escalaCss, y: pes.y * escalaCss }, cabeca: { x: topo.x * escalaCss, y: topo.y * escalaCss } } };
  }
  /** Ponto do palco [x,z] → pés em fração (0..1) da imagem de arte (para a UI posicionar em %). */
  const projetarPonto = ([x, z]) => { const p = paraArte(_p.set(ox + x, 0, oz + z).project(camera)); return { x: p.x / aw, y: p.y / ah }; };
  const slots = (escalaCss = 1) => ['grupo', 'inimigos'].flatMap((l) => cfgB.posicoes[l].map((_, i) => projetarSlot(l, i + 1, escalaCss)));
  /** Parâmetros do pós para a batalha: foco em z do cenário, faixa em torno, vinheta um pouco mais forte. */
  const extrasDesenho = () => {
    _p.set(ox, 1.0, oz + cen.foco.z).project(camera);
    return { faixa: 0.1 + ((cen.foco.faixa_tiles / 2) * ppu * Math.sin(incl)) / ah, vinhetaExtra: cen.luz.vinheta_extra, focoY: _p.y * 0.5 + 0.5 };
  };
  function aplicarPerfil(p) {
    perfil = p; const liga = p.sombra_sol_px > 0; sol.castShadow = liga;
    if (liga && sol.shadow.mapSize.x !== p.sombra_sol_px) { sol.shadow.mapSize.set(p.sombra_sol_px, p.sombra_sol_px); sol.shadow.map?.dispose(); sol.shadow.map = null; } if (!liga) { sol.shadow.map?.dispose(); sol.shadow.map = null; }
    for (const m of Object.values(materiais)) if (m.map) m.map.anisotropy = p.aniso;
    for (const lista of pool.values()) for (const v of lista) { const m = v.sprite.malha.material; m.alphaToCoverage = p.msaa > 0 && !v.fade; m.alphaTest = p.msaa > 0 ? 0.01 : 0.45; m.needsUpdate = true; }
    cena.traverse((o) => { if (o.material && !o.material.isShaderMaterial) for (const m of Array.isArray(o.material) ? o.material : [o.material]) m.needsUpdate = true; });
    particulas.definirMax(p.particulas_max);
  }
  /** Cria as vistas de todos os tipos de ator antes do primeiro quadro (o compilador de shaders não engasga na 1ª batalha). */
  function preparar() { const falsos = Object.keys(cfgS.atores).map((id, i) => ({ a: { id, base: [(i - 1.5) * 2, 0], dx: 0, dz: 0, empurrao: 0, pose: 'bat_parado', tPose: 0, alfa: 1, brilho: 0, lado: 'grupo' }, v: vistaDe(id) })); ligados = falsos; atualizar(0, 0, 12); desligar(); }
  return { cena, camera, projetarPonto, atualizar, ligar, desligar, preparar, aplicarPerfil, projetarSlot, slots, extrasDesenho, infoPoseDe, visual, arte: [aw, ah], cenario: cen, meioW, meioH, sombraConta: () => ligados.length };
}
