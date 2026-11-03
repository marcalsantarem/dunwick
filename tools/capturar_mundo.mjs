// Capturas do mapa de mundo (v0.1.3b, 07): entra no mundo pelo portal sul da vila e fotografa trechos, no Chrome real. Grava em docs/arte/mundo/.
// Uso: node tools/capturar_mundo.mjs [--janela=1280x720] [--cromo=<chrome.exe>] [--ppu=24] [--pontos=nome:x:z,nome:x:z] [--perfil=perfil_alto]
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (n, p) => { const a = process.argv.find((x) => x.startsWith(`--${n}=`)); return a ? a.slice(n.length + 3) : p; };
const [JW, JH] = arg('janela', '1280x720').split('x').map(Number), PORTA = 5190, PPU = Number(arg('ppu', 0)), PERFIL = arg('perfil', 'perfil_alto');
const FPS = process.argv.includes('--fps'), PONTOS = arg('pontos', 'vila:20:33,bosque:10:18,caverna:33:11,costa:38:24,montanha:8:10').split(',').map((s) => s.split(':'));
const CROMO = arg('cromo', process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe');
const SAIDA = join(RAIZ, 'docs', 'arte', 'mundo'); mkdirSync(SAIDA, { recursive: true });
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

const servidor = spawn(process.execPath, [join(RAIZ, 'tools/servir.mjs'), 'dev', `--porta=${PORTA}`], { cwd: RAIZ, stdio: ['ignore', 'pipe', 'pipe'] });
let saida = ''; servidor.stdout.on('data', (d) => { saida += d; }); servidor.stderr.on('data', (d) => { saida += d; });
for (let i = 0; i < 100 && !saida.includes('http://localhost'); i++) await dormir(100);
if (!saida.includes('http://localhost')) { console.error('servidor não subiu:\n' + saida); servidor.kill(); process.exit(1); }
const navegador = await puppeteer.launch({ executablePath: CROMO, headless: 'new', args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-gpu-rasterization', `--window-size=${JW},${JH}`], defaultViewport: { width: JW, height: JH } });
async function medirFps() { // FPS do mundo nos 3 perfis: 6 s de quadros por perfil, parado no centro da vila e depois andando
  for (const perfil of ['perfil_alto', 'perfil_medio', 'perfil_baixo']) {
    const q = await navegador.newPage(); await q.goto(`http://localhost:${PORTA}/?hora=12&perfil=${perfil}`); await q.waitForFunction('window.__dunwick && window.__dunwick.mundo', { timeout: 60000 });
    await q.evaluate(() => { const h = __dunwick.mundo.heroi; h.x = h.ox = 47; h.z = h.oz = 77.5; h.destino = { x: 47, z: 80.5 }; }); await dormir(6000);
    const r = await q.evaluate(() => new Promise((res) => { const t = []; let u = performance.now(); const f = (n) => { t.push(n - u); u = n; if (t.length < 360) requestAnimationFrame(f); else { t.shift(); t.sort((a, b) => a - b); const m = t.reduce((a, b) => a + b, 0) / t.length, p99 = t[Math.floor(t.length * 0.99)]; res({ mapa: __dunwick.mundo.mapaId, fps: 1000 / m, pior1: 1000 / p99, perfil: __dunwick.perfilAtual() }); } }; requestAnimationFrame(f); }));
    console.log(perfil, JSON.stringify(r)); await q.close();
  }
}
const erros = [], p = await navegador.newPage();
if (PPU) { await p.setRequestInterception(true); p.on('request', async (r) => { if (r.url().endsWith('/dados.json')) { const d = await (await fetch(r.url())).json(); d.config.mundo.camera.pixels_por_unidade = PPU; r.respond({ contentType: 'application/json', body: JSON.stringify(d) }); } else r.continue(); }); } // só para a captura: aproxima a câmera
p.on('pageerror', (e) => erros.push(String(e))); p.on('console', (m) => { if (m.type() === 'error') erros.push(m.text()); });
if (FPS) { await medirFps(); await navegador.close(); servidor.kill(); process.exit(0); }
await p.goto(`http://localhost:${PORTA}/?hora=12&perfil=${PERFIL}`); await p.waitForFunction('window.__dunwick && window.__dunwick.mundo', { timeout: 60000 });
const ir = (x, z) => p.evaluate(([x, z]) => { const m = __dunwick.mundo, h = m.heroi, c = m.camera; h.x = h.ox = x; h.z = h.oz = z; h.destino = null; c.x = c.ox = x; c.z = c.oz = z; }, [x, z]);
await ir(47, 77.5); await p.evaluate(() => { __dunwick.mundo.heroi.destino = { x: 47, z: 80.5 }; }); await dormir(5000); // portal sul da vila → mundo
for (let i = 0; i < 20 && (await p.evaluate(() => __dunwick.mundo.mapaId)) !== 'map_mundo_orvalho'; i++) await dormir(500);
await dormir(2500); await p.evaluate(() => { const d = document.getElementById('debug'); if (d) d.style.display = 'none'; });
console.log('mapa:', await p.evaluate(() => __dunwick.mundo.mapaId));
for (const [nome, x, z] of PONTOS) { await ir(Number(x), Number(z)); await dormir(1200); await p.screenshot({ path: join(SAIDA, `mundo_${nome}.png`) }); console.log('✓', nome); }
console.log(erros.length ? `erros (${erros.length}):\n` + [...new Set(erros)].slice(0, 8).join('\n') : 'console limpo');
await navegador.close(); servidor.kill(); process.exit(erros.length ? 1 : 0);
