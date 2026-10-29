// Encontro aleatório por passos (13, D-031). Simulação pura: conta os tiles andados pelo herói no modo `mapa`; dentro de uma zona de
// encontro (e fora das zonas seguras), depois de `passos_minimos` sem encontro, cada passo sorteia `taxa_por_passo`. Ao disparar,
// emite `encontro_disparado` e chama jogo.iniciarBatalha(enc_id). Ao voltar ao mapa (vitória, fuga ou "tentar de novo") o contador
// zera e os primeiros `passos_carencia_pos_batalha` passos não contam. Um PRNG com semente decide tudo: mesma semente + mesmo caminho
// = mesmos encontros. Dados: data/exploracao/z_enc_<mapa>.json (esquema zonas_encontro).
import { criarPrng } from '../batalha/prng.js';

const dentro = (r, tx, tz) => tx >= r[0] && tx <= r[2] && tz >= r[1] && tz <= r[3];
const SALTO_MAX_TILES = 2; // deslocamento num único passo lógico acima disso é teleporte (carregar save, transição), não passo andado

export function criarGatilhoEncontros(cfg, jogo, eventos, { semente = 1 } = {}) {
  const prng = criarPrng(semente);
  const g = { ligado: cfg.ligado, passos: 0, passosDesde: 0, carencia: 0, acumulado: 0, zona: null, ultimo: null };

  /** Zona de encontro do ponto (x, z) em tiles, ou null (fora de zona ou em zona segura). */
  g.zonaEm = (x, z) => {
    const tx = Math.floor(x), tz = Math.floor(z);
    if (cfg.zonas_seguras.some((s) => dentro(s.ret, tx, tz))) return null;
    return cfg.zonas_encontro.find((s) => dentro(s.ret, tx, tz)) ?? null;
  };

  function sortear(zona) {
    const total = zona.tabela.reduce((s, t) => s + t.peso, 0);
    let r = prng.proximo() * total;
    for (const t of zona.tabela) { r -= t.peso; if (r < 0) return t.encontro; }
    return zona.tabela[zona.tabela.length - 1].encontro;
  }

  function disparar(zona, x, z) {
    const encontro = sortear(zona), sementeBatalha = 1 + prng.inteiro(0x7ffffffe);
    g.ultimo = { encontro_id: encontro, zona: zona.id, x, z, passos: g.passos, passos_desde: g.passosDesde, semente: sementeBatalha };
    eventos.emitir('encontro_disparado', { ...g.ultimo });
    jogo.iniciarBatalha(encontro, { semente: sementeBatalha });
  }

  /** Um passo andado (1 tile × tiles_por_passo). Devolve true se disparou. */
  function passoAndado(x, z) {
    g.passos++;
    if (g.carencia > 0) { g.carencia--; return false; }
    const zona = g.zonaEm(x, z); g.zona = zona?.id ?? null;
    if (!zona) return false;
    g.passosDesde++;
    if (g.passosDesde <= cfg.passos_minimos) return false;
    if (prng.proximo() >= (zona.taxa_por_passo ?? cfg.taxa_por_passo)) return false;
    disparar(zona, x, z);
    return true;
  }

  /** Chamar a cada passo lógico, depois de mover o herói. Só age no modo `mapa`. */
  g.passo = (heroi) => {
    if (!g.ligado || jogo.modo !== 'mapa') return;
    const d = Math.hypot(heroi.x - heroi.ox, heroi.z - heroi.oz);
    if (d > SALTO_MAX_TILES) return;
    g.acumulado += d;
    while (g.acumulado >= cfg.tiles_por_passo) {
      g.acumulado -= cfg.tiles_por_passo;
      if (passoAndado(heroi.x, heroi.z)) { g.acumulado = 0; return; }
    }
  };

  /** Volta ao mapa depois de batalha ou game over: zera o contador e aplica a carência. */
  g.aoVoltar = () => { g.passosDesde = 0; g.acumulado = 0; g.carencia = cfg.passos_carencia_pos_batalha; };
  eventos.em('modo_mudou', ({ de, para }) => { if (para === 'mapa' && (de === 'batalha' || de === 'game_over')) g.aoVoltar(); });

  g.estado = () => ({ ligado: g.ligado, passos: g.passos, passos_desde: g.passosDesde, carencia: g.carencia, zona: g.zona, ultimo: g.ultimo && { ...g.ultimo } });
  return g;
}
