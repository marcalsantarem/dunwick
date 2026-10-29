// Telas fora da batalha (15, pacote v0.1.1): menu de pausa (botão ⏸, Esc/P, Start do gamepad), botão de tela cheia e dica de controles
// da 1ª vez. DOM dentro de #ui (retângulo do jogo, escala com --k); texto só por ID e por textContent. A tela de início é do 08
// (plataforma.inicio, #inicio); aqui só se espera ela acabar. API da plataforma (08, principal.js): preferencias.obter/definir/todas,
// telaCheia.suportada/ativa/alternar/aoMudar, pausa.pausar('ui')/retomar('ui'), movel.ativo. Sem ela (testes), há substitutos locais.

function el(tag, classe, pai, texto) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (texto !== undefined) e.textContent = texto;
  if (pai) pai.appendChild(e);
  return e;
}
const botao = (classe, pai, texto) => { const b = el('button', classe, pai, texto); b.type = 'button'; b.tabIndex = -1; return b; };

function preferenciasNaMemoria() {
  let p = { volume: 0.8, velocidade_batalha: 1, reduzir_movimento: false, tela_cheia_pedida: false, dica_vista: false };
  return { obter: (k) => p[k], definir(k, v) { p = { ...p, [k]: v }; return true; }, todas: () => ({ ...p }) };
}
const SEM_TELA_CHEIA = { suportada: false, ativa: () => false, alternar: async () => false };

/**
 * @param podeCancelarBatalha () → true quando o Esc ainda tem o que desfazer na batalha (submenu, alvo, escolha anterior)
 * @param aoMudar (prefs) → a batalha aplica velocidade e reduzir movimento
 */
