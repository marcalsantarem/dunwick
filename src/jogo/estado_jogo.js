// Estado do jogo (ponte mundo ↔ batalha): modo `mapa | batalha | cena | game_over`, grupo persistente, inventário e ponto de retorno.
// O mundo chama iniciarBatalha(encontro_id); quando a batalha acaba chama encerrarBatalha() e volta ao mapa com o resultado aplicado.
// Simulação pura. Eventos do mundo emitidos em `eventos`: modo_mudou, batalha_iniciada, batalha_encerrada, ponto_restaurado.
import { criarControladorBatalha } from './batalha/controlador.js';
import { derivadosHeroi } from './batalha/formulas.js';

export const MODOS = ['mapa', 'batalha', 'cena', 'game_over'];
export const GRUPO_PADRAO = ['hero_edric', 'hero_grace'];

export function criarEstadoJogo(dados, eventos, { sementeBase = 1, grupoIds = GRUPO_PADRAO } = {}) {
  const cfg = dados.config.batalha, C = dados.combate;
  const grupo = {};
  for (const id of grupoIds) { const h = C.herois[id], d = derivadosHeroi(h, cfg.formulas); grupo[id] = { vida: d.vida_max, mana: d.mana_max, nivel: h.nivel, xp: h.xp }; }
  let inventario = { ...cfg.inventario_teste }, moedas = 0, ponto = null, contaSementes = 0, idxDebug = -1;
  const foto = () => structuredClone({ grupo, inventario, moedas });
  const jogo = { modo: 'mapa', batalha: null, ultimoResultado: null, cena: null };

  const mudar = (para, extra = {}) => { const de = jogo.modo; jogo.modo = para; eventos.emitir('modo_mudou', { de, para, ...extra }); };
  const exigir = (modo, acao) => { if (jogo.modo !== modo) throw new Error(`${acao}: o jogo está em "${jogo.modo}", precisa estar em "${modo}"`); };

  Object.assign(jogo, {
    /** Guarda o ponto de retorno da derrota (o 13 chama nos pontos de salvamento; no M1 vale o início). */
    salvarPonto() { ponto = foto(); },
    /** Começa a batalha: troca o modo e devolve o controlador (já iniciado; consuma a fila com esvaziarFila()). */
    iniciarBatalha(encontroId, { semente } = {}) {
      exigir('mapa', 'iniciarBatalha');
      if (!C.encontros[encontroId]) throw new Error(`encontro "${encontroId}" não existe`);
      const s = semente ?? sementeBase + contaSementes++;
      const ctrl = criarControladorBatalha(dados, { encontro: encontroId, semente: s, grupo: grupoIds, estadoGrupo: grupo, inventario });
      jogo.batalha = ctrl; mudar('batalha', { encontro: encontroId, semente: s });
      eventos.emitir('batalha_iniciada', { encontro_id: encontroId, semente: s });
      ctrl.iniciar();
      return ctrl;
    },
    /** Fecha a batalha (só depois do fim): aplica vida/mana/XP/itens/moedas ao grupo e volta ao mapa — ou vai ao game over na derrota. */
    encerrarBatalha() {
      exigir('batalha', 'encerrarBatalha');
      const r = jogo.batalha.encerrar(); if (!r) throw new Error('encerrarBatalha: a batalha ainda não terminou');
      for (const g of r.grupo) grupo[g.id] = { vida: g.vida, mana: g.mana, nivel: g.nivel, xp: g.xp };
      inventario = { ...r.inventario }; moedas += r.moedas;
      jogo.ultimoResultado = r; jogo.batalha = null;
      mudar(r.resultado === 'derrota' ? 'game_over' : 'mapa', { resultado: r.resultado });
      eventos.emitir('batalha_encerrada', { resultado: r.resultado, treino: r.treino, xp: r.xp, moedas: r.moedas, itens: r.itens, niveis: r.niveis, grupo: r.grupo });
      return r;
    },
    /** Game over simples (M1): "tentar de novo" volta ao último ponto salvo, com grupo, inventário e moedas daquele momento. */
    tentarDeNovo() {
      exigir('game_over', 'tentarDeNovo');
      const f = structuredClone(ponto ?? foto()); for (const k of Object.keys(grupo)) delete grupo[k]; Object.assign(grupo, f.grupo); inventario = f.inventario; moedas = f.moedas;
      jogo.ultimoResultado = null; mudar('mapa', { motivo: 'tentar_de_novo' });
      eventos.emitir('ponto_restaurado', { grupo: structuredClone(grupo), inventario: { ...inventario }, moedas });
    },
    /** Cenas (13): enquanto durar, o mapa não simula. */
    entrarCena(id) { exigir('mapa', 'entrarCena'); jogo.cena = id; mudar('cena', { cena: id }); },
    sairCena() { exigir('cena', 'sairCena'); jogo.cena = null; mudar('mapa', { motivo: 'fim_da_cena' }); },
    /** Achado do mapa (baú, coletável): soma `qtd` do item na mochila (infinita) e emite `inventario_mudou`. */
    adicionarItem(id, qtd = 1) {
      if (typeof id !== 'string' || !Number.isInteger(qtd) || qtd < 1) throw new Error(`adicionarItem: item "${id}" × ${qtd} inválido`);
      inventario[id] = (inventario[id] ?? 0) + qtd;
      eventos.emitir('inventario_mudou', { item: id, qtd: inventario[id] });
    },
    /** Depuração: dispara o próximo encontro da lista de cfg_batalha.debug.encontros (ou o `encontroId` dado). Ignora se não está no mapa. */
    depurarEncontro(encontroId) {
      if (jogo.modo !== 'mapa') return null;
      const lista = cfg.debug.encontros; if (encontroId === undefined) { idxDebug = (idxDebug + 1) % lista.length; encontroId = lista[idxDebug]; }
      return jogo.iniciarBatalha(encontroId);
    },
    estado: () => ({ modo: jogo.modo, grupo: structuredClone(grupo), inventario: { ...inventario }, moedas, cena: jogo.cena }),
    get grupo() { return grupo; }, get inventario() { return inventario; }, get moedas() { return moedas; },
  });
  jogo.salvarPonto();
  return jogo;
}
