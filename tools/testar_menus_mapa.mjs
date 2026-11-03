// Diálogo, loja e inventário fora da batalha (15, v0.1.4, D-049) no Chrome real: PC 1280×720 e iPhone paisagem 844×390.
// Conversa e loja de verdade (conversa.js do 13, loja shop_ferreiro e preços do cfg_economia); enquanto o 14 não põe NPCs nos mapas,
// o teste registra dois NPCs de teste (textos reais do 02) e começa a conversa pelo mesmo evento da exploração ('interagiu', tipo npc).
// Cobre: caixa embaixo com nome e cor, texto aparecendo, avançar por clique/toque/Espaço/E/gamepad, mundo parado na fala; loja com
// comprar (mouse/toque, quantidade, total), sem moedas, vender pelo teclado, gamepad, Esc sai; inventário (I / ☰ / Select), pausa o
// mundo, some na batalha; Start do gamepad abre a pausa; sem erros no console. Capturas em build/qa/menus_mapa/.
// Uso: node tools/testar_menus_mapa.mjs [--porta=5196] [--cromo=...]
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (nome, padrao) => { const a = process.argv.find((x) => x.startsWith(`--${nome}=`)); return a ? a.slice(nome.length + 3) : padrao; };
const PORTA = Number(arg('porta', 5196)), CROMO = arg('cromo', process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe');
const DIR = join(RAIZ, 'build', 'qa', 'menus_mapa'); mkdirSync(DIR, { recursive: true });
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const resultados = []; const checar = (nome, ok, det = '') => { resultados.push({ nome, ok }); console.log(`${ok ? '✓' : '✗'} ${nome}${det ? `  (${det})` : ''}`); };

const srv = spawn(process.execPath, [join(RAIZ, 'tools/servir.mjs'), 'dev', `--porta=${PORTA}`], { cwd: RAIZ, stdio: ['ignore', 'pipe', 'pipe'] });
let log = ''; srv.stdout.on('data', (d) => { log += d; }); srv.stderr.on('data', (d) => { log += d; });
for (let i = 0; i < 100 && !log.includes('http://localhost'); i++) await dormir(100);
const nav = await puppeteer.launch({ executablePath: CROMO, headless: 'new', args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'] });

const NPCS = {
  npc_teste_maren: { id: 'npc_teste_maren', nome_txt: 'txt_npc_maren_nome', cor: '#7fbf6a', falas: ['txt_dlg_maren_01', 'txt_dlg_maren_02', 'txt_dlg_maren_03'] },
  npc_teste_ferreiro: { id: 'npc_teste_ferreiro', nome_txt: 'txt_npc_ferreiro_nome', cor: '#e0a050', falas: ['txt_dlg_ferreiro_01'], loja: 'shop_ferreiro' },
};
const estado = (p) => p.evaluate(() => {
  const vis = (s) => { const e = document.querySelector(s); return !!e && !e.hidden && e.getClientRects().length > 0; };
  const caixa = (s) => { const e = document.querySelector(s); if (!e || e.hidden || !e.getClientRects().length) return null; const r = e.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom, w: r.width, h: r.height }; };
  const j = __dunwick.jogo, txt = (s) => document.querySelector(s)?.textContent ?? '';
  return {
    dlg: vis('.dlg-fundo'), dlgNome: txt('.dlg-nome'), dlgTexto: txt('.dlg-texto'), dlgFala: document.querySelector('.dlg')?.dataset.fala, dlgCor: getComputedStyle(document.querySelector('.dlg-nome')).color, seta: vis('.dlg-seta'),
    loja: vis('.loja'), lojaTitulo: txt('.loja-titulo'), lojaMoedas: txt('.loja .loja-moedas'), linhas: [...document.querySelectorAll('.loja .loja-linha')].map((l) => l.dataset.item), foco: document.querySelector('.loja .loja-linha.foco')?.dataset.item ?? null,
    aba: document.querySelector('.loja-aba.ativa')?.className.match(/loja-aba-(\w+)/)?.[1], qtd: vis('.loja-qtd') ? txt('.loja-qtd-valor') : null, total: txt('.loja-total'), fala: txt('.loja-fala'),
    inv: vis('.inv'), invMoedas: txt('.inv .loja-moedas'), invItens: [...document.querySelectorAll('.inv-linha')].map((l) => [l.dataset.item, l.querySelector('.loja-info').textContent]), invHerois: document.querySelectorAll('.inv-heroi').length,
    invCanto: vis('.tela-inv-canto'), dica: vis('.tela-dica'), mini: vis('.minimapa'), pausa: vis('.tela-pausa:not(.loja):not(.inv):not(.tela-achado)'),
    cx: { dlg: caixa('.dlg'), loja: caixa('.loja-painel'), inv: caixa('.inv-painel'), ui: caixa('#ui'), pausa: caixa('.tela-botao-canto') },
    transborda: [...document.querySelectorAll('.loja-painel, .inv-painel, .dlg')].some((e) => !e.hidden && e.getClientRects().length && e.scrollWidth > e.clientWidth + 1),
    menores: [...document.querySelectorAll('.loja-painel button, .loja-linha, .inv-painel button')].filter((b) => b.getClientRects().length && b.getBoundingClientRect().height < 43.5).length,
    moedas: j.moedas, inventario: { ...j.inventario }, dialogo: !!j.dialogo, lojaJ: !!j.loja, heroi: [__dunwick.mundo.heroi.x, __dunwick.mundo.heroi.z],
  };
});
const t = (p, id, v) => p.evaluate((id, v) => __dunwick.t(id, v), id, v);
const dentro = (a, b) => !!a && !!b && a.l >= b.l - 1 && a.r <= b.r + 1 && a.t >= b.t - 1 && a.b <= b.b + 1;
const cruza = (a, b) => !!a && !!b && !(a.r <= b.l || a.l >= b.r || a.b <= b.t || a.t >= b.b);

async function rodar(tela, nome) {
  const ctx = await nav.createBrowserContext(), p = await ctx.newPage(), erros = [], toque = !!tela.hasTouch;
  p.on('pageerror', (e) => erros.push(String(e.stack ?? e))); p.on('console', (m) => { if (m.type() === 'error') erros.push(m.text()); });
  await p.setViewport(tela);
  await p.goto(`http://localhost:${PORTA}/?hora=13`);
  await p.waitForFunction('document.documentElement.dataset.pronto === "1"', { timeout: 30000 });
  await p.evaluate(() => document.getElementById('debug')?.remove());
  await p.waitForFunction(() => document.querySelector('.tela-banner-mapa').hidden, { timeout: 6000 }).catch(() => {});
  // gamepad falso (navigator.getGamepads) e NPCs de teste
  await p.evaluate((npcs) => {
    window.__gp = { mapping: 'standard', buttons: Array.from({ length: 17 }, () => ({ pressed: false })), axes: [0, 0, 0, 0] };
    navigator.getGamepads = () => [window.__gp];
    Object.assign(__dunwick.mundo.dados.npcs, npcs);
  }, NPCS);
  const gp = async (i) => { await p.evaluate((i) => { window.__gp.buttons[i].pressed = true; }, i); await dormir(120); await p.evaluate((i) => { window.__gp.buttons[i].pressed = false; }, i); await dormir(120); };
  const tocar = async (sel) => { const b = await p.$(sel); if (toque) await b.tap(); else await b.click(); await dormir(150); };
  const tocarTela = async () => { const c = await p.evaluate(() => { const r = document.getElementById('ui').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height * 0.4 }; }); if (toque) await p.touchscreen.tap(c.x, c.y); else await p.mouse.click(c.x, c.y); await dormir(150); };
  const conversar = (id) => p.evaluate((id) => __dunwick.eventos.emitir('interagiu', { mapa: __dunwick.mundo.mapaId, id, tipo: 'npc' }), id);

  // 1) conversa simples: caixa embaixo, nome e cor, texto aparece aos poucos, avança por clique/toque e teclado
  await conversar('npc_teste_maren'); await dormir(60);
  let e = await estado(p);
  const nomeMaren = await t(p, 'txt_npc_maren_nome'), fala0 = await t(p, 'txt_dlg_maren_01');
  checar(`${nome}: conversa abre a caixa com o nome "${e.dlgNome}"`, e.dlg && e.dialogo && e.dlgNome === nomeMaren);
  checar(`${nome}: nome na cor do falante`, e.dlgCor === 'rgb(127, 191, 106)', e.dlgCor);
  checar(`${nome}: texto aparecendo (ainda incompleto)`, e.dlgTexto.length < fala0.length, `${e.dlgTexto.length}/${fala0.length}`);
  checar(`${nome}: caixa embaixo, dentro do jogo, sem cobrir ⏸, sem transbordar, dica escondida`, !e.dica && dentro(e.cx.dlg, e.cx.ui) && e.cx.dlg.b > e.cx.ui.t + e.cx.ui.h * 0.7 && !cruza(e.cx.dlg, e.cx.pausa) && !e.transborda);
  checar(`${nome}: minimapa some durante a fala`, !e.mini && !e.invCanto);
  await tocarTela(); e = await estado(p);
  checar(`${nome}: 1º clique/toque completa a fala`, e.dlgTexto === fala0 && e.seta && e.dlgFala === '0');
  await p.screenshot({ path: join(DIR, `${nome}_dialogo.png`) });
  await tocarTela(); e = await estado(p);
  checar(`${nome}: 2º clique/toque passa para a próxima fala`, e.dlgFala === '1', `fala ${e.dlgFala}`);
  const h0 = e.heroi;
  if (!toque) { await p.keyboard.down('KeyD'); await dormir(300); await p.keyboard.up('KeyD'); }
  await p.keyboard.press('Space'); await dormir(60); await p.keyboard.press('KeyE'); await dormir(100); e = await estado(p);
  checar(`${nome}: Espaço completa e E avança (herói parado na conversa)`, e.dlgFala === '2' && e.heroi[0] === h0[0] && e.heroi[1] === h0[1], `fala ${e.dlgFala}`);
  await p.keyboard.press('Space'); await dormir(60); await gp(0); e = await estado(p);
  checar(`${nome}: botão A do gamepad avança e fecha na última fala`, !e.dlg && !e.dialogo);
  await dormir(200); e = await estado(p);
  checar(`${nome}: depois da conversa o minimapa e o ☰ voltam`, e.mini && e.invCanto);

  // 2) loja: fala do ferreiro → loja; compra pelo mouse/toque com quantidade e total
  await p.evaluate(() => __dunwick.jogo.alterarMoedas(80 - __dunwick.jogo.moedas));
  await conversar('npc_teste_ferreiro'); await dormir(60);
  await p.keyboard.press('Space'); await dormir(60); await p.keyboard.press('Space'); await dormir(150);
  e = await estado(p);
  const saud = await t(p, 'txt_loja_ferreiro_saudacao'), oitenta = await t(p, 'ui_moeda_varios', { valor: 80 });
  checar(`${nome}: última fala abre a loja "${e.lojaTitulo}"`, e.loja && e.lojaJ && !e.dlg && e.lojaTitulo === (await t(p, 'txt_shop_ferreiro_nome')));
  checar(`${nome}: Coroas, saudação e estoque`, e.lojaMoedas === oitenta && e.fala === saud && e.linhas.length === 4 && e.aba === 'comprar', `${e.lojaMoedas} · ${e.linhas.length} itens`);
  checar(`${nome}: painel dentro do jogo, sem transbordar, alvos ≥ 44 px`, dentro(e.cx.loja, e.cx.ui) && !e.transborda && e.menores === 0, `${e.menores} pequenos`);
  await tocar('.loja-linha[data-item="item_pocao_ervas"]'); await tocar('.loja-mais'); await tocar('.loja-mais');
  e = await estado(p);
  checar(`${nome}: quantidade 3 e total "${e.total}"`, e.qtd === (await t(p, 'ui_loja_qtd', { qtd: 3 })) && e.total === (await t(p, 'ui_loja_total', { total: await t(p, 'ui_moeda_varios', { valor: 60 }) })));
  await p.screenshot({ path: join(DIR, `${nome}_loja_comprar.png`) });
  const pocoes0 = e.inventario.item_pocao_ervas ?? 0;
  await tocar('.loja-confirmar'); e = await estado(p);
  checar(`${nome}: comprou 3 poções (80 → 20 Coroas)`, e.moedas === 20 && e.inventario.item_pocao_ervas === pocoes0 + 3 && e.lojaMoedas === (await t(p, 'ui_moeda_varios', { valor: 20 })) && e.fala === (await t(p, 'txt_loja_ferreiro_comprou', { nome_item: await t(p, 'txt_item_pocao_ervas_nome') })), e.fala);
  await tocar('.loja-linha[data-item="item_espada_ferro"]'); await tocar('.loja-confirmar'); e = await estado(p);
  checar(`${nome}: sem moedas para a espada: fala do ferreiro, nada muda`, e.moedas === 20 && !e.inventario.item_espada_ferro && e.fala === (await t(p, 'txt_loja_ferreiro_sem_moedas', { nome_item: await t(p, 'txt_item_espada_ferro_nome') })), e.fala);
  await p.screenshot({ path: join(DIR, `${nome}_loja_sem_moedas.png`) });

  // 3) vender pelo teclado (PC) ou pela aba e toque (celular); depois o gamepad navega e Esc/B sai
  if (!toque) {
    await p.keyboard.press('Escape'); await dormir(60); await p.keyboard.press('ArrowRight'); await dormir(60); e = await estado(p);
    checar(`${nome}: Esc volta da quantidade; → vai para Vender`, e.aba === 'vender' && e.loja && e.linhas.includes('item_pocao_ervas'));
    const i = e.linhas.indexOf('item_pocao_ervas'); for (let k = 0; k < i; k++) { await p.keyboard.press('ArrowDown'); await dormir(40); }
    await p.keyboard.press('Enter'); await dormir(60); await p.keyboard.press('ArrowRight'); await dormir(60); await p.keyboard.press('Enter'); await dormir(120);
  } else { await tocar('.loja-aba-vender'); await tocar('.loja-linha[data-item="item_pocao_ervas"]'); await tocar('.loja-mais'); await tocar('.loja-confirmar'); }
  e = await estado(p);
  checar(`${nome}: vendeu 2 poções (20 → 40 Coroas)`, e.moedas === 40 && e.inventario.item_pocao_ervas === pocoes0 + 1 && e.fala === (await t(p, 'txt_loja_ferreiro_vendeu', { nome_item: await t(p, 'txt_item_pocao_ervas_nome') })), `${e.moedas} · ${e.fala}`);
  await p.screenshot({ path: join(DIR, `${nome}_loja_vender.png`) });
  await gp(4); e = await estado(p); const abaLb = e.aba; // LB: aba anterior
  await gp(5); await gp(5); e = await estado(p);
  checar(`${nome}: gamepad LB/RB trocam de aba`, abaLb === 'comprar' && e.aba === 'sair', `${abaLb} → ${e.aba}`);
  await gp(0); e = await estado(p);
  checar(`${nome}: A em "Sair" fecha a loja e a conversa`, !e.loja && !e.lojaJ && !e.dialogo);

  // 4) inventário: I / ☰ abre (mundo pausado), mostra Coroas, itens e grupo; Esc / Fechar fecha; Select do gamepad abre
  await dormir(150);
  if (toque) await tocar('.tela-inv-canto'); else { await p.keyboard.press('KeyI'); await dormir(150); }
  e = await estado(p);
  checar(`${nome}: inventário abre (${toque ? '☰' : 'I'}) com Coroas, itens e o grupo`, e.inv && e.invMoedas === (await t(p, 'ui_moeda_varios', { valor: 40 })) && e.invItens.some(([id]) => id === 'item_pocao_ervas') && e.invHerois === 2, JSON.stringify(e.invItens));
  checar(`${nome}: inventário dentro do jogo, sem transbordar, alvos ≥ 44 px`, dentro(e.cx.inv, e.cx.ui) && !e.transborda && e.menores === 0);
  const pausadoInv = await p.evaluate(() => __dunwick.plataforma.pausa.motivos().join(","));
  if (!toque) { const hx = e.heroi; await p.keyboard.down('KeyD'); await dormir(300); await p.keyboard.up('KeyD'); const e2 = await estado(p); checar(`${nome}: mundo parado com o inventário aberto`, e2.heroi[0] === hx[0] && e2.inv && pausadoInv.includes("inv"), `pausa ${pausadoInv}`); }
  await p.screenshot({ path: join(DIR, `${nome}_inventario.png`) });
  if (toque) await tocar('.inv-fechar'); else { await p.keyboard.press('Escape'); await dormir(150); }
  e = await estado(p); checar(`${nome}: inventário fecha (${toque ? 'Fechar' : 'Esc'}) sem abrir a pausa`, !e.inv && !e.pausa);
  await gp(8); e = await estado(p); const abriuGp = e.inv; await gp(1); e = await estado(p);
  checar(`${nome}: Select abre e B fecha o inventário`, abriuGp && !e.inv);
  await gp(9); e = await estado(p); const pausaGp = e.pausa; await gp(9); e = await estado(p);
  checar(`${nome}: Start do gamepad abre e fecha a pausa`, pausaGp && !e.pausa);

  // 5) batalha: sem ☰ e I não abre nada
  await p.evaluate(() => __dunwick.jogo.iniciarBatalha('enc_slime_1', { semente: 1 })); await p.waitForFunction(() => __dunwick.apr.visao === 'batalha' && !__dunwick.apr.trans, { timeout: 8000 });
  if (!toque) { await p.keyboard.press('KeyI'); await dormir(150); }
  e = await estado(p); checar(`${nome}: na batalha o ☰ some e o inventário não abre`, !e.invCanto && !e.inv);
  await p.evaluate(() => { __dunwick.jogo.batalha.abandonar(); __dunwick.jogo.encerrarBatalha(); }); await dormir(1200);
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
