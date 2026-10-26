// Servidor local.
//   npm run dev      → compila em memória/arquivo (esbuild --watch), serve src/ + data/ + assets/ AO VIVO (editar dado e recarregar basta);
//                      valida os dados ao iniciar e a cada mudança em data/ e assets/. Build de desenvolvimento (debug ligado).
//   npm run preview  → serve build/prod (gerado por `npm run build`), com compressão e cache por hash, como na publicação.
// Uso: node tools/servir.mjs <dev|prod> [--porta=5173]
import { createServer } from 'node:http';
import { createReadStream, statSync, existsSync, watch, mkdirSync, readFileSync } from 'node:fs';
import { join, extname, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createBrotliCompress, createGzip, constants as zc } from 'node:zlib';
import * as esbuild from 'esbuild';
import { opcoesEsbuild, gerarIndex, TIPOS } from './lib/empacotar.mjs';
import { empacotarDados } from './lib/dados.mjs';
import { validarDados } from './validar_dados.mjs';
import { validarAssets } from './validar_assets.mjs';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const modo = process.argv[2] === 'prod' ? 'prod' : 'dev';
const porta = Number((process.argv.find((a) => a.startsWith('--porta=')) ?? '--porta=5173').split('=')[1]);
const COMPRIMIVEL = new Set(['.html', '.js', '.css', '.json']);

function validar() {
  const d = validarDados(RAIZ), a = validarAssets(RAIZ), erros = [...d.erros, ...a.erros];
  if (erros.length) { console.error(`\n✗ ${erros.length} erro(s) de validação:`); for (const e of erros) console.error('  ' + e); } else console.log('✓ dados e assets válidos');
}

let raizEstatica, ctx = null;
if (modo === 'dev') {
  raizEstatica = join(RAIZ, 'build', 'dev'); mkdirSync(raizEstatica, { recursive: true });
  ctx = await esbuild.context(opcoesEsbuild(RAIZ, { dev: true, saida: raizEstatica, nomeJs: 'app.js' }));
  await ctx.watch(); await ctx.rebuild();
  validar();
  let t; const aoMudar = () => { clearTimeout(t); t = setTimeout(validar, 300); };
  for (const dir of ['data', 'assets']) watch(join(RAIZ, dir), { recursive: true }, aoMudar);
} else {
  raizEstatica = join(RAIZ, 'build', 'prod');
  if (!existsSync(join(raizEstatica, 'index.html'))) { console.error('build/prod não existe: rode `npm run build` primeiro.'); process.exit(1); }
}

function enviar(req, res, arquivo, cache) {
  const ext = extname(arquivo), ae = req.headers['accept-encoding'] || '', h = { 'Content-Type': TIPOS[ext] || 'application/octet-stream', 'Cache-Control': cache, 'X-Content-Type-Options': 'nosniff' };
  // Desenvolvimento: sem compressão (localhost). Pré-visualização: brotli em qualidade 5 (a 11, o padrão, leva segundos por requisição).
  if (modo === 'prod' && COMPRIMIVEL.has(ext) && /\bbr\b/.test(ae)) { res.writeHead(200, { ...h, 'Content-Encoding': 'br', Vary: 'Accept-Encoding' }); createReadStream(arquivo).pipe(createBrotliCompress({ params: { [zc.BROTLI_PARAM_QUALITY]: 5 } })).pipe(res); }
  else if (modo === 'prod' && COMPRIMIVEL.has(ext) && /\bgzip\b/.test(ae)) { res.writeHead(200, { ...h, 'Content-Encoding': 'gzip', Vary: 'Accept-Encoding' }); createReadStream(arquivo).pipe(createGzip()).pipe(res); }
  else { res.writeHead(200, { ...h, 'Content-Length': statSync(arquivo).size }); createReadStream(arquivo).pipe(res); }
}

createServer((req, res) => {
  const url = new URL(req.url, 'http://x'); let p = normalize(decodeURIComponent(url.pathname)).replace(/^[/\\]+/, '').replaceAll('\\', '/');
  if (p.includes('..')) { res.writeHead(403).end(); return; }
  if (modo === 'dev') {
    if (p === '' || p === 'index.html') { res.writeHead(200, { 'Content-Type': TIPOS['.html'], 'Cache-Control': 'no-store' }).end(gerarIndex(RAIZ, { js: 'app.js', css: 'estilo.css', manifesto: { dados: 'dados.json', assets: {} } })); return; }
    if (p === 'dados.json') { try { res.writeHead(200, { 'Content-Type': TIPOS['.json'], 'Cache-Control': 'no-store' }).end(JSON.stringify(empacotarDados(RAIZ))); } catch (e) { res.writeHead(500).end(String(e.message)); } return; }
    if (p === 'estilo.css') return enviar(req, res, join(RAIZ, 'src/plataforma/estilo.css'), 'no-store');
    if (p.startsWith('assets/')) { const f = join(RAIZ, p); if (existsSync(f) && statSync(f).isFile()) return enviar(req, res, f, 'no-store'); }
  }
  let f = join(raizEstatica, p || 'index.html');
  try { if (statSync(f).isDirectory()) f = join(f, 'index.html'); statSync(f); } catch { res.writeHead(404).end('404'); return; }
  const hash = /\.[0-9A-Za-z]{8}\.[a-z]+$/.test(f); // arquivos com hash no nome: cache longo; o resto, sem cache
  enviar(req, res, f, modo === 'prod' && hash ? 'public, max-age=31536000, immutable' : 'no-cache');
}).listen(porta, () => console.log(`${modo === 'dev' ? 'desenvolvimento (debug ligado)' : 'pré-visualização da produção'}: http://localhost:${porta}/`));

process.on('SIGINT', async () => { if (ctx) await ctx.dispose(); process.exit(0); });
void readFileSync;
