// Pacote v0.1.1 da UI no Chrome real: tela de início, dica de controles da 1ª vez, menu de pausa (Esc, botão ⏸, Start), preferências,
// tela cheia (simulada), pausa durante a batalha sem quebrar a fila, e cura em quem está com a vida cheia ("Vida cheia", sem "+0").
// PC 1280×720 e iPhone paisagem 844×390 (toque). Capturas em build/qa/telas/. Uso: node tools/testar_telas.mjs [--porta=5195] [--cromo=...]
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (nome, padrao) => { const a = process.argv.find((x) => x.startsWith(`--${nome}=`)); return a ? a.slice(nome.length + 3) : padrao; };
const PORTA = Number(arg('porta', 5195)), CROMO = arg('cromo', process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe');
const DIR = join(RAIZ, 'build', 'qa', 'telas'); mkdirSync(DIR, { recursive: true });
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const resultados = []; const checar = (nome, ok, det = '') => { resultados.push({ nome, ok }); console.log(`${ok ? '✓' : '✗'} ${nome}${det ? `  (${det})` : ''}`); };

const srv = spawn(process.execPath, [join(RAIZ, 'tools/servir.mjs'), 'dev', `--porta=${PORTA}`], { cwd: RAIZ, stdio: ['ignore', 'pipe', 'pipe'] });
let log = ''; srv.stdout.on('data', (d) => { log += d; }); srv.stderr.on('data', (d) => { log += d; });
for (let i = 0; i < 100 && !log.includes('http://localhost'); i++) await dormir(100);
const nav = await puppeteer.launch({ executablePath: CROMO, headless: 'new', args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'] });

async function abrir(tela) {
  const ctx = await nav.createBrowserContext(), p = await ctx.newPage(), erros = []; // contexto novo = localStorage limpo (1ª vez)
  p.on('pageerror', (e) => erros.push(String(e))); p.on('console', (m) => { if (m.type() === 'error') erros.push(m.text()); });
  await p.setViewport(tela); await p.goto(`http://localhost:${PORTA}/?hora=13&inicio=1`);
  await p.waitForFunction('document.documentElement.dataset.pronto === "1"', { timeout: 30000 });
  await p.evaluate(() => document.getElementById('debug')?.remove());
  return { p, ctx, erros };
}
const centro = (p, sel) => p.evaluate((s) => { const e = [...document.querySelectorAll(s)].find((x) => x.getBoundingClientRect().width); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, h: r.height }; }, sel);
async function clicar(p, sel, toque = false) { const c = await centro(p, sel); if (!c) throw new Error(`sem ${sel}`); if (toque) await p.touchscreen.tap(c.x, c.y); else { await p.mouse.move(c.x, c.y, { steps: 2 }); await p.mouse.down(); await p.mouse.up(); } await dormir(150); return c; }
const visivel = (p, sel) => p.evaluate((s) => { const e = document.querySelector(s); return !!e && !e.closest('[hidden]') && e.getBoundingClientRect().width > 0; }, sel);
const pref = (p, k) => p.evaluate((k) => __dunwick.plataforma.preferencias.obter(k), k);

try {
  // ================= PC =================
  { const { p, ctx, erros } = await abrir({ width: 1280, height: 720 });
    checar('PC: tela de início aparece com título e "Clique para começar"', await p.evaluate(() => { const e = document.getElementById('inicio'); return !!e && e.textContent.includes(__dunwick.t('ui_inicio_titulo')) && e.textContent.includes(__dunwick.t('ui_inicio_clique')); }));
    checar('PC: botão ⏸ escondido durante o início', !(await visivel(p, '.tela-canto')));
    await p.screenshot({ path: join(DIR, 'pc_inicio.png') });
    await p.mouse.click(640, 360); await dormir(300);
    checar('PC: clique começa (início some, ⏸ aparece)', !(await p.evaluate(() => !!document.getElementById('inicio'))) && (await visivel(p, '.tela-canto')));
    await dormir(300);
    checar('PC: dica de controles aparece na 1ª vez', (await p.evaluate(() => document.querySelector('.tela-dica')?.textContent)) === (await p.evaluate(() => __dunwick.t('ui_dica_andar_pc'))) && (await visivel(p, '.tela-dica')));
    await p.screenshot({ path: join(DIR, 'pc_dica.png') });
    await p.keyboard.down('KeyD'); await dormir(500); await p.keyboard.up('KeyD'); await dormir(200);
    checar('PC: dica some no 1º movimento e grava dica_vista', !(await visivel(p, '.tela-dica')) && (await pref(p, 'dica_vista')) === true);

    // pausa por Esc: mundo parado
    await p.keyboard.press('Escape'); await dormir(200);
    const t0 = await p.evaluate(() => __dunwick.mundo.ticks); await dormir(600); const t1 = await p.evaluate(() => __dunwick.mundo.ticks);
    checar('PC: Esc abre a pausa e o mundo para', (await visivel(p, '.tela-pausa')) && t0 === t1 && (await p.evaluate(() => __dunwick.plataforma.pausa.pausado)), `ticks ${t0} → ${t1}`);
    await p.screenshot({ path: join(DIR, 'pc_pausa.png') });
    const v0 = await pref(p, 'volume'); await clicar(p, '.tela-passo:last-of-type'); const v1 = await pref(p, 'volume');
    checar('PC: botão + do volume sobe 10 %', Math.abs(v1 - Math.min(1, v0 + 0.1)) < 1e-9, `${v0} → ${v1}`);
    await p.keyboard.press('ArrowDown'); await p.keyboard.press('ArrowUp'); await p.keyboard.press('ArrowLeft'); const v2 = await pref(p, 'volume'); // o mouse deixou o foco na linha do volume
    checar('PC: teclado navega e ← baixa o volume', Math.abs(v2 - (v1 - 0.1)) < 1e-9, `${v1} → ${v2}`);
    // tela cheia simulada (o headless não tem tela cheia real)
    await p.evaluate(() => { const tc = __dunwick.plataforma.telaCheia; window.__fs = false; Object.defineProperty(tc, 'suportada', { get: () => true, configurable: true }); tc.ativa = () => window.__fs; tc.alternar = async () => { window.__fs = !window.__fs; return window.__fs; }; __dunwick.plataforma.preferencias.definir('reduzir_movimento', false); });
    await p.keyboard.press('Escape'); await p.keyboard.press('Escape'); await dormir(150); // fecha e reabre para redesenhar
    await clicar(p, '.tela-linha:nth-of-type(5) .tela-alterna'); await dormir(100);
    checar('PC: tela cheia liga pelo painel e grava o pedido', (await p.evaluate(() => window.__fs)) && (await pref(p, 'tela_cheia_pedida')) === true);
    checar('PC: ícone de tela cheia no canto (PC)', await visivel(p, '.tela-cheia-canto'));
    await clicar(p, '.tela-linha:nth-of-type(3) .tela-alterna');
    checar('PC: reduzir movimento liga e marca a UI', (await pref(p, 'reduzir_movimento')) === true && (await p.evaluate(() => document.querySelector('.tela').classList.contains('reduzir'))));
    await clicar(p, '.tela-linha:nth-of-type(4) .tela-alterna');
    checar('PC: velocidade da batalha vai para 2×', (await pref(p, 'velocidade_batalha')) === 2);
    await clicar(p, '.tela-continuar');
    const t2 = await p.evaluate(() => __dunwick.mundo.ticks); await dormir(400);
    checar('PC: Continuar fecha e o mundo volta a andar', !(await visivel(p, '.tela-pausa')) && (await p.evaluate(() => __dunwick.mundo.ticks)) > t2);
    await clicar(p, '.tela-botao-canto'); checar('PC: botão ⏸ abre a pausa', await visivel(p, '.tela-pausa'));
    await p.mouse.click(30, 700); await dormir(150); checar('PC: clique fora do painel fecha', !(await visivel(p, '.tela-pausa')));

    // batalha: velocidade da preferência, pausa no meio da fila, Esc só pausa quando não há o que cancelar
    await p.evaluate(() => __dunwick.jogo.iniciarBatalha('enc_slime_1', { semente: 3 }));
    await p.waitForFunction('__dunwick.batalhaUi.modo === "menu"', { timeout: 30000 });
    checar('Batalha: começa na velocidade da preferência (2×)', (await p.evaluate(() => __dunwick.jogo.batalha.velocidade)) === 2);
    await p.keyboard.press('Digit1'); await p.keyboard.press('Escape'); await dormir(100);
    checar('Batalha: Esc com alvo aberto cancela (não pausa)', (await p.evaluate(() => __dunwick.batalhaUi.modo)) === 'menu' && !(await visivel(p, '.tela-pausa')));
    await p.keyboard.press('Escape'); await dormir(100);
    checar('Batalha: Esc no menu sem escolhas abre a pausa', await visivel(p, '.tela-pausa'));
    await p.keyboard.press('Enter'); await dormir(100); // Continuar
    // Edric ataca; Grace usa a poção no Edric (vida cheia)
    await p.keyboard.press('Digit1'); await p.keyboard.press('Enter');
    await p.waitForFunction('__dunwick.batalhaUi.modo === "menu"', { timeout: 10000 });
    await p.keyboard.press('Digit3'); await p.keyboard.press('Enter'); await dormir(100);
    // D-040: "VIDA CHEIA" sobre o sprite de quem está com a vida cheia; ele continua escolhível e a cura executa e gasta o item
    const cheios = await p.evaluate(() => [...document.querySelectorAll('.bat-rotulo-grupo:not([hidden])')].filter((r) => r.querySelector('.bat-rotulo-cheia:not([hidden])')).map((r) => { const b = r.getBoundingClientRect(); return { nome: r.querySelector('.bat-placa-nome').textContent, x: b.x, y: b.y, w: b.width, h: b.height }; }));
    const sobrepoe = cheios.some((a, i) => cheios.some((b, j) => j > i && a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h));
    checar('Batalha: na escolha da poção, "VIDA CHEIA" aparece sobre os aliados com vida cheia, sem sobrepor', cheios.length === 2 && !sobrepoe, cheios.map((c) => c.nome).join(', '));
    await p.screenshot({ path: join(DIR, 'pc_vida_cheia_alvo.png') });
    const pocoesAntes = await p.evaluate(() => __dunwick.jogo.batalha.consultar().inventario.item_pocao_ervas);
    const alvoEdric = await p.evaluate(() => __dunwick.jogo.batalha.consultar().atores.find((a) => a.id === 'hero_edric'));
    await p.evaluate(() => { window.__nums = []; new MutationObserver((ms) => { for (const m of ms) for (const n of m.addedNodes) if (n.classList?.contains('bat-numero')) __nums.push({ txt: n.textContent, cls: n.className }); }).observe(document.body, { childList: true, subtree: true }); });
    // garantir que o alvo da poção é o Edric (vida cheia): navega até ele
    for (let i = 0; i < 3 && (await p.evaluate(() => document.querySelector('.bat-info-texto')?.textContent)) !== (await p.evaluate((n) => __dunwick.t(n), alvoEdric.nome_txt)); i++) await p.keyboard.press('ArrowRight');
    await p.keyboard.press('Enter');
    await dormir(400); await clicar(p, '.tela-botao-canto'); const modoPausa = await p.evaluate(() => __dunwick.batalhaUi.modo); await dormir(1500);
    checar('Batalha: pausa no meio da execução segura a fila', (await p.evaluate(() => __dunwick.batalhaUi.modo)) === modoPausa && (await visivel(p, '.tela-pausa')));
    await p.screenshot({ path: join(DIR, 'pc_pausa_batalha.png') });
    await clicar(p, '.tela-continuar');
    await p.waitForFunction('__dunwick.batalhaUi.modo === "menu" || __dunwick.batalhaUi.modo === "resultado"', { timeout: 30000 });
    const nums = await p.evaluate(() => __nums);
    checar('Batalha: a poção em vida cheia executa e é gasta', (await p.evaluate(() => __dunwick.jogo.batalha.consultar().inventario.item_pocao_ervas)) === pocoesAntes - 1 && !(await p.evaluate(() => document.querySelector('.bat-rotulo-cheia:not([hidden])'))));
    checar('Batalha: depois de continuar a rodada termina normalmente', ['menu', 'resultado'].includes(await p.evaluate(() => __dunwick.batalhaUi.modo)));
    checar('Batalha: cura na vida cheia mostra "Vida cheia" e nunca "+0"', nums.some((n) => n.cls.includes('bat-numero-cheia') && n.txt.includes(__vidaCheia())) && !nums.some((n) => /\+0\b/.test(n.txt)), JSON.stringify(nums.map((n) => n.txt)));
    function __vidaCheia() { return 'Vida cheia'; }
    checar('PC: console sem erros', erros.length === 0, erros[0] ?? '');
    await ctx.close(); }

  // ================= iPhone paisagem =================
  { const { p, ctx, erros } = await abrir({ width: 844, height: 390, deviceScaleFactor: 3, isMobile: true, hasTouch: true, isLandscape: true });
    const chamada = await p.evaluate(() => document.querySelector('#inicio .inicio-chamada')?.textContent);
    checar('iPhone: início diz "Toque para começar"', chamada === (await p.evaluate(() => __dunwick.t('ui_inicio_toque'))), chamada);
    await p.screenshot({ path: join(DIR, 'iphone_inicio.png') });
    await p.touchscreen.tap(422, 195); await dormir(400);
    checar('iPhone: toque começa e ⏸ fica visível', !(await p.evaluate(() => !!document.getElementById('inicio'))) && (await visivel(p, '.tela-canto.toque .tela-botao-canto')));
    checar('iPhone: dica "Toque no chão para andar"', (await p.evaluate(() => document.querySelector('.tela-dica')?.textContent)) === (await p.evaluate(() => __dunwick.t('ui_dica_andar_toque'))));
    await p.screenshot({ path: join(DIR, 'iphone_dica.png') });
    const bp = await clicar(p, '.tela-botao-canto', true);
    checar('iPhone: ⏸ ≥ 44 px e abre a pausa por toque', bp.w >= 44 && bp.h >= 44 && (await visivel(p, '.tela-pausa')), `${Math.round(bp.w)}×${Math.round(bp.h)}`);
    const menores = await p.evaluate(() => [...document.querySelectorAll('.tela-painel button')].filter((b) => b.getBoundingClientRect().width).map((b) => Math.min(b.getBoundingClientRect().width, b.getBoundingClientRect().height)).filter((m) => m < 40));
    checar('iPhone: controles da pausa com alvo de toque ≥ 40 px', menores.length === 0, menores.join(','));
    const dentro = await p.evaluate(() => { const ui = document.getElementById('ui').getBoundingClientRect(), r = document.querySelector('.tela-painel').getBoundingClientRect(); return r.top >= ui.top - 1 && r.bottom <= ui.bottom + 1 && r.left >= ui.left - 1 && r.right <= ui.right + 1; });
    checar('iPhone: painel de pausa cabe na tela', dentro);
    await p.screenshot({ path: join(DIR, 'iphone_pausa.png') });
    await clicar(p, '.tela-continuar', true); checar('iPhone: Continuar por toque fecha', !(await visivel(p, '.tela-pausa')));
    checar('iPhone: console sem erros', erros.length === 0, erros[0] ?? '');
    await ctx.close(); }
} catch (e) { checar(`execução: ${e.message}`, false); }
finally { await nav.close(); srv.kill(); }
const falhas = resultados.filter((r) => !r.ok).length;
console.log(`\n${resultados.length - falhas}/${resultados.length} passaram`); process.exit(falhas ? 1 : 0);