export function criarTelas({ mundo, t, cfg, dados = {}, plataforma = {}, podeCancelarBatalha = () => false, aoMudar = () => {} }) {
  const P = plataforma.preferencias ?? preferenciasNaMemoria(), tela = plataforma.telaCheia ?? SEM_TELA_CHEIA, pausa = plataforma.pausa ?? null;
  const toque = plataforma.movel?.ativo ?? !!globalThis.matchMedia?.('(pointer: coarse)').matches;
  const iniciou = () => !plataforma.inicio?.pendente;
  let pausado = false, foco = 0, dica = null;

  const pai = document.getElementById('ui') ?? document.body, raiz = el('div', 'tela', pai);
  // ---------- canto: ⏸ e tela cheia ----------
  const canto = el('div', 'tela-canto', raiz); canto.hidden = true;
  const bPausa = botao('tela-botao-canto', canto, '⏸'); bPausa.setAttribute('aria-label', t('ui_pausa_abrir'));
  const bCheia = botao('tela-botao-canto tela-cheia-canto', canto, '⛶'); bCheia.setAttribute('aria-label', t('ui_pausa_tela_cheia'));
  // ---------- pausa ----------
  const fundo = el('div', 'tela-pausa', raiz); fundo.hidden = true;
  const painel = el('div', 'tela-painel', fundo); painel.setAttribute('role', 'dialog'); painel.setAttribute('aria-label', t('ui_pausa_titulo'));
  el('h2', 'tela-painel-titulo', painel, t('ui_pausa_titulo'));
  const linha = (rotuloId) => { const l = el('div', 'tela-linha', painel); el('span', 'tela-rotulo', l, t(rotuloId)); return l; };
  const lContinuar = el('div', 'tela-linha', painel), bContinuar = botao('tela-controle tela-continuar', lContinuar, t('ui_pausa_continuar'));
  const lVolume = linha('ui_pausa_volume'), bMenos = botao('tela-controle tela-passo', lVolume, '−'), volEl = el('span', 'tela-valor', lVolume), bMais = botao('tela-controle tela-passo', lVolume, '+');
  bMenos.setAttribute('aria-label', t('ui_pausa_menos')); bMais.setAttribute('aria-label', t('ui_pausa_mais'));
  const lReduzir = linha('ui_pausa_reduzir'), bReduzir = botao('tela-controle tela-alterna', lReduzir);
  const lVel = linha('ui_pausa_velocidade'), bVel = botao('tela-controle tela-alterna', lVel);
  const lCheia = linha('ui_pausa_tela_cheia'), bCheiaPainel = botao('tela-controle tela-alterna', lCheia);
  const linhas = [lContinuar, lVolume, lReduzir, lVel, lCheia];
  // ---------- janela de achado (baú de tesouro; eventos do 13: bau_aberto {mapa, id, item, quantidade} e bau_vazio {mapa, id}) ----------
  // O item já está na mochila: a janela só informa. Fila se vierem vários; enquanto aberta, plataforma.pausa('achado') para o mundo.
  const fundoAchado = el('div', 'tela-pausa tela-achado', raiz); fundoAchado.hidden = true;
  const painelAchado = el('div', 'tela-painel tela-painel-achado', fundoAchado); painelAchado.setAttribute('role', 'alertdialog');
  const iconeAchado = el('div', 'tela-achado-icone', painelAchado); iconeAchado.setAttribute('aria-hidden', 'true');
  const textoAchado = el('p', 'tela-achado-texto', painelAchado), bOk = botao('tela-controle tela-continuar tela-ok', painelAchado, t('ui_achado_ok'));
  const filaAchados = []; let achado = null;
  const nomeTxtItem = (id) => dados.combate?.itens?.[id]?.nome_txt ?? dados.itens?.[id]?.nome_txt ?? `txt_${id}_nome`;
  function mostrarAchado() {
    if (achado || !filaAchados.length) return;
    achado = filaAchados.shift(); fundoAchado.hidden = false; pausa?.pausar('achado'); esconderDica(false);
    painelAchado.classList.toggle('vazio', achado.vazio);
    iconeAchado.textContent = achado.vazio ? '∅' : '✦';
    textoAchado.textContent = achado.vazio ? t('ui_achado_vazio')
      : t(achado.quantidade > 1 ? 'ui_achado_encontrou_qtd' : 'ui_achado_encontrou', { nome_item: t(nomeTxtItem(achado.item)), qtd: achado.quantidade });
    painelAchado.setAttribute('aria-label', textoAchado.textContent);
  }
  function fecharAchado() { if (!achado) return; achado = null; fundoAchado.hidden = true; pausa?.retomar('achado'); mostrarAchado(); }
  bOk.addEventListener('click', fecharAchado);
  // (o 13 também emite 'achado' para o mesmo baú: escutamos só bau_aberto, uma janela por baú)
  mundo.eventos?.em('bau_aberto', (ev) => { filaAchados.push({ item: ev.item, quantidade: ev.quantidade ?? 1, vazio: !ev.item }); mostrarAchado(); });
  mundo.eventos?.em('bau_vazio', () => { filaAchados.push({ vazio: true }); mostrarAchado(); });

  // ---------- dica ----------
  const dicaEl = el('div', 'tela-dica', raiz); dicaEl.hidden = true; dicaEl.setAttribute('role', 'status');
  // ---------- nome do mapa ao entrar (início do jogo e cada troca por portal: evento 'mapa_trocado' da simulação) ----------
  const bannerEl = el('div', 'tela-banner-mapa', raiz); bannerEl.hidden = true; bannerEl.setAttribute('role', 'status');
  const pedirBanner = (id) => ({ id, nomeTxt: dados.mapas?.[id]?.nome_txt, t: 0 });
  let banner = pedirBanner(mundo.mapaId ?? null); // pendente desde o começo: aparece quando o jogo começa de fato
  mundo.eventos?.em('mapa_trocado', (ev) => { banner = pedirBanner(ev.mapa); });

  const prefs = () => P.todas();
  function gravar(parcial) { for (const [k, v] of Object.entries(parcial)) P.definir(k, v); desenhar(); aoMudar(prefs()); }
  function desenhar() {
    const p = prefs(), cheia = !!tela.suportada;
    canto.hidden = !iniciou(); canto.classList.toggle('toque', toque); bCheia.hidden = toque || !cheia;
    volEl.textContent = t('ui_pausa_volume_valor', { valor: Math.round(p.volume * 100) });
    bReduzir.textContent = t(p.reduzir_movimento ? 'ui_ligado' : 'ui_desligado'); bReduzir.setAttribute('aria-pressed', String(p.reduzir_movimento));
    bVel.textContent = t('ui_pausa_vel_valor', { vel: p.velocidade_batalha });
    bCheiaPainel.textContent = t(tela.ativa() ? 'ui_ligado' : 'ui_desligado'); lCheia.hidden = !cheia;
    fundo.hidden = !pausado;
    linhas.forEach((l, i) => l.classList.toggle('foco', pausado && i === foco));
    for (const e of [raiz, document.getElementById('batalha'), ...document.querySelectorAll('.bat-camada')]) e?.classList.toggle('reduzir', p.reduzir_movimento);
  }

  // ---------- ações ----------
  function abrirPausa() { if (pausado || !iniciou()) return; pausado = true; foco = 0; pausa?.pausar('ui'); esconderDica(false); desenhar(); }
  function fecharPausa() { if (!pausado) return; pausado = false; pausa?.retomar('ui'); desenhar(); }
  const volume = (d) => gravar({ volume: Math.min(1, Math.max(0, Math.round((prefs().volume + d) * 10) / 10)) });
  const alternarReduzir = () => gravar({ reduzir_movimento: !prefs().reduzir_movimento });
  const alternarVel = () => gravar({ velocidade_batalha: prefs().velocidade_batalha === 1 ? 2 : 1 });
  // dentro do gesto (clique/toque/tecla); guarda o pedido para o 08 repetir na próxima abertura do jogo
  const alternarCheia = () => Promise.resolve(tela.alternar()).then((ativa) => gravar({ tela_cheia_pedida: !!ativa })).finally(desenhar);
  const ativar = [fecharPausa, () => volume(0.1), alternarReduzir, alternarVel, alternarCheia];
  const ajustar = [null, (d) => volume(d * 0.1), alternarReduzir, alternarVel, alternarCheia];
  function mover(d) { const vis = linhas.map((l, i) => (l.hidden ? -1 : i)).filter((i) => i >= 0); foco = vis[(vis.indexOf(foco) + d + vis.length) % vis.length]; desenhar(); }

  bPausa.addEventListener('click', abrirPausa); bCheia.addEventListener('click', alternarCheia);
  bContinuar.addEventListener('click', fecharPausa); bMenos.addEventListener('click', () => volume(-0.1)); bMais.addEventListener('click', () => volume(0.1));
  bReduzir.addEventListener('click', alternarReduzir); bVel.addEventListener('click', alternarVel); bCheiaPainel.addEventListener('click', alternarCheia);
  linhas.forEach((l, i) => l.addEventListener('pointerenter', () => { if (pausado && foco !== i) { foco = i; desenhar(); } }));
  fundo.addEventListener('pointerdown', (e) => { if (e.target === fundo) fecharPausa(); }); // tocar fora do painel fecha
  fundo.addEventListener('contextmenu', (e) => { e.preventDefault(); fecharPausa(); });
  tela.aoMudar?.(() => desenhar());

  // teclado: registrado ANTES do da batalha (criarTelas roda primeiro), então com a pausa aberta a batalha não recebe tecla nenhuma
  addEventListener('keydown', (e) => {
    if (!iniciou()) return; // a tela de início (08) cuida da tecla
    if (achado) { e.preventDefault(); e.stopImmediatePropagation(); if (!e.repeat && ['Enter', 'NumpadEnter', 'Space', 'Escape', 'KeyE', 'Backspace'].includes(e.code)) fecharAchado(); return; }
    const pausa = e.code === 'Escape' || e.code === 'KeyP';
    if (!pausado) {
      if (!pausa || (e.code === 'Escape' && mundo.jogo?.modo === 'batalha' && podeCancelarBatalha())) return;
      e.preventDefault(); e.stopImmediatePropagation(); abrirPausa(); return;
    }
    e.preventDefault(); e.stopImmediatePropagation();
    if (pausa || e.code === 'Backspace') fecharPausa();
    else if (e.code === 'ArrowUp' || e.code === 'KeyW') mover(-1); else if (e.code === 'ArrowDown' || e.code === 'KeyS') mover(1);
    else if (e.code === 'ArrowLeft' || e.code === 'KeyA') ajustar[foco]?.(-1); else if (e.code === 'ArrowRight' || e.code === 'KeyD') ajustar[foco]?.(1);
    else if ((e.code === 'Enter' || e.code === 'Space') && !e.repeat) ativar[foco]();
  }, true);

  // gamepad: Start abre/fecha; com a pausa aberta, direcional navega, sul ativa, leste fecha
  let antes = {};
  function lerGamepad() {
    const gp = [...(navigator.getGamepads?.() ?? [])].find((g) => g && g.mapping === 'standard'); if (!gp) return;
    const b = (i) => !!gp.buttons[i]?.pressed, ay = gp.axes[1] ?? 0, ax = gp.axes[0] ?? 0;
    const agora = { start: b(9), sul: b(0), leste: b(1), cima: b(12) || ay < -0.5, baixo: b(13) || ay > 0.5, esq: b(14) || ax < -0.5, dir: b(15) || ax > 0.5 };
    const borda = (k) => agora[k] && !antes[k]; antes = agora;
    if (!iniciou()) return;
    if (achado) { if (borda('sul') || borda('leste') || borda('start')) fecharAchado(); return; }
    if (borda('start')) { if (pausado) fecharPausa(); else abrirPausa(); return; }
    if (!pausado) return;
    if (borda('cima')) mover(-1); if (borda('baixo')) mover(1); if (borda('esq')) ajustar[foco]?.(-1); if (borda('dir')) ajustar[foco]?.(1);
    if (borda('sul')) ativar[foco](); if (borda('leste')) fecharPausa();
  }

  // ---------- dica de controles (1ª vez no mapa) ----------
  function esconderDica(marcar = true) { if (!dica) return; dica = null; dicaEl.hidden = true; if (marcar) gravar({ dica_vista: true }); }
  function cuidarDica(dt) {
    if (!iniciou() || pausado || achado) return;
    const h = mundo.heroi;
    if (!dica) {
      if (prefs().dica_vista || mundo.jogo?.modo !== 'mapa' || !h) return;
      dica = { t: 0, x: h.x, z: h.z }; dicaEl.textContent = t(toque ? 'ui_dica_andar_toque' : 'ui_dica_andar_pc'); dicaEl.hidden = false; return;
    }
    dica.t += dt;
    if (dica.t >= cfg.t_dica_s || mundo.jogo?.modo !== 'mapa' || (h && Math.hypot(h.x - dica.x, h.z - dica.z) > 0.05)) esconderDica();
  }

  // não bloqueia nada (sem clique, sem pausa); some na batalha; congela sob pausa/achado; reduzir movimento: só esmaece, sem deslizar
  function cuidarBanner(dt) {
    if (!banner.id || !iniciou()) return;
    if (mundo.jogo && mundo.jogo.modo !== 'mapa') { banner.id = null; bannerEl.hidden = true; return; }
    if (pausado || achado) { bannerEl.hidden = true; return; }
    const B = cfg.banner_mapa, nomeTxt = banner.nomeTxt;
    if (!nomeTxt || banner.t >= B.t_total_s) { banner.id = null; bannerEl.hidden = true; return; }
    if (bannerEl.hidden || bannerEl.dataset.mapa !== banner.id) { bannerEl.textContent = t(nomeTxt); bannerEl.dataset.mapa = banner.id; bannerEl.hidden = false; }
    const a = Math.min(1, banner.t / B.t_entra_s, (B.t_total_s - banner.t) / B.t_sai_s);
    bannerEl.style.opacity = String(Math.max(0, a)); bannerEl.style.setProperty('--entra', String(Math.max(0, a)));
    banner.t += dt;
  }

  desenhar();
  return {
    get pausado() { return pausado || !!achado; }, get achadoAberto() { return !!achado; }, preferencias: prefs,
    atualizar(dt) { if (canto.hidden === iniciou()) desenhar(); lerGamepad(); cuidarDica(dt); cuidarBanner(dt); },
    abrirPausa, fecharPausa, gravar,
  };
}
