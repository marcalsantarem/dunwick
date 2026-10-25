// Desenho de debug (só no build de desenvolvimento): caixas no chão (F1). Cores do 03: verde = hurtbox, amarelo = pushbox,
// vermelho = hitbox ativa. Usa as mesmas posições interpoladas da cena; não participa da simulação.
import * as THREE from 'three';

const SEG = 48, CORES = { hurt: 0x33ff66, push: 0xffe033, hit: 0xff3333 };

function circulo(raio, cor) {
  const pts = []; for (let i = 0; i < SEG; i++) { const a = (i / SEG) * Math.PI * 2; pts.push(Math.cos(a) * raio, 0, Math.sin(a) * raio); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  const l = new THREE.LineLoop(g, new THREE.LineBasicMaterial({ color: cor, depthTest: false, transparent: true }));
  l.renderOrder = 10; l.visible = false; l.frustumCulled = false; return l;
}

export function criarDebugDesenho(cena, mundo) {
  const itens = [];
  const adicionar = (entidade, tipo, raio) => { const l = circulo(raio, CORES[tipo]); cena.add(l); itens.push({ entidade, tipo, l }); };
  adicionar(mundo.heroi, 'push', mundo.heroi.raioPush); adicionar(mundo.heroi, 'hurt', mundo.heroi.raioHurt);
  for (const e of mundo.entidades) {
    adicionar(e, 'push', e.raioPush); adicionar(e, 'hurt', e.raioHurt);
    if (e.dados.golpe) adicionar(e, 'hit', e.dados.golpe.raio_tiles);
  }
  const lerp = (a, b, t) => a + (b - a) * t;
  return {
    atualizar(visivel, alfa) {
      for (const { entidade: e, tipo, l } of itens) {
        l.visible = visivel && (tipo !== 'hit' || e.estado === 'ATIVO');
        if (!l.visible) continue;
        const heroi = e === mundo.heroi;
        l.position.set(heroi ? lerp(e.ox, e.x, alfa) : e.x, (heroi ? lerp(e.oaltura, e.altura, alfa) : e.altura) + 0.06, heroi ? lerp(e.oz, e.z, alfa) : e.z);
      }
    },
  };
}
