// Build de produção: validar dados → validar assets → testes → empacotar → relatório de peso (08 §11).
// Saída em build/prod (JS, CSS, dados e assets com hash no nome; index sem cache longo). Falha se o orçamento (cfg_orcamento) for excedido.
// Uso: npm run build [-- --sem-testes]
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, mkdirSync, readFileSync, writeFileSync, readdirSync, statSync, rmSync } from 'node:fs';
import { join, dirname, extname, relative, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { brotliCompressSync, gzipSync } from 'node:zlib';
import * as esbuild from 'esbuild';
import { opcoesEsbuild, gerarIndex } from './lib/empacotar.mjs';
import { empacotarDados } from './lib/dados.mjs';
import { validarDados } from './validar_dados.mjs';
import { validarAssets } from './validar_assets.mjs';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..'), SAIDA = join(RAIZ, 'build', 'prod');
const semTestes = process.argv.includes('--sem-testes');
const etapa = (n, nome) => console.log(`\n[${n}/5] ${nome}`);
const falhar = (msg) => { console.error(`\n✗ build falhou: ${msg}`); process.exit(1); };
const hash8 = (buf) => createHash('sha256').update(buf).digest('hex').slice(0, 8);
const comHash = (nome, buf) => `${nome.slice(0, nome.length - extname(nome).length)}.${hash8(buf)}${extname(nome)}`;

// ---- 1. validar dados ----
etapa(1, 'validar dados');
const vd = validarDados(RAIZ); for (const a of vd.avisos) console.warn('  aviso:', a);
if (vd.erros.length) { for (const e of vd.erros) console.error('  ' + e); falhar(`${vd.erros.length} erro(s) nos dados`); }
console.log(`  ✓ ${vd.arquivos} arquivos de dados válidos`);
// ---- 2. validar assets ----
etapa(2, 'validar assets');
const va = validarAssets(RAIZ); for (const a of va.avisos) console.warn('  aviso:', a);
if (va.erros.length) { for (const e of va.erros) console.error('  ' + e); falhar(`${va.erros.length} erro(s) nos assets`); }
console.log(`  ✓ ${va.sprites} sprites, atlas, fx e áudio válidos`);
// ---- 3. testes ----
etapa(3, 'testes automáticos');
if (semTestes) console.log('  (pulado: --sem-testes)');
else { try { execFileSync(process.execPath, ['--test', 'tests/*.test.mjs'], { cwd: RAIZ, stdio: 'inherit' }); } catch { falhar('testes falharam'); } }
// ---- 4. empacotar ----
etapa(4, 'empacotar');
rmSync(SAIDA, { recursive: true, force: true }); mkdirSync(SAIDA, { recursive: true });
const tmpJs = join(SAIDA, '_app.js');
await esbuild.build(opcoesEsbuild(RAIZ, { dev: false, saida: SAIDA, nomeJs: '_app.js' }));
const js = readFileSync(tmpJs); rmSync(tmpJs);
const nomeJs = comHash('app.js', js); writeFileSync(join(SAIDA, nomeJs), js);
const css = readFileSync(join(RAIZ, 'src/plataforma/estilo.css')), nomeCss = comHash('estilo.css', css); writeFileSync(join(SAIDA, nomeCss), css);
const dadosJson = Buffer.from(JSON.stringify(empacotarDados(RAIZ))), nomeDados = comHash('dados.json', dadosJson); writeFileSync(join(SAIDA, nomeDados), dadosJson);
const assets = {}; // caminho relativo (sprites/x/x.png) → URL com hash
const percorrer = (dir) => readdirSync(dir).flatMap((n) => { const c = join(dir, n); return statSync(c).isDirectory() ? percorrer(c) : [c]; });
for (const arq of percorrer(join(RAIZ, 'assets'))) {
  const rel = relative(join(RAIZ, 'assets'), arq).replaceAll('\\', '/'), buf = readFileSync(arq), alvo = `assets/${comHash(rel, buf)}`;
  mkdirSync(dirname(join(SAIDA, alvo)), { recursive: true }); writeFileSync(join(SAIDA, alvo), buf); assets[rel] = alvo;
}
const manifesto = { dados: nomeDados, assets };
const index = gerarIndex(RAIZ, { js: nomeJs, css: nomeCss, manifesto }); writeFileSync(join(SAIDA, 'index.html'), index);
writeFileSync(join(SAIDA, 'manifesto.json'), JSON.stringify(manifesto, null, 1));
console.log(`  ✓ build/prod: ${nomeJs}, ${nomeCss}, ${nomeDados}, ${Object.keys(assets).length} assets`);

// ---- 5. relatório de peso ----
etapa(5, 'relatório de peso');
const orc = empacotarDados(RAIZ).config.orcamento, kb = (n) => +(n / 1024).toFixed(1);
const comprimido = (buf, ext) => (['.js', '.css', '.json', '.html'].includes(ext) ? brotliCompressSync(buf).length : buf.length); // PNG/WAV/OGG já vão como estão
const linhas = [];
const somar = (nome, buf, ext = extname(nome)) => { const t = { nome, bruto: buf.length, transferido: comprimido(buf, ext), gzip: ['.js', '.css', '.json', '.html'].includes(ext) ? gzipSync(buf).length : buf.length }; linhas.push(t); return t; };
somar('index.html', Buffer.from(index)); somar(nomeJs, js); somar(nomeCss, css); somar(nomeDados, dadosJson);
const porArea = {}; const porEntidade = {};
for (const [rel, url] of Object.entries(assets)) {
  const buf = readFileSync(join(SAIDA, url)), t = somar(rel, buf), area = rel.split('/')[0]; porArea[area] = (porArea[area] ?? 0) + t.transferido;
  if (area === 'sprites') { const id = rel.split('/')[1]; porEntidade[id] = (porEntidade[id] ?? 0) + t.transferido; }
}
const soma = (f) => linhas.filter(f).reduce((s, l) => s + l.transferido, 0);
const total = soma(() => true), codigo = soma((l) => l.nome === nomeJs || l.nome === nomeCss || l.nome === 'index.html'), dadosBytes = soma((l) => l.nome === nomeDados), audio = porArea.audio ?? 0;
const rel = {
  gerado_em: new Date().toISOString(), observacao: 'Peso transferido: brotli para texto (js/css/json/html), tal qual para PNG/WAV. No M1 todos os assets contam como download inicial.',
  download_inicial_kb: kb(total), codigo_brotli_kb: kb(codigo), js_bruto_kb: kb(js.length), dados_kb: kb(dadosBytes), audio_kb: kb(audio),
  por_area_kb: Object.fromEntries(Object.entries(porArea).map(([k, v]) => [k, kb(v)])), por_entidade_kb: Object.fromEntries(Object.entries(porEntidade).map(([k, v]) => [k, kb(v)])),
  orcamento: orc, arquivos: linhas.map((l) => ({ arquivo: l.nome, bruto_kb: kb(l.bruto), transferido_kb: kb(l.transferido) })),
};
writeFileSync(join(RAIZ, 'build', 'relatorio_peso.json'), JSON.stringify(rel, null, 1));
const md = [`# Relatório de peso — ${rel.gerado_em}`, '', `**Download inicial: ${rel.download_inicial_kb} KB** (orçamento ${orc.download_inicial_mb * 1024} KB) · código ${rel.codigo_brotli_kb} KB brotli (JS bruto ${rel.js_bruto_kb} KB) · dados ${rel.dados_kb} KB · áudio ${rel.audio_kb} KB`, '', '| Área | KB |', '|---|---|', ...Object.entries(rel.por_area_kb).map(([k, v]) => `| ${k} | ${v} |`), '', '| Entidade (sprites) | KB |', '|---|---|', ...Object.entries(rel.por_entidade_kb).map(([k, v]) => `| ${k} | ${v} |`), '', '| Arquivo | bruto KB | transferido KB |', '|---|---|---|', ...rel.arquivos.map((a) => `| ${a.arquivo} | ${a.bruto_kb} | ${a.transferido_kb} |`), ''].join('\n');
writeFileSync(join(RAIZ, 'build', 'relatorio_peso.md'), md);
console.log(`  download inicial ${rel.download_inicial_kb} KB · código ${rel.codigo_brotli_kb} KB (brotli) · dados ${rel.dados_kb} KB · áudio ${rel.audio_kb} KB`);
console.log('  por área (KB):', JSON.stringify(rel.por_area_kb), ' por entidade (KB):', JSON.stringify(rel.por_entidade_kb));
const estouros = [];
if (total > orc.download_inicial_mb * 1048576) estouros.push(`download inicial ${kb(total)} KB > ${orc.download_inicial_mb} MB`);
if (audio > orc.audio_inicial_mb * 1048576) estouros.push(`áudio inicial ${kb(audio)} KB > ${orc.audio_inicial_mb} MB`);
if (codigo > orc.codigo_brotli_kb * 1024) estouros.push(`código ${kb(codigo)} KB brotli > ${orc.codigo_brotli_kb} KB`);
if (dadosBytes > orc.dados_kb * 1024) estouros.push(`dados ${kb(dadosBytes)} KB > ${orc.dados_kb} KB`);
for (const [id, v] of Object.entries(porEntidade)) if (v > orc.por_entidade_kb * 1024) estouros.push(`entidade ${id}: ${kb(v)} KB > ${orc.por_entidade_kb} KB`);
if (estouros.length) falhar(`orçamento de peso estourado:\n  - ${estouros.join('\n  - ')}`);
console.log(`\n✓ build ok → build/prod (relatório em build/relatorio_peso.md)`);
void basename;
