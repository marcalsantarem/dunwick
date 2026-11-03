// NPCs, diálogos, lojas e economia (v0.1.4, 08): esquemas, colisor do NPC, formato empacotado e regras cruzadas do validador de mapas.
import test from 'node:test';
import assert from 'node:assert/strict';
import Ajv2020 from 'ajv/dist/2020.js';
import { carregarDados } from './_util.mjs';
import { carregarEsquemas } from '../tools/lib/dados.mjs';
import { criarMapa, RAIO_NPC_PADRAO } from '../src/jogo/mapa.js';
import { validarMapasLigados } from '../tools/lib/validar_mapas_ligados.mjs';
import { criarEstadoJogo } from '../src/jogo/estado_jogo.js';
import { criarEventos } from '../src/jogo/eventos.js';
import { criarMenu } from '../src/plataforma/menu.js';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const esquemas = carregarEsquemas(RAIZ), ajv = new Ajv2020({ allErrors: true, strict: true });
const v = Object.fromEntries(['npc', 'dialogo', 'loja', 'cfg_economia'].map((n) => [n, ajv.compile(esquemas[n])]));

// ponto de chão livre (raio 1.5 em volta, e 6 tiles para a direita também), a ≥ 3 tiles do início: o NPC nunca cobre o início do herói
function pontoLivre(d, alvo) {
  const sem = criarMapa({ ...alvo, npcs: [] }, d.config.kit, d.config.jogo.mundo), [ix, iz] = alvo.inicio_jogador.tile;
  for (let dz = -8; dz <= 8; dz++) for (let dx = 3; dx <= 10; dx++) if (sem.livre(ix + dx, iz + dz, 1.5) && sem.livre(ix + dx + 6, iz + dz, 1.5)) return [ix + dx + 0.5, iz + dz + 0.5];
  throw new Error('sem ponto livre no mapa de teste');
}

const NPC = { id: 'npc_teste', nome_txt: 'txt_npc_teste', sprite: 'npc_teste', dialogo: 'dlg_teste', loja: 'shop_teste', cor_falante: '#c0a060' };
const DLG = { id: 'dlg_teste', falas: [{ txt: 'txt_dlg_teste_1' }, { txt: 'txt_dlg_teste_2', falante: 'hero_edric' }] };
const LOJA = { id: 'shop_teste', nome_txt: 'txt_shop_teste', falas: { saudacao_txt: 'txt_a', comprou_txt: 'txt_b', vendeu_txt: 'txt_c', sem_moedas_txt: 'txt_d', despedida_txt: 'txt_e' }, estoque: [{ item: 'item_pocao_pequena' }, { item: 'item_x', qtd: 3 }] };
const ECO = { id: 'cfg_economia', versao: 1, moeda_txt: 'txt_moeda_coroa', coroas_iniciais: 50, venda_pct: 50, precos: { item_pocao_pequena: { compra: 20 }, item_x: { compra: 10, venda: 4 } } };

test('esquemas: npc, diálogo, loja e economia aceitam o exemplo e rejeitam campos soltos', () => {
  for (const [n, obj] of [['npc', NPC], ['dialogo', DLG], ['loja', LOJA], ['cfg_economia', ECO]]) assert.ok(v[n](obj), `${n}: ${JSON.stringify(v[n].errors)}`);
  assert.ok(!v.npc({ ...NPC, texto: 'olá' }), 'texto fora de tabela não passa');
  assert.ok(!v.npc({ ...NPC, id: 'maren' }), 'id sem prefixo');
  assert.ok(!v.dialogo({ id: 'dlg_vazio', falas: [] }), 'diálogo precisa de falas');
  assert.ok(!v.loja({ ...LOJA, estoque: [{ item: 'pocao' }] }), 'item sem prefixo item_');
  assert.ok(!v.cfg_economia({ ...ECO, precos: { item_x: { compra: 0 } } }), 'preço de compra mínimo 1');
});

test('colisor do NPC: círculo nos pés, o herói não atravessa e o raio vem da ficha', () => {
  const d = carregarDados(), base = Object.values(d.mapas).find((m) => m.tipo_mapa === 'exterior');
  const [bx, bz] = pontoLivre(d, base), m = { ...base, npcs: [{ id: 'npc_teste', x: bx, z: bz }, { id: 'npc_sem_ficha', x: bx + 4, z: bz, dir: 'l' }] };
  const mapa = criarMapa(m, d.config.kit, d.config.jogo.mundo, { npc_teste: { raio: 0.5, dir_padrao: 'n' } });
  const c = mapa.colisores.filter((q) => q.npc); assert.equal(c.length, 2);
  assert.deepEqual(mapa.npcs.map((n) => [n.id, n.raio, n.dir]), [['npc_teste', 0.5, 'n'], ['npc_sem_ficha', RAIO_NPC_PADRAO, 'l']]);
  assert.ok(!mapa.livre(bx, bz, 0.35), 'em cima do NPC não é livre');
  assert.ok(!mapa.livre(bx + 0.7, bz, 0.35), 'encostado no NPC não é livre');
  assert.ok(mapa.livre(bx + 2, bz, 0.35), 'dois tiles ao lado é livre');
});

