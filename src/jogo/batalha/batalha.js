// Controlador da batalha por turnos (docs/combate_turnos.md, BL-008 etapa 1). SIMULAÇÃO PURA: não importa three nem DOM.
// Fluxo: iniciar() → [ escolher(...) de cada herói vivo → executar() ] × rodadas → resultado.
// A simulação resolve cada ato por inteiro e emite eventos na ordem; a apresentação toca a fila (a etapa 2 liga o desenho).
import { criarEventos } from '../eventos.js';
import { criarPrng } from './prng.js';
import * as F from './formulas.js';

export const EVENTOS_BATALHA = [
  'batalha_iniciou', 'rodada_iniciou', 'comando_pedido', 'comando_escolhido', 'execucao_iniciou', 'turno_iniciou', 'ato_executado',
  'dano', 'curou', 'mana_gasta', 'item_usado', 'defendeu', 'fuga_tentada', 'ato_falhou', 'ato_cancelado', 'caiu', 'vida_mudou', 'mana_mudou',
  'fase_mudou', 'rodada_terminou', 'venceu', 'perdeu', 'fugiu', 'empate', 'batalha_terminou',
];

const COMANDOS = ['atacar', 'habilidade', 'item', 'defender', 'fugir'];

/**
 * @param dados  pacote de dados (tools/lib/dados.mjs → empacotarDados): config.batalha + combate.{herois,inimigos,encontros,itens,acoes}
 * @param opcoes { encontro, semente, eventos?, grupo?: ids dos heróis, estadoGrupo?: {id:{vida,mana,xp,nivel}}, inventario?: {item: qtd} }
 */
