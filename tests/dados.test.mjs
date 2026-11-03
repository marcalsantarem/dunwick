// M1-20/M1-21: o validador aceita os dados reais e RECUSA dado inválido apontando arquivo e campo; assets validam.
import test from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { RAIZ } from './_util.mjs';
import { validarDados } from '../tools/validar_dados.mjs';
import { validarAssets } from '../tools/validar_assets.mjs';

function copiaComEdicao(arquivoRel, editar) {
  const tmp = mkdtempSync(join(tmpdir(), 'dunwick-'));
  cpSync(join(RAIZ, 'data'), join(tmp, 'data'), { recursive: true }); cpSync(join(RAIZ, 'assets'), join(tmp, 'assets'), { recursive: true });
  const p = join(tmp, 'data', arquivoRel), obj = JSON.parse(readFileSync(p, 'utf8')); editar(obj); writeFileSync(p, JSON.stringify(obj));
  return tmp;
}

test('dados reais: 0 erros', () => { const r = validarDados(RAIZ); assert.deepEqual(r.erros, []); assert.ok(r.arquivos >= 11); });
test('assets reais: 0 erros', () => { const r = validarAssets(RAIZ); assert.deepEqual(r.erros, []); assert.equal(r.sprites, 7); });

test('texto no lugar de número: erro com arquivo e campo (M1-21)', () => {
  const tmp = copiaComEdicao('characters/hero_edric.json', (o) => { o.movimento.vel_andar = 'rápido'; });
  const { erros } = validarDados(tmp); rmSync(tmp, { recursive: true });
  assert.ok(erros.some((e) => e.includes('data/characters/hero_edric.json') && e.includes('/movimento/vel_andar')), erros.join('\n'));
});

test('campo desconhecido, id diferente do arquivo e referência quebrada são recusados', () => {
  let tmp = copiaComEdicao('config/cfg_jogo.json', (o) => { o.numero_magico = 7; });
  assert.ok(validarDados(tmp).erros.some((e) => e.includes('cfg_jogo.json') && e.includes('numero_magico'))); rmSync(tmp, { recursive: true });
  tmp = copiaComEdicao('enemies/enemy_boneco_alvo.json', (o) => { o.sprite = 'enemy_que_nao_existe'; });
  assert.ok(validarDados(tmp).erros.some((e) => e.includes('enemy_boneco_alvo.json') && e.includes('enemy_que_nao_existe'))); rmSync(tmp, { recursive: true });
  tmp = copiaComEdicao('maps/map_baixo_orvalho.json', (o) => { o.nome_txt = 'txt_nao_existe'; o.objetos.push({ id: 'enemy_fantasma', tipo: 'inimigo', x: 5, z: 5 }); });
  const e = validarDados(tmp).erros.join('\n'); rmSync(tmp, { recursive: true });
  assert.ok(e.includes('txt_nao_existe') && e.includes('enemy_fantasma'), e);
});

test('aviso do boneco abaixo do mínimo comum (18 quadros) é recusado', () => {
  const tmp = copiaComEdicao('enemies/enemy_boneco_golpe.json', (o) => { o.golpe.aviso_quadros = 10; });
  const { erros } = validarDados(tmp); rmSync(tmp, { recursive: true });
  assert.ok(erros.some((e) => e.includes('/golpe/aviso_quadros') && e.includes('18')), erros.join('\n'));
});

test('ataque do herói que estica a animação demais, e tipo de objeto sem pegada no kit, são recusados', () => {
  let tmp = copiaComEdicao('characters/hero_edric.json', (o) => { o.ataques[0].quadros = { preparacao: 30, ativo: 20, recuperacao: 20 }; });
  assert.ok(validarDados(tmp).erros.some((e) => e.includes('/ataques/0/quadros') && e.includes('estica'))); rmSync(tmp, { recursive: true });
  tmp = copiaComEdicao('config/cfg_kit.json', (o) => { delete o.pegadas.poco; });
  assert.ok(validarDados(tmp).erros.some((e) => e.includes('"poco"') && e.includes('pegada'))); rmSync(tmp, { recursive: true });
});

test('tecla repetida no mesmo contexto e F5/F11 no debug são recusadas', () => {
  const tmp = copiaComEdicao('config/cfg_entrada.json', (o) => { o.acoes.item.teclado.push('KeyJ'); o.debug.debug_perfil.teclado = ['F5']; });
  const e = validarDados(tmp).erros.join('\n'); rmSync(tmp, { recursive: true });
  assert.ok(e.includes('"KeyJ"') && e.includes('F5'), e);
});

test('planta com caractere fora da legenda ou tamanho errado é recusada', () => {
  const tmp = copiaComEdicao('maps/map_baixo_orvalho.json', (o) => { o.planta[5] = o.planta[5].slice(0, 10) + '?' + o.planta[5].slice(11); o.planta.pop(); });
  const e = validarDados(tmp).erros.join('\n'); rmSync(tmp, { recursive: true });
  assert.ok(e.includes('"?"') && e.includes('93 linhas'), e);
});
