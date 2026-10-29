// Regras cruzadas dos mapas ligados por portais (v0.1.2): edifícios, portais ida e volta, início e chegadas fora de colisão,
// POIs e chegadas alcançáveis a pé a partir do início. Usa o MESMO módulo de colisão do jogo (src/jogo/mapa.js).
import { criarMapa } from '../../src/jogo/mapa.js';

const RAIO_HEROI = 0.35, PASSO = 0.5;
const retDe = (o) => ({ x0: o.x - o.w / 2, z0: o.z - o.d / 2, x1: o.x + o.w / 2, z1: o.z + o.d / 2 });
const sobrepoe = (a, b) => a.x0 < b.x1 && a.x1 > b.x0 && a.z0 < b.z1 && a.z1 > b.z0;

/** entradas = [[arquivo, mapa]]; erro(arq, campo, msg). */
export function validarMapasLigados(entradas, kit, cfgMundo, erro, textoOk) {
  const porId = new Map(entradas.map(([arq, m]) => [m.id, { arq, m }]));
  const logicas = new Map(entradas.map(([, m]) => [m.id, criarMapa(m, kit, cfgMundo)]));
  for (const [arq, m] of entradas) {
    const mapa = logicas.get(m.id), [L, A] = m.tamanho, dentro = (x, z) => x >= 0 && z >= 0 && x <= L && z <= A;
    // ---- edifícios ----
    const edif = m.edificios ?? [], idsEd = new Set();
    edif.forEach((e, i) => {
      if (idsEd.has(e.id)) erro(arq, `/edificios/${i}/id`, `ID "${e.id}" repetido`); idsEd.add(e.id);
      const obj = m.objetos.find((o) => o.id === e.id && o.tipo === 'casa');
      if (!obj) erro(arq, `/edificios/${i}/id`, `"${e.id}" deve ser o id de um objeto "casa" em objetos`);
      else if (obj.x !== e.x || obj.z !== e.z || (obj.w ?? 0) !== e.w || (obj.d ?? 0) !== e.d) erro(arq, `/edificios/${i}`, `x, z, w, d diferem do objeto "casa" "${e.id}"`);
      if (e.interior !== null) {
        const alvo = porId.get(e.interior);
        if (!alvo) erro(arq, `/edificios/${i}/interior`, `mapa "${e.interior}" não existe`);
        else if (alvo.m.tipo_mapa !== 'interior') erro(arq, `/edificios/${i}/interior`, `"${e.interior}" não é tipo_mapa interior`);
        else if (!(m.portais ?? []).some((p) => p.destino.mapa === e.interior)) erro(arq, `/edificios/${i}/interior`, `nenhum portal de "${m.id}" leva a "${e.interior}"`);
      }
      const r = retDe(e), folga = 1.2;
      if (e.porta.x < r.x0 - folga || e.porta.x > r.x1 + folga || e.porta.z < r.z0 - folga || e.porta.z > r.z1 + folga) erro(arq, `/edificios/${i}/porta`, 'porta longe do edifício');
    });
    for (let i = 0; i < edif.length; i++) for (let j = i + 1; j < edif.length; j++) if (sobrepoe(retDe(edif[i]), retDe(edif[j]))) erro(arq, '/edificios', `"${edif[i].id}" e "${edif[j].id}" se sobrepõem`);
    // ---- portais ----
    const portais = m.portais ?? [], idsP = new Set();
    portais.forEach((p, i) => {
      if (idsP.has(p.id)) erro(arq, `/portais/${i}/id`, `ID "${p.id}" repetido`); idsP.add(p.id);
      const r = retDe(p); if (!dentro(r.x0, r.z0) || !dentro(r.x1, r.z1)) erro(arq, `/portais/${i}`, 'retângulo do portal fora do mapa');
      if (!p.ativo) return; // saída futura: sem destino a conferir
      const alvo = porId.get(p.destino.mapa);
      if (!alvo) { erro(arq, `/portais/${i}/destino/mapa`, `mapa "${p.destino.mapa}" não existe`); return; }
      const volta = (alvo.m.portais ?? []).find((q) => q.id === p.destino.portal);
      if (!volta) erro(arq, `/portais/${i}/destino/portal`, `portal "${p.destino.portal}" não existe em "${p.destino.mapa}"`);
      else if (volta.destino.mapa !== m.id || volta.destino.portal !== p.id) erro(arq, `/portais/${i}`, `sem volta: "${p.destino.mapa}/${volta.id}" não aponta de volta para "${m.id}/${p.id}"`);
      if (!mapa.livre(p.chegada.x, p.chegada.z, RAIO_HEROI)) erro(arq, `/portais/${i}/chegada`, `chegada (${p.chegada.x}; ${p.chegada.z}) está em colisão`);
      else if (retDe(p).x0 <= p.chegada.x && p.chegada.x <= retDe(p).x1 && retDe(p).z0 <= p.chegada.z && p.chegada.z <= retDe(p).z1) erro(arq, `/portais/${i}/chegada`, 'a chegada está dentro do próprio portal (disparo imediato)');
    });
    // ---- início, chegadas e POIs alcançáveis ----
    const [ix, iz] = m.inicio_jogador.tile, sx = ix + 0.5, sz = iz + 0.5;
    if (!mapa.livre(sx, sz, RAIO_HEROI)) { erro(arq, '/inicio_jogador', `início (${sx}; ${sz}) está em colisão`); continue; }
    const nx = Math.floor(L / PASSO), nz = Math.floor(A / PASSO), visto = new Uint8Array(nx * nz), fila = [[Math.floor(sx / PASSO), Math.floor(sz / PASSO)]];
    visto[fila[0][1] * nx + fila[0][0]] = 1;
    while (fila.length) {
      const [i, j] = fila.pop();
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= nx || b >= nz || visto[b * nx + a]) continue;
        if (mapa.livre((a + 0.5) * PASSO, (b + 0.5) * PASSO, RAIO_HEROI)) { visto[b * nx + a] = 1; fila.push([a, b]); }
      }
    }
    const alcanca = (x, z, folga = 0.8) => { for (let dz = -folga; dz <= folga; dz += PASSO) for (let dx = -folga; dx <= folga; dx += PASSO) { const a = Math.floor((x + dx) / PASSO), b = Math.floor((z + dz) / PASSO); if (a >= 0 && b >= 0 && a < nx && b < nz && visto[b * nx + a]) return true; } return false; };
    for (const p of portais) if (p.ativo) { if (!alcanca(p.chegada.x, p.chegada.z, 0.1)) erro(arq, `/portais/${p.id}/chegada`, 'chegada não é alcançável a pé a partir do início'); if (!alcanca(p.x, p.z)) erro(arq, `/portais/${p.id}`, 'portal não é alcançável a pé a partir do início'); }
    (m.pois ?? []).forEach((poi, i) => {
      textoOk(arq, `/pois/${i}/nome_txt`, poi.nome_txt);
      if (!dentro(poi.x, poi.z)) erro(arq, `/pois/${i}`, 'POI fora do mapa'); else if (!alcanca(poi.x, poi.z, 1.6)) erro(arq, `/pois/${i}`, `POI "${poi.id}" não é alcançável a pé`);
    });
    if (m.tipo_mapa === 'interior' && !portais.some((p) => p.ativo)) erro(arq, '/portais', 'interior sem portal de saída ativo');
  }
}
