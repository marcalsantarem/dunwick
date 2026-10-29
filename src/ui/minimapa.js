// Minimapa (15, D-041): gira com a tela (cima do minimapa = cima da tela, giro da câmera isométrica). Lê plataforma.mapaAtivo()
// (objeto estável por mapa) e mundo.heroi (x, z, face). A BASE (chão, edifícios, portas, passagens) é desenhada UMA vez por mapa
// num canvas fora da tela; por quadro só se gira/move a base e se desenham a seta do herói e os pontos de interesse (de pé, legíveis).
// Exterior: centrado no herói. Interior: o cômodo inteiro cabe e a seta anda. Nada só por cor: formas, ícones, legenda e texto alternativo.
import { mundoParaMini, miniParaMundo, anguloSeta, maisProximo } from './minimapa_geo.js';

// chão por material (paleta neutra v0.2); no alto contraste o chão vira dois tons e os elementos ganham contorno forte
const CHAO = { grama: '#478638', terra: '#875a3b', calcada: '#a99d90', musgo: '#01523c', agua: '#3b6e8f' };
const COR = { fundo: '#120c07', casa: '#5c3120', casaBorda: '#ece7dd', porta: '#fcd176', passagem: '#fcd176', fechada: '#685a50', poi: '#fdf0dc', poiBorda: '#211209', heroi: '#ffe79d', heroiBorda: '#211209' };
const CONTRASTE = { chao: '#3a332c', chaoBorda: '#000000', casa: '#000000', casaBorda: '#ffffff', porta: '#ffe79d', passagem: '#ffffff', fechada: '#9a9a9a' };
const ICONE_POI = { poco: '◎', portico: '⌂', torre_sino: '♜', loja: '$', forja: '⚒', taverna: '♨', praca: '✦' };

function el(tag, classe, pai, texto) { const e = document.createElement(tag); if (classe) e.className = classe; if (texto !== undefined) e.textContent = texto; if (pai) pai.appendChild(e); return e; }

/** Pura: desenha a base de um mapa em `ctx` (B px por tile). Exportada para medir e testar. */
export function desenharBase(ctx, mapa, B, contraste) {
  const [L, A] = mapa.tamanho;
  ctx.fillStyle = COR.fundo; ctx.fillRect(0, 0, L * B, A * B);
  mapa.planta.forEach((linha, z) => { for (let x = 0; x < linha.length; x++) { const mat = mapa.legenda[linha[x]]; if (!mat) continue; ctx.fillStyle = contraste ? CONTRASTE.chao : (CHAO[mat] ?? CHAO.terra); ctx.fillRect(x * B, z * B, B, B); } });
  for (const e of mapa.edificios) { // bloco (x, z = centro) com contorno; porta como marca dourada no lado dela
    ctx.save(); ctx.translate(e.x * B, e.z * B); ctx.rotate(((e.rot ?? 0) * Math.PI) / 180);
    ctx.fillStyle = contraste ? CONTRASTE.casa : COR.casa; ctx.fillRect((-e.w / 2) * B, (-e.d / 2) * B, e.w * B, e.d * B);
    ctx.lineWidth = Math.max(1, B / 4); ctx.strokeStyle = contraste ? CONTRASTE.casaBorda : COR.casaBorda; ctx.strokeRect((-e.w / 2) * B, (-e.d / 2) * B, e.w * B, e.d * B);
    ctx.restore();
    if (e.porta) { ctx.fillStyle = contraste ? CONTRASTE.porta : COR.porta; ctx.fillRect((e.porta.x - 0.6) * B, (e.porta.z - 0.6) * B, 1.2 * B, 1.2 * B); }
  }
  for (const p of mapa.portais) { // passagem: moldura clara; fechada: cinza com um X (forma, não só cor)
    const x0 = (p.x - p.w / 2) * B, z0 = (p.z - p.d / 2) * B, w = p.w * B, d = p.d * B;
    ctx.lineWidth = Math.max(1, B / 3); ctx.strokeStyle = p.interditado ? (contraste ? CONTRASTE.fechada : COR.fechada) : (contraste ? CONTRASTE.passagem : COR.passagem); ctx.strokeRect(x0, z0, w, d);
    if (p.interditado) { ctx.beginPath(); ctx.moveTo(x0, z0); ctx.lineTo(x0 + w, z0 + d); ctx.moveTo(x0 + w, z0); ctx.lineTo(x0, z0 + d); ctx.stroke(); }
  }
}

