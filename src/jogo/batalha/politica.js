// Política automática do grupo (modo_automatico): usada pelos testes, pela simulação do 06 e pela ferramenta de linha de comando.
// Edric (e quem tiver habilidade de dano em 1 alvo): usa-a no inimigo de MAIS vida quando há mana; senão ataca o mais ferido.
// Quem tiver habilidade de cura: cura o aliado abaixo de `limiar_cura` da vida (se há mana); senão ataca o mais ferido.
import { criarBatalha } from './batalha.js';
import { fracaoVida } from './formulas.js';

export const limiarCura = 0.5;

export function decidirSimples(b, dados, uid) {
  const a = b.ator(uid), C = dados.combate, inimigos = b.vivos('inimigos'), aliados = b.vivos('grupo');
  const maisFerido = () => inimigos.slice().sort((x, y) => (fracaoVida(x) - fracaoVida(y)) || (x.vida - y.vida) || (x.pos - y.pos))[0];
  const maisVida = () => inimigos.slice().sort((x, y) => (y.vida - x.vida) || (x.pos - y.pos))[0];
  const op = b.comandosDe(uid);
  const cura = op.habilidade.find((h) => h.habilitada && C.acoes[h.id].efeito === 'cura');
  if (cura) { const f = aliados.slice().sort((x, y) => fracaoVida(x) - fracaoVida(y))[0]; if (fracaoVida(f) < limiarCura) return { comando: 'habilidade', id: cura.id, alvo: f.uid }; }
  const forte = op.habilidade.find((h) => h.habilitada && C.acoes[h.id].efeito === 'dano' && C.acoes[h.id].alvo_tipo === 'inimigo_1');
  if (forte && inimigos.length) return { comando: 'habilidade', id: forte.id, alvo: maisVida().uid };
  return { comando: 'atacar', id: op.atacar.id, alvo: maisFerido().uid };
}

/** Joga a batalha inteira com a política dada. Devolve o controlador (resultado em `.resultado`). */
export function jogarAutomatico(dados, opcoes, decidir = decidirSimples) {
  const b = criarBatalha(dados, opcoes);
  b.iniciar();
  let guarda = 0;
  while (!b.resultado) {
    for (let u = b.atorDaVez(); u; u = b.atorDaVez()) b.escolher(u, decidir(b, dados, u));
    b.executar();
    if (++guarda > 1000) throw new Error('batalha automática não terminou');
  }
  return b;
}

/** Lote: `n` batalhas com sementes consecutivas. Devolve taxa de vitória, rodadas médias, vida do grupo no fim e duração de animação média. */
export function simularLote(dados, encontro, n, semente0 = 1, decidir = decidirSimples) {
  let vit = 0, rod = 0, vidaF = 0, tempo = 0, rodVit = 0;
  for (let i = 0; i < n; i++) {
    const r = jogarAutomatico(dados, { encontro, semente: semente0 + i }, decidir).resultado;
    rod += r.rodadas; tempo += r.tempo_animacao_s;
    vidaF += r.grupo.reduce((s, g) => s + g.vida, 0) / r.grupo.reduce((s, g) => s + g.vida_max, 0);
    if (r.resultado === 'vitoria') { vit++; rodVit += r.rodadas; }
  }
  return { encontro, n, vitoria: vit / n, rodadas_media: rod / n, rodadas_media_vitoria: vit ? rodVit / vit : 0, vida_grupo_fim: vidaF / n, tempo_animacao_s: tempo / n };
}
