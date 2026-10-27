// Edric (hero_edric): pixel art nítido HD-2D, pose parada, 5 direções (S, SE, L, NE, N). Node puro, sem dependências além de tools/lib/png.mjs.
// Método: o personagem é um conjunto de volumes 3D (elipsoides e cadeias de esferas) em "px de modelo" (corpo ≈ 54 → ≈ 47 px na tela, cabeça
// ≈ 1/3). Cada pixel da célula lança UM raio ortográfico (câmera a 30°, como o jogo); o ponto atingido é sombreado em 4 tons por material
// (luz-chave no alto à esquerda, sombra fria, luz quente) → sem antialiasing, alpha só 0/255. Depois: contorno seletivo hierárquico (externo
// escuro embaixo/à direita, mais claro onde há luz), linhas internas por descontinuidade de profundidade, luz de borda de 1 px e limpeza de pixels.
// Girar o modelo gera qualquer direção, inclusive o lado oeste COM o equipamento trocado (ombreira, faixa); o motor só espelha SW/O/NW
// (meta.espelhar), então as vistas "verdadeiras" do oeste ficam disponíveis (opção --oeste-real) para quando o motor aceitar 8 direções.
// Uso: node tools/arte/edric.mjs [--previa] [--saida=<raiz>]   (npm run assets também chama gerarEdric)
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { codificarPng, novaImagem } from '../lib/png.mjs';
import { MOLDES, AJUSTE, LEGENDA } from './rostos.mjs';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const CELULA = 96, ANCORA = [48, 88], COLUNAS = 12;
const PITCH = Math.PI / 6, CP = Math.cos(PITCH), SP = Math.sin(PITCH);
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

// ---------- paleta: rampas [fundo/contorno, sombra, base, luz]; as marcadas (mestra) vêm de docs/arte/paleta.json; (proposta) são novas ----------
export const RAMPAS = {
  pele: ['#624441', '#9e6e5c', '#cea383', '#f2dec3'],            // pele_clara (mestra)
  couro: ['#2c120e', '#5c3120', '#875a3b', '#ae8865'],           // madeira (mestra): cabelo, botas, cinto, ombreira
  calca: ['#3e2820', '#704d37', '#9a7c5d', '#bdaf98'],           // terra (mestra)
  musgo: ['#1b3a33', '#35583c', '#5c7d3f', '#8fa95a'],           // verde-musgo do gibão (PROPOSTA ao 10: cor-assinatura, etapa 2)
  linho: ['#685a50', '#a99d90', '#d8d1c3', '#ece7dd'],           // neutro_quente (+ #d8d1c3 PROPOSTA)
  aco: ['#161b23', '#3d4956', '#6b7d8b', '#a2b7ae'],             // metal_aco (mestra); brilho especular abaixo
  latao: ['#492112', '#7f4613', '#a9792b', '#d0ae66'],           // metal_latao (mestra); também a íris âmbar
};
const ESPECULAR = '#efebde', BORDA_FRIA = '#a2b7ae';             // metal_aco_5 e luz de borda (metal_aco_4)
export const PROPOSTAS = ['#1b3a33', '#35583c', '#5c7d3f', '#8fa95a', '#d8d1c3'];
const RGB = Object.fromEntries(Object.entries(RAMPAS).map(([k, v]) => [k, v.map(hex)]));
const ESP = hex(ESPECULAR), FRIA = hex(BORDA_FRIA);

// ---------- modelo ----------
// prim = { c:[f,l,u], r:[rf,rl,ru], m:rampa, id, dec?(p) }   f = frente do personagem, l = sua direita, u = altura
const prims = [];
const SC = 1.5; // escala global do modelo (corpo ≈ 72-77 px na tela); os decalques usam coordenadas sem escala
const elip = (c, r, m, id, dec, off = 0) => prims.push({ c: c.map((v) => v * SC), r: r.map((v) => v * SC), m, id, dec, off });
const esfera = (c, r, m, id, dec, off) => elip(c, [r, r, r], m, id, dec, off);
/** Cadeia de esferas de a até b com raio interpolado (membros, lâmina). */
function cadeia(a, b, r0, r1, m, id, dec, off) {
  const n = Math.max(2, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) / 0.35));
  for (let i = 0; i <= n; i++) { const t = i / n; esfera([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t], r0 + (r1 - r0) * t, m, id, dec, off); }
}
const elipOlho = (p, l0, u0) => ((p[1] - l0) / 1.35) ** 2 + ((p[2] - u0) / 2.05) ** 2 <= 1;

