// Esboço de planta da vila (14 — Níveis e Mundo), v0.1.2 em planejamento.
// Gera docs/niveis/esboco_vila_v012.png: chão do map_baixo_orvalho_praca + proposta de lugares,
// zonas seguras e zonas de encontro atuais (para ver o conflito). Não altera dados nem src/.
// Uso: node tools/esboco_vila.mjs [--cromo=caminho/chrome.exe]
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const arg = (n, p) => (process.argv.find((a) => a.startsWith(`--${n}=`)) || '').split('=')[1] || p;
const CROMO = arg('cromo', process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe');
const SAIDA = 'docs/niveis/esboco_vila_v012.png';

const mapa = JSON.parse(readFileSync('data/maps/map_baixo_orvalho_praca.json', 'utf8'));
const enc = JSON.parse(readFileSync('data/exploracao/z_enc_baixo_orvalho_praca.json', 'utf8'));
const [L, A] = mapa.tamanho;
const T = 24; // px por tile no esboço
const M = 56; // margem dos eixos
const LEG = 470; // largura da legenda
const W = M + L * T + 24 + LEG, H = M + A * T + 40;

const CHAO = { g: '#a9c98a', t: '#c9a774', c: '#cfcac0', m: '#7fa36a' };
const COR = {
  casa: '#8a5a3c', especial: '#b5452f', treino: '#d9b35a', escrivao: '#4f6fa8', saque: '#3b3530',
  portal: '#7b4fb0', arvore: '#2f6b3a', pinheiro: '#1f4f2e', lanterna: '#f2c230', heroi: '#e0303a',
  seguro: '#2f9e5b', encontro: '#d0342c',
};

// ---- Proposta (tiles; retângulos [x0, z0, x1, z1] inclusivos; x = leste, z = sul) ----
const LUGARES = [
  { r: [11, 8, 16, 12], cor: COR.casa, rot: 'Casa da Maren', sub: 'ervas, estante' },
  { r: [28, 7, 34, 12], cor: COR.casa, rot: 'Taverna', sub: '' },
  { r: [36, 11, 40, 15], cor: COR.especial, rot: 'Forja', sub: 'brasa' },
  { r: [6, 15, 10, 18], cor: COR.casa, rot: 'Casa do Torvan', sub: '' },
  { r: [38, 21, 42, 26], cor: COR.escrivao, rot: 'Posto do escrivão', sub: 'Coroa, editais' },
  { r: [12, 36, 15, 39], cor: COR.casa, rot: 'Casa', sub: '' },
  { r: [17, 40, 20, 43], cor: COR.casa, rot: 'Casa', sub: '' },
  { r: [28, 39, 31, 42], cor: COR.casa, rot: 'Casa nova', sub: '' },
  { r: [32, 39, 33, 42], cor: COR.saque, rot: '', sub: '' },
  { r: [35, 35, 38, 38], cor: COR.casa, rot: 'Casa', sub: '' },
];
const AREAS = [ // contornos tracejados
  { r: [7, 20, 19, 27], cor: COR.treino, rot: 'Pátio de treino (Torvan)', d: 'cerca existente' },
];
const PONTOS = [ // marcadores pequenos: [x, z, forma, cor, rótulo]
  [24, 24, 'poco', '#3d6f9e', 'Poço'],
  [24, 19.5, 'portico', '#5b3b24', 'Pórtico (gancho vazio do Sino de Cobre)'],
  [28.5, 21, 'quadro', '#6b4a2b', 'Quadro de avisos'],
  [19, 19, 'lanterna', COR.lanterna, ''], [29, 19, 'lanterna', COR.lanterna, ''],
  [19, 29, 'lanterna', COR.lanterna, ''], [29, 29, 'lanterna', COR.lanterna, ''],
  [11.5, 24, 'boneco', '#7a5230', ''], [16.5, 24, 'boneco', '#7a5230', 'bonecos de treino'],
  [26, 36, 'queimada', COR.saque, 'Árvore queimada (rebrotando)'],
  [32.5, 43.6, 'nada', COR.saque, 'pedra enegrecida'],
  [41, 26.6, 'quadro', '#6b4a2b', ''],
];
const MUROS = [[8, 42, 14, 42, 'Muro com fuligem']];
const PORTAIS = [[23.5, 1, 'Saída norte (inativa)'], [23.5, 46, 'Saída sul (inativa)']];
const HEROI = mapa.inicio_jogador.tile;

// ---- SVG ----
const px = (x) => M + x * T, pz = (z) => M + z * T;
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const s = [];
const add = (x) => s.push(x);
const texto = (x, y, t, o = {}) => add(`<text x="${x}" y="${y}" font-size="${o.tam || 13}" font-weight="${o.peso || 600}" fill="${o.cor || '#1b1b1b'}" text-anchor="${o.ancora || 'middle'}" ${o.fundo === false ? '' : 'paint-order="stroke" stroke="#fffdf6" stroke-width="3.5" stroke-linejoin="round"'}>${esc(t)}</text>`);
const ret = ([x0, z0, x1, z1], estilo) => add(`<rect x="${px(x0)}" y="${pz(z0)}" width="${(x1 - x0 + 1) * T}" height="${(z1 - z0 + 1) * T}" ${estilo}/>`);

add(`<rect width="${W}" height="${H}" fill="#f4efe3"/>`);
mapa.planta.forEach((linha, z) => [...linha].forEach((c, x) =>
  add(`<rect x="${px(x)}" y="${pz(z)}" width="${T}" height="${T}" fill="${CHAO[c]}"/>`)));

// grade: fina a cada tile, forte a cada 8
for (let i = 0; i <= L; i++) {
  const f = i % 8 === 0;
  add(`<line x1="${px(i)}" y1="${pz(0)}" x2="${px(i)}" y2="${pz(A)}" stroke="${f ? '#00000080' : '#00000018'}" stroke-width="${f ? 1.5 : 1}"/>`);
  add(`<line x1="${px(0)}" y1="${pz(i)}" x2="${px(L)}" y2="${pz(i)}" stroke="${f ? '#00000080' : '#00000018'}" stroke-width="${f ? 1.5 : 1}"/>`);
  if (f) {
    texto(px(i), M - 10, String(i), { tam: 13, fundo: false });
    texto(M - 8, pz(i) + 5, String(i), { tam: 13, ancora: 'end', fundo: false });
  }
}
texto(px(L / 2), 20, 'x (oeste → leste)', { tam: 13, fundo: false, cor: '#555' });
add(`<text x="16" y="${pz(A / 2)}" font-size="13" font-weight="600" fill="#555" text-anchor="middle" transform="rotate(-90 16 ${pz(A / 2)})">z (norte → sul)</text>`);

// zonas de encontro (vermelho hachurado) e seguras (verde)
add(`<defs><pattern id="hach" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="10" height="10" fill="${COR.encontro}1f"/><line x1="0" y1="0" x2="0" y2="10" stroke="${COR.encontro}88" stroke-width="3"/></pattern></defs>`);
for (const z of enc.zonas_encontro) ret(z.ret, `fill="url(#hach)" stroke="${COR.encontro}" stroke-width="2.5"`);
for (const z of enc.zonas_seguras) ret(z.ret, `fill="${COR.seguro}22" stroke="${COR.seguro}" stroke-width="3" stroke-dasharray="10 5"`);
const rotZona = { z_enc_norte: [40, 4.5], z_enc_sul: [44, 45.5], z_enc_leste: [44.5, 33], z_enc_oeste: [2.5, 33] };
for (const z of enc.zonas_encontro) texto(px(rotZona[z.id][0]), pz(rotZona[z.id][1]), z.id, { cor: COR.encontro, tam: 12 });
texto(px(34.5), pz(33.6), 'z_seguro_praca', { cor: COR.seguro, tam: 12, ancora: 'end' });
texto(px(6.5), pz(29.6), 'z_seguro_treino', { cor: COR.seguro, tam: 12, ancora: 'start' });

// árvores e pinheiros do mapa atual (bordas)
for (const o of mapa.objetos) {
  if (o.tipo !== 'arvore' && o.tipo !== 'pinheiro') continue;
  const r = 0.55 * (o.escala || 1) * T;
  if (o.tipo === 'arvore') add(`<circle cx="${px(o.x)}" cy="${pz(o.z)}" r="${r}" fill="${COR.arvore}" stroke="#123" stroke-width="1"/>`);
  else add(`<polygon points="${px(o.x)},${pz(o.z) - r} ${px(o.x) - r * 0.85},${pz(o.z) + r * 0.7} ${px(o.x) + r * 0.85},${pz(o.z) + r * 0.7}" fill="${COR.pinheiro}" stroke="#012" stroke-width="1"/>`);
}

// áreas e prédios
for (const a of AREAS) {
  ret(a.r, `fill="${a.cor}40" stroke="${a.cor}" stroke-width="3" stroke-dasharray="6 4"`);
  texto(px((a.r[0] + a.r[2] + 1) / 2), pz(a.r[1]) + 18, a.rot, { tam: 13 });
}
const dentro = (r, q) => r[0] >= q[0] && r[2] <= q[2] && r[1] >= q[1] && r[3] <= q[3];
const cruza = (r, q) => r[0] <= q[2] && r[2] >= q[0] && r[1] <= q[3] && r[3] >= q[1];
const conflitos = [];
for (const l of LUGARES) {
  const emSeguro = enc.zonas_seguras.some((z) => dentro(l.r, z.ret));
  const zonas = enc.zonas_encontro.filter((z) => cruza(l.r, z.ret)).map((z) => z.id);
  const conflito = !emSeguro && zonas.length > 0;
  if (conflito && l.rot) conflitos.push(`${l.rot} → ${zonas.join(', ')}`);
  ret(l.r, `fill="${l.cor}" stroke="${conflito ? COR.encontro : '#1b1b1b'}" stroke-width="${conflito ? 4 : 2}" rx="3"`);
  if (!l.rot) continue;
  const cx = px((l.r[0] + l.r[2] + 1) / 2), cy = pz((l.r[1] + l.r[3] + 1) / 2);
  texto(cx, cy + (l.sub ? -2 : 5), l.rot + (conflito ? ' ⚠' : ''), { tam: 13 });
  if (l.sub) texto(cx, cy + 14, l.sub, { tam: 11, peso: 500 });
}
for (const [x0, z0, x1, z1, rot] of MUROS) {
  add(`<line x1="${px(x0)}" y1="${pz(z0 + 0.5)}" x2="${px(x1 + 1)}" y2="${pz(z1 + 0.5)}" stroke="${COR.saque}" stroke-width="9" stroke-linecap="square"/>`);
  texto(px((x0 + x1 + 1) / 2), pz(z0) + 34, rot, { tam: 12 });
}
for (const [x, z, forma, cor, rot] of PONTOS) {
  const X = px(x), Z = pz(z);
  if (forma === 'poco') add(`<circle cx="${X}" cy="${Z}" r="${T * 0.8}" fill="${cor}" stroke="#222" stroke-width="3"/>`);
  if (forma === 'portico') add(`<rect x="${X - T * 1.5}" y="${Z - 4}" width="${T * 3}" height="8" fill="${cor}"/><rect x="${X - T * 1.5}" y="${Z - 10}" width="8" height="20" fill="${cor}"/><rect x="${X + T * 1.5 - 8}" y="${Z - 10}" width="8" height="20" fill="${cor}"/><circle cx="${X}" cy="${Z + 9}" r="5" fill="none" stroke="#222" stroke-width="2.5"/>`);
  if (forma === 'quadro') add(`<rect x="${X - 14}" y="${Z - 8}" width="28" height="16" fill="${cor}" stroke="#222" stroke-width="2"/><rect x="${X - 10}" y="${Z - 5}" width="8" height="9" fill="#f1e7c9"/><rect x="${X + 1}" y="${Z - 5}" width="8" height="9" fill="#f1e7c9"/>`);
  if (forma === 'lanterna') add(`<circle cx="${X}" cy="${Z}" r="8" fill="${cor}" stroke="#5a4300" stroke-width="2"/><circle cx="${X}" cy="${Z}" r="16" fill="${cor}33"/>`);
  if (forma === 'boneco') add(`<circle cx="${X}" cy="${Z - 6}" r="5" fill="${cor}"/><rect x="${X - 2}" y="${Z - 2}" width="4" height="12" fill="${cor}"/><rect x="${X - 9}" y="${Z}" width="18" height="3" fill="${cor}"/>`);
  if (forma === 'queimada') add(`<circle cx="${X}" cy="${Z}" r="${T * 0.75}" fill="${cor}" stroke="#000" stroke-width="1"/><circle cx="${X + 7}" cy="${Z - 7}" r="6" fill="#7cc35b"/><circle cx="${X - 6}" cy="${Z + 5}" r="4" fill="#7cc35b"/>`);
  if (rot) {
    const dz = forma === 'poco' ? 36 : forma === 'portico' ? -16 : forma === 'boneco' ? 26 : forma === 'nada' ? 0 : 30;
    texto(X, Z + dz, rot, { tam: 12 });
  }
}
for (const [x, z, rot] of PORTAIS) {
  add(`<rect x="${px(x) - T * 1.5}" y="${pz(z) - T * 0.5}" width="${T * 3}" height="${T}" fill="${COR.portal}55" stroke="${COR.portal}" stroke-width="3" stroke-dasharray="4 3" rx="6"/>`);
  texto(px(x), pz(z) + (z < 10 ? 28 : -18), rot, { tam: 12, cor: COR.portal });
}
// herói
const [hx, hz] = [px(HEROI[0] + 0.5), pz(HEROI[1] + 0.5)];
add(`<circle cx="${hx}" cy="${hz}" r="10" fill="${COR.heroi}" stroke="#fff" stroke-width="3"/><polygon points="${hx - 6},${hz + 12} ${hx + 6},${hz + 12} ${hx},${hz + 20}" fill="${COR.heroi}"/>`);
texto(hx + 14, hz + 5, 'Início do herói', { tam: 12, ancora: 'start', cor: COR.heroi });
// rosa dos ventos
const rx = px(L) - 30, rz = pz(0) + 36;
add(`<circle cx="${rx}" cy="${rz}" r="20" fill="#fffdf6cc" stroke="#333"/><polygon points="${rx},${rz - 17} ${rx - 6},${rz} ${rx + 6},${rz}" fill="#333"/>`);
texto(rx, rz + 15, 'N', { tam: 12 });

// ---- Legenda ----
const lx = M + L * T + 24;
let ly = M;
const linha = (t, o = {}) => { texto(lx + (o.rec || 0), ly, t, { ancora: 'start', tam: o.tam || 13, peso: o.peso || 500, cor: o.cor, fundo: false }); ly += o.passo || 20; };
const amostra = (estilo, t) => { add(`<rect x="${lx}" y="${ly - 13}" width="22" height="16" ${estilo}/>`); linha(t, { rec: 32 }); };
linha('Vila de Baixo Orvalho — esboço v0.1.2', { tam: 17, peso: 700, passo: 22 });
linha('Proposta do Produtor + ajustes do 14. Sem escala de arte.', { tam: 12, cor: '#555', passo: 28 });
linha('Chão (mapa atual)', { peso: 700 });
for (const [c, n] of Object.entries(mapa.legenda)) amostra(`fill="${CHAO[c]}" stroke="#555"`, n === 'calcada' ? 'calçada' : n);
ly += 8; linha('Lugares', { peso: 700 });
amostra(`fill="${COR.casa}" stroke="#222"`, 'casa / prédio');
amostra(`fill="${COR.especial}" stroke="#222"`, 'forja');
amostra(`fill="${COR.escrivao}" stroke="#222"`, 'posto da Coroa');
amostra(`fill="${COR.treino}40" stroke="${COR.treino}" stroke-width="2" stroke-dasharray="6 4"`, 'pátio de treino');
amostra(`fill="${COR.saque}" stroke="#222"`, 'marcas do saque (fuligem, pedra enegrecida)');
amostra(`fill="${COR.portal}55" stroke="${COR.portal}" stroke-width="2" stroke-dasharray="4 3"`, 'saída (portal inativo)');
amostra(`fill="${COR.lanterna}" stroke="#5a4300"`, 'lanterna');
amostra(`fill="${COR.arvore}"`, 'árvore / pinheiro (posições atuais)');
amostra(`fill="${COR.heroi}"`, 'início do herói (tile 24,28)');
ly += 8; linha('Zonas (dados atuais)', { peso: 700 });
amostra(`fill="${COR.seguro}22" stroke="${COR.seguro}" stroke-width="2" stroke-dasharray="6 3"`, 'zona segura (sem encontros)');
amostra(`fill="url(#hach)" stroke="${COR.encontro}" stroke-width="2"`, 'zona de encontro z_enc_*');
amostra(`fill="#fff" stroke="${COR.encontro}" stroke-width="4"`, 'prédio dentro de zona de encontro ⚠');
ly += 8; linha('Conflitos com a proposta', { peso: 700, cor: COR.encontro });
for (const c of conflitos) linha('• ' + c, { tam: 12 });
linha('• Saídas norte e sul ficam dentro de z_enc_norte/sul', { tam: 12 });
linha('• Estrada leste-oeste (z 23–24) cruza z_enc_leste/oeste', { tam: 12 });
linha('→ a vila toda precisa de zona segura; encontros só', { tam: 12, cor: '#555' });
linha('   fora da vila (região aberta), não nas bordas.', { tam: 12, cor: '#555', passo: 28 });
linha('Minimapa', { peso: 700 });
linha('Canto superior direito da tela (não desenhado aqui);', { tam: 12 });
linha('mostraria esta planta com prédios e saídas.', { tam: 12, passo: 28 });
linha('Ajustes do 14 em relação ao pedido', { peso: 700 });
for (const t of [
  'Pórtico substitui a torre do sino (antes em 24,13.5),',
  '  agora na borda norte da praça (24,19.5).',
  'Forja vai para o nordeste (36–40, 11–15), saindo',
  '  da praça; escrivão sai do sudoeste para o leste.',
  'Casa do Torvan colada ao pátio de treino (oeste).',
  'Lanternas: 4 nas diagonais da praça (eram 8+4).',
  'Prédios dos cantos atuais (casa_a/b/c) viram',
  '  as casas do sul.',
]) linha(t, { tam: 12 });

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" font-family="Segoe UI, Arial, sans-serif">${s.join('')}</svg>`;

const nav = await puppeteer.launch({ executablePath: CROMO, headless: 'new' });
const pag = await nav.newPage();
await pag.setViewport({ width: W, height: H });
await pag.setContent(`<html><body style="margin:0">${svg}</body></html>`);
const png = await pag.screenshot({ clip: { x: 0, y: 0, width: W, height: H } });
await nav.close();
mkdirSync('docs/niveis', { recursive: true });
writeFileSync(SAIDA, png);
console.log(`${SAIDA} (${W}×${H}) — conflitos: ${conflitos.length}`);
