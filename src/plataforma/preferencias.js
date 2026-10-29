// Preferências do jogador (localStorage, com versão e validação; qualquer falha de armazenamento — modo privado, cota, bloqueio — cai no padrão).
// API para a UI: obter(chave) · definir(chave, valor) → bool · todas() · aoMudar(fn) → cancelar() · PADRAO.
const CHAVE = 'dunwick.preferencias', VERSAO = 1;
export const PADRAO = Object.freeze({ volume: 0.8, velocidade_batalha: 1, reduzir_movimento: false, tela_cheia_pedida: false, dica_vista: false });
const VALIDAR = {
  volume: (v) => typeof v === 'number' && v >= 0 && v <= 1,
  velocidade_batalha: (v) => v === 1 || v === 2,
  reduzir_movimento: (v) => typeof v === 'boolean', tela_cheia_pedida: (v) => typeof v === 'boolean', dica_vista: (v) => typeof v === 'boolean',
};

export function criarPreferencias(armazenamento = (() => { try { return window.localStorage; } catch { return null; } })()) {
  let valores = { ...PADRAO }; const ouvintes = new Set();
  try {
    const bruto = armazenamento?.getItem(CHAVE), lido = bruto ? JSON.parse(bruto) : null;
    if (lido && lido.versao === VERSAO && lido.valores && typeof lido.valores === 'object') for (const k of Object.keys(PADRAO)) if (VALIDAR[k](lido.valores[k])) valores[k] = lido.valores[k];
  } catch { /* ilegível: padrão */ }
  const gravar = () => { try { armazenamento?.setItem(CHAVE, JSON.stringify({ versao: VERSAO, valores })); } catch { /* sem armazenamento: vale só nesta sessão */ } };
  return {
    obter(chave) { if (!(chave in PADRAO)) throw new Error(`preferência "${chave}" não existe`); return valores[chave]; },
    /** Valida, guarda e avisa os ouvintes; devolve false (sem mudar nada) se o valor é inválido. */
    definir(chave, valor) {
      if (!(chave in PADRAO) || !VALIDAR[chave](valor)) return false;
      if (valores[chave] === valor) return true; valores[chave] = valor; gravar(); for (const f of [...ouvintes]) f(chave, valor); return true;
    },
    todas: () => ({ ...valores }),
    aoMudar(fn) { ouvintes.add(fn); return () => ouvintes.delete(fn); },
  };
}
