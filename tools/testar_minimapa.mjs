// Minimapa (D-041) no Chrome real: PC 1280×720 e iPhone paisagem 844×390. Aparece no mapa (canto superior direito, sem cobrir o ⏸),
// gira com a tela (seta do herói para cima quando ele anda para cima da tela), tecla M e painel de pausa ligam/desligam,
// some na pausa e na batalha, interior pela porta da taverna, alto contraste com legenda, nome do ponto de interesse ao tocar,
// e custo por quadro medido. Capturas em build/qa/minimapa/. Uso: node tools/testar_minimapa.mjs [--porta=5196] [--cromo=...]
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (nome, padrao) => { const a = process.argv.find((x) => x.startsWith(`--${nome}=`)); return a ? a.slice(nome.length + 3) : padrao; };
const PORTA = Number(arg('porta', 5196)), CROMO = arg('cromo', process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe');
const DIR = join(RAIZ, 'build', 'qa', 'minimapa'); mkdirSync(DIR, { recursive: true });
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const resultados = []; const checar = (nome, ok, det = '') => { resultados.push({ nome, ok }); console.log(`${ok ? '✓' : '✗'} ${nome}${det ? `  (${det})` : ''}`); };

const srv = spawn(process.execPath, [join(RAIZ, 'tools/servir.mjs'), 'dev', `--porta=${PORTA}`], { cwd: RAIZ, stdio: ['ignore', 'pipe', 'pipe'] });
let log = ''; srv.stdout.on('data', (d) => { log += d; }); srv.stderr.on('data', (d) => { log += d; });
for (let i = 0; i < 100 && !log.includes('http://localhost'); i++) await dormir(100);
const nav = await puppeteer.launch({ executablePath: CROMO, headless: 'new', args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'] });

const visivel = (p) => p.evaluate(() => { const e = document.querySelector('.minimapa'); return !!e && !e.hidden && e.getBoundingClientRect().width > 0; });
const pref = (p, k) => p.evaluate((k) => __dunwick.plataforma.preferencias.obter(k), k);
// direção da seta lida dos PIXELS do canvas: centroide do amarelo da seta em relação ao centro do canvas
const seta = (p) => p.evaluate(() => {
  const c = document.querySelector('.minimapa-tela'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let sx = 0, sy = 0, n = 0, mx = 0, my = 0;
  for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) { const i = (y * c.width + x) * 4; if (d[i] > 240 && d[i + 1] > 220 && d[i + 2] > 140 && d[i + 2] < 175) { sx += x; sy += y; n++; } }
  const h = __dunwick.mundo.heroi; return { n, cx: sx / n / c.width, cy: sy / n / c.height, face: h.face };
});

async function rodar(tela, nome) {
  const ctx = await nav.createBrowserContext(), p = await ctx.newPage(), erros = [];
  p.on('pageerror', (e) => erros.push(String(e))); p.on('console', (m) => { if (m.type() === 'error') erros.push(m.text()); });
  await p.setViewport(tela); await p.goto(`http://localhost:${PORTA}/?hora=13`);
  await p.waitForFunction('document.documentElement.dataset.pronto === "1"', { timeout: 30000 });
  await p.evaluate(() => document.getElementById('debug')?.remove()); await dormir(500);
  checar(`${nome}: minimapa visível no mapa`, await visivel(p));
  const geo = await p.evaluate(() => { const ui = document.getElementById('ui').getBoundingClientRect(), m = document.querySelector('.minimapa-tela').getBoundingClientRect(), b = document.querySelector('.tela-botao-canto').getBoundingClientRect(); return { w: m.width, dentro: m.right <= ui.right + 1 && m.top >= ui.top - 1, direita: m.left > ui.left + ui.width / 2, separado: m.left > b.right || m.top > b.bottom }; });
  checar(`${nome}: canto superior direito, dentro do jogo, sem cobrir o ⏸`, geo.dentro && geo.direita && geo.separado);
  checar(`${nome}: tamanho (PC ~160 px, celular 96–130 px)`, tela.isMobile ? geo.w >= 96 && geo.w <= 130 : Math.abs(geo.w - 160) <= 2, `${Math.round(geo.w)} px`);
  // andar para "cima da tela" (W) → a seta aponta para cima no minimapa
  await p.keyboard.down('KeyW'); await dormir(700); await p.keyboard.up('KeyW'); await dormir(150);
  const s = await seta(p);
  checar(`${nome}: anda para cima da tela → seta para cima (gira com a tela)`, s.n > 3 && s.cy < 0.5 - 0.005 && Math.abs(s.cx - 0.5) < 0.03, `centro da seta ${s.cx.toFixed(3)}, ${s.cy.toFixed(3)}`);
  await p.screenshot({ path: join(DIR, `${nome}_vila.png`) });
  // custo: base desenhada uma vez por mapa; por quadro só gira e põe a seta
  const m0 = await p.evaluate(() => ({ ...__dunwick.batalhaUi.telas.minimapa.medidas }));
  await p.keyboard.down('KeyD'); await dormir(1000); await p.keyboard.up('KeyD');
  const m1 = await p.evaluate(() => ({ ...__dunwick.batalhaUi.telas.minimapa.medidas }));
  const q = m1.quadros - m0.quadros, ms = (m1.ms - m0.ms) / Math.max(1, q);
  checar(`${nome}: base desenhada 1 vez; custo por quadro pequeno`, m1.bases === 1 && q > 10 && ms < 1, `${q} quadros, ${ms.toFixed(3)} ms/quadro, base ${m1.msBase?.toFixed(2)} ms`);
  // M liga/desliga e grava a preferência
  await p.keyboard.press('KeyM'); await dormir(100);
  checar(`${nome}: tecla M esconde e grava minimapa=false`, !(await visivel(p)) && (await pref(p, 'minimapa')) === false);
  await p.keyboard.press('KeyM'); await dormir(100); checar(`${nome}: M de novo mostra`, await visivel(p));
  // pausa: some; alto contraste pelo painel mostra a legenda
  await p.keyboard.press('Escape'); await dormir(150); checar(`${nome}: some com a pausa aberta`, !(await visivel(p)));
  await p.evaluate(() => [...document.querySelectorAll('.tela-linha')].find((l) => l.textContent.includes(__dunwick.t('ui_pausa_minimapa_contraste'))).querySelector('button').click());
  await p.keyboard.press('Escape'); await dormir(200);
  checar(`${nome}: alto contraste liga pelo painel e mostra a legenda`, (await pref(p, 'minimapa_contraste')) === true && (await p.evaluate(() => getComputedStyle(document.querySelector('.minimapa-legenda')).display !== 'none')));
  await p.screenshot({ path: join(DIR, `${nome}_contraste.png`) });
  await p.evaluate(() => __dunwick.plataforma.preferencias.definir('minimapa_contraste', false)); await dormir(100);
  // nome do ponto de interesse: põe o herói ao lado do poço e toca/aponta o ícone
  const poi = await p.evaluate(() => { const m = __dunwick.plataforma.mapaAtivo(), poco = m.pois.find((x) => x.tipo === 'poco') ?? m.pois[0]; const h = __dunwick.mundo.heroi; h.x = h.ox = poco.x + 2; h.z = h.oz = poco.z + 2; return poco; });
  await dormir(200);
  const pt = await p.evaluate((poi) => { const mm = __dunwick.batalhaUi.telas.minimapa, c = document.querySelector('.minimapa-tela').getBoundingClientRect(), g = (__dunwick.plataforma.mapaAtivo().giro_graus * Math.PI) / 180, h = __dunwick.mundo.heroi, esc = c.width / 160 * 4;
    const dx = poi.x - h.x, dz = poi.z - h.z; void mm; return { x: c.left + c.width / 2 + (dx * Math.cos(g) - dz * Math.sin(g)) * esc, y: c.top + c.height / 2 + (dx * Math.sin(g) + dz * Math.cos(g)) * esc }; }, poi);
  if (tela.hasTouch) await p.touchscreen.tap(pt.x, pt.y); else await p.mouse.move(pt.x, pt.y, { steps: 3 });
  await dormir(150);
  const dica = await p.evaluate(() => { const d = document.querySelector('.minimapa-dica'); return d.hidden ? null : d.textContent; });
  checar(`${nome}: ${tela.hasTouch ? 'tocar' : 'apontar'} o ponto de interesse mostra o nome`, dica === (await p.evaluate((n) => __dunwick.t(n), poi.nome_txt)), dica ?? 'nada');
  await p.screenshot({ path: join(DIR, `${nome}_poi.png`) });
  // batalha: some e volta depois
  await p.evaluate(() => __dunwick.jogo.iniciarBatalha('enc_slime_1', { semente: 1 })); await dormir(600);
  checar(`${nome}: some durante a batalha`, !(await visivel(p)));
  await p.evaluate(() => { __dunwick.jogo.batalha.abandonar(); __dunwick.jogo.encerrarBatalha(); }); await dormir(1500);
  checar(`${nome}: volta depois da batalha`, await visivel(p));
  // interior: entra pela porta da taverna (portal de verdade, com a transição da plataforma)
  const porta = await p.evaluate(() => { const m = __dunwick.plataforma.mapaAtivo(); return m.portais.find((x) => /taverna/.test(x.id)) ?? m.portais[0]; });
  await p.evaluate((pt) => { const h = __dunwick.mundo.heroi; h.x = h.ox = pt.x; h.z = h.oz = pt.z + 1.2; }, porta);
  await p.keyboard.down('KeyW'); await p.keyboard.down('KeyA');
  const entrou = await p.waitForFunction((id) => __dunwick.plataforma.mapaAtivo().id === id, { timeout: 6000 }, porta.destino.mapa).then(() => true, () => false);
  await p.keyboard.up('KeyW'); await p.keyboard.up('KeyA'); await dormir(1500);
  const mi = await p.evaluate(() => ({ ...__dunwick.batalhaUi.telas.minimapa.medidas, interior: __dunwick.plataforma.mapaAtivo().interior }));
  checar(`${nome}: interior pela porta → base nova do cômodo`, entrou && mi.interior && mi.bases === 2 && (await visivel(p)), `entrou=${entrou} bases=${mi.bases}`);
  await p.screenshot({ path: join(DIR, `${nome}_interior.png`) });
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
