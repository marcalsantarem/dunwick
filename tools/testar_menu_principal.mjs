// Menu principal de personagem (15, v0.1.4, D-050) no Chrome real: PC 1280×720 e iPhone paisagem 844×390. Abre com C, Tab, I (Itens),
// ☰ e Select; seções à esquerda e cartões de Edric e Grace (retrato de batalha desenhado, nível, XP, vida, mana); Itens: usar poção em
// Edric ferido (vida sobe, mensagem com o valor do 03), aviso de vida cheia; Equipamento: arma de Edric, comparação com ▲/▼, item da
// Grace desabilitado, equipar troca de verdade (jogo.equipar); Status com atributos; Sistema com preferências e "sair para a tela inicial"
// (confirma; Não volta); Esc volta/fecha; mundo pausado; não abre em batalha; sem transbordar, alvos ≥ 44 px; sem erros no console.
// Capturas em build/qa/menu_principal/. Uso: node tools/testar_menu_principal.mjs [--porta=5195] [--cromo=...]
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (nome, padrao) => { const a = process.argv.find((x) => x.startsWith(`--${nome}=`)); return a ? a.slice(nome.length + 3) : padrao; };
const PORTA = Number(arg('porta', 5195)), CROMO = arg('cromo', process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe');
const DIR = join(RAIZ, 'build', 'qa', 'menu_principal'); mkdirSync(DIR, { recursive: true });
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const resultados = []; const checar = (nome, ok, det = '') => { resultados.push({ nome, ok }); console.log(`${ok ? '✓' : '✗'} ${nome}${det ? `  (${det})` : ''}`); };

const srv = spawn(process.execPath, [join(RAIZ, 'tools/servir.mjs'), 'dev', `--porta=${PORTA}`], { cwd: RAIZ, stdio: ['ignore', 'pipe', 'pipe'] });
let log = ''; srv.stdout.on('data', (d) => { log += d; }); srv.stderr.on('data', (d) => { log += d; });
for (let i = 0; i < 100 && !log.includes('http://localhost'); i++) await dormir(100);
const nav = await puppeteer.launch({ executablePath: CROMO, headless: 'new', args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'] });

const estado = (p) => p.evaluate(() => {
  const vis = (s) => { const e = document.querySelector(s); return !!e && !e.hidden && e.getClientRects().length > 0; };
  const caixa = (s) => { const e = document.querySelector(s); if (!e || e.hidden || !e.getClientRects().length) return null; const r = e.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom }; };
  const j = __dunwick.jogo, txt = (s) => document.querySelector(s)?.textContent ?? '';
  const retratos = [...document.querySelectorAll('.mp-retrato')].map((c) => { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++; return n; });
  return {
    menu: vis('.mp'), secao: document.querySelector('.mp-secao.ativa')?.className.match(/mp-secao-(\w+)/)?.[1], zonaSecoes: !!document.querySelector('.mp-secao.foco'),
    cartoes: [...document.querySelectorAll('.mp-cartao')].map((c) => ({ h: c.dataset.heroi, nivel: c.querySelector('.mp-cartao-nivel').textContent, vida: c.querySelector('.mp-barra-vida .mp-barra-texto').textContent, foco: c.classList.contains('foco'), aviso: !c.querySelector('.mp-cartao-aviso').hidden })),
    retratos, linhas: [...document.querySelectorAll('.mp-painel > .mp-lista .mp-linha')].map((l) => ({ item: l.dataset.item, heroi: l.dataset.heroi, slot: l.dataset.slot, texto: l.textContent, foco: l.classList.contains('foco'), desab: l.classList.contains('desab') })),
    sub: [...document.querySelectorAll('.mp-sub .mp-linha')].map((l) => ({ item: l.dataset.item, foco: l.classList.contains('foco'), desab: l.classList.contains('desab') })),
    attrs: [...document.querySelectorAll('.mp-attr')].map((a) => a.textContent), difs: [...document.querySelectorAll('.mp-attr-dif')].map((a) => a.className.split(' ')[1]),
    msg: vis('.mp-msg') ? txt('.mp-msg') : '', moedas: txt('.mp-moedas'), confirma: vis('.mp-confirma'), canto: vis('.tela-inv-canto'), pausaTela: vis('.tela-pausa:not(.loja):not(.mp):not(.tela-achado)'),
    cx: { quadro: caixa('.mp-quadro'), ui: caixa('#ui') }, transborda: [...document.querySelectorAll('.mp-quadro, .mp-painel, .mp-cartoes')].some((e) => e.getClientRects().length && e.scrollWidth > e.clientWidth + 1),
    menores: [...document.querySelectorAll('.mp button, .mp-linha')].filter((b) => b.getClientRects().length && b.getBoundingClientRect().height < 43.5).map((b) => b.className),
    motivos: __dunwick.plataforma.pausa.motivos(), grupo: structuredClone(j.grupo), inventario: { ...j.inventario }, equip: j.equipamentoDe('hero_edric'), reduzir: __dunwick.plataforma.preferencias.obter('reduzir_movimento'),
  };
});
const t = (p, id, v) => p.evaluate((id, v) => __dunwick.t(id, v), id, v);
const dentro = (a, b) => !!a && !!b && a.l >= b.l - 1 && a.r <= b.r + 1 && a.t >= b.t - 1 && a.b <= b.b + 1;

async function rodar(tela, nome) {
  const ctx = await nav.createBrowserContext(), p = await ctx.newPage(), erros = [], toque = !!tela.hasTouch;
  p.on('pageerror', (e) => erros.push(String(e.stack ?? e))); p.on('console', (m) => { if (m.type() === 'error') erros.push(m.text()); });
  await p.setViewport(tela);
  await p.goto(`http://localhost:${PORTA}/?hora=13`);
  await p.waitForFunction('document.documentElement.dataset.pronto === "1"', { timeout: 30000 });
  await p.evaluate(() => { document.getElementById('debug')?.remove(); window.__gp = { mapping: 'standard', buttons: Array.from({ length: 17 }, () => ({ pressed: false })), axes: [0, 0, 0, 0] }; navigator.getGamepads = () => [window.__gp]; });
  if (toque) { await p.touchscreen.tap(tela.width / 2, tela.height / 2); await dormir(300); }
  await p.waitForFunction(() => document.querySelector('.tela-banner-mapa').hidden, { timeout: 6000 }).catch(() => {});
  const gp = async (i) => { await p.evaluate((i) => { window.__gp.buttons[i].pressed = true; }, i); await dormir(120); await p.evaluate((i) => { window.__gp.buttons[i].pressed = false; }, i); await dormir(120); };
  const tocar = async (sel) => { const b = await p.$(sel); if (!b) throw new Error(`sem ${sel}`); if (toque) await b.tap(); else await b.click(); await dormir(150); };
  const tecla = async (k, n = 1) => { for (let i = 0; i < n; i++) { await p.keyboard.press(k); await dormir(60); } };
  // preparo: Edric ferido, uma espada de ferro (Edric) e um cajado de freixo (Grace) na bolsa
  await p.evaluate(() => { const j = __dunwick.jogo; j.grupo.hero_edric.vida = 10; j.adicionarItem('item_espada_ferro', 1); j.adicionarItem('item_cajado_freixo', 1); });

  // 1) abrir: C (PC) / ☰ (celular); cartões e seções
  if (toque) await tocar('.tela-inv-canto'); else await tecla('KeyC');
  let e = await estado(p);
  checar(`${nome}: ${toque ? '☰' : 'C'} abre o menu (mundo pausado: ${e.motivos.join(',')})`, e.menu && e.motivos.includes('menu') && e.zonaSecoes);
  checar(`${nome}: cartões de Edric e Grace com retrato desenhado`, e.cartoes.map((c) => c.h).join() === 'hero_edric,hero_grace' && e.retratos.every((n) => n > 200), e.retratos.join('/'));
  checar(`${nome}: tela cheia dentro do jogo, sem transbordar, alvos ≥ 44 px`, dentro(e.cx.quadro, e.cx.ui) && !e.transborda && e.menores.length === 0, e.menores.slice(0, 3).join(' | '));
  checar(`${nome}: Coroas no rodapé`, e.moedas === (await t(p, 'ui_moeda_varios', { valor: await p.evaluate(() => __dunwick.jogo.moedas) })), e.moedas);

  // 2) Itens: usar poção em Edric ferido; com vida cheia só avisa
  if (toque) await tocar('.mp-secao-itens'); else await tecla('Enter');
  e = await estado(p);
  const iPocao = e.linhas.findIndex((l) => l.item === 'item_pocao_ervas'), equipDesab = e.linhas.find((l) => l.item === 'item_espada_ferro')?.desab;
  checar(`${nome}: Itens lista a bolsa (poção usável, espada não)`, e.secao === 'itens' && iPocao >= 0 && !e.linhas[iPocao].desab && equipDesab === true);
  const pocoes = e.inventario.item_pocao_ervas, vida0 = e.grupo.hero_edric.vida;
  if (toque) await tocar('.mp-linha[data-item="item_pocao_ervas"]'); else { await tecla('ArrowDown', iPocao); await tecla('Enter'); }
  e = await estado(p);
  checar(`${nome}: escolher alvo ("${e.msg}")`, e.msg === (await t(p, 'ui_menu_itens_escolha')) && e.cartoes[0].foco);
  await p.screenshot({ path: join(DIR, `${nome}_itens_alvo.png`) });
  if (toque) await tocar('.mp-cartao[data-heroi="hero_edric"]'); else await tecla('Enter');
  e = await estado(p);
  const ganho = e.grupo.hero_edric.vida - vida0;
  checar(`${nome}: poção em Edric: vida ${vida0} → ${e.grupo.hero_edric.vida}, 1 poção a menos, mensagem`, ganho > 0 && e.inventario.item_pocao_ervas === pocoes - 1 && e.msg === (await t(p, 'ui_msg_cura_recuperou', { nome_ator: 'Edric', valor: ganho })), e.msg);
  // Grace está com vida cheia: aviso no cartão ao mirar nela
  if (e.inventario.item_pocao_ervas > 0) {
    if (toque) await tocar('.mp-linha[data-item="item_pocao_ervas"]'); else await tecla('ArrowRight'); // no PC o alvo continua escolhido depois do uso
    e = await estado(p);
    if (!toque) checar(`${nome}: mirar na Grace (vida cheia) mostra o aviso`, e.cartoes[1].foco && e.cartoes[1].aviso);
    if (toque) await tocar('.mp-cartao[data-heroi="hero_edric"]'); else await tecla('Escape');
  }

  // 3) Equipamento: arma de Edric → espada de ferro (▲), cajado da Grace desabilitado; equipar
  if (toque) await tocar('.mp-secao-equipamento'); else { await tecla('Escape'); await tecla('ArrowDown'); await tecla('Enter'); }
  e = await estado(p);
  checar(`${nome}: Equipamento: 4 espaços (Edric e Grace × arma/armadura)`, e.secao === 'equipamento' && e.linhas.length === 4 && e.linhas[0].heroi === 'hero_edric' && e.linhas[0].slot === 'arma', e.linhas.map((l) => l.texto).join(' | '));
  if (toque) await tocar('.mp-linha[data-heroi="hero_edric"][data-slot="arma"]'); else await tecla('Enter');
  e = await estado(p);
  const espada = e.sub.find((o) => o.item === 'item_espada_ferro'), cajado = e.sub.find((o) => o.item === 'item_cajado_freixo');
  checar(`${nome}: opções da arma: espada (Edric) e cajado desabilitado (Grace)`, !!espada && !espada.desab && !!cajado && cajado.desab);
  if (e.sub[0]?.item !== 'item_espada_ferro' && !toque) await tecla('ArrowDown');
  if (toque) { await p.$eval('.mp-sub .mp-linha[data-item="item_espada_ferro"]', (l) => l.dispatchEvent(new PointerEvent('pointerenter'))); await dormir(100); }
  e = await estado(p);
  checar(`${nome}: comparação com ▲ no poder da arma`, e.difs[0] === 'sobe' && e.attrs.some((a) => a.includes('▲')), e.attrs[0]);
  await p.screenshot({ path: join(DIR, `${nome}_equipamento.png`) });
  if (toque) await tocar('.mp-sub .mp-linha[data-item="item_espada_ferro"]'); else await tecla('Enter');
  e = await estado(p);
  checar(`${nome}: equipou: Edric com espada de ferro, treino de volta à bolsa`, e.equip.arma === 'item_espada_ferro' && e.inventario.item_espada_treino === 1 && !e.inventario.item_espada_ferro && e.msg === (await t(p, 'ui_msg_equipou', { nome_ator: 'Edric', nome_item: await t(p, 'txt_item_espada_ferro_nome') })), e.msg);

  // 4) Status
  if (toque) await tocar('.mp-secao-status'); else { await tecla('Escape'); await tecla('ArrowDown'); await tecla('Enter'); }
  e = await estado(p);
  checar(`${nome}: Status com atributos (vigor, força, poder da arma 18)`, e.secao === 'status' && e.attrs.some((a) => a.startsWith(t && 'Vigor')) && e.attrs.some((a) => a.includes('18')), e.attrs.slice(0, 3).join(' | '));
  await p.screenshot({ path: join(DIR, `${nome}_status.png`) });

  // 5) Sistema: preferência pelo menu; sair para a tela inicial pede confirmação; Não volta
  if (toque) await tocar('.mp-secao-sistema'); else { await tecla('Escape'); await tecla('ArrowDown'); await tecla('Enter'); }
  e = await estado(p);
  const iRed = e.linhas.findIndex((l) => l.texto.startsWith(t && 'Reduzir')), r0 = e.reduzir;
  if (toque) await tocar(`.mp-painel > .mp-lista .mp-linha:nth-child(${iRed + 1}) .mp-valor`); else { await tecla('ArrowDown', iRed); await tecla('ArrowRight'); }
  e = await estado(p);
  checar(`${nome}: Sistema muda "reduzir movimento" (${r0} → ${e.reduzir})`, e.secao === 'sistema' && e.reduzir === !r0);
  if (toque) await tocar(`.mp-painel > .mp-lista .mp-linha:nth-child(${iRed + 1}) .mp-valor`); else await tecla('ArrowLeft');
  if (toque) await tocar('.mp-painel > .mp-lista .mp-linha:last-child'); else { await tecla('ArrowDown', e.linhas.length - 1 - iRed); await tecla('Enter'); }
  e = await estado(p);
  checar(`${nome}: "sair para a tela inicial" pede confirmação`, e.confirma);
  await p.screenshot({ path: join(DIR, `${nome}_sistema_confirma.png`) });
  if (toque) await tocar('.mp-nao'); else await tecla('Enter'); // foco começa no Não
  e = await estado(p); checar(`${nome}: Não volta ao menu`, e.menu && !e.confirma);

  // 6) fechar: Esc volta até fechar (PC) / botão Fechar (celular); não abre a pausa; mundo solto
  if (toque) await tocar('.mp-fechar'); else await tecla('Escape', 2);
  e = await estado(p);
  checar(`${nome}: fecha sem abrir a pausa e solta o mundo`, !e.menu && !e.pausaTela && !e.motivos.includes('menu'), e.motivos.join(','));
  if (!toque) { await tecla('KeyI'); e = await estado(p); const itens = e.secao === 'itens' && e.menu; await tecla('Tab'); await dormir(100); const e2 = await estado(p); checar(`${nome}: I abre em Itens e Tab fecha`, itens && !e2.menu); }
  await gp(8); e = await estado(p); const abriuGp = e.menu, sec0 = e.secao; await gp(5); e = await estado(p); const sec1 = e.secao; await gp(1); await gp(1);
  checar(`${nome}: gamepad: Select abre, RB troca de seção, B fecha`, abriuGp && sec1 !== sec0 && !(await estado(p)).menu, `${sec0} → ${sec1}`);

  // 7) batalha: não abre
  await p.evaluate(() => __dunwick.jogo.iniciarBatalha('enc_slime_1', { semente: 1 })); await p.waitForFunction(() => __dunwick.apr.visao === 'batalha' && !__dunwick.apr.trans, { timeout: 8000 });
  if (!toque) await tecla('KeyC'); await gp(8);
  e = await estado(p); checar(`${nome}: na batalha o menu não abre e o ☰ some`, !e.menu && !e.canto);
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
