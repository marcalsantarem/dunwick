// Portas, portais e "interagir com objeto" (13, v0.1.2). Simulação pura. Dados: `portais` e `pois` do mapa (contrato do 08/14:
// retângulo por centro + tamanho {x, z, w, d}; chegada {x, z, direcao}) e data/exploracao/cfg_exploracao.json.
// - Entrar no retângulo de um portal ativo (andando ou por clique na porta/no edifício) → `portal_usado`; a troca de mapa vem logo
//   depois (ou em concluir(), com troca manual) → `mapa_trocado`. Chega-se na `chegada` do portal de destino, virado para fora.
// - Portal inativo é sólido (mapa.js); encostar nele (ou clicar nele) → `portal_bloqueado` com o texto do aviso, uma vez por contato.
// - Interagir (tecla `interagir` perto de um poi, ou clique no poi e chegar até ele) → `interagiu`. O diálogo vem na v0.1.4.
// - Ao chegar num mapa, os portais ficam desarmados até o herói sair de todos os retângulos (sem ida e volta imediata).
const retDe = (p) => ({ x0: p.x - p.w / 2, z0: p.z - p.d / 2, x1: p.x + p.w / 2, z1: p.z + p.d / 2 });
const dentro = (r, x, z, folga = 0) => x >= r.x0 - folga && x <= r.x1 + folga && z >= r.z0 - folga && z <= r.z1 + folga;
const distRet = (r, x, z) => Math.hypot(Math.max(r.x0 - x, 0, x - r.x1), Math.max(r.z0 - z, 0, z - r.z1));

