// Diálogo e loja fora da batalha (15, v0.1.4, D-049) no Chrome real: PC 1280×720 e iPhone paisagem 844×390, com os NPCs reais
// (data/npcs, posicionados pelo 14): Maren na vila e o ferreiro na forja (loja shop_ferreiro, preços do cfg_economia). A conversa começa
// como na exploração: E perto do NPC (PC) ou toque nele (celular).
// Cobre: caixa embaixo com nome e cor, texto aparecendo, avançar por clique/toque/Espaço/E/gamepad, mundo parado na fala; loja com
// comprar (mouse/toque, quantidade, total), sem moedas, vender pelo teclado, gamepad, A em Sair fecha; Start do gamepad abre a pausa;
// na batalha o ☰ some e C não abre o menu; sem erros no console. O menu principal tem o próprio teste (testar_menu_principal.mjs).
// Capturas em build/qa/menus_mapa/.
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

const estado = (p) => p.evaluate(() => {
  const vis = (s) => { const e = document.querySelector(s); return !!e && !e.hidden && e.getClientRects().length > 0; };
  const caixa = (s) => { const e = document.querySelector(s); if (!e || e.hidden || !e.getClientRects().length) return null; const r = e.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom, w: r.width, h: r.height }; };
  const j = __dunwick.jogo, txt = (s) => document.querySelector(s)?.textContent ?? '';
  return {
    dlg: vis('.dlg-fundo'), dlgNome: txt('.dlg-nome'), dlgTexto: txt('.dlg-texto'), dlgFala: document.querySelector('.dlg')?.dataset.fala, dlgCor: getComputedStyle(document.querySelector('.dlg-nome')).color, seta: vis('.dlg-seta'),
    loja: vis('.loja'), lojaTitulo: txt('.loja-titulo'), lojaMoedas: txt('.loja .loja-moedas'), linhas: [...document.querySelectorAll('.loja .loja-linha')].map((l) => l.dataset.item), foco: document.querySelector('.loja .loja-linha.foco')?.dataset.item ?? null,
    aba: document.querySelector('.loja-aba.ativa')?.className.match(/loja-aba-(\w+)/)?.[1], qtd: vis('.loja-qtd') ? txt('.loja-qtd-valor') : null, total: txt('.loja-total'), fala: txt('.loja-fala'),
    menu: vis('.mp'),
    invCanto: vis('.tela-inv-canto'), dica: vis('.tela-dica'), mini: vis('.minimapa'), pausa: vis('.tela-pausa:not(.loja):not(.mp):not(.tela-achado)'),
    cx: { dlg: caixa('.dlg'), loja: caixa('.loja-painel'), ui: caixa('#ui'), pausa: caixa('.tela-botao-canto') },
    transborda: [...document.querySelectorAll('.loja-painel, .dlg')].some((e) => !e.hidden && e.getClientRects().length && e.scrollWidth > e.clientWidth + 1),
    menores: [...document.querySelectorAll('.loja-painel button, .loja-linha')].filter((b) => b.getClientRects().length && b.getBoundingClientRect().height < 43.5).length,
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
  // gamepad falso (navigator.getGamepads)
  await p.evaluate(() => {
    window.__gp = { mapping: 'standard', buttons: Array.from({ length: 17 }, () => ({ pressed: false })), axes: [0, 0, 0, 0] };
    navigator.getGamepads = () => [window.__gp];
  });
  if (toque) { await p.touchscreen.tap(tela.width / 2, tela.height / 2); await dormir(300); } // 1º toque: libera o áudio e tira o aviso (08)
  const gp = async (i) => { await p.evaluate((i) => { window.__gp.buttons[i].pressed = true; }, i); await dormir(120); await p.evaluate((i) => { window.__gp.buttons[i].pressed = false; }, i); await dormir(120); };
  const tocar = async (sel) => { const b = await p.$(sel); if (toque) await b.tap(); else await b.click(); await dormir(150); };
  const tocarTela = async () => { const c = await p.evaluate(() => { const r = document.getElementById('ui').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height * 0.4 }; }); if (toque) await p.touchscreen.tap(c.x, c.y); else await p.mouse.click(c.x, c.y); await dormir(150); };
  // como o jogador: herói a 1,3 tile do NPC (de frente) e E no PC; toque no NPC no celular
  const conversar = async (id) => {
    const n = await p.evaluate((id) => { const n = __dunwick.mundo.npcs.find((q) => q.id === id), h = __dunwick.mundo.heroi; h.x = h.ox = n.x; h.z = h.oz = n.z + 1.3; h.destino = null; return { x: n.x, z: n.z }; }, id);
    await dormir(200);
    if (toque) { const c = await p.evaluate((x, z) => __dunwick.mundoParaTela(x, 0, z), n.x, n.z); await p.touchscreen.tap(c.x, c.y); } else await p.keyboard.press('KeyE');
    return p.waitForFunction(() => !!__dunwick.jogo.dialogo, { timeout: 5000 }).then(() => true, () => false);
  };
  // entra num portal de verdade (chegada, depois dentro) e espera a névoa abrir
  const porPortal = async (destino) => {
    const pt = await p.evaluate((d) => __dunwick.mundo.mapa.dados.portais.find((x) => x.destino?.mapa === d && x.ativo !== false), destino);
    await p.evaluate((pt) => { const h = __dunwick.mundo.heroi; h.x = h.ox = pt.chegada?.x ?? pt.x; h.z = h.oz = pt.chegada?.z ?? pt.z + 1.5; }, pt); await dormir(300);
    await p.evaluate((pt) => { const h = __dunwick.mundo.heroi; h.x = h.ox = pt.x; h.z = h.oz = pt.z; }, pt);
    return p.waitForFunction((d) => __dunwick.mundo.mapaId === d && !__dunwick.apr?.trans, { timeout: 8000 }, destino).then(() => true, () => false);
  };
  const hexRgb = (h) => `rgb(${parseInt(h.slice(1, 3), 16)}, ${parseInt(h.slice(3, 5), 16)}, ${parseInt(h.slice(5, 7), 16)})`;

  // 1) conversa simples: caixa embaixo, nome e cor, texto aparece aos poucos, avança por clique/toque e teclado
  // 0) (13) o jogador mira no boneco: clique/toque no CORPO e na CABEÇA do NPC (não nos pés), de longe → anda até ele e abre a conversa
  for (const [parte, altura] of [['no corpo', 0.9], ['na cabeça', 1.4]]) {
    const n = await p.evaluate(() => { const n = __dunwick.mundo.npcs.find((q) => q.id === 'npc_maren'), h = __dunwick.mundo.heroi; h.x = h.ox = n.x + 1.5; h.z = h.oz = n.z + 2.5; h.destino = null; return { x: n.x, z: n.z }; });
    await dormir(200);
    const c = await p.evaluate((x, y, z) => __dunwick.mundoParaTela(x, y, z), n.x, altura, n.z);
    if (toque) await p.touchscreen.tap(c.x, c.y); else await p.mouse.click(c.x, c.y);
    const ok = await p.waitForFunction(() => __dunwick.jogo.dialogo?.npc === 'npc_maren', { timeout: 6000 }).then(() => true, () => false);
    checar(`${nome}: ${toque ? 'toque' : 'clique'} ${parte} da Maren (de longe) anda até ela e abre a conversa`, ok);
    await p.evaluate(() => __dunwick.jogo.encerrarDialogo()); await dormir(150);
  }
  const abriu = await conversar('npc_maren'); await dormir(60);
  let e = await estado(p);
  const corMaren = await p.evaluate(() => __dunwick.mundo.dados.npcs.npc_maren.cor ?? __dunwick.mundo.dados.npcs.npc_maren.cor_falante);
  const nomeMaren = await t(p, 'txt_npc_maren_nome'), fala0 = await t(p, 'txt_dlg_maren_01');
  checar(`${nome}: ${toque ? 'toque na' : 'E perto da'} Maren abre a caixa com o nome "${e.dlgNome}"`, abriu && e.dlg && e.dialogo && e.dlgNome === nomeMaren);
  checar(`${nome}: nome na cor do falante`, e.dlgCor === hexRgb(corMaren), `${e.dlgCor} / ${corMaren}`);
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
  const naForja = await porPortal('map_forja_interior'); await dormir(300);
  const abriuF = await conversar('npc_ferreiro'); await dormir(60);
  checar(`${nome}: forja e conversa com o ferreiro`, naForja && abriuF);
  for (let k = 0; k < 16 && !(await p.evaluate(() => !!__dunwick.jogo.loja)); k++) { await p.keyboard.press('Space'); await dormir(80); }
  await dormir(150);
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

  // 4) Start do gamepad abre e fecha a pausa
  await dormir(150);
  await gp(9); e = await estado(p); const pausaGp = e.pausa; await gp(9); e = await estado(p);
  checar(`${nome}: Start do gamepad abre e fecha a pausa`, pausaGp && !e.pausa);

  // 5) batalha: sem ☰ e C não abre o menu
  await p.evaluate(() => __dunwick.jogo.iniciarBatalha('enc_slime_1', { semente: 1 })); await p.waitForFunction(() => __dunwick.apr.visao === 'batalha' && !__dunwick.apr.trans, { timeout: 8000 });
  if (!toque) { await p.keyboard.press('KeyC'); await dormir(150); }
  e = await estado(p); checar(`${nome}: na batalha o ☰ some e o menu não abre`, !e.invCanto && !e.menu);
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
