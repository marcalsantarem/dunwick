// UI de batalha em telas de celular (emulação no Chrome real: toque, DPR 3) e no PC: nada sai do retângulo do jogo,
// texto ≥ 11 px, alvos de toque ≥ 44 px no layout compacto, e uma rodada jogada só com toques. Capturas em build/qa/mobile/.
// Uso: node tools/testar_ui_mobile.mjs [--porta=5194] [--cromo=caminho] [--telas=iphone,android]
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (nome, padrao) => { const a = process.argv.find((x) => x.startsWith(`--${nome}=`)); return a ? a.slice(nome.length + 3) : padrao; };
const PORTA = Number(arg('porta', 5194)), CROMO = arg('cromo', process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe');
const DIR = join(RAIZ, 'build', 'qa', 'mobile'); mkdirSync(DIR, { recursive: true });
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const resultados = []; const checar = (nome, ok, det = '') => { resultados.push({ nome, ok }); console.log(`${ok ? '✓' : '✗'} ${nome}${det ? `  (${det})` : ''}`); };
const SO = arg('telas', ''); const TELAS_TODAS = [
  { nome: 'pc_1280x720', width: 1280, height: 720, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
  { nome: 'iphone_844x390', width: 844, height: 390, deviceScaleFactor: 3, isMobile: true, hasTouch: true, isLandscape: true },
  { nome: 'android_915x412', width: 915, height: 412, deviceScaleFactor: 2.625, isMobile: true, hasTouch: true, isLandscape: true },
  { nome: 'iphone_se_667x375', width: 667, height: 375, deviceScaleFactor: 2, isMobile: true, hasTouch: true, isLandscape: true },
  { nome: 'retrato_390x844', width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true, isLandscape: false, informativo: true },
];
const TELAS = SO ? TELAS_TODAS.filter((t) => SO.split(',').some((s) => t.nome.startsWith(s))) : TELAS_TODAS;

const srv = spawn(process.execPath, [join(RAIZ, 'tools/servir.mjs'), 'dev', `--porta=${PORTA}`], { cwd: RAIZ, stdio: ['ignore', 'pipe', 'pipe'] });
let log = ''; srv.stdout.on('data', (d) => { log += d; }); srv.stderr.on('data', (d) => { log += d; });
for (let i = 0; i < 100 && !log.includes('http://localhost'); i++) await dormir(100);
const nav = await puppeteer.launch({ executablePath: CROMO, headless: 'new', args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'] });
try {
  for (const tela of TELAS) {
    const p = await nav.newPage(), erros = []; p.on('pageerror', (e) => erros.push(String(e)));
    await p.setViewport(tela);
    await p.goto(`http://localhost:${PORTA}/?hora=13`); await p.waitForFunction('document.documentElement.dataset.pronto === "1"', { timeout: 30000 });
    await p.evaluate(() => { document.getElementById('debug')?.remove(); __dunwick.jogo.iniciarBatalha('enc_misto_1', { semente: 2 }); });
    const chegou = await p.waitForFunction('__dunwick.batalhaUi.modo === "menu"', { timeout: 30000 }).then(() => true, () => false); await dormir(300);
    if (!chegou) { await p.screenshot({ path: join(DIR, `${tela.nome}_menu.png`) }); checar(`${tela.nome}: menu da batalha não abriu${tela.informativo ? ' (informativo: depende do modo girado do 08)' : ''}`, !!tela.informativo, `modo da UI: ${await p.evaluate(() => __dunwick.batalhaUi.modo)}`); await p.close(); continue; }
    const m = await p.evaluate(() => {
      const ui = document.getElementById('ui').getBoundingClientRect(), fora = [], pequenos = new Set(), toques = [];
      for (const e of document.querySelectorAll('#batalha .bat-painel, #batalha .bat-topo > *, #batalha .bat-item')) {
        if (!e.offsetParent && getComputedStyle(e).position !== 'fixed') continue; const r = e.getBoundingClientRect(); if (!r.width) continue;
        if (r.left < ui.left - 1 || r.right > ui.right + 1 || r.top < ui.top - 1 || r.bottom > ui.bottom + 1) fora.push(e.className);
      }
      for (const e of document.querySelectorAll('#batalha *')) if (e.offsetParent && e.childNodes.length && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) { const fs = parseFloat(getComputedStyle(e).fontSize); if (fs < 10.99) pequenos.add(`${e.className}:${fs}`); }
      for (const e of document.querySelectorAll('.bat-menu:not(.bat-sub) .bat-item, .bat-caixa, .bat-alvo-area:not([hidden])')) { const r = e.getBoundingClientRect(); toques.push(Math.min(r.width, r.height)); }
      const rodape = Math.min(...[...document.querySelectorAll('.bat-info, .bat-base')].map((e) => e.getBoundingClientRect().top));
      return { ui: [Math.round(ui.width), Math.round(ui.height)], k: getComputedStyle(document.getElementById('ui')).getPropertyValue('--k'), fora, pequenos: [...pequenos], toqueMin: Math.round(Math.min(...toques)), rodapeFracao: +((ui.bottom - rodape) / ui.height).toFixed(2) };
    });
    const tag = `${tela.nome}${tela.informativo ? ' (informativo: o modo girado é do 08)' : ''}`;
    console.log(`— ${tag}: #ui ${m.ui.join('×')} k=${m.k} rodapé ${Math.round(m.rodapeFracao * 100)} % da altura`);
    await p.screenshot({ path: join(DIR, `${tela.nome}_menu.png`) });
    if (!tela.informativo) {
      checar(`${tela.nome}: nenhum painel sai do retângulo do jogo`, m.fora.length === 0, m.fora.slice(0, 4).join(', '));
      checar(`${tela.nome}: texto ≥ 11 px`, m.pequenos.length === 0, m.pequenos.slice(0, 4).join(', '));
      checar(`${tela.nome}: rodapé ≤ 36 % da altura (não cobre os pés do grupo)`, m.rodapeFracao <= 0.36, `${m.rodapeFracao}`);
      if (tela.hasTouch) checar(`${tela.nome}: alvos de toque ≥ 44 px`, m.toqueMin >= 44, `${m.toqueMin} px`);
    }
    if (tela.hasTouch && !tela.informativo) { // uma rodada só com toques: Atacar → inimigo (Edric e Grace)
      const tocar = async (sel) => { const r = await p.evaluate((s) => { const e = [...document.querySelectorAll(s)].find((x) => x.getBoundingClientRect().width); if (!e) return null; const b = e.getBoundingClientRect(); return [b.x + b.width / 2, b.y + b.height / 2]; }, sel); if (!r) throw new Error(`sem ${sel}`); await p.touchscreen.tap(r[0], r[1]); await dormir(150); };
      const vidaIni = await p.evaluate(() => __dunwick.jogo.batalha.consultar().atores.filter((a) => a.lado === 'inimigos').reduce((s, a) => s + a.vida, 0));
      await tocar('.bat-menu:not(.bat-sub) .bat-item'); await p.screenshot({ path: join(DIR, `${tela.nome}_alvo.png`) }); await tocar('.bat-alvo-area-inimigos:not([hidden])');
      await p.waitForFunction('__dunwick.batalhaUi.modo === "menu"', { timeout: 10000 });
      await tocar('.bat-menu:not(.bat-sub) .bat-item'); await tocar('.bat-alvo-area-inimigos:not([hidden])');
      await p.waitForFunction('__dunwick.batalhaUi.modo === "menu" || __dunwick.batalhaUi.modo === "resultado"', { timeout: 30000 });
      const vidaFim = await p.evaluate(() => __dunwick.jogo.batalha.consultar().atores.filter((a) => a.lado === 'inimigos').reduce((s, a) => s + a.vida, 0));
      checar(`${tela.nome}: rodada jogada só com toques (dano aplicado)`, vidaFim < vidaIni, `${vidaIni} → ${vidaFim}`);
    }
    if (!tela.informativo) checar(`${tela.nome}: console sem erros`, erros.length === 0, erros[0] ?? '');
    await p.close();
  }
} catch (e) { checar(`execução: ${e.message}`, false); console.log(log.split(String.fromCharCode(10)).slice(-8).join(String.fromCharCode(10))); }
finally { await nav.close(); srv.kill(); }
const falhas = resultados.filter((r) => !r.ok).length;
console.log(`\n${resultados.length - falhas}/${resultados.length} passaram`); process.exit(falhas ? 1 : 0);
