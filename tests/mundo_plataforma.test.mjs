// Mapa de mundo (v0.1.3, 08): terreno em pixels, colisão dos materiais bloqueados, validador cruzado e cfg_mundo.
import test from 'node:test';
import assert from 'node:assert/strict';
import { carregarDados } from './_util.mjs';
import { gerarAtlas, indicesTerreno, listaMateriais } from '../src/motor/terreno_mundo.js';
import { criarMapa } from '../src/jogo/mapa.js';
import { validarMapasLigados } from '../tools/lib/validar_mapas_ligados.mjs';

const mundoDe = (d) => Object.values(d.mapas).find((m) => m.tipo_mapa === 'mundo');
const rodar = (d) => { const e = []; validarMapasLigados(Object.values(d.mapas).map((m) => [m.id + '.json', m]), d.config.kit, d.config.jogo.mundo, (a, c, msg) => e.push(`${c}: ${msg}`), () => {}, { encontros: new Set(Object.keys(d.combate.encontros)), itens: new Set(Object.keys(d.combate.itens)), paleta: new Set(Object.keys(d.config.mundo.terreno.materiais)) }); return e; };

test('cfg_mundo: câmera mais distante que a do jogo e paleta cobre a legenda do mapa de mundo', () => {
  const d = carregarDados(), m = mundoDe(d); assert.ok(m, 'há um mapa de mundo');
  assert.ok(d.config.mundo.camera.pixels_por_unidade < d.config.jogo.pixels_por_unidade, 'zoom out');
  for (const mat of Object.values(m.legenda)) assert.ok(d.config.mundo.terreno.materiais[mat], `cor de ${mat}`);
});

test('terreno do mundo: atlas determinístico (variantes × materiais) e mapa de índices com material, variante e profundidade', () => {
  const d = carregarDados(), m = mundoDe(d), T = d.config.mundo.terreno, a = gerarAtlas(T), b = gerarAtlas(T), mats = listaMateriais(T);
  assert.equal(a.largura, T.variantes * T.px_por_tile); assert.equal(a.altura, mats.length * T.px_por_tile); assert.deepEqual(a.dados, b.dados); assert.ok(a.dados.every((_, i) => i % 4 !== 3 || a.dados[i] === 255), 'alfa opaco');
  const ix = indicesTerreno(m, T); assert.equal(ix.largura, m.tamanho[0]); assert.equal(ix.altura, m.tamanho[1]);
  const ag = mats.indexOf(T.agua.material); let aguaFunda = 0, aguaRasa = 0;
  for (let i = 0; i < ix.dados.length; i += 4) { assert.ok(ix.dados[i] < mats.length && ix.dados[i + 1] < T.variantes); if (ix.dados[i] === ag) { if (ix.dados[i + 2] > 200) aguaFunda++; else if (ix.dados[i + 2] < 60) aguaRasa++; } }
  assert.ok(aguaFunda > 0 && aguaRasa > 0, 'a água tem costa rasa e miolo fundo');
  const [x, z] = [10, 10], mat = m.legenda[m.planta[z][x]]; assert.equal(mats[ix.dados[(z * ix.largura + x) * 4]], mat);
});

test('colisão do terreno: o herói não entra na água nem na montanha, mas anda na grama', () => {
  const d = carregarDados(), m = mundoDe(d), mapa = criarMapa(m, d.config.kit, d.config.jogo.mundo);
  let agua = null, livre = null; m.planta.forEach((l, z) => { for (let x = 0; x < l.length; x++) { const mat = m.legenda[l[x]]; if (!agua && (m.solidos ?? []).includes(l[x])) agua = [x + 0.5, z + 0.5]; if (!livre && mat === 'grama' && mapa.livre(x + 0.5, z + 0.5, 0.35)) livre = [x + 0.5, z + 0.5]; } });
  assert.ok(agua && livre); assert.equal(mapa.livre(agua[0], agua[1], 0.35), false); assert.equal(mapa.livre(livre[0], livre[1], 0.35), true);
});

test('o mapa de mundo real passa no validador; sem portal ativo, material sem cor ou sólido fora da legenda são recusados', () => {
  assert.deepEqual(rodar(carregarDados()), []);
  const a = carregarDados(); for (const p of mundoDe(a).portais) p.ativo = false; assert.ok(rodar(a).some((e) => /sem portal ativo/.test(e)));
  const b = carregarDados(); delete b.config.mundo.terreno.materiais.agua; assert.ok(rodar(b).some((e) => /sem cor em cfg_mundo/.test(e)));
  const c = carregarDados(); mundoDe(c).solidos = ['?']; assert.ok(rodar(c).some((e) => /solidos/.test(e)));
  const e = carregarDados(); mundoDe(e).edificios = structuredClone(Object.values(e.mapas).find((m) => m.tipo_mapa === 'exterior').edificios.slice(0, 1)); assert.ok(rodar(e).some((x) => /não tem edifícios/.test(x)));
});
