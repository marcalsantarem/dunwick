// Barramento de eventos entre simulação e apresentação (dano, aviso_inicio, golpe_ativo, ...). A simulação só emite;
// quem desenha/toca som assina. Sem estado global: cada mundo cria o seu.
export function criarEventos() {
  const ouvintes = new Map();
  return {
    em(nome, fn) { (ouvintes.get(nome) ?? ouvintes.set(nome, []).get(nome)).push(fn); return () => this.fora(nome, fn); },
    fora(nome, fn) { const l = ouvintes.get(nome); if (l) { const i = l.indexOf(fn); if (i >= 0) l.splice(i, 1); } },
    emitir(nome, dados) { const l = ouvintes.get(nome); if (l) for (const fn of l.slice()) fn(dados); },
  };
}
