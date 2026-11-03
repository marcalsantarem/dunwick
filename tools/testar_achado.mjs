// Janela de achado (baú de tesouro, v0.1.2b) no Chrome real, PC e iPhone paisagem: abre com bau_aberto (evento do 13), mostra
// "Você encontrou {item}", pausa o mundo enquanto aberta, fecha por teclado, clique, toque ou gamepad, faz fila e mostra baú vazio.
// Capturas em build/qa/achado/. Uso: node tools/testar_achado.mjs [--porta=5197] [--cromo=...]
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (nome, padrao) => { const a = process.argv.find((x) => x.startsWith(`--${nome}=`)); return a ? a.slice(nome.length + 3) : padrao; };
const PORTA = Number(arg('porta', 5197)), CROMO = arg('cromo', process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe');
const DIR = join(RAIZ, 'build', 'qa', 'achado'); mkdirSync(DIR, { recursive: true });
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const resultados = []; const checar = (nome, ok, det = '') => { resultados.push({ nome, ok }); console.log(`${ok ? '✓' : '✗'} ${nome}${det ? `  (${det})` : ''}`); };
const srv = spawn(process.execPath, [join(RAIZ, 'tools/servir.mjs'), 'dev', `--porta=${PORTA}`], { cwd: RAIZ, stdio: ['ignore', 'pipe', 'pipe'] });
let log = ''; srv.stdout.on('data', (d) => { log += d; }); srv.stderr.on('data', (d) => { log += d; });
for (let i = 0; i < 100 && !log.includes('http://localhost'); i++) await dormir(100);
const nav = await puppeteer.launch({ executablePath: CROMO, headless: 'new', args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'] });
const aberta = (p) => p.evaluate(() => { const e = document.querySelector('.tela-achado'); return !!e && !e.hidden; });
const texto = (p) => p.evaluate(() => document.querySelector('.tela-achado-texto')?.textContent);
const emitir = (p, nome, d) => p.evaluate((n, d) => __dunwick.mundo.eventos.emitir(n, d), nome, d);

async function rodar(tela, nome) {
  const ctx = await nav.createBrowserContext(), p = await ctx.newPage(), erros = [];
  p.on('pageerror', (e) => erros.push(String(e))); p.on('console', (m) => { if (m.type() === 'error') erros.push(m.text()); });
  await p.setViewport(tela); await p.goto(`http://localhost:${PORTA}/?hora=13`);
  await p.waitForFunction('document.documentElement.dataset.pronto === "1"', { timeout: 30000 });
  await p.evaluate(() => document.getElementById('debug')?.remove()); await dormir(300);
  const item = await p.evaluate(() => Object.keys(__dunwick.plataforma ? (window.__dunwick.mundo.dados.combate?.itens ?? {}) : {})[0] ?? 'item_pocao_ervas');
  const nomeItem = await p.evaluate((i) => __dunwick.t(__dunwick.mundo.dados.combate.itens[i].nome_txt), item);
  await emitir(p, 'bau_aberto', { mapa: 'map_casa_edric_interior', id: 'bau_casa_edric', item, quantidade: 1 }); await dormir(200);
  checar(`${nome}: bau_aberto abre a janela "Você encontrou …"`, (await aberta(p)) && (await texto(p)) === (await p.evaluate((n) => __dunwick.t('ui_achado_encontrou', { nome_item: n }), nomeItem)), await texto(p));
  const t0 = await p.evaluate(() => __dunwick.mundo.ticks); await dormir(500); const t1 = await p.evaluate(() => __dunwick.mundo.ticks);
  checar(`${nome}: o mundo para enquanto a janela está aberta`, t0 === t1 && (await p.evaluate(() => __dunwick.plataforma.pausa.motivos().includes('achado'))), `ticks ${t0} → ${t1}`);
  checar(`${nome}: a dica de controles não aparece por cima da janela`, await p.evaluate(() => document.querySelector('.tela-dica').hidden));
  await p.screenshot({ path: join(DIR, `${nome}_achado.png`) });
  const ok = await p.evaluate(() => { const r = document.querySelector('.tela-ok').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, h: r.height }; });
  checar(`${nome}: botão OK ≥ 44 px`, ok.w >= 44 && ok.h >= 44, `${Math.round(ok.w)}×${Math.round(ok.h)}`);
  // fila: um segundo achado (×2) espera o primeiro fechar
  await emitir(p, 'bau_aberto', { mapa: 'm', id: 'b2', item, quantidade: 2 });
  if (tela.hasTouch) await p.touchscreen.tap(ok.x, ok.y); else await p.mouse.click(ok.x, ok.y); await dormir(150);
  checar(`${nome}: ${tela.hasTouch ? 'toque' : 'clique'} no OK fecha e a fila mostra o próximo (×2)`, (await aberta(p)) && (await texto(p)).includes('2'), await texto(p));
  await p.keyboard.press('Enter'); await dormir(150);
  checar(`${nome}: Enter fecha e o mundo volta`, !(await aberta(p)) && !(await p.evaluate(() => __dunwick.plataforma.pausa.pausado)));
  await emitir(p, 'bau_vazio', { mapa: 'm', id: 'b2' }); await dormir(150);
  checar(`${nome}: baú já aberto mostra "O baú está vazio."`, (await texto(p)) === (await p.evaluate(() => __dunwick.t('ui_achado_vazio'))));
  await p.screenshot({ path: join(DIR, `${nome}_vazio.png`) });
  await p.keyboard.press('Escape'); await dormir(150);
  checar(`${nome}: Esc fecha o achado sem abrir a pausa`, !(await aberta(p)) && (await p.evaluate(() => document.querySelector('.tela-pausa:not(.tela-achado)').hidden)));
  checar(`${nome}: console sem erros`, erros.length === 0, erros[0] ?? '');
  await ctx.close();
}
try {
  await rodar({ width: 1280, height: 720 }, 'pc');
  await rodar({ width: 844, height: 390, deviceScaleFactor: 3, isMobile: true, hasTouch: true, isLandscape: true }, 'iphone');
} catch (e) { checar(`execução: ${e.message}`, false); }
finally { await nav.close(); srv.kill(); }
const falhas = resultados.filter((r) => !r.ok).length;
console.log(`\n${resultados.length - falhas}/${resultados.length} passaram`); process.exit(falhas ? 1 : 0);