test('validador de mapas: NPC sem ficha, fora do mapa, em sólido, repetido ou colado em outro NPC dá erro com campo', () => {
  const d = carregarDados(), alvo = Object.values(d.mapas).find((m) => m.tipo_mapa === 'exterior');
  const [L] = alvo.tamanho, casa = alvo.objetos.find((o) => o.tipo === 'casa');
  const fichas = { npc_a: { raio: 0.35 }, npc_b: { raio: 0.35 } };
  const rodar = (npcs) => {
    const e = [], mapas = Object.values(d.mapas).map((m) => [m.id + '.json', m === alvo ? { ...m, npcs } : { ...m, npcs: [] }]);
    validarMapasLigados(mapas, d.config.kit, d.config.jogo.mundo, (a, c, msg) => e.push(`${c}: ${msg}`), () => {}, { fichasNpc: fichas, encontros: new Set(Object.keys(d.combate.encontros)), itens: new Set(Object.keys(d.combate.itens)), paleta: new Set() });
    return e.filter((x) => x.includes('npc') || x.includes('NPC'));
  };
  const [px, pz] = pontoLivre(d, alvo);
  assert.deepEqual(rodar([{ id: 'npc_a', x: px, z: pz }]), [], 'um NPC em chão livre passa');
  assert.match(rodar([{ id: 'npc_zzz', x: px, z: pz }])[0], /\/npcs\/0\/id: NPC "npc_zzz" não existe/);
  assert.match(rodar([{ id: 'npc_a', x: L + 5, z: pz }])[0], /fora do mapa/);
  assert.match(rodar([{ id: 'npc_a', x: casa.x, z: casa.z }])[0], /dentro de um sólido/);
  assert.match(rodar([{ id: 'npc_a', x: px, z: pz }, { id: 'npc_a', x: px + 3, z: pz }]).join('|'), /aparece duas vezes/);
  assert.match(rodar([{ id: 'npc_a', x: px, z: pz }, { id: 'npc_b', x: px + 0.6, z: pz }]).join('|'), /a menos de 1 tile/);
});

test('empacotamento: npc ganha cor e falas; loja ganha itens com preço de compra/venda da economia', async () => {
  const { empacotarDados } = await import('../tools/lib/dados.mjs');
  const p = empacotarDados(RAIZ);
  for (const n of Object.values(p.npcs)) { assert.ok(Array.isArray(n.falas) && n.falas.length >= 1, `${n.id}: falas`); assert.ok(p.dialogos[n.dialogo], `${n.id}: diálogo existe`); if (n.loja) assert.ok(p.lojas[n.loja], `${n.id}: loja existe`); }
  for (const l of Object.values(p.lojas)) for (const it of l.itens) { assert.ok(Number.isInteger(it.preco) && it.preco >= 1, `${l.id}/${it.item}: preço de compra`); assert.ok(it.venda <= it.preco, `${l.id}/${it.item}: venda ≤ compra`); }
});

test('estado serializável: começa com as Coroas iniciais, compra/venda falham sem mudar nada e o estado sobrevive a JSON', () => {
  const d = carregarDados(), jogo = criarEstadoJogo(d, criarEventos());
  assert.equal(jogo.moedas, d.config.economia.coroas_iniciais);
  const antes = JSON.stringify(jogo.estado());
  assert.equal(jogo.alterarMoedas(-(jogo.moedas + 1)), false); assert.equal(jogo.removerItem('item_inexistente', 1), false);
  assert.equal(JSON.stringify(jogo.estado()), antes, 'operação recusada não muda o estado');
  assert.ok(jogo.alterarMoedas(-10)); jogo.adicionarItem('item_pocao_ervas', 2);
  const e = jogo.estado(), volta = JSON.parse(JSON.stringify(e)); assert.deepEqual(volta, e);
  assert.equal(volta.moedas, d.config.economia.coroas_iniciais - 10); assert.equal(volta.inventario.item_pocao_ervas >= 2, true);
});

test('plataforma.menu: abre só quando pode, pausa o relógio, exclusão com outras pausas e fecha sozinho ao sair do mapa', () => {
  const eventos = criarEventos(), motivos = new Set(), pausa = { pausar: (m) => motivos.add(m), retomar: (m) => motivos.delete(m), motivos: () => [...motivos] };
  const mundo = { menu: { aberto: false, podeAbrir: () => true, abrir() { mundo.menu.aberto = true; return true; }, fechar() { mundo.menu.aberto = false; return true; } } };
  const menu = criarMenu({ mundo, pausa, eventos });
  pausa.pausar('loja'); assert.equal(menu.abrir(), false, 'outra pausa bloqueia'); pausa.retomar('loja');
  mundo.menu.podeAbrir = () => false; assert.equal(menu.abrir(), false, 'diálogo/batalha/portal bloqueiam'); mundo.menu.podeAbrir = () => true;
  assert.equal(menu.abrir(), true); assert.deepEqual([...motivos], ['menu']); assert.equal(menu.abrir(), false, 'já aberto');
  assert.equal(menu.alternar(), true); assert.equal(menu.aberto, false); assert.equal(motivos.size, 0, 'pausa solta ao fechar');
  menu.abrir(); eventos.emitir('modo_mudou', { de: 'mapa', para: 'batalha' }); assert.equal(menu.aberto, false); assert.equal(motivos.size, 0);
});
