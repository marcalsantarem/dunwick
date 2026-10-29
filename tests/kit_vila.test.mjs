// Kit da vila e dos interiores (v0.1.2, 07): todo grupo de geometria tem material, as fontes de luz existem, a colisão bate com a pegada
// e o peso fica dentro de um teto. Roda em Node (sem navegador): o que depende de olhar está nas capturas (tools/capturar_vila.mjs).
import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { carregarDados } from './_util.mjs';
import { construirKit } from '../src/motor/kit.js';
import { criarMateriais } from '../src/motor/materiais.js';
import { colisorDe, criarMapa } from '../src/jogo/mapa.js';

const dados = carregarDados(), kit = dados.config.kit, mapas = Object.values(dados.mapas);
const T = Object.fromEntries(['reboco', 'madeira', 'telha_laranja', 'telha_musgo', 'ardosia', 'pedra', 'casca', 'tabuas', 'folhagem', 'terra'].map((k) => [k, new THREE.Texture()]));
const { materiais } = criarMateriais(T, { aniso: 1 });
const vertices = (k) => [...k.grupos.values()].reduce((n, g) => n + g.attributes.position.count, 0);

test('todo grupo de geometria do kit (vila e interiores) tem material, posição, normal e UV', () => {
  for (const m of mapas) {
    const k = construirKit(m, kit);
    for (const [nome, g] of k.grupos) {
      assert.ok(materiais[nome], `${m.id}: sem material "${nome}"`);
      for (const a of ['position', 'normal', 'uv']) assert.ok(g.attributes[a], `${m.id}/${nome}: falta ${a}`);
      assert.ok(Number.isFinite(g.attributes.position.array[0]) && !g.attributes.position.array.some(Number.isNaN), `${m.id}/${nome}: coordenada inválida`);
    }
  }
});

test('peças da vila e dos interiores entram no kit: pórtico, quadro, marcas do saque, forno e a mobília de cada cômodo', () => {
  const vila = mapas.find((m) => m.tipo_mapa === 'exterior'), tipos = new Set(vila.objetos.map((o) => o.tipo));
  for (const t of ['portico', 'quadro_avisos', 'arvore_queimada', 'muro_fuligem', 'pedra_enegrecida', 'canteiro', 'rack_armas', 'forja_brasa']) assert.ok(tipos.has(t), `vila sem ${t}`);
  const k = construirKit(vila, kit);
  for (const g of ['pedra_negra', 'carvao', 'brasa', 'papel', 'latao', 'tecido_vinho', 'tecido_azul', 'janela_vela', 'reboco_novo', 'madeira_clara']) assert.ok(k.grupos.has(g), `a vila não usa o material ${g}`);
  const mob = new Set(mapas.filter((m) => m.tipo_mapa === 'interior').flatMap((m) => m.objetos.map((o) => o.tipo)));
  for (const t of ['estante', 'mesa', 'cadeira', 'cama', 'balcao', 'lareira', 'banco', 'fornalha', 'bigorna', 'bancada', 'arquivo']) assert.ok(mob.has(t), `nenhum interior usa ${t}`);
});

test('luz de ambiente por tipo: vela (Maren), forja (forno e fornalha) e lareira (taverna) saem do kit com fonte configurada em cfg_kit', () => {
  const tipos = (m) => new Set(construirKit(m, kit).luzes.map((l) => l.tipo)), porId = (id) => mapas.find((m) => m.id === id);
  assert.ok(tipos(porId('map_baixo_orvalho')).has('vela') && tipos(porId('map_baixo_orvalho')).has('forja'), 'vila: vela da Maren e forno de brasa');
  assert.ok(tipos(porId('map_taverna_interior')).has('lareira')); assert.ok(tipos(porId('map_forja_interior')).has('forja'));
  for (const t of ['vela', 'forja', 'lareira']) { const f = kit.fontes[t]; assert.ok(f && f.intensidade > 0 && f.alcance_tiles > 0 && f.sempre === true, `fonte ${t}`); }
});

