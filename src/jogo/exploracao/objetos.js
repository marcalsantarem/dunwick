// Objetos interativos do mapa (13, v0.1.2b): reagem a `interagiu` (portais.js) conforme o `tipo` do poi. Simulação pura.
// - boneco_treino {encontro}: inicia a batalha de treino (repetível; o boneco fica). O contador de encontros não muda (sem carência,
//   sem passos): o estado do gatilho é guardado antes e devolvido na volta. PV/PM e recompensas do treino são do 03 (`treino: true`).
// - bau_tesouro {item, quantidade?}: abre uma vez, põe o item na mochila e emite `achado` (janela do 15) e `bau_aberto`; aberto de
//   novo emite `bau_vazio`. Os baús abertos (por mapa/id) entram no estado serializável.
import { interativosDe } from './portais.js';

const chave = (mapa, id) => `${mapa}/${id}`;

export function criarObjetos({ mundo, eventos }) {
  const abertos = new Set();
  let treino = null; // estado do gatilho de encontros guardado durante a batalha de treino
  const O = {};

  function boneco(poi) {
    const jogo = mundo.jogo; if (!jogo || jogo.modo !== 'mapa' || !poi.encontro) return;
    treino = mundo.encontros ? mundo.encontros.salvar() : {};
    eventos.emitir('treino_iniciado', { mapa: mundo.mapaId, id: poi.id, encontro_id: poi.encontro });
    jogo.iniciarBatalha(poi.encontro);
  }
  function bau(poi) {
    const k = chave(mundo.mapaId, poi.id);
    if (abertos.has(k)) { eventos.emitir('bau_vazio', { mapa: mundo.mapaId, id: poi.id }); return; }
    const qtd = poi.quantidade ?? 1;
    abertos.add(k);
    if (mundo.jogo && poi.item) mundo.jogo.adicionarItem(poi.item, qtd);
    eventos.emitir('bau_aberto', { mapa: mundo.mapaId, id: poi.id, item: poi.item ?? null, quantidade: qtd });
    if (poi.item) eventos.emitir('achado', { origem: poi.id, item: poi.item, qtd });
  }

  eventos.em('interagiu', ({ id, tipo }) => {
    const poi = interativosDe(mundo.mapa.dados).find((p) => p.id === id); if (!poi) return;
    if (tipo === 'boneco_treino') boneco(poi); else if (tipo === 'bau_tesouro') bau(poi);
  });
  // volta do treino: devolve o contador de encontros como estava (o gatilho já aplicou a carência no mesmo evento, antes deste)
  eventos.em('modo_mudou', ({ de, para }) => {
    if (!treino || de !== 'batalha') return;
    if (mundo.encontros && treino.passos !== undefined) mundo.encontros.carregar(treino);
    if (para === 'mapa' || para === 'game_over') treino = null;
  });

  O.aberto = (mapa, id) => abertos.has(chave(mapa, id));
  O.salvar = () => ({ baus_abertos: [...abertos].sort() });
  O.carregar = (e) => {
    if (!e || !Array.isArray(e.baus_abertos) || !e.baus_abertos.every((k) => typeof k === 'string' && /^map_[a-z0-9_]+\/[a-z0-9_]+$/.test(k))) throw new Error('estado de objetos inválido');
    abertos.clear(); for (const k of e.baus_abertos) abertos.add(k);
  };
  return O;
}