function montar() {
  prims.length = 0;
  for (const s of [-1, 1]) { // pernas e botas (calça marrom, botas gastas)
    cadeia([0.4, s * 3.9, 19], [0.9, s * 4.0, 10], 3.2, 2.8, 'calca', 'perna' + s);
    cadeia([0.9, s * 4.0, 10], [1.0, s * 4.0, 4], 2.9, 3.0, 'couro', 'bota' + s, null, -1);
    elip([2.6, s * 4.0, 2.0], [4.6, 2.9, 2.2], 'couro', 'pe' + s, null, -1);
    elip([1.0, s * 4.0, 8.6], [3.3, 3.3, 0.9], 'couro', 'canobota' + s, (p) => (p[2] > 8.2 ? { m: 'couro', t: 3 } : null));
  }
  // gibão remendado: saia curta, tronco inferior e superior, gola; remendo e tira diagonal por decalque
  elip([0, 0, 17], [5.6, 6.2, 3.2], 'musgo', 'saia');
  elip([0, 0, 23.5], [4.7, 5.4, 5.0], 'musgo', 'tronco_b');
  elip([0, 0, 29.5], [4.9, 6.3, 5.8], 'musgo', 'tronco_a', (p) => {
    if (p[0] < 1.5) return null;
    if (Math.abs(p[2] - (31 + 1.12 * (p[1] - 5))) < 1.15 && p[1] > -4.5 && p[1] < 6 && p[2] > 21) return { m: 'couro', t: null };       // tira de couro
    if (Math.abs(p[1] + 3.2) < 2.1 && Math.abs(p[2] - 26.2) < 2.0) return { m: 'linho', t: null };                                              // remendo
    return null;
  });
  elip([0.4, 0, 34.2], [3.8, 4.6, 1.5], 'musgo', 'gola');
  elip([-0.8, 0, 35.2], [4.0, 5.2, 2.0], 'musgo', 'trapezio'); // linha do trapézio arredondada, une a nuca aos ombros
  elip([0, 0, 21.2], [5.3, 6.2, 1.5], 'couro', 'cinto');
  elip([4.9, 0, 21.2], [0.8, 1.7, 1.5], 'latao', 'fivela');
  elip([1.6, -6.0, 20.6], [1.5, 1.0, 2.6], 'linho', 'recibo');                                  // recibo de taxa dobrado preso ao cinto
  // cabeça, rosto e cabelo: moldes de pixels desenhados à mão (tools/arte/rostos.mjs), aplicados em quadro(); aqui só o pescoço
  elip([0.2, 0, 35.2], [3.0, 3.1, 2.6], 'pele', 'pescoco', (p) => (p[2] > 35.2 ? { m: 'pele', d: -1 } : null));
  // braços: direita (l+) com ombreira de couro e espada; esquerda (l-) com a faixa de linho no antebraço
  cadeia([0, 6.6, 31.5], [0.8, 7.6, 24.2], 3.0, 2.7, 'musgo', 'manga_d');
  cadeia([0.8, 7.6, 24.2], [2.2, 7.5, 18.6], 2.4, 2.1, 'pele', 'antebraco_d');
  esfera([2.6, 7.4, 17.4], 2.3, 'pele', 'mao_d');
  elip([0, 7.0, 33.6], [4.6, 4.3, 2.9], 'couro', 'ombreira', (p) => (p[2] > 34.6 && Math.abs(p[1] - 7) > 3 ? { m: 'latao', t: null } : null));
  cadeia([0, -6.6, 31.5], [0.8, -7.6, 24.2], 3.0, 2.7, 'musgo', 'manga_e');
  cadeia([0.8, -7.6, 24.2], [2.0, -7.5, 18.8], 2.9, 2.8, 'linho', 'faixa');
  cadeia([2.0, -7.5, 19.0], [2.2, -7.4, 17.8], 2.2, 2.2, 'pele', 'pulso_e');
  esfera([2.4, -7.3, 17.0], 2.3, 'pele', 'mao_e');
  cadeia([2.0, -9.4, 19.2], [1.2, -10.0, 15.2], 0.9, 0.7, 'linho', 'ponta_faixa');
  // espada de treino de ponta cega, em repouso na mão direita, ponta para baixo e para a frente
  const d = [0.66, 0.42, -0.62], at = (t) => [2.6 + d[0] * t, 7.4 + d[1] * t, 17.4 + d[2] * t];
  cadeia(at(-3.6), at(1.5), 1.25, 1.25, 'couro', 'cabo'); esfera(at(-4.2), 1.5, 'latao', 'pomo');
  elip(at(2.4), [0.9, 3.4, 0.9], 'latao', 'guarda');
  cadeia(at(3.4), at(15), 1.6, 1.25, 'aco', 'lamina'); esfera(at(15.4), 1.3, 'aco', 'lamina');
}

