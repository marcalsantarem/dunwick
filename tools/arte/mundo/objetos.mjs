// Sprites de objetos de pé do mapa de mundo de cima (v0.1.3b, 07; docs/arte/mapa_de_mundo.md §5): árvores, rochas, montanhas, casas, marcadores, ponte.
// Desenhados por código em 3/4: luz do alto-esquerda (esquerda clara, direita escura), 3 a 6 passos de sombra por rampa com pontilhado, contorno escuro de 1 px.
// Cada gerador devolve { img, ax, ay } com a âncora (ax, ay) no pé do objeto (centro da base), e `fumaca: [[x, y]]` / `bandeiras: [...]` quando há efeito.
import { novaImagem, R, hash, vn, fbm, rng, lim, mix, passo, pintar, colar, contorno, escurecer, misturar } from './lib.mjs';

const LUZ = (() => { const v = [-0.5, -0.62, 0.6], n = Math.hypot(...v); return v.map((x) => x / n); })();
const RAMPA = {
  folha: [...R.mata.slice(1), R.grama[3], R.grama[4]], pinho: [...R.pinheiro, R.mata[3]], betula: [R.mata[2], R.mata[3], R.grama[3], R.grama[4], R.grama[5]],
  outono: [R.telha[0], R.outono[0], R.outono[1], R.outono[2], R.brilho[0]], pedra: R.rocha, casca: R.madeira, telha: R.telha, reboco: R.reboco,
};
const CONTORNO = { folha: R.mata[0], pinho: R.pinheiro[0], betula: R.mata[0], outono: R.madeira[0], pedra: R.rocha[0], casca: R.madeira[0] };

/** Elipse sombreada como volume (esfera): luz do alto-esquerda, ruído de folhas. `cfg.irreg` deforma a silhueta. */
function disco(img, cx, cy, rx, ry, rampa, { sem = 1, folhas = 0, irreg = 0, vies = 0 } = {}) {
  const n = rampa.length, Rx = rx * (1 + irreg), Ry = ry * (1 + irreg);
  for (let y = Math.floor(cy - Ry); y <= Math.ceil(cy + Ry); y++) for (let x = Math.floor(cx - Rx); x <= Math.ceil(cx + Rx); x++) {
    const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, ang = Math.atan2(dy, dx), r = Math.hypot(dx, dy), borda = 1 + irreg * (vn(Math.cos(ang) * 2 + sem, Math.sin(ang) * 2, sem) - 0.5) * 2;
    if (r > borda) continue;
    const nz = Math.sqrt(Math.max(0, 1 - Math.min(1, r * r))), l = lim(0.5 + 0.5 * (dx * LUZ[0] / Math.max(0.35, 1) + dy * LUZ[1] + nz * LUZ[2]) * 1.15 + vies, 0, 1);
    let t = l * (n - 1) * 0.98 + (hash(x, y, sem) - 0.5) * 0.7;
    if (folhas && vn(x * 0.5, y * 0.5, sem + 3) > 0.7) t -= folhas; // tufos de folha mais escuros
    if (folhas && hash(x >> 1, y >> 1, sem + 5) > 0.93 && l > 0.45) t += 0.8; // recortes de luz
    pintar(img, x, y, rampa[passo(n, t, x, y)]);
  }
}

function preencher(img, x0, y0, x1, y1, c) { for (let y = Math.floor(y0); y < Math.ceil(y1); y++) for (let x = Math.floor(x0); x < Math.ceil(x1); x++) pintar(img, x, y, c); }
function tronco(img, cx, yBase, w, h, sem) { // tronco de madeira com luz à esquerda
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const l = x / (w - 1), t = (1 - l) * 2.4 + (hash(x, y, sem) - 0.5) * 0.9; pintar(img, Math.round(cx - w / 2 + x), yBase - 1 - y, R.madeira[passo(4, Math.min(3, t), x, y)]); }
}

