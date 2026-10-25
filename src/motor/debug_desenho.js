// Desenho de debug (só no build de desenvolvimento): F1 mostra caixas no chão. Cores: verde = hurtbox, amarelo = pushbox/colisores,
// vermelho = hitbox ativa do herói (arco). Usa as mesmas posições da cena; não participa da simulação.
import * as THREE from 'three';

const SEG = 48, CORES = { hurt: 0x33ff66, push: 0xffe033, hit: 0xff3333, colisor: 0xffb020 };
const mat = (cor) => new THREE.LineBasicMaterial({ color: cor, depthTest: false, transparent: true });
const circ = (raio) => { const p = []; for (let i = 0; i < SEG; i++) { const a = (i / SEG) * Math.PI * 2; p.push(Math.cos(a) * raio, 0, Math.sin(a) * raio); } const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); return g; };

export function criarDebugDesenho(cena, mundo) {
  const grupo = new THREE.Group(); grupo.visible = false; grupo.renderOrder = 50; cena.add(grupo);
  const itens = [];
  const loop = (g, cor, ent, tipo) => { const l = new THREE.LineLoop(g, mat(cor)); l.renderOrder = 50; l.frustumCulled = false; grupo.add(l); itens.push({ l, ent, tipo }); return l; };
  loop(circ(mundo.heroi.raioPush), CORES.push, mundo.heroi, 'push'); loop(circ(mundo.heroi.raioHurt), CORES.hurt, mundo.heroi, 'hurt');
  for (const e of mundo.entidades) { loop(circ(e.raioPush), CORES.push, e, 'push'); loop(circ(e.raioHurt), CORES.hurt, e, 'hurt'); if (e.dados.golpe) loop(circ(e.dados.golpe.raio_tiles), CORES.hit, e, 'hit'); }
  // colisores do mapa (pegadas do kit) desenhados uma vez
  for (const c of mundo.mapa.colisores) {
    let g; if (c.forma === 'circ') { g = circ(c.r); const l = new THREE.LineLoop(g, mat(CORES.colisor)); l.position.set(c.x, 0.05, c.z); l.renderOrder = 50; grupo.add(l); continue; }
    if (c.forma === 'ret') { g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(c.x0, 0.05, c.z0), new THREE.Vector3(c.x1, 0.05, c.z0), new THREE.Vector3(c.x1, 0.05, c.z1), new THREE.Vector3(c.x0, 0.05, c.z1)]); }
    else g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(c.ax, 0.05, c.az), new THREE.Vector3(c.bx, 0.05, c.bz)]);
    const l = c.forma === 'ret' ? new THREE.LineLoop(g, mat(CORES.colisor)) : new THREE.Line(g, mat(CORES.colisor)); l.renderOrder = 50; grupo.add(l);
  }
  // arco da hitbox do herói durante o golpe
  const arco = new THREE.Line(new THREE.BufferGeometry().setFromPoints(Array.from({ length: 25 }, () => new THREE.Vector3())), mat(CORES.hit)); arco.renderOrder = 51; arco.frustumCulled = false; grupo.add(arco);
  const lerp = (a, b, t) => a + (b - a) * t;
  return {
    atualizar(visivel, alfa) {
      grupo.visible = visivel; if (!visivel) return;
      for (const { l, ent, tipo } of itens) { const heroi = ent === mundo.heroi; l.visible = tipo !== 'hit' || ent.estado === 'ATIVO'; l.position.set(heroi ? lerp(ent.ox, ent.x, alfa) : ent.x, 0.06, heroi ? lerp(ent.oz, ent.z, alfa) : ent.z); }
      const h = mundo.heroi, a = h.acao; arco.visible = !!(a && a.tipo === 'ataque' && a.t > a.def.quadros.preparacao && a.t <= a.def.quadros.preparacao + a.def.quadros.ativo);
      if (arco.visible) { const hb = a.def.hitbox, pts = arco.geometry.attributes.position; for (let i = 0; i < 25; i++) { const ang = h.face + (i / 24 - 0.5) * (hb.abertura_graus * Math.PI / 180); pts.setXYZ(i, h.x + Math.cos(ang) * hb.alcance_tiles, 0.08, h.z + Math.sin(ang) * hb.alcance_tiles); } pts.needsUpdate = true; }
    },
  };
}
