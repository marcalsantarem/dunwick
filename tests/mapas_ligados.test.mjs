// Mapas ligados por portais (v0.1.2): validador cruzado (edifícios, ida e volta, chegadas livres, POIs alcançáveis), interior.
import test from 'node:test';
import assert from 'node:assert/strict';
import { carregarDados } from './_util.mjs';
import { validarMapasLigados } from '../tools/lib/validar_mapas_ligados.mjs';
import { paredesInterior, ambienteInterior } from '../src/motor/interior.js';

const rodar = (dados) => {
  const erros = []; validarMapasLigados(Object.values(dados.mapas).map((m) => [m.id + '.json', m]), dados.config.kit, dados.config.jogo.mundo, (a, c, msg) => erros.push(`${c}: ${msg}`), () => {});
  return erros;
};

test('os mapas reais passam no validador de portais, edifícios e POIs', () => { assert.deepEqual(rodar(carregarDados()), []); });

test('portal sem volta é recusado', () => {
  const d = carregarDados(); d.mapas.map_casa_maren_interior.portais[0].destino.portal = 'portal_inexistente';
  assert.ok(rodar(d).some((e) => /não existe em|sem volta/.test(e)), rodar(d).join(' | '));
});

test('chegada dentro de colisão ou dentro do próprio portal é recusada', () => {
  const d = carregarDados(); const ex = d.mapas.map_baixo_orvalho, ed = ex.edificios[0]; ex.portais.find((p) => p.destino.mapa === ed.interior).chegada = { x: ed.x, z: ed.z, direcao: 'n' }; // dentro da casa
  assert.ok(rodar(d).some((e) => /chegada/.test(e)));
  const e = carregarDados(); const p = e.mapas.map_baixo_orvalho.portais.find((q) => q.ativo); p.chegada = { x: p.x, z: p.z, direcao: 's' };
  assert.ok(rodar(e).some((x) => /dentro do próprio portal|colisão/.test(x)));
});

test('edifício que não é uma casa do mapa, sobreposto ou com interior inexistente é recusado', () => {
  const d = carregarDados(), m = d.mapas.map_baixo_orvalho;
  m.edificios.push({ ...m.edificios[0], id: 'casa_fantasma' }); assert.ok(rodar(d).some((e) => /id de um objeto "casa"/.test(e)));
  const o = carregarDados(), mo = o.mapas.map_baixo_orvalho; mo.edificios[0].interior = 'map_nao_existe_interior'; assert.ok(rodar(o).some((e) => /interior/.test(e)));
});

test('POI trancado dentro de um prédio não é alcançável', () => {
  const d = carregarDados(); d.mapas.map_baixo_orvalho.pois.push({ id: 'poi_dentro', tipo: 'x', x: d.mapas.map_baixo_orvalho.edificios[0].x, z: d.mapas.map_baixo_orvalho.edificios[0].z, nome_txt: d.mapas.map_baixo_orvalho.pois[0].nome_txt });
  assert.ok(rodar(d).some((e) => /alcançável/.test(e)));
});

test('início em colisão é recusado', () => {
  const d = carregarDados(); const mi = d.mapas.map_casa_maren_interior, o = mi.objetos.find((x) => x.tipo === 'caixote' || x.tipo === 'barril'); mi.inicio_jogador.tile = [Math.floor(o.x), Math.floor(o.z)]; // em cima de um móvel
  assert.ok(rodar(d).some((e) => /início/.test(e)));
});

test('interior: paredes de trás inteiras, frente só rodapé; luz própria sem sol', () => {
  const d = carregarDados(), m = d.mapas.map_casa_maren_interior;
  const malhas = paredesInterior(m, { reboco: {}, pedra: {} }), alturas = malhas.map((x) => { x.geometry.computeBoundingBox(); return +x.geometry.boundingBox.max.y.toFixed(2); });
  assert.ok(alturas.includes(m.sala.altura_parede), 'parede de trás na altura da sala'); assert.ok(alturas.includes(0.3), 'rodapé baixo na frente');
  const ec = ambienteInterior(m.ambiente); assert.equal(ec.solInt, 0); assert.equal(ec.luzArtificial, 1); assert.ok(ec.hemiCeu.every((c) => c >= 0 && c <= 1.5));
});