// ---------- renderização ----------
const LUZ = (() => { const v = [-0.55, 0.55, 0.38], n = Math.hypot(...v); return v.map((x) => x / n); })(); // (x tela, cima, em direção à câmera)
const LIM = [0.74, 0.44, 0.13]; // limiares de luz: acima do 1º = tom 3 (luz), 2º = 2 (base), 3º = 1 (sombra), abaixo = 0 (fundo)

function renderizar(phi) {
  const sx = Math.sin(phi), cx = Math.cos(phi);
  const D = [CP * cx, CP * sx, SP]; // direção do raio em coordenadas do personagem (aponta para a câmera)
  const W = CELULA, H = CELULA, mat = new Int16Array(W * H).fill(-1), tom = new Int8Array(W * H), prof = new Float32Array(W * H), parte = new Int16Array(W * H).fill(-1), nx = new Float32Array(W * H), cor = new Array(W * H);
  const ids = []; const nomesRampa = Object.keys(RAMPAS);
  for (let py = 0; py < H; py++) for (let px = 0; px < W; px++) {
    const X = px + 0.5 - ANCORA[0], Y = py + 0.5 - ANCORA[1], Z = Y / SP;
    const O = [X * sx + Z * cx, -X * cx + Z * sx, 0];
    let melhor = -Infinity, hit = null;
    for (let i = 0; i < prims.length; i++) {
      const p = prims[i], ox = (O[0] - p.c[0]) / p.r[0], oy = (O[1] - p.c[1]) / p.r[1], oz = (O[2] - p.c[2]) / p.r[2], dx = D[0] / p.r[0], dy = D[1] / p.r[1], dz = D[2] / p.r[2];
      const a = dx * dx + dy * dy + dz * dz, b = ox * dx + oy * dy + oz * dz, c = ox * ox + oy * oy + oz * oz - 1, disc = b * b - a * c;
      if (disc < 0) continue;
      const t = (-b + Math.sqrt(disc)) / a; if (t <= melhor) continue;
      melhor = t; hit = { p, t };
    }
    if (!hit) continue;
    const { p, t } = hit, P = [O[0] + D[0] * t, O[1] + D[1] * t, O[2] + D[2] * t];
    let n = [(P[0] - p.c[0]) / (p.r[0] ** 2), (P[1] - p.c[1]) / (p.r[1] ** 2), (P[2] - p.c[2]) / (p.r[2] ** 2)]; const ln = Math.hypot(...n); n = n.map((v) => v / ln);
    const nw = [-n[1] * cx + n[0] * sx, n[2], n[0] * cx + n[1] * sx]; // normal em (x tela, cima, em direção à câmera)
    const L = nw[0] * LUZ[0] + nw[1] * LUZ[1] + nw[2] * LUZ[2];
    let rampa = p.m, tomFix = null, dTom = 0;
    if (p.dec) { const r = p.dec(P.map((v) => v / SC)); if (r) { rampa = r.m; tomFix = r.t ?? null; dTom = r.d ?? 0; } }
    let k = L > LIM[0] ? 3 : L > LIM[1] ? 2 : L > LIM[2] ? 1 : 0;
    k = Math.max(0, Math.min(3, k + (p.off || 0) + dTom)); if (rampa === 'aco' && L > 0.93) k = 4;
    const idx = py * W + px;
    mat[idx] = nomesRampa.indexOf(rampa); tom[idx] = tomFix ?? k; prof[idx] = P[0] * D[0] + P[1] * D[1] + P[2] * D[2]; parte[idx] = ids.indexOf(p.id) >= 0 ? ids.indexOf(p.id) : (ids.push(p.id), ids.length - 1); nx[idx] = nw[0];
  }
  return { W, H, mat, tom, prof, parte, nx, nomesRampa };
}

