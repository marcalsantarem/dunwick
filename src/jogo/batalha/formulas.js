// Fórmulas do combate por turnos (docs/sistemas/formulas_turnos.md, 06). Funções puras: nenhum número mora aqui,
// tudo vem de `data/combate/cfg_batalha.json` (parâmetro `f`, `fuga`, `regen`, `xp`) e das fichas.

/** Arredondamento único (meio para cima), tolerante a erro de ponto flutuante. */
export const arred = (x) => Math.floor(x + 0.5 + 1e-9);
export const limitar = (v, min, max) => Math.min(max, Math.max(min, v));

/** vida_max, mana_max, defesa e agilidade de um herói a partir dos atributos (06 §2). */
export function derivadosHeroi(h, f) {
  const a = h.atributos, b = h.bonus_itens;
  return {
    vida_max: f.vida_base + f.vida_por_vigor * a.vigor + b.vida,
    mana_max: f.mana_base + f.mana_por_mente * a.mente + b.mana,
    defesa: a.vigor + h.armadura,
    agilidade: a.destreza + b.agilidade,
  };
}

/**
 * Dano de um golpe (06 §3; pipeline passo 4).
 * `poder` = poder_arma × mult_dano (herói) ou dano_base (inimigo). Arredonda uma vez, no fim; piso `f.dano_minimo`; imune → 0.
 */
export function danoFinal({ poder, escala, atributo, defesa, defendendo = false, defender_mult = 1, mult_dificuldade = 1, mult_situacional = 1, resistencia = 0, imune = false }, f) {
  if (imune) return 0;
  const r = limitar(resistencia, f.resistencia_min, f.resistencia_max);
  const x = poder * (1 + (escala * atributo) / 100) * (f.defesa_constante / (f.defesa_constante + defesa)) * (defendendo ? defender_mult : 1) * mult_situacional * mult_dificuldade * (1 - r);
  return Math.max(f.dano_minimo, arred(x));
}

/** Cura (06 §3): `mult_estado` 0,7 se envenenado (fora do M1). `curada` é o que cabe na vida que falta. */
export function curaFinal({ cura_base, escala, atributo, mult_cura = 1, mult_estado = 1, falta }) {
  const cura = Math.max(1, arred(cura_base * (1 + (escala * atributo) / 100) * mult_cura * mult_estado));
  return { cura, curada: Math.min(cura, Math.max(0, falta)) };
}

/** Chance de fuga (06 §5), limitada a [min, max]. */
export function chanceFuga(fuga, agGrupo, agInimigos, falhas = 0) {
  return limitar(fuga.base + (agGrupo - agInimigos) * fuga.por_ponto + falhas * fuga.bonus_falha, fuga.min, fuga.max);
}

/** Mana recuperada por rodada no FIM_DE_RODADA (06 §2). */
export const regenMana = (regen, mente) => regen.base + Math.floor(mente / regen.divisor_mente);

/** XP para ir do nível n ao n+1 (06 §10). */
export const xpParaNivel = (n, xp) => arred(xp.base * Math.pow(n, xp.expoente));

/**
 * Ordem de ação (combate_turnos §3). Cada item: { uid, prioridade, iniciativa, lado: 'grupo'|'inimigos', pos }.
 * prioridade (maior primeiro) → iniciativa (maior primeiro) → grupo antes dos inimigos → menor posição.
 */
export function ordenar(itens) {
  const peso = (l) => (l === 'grupo' ? 0 : 1);
  return itens.slice().sort((a, b) => (b.prioridade - a.prioridade) || (b.iniciativa - a.iniciativa) || (peso(a.lado) - peso(b.lado)) || (a.pos - b.pos));
}

export const fracaoVida = (a) => a.vida / a.vida_max;
