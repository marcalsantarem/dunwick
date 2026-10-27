// Teste de fumaça + medição no Chrome REAL (GPU, ANGLE/D3D11 no Windows). Sobe o servidor de desenvolvimento (debug ligado) e confere o que
// depende do navegador: abre sem erro, passo fixo (600 ticks/10 s), controles à Diablo com CLIQUES reais (mover, atacar inimigo, golpe
// forte, rolamento), aba oculta, debug, escala inteira, gamepad simulado, áudio por gesto, dia/noite, perfis e medições de fps.
// Uso: npm run test:navegador [-- --medir=60] [--sem-vsync] [--visivel] [--prod] [--janela=1920x1080] [--query=perfil=perfil_baixo&modo=nativa]
//      npm run test:navegador -- --comparar   (ADR-002: arte × nativa, textura de chão, capacidade por perfil; grava build/qa/comparacao.json)
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { decodificarPng } from './lib/png.mjs';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (nome, padrao) => { const a = process.argv.find((x) => x.startsWith(`--${nome}=`)); return a ? a.slice(nome.length + 3) : padrao; };
const tem = (f) => process.argv.includes(`--${f}`);
const PORTA = Number(arg('porta', 5188)), SEG_MEDIR = Number(arg('medir', 0)), CAPTURA = arg('captura', join(RAIZ, 'build', 'qa', 'praca.png')), [JW, JH] = arg('janela', '1920x1080').split('x').map(Number);
const SEM_VSYNC = tem('sem-vsync'), VISIVEL = tem('visivel'), PROD = tem('prod'), COMPARAR = tem('comparar');
const CROMO = arg('cromo', process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe');
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const resultados = [];
const checar = (id, ok, detalhe) => { resultados.push({ id, ok, detalhe }); console.log(`${ok ? '✓' : '✗'} ${id}${detalhe ? ' — ' + detalhe : ''}`); };
const dirQA = dirname(CAPTURA); mkdirSync(dirQA, { recursive: true });

const servidor = spawn(process.execPath, [join(RAIZ, 'tools/servir.mjs'), PROD ? 'prod' : 'dev', `--porta=${PORTA}`], { cwd: RAIZ, stdio: ['ignore', 'pipe', 'pipe'] });
let saidaServidor = ''; servidor.stdout.on('data', (d) => { saidaServidor += d; }); servidor.stderr.on('data', (d) => { saidaServidor += d; });
const parar = async (codigo) => { servidor.kill(); process.exit(codigo); };
for (let i = 0; i < 100 && !saidaServidor.includes('http://localhost'); i++) await dormir(100);
if (!saidaServidor.includes('http://localhost')) { console.error('servidor não subiu:\n' + saidaServidor); await parar(1); }

const navegador = await puppeteer.launch({
  executablePath: CROMO, headless: VISIVEL ? false : 'new',
  args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--enable-precise-memory-info', `--window-size=${JW},${JH}`, ...(SEM_VSYNC || COMPARAR ? ['--disable-frame-rate-limit', '--disable-gpu-vsync'] : [])],
  defaultViewport: { width: JW, height: JH, deviceScaleFactor: 1 },
});
const URL_BASE = `http://localhost:${PORTA}/`;
const erros = [], avisos = [];
async function abrir(query = '', largura = JW, altura = JH) {
  const p = await navegador.newPage(); await p.setViewport({ width: largura, height: altura, deviceScaleFactor: 1 });
  p.on('pageerror', (e) => erros.push(String(e))); p.on('console', (m) => { const t = m.text(); if (m.type() === 'error') erros.push(t); else if (m.type() === 'warning') avisos.push(t); });
  p.on('requestfailed', (r) => erros.push(`requisição falhou: ${r.url()}`)); p.on('response', (r) => { if (r.status() >= 400 && !r.url().endsWith('favicon.ico')) erros.push(`HTTP ${r.status()}: ${r.url()}`); });
  const t0 = Date.now(); await p.goto(URL_BASE + (query ? '?' + query : ''), { waitUntil: 'load' });
  await p.waitForFunction('document.documentElement.dataset.pronto === "1" || document.documentElement.dataset.erro === "1"', { timeout: 60000 }).catch(() => {});
  p.tPronto = Date.now() - t0; return p;
}

// =====================================================================================================================
if (COMPARAR) {
  // ---- ADR-002: comparações medidas (docs/tecnico/decisoes/ADR-002.md) ----
  const saida = { data: new Date().toISOString(), navegador: await navegador.version(), gpu: null, cintilacao: {}, resolucao: {}, carga: {} };
  const rota = [['KeyD', 1500], ['KeyS', 1000], ['KeyA', 1500], ['KeyW', 1000]];
  async function capacidade(query, seg = 12, janela = [JW, JH]) {
    const p = await abrir(query + (query ? '&' : '') + 'sync=1&hora=17', ...janela); await dormir(1500);
    await p.evaluate(() => __dunwick.exportarTempos()); await p.keyboard.down('ShiftLeft'); const ini = Date.now();
    while (Date.now() - ini < seg * 1000) for (const [k, ms] of rota) { if (Date.now() - ini >= seg * 1000) break; await p.keyboard.down(k); await dormir(ms); await p.keyboard.up(k); }
    await p.keyboard.up('ShiftLeft'); const t = await p.evaluate('__dunwick.exportarTempos()'), v = t.quadros_ms.slice(40).sort((a, b) => a - b);
    const m = 1000 / (v.reduce((s, x) => s + x, 0) / v.length), pior = v.slice(Math.floor(v.length * 0.99)), p1 = 1000 / (pior.reduce((s, x) => s + x, 0) / pior.length);
    const est = await p.evaluate('__dunwick.estatisticasGl()'); saida.gpu = await p.evaluate('__dunwick.ren.infoGpu()');
    const r = { fps_medio: +m.toFixed(1), fps_pior_1pct: +p1.toFixed(1), ms_medio: +(1000 / m).toFixed(2), chamadas: est.chamadas, triangulos: est.triangulos, texturas: est.texturas, render: await p.evaluate('[__dunwick.ren.estado.rw, __dunwick.ren.estado.rh]'), tPronto: p.tPronto };
    await p.close(); return r;
  }
  for (const modo of ['arte', 'nativa']) for (const perfil of ['perfil_alto', 'perfil_medio', 'perfil_baixo']) { const r = await capacidade(`perfil=${perfil}&modo=${modo}`); saida.resolucao[`${modo}_${perfil}`] = r; console.log(`${modo} ${perfil}: ${r.fps_medio} fps (pior 1 % ${r.fps_pior_1pct}), ${r.ms_medio} ms, ${r.chamadas} chamadas, render ${r.render}`); }
  for (const [w, h] of [[1280, 720], [2560, 1440]]) for (const modo of ['nativa', 'arte']) { const r = await capacidade(`perfil=perfil_alto&modo=${modo}`, 12, [w, h]); saida.resolucao[`${modo}_${w}x${h}_perfil_alto`] = r; console.log(`${modo} ${w}×${h} alto: ${r.fps_medio} fps, ${r.ms_medio} ms`); }
  // cintilação do chão ao rolar a câmera 1 pixel de arte por quadro (só o chão visível)
  async function cintilacao(query, modo) {
    const p = await abrir(`${query}&modo=${modo}&hora=13&perfil=perfil_baixo`);
    await p.evaluate(() => { document.getElementById('debug').style.display = 'none'; document.getElementById('aviso')?.remove(); const d = __dunwick; d.cena.cena.traverse((o) => { if ((o.isMesh || o.isPoints || o.isLine) && o.name !== 'solo') o.visible = false; }); d.debug.tratar('debug_pausar'); });
    const passo = 1 / 32, dx = Math.SQRT1_2, imgs = [];
    for (let k = 0; k < 4; k++) { await p.evaluate(([k, passo, dx]) => { const c = __dunwick.mundo.camera; c.x = c.ox = 24 + k * passo * dx; c.z = c.oz = 24 - k * passo * dx; c.alvoX = c.x; c.alvoZ = c.z; }, [k, passo, dx]); await dormir(150); imgs.push(decodificarPng(await p.screenshot({ type: 'png' }))); }
    const esc = Math.round(await p.evaluate('__dunwick.ren.estado.escala')), W = imgs[0].w, H = imgs[0].h; let soma = 0, n = 0; const x0 = Math.floor(W * 0.25), x1 = Math.floor(W * 0.75), y0 = Math.floor(H * 0.3), y1 = Math.floor(H * 0.7);
    for (let k = 0; k + 1 < imgs.length; k++) for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const a = imgs[k].px, b = imgs[k + 1].px, ia = (y * W + x + esc) * 4, ib = (y * W + x) * 4; soma += Math.abs(0.3 * a[ia] + 0.59 * a[ia + 1] + 0.11 * a[ia + 2] - (0.3 * b[ib] + 0.59 * b[ib + 1] + 0.11 * b[ib + 2])); n++; }
    if (modo === 'arte') writeFileSync(join(dirQA, `chao_${query.replace(/[^a-z0-9]+/g, '_')}.png`), await p.screenshot({ type: 'png', clip: { x: 480, y: 300, width: 480, height: 270 } }));
    await p.close(); return +(soma / n).toFixed(3);
  }
  for (const [nome, q] of [['texel64_mipmap_aniso', 'texel=64'], ['texel32_mipmap_aniso', 'texel=32'], ['texel32_nearest', 'texel=32&chao=nearest'], ['texel64_nearest', 'texel=64&chao=nearest']]) for (const modo of ['arte', 'nativa']) { saida.cintilacao[`${nome}_${modo}`] = await cintilacao(q, modo); console.log(`cintilação ${nome} ${modo}: ${saida.cintilacao[`${nome}_${modo}`]}`); }
  for (const modo of ['arte', 'nativa']) { const p = await abrir(`modo=${modo}&hora=17&perfil=perfil_alto`); await p.evaluate(() => { document.getElementById('debug').style.display = 'none'; document.getElementById('aviso')?.remove(); }); await dormir(1500); writeFileSync(join(dirQA, `print_${modo}.png`), await p.screenshot({ type: 'png' })); saida.carga[modo] = p.tPronto; await p.close(); }
  writeFileSync(join(dirQA, 'comparacao.json'), JSON.stringify(saida, null, 1)); console.log('\n→ build/qa/comparacao.json'); await navegador.close(); await parar(0);
}

