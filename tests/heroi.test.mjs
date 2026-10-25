// M1-12/13/14a/14b/14e e M1-20: velocidades, diagonal, aceleração/freada, deslize, rampa/escada e percurso — tudo vindo de dados.
import test from 'node:test';
import assert from 'node:assert/strict';
import { novoMundo, entrada, rodar, colocar } from './_util.mjs';
import { quantizar8, direcaoSprite } from '../src/jogo/heroi.js';

const DIRS = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];

test('andar a vel_andar e correr a vel_correr (± 1 %)', () => {
  for (const [correr, esperado] of [[false, 3.5], [true, 6.0]]) {
    const { mundo, dados } = novoMundo();
    assert.equal(esperado, correr ? dados.personagens.hero_principal.movimento.vel_correr : dados.personagens.hero_principal.movimento.vel_andar);
    colocar(mundo, 4.5, 7.5);
    rodar(mundo, 20, entrada({ x: 1, correr })); // acelera
    const x0 = mundo.heroi.x; rodar(mundo, 30, entrada({ x: 1, correr })); // 0,5 s
    const v = (mundo.heroi.x - x0) / 0.5;
    assert.ok(Math.abs(v - esperado) / esperado < 0.01, `${correr ? 'correr' : 'andar'}: ${v}`);
  }
});

test('mudar vel_andar SÓ nos dados muda o comportamento (M1-20)', () => {
  const { mundo } = novoMundo((d) => { d.personagens.hero_principal.movimento.vel_andar = 2.0; });
  colocar(mundo, 4.5, 7.5); rodar(mundo, 20, entrada({ x: 1 }));
  const x0 = mundo.heroi.x; rodar(mundo, 30, entrada({ x: 1 }));
  assert.ok(Math.abs((mundo.heroi.x - x0) / 0.5 - 2.0) < 0.02);
});

test('diagonal normalizada: módulo igual nas 8 direções (andar e correr)', () => {
  for (const correr of [false, true]) for (const [dx, dz] of DIRS) {
    const { mundo } = novoMundo(); colocar(mundo, 10.5, 7.5);
    rodar(mundo, 12, entrada({ x: dx, z: dz, correr }));
    const esperado = correr ? 6.0 : 3.5;
    assert.ok(Math.abs(mundo.heroi.velocidade() - esperado) < 1e-6, `dir (${dx},${dz}) correr=${correr}: ${mundo.heroi.velocidade()}`);
  }
});

test('aceleração em 4 passos e freada em 3 (0,06 s e 0,05 s a 60 Hz)', () => {
  const { mundo } = novoMundo(); colocar(mundo, 4.5, 7.5);
  let n = 0; while (mundo.heroi.velocidade() < 3.5 - 1e-9 && n < 30) { mundo.passo(entrada({ x: 1 })); n++; }
  assert.equal(n, 4, `passos até a velocidade máxima: ${n}`);
  n = 0; while (mundo.heroi.velocidade() > 1e-9 && n < 30) { mundo.passo(entrada()); n++; }
  assert.equal(n, 3, `passos até parar: ${n}`);
});

test('deslize: andar a 45° contra a parede mantém a componente paralela e não atravessa (M1-14a/b)', () => {
  const { mundo } = novoMundo(); colocar(mundo, 14.5, 7.5); // parede solta em z = 9 (x 12–17)
  let encostou = false;
  for (let i = 0; i < 90 && mundo.heroi.x < 17; i++) {   // sudeste até o fim da parede (x = 18 menos o raio)
    mundo.passo(entrada({ x: 1, z: 1 }));
    assert.ok(mundo.heroi.z <= 9 - mundo.heroi.raioPush + 1e-3, `atravessou: z = ${mundo.heroi.z}`);
    if (mundo.heroi.z > 9 - mundo.heroi.raioPush - 0.02) encostou = true;
  }
  assert.ok(encostou, 'deveria ter encostado na parede');
  assert.ok(mundo.heroi.x > 14.5 + 2, `deveria deslizar para leste: x = ${mundo.heroi.x}`);
  assert.ok(mundo.heroi.velocidade() > 2.3, `velocidade paralela perdida: ${mundo.heroi.velocidade()}`);
});

test('nunca atravessa paredes: 2000 passos correndo em direções aleatórias fixas', () => {
  const { mundo } = novoMundo(); colocar(mundo, 10.5, 7.5);
  let s = 12345; const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < 2000; i++) {
    if (i % 25 === 0) { const [dx, dz] = DIRS[Math.floor(rnd() * 8)]; var ent = entrada({ x: dx, z: dz, correr: true }); }
    mundo.passo(ent);
    assert.ok(!mundo.mapa.solidoTile(Math.floor(mundo.heroi.x), Math.floor(mundo.heroi.z)), `dentro de parede em ${mundo.heroi.x}, ${mundo.heroi.z}`);
  }
});