/** Pós-processamento pixel a pixel → { px: RGBA }. */
function acabar(r) {
  const { W, H, mat, tom, prof, parte, nx, nomesRampa } = r, op = (x, y) => x >= 0 && y >= 0 && x < W && y < H && mat[y * W + x] >= 0;
  // 1) limpeza: remove pixels órfãos (≤ 1 vizinho em 4) — evita "sujeira" de 1 px
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (op(x, y)) { const n = op(x - 1, y) + op(x + 1, y) + op(x, y - 1) + op(x, y + 1); if (n <= 1) mat[y * W + x] = -1; }
  // 2) linhas internas: pixel ao lado de um volume bem mais próximo (outra parte) escurece ao tom de fundo (hierarquia: mais fraco que o contorno externo)
  const interna = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!op(x, y)) continue; const i = y * W + x;
    for (const [dx, dy] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) { const xx = x + dx, yy = y + dy; if (!op(xx, yy)) continue; const j = yy * W + xx; if (parte[j] !== parte[i] && prof[j] - prof[i] > 2.6 * SC / 0.93 && (dx === 1 || dy === 1 || prof[j] - prof[i] > 4.5 * SC / 0.93)) interna[i] = 1; }
  }
  const px = new Uint8Array(W * H * 4), cinza = []; void cinza;
  const pinta = (x, y, c) => { const i = (y * W + x) * 4; px[i] = c[0]; px[i + 1] = c[1]; px[i + 2] = c[2]; px[i + 3] = 255; };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x; if (!op(x, y)) continue;
    const R = RGB[nomesRampa[mat[i]]]; let t = tom[i];
    if (interna[i]) t = Math.min(t, 1) === 0 ? 0 : Math.max(0, Math.min(t, 1) - 1);
    pinta(x, y, t === 4 ? ESP : R[t]);
    // luz de borda fria de 1 px na borda direita/inferior em sombra (separa do fundo escuro)
    if (t <= 1 && !interna[i] && nx[i] > 0.25 && !op(x + 1, y) && op(x - 1, y)) pinta(x, y, R[2]);
  }
  // 3) contorno externo seletivo: tom de fundo do material vizinho; onde o vizinho está abaixo/à direita (borda iluminada) usa a sombra (mais claro)
  const saida = new Uint8Array(px);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (op(x, y)) continue; let melhorC = null, claro = false;
    for (const [dx, dy] of [[0, 1], [1, 0], [-1, 0], [0, -1]]) { const xx = x + dx, yy = y + dy; if (!op(xx, yy)) continue; const R = RGB[nomesRampa[mat[yy * W + xx]]]; if (!melhorC) melhorC = R; if (dy === 1 || dx === 1) { melhorC = R; claro = true; break; } }
    if (!melhorC) continue; const c = claro ? melhorC[1] : melhorC[0], j = (y * W + x) * 4;
    saida[j] = c[0]; saida[j + 1] = c[1]; saida[j + 2] = c[2]; saida[j + 3] = 255;
  }
  return saida;
}

export const DIRS = [{ id: 's', phi: 0 }, { id: 'se', phi: Math.PI / 4 }, { id: 'l', phi: Math.PI / 2 }, { id: 'ne', phi: (3 * Math.PI) / 4 }, { id: 'n', phi: Math.PI }];
export const DIRS_OESTE = [{ id: 'sw', phi: -Math.PI / 4 }, { id: 'o', phi: -Math.PI / 2 }, { id: 'nw', phi: (-3 * Math.PI) / 4 }];
const QUEIXO_Y = Math.round(ANCORA[1] - 37.5 * SC * CP); // linha do fundo do queixo (última linha do molde)
/** Cola o molde da cabeça por cima do corpo (pixels do molde substituem; transparentes deixam o corpo). */
function colarCabeca(px, dirId, ex = 0, ey = 0, giros = 0) {
  let m = MOLDES[dirId]; const [dx, dy] = AJUSTE[dirId], ox = ANCORA[0] - 13 + dx + ex, oy = QUEIXO_Y - 25 + dy + ey;
  for (let g = 0; g < giros; g++) m = Array.from({ length: 26 }, (_, y) => Array.from({ length: 26 }, (_, x) => m[x][25 - y]).join('')); // giro de 90° anti-horário (queda)
  m.forEach((lin, y) => [...lin].forEach((ch, x) => {
    if (ch === '.') return; const [r, t] = LEGENDA[ch], c = RGB[r][t], X = ox + x, Y = oy + y; if (X < 0 || Y < 0 || X >= CELULA || Y >= CELULA) return;
    const i = (Y * CELULA + X) * 4; px[i] = c[0]; px[i + 1] = c[1]; px[i + 2] = c[2]; px[i + 3] = 255;
  }));
}
export function quadro(phi, dirId) { montar(); const px = acabar(renderizar(phi)); if (dirId) colarCabeca(px, dirId); return px; }

