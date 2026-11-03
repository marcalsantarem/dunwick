// UI do mapa de mundo (15, v0.1.3, D-045) no Chrome real: PC 1280×720 e iPhone paisagem 844×390. Da vila ao mundo pelo vão sul (portal de
// verdade): banner "Campos de Baixo Orvalho"; minimapa inativo (▦ some, M não liga); nome do marcador ao chegar perto, ao clicar/tocar
// nele (até chegar) e "ainda inacessível" nos interditados; aviso do portal bloqueado; pausa e batalha escondem; sem cobrir ⏸ nem banner;
// volta à vila e o minimapa reaparece. Capturas em build/qa/mundo_ui/. Uso: node tools/testar_mundo_ui.mjs [--porta=5198] [--cromo=...]
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (nome, padrao) => { const a = process.argv.find((x) => x.startsWith(`--${nome}=`)); return a ? a.slice(nome.length + 3) : padrao; };
const PORTA = Number(arg('porta', 5198)), CROMO = arg('cromo', process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe');
const DIR = join(RAIZ, 'build', 'qa', 'mundo_ui'); mkdirSync(DIR, { recursive: true });
const MUNDO = 'map_mundo_orvalho';
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const resultados = []; const checar = (nome, ok, det = '') => { resultados.push({ nome, ok }); console.log(`${ok ? '✓' : '✗'} ${nome}${det ? `  (${det})` : ''}`); };

const srv = spawn(process.execPath, [join(RAIZ, 'tools/servir.mjs'), 'dev', `--porta=${PORTA}`], { cwd: RAIZ, stdio: ['ignore', 'pipe', 'pipe'] });
let log = ''; srv.stdout.on('data', (d) => { log += d; }); srv.stderr.on('data', (d) => { log += d; });
for (let i = 0; i < 100 && !log.includes('http://localhost'); i++) await dormir(100);
const nav = await puppeteer.launch({ executablePath: CROMO, headless: 'new', args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'] });

const estado = (p) => p.evaluate(() => {
  const vis = (s) => { const e = document.querySelector(s); return !!e && !e.hidden && e.getClientRects().length > 0; };
  const caixa = (s) => { const e = document.querySelector(s); if (!e || e.hidden) return null; const r = e.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom }; };
  const m = document.querySelector('.tela-marcador');
  return { mapa: __dunwick.mundo.mapaId, mini: vis('.minimapa'), canto: vis('.tela-mini-canto'), banner: vis('.tela-banner-mapa') ? document.querySelector('.tela-banner-mapa').textContent : null,
    marca: m && !m.hidden ? { nome: m.querySelector('.tela-marcador-nome').hidden ? '' : m.querySelector('.tela-marcador-nome').textContent, nota: m.querySelector('.tela-marcador-nota').hidden ? '' : m.querySelector('.tela-marcador-nota').textContent,
      id: m.dataset.marcador, interditado: m.classList.contains('interditado'), fonte: parseFloat(getComputedStyle(m.querySelector('.tela-marcador-nome')).fontSize), eventos: getComputedStyle(m).pointerEvents } : null,
    cx: { marca: caixa('.tela-marcador'), banner: caixa('.tela-banner-mapa'), pausa: caixa('.tela-botao-canto'), ui: caixa('#ui') }, pref: __dunwick.plataforma.preferencias.obter('minimapa') };
});
const cruza = (a, b) => !!a && !!b && !(a.r <= b.l || a.l >= b.r || a.b <= b.t || a.t >= b.b);
const por = (p, x, z) => p.evaluate((x, z) => { const h = __dunwick.mundo.heroi; h.x = h.ox = x; h.z = h.oz = z; h.destino = null; }, x, z);
const esperarBannerSumir = (p) => p.waitForFunction(() => document.querySelector('.tela-banner-mapa').hidden, { timeout: 6000 }).then(() => true, () => false);
async function porPortal(p, mapaDestino) {
  const pt = await p.evaluate((d) => __dunwick.mundo.mapa.dados.portais.find((x) => x.destino?.mapa === d && x.ativo !== false), mapaDestino);
  if (!pt) return false;
  await por(p, pt.chegada?.x ?? pt.x, pt.chegada?.z ?? pt.z + 2); await dormir(300); await por(p, pt.x, pt.z);
  return p.waitForFunction((d) => __dunwick.mundo.mapaId === d && !__dunwick.apr?.trans, { timeout: 8000 }, mapaDestino).then(() => true, () => false);
}

async function rodar(tela, nome) {
  const ctx = await nav.createBrowserContext(), p = await ctx.newPage(), erros = [];
  p.on('pageerror', (e) => erros.push(String(e.stack ?? e))); p.on('console', (m) => { if (m.type() === 'error') erros.push(m.text()); });
  await p.setViewport(tela);
  await p.goto(`http://localhost:${PORTA}/?hora=13`);
  await p.waitForFunction('document.documentElement.dataset.pronto === "1"', { timeout: 30000 });
  await p.evaluate(() => document.getElementById('debug')?.remove()); await esperarBannerSumir(p);
  const e0 = await estado(p);
  checar(`${nome}: na vila o minimapa e o ▦ aparecem`, e0.mini && e0.canto, `mini ${e0.mini} ▦ ${e0.canto}`);

  // 1) vila → mundo pelo vão sul
  const foi = await porPortal(p, MUNDO); await dormir(400);
  const e1 = await estado(p), nomeMundo = await p.evaluate((id) => __dunwick.t(__dunwick.mundo.dados.mapas[id].nome_txt), MUNDO);
  checar(`${nome}: vão sul leva ao mapa de mundo`, foi && e1.mapa === MUNDO, e1.mapa);
  checar(`${nome}: banner "${nomeMundo}"`, e1.banner === nomeMundo, e1.banner ?? 'nada');
  checar(`${nome}: no mundo o minimapa e o ▦ somem`, !e1.mini && !e1.canto);
  checar(`${nome}: nome do marcador espera o banner`, !e1.marca, e1.marca?.nome);
  await p.screenshot({ path: join(DIR, `${nome}_chegada.png`) });
  await esperarBannerSumir(p);
  if (!tela.hasTouch) { await p.keyboard.press('KeyM'); await dormir(150); const em = await estado(p); checar(`${nome}: M no mundo não liga nada`, !em.mini && em.pref === e1.pref); }

  // 2) perto de cada marcador: o nome (e "ainda inacessível" nos interditados)
  const portais = await p.evaluate(() => __dunwick.mundo.mapa.dados.portais);
  const textos = await p.evaluate(() => ({ inac: __dunwick.t('ui_marcador_inacessivel') }));
  for (const pt of portais) {
    await por(p, pt.x + 1.6, pt.z + 1.6); await dormir(200);
    const e = await estado(p), esperado = await p.evaluate((pt) => { const md = __dunwick.mundo.mapa.dados, poi = (md.pois ?? []).find((o) => Math.abs(o.x - pt.x) <= pt.w / 2 && Math.abs(o.z - pt.z) <= pt.d / 2); return __dunwick.t(poi?.nome_txt ?? pt.nome_txt ?? __dunwick.mundo.dados.mapas[pt.destino.mapa]?.nome_txt); }, pt);
    const ok = !!e.marca && e.marca.nome === esperado && e.marca.id === pt.id && (pt.ativo === false ? e.marca.interditado && e.marca.nota === textos.inac : !e.marca.interditado && !e.marca.nota);
    checar(`${nome}: perto de ${pt.id} → "${e.marca?.nome ?? 'nada'}"${e.marca?.nota ? ` / ${e.marca.nota}` : ''}`, ok);
    if (pt.ativo === false && pt === portais.find((q) => q.ativo === false)) await p.screenshot({ path: join(DIR, `${nome}_interditado.png`) });
  }
  const e2 = await estado(p);
  checar(`${nome}: placa legível, sem clique, dentro do jogo, sem cobrir ⏸`, !!e2.marca && e2.marca.fonte >= 14 && e2.marca.eventos === 'none' && !cruza(e2.cx.marca, e2.cx.pausa)
    && e2.cx.marca.l >= e2.cx.ui.l - 1 && e2.cx.marca.r <= e2.cx.ui.r + 1, `${e2.marca?.fonte} px`);
  await por(p, 2, 2); await dormir(200);
  checar(`${nome}: longe de tudo, sem placa`, !(await estado(p)).marca);

  // 3) aviso do portal interditado: o herói anda até encostar (evento do 13) → a nota mostra o aviso
  const fechado = portais.find((q) => q.ativo === false);
  await p.evaluate(() => { const ev = __dunwick.eventos; ev.em('portal_bloqueado', (e) => { window.__avisoVisto = e.aviso_txt; }); });
  await por(p, fechado.x, fechado.z + fechado.d / 2 + 1.2); await dormir(150);
  const alvo = await p.evaluate((x, z) => __dunwick.mundoParaTela(x, 0, z), fechado.x, fechado.z);
  if (tela.hasTouch) await p.touchscreen.tap(alvo.x, alvo.y); else await p.mouse.click(alvo.x, alvo.y);
  const viu = await p.waitForFunction(() => !!window.__avisoVisto, { timeout: 5000 }).then(() => true, () => false);
  await dormir(150);
  const e3 = await estado(p), avisoTxt = await p.evaluate(() => window.__avisoVisto && __dunwick.t(window.__avisoVisto));
  checar(`${nome}: tocar/clicar no interditado → aviso "${avisoTxt ?? '-'}"`, viu && !!e3.marca && e3.marca.nota === avisoTxt && e3.marca.interditado, e3.marca?.nota ?? 'nada');
  await p.screenshot({ path: join(DIR, `${nome}_aviso.png`) });

  // 4) clicar/tocar no marcador da vila de longe: o nome aparece já no clique e fica enquanto o herói vai
  const vila = portais.find((q) => q.ativo !== false);
  await por(p, vila.x - 6, vila.z - 6); await dormir(2800); // aviso anterior expira
  const av = await p.evaluate((x, z) => __dunwick.mundoParaTela(x, 0, z), vila.x, vila.z);
  if (tela.hasTouch) await p.touchscreen.tap(av.x, av.y); else await p.mouse.click(av.x, av.y);
  await dormir(250);
  const e4 = await estado(p);
  checar(`${nome}: clicar/tocar no marcador da vila mostra o nome de longe`, e4.mapa === MUNDO && !!e4.marca && e4.marca.id === vila.id, e4.marca?.nome ?? 'nada');

  // 5) pausa esconde e o painel continua coerente (linha do minimapa existe; ▦ não volta)
  await p.keyboard.press('Escape'); await dormir(150);
  const e5 = await estado(p), linhaMini = await p.evaluate(() => [...document.querySelectorAll('.tela-linha')].some((l) => !l.hidden && l.textContent.includes(__dunwick.t('ui_pausa_minimapa'))));
  checar(`${nome}: pausa esconde a placa e o minimapa; linha do minimapa no painel`, !e5.marca && !e5.mini && linhaMini);
  await p.keyboard.press('Escape'); await dormir(150);
  checar(`${nome}: ao fechar a pausa, ▦ continua fora`, !(await estado(p)).canto);

  // 6) volta à vila: chega lá e o minimapa reaparece
  const voltou = await p.waitForFunction(() => __dunwick.mundo.mapaId === 'map_baixo_orvalho' && !__dunwick.apr?.trans, { timeout: 15000 }).then(() => true, () => porPortal(p, 'map_baixo_orvalho'));
  await dormir(300);
  const e6 = await estado(p);
  checar(`${nome}: de volta à vila (banner "${e6.banner ?? '-'}"), minimapa e ▦ de volta, sem placa`, voltou && e6.mapa === 'map_baixo_orvalho' && e6.mini && e6.canto && !e6.marca);
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
