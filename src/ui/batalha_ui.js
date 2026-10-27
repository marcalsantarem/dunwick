// UI da batalha por turnos (BL-008 etapa 2; spec docs/ui/batalha.md). Camada DOM sobre o canvas; lê o controlador do 03
// (consultar / esvaziarFila / enviarComando / voltar / executar) e NUNCA decide regra. Texto só por ID (data/texts) e
// sempre por textContent (nunca innerHTML). Só aparece com mundo.jogo.modo === 'batalha'.
// Ritmo: a UI é quem consome a fila; cada evento é repassado à cena (aoEvento) no seu instante, e a cena pode segurar o
// próximo passo com definirEspera(() => ocupada). executar() só roda com a fila tocada e sem espera.
import { criarReprodutor, alvosValidos, alvoInicial } from './batalha_fila.js';

const COMANDOS = ['atacar', 'habilidade', 'item', 'defender', 'fugir'];
// ícones provisórios (formas simples) até o 04 entregar os 16×16
const ICONE = { atacar: '⚔', habilidade: '✦', item: '⚱', defender: '⛨', fugir: '➹', cadeado: '🔒', vida_baixa: '♥', caido: '✝', feito: '✓', falhou: '✕', previsto: '?' };

function el(tag, classe, pai, texto) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (texto !== undefined) e.textContent = texto;
  if (pai) pai.appendChild(e);
  return e;
}