// ---------- animações do meta: o esqueleto referencia estes nomes/quadros (gameplay, validar_dados); por ora TODOS os quadros usam a pose parada ----------
const ANIMS = {
  idle: { quadros: 4, fps: 6, loop: true },
  andar: { quadros: 8, fps: 10, loop: true, eventos: [{ quadro: 1, tipo: 'passo' }, { quadro: 5, tipo: 'passo' }] },
  correr: { quadros: 8, fps: 14, loop: true, eventos: [{ quadro: 1, tipo: 'passo' }, { quadro: 5, tipo: 'passo' }] },
  ataque1: { quadros: 6, fps: 16, loop: false, eventos: [{ quadro: 2, tipo: 'hit_inicio' }, { quadro: 4, tipo: 'hit_fim' }] },
  ataque2: { quadros: 6, fps: 16, loop: false, eventos: [{ quadro: 2, tipo: 'hit_inicio' }, { quadro: 4, tipo: 'hit_fim' }] },
  ataque3: { quadros: 6, fps: 16, loop: false, eventos: [{ quadro: 3, tipo: 'hit_inicio' }, { quadro: 4, tipo: 'hit_fim' }] },
  rolar: { quadros: 6, fps: 15, loop: false },
  dano: { quadros: 2, fps: 8, loop: false },
};

export function gerarEdric() {
  const quadros = DIRS.map((d) => quadro(d.phi, d.id));
  const total = Object.values(ANIMS).reduce((s, a) => s + a.quadros * DIRS.length, 0), linhas = Math.ceil(total / COLUNAS);
  const img = novaImagem(COLUNAS * CELULA, linhas * CELULA), anims = {}; let k = 0;
  for (const [nome, a] of Object.entries(ANIMS)) {
    anims[nome] = { ...a, inicio: k };
    for (let d = 0; d < DIRS.length; d++) for (let f = 0; f < a.quadros; f++, k++) {
      const col = k % COLUNAS, lin = Math.floor(k / COLUNAS);
      for (let y = 0; y < CELULA; y++) for (let x = 0; x < CELULA; x++) { const s = (y * CELULA + x) * 4, t = ((lin * CELULA + y) * img.w + col * CELULA + x) * 4; img.px.set(quadros[d].subarray(s, s + 4), t); }
    }
  }
  const meta = {
    id: 'hero_edric', tipo: 'sprite_humanoide', celula: [CELULA, CELULA], ancora: ANCORA, arte_escala: 1, ref_celula: CELULA,
    direcoes: DIRS.map((d) => d.id), espelhar: { sw: 'se', o: 'l', nw: 'ne' }, colunas: COLUNAS, anims,
    nota: 'Visual v2 (pixel art HD-2D, célula 96): pose parada. Todas as animações apontam o mesmo quadro estático por direção até a etapa de animação.',
  };
  return { img, meta, quadros };
}

// ---------- prévia ampliada ----------
const FONTE = { S: ['111', '100', '111', '001', '111'], E: ['111', '100', '111', '100', '111'], N: ['101', '111', '111', '111', '101'], W: ['101', '101', '111', '111', '101'], ' ': ['000', '000', '000', '000', '000'] };
function texto(img, s, x0, y0, esc, c) { let x = x0; for (const ch of s) { const g = FONTE[ch] ?? FONTE[' ']; g.forEach((lin, yy) => [...lin].forEach((b, xx) => { if (b === '1') for (let a = 0; a < esc; a++) for (let b2 = 0; b2 < esc; b2++) pixel(img, x + xx * esc + a, y0 + yy * esc + b2, c); })); x += 4 * esc; } }
function pixel(img, x, y, c) { if (x < 0 || y < 0 || x >= img.w || y >= img.h) return; const i = (y * img.w + x) * 4; img.px[i] = c[0]; img.px[i + 1] = c[1]; img.px[i + 2] = c[2]; img.px[i + 3] = 255; }

