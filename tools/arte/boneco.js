// Bonecos de treino (alvo e "golpeador"): poste, tronco de palha, braços e cabeça de saco. Sem direção (parecem iguais de qualquer lado),
// por isso o atlas tem uma linha por animação. Telegraph e dano são do jogo, não do sprite.
import { sombra, rgba, rng } from './util.js';
import { tela } from './util.js';

const PAL = {
  alvo: { palha: '#CDAA64', palhaSombra: '#8F7238', saco: '#B89A6A', faixa: '#A8262B', madeira: '#6B4428', madeiraLuz: '#9A6A3E' },
  golpe: { palha: '#C79A5B', palhaSombra: '#855F30', saco: '#A98258', faixa: '#2E5B8F', madeira: '#5A3A1E', madeiraLuz: '#8A5E34' },
};

function desenhar(c, tipo, anim, f) {
  const P = PAL[tipo], r = rng(7 + f), contorno = 'rgba(36,24,16,0.78)';
  const balanco = anim === 'dano' ? [6, -5, 3][f] ?? 0 : 0, golpe = anim === 'golpe' ? [-25, -60, 15, 70, 55, 20][f] ?? 0 : 0;
  c.save(); c.rotate((balanco * Math.PI) / 180 * 0.4);
  // base e poste
  c.fillStyle = 'rgba(20,30,10,0.0)';
  c.fillStyle = contorno; c.beginPath(); c.ellipse(0, 0, 15, 6.5, 0, 0, 7); c.fill();
  c.fillStyle = sombra(P.madeira, -0.1); c.beginPath(); c.ellipse(0, -1, 13, 5, 0, 0, 7); c.fill();
  c.strokeStyle = contorno; c.lineWidth = 9; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, -2); c.lineTo(0, -50); c.stroke();
  c.strokeStyle = P.madeira; c.lineWidth = 6.5; c.beginPath(); c.moveTo(0, -2); c.lineTo(0, -50); c.stroke(); c.strokeStyle = P.madeiraLuz; c.lineWidth = 2; c.beginPath(); c.moveTo(-1.6, -3); c.lineTo(-1.6, -49); c.stroke();
  // braços (travessa)
  const braco = (dx, ang) => { c.save(); c.translate(0, -38); c.rotate(ang); c.strokeStyle = contorno; c.lineWidth = 8.5; c.beginPath(); c.moveTo(0, 0); c.lineTo(dx, 0); c.stroke(); c.strokeStyle = P.madeira; c.lineWidth = 6; c.beginPath(); c.moveTo(0, 0); c.lineTo(dx, 0); c.stroke(); c.restore(); };
  braco(-19, 0.1); braco(19, 0.1 - (golpe ? (golpe * Math.PI) / 180 * 0.9 : 0));
  // tronco de palha (saco amarrado)
  const g = c.createRadialGradient(-5, -34, 3, 0, -30, 18); g.addColorStop(0, sombra(P.palha, 0.25)); g.addColorStop(0.6, P.palha); g.addColorStop(1, P.palhaSombra);
  c.beginPath(); c.ellipse(0, -30, 12.5, 17, 0, 0, 7); c.fillStyle = contorno; c.fill(); c.beginPath(); c.ellipse(0, -30, 11.2, 15.8, 0, 0, 7); c.fillStyle = g; c.fill();
  c.strokeStyle = rgba(P.palhaSombra, 0.8); c.lineWidth = 0.9; for (let i = 0; i < 16; i++) { const a = r() * 6.28, d = r() * 9, x = Math.cos(a) * d, y = -30 + Math.sin(a) * d * 1.3; c.beginPath(); c.moveTo(x, y); c.lineTo(x + (r() - 0.5) * 6, y + (r() - 0.5) * 5); c.stroke(); }
  c.fillStyle = P.faixa; c.fillRect(-12, -30, 24, 4.4); c.strokeStyle = contorno; c.lineWidth = 1; c.strokeRect(-12, -30, 24, 4.4);
  // cabeça de saco
  c.beginPath(); c.arc(0, -55, 11, 0, 7); c.fillStyle = contorno; c.fill();
  const gc = c.createRadialGradient(-4, -59, 2, 0, -55, 11); gc.addColorStop(0, sombra(P.saco, 0.3)); gc.addColorStop(1, sombra(P.saco, -0.2)); c.beginPath(); c.arc(0, -55, 9.8, 0, 7); c.fillStyle = gc; c.fill();
  c.fillStyle = '#2A211C'; for (const x of [-3.5, 3.5]) { c.beginPath(); c.ellipse(x, -56, 1.5, 2, 0, 0, 7); c.fill(); }
  c.strokeStyle = '#2A211C'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-4, -50.5); c.lineTo(4, -50.5); c.stroke();
  c.fillStyle = P.faixa; c.fillRect(-10, -62, 20, 3.4);
  c.restore();
}

export function gerarAtlasBoneco(tipo, { escala = 1.5, celula = 192, ancora = [96, 168] } = {}) {
  const anims = { idle: { quadros: 2, fps: 4, loop: true }, dano: { quadros: 3, fps: 12, loop: false }, ...(tipo === 'golpe' ? { golpe: { quadros: 6, fps: 12, loop: false, eventos: [{ quadro: 3, tipo: 'hit_inicio' }, { quadro: 5, tipo: 'hit_fim' }] } } : {}) };
  const total = Object.values(anims).reduce((s, a) => s + a.quadros, 0), colunas = Math.min(total, 6), linhas = Math.ceil(total / colunas);
  const cv = tela(colunas * celula, linhas * celula), c = cv.getContext('2d'); let k = 0; const inicio = {};
  for (const [nome, a] of Object.entries(anims)) { inicio[nome] = k; for (let f = 0; f < a.quadros; f++, k++) { const col = k % colunas, lin = Math.floor(k / colunas); c.save(); c.beginPath(); c.rect(col * celula, lin * celula, celula, celula); c.clip(); c.translate(col * celula + ancora[0], lin * celula + ancora[1]); c.scale(escala, escala); desenhar(c, tipo, nome, f); c.restore(); } }
  const id = tipo === 'alvo' ? 'enemy_boneco_alvo' : 'enemy_boneco_golpe';
  return { canvas: cv, meta: { id, tipo: 'sprite_fixo', celula: [celula, celula], ancora, arte_escala: escala, ref_celula: celula / escala, direcoes: ['s'], espelhar: {}, colunas, anims: Object.fromEntries(Object.entries(anims).map(([n, a]) => [n, { ...a, inicio: inicio[n] }])) } };
}
