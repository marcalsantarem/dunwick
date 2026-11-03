// Terreno do mapa de mundo de CIMA, pixel a pixel (v0.1.3b, 07; docs/arte/mapa_de_mundo.md §3 e §4). `pintarTerreno(mapa, opcoes)` → imagem RGBA de L·32 × A·32.
// Nenhum material termina em linha de tile: água × terra usa um campo de distância com sinal (bilinear entre os centros dos tiles + ruído); os demais materiais
// usam pesos bilineares + ruído e vence o maior. Cada pixel tem textura própria (rampas da paleta, pontilhado ordenado). A água tem 4 quadros (`quadro` 0..3).
// Função pura de `planta` + `semente`. Legenda do 10: a mar, i rio, l lago, w rio sob ponte, p praia, g grama, f prado com flores, c cultivo, m mata densa,
// r bosque ralo, e estrada, t trilha, h colina, n montanha, x penhasco, V chão da vila (grama com estrada).
import { novaImagem, R, hash, vn, fbm, mix, lim, cor, misturar, escurecer, passo } from './lib.mjs';

export const PX = 32;
const AGUA = new Set(['a', 'i', 'l', 'w']), RASA = new Set(['i', 'l', 'w']);
const GRUPO = { a: 'agua', i: 'agua', l: 'agua', w: 'agua', p: 'praia', g: 'grama', f: 'prado', V: 'grama', c: 'cultivo', m: 'mata', r: 'ralo', e: 'estrada', t: 'trilha', h: 'colina', n: 'rocha', x: 'rocha' };

function campoDistancia(L, A, ehFonte) { // chanfro 3-4: distância (tiles) do tile ao tile-fonte mais próximo
  const d = new Float32Array(L * A).fill(1e6); for (let i = 0; i < L * A; i++) if (ehFonte(i % L, Math.floor(i / L))) d[i] = 0;
  const rel = (x, z, dx, dz, c) => { const nx = x + dx, nz = z + dz; if (nx < 0 || nz < 0 || nx >= L || nz >= A) return; const v = d[nz * L + nx] + c; if (v < d[z * L + x]) d[z * L + x] = v; };
  for (let z = 0; z < A; z++) for (let x = 0; x < L; x++) { rel(x, z, -1, 0, 1); rel(x, z, 0, -1, 1); rel(x, z, -1, -1, 1.414); rel(x, z, 1, -1, 1.414); }
  for (let z = A - 1; z >= 0; z--) for (let x = L - 1; x >= 0; x--) { rel(x, z, 1, 0, 1); rel(x, z, 0, 1, 1); rel(x, z, 1, 1, 1.414); rel(x, z, -1, 1, 1.414); }
  for (let i = 0; i < d.length; i++) if (d[i] > 1e5) d[i] = 12;
  return d;
}

/** Cria o "mundo de pixels": consultas por tile e campos suaves (distância com sinal da costa, altura de colina). */
export function prepararMundo(mapa, semente = 7) {
  const [L, A] = mapa.tamanho, ch = (x, z) => (x < 0 || z < 0 || x >= L || z >= A ? 'a' : mapa.planta[z][x]), grupo = (x, z) => GRUPO[ch(x, z)] ?? 'grama';
  const dAgua = campoDistancia(L, A, (x, z) => AGUA.has(mapa.planta[z][x])), dTerra = campoDistancia(L, A, (x, z) => !AGUA.has(mapa.planta[z][x])), dColina = campoDistancia(L, A, (x, z) => mapa.planta[z][x] !== 'h');
  const dRochaFora = campoDistancia(L, A, (x, z) => GRUPO[mapa.planta[z][x]] !== 'rocha');
  const val = (f, x, z, fora) => (x < 0 || z < 0 || x >= L || z >= A ? fora : f[z * L + x]);
  // valor de costa com sinal por tile: terra +(d−0,5), água −(d−0,5); fora do mapa = mar profundo
  const costa = (x, z) => { if (x < 0 || z < 0 || x >= L || z >= A) return -6; const i = z * L + x; return AGUA.has(mapa.planta[z][x]) ? -(dTerra[i] - 0.5) : dAgua[i] - 0.5; };
  const bil = (f, x, z) => { const fx = x - 0.5, fz = z - 0.5, i = Math.floor(fx), j = Math.floor(fz), tx = fx - i, tz = fz - j; return mix(mix(f(i, j), f(i + 1, j), tx), mix(f(i, j + 1), f(i + 1, j + 1), tx), tz); };
  const altColina = (x, z) => 0.7 * Math.max(0, bil((i, j) => val(dColina, i, j, 0), x, z) - 0.5); // sobe a partir da divisa
  const profMax = (x, z) => bil((i, j) => (RASA.has(ch(i, j)) ? 0.5 : 1.4), x, z);
  return { L, A, ch, grupo, costa: (x, z) => bil(costa, x, z), altColina, profMax, bil, semente, rochaDist: (x, z) => bil((i, j) => val(dRochaFora, i, j, 0), x, z) };
}

