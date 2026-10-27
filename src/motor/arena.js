// Arena da batalha a partir de data/cenarios/cen_*.json: monta o "mapa" sintético (planta do palco + peças do kit deslocadas pela origem)
// que o mesmo construtor de chão e de kit da exploração consome. Puro (sem three nem DOM), testável em Node.
// Coordenadas do dado são LOCAIS do palco (origem no centro, z+ para a câmera); o mapa sintético usa coordenadas de mundo positivas.

/** Cenário do encontro: o `cenario` do encontro se existir; senão o cenário marcado como `padrao` (o M1 só tem cen_praca). */
export function cenarioDoEncontro(dados, encontroId) {
  const pedido = dados.combate.encontros[encontroId]?.cenario;
  return dados.cenarios[pedido] ?? Object.values(dados.cenarios).find((c) => c.padrao) ?? Object.values(dados.cenarios)[0];
}

export function montarMapaArena(cen) {
  const [L, A] = cen.palco.tamanho, [ox, oz] = cen.palco.origem, [rx, rz] = cen.palco.calcada_raio, mb = cen.palco.musgo_borda, planta = [];
  for (let z = 0; z < A; z++) {
    let linha = '';
    for (let x = 0; x < L; x++) {
      const lx = x + 0.5 - ox, lz = z + 0.5 - oz, e = (lx / rx) ** 2 + (lz / rz) ** 2, e2 = (lx / (rx + mb)) ** 2 + (lz / (rz + mb)) ** 2;
      linha += e <= 1 ? 'c' : e2 <= 1 ? 'm' : lz > cen.palco.terra_z_min ? 't' : 'g';
    }
    planta.push(linha);
  }
  return { id: cen.id, tamanho: [L, A], legenda: { g: 'grama', t: 'terra', c: 'calcada', m: 'musgo' }, planta, origem: [ox, oz], objetos: cen.objetos.map((o) => ({ ...o, x: o.x + ox, z: o.z + oz })) };
}

/** Regra de ouro 1 do 07: na faixa de combate (|x| ≤ 5, z de −5,5 a +6) não há peça do kit (só flancos e fundo). Devolve as peças que invadem. */
export function pecasNaFaixaDeCombate(cen) {
  return cen.objetos.filter((o) => o.tipo !== 'lanterna' && Math.abs(o.x) <= 5 && o.z >= -5.5 && o.z <= 6);
}

/** Cor (0..1 por canal) da cobertura de névoa: a névoa do ciclo na hora atual. */
export const corCobertura = (estadoCiclo) => estadoCiclo.nevoa;