export function gerarPrevia({ quadros }) {
  const E = 4, ER = 10, N = 5, margem = 24, cel = CELULA * E, crop = 44 * ER, topo = 40, W = 2 * crop + N * cel + (N + 3) * margem, H = topo + Math.max(cel, crop) + 40 + CELULA * 3 + 90;
  const img = novaImagem(W, H), fundo = [86, 98, 84], chao = [74, 86, 72];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) pixel(img, x, y, fundo);
  // recortes ampliados ×10 do rosto: de frente (S) e de 3/4 (SE), centrados na cabeça projetada
  [[0, 'S'], [1, 'SE']].forEach(([d, nome], k) => {
    const aj = AJUSTE[DIRS[d].id], cx0 = ANCORA[0] + aj[0], cy0 = QUEIXO_Y - 12 + aj[1], ox = margem + k * (crop + margem);
    for (let y = 0; y < 44; y++) for (let x = 0; x < 44; x++) { const sx = cx0 - 22 + x, sy = cy0 - 20 + y, q = quadros[d], s = (sy * CELULA + sx) * 4, c = q[s + 3] ? [q[s], q[s + 1], q[s + 2]] : fundo; for (let a = 0; a < ER; a++) for (let b = 0; b < ER; b++) pixel(img, ox + x * ER + a, topo + y * ER + b, c); }
    texto(img, nome, ox + 4, 12, 4, [235, 240, 225]);
  });
  const nomes = ['S', 'SE', 'E', 'NE', 'N'], x0 = 2 * (crop + margem) + margem;
  for (let i = 0; i < N; i++) {
    const ox = x0 + i * (cel + margem), oy = topo;
    for (let y = -6 * E; y <= 6 * E; y++) for (let x = -26 * E; x <= 26 * E; x++) if ((x / (26 * E)) ** 2 + (y / (6 * E)) ** 2 <= 1) pixel(img, ox + ANCORA[0] * E + E / 2 + x, oy + ANCORA[1] * E + y, chao);
    blit(img, quadros[i], ox, oy, E, false);
    texto(img, nomes[i], ox + 4, 12, 4, [235, 240, 225]);
  }
  const y2 = topo + Math.max(cel, crop) + 24;
  for (let i = 0; i < N; i++) { const ox = x0 + i * (cel + margem); blit(img, quadros[i], ox, y2, 2, true); blit(img, quadros[i], ox + 2 * CELULA + 12, y2, 1, false); }
  const cores = new Set(); for (const q of quadros) for (let i = 0; i < q.length; i += 4) if (q[i + 3]) cores.add((q[i] << 16) | (q[i + 1] << 8) | q[i + 2]);
  let x = margem; const y3 = H - 56; for (const c of [...cores].sort((a, b) => a - b)) { for (let yy = 0; yy < 28; yy++) for (let xx = 0; xx < 28; xx++) pixel(img, x + xx, y3 + yy, [(c >> 16) & 255, (c >> 8) & 255, c & 255]); x += 32; }
  return { img, cores: cores.size };
}
function espelhar(q) { const o = new Uint8Array(q.length); for (let y = 0; y < CELULA; y++) for (let x = 0; x < CELULA; x++) { const s = (y * CELULA + x) * 4, t = (y * CELULA + (CELULA - 1 - x)) * 4; o.set(q.subarray(s, s + 4), t); } return o; }
function blit(img, q, ox, oy, esc, silhueta) { for (let y = 0; y < CELULA; y++) for (let x = 0; x < CELULA; x++) { const s = (y * CELULA + x) * 4; if (!q[s + 3]) continue; const c = silhueta ? [10, 12, 16] : [q[s], q[s + 1], q[s + 2]]; for (let a = 0; a < esc; a++) for (let b = 0; b < esc; b++) pixel(img, ox + x * esc + a, oy + y * esc + b, c); } }

// ---------- validação própria do Edric ----------
export function validarEdric({ img, meta, quadros }) {
  const erros = [], master = JSON.parse(readFileSyncSeguro(join(RAIZ, 'docs/arte/paleta.json'))), ok = new Set();
  for (const r of master.rampas) for (const c of r.cores) ok.add(c.hex.toLowerCase());
  for (const h of PROPOSTAS) ok.add(h);
  const usadas = new Set(); let semi = 0;
  for (let i = 0; i < img.px.length; i += 4) { const a = img.px[i + 3]; if (a !== 0 && a !== 255) semi++; if (a) usadas.add('#' + [img.px[i], img.px[i + 1], img.px[i + 2]].map((v) => v.toString(16).padStart(2, '0')).join('')); }
  const fora = [...usadas].filter((c) => !ok.has(c));
  if (semi) erros.push(`${semi} pixels com alpha intermediário`);
  if (fora.length) erros.push(`cores fora da paleta: ${fora.join(' ')}`);
  if (usadas.size > 40) erros.push(`${usadas.size} cores (máx. 40: 32 de corpo + até 8 de rosto/cabelo)`);
  const info = [];
  quadros.forEach((q, d) => {
    let minY = 99, maxY = -1, minX = 99, maxX = -1;
    for (let y = 0; y < CELULA; y++) for (let x = 0; x < CELULA; x++) if (q[(y * CELULA + x) * 4 + 3]) { minY = Math.min(minY, y); maxY = Math.max(maxY, y); minX = Math.min(minX, x); maxX = Math.max(maxX, x); }
    if (minX < 1 || minY < 1 || maxX > CELULA - 2 || maxY > CELULA - 2) erros.push(`${DIRS[d].id}: arte encosta na borda da célula (${minX},${minY})-(${maxX},${maxY})`);
    info.push(`${DIRS[d].id}: ${maxY - minY + 1}px de altura, base y=${maxY}, x ${minX}..${maxX}`);
  });
  if (img.w !== meta.colunas * CELULA) erros.push('largura do atlas');
  return { erros, cores: usadas.size, propostas: PROPOSTAS.filter((p) => usadas.has(p)).length, info };
}
import { readFileSync } from 'node:fs';
function readFileSyncSeguro(p) { return readFileSync(p, 'utf8'); }