test('subir a rampa: altura 0 → 1 e chega à plataforma; sombra/altura contínuas', () => {
  const { mundo } = novoMundo(); colocar(mundo, 18.5, 4.5);
  let anterior = mundo.heroi.altura, maiorSalto = 0;
  for (let i = 0; i < 200; i++) { mundo.passo(entrada({ x: 1 })); maiorSalto = Math.max(maiorSalto, Math.abs(mundo.heroi.altura - anterior)); anterior = mundo.heroi.altura; }
  assert.ok(mundo.heroi.x > 24.5, `x = ${mundo.heroi.x}`);
  assert.ok(Math.abs(mundo.heroi.altura - 1) < 1e-6, `altura = ${mundo.heroi.altura}`);
  assert.ok(maiorSalto < 0.05, `salto de altura por passo: ${maiorSalto}`);
});

test('borda de plataforma bloqueia (mapa sintético: chão ao lado de plataforma de 1,0)', () => {
  const { mundo } = novoMundo((d) => {
    const m = Object.values(d.mapas)[0];
    // campo: coluna x=8 vira plataforma (z 5–9) sem rampa → degrau de 1,0 entre x=7 e x=8
    for (let z = 5; z <= 9; z++) m.planta[z] = m.planta[z].slice(0, 8) + '^' + m.planta[z].slice(9);
  });
  colocar(mundo, 5.5, 7.5); rodar(mundo, 120, entrada({ x: 1 }));
  assert.ok(mundo.heroi.x <= 8 - mundo.heroi.raioPush + 1e-3, `x = ${mundo.heroi.x}`);
  assert.equal(mundo.heroi.altura, 0);
});

test('percurso da sala: do início ao centro da arena (corredor + porta de 3 tiles), a pé, sem prender (M1-14e)', () => {
  const { mundo } = novoMundo(); const { mapa, heroi } = mundo;
  const L = mapa.largura, A = mapa.altura, idx = (x, z) => z * L + x;
  const [sx, sz] = mapa.dados.inicio_jogador.tile, alvo = [38, 23];
  // BFS em 4 vizinhos com altura contínua na borda entre tiles
  const ant = new Int32Array(L * A).fill(-2); ant[idx(sx, sz)] = -1; const fila = [[sx, sz]];
  for (let k = 0; k < fila.length; k++) {
    const [x, z] = fila[k];
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, nz = z + dz;
      if (!mapa.caminhavel(nx, nz) || ant[idx(nx, nz)] !== -2) continue;
      const ex = dx ? (dx > 0 ? x + 1 : x) : x + 0.5, ez = dz ? (dz > 0 ? z + 1 : z) : z + 0.5, e = 1e-3;
      if (Math.abs(mapa.alturaEm(ex - dx * e, ez - dz * e) - mapa.alturaEm(ex + dx * e, ez + dz * e)) > 0.4) continue;
      ant[idx(nx, nz)] = idx(x, z); fila.push([nx, nz]);
    }
  }
  assert.notEqual(ant[idx(...alvo)], -2, 'arena inalcançável a pé');
  const caminho = []; for (let c = idx(...alvo); c !== -1; c = ant[c]) caminho.unshift([c % L + 0.5, Math.floor(c / L) + 0.5]);
  // segue o caminho com entrada contínua (como um jogador): vai ao próximo ponto quando chega perto
  let i = 1, passos = 0;
  while (i < caminho.length && passos < 60 * 40) {
    const [px, pz] = caminho[i], dx = px - heroi.x, dz = pz - heroi.z;
    if (Math.hypot(dx, dz) < 0.3) { i++; continue; }
    mundo.passo(entrada({ x: dx, z: dz, correr: true })); passos++;
  }
  assert.equal(i, caminho.length, `preso no ponto ${i}/${caminho.length} (${heroi.x.toFixed(2)}, ${heroi.z.toFixed(2)}) em ${passos} passos`);
  assert.ok(passos / 60 < 25, `demorou ${passos / 60} s`);
  assert.ok(mapa.zonaDe(heroi.x, heroi.z).includes('z_arena'));
});

test('quantização em 8 direções e direção do sprite', () => {
  assert.equal(quantizar8(1, 0), 0); assert.equal(quantizar8(0.1, 1), 2); assert.equal(quantizar8(-1, -0.2), 4); assert.equal(quantizar8(0, -1), 6);
  assert.deepEqual([0, 2, 4, 6].map(direcaoSprite), ['l', 's', 'o', 'n']);
});
