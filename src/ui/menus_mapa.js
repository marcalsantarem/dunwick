// Diálogo, loja e inventário fora da batalha (15, v0.1.4, D-049). DOM dentro de .tela (#ui); texto só por ID e por textContent.
// Contrato com o 13 (simulação, em mundo.jogo): `dialogo` = null | { npc, nome_txt, cor, falas: [txt_…], i, loja }; avancarDialogo(),
// encerrarDialogo(); `loja` = null | { id, npc, nome_txt }; estoqueLoja(id) → [{ item, preco, estoque|null }]; precoVenda(item) → inteiro|null;
// comprar(loja, item, qtd) / vender(loja, item, qtd) → { ok, motivo?: sem_moedas|sem_estoque|sem_item }; fecharLoja(); moedas; inventario.
// Sem estoqueLoja/precoVenda no 13, lê os dados (data/lojas + cfg_economia.precos + categoria do item vs compra_tipos), sem calcular nada.
// A UI não calcula preço nem mexe em moedas/inventário: só mostra e chama. O inventário pausa o mundo (plataforma.pausa 'inv');
// diálogo e loja deixam o 13 segurar o herói. Teclado: ver tecla(); gamepad: ver gamepad(borda).
import { derivadosHeroi } from '../jogo/batalha/formulas.js';

function el(tag, classe, pai, texto) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (texto !== undefined) e.textContent = texto;
  if (pai) pai.appendChild(e);
  return e;
}
const botao = (classe, pai, texto) => { const b = el('button', classe, pai, texto); b.type = 'button'; b.tabIndex = -1; return b; };
const COR_OK = /^#[0-9a-f]{3,8}$/i;
// falas da loja: as do 02 (dados da loja, `falas`) quando houver; senão as genéricas da UI
const FALA_UI = { sem_estoque: 'ui_loja_sem_estoque', sem_item: 'ui_loja_sem_item', nao_compra: 'ui_loja_nao_compra', nao_vendavel: 'ui_loja_nao_compra', falhou: 'ui_loja_falhou' };
const ABAS = ['comprar', 'vender', 'sair'];