const FLORES = [R.espuma[2], R.brilho[1], R.telha[3], R.outono[2]];
/** Pixels do terreno. `quadro` (0..3): fase da água. */
export function pintarTerreno(mapa, { quadro = 0, mundo = prepararMundo(mapa), px = PX } = {}) {
  const { L, A, grupo, ch, semente } = mundo, img = novaImagem(L * px, A * px), s = semente;
  const q = quadro, fase = (q / 4) * Math.PI * 2;
  for (let py = 0; py < A * px; py++) for (let pxx = 0; pxx < L * px; pxx++) {
    const x = (pxx + 0.5) / px, z = (py + 0.5) / px, ru = fbm(x * 2.2, z * 2.2, s + 3) - 0.5, o = (py * img.w + pxx) * 4;
    let c;
    const sc = mundo.costa(x, z) + ru * 0.34 + (hash(pxx >> 1, py >> 1, s + 9) - 0.5) * 0.05;
    if (sc < 0) { // ------ ÁGUA
      const prof = lim((-sc) / Math.max(0.35, mundo.profMax(x, z))); // 0 junto à costa, 1 = mais fundo
      const pasta = prof < 0.18 ? 0 : prof < 0.5 ? 1 : 2; // rasa, média, funda
      const zona = pasta === 0 ? 'agua_rasa' : pasta === 1 ? 'agua_media' : 'agua_funda';
      const base = pasta === 0 ? (prof / 0.18) * 1.4 : pasta === 1 ? ((prof - 0.18) / 0.32) * 1.6 : 0.6 + ((prof - 0.5) / 0.5) * 2.6;
      const ond = Math.sin((pxx * 0.33 + py * 0.19) + fase * (RASA.has(ch(Math.floor(x), Math.floor(z))) ? -1 : 1)) + Math.sin(pxx * 0.11 - py * 0.27 + fase * 0.5) * 0.7 + (hash(pxx >> 2, py >> 2, s + 5) - 0.5) * 0.35;
      c = cor(zona, base + (ond > 1.3 ? (pasta === 2 ? 0.7 : 1.0) : 0) - (ond < -1.3 ? 0.6 : 0), pxx, py);
      if (ond > 1.65 && pasta === 1) c = R.agua_media[2];
      const osc = 0.05 * Math.sin(fase + (pxx + py) * 0.06); // espuma: ±2 px, em fase com o quadro
      if (-sc < 0.2 + osc + (hash(pxx >> 1, py >> 1, s + 11) - 0.5) * 0.08) c = -sc < 0.1 + osc ? R.espuma[passo(3, 1 + hash(pxx, py, 4) * 1.4, pxx, py)] : R.espuma[0];
      else if (-sc < 0.32 + osc && hash(pxx, py, s + 12) < 0.35) c = R.agua_rasa[2];
      if (pasta === 2 && hash(pxx >> 1, py >> 1, s + 13 + q) > 0.9985) c = R.espuma[2]; // brilhos que aparecem e somem
    } else { // ------ TERRA: vence o grupo de maior peso (bilinear dos 4 tiles + ruído)
      const fx = x - 0.5, fz = z - 0.5, i0 = Math.floor(fx), j0 = Math.floor(fz), tx = fx - i0, tz = fz - j0, pesos = {};
      const somar = (i, j, w) => { const g = grupo(i, j); if (g !== 'agua') pesos[g] = (pesos[g] ?? 0) + w; };
      somar(i0, j0, (1 - tx) * (1 - tz)); somar(i0 + 1, j0, tx * (1 - tz)); somar(i0, j0 + 1, (1 - tx) * tz); somar(i0 + 1, j0 + 1, tx * tz);
      let venc = 'grama', melhor = -1, seg = -1, k = 0;
      for (const g in pesos) { k++; const v = pesos[g] + (fbm(x * 3.3 + k * 19, z * 3.3, s + 21) - 0.5) * (g === 'estrada' || g === 'trilha' ? 0.5 : 0.7) + (hash(pxx, py, s + k) - 0.5) * 0.06; if (v > melhor) { seg = melhor; melhor = v; venc = g; } else if (v > seg) seg = v; }
      const grande = fbm(x * 0.4, z * 0.4, s + 31), medio = fbm(x * 1.3, z * 1.3, s + 32), fino = hash(pxx, py, s + 33), tufo = vn(pxx * 0.4, py * 0.4, s + 34);
      let tomGrama = 1.4 + grande * 3.2 + (medio - 0.5) * 1.2; // 6 tons por zona
      const altura = mundo.altColina(x, z), e = 0.06, luz = -(mundo.altColina(x + e, z) - mundo.altColina(x - e, z)) / (2 * e) * 0.9 - (mundo.altColina(x, z + e) - mundo.altColina(x, z - e)) / (2 * e) * 0.9; // luz do alto-esquerda
      tomGrama += lim(luz, -1.6, 1.6) * 1.4 + altura * 1.1;
      if (venc === 'praia' || sc < 0.1 + ru * 0.14) { // praia (e a faixa de areia ao longo de toda a costa)
        const molhado = sc < 0.04 + ru * 0.08;
        c = molhado ? R.areia[Math.min(1, passo(2, 0.6 + (medio - 0.5) * 1.5, pxx, py)) + 1] : cor('areia', 2.2 + (medio - 0.5) * 2 + (fino - 0.5) * 0.8, pxx, py);
        if (!molhado && fino > 0.995) c = R.rocha[3]; else if (!molhado && fino < 0.004) c = R.espuma[0]; // pedrinha e concha raras
      } else if (venc === 'mata') { c = cor('mata', 0.5 + grande * 2 + (fino - 0.5) * 0.9, pxx, py); if (tufo > 0.74) c = R.mata[0];
      } else if (venc === 'ralo') { c = cor('grama', 0.5 + grande * 1.8 + (fino - 0.5) * 0.8, pxx, py); if (tufo > 0.7) c = R.mata[2]; if (fino > 0.985) c = R.mata[1];
      } else if (venc === 'estrada' || venc === 'trilha') {
        const larga = venc === 'estrada', t0 = larga ? 3.1 : 2.3; c = cor('estrada', t0 + (medio - 0.5) * 1.4 + (fino - 0.5) * 0.9, pxx, py);
        const sulco = Math.abs(((pxx * 0.31 + py * 0.27) % 9) - 4.5) < 0.5 && larga && vn(pxx * 0.08, py * 0.08, s + 41) > 0.35; if (sulco) c = R.estrada[1];
        if (fino > 0.99) c = R.rocha[3]; else if (fino < 0.012) c = R.estrada[4];
        if (melhor - Math.max(seg, 0) < 0.12) c = misturar(c, cor('grama', tomGrama, pxx, py), 0.55); // grama invade a beira
      } else if (venc === 'cultivo') {
        const linha = Math.floor(py / 5 + vn(pxx * 0.02, py * 0.02, s + 51) * 0.6) % 2 === 0, sulcoY = py % 5 === 0;
        c = sulcoY ? R.cultivo[0] : linha ? cor('cultivo', 1.4 + (fino - 0.5), pxx, py) : cor('cultivo', 2.2 + (fino - 0.5), pxx, py);
        if (!sulcoY && pxx % 4 === 0 && fino > 0.35) c = hash(Math.floor(pxx / 4), Math.floor(py / 5), s + 52) > 0.45 ? R.grama[3] : R.outono[1];
      } else if (venc === 'rocha') {
        const d = mundo.rochaDist(x, z), t = 1.0 + grande * 2.4 + (fino - 0.5) * 1.1; c = d < 0.7 ? misturar(cor('rocha_quente', t * 0.8, pxx, py), cor('grama', tomGrama - 1, pxx, py), lim(1 - d / 0.7)) : cor('rocha_quente', t * 0.9, pxx, py);
      } else { // grama / prado / colina
        c = cor('grama', tomGrama + (fino - 0.5) * 0.9, pxx, py);
        if (tufo > 0.78 && fino > 0.4) c = R.grama[Math.max(0, passo(6, tomGrama, pxx, py) - 1)]; else if (tufo < 0.18 && fino > 0.6) c = R.grama[Math.min(5, passo(6, tomGrama, pxx, py) + 1)];
        if (venc === 'prado') { if (fino > 0.972) c = FLORES[Math.floor(hash(pxx >> 1, py >> 1, s + 61) * FLORES.length)]; else c = misturar(c, cor('prado_seco', 1 + grande * 1.5, pxx, py), 0.25); }
        else if (fino > 0.997) c = FLORES[Math.floor(hash(pxx >> 1, py >> 1, s + 62) * FLORES.length)];
        if (venc === 'colina' && altura > 0.18 && luz < -0.2) c = escurecer(c, 0.9);
      }
    }
    img.px[o] = c[0]; img.px[o + 1] = c[1]; img.px[o + 2] = c[2]; img.px[o + 3] = 255;
  }
  return img;
}
