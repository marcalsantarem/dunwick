// Ritmo da UI de batalha (parte pura): o reprodutor toca a fila no tempo dos eventos e só libera o próximo passo vazio.
import test from 'node:test';
import assert from 'node:assert/strict';
import { carregarDados } from './_util.mjs';
import { criarControladorBatalha } from '../src/jogo/batalha/controlador.js';
import { decidirSimples } from '../src/jogo/batalha/politica.js';
import { criarReprodutor, alvosValidos, alvoInicial } from '../src/ui/batalha_fila.js';

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
