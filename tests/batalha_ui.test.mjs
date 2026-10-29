// Ritmo da UI de batalha (parte pura): o reprodutor toca a fila no tempo dos eventos e só libera o próximo passo vazio.
import test from 'node:test';
import assert from 'node:assert/strict';
import { carregarDados } from './_util.mjs';
import { criarControladorBatalha } from '../src/jogo/batalha/controlador.js';
import { decidirSimples } from '../src/jogo/batalha/politica.js';
import { criarReprodutor, alvosValidos, alvoInicial, posicionarRotulos } from '../src/ui/batalha_fila.js';

test('ato_executado segura os resultados até impacto_s e o próximo ato até o fim da duração + intervalo', () => {
  const aplicados = [];
  const rep = criarReprodutor({ aplicar: (ev) => { aplicados.push(ev.nome); } });
  rep.adicionar([
    { nome: 'turno_iniciou' },
    { nome: 'ato_executado', duracao_real_s: 1, impacto_s: 0.4, intervalo_s: 0.2 },
    { nome: 'dano' }, { nome: 'vida_mudou' },
    { nome: 'turno_iniciou' },
  ]);
  rep.avancar(0);
  assert.deepEqual(aplicados, ['turno_iniciou', 'ato_executado']);
  rep.avancar(0.39); assert.equal(aplicados.length, 2);
  rep.avancar(0.02); assert.deepEqual(aplicados.slice(2), ['dano', 'vida_mudou']);
  rep.avancar(0.7); assert.equal(aplicados.length, 4, 'resto do ato (0,6) + intervalo (0,2) ainda não passou');
  rep.avancar(0.1); assert.equal(aplicados.length, 5);
  assert.equal(rep.ocupado, false);
});

test('espera externa (cena) segura o próximo evento', () => {
  let cenaOcupada = true; const aplicados = [];
  const rep = criarReprodutor({ aplicar: (ev) => { aplicados.push(ev.nome); }, esperaExterna: () => cenaOcupada });
  rep.adicionar([{ nome: 'rodada_iniciou' }]);
  rep.avancar(5); assert.equal(aplicados.length, 0); assert.equal(rep.ocupado, true);
  cenaOcupada = false; rep.avancar(0); assert.deepEqual(aplicados, ['rodada_iniciou']);
});

test('batalha inteira pelo roteiro da UI: executar() só com a fila tocada; termina com resultado', () => {
  const d = carregarDados(), c = criarControladorBatalha(d, { encontro: 'enc_misto_1', semente: 7 }); c.iniciar();
  let tocando = 0, rodadas = 0;
  const rep = criarReprodutor({ aplicar: () => { tocando += 1; } });
  rep.adicionar(c.esvaziarFila());
  for (let q = 0; q < 100000 && !c.fim; q++) {
    rep.avancar(1 / 60);
    if (rep.ocupado) continue;
    const s = c.consultar();
    if (s.vez) { const r = c.enviarComando({ ator: s.vez, ...decidirSimples(c, d, s.vez) }); assert.equal(r.ok, true); rep.adicionar(c.esvaziarFila()); }
    else if (c.pronto) { assert.equal(rep.ocupado, false); c.executar(); rodadas += 1; rep.adicionar(c.esvaziarFila()); }
  }
  assert.equal(c.fim, true); assert.ok(rodadas > 0); assert.ok(tocando > 10);
});

test('alvos válidos e foco inicial (inimigo de menor slot; cura no aliado de menor fração)', () => {
  const atores = [
    { uid: 'a', lado: 'grupo', slot: 1, vida: 90, vida_max: 100, caido: false },
    { uid: 'b', lado: 'grupo', slot: 2, vida: 20, vida_max: 70, caido: false },
    { uid: 'x', lado: 'inimigos', slot: 2, vida: 5, vida_max: 70, caido: false },
    { uid: 'y', lado: 'inimigos', slot: 1, vida: 0, vida_max: 90, caido: true },
    { uid: 'z', lado: 'inimigos', slot: 3, vida: 9, vida_max: 9, caido: false },
  ];
  assert.deepEqual(alvosValidos(atores, 'inimigo_1', 'a').map((a) => a.uid), ['x', 'z']);
  assert.equal(alvoInicial(alvosValidos(atores, 'inimigo_1', 'a'), 'inimigo_1'), 'x');
  assert.equal(alvoInicial(alvosValidos(atores, 'aliado_1', 'a'), 'aliado_1'), 'b');
  assert.deepEqual(alvosValidos(atores, 'si', 'b').map((a) => a.uid), ['b']);
});