export function criarMenusMapa({ mundo, t, cfg, dados = {}, plataforma = {}, raiz, livre = () => true }) {
  const jogo = () => mundo.jogo, pausa = plataforma.pausa ?? null, C = cfg.menus_mapa;
  const itemDe = (id) => dados.combate?.itens?.[id] ?? dados.itens?.[id] ?? null;
  const nomeItem = (id) => t(itemDe(id)?.nome_txt ?? id);
  const moeda = (v) => t(v === 1 ? 'ui_moeda_um' : 'ui_moeda_varios', { valor: v }), moedasTxt = () => moeda(jogo()?.moedas ?? 0);
  const precos = () => dados.config?.economia?.precos ?? {}, descDe = (id) => itemDe(id)?.desc_txt ?? itemDe(id)?.descricao_txt;
  const estoqueDe = (id) => jogo().estoqueLoja?.(id) ?? (dados.lojas?.[id]?.estoque ?? []).map((e) => ({ item: e.item, preco: precos()[e.item]?.compra ?? null, estoque: e.qtd ?? null }));
  const vendaDe = (lojaId, item) => {
    if (jogo().precoVenda) return jogo().precoVenda(item, lojaId) ?? null;
    const tipos = dados.lojas?.[lojaId]?.compra_tipos;
    return tipos && !tipos.includes(itemDe(item)?.categoria) ? null : precos()[item]?.venda ?? null;
  };

  // ---------- diálogo: caixa embaixo, nome do falante na cor dele, texto aparecendo (reduzir movimento: inteiro) ----------
  const fundoDlg = el('div', 'dlg-fundo', raiz); fundoDlg.hidden = true;
  const caixa = el('div', 'dlg', fundoDlg); caixa.setAttribute('role', 'dialog');
  const nomeDlg = el('div', 'dlg-nome', caixa), textoDlg = el('p', 'dlg-texto', caixa), setaDlg = el('span', 'dlg-seta', caixa, '▼');
  setaDlg.setAttribute('aria-hidden', 'true');
  const dicaDlg = el('span', 'dlg-dica', caixa, t(plataforma.movel?.ativo ? 'ui_dialogo_avancar_toque' : 'ui_dialogo_avancar_pc'));
  let dlg = null; // { chave, fala, n }
  fundoDlg.addEventListener('click', () => avancar());

  function avancar() {
    const d = jogo()?.dialogo; if (!d || !dlg) return;
    if (dlg.n < dlg.fala.length) { dlg.n = dlg.fala.length; textoDlg.textContent = dlg.fala; setaDlg.hidden = false; return; }
    jogo().avancarDialogo();
  }
  function cuidarDialogo(dt, reduzir) {
    const d = jogo()?.dialogo;
    if (!d || !livre()) { if (!fundoDlg.hidden) fundoDlg.hidden = true; if (!d) dlg = null; return; }
    const chave = `${d.npc}|${d.i}`;
    if (!dlg || dlg.chave !== chave) {
      dlg = { chave, fala: t(d.falas[d.i]), n: 0 };
      nomeDlg.textContent = t(d.nome_txt); nomeDlg.style.setProperty('--cor-falante', COR_OK.test(d.cor ?? '') ? d.cor : 'var(--brilho-2)');
      caixa.setAttribute('aria-label', `${nomeDlg.textContent}: ${dlg.fala}`); caixa.dataset.npc = d.npc; caixa.dataset.fala = String(d.i);
    }
    fundoDlg.hidden = false;
    if (dlg.n < dlg.fala.length) { dlg.n = reduzir ? dlg.fala.length : Math.min(dlg.fala.length, dlg.n + dt * C.caracteres_por_s); textoDlg.textContent = dlg.fala.slice(0, Math.floor(dlg.n)); }
    setaDlg.hidden = dicaDlg.hidden = dlg.n < dlg.fala.length;
  }

  // ---------- loja: Comprar / Vender / Sair, lista, quantidade, total, fala do vendedor ----------
  const fundoLoja = el('div', 'tela-pausa loja', raiz); fundoLoja.hidden = true;
  const pLoja = el('div', 'tela-painel loja-painel', fundoLoja); pLoja.setAttribute('role', 'dialog');
  const cabLoja = el('div', 'loja-cab', pLoja), tituloLoja = el('h2', 'tela-painel-titulo loja-titulo', cabLoja), moedasLoja = el('span', 'loja-moedas', cabLoja);
  const abasEl = el('div', 'loja-abas', pLoja); abasEl.setAttribute('role', 'tablist');
  const bAbas = ABAS.map((a) => { const b = botao(`tela-controle loja-aba loja-aba-${a}`, abasEl, t(`ui_loja_${a}`)); b.setAttribute('role', 'tab'); b.addEventListener('click', () => { if (a === 'sair') sair(); else trocarAba(a); }); return b; });
  const listaLoja = el('ul', 'loja-lista', pLoja); listaLoja.setAttribute('role', 'listbox');
  const vazioLoja = el('p', 'loja-vazio', pLoja);
  const detLoja = el('div', 'loja-detalhe', pLoja), descLoja = el('p', 'loja-desc', detLoja);
  const qtdLinha = el('div', 'loja-qtd', detLoja), bMenos = botao('tela-controle loja-passo loja-menos', qtdLinha, '−'), qtdEl = el('span', 'loja-qtd-valor', qtdLinha), bMais = botao('tela-controle loja-passo loja-mais', qtdLinha, '+');
  const totalEl = el('span', 'loja-total', qtdLinha), bConfirmar = botao('tela-controle loja-confirmar', qtdLinha);
  bMenos.setAttribute('aria-label', t('ui_pausa_menos')); bMais.setAttribute('aria-label', t('ui_pausa_mais'));
  const falaLoja = el('p', 'loja-fala', pLoja); falaLoja.setAttribute('role', 'status');
  let loja = null; // { id, aba, foco, qtdModo, qtd, fala: { id, vars } }
  bMenos.addEventListener('click', () => mudarQtd(-1)); bMais.addEventListener('click', () => mudarQtd(1)); bConfirmar.addEventListener('click', () => confirmar());

  const falaId = (k) => dados.lojas?.[loja.id]?.falas?.[`${k}_txt`] ?? FALA_UI[k] ?? FALA_UI.falhou; // motivo desconhecido do 13: fala genérica
  function linhasLoja() {
    const j = jogo();
    if (loja.aba === 'comprar') return estoqueDe(loja.id).map((e) => ({ item: e.item, preco: e.preco, estoque: e.estoque ?? null, tem: j.inventario[e.item] ?? 0 }));
    if (loja.aba === 'vender') return Object.entries(j.inventario).filter(([, q]) => q > 0).map(([item, q]) => ({ item, preco: vendaDe(loja.id, item), estoque: null, tem: q }));
    return [];
  }
  function maxQtd(l) {
    if (!l || l.preco == null) return 0;
    if (loja.aba === 'vender') return Math.min(C.qtd_max_loja, l.tem);
    const pode = Math.floor((jogo().moedas ?? 0) / Math.max(1, l.preco));
    return Math.max(1, Math.min(C.qtd_max_loja, l.estoque ?? Infinity, pode)); // sem moedas: deixa tentar 1 e o 13 responde "sem_moedas"
  }
  function trocarAba(a) { if (!loja) return; loja.aba = a; loja.foco = 0; loja.qtdModo = false; desenharLoja(); }
  function sair() { if (!loja) return; jogo().fecharLoja(); }
  function escolher(i) { const ls = linhasLoja(); if (!ls[i]) return; loja.foco = i; if (ls[i].preco == null) { loja.fala = { id: falaId('nao_compra'), vars: { nome_item: nomeItem(ls[i].item) } }; loja.qtdModo = false; } else { loja.qtdModo = true; loja.qtd = 1; } desenharLoja(); }
  function mudarQtd(d) { if (!loja?.qtdModo) return; const m = maxQtd(linhasLoja()[loja.foco]); loja.qtd = Math.min(m, Math.max(1, loja.qtd + d)); desenharLoja(); }
  function confirmar() {
    if (!loja?.qtdModo) return;
    const l = linhasLoja()[loja.foco]; if (!l) return;
    const qtd = loja.qtd, j = jogo(), r = loja.aba === 'comprar' ? j.comprar(loja.id, l.item, qtd) : j.vender(loja.id, l.item, qtd);
    const vars = { nome_item: nomeItem(l.item), qtd, preco: l.preco * qtd };
    loja.fala = { id: falaId(r?.ok ? (loja.aba === 'comprar' ? 'comprou' : 'vendeu') : (r?.motivo ?? 'sem_item')), vars };
    if (r?.ok) { loja.qtdModo = false; const n = linhasLoja().length; loja.foco = Math.min(loja.foco, Math.max(0, n - 1)); }
    desenharLoja();
  }
  function desenharLoja() {
    const L = jogo().loja, ls = linhasLoja(), sel = ls[loja.foco];
    tituloLoja.textContent = t(L.nome_txt ?? dados.lojas?.[loja.id]?.nome_txt ?? 'ui_loja_titulo'); moedasLoja.textContent = moedasTxt();
    pLoja.setAttribute('aria-label', tituloLoja.textContent);
    bAbas.forEach((b, i) => { const on = ABAS[i] === loja.aba; b.classList.toggle('ativa', on); b.setAttribute('aria-selected', String(on)); });
    listaLoja.replaceChildren();
    ls.forEach((l, i) => {
      const li = el('li', 'loja-linha', listaLoja); li.setAttribute('role', 'option'); li.dataset.item = l.item;
      const caro = loja.aba === 'comprar' && (l.preco > (jogo().moedas ?? 0) || l.estoque === 0);
      li.classList.toggle('foco', i === loja.foco); li.classList.toggle('caro', caro || l.preco == null); li.setAttribute('aria-selected', String(i === loja.foco));
      el('span', 'loja-nome', li, nomeItem(l.item));
      el('span', 'loja-info', li, loja.aba === 'comprar' ? (l.estoque == null ? t('ui_loja_tem', { qtd: l.tem }) : t('ui_loja_estoque', { qtd: l.estoque })) : t('ui_loja_tem', { qtd: l.tem }));
      el('span', 'loja-preco', li, l.preco == null ? t('ui_loja_sem_preco') : moeda(l.preco));
      li.addEventListener('click', () => escolher(i));
      li.addEventListener('pointerenter', () => { if (!loja.qtdModo && loja.foco !== i) { loja.foco = i; desenharLoja(); } });
    });
    vazioLoja.hidden = ls.length > 0; vazioLoja.textContent = t(loja.aba === 'vender' ? 'ui_loja_nada_vender' : 'ui_loja_nada_comprar');
    detLoja.hidden = !sel;
    if (sel) {
      const d = descDe(sel.item); descLoja.textContent = d ? t(d) : ''; descLoja.hidden = !d;
      qtdLinha.hidden = !loja.qtdModo; qtdEl.textContent = t('ui_loja_qtd', { qtd: loja.qtd });
      totalEl.textContent = t('ui_loja_total', { total: moeda((sel.preco ?? 0) * loja.qtd) });
      bConfirmar.textContent = t(loja.aba === 'comprar' ? 'ui_loja_comprar' : 'ui_loja_vender');
    }
    falaLoja.textContent = loja.fala ? t(loja.fala.id, loja.fala.vars) : '';
    listaLoja.querySelector('.foco')?.scrollIntoView?.({ block: 'nearest' });
  }
  function cuidarLoja() {
    const L = !jogo()?.dialogo && jogo()?.loja;
    if (!L || !livre()) { if (!fundoLoja.hidden) fundoLoja.hidden = true; if (!L) loja = null; return; }
    if (!loja || loja.id !== L.id) { loja = { id: L.id, aba: 'comprar', foco: 0, qtdModo: false, qtd: 1, fala: { id: null, vars: {} } }; loja.fala.id = falaId('saudacao'); desenharLoja(); }
    if (fundoLoja.hidden) { fundoLoja.hidden = false; desenharLoja(); }
    else if (moedasLoja.textContent !== moedasTxt()) desenharLoja();
  }
  fundoLoja.addEventListener('contextmenu', (e) => { e.preventDefault(); voltarLoja(); });
  function voltarLoja() { if (loja.qtdModo) { loja.qtdModo = false; desenharLoja(); } else sair(); }
  function teclaLoja(c) {
    const n = linhasLoja().length;
    if (c === 'Escape' || c === 'Backspace') voltarLoja();
    else if (loja.qtdModo && (c === 'ArrowLeft' || c === 'KeyA')) mudarQtd(-1);
    else if (loja.qtdModo && (c === 'ArrowRight' || c === 'KeyD')) mudarQtd(1);
    else if (c === 'ArrowLeft' || c === 'KeyA' || c === 'KeyQ') trocarAba(ABAS[(ABAS.indexOf(loja.aba) + ABAS.length - 1) % ABAS.length]);
    else if (c === 'ArrowRight' || c === 'KeyD' || c === 'KeyE') trocarAba(ABAS[(ABAS.indexOf(loja.aba) + 1) % ABAS.length]);
    else if ((c === 'ArrowUp' || c === 'KeyW') && n) { loja.foco = (loja.foco + n - 1) % n; loja.qtdModo = false; desenharLoja(); }
    else if ((c === 'ArrowDown' || c === 'KeyS') && n) { loja.foco = (loja.foco + 1) % n; loja.qtdModo = false; desenharLoja(); }
    else if (c === 'Enter' || c === 'NumpadEnter' || c === 'Space') { if (loja.aba === 'sair') sair(); else if (loja.qtdModo) confirmar(); else escolher(loja.foco); }
  }

  // ---------- inventário mínimo (fora da batalha): Coroas, itens com quantidade e descrição, estado do grupo ----------
  const fundoInv = el('div', 'tela-pausa inv', raiz); fundoInv.hidden = true;
  const pInv = el('div', 'tela-painel inv-painel', fundoInv); pInv.setAttribute('role', 'dialog'); pInv.setAttribute('aria-label', t('ui_inventario_titulo'));
  const cabInv = el('div', 'loja-cab', pInv); el('h2', 'tela-painel-titulo', cabInv, t('ui_inventario_titulo')); const moedasInv = el('span', 'loja-moedas', cabInv);
  const grupoInv = el('ul', 'inv-grupo', pInv), listaInv = el('ul', 'loja-lista inv-lista', pInv); listaInv.setAttribute('role', 'listbox');
  const vazioInv = el('p', 'loja-vazio', pInv, t('ui_inventario_vazio')), descInv = el('p', 'loja-desc inv-desc', pInv);
  const bFecharInv = botao('tela-controle tela-continuar inv-fechar', pInv, t('ui_inv_fechar'));
  let inv = null; // { foco }
  bFecharInv.addEventListener('click', () => fecharInv());
  fundoInv.addEventListener('pointerdown', (e) => { if (e.target === fundoInv) fecharInv(); });
  fundoInv.addEventListener('contextmenu', (e) => { e.preventDefault(); fecharInv(); });
  const podeInv = () => livre() && jogo()?.modo === 'mapa' && !jogo()?.dialogo && !jogo()?.loja;
  function abrirInv() { if (inv || !podeInv()) return false; inv = { foco: 0 }; pausa?.pausar('inv'); fundoInv.hidden = false; desenharInv(); return true; }
  function fecharInv() { if (!inv) return; inv = null; fundoInv.hidden = true; pausa?.retomar('inv'); }
  function desenharInv() {
    const j = jogo(), itens = Object.entries(j.inventario).filter(([, q]) => q > 0), F = dados.config?.batalha?.formulas;
    moedasInv.textContent = moedasTxt();
    grupoInv.replaceChildren();
    for (const [id, g] of Object.entries(j.grupo ?? {})) {
      const h = dados.combate?.herois?.[id], d = h && F ? derivadosHeroi(h, F) : null, li = el('li', 'inv-heroi', grupoInv);
      el('span', 'inv-heroi-nome', li, t(h?.nome_txt ?? id)); el('span', 'inv-heroi-nivel', li, t('ui_inv_nivel', { nivel: g.nivel }));
      el('span', 'inv-heroi-vida', li, t('ui_inv_vida', { atual: g.vida, max: d?.vida_max ?? g.vida })); el('span', 'inv-heroi-mana', li, t('ui_inv_mana', { atual: g.mana, max: d?.mana_max ?? g.mana }));
    }
    inv.foco = Math.min(inv.foco, Math.max(0, itens.length - 1));
    listaInv.replaceChildren();
    itens.forEach(([id, q], i) => {
      const li = el('li', 'loja-linha inv-linha', listaInv); li.setAttribute('role', 'option'); li.dataset.item = id; li.classList.toggle('foco', i === inv.foco); li.setAttribute('aria-selected', String(i === inv.foco));
      el('span', 'loja-nome', li, nomeItem(id)); el('span', 'loja-info', li, t('ui_loja_tem', { qtd: q }));
      li.addEventListener('click', () => { inv.foco = i; desenharInv(); });
    });
    vazioInv.hidden = itens.length > 0;
    const d = itens[inv.foco] && descDe(itens[inv.foco][0]); descInv.textContent = d ? t(d) : ''; descInv.hidden = !d;
  }
  function teclaInv(c) {
    const n = Object.values(jogo().inventario).filter((q) => q > 0).length;
    if (['Escape', 'Backspace', 'KeyI', 'Tab'].includes(c)) fecharInv();
    else if ((c === 'ArrowUp' || c === 'KeyW') && n) { inv.foco = (inv.foco + n - 1) % n; desenharInv(); }
    else if ((c === 'ArrowDown' || c === 'KeyS') && n) { inv.foco = (inv.foco + 1) % n; desenharInv(); }
  }

  return {
    /** Algum menu do mapa aberto (a UI esconde minimapa, banner e placas; o canto continua). */
    get ocupado() { return !!(jogo()?.dialogo || jogo()?.loja || inv); },
    get inventarioAberto() { return !!inv; },
    abrirInv, fecharInv,
    /** Tecla (keydown, sem pausa aberta): true = consumida (o chamador para a propagação). */
    tecla(e) {
      const c = e.code;
      if (jogo()?.dialogo && !fundoDlg.hidden) {
        if (!e.repeat && ['Enter', 'NumpadEnter', 'Space', 'KeyE'].includes(c)) avancar();
        else if (c === 'Escape' && !e.repeat) jogo().encerrarDialogo();
        return true; // durante a fala, nenhuma tecla chega ao mundo
      }
      if (loja && !fundoLoja.hidden) { if (!e.repeat || c.startsWith('Arrow')) teclaLoja(c); return true; }
      if (inv) { if (!e.repeat || c.startsWith('Arrow')) teclaInv(c); return true; }
      if ((c === 'KeyI' || c === 'Tab') && !e.repeat) return abrirInv() || c === 'Tab';
      return false;
    },
    /** Gamepad (bordas já calculadas pelo chamador): true = consumido. */
    gamepad(b) {
      if (jogo()?.dialogo && !fundoDlg.hidden) { if (b('sul')) avancar(); else if (b('leste')) jogo().encerrarDialogo(); return true; }
      if (loja && !fundoLoja.hidden) {
        const k = b('leste') ? 'Escape' : b('sul') ? 'Enter' : b('cima') ? 'ArrowUp' : b('baixo') ? 'ArrowDown' : b('esq') ? 'ArrowLeft' : b('dir') ? 'ArrowRight' : b('lb') ? 'KeyQ' : b('rb') ? 'KeyE' : null;
        if (k) teclaLoja(k); return true;
      }
      if (inv) { const k = b('leste') || b('select') ? 'Escape' : b('cima') ? 'ArrowUp' : b('baixo') ? 'ArrowDown' : null; if (k) teclaInv(k); return true; }
      if (b('select')) return abrirInv();
      return false;
    },
    atualizar(dt, reduzir) {
      cuidarDialogo(dt, reduzir); cuidarLoja();
      if (inv && !livre()) { fundoInv.hidden = true; } else if (inv) { fundoInv.hidden = false; if (moedasInv.textContent !== moedasTxt()) desenharInv(); }
    },
  };
}
