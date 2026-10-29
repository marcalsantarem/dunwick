// Clique real do mouse no boneco de treino (v0.1.2b): andar até ele e abrir a batalha, sem teclado. Uso: node tools/testar_clique_boneco.mjs [--porta=5197]
import { spawn } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (n, p) => { const a = process.argv.find((x) => x.startsWith(`--${n}=`)); return a ? a.slice(n.length + 3) : p; };
const PORTA = Number(arg('porta', 5197)), CROMO = arg('cromo', process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe');
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const srv = spawn(process.execPath, [join(RAIZ, 'tools/servir.mjs'), 'dev', `--porta=${PORTA}`], { cwd: RAIZ, stdio: ['ignore', 'pipe', 'pipe'] });
let log = ''; srv.stdout.on('data', (d) => { log += d; }); srv.stderr.on('data', (d) => { log += d; });
for (let i = 0; i < 100 && !log.includes('http://localhost'); i++) await dormir(100);
const nav = await puppeteer.launch({ executablePath: CROMO, headless: 'new', args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'], defaultViewport: { width: 1280, height: 720 } });
let ok = false;
try {
  const p = await nav.newPage(); await p.goto(`http://localhost:${PORTA}/?hora=13`); await p.waitForFunction('document.documentElement.dataset.pronto === "1"', { timeout: 30000 });
  await p.evaluate(() => { document.getElementById('debug')?.remove(); const b = __dunwick.mundo.mapa.dados.pois.find((q) => q.id === 'boneco_treino'); const h = __dunwick.mundo.heroi; h.x = b.x - 3; h.z = b.z; });
  await dormir(1500);
  const alvo = await p.evaluate(() => { const b = __dunwick.mundo.mapa.dados.pois.find((q) => q.id === 'boneco_treino'); return __dunwick.mundoParaTela(b.x, 0.8, b.z); });
  await p.evaluate(() => { window.__ev = []; for (const n of ['interagiu','treino_iniciado','portal_usado']) __dunwick.mundo.eventos.em(n, (d) => __ev.push(n)); });
  await p.mouse.move(alvo.x, alvo.y); await dormir(300);
  const sob = await p.evaluate(() => JSON.stringify(__dunwick.atualizarCursor()));
  await p.mouse.click(alvo.x, alvo.y); console.log('cfg', await p.evaluate(() => JSON.stringify(__dunwick.mundo.dados.config.exploracao)), 'heroi', await p.evaluate(() => JSON.stringify([__dunwick.mundo.heroi.x, __dunwick.mundo.heroi.z])), 'alvo', JSON.stringify(alvo)); await dormir(100); (0, console.log)('eventos', JSON.stringify(await p.evaluate(() => __ev)), 'intencao', JSON.stringify(await p.evaluate(() => __dunwick.mundo.portais.intencao)), 'dest', JSON.stringify(await p.evaluate(() => __dunwick.mundo.heroi.destino))); await dormir(1400); console.log(JSON.stringify(await p.evaluate(() => { const h = __dunwick.mundo.heroi; return { x: h.x, z: h.z, dest: h.destino, rota: h.rota?.length, modo: __dunwick.jogo.modo, tela: document.querySelector('.inicio, .tela-inicio')?.className ?? null, cur: __dunwick.atualizarCursor() }; })));
  await p.waitForFunction('__dunwick.jogo.modo === "batalha"', { timeout: 15000 });
  ok = true; console.log('✓ clique no boneco abre a batalha de treino (alvoSob sob o cursor:', sob, ')');
} catch (e) { console.log('✗ clique no boneco não abriu a batalha:', e.message); }
await nav.close(); srv.kill(); process.exit(ok ? 0 : 1);
