// Humanoide articulado desenhado por código (herói Edric): partes 3D simples projetadas em 5 direções (S, SE, L, NE, N; as do lado
// oeste são o espelho), sombreadas com gradientes, contorno translúcido marrom e luz de borda. Medidas em "px de referência"
// (célula 128, corpo ≈ 70 px, cabeça ≈ 24 px = 1/3 da altura); o chamador escala por ESCALA_ARTE (×1,5 = 1080p nativo).
import { sombra, misturar, rgba, clamp } from './util.js';

export const DIRS5 = [0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4, Math.PI]; // ângulo de visão: 0 = de frente para a câmera
const PITCH = Math.PI / 6; // inclinação 30°: o chão vira losango 2:1 exato (sen 30° = 0,5)
const CP = Math.cos(PITCH), SP = Math.sin(PITCH);

export const PALETA_EDRIC = {
  pele: '#E7B58B', peleSombra: '#B9825F', cabelo: '#6B3A1E', cabeloLuz: '#9A5B2E',
  tunica: '#7C2A2A', tunicaLuz: '#A04842', tunicaSombra: '#4F1A1E', calca: '#3C3744', bota: '#4E3320', botaLuz: '#7A5535',
  cinto: '#5A3A1E', metal: '#B7BEC7', metalLuz: '#F0F3F6', metalSombra: '#6B7580', capa: '#8B2C2C', capaSombra: '#561A1C', ouro: '#C9A24A',
  contorno: 'rgba(36,24,16,0.78)', olho: '#2A211C',
};

/** Pose neutra; os campos são ângulos (rad) ou deslocamentos em px de referência. */
export const poseBase = () => ({ bob: 0, inclina: 0, giro: 0, coxaD: 0, coxaE: 0, joelhoD: 0, joelhoE: 0, bracoD: 0.1, bracoE: -0.1, cotoveloD: 0.3, cotoveloE: 0.3,
  espada: { modo: 'repouso', a: 0 }, agacha: 0, rola: 0, capa: 0, levantaD: 0, levantaE: 0, rastro: 0 });