test('dano, cura e vida aparecem no impacto do ato (não no fim da rodada), na ordem do controlador', () => {
  const d = carregarDados(), c = criarControladorBatalha(d, { encontro: 'enc_misto_1', semente: 3 }); c.iniciar();
  const dt = 1 / 120; let agora = 0, ato = null; const vistos = [], ordem = [];
  const rep = criarReprodutor({ aplicar: (ev) => {
    ordem.push(ev.nome);
    if (ev.nome === 'ato_executado') ato = { t: agora, ev };
    if (['dano', 'curou', 'vida_mudou', 'caiu'].includes(ev.nome) && ato) vistos.push({ nome: ev.nome, atraso: agora - ato.t, impacto: ato.ev.impacto_s });
  } });
  rep.adicionar(c.esvaziarFila()); const esperado = [];
  for (let q = 0; q < 200000 && !(c.fim && !rep.ocupado); q++) {
    rep.avancar(dt); agora += dt;
    if (rep.ocupado) continue;
    const s = c.consultar();
    if (s.vez) c.enviarComando({ ator: s.vez, ...decidirSimples(c, d, s.vez) });
    else if (c.pronto) c.executar();
    const novos = c.esvaziarFila(); esperado.push(...novos.map((e) => e.nome)); rep.adicionar(novos);
  }
  assert.ok(vistos.some((v) => v.nome === 'dano'));
  for (const v of vistos) assert.ok(Math.abs(v.atraso - v.impacto) <= dt + 1e-9, `${v.nome} veio ${v.atraso.toFixed(3)} s depois do início do ato (impacto ${v.impacto.toFixed(3)} s)`);
  assert.deepEqual(ordem.slice(-esperado.length), esperado, 'a UI toca os eventos na mesma ordem do controlador');
});

// projeção parecida com a da cena de batalha (eixo x na horizontal, profundidade z encurtada), em px da camada 1280×720
const PPU = 60, proj = ([x, z]) => ({ x: 640 + x * PPU, y: 470 + z * PPU * 0.5 });
const corposDe = (posicoes) => posicoes.map(({ uid, p, lado }) => { const pes = proj(p); return { uid, x: pes.x, y0: pes.y - 2 * PPU, y1: pes.y, w: 0.9 * PPU, lado }; });
const colide = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const AREA = { w: 1280, h: 720 }, ROT = { w: 120, h: 40 };
function conferir(corpos, uids) {
  const lugar = posicionarRotulos(corpos, uids.map((uid) => ({ uid, ...ROT })), AREA), rets = uids.map((uid) => ({ uid, ...lugar[uid], ...ROT }));
  for (const r of rets) {
    assert.ok(r.x >= 0 && r.y >= 0 && r.x + r.w <= AREA.w && r.y + r.h <= AREA.h, `${r.uid} fora da tela`);
    for (const o of rets) if (o !== r) assert.ok(!colide(r, o), `rótulos de ${r.uid} e ${o.uid} se sobrepõem`);
    for (const c of corpos) if (c.uid !== r.uid) assert.ok(!colide(r, { x: c.x - c.w / 2, y: c.y0, w: c.w, h: c.y1 - c.y0 }), `rótulo de ${r.uid} cobre o sprite de ${c.uid}`);
    const dono = corpos.find((c) => c.uid === r.uid);
    assert.ok(Math.abs(r.x + r.w / 2 - dono.x) <= r.w + dono.w, `rótulo de ${r.uid} longe do seu sprite`);
  }
  return lugar;
}

test('rótulos: 1 inimigo → acima da cabeça, centrado, sem cobrir o sprite', () => {
  const d = carregarDados(), P = d.config.batalha.posicoes;
  const corpos = corposDe([{ uid: 'lobo', p: P.inimigos[0], lado: -1 }, { uid: 'edric', p: P.grupo[0], lado: 1 }, { uid: 'grace', p: P.grupo[1], lado: 1 }]);
  const l = conferir(corpos, ['lobo']), c = corpos[0];
  assert.ok(l.lobo.y + ROT.h <= c.y0, 'acima da cabeça'); assert.ok(Math.abs(l.lobo.x + ROT.w / 2 - c.x) < 1, 'centrado no sprite');
});

test('rótulos: 2 inimigos (encontro misto) e o grupo inteiro em alvo de cura → nada se sobrepõe', () => {
  const d = carregarDados(), P = d.config.batalha.posicoes;
  const corpos = corposDe([
    { uid: 'lobo', p: P.inimigos[0], lado: -1 }, { uid: 'slime', p: P.inimigos[1], lado: -1 },
    { uid: 'edric', p: P.grupo[0], lado: 1 }, { uid: 'grace', p: P.grupo[1], lado: 1 },
  ]);
  conferir(corpos, ['lobo']); conferir(corpos, ['slime']); conferir(corpos, ['lobo', 'slime']); conferir(corpos, ['edric', 'grace']);
});