/** Carvalho: copa de blocos de folhas (4–6 discos que se sobrepõem) sobre tronco curto. `esc` multiplica o tamanho. */
export function carvalho(sem = 1, esc = 1) {
  const r = rng(sem * 977 + 3), W = Math.round(52 * esc), H = Math.round(60 * esc), img = novaImagem(W, H), cx = W / 2, base = H - 3;
  tronco(img, cx, base, Math.round(7 * esc), Math.round(16 * esc), sem); preencher(img, cx - 5 * esc, base - 2, cx + 5 * esc, base, R.madeira[0]);
  const bolas = [[0, -30, 15], [-14, -22, 11], [14, -22, 11], [-6, -40, 10], [7, -38, 9], [0, -22, 13]].map(([dx, dy, rr]) => [cx + (dx + (r() - 0.5) * 4) * esc, base + (dy + (r() - 0.5) * 3) * esc, rr * esc * (0.9 + r() * 0.2)]);
  bolas.sort((a, b) => a[1] - b[1]); for (const [x, y, rr] of bolas) disco(img, x, y, rr, rr * 0.92, RAMPA.folha, { sem: sem * 13 + Math.round(x), folhas: 0.9, irreg: 0.12 });
  contorno(img, CONTORNO.folha); return { img, ax: cx, ay: base + 1 };
}
export function outonal(sem = 1, esc = 1) {
  const r = rng(sem * 521 + 9), W = Math.round(52 * esc), H = Math.round(60 * esc), img = novaImagem(W, H), cx = W / 2, base = H - 3;
  tronco(img, cx, base, Math.round(7 * esc), Math.round(16 * esc), sem);
  for (const [dx, dy, rr] of [[0, -30, 15], [-13, -22, 10], [13, -22, 10], [0, -42, 9]]) disco(img, cx + (dx + (r() - 0.5) * 3) * esc, base + dy * esc, rr * esc, rr * esc * 0.92, RAMPA.outono, { sem: sem * 7 + dx, folhas: 0.8, irreg: 0.12 });
  contorno(img, CONTORNO.outono); return { img, ax: cx, ay: base + 1 };
}
/** Pinheiro: camadas de triângulos, esquerda clara, direita escura, ponta fina. */
export function pinheiro(sem = 1, esc = 1) {
  const r = rng(sem * 131 + 7), W = Math.round(36 * esc), H = Math.round(64 * esc), img = novaImagem(W, H), cx = W / 2, base = H - 3, camadas = 4 + (sem % 2);
  tronco(img, cx, base, Math.round(5 * esc), Math.round(10 * esc), sem);
  for (let k = 0; k < camadas; k++) {
    const t = k / (camadas - 1), topo = base - 12 * esc - (1 - t) * 0 - (camadas - 1 - k) * 0, yTopo = H * 0.08 + k * ((H * 0.62) / camadas) * 0.95, alt = (H * 0.32) * (0.9 + 0.2 * t), larg = (6 + t * 12) * esc * (0.9 + r() * 0.2);
    void topo;
    for (let y = 0; y < alt; y++) { const f = y / alt, meia = larg * f + 1; for (let x = -Math.ceil(meia); x <= Math.ceil(meia); x++) {
      if (Math.abs(x) > meia) continue; const lado = x / Math.max(1, meia), tt = lim(0.5 - lado * 0.55 - f * 0.1 + (r() - 0.5) * 0.15 + (hash(x, y + k * 40, sem) - 0.5) * 0.5, 0, 1) * (RAMPA.pinho.length - 1);
      pintar(img, Math.round(cx + x), Math.round(yTopo + y), RAMPA.pinho[passo(RAMPA.pinho.length, tt, x + 90, y)]);
    } }
  }
  contorno(img, CONTORNO.pinho); return { img, ax: cx, ay: base + 1 };
}
export function betula(sem = 1, esc = 1) {
  const r = rng(sem * 71 + 5), W = Math.round(40 * esc), H = Math.round(56 * esc), img = novaImagem(W, H), cx = W / 2, base = H - 3;
  for (let y = 0; y < 26 * esc; y++) for (let x = 0; x < 5; x++) { const l = x / 4, t = 3 - l * 2 + (hash(x, y, sem) - 0.5), c = hash(x, y >> 1, sem + 2) > 0.82 ? R.rocha[1] : R.rocha[Math.min(5, passo(3, t, x, y) + 3)]; pintar(img, Math.round(cx - 2 + x), base - 1 - y, c); }
  for (const [dx, dy, rr] of [[0, -32, 12], [-9, -26, 8], [9, -26, 8], [0, -42, 8]]) disco(img, cx + dx * esc + (r() - 0.5) * 2, base + dy * esc, rr * esc, rr * esc * 0.9, RAMPA.betula, { sem: sem * 17 + dx, folhas: 0.6, irreg: 0.14 });
  contorno(img, CONTORNO.betula); return { img, ax: cx, ay: base + 1 };
}
export function arbusto(sem = 1, esc = 1) {
  const W = Math.round(28 * esc), H = Math.round(20 * esc), img = novaImagem(W, H), r = rng(sem * 43 + 1);
  for (const [dx, dy, rr] of [[-6, -6, 6], [6, -6, 6], [0, -9, 7]]) disco(img, W / 2 + dx * esc, H - 2 + dy * esc, rr * esc, rr * esc * 0.85, RAMPA.folha, { sem: sem * 5 + dx, folhas: 0.8, irreg: 0.1 });
  if (sem % 3 === 0) for (let i = 0; i < 5; i++) pintar(img, W / 2 + (r() - 0.5) * 14, H - 12 + r() * 6, [R.espuma[2], R.brilho[1], R.telha[3]][i % 3]);
  contorno(img, CONTORNO.folha); return { img, ax: W / 2, ay: H - 1 };
}
export function rocha(sem = 1, esc = 1) {
  const W = Math.round(30 * esc), H = Math.round(22 * esc), img = novaImagem(W, H);
  disco(img, W / 2, H - 9 * esc, 12 * esc, 8 * esc, RAMPA.pedra, { sem: sem * 11, irreg: 0.18, vies: 0.05 }); disco(img, W / 2 + 7 * esc, H - 6 * esc, 6 * esc, 4.5 * esc, RAMPA.pedra, { sem: sem * 11 + 3, irreg: 0.16, vies: -0.1 });
  for (let x = 0; x < W; x++) for (let y = 0; y < H; y++) { const c = img.px.slice((y * W + x) * 4, (y * W + x) * 4 + 4); if (c[3] && y > H - 12 && x < W / 2 && vn(x * 0.3, y * 0.3, sem + 8) > 0.72) pintar(img, x, y, R.mata[3]); } // musgo
  contorno(img, CONTORNO.pedra); return { img, ax: W / 2, ay: H - 3 };
}

