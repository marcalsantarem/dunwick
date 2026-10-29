// Nome do mapa ao entrar (15, v0.1.2b) no Chrome real: PC 1280×720 e iPhone paisagem 844×390. Aparece no início do jogo (só depois
// da tela de início), em cada interior pela porta de verdade (portal → evento 'mapa_trocado') e na volta à vila; esmaece e some
// em ~2,5 s; não bloqueia (herói anda com ele na tela); some na batalha e na pausa; reduzir movimento = sem deslizar; legível e
// dentro do jogo, sem cobrir o ⏸. Capturas em build/qa/banner_mapa/. Uso: node tools/testar_banner_mapa.mjs [--porta=5197] [--cromo=...]
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (nome, padrao) => { const a = process.argv.find((x) => x.startsWith(`--${nome}=`)); return a ? a.slice(nome.length + 3) : padrao; };
const PORTA = Number(arg('porta', 5197)), CROMO = arg('cromo', process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe');
const DIR = join(RAIZ, 'build', 'qa', 'banner_mapa'); mkdirSync(DIR, { recursive: true });
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const resultados = []; const checar = (nome, ok, det = '') => { resultados.push({ nome, ok }); console.log(`${ok ? '✓' : '✗'} ${nome}${det ? `  (${det})` : ''}`); };

const srv = spawn(process.execPath, [join(RAIZ, 'tools/servir.mjs'), 'dev', `--porta=${PORTA}`], { cwd: RAIZ, stdio: ['ignore', 'pipe', 'pipe'] });
let log = ''; srv.stdout.on('data', (d) => { log += d; }); srv.stderr.on('data', (d) => { log += d; });
for (let i = 0; i < 100 && !log.includes('http://localhost'); i++) await dormir(100);
const nav = await puppeteer.launch({ executablePath: CROMO, headless: 'new', args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'] });

const banner = (p) => p.evaluate(() => {
  const e = document.querySelector('.tela-banner-mapa'); if (!e || e.hidden) return null;
  const r = e.getBoundingClientRect(), ui = document.getElementById('ui').getBoundingClientRect(), b = document.querySelector('.tela-botao-canto')?.getBoundingClientRect();
  return { texto: e.textContent, mapa: e.dataset.mapa, opacidade: Number(getComputedStyle(e).opacity), fonte: parseFloat(getComputedStyle(e).fontSize), transform: getComputedStyle(e).transform, eventos: getComputedStyle(e).pointerEvents,
    dentro: r.left >= ui.left - 1 && r.right <= ui.right + 1 && r.top >= ui.top - 1, cobreBotao: !!b && !(r.right < b.left || r.left > b.right || r.bottom < b.top || r.top > b.bottom), cortado: e.scrollWidth > e.clientWidth + 1 };
});
const nomeDe = (p, id) => p.evaluate((id) => __dunwick.t(__dunwick.mundo.dados.mapas[id].nome_txt), id);
// segue o banner por `ms`: maior opacidade vista, quando sumiu
async function seguir(p, ms) {
  let max = 0, sumiu = null; const t0 = Date.now();
  while (Date.now() - t0 < ms) { const b = await banner(p); if (b) max = Math.max(max, b.opacidade); else if (max > 0 && sumiu === null) sumiu = (Date.now() - t0) / 1000; await dormir(100); }
  return { max, sumiu };
}
// entra num portal de verdade: herói na chegada (fora), arma, depois dentro do retângulo; espera a troca e a névoa abrir
async function porPortal(p, filtro) {
  const portal = await p.evaluate((f) => __dunwick.mundo.mapa.dados.portais.find((x) => new RegExp(f).test(x.id) || new RegExp(f).test(x.destino.mapa)), filtro);
  await p.evaluate((pt) => { const h = __dunwick.mundo.heroi; h.x = h.ox = pt.chegada?.x ?? pt.x; h.z = h.oz = (pt.chegada?.z ?? pt.z + 1.5); }, portal); await dormir(300);
  await p.evaluate((pt) => { const h = __dunwick.mundo.heroi; h.x = h.ox = pt.x; h.z = h.oz = pt.z; }, portal);
  const ok = await p.waitForFunction((id) => __dunwick.mundo.mapaId === id, { timeout: 6000 }, portal.destino.mapa).then(() => true, () => false);
  return { ok, destino: portal.destino.mapa };
}

async function rodar(tela, nome) {
  const ctx = await nav.createBrowserContext(), p = await ctx.newPage(), erros = [];
  p.on("pageerror", (e) => erros.push(String(e.stack ?? e))); p.on('console', (m) => { if (m.type() === 'error') erros.push(m.text()); });
  await p.setViewport(tela);
  // 1) início do jogo: com a tela de início, o banner espera o jogador começar
  await p.goto(`http://localhost:${PORTA}/?hora=13&inicio=1`);
  await p.waitForFunction('document.documentElement.dataset.pronto === "1"', { timeout: 30000 });
  await p.evaluate(() => document.getElementById('debug')?.remove()); await dormir(1200);
  checar(`${nome}: não aparece sob a tela de início`, (await banner(p)) === null);
  if (tela.hasTouch) await p.tap('#inicio'); else await p.click('#inicio');
  await dormir(700);
  const b0 = await banner(p), id0 = await p.evaluate(() => __dunwick.mundo.mapaId);
  checar(`${nome}: ao começar mostra o nome do mapa`, !!b0 && b0.texto === (await nomeDe(p, id0)), b0?.texto ?? 'nada');
  checar(`${nome}: dentro do jogo, sem cobrir o ⏸, sem cortar, sem clique`, !!b0 && b0.dentro && !b0.cobreBotao && !b0.cortado && b0.eventos === 'none');
  checar(`${nome}: fonte legível (≥ 14 px)`, !!b0 && b0.fonte >= 14, `${b0?.fonte} px`);
  await p.screenshot({ path: join(DIR, `${nome}_inicio.png`) });
  // não bloqueia: o herói anda com o banner na tela
  const x0 = await p.evaluate(() => __dunwick.mundo.heroi.x);
  await p.keyboard.down('KeyD'); await dormir(400); await p.keyboard.up('KeyD');
  checar(`${nome}: não bloqueia o jogo (herói anda)`, Math.abs((await p.evaluate(() => __dunwick.mundo.heroi.x)) - x0) > 0.1 && (await banner(p)) !== null);
  const s0 = await seguir(p, 2600);
  checar(`${nome}: some sozinho (~2,5 s)`, s0.sumiu !== null && (await banner(p)) === null, `sumiu ${s0.sumiu ?? '-'} s depois`);

  // 2) cada interior pela porta e a volta (no celular, só a casa do Edric)
  const portas = tela.hasTouch ? ['casa_edric'] : ['casa_edric', 'casa_maren', 'taverna', 'forja', 'casa_torvan', 'posto_escrivao'];
  for (const f of portas) {
    const r = await porPortal(p, f); await dormir(900);
    const b = await banner(p);
    checar(`${nome}: entra em ${r.destino} → "${b?.texto ?? 'nada'}"`, r.ok && !!b && b.texto === (await nomeDe(p, r.destino)));
    if (f === 'casa_edric') await p.screenshot({ path: join(DIR, `${nome}_casa_edric.png`) });
    const s = await seguir(p, 2800); checar(`${nome}: ${r.destino}: esmaece e some`, s.max > 0.95 && s.sumiu !== null, `máx ${s.max.toFixed(2)}`);
    const v = await porPortal(p, 'saida|map_baixo'); await dormir(900);
    const bv = await banner(p); checar(`${nome}: volta à vila → "${bv?.texto ?? 'nada'}"`, v.ok && !!bv && bv.texto === (await nomeDe(p, v.destino)));
    await seguir(p, 2800);
  }

  // 3) pausa: some e volta ao fechar; batalha: some e não volta
  await porPortal(p, 'casa_edric'); await dormir(700);
  await p.keyboard.press('Escape'); await dormir(150);
  checar(`${nome}: some com a pausa aberta`, (await banner(p)) === null);
  await p.keyboard.press('Escape'); await dormir(150);
  checar(`${nome}: volta ao fechar a pausa`, (await banner(p)) !== null);
  await p.evaluate(() => __dunwick.jogo.iniciarBatalha('enc_slime_1', { semente: 1 })); await p.waitForFunction(() => __dunwick.apr.visao === 'batalha' && !__dunwick.apr.trans, { timeout: 8000 });
  checar(`${nome}: some na batalha`, (await banner(p)) === null);
  await p.evaluate(() => { __dunwick.jogo.batalha.abandonar(); __dunwick.jogo.encerrarBatalha(); }); await dormir(1500);
  checar(`${nome}: não reaparece depois da batalha`, (await banner(p)) === null);

  // 4) reduzir movimento: sem deslizar (transform só centraliza) logo no começo do esmaecer
  const reduzir = async () => { await p.keyboard.press("Escape"); await dormir(100); await p.evaluate(() => [...document.querySelectorAll(".tela-linha")].find((l) => l.textContent.includes(__dunwick.t("ui_pausa_reduzir"))).querySelector("button").click()); await p.keyboard.press("Escape"); await dormir(100); };
  await reduzir(); checar(`${nome}: reduzir movimento ligado pelo painel`, await p.evaluate(() => __dunwick.plataforma.preferencias.obter("reduzir_movimento")) === true);
  await porPortal(p, 'saida|map_baixo'); await dormir(80);
  const br = await banner(p);
  const ty = br ? Number(br.transform.match(/matrix\(([^)]+)\)/)?.[1].split(',')[5] ?? 0) : NaN;
  checar(`${nome}: reduzir movimento → sem deslizar`, !!br && Math.abs(ty) < 0.5, `transform ${br?.transform}`);
  await seguir(p, 2800); await reduzir();
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
