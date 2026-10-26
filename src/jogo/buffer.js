// Buffer de entrada (gameplay.md §3.4): uma ação apertada até `quadros` passos antes de o estado permitir ainda executa.
// Apertada há N passos executa se N <= quadros (7); N >= 8 expirou. Vale a mais recente; empate no mesmo passo segue PRIORIDADE.
export const PRIORIDADE = ['esquivar', 'habilidade_3', 'habilidade_2', 'habilidade_1', 'forte', 'atacar']; // maior primeiro

export class BufferEntrada {
  constructor(quadros) { this.quadros = quadros; this.itens = []; }

  empurrar(acao, tick) { this.itens.push({ acao, tick }); }

  /** Remove o que já expirou (idade > quadros). */
  expirar(tick) { this.itens = this.itens.filter((i) => tick - i.tick <= this.quadros); }

  /**
   * Consome a ação mais recente entre as `permitidas` (Set ou array de nomes) ou devolve null. A consumida sai do buffer;
   * as demais ficam até expirar (quem chama decide se esvazia com esvaziar()).
   */
  consumir(tick, permitidas) {
    this.expirar(tick);
    const ok = permitidas instanceof Set ? permitidas : new Set(permitidas);
    let melhor = -1;
    this.itens.forEach((it, k) => {
      if (!ok.has(it.acao)) return;
      if (melhor < 0) { melhor = k; return; }
      const a = this.itens[melhor];
      if (it.tick > a.tick || (it.tick === a.tick && PRIORIDADE.indexOf(it.acao) < PRIORIDADE.indexOf(a.acao))) melhor = k;
    });
    if (melhor < 0) return null;
    return this.itens.splice(melhor, 1)[0].acao;
  }

  esvaziar() { this.itens.length = 0; }

  /** Para o debug (F4): "acao(idade)" de cada item vivo. */
  conteudo(tick) { return this.itens.filter((i) => tick - i.tick <= this.quadros).map((i) => `${i.acao}(${tick - i.tick})`); }
}
