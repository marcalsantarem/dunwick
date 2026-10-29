// UI da batalha por turnos (BL-008 etapa 2; spec docs/ui/batalha.md). Camada DOM sobre o canvas; lê o controlador do 03
// (consultar / esvaziarFila / enviarComando / voltar / executar) e NUNCA decide regra. Texto só por ID (data/texts) e
// sempre por textContent (nunca innerHTML). Só aparece com mundo.jogo.modo === 'batalha'.
// Ritmo: a UI é quem consome a fila; cada evento é repassado à cena (aoEvento) no seu instante, e a cena pode segurar o
// próximo passo com definirEspera(() => ocupada). executar() só roda com a fila tocada e sem espera.
import { criarReprodutor, alvosValidos, alvoInicial, posicionarRotulos } from './batalha_fila.js';
import { criarTelas } from './telas.js';

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

export function criarBatalhaUi({ mundo, dados, t, debug = false, plataforma = {} }) {
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
  const voltarEl = el('button', 'bat-painel bat-voltar', base); voltarEl.type = 'button'; voltarEl.tabIndex = -1; voltarEl.hidden = true;
  el('span', 'bat-icone', voltarEl, '◀'); el('span', '', voltarEl, t('ui_voltar'));
  const grupoEl = el('div', 'bat-grupo', base);
  const resultadoEl = el('div', 'bat-painel bat-resultado', raiz); resultadoEl.hidden = true;
  // rótulos, setas, anéis, áreas de clique e números ficam sobre a CENA: dentro de #ui (o 08 o mantém do tamanho do jogo na tela),
  // com a projeção da cena em %. Sem #ui (teste sem cena), no palco.
  const camada = el('div', 'bat-camada'); (document.getElementById('ui') ?? palco).appendChild(camada); camada.hidden = true;
  // os painéis também vão para #ui (depois da camada, ficando por cima): assim tudo cabe no retângulo do jogo e escala com --k (celular)
  document.getElementById('ui')?.appendChild(raiz);
  // início, pausa, tela cheia e dica (telas.js): por cima da batalha, e com o teclado registrado antes do dela
  const telas = criarTelas({
    mundo, t, cfg, dados, plataforma, podeCancelarBatalha: () => modo === 'sub' || modo === 'alvo' || (modo === 'menu' && Object.keys(snap?.escolhas ?? {}).length > 0),
    aoMudar: (p) => { if (ctrl && ctrl.velocidade !== p.velocidade_batalha && ctrl.definirVelocidade(p.velocidade_batalha)) desenharOrdem(); },
  });
  if (new URLSearchParams(location.search).get('reduzir') === '1') { raiz.classList.add('reduzir'); camada.classList.add('reduzir'); }

  // ---------- estado ----------
  let sobMouse = null; // inimigo sob o cursor com o menu aberto
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
    // rastro: a parte perdida fica visível um instante e desce depois (leitura do tamanho do golpe)
    const b = el('div', `bat-barra bat-barra-${tipo}`, pai), rastro = el('div', 'bat-barra-rastro', b), enche = el('div', 'bat-barra-enche', b);
    b.setAttribute('role', 'meter'); return { b, enche, rastro };
  }
  const pintarBarra = ({ b, enche, rastro }, atual_, max) => {
    const w = `${max ? (100 * atual_) / max : 0}%`; enche.style.width = w; if (rastro) rastro.style.width = w;
    b.setAttribute('aria-valuenow', String(atual_)); b.setAttribute('aria-valuemax', String(max));
  };

  // geometria de um ator na camada (px): pés pela projeção da cena; 1 tile medido projetando x+1; cabeça a altura_cabeca_tiles acima
  function geometria(a) {
    const W = camada.clientWidth || 1, H = camada.clientHeight || 1, [x, z] = a.posicao_cena, p = projetar([x, z]), q = projetar([x + 1, z]);
    const pes = { x: (p.x / 100) * W, y: (p.y / 100) * H }, ppu = Math.max(8, (Math.abs(q.x - p.x) / 100) * W);
    return { pes, ppu, cabeca: { x: pes.x, y: pes.y - cfg.altura_cabeca_tiles * ppu } };
  }
  let sujo = true, tamanho = '';
  const pos = (e, x, y) => { e.style.left = `${x}px`; e.style.top = `${y}px`; };
  const escalaArte = () => Number(getComputedStyle(camada.parentElement).getPropertyValue('--k')) || 1;
  const chaveLayout = () => `${camada.clientWidth}x${camada.clientHeight}x${escalaArte()}`;
  function layout() {
    sujo = false; tamanho = chaveLayout();
    const corpos = [], rotulos = [];
    for (const a of exib.values()) {
      const pl = placas.get(a.uid), g = geometria(a), w = Math.max(cfg.largura_corpo_tiles * g.ppu, cfg.clique_min_px_arte * escalaArte(), cfg.toque_min_px_css);
      corpos.push({ uid: a.uid, x: g.pes.x, y0: g.cabeca.y, y1: g.pes.y, w, lado: a.lado === 'inimigos' ? -1 : 1 });
      pos(pl.area, g.pes.x - w / 2, g.cabeca.y); pl.area.style.width = `${w}px`; pl.area.style.height = `${Math.max(g.pes.y - g.cabeca.y, cfg.toque_min_px_css)}px`;
      pos(pl.anel, g.pes.x, g.pes.y); pl.anel.style.width = `${g.ppu * 1.1}px`; pl.anel.style.height = `${g.ppu * 0.55}px`;
      pos(pl.cursor, g.cabeca.x, g.cabeca.y);
      if (!pl.rotulo.hidden) rotulos.push({ uid: a.uid, w: pl.rotulo.offsetWidth, h: pl.rotulo.offsetHeight });
    }
    const u = escalaArte() / 2, lugar = posicionarRotulos(corpos, rotulos, { w: camada.clientWidth, h: camada.clientHeight }, { reserva: 16 * u, folga: 4 * u });
    for (const [uid, p] of Object.entries(lugar)) pos(placas.get(uid).rotulo, p.x, p.y);
  }

  function montarAtores() {
    camada.replaceChildren(); grupoEl.replaceChildren(); placas.clear(); caixas.clear();
    el('div', 'bat-escudo', camada).addEventListener('pointerenter', () => { if (sobMouse) { sobMouse = null; desenharTodos(); } });
    for (const a of exib.values()) {
      const anel = el('span', `bat-anel bat-anel-${a.lado}`, camada); anel.setAttribute('aria-hidden', 'true');
      const area = el('button', `bat-alvo-area bat-alvo-area-${a.lado}`, camada); area.type = 'button'; area.tabIndex = -1; area.setAttribute('aria-label', t(a.nome_txt));
      const figura = el('span', `bat-figura bat-figura-${a.lado}`, area); figura.setAttribute('aria-hidden', 'true');
      const cursor = el('span', 'bat-cursor', camada, '▼'); cursor.setAttribute('aria-hidden', 'true');
      const rotulo = el('div', `bat-rotulo-ator bat-rotulo-${a.lado}`, camada);
      const nome = el('span', 'bat-placa-nome', rotulo, t(a.nome_txt));
      const barra = a.lado === 'inimigos' ? criarBarra(rotulo, 'vida') : null;
      const cheia = el('span', 'bat-rotulo-cheia', rotulo, t('ui_bat_rotulo_vida_cheia')); cheia.hidden = true;
      for (const alvoEl of [area, rotulo]) {
        alvoEl.addEventListener('pointerenter', () => {
          if (modo === 'alvo' && alvo.lista.some((x) => x.uid === a.uid)) { alvo.foco = a.uid; desenharAlvo(); }
          else if (modo === 'menu' && a.lado === 'inimigos' && !a.caido && sobMouse !== a.uid) { sobMouse = a.uid; desenharTodos(); }
        });
        alvoEl.addEventListener('click', () => cliquePlaca(a.uid));
      }
      placas.set(a.uid, { area, anel, cursor, rotulo, nome, barra, figura, cheia });
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
    sujo = true;
  }

  function desenharAtor(uid) {
    const a = exib.get(uid), pl = placas.get(uid), cx = caixas.get(uid);
    if (pl) {
      // rótulo só no alvo em foco e por um instante depois do dano (docs/ui/batalha.md §1); sem cena, as figuras provisórias mostram todos
      const foco = (modo === 'alvo' && alvo?.foco === uid) || (modo === 'menu' && sobMouse === uid && !a.caido), valido = modo === 'alvo' && alvo.lista.some((x) => x.uid === uid);
      const cheia = valido && alvo.cmd.alvo_tipo.startsWith('aliado') && !a.caido && a.vida >= a.vida_max;
      const mostra = !(a.lado === 'inimigos' && a.caido) && (foco || cheia || figuras || performance.now() < (barraAte.get(uid) ?? 0));
      if (pl.cheia.hidden === cheia) { pl.cheia.hidden = !cheia; sujo = true; }
      if (pl.rotulo.hidden === mostra) { pl.rotulo.hidden = !mostra; sujo = true; }
      pl.figura.hidden = !figuras; pl.area.classList.toggle('caido', a.caido); pl.area.hidden = a.lado === 'inimigos' && a.caido;
      pl.area.classList.toggle('valido', valido);
      for (const e of [pl.rotulo, pl.anel, pl.area]) e.classList.toggle('alvo-foco', foco);
      pl.cursor.hidden = !foco; pl.anel.hidden = !foco;
      if (pl.barra) pintarBarra(pl.barra, a.vida, a.vida_max);
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

  // reação curta ao acerto: placa e caixa tremem/acendem uma vez (CSS; sem animação com reduzir movimento)
  function sacudir(uid) {
    const alvos = [placas.get(uid)?.area, placas.get(uid)?.rotulo, caixas.get(uid)?.c].filter(Boolean);
    for (const e of alvos) { e.classList.remove('atingido'); void e.offsetWidth; e.classList.add('atingido'); }
  }

  function numero(uid, texto, tipo, icone = '') {
    const a = exib.get(uid), g = geometria(a), n = el('div', `bat-numero bat-numero-${tipo}`, camada);
    const pilha = camada.querySelectorAll(`.bat-numero[data-uid="${uid}"]`).length; n.dataset.uid = uid;
    pos(n, g.cabeca.x, g.cabeca.y + g.ppu * 0.4 - pilha * 9 * escalaArte()); n.style.animationDuration = `${tempos.t_numero_dano}s`;
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
        // inimigo que não age (boneco de treino) ou ação de espera: a mensagem da própria ação, se houver; senão "{nome} não faz nada."
        // inimigo sem ações (03): tipo 'passar' com msg_txt ("{nome} não faz nada.")
        else if (ev.tipo === 'passar') mensagem(t(ev.msg_txt ?? 'ui_bat_msg_espera', { nome: nome(ev.ator), nome_ator: nome(ev.ator) }));
        else if (ev.tipo === 'espera') mensagem(t(ev.id && dados.textos?.['pt-BR']?.[`txt_${ev.id}_msg`] ? `txt_${ev.id}_msg` : 'ui_bat_msg_espera', { nome_ator: nome(ev.ator) }));
        else mensagem('');
        break;
      case 'dano': {
        const tipo = ev.efetividade === 'fraco' ? 'fraco' : ev.efetividade === 'resistente' ? 'resiste' : 'dano';
        const icone = tipo === 'fraco' ? '▲' : tipo === 'resiste' ? '⛉' : ev.defendendo ? ICONE.defender : '';
        numero(ev.alvo, t('ui_bat_num_dano', { valor: ev.valor }), tipo, icone);
        if (tipo !== 'dano') mensagem(t(tipo === 'fraco' ? 'ui_bat_efetivo_fraco' : 'ui_bat_efetivo_resiste'));
        barraAte.set(ev.alvo, performance.now() + cfg.t_barra_inimigo_visivel * 1000); sacudir(ev.alvo);
        setTimeout(() => { if (exib.has(ev.alvo)) desenharAtor(ev.alvo); }, cfg.t_barra_inimigo_visivel * 1000 + 30);
        break;
      }
      // cura em quem já está com a vida cheia: "Vida cheia" no lugar de "+0" (gastar ou não o item/mana é regra do 03)
      case 'curou': if (ev.valor > 0) numero(ev.alvo, t('ui_bat_num_cura', { valor: ev.valor }), 'cura', '❦'); else numero(ev.alvo, t('ui_bat_vida_cheia'), 'cheia'); break;
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

  // Itens montados UMA vez; hover e foco só trocam classes. (Refazer a lista no hover trocava o elemento sob o cursor entre
  // apertar e soltar o botão do mouse, e o navegador descartava o clique.)
  const itensMenu = COMANDOS.map((nome, i) => {
    const li = el('li', 'bat-item', menuEl); li.setAttribute('role', 'menuitem');
    el('span', 'bat-seta', li, '▶'); el('span', 'bat-icone', li, ICONE[nome]); el('span', 'bat-item-texto', li, t(`ui_bat_cmd_${nome}`));
    const cadeado = el('span', 'bat-icone bat-cadeado', li, ICONE.cadeado); el('span', 'bat-atalho', li, String(i + 1));
    li.addEventListener('pointerenter', () => { if (modo === 'menu' && menuFoco !== i) { menuFoco = i; desenharMenu(); } });
    li.addEventListener('click', () => { if (modo === 'menu' || modo === 'sub' || modo === 'alvo') { if (modo !== 'menu') voltarAoMenu(); menuFoco = i; desenharMenu(); confirmarMenu(); } });
    return { li, cadeado };
  });
  function desenharMenu() {
    COMANDOS.forEach((nome, i) => {
      const { ok } = estadoComando(nome), { li, cadeado } = itensMenu[i];
      li.classList.toggle('foco', i === menuFoco && modo !== 'tocando'); li.classList.toggle('pai', modo === 'sub' || modo === 'alvo'); li.classList.toggle('desabilitado', !ok); li.setAttribute('aria-disabled', String(!ok));
      cadeado.hidden = ok;
    });
    descreverMenu(); desenharVoltar();
  }

  function desenharVoltar() { voltarEl.hidden = !(modo === 'sub' || modo === 'alvo' || (modo === 'menu' && Object.keys(snap?.escolhas ?? {}).length > 0)); }

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
    modo = 'sub'; subTipo = tipo; subFoco = Math.max(0, snap.comandos[tipo].findIndex((x) => x.habilitada ?? x.habilitado)); subEl.hidden = false; montarSub(); desenharSub(); desenharMenu();
    descreverSub();
  }

  let itensSub = [];
  function montarSub() { // uma vez por abertura do submenu (nunca no hover)
    subEl.replaceChildren();
    itensSub = snap.comandos[subTipo].map((x, i) => {
      const li = el('li', 'bat-item', subEl); li.setAttribute('role', 'menuitem');
      el('span', 'bat-seta', li, '▶'); el('span', 'bat-icone', li, ICONE[subTipo]); el('span', 'bat-item-texto', li, t(x.nome_txt));
      el('span', 'bat-item-dado', li, subTipo === 'habilidade' ? t('ui_bat_custo_mana', { custo: x.custo }) : t('ui_bat_qtd', { qtd: x.qtd }));
      if (!(x.habilitada ?? x.habilitado)) el('span', 'bat-icone bat-cadeado', li, ICONE.cadeado);
      li.addEventListener('pointerenter', () => { if (modo === 'sub' && subFoco !== i) { subFoco = i; desenharSub(); descreverSub(); } });
      li.addEventListener('click', () => { if (modo === 'alvo') { modo = 'sub'; alvo = null; desenharTodos(); } if (modo === 'sub') { subFoco = i; desenharSub(); confirmarSub(); } });
      return li;
    });
  }
  function desenharSub() {
    snap.comandos[subTipo].forEach((x, i) => {
      const ok = x.habilitada ?? x.habilitado, li = itensSub[i];
      li.classList.toggle('foco', i === subFoco && (modo === 'sub' || modo === 'alvo')); li.classList.toggle('pai', modo === 'alvo'); li.classList.toggle('desabilitado', !ok); li.setAttribute('aria-disabled', String(!ok));
    });
    desenharVoltar();
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
    // classes de foco: desenharAtor (via desenharTodos)
    if (modo === 'alvo') {
      const a = exib.get(alvo.foco);
      mensagem(t(a.nome_txt), t('ui_bat_vida_alvo', { atual: a.vida, max: a.vida_max })); info.classList.remove('erro');
    }
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
  function fecharMenus() { modo = 'tocando'; alvo = null; subTipo = null; subEl.hidden = true; menuEl.hidden = true; voltarEl.hidden = true; sobMouse = null; info.classList.remove('erro'); mensagem(''); desenharTodos(); desenharOrdem(); }
  function voltarAoMenu() { modo = 'menu'; alvo = null; subTipo = null; subEl.hidden = true; desenharMenu(); desenharTodos(); }

  function cancelar() {
    if (modo === 'alvo') { if (voltaDe === 'sub') { modo = 'sub'; alvo = null; desenharSub(); desenharMenu(); descreverSub(); desenharAlvo(); } else voltarAoMenu(); }
    else if (modo === 'sub') voltarAoMenu();
    else if (modo === 'menu' && ctrl.voltar()) { fecharMenus(); rep.adicionar(ctrl.esvaziarFila()); }
  }

  function piscarErro() { info.classList.remove('pisca'); void info.offsetWidth; info.classList.add('pisca', 'erro'); }

  // ---------- resultado ----------
  function abrirResultado() {
    modo = 'resultado'; menuEl.hidden = true; subEl.hidden = true;
    if (ctrl.consultar().treino) {
      resultadoEl.replaceChildren(); resultadoEl.hidden = false;
      el('h2', 'bat-res-titulo', resultadoEl, t('ui_bat_treino_concluido'));
      el('p', 'bat-res-treino', resultadoEl, t('ui_bat_treino_sem_recompensa'));
      const b = el('button', 'bat-item foco bat-botao', resultadoEl); b.type = 'button'; el('span', 'bat-seta', b, '▶'); el('span', '', b, t('ui_bat_continuar')); b.addEventListener('click', encerrar);
      return;
    }
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
    ctrl = null; modo = 'inativo'; resultadoEl.hidden = true; raiz.hidden = true; camada.replaceChildren(); camada.hidden = true; ordemEl.replaceChildren();
  }

  // ---------- entrada: teclado, mouse, gamepad ----------
  function acao(a) {
    if (!ctrl) return false;
    if (modo === 'resultado') { if (a === 'confirmar') confirmarResultado(); return a === 'confirmar'; }
    if (a === 'velocidade') { const vs = cfgB.velocidades_batalha; ctrl.definirVelocidade(vs[(vs.indexOf(ctrl.velocidade) + 1) % vs.length]); telas.gravar({ velocidade_batalha: ctrl.velocidade }); desenharOrdem(); return true; }
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
  voltarEl.addEventListener('click', () => { if (ctrl) cancelar(); });
  camada.addEventListener('contextmenu', (e) => { e.preventDefault(); if (ctrl) cancelar(); });

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
    ctrl = c; ctrl.definirVelocidade(telas.preferencias().velocidade_batalha); snap = c.consultar(); exib.clear(); fim = null; rodada = snap.rodada; ordemExec = null; atual = null; feitos.clear(); falhos.clear();
    for (const a of snap.atores) exib.set(a.uid, { ...a });
    montarAtores(); modo = 'tocando'; menuEl.hidden = true; subEl.hidden = true; resultadoEl.hidden = true; raiz.hidden = false;
    rep.adicionar(c.esvaziarFila()); desenharOrdem();
  }

  /** Chamar a cada quadro (dt em segundos reais). */
  function atualizar(dt) {
    telas.atualizar(dt);
    raiz.hidden = !(ctrl && mundo.jogo?.modo === 'batalha'); camada.hidden = raiz.hidden;
    if (raiz.hidden) return;
    if (sujo || tamanho !== chaveLayout()) layout();
    if (telas.pausado) return;
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
    /** A cena informa onde ficam os PÉS de cada ator: fn([x, z]) → { x: %, y: % } do retângulo do jogo (#ui); as figuras provisórias somem. */
    definirProjecao(fn) { projetar = fn; figuras = false; if (ctrl) montarAtores(); },
    acao,
  };
}
