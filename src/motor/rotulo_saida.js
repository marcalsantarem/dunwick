// Rótulo flutuante "Sair" sobre a porta de saída dos interiores (v0.1.2, ajuste do usuário: "não há sinalização de onde fica a porta pra sair").
// Um sprite com painel escuro, ícone de porta + seta e o texto por ID (`ui_sair`): nunca depende só de cor. Fica sempre visível, mas só destaca
// (opaco, com leve flutuação) quando o herói está a ≤ `perto` tiles. Pixel de arte nítido; não é desenhado atrás das paredes (depthTest desligado).
import * as THREE from 'three';

const L = 256, A = 64;

function desenhar(texto) {
  const cv = document.createElement('canvas'); cv.width = L; cv.height = A; const c = cv.getContext('2d');
  c.fillStyle = 'rgba(28,18,10,0.9)'; c.strokeStyle = '#e8c877'; c.lineWidth = 3; c.beginPath(); c.roundRect(2, 2, L - 4, A - 4, 12); c.fill(); c.stroke();
  // ícone de porta (batente + folha aberta + maçaneta)
  c.strokeStyle = '#f2e6c8'; c.lineWidth = 3; c.strokeRect(16, 12, 22, 40); c.fillStyle = '#c08a3e'; c.beginPath(); c.moveTo(38, 12); c.lineTo(50, 17); c.lineTo(50, 57); c.lineTo(38, 52); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = '#f2e6c8'; c.beginPath(); c.arc(46, 36, 2.5, 0, 6.3); c.fill();
  // seta para baixo (a saída é para a frente da câmera)
  c.beginPath(); c.moveTo(72, 18); c.lineTo(88, 18); c.lineTo(88, 34); c.lineTo(98, 34); c.lineTo(80, 52); c.lineTo(62, 34); c.lineTo(72, 34); c.closePath(); c.fillStyle = '#e8c877'; c.fill();
  c.fillStyle = '#f2e6c8'; c.font = 'bold 30px Georgia, "Times New Roman", serif'; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText(texto, 116, 34, L - 128);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.minFilter = t.magFilter = THREE.LinearFilter; return t;
}

export function criarRotuloSaida(cena, { x, y, z, texto, perto = 4 }) {
  const mat = new THREE.SpriteMaterial({ map: desenhar(texto), transparent: true, depthTest: false, depthWrite: false }), spr = new THREE.Sprite(mat);
  spr.scale.set(4, 1, 1); spr.position.set(x, y, z); spr.renderOrder = 60; spr.name = 'rotulo_saida'; cena.add(spr);
  return {
    sprite: spr,
    /** Opaco e flutuando perto do herói; discreto (55 %) longe. Com "reduzir movimento": sem flutuar. */
    atualizar(hx, hz, t, reduzir) { const d = Math.hypot(hx - x, hz - z), p = d <= perto; mat.opacity = p ? 1 : 0.55; spr.position.y = y + (p && !reduzir ? Math.sin(t * 2.4) * 0.06 : 0); return p; },
  };
}
