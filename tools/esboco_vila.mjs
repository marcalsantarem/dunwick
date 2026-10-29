// Esboço de planta da vila (14 — Níveis e Mundo), desenhado a partir dos DADOS REAIS (data/maps/map_baixo_orvalho.json, os
// interiores e data/exploracao/z_enc_baixo_orvalho.json). Saída: docs/niveis/esboco_vila_v012_dados.png, para comparar com o
// esboço aprovado (docs/niveis/esboco_vila_v012.png). Não altera dados nem src/.
// Uso: node tools/esboco_vila.mjs [--cromo=caminho/chrome.exe]
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const arg = (n, p) => (process.argv.find((a) => a.startsWith(`--${n}=`)) || '').split('=')[1] || p;
const CROMO = arg('cromo', process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe');
const SAIDA = 'docs/niveis/esboco_vila_v012_dados.png';
const json = (c) => JSON.parse(readFileSync(c, 'utf8'));

const mapa = json('data/maps/map_baixo_orvalho.json');
const enc = json('data/exploracao/z_enc_baixo_orvalho.json');
const kit = json('data/config/cfg_kit.json');
const txt = json('data/texts/pt-BR.json').textos;
const interiores = mapa.edificios.filter((e) => e.interior).map((e) => json(`data/maps/${e.interior}.json`));
const [L, A] = mapa.tamanho;
const T = 24, M = 56, LEG = 560, Ti = 15; // px por tile (vila), margem, legenda, px por tile (interiores)
const W = M + L * T + 24 + LEG, H = M + A * T + 40;

const CHAO = { grama: '#a9c98a', terra: '#c9a774', calcada: '#cfcac0', musgo: '#7fa36a' };
const COR = {
  casa: '#8a5a3c', taverna: '#a0662e', forja: '#b5452f', posto: '#4f6fa8', fechada: '#9a8a7a', prop: '#5b3b24', saque: '#3b3530',
  portal: '#7b4fb0', inativo: '#9b8fb0', arvore: '#2f6b3a', pinheiro: '#1f4f2e', lanterna: '#f2c230', heroi: '#e0303a', seguro: '#2f9e5b',
};
const SAQUE = new Set(['arvore_queimada', 'muro_fuligem', 'pedra_enegrecida']);

const s = []; const add = (x) => s.push(x);
const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const texto = (x, y, t, o = {}) => add(`<text x="${x}" y="${y}" font-size="${o.tam || 13}" font-weight="${o.peso || 600}" fill="${o.cor || '#1b1b1b'}" text-anchor="${o.ancora || 'middle'}" ${o.fundo === false ? '' : 'paint-order="stroke" stroke="#fffdf6" stroke-width="3.5" stroke-linejoin="round"'}>${esc(t)}</text>`);

/** Desenha um mapa (chão, objetos, portais) com origem (ox, oy) e t px por tile. */
function desenharMapa(m, ox, oy, t, rotulos) {
  const px = (x) => ox + x * t, pz = (z) => oy + z * t;
  m.planta.forEach((linha, z) => [...linha].forEach((c, x) => add(`<rect x="${px(x)}" y="${pz(z)}" width="${t + 0.5}" height="${t + 0.5}" fill="${CHAO[m.legenda[c]]}"/>`)));
  const ret = (x, z, w, d, estilo) => add(`<rect x="${px(x - w / 2)}" y="${pz(z - d / 2)}" width="${w * t}" height="${d * t}" ${estilo}/>`);
  for (const o of m.objetos) {
    const p = kit.pegadas[o.tipo], e = o.escala ?? 1, cor = SAQUE.has(o.tipo) ? COR.saque : COR.prop;
    if (o.tipo === 'casa') continue; // edifícios abaixo
    if (o.tipo === 'moita') add(`<circle cx="${px(o.x)}" cy="${pz(o.z)}" r="${0.6 * e * t}" fill="#3f7a3c" stroke="#123" stroke-width="1"/>`);
    else if (o.tipo === 'tronco_caido') { const g = (o.rot ?? 0) % 180 === 90, hw = (g ? 0.25 : 1.1) * t, hd = (g ? 1.1 : 0.25) * t; add(`<rect x="${px(o.x) - hw}" y="${pz(o.z) - hd}" width="${2 * hw}" height="${2 * hd}" fill="#6b4a2a" stroke="#2a1a0c" stroke-width="1"/>`); }
    else if (o.tipo === 'arvore' || o.tipo === 'arbusto') add(`<circle cx="${px(o.x)}" cy="${pz(o.z)}" r="${(o.tipo === 'arvore' ? 0.55 : 0.4) * e * t}" fill="${o.tipo === 'arvore' ? COR.arvore : '#4f8a45'}" stroke="#123" stroke-width="1"/>`);
    else if (o.tipo === 'pinheiro') { const r = 0.55 * e * t; add(`<polygon points="${px(o.x)},${pz(o.z) - r} ${px(o.x) - r * 0.85},${pz(o.z) + r * 0.7} ${px(o.x) + r * 0.85},${pz(o.z) + r * 0.7}" fill="${COR.pinheiro}" stroke="#012" stroke-width="1"/>`); }
    else if (o.tipo === 'pedra') add(`<circle cx="${px(o.x)}" cy="${pz(o.z)}" r="${0.4 * e * t}" fill="#8d8d86" stroke="#333" stroke-width="1"/>`);
    else if (o.tipo === 'lanterna') add(`<circle cx="${px(o.x)}" cy="${pz(o.z)}" r="${t * 0.75}" fill="${COR.lanterna}33"/><circle cx="${px(o.x)}" cy="${pz(o.z)}" r="${Math.max(3, t * 0.3)}" fill="${COR.lanterna}" stroke="#5a4300" stroke-width="1.5"/>`);
    else if (o.tipo === 'poco') add(`<circle cx="${px(o.x)}" cy="${pz(o.z)}" r="${p.raio * t}" fill="#3d6f9e" stroke="#222" stroke-width="3"/>`);
    else if (o.tipo === 'inimigo') add(`<circle cx="${px(o.x)}" cy="${pz(o.z) - 6}" r="5" fill="#7a5230"/><rect x="${px(o.x) - 9}" y="${pz(o.z)}" width="18" height="3" fill="#7a5230"/>`);
    else if (p?.forma === 'linha') add(`<line x1="${px(o.x0)}" y1="${pz(o.z0)}" x2="${px(o.x1)}" y2="${pz(o.z1)}" stroke="${o.tipo === 'cerca' || o.tipo === 'estacada' ? '#7a5230' : o.tipo === 'muralha_baixa' ? '#8d8d86' : cor}" stroke-width="${Math.max(3, p.espessura * t)}" stroke-linecap="square"/>`);
    else if (p?.forma === 'dupla') { const w = o.w * t / 2; add(`<rect x="${px(o.x) - w}" y="${pz(o.z) - 3}" width="${2 * w}" height="6" fill="${cor}"/><circle cx="${px(o.x) - w}" cy="${pz(o.z)}" r="${p.raio * t}" fill="${cor}"/><circle cx="${px(o.x) + w}" cy="${pz(o.z)}" r="${p.raio * t}" fill="${cor}"/><circle cx="${px(o.x)}" cy="${pz(o.z) + 8}" r="4" fill="none" stroke="#222" stroke-width="2"/>`); }
    else if (p?.forma === 'circ') add(`<circle cx="${px(o.x)}" cy="${pz(o.z)}" r="${Math.max(2.5, p.raio * e * t)}" fill="${cor}" stroke="#111" stroke-width="1"/>`);
    else if (p?.forma === 'ret') ret(o.x, o.z, p.w ?? o.w, p.d ?? o.d, `fill="${o.tipo === 'quadro_avisos' ? '#d9c79a' : cor}" stroke="#111" stroke-width="1"`);
  }
  for (const e of m.edificios ?? []) {
    const cor = e.interior ? COR[e.tipo] : COR.fechada;
    ret(e.x, e.z, e.w, e.d, `fill="${cor}" stroke="#1b1b1b" stroke-width="2" rx="3"`);
    const pz2 = e.porta.lado === 's' || e.porta.lado === 'n'; // porta: traço claro na parede
    add(`<rect x="${px(e.porta.x) - (pz2 ? 0.6 : 0.15) * t}" y="${pz(e.porta.z) - (pz2 ? 0.15 : 0.6) * t}" width="${(pz2 ? 1.2 : 0.3) * t}" height="${(pz2 ? 0.3 : 1.2) * t}" fill="#f1e7c9" stroke="#222"/>`);
    if (rotulos) texto(px(e.x), pz(e.z) + 5, e.interior ? txt[`txt_poi_${e.id}`] ?? txt[`txt_map_${e.id}_interior_nome`] : 'casa (fechada)', { tam: e.interior ? 13 : 11 });
  }
  for (const p of m.portais ?? []) {
    ret(p.x, p.z, p.w, p.d, `fill="${p.ativo ? COR.portal : COR.inativo}55" stroke="${p.ativo ? COR.portal : COR.inativo}" stroke-width="2" stroke-dasharray="${p.ativo ? '0' : '4 3'}"`);
    add(`<circle cx="${px(p.chegada.x)}" cy="${pz(p.chegada.z)}" r="${Math.max(2.5, t * 0.15)}" fill="${COR.portal}"/>`);
  }
  const [ix, iz] = m.inicio_jogador.tile;
  add(`<circle cx="${px(ix + 0.5)}" cy="${pz(iz + 0.5)}" r="${Math.max(4, t * 0.38)}" fill="${COR.heroi}" stroke="#fff" stroke-width="2"/>`);
}

// ---- Vila ----
const px = (x) => M + x * T, pz = (z) => M + z * T;
add(`<rect width="${W}" height="${H}" fill="#f4efe3"/>`);
desenharMapa(mapa, M, M, T, true);
for (let i = 0; i <= L; i++) {
  const f = i % 8 === 0;
  add(`<line x1="${px(i)}" y1="${pz(0)}" x2="${px(i)}" y2="${pz(A)}" stroke="${f ? '#00000080' : '#00000014'}" stroke-width="${f ? 1.5 : 1}"/>`);
  add(`<line x1="${px(0)}" y1="${pz(i)}" x2="${px(L)}" y2="${pz(i)}" stroke="${f ? '#00000080' : '#00000014'}" stroke-width="${f ? 1.5 : 1}"/>`);
  if (f) { texto(px(i), M - 10, String(i), { fundo: false }); texto(M - 8, pz(i) + 5, String(i), { ancora: 'end', fundo: false }); }
}
texto(px(L / 2), 20, 'x (oeste → leste)', { fundo: false, cor: '#555' });
add(`<text x="16" y="${pz(A / 2)}" font-size="13" font-weight="600" fill="#555" text-anchor="middle" transform="rotate(-90 16 ${pz(A / 2)})">z (norte → sul)</text>`);
for (const z of enc.zonas_seguras) add(`<rect x="${px(z.ret[0]) + 3}" y="${pz(z.ret[1]) + 3}" width="${(z.ret[2] - z.ret[0] + 1) * T - 6}" height="${(z.ret[3] - z.ret[1] + 1) * T - 6}" fill="none" stroke="${COR.seguro}" stroke-width="4" stroke-dasharray="12 6"/>`);
const posRot = { portico: [0, -14], quadro_avisos: [0, 24], poco: [0, 40], patio_torvan: [0, -64], saida_norte: [0, 34], saida_sul: [0, -20] };
for (const p of mapa.pois) if (posRot[p.id]) texto(px(p.x) + posRot[p.id][0], pz(p.z) + posRot[p.id][1], txt[p.nome_txt], { tam: 12, cor: p.tipo === 'saida' ? COR.portal : '#1b1b1b' });
const rotProp = { forja_brasa: 'brasa', canteiro_maren: 'ervas', rack_armas_patio: 'armas', arvore_queimada: 'árvore queimada', muro_fuligem: 'muro com fuligem', pedra_enegrecida: 'pedra enegrecida', quadro_editais: 'editais' };
for (const o of mapa.objetos) if (rotProp[o.id]) texto(px(o.x ?? (o.x0 + o.x1) / 2), pz(o.z ?? o.z0) + (o.id === 'muro_fuligem' ? 22 : o.id === 'pedra_enegrecida' ? 64 : 26), rotProp[o.id], { tam: 11, peso: 500 });
const [hx, hz] = mapa.inicio_jogador.tile; texto(px(hx + 0.5) + 14, pz(hz + 0.5) + 5, 'início do herói', { tam: 12, ancora: 'start', cor: COR.heroi });
const rx = px(L) - 30, rz = pz(0) + 36;
add(`<circle cx="${rx}" cy="${rz}" r="20" fill="#fffdf6cc" stroke="#333"/><polygon points="${rx},${rz - 17} ${rx - 6},${rz} ${rx + 6},${rz}" fill="#333"/>`); texto(rx, rz + 15, 'N', { tam: 12 });

// ---- Legenda ----
const lx = M + L * T + 24; let ly = M;
const linha = (t, o = {}) => { texto(lx + (o.rec || 0), ly, t, { ancora: 'start', tam: o.tam || 13, peso: o.peso || 500, cor: o.cor, fundo: false }); ly += o.passo || 20; };
const amostra = (estilo, t) => { add(`<rect x="${lx}" y="${ly - 13}" width="22" height="16" ${estilo}/>`); linha(t, { rec: 32 }); };
linha('Baixo Orvalho — v0.1.2 (dados reais)', { tam: 17, peso: 700, passo: 22 });
linha(`map_baixo_orvalho · ${mapa.objetos.length} objetos · ${mapa.edificios.length} edifícios · ${mapa.portais.length} portais`, { tam: 12, cor: '#555', passo: 26 });
amostra(`fill="${COR.casa}" stroke="#222"`, 'casa com interior');
amostra(`fill="${COR.taverna}" stroke="#222"`, 'taverna');
amostra(`fill="${COR.forja}" stroke="#222"`, 'forja');
amostra(`fill="${COR.posto}" stroke="#222"`, 'posto do escrivão');
amostra(`fill="${COR.fechada}" stroke="#222"`, 'casa de morador (fechada, sem interior)');
amostra(`fill="#f1e7c9" stroke="#222"`, 'porta');
amostra(`fill="${COR.portal}55" stroke="${COR.portal}" stroke-width="2"`, 'portal ativo (porta ↔ interior) · ponto = chegada');
amostra(`fill="${COR.inativo}55" stroke="${COR.inativo}" stroke-width="2" stroke-dasharray="4 3"`, 'saída inativa (v0.1.3)');
amostra(`fill="${COR.prop}" stroke="#111"`, 'prop do kit (pórtico, quadro, brasa, ervas, armas)');
amostra(`fill="${COR.saque}" stroke="#111"`, 'marcas do saque');
amostra(`fill="none" stroke="${COR.seguro}" stroke-width="3" stroke-dasharray="8 4"`, 'zona segura: a vila inteira (sem encontros)');
amostra(`fill="${COR.heroi}"`, 'início do herói');
ly += 10; linha('Interiores (um cômodo; saída na borda sul)', { peso: 700, passo: 12 });
// interiores em 2 colunas, mesma escala entre si
let col = 0, topo = ly, alt = 0;
for (const m of interiores) {
  const [l, a] = m.tamanho, ox = lx + col * 280, oy = topo + 20;
  texto(ox, oy - 4, txt[m.nome_txt], { ancora: 'start', tam: 12, fundo: false });
  add(`<rect x="${ox - 3}" y="${oy - 3 + 4}" width="${l * Ti + 6}" height="${a * Ti + 6}" fill="${m.ambiente.fundo}"/>`);
  desenharMapa(m, ox, oy + 4, Ti, false);
  texto(ox + l * Ti + 4, oy + 4 + a * Ti, `${l}×${a}`, { ancora: 'start', tam: 10, peso: 500, fundo: false, cor: '#555' });
  alt = Math.max(alt, a * Ti + 34);
  if (++col === 2) { col = 0; topo += alt; alt = 0; }
}
ly = topo + alt + 16;
linha('Mudanças em relação ao esboço aprovado', { peso: 700 });
for (const t of ['Forja 1 tile mais ao sul (36–40 × 12–16): a chegada', '  da porta ficava num canto colado à taverna.',
  'Torre do sino substituída pelo pórtico; árvores', '  regeradas longe de prédios, caminhos e saídas.',
  'Encontros removidos da vila (D-038).', 'Casa do Edric isolada no canto noroeste (29/10);', '  mapa 94×94: estacada no perímetro, vãos N/S com', '  muralha e troncos (saídas interditadas), mata densa', '  fora do muro até a borda.']) linha(t, { tam: 12 });

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" font-family="Segoe UI, Arial, sans-serif">${s.join('')}</svg>`;
const nav = await puppeteer.launch({ executablePath: CROMO, headless: 'new' });
const pag = await nav.newPage();
await pag.setViewport({ width: W, height: H });
await pag.setContent(`<html><body style="margin:0">${svg}</body></html>`);
const png = await pag.screenshot({ clip: { x: 0, y: 0, width: W, height: H } });
await nav.close();
mkdirSync('docs/niveis', { recursive: true });
writeFileSync(SAIDA, png);
console.log(`${SAIDA} (${W}×${H})`);