/**
 * Montanha por mapa de altura projetado (3/4): `largura` × `fundo` de base (em px) e picos [{x, y, alt, raio}]. Renderiza de frente para trás com oclusão por coluna;
 * cor por inclinação (luz do alto-esquerda), estratos, pé de monte em cascalho/grama e neve acima de `neve` (fração da altura máxima).
 */
export function montanha({ largura = 128, fundo = 56, picos, sem = 1, neve = 0.58, alturaTela = 1 }) {
  const alturaMax = Math.max(...picos.map((p) => p.alt)), oy = Math.ceil(alturaMax * alturaTela) + 4, W = largura + 2, H = oy + fundo + 2, img = novaImagem(W, H);
  const h = (gx, gy) => { let v = 0; for (const p of picos) { const dx = (gx - p.x) / p.raio, dy = (gy - p.y) / (p.raio * 0.8), d = Math.hypot(dx, dy); if (d < 1) { const cr = 0.7 + 0.5 * (1 - Math.abs(vn(gx * 0.09 + p.x, gy * 0.09, sem) * 2 - 1)); v = Math.max(v, p.alt * Math.pow(1 - d, 1.15) * cr * (0.9 + 0.2 * fbm(gx * 0.12, gy * 0.12, sem + 2))); } } return v; };
  const topo = new Float32Array(largura).fill(oy + fundo + 1);
  for (let gy = fundo - 1; gy >= 0; gy--) for (let gx = 0; gx < largura; gx++) {
    const hh = h(gx, gy), sy = oy + gy - hh * alturaTela; if (hh < 0.5 || sy >= topo[gx]) continue;
    const e = 1.5, dhx = (h(gx + e, gy) - h(gx - e, gy)) / (2 * e), dhy = (h(gx, gy + e) - h(gx, gy - e)) / (2 * e), l = lim(0.48 - dhx * 0.55 - dhy * 0.25 + (fbm(gx * 0.2, gy * 0.2, sem + 5) - 0.5) * 0.25, 0, 1);
    for (let y = Math.ceil(sy); y < topo[gx]; y++) {
      const alt = hh / alturaMax, estrato = Math.sin((alt * 9 + fbm(gx * 0.1, y * 0.1, sem + 7) * 3) * 2.2) * 0.1; let c;
      if (alt < 0.06 && hash(gx, y, sem + 4) > alt / 0.06 * 1.05) continue; // pé de monte: cascalho que se dissolve na grama
      if (alt < 0.06) c = misturar(R.rocha_quente[passo(4, l * 3 + (hash(gx, y, sem) - 0.5) * 1.2, gx, y)], R.grama[passo(6, 1.5 + l * 2.5, gx, y)], lim(1 - alt / 0.06));
      else if (alt > neve + (fbm(gx * 0.15, y * 0.15, sem + 9) - 0.5) * 0.16) c = R.neve[passo(4, l * 3.2 + (hash(gx, y, sem + 1) - 0.5) * 0.9 - 0.2, gx, y)];
      else c = R.rocha[passo(6, (l * 0.9 + estrato) * 5 - 0.5 + (hash(gx, y, sem) - 0.5) * 0.9 + alt * 0.9 - (vn(gx * 0.22, y * 0.07, sem + 11) > 0.68 ? 1.1 : 0), gx, y)];
      pintar(img, gx + 1, y, c);
    }
    topo[gx] = Math.ceil(sy);
  }
  contorno(img, R.rocha[0]); return { img, ax: W / 2, ay: oy + fundo };
}

