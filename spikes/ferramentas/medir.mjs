// Mede um spike no Chrome real (GPU). Uso:
//   node ferramentas/medir.mjs <opcao> "<query>" [segundos] [--captura=arquivo.png] [--nitidez]
// Imprime JSON com fps, pior 1 %, chamadas, memória, tempo até a primeira tela. Servidor deve estar ativo (npm run servir).
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { execFileSync } from 'node:child_process';
// Memória: working set e memória privada da árvore de processos do Chrome lançado por este script (Windows, ferramentas/memoria.ps1).
function memoriaMB(pid) {
  try {
    const [ws, priv, n] = execFileSync('powershell', ['-NoProfile', '-File', new URL('./memoria.ps1', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'), String(pid)], { encoding: 'utf8' }).trim().split(' ').map(Number);
    return { workingSetMB: ws, privadoMB: priv, processos: n };
  } catch (e) { return { erro: String(e.message).slice(0, 120) }; }
}
const [opcao, query = '', seg = '12', ...flags] = process.argv.slice(2);
const captura = flags.find((f) => f.startsWith('--captura='))?.split('=')[1];
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const q = new URLSearchParams(query);
const w = Number(q.get('w') || 1920), h = Number(q.get('h') || 1080);
const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--use-angle=d3d11', '--enable-gpu-rasterization', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader=false',
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows',
    `--window-size=${w},${h}`, ...(q.get('spike') === 'audio' ? [] : ['--autoplay-policy=no-user-gesture-required']), '--enable-precise-memory-info', '--disable-frame-rate-limit=false'],
  defaultViewport: { width: w, height: h, deviceScaleFactor: 1 },
});
const pag = await browser.newPage();
const erros = []; pag.on('pageerror', (e) => erros.push(String(e))); pag.on('console', (m) => { if (m.type() === 'error') erros.push(m.text()); });
let bytes = 0, reqs = 0, bytesPorTipo = {};
const cdp = await pag.createCDPSession(); await cdp.send('Network.enable');
cdp.on('Network.loadingFinished', (e) => { bytes += e.encodedDataLength; reqs++; });
const t0 = Date.now();
await pag.goto(`http://localhost:8080/${opcao}/?${query}`, { waitUntil: 'load' });
const info = await pag.evaluate(() => { const c = document.createElement('canvas').getContext('webgl2'); const e = c.getExtension('WEBGL_debug_renderer_info'); return { renderer: c.getParameter(e.UNMASKED_RENDERER_WEBGL), webgl2: !!c }; });
if (q.get('spike') === 'audio') {
  await pag.click('#comecar'); await pag.waitForFunction('window.__estado?.audioPronto', { timeout: 60000 });
  console.log(JSON.stringify({ info, estado: await pag.evaluate(() => JSON.parse(JSON.stringify({ audio: __estado.audio, audioInicial: __estado.audioInicial }))), erros }, null, 1));
  await browser.close(); process.exit(0);
}
await pag.waitForFunction('window.__estado?.pronto', { timeout: 120000 }).catch(() => erros.push('timeout aguardando primeira tela'));
const tPronto = Date.now() - t0;
await new Promise((r) => setTimeout(r, 2500)); // aquecimento
await pag.evaluate(() => __medidor.iniciar());
await new Promise((r) => setTimeout(r, Number(seg) * 1000));
const res = await pag.evaluate(() => ({ ...__medidor.resultado(), estado: { primeiraTelaMs: __estado.primeiraTelaMs, montagemMs: __estado.montagemMs, modulos: __estado.modulos, bytesAudio: __estado.bytesAudio, pos: __estado.pos, versao: __estado.versao }, gl: __estado.info?.() }));
const mem = memoriaMB(browser.process().pid);
if (flags.includes('--nitidez')) res.nitidez = await pag.evaluate(() => __estado.nitidez());
if (captura) { mkdirSync(dirname(captura), { recursive: true }); await pag.screenshot({ path: captura }); }
console.log(JSON.stringify({ opcao, query, maquina: info.renderer, chrome: await browser.version(), downloadKB: +(bytes / 1024).toFixed(0), requisicoes: reqs, tempoAteTelaMs: tPronto, memoriaNavegador: mem, ...res, erros }, null, 1));
await browser.close();