export function criarPortais({ mundo, dados, eventos, trocarMapa, trocaManual, cfg }) {
  if (!cfg) throw new Error('falta data/exploracao/cfg_exploracao.json');
  const contato = new Set();
  const P = { pendente: null, retorno: null, intencao: null, armado: false };
  const heroi = () => mundo.heroi;
  const portais = () => mundo.mapa.dados.portais ?? [];
  const pois = () => mundo.mapa.dados.pois ?? [];

  function alvoDoClique(x, z) {
    for (const p of portais()) if (dentro(retDe(p), x, z, cfg.folga_clique_portal_tiles)) return { tipo: 'portal', id: p.id, x: p.x, z: p.z };
    for (const e of mundo.mapa.dados.edificios ?? []) {
      if (!e.interior || !dentro(retDe(e), x, z)) continue;
      const p = portais().find((q) => q.destino.mapa === e.interior); // clicar no edifício = ir pela porta dele
      if (p) return { tipo: 'portal', id: p.id, x: p.x, z: p.z };
    }
    let melhor = null, dm = cfg.raio_clique_poi_tiles;
    for (const o of pois()) { const d = Math.hypot(o.x - x, o.z - z); if (d <= dm) { dm = d; melhor = o; } }
    return melhor ? { tipo: 'poi', id: melhor.id, x: melhor.x, z: melhor.z } : null;
  }

  function avisarBloqueado(p) {
    contato.add(p.id);
    eventos.emitir('portal_bloqueado', { mapa: mundo.mapaId, portal: p.id, aviso_txt: cfg.aviso_portal_inativo_txt });
  }
  function interagir(o) {
    const h = heroi(); h.face = Math.atan2(o.z - h.z, o.x - h.x);
    eventos.emitir('interagiu', { mapa: mundo.mapaId, id: o.id, tipo: o.tipo, nome_txt: o.nome_txt, x: o.x, z: o.z });
  }
  function poiAoAlcance() {
    const h = heroi(); let melhor = null, dm = cfg.alcance_interagir_tiles;
    for (const o of pois()) { const d = Math.hypot(o.x - h.x, o.z - h.z); if (d <= dm) { dm = d; melhor = o; } }
    return melhor;
  }

  function usar(p) {
    const h = heroi(); h.vx = h.vz = 0; h.destino = null; h.rota = null; P.intencao = null;
    P.pendente = { de_mapa: mundo.mapaId, portal: p.id, para_mapa: p.destino.mapa, para_portal: p.destino.portal };
    eventos.emitir('portal_usado', { ...P.pendente });
    if (!trocaManual) P.concluir();
  }

  /** Faz a troca pendente: mapa novo, herói na chegada do portal de destino (virado para fora), câmera e encontros do mapa. */
  P.concluir = () => {
    const t = P.pendente; if (!t) return false;
    const md = dados.mapas[t.para_mapa]; if (!md) throw new Error(`portal "${t.portal}": mapa "${t.para_mapa}" não está carregado`);
    const destino = (md.portais ?? []).find((q) => q.id === t.para_portal) ?? (P.retorno?.mapa === t.para_mapa ? (md.portais ?? []).find((q) => q.id === P.retorno.portal) : null);
    const c = destino?.chegada ?? { x: md.inicio_jogador.tile[0] + 0.5, z: md.inicio_jogador.tile[1] + 0.5, direcao: md.inicio_jogador.direcao };
    P.retorno = md.tipo_mapa === 'interior' ? { mapa: t.de_mapa, portal: t.portal } : null; // de onde se entrou (exterior) enquanto se está num interior
    trocarMapa(t.para_mapa, c.x, c.z, c.direcao);
    P.pendente = null; P.rearmar();
    eventos.emitir('mapa_trocado', { mapa: t.para_mapa, de_mapa: t.de_mapa, portal: destino?.id ?? null, x: c.x, z: c.z, direcao: c.direcao });
    return true;
  };
  P.cancelar = () => { P.pendente = null; P.intencao = null; };
  P.rearmar = () => { P.armado = false; contato.clear(); };

  /** Antes do herói: clique numa porta, num edifício com interior, num portal ou num poi vira destino (o centro) + intenção. */
  P.antesDoHeroi = (entrada) => {
    if (entrada.mover.x || entrada.mover.z) { P.intencao = null; return entrada; }
    if (!entrada.apertou.includes('clique_principal') || !entrada.cursor.valido || entrada.alvoSob) return entrada;
    const a = alvoDoClique(entrada.cursor.x, entrada.cursor.z); P.intencao = a;
    return a ? { ...entrada, cursor: { ...entrada.cursor, x: a.x, z: a.z } } : entrada;
  };

  /** Depois do herói: entrar em portal ativo, aviso de portal inativo, intenção do clique e tecla interagir. */
  P.depoisDoHeroi = (entrada) => {
    const h = heroi(), r = h.raioPush;
    const ativos = portais().filter((p) => p.ativo !== false);
    const em = ativos.find((p) => dentro(retDe(p), h.x, h.z));
    if (!P.armado) { if (!em) P.armado = true; }
    else if (em) { usar(em); return; }
    for (const p of portais()) {
      if (p.ativo !== false) continue;
      const d = distRet(retDe(p), h.x, h.z) - r;
      if (d <= cfg.contato_portal_tiles && h.velocidade() > 0.05 && !contato.has(p.id)) avisarBloqueado(p);
      else if (d > cfg.soltar_contato_portal_tiles) contato.delete(p.id);
    }
    const it = P.intencao;
    if (it && !h.destino) { // chegou (ou desistiu): cumpre a intenção se está ao alcance
      P.intencao = null;
      if (it.tipo === 'poi') { const o = pois().find((q) => q.id === it.id); if (o && Math.hypot(o.x - h.x, o.z - h.z) <= cfg.alcance_interagir_tiles) interagir(o); }
      else { const p = portais().find((q) => q.id === it.id); if (p && p.ativo === false && distRet(retDe(p), h.x, h.z) - r <= cfg.alcance_interagir_tiles && !contato.has(p.id)) avisarBloqueado(p); }
    }
    if (entrada.apertou.includes('interagir')) { const o = poiAoAlcance(); if (o) interagir(o); }
  };
  return P;
}
