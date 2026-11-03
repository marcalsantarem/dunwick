// Menu principal de personagem (15, v0.1.4, D-050): tela cheia, seções à esquerda (Itens, Equipamento, Status, Sistema) e um cartão por
// herói (retrato de batalha, nível, XP, vida, mana). Visual próprio (madeira e latão do jogo). Texto só por ID e por textContent.
// Abrir/fechar: plataforma.menu (08: exclusão mútua com pausa, batalha, diálogo e loja; pausa o relógio). Dados e regras são da simulação:
// jogo.grupo/inventario/moedas, statsDe(h, sobrepor) e equipamentoDe(h) (03/06), equipar(h, item), usarItem(h, item) (03; sem ela os
// consumíveis ficam indisponíveis fora da batalha). A UI não calcula atributo, cura nem preço.
// Teclado: ↑↓ navega, Enter/→ entra, Esc/← volta, ←→ ajusta preferências, Q/E troca de seção, C/Tab/Esc (nas seções) fecha.
// Gamepad: direcional, A entra, B volta, LB/RB seção, Select/Start fecha.
import { xpParaNivel } from '../jogo/batalha/formulas.js';

function el(tag, classe, pai, texto) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (texto !== undefined) e.textContent = texto;
  if (pai) pai.appendChild(e);
  return e;
}
const botao = (classe, pai, texto) => { const b = el('button', classe, pai, texto); b.type = 'button'; b.tabIndex = -1; return b; };
const SECOES = ['itens', 'equipamento', 'status', 'sistema'], SLOTS = ['arma', 'armadura'];
const EFEITOS_MENU = ['cura', 'mana']; // consumíveis que fazem sentido fora da batalha (06 §12.6)
// comparação de equipamento (06 §12.6): poder de arma, armadura, vida máx, mana máx, agilidade
const COMPARA = [['poder_arma', 'ui_attr_poder_arma'], ['armadura', 'ui_attr_armadura'], ['vida_max', 'ui_attr_vida'], ['mana_max', 'ui_attr_mana'], ['agilidade', 'ui_attr_agilidade']];
const BASE = [['vigor', 'ui_attr_vigor'], ['forca', 'ui_attr_forca'], ['destreza', 'ui_attr_destreza'], ['mente', 'ui_attr_mente']];
// URL de asset pelo manifesto (hash em produção, caminho direto no desenvolvimento), como o carregador do 08
function urlAsset(rel) { try { return JSON.parse(document.getElementById('manifesto')?.textContent ?? '{}').assets?.[rel] ?? `assets/${rel}`; } catch { return `assets/${rel}`; } }

