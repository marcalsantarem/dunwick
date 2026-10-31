// Medição de fps na vila inteira (Chrome real): 60 s andando por 5 trechos (praça, mata, canto sudeste, fora da casa do Edric, dentro dela)
// em cada perfil (Alto/Médio/Baixo) e janela (1280×720, 1920×1080). Reporta média, pior 1 %, chamadas de desenho, triângulos e memória.
// Uso: node tools/medir_vila.mjs [--seg=60] [--perfis=perfil_alto,perfil_medio,perfil_baixo] [--janelas=1280x720,1920x1080] [--porta=5195]
import { spawn } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (n, p) => { const a = process.argv.find((x) => x.startsWith(`--${n}=`)); return a ? a.slice(n.length + 3) : p; };
const PORTA = Number(arg('porta', 5195)), SEG = Number(arg('seg', 60)), CROMO = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PERFIS = arg('perfis', 'perfil_alto,perfil_medio,perfil_baixo').split(','), JANELAS = arg('janelas', '1280x720,1920x1080').split(',').map((s) => s.split('x').map(Number));
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const TRECHOS = [['praça', 47, 51], ['mata', 15, 60], ['canto sudeste', 82, 82], ['fora da casa do Edric', 23.5, 22], ['dentro da casa do Edric', null, null]];

const srv = spawn(process.execPath, [join(RAIZ, 'tools/servir.mjs'), 'dev', `--porta=${PORTA}`], { cwd: RAIZ, stdio: ['ignore', 'pipe', 'pipe'] });
let log = ''; srv.stdout.on('data', (d) => { log += d; }); srv.stderr.on('data', (d) => { log += d; });
for (let i = 0; i < 100 && !log.includes('http://localhost'); i++) await dormir(100);
const nav = await puppeteer.launch({ executablePath: CROMO, headless: 'new', args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'] });
const saida = [];
try {
  for (const perfil of PERFIS) for (const [w, h] of JANELAS) {
    const p = await nav.newPage(); await p.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
    await p.goto(`http://localhost:${PORTA}/?hora=13&perfil=${perfil}`); await p.waitForFunction('document.documentElement.dataset.pronto === "1"', { timeout: 60000 });
    await p.evaluate(() => document.getElementById('debug')?.remove()); await dormir(500);
    const livre = (x, z) => p.evaluate((x, z) => { const m = __dunwick.mundo.mapa, hr = __dunwick.mundo.heroi; for (let r = 0; r < 12; r += 0.5) for (let a = 0; a < 6.28; a += 0.5) { const px = x + r * Math.cos(a), pz = z + r * Math.sin(a); if (m.livre(px, pz, 0.5)) { hr.x = hr.ox = px; hr.z = hr.oz = pz; hr.vx = hr.vz = 0; return [px, pz]; } } return null; }, x, z);
    let quadros = [], gl = { chamadas: 0, triangulos: 0, texturas: 0, geometrias: 0 }, heap = 0;
    const porTrecho = [];
    for (const [nome, x, z] of TRECHOS) {
      if (x === null) { // entra na casa pelo portal da porta
        await p.evaluate(() => { const h = __dunwick.mundo.heroi; h.x = h.ox = 23.5; h.z = h.oz = 20.6; h.vx = h.vz = 0; }); await dormir(300);
        await p.evaluate(() => { const h = __dunwick.mundo.heroi; h.x = h.ox = 23.5; h.z = h.oz = 19.5; }); await p.waitForFunction("__dunwick.mundo.mapaId === 'map_casa_edric_interior' && !__dunwick.apr.trans", { timeout: 10000 }).catch(() => {}); await dormir(300);
      } else await livre(x, z);
      await dormir(400); await p.evaluate('__dunwick.exportarTempos()');
      const ini = Date.now(), rota = [['KeyD', 1200], ['KeyS', 900], ['KeyA', 1200], ['KeyW', 900]];
      await p.keyboard.down('ShiftLeft');
      while (Date.now() - ini < (SEG / TRECHOS.length) * 1000) for (const [k, ms] of rota) { if (Date.now() - ini >= (SEG / TRECHOS.length) * 1000) break; await p.keyboard.down(k); await dormir(ms); await p.keyboard.up(k); }
      await p.keyboard.up('ShiftLeft');
      const e = await p.evaluate('__dunwick.estatisticasGl()'); const t = await p.evaluate('__dunwick.exportarTempos()');
      const v = t.quadros_ms.slice(10).sort((a, b) => a - b); porTrecho.push({ nome, fps: +(1000 / (v.reduce((s, q) => s + q, 0) / v.length)).toFixed(1), pior1: +(1000 / (v.slice(Math.floor(v.length * 0.99)).reduce((s, q) => s + q, 0) / v.slice(Math.floor(v.length * 0.99)).length)).toFixed(1), maior_ms: +v[v.length - 1].toFixed(0), lentos: v.filter((q) => q > 25).length, chamadas: e.chamadas, triangulos: e.triangulos });
      quadros = quadros.concat(t.quadros_ms.slice(10)); gl = { chamadas: Math.max(gl.chamadas, e.chamadas), triangulos: Math.max(gl.triangulos, e.triangulos), texturas: Math.max(gl.texturas, e.texturas), geometrias: Math.max(gl.geometrias, e.geometrias) };
      heap = Math.max(heap, await p.evaluate('performance.memory.usedJSHeapSize / 1048576'));
    }
    const v = quadros.slice().sort((a, b) => a - b), media = 1000 / (v.reduce((s, x) => s + x, 0) / v.length), pior = v.slice(Math.floor(v.length * 0.99)), pior1 = 1000 / (pior.reduce((s, x) => s + x, 0) / pior.length);
    const r = { perfil, janela: `${w}x${h}`, fps_medio: +media.toFixed(1), fps_pior_1pct: +pior1.toFixed(1), maior_ms: +v[v.length - 1].toFixed(1), ...gl, heap_js_mb: +heap.toFixed(0), trechos: porTrecho };
    saida.push(r); console.log(JSON.stringify(r)); await p.close();
  }
} finally { await nav.close(); srv.kill(); }
console.log('\nperfil · janela · fps médio · pior 1 % · chamadas · triângulos · texturas · heap JS MB');
for (const r of saida) console.log(`${r.perfil} · ${r.janela} · ${r.fps_medio} · ${r.fps_pior_1pct} ${r.fps_pior_1pct >= 45 ? '' : '✗'} · ${r.chamadas} · ${r.triangulos} · ${r.texturas} · ${r.heap_js_mb}`);