test('pórtico: dois postes com o vão livre no meio (a trilha passa por baixo); colisão = pegada do kit', () => {
  const c = colisorDe({ id: 'p', tipo: 'portico', x: 24, z: 19.5, w: 4 }, kit);
  assert.equal(c.length, 2); assert.deepEqual(c.map((q) => [q.x, q.z, q.r]), [[22, 19.5, 0.3], [26, 19.5, 0.3]]);
  const vila = mapas.find((m) => m.tipo_mapa === 'exterior'), mapa = criarMapa(vila, kit, dados.config.jogo.mundo);
  assert.ok(mapa.livre(24, 19.5, 0.3), 'o meio do pórtico é livre'); assert.ok(!mapa.livre(22, 19.5, 0.3), 'o poste bloqueia'); assert.ok(!mapa.livre(26, 19.5, 0.3));
});

test('a porta da casa fica no MEIO da parede do `lado` (s = +z, l = +x), onde o gatilho do portal está colado', () => {
  const casa = { id: 'c', tipo: 'casa', x: 10, z: 20, w: 4, d: 4, rot: 0, telhado: 'telha', janelas: 2, seed: 3 };
  const centro = (o) => { const g = construirKit({ objetos: [o] }, kit).grupos.get('tabuas'); g.computeBoundingBox(); const c = g.boundingBox.getCenter(new THREE.Vector3()); return { x: c.x, z: c.z }; }; // 'tabuas' = só a folha da porta
  const s = centro({ ...casa, lado: 's' }), l = centro({ ...casa, lado: 'l' }), n = centro({ ...casa, lado: 'n' }), oe = centro({ ...casa, lado: 'o' });
  assert.ok(Math.abs(s.x - 10) < 0.01 && Math.abs(s.z - 22.055) < 0.01, `s: ${JSON.stringify(s)}`); assert.ok(Math.abs(l.z - 20) < 0.01 && Math.abs(l.x - 12.055) < 0.01, `l: ${JSON.stringify(l)}`);
  assert.ok(Math.abs(n.x - 10) < 0.01 && Math.abs(n.z - 17.945) < 0.01, `n: ${JSON.stringify(n)}`); assert.ok(Math.abs(oe.z - 20) < 0.01 && Math.abs(oe.x - 7.945) < 0.01, `o: ${JSON.stringify(oe)}`);
});

test('peso: a vila e cada interior ficam dentro do teto de vértices e de grupos (poucas chamadas de desenho)', () => {
  for (const m of mapas) { const k = construirKit(m, kit), v = vertices(k); assert.ok(v < (m.tipo_mapa === 'interior' ? 120000 : 600000), `${m.id}: ${v} vértices`); assert.ok(k.grupos.size <= 40, `${m.id}: ${k.grupos.size} grupos`); }
});

test('interiores: porta de saída desenhada no portal `saida` (luz `porta` + rótulo), sem lanterna de poste, com apliques de vela', () => {
  for (const m of mapas.filter((x) => x.tipo_mapa === 'interior')) {
    const k = construirKit(m, kit), saida = m.portais.find((p) => p.id === 'saida'), tipos = k.luzes.map((l) => l.tipo);
    assert.equal(k.saidas.length, 1, `${m.id}: uma porta de saída`); assert.ok(Math.abs(k.saidas[0].x - saida.x) < 0.01 && Math.abs(k.saidas[0].z - m.tamanho[1]) < 0.2, `${m.id}: a porta fica no portal`);
    assert.ok(tipos.includes('porta') && kit.fontes.porta, `${m.id}: luz de fora`); assert.ok(!tipos.includes('lanterna'), `${m.id}: sem lanterna de poste`);
    assert.ok(tipos.filter((t) => t === 'vela').length >= 2, `${m.id}: apliques de vela`); assert.ok(k.grupos.has('brilho_saida') && k.grupos.has('latao'), `${m.id}: capacho e maçaneta`);
  }
  assert.equal(construirKit(mapas.find((x) => x.tipo_mapa === 'exterior'), kit).saidas.length, 0, 'a vila não tem porta de saída');
});