export function desenharHumanoide(c, phi, pose, P = PALETA_EDRIC) {
  const sx = Math.sin(phi), cx = Math.cos(phi);
  // ponto no espaço do personagem (f frente, l direita, u altura) → tela (x,y) e profundidade z (maior = mais perto da câmera)
  const giro = pose.giro; const cg = Math.cos(giro), sg = Math.sin(giro);
  const proj = (f, l, u) => {
    const f2 = f * cg - l * sg, l2 = f * sg + l * cg;                       // giro do corpo (golpes, rolamento)
    let u2 = u;
    if (pose.rola) { const a = pose.rola, uu = u - 22; const fr = f2 * Math.cos(a) - uu * Math.sin(a), un = f2 * Math.sin(a) + uu * Math.cos(a); const x0 = fr, y0 = un + 22; return projB(x0, l2, y0); }
    return projB(f2, l2, u2);
  };
  const projB = (f, l, u) => { const x = -l * cx + f * sx, z = f * cx + l * sx; return { x, y: -u * CP + z * SP, z }; };
  const al = pose.agacha, bob = pose.bob;
  const L = (f, l, u) => proj(f + pose.inclina * (u / 50), l, u - al * 14 + bob); // inclinação do tronco e agachamento deslocam tudo
  const luzDir = { x: -0.6, y: -0.8 };
  const contorno = P.contorno;

  // --- primitivas ---
  const cápsula = (a, b, ra, rb, cor, luz, sb, lw = 1.4) => {
    c.lineCap = 'round';
    const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
    const lado = nx * luzDir.x + ny * luzDir.y > 0 ? 1 : -1; // lado iluminado
    const stroke = (col, w, off = 0) => { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(a.x + nx * off, a.y + ny * off); c.lineTo(b.x + nx * off, b.y + ny * off); c.stroke(); };
    const r = (ra + rb) / 2;
    stroke(contorno, r * 2 + lw * 2);
    stroke(sb, r * 2);
    stroke(cor, r * 1.45, lado * r * 0.22);
    stroke(luz, r * 0.5, lado * r * 0.5);
  };
  const esfera = (p, r, cor, luz, sb) => {
    c.beginPath(); c.arc(p.x, p.y, r + 1.3, 0, 7); c.fillStyle = contorno; c.fill();
    const g = c.createRadialGradient(p.x + luzDir.x * r * 0.45, p.y + luzDir.y * r * 0.45, r * 0.1, p.x, p.y, r);
    g.addColorStop(0, luz); g.addColorStop(0.55, cor); g.addColorStop(1, sb);
    c.beginPath(); c.arc(p.x, p.y, r, 0, 7); c.fillStyle = g; c.fill();
  };
  const poli = (pts, fill, stroke = contorno, lw = 1.2) => { c.beginPath(); c.moveTo(pts[0].x, pts[0].y); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i].x, pts[i].y); c.closePath(); if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw; c.lineJoin = 'round'; c.stroke(); } };

  // --- geometria das juntas ---
  const quadril = 30, ombro = 49, rq = 5.2;
  const perna = (lado, coxa, joelho, levanta) => { // lado: +1 direita, -1 esquerda
    const h = L(0, lado * rq, quadril), kF = Math.sin(coxa) * 14, kU = quadril - Math.cos(coxa) * 14;
    const a2 = coxa - joelho, fF = kF + Math.sin(a2) * 14, fU = Math.max(0, kU - Math.cos(a2) * 14) + levanta * 5;
    return { h, k: L(kF, lado * rq, kU), p: L(fF, lado * rq, fU), pe: L(fF + 4, lado * rq, fU) };
  };
  const braco = (lado, ang, cot, mao) => {
    const s = L(0, lado * 7.2, ombro), eF = Math.sin(ang) * 10.5, eU = ombro - Math.cos(ang) * 10.5, a2 = ang + cot;
    const e = L(eF, lado * 8.2, eU), m = mao || L(eF + Math.sin(a2) * 9.5, lado * 8.4, eU - Math.cos(a2) * 9.5);
    return { s, e, m };
  };
  const pD = perna(1, pose.coxaD, pose.joelhoD, pose.levantaD), pE = perna(-1, pose.coxaE, pose.joelhoE, pose.levantaE);
  // espada na mão direita
  const bD = braco(1, pose.bracoD, pose.cotoveloD), bE = braco(-1, pose.bracoE, pose.cotoveloE);
  const esp = pose.espada; let ponta = null, cabo = bD.m;
  if (esp.modo !== 'embainhada') {
    const ang = esp.a * Math.PI / 180;
    // modo 'h': arco horizontal (a = ângulo em torno do corpo); 'v': corte vertical (a = elevação); 'repouso': ponta para baixo-frente
    let pf, pl, pu;
    if (esp.modo === 'h') { pf = Math.cos(ang) * 26; pl = Math.sin(ang) * 26; pu = ombro - 8; ponta = L(pf, pl, pu); cabo = L(Math.cos(ang) * 8, Math.sin(ang) * 8 + 5, ombro - 8); }
    else if (esp.modo === 'v') { pf = Math.cos(ang) * 26; pl = 6; pu = ombro - 6 + Math.sin(ang) * 26; ponta = L(pf, pl, pu); cabo = L(Math.cos(ang) * 8, 6, ombro - 6 + Math.sin(ang) * 8); }
    else { ponta = L(bD.m.f ?? 8, 9, 14); cabo = bD.m; ponta = L(9, 9, 18); }
  }
  // --- ordem de pintura por profundidade ---
  const itens = [];
  const add = (z, fn) => itens.push({ z, fn });
  // capa (atrás do tronco quando de frente)
  { const ob = L(-3, 0, ombro + 1), ob2 = L(-3 - pose.capa * 0.3 - 2, 0, 20), oe = L(-2, -8, ombro), od = L(-2, 8, ombro), be = L(-6 - pose.capa, -9, 21), bd = L(-6 - pose.capa, 9, 21);
    add(ob.z - 12, () => { poli([oe, od, bd, ob2, be], P.capa, contorno); c.beginPath(); c.moveTo(ob.x, ob.y); c.lineTo(ob2.x, ob2.y); c.strokeStyle = rgba(P.capaSombra, 0.6); c.lineWidth = 2; c.stroke(); }); }
  add(pE.h.z - 3, () => { cápsula(pE.h, pE.k, 4.6, 4.2, P.calca, sombra(P.calca, 0.25), sombra(P.calca, -0.35)); cápsula(pE.k, pE.p, 4, 3.6, P.calca, sombra(P.calca, 0.25), sombra(P.calca, -0.35)); cápsula(pE.p, pE.pe, 4.4, 4, P.bota, P.botaLuz, sombra(P.bota, -0.4)); });
  add(pD.h.z - 3, () => { cápsula(pD.h, pD.k, 4.6, 4.2, P.calca, sombra(P.calca, 0.25), sombra(P.calca, -0.35)); cápsula(pD.k, pD.p, 4, 3.6, P.calca, sombra(P.calca, 0.25), sombra(P.calca, -0.35)); cápsula(pD.p, pD.pe, 4.4, 4, P.bota, P.botaLuz, sombra(P.bota, -0.4)); });
  add(bE.s.z - 4, () => { cápsula(bE.s, bE.e, 3.6, 3.2, P.tunica, P.tunicaLuz, P.tunicaSombra); cápsula(bE.e, bE.m, 3.2, 3, P.pele, sombra(P.pele, 0.2), P.peleSombra); });
  { const q = L(0, 0, quadril + 2), t = L(0, 0, ombro - 2); add(q.z, () => {
      cápsula(q, t, 7.8, 8.6, P.tunica, P.tunicaLuz, P.tunicaSombra, 1.6);
      const b1 = L(0, -8.4, 32), b2 = L(0, 8.4, 32); c.strokeStyle = P.cinto; c.lineWidth = 3.2; c.lineCap = 'round'; c.beginPath(); c.moveTo(b1.x, b1.y); c.lineTo(b2.x, b2.y); c.stroke();
      const f = L(7, 0, 32); c.fillStyle = P.ouro; c.fillRect(f.x - 1.8, f.y - 1.8, 3.6, 3.6);
      const o1 = L(0, -9, ombro - 1), o2 = L(0, 9, ombro - 1); cápsula(o1, o2, 4.4, 4.4, sombra(P.tunica, 0.05), P.tunicaLuz, P.tunicaSombra); }); }
  // cabeça, cabelo e rosto
  { const cab = L(0, 0, 61), pescoco = L(0, 0, 52); add(cab.z + 1, () => {
      cápsula(pescoco, L(0, 0, 55), 2.6, 2.6, P.pele, sombra(P.pele, 0.2), P.peleSombra);
      // cabelo de trás
      const hb = L(-2, 0, 62); esfera({ x: hb.x, y: hb.y - 0.5 }, 11.2, P.cabelo, P.cabeloLuz, sombra(P.cabelo, -0.4));
      esfera(cab, 10.2, P.pele, sombra(P.pele, 0.25), P.peleSombra);
      // rosto: só aparece quando o personagem está de frente/semi-frente (z do nariz > centro)
      const nariz = L(9, 0, 60), visivel = nariz.z > cab.z - 0.5;
      if (visivel) { const ox = (nariz.x - cab.x), olhoL = L(8.4, -3.6, 62), olhoR = L(8.4, 3.6, 62);
        c.fillStyle = P.olho; for (const e of [olhoL, olhoR]) { c.beginPath(); c.ellipse(e.x, e.y, 1.5, 2.1, 0, 0, 7); c.fill(); }
        c.fillStyle = 'rgba(255,255,255,0.8)'; for (const e of [olhoL, olhoR]) { c.fillRect(e.x - 0.9, e.y - 1.3, 0.9, 0.9); }
        c.strokeStyle = rgba(P.peleSombra, 0.9); c.lineWidth = 1; c.beginPath(); const b0 = L(9, -2.2, 56.5), b1 = L(9, 2.2, 56.5); c.moveTo(b0.x, b0.y); c.lineTo(b1.x, b1.y); c.stroke(); void ox; }
      // franja / topo do cabelo
      const t0 = L(0.5, -9.5, 63), t1 = L(4, 0, 71.6), t2 = L(0.5, 9.5, 63);
      c.beginPath(); c.moveTo(t0.x, t0.y); c.quadraticCurveTo(t1.x, t1.y - 3, t2.x, t2.y); c.quadraticCurveTo(cab.x, cab.y - 4, t0.x, t0.y); c.fillStyle = P.cabelo; c.fill(); c.strokeStyle = contorno; c.lineWidth = 1; c.stroke();
      c.strokeStyle = P.cabeloLuz; c.lineWidth = 1.3; c.beginPath(); c.moveTo(t0.x + 3, t0.y - 1); c.quadraticCurveTo(t1.x, t1.y - 3, t2.x - 5, t2.y - 1); c.stroke();
    }); }
  add(bD.s.z - 2, () => { cápsula(bD.s, bD.e, 3.6, 3.2, P.tunica, P.tunicaLuz, P.tunicaSombra); cápsula(bD.e, bD.m, 3.2, 3, P.pele, sombra(P.pele, 0.2), P.peleSombra);
    if (ponta) { // lâmina + guarda
      const dx = ponta.x - cabo.x, dy = ponta.y - cabo.y, len = Math.hypot(dx, dy) || 1, nx = -dy / len * 2.4, ny = dx / len * 2.4;
      if (pose.rastro > 0) { c.save(); c.globalAlpha = 0.5 * pose.rastro; const g = c.createLinearGradient(cabo.x, cabo.y, ponta.x, ponta.y); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,246,214,0.95)'); c.strokeStyle = g; c.lineWidth = 7; c.lineCap = 'round'; c.beginPath(); c.moveTo(cabo.x, cabo.y); c.lineTo(ponta.x, ponta.y); c.stroke(); c.restore(); }
      poli([{ x: cabo.x + nx, y: cabo.y + ny }, { x: ponta.x + nx * 0.35, y: ponta.y + ny * 0.35 }, { x: ponta.x + dx / len * 3, y: ponta.y + dy / len * 3 }, { x: ponta.x - nx * 0.35, y: ponta.y - ny * 0.35 }, { x: cabo.x - nx, y: cabo.y - ny }], P.metal, contorno, 1.2);
      c.strokeStyle = P.metalLuz; c.lineWidth = 0.9; c.beginPath(); c.moveTo(cabo.x + nx * 0.3, cabo.y + ny * 0.3); c.lineTo(ponta.x + nx * 0.1, ponta.y + ny * 0.1); c.stroke();
      c.strokeStyle = P.ouro; c.lineWidth = 2.6; c.lineCap = 'round'; c.beginPath(); c.moveTo(cabo.x + nx * 1.7, cabo.y + ny * 1.7); c.lineTo(cabo.x - nx * 1.7, cabo.y - ny * 1.7); c.stroke(); } });
  itens.sort((a, b) => a.z - b.z); for (const it of itens) it.fn();
  void clamp; void misturar;
}
