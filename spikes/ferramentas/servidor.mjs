// Servidor estático mínimo para os spikes. Uso: node ferramentas/servidor.mjs [porta]  -> http://localhost:8080/three/?spike=diorama&perfil=alto
import { createServer } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { join, extname, normalize } from 'node:path';
import { createGzip, createBrotliCompress } from 'node:zlib';
const RAIZ = process.cwd(), PORTA = Number(process.argv[2] || 8080);
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.ogg': 'audio/ogg', '.webm': 'audio/webm', '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.wav': 'audio/wav' };
const COMPRIMIVEL = new Set(['.html', '.js', '.json']);
createServer((req, res) => {
  const url = new URL(req.url, 'http://x'); let p = normalize(decodeURIComponent(url.pathname)).replace(/^[/\\]+/, '');
  if (p.includes('..')) { res.writeHead(403).end(); return; }
  let f = join(RAIZ, p);
  try { if (statSync(f).isDirectory()) f = join(f, 'index.html'); statSync(f); } catch { res.writeHead(404).end('404'); return; }
  const ext = extname(f), h = { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': 'no-store' };
  const ae = req.headers['accept-encoding'] || '';
  if (COMPRIMIVEL.has(ext) && /br/.test(ae)) { res.writeHead(200, { ...h, 'Content-Encoding': 'br' }); createReadStream(f).pipe(createBrotliCompress()).pipe(res); }
  else if (COMPRIMIVEL.has(ext) && /gzip/.test(ae)) { res.writeHead(200, { ...h, 'Content-Encoding': 'gzip' }); createReadStream(f).pipe(createGzip()).pipe(res); }
  else { res.writeHead(200, { ...h, 'Content-Length': statSync(f).size }); createReadStream(f).pipe(res); }
}).listen(PORTA, () => console.log(`spikes em http://localhost:${PORTA}/`));
