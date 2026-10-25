// Teste de fumaça + medição no Chrome REAL (GPU, via ANGLE/D3D11 no Windows). Sobe o servidor de desenvolvimento (debug ligado) e confere
// os critérios do M1 que dependem do navegador: abre sem erro, passo fixo (600 ticks/10 s), velocidades, aba oculta, pausa/passo/lento,
// exportação de tempos, escala inteira, gamepad conecta/desconecta, e mede fps (média e pior 1 %) numa rota escrita.
// Uso: npm run test:navegador [-- --medir=60] [--porta=5188] [--captura=build/qa/sala.png] [--cromo=<caminho do chrome.exe>]
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (nome, padrao) => { const a = process.argv.find((x) => x.startsWith(`--${nome}=`)); return a ? a.split('=')[1] : padrao; };
const [JW, JH] = arg('janela', '1920x1080').split('x').map(Number);
const PORTA = Number(arg('porta', 5188)), SEG_MEDIR = Number(arg('medir', 0)), CAPTURA = arg('captura', join(RAIZ, 'build', 'qa', 'sala.png'));
const VISIVEL = process.argv.includes('--visivel'); // janela real (headful): vsync do monitor, como o jogador
const SEM_VSYNC = process.argv.includes('--sem-vsync'); // mede a CAPACIDADE (fps sem o limite do monitor)
const CROMO = arg('cromo', process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe');
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const resultados = [];
const checar = (id, ok, detalhe) => { resultados.push({ id, ok, detalhe }); console.log(`${ok ? '✓' : '✗'} ${id}${detalhe ? ' — ' + detalhe : ''}`); };

const PROD = process.argv.includes('--prod'); // verifica build/prod (rode `npm run build` antes): sem debug, com hash, console limpo
const servidor = spawn(process.execPath, [join(RAIZ, 'tools/servir.mjs'), PROD ? 'prod' : 'dev', `--porta=${PORTA}`], { cwd: RAIZ, stdio: ['ignore', 'pipe', 'pipe'] });
let saidaServidor = ''; servidor.stdout.on('data', (d) => { saidaServidor += d; }); servidor.stderr.on('data', (d) => { saidaServidor += d; });
const parar = async (codigo) => { servidor.kill(); process.exit(codigo); };
for (let i = 0; i < 100 && !saidaServidor.includes('http://localhost'); i++) await dormir(100);
if (!saidaServidor.includes('http://localhost')) { console.error('servidor não subiu:\n' + saidaServidor); await parar(1); }

const navegador = await puppeteer.launch({
  executablePath: CROMO, headless: VISIVEL ? false : 'new',
  args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--enable-precise-memory-info', `--window-size=${JW},${JH}`, ...(SEM_VSYNC ? ['--disable-frame-rate-limit', '--disable-gpu-vsync'] : [])],
  defaultViewport: { width: JW, height: JH, deviceScaleFactor: 1 },
});
const pag = await navegador.newPage();
const erros = [], avisos = [];
pag.on('pageerror', (e) => erros.push(String(e)));
pag.on('console', (m) => { const t = m.text(); if (m.type() === 'error') erros.push(t); else if (m.type() === 'warning') avisos.push(t); });
pag.on('requestfailed', (r) => erros.push(`requisição falhou: ${r.url()}`));
pag.on('response', (r) => { if (r.status() >= 400 && !r.url().endsWith('favicon.ico')) erros.push(`HTTP ${r.status()}: ${r.url()}`); });

// ---- M1-01: abre sem erro e fica pronto em ≤ 8 s ----
const t0 = Date.now();
const params = [SEM_VSYNC && 'sync=1', arg('perfil', '') && `perfil=${arg('perfil', '')}`].filter(Boolean).join('&');
await pag.goto(`http://localhost:${PORTA}/${params ? '?' + params : ''}`, { waitUntil: 'load' });
await pag.waitForFunction('document.documentElement.dataset.pronto === "1" || document.documentElement.dataset.erro === "1"', { timeout: 30000 });
const tPronto = Date.now() - t0;
if (PROD) {
  const dados = await pag.evaluate(() => ({ dev: typeof window.__dunwick, debug: !!document.getElementById('debug'), canvas: [document.getElementById('tela').width, document.getElementById('tela').height], css: [...document.styleSheets].length, scripts: [...document.scripts].map((x) => x.src.split('/').pop()) }));
  checar('PROD: sem gancho de teste (__dunwick) e sem painel de debug', dados.dev === 'undefined' && !dados.debug, JSON.stringify(dados));
  checar('PROD: arquivos com hash no nome', dados.scripts.some((n) => /^app\.[0-9a-f]{8}\.js$/.test(n)), dados.scripts.join(','));
  const r = await pag.evaluate(() => ({ f1: !new KeyboardEvent('keydown', { code: 'F1', cancelable: true }) && 0, ev: (() => { const e1 = new KeyboardEvent('keydown', { code: 'F1', cancelable: true, bubbles: true }), e2 = new KeyboardEvent('keydown', { code: 'F5', cancelable: true, bubbles: true }), e3 = new KeyboardEvent('keydown', { code: 'KeyD', cancelable: true, bubbles: true }), e4 = new KeyboardEvent('keydown', { code: 'KeyW', ctrlKey: true, cancelable: true, bubbles: true }); window.dispatchEvent(e1); window.dispatchEvent(e2); window.dispatchEvent(e3); window.dispatchEvent(e4); window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyD' })); return { F1: e1.defaultPrevented, F5: e2.defaultPrevented, KeyD: e3.defaultPrevented, CtrlW: e4.defaultPrevented }; })() }));
  checar('PROD/M1-07: F1 e F5 e Ctrl+W seguem com o navegador; KeyD é do jogo', !r.ev.F1 && !r.ev.F5 && !r.ev.CtrlW && r.ev.KeyD, JSON.stringify(r.ev));
  await dormir(1500); await pag.screenshot({ path: join(dirname(CAPTURA), 'sala_producao.png') });
  checar('PROD: console limpo (0 erros)', erros.length === 0, erros.slice(0, 5).join(' | '));
  const falhasP = resultados.filter((x) => !x.ok); await navegador.close(); console.log(`
${falhasP.length ? '✗' : '✓'} ${resultados.length - falhasP.length}/${resultados.length} verificações de produção passaram`); await parar(falhasP.length ? 1 : 0);
}
const erroCarga = await pag.evaluate('document.documentElement.dataset.erro === "1"');
checar('M1-01 abre sem erro de carga', !erroCarga, erroCarga ? await pag.evaluate('document.getElementById("aviso").textContent') : `${tPronto} ms até estar pronto`);
checar('M1-01 sala jogável em ≤ 8 s', tPronto <= 8000, `${tPronto} ms`);
if (erroCarga) { console.error(erros.join('\n')); await navegador.close(); await parar(1); }
const audioInicial = await pag.evaluate('__dunwick.audio.estado');
await dormir(800);
mkdirSync(dirname(CAPTURA), { recursive: true }); await pag.screenshot({ path: CAPTURA });
const gpu = await pag.evaluate('__dunwick.ren.infoGpu()');
console.log(`  GPU: ${gpu} · Chrome ${await navegador.version()}`);
const nav = await pag.evaluate(() => { const n = performance.getEntriesByType('navigation')[0], rs = performance.getEntriesByType('resource').map((r) => `${r.name.split('/').pop()} ${r.duration.toFixed(0)}ms ${(r.transferSize / 1024).toFixed(0)}KB`); return { dcl: n.domContentLoadedEventEnd, load: n.loadEventEnd, recursos: rs }; });
console.log(`  navegação: DOMContentLoaded ${nav.dcl.toFixed(0)} ms · load ${nav.load.toFixed(0)} ms
  recursos: ${nav.recursos.join(' | ')}`);
const m = await pag.evaluate('__dunwick.marcas');
console.log(`  carga (ms): dados ${(m.dados - m.inicio).toFixed(0)} · assets ${(m.assets - m.dados).toFixed(0)} · cena ${(m.cena - m.assets).toFixed(0)} · shaders ${(m.compilado - m.cena).toFixed(0)} · total no script ${(m.compilado - m.inicio).toFixed(0)}`);

const estado = () => pag.evaluate(() => { const m = __dunwick.mundo, h = m.heroi; return { ticks: m.ticks, x: h.x, z: h.z, altura: h.altura, v: h.velocidade(), est: h.estado, t: performance.now() }; });
const tecla = { abaixo: (k) => pag.keyboard.down(k), acima: (k) => pag.keyboard.up(k) };

// ---- M1-04: passo fixo 60 Hz (600 ± 1 % ticks em 10 s) ----
{ const a = await estado(); await dormir(10000); const b = await estado(); const ticksPorSeg = ((b.ticks - a.ticks) / (b.t - a.t)) * 1000;
  checar('M1-04 passo fixo: ticks em 10 s', Math.abs(ticksPorSeg * 10 - 600) <= 6, `${((b.ticks - a.ticks) / (b.t - a.t) * 10000).toFixed(1)} ticks em 10 s (600 ± 6)`); }

// ---- M1-12: velocidades (andar 3,5 / correr 6,0 tiles/s ± 5 %) ----
async function medirVelocidade(correr, dir = 'KeyD') {
  if (correr) await tecla.abaixo('ShiftLeft');
  await tecla.abaixo(dir); await dormir(500); const a = await estado(); await dormir(1000); const b = await estado();
  await tecla.acima(dir); if (correr) await tecla.acima('ShiftLeft'); await dormir(300);
  return Math.hypot(b.x - a.x, b.z - a.z) / ((b.ticks - a.ticks) / 60);
}
{ const va = await medirVelocidade(false); checar('M1-12 andar a 3,5 tiles/s (± 5 %)', Math.abs(va - 3.5) / 3.5 <= 0.05, `${va.toFixed(3)} tiles/s`); }
await pag.evaluate(() => { const m = __dunwick.mundo, h = m.heroi; h.x = h.ox = 4.5; h.z = h.oz = 7.5; h.vx = h.vz = 0; });
{ const vc = await medirVelocidade(true); checar('M1-12 correr a 6,0 tiles/s (± 5 %)', Math.abs(vc - 6) / 6 <= 0.05, `${vc.toFixed(3)} tiles/s`); }
await pag.evaluate(() => { const m = __dunwick.mundo, h = m.heroi; h.x = h.ox = 10.5; h.z = h.oz = 5.5; h.vx = h.vz = 0; });
{ const vd = await medirVelocidade(false, 'KeyS'); const vd2 = await medirVelocidade(false, 'KeyW'); checar('M1-13 vertical = horizontal (andar)', Math.abs(vd - 3.5) <= 0.2 && Math.abs(vd2 - 3.5) <= 0.2, `${vd.toFixed(2)} / ${vd2.toFixed(2)}`); }

// ---- M1-05: aba em segundo plano pausa e NÃO simula o tempo perdido ----
await pag.evaluate(() => { const h = __dunwick.mundo.heroi; h.x = h.ox = 4.5; h.z = h.oz = 7.5; });
await tecla.abaixo('KeyD'); await dormir(300);
const antes = await pag.evaluate(() => { // lê o estado e oculta a aba no MESMO instante
  const m = __dunwick.mundo, a = { ticks: m.ticks, x: m.heroi.x, z: m.heroi.z, v: m.heroi.velocidade(), t: performance.now() };
  Object.defineProperty(document, 'hidden', { value: true, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); return a; });
await dormir(3000);
const oculto = await estado();
await pag.evaluate(() => { Object.defineProperty(document, 'hidden', { value: false, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
await dormir(200);
const volta = await estado(); await tecla.acima('KeyD');
checar('M1-05 aba oculta: ticks avançam ≤ 2 em 3 s', oculto.ticks - antes.ticks <= 2, `+${oculto.ticks - antes.ticks} ticks`);
checar('M1-05 aba oculta: herói não se move e não "corre" ao voltar', Math.abs(oculto.x - antes.x) <= 0.2 && volta.x - oculto.x < 1.5, `parado ${(oculto.x - antes.x).toFixed(3)} · depois de voltar +${(volta.x - oculto.x).toFixed(2)} tiles em 0,2 s`);
await dormir(400); const parou = await estado();
checar('M1-05 teclas soltas ao ocultar: herói não fica andando sozinho ao voltar', parou.v < 0.1, `v = ${parou.v.toFixed(2)} 0,4 s depois de voltar`);

// ---- Debug: F6/F7/F8/F9/F10, F1 ----
await pag.keyboard.press('F6'); await dormir(300); const p1 = await estado(); await dormir(1000); const p2 = await estado();
checar('debug F6 pausa a simulação', p2.ticks === p1.ticks, `${p1.ticks} → ${p2.ticks}`);
for (let i = 0; i < 3; i++) { await pag.keyboard.press('F7'); await dormir(120); }
const p3 = await estado(); checar('debug F7 avança exatamente 1 passo por toque', p3.ticks - p2.ticks === 3, `+${p3.ticks - p2.ticks} em 3 toques`);
await pag.keyboard.press('F6'); await dormir(300);
await pag.keyboard.press('F8'); await dormir(300); const l1 = await estado(); await dormir(4000); const l2 = await estado();
const razao = (l2.ticks - l1.ticks) / ((l2.t - l1.t) / 1000) / 60;
checar('debug F8 câmera lenta (0,25×)', Math.abs(razao - 0.25) < 0.03, `${razao.toFixed(3)}× do tempo real`);
await pag.keyboard.press('F8');
await pag.keyboard.press('F1'); await dormir(200);
checar('debug F1 mostra caixas', await pag.evaluate('__dunwick.debug.estado.caixas === true'));
await pag.screenshot({ path: join(dirname(CAPTURA), 'sala_debug.png') }); await pag.keyboard.press('F1');
const exp = await pag.evaluate('__dunwick.exportarTempos()');
checar('debug F9 exporta tempos de quadro', exp.quadros_ms.length > 100 && exp.resumo.fpsMedio > 0, `${exp.quadros_ms.length} quadros · ${exp.resumo.fpsMedio} fps`);
const textoDebug = await pag.evaluate('document.getElementById("debug").textContent');
checar('debug mostra fps, ticks, tile e estado', /fps .*ticks \d+/.test(textoDebug) && /herói tile \(/.test(textoDebug) && /estado (PARADO|ANDAR|CORRER)/.test(textoDebug), textoDebug.split('\n')[1] ?? '');
checar('textos: nenhum ID ausente', (await pag.evaluate('__dunwick.textosFaltando()')).length === 0, (await pag.evaluate('__dunwick.textosFaltando()')).join(','));

// ---- M1-06: escala inteira ao redimensionar ----
const escalas = {};
for (const [w, h] of [[1280, 720], [1920, 1080], [1000, 600], [2560, 1440], [700, 400]]) { await pag.setViewport({ width: w, height: h, deviceScaleFactor: 1 }); await dormir(300); escalas[`${w}x${h}`] = await pag.evaluate('__dunwick.escala()'); }
checar('M1-06 escala inteira 1280×720 → 2, 1920×1080 → 3, 2560×1440 → 4, 1000×600 → 1, 700×400 → 1', escalas['1280x720'] === 2 && escalas['1920x1080'] === 3 && escalas['2560x1440'] === 4 && escalas['1000x600'] === 1 && escalas['700x400'] === 1, JSON.stringify(escalas));
await pag.setViewport({ width: JW, height: JH, deviceScaleFactor: 1 }); await dormir(300);

// ---- M1-08/09: gamepad simulado (analógico, zona morta, desconexão) ----
await pag.evaluate(() => {
  window.__pad = { connected: true, buttons: Array.from({ length: 17 }, () => ({ pressed: false })), axes: [0.12, -0.1, 0, 0], mapping: 'standard' };
  navigator.getGamepads = () => [window.__pad && window.__pad.connected ? window.__pad : null];
  const h = __dunwick.mundo.heroi; h.x = h.ox = 4.5; h.z = h.oz = 7.5; h.vx = h.vz = 0;
});
await dormir(1500); const g0 = await estado();
checar('M1-08 analógico solto (dentro da zona morta): herói não anda sozinho (1,5 s)', g0.v < 0.01 && Math.abs(g0.x - 4.5) < 0.01, `x = ${g0.x.toFixed(3)}`);
await pag.evaluate(() => { window.__pad.axes = [1, 0, 0, 0]; }); await dormir(700); const g1 = await estado();
checar('M1-08 analógico para a direita move o herói', g1.x > g0.x + 1 && g1.v > 3, `v = ${g1.v.toFixed(2)}`);
await pag.evaluate(() => { window.__pad.connected = false; }); await dormir(150); const g2 = await estado();
checar('M1-09 desconectar solta tudo: herói para em ≤ 150 ms', g2.v < 0.01, `v = ${g2.v.toFixed(3)}`);
await pag.evaluate(() => { window.__pad.connected = true; window.__pad.axes = [0, 0, 0, 0]; }); await dormir(300);
checar('M1-09 reconectar volta sem erro', await pag.evaluate('__dunwick.entrada.gamepadConectado'));

// ---- áudio: desbloqueio por gesto ----
const audioDepois = await pag.evaluate('__dunwick.audio.estado');
checar('áudio só é criado/desbloqueado após tecla/clique', audioInicial === 'nao_criado' && audioDepois === 'running', `${audioInicial} → (teclas) → ${audioDepois}`);

// ---- M1-16/18: sprite nítido e sombra no chão (captura para o QA) ----
const info = await pag.evaluate('__dunwick.estatisticasGl()');
console.log(`  GL: ${info.chamadas} chamadas, ${info.triangulos} triângulos, ${info.texturas} texturas, ${info.geometrias} geometrias`);

// ---- capturas do QA: rampa, plataforma, escada, arena (a sombra do herói acompanha a altura) ----
await pag.keyboard.press('F2'); await dormir(100); await pag.keyboard.press('F2'); // alterna e volta (garante que F2 funciona)
for (const [nome, x, z] of [['rampa', 22.5, 4.5], ['plataforma', 29.5, 4.5], ['escada', 34.5, 9.8], ['arena', 38.5, 23.5], ['corredor', 6.5, 19.5]]) {
  await pag.evaluate(([x, z]) => { const m = __dunwick.mundo, h = m.heroi; h.x = h.ox = x; h.z = h.oz = z; h.vx = h.vz = 0; h.altura = h.oaltura = m.mapa.alturaEm(x, z); m.camera.encaixar(h); }, [x, z]);
  await dormir(500); await pag.screenshot({ path: join(dirname(CAPTURA), `sala_${nome}.png`) });
}
{ const antes = await pag.evaluate('__dunwick.perfilAtual()'); await pag.keyboard.press('F12'); await dormir(600); const depois = await pag.evaluate('__dunwick.perfilAtual()'); await pag.keyboard.press('F12'); await dormir(300); await pag.keyboard.press('F12'); await dormir(600);
  checar('debug F12 troca o perfil de qualidade (dados) sem erro', antes !== depois && await pag.evaluate('__dunwick.perfilAtual()') === antes, `${antes} → ${depois} → … → ${await pag.evaluate('__dunwick.perfilAtual()')}`); }

// ---- medição de fps numa rota escrita (opcional) ----
let medicao = null, ritmoBase = null;
if (SEG_MEDIR > 0) {
  // referência: ritmo de requestAnimationFrame de uma página em branco neste mesmo navegador/monitor (teto de apresentação)
  if (!SEM_VSYNC) {
  const branca = await navegador.newPage(); await branca.goto('data:text/html,<canvas></canvas>');
  ritmoBase = await branca.evaluate(() => new Promise((ok) => { const t = []; let u = performance.now(); const f = (a) => { t.push(a - u); u = a; if (t.length < 240) requestAnimationFrame(f); else { t.shift(); ok(1000 / (t.reduce((s, x) => s + x, 0) / t.length)); } }; requestAnimationFrame(f); }));
  await branca.close(); await pag.bringToFront(); ritmoBase = +ritmoBase.toFixed(1);
  console.log(`  ritmo de uma página em branco (teto do monitor/navegador): ${ritmoBase} fps`);
  }
  await pag.evaluate(() => { const h = __dunwick.mundo.heroi; h.x = h.ox = 4.5; h.z = h.oz = 7.5; h.vx = h.vz = 0; __dunwick.exportarTempos(); });
  console.log(`\nmedindo ${SEG_MEDIR} s (herói correndo em rota)…`);
  const rota = [['KeyD', 1800], ['KeyS', 700], ['KeyA', 1800], ['KeyW', 700], ['KeyD', 1000], ['KeyW', 1000], ['KeyA', 1000], ['KeyS', 1000]];
  await pag.evaluate(() => { window.__lt = []; window.__t0 = performance.now(); new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__lt.push({ t_s: +((e.startTime - window.__t0) / 1000).toFixed(2), ms: +e.duration.toFixed(0) }))).observe({ entryTypes: ['longtask'] }); });
  await tecla.abaixo('ShiftLeft'); const ini = Date.now();
  while (Date.now() - ini < SEG_MEDIR * 1000) for (const [k, ms] of rota) { if (Date.now() - ini >= SEG_MEDIR * 1000) break; await tecla.abaixo(k); await dormir(ms); await tecla.acima(k); }
  await tecla.acima('ShiftLeft');
  const tempos = await pag.evaluate('__dunwick.exportarTempos()');
  let acum = 0; const lentos = []; tempos.quadros_ms.forEach((x) => { acum += x; if (x > 30) lentos.push({ t_s: +(acum / 1000).toFixed(1), ms: +x.toFixed(0) }); });
  const v = tempos.quadros_ms.slice(Math.round(tempos.quadros_ms.length * 0.05)).sort((a, b) => a - b); // descarta o início (aquecimento)
  const media = 1000 / (v.reduce((s, x) => s + x, 0) / v.length), pior = v.slice(Math.floor(v.length * 0.99)), pior1 = 1000 / (pior.reduce((s, x) => s + x, 0) / pior.length);
  const mem = await pag.evaluate('performance.memory ? performance.memory.usedJSHeapSize / 1048576 : null');
  medicao = { segundos: tempos.duracao_s, quadros: v.length, fps_medio: +media.toFixed(1), fps_pior_1pct: +pior1.toFixed(1), p99_ms: +v[Math.floor(v.length * 0.99)].toFixed(2), maior_ms: +v[v.length - 1].toFixed(1), quadros_acima_50ms: v.filter((x) => x > 50).length, heap_js_mb: mem && +mem.toFixed(1), quadros_lentos_30ms: lentos, tarefas_longas_main_thread: await pag.evaluate('window.__lt'), gpu, perfil: await pag.evaluate('__dunwick.perfilAtual()') };
  console.log(JSON.stringify(medicao));
  medicao.ritmo_pagina_em_branco_fps = ritmoBase; medicao.sem_vsync = SEM_VSYNC;
  if (SEM_VSYNC) { checar('capacidade (sem vsync, com gl.finish): média ≥ 58 fps', medicao.fps_medio >= 58, `${medicao.fps_medio} fps · pior 1 % ${medicao.fps_pior_1pct}`); }
  else {
    checar('M1-02 média ≥ 58 fps (ou ≥ 98 % do teto do monitor, se o teto for menor)', medicao.fps_medio >= 58 || (ritmoBase && medicao.fps_medio >= 0.98 * ritmoBase), `${medicao.fps_medio} fps · teto medido ${ritmoBase} fps · ${(100 * medicao.fps_medio / (ritmoBase || 1)).toFixed(1)} % do teto`);
    checar('M1-02 pior 1 % ≥ 45 fps', medicao.fps_pior_1pct >= 45, `${medicao.fps_pior_1pct} fps`);
  }
  checar('M1-03 nenhum quadro > 250 ms', medicao.maior_ms <= 250, `maior ${medicao.maior_ms} ms`);
}

checar('console limpo (0 erros)', erros.length === 0, erros.slice(0, 5).join(' | '));
if (avisos.length) console.log(`  avisos do console (${avisos.length}): ${avisos.slice(0, 3).join(' | ')}`);
const mem = await navegador.version();
writeFileSync(join(dirname(CAPTURA), 'resultado_navegador.json'), JSON.stringify({ data: new Date().toISOString(), navegador: mem, gpu, resultados, medicao, avisos }, null, 1));
await navegador.close();
const falhas = resultados.filter((r) => !r.ok);
console.log(`\n${falhas.length ? '✗' : '✓'} ${resultados.length - falhas.length}/${resultados.length} verificações no navegador passaram`);
await parar(falhas.length ? 1 : 0);