/** Caverna: morro de rocha com a boca escura (batente de madeira, luz fria saindo de dentro). */
export function caverna(sem = 3) {
  const m = montanha({ largura: 96, fundo: 40, sem, neve: 2, alturaTela: 1, picos: [{ x: 48, y: 22, alt: 44, raio: 46 }, { x: 24, y: 24, alt: 24, raio: 28 }, { x: 74, y: 24, alt: 28, raio: 28 }] }), { img } = m, cx = Math.round(m.ax), yb = Math.round(m.ay) - 3;
  for (let y = -17; y <= 0; y++) { const meia = y < -9 ? 11 - (-9 - y) * 0.9 : 11; for (let x = -Math.ceil(meia); x <= Math.ceil(meia); x++) if (Math.abs(x) <= meia) pintar(img, cx + x, yb + y, y < -3 ? R.sino_aqua[0] : R.sino_aqua[1 + (hash(x, y, 4) > 0.8 ? 1 : 0)]); }
  for (const s of [-1, 1]) preencher(img, cx + s * 12 - 1.5, yb - 18, cx + s * 12 + 1.5, yb + 1, R.madeira[2]); preencher(img, cx - 14, yb - 21, cx + 14, yb - 18, R.madeira[3]);
  for (let i = 0; i < 6; i++) pintar(img, cx - 10 + i * 4 + (hash(i, 1, sem) > 0.5 ? 1 : 0), yb + 1, R.espuma[0]); // ossos e entulho
  contorno(img, R.rocha[0]); return { img, ax: m.ax, ay: m.ay, luz: [cx, yb - 8] };
}

function casa(img, x, base, w, hw, estilo, sem, fumaca) { // base = linha do chão (borda inferior da parede); x = canto esquerdo
  const top = base - hw, rr = rng(sem);
  for (let y = 0; y < hw; y++) for (let xx = 0; xx < w; xx++) { const l = 1 - xx / w, t = 1.6 + l * 1.4 + (hash(xx, y, sem) - 0.5) * 0.7; pintar(img, x + xx, top + y, R.reboco[passo(4, t, xx, y)]); }
  for (let xx = 0; xx <= w; xx += Math.round(w / 3)) preencher(img, x + Math.min(xx, w - 2), top, x + Math.min(xx, w - 2) + 2, base, R.madeira[2]); preencher(img, x, top, x + w, top + 2, R.madeira[1]); preencher(img, x, base - 2, x + w, base, R.madeira[0]);
  preencher(img, x + w / 2 - 3, base - 11, x + w / 2 + 3, base - 2, R.madeira[1]); preencher(img, x + w / 2 - 2, base - 10, x + w / 2 + 2, base - 3, R.madeira[2]); pintar(img, x + w / 2 + 1, base - 6, R.brilho[0]); // porta
  preencher(img, x + 3, top + 4, x + 8, top + 9, R.ardosia[1]); preencher(img, x + 4, top + 5, x + 7, top + 8, R.brilho[0]);
  const rh = 15, ext = 3, tel = estilo === 'ardosia' ? R.ardosia : R.telha; // telhado: trapézio de fiadas
  for (let y = 0; y < rh; y++) { const f = y / (rh - 1), x0 = x - ext + f * 4, x1 = x + w + ext - f * 4; for (let xx = Math.floor(x0); xx < x1; xx++) { const lx = (xx - x0) / (x1 - x0), fiada = y % 4 === 0, t = 1.3 + (1 - lx) * 1.5 + (fiada ? -0.9 : 0) + (1 - f) * 0.3 + (hash(xx, y, sem + 3) - 0.5) * 0.7; pintar(img, xx, top - rh + y + 2, tel[passo(tel.length, t, xx, y)]); } }
  preencher(img, x - ext + 4, top - rh + 1, x + w + ext - 4, top - rh + 3, tel[tel.length - 1]); // cumeeira
  const cxm = x + w - 8; preencher(img, cxm, top - rh - 5, cxm + 5, top - rh + 6, R.reboco[0]); preencher(img, cxm, top - rh - 6, cxm + 5, top - rh - 4, R.rocha[1]); if (fumaca) fumaca.push([cxm + 2, top - rh - 7]);
  void rr;
}