/** @param opcoesSistema [{ rotuloId, valor() → texto, ajustar(d) }] (as mesmas linhas da pausa) · @param aoSairInicio () → volta à tela inicial */
export function criarMenuPrincipal({ mundo, t, dados = {}, plataforma = {}, raiz, opcoesSistema = [], aoSairInicio = () => location.reload() }) {
  const jogo = () => mundo.jogo, C = dados.combate ?? {}, cfgXp = dados.config?.batalha?.xp;
  const itemDe = (id) => C.itens?.[id] ?? null, nomeItem = (id) => t(itemDe(id)?.nome_txt ?? id), descItem = (id) => itemDe(id)?.desc_txt ?? itemDe(id)?.descricao_txt;
  const herois = () => Object.keys(jogo()?.grupo ?? {}), nomeHeroi = (h) => t(C.herois?.[h]?.nome_txt ?? h);
  const moeda = (v) => t(v === 1 ? 'ui_moeda_um' : 'ui_moeda_varios', { valor: v });
  const statsDe = (h, sobrepor) => jogo().statsDe?.(h, sobrepor) ?? null;
  const usavel = (id) => EFEITOS_MENU.includes(itemDe(id)?.efeito);
  const menuP = plataforma.menu ?? null, pausa = plataforma.pausa ?? null;
  let aberto = false;

  // ---------- DOM ----------
  const fundo = el('div', 'tela-pausa mp', raiz); fundo.hidden = true;
  const quadro = el('div', 'tela-painel mp-quadro', fundo); quadro.setAttribute('role', 'dialog'); quadro.setAttribute('aria-label', t('ui_menu_titulo'));
  const nav = el('nav', 'mp-secoes', quadro); el('h2', 'tela-painel-titulo mp-titulo', nav, t('ui_menu_titulo'));
  const bSecoes = SECOES.map((s, i) => { const b = botao(`tela-controle mp-secao mp-secao-${s}`, nav, t(`ui_menu_sec_${s}`)); b.addEventListener('click', () => { st.secao = i; st.zona = 'lista'; st.foco = 0; st.msg = null; desenhar(); }); return b; });
  const rodape = el('div', 'mp-rodape', nav); el('span', 'mp-moedas-rotulo', rodape, t('ui_menu_moedas')); const moedasEl = el('span', 'mp-moedas', rodape);
  const bFechar = botao('tela-controle mp-fechar', nav, t('ui_menu_fechar')); bFechar.addEventListener('click', () => fechar());
  const conteudo = el('div', 'mp-conteudo', quadro);
  const cartoesEl = el('div', 'mp-cartoes', conteudo);
  const painel = el('section', 'mp-painel', conteudo), tituloPainel = el('h3', 'mp-painel-titulo', painel);
  const lista = el('ul', 'mp-lista', painel); lista.setAttribute('role', 'listbox');
  const vazio = el('p', 'mp-vazio', painel), detalhe = el('div', 'mp-detalhe', painel), msgEl = el('p', 'mp-msg', painel); msgEl.setAttribute('role', 'status');
  const confirma = el('div', 'mp-confirma', quadro); confirma.hidden = true; confirma.setAttribute('role', 'alertdialog');
  const confTexto = el('p', 'mp-confirma-texto', confirma, t('ui_menu_sistema_inicio_confirma')), confBotoes = el('div', 'mp-confirma-botoes', confirma);
  const bSim = botao('tela-controle mp-sim', confBotoes, t('ui_menu_sim')), bNao = botao('tela-controle mp-nao', confBotoes, t('ui_menu_nao'));
  confirma.setAttribute('aria-label', confTexto.textContent);
  bSim.addEventListener('click', () => aoSairInicio()); bNao.addEventListener('click', () => { st.confirma = false; desenhar(); });
  fundo.addEventListener('contextmenu', (e) => { e.preventDefault(); voltar(); });

  // estado: zona 'secoes' | 'lista' | 'sub' (opções de equipamento) | 'alvo' (escolher herói para o item)
  const st = { secao: 0, zona: 'secoes', foco: 0, subFoco: 0, alvo: 0, item: null, msg: null, confirma: false, simFoco: false };

  // ---------- cartões (montados uma vez por abertura; valores a cada desenho) ----------
  let cartoes = [];
  function montarCartoes() {
    cartoesEl.replaceChildren();
    cartoes = herois().map((h, i) => {
      const c = el('div', 'mp-cartao', cartoesEl); c.dataset.heroi = h;
      const tela = el('canvas', 'mp-retrato', c); tela.width = tela.height = 96; tela.setAttribute('aria-hidden', 'true'); desenharRetrato(tela, h);
      const info = el('div', 'mp-cartao-info', c), cab = el('div', 'mp-cartao-cab', info);
      el('span', 'mp-cartao-nome', cab, nomeHeroi(h)); const nivel = el('span', 'mp-cartao-nivel', cab);
      const barra = (tipo) => { const b = el('div', `mp-barra mp-barra-${tipo}`, info), cheio = el('span', 'mp-barra-cheio', b), txt = el('span', 'mp-barra-texto', b); return { cheio, txt }; };
      const vida = barra('vida'), mana = barra('mana'), xp = barra('xp'), aviso = el('span', 'mp-cartao-aviso', c, t('ui_bat_rotulo_vida_cheia'));
      c.addEventListener('click', () => { if (st.zona === 'alvo') { st.alvo = i; usar(); } else if (SECOES[st.secao] === 'status' || SECOES[st.secao] === 'equipamento') { st.zona = 'lista'; st.foco = linhas().findIndex((l) => l.heroi === h); desenhar(); } });
      return { h, c, nivel, vida, mana, xp, aviso };
    });
  }
  // retrato: 1º quadro da pose parada do atlas de batalha (cfg_sprites_batalha), em escala inteira, sem suavizar
  function desenharRetrato(tela, h) {
    const atlas = dados.config?.sprites_batalha?.atores?.[h]?.atlas; if (!atlas) return;
    const pasta = atlas.replace(/_batalha$/, ''), img = new Image();
    img.onload = () => { const g = tela.getContext('2d'); g.imageSmoothingEnabled = false; g.clearRect(0, 0, 96, 96); g.drawImage(img, 0, 0, 96, 96, 0, 0, 96, 96); };
    img.src = urlAsset(`sprites/${pasta}/${atlas}.png`);
  }
  function encher(b, atual, max, rotuloId) { b.cheio.style.width = `${max > 0 ? Math.max(0, Math.min(100, (atual / max) * 100)) : 0}%`; b.txt.textContent = t(rotuloId, { atual, max, prox: max }); }
  function desenharCartoes() {
    const lf = linhas()[st.foco], heroiFoco = st.zona === 'alvo' ? herois()[st.alvo] : (st.zona === 'lista' || st.zona === 'sub') ? lf?.heroi : null;
    for (const k of cartoes) {
      const g = jogo().grupo[k.h], s = statsDe(k.h), vmax = s?.vida_max ?? g.vida, mmax = s?.mana_max ?? g.mana, prox = cfgXp ? xpParaNivel(g.nivel, cfgXp) : g.xp;
      k.nivel.textContent = t('ui_inv_nivel', { nivel: g.nivel });
      encher(k.vida, g.vida, vmax, 'ui_inv_vida'); encher(k.mana, g.mana, mmax, 'ui_inv_mana'); encher(k.xp, g.xp, prox, 'ui_menu_status_xp');
      k.c.classList.toggle('foco', k.h === heroiFoco); k.c.classList.toggle('alvo', st.zona === 'alvo');
      k.aviso.hidden = !(st.zona === 'alvo' && k.h === heroiFoco && g.vida >= vmax && itemDe(st.item)?.efeito === 'cura');
    }
  }

  // ---------- linhas de cada seção ----------
  function linhas() {
    const j = jogo(), sec = SECOES[st.secao];
    if (sec === 'itens') return Object.entries(j.inventario).filter(([, q]) => q > 0).map(([id, q]) => ({ item: id, rotulo: nomeItem(id), extra: t('ui_menu_itens_qtd', { qtd: q }), desab: !usavel(id) }));
    if (sec === 'equipamento') return herois().flatMap((h) => SLOTS.map((s) => { const at = j.equipamentoDe?.(h)?.[s] ?? null; return { heroi: h, slot: s, grupo: nomeHeroi(h), rotulo: t(`ui_slot_${s}`), extra: at ? nomeItem(at) : t('ui_menu_equip_nada'), item: at }; }));
    if (sec === 'status') return herois().map((h) => ({ heroi: h, rotulo: nomeHeroi(h), extra: t('ui_inv_nivel', { nivel: j.grupo[h].nivel }) }));
    return [...opcoesSistema.map((o) => ({ rotulo: t(o.rotuloId), extra: o.valor(), ajustar: o.ajustar })), { rotulo: t('ui_menu_sistema_inicio'), sair: true }];
  }
  // opções de equipamento para a linha (herói, slot): itens da bolsa daquele slot; os de outro herói aparecem desabilitados
  function opcoes(l) {
    return Object.entries(jogo().inventario).filter(([id, q]) => q > 0 && itemDe(id)?.categoria === 'equipamento' && itemDe(id).slot === l.slot)
      .map(([id]) => ({ item: id, rotulo: nomeItem(id), desab: !(itemDe(id).para ?? []).includes(l.heroi) }));
  }

  // ---------- ações ----------
  const mensagem = (id, vars = {}) => { st.msg = { id, vars }; };
  function ativar() {
    const sec = SECOES[st.secao], l = linhas()[st.foco]; if (!l) return;
    if (sec === 'itens') {
      if (!usavel(l.item)) { if (itemDe(l.item)?.uso_batalha) mensagem('ui_msg_item_so_batalha'); return desenhar(); }
      if (!jogo().usarItem) { mensagem('ui_msg_item_so_batalha'); return desenhar(); }
      st.item = l.item; st.zona = 'alvo'; st.alvo = 0; mensagem('ui_menu_itens_escolha');
    } else if (sec === 'equipamento') {
      if (!opcoes(l).length) mensagem('ui_menu_equip_sem_opcoes'); else { st.zona = 'sub'; st.subFoco = 0; st.msg = null; }
    } else if (sec === 'sistema') { if (l.sair) { st.confirma = true; st.simFoco = false; } else l.ajustar(1); }
    desenhar();
  }
  function usar() {
    const h = herois()[st.alvo], item = st.item, r = jogo().usarItem?.(h, item);
    const vars = { nome_ator: nomeHeroi(h), nome_item: nomeItem(item), valor: r?.valor ?? 0 };
    if (!r) mensagem('ui_msg_item_so_batalha');
    else if (r.ok) mensagem(r.valor > 0 ? (r.efeito === 'mana' ? 'ui_msg_mana_recuperou' : 'ui_msg_cura_recuperou') : 'ui_msg_usou_item', vars);
    else mensagem(r.erro === 'sem_efeito' ? 'ui_msg_sem_efeito' : 'ui_msg_item_so_batalha', vars);
    if (!(jogo().inventario[item] > 0)) { st.zona = 'lista'; st.item = null; st.foco = Math.max(0, Math.min(st.foco, linhas().length - 1)); }
    desenhar();
  }
  function equipar() {
    const l = linhas()[st.foco], o = opcoes(l)[st.subFoco]; if (!o) return;
    const vars = { nome_ator: nomeHeroi(l.heroi), nome_item: nomeItem(o.item) };
    if (o.desab) { mensagem('ui_msg_nao_pode_equipar', vars); return desenhar(); }
    const r = jogo().equipar(l.heroi, o.item);
    if (r?.ok) { mensagem('ui_msg_equipou', vars); st.zona = 'lista'; } else mensagem('ui_msg_nao_pode_equipar', vars);
    desenhar();
  }
  function voltar() {
    if (st.confirma) { st.confirma = false; return desenhar(); }
    if (st.zona === 'alvo' || st.zona === 'sub') { st.zona = 'lista'; st.msg = null; return desenhar(); }
    if (st.zona === 'lista') { st.zona = 'secoes'; return desenhar(); }
    fechar();
  }
  const trocarSecao = (d) => { st.secao = (st.secao + d + SECOES.length) % SECOES.length; st.foco = 0; st.msg = null; if (st.zona !== 'secoes') st.zona = 'lista'; desenhar(); };

  // ---------- desenho ----------
  function desenhar() {
    if (!aberto) return;
    const j = jogo(), sec = SECOES[st.secao], ls = linhas();
    st.foco = Math.max(0, Math.min(st.foco, ls.length - 1));
    moedasEl.textContent = moeda(j.moedas ?? 0);
    bSecoes.forEach((b, i) => { b.classList.toggle('ativa', i === st.secao); b.classList.toggle('foco', st.zona === 'secoes' && i === st.secao); b.setAttribute('aria-pressed', String(i === st.secao)); });
    tituloPainel.textContent = t(sec === 'itens' ? 'ui_menu_itens_titulo' : `ui_menu_${sec === 'equipamento' ? 'equip' : sec}_titulo`);
    lista.replaceChildren(); let grupo = null;
    ls.forEach((l, i) => {
      if (l.grupo && l.grupo !== grupo) { grupo = l.grupo; el('li', 'mp-grupo', lista, grupo); }
      const li = el('li', 'mp-linha', lista); li.setAttribute('role', 'option'); if (l.item) li.dataset.item = l.item; if (l.heroi) li.dataset.heroi = l.heroi; if (l.slot) li.dataset.slot = l.slot;
      const foco = i === st.foco && st.zona !== 'secoes'; li.classList.toggle('foco', foco); li.classList.toggle('escolhida', i === st.foco && (st.zona === 'sub' || st.zona === 'alvo')); li.classList.toggle('desab', !!l.desab); li.setAttribute('aria-selected', String(foco));
      el('span', 'mp-linha-rotulo', li, l.rotulo);
      if (l.ajustar) { const b = botao('tela-controle mp-valor', li, l.extra); b.addEventListener('click', (e) => { e.stopPropagation(); st.zona = 'lista'; st.foco = i; l.ajustar(1); desenhar(); }); } else if (l.extra) el('span', 'mp-linha-extra', li, l.extra);
      li.addEventListener('click', () => { st.zona = 'lista'; st.foco = i; if (!l.ajustar) ativar(); else desenhar(); });
      li.addEventListener('pointerenter', () => { if (st.zona === 'lista' && st.foco !== i) { st.foco = i; desenhar(); } });
    });
    vazio.hidden = ls.length > 0; vazio.textContent = sec === 'itens' ? t('ui_menu_itens_vazio') : '';
    desenharDetalhe(sec, ls[st.foco]);
    msgEl.textContent = st.msg ? t(st.msg.id, st.msg.vars) : ''; msgEl.hidden = !st.msg;
    confirma.hidden = !st.confirma; bSim.classList.toggle('foco', st.confirma && st.simFoco); bNao.classList.toggle('foco', st.confirma && !st.simFoco);
    desenharCartoes();
    lista.querySelector('.mp-linha.foco')?.scrollIntoView?.({ block: 'nearest' });
  }
  function linhaAttr(pai, rotuloId, atual, novo) {
    const li = el('li', 'mp-attr', pai); el('span', 'mp-attr-nome', li, t(rotuloId)); el('span', 'mp-attr-valor', li, String(atual));
    if (novo === undefined) return;
    const d = novo - atual, seta = el('span', `mp-attr-dif ${d > 0 ? 'sobe' : d < 0 ? 'desce' : 'igual'}`, li, d > 0 ? `▲ ${novo} (+${d})` : d < 0 ? `▼ ${novo} (${d})` : `= ${novo}`);
    seta.setAttribute('aria-label', `${t('ui_menu_equip_novo')}: ${novo}`);
  }
  function desenharDetalhe(sec, l) {
    detalhe.replaceChildren(); if (!l) return;
    if (sec === 'itens') { const d = descItem(l.item); if (d) el('p', 'mp-desc', detalhe, t(d)); }
    else if (sec === 'equipamento') {
      if (st.zona !== 'sub') { const d = l.item && descItem(l.item); if (d) el('p', 'mp-desc', detalhe, t(d)); return; }
      const ops = opcoes(l), o = ops[st.subFoco] ?? null;
      const sub = el('ul', 'mp-lista mp-sub', detalhe); sub.setAttribute('role', 'listbox');
      ops.forEach((x, i) => {
        const li = el('li', 'mp-linha', sub, undefined); li.dataset.item = x.item; li.classList.toggle('foco', i === st.subFoco); li.classList.toggle('desab', x.desab); li.setAttribute('role', 'option'); li.setAttribute('aria-selected', String(i === st.subFoco));
        el('span', 'mp-linha-rotulo', li, x.rotulo); el('span', 'mp-linha-extra', li, t('ui_menu_equip_equipar'));
        li.addEventListener('click', () => { st.subFoco = i; equipar(); });
        li.addEventListener('pointerenter', () => { if (st.subFoco !== i) { st.subFoco = i; desenhar(); } });
      });
      if (o && !o.desab) {
        el('p', 'mp-sub-titulo', detalhe, t('ui_menu_equip_comparar'));
        const a = statsDe(l.heroi), n = statsDe(l.heroi, { [l.slot]: o.item }), ul = el('ul', 'mp-attrs', detalhe);
        for (const [k, id] of COMPARA) if (a && n) linhaAttr(ul, id, a[k], n[k]);
      }
    } else if (sec === 'status') {
      // revisão do 10: a metade livre do Status ganha o retrato grande do herói
      const caixa = el('div', 'mp-status', detalhe), grande = el('canvas', 'mp-retrato mp-retrato-grande', caixa); grande.width = grande.height = 96; grande.setAttribute('aria-hidden', 'true'); desenharRetrato(grande, l.heroi);
      const s = statsDe(l.heroi), base = C.herois?.[l.heroi]?.atributos ?? {}, ul = el('ul', 'mp-attrs', caixa);
      for (const [k, id] of BASE) linhaAttr(ul, id, base[k]);
      if (s) for (const [k, id] of COMPARA) linhaAttr(ul, id, s[k]);
      const eq = jogo().equipamentoDe?.(l.heroi) ?? {};
      for (const sl of SLOTS) { const li = el('li', 'mp-attr', ul); el('span', 'mp-attr-nome', li, t(`ui_slot_${sl}`)); el('span', 'mp-attr-valor mp-attr-item', li, eq[sl] ? nomeItem(eq[sl]) : t('ui_menu_equip_nada')); }
    }
  }

  // ---------- abrir / fechar ----------
  function abrir(secao) {
    if (aberto) return false;
    const ok = menuP ? menuP.abrir() : !!(jogo()?.modo === 'mapa' && (pausa?.pausar('menu'), true));
    if (!ok) return false;
    aberto = true; fundo.hidden = false; Object.assign(st, { secao: secao ? Math.max(0, SECOES.indexOf(secao)) : st.secao, zona: secao ? 'lista' : 'secoes', foco: 0, msg: null, confirma: false, item: null });
    montarCartoes(); desenhar(); return true;
  }
  function fechar() { if (!aberto) return; aberto = false; fundo.hidden = true; st.confirma = false; if (menuP) menuP.fechar(); else pausa?.retomar('menu'); }

  function tecla(c) {
    if (st.confirma) {
      if (c === 'ArrowLeft' || c === 'ArrowRight' || c === 'KeyA' || c === 'KeyD' || c === 'ArrowUp' || c === 'ArrowDown') { st.simFoco = !st.simFoco; desenhar(); }
      else if (c === 'Enter' || c === 'NumpadEnter' || c === 'Space') { if (st.simFoco) aoSairInicio(); else voltar(); }
      else if (c === 'Escape' || c === 'Backspace') voltar();
      return;
    }
    const cima = c === 'ArrowUp' || c === 'KeyW', baixo = c === 'ArrowDown' || c === 'KeyS', esq = c === 'ArrowLeft' || c === 'KeyA', dir = c === 'ArrowRight' || c === 'KeyD', ok = c === 'Enter' || c === 'NumpadEnter' || c === 'Space';
    if (c === 'KeyQ') return trocarSecao(-1); if (c === 'KeyE') return trocarSecao(1);
    if (c === 'Escape' || c === 'Backspace') return voltar();
    if (st.zona === 'secoes') {
      if (c === 'KeyC' || c === 'Tab' || c === 'KeyI') return fechar();
      if (cima || baixo) { st.secao = (st.secao + (cima ? -1 : 1) + SECOES.length) % SECOES.length; st.foco = 0; st.msg = null; desenhar(); }
      else if ((ok || dir) && linhas().length) { st.zona = 'lista'; desenhar(); }
      return;
    }
    if (c === 'KeyC' || c === 'Tab') return fechar();
    if (st.zona === 'lista') {
      const n = linhas().length, l = linhas()[st.foco];
      if ((cima || baixo) && n) { st.foco = (st.foco + (cima ? -1 : 1) + n) % n; st.msg = null; desenhar(); }
      else if (l?.ajustar && (esq || dir)) { l.ajustar(esq ? -1 : 1); desenhar(); }
      else if (esq) voltar(); else if (ok || dir) ativar();
    } else if (st.zona === 'sub') {
      const n = opcoes(linhas()[st.foco]).length;
      if ((cima || baixo) && n) { st.subFoco = (st.subFoco + (cima ? -1 : 1) + n) % n; desenhar(); } else if (esq) voltar(); else if (ok) equipar();
    } else if (st.zona === 'alvo') {
      const n = herois().length;
      if (cima || baixo || esq || dir) { st.alvo = (st.alvo + (cima || esq ? -1 : 1) + n) % n; desenhar(); } else if (ok) usar();
    }
  }

  return {
    get aberto() { return aberto; },
    abrir, fechar, alternar: (secao) => (aberto ? (fechar(), true) : abrir(secao)),
    /** Tecla com o menu aberto (o chamador já parou a propagação). */
    tecla(e) { if (!e.repeat || e.code.startsWith('Arrow')) tecla(e.code); },
    gamepad(b) {
      if (b('select') || b('start')) return fechar();
      const k = b('leste') ? 'Escape' : b('sul') ? 'Enter' : b('cima') ? 'ArrowUp' : b('baixo') ? 'ArrowDown' : b('esq') ? 'ArrowLeft' : b('dir') ? 'ArrowRight' : b('lb') ? 'KeyQ' : b('rb') ? 'KeyE' : null;
      if (k) tecla(k);
    },
    /** A cada quadro: o 08 pode fechar o menu por fora (batalha forçada, game over). */
    atualizar() { if (aberto && menuP && !menuP.aberto) { aberto = false; fundo.hidden = true; } },
    desenhar,
  };
}