// ---------- CLI ----------
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const arg = (n) => (process.argv.find((a) => a.startsWith(`--${n}=`)) ?? '').split('=')[1];
  const raiz = arg('saida') || RAIZ, r = gerarEdric(), v = validarEdric(r);
  const dir = join(raiz, 'assets/sprites/hero_edric'); mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'hero_edric.png'), codificarPng(r.img)); writeFileSync(join(dir, 'hero_edric.meta.json'), JSON.stringify(r.meta, null, 2) + '\n');
  console.log(`hero_edric: ${r.img.w}×${r.img.h}, ${v.cores} cores (${v.propostas} propostas)`); v.info.forEach((l) => console.log('  ' + l));
  if (process.argv.includes('--previa')) { const p = gerarPrevia({ quadros: r.quadros }), d2 = join(raiz, 'docs/arte/sprites'); mkdirSync(d2, { recursive: true }); writeFileSync(join(d2, 'previa_edric.png'), codificarPng(p.img)); console.log(`prévia: docs/arte/sprites/previa_edric.png (${p.img.w}×${p.img.h})`); }
  if (v.erros.length) { console.error('✗ ' + v.erros.join('\n✗ ')); process.exit(1); }
}

// ---------- poses de batalha (BL-007): mesmo modelo e mesma cabeça (molde "l"), articulações dadas por pose ----------
/** Monta o corpo numa pose. P: lean (inclinação do tronco), dz (agachar), rot/shift (queda), pe[0|1]=[f,u] dos pés (esq., dir.), maoD/maoE [f,l,u], espada θ em graus, frasco. Devolve o deslocamento (px) da cabeça. */
export function montarPose(P = {}) {
  prims.length = 0;
  const lean = P.lean ?? 2.5, dz = P.dz ?? 2, rot = P.rot ?? 0, cr = Math.cos(rot), sr = Math.sin(rot), sh = P.shift ?? [0, 0];
  const T = (f, l, u) => { const k = Math.min(1, Math.max(0, u) / 19), uu = u - dz * k, ff = f + lean * Math.max(0, u) / 36; return [ff * cr - uu * sr + sh[0], l, ff * sr + uu * cr + sh[1]]; };
  const a = Math.abs(rot), c2 = Math.cos(a) ** 2, s2 = Math.sin(a) ** 2;
  const Ee = (c, r, m, id, dec, off) => elip(T(...c), [r[0] * c2 + r[2] * s2, r[1], r[2] * c2 + r[0] * s2], m, id, rot ? null : dec, off);
  const Ch = (p, q, r0, r1, m, id, dec, off) => cadeia(T(...p), T(...q), r0, r1, m, id, dec, off);
  const pe = P.pe ?? [[-4.5, 0], [6.5, 0]];
  for (const s of [-1, 1]) {                                   // pernas: joelho calculado para manter o comprimento
    const [ff, fu] = pe[(s + 1) / 2], hip = T(0.4, s * 3.9, 19), foot = T(ff, s * 4, fu + 3.5);
    const dfx = foot[0] - hip[0], dfu = foot[2] - hip[2], d = Math.hypot(dfx, dfu) || 1, h = Math.sqrt(Math.max(0.5, 66 - (d / 2) ** 2));
    const knee = [(hip[0] + foot[0]) / 2 - dfu / d * h, s * 4, (hip[2] + foot[2]) / 2 + dfx / d * h];
    cadeia(hip, knee, 3.2, 2.9, 'calca', 'perna' + s); cadeia(knee, foot, 2.9, 3.0, 'couro', 'bota' + s, null, -1);
    elip([foot[0] + 2.6, s * 4, foot[2] - 1.5], [4.6, 2.9, 2.2], 'couro', 'pe' + s, null, -1);
  }
  Ee([0, 0, 17], [5.6, 6.2, 3.2], 'musgo', 'saia');
  Ee([0, 0, 23.5], [4.7, 5.4, 5.0], 'musgo', 'tronco_b');
  Ee([0, 0, 29.5], [4.9, 6.3, 5.8], 'musgo', 'tronco_a', (p) => {
    if (p[0] < 1.5) return null;
    if (Math.abs(p[2] - (31 + 1.12 * (p[1] - 5))) < 1.15 && p[1] > -4.5 && p[1] < 6 && p[2] > 21) return { m: 'couro', t: null };
    if (Math.abs(p[1] + 3.2) < 2.1 && Math.abs(p[2] - 26.2) < 2.0) return { m: 'linho', t: null };
    return null;
  });
  Ee([0.4, 0, 34.2], [3.8, 4.6, 1.5], 'musgo', 'gola'); Ee([-0.8, 0, 35.2], [4.0, 5.2, 2.0], 'musgo', 'trapezio');
  Ee([0, 0, 21.2], [5.3, 6.2, 1.5], 'couro', 'cinto'); Ee([4.9, 0, 21.2], [0.8, 1.7, 1.5], 'latao', 'fivela'); Ee([1.6, -6.0, 20.6], [1.5, 1.0, 2.6], 'linho', 'recibo');
  Ee([0.2, 0, 35.2], [3.0, 3.1, 2.6], 'pele', 'pescoco', (p) => (p[2] > 35.2 ? { m: 'pele', d: -1 } : null));
  Ee([0, 7.0, 33.6], [4.6, 4.3, 2.9], 'couro', 'ombreira', (p) => (p[2] > 34.6 && Math.abs(p[1] - 7) > 3 ? { m: 'latao', t: null } : null));
  // braços: direita (espada, ombreira) e esquerda (faixa de linho)
  const maoD = P.maoD ?? [8.5, 7.6, 28], maoE = P.maoE ?? [4.5, -7.6, 26];
  const cotovelo = (lado, m) => [m[0] / 2 - 1.6, lado * 7.6, (31.5 + m[2]) / 2 - 2.0];
  const eD = P.cotD ?? cotovelo(1, maoD), eE = P.cotE ?? cotovelo(-1, maoE), mix = (p, q, t) => p.map((v, i) => v + (q[i] - v) * t);
  Ch([0, 6.6, 31.5], eD, 3.0, 2.7, 'musgo', 'manga_d'); Ch(eD, maoD, 2.4, 2.1, 'pele', 'antebraco_d'); esfera(T(...maoD), 2.3, 'pele', 'mao_d');
  Ch([0, -6.6, 31.5], eE, 3.0, 2.7, 'musgo', 'manga_e'); const pulso = mix(eE, maoE, 0.8); Ch(eE, pulso, 2.9, 2.8, 'linho', 'faixa'); Ch(pulso, maoE, 2.2, 2.2, 'pele', 'pulso_e'); esfera(T(...maoE), 2.3, 'pele', 'mao_e');
  if (P.frasco) { Ee([maoE[0] + 1.2, maoE[1], maoE[2] + 2.4], [1.6, 1.6, 2.6], 'musgo', 'frasco'); Ee([maoE[0] + 1.2, maoE[1], maoE[2] + 5.2], [1.0, 1.0, 0.9], 'latao', 'rolha'); }
  // espada de treino (θ medido a partir da frente, para cima)
  const th = (P.theta ?? 30) * Math.PI / 180, d = [Math.cos(th), 0.06, Math.sin(th)], at = (t) => [maoD[0] + d[0] * t, maoD[1] + d[1] * t, maoD[2] + d[2] * t];
  Ch(at(-3.6), at(1.5), 1.25, 1.25, 'couro', 'cabo'); Ee(at(-4.2), [1.5, 1.5, 1.5], 'latao', 'pomo'); Ee(at(2.4), [0.9, 3.4, 0.9], 'latao', 'guarda');
  Ch(at(3.4), at(15), 1.6, 1.25, 'aco', 'lamina'); Ee(at(15.4), [1.3, 1.3, 1.3], 'aco', 'lamina');
  const c0 = T(1, 0, 45.8);
  return { dx: SC * (c0[0] - 1), dy: -SC * (c0[2] - 45.8) * CP };
}
export function quadroPose(P) {
  const h = montarPose(P), px = acabar(renderizar(Math.PI / 2));
  colarCabeca(px, 'l', Math.round(h.dx + (P.hdx || 0)), Math.round(h.dy + (P.hdy || 0)), P.giros || 0);
  return px;
}