export function criarBatalhaUi({ mundo, dados, t, debug = false }) {
  const cfg = dados.config.ui_batalha, cfgB = dados.config.batalha, tempos = cfgB.tempos;
  const nomeItem = (id) => t(dados.combate.itens[id]?.nome_txt ?? id);

  // ---------- estrutura ----------
  const raiz = el('div', 'bat', document.body); raiz.id = 'batalha'; raiz.hidden = true;
  const topo = el('div', 'bat-topo', raiz);
  const ordemEl = el('ol', 'bat-ordem', topo); ordemEl.setAttribute('aria-label', t('ui_bat_ordem'));
  const rodadaEl = el('span', 'bat-rodada', topo);
  const velEl = el('button', 'bat-vel', topo); velEl.type = 'button'; velEl.tabIndex = -1;
  const palco = el('div', 'bat-palco', raiz);
  const info = el('div', 'bat-painel bat-info', raiz); info.setAttribute('role', 'status'); info.setAttribute('aria-live', 'polite');
  const infoTexto = el('p', 'bat-info-texto', info), infoDados = el('p', 'bat-info-dados', info);
  const base = el('div', 'bat-base', raiz);
  const menuEl = el('ul', 'bat-painel bat-menu', base); menuEl.setAttribute('role', 'menu');
  const subEl = el('ul', 'bat-painel bat-menu bat-sub', base); subEl.setAttribute('role', 'menu'); subEl.hidden = true;
  const grupoEl = el('div', 'bat-grupo', base);
  const resultadoEl = el('div', 'bat-painel bat-resultado', raiz); resultadoEl.hidden = true;

  // ---------- estado ----------
  let ctrl = null, modo = 'inativo', snap = null, vez = null, rodada = 0, acelerando = false, figuras = true;
  let menuFoco = 0, subTipo = null, subFoco = 0, alvo = null, fim = null, voltaDe = 'menu';
  let ordemExec = null, atual = null;
  const exib = new Map(), placas = new Map(), caixas = new Map(), ultimoCmd = {}, iconeCmd = {}, feitos = new Set(), falhos = new Set(), barraAte = new Map();
  const observadores = []; let esperaCena = () => false;
  let projetar = ([x, z]) => ({ x: 50 + (x / cfg.palco_meia_largura_tiles) * 40, y: 52 + (z / cfg.palco_meia_profundidade_tiles) * 30 });

  const rep = criarReprodutor({ aplicar, esperaExterna: () => esperaCena() });

  // ---------- desenho ----------
  const fracao = (a, campo) => (a[`${campo}_max`] ? a[campo] / a[`${campo}_max`] : 0);
  const vidaBaixa = (a) => !a.caido && fracao(a, 'vida') <= cfg.vida_baixa_fracao;

  function mensagem(texto, dadosLinha = '') { infoTexto.textContent = texto; infoDados.textContent = dadosLinha; }

  function criarBarra(pai, tipo) {
    const b = el('div', `bat-barra bat-barra-${tipo}`, pai); const enche = el('div', 'bat-barra-enche', b);
    b.setAttribute('role', 'meter'); return { b, enche };
  }
  const pintarBarra = ({ b, enche }, atual_, max) => { enche.style.width = `${max ? (100 * atual_) / max : 0}%`; b.setAttribute('aria-valuenow', String(atual_)); b.setAttribute('aria-valuemax', String(max)); };

  function montarAtores() {
    palco.replaceChildren(); grupoEl.replaceChildren(); placas.clear(); caixas.clear();
    for (const a of exib.values()) {
      const p = el('button', `bat-placa bat-placa-${a.lado}`, palco); p.type = 'button'; p.tabIndex = -1;
      const pos = projetar(a.posicao_cena); p.style.left = `${pos.x}%`; p.style.top = `${pos.y}%`;
      const cursor = el('span', 'bat-cursor', p, '▼'); cursor.setAttribute('aria-hidden', 'true');
      const nome = el('span', 'bat-placa-nome', p, t(a.nome_txt));
      const barra = a.lado === 'inimigos' ? criarBarra(p, 'vida') : null;
      const figura = el('span', `bat-figura bat-figura-${a.lado}`, p); figura.setAttribute('aria-hidden', 'true');
      p.addEventListener('pointerenter', () => { if (modo === 'alvo' && alvo.lista.some((x) => x.uid === a.uid)) { alvo.foco = a.uid; desenharAlvo(); } });
      p.addEventListener('click', () => cliquePlaca(a.uid));
      placas.set(a.uid, { p, nome, barra, figura, cursor });
      if (a.lado === 'grupo') {
        const c = el('div', 'bat-painel bat-caixa', grupoEl);
        const ret = el('span', 'bat-retrato bat-retrato-grupo', c); ret.setAttribute('aria-hidden', 'true');
        const cab = el('div', 'bat-caixa-cab', c); el('span', 'bat-caixa-nome', cab, t(a.nome_txt));
        const vezEl = el('span', 'bat-caixa-vez', cab, '◀'); const cmdEl = el('span', 'bat-caixa-cmd', cab);
        const linha = (rotulo, tipo) => { const l = el('div', 'bat-linha', c); el('span', 'bat-rotulo', l, t(rotulo)); const n = el('span', 'bat-num', l); return { n, barra: criarBarra(l, tipo) }; };
        const vida = linha('ui_bat_vida', 'vida'), mana = linha('ui_bat_mana', 'mana');
        const estado = el('div', 'bat-estado', c), numMana = el('span', 'bat-num-mana', c);
        c.addEventListener('click', () => cliquePlaca(a.uid));
        c.addEventListener('pointerenter', () => { if (modo === 'alvo' && alvo.lista.some((x) => x.uid === a.uid)) { alvo.foco = a.uid; desenharAlvo(); } });
        caixas.set(a.uid, { c, vida, mana, estado, vezEl, cmdEl, numMana });
      }
    }
    for (const a of exib.values()) desenharAtor(a.uid);
  }

  function desenharAtor(uid) {
    const a = exib.get(uid), pl = placas.get(uid), cx = caixas.get(uid);
    if (pl) {
      pl.p.classList.toggle('caido', a.caido); pl.figura.hidden = !figuras;
      if (pl.barra) pintarBarra(pl.barra, a.vida, a.vida_max);
      const mostraInfo = a.lado === 'grupo' ? figuras : (modo === 'alvo' && alvo?.foco === uid) || performance.now() < (barraAte.get(uid) ?? 0) || figuras;
      pl.nome.hidden = !mostraInfo || (a.lado === 'inimigos' && a.caido); if (pl.barra) pl.barra.b.hidden = pl.nome.hidden;
    }
    if (cx) {
      cx.vida.n.textContent = t('ui_bat_valor', { atual: a.vida, max: a.vida_max }); pintarBarra(cx.vida.barra, a.vida, a.vida_max);
      cx.mana.n.textContent = t('ui_bat_valor', { atual: a.mana, max: a.mana_max }); pintarBarra(cx.mana.barra, a.mana, a.mana_max);
      const baixa = vidaBaixa(a);
      cx.c.classList.toggle('alerta', baixa); cx.c.classList.toggle('caido', a.caido); cx.c.classList.toggle('vez', modo !== 'tocando' && modo !== 'resultado' && vez === uid);
      cx.c.classList.toggle('alvo-foco', modo === 'alvo' && alvo?.foco === uid);
      cx.estado.replaceChildren();
      if (a.caido) { el('span', 'bat-icone', cx.estado, ICONE.caido); el('span', '', cx.estado, t('ui_bat_estado_caido')); }
      else if (baixa) { el('span', 'bat-icone bat-icone-alerta', cx.estado, ICONE.vida_baixa); el('span', '', cx.estado, t('ui_bat_vida_baixa')); }
      cx.cmdEl.textContent = a.defendendo ? ICONE.defender : (iconeCmd[uid] ?? '');
    }
  }
  const desenharTodos = () => { for (const uid of exib.keys()) desenharAtor(uid); };

  function desenharOrdem() {
    ordemEl.replaceChildren();
    const executando = ordemExec && modo === 'tocando';
    const lista = executando ? ordemExec : (snap?.ordem_prevista ?? []);
    for (const uid of lista) {
      const a = exib.get(uid); if (!a) continue;
      const li = el('li', `bat-marco bat-marco-${a.lado}`, ordemEl);
      el('span', `bat-retrato bat-retrato-${a.lado}`, li).setAttribute('aria-hidden', 'true');
      el('span', 'bat-marco-nome', li, t(a.nome_txt));
      let marca = '';
      if (a.caido || falhos.has(uid)) { li.classList.add('riscado'); marca = ICONE.falhou; }
      else if (executando && feitos.has(uid)) { li.classList.add('feito'); marca = ICONE.feito; }
      else if (!executando && a.lado === 'grupo' && !snap?.escolhas?.[uid]) marca = ICONE.previsto;
      if (executando && uid === atual) li.classList.add('atual');
      const esc = snap?.escolhas?.[uid]; if (a.defendendo || esc?.comando === 'defender') marca = `${ICONE.defender}${marca}`;
      el('span', 'bat-marco-marca', li, marca);
    }
    rodadaEl.textContent = t('ui_bat_rodada', { n: rodada });
    velEl.textContent = t('ui_bat_velocidade', { vel: ctrl?.velocidade ?? 1 });
  }

  function numero(uid, texto, tipo, icone = '') {
    const a = exib.get(uid), pos = projetar(a.posicao_cena), n = el('div', `bat-numero bat-numero-${tipo}`, palco);
    const pilha = palco.querySelectorAll(`.bat-numero[data-uid="${uid}"]`).length; n.dataset.uid = uid;
    n.style.left = `${pos.x}%`; n.style.top = `calc(${pos.y}% - ${cfg.numero_altura_px + pilha * 8}px)`; n.style.animationDuration = `${tempos.t_numero_dano}s`;
    if (icone) el('span', 'bat-icone', n, icone);
    el('span', '', n, texto);
    setTimeout(() => n.remove(), tempos.t_numero_dano * 1000);
  }

  // ---------- eventos da batalha (no instante de cada um) ----------
  function aplicar(ev) {
    for (const fn of observadores) fn(ev);
    const nome = (uid) => t(exib.get(uid)?.nome_txt ?? uid);
    const a = ev.ator ? exib.get(ev.ator) : null;
    let espera = 0;
    switch (ev.nome) {
      case 'batalha_iniciou': mensagem(t('ui_bat_msg_inicio')); espera = tempos.t_entrada_batalha; break;
      case 'rodada_iniciou': rodada = ev.n; ordemExec = null; atual = null; feitos.clear(); falhos.clear(); for (const k of Object.keys(iconeCmd)) delete iconeCmd[k]; break;
      case 'comando_escolhido': iconeCmd[ev.ator] = ICONE[ev.comando] ?? ''; break;
      case 'execucao_iniciou': ordemExec = ev.ordem; feitos.clear(); break;
      case 'turno_iniciou': if (atual) feitos.add(atual); atual = ev.ator; break;
      case 'ato_executado':
        if (ev.tipo === 'habilidade') mensagem(t('ui_bat_msg_usa_habilidade', { nome_ator: nome(ev.ator), nome_habilidade: t(dados.combate.acoes[ev.id]?.nome_txt ?? ev.id) }));
        else if (ev.tipo === 'item') mensagem(t('ui_bat_msg_usa_item', { nome_ator: nome(ev.ator), nome_item: nomeItem(ev.id) }));
        else if (ev.tipo === 'defender') mensagem(t('ui_bat_msg_defende', { nome_ator: nome(ev.ator) }));
        else if (ev.tipo === 'espera') mensagem(t('ui_bat_msg_espera', { nome_ator: nome(ev.ator) }));
        else mensagem('');
        break;
      case 'dano': {
        const tipo = ev.efetividade === 'fraco' ? 'fraco' : ev.efetividade === 'resistente' ? 'resiste' : 'dano';
        const icone = tipo === 'fraco' ? '▲' : tipo === 'resiste' ? '⛉' : ev.defendendo ? ICONE.defender : '';
        numero(ev.alvo, t('ui_bat_num_dano', { valor: ev.valor }), tipo, icone);
        if (tipo !== 'dano') mensagem(t(tipo === 'fraco' ? 'ui_bat_efetivo_fraco' : 'ui_bat_efetivo_resiste'));
        barraAte.set(ev.alvo, performance.now() + cfg.t_barra_inimigo_visivel * 1000);
        break;
      }
      case 'curou': numero(ev.alvo, t('ui_bat_num_cura', { valor: ev.valor }), 'cura', '❦'); break;
      case 'mana_gasta': { const cx = caixas.get(ev.ator); if (cx) { cx.numMana.textContent = t('ui_bat_num_mana', { valor: ev.valor }); setTimeout(() => { cx.numMana.textContent = ''; }, tempos.t_numero_dano * 1000); } break; }
      case 'vida_mudou': if (a) { a.vida = ev.vida; a.vida_max = ev.vida_max; } break;
      case 'mana_mudou': if (a) { a.mana = ev.mana; a.mana_max = ev.mana_max; } break;
      case 'defendeu': if (a) a.defendendo = true; break;
      case 'fuga_tentada': mensagem(t(ev.sucesso ? 'ui_bat_msg_fuga_ok' : 'ui_bat_msg_fuga_falhou', { nome_ator: nome(ev.ator) })); break;
      case 'ato_falhou': falhos.add(ev.ator); mensagem(t(`ui_bat_msg_falhou_${ev.motivo}`, { nome_ator: nome(ev.ator) })); espera = cfg.t_mensagem; break;
      case 'ato_cancelado': falhos.add(ev.ator); break;
      case 'caiu': exib.get(ev.alvo).caido = true; mensagem(t('ui_bat_msg_caiu', { nome_alvo: nome(ev.alvo) })); espera = tempos.t_cair; break;
      case 'rodada_terminou': if (atual) feitos.add(atual); for (const x of exib.values()) x.defendendo = false; break;
      case 'venceu': fim = { tipo: 'vitoria', ...ev }; mensagem(t('ui_bat_vitoria_titulo')); espera = tempos.t_vitoria; break;
      case 'perdeu': fim = { tipo: 'derrota' }; mensagem(t('ui_bat_derrota_titulo')); espera = cfg.t_mensagem; break;
      case 'fugiu': fim = { tipo: 'fuga' }; espera = cfg.t_mensagem; break;
      case 'empate': fim = { tipo: 'empate' }; mensagem(t('ui_bat_msg_empate')); espera = cfg.t_mensagem; break;
      default: break; // comando_pedido, item_usado, fase_mudou, batalha_terminou: nada na UI
    }
    desenharTodos(); desenharOrdem();
    return espera;
  }

  // ---------- menu de comandos ----------
  function estadoComando(nome) {
    const c = snap.comandos[nome];
    if (nome === 'habilidade' || nome === 'item') {
      const chave = nome === 'habilidade' ? 'habilitada' : 'habilitado', ok = c.some((x) => x[chave]);
      return { ok, motivo: ok ? null : (c[0]?.motivo ?? (nome === 'item' ? 'sem_item' : 'sem_mana')) };
    }
    return { ok: c.habilitado, motivo: c.habilitado ? null : (c.motivo ?? null) };
  }

  function abrirMenu() {
    snap = ctrl.consultar(); vez = snap.vez; modo = 'menu'; subTipo = null; subEl.hidden = true; menuEl.hidden = false;
    menuFoco = ultimoCmd[vez] ?? 0; desenharMenu(); desenharTodos(); desenharOrdem();
  }

  function desenharMenu() {
    menuEl.replaceChildren();
    COMANDOS.forEach((nome, i) => {
      const { ok } = estadoComando(nome), li = el('li', 'bat-item', menuEl); li.setAttribute('role', 'menuitem');
      li.classList.toggle('foco', i === menuFoco && modo !== 'tocando'); li.classList.toggle('pai', modo === 'sub' || modo === 'alvo'); li.classList.toggle('desabilitado', !ok); li.setAttribute('aria-disabled', String(!ok));
      el('span', 'bat-seta', li, '▶'); el('span', 'bat-icone', li, ICONE[nome]); el('span', 'bat-item-texto', li, t(`ui_bat_cmd_${nome}`));
      if (!ok) el('span', 'bat-icone bat-cadeado', li, ICONE.cadeado);
      el('span', 'bat-atalho', li, String(i + 1));
      li.addEventListener('pointerenter', () => { if (modo === 'menu') { menuFoco = i; desenharMenu(); } });
      li.addEventListener('click', () => { if (modo === 'menu' || modo === 'sub' || modo === 'alvo') { voltarAoMenu(); menuFoco = i; confirmarMenu(); } });
    });
    descreverMenu();
  }

  function descreverMenu() {
    const nome = COMANDOS[menuFoco], { ok, motivo } = estadoComando(nome);
    mensagem(t(`ui_bat_desc_${nome}`), ok ? '' : `${ICONE.cadeado} ${t(`ui_bat_motivo_${motivo}`)}`);
    info.classList.toggle('erro', !ok);
  }

  function confirmarMenu() {
    const nome = COMANDOS[menuFoco], { ok } = estadoComando(nome);
    if (!ok) { piscarErro(); return; }
    ultimoCmd[vez] = menuFoco;
    if (nome === 'atacar') abrirAlvo({ comando: 'atacar', id: snap.comandos.atacar.id, alvo_tipo: snap.comandos.atacar.alvo_tipo }, 'menu');
    else if (nome === 'habilidade' || nome === 'item') abrirSub(nome);
    else enviar({ comando: nome });
  }

  function abrirSub(tipo) {
    modo = 'sub'; subTipo = tipo; subFoco = Math.max(0, snap.comandos[tipo].findIndex((x) => x.habilitada ?? x.habilitado)); subEl.hidden = false; desenharSub(); desenharMenu();
    descreverSub();
  }

  function desenharSub() {
    subEl.replaceChildren();
    snap.comandos[subTipo].forEach((x, i) => {
      const ok = x.habilitada ?? x.habilitado, li = el('li', 'bat-item', subEl); li.setAttribute('role', 'menuitem');
      li.classList.toggle('foco', i === subFoco && (modo === 'sub' || modo === 'alvo')); li.classList.toggle('pai', modo === 'alvo'); li.classList.toggle('desabilitado', !ok); li.setAttribute('aria-disabled', String(!ok));
      el('span', 'bat-seta', li, '▶'); el('span', 'bat-icone', li, ICONE[subTipo]); el('span', 'bat-item-texto', li, t(x.nome_txt));
      el('span', 'bat-item-dado', li, subTipo === 'habilidade' ? t('ui_bat_custo_mana', { custo: x.custo }) : t('ui_bat_qtd', { qtd: x.qtd }));
      if (!ok) el('span', 'bat-icone bat-cadeado', li, ICONE.cadeado);
      li.addEventListener('pointerenter', () => { if (modo === 'sub') { subFoco = i; desenharSub(); descreverSub(); } });
      li.addEventListener('click', () => { if (modo === 'alvo') { modo = 'sub'; alvo = null; } if (modo === 'sub') { subFoco = i; confirmarSub(); } });
    });
  }

  function descreverSub() {
    const x = snap.comandos[subTipo][subFoco]; if (!x) return;
    const ok = x.habilitada ?? x.habilitado;
    const linha = [t(`ui_bat_alvo_${x.alvo_tipo}`)]; if (!ok) linha.push(`${ICONE.cadeado} ${t(`ui_bat_motivo_${x.motivo}`)}`);
    mensagem(t(x.nome_txt.replace(/_nome$/, '_desc')), linha.join(' · ')); info.classList.toggle('erro', !ok);
  }

  function confirmarSub() {
    const x = snap.comandos[subTipo][subFoco]; if (!x) return;
    if (!(x.habilitada ?? x.habilitado)) { piscarErro(); return; }
    abrirAlvo({ comando: subTipo, id: x.id, alvo_tipo: x.alvo_tipo }, 'sub');
  }

  // ---------- seleção de alvo ----------
  function abrirAlvo(cmd, de) {
    if (cmd.alvo_tipo === 'si') { enviar({ comando: cmd.comando, id: cmd.id }); return; }
    const lista = alvosValidos([...exib.values()], cmd.alvo_tipo, vez);
    if (!lista.length) { mensagem(t('ui_bat_motivo_sem_alvo')); piscarErro(); return; }
    voltaDe = de; modo = 'alvo'; alvo = { cmd, lista, foco: alvoInicial(lista, cmd.alvo_tipo) }; desenharMenu(); if (de === 'sub') desenharSub(); desenharAlvo();
  }

  function desenharAlvo() {
    for (const [uid, pl] of placas) pl.p.classList.toggle('alvo-foco', modo === 'alvo' && alvo.foco === uid);
    if (modo === 'alvo') { const a = exib.get(alvo.foco); mensagem(t(a.nome_txt), t('ui_bat_vida_alvo', { atual: a.vida, max: a.vida_max })); info.classList.remove('erro'); }
    desenharTodos();
  }

  function moverAlvo(d) { const i = alvo.lista.findIndex((x) => x.uid === alvo.foco); alvo.foco = alvo.lista[(i + d + alvo.lista.length) % alvo.lista.length].uid; desenharAlvo(); }

  function cliquePlaca(uid) {
    if (modo === 'alvo') { if (alvo.lista.some((x) => x.uid === uid)) { alvo.foco = uid; enviar({ comando: alvo.cmd.comando, id: alvo.cmd.id, alvo: uid }); } return; }
    // atalho: no 1º nível do menu, clicar num inimigo vivo = Atacar nele
    const a = exib.get(uid);
    if (modo === 'menu' && a.lado === 'inimigos' && !a.caido && snap.comandos.atacar.habilitado) { menuFoco = 0; ultimoCmd[vez] = 0; enviar({ comando: 'atacar', id: snap.comandos.atacar.id, alvo: uid }); }
  }

  // ---------- envio e cancelamento ----------
  function enviar(cmd) {
    const r = ctrl.enviarComando({ ator: vez, ...cmd });
    if (!r.ok) { mensagem(t('ui_bat_erro', { erro: r.erro })); piscarErro(); return; }
    fecharMenus(); rep.adicionar(ctrl.esvaziarFila());
  }
  function fecharMenus() { modo = 'tocando'; alvo = null; subTipo = null; subEl.hidden = true; menuEl.hidden = true; for (const pl of placas.values()) pl.p.classList.remove('alvo-foco'); info.classList.remove('erro'); mensagem(''); desenharTodos(); desenharOrdem(); }
  function voltarAoMenu() { modo = 'menu'; alvo = null; subTipo = null; subEl.hidden = true; for (const pl of placas.values()) pl.p.classList.remove('alvo-foco'); desenharMenu(); desenharTodos(); }

  function cancelar() {
    if (modo === 'alvo') { if (voltaDe === 'sub') { modo = 'sub'; alvo = null; desenharSub(); desenharMenu(); descreverSub(); desenharAlvo(); } else voltarAoMenu(); }
    else if (modo === 'sub') voltarAoMenu();
    else if (modo === 'menu' && ctrl.voltar()) { fecharMenus(); rep.adicionar(ctrl.esvaziarFila()); }
  }

  function piscarErro() { info.classList.remove('pisca'); void info.offsetWidth; info.classList.add('pisca', 'erro'); }

  // ---------- resultado ----------
  function abrirResultado() {
    modo = 'resultado'; menuEl.hidden = true; subEl.hidden = true;
    if (fim.tipo === 'fuga' || fim.tipo === 'empate') { encerrar(); return; }
    resultadoEl.replaceChildren(); resultadoEl.hidden = false;
    const botao = (id, acao) => { const b = el('button', 'bat-item foco bat-botao', resultadoEl); b.type = 'button'; el('span', 'bat-seta', b, '▶'); el('span', '', b, t(id)); b.addEventListener('click', acao); return b; };
    if (fim.tipo === 'vitoria') {
      el('h2', 'bat-res-titulo', resultadoEl, t('ui_bat_vitoria_titulo'));
      const ul = el('ul', 'bat-res-lista', resultadoEl);
      el('li', '', ul, t('ui_bat_ganhou_xp', { xp: fim.xp })); el('li', '', ul, t('ui_bat_ganhou_ouro', { ouro: fim.moedas }));
      for (const [id, qtd] of Object.entries(fim.itens ?? {})) el('li', '', ul, t('ui_bat_ganhou_item', { nome_item: nomeItem(id), qtd }));
      for (const n of fim.niveis ?? []) el('li', 'bat-res-nivel', ul, t('ui_bat_subiu_nivel', { nome_ator: t(exib.get(n.ator).nome_txt), nivel: n.para }));
      for (const a of exib.values()) if (a.lado === 'grupo' && a.caido) el('li', 'bat-res-caido', ul, t('ui_bat_sem_xp_caido', { nome_ator: t(a.nome_txt) }));
      botao('ui_bat_continuar', encerrar);
    } else {
      el('h2', 'bat-res-titulo', resultadoEl, t('ui_bat_derrota_titulo'));
      botao('ui_gameover_tentar', () => { encerrar(); if (mundo.jogo.modo === 'game_over') mundo.jogo.tentarDeNovo(); });
    }
  }
  function confirmarResultado() { resultadoEl.querySelector('button')?.click(); }

  function encerrar() {
    if (!ctrl) return;
    if (mundo.jogo.modo === 'batalha') mundo.jogo.encerrarBatalha();
    ctrl = null; modo = 'inativo'; resultadoEl.hidden = true; raiz.hidden = true; palco.replaceChildren(); ordemEl.replaceChildren();
  }

  // ---------- entrada: teclado, mouse, gamepad ----------
  function acao(a) {
    if (!ctrl) return false;
    if (modo === 'resultado') { if (a === 'confirmar') confirmarResultado(); return a === 'confirmar'; }
    if (a === 'velocidade') { const vs = cfgB.velocidades_batalha; ctrl.definirVelocidade(vs[(vs.indexOf(ctrl.velocidade) + 1) % vs.length]); desenharOrdem(); return true; }
    if (modo === 'menu') {
      if (a === 'cima' || a === 'baixo') { menuFoco = (menuFoco + (a === 'cima' ? -1 : 1) + COMANDOS.length) % COMANDOS.length; desenharMenu(); }
      else if (a === 'confirmar') confirmarMenu(); else if (a === 'cancelar') cancelar();
      else if (a.startsWith('num')) { const i = Number(a.slice(3)) - 1; if (i < COMANDOS.length) { menuFoco = i; desenharMenu(); confirmarMenu(); } }
      else return false;
      return true;
    }
    if (modo === 'sub') {
      const n = snap.comandos[subTipo].length;
      if (a === 'cima' || a === 'baixo') { subFoco = (subFoco + (a === 'cima' ? -1 : 1) + n) % n; desenharSub(); descreverSub(); }
      else if (a === 'confirmar') confirmarSub(); else if (a === 'cancelar') cancelar();
      else if (a.startsWith('num')) { const i = Number(a.slice(3)) - 1; if (i < n) { subFoco = i; desenharSub(); confirmarSub(); } }
      else return false;
      return true;
    }
    if (modo === 'alvo') {
      if (['cima', 'esquerda'].includes(a)) moverAlvo(-1); else if (['baixo', 'direita'].includes(a)) moverAlvo(1);
      else if (a === 'confirmar') enviar({ comando: alvo.cmd.comando, id: alvo.cmd.id, alvo: alvo.foco }); else if (a === 'cancelar') cancelar();
      else return false;
      return true;
    }
    return a === 'confirmar';
  }

  const TECLAS = { ArrowUp: 'cima', KeyW: 'cima', ArrowDown: 'baixo', KeyS: 'baixo', ArrowLeft: 'esquerda', KeyA: 'esquerda', ArrowRight: 'direita', KeyD: 'direita',
    Enter: 'confirmar', NumpadEnter: 'confirmar', Space: 'confirmar', Escape: 'cancelar', Backspace: 'cancelar', Tab: 'velocidade',
    Digit1: 'num1', Digit2: 'num2', Digit3: 'num3', Digit4: 'num4', Digit5: 'num5', Digit6: 'num6', Digit7: 'num7', Digit8: 'num8', Digit9: 'num9' };
  addEventListener('keydown', (e) => {
    if (debug && e.code === cfgB.debug.tecla_proximo_encontro && mundo.jogo?.modo === 'mapa') { const c = mundo.jogo.depurarEncontro(); if (c) ligar(c); e.preventDefault(); return; }
    if (!ctrl || raiz.hidden) return;
    const a = TECLAS[e.code]; if (!a) return;
    e.preventDefault(); e.stopImmediatePropagation();
    if (a === 'confirmar' && modo === 'tocando') { acelerando = true; return; }
    if (!e.repeat || a !== 'confirmar') acao(a);
  }, true);
  addEventListener('keyup', (e) => { if (TECLAS[e.code] === 'confirmar') acelerando = false; }, true);
  raiz.addEventListener('pointerdown', () => { if (modo === 'tocando') acelerando = true; });
  addEventListener('pointerup', () => { acelerando = false; });
  raiz.addEventListener('contextmenu', (e) => { e.preventDefault(); if (ctrl) cancelar(); });
  velEl.addEventListener('click', () => acao('velocidade'));

  // gamepad (mapeamento padrão): direcional/analógico, face sul confirma (segurar acelera), leste volta, oeste velocidade
  let padAntes = {};
  function lerGamepad() {
    const gp = [...(navigator.getGamepads?.() ?? [])].find((g) => g && g.mapping === 'standard'); if (!gp) return;
    const ax = gp.axes[0] ?? 0, ay = gp.axes[1] ?? 0, L = cfg.gamepad_limiar;
    const agora = { cima: gp.buttons[12]?.pressed || ay < -L, baixo: gp.buttons[13]?.pressed || ay > L, esquerda: gp.buttons[14]?.pressed || ax < -L, direita: gp.buttons[15]?.pressed || ax > L,
      confirmar: gp.buttons[0]?.pressed, cancelar: gp.buttons[1]?.pressed, velocidade: gp.buttons[2]?.pressed };
    for (const [k, v] of Object.entries(agora)) if (v && !padAntes[k]) { if (k === 'confirmar' && modo === 'tocando') continue; acao(k); }
    acelerando = acelerando || (agora.confirmar && modo === 'tocando'); if (!agora.confirmar && padAntes.confirmar) acelerando = false;
    padAntes = agora;
  }

  // ---------- ciclo ----------
  function ligar(c) {
    ctrl = c; snap = c.consultar(); exib.clear(); fim = null; rodada = snap.rodada; ordemExec = null; atual = null; feitos.clear(); falhos.clear();
    for (const a of snap.atores) exib.set(a.uid, { ...a });
    montarAtores(); modo = 'tocando'; menuEl.hidden = true; subEl.hidden = true; resultadoEl.hidden = true; raiz.hidden = false;
    rep.adicionar(c.esvaziarFila()); desenharOrdem();
  }

  /** Chamar a cada quadro (dt em segundos reais). */
  function atualizar(dt) {
    raiz.hidden = !(ctrl && mundo.jogo?.modo === 'batalha');
    if (raiz.hidden) return;
    lerGamepad();
    if (modo !== 'tocando') return;
    rep.avancar(dt * (acelerando ? cfg.acelerar_mult : 1));
    if (rep.ocupado) return;
    if (ctrl.fim) { abrirResultado(); return; }
    const s = ctrl.consultar();
    if (s.vez) abrirMenu();
    else if (ctrl.pronto) { ctrl.executar(); rep.adicionar(ctrl.esvaziarFila()); }
  }

  return {
    ligar, atualizar, encerrar,
    /** Controlador ligado agora (ou null): a plataforma liga a UI a toda batalha, não só à de depuração. */
    get controlador() { return ctrl; },
    get modo() { return modo; }, get ocupado() { return rep.ocupado; },
    /** A cena recebe cada evento no instante em que a UI o toca. Devolve a função que cancela. */
    aoEvento(fn) { observadores.push(fn); return () => observadores.splice(observadores.indexOf(fn), 1); },
    /** A cena segura o próximo passo enquanto fn() for true (ex.: animação além de duracao_real_s). */
    definirEspera(fn) { esperaCena = fn; },
    /** A cena informa onde cada ator está na tela: fn([x, z]) → { x: %, y: % } do palco; com isso as figuras provisórias somem. */
    definirProjecao(fn) { projetar = fn; figuras = false; if (ctrl) montarAtores(); },
    acao,
  };
}