export function criarMinimapa({ mundo, t, cfg, plataforma = {}, preferencia, visivel }) {
  const C = cfg.minimapa, pai = document.getElementById('ui') ?? document.body;
  const raiz = el('div', 'minimapa', pai); raiz.hidden = true;
  const tela = el('canvas', 'minimapa-tela', raiz); tela.setAttribute('role', 'img');
  const dica = el('div', 'minimapa-dica', raiz); dica.hidden = true;
  const legenda = el('ul', 'minimapa-legenda', raiz);
  for (const [simbolo, id] of [['■', 'ui_minimapa_leg_casa'], ['▪', 'ui_minimapa_leg_porta'], ['▢', 'ui_minimapa_leg_passagem'], ['☒', 'ui_minimapa_leg_fechada'], ['●', 'ui_minimapa_leg_local'], ['▲', 'ui_minimapa_leg_voce']]) {
    const li = el('li', '', legenda); el('span', 'minimapa-simbolo', li, simbolo); el('span', '', li, t(id));
  }
  const ctx = tela.getContext('2d'), base = document.createElement('canvas'), bctx = base.getContext('2d');
  let mapaBase = null, contrasteBase = null, chave = '', param = null, dicaAte = 0, sobre = null;
  const medidas = { quadros: 0, ms: 0, bases: 0 }; // custo medido (o teste lê)

  const fonte = () => plataforma.mapaAtivo?.() ?? null;
  function montarBase(m, contraste) {
    const t0 = performance.now(); base.width = m.tamanho[0] * C.px_base; base.height = m.tamanho[1] * C.px_base;
    desenharBase(bctx, m, C.px_base, contraste); mapaBase = m; contrasteBase = contraste; medidas.bases++; medidas.msBase = performance.now() - t0;
    tela.setAttribute('aria-label', t('ui_minimapa_alt', { nome_mapa: t(m.nome_txt) }));
  }

  function desenhar(m, contraste) {
    const h = mundo.heroi, S = raiz.clientWidth, dpr = globalThis.devicePixelRatio || 1, [L, A] = m.tamanho;
    const escala = m.interior ? Math.min(C.px_por_tile_interior_max, (S * 0.86) / Math.max(L, A)) : C.px_por_tile_exterior;
    param = { cx: m.interior ? L / 2 : h.x, cz: m.interior ? A / 2 : h.z, giroGraus: m.giro_graus, escala, meio: S / 2 };
    const k = [m.id, contraste, S, dpr, h.x.toFixed(2), h.z.toFixed(2), h.face.toFixed(2), sobre?.id ?? ''].join('|');
    if (k === chave) return; chave = k;
    const t0 = performance.now();
    if (tela.width !== Math.round(S * dpr)) { tela.width = tela.height = Math.round(S * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = COR.fundo; ctx.fillRect(0, 0, S, S);
    ctx.save(); ctx.translate(param.meio, param.meio); ctx.rotate((param.giroGraus * Math.PI) / 180);
    ctx.scale(escala / C.px_base, escala / C.px_base); ctx.translate(-param.cx * C.px_base, -param.cz * C.px_base); ctx.imageSmoothingEnabled = true;
    ctx.drawImage(base, 0, 0); ctx.restore();
    // pontos de interesse: ícone de pé (não gira), com contorno; o realçado (sob o cursor/dedo) fica maior
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const p of m.pois) {
      const q = mundoParaMini(p.x, p.z, param); if (q.x < -8 || q.y < -8 || q.x > S + 8 || q.y > S + 8) continue;
      const r = sobre?.id === p.id ? 8 : 6; ctx.beginPath(); ctx.arc(q.x, q.y, r, 0, Math.PI * 2); ctx.fillStyle = COR.poi; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = COR.poiBorda; ctx.stroke();
      ctx.fillStyle = COR.poiBorda; ctx.font = `bold ${r + 3}px sans-serif`; ctx.fillText(ICONE_POI[p.tipo] ?? '•', q.x, q.y + 0.5);
    }
    // seta do herói: sempre visível, apontando para onde ele olha (já girada junto com a tela)
    const s = mundoParaMini(h.x, h.z, param), ang = anguloSeta(h.face, param.giroGraus), tam = Math.max(6, S / 16);
    ctx.save(); ctx.translate(Math.min(S - 4, Math.max(4, s.x)), Math.min(S - 4, Math.max(4, s.y))); ctx.rotate(ang);
    ctx.beginPath(); ctx.moveTo(tam, 0); ctx.lineTo(-tam * 0.7, tam * 0.65); ctx.lineTo(-tam * 0.35, 0); ctx.lineTo(-tam * 0.7, -tam * 0.65); ctx.closePath();
    ctx.fillStyle = COR.heroi; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = COR.heroiBorda; ctx.stroke(); ctx.restore();
    medidas.quadros++; medidas.ms += performance.now() - t0;
  }

  // ponto de interesse (ou passagem com nome) sob o cursor ou o dedo → nome por ID
  function apontar(e) {
    const m = fonte(); if (!m || !param) return;
    const r = tela.getBoundingClientRect(), w = miniParaMundo(e.clientX - r.left, e.clientY - r.top, param);
    const alvos = [...m.pois, ...m.portais.filter((p) => p.nome_txt)];
    sobre = maisProximo(alvos, w.x, w.z, C.raio_toque_px / param.escala);
    dica.hidden = !sobre; if (sobre) { dica.textContent = t(sobre.nome_txt); dicaAte = e.pointerType === 'touch' ? performance.now() + 2000 : Infinity; }
  }
  tela.addEventListener('pointermove', apontar); tela.addEventListener('pointerdown', (e) => { e.preventDefault(); apontar(e); });
  tela.addEventListener('pointerleave', (e) => { if (e.pointerType !== 'touch') { sobre = null; dica.hidden = true; } });

  return {
    medidas, elemento: raiz,
    atualizar() {
      const m = fonte(), mostrar = !!m && preferencia('minimapa') && visivel();
      if (raiz.hidden === mostrar) raiz.hidden = !mostrar;
      if (!mostrar) return;
      const contraste = !!preferencia('minimapa_contraste'); raiz.classList.toggle('contraste', contraste);
      if (m !== mapaBase || contraste !== contrasteBase) { montarBase(m, contraste); chave = ''; sobre = null; dica.hidden = true; }
      if (sobre && performance.now() > dicaAte) { sobre = null; dica.hidden = true; }
      desenhar(m, contraste);
    },
  };
}