export function criarBatalha(dados, { encontro, semente = 1, eventos = criarEventos(), grupo = ['hero_edric', 'hero_grace'], estadoGrupo = {}, inventario = null }) {
  const cfg = dados.config.batalha, C = dados.combate, enc = C.encontros[encontro];
  if (!enc) throw new Error(`encontro "${encontro}" não existe`);
  const prng = criarPrng(semente), log = [], estoque = { ...(inventario ?? cfg.inventario_teste) };
  // encontro de treino (`treino: true`): sem XP, moedas nem drops; vida, mana e estoque do grupo voltam ao que eram ao fim; repetível
  const treino = !!enc.treino, estoqueInicial = { ...estoque };
  const dif = cfg.dificuldade;

  // ---------- atores ----------
  const atores = [], porUid = new Map();
  grupo.forEach((id) => {
    const h = C.herois[id], d = F.derivadosHeroi(h, cfg.formulas), est = estadoGrupo[id] ?? {};
    atores.push({
      uid: id, id, lado: 'grupo', pos: h.posicao, nome_txt: h.nome_txt, vida_max: d.vida_max, vida: est.vida ?? d.vida_max, mana_max: d.mana_max, mana: est.mana ?? d.mana_max,
      forca: h.atributos.forca, mente: h.atributos.mente, defesa: d.defesa, agilidade: d.agilidade, resist: h.resistencias, imunidades: h.imunidades ?? [],
      poder_arma: h.arma.poder, tipo_arma: h.arma.tipo_dano, kit: h.kit, mente_regen: h.atributos.mente, nivel: est.nivel ?? h.nivel, xp: est.xp ?? h.xp,
      defendendo: false, caido: (est.vida ?? 1) <= 0, estados: [],
    });
  });
  const repetidos = (id) => enc.inimigos.filter((x) => x === id).length > 1, contagem = {};
  enc.inimigos.forEach((id, i) => {
    const e = C.inimigos[id], uid = repetidos(id) ? `${id}_${(contagem[id] = (contagem[id] ?? 0) + 1)}` : id;
    atores.push({
      uid, id, lado: 'inimigos', pos: i + 1, nome_txt: e.nome_txt, vida_max: e.vida_max, vida: e.vida_max, mana_max: 0, mana: 0, forca: e.forca, mente: e.mente ?? 0,
      defesa: e.defesa, agilidade: e.agilidade, resist: e.resistencias, imunidades: e.imunidades ?? [], ia: e.ia, xp_dado: e.xp, moedas: e.moedas, drops: e.drops,
      defendendo: false, caido: false, estados: [],
    });
  });
  atores.forEach((a) => porUid.set(a.uid, a));
  const lado = (l) => atores.filter((a) => a.lado === l).sort((a, b) => a.pos - b.pos);
  const vivos = (l) => lado(l).filter((a) => !a.caido);
  const oposto = (a) => (a.lado === 'grupo' ? 'inimigos' : 'grupo');

  // ---------- estado da batalha ----------
  let rodada = 0, fase = 'inicio', falhasFuga = 0, tempoAnim = 0, resultado = null;
  const escolhas = new Map(), pilha = [];

  const emit = (nome, d = {}) => { const ev = { nome, rodada, ...d }; log.push(ev); eventos.emitir(nome, ev); return ev; };
  const acaoDe = (id) => C.acoes[id], itemDe = (id) => C.itens[id];
  const duracao = (chave) => cfg.tempos[chave];

  // ---------- IA ----------
  function alvoIA(ator, cmd) {
    const alvos = vivos(oposto(ator));
    if (!alvos.length) return null;
    const menorVida = () => alvos.slice().sort((a, b) => (F.fracaoVida(a) - F.fracaoVida(b)) || (a.pos - b.pos))[0];
    const aleatorio = () => alvos[prng.inteiro(alvos.length)];
    if (cmd.regra === 'menor_vida') return menorVida();
    if (cmd.regra === 'misto') return prng.proximo() < cmd.prob ? menorVida() : aleatorio();
    return aleatorio();
  }
  function escolherIA(ator) {
    if (!ator.ia.length) return { comando: 'passar', id: null, alvo: null }; // inimigo sem ações (ex.: boneco de treino): passa a vez
    const ops = ator.ia.filter((o) => !o.condicao || (o.condicao.rodada_min ?? 1) <= rodada);
    const total = ops.reduce((s, o) => s + o.peso, 0);
    let r = prng.proximo() * total, esc = ops[ops.length - 1];
    for (const o of ops) { if (r < o.peso) { esc = o; break; } r -= o.peso; }
    const acao = acaoDe(esc.acao), cmd = { comando: acao.tipo === 'ataque' ? 'atacar' : 'habilidade', id: esc.acao, regra: esc.alvo_regra, prob: esc.prob_menor_vida ?? 0, alvo: null };
    if (acao.alvo_tipo === 'inimigo_1') cmd.alvo = alvoIA(ator, cmd)?.uid ?? null;
    return cmd;
  }

  // ---------- comandos do grupo ----------
  function comandosDe(uid) {
    const a = porUid.get(uid), k = a.kit;
    const temAlvo = (acao) => (acao.alvo_tipo.startsWith('inimigo') ? vivos('inimigos').length : acao.alvo_tipo.startsWith('aliado') ? vivos('grupo').length : 1) > 0;
    const hab = k.habilidades.map((id) => {
      const ac = acaoDe(id), semMana = a.mana < ac.custo.mana, semAlvo = !temAlvo(ac);
      return { id, nome_txt: ac.nome_txt, custo: ac.custo.mana, alvo_tipo: ac.alvo_tipo, habilitada: !semMana && !semAlvo, motivo: semMana ? 'sem_mana' : semAlvo ? 'sem_alvo' : null };
    });
    const itens = k.itens.map((id) => {
      const it = itemDe(id), qtd = estoque[id] ?? 0, ok = it.uso_batalha && qtd > 0;
      return { id, nome_txt: it.nome_txt, qtd, alvo_tipo: it.alvo_tipo, habilitado: ok, motivo: ok ? null : !it.uso_batalha ? 'item_invalido' : 'sem_item' };
    });
    const atq = acaoDe(k.ataque), atqOk = temAlvo(atq);
    return {
      atacar: { id: k.ataque, nome_txt: atq.nome_txt, alvo_tipo: atq.alvo_tipo, habilitado: atqOk, motivo: atqOk ? null : 'sem_alvo' },
      habilidade: hab, item: itens, defender: { habilitado: true, motivo: null }, fugir: { habilitado: enc.pode_fugir, motivo: enc.pode_fugir ? null : 'nao_pode_fugir' },
    };
  }
  function atorDaVez() { return vivos('grupo').find((a) => !escolhas.has(a.uid))?.uid ?? null; }
  function pedir() { const uid = atorDaVez(); if (uid) emit('comando_pedido', { ator: uid, comandos: comandosDe(uid) }); }

  function validar(a, cmd) {
    if (!COMANDOS.includes(cmd.comando)) return 'comando_invalido';
    const op = comandosDe(a.uid);
    if (cmd.comando === 'atacar') return op.atacar.habilitado ? null : 'sem_alvo';
    if (cmd.comando === 'habilidade') { const h = op.habilidade.find((x) => x.id === cmd.id); return !h ? 'habilidade_invalida' : h.habilitada ? null : 'sem_mana'; }
    if (cmd.comando === 'item') { const i = op.item.find((x) => x.id === cmd.id); return !i ? 'item_invalido' : i.habilitado ? null : 'sem_item'; }
    if (cmd.comando === 'fugir') return op.fugir.habilitado ? null : 'nao_pode_fugir';
    return null;
  }

  function iniciarRodada() {
    rodada += 1; escolhas.clear(); pilha.length = 0; fase = 'comandos';
    emit('rodada_iniciou', { n: rodada });
    for (const e of vivos('inimigos')) escolhas.set(e.uid, escolherIA(e));
    pedir();
  }

  /** Motivo pelo qual o comando seria recusado (ou null): fase_invalida, nao_e_a_vez, comando_invalido, habilidade_invalida, item_invalido, sem_mana, sem_item, sem_alvo, nao_pode_fugir, alvo_invalido. Não muda nada. */
  function motivoRecusa(uid, cmd) {
    if (fase !== 'comandos') return 'fase_invalida';
    if (atorDaVez() !== uid) return 'nao_e_a_vez';
    const a = porUid.get(uid), erro = validar(a, cmd);
    if (erro) return erro;
    if (cmd.alvo) {
      const al = porUid.get(cmd.alvo), tipo = cmd.comando === 'item' ? itemDe(cmd.id).alvo_tipo : cmd.comando === 'defender' || cmd.comando === 'fugir' ? null : acaoDe(cmd.comando === 'atacar' ? a.kit.ataque : cmd.id).alvo_tipo;
      if ((tipo === 'inimigo_1' || tipo === 'aliado_1') && (!al || al.caido || al.lado !== (tipo === 'inimigo_1' ? 'inimigos' : 'grupo'))) return 'alvo_invalido';
    }
    return null;
  }
  function escolher(uid, cmd) {
    const m = motivoRecusa(uid, cmd);
    if (m === 'fase_invalida') throw new Error(`não dá para escolher na fase "${fase}"`);
    if (m === 'nao_e_a_vez') throw new Error(`não é a vez de "${uid}" (vez de "${atorDaVez()}")`);
    if (m) throw new Error(`comando recusado para "${uid}": ${m}`);
    escolhas.set(uid, { ...cmd, alvo: cmd.alvo ?? null }); pilha.push(uid);
    emit('comando_escolhido', { ator: uid, comando: cmd.comando, id: cmd.id ?? null, alvo: cmd.alvo ?? null });
    if (atorDaVez()) { pedir(); return { pronto: false }; }
    fase = 'pronto'; return { pronto: true };
  }
  function voltar() {
    if (!pilha.length || (fase !== 'comandos' && fase !== 'pronto')) return false;
    escolhas.delete(pilha.pop()); fase = 'comandos'; pedir(); return true;
  }

  /** Ordem prevista da execução, para a UI (barra de ordem). Usa só o que o jogador já escolheu; os inimigos entram com prioridade 0 (não vaza a IA). */
  function ordemPrevista() {
    const itens = vivos('grupo').concat(vivos('inimigos')).map((a) => {
      const cmd = a.lado === 'grupo' ? escolhas.get(a.uid) : null, ac = cmd && (cmd.comando === 'atacar' || cmd.comando === 'habilidade') ? acaoDe(cmd.id) : null;
      return { uid: a.uid, prioridade: cmd ? cfg.prioridade_comando[cmd.comando] + (ac?.prioridade ?? 0) : 0, iniciativa: a.agilidade, lado: a.lado, pos: a.pos };
    });
    return F.ordenar(itens).map((i) => i.uid);
  }

  // ---------- ordem ----------
  function ordemDaRodada() {
    const itens = [];
    for (const [uid, cmd] of escolhas) {
      const a = porUid.get(uid); if (a.caido) continue;
      const acao = cmd.comando === 'atacar' || cmd.comando === 'habilidade' ? acaoDe(cmd.id) : null;
      const prioridade = (cfg.prioridade_comando[cmd.comando] ?? 0) + (acao?.prioridade ?? 0);
      const variacao = cfg.iniciativa_variacao > 0 ? 1 + (prng.proximo() * 2 - 1) * cfg.iniciativa_variacao : 1;
      itens.push({ uid, prioridade, iniciativa: a.agilidade * variacao, lado: a.lado, pos: a.pos });
    }
    return F.ordenar(itens).map((i) => i.uid);
  }

  // ---------- alvos ----------
  function resolverAlvos(ator, alvoTipo, cmd) {
    if (alvoTipo === 'si') return [ator];
    const proprios = vivos(ator.lado), adversarios = vivos(oposto(ator));
    if (alvoTipo === 'inimigos_todos') return adversarios;
    if (alvoTipo === 'aliados_todos') return proprios;
    if (alvoTipo === 'inimigo_1') {
      const pedido = cmd.alvo ? porUid.get(cmd.alvo) : null;
      if (pedido && !pedido.caido && pedido.lado === oposto(ator)) return [pedido];
      if (ator.lado === 'inimigos') { const n = alvoIA(ator, cmd); return n ? [n] : []; }
      return adversarios.slice(0, 1);
    }
    // aliado_1: o pedido, se vivo; senão o aliado vivo com menor fração de vida
    const pedido = cmd.alvo ? porUid.get(cmd.alvo) : null;
    if (pedido && !pedido.caido && pedido.lado === ator.lado) return [pedido];
    return proprios.slice().sort((a, b) => (F.fracaoVida(a) - F.fracaoVida(b)) || (a.pos - b.pos)).slice(0, 1);
  }

  // ---------- efeitos ----------
  function mudarVida(alvo, delta) {
    const antes = alvo.vida; alvo.vida = F.limitar(alvo.vida + delta, 0, alvo.vida_max);
    emit('vida_mudou', { ator: alvo.uid, vida: alvo.vida, vida_max: alvo.vida_max, delta: alvo.vida - antes });
    if (alvo.vida === 0 && !alvo.caido) { alvo.caido = true; emit('caiu', { alvo: alvo.uid }); }
  }
  function aplicarDano(ator, acao, alvo) {
    const tipo = acao.tipo_dano, res = alvo.resist[tipo] ?? 0, imune = alvo.imunidades.includes(tipo);
    const poder = acao.dano_base ?? ator.poder_arma * acao.mult_dano;
    const valor = F.danoFinal({
      poder, escala: acao.escala, atributo: ator[acao.atributo], defesa: alvo.defesa, defendendo: alvo.defendendo, defender_mult: cfg.defender_mult_dano,
      mult_dificuldade: ator.lado === 'grupo' ? dif.mult_dano_causado : dif.mult_dano_recebido, resistencia: res, imune,
    }, cfg.formulas);
    const efetividade = imune ? 'imune' : res > 0 ? 'resistente' : res < 0 ? 'fraco' : 'normal';
    emit('dano', { ator: ator.uid, alvo: alvo.uid, valor, aplicado: Math.min(valor, alvo.vida), tipo_dano: tipo, efetividade, defendendo: alvo.defendendo, acao: acao.id });
    mudarVida(alvo, -valor);
  }
  function aplicarCura(ator, origem, alvo) {
    const { cura, curada } = F.curaFinal({ cura_base: origem.cura_base, escala: origem.escala, atributo: origem.atributo ? ator[origem.atributo] : 0, mult_cura: dif.mult_cura, falta: alvo.vida_max - alvo.vida });
    emit('curou', { ator: ator.uid, alvo: alvo.uid, valor: curada, bruto: cura });
    mudarVida(alvo, curada);
  }
  function pagarMana(ator, custo) {
    if (!custo) return;
    ator.mana -= custo; emit('mana_gasta', { ator: ator.uid, valor: custo }); emit('mana_mudou', { ator: ator.uid, mana: ator.mana, mana_max: ator.mana_max, delta: -custo });
  }
  const falhou = (ator, motivo, extra = {}) => emit('ato_falhou', { ator: ator.uid, motivo, ...extra });
  const registrar = (ator, tipo, id, alvos, chaveTempo, extra = {}) => { const d = duracao(chaveTempo); tempoAnim += d + duracao('t_intervalo_ato'); emit('ato_executado', { ator: ator.uid, tipo, id, alvos: alvos.map((a) => a.uid), duracao_s: d, pose: (id && (acaoDe(id) ?? itemDe(id))?.pose) || ({ defender: 'bat_defender', fugir: 'bat_avanca' }[tipo] ?? null), ...extra }); };

  function executarAto(uid) {
    const ator = porUid.get(uid), cmd = escolhas.get(uid);
    if (ator.caido) { emit('ato_cancelado', { ator: uid, motivo: 'caido' }); return; }
    emit('turno_iniciou', { ator: uid });
    if (cmd.comando === 'passar') { registrar(ator, 'passar', null, [], 't_intervalo_ato', { motivo: 'sem_acoes', nome_txt: ator.nome_txt, msg_txt: cfg.msg_nao_faz_nada_txt }); return; }
    if (cmd.comando === 'defender') { ator.defendendo = true; registrar(ator, 'defender', null, [ator], 't_defender'); emit('defendeu', { ator: uid }); return; }
    if (cmd.comando === 'fugir') { tentarFuga(ator); return; }
    if (cmd.comando === 'item') {
      const it = itemDe(cmd.id);
      if ((estoque[cmd.id] ?? 0) <= 0) { falhou(ator, 'sem_item', { id: cmd.id }); return; }
      const alvos = resolverAlvos(ator, it.alvo_tipo, cmd);
      if (!alvos.length) { falhou(ator, 'sem_alvo', { id: cmd.id }); return; }
      estoque[cmd.id] -= 1; emit('item_usado', { ator: uid, item: cmd.id, alvo: alvos[0].uid, restante: estoque[cmd.id] });
      registrar(ator, 'item', cmd.id, alvos, it.tempo);
      for (const al of alvos) aplicarCura(ator, { cura_base: it.cura_base, escala: it.escala }, al);
      return;
    }
    const acao = acaoDe(cmd.id);
    if (ator.mana < acao.custo.mana) { falhou(ator, 'sem_mana', { id: cmd.id }); return; }
    const alvos = resolverAlvos(ator, acao.alvo_tipo, cmd);
    if (!alvos.length) { falhou(ator, 'sem_alvo', { id: cmd.id }); return; }
    pagarMana(ator, acao.custo.mana);
    registrar(ator, cmd.comando, cmd.id, alvos, acao.tempo);
    if (acao.efeito === 'dano') for (const al of alvos) aplicarDano(ator, acao, al);
    else if (acao.efeito === 'cura') for (const al of alvos) aplicarCura(ator, acao, al);
  }

  function tentarFuga(ator) {
    if (!enc.pode_fugir) { falhou(ator, 'nao_pode_fugir'); return; }
    const media = (l) => vivos(l).reduce((s, a) => s + a.agilidade, 0) / Math.max(1, vivos(l).length);
    const chance = F.chanceFuga(cfg.fuga, media('grupo'), media('inimigos'), falhasFuga), sucesso = prng.proximo() < chance;
    registrar(ator, 'fugir', null, [ator], 't_fuga');
    emit('fuga_tentada', { ator: ator.uid, sucesso, chance });
    if (sucesso) terminar('fugiu'); else falhasFuga += 1;
  }

  // ---------- fim da rodada e da batalha ----------
  function fimDeRodada() {
    for (const a of atores) a.defendendo = false;
    for (const a of vivos('grupo')) {
      const ganho = F.regenMana(cfg.regen_mana, a.mente_regen), novo = Math.min(a.mana_max, a.mana + ganho);
      if (novo !== a.mana) { const d = novo - a.mana; a.mana = novo; emit('mana_mudou', { ator: a.uid, mana: a.mana, mana_max: a.mana_max, delta: d }); }
    }
    emit('rodada_terminou', { n: rodada });
  }
  function checarFim() {
    if (!vivos('inimigos').length) terminar('vitoria');
    else if (!vivos('grupo').length) terminar('derrota');
  }
  function restaurarTreino() {
    for (const a of lado('grupo')) {
      if (a.vida !== a.vida_max) { const d = a.vida_max - a.vida; a.vida = a.vida_max; emit('vida_mudou', { ator: a.uid, vida: a.vida, vida_max: a.vida_max, delta: d }); }
      if (a.mana !== a.mana_max) { const d = a.mana_max - a.mana; a.mana = a.mana_max; emit('mana_mudou', { ator: a.uid, mana: a.mana, mana_max: a.mana_max, delta: d }); }
      a.caido = false;
    }
    for (const k of Object.keys(estoque)) delete estoque[k];
    Object.assign(estoque, estoqueInicial);
  }
  function terminar(res) {
    if (resultado) return;
    if (treino && res === 'derrota') res = 'fugiu'; // o grupo não perde para o treino: nunca vai a game over
    let xp = 0, moedas = 0; const itens = {}, niveis = [];
    if (res === 'vitoria' && !treino) {
      for (const e of lado('inimigos')) {
        xp += e.xp_dado; moedas += e.moedas;
        for (const d of e.drops) if (prng.proximo() < d.chance) itens[d.item] = (itens[d.item] ?? 0) + d.qtd;
      }
      for (const a of lado('grupo')) {
        if (a.caido) { a.caido = false; a.vida = cfg.caido_pos_batalha_vida; emit('vida_mudou', { ator: a.uid, vida: a.vida, vida_max: a.vida_max, delta: a.vida }); continue; }
        a.xp += Math.round(xp);
        let n = F.xpParaNivel(a.nivel, cfg.xp);
        while (a.xp >= n) { a.xp -= n; niveis.push({ ator: a.uid, de: a.nivel, para: a.nivel + 1 }); a.nivel += 1; n = F.xpParaNivel(a.nivel, cfg.xp); }
      }
      for (const [k, q] of Object.entries(itens)) estoque[k] = (estoque[k] ?? 0) + q;
      tempoAnim += duracao('t_vitoria');
      emit('venceu', { xp, moedas, itens, niveis });
    } else if (res === 'vitoria') { tempoAnim += duracao('t_vitoria'); emit('venceu', { xp: 0, moedas: 0, itens: {}, niveis: [], treino: true });
    } else if (res === 'derrota') emit('perdeu');
    else if (res === 'fugiu') emit('fugiu');
    else emit('empate');
    if (treino) restaurarTreino();
    fase = 'fim';
    resultado = {
      resultado: res, treino, semente, rodadas: rodada, xp: res === 'vitoria' ? xp : 0, moedas: res === 'vitoria' ? moedas : 0, itens, niveis,
      tempo_animacao_s: tempoAnim + duracao('t_entrada_batalha'),
      grupo: lado('grupo').map((a) => ({ id: a.uid, vida: a.vida, vida_max: a.vida_max, mana: a.mana, mana_max: a.mana_max, caido: a.caido, nivel: a.nivel, xp: a.xp })),
      inventario: { ...estoque },
    };
    emit('batalha_terminou', { ...resultado });
  }

  function executar() {
    if (fase !== 'pronto') throw new Error(`não dá para executar na fase "${fase}"`);
    fase = 'execucao';
    const ordem = ordemDaRodada(); emit('execucao_iniciou', { ordem });
    for (const uid of ordem) { executarAto(uid); if (!resultado) checarFim(); if (resultado) return resultado; }
    fimDeRodada();
    if (rodada >= cfg.rodadas_max) { terminar('empate'); return resultado; }
    iniciarRodada();
    return null;
  }

  /** Encerra a batalha agora como `fugiu` (depuração e saída de emergência). */
  function abandonar() { if (!resultado) terminar('fugiu'); return resultado; }

  function iniciar() {
    if (fase !== 'inicio') throw new Error('a batalha já começou');
    emit('batalha_iniciou', { encontro_id: encontro, grupo: lado('grupo').map((a) => a.uid), inimigos: lado('inimigos').map((a) => a.uid), semente });
    iniciarRodada();
  }

  const copia = (a) => ({ uid: a.uid, id: a.id, lado: a.lado, pos: a.pos, vida: a.vida, vida_max: a.vida_max, mana: a.mana, mana_max: a.mana_max, agilidade: a.agilidade, defesa: a.defesa, caido: a.caido, defendendo: a.defendendo, nivel: a.nivel, xp: a.xp });
  return {
    eventos, log, iniciar, escolher, voltar, executar, comandosDe, atorDaVez, validarComando: motivoRecusa, ordemPrevista, abandonar,
    get rodada() { return rodada; }, get fase() { return fase; }, get pronto() { return fase === 'pronto'; }, get resultado() { return resultado; },
    ator: (uid) => porUid.get(uid), vivos, inventario: () => ({ ...estoque }),
    estado: () => ({ rodada, fase, atores: atores.map(copia), escolhas: Object.fromEntries(escolhas), inventario: { ...estoque } }),
  };
}