/** Marcador da vila (3×3 tiles, 96 px): 5 casas de enxaimel e telha, pórtico com a viga e o gancho vazio, poço, cerca, árvore, bandeirolas, 2 fumaças. */
export function marcadorVila(sem = 1) {
  const W = 112, H = 128, img = novaImagem(W, H), solo = novaImagem(W, H), fumaca = [], rr = rng(sem + 40);
  const chao = (cx, cy, rx, ry) => { for (let y = cy - ry; y <= cy + ry; y++) for (let x = cx - rx; x <= cx + rx; x++) { const d = Math.hypot((x - cx) / rx, (y - cy) / ry); if (d > 1 + (hash(x, y, 3) - 0.5) * 0.15) continue; pintar(solo, x, y, d > 0.82 ? R.estrada[2] : R.estrada[3 - (hash(x, y, 5) > 0.7 ? 1 : 0)], d > 0.9 ? 140 : 255); } };
  chao(56, 98, 42, 20); // terreiro de terra batida (sem contorno; a estrada do terreno entra pelo sul)
  casa(img, 8, 62, 30, 20, 'telha', 11, fumaca); casa(img, 70, 58, 32, 20, 'ardosia', 12, null);
  casa(img, 20, 86, 28, 18, 'telha', 13, null); casa(img, 66, 90, 30, 18, 'telha', 14, fumaca);
  casa(img, 44, 48, 24, 16, 'telha', 15, null);
  // poço
  disco(img, 56, 82, 7, 4, R.rocha, { sem: 21 }); disco(img, 56, 80, 4.5, 2.5, R.agua_funda, { sem: 22 }); preencher(img, 49, 70, 51, 80, R.madeira[2]); preencher(img, 61, 70, 63, 80, R.madeira[2]); preencher(img, 48, 69, 64, 72, R.telha[1]);
  // pórtico com a viga e o gancho vazio (a pista do Sino de Cobre que foi arrancado)
  for (const s of [-1, 1]) preencher(img, 56 + s * 18 - 2, 94, 56 + s * 18 + 2, 118, R.madeira[2 - (s > 0 ? 1 : 0)]);
  preencher(img, 36, 92, 76, 96, R.madeira[3]); preencher(img, 36, 96, 76, 98, R.madeira[1]); preencher(img, 55, 98, 57, 104, R.rocha[2]); pintar(img, 56, 105, R.rocha[2]); pintar(img, 55, 106, R.rocha[2]); pintar(img, 57, 106, R.rocha[2]); // gancho
  for (let x = 12; x < 100; x += 6) { if (x > 36 && x < 76) continue; preencher(img, x, 112, x + 2, 120, R.madeira[2]); } preencher(img, 10, 114, 36, 116, R.madeira[3]); preencher(img, 76, 114, 102, 116, R.madeira[3]); // cerca baixa
  contorno(img, R.madeira[0]); const sai = novaImagem(W, H); sai.px.set(solo.px); colar(sai, img, 0, 0);
  return { img: sai, ax: 56, ay: 122, fumaca, bandeiras: [[40, 91, 72, 91]], rr };
}

/** Ponte de madeira: `comp` tiles de comprimento (eixo x), 1 tile de largura. */
export function ponte(comp = 3) {
  const W = comp * 32, H = 40, img = novaImagem(W, H);
  for (let y = 6; y < 30; y++) for (let x = 0; x < W; x++) { const tabua = Math.floor(x / 5), t = 2.4 + (y < 12 ? 0.6 : 0) + (hash(tabua, 0, 3) - 0.5) * 1.0 + (hash(x, y, 4) - 0.5) * 0.5; pintar(img, x, y, R.madeira[passo(4, Math.min(3, t), x, y)]); if (x % 5 === 4) pintar(img, x, y, R.madeira[1]); }
  for (const yy of [5, 29]) { preencher(img, 0, yy, W, yy + 2, R.madeira[2]); preencher(img, 0, yy + 2, W, yy + 3, R.madeira[0]); for (const x of [2, W - 5, Math.floor(W / 2)]) preencher(img, x, yy - 2, x + 3, yy + 4, R.madeira[2]); }
  contorno(img, R.madeira[0]); return { img, ax: W / 2, ay: 31 };
}
