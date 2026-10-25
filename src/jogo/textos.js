// Textos por ID (nunca no código). Variáveis inteiras `{nome}`; nunca montar frase por concatenação.
export function criarTextos(tabela) {
  const faltando = new Set();
  function t(id, vars) {
    const bruto = tabela[id];
    if (bruto === undefined) { faltando.add(id); return `⟦${id}⟧`; }
    return vars ? bruto.replace(/\{([a-z_0-9]+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m)) : bruto;
  }
  t.faltando = faltando;
  return t;
}
