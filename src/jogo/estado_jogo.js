// Estado do jogo (ponte mundo ↔ batalha): modo `mapa | batalha | cena | game_over`, grupo persistente, inventário e ponto de retorno.
// O mundo chama iniciarBatalha(encontro_id); quando a batalha acaba chama encerrarBatalha() e volta ao mapa com o resultado aplicado.
// Simulação pura. Eventos do mundo emitidos em `eventos`: modo_mudou, batalha_iniciada, batalha_encerrada, ponto_restaurado.
import { criarControladorBatalha } from './batalha/controlador.js';
import { derivadosHeroi, heroiEquipado, curaFinal } from './batalha/formulas.js';

export const MODOS = ['mapa', 'batalha', 'cena', 'game_over'];
export const GRUPO_PADRAO = ['hero_edric', 'hero_grace'];

export function criarEstadoJogo(dados, eventos, { sementeBase = 1, grupoIds = GRUPO_PADRAO } = {}) {
  const cfg = dados.config.batalha, C = dados.combate;
  const grupo = {}, equipamento = {}; // equipamento: { heroi: { arma, armadura } } (ids de item; começa no da ficha)
  for (const id of grupoIds) {
    const h = C.herois[id]; equipamento[id] = { arma: h.equipamento?.arma ?? null, armadura: h.equipamento?.armadura ?? null };
    const d = derivadosHeroi(heroiEquipado(h, equipamento[id], C.itens), cfg.formulas); grupo[id] = { vida: d.vida_max, mana: d.mana_max, nivel: h.nivel, xp: h.xp };
  }
  let inventario = { ...cfg.inventario_teste }, moedas = dados.config.economia?.coroas_iniciais ?? 0, ponto = null, contaSementes = 0, idxDebug = -1;
  const foto = () => structuredClone({ grupo, inventario, moedas, equipamento });
  /** Atributos derivados do herói com o equipamento atual (ou com `sobrepor` = { slot: item } para pré-visualizar). */
  const statsDe = (id, sobrepor = {}) => {
    const h = heroiEquipado(C.herois[id], { ...equipamento[id], ...sobrepor }, C.itens), d = derivadosHeroi(h, cfg.formulas);
    return { ...d, poder_arma: h.arma.poder, armadura: h.armadura };
  };
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
      const ctrl = criarControladorBatalha(dados, { encontro: encontroId, semente: s, grupo: grupoIds, estadoGrupo: grupo, inventario, equipamento: structuredClone(equipamento) });
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
      for (const k of Object.keys(equipamento)) delete equipamento[k]; Object.assign(equipamento, f.equipamento);
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
    /** Loja (13): tira `qtd` do item da mochila; devolve false (sem mudar nada) se não há o bastante. */
    removerItem(id, qtd = 1) {
      if (!Number.isInteger(qtd) || qtd < 1 || (inventario[id] ?? 0) < qtd) return false;
      inventario[id] -= qtd; if (inventario[id] === 0) delete inventario[id];
      eventos.emitir('inventario_mudou', { item: id, qtd: inventario[id] ?? 0 }); return true;
    },
    /** Loja (13): soma `delta` Coroas (negativo = gasto); devolve false (sem mudar nada) se ficaria abaixo de zero. */
    alterarMoedas(delta) {
      if (!Number.isInteger(delta) || moedas + delta < 0) return false;
      moedas += delta; eventos.emitir('moedas_mudou', { moedas, delta }); return true;
    },
    /**
     * Equipa `item` no `heroi` (06 §12.1): vem da mochila, SUBSTITUI o do slot (o antigo volta à mochila) e soma os `bonus_itens`.
     * Só no mapa. Vida e mana atuais ficam como estão, limitadas ao novo máximo. Devolve { ok:true, slot, anterior, stats } ou { ok:false, erro }:
     * fora_do_mapa · heroi_invalido · nao_e_equipamento · nao_serve · nao_tem (códigos do 06 §12.6).
     */
    equipar(heroi, item) {
      if (jogo.modo !== 'mapa') return { ok: false, erro: 'fora_do_mapa' };
      const it = C.itens[item];
      if (!equipamento[heroi]) return { ok: false, erro: 'heroi_invalido' };
      if (!it || it.categoria !== 'equipamento') return { ok: false, erro: 'nao_e_equipamento' };
      if (!it.para.includes(heroi)) return { ok: false, erro: 'nao_serve' };
      if ((inventario[item] ?? 0) < 1) return { ok: false, erro: 'nao_tem' };
      const slot = it.slot, anterior = equipamento[heroi][slot];
      jogo.removerItem(item, 1); equipamento[heroi][slot] = item;
      if (anterior) jogo.adicionarItem(anterior, 1);
      const st = statsDe(heroi); grupo[heroi].vida = Math.min(grupo[heroi].vida, st.vida_max); grupo[heroi].mana = Math.min(grupo[heroi].mana, st.mana_max);
      eventos.emitir('equipamento_mudou', { heroi, slot, de: anterior, para: item, stats: st });
      return { ok: true, slot, anterior, stats: st };
    },
    /**
     * Usa um consumível FORA de batalha (menu, 06 §12.6 e D-040): qualquer item com `efeito: 'cura'` em Edric ou Grace, pela mesma fórmula da batalha
     * (`cura_base`, `escala`, `mult_cura`), limitada ao que falta de vida. Com vida cheia executa mesmo assim: gasta 1 e cura 0 (a UI só avisa "VIDA CHEIA").
     * Devolve { ok:true, efeito:'cura', valor, bruto, vida, mana } (`valor` = vida recuperada de fato) ou { ok:false, erro }:
     * fora_do_mapa · heroi_invalido · sem_item · sem_efeito (equipamento, lembrança, chave) · so_batalha (efeito que só existe em batalha).
     * Emite `inventario_mudou` e `item_usado { heroi, item, efeito, valor, vida, mana }`. Não muda nada em caso de erro.
     */
    usarItem(heroi, item) {
      if (jogo.modo !== 'mapa') return { ok: false, erro: 'fora_do_mapa' };
      if (!grupo[heroi] || grupo[heroi].vida <= 0) return { ok: false, erro: 'heroi_invalido' };
      const it = C.itens[item];
      if (!it || (inventario[item] ?? 0) < 1) return { ok: false, erro: 'sem_item' };
      if (it.efeito !== 'cura') return { ok: false, erro: it.efeito && it.efeito !== 'nenhum' ? 'so_batalha' : 'sem_efeito' };
      const st = statsDe(heroi), h = C.herois[heroi];
      const { cura, curada } = curaFinal({ cura_base: it.cura_base, escala: it.escala, atributo: h.atributos.mente, mult_cura: cfg.dificuldade.mult_cura, falta: st.vida_max - grupo[heroi].vida });
      jogo.removerItem(item, 1); grupo[heroi].vida += curada;
      eventos.emitir('item_usado', { heroi, item, efeito: 'cura', valor: curada, vida: grupo[heroi].vida, mana: grupo[heroi].mana });
      return { ok: true, efeito: 'cura', valor: curada, bruto: cura, vida: grupo[heroi].vida, mana: grupo[heroi].mana };
    },
    /** Equipamento atual ({ arma, armadura }) e atributos derivados do herói; `statsDe(heroi, { arma: 'item_...' })` pré-visualiza sem equipar. */
    equipamentoDe: (heroi) => ({ ...equipamento[heroi] }),
    statsDe,
    /** Id do herói que está com `item` equipado, ou null (item equipado não está na mochila, logo não se vende). */
    equipadoPor: (item) => Object.keys(equipamento).find((h) => Object.values(equipamento[h]).includes(item)) ?? null,
    /** Depuração: dispara o próximo encontro da lista de cfg_batalha.debug.encontros (ou o `encontroId` dado). Ignora se não está no mapa. */
    depurarEncontro(encontroId) {
      if (jogo.modo !== 'mapa') return null;
      const lista = cfg.debug.encontros; if (encontroId === undefined) { idxDebug = (idxDebug + 1) % lista.length; encontroId = lista[idxDebug]; }
      return jogo.iniciarBatalha(encontroId);
    },
    estado: () => ({ modo: jogo.modo, grupo: structuredClone(grupo), inventario: { ...inventario }, moedas, equipamento: structuredClone(equipamento), cena: jogo.cena }),
  });
  // leitura ao vivo (Object.assign copiaria o valor do getter uma vez só: moedas e mochila ficariam congeladas)
  Object.defineProperties(jogo, { grupo: { get: () => grupo, enumerable: true }, inventario: { get: () => inventario, enumerable: true }, moedas: { get: () => moedas, enumerable: true } });
  jogo.salvarPonto();
  return jogo;
}