// =====================================================================================================================
const pag = await abrir(arg('query', ''));
const gpu = await pag.evaluate(() => { const c = document.createElement('canvas').getContext('webgl2'), e = c.getExtension('WEBGL_debug_renderer_info'); return c.getParameter(e.UNMASKED_RENDERER_WEBGL); });
const erroCarga = await pag.evaluate('document.documentElement.dataset.erro === "1"');
checar('M1-01 abre sem erro de carga', !erroCarga, erroCarga ? await pag.evaluate('document.getElementById("aviso").textContent') : `${pag.tPronto} ms até estar pronto`);
checar('M1-01 jogável em ≤ 8 s', pag.tPronto <= 8000, `${pag.tPronto} ms`);
if (erroCarga) { console.error(erros.join('\n')); await navegador.close(); await parar(1); }

if (PROD) {
  const d = await pag.evaluate(() => ({ dev: typeof window.__dunwick, debug: !!document.getElementById('debug'), scripts: [...document.scripts].map((x) => x.src.split('/').pop()) }));
  checar('PROD: sem gancho de teste (__dunwick) e sem painel de debug', d.dev === 'undefined' && !d.debug, JSON.stringify(d));
  checar('PROD: arquivos com hash no nome', d.scripts.some((n) => /^app\.[0-9a-f]{8}\.js$/.test(n)), d.scripts.join(','));
  const r = await pag.evaluate(() => { const f = (o) => { const e = new KeyboardEvent('keydown', { cancelable: true, bubbles: true, ...o }); window.dispatchEvent(e); return e.defaultPrevented; }; const out = { F1: f({ code: 'F1' }), F5: f({ code: 'F5' }), CtrlW: f({ code: 'KeyW', ctrlKey: true }), KeyD: f({ code: 'KeyD' }) }; window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyD' })); return out; });
  checar('PROD/M1-07: F1, F5 e Ctrl+W seguem com o navegador; KeyD é do jogo', !r.F1 && !r.F5 && !r.CtrlW && r.KeyD, JSON.stringify(r));
  await dormir(1500); await pag.screenshot({ path: join(dirQA, 'praca_producao.png') });
  checar('PROD: console limpo (0 erros)', erros.length === 0, erros.slice(0, 5).join(' | '));
  const f = resultados.filter((x) => !x.ok); await navegador.close(); console.log(`\n${f.length ? '✗' : '✓'} ${resultados.length - f.length}/${resultados.length} verificações de produção passaram`); await parar(f.length ? 1 : 0);
}

console.log(`  GPU: ${gpu} · Chrome ${await navegador.version()}`);
const m = await pag.evaluate('__dunwick.marcas');
console.log(`  carga (ms): dados ${(m.dados - m.inicio).toFixed(0)} · assets ${(m.assets - m.dados).toFixed(0)} · cena ${(m.cena - m.assets).toFixed(0)} · shaders ${(m.compilado - m.cena).toFixed(0)} · total no script ${(m.compilado - m.inicio).toFixed(0)}`);
const audioInicial = await pag.evaluate('__dunwick.audio.estado');
await dormir(800); await pag.screenshot({ path: CAPTURA });
const estado = () => pag.evaluate(() => { const m = __dunwick.mundo, h = m.heroi; return { ticks: m.ticks, x: h.x, z: h.z, v: h.velocidade(), est: h.estado, acao: h.acao ? { tipo: h.acao.tipo, t: h.acao.t } : null, destino: h.destino, acertos: m.entidades[0].contadores.acertos, hora: m.hora, t: performance.now() }; });
const por = (x, y, z) => pag.evaluate(([x, y, z]) => __dunwick.mundoParaTela(x, y, z), [x, y, z]);
const colocar = (x, z) => pag.evaluate(([x, z]) => { const m = __dunwick.mundo, h = m.heroi; h.x = h.ox = x; h.z = h.oz = z; h.vx = h.vz = 0; h.destino = null; h.alvoId = null; h.acao = null; m.camera.encaixar(h); }, [x, z]).then(() => dormir(400)); // espera um quadro: a câmera só se move no quadro seguinte
const livre = (x, z) => pag.evaluate(([x, z]) => __dunwick.mundo.mapa.livre(x, z, 0.4), [x, z]);
await pag.evaluate(() => { __dunwick.mundo.cicloLigado = false; });

// ---- passo fixo ----
{ const a = await estado(); await dormir(10000); const b = await estado(); const tps = ((b.ticks - a.ticks) / (b.t - a.t)) * 1000; checar('M1-04 passo fixo: ticks em 10 s', Math.abs(tps * 10 - 600) <= 6, `${(tps * 10).toFixed(1)} ticks em 10 s (600 ± 6)`); }

// ---- teclado (relativo à tela) ----
async function velTeclado(tecla, correr) { if (correr) await pag.keyboard.down('ShiftLeft'); await pag.keyboard.down(tecla); await dormir(500); const a = await estado(); await dormir(800); const b = await estado(); await pag.keyboard.up(tecla); if (correr) await pag.keyboard.up('ShiftLeft'); await dormir(300); return Math.hypot(b.x - a.x, b.z - a.z) / ((b.ticks - a.ticks) / 60); }
await colocar(24.5, 28.5); { const v = await velTeclado('KeyD', false); checar('teclado: andar a 3,5 tiles/s (± 5 %)', Math.abs(v - 3.5) / 3.5 <= 0.05, `${v.toFixed(3)} tiles/s`); }
await colocar(26.5, 30.5); { const v = await velTeclado('KeyA', true); checar('teclado: correr a 6,0 tiles/s (± 5 %)', Math.abs(v - 6) / 6 <= 0.05, `${v.toFixed(3)} tiles/s`); }

// ---- mouse à Diablo ----
await colocar(24.5, 28.5);
{ let alvo = null; for (const [dx, dz] of [[6, 0], [0, 6], [-6, 0], [-4, 4], [4, 4]]) if (await livre(24.5 + dx, 28.5 + dz)) { alvo = [24.5 + dx, 28.5 + dz]; break; }
  const pt = await por(alvo[0], 0, alvo[1]); await pag.mouse.move(pt.x, pt.y); await pag.mouse.click(pt.x, pt.y); await dormir(300); const a = await estado();
  checar('mouse: clique no chão define o destino e o herói corre (> 5 tiles)', !!a.destino && a.v > 2, `destino ${a.destino ? a.destino.x.toFixed(2) + ',' + a.destino.z.toFixed(2) : 'nenhum'}, v ${a.v.toFixed(2)}`);
  await dormir(2500); const b = await estado(); checar('mouse: chega ao ponto clicado e para', Math.hypot(b.x - alvo[0], b.z - alvo[1]) < 0.4 && b.v < 0.1, `a ${Math.hypot(b.x - alvo[0], b.z - alvo[1]).toFixed(2)} tiles do alvo`); }
await pag.screenshot({ path: join(dirQA, 'praca_clique_mover.png') });
{ const al = await pag.evaluate(() => { const e = __dunwick.mundo.entidades[0]; return { x: e.x, z: e.z }; }); await colocar(al.x - 4, al.z); const alvoTela = await por(al.x, 1.0, al.z);
  await pag.mouse.move(alvoTela.x, alvoTela.y); await dormir(300); const sob = await pag.evaluate('document.getElementById("debug").textContent.includes("alvo enemy_boneco_alvo")');
  checar('mouse: cursor sobre o boneco → alvo sob o cursor detectado', sob);
  const antes = (await estado()).acertos; await pag.mouse.click(alvoTela.x, alvoTela.y); await dormir(2500); const d = await estado();
  checar('mouse: clique no boneco → aproxima, ataca e acerta (contador de acertos sobe)', d.acertos > antes, `acertos ${antes} → ${d.acertos}`); await pag.screenshot({ path: join(dirQA, 'praca_ataque.png') });
  const antes2 = d.acertos; await colocar(al.x - 1.3, al.z); await pag.mouse.move(alvoTela.x, alvoTela.y); await pag.mouse.click(alvoTela.x, alvoTela.y, { button: 'right' }); await dormir(900); const e = await estado();
  checar('mouse: botão direito = golpe forte (sem abrir o menu de contexto)', e.acertos > antes2, `acertos ${antes2} → ${e.acertos}`); }
{ await colocar(24.5, 28.5); const pt = await por(30.5, 0, 28.5); await pag.mouse.move(pt.x, pt.y); await dormir(100); const a = await estado(); await pag.keyboard.press('Space'); await dormir(120); const meio = await estado(); await dormir(600); const b = await estado(); const dist = Math.hypot(b.x - a.x, b.z - a.z);
  checar('Espaço: rolamento de ~3 tiles na direção do cursor', Math.abs(dist - 3) / 3 < 0.12, `${dist.toFixed(2)} tiles; ação ${meio.acao?.tipo}`); }

// ---- aba oculta ----
await colocar(24.5, 28.5); await pag.keyboard.down('KeyD'); await dormir(300);
const antes = await pag.evaluate(() => { const m = __dunwick.mundo, a = { ticks: m.ticks, x: m.heroi.x }; Object.defineProperty(document, 'hidden', { value: true, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); return a; });
await dormir(3000); const oculto = await estado();
await pag.evaluate(() => { Object.defineProperty(document, 'hidden', { value: false, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); }); await dormir(200); const volta = await estado(); await pag.keyboard.up('KeyD');
checar('M1-05 aba oculta: ticks avançam ≤ 2 em 3 s', oculto.ticks - antes.ticks <= 2, `+${oculto.ticks - antes.ticks} ticks`); checar('M1-05 aba oculta: herói parado e sem "corrida" ao voltar', Math.abs(oculto.x - antes.x) <= 0.2 && volta.x - oculto.x < 1.5, `parado ${(oculto.x - antes.x).toFixed(3)} · +${(volta.x - oculto.x).toFixed(2)} em 0,2 s`);
await dormir(400); await colocar(24.5, 28.5);

// ---- debug ----
await pag.keyboard.press('F6'); await dormir(300); const p1 = await estado(); await dormir(1000); const p2 = await estado(); checar('debug F6 pausa a simulação', p2.ticks === p1.ticks, `${p1.ticks} → ${p2.ticks}`);
for (let i = 0; i < 3; i++) { await pag.keyboard.press('F7'); await dormir(120); } const p3 = await estado(); checar('debug F7 avança exatamente 1 passo por toque', p3.ticks - p2.ticks === 3, `+${p3.ticks - p2.ticks} em 3 toques`); await pag.keyboard.press('F6'); await dormir(300);
await pag.keyboard.press('F8'); await dormir(300); const l1 = await estado(); await dormir(4000); const l2 = await estado(); const razao = (l2.ticks - l1.ticks) / ((l2.t - l1.t) / 1000) / 60; checar('debug F8 câmera lenta (0,25×)', Math.abs(razao - 0.25) < 0.03, `${razao.toFixed(3)}×`); await pag.keyboard.press('F8');
await pag.keyboard.press('F1'); await dormir(300); await pag.screenshot({ path: join(dirQA, 'praca_debug.png') }); checar('debug F1 mostra caixas', await pag.evaluate('__dunwick.debug.estado.caixas === true')); await pag.keyboard.press('F1');
const exp = await pag.evaluate('__dunwick.exportarTempos()'); checar('debug F9 exporta tempos de quadro', exp.quadros_ms.length > 100 && exp.resumo.fpsMedio > 0, `${exp.quadros_ms.length} quadros`);
const txt = await pag.evaluate('document.getElementById("debug").textContent'); checar('debug mostra fps, ticks, tile, hora, cursor e resolução', /fps .*ticks \d+/.test(txt) && /herói tile \(/.test(txt) && /hora \d/.test(txt) && /cursor \(/.test(txt) && /render \d+×\d+/.test(txt), txt.split('\n')[2] ?? '');
checar('textos: nenhum ID ausente', (await pag.evaluate('__dunwick.textosFaltando()')).length === 0, (await pag.evaluate('__dunwick.textosFaltando()')).join(','));
{ const a = await estado(); await pag.keyboard.press('Backquote'); await dormir(150); const b = await estado(); checar('debug ` avança 1 hora do ciclo', Math.abs(((b.hora - a.hora + 24) % 24) - 1) < 0.05, `${a.hora.toFixed(2)} → ${b.hora.toFixed(2)}`); }

// ---- dia / noite ----
for (const [nome, h] of [['manha', 9], ['meiodia', 13], ['entardecer', 17], ['noite', 21.5]]) { await pag.evaluate((h) => { __dunwick.mundo.hora = h; }, h); await dormir(700); await pag.screenshot({ path: join(dirQA, `praca_${nome}.png`) }); }
{ const lum = async (h) => { await pag.evaluate((h) => { __dunwick.mundo.hora = h; }, h); await dormir(500); const img = decodificarPng(await pag.screenshot({ type: 'png' })); let s = 0, n = 0; for (let i = 0; i < img.px.length; i += 4 * 97) { s += 0.2126 * img.px[i] + 0.7152 * img.px[i + 1] + 0.0722 * img.px[i + 2]; n++; } return s / n / 255; }; const dia = await lum(13), noite = await lum(22); checar('dia/noite: a noite é mais escura que o dia, mas legível (luminância ≥ 0,06)', noite < dia * 0.75 && noite >= 0.06, `dia ${dia.toFixed(3)} · noite ${noite.toFixed(3)}`); await pag.evaluate(() => { __dunwick.mundo.hora = 17; }); }

// ---- escala inteira (modo arte 960×540) ----
const escalas = {};
for (const [w, h] of [[1280, 720], [1920, 1080], [2560, 1440], [3840, 2160], [900, 500]]) { await pag.setViewport({ width: w, height: h, deviceScaleFactor: 1 }); await dormir(300); escalas[`${w}x${h}`] = await pag.evaluate('__dunwick.escala()'); }
checar('M1-06 escala inteira do pixel de arte: 720p→1, 1080p→2, 1440p→2, 2160p→4, janela menor→1', escalas['1280x720'] === 1 && escalas['1920x1080'] === 2 && escalas['2560x1440'] === 2 && escalas['3840x2160'] === 4 && escalas['900x500'] === 1, JSON.stringify(escalas));
await pag.setViewport({ width: JW, height: JH, deviceScaleFactor: 1 }); await dormir(300);

// ---- gamepad simulado ----
await colocar(24.5, 28.5);
await pag.evaluate(() => { window.__pad = { connected: true, buttons: Array.from({ length: 17 }, () => ({ pressed: false })), axes: [0.12, -0.1, 0, 0], mapping: 'standard' }; navigator.getGamepads = () => [window.__pad && window.__pad.connected ? window.__pad : null]; });
await dormir(1500); const g0 = await estado(); checar('M1-08 gamepad: analógico solto não anda sozinho (1,5 s)', g0.v < 0.01 && Math.abs(g0.x - 24.5) < 0.01, `x = ${g0.x.toFixed(3)}`);
await pag.evaluate(() => { window.__pad.axes = [1, 0, 0, 0]; }); await dormir(700); const g1 = await estado(); checar('M1-08 gamepad: analógico move o herói', g1.v > 3, `v = ${g1.v.toFixed(2)}`);
await pag.evaluate(() => { window.__pad.connected = false; }); await dormir(150); const g2 = await estado(); checar('M1-09 gamepad: desconectar solta tudo (herói para em ≤ 150 ms)', g2.v < 0.01, `v = ${g2.v.toFixed(3)}`);
await pag.evaluate(() => { window.__pad.connected = true; window.__pad.axes = [0, 0, 0, 0]; }); await dormir(300);

// ---- áudio e perfis ----
const audioDepois = await pag.evaluate('__dunwick.audio.estado'); checar('áudio só é criado/desbloqueado após tecla/clique', audioInicial === 'nao_criado' && audioDepois === 'running', `${audioInicial} → (teclas) → ${audioDepois}`);
{ const a = await pag.evaluate('__dunwick.perfilAtual()'); await pag.keyboard.press('F12'); await dormir(700); const b = await pag.evaluate('__dunwick.perfilAtual()'); await pag.keyboard.press('F12'); await dormir(500); await pag.keyboard.press('F12'); await dormir(700); checar('debug F12 troca o perfil (dados) sem erro', a !== b && (await pag.evaluate('__dunwick.perfilAtual()')) === a, `${a} → ${b} → … → ${await pag.evaluate('__dunwick.perfilAtual()')}`); }
{ const e = await pag.evaluate('__dunwick.estatisticasGl()'), k = await pag.evaluate('__dunwick.cena.estatisticasKit()'); console.log(`  GL: ${e.chamadas} chamadas, ${e.triangulos} triângulos, ${e.texturas} texturas · kit ${JSON.stringify(k)}`); checar('desenho: ≤ 80 chamadas por quadro (kit fundido por material)', e.chamadas <= 80, `${e.chamadas} chamadas`); }

// ---- medição de fps ----
let medicao = null;
if (SEG_MEDIR > 0) {
  await pag.evaluate(() => { __dunwick.mundo.hora = 17; const h = __dunwick.mundo.heroi; h.x = h.ox = 24.5; h.z = h.oz = 28.5; __dunwick.exportarTempos(); });
  console.log(`\nmedindo ${SEG_MEDIR} s (herói correndo em rota)…`); const rota = [['KeyD', 1500], ['KeyS', 1000], ['KeyA', 1500], ['KeyW', 1000]];
  await pag.evaluate(() => { window.__lt = []; window.__t0 = performance.now(); new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__lt.push({ t_s: +((e.startTime - window.__t0) / 1000).toFixed(2), ms: +e.duration.toFixed(0) }))).observe({ entryTypes: ['longtask'] }); });
  await pag.keyboard.down('ShiftLeft'); const ini = Date.now();
  while (Date.now() - ini < SEG_MEDIR * 1000) for (const [k, ms] of rota) { if (Date.now() - ini >= SEG_MEDIR * 1000) break; await pag.keyboard.down(k); await dormir(ms); await pag.keyboard.up(k); }
  await pag.keyboard.up('ShiftLeft'); const t = await pag.evaluate('__dunwick.exportarTempos()'); let acum = 0; const lentos = []; t.quadros_ms.forEach((x) => { acum += x; if (x > 30) lentos.push({ t_s: +(acum / 1000).toFixed(1), ms: +x.toFixed(0) }); });
  const v = t.quadros_ms.slice(Math.round(t.quadros_ms.length * 0.05)).sort((a, b) => a - b), media = 1000 / (v.reduce((s, x) => s + x, 0) / v.length), pior = v.slice(Math.floor(v.length * 0.99)), pior1 = 1000 / (pior.reduce((s, x) => s + x, 0) / pior.length);
  medicao = { segundos: t.duracao_s, quadros: v.length, fps_medio: +media.toFixed(1), fps_pior_1pct: +pior1.toFixed(1), p99_ms: +v[Math.floor(v.length * 0.99)].toFixed(2), maior_ms: +v[v.length - 1].toFixed(1), quadros_acima_50ms: v.filter((x) => x > 50).length, quadros_lentos_30ms: lentos, tarefas_longas: await pag.evaluate('window.__lt'), heap_js_mb: +(await pag.evaluate('performance.memory.usedJSHeapSize / 1048576')).toFixed(1), perfil: await pag.evaluate('__dunwick.perfilAtual()'), modo: await pag.evaluate('__dunwick.modo()'), render: await pag.evaluate('[__dunwick.ren.estado.rw, __dunwick.ren.estado.rh]'), gpu };
  console.log(JSON.stringify(medicao));
  if (SEM_VSYNC) checar('capacidade (sem vsync, com gl.finish) ≥ 60 fps', medicao.fps_medio >= 60, `${medicao.fps_medio} fps · pior 1 % ${medicao.fps_pior_1pct}`);
  else { const branca = await navegador.newPage(); await branca.goto('data:text/html,<canvas></canvas>'); const base = await branca.evaluate(() => new Promise((ok) => { const a = []; let u = performance.now(); const f = (x) => { a.push(x - u); u = x; if (a.length < 240) requestAnimationFrame(f); else { a.shift(); ok(1000 / (a.reduce((s, y) => s + y, 0) / a.length)); } }; requestAnimationFrame(f); })); await branca.close(); await pag.bringToFront(); medicao.teto_pagina_em_branco_fps = +base.toFixed(1);
    checar('M1-02 média ≥ 58 fps (ou ≥ 98 % do teto do monitor)', medicao.fps_medio >= 58 || medicao.fps_medio >= 0.98 * base, `${medicao.fps_medio} fps · teto ${base.toFixed(1)} fps · ${(100 * medicao.fps_medio / base).toFixed(1)} %`); checar('M1-02 pior 1 % ≥ 45 fps', medicao.fps_pior_1pct >= 45, `${medicao.fps_pior_1pct} fps`); }
  checar('M1-03 nenhum quadro > 250 ms', medicao.maior_ms <= 250, `maior ${medicao.maior_ms} ms`);
}
{ // encontro SEM a tecla ] (mesmo caminho do gatilho por passos): a UI liga ao controlador, mostra o menu e a vista é a da batalha
  await pag.evaluate(() => { __dunwick.jogo.iniciarBatalha('enc_slime_1'); }); await dormir(4000);
  const b = await pag.evaluate(() => ({ modo: __dunwick.jogo.modo, visao: document.getElementById('ui').dataset.visao, ligada: !!__dunwick.batalhaUi.controlador, menu: !!document.querySelector('.bat:not([hidden])') }));
  checar('batalha por encontro natural: UI ligada, menu visível e vista de batalha', b.modo === 'batalha' && b.visao === 'batalha' && b.ligada && b.menu, JSON.stringify(b));
}
checar('console limpo (0 erros)', erros.length === 0, erros.slice(0, 5).join(' | '));
if (avisos.length) console.log(`  avisos do console (${avisos.length}): ${avisos.slice(0, 3).join(' | ')}`);
writeFileSync(join(dirQA, 'resultado_navegador.json'), JSON.stringify({ data: new Date().toISOString(), navegador: await navegador.version(), gpu, resultados, medicao, avisos }, null, 1));
await navegador.close(); const falhas = resultados.filter((r) => !r.ok); console.log(`\n${falhas.length ? '✗' : '✓'} ${resultados.length - falhas.length}/${resultados.length} verificações no navegador passaram`); await parar(falhas.length ? 1 : 0);
