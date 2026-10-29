// Modo celular/tablet de toque (src/plataforma/movel.js) no Chrome em EMULAÇÃO (puppeteer): iPhone 390×844, Android 412×915 e tablet
// 1024×768, retrato e paisagem. Confere encaixe (≥ 95 % da dimensão limitante), aviso "Gire" em retrato (jogo pausado), sem rolagem,
// toque no chão anda, toque em Atacar → inimigo, UI dentro do retângulo do jogo; e que o PC (1280×720, 1920×1080) não mudou.
// NÃO substitui Safari/iOS real (safe-area, barras dinâmicas, áudio, tela cheia). Uso: node tools/testar_movel.mjs [--porta=5194]. Capturas: build/qa/mobile/.
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
const UA_IOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const UA_AND = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36';
const APARELHOS = [
  ['iphone', UA_IOS, 390, 844, 3], ['android', UA_AND, 412, 915, 3], ['tablet', UA_AND, 1024, 768, 2],
];

const srv = spawn(process.execPath, [join(RAIZ, 'tools/servir.mjs'), 'dev', `--porta=${PORTA}`], { cwd: RAIZ, stdio: ['ignore', 'pipe', 'pipe'] });
let log = ''; srv.stdout.on('data', (d) => { log += d; }); srv.stderr.on('data', (d) => { log += d; });
for (let i = 0; i < 100 && !log.includes('http://localhost'); i++) await dormir(100);
const nav = await puppeteer.launch({ executablePath: CROMO, headless: 'new', args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'] });
const erros = [];

async function abrir({ ua, w, h, dpr, movel, touch = true, consulta = '' }) {
  const p = await nav.newPage(); p.on('pageerror', (e) => erros.push(String(e))); p.on('console', (m) => { if (m.type() === 'error') erros.push(m.text()); });
  await p.emulate({ userAgent: ua, viewport: { width: w, height: h, deviceScaleFactor: dpr, isMobile: touch, hasTouch: touch, isLandscape: w > h } });
  await p.goto(`http://localhost:${PORTA}/?hora=13${movel === undefined ? '' : `&mobile=${movel ? 1 : 0}`}${consulta}`); await p.waitForFunction('document.documentElement.dataset.pronto === "1"', { timeout: 30000 });
  await p.evaluate(() => document.getElementById('debug')?.remove()); await dormir(500); return p;
}
const medir = (p) => p.evaluate(() => { const e = __dunwick.ren.estado, c = document.getElementById('tela').getBoundingClientRect(); return { classe: document.documentElement.className, modo: e.modo, ocupa: Math.max(e.vw / e.largura, e.vh / e.altura), vw: e.vw, vh: e.vh, larg: e.largura, alt: e.altura, canvas: [c.x, c.y, c.width, c.height].map(Math.round), rolagem: document.documentElement.scrollWidth > innerWidth + 1 || document.documentElement.scrollHeight > innerHeight + 1, gire: getComputedStyle(document.getElementById('gire') ?? document.body).display, ticks: __dunwick.mundo.ticks, perfil: __dunwick.perfilAtual() }; });
const centro = (p, sel, texto) => p.evaluate((s, t) => { const e = [...document.querySelectorAll(s)].filter((x) => x.getBoundingClientRect().width > 0 && !x.hidden && (!t || x.textContent.includes(t))).sort((a, b) => a.textContent.length - b.textContent.length)[0]; if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }, sel, texto);

try {
  for (const [nome, ua, W, H, dpr] of APARELHOS) {
    // ---------- paisagem ----------
    const [lw, lh] = [Math.max(W, H), Math.min(W, H)], p = await abrir({ ua, w: lw, h: lh, dpr, movel: true });
    let m = await medir(p);
    checar(`${nome} paisagem ${lw}×${lh}: modo celular ligado, perfil Médio, sem rolagem`, m.classe.includes('movel') && !m.classe.includes('retrato') && m.perfil === 'perfil_medio' && !m.rolagem, JSON.stringify({ classe: m.classe, perfil: m.perfil, rolagem: m.rolagem }));
    checar(`${nome} paisagem: o jogo ocupa ≥ 95 % da dimensão limitante`, m.ocupa >= 0.95, `ocupa ${(m.ocupa * 100).toFixed(1)} % · modo ${m.modo} · buffer ${m.larg}×${m.alt}`);
    checar(`${nome} paisagem: pixel ratio limitado a 2`, m.larg <= Math.ceil(lw * 2) + 1, `buffer ${m.larg}×${m.alt} (janela ${lw}×${lh}, dpr ${dpr})`);
    // toque no chão anda (um dedo = botão esquerdo)
    const h0 = await p.evaluate(() => [__dunwick.mundo.heroi.x, __dunwick.mundo.heroi.z]);
    const alvo = await p.evaluate((x, z) => __dunwick.mundoParaTela(x, 0, z), h0[0] + 3, h0[1] - 3);
    await p.touchscreen.tap(alvo.x, alvo.y); await dormir(1400);
    const h1 = await p.evaluate(() => [__dunwick.mundo.heroi.x, __dunwick.mundo.heroi.z]);
    checar(`${nome}: tocar no chão anda até o ponto`, Math.hypot(h1[0] - (h0[0] + 3), h1[1] - (h0[1] - 3)) < 0.8, `de ${h0.map((v) => v.toFixed(1))} para ${h1.map((v) => v.toFixed(1))}`);
    await p.screenshot({ path: join(DIR, `${nome}_paisagem_mapa.png`) });
    // batalha por toque: Atacar → inimigo
    await p.evaluate(() => __dunwick.jogo.iniciarBatalha('enc_misto_1', { semente: 2 })); await dormir(3800);
    const uiOk = await p.evaluate(() => { const r = document.getElementById('ui').getBoundingClientRect(), fora = [...document.querySelectorAll('.bat *')].filter((e) => { const b = e.getBoundingClientRect(); return b.width > 0 && getComputedStyle(e).visibility !== 'hidden' && (b.left < r.left - 2 || b.right > r.right + 2 || b.top < r.top - 2 || b.bottom > r.bottom + 2); }).map((e) => `${e.className} ${Math.round(e.getBoundingClientRect().right)}>${Math.round(r.right)}`); return { fora: fora.slice(0, 5), n: fora.length }; });
    checar(`${nome} paisagem: UI da batalha dentro do retângulo do jogo`, uiOk.n === 0, JSON.stringify(uiOk));
    await p.screenshot({ path: join(DIR, `${nome}_paisagem_batalha.png`) });
    const atacar = await centro(p, '.bat li', 'Atacar'); if (atacar) await p.touchscreen.tap(atacar.x, atacar.y); await dormir(500);
    let modoUi = await p.evaluate(() => __dunwick.batalhaUi.modo); checar(`${nome}: tocar em Atacar abre a escolha de alvo`, modoUi === 'alvo', modoUi);
    const inim = await centro(p, '.bat-alvo-area-inimigos.valido'); if (inim) await p.touchscreen.tap(inim.x, inim.y); await dormir(600);
    const esc = await p.evaluate(() => __dunwick.jogo.batalha.consultar().escolhas.hero_edric ?? null); modoUi = await p.evaluate(() => __dunwick.batalhaUi.modo);
    checar(`${nome}: tocar no inimigo confirma o ataque do Edric (passa para a vez da Grace)`, esc?.comando === 'atacar' && modoUi !== 'alvo', JSON.stringify({ esc, modoUi }));
    await p.close();
    // ---------- retrato ----------
    const q = await abrir({ ua, w: Math.min(W, H), h: Math.max(W, H), dpr, movel: true });
    m = await medir(q); const t0 = m.ticks; await dormir(600); const t1 = (await medir(q)).ticks;
    checar(`${nome} retrato ${Math.min(W, H)}×${Math.max(W, H)}: aviso "Gire o celular" visível e jogo pausado`, m.classe.includes('retrato') && m.gire === 'flex' && t1 === t0, `gire=${m.gire} ticks ${t0}→${t1}`);
    await q.screenshot({ path: join(DIR, `${nome}_retrato.png`) }); await q.close();
  }
  // detecção automática (sem ?mobile): iPhone deitado com toque emulado
  { const p = await abrir({ ua: UA_IOS, w: 844, h: 390, dpr: 3 }); const m = await medir(p); checar('detecção automática: toque + sem hover + tela pequena liga o modo celular', m.classe.includes('movel'), m.classe); await p.close(); }
  // ---------- PC inalterado ----------
  for (const [w, h] of [[1280, 720], [1920, 1080]]) {
    const p = await abrir({ ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0', w, h, dpr: 1, touch: false }); const m = await medir(p);
    checar(`PC ${w}×${h}: sem modo celular, modo "arte", canvas cobre a janela, escala inteira`, !m.classe.includes('movel') && m.modo === 'arte' && m.canvas[2] === w && m.canvas[3] === h && m.vw % 960 === 0, JSON.stringify({ classe: m.classe, modo: m.modo, canvas: m.canvas, vw: m.vw, vh: m.vh }));
    await p.screenshot({ path: join(DIR, `pc_${w}x${h}.png`) }); await p.close();
  }
  checar('console limpo (0 erros)', erros.length === 0, erros.slice(0, 4).join(' | '));
} finally { await nav.close(); srv.kill(); }
const f = resultados.filter((x) => !x.ok); console.log(`\n${f.length ? '✗' : '✓'} ${resultados.length - f.length}/${resultados.length} verificações do modo celular passaram`); process.exit(f.length ? 1 : 0);
