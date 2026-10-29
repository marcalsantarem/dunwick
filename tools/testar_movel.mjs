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
  // iPhone 11 deitado (896×414) com safe-area simulada de 44 px à esquerda e à direita (notch) + aviso de áudio
  for (const dpr of [2, 3]) {
    const p = await abrir({ ua: UA_IOS, w: 896, h: 414, dpr, movel: true });
    const txt = await p.evaluate(() => document.getElementById('aviso')?.textContent ?? null);
    checar(`iPhone 11 dpr ${dpr}: aviso de áudio pede "Toque na tela" (texto por ID)`, txt === 'Toque na tela para ativar o áudio', String(txt));
    await p.evaluate(() => { document.getElementById('seguro').style.padding = '0 44px 0 44px'; dispatchEvent(new Event('resize')); }); await dormir(400);
    await p.evaluate(() => __dunwick.jogo.iniciarBatalha('enc_misto_1', { semente: 2 })); await dormir(3800);
    const g = await p.evaluate(() => { const c = document.getElementById('tela').getBoundingClientRect(), u = document.getElementById('ui').getBoundingClientRect(), fora = [...document.querySelectorAll('.bat *')].filter((e) => { const b = e.getBoundingClientRect(); return b.width > 0 && getComputedStyle(e).visibility !== 'hidden' && (b.left < u.left - 2 || b.right > u.right + 2 || b.top < u.top - 2 || b.bottom > u.bottom + 2); }).length; return { cx: c.left, cr: innerWidth - c.right, cw: c.width, ux: u.left, ur: innerWidth - u.right, uw: u.width, fora, iw: innerWidth }; });
    checar(`iPhone 11 dpr ${dpr}: jogo dentro da área segura (≥ 44 px de cada lado), centralizado, UI inteira dentro do #ui`, g.cx >= 43.5 && g.cr >= 43.5 && Math.abs(g.cx - g.cr) <= 2 && Math.abs(g.ux - g.ur) <= 2 && g.ux >= g.cx - 1 && g.uw <= g.cw + 1 && g.fora === 0, JSON.stringify(g));
    await p.screenshot({ path: join(DIR, `iphone11_dpr${dpr}_notch_batalha.png`) });
    await p.touchscreen.tap(450, 100); await dormir(400);
    const sumiu = await p.evaluate(() => document.getElementById('aviso') === null); checar(`iPhone 11 dpr ${dpr}: a mensagem de áudio some no primeiro toque`, sumiu);
    await p.close();
  }
  // detecção automática (sem ?mobile): iPhone deitado com toque emulado
  { const p = await abrir({ ua: UA_IOS, w: 844, h: 390, dpr: 3 }); const m = await medir(p); checar('detecção automática: toque + sem hover + tela pequena liga o modo celular', m.classe.includes('movel'), m.classe); await p.close(); }
  // ---------- PC inalterado ----------
  for (const [w, h] of [[1280, 720], [1920, 1080]]) {
    const p = await abrir({ ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0', w, h, dpr: 1, touch: false }); const m = await medir(p);
    checar(`PC ${w}×${h}: sem modo celular, modo "arte", canvas cobre a janela, retângulo 16:9 preenche a janela (escala ${w === 1920 ? 'inteira 2×' : 'contínua 1,333×'})`, !m.classe.includes('movel') && m.modo === 'arte' && m.canvas[2] === w && m.canvas[3] === h && m.vw === w && m.vh === h, JSON.stringify({ classe: m.classe, modo: m.modo, canvas: m.canvas, vw: m.vw, vh: m.vh }));
    await p.screenshot({ path: join(DIR, `pc_${w}x${h}.png`) }); await p.close();
  }
  // PC com janela "estranha" (950×510): o jogo preenche (16:9 que cabe), sem a enorme margem preta; mouse mapeado no retângulo novo
  { const p = await abrir({ ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0', w: 950, h: 510, dpr: 1, touch: false }); const m = await medir(p);
    checar('PC 950×510: o jogo preenche a janela (≥ 99 % da altura, retângulo 16:9), escala contínua', m.vh >= 505 && Math.abs(m.vw / m.vh - 16 / 9) < 0.01, JSON.stringify({ vw: m.vw, vh: m.vh }));
    const h0 = await p.evaluate(() => [__dunwick.mundo.heroi.x, __dunwick.mundo.heroi.z]), alvo = await p.evaluate((x, z) => __dunwick.mundoParaTela(x, 0, z), h0[0] + 3, h0[1] - 3);
    await p.mouse.click(alvo.x, alvo.y); await dormir(1500); const h1 = await p.evaluate(() => [__dunwick.mundo.heroi.x, __dunwick.mundo.heroi.z]);
    checar('PC 950×510: clique no chão anda até o ponto clicado (mouse mapeado no retângulo contínuo)', (() => { const dx = h1[0] - h0[0], dz = h1[1] - h0[1], d = Math.hypot(dx, dz); return d > 2 && (dx * 3 - dz * 3) / (d * Math.hypot(3, 3)) > 0.9; })(), 'de ' + h0.map((v) => v.toFixed(1)) + ' para ' + h1.map((v) => v.toFixed(1))); // andou ≥ 2 tiles na direção clicada (a vila nova tem obstáculos no caminho)
    await p.screenshot({ path: join(DIR, 'pc_950x510_depois.png') }); await p.setViewport({ width: 700, height: 900 }); await dormir(400);
    const r = await medir(p); checar('redimensiona ao vivo (janela 700×900): retângulo 16:9 largura total', r.vw >= 699 && Math.abs(r.vw / r.vh - 16 / 9) < 0.01, JSON.stringify({ vw: r.vw, vh: r.vh })); await p.close(); }
  // tela de início (?inicio=1): simulação pausada até o gesto; o gesto destrava áudio e começa; versão mostrada
  for (const [rotulo, op] of [['PC', { ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0', w: 1280, h: 720, dpr: 1, touch: false, consulta: '&inicio=1' }], ['iPhone deitado', { ua: UA_IOS, w: 844, h: 390, dpr: 3, movel: true, consulta: '&inicio=1' }]]) {
    const p = await abrir(op), t0 = await p.evaluate(() => __dunwick.mundo.ticks); await dormir(700); const t1 = await p.evaluate(() => __dunwick.mundo.ticks);
    const tela = await p.evaluate(() => ({ existe: !!document.getElementById('inicio'), chamada: document.querySelector('.inicio-chamada')?.textContent, versao: document.querySelector('.inicio-versao')?.textContent }));
    checar(rotulo + ': tela de início visível, simulação parada, versão pequena', tela.existe && t1 === t0 && /^v\d/.test(tela.versao ?? '') && /começar/.test(tela.chamada ?? ''), JSON.stringify({ tela, t0, t1 }));
    await p.screenshot({ path: join(DIR, 'inicio_' + rotulo.replace(' ', '_') + '.png') });
    if (op.movel) await p.touchscreen.tap(400, 200); else await p.mouse.click(400, 300); await dormir(800);
    const dep = await p.evaluate(() => ({ existe: !!document.getElementById('inicio'), ticks: __dunwick.mundo.ticks, audio: __dunwick.audio.estado }));
    checar(rotulo + ': o gesto remove a tela, destrava o áudio e inicia a simulação', !dep.existe && dep.ticks > t1 + 10 && dep.audio === 'running', JSON.stringify(dep)); await p.close();
  }
  // entrar e sair de uma casa por portal (v0.1.2): PC e celular deitado; troca por névoa, herói reaparece na chegada, cena do interior ativa, fps medido
  for (const [rotulo, op] of [['PC', { ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0', w: 1280, h: 720, dpr: 1, touch: false }], ['iPhone deitado', { ua: UA_IOS, w: 844, h: 390, dpr: 3, movel: true }]]) {
    const p = await abrir(op);
    const info = await p.evaluate(() => { const d = __dunwick.mundo.dados.mapas, ext = __dunwick.mundo.mapaId, ed = d[ext].edificios.find((e) => e.interior), pe = d[ext].portais.find((q) => q.destino.mapa === ed.interior), pi = d[ed.interior].portais.find((q) => q.destino.mapa === ext); return { ext, int: ed.interior, pe, pi, tamanho: d[ed.interior].tamanho }; });
    const ir = (x, z) => p.evaluate((x, z) => { const h = __dunwick.mundo.heroi; h.x = h.ox = x; h.z = h.oz = z; h.vx = h.vz = 0; }, x, z);
    const esperar = (cond) => p.waitForFunction(cond, { timeout: 8000 }).then(() => true, () => false);
    await ir(info.pe.x, info.pe.z + info.pe.d + 0.2); await dormir(300); await ir(info.pe.x, info.pe.z); // toca o portal da porta
    const noInterior = await esperar(`__dunwick.mundo.mapaId === '${info.int}' && !__dunwick.apr.trans`);
    const ativa = await p.evaluate((id) => __dunwick.cena === __dunwick.cenas.get(id), info.int);
    const pos = await p.evaluate(() => [__dunwick.mundo.heroi.x, __dunwick.mundo.heroi.z]);
    checar(rotulo + ': tocar a porta leva ao interior (mapa trocado, cena do interior ativa, herói na chegada do portal de saída)', noInterior && ativa && Math.hypot(pos[0] - info.pi.chegada.x, pos[1] - info.pi.chegada.z) < 0.6, JSON.stringify({ noInterior, ativa, pos, chegada: info.pi.chegada }));
    await dormir(500); await p.screenshot({ path: join(DIR, 'interior_' + rotulo.replace(' ', '_') + '.png') });
    const fps = await p.evaluate(() => new Promise((ok) => { const f = []; let u = performance.now(); const l = (t) => { f.push(t - u); u = t; if (f.length < 120) requestAnimationFrame(l); else { const s = f.slice(10).sort((a, b) => a - b); ok({ fps: +(1000 / (s.reduce((a, b) => a + b) / s.length)).toFixed(1), p99: +s[Math.floor(s.length * 0.99)].toFixed(1) }); } }; requestAnimationFrame(l); }));
    checar(rotulo + ': fps no interior (6 cenas carregadas)', fps.fps >= 40, JSON.stringify(fps));
    // dentro do cômodo o herói não passa das paredes e a câmera centra o cômodo pequeno
    await ir(-5, -5); await dormir(300); const preso = await p.evaluate((t) => { const h = __dunwick.mundo.heroi; return h.x >= 0 && h.z >= 0 && h.x <= t[0] && h.z <= t[1]; }, info.tamanho);
    checar(rotulo + ': as paredes do cômodo seguram o herói', preso);
    await ir(info.pi.x, info.pi.z); // toca o portal de saída
    const fora = await esperar(`__dunwick.mundo.mapaId === '${info.ext}' && !__dunwick.apr.trans`);
    const pos2 = await p.evaluate(() => [__dunwick.mundo.heroi.x, __dunwick.mundo.heroi.z]);
    checar(rotulo + ': tocar a saída volta à vila, herói na chegada da porta, sem reentrar no portal', fora && Math.hypot(pos2[0] - info.pe.chegada.x, pos2[1] - info.pe.chegada.z) < 0.6, JSON.stringify({ fora, pos2, chegada: info.pe.chegada }));
    await dormir(800); const ainda = await p.evaluate(() => __dunwick.mundo.mapaId); checar(rotulo + ': continua na vila depois de 0,8 s (portal rearma só ao sair)', ainda === info.ext, ainda);
    await p.close();
  }
  // aviso do nome do mapa: ao começar e ao entrar na casa do Edric, o evento mapa_entrou traz o nome; o banner (UI) mostra "Casa do Edric" e some sozinho
  {
    const p = await abrir({ ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0', w: 1280, h: 720, dpr: 1, touch: false });
    await p.evaluate(() => { window.__nomes = []; __dunwick.mundo.eventos.em('mapa_trocado', (e) => window.__nomes.push({ mapa: e.mapa })); });
    const info = await p.evaluate(() => { const d = __dunwick.mundo.dados.mapas, ext = __dunwick.mundo.mapaId, ed = d[ext].edificios.find((e) => e.interior === 'map_casa_edric_interior'); if (!ed) return null; return { pe: d[ext].portais.find((q) => q.destino.mapa === ed.interior), nome_txt: d[ed.interior].nome_txt, texto: __dunwick.mundo.dados.textos?.['pt-BR']?.[d[ed.interior].nome_txt] ?? null }; });
    checar('casa do Edric existe na vila', !!info);
    if (info) {
      const ir = (x, z) => p.evaluate((x, z) => { const h = __dunwick.mundo.heroi; h.x = h.ox = x; h.z = h.oz = z; h.vx = h.vz = 0; }, x, z);
      await ir(info.pe.x, info.pe.z + info.pe.d + 0.2); await dormir(300); await ir(info.pe.x, info.pe.z);
      await p.waitForFunction(() => __dunwick.mundo.mapaId === 'map_casa_edric_interior' && !__dunwick.apr.trans, { timeout: 8000 }).catch(() => {});
      const ev = await p.evaluate(() => window.__nomes);
      checar('entrar na casa do Edric emite mapa_trocado para o interior', ev.length === 1 && ev[0].mapa === 'map_casa_edric_interior', JSON.stringify(ev));
      const texto = (info.texto ?? 'Casa do Edric');
      const visivel = () => p.evaluate((tx) => [...document.querySelectorAll('#ui *')].some((n) => n.children.length === 0 && n.textContent.trim() === tx && n.getClientRects().length > 0 && getComputedStyle(n).visibility !== 'hidden' && +getComputedStyle(n).opacity > 0.05), texto);
      await dormir(400); const v1 = await visivel();
      checar('o banner mostra "' + texto + '" ao entrar', v1, 'banner não encontrado em #ui');
      await p.screenshot({ path: join(DIR, 'banner_casa_edric.png') });
      let sumiu = false; for (let i = 0; i < 16 && !sumiu; i++) { await dormir(500); sumiu = !(await visivel()); }
      checar('o banner some sozinho', v1 && sumiu, v1 ? '' : 'banner nunca apareceu');
    }
    await p.close();
  }
  checar('console limpo (0 erros)', erros.length === 0, erros.slice(0, 4).join(' | '));
} finally { await nav.close(); srv.kill(); }
const f = resultados.filter((x) => !x.ok); console.log(`\n${f.length ? '✗' : '✓'} ${resultados.length - f.length}/${resultados.length} verificações do modo celular passaram`); process.exit(f.length ? 1 : 0);
