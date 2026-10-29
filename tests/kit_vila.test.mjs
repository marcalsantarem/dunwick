// Kit da vila e dos interiores (v0.1.2, 07): todo grupo de geometria tem material, as fontes de luz existem, a colisão bate com a pegada
// e o peso fica dentro de um teto. Roda em Node (sem navegador): o que depende de olhar está nas capturas (tools/capturar_vila.mjs).
import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { carregarDados, DV } from './_util.mjs';
import { construirKit } from '../src/motor/kit.js';
import { criarMateriais } from '../src/motor/materiais.js';
import { criarTampaBau } from '../src/motor/bau_tesouro.js';
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
  assert.ok(mapa.livre(24 + DV, 19.5 + DV, 0.3), 'o meio do pórtico é livre'); assert.ok(!mapa.livre(22 + DV, 19.5 + DV, 0.3), 'o poste bloqueia'); assert.ok(!mapa.livre(26 + DV, 19.5 + DV, 0.3));
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

test('interiores: só a MARCAÇÃO de saída no chão (capacho, luz de fora, fonte `porta`), sem lanterna de poste e com apliques de vela', () => {
  for (const m of mapas.filter((x) => x.tipo_mapa === 'interior')) {
    const k = construirKit(m, kit), tipos = k.luzes.map((l) => l.tipo);
    assert.ok(tipos.includes('porta') && kit.fontes.porta, `${m.id}: luz de fora`); assert.ok(!tipos.includes('lanterna'), `${m.id}: sem lanterna de poste`);
    assert.ok(tipos.filter((t) => t === 'vela').length >= 2, `${m.id}: apliques de vela`); assert.ok(k.grupos.has('brilho_saida') && k.grupos.has('latao'), `${m.id}: capacho com seta e mancha de luz`);
    assert.equal(k.saidas, undefined, 'sem rótulo nem porta desenhada');
  }
});

test('baú de tesouro: corpo no kit com tesouro dentro, tampa separada que abre 112° e volta; pegada do cfg_kit', () => {
  const o = { id: 'bau_t', tipo: 'bau_tesouro', x: 5, z: 6, rot: 0, seed: 2 }, k = construirKit({ objetos: [o] }, kit);
  assert.ok(k.grupos.has('tabuas') && k.grupos.has('latao') && k.grupos.has('tecido_azul'), 'corpo, cintas de latão, moedas e gemas');
  const b = criarTampaBau(o, materiais); assert.equal(b.grupo.children[0].children.length, 5, 'meia-cana + 2 cintas + 2 tampas laterais');
  b.definir(0); assert.ok(b.grupo.children[0].rotation.x === 0); b.definir(1); assert.ok(Math.abs(b.grupo.children[0].rotation.x + (112 * Math.PI) / 180) < 1e-6);
  assert.deepEqual(colisorDe(o, kit), { forma: 'ret', x0: 4.5, z0: 5.67, x1: 5.5, z1: 6.33, id: 'bau_t' }, 'colisão = pegada');
  assert.ok(Math.abs(b.grupo.position.z - (6 - 0.33)) < 1e-9 && b.grupo.position.y === 0.5, 'dobradiça na borda de trás, na altura do corpo');
});

test('casa rústica do Edric: paredes de tábuas, telhado de palha, remendos; peças do entorno e da mobília entram no kit', () => {
  const casa = { id: 'casa_edric', tipo: 'casa', x: 4.8, z: 7.2, w: 3, d: 3, rot: 0, telhado: 'palha', estilo: 'rustica', deco: 'edric', janelas: 1, chamine: true, seed: 5, lado: 's' };
  const k = construirKit({ objetos: [casa, { id: 'l', tipo: 'lenha', x: 8, z: 8, rot: 0 }, { id: 'v', tipo: 'varal', x: 2, z: 11, w: 2.4, rot: 0 }, { id: 'b', tipo: 'balde', x: 7, z: 9 }] }, kit);
  for (const g of ['palha_telha', 'tabuas', 'madeira_clara', 'tecido_ocre', 'casca']) assert.ok(k.grupos.has(g), `sem ${g}`);
  const mob = construirKit({ objetos: [{ id: 'a', tipo: 'armas_parede', x: 3, z: 0, rot: 0 }, { id: 'p', tipo: 'prateleira', x: 6, z: 0, rot: 0 }, { id: 'c', tipo: 'cama', x: 2, z: 2, rot: 0, itens: 'remendada', cor: 'verde' }] }, kit);
  assert.ok(mob.grupos.has('tapete_verde') && mob.grupos.has('livro_a'), 'cobertor verde remendado e livros da prateleira'); assert.ok(mob.luzes.some((l) => l.tipo === 'vela'), 'vela da prateleira');
  assert.equal(colisorDe({ id: 'v', tipo: 'varal', x: 2, z: 11, w: 2.4 }, kit).length, 2);
});

test('perímetro e mata (v0.1.2b): muralha baixa, estacada, tronco caído e moita entram no kit; trechos viram linha de colisão; árvores aceitam escala e seed', () => {
  const objs = [{ id: 'm', tipo: 'muralha_baixa', x0: 0, z0: 0, x1: 6, z1: 0, seed: 2 }, { id: 'e', tipo: 'estacada', x0: 0, z0: 3, x1: 0, z1: 9 }, { id: 't', tipo: 'tronco_caido', x: 3, z: 3, rot: 30 }, { id: 'mo', tipo: 'moita', x: 5, z: 5, escala: 1.3 }, { id: 'a', tipo: 'pinheiro', x: 8, z: 8, escala: 1.4, seed: 9 }];
  const k = construirKit({ objetos: objs }, kit);
  for (const g of ['pedra', 'casca', 'madeira', 'folhagem']) assert.ok(k.grupos.has(g), `sem ${g}`);
  assert.equal(colisorDe(objs[0], kit).forma, 'linha'); assert.equal(colisorDe(objs[1], kit).forma, 'linha'); assert.equal(colisorDe(objs[2], kit).forma, 'ret'); assert.ok(Math.abs(colisorDe(objs[3], kit).r - 0.91) < 1e-9);
  assert.ok(vertices(construirKit({ objetos: [objs[0]] }, kit)) < 3000, 'muralha de 6 tiles leve');
});
