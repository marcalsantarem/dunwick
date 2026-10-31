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
// preferência do minimapa: na plataforma, se ela a conhece; senão no armazenamento próprio da UI (dunwick.ui_minimapa)
const pref = (p, k) => p.evaluate((k) => { try { return __dunwick.plataforma.preferencias.obter(k); } catch { return JSON.parse(localStorage.getItem("dunwick.ui_minimapa") ?? "{}")[k]; } }, k);
// seta: há pixels da seta no centro do canvas (desenhada de verdade) e o ângulo com que foi desenhada (a fórmula tem teste de unidade)
const seta = (p) => p.evaluate(() => {
  const c = document.querySelector('.minimapa-tela'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0;
  for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) { const i = (y * c.width + x) * 4; if (d[i] > 240 && d[i + 1] > 220 && d[i + 2] > 140 && d[i + 2] < 175 && Math.hypot(x - c.width / 2, y - c.height / 2) < c.width * 0.1) n++; }
  return { n, ang: __dunwick.batalhaUi.telas.minimapa.medidas.angSeta };
});

async function rodar(tela, nome) {
  const ctx = await nav.createBrowserContext(), p = await ctx.newPage(), erros = [];
  p.on('pageerror', (e) => erros.push(String(e))); p.on('console', (m) => { if (m.type() === 'error') erros.push(m.text()); });
  await p.setViewport(tela); await p.goto(`http://localhost:${PORTA}/?hora=13`);
  await p.waitForFunction('document.documentElement.dataset.pronto === "1"', { timeout: 30000 });
  await p.evaluate(() => document.getElementById('debug')?.remove()); await dormir(500);
  checar(`${nome}: minimapa visível no mapa`, await visivel(p));
  const fo = await p.evaluate(() => { const f = __dunwick.batalhaUi.telas.minimapa.fonte(), ma = __dunwick.plataforma.mapaAtivo?.(); return { temMa: !!ma, mesmoId: ma?.id === f.id, doOito: !!ma && f.edificios[0]?.interior !== undefined, muros: f.muros?.length ?? 0, estavel: f === __dunwick.batalhaUi.telas.minimapa.fonte() }; });
  checar(`${nome}: lê plataforma.mapaAtivo() (08) + muros, mesma referência por mapa`, fo.temMa && fo.mesmoId && fo.doOito && fo.muros > 0 && fo.estavel, JSON.stringify(fo));
  const geo = await p.evaluate(() => { const ui = document.getElementById('ui').getBoundingClientRect(), m = document.querySelector('.minimapa-tela').getBoundingClientRect(), b = document.querySelector('.tela-botao-canto').getBoundingClientRect(); return { w: m.width, dentro: m.right <= ui.right + 1 && m.top >= ui.top - 1, direita: m.left > ui.left + ui.width / 2, separado: m.left > b.right || m.top > b.bottom }; });
  checar(`${nome}: canto superior direito, dentro do jogo, sem cobrir o ⏸`, geo.dentro && geo.direita && geo.separado);
  const banner = await p.evaluate(() => { const b = document.querySelector(".tela-banner-mapa"), m = document.querySelector(".minimapa-tela").getBoundingClientRect(); if (!b || b.hidden) return null; const r = b.getBoundingClientRect(); return r.right < m.left || r.left > m.right || r.bottom < m.top || r.top > m.bottom; });
  checar(`${nome}: não cobre o banner do nome do mapa`, banner === true, banner === null ? "banner não visível" : "");
  await p.screenshot({ path: join(DIR, `${nome}_banner.png`) });
  checar(`${nome}: tamanho (PC ~160 px, celular 96–130 px)`, tela.isMobile ? geo.w >= 96 && geo.w <= 130 : geo.w >= 150 && geo.w <= 180, `${Math.round(geo.w)} px`);
  // andar para "cima da tela" (W) → a seta aponta para cima no minimapa
  await p.keyboard.down('KeyW'); await dormir(700); await p.keyboard.up('KeyW'); await dormir(150);
  const s = await seta(p);
  checar(`${nome}: anda para cima da tela → seta para cima (gira com a tela)`, s.n > 3 && Math.abs(s.ang + Math.PI / 2) < 0.35, `ponta a ${Math.round((s.ang * 180) / Math.PI)}° (cima = −90°)`);
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
  // botão ▦ no canto (clique no PC, toque no celular) desliga e liga
  const bm = await p.$(".tela-mini-canto"); if (tela.hasTouch) await bm.tap(); else await bm.click(); await dormir(100);
  const desl = !(await visivel(p)); if (tela.hasTouch) await bm.tap(); else await bm.click(); await dormir(100);
  checar(`${nome}: botão ▦ ${tela.hasTouch ? "(toque)" : "(clique)"} desliga e liga`, desl && (await visivel(p)));
  // pausa: some; alto contraste pelo painel mostra a legenda
  await p.keyboard.press('Escape'); await dormir(150); checar(`${nome}: some com a pausa aberta`, !(await visivel(p)));
  await p.evaluate(() => [...document.querySelectorAll('.tela-linha')].find((l) => l.textContent.includes(__dunwick.t('ui_pausa_minimapa_contraste'))).querySelector('button').click());
  await p.keyboard.press('Escape'); await dormir(200);
  checar(`${nome}: alto contraste liga pelo painel e mostra a legenda`, (await pref(p, 'minimapa_contraste')) === true && (await p.evaluate(() => getComputedStyle(document.querySelector('.minimapa-legenda')).display !== 'none')));
  await p.screenshot({ path: join(DIR, `${nome}_contraste.png`) });
  await p.evaluate(() => __dunwick.plataforma.preferencias.definir('minimapa_contraste', false)); await dormir(100);
  // nome do ponto de interesse: põe o herói ao lado do poço e toca/aponta o ícone
  const poi = await p.evaluate(() => { const m = __dunwick.batalhaUi.telas.minimapa.fonte(), poco = m.pois.find((x) => x.tipo === 'poco') ?? m.pois[0]; const h = __dunwick.mundo.heroi; h.x = h.ox = poco.x + 2; h.z = h.oz = poco.z + 2; return poco; });
  await dormir(200);
  const pt = await p.evaluate((poi) => { const mm = __dunwick.batalhaUi.telas.minimapa, c = document.querySelector('.minimapa-tela').getBoundingClientRect(), g = (__dunwick.batalhaUi.telas.minimapa.fonte().giro_graus * Math.PI) / 180, h = __dunwick.mundo.heroi, esc = c.width / 160 * 4;
    const dx = poi.x - h.x, dz = poi.z - h.z; void mm; return { x: c.left + c.width / 2 + (dx * Math.cos(g) - dz * Math.sin(g)) * esc, y: c.top + c.height / 2 + (dx * Math.sin(g) + dz * Math.cos(g)) * esc }; }, poi);
  if (tela.hasTouch) await p.touchscreen.tap(pt.x, pt.y); else await p.mouse.move(pt.x, pt.y, { steps: 3 });
  await dormir(150);
  const dica = await p.evaluate(() => { const d = document.querySelector('.minimapa-dica'); return d.hidden ? null : d.textContent; });
  checar(`${nome}: ${tela.hasTouch ? 'tocar' : 'apontar'} o ponto de interesse mostra o nome`, dica === (await p.evaluate((n) => __dunwick.t(n), poi.nome_txt)), dica ?? 'nada');
  await p.screenshot({ path: join(DIR, `${nome}_poi.png`) });
  // batalha: some e volta depois
  await p.evaluate(() => __dunwick.jogo.iniciarBatalha('enc_slime_1', { semente: 1 })); await p.waitForFunction(() => __dunwick.apr.visao === 'batalha' && !__dunwick.apr.trans, { timeout: 8000 });
  checar(`${nome}: some durante a batalha`, !(await visivel(p)));
  await p.evaluate(() => { __dunwick.jogo.batalha.abandonar(); __dunwick.jogo.encerrarBatalha(); }); await dormir(1500);
  checar(`${nome}: volta depois da batalha`, await visivel(p));
  // interior: entra pela porta da taverna (portal de verdade, com a transição da plataforma)
  const bases0 = await p.evaluate(() => __dunwick.batalhaUi.telas.minimapa.medidas.bases);
  const porta = await p.evaluate(() => { const m = __dunwick.mundo.mapa.dados; return m.portais.find((x) => /taverna/.test(x.id)) ?? m.portais[0]; });
  await p.evaluate((pt) => { const h = __dunwick.mundo.heroi; h.x = h.ox = pt.chegada.x; h.z = h.oz = pt.chegada.z; }, porta); await dormir(300);
  await p.evaluate((pt) => { const h = __dunwick.mundo.heroi; h.x = h.ox = pt.x; h.z = h.oz = pt.z; }, porta);
  const entrou = await p.waitForFunction((id) => __dunwick.batalhaUi.telas.minimapa.fonte().id === id, { timeout: 6000 }, porta.destino.mapa).then(() => true, () => false);
  await dormir(1500);
  const mi = await p.evaluate(() => ({ ...__dunwick.batalhaUi.telas.minimapa.medidas, interior: __dunwick.batalhaUi.telas.minimapa.fonte().interior }));
  checar(`${nome}: interior pela porta → base nova do cômodo`, entrou && mi.interior && mi.bases === bases0 + 1 && (await visivel(p)), `entrou=${entrou} bases ${bases0}→${mi.bases}`);
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
