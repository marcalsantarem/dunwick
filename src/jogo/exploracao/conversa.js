// Conversa com NPC e loja (13, v0.1.4). Simulação pura; a caixa de diálogo e a tela de loja são do 15 e só usam esta API.
// Dados: npcs do mapa [{id, x, z, dir}], dados.npcs[id] {nome_txt, cor, falas[], loja?}, dados.lojas[id] {itens[{item, preco?}],
// mult_venda}. Preço de compra = preco da entrada da loja (cfg_economia, via empacotador do 08), senão `preco` do item; venda = `venda` da
// entrada, senão floor(preço base × mult_venda); item com
// `vendavel: false` não se vende (item equipado já saiu da mochila). Estoque infinito sem `qtd`; com `qtd`, o que resta vale para a
// sessão (não vai para o save na demo). Moedas e mochila são as do estado do jogo (serializáveis); conversa e loja não.
// Durante a conversa o mapa não simula (mundo.passo). Eventos: dialogo_iniciado · fala_mudou · loja_oferecida · loja_aberta ·
// compra · venda · loja_fechada · dialogo_encerrado.
const itemDe = (dados, id) => dados.combate?.itens?.[id] ?? dados.itens?.[id] ?? null;

export function criarConversa({ mundo, dados, eventos }) {
  const C = { ativa: false, npc: null, indice: 0, loja: null, lojaAberta: false };
  const def = () => dados.npcs?.[C.npc];
  const vendidos = new Map(); // `${loja}/${item}` → unidades já compradas (estoque limitado)
  const resta = (lojaId, e) => (Number.isInteger(e?.qtd) ? Math.max(0, e.qtd - (vendidos.get(`${lojaId}/${e.item}`) ?? 0)) : null);
  const lojaDef = () => (C.loja ? dados.lojas?.[C.loja] : null);

  function iniciar(npcId) {
    const d = dados.npcs?.[npcId]; if (!d || C.ativa || (mundo.jogo && mundo.jogo.modo !== 'mapa')) return false;
    Object.assign(C, { ativa: true, npc: npcId, indice: 0, loja: d.loja ?? null, lojaAberta: false });
    const h = mundo.heroi, n = mundo.npcs.find((q) => q.id === npcId);
    h.vx = h.vz = 0; h.destino = null; h.rota = null;
    if (n) { n.face = Math.atan2(h.z - n.z, h.x - n.x); n.falando = true; h.face = Math.atan2(n.z - h.z, n.x - h.x); } // um vira para o outro
    eventos.emitir('dialogo_iniciado', { npc: npcId, nome_txt: d.nome_txt, cor: d.cor ?? null, falas: [...d.falas], indice: 0, loja: C.loja });
    return true;
  }

  /** Próxima fala; depois da última: com loja oferece a loja, sem loja encerra. */
  C.avancar = () => {
    if (!C.ativa || C.lojaAberta) return false;
    const falas = def().falas;
    if (C.indice < falas.length - 1) { C.indice++; eventos.emitir('fala_mudou', { npc: C.npc, indice: C.indice, fala_txt: falas[C.indice] }); return true; }
    if (C.loja) { eventos.emitir('loja_oferecida', { npc: C.npc, loja: C.loja }); return true; }
    C.encerrar(); return true;
  };

  const precoCompra = (id, l = lojaDef()) => { const e = l?.itens.find((q) => q.item === id); return e ? (e.preco ?? itemDe(dados, id)?.preco ?? null) : null; };
  /** Preço de venda de um item da mochila nesta loja, ou null (sem loja aberta, sem preço ou não vendável). */
  C.precoVenda = (id) => {
    const l = lojaDef(), it = itemDe(dados, id); if (!l || !it || it.vendavel === false) return null;
    const e = l.itens.find((q) => q.item === id); if (Number.isInteger(e?.venda)) return e.venda; // preço de venda do 06 (cfg_economia), quando há
    const base = e?.preco ?? it.preco; return Number.isInteger(base) ? Math.floor(base * l.mult_venda) : null;
  };

  C.abrirLoja = () => {
    const l = lojaDef(); if (!C.ativa || !l || C.lojaAberta) return false;
    C.lojaAberta = true;
    eventos.emitir('loja_aberta', { loja: C.loja, nome_txt: l.nome_txt, itens: l.itens.map((e) => ({ item: e.item, nome_txt: itemDe(dados, e.item)?.nome_txt ?? null, preco: precoCompra(e.item) })), moedas: mundo.jogo.moedas });
    return true;
  };
  const qtdOk = (q) => Number.isInteger(q) && q >= 1;
  C.comprar = (id, qtd = 1) => {
    if (!C.lojaAberta) return { ok: false, erro: 'loja_fechada' };
    if (!qtdOk(qtd)) return { ok: false, erro: 'qtd_invalida' };
    const preco = precoCompra(id); if (!Number.isInteger(preco)) return { ok: false, erro: 'item_invalido' };
    const e = lojaDef().itens.find((q) => q.item === id), r = resta(C.loja, e);
    if (r !== null && r < qtd) return { ok: false, erro: 'sem_estoque' };
    const total = preco * qtd, jogo = mundo.jogo;
    if (!jogo.alterarMoedas(-total)) return { ok: false, erro: 'sem_moedas' };
    if (r !== null) vendidos.set(`${C.loja}/${id}`, (vendidos.get(`${C.loja}/${id}`) ?? 0) + qtd);
    jogo.adicionarItem(id, qtd);
    eventos.emitir('compra', { loja: C.loja, item: id, qtd, total, moedas: jogo.moedas });
    return { ok: true, moedas: jogo.moedas, qtd_mochila: jogo.inventario[id] };
  };
  C.vender = (id, qtd = 1) => {
    if (!C.lojaAberta) return { ok: false, erro: 'loja_fechada' };
    if (!qtdOk(qtd)) return { ok: false, erro: 'qtd_invalida' };
    if (!itemDe(dados, id)) return { ok: false, erro: 'item_invalido' };
    const preco = C.precoVenda(id); if (preco === null) return { ok: false, erro: 'nao_vendavel' };
    const jogo = mundo.jogo; if (!jogo.removerItem(id, qtd)) return { ok: false, erro: 'sem_item' };
    const total = preco * qtd; jogo.alterarMoedas(total);
    eventos.emitir('venda', { loja: C.loja, item: id, qtd, total, moedas: jogo.moedas });
    return { ok: true, moedas: jogo.moedas, qtd_mochila: jogo.inventario[id] ?? 0 };
  };

  /** Sair (a qualquer momento): fecha a loja, se aberta, e encerra a conversa. */
  C.encerrar = () => {
    if (!C.ativa) return false;
    if (C.lojaAberta) eventos.emitir('loja_fechada', { loja: C.loja });
    const npc = C.npc, n = mundo.npcs.find((q) => q.id === npc); if (n) n.falando = false;
    Object.assign(C, { ativa: false, npc: null, indice: 0, loja: null, lojaAberta: false });
    eventos.emitir('dialogo_encerrado', { npc });
    return true;
  };

  eventos.em('interagiu', ({ id, tipo }) => { if (tipo === 'npc') iniciar(id); });

  /** Contrato do 15 (v0.1.4) em mundo.jogo: a UI lê jogo.dialogo / jogo.loja e chama as funções abaixo (mesma lógica de C). */
  C.ligarAoJogo = (jogo) => {
    const motivo = (r) => (r.ok ? r : { ...r, motivo: r.erro });
    Object.defineProperties(jogo, {
      dialogo: { enumerable: true, get: () => (C.ativa && !C.lojaAberta ? { npc: C.npc, nome_txt: def().nome_txt, cor: def().cor ?? null, falas: [...def().falas], i: C.indice, loja: C.loja } : null) },
      loja: { enumerable: true, get: () => (C.lojaAberta ? { id: C.loja, npc: C.npc, nome_txt: lojaDef().nome_txt } : null) },
    });
    Object.assign(jogo, {
      /** Próxima fala; na última encerra (ou, com loja, abre a loja). */
      avancarDialogo: () => { if (!C.ativa || C.lojaAberta) return false; if (C.indice >= def().falas.length - 1 && C.loja) return C.abrirLoja(); return C.avancar(); },
      encerrarDialogo: () => C.encerrar(),
      estoqueLoja: (id) => { const l = dados.lojas?.[id]; return l ? l.itens.map((e) => ({ item: e.item, preco: precoCompra(e.item, l), estoque: resta(id, e) })) : []; },
      precoVenda: (item) => C.precoVenda(item),
      comprar: (lojaId, item, qtd = 1) => (lojaId === C.loja ? motivo(C.comprar(item, qtd)) : { ok: false, motivo: 'loja_fechada' }),
      vender: (lojaId, item, qtd = 1) => (lojaId === C.loja ? motivo(C.vender(item, qtd)) : { ok: false, motivo: 'loja_fechada' }),
      fecharLoja: () => C.encerrar(),
    });
  };
  return C;
}
