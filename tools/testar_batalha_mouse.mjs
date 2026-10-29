// Batalha SÓ COM O MOUSE no Chrome real (cliques de verdade via puppeteer: mover, apertar, mexer 2 px, soltar).
// Cobre: menu (Atacar, Habilidade, Item), submenu, botão Voltar e botão direito, alvo inimigo pelo sprite e pela placa,
// aliado (poção), velocidade 2×, dano aplicado, clique na cena sem andar no mapa, vitória e "Continuar".
// Uso: node tools/testar_batalha_mouse.mjs [--porta=5193] [--visivel] [--cromo=caminho]. Capturas em build/qa/ui_batalha/.
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (nome, padrao) => { const a = process.argv.find((x) => x.startsWith(`--${nome}=`)); return a ? a.slice(nome.length + 3) : padrao; };
const PORTA = Number(arg('porta', 5193)), CROMO = arg('cromo', process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe');
const DIR = join(RAIZ, 'build', 'qa', 'ui_batalha'); mkdirSync(DIR, { recursive: true });
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const resultados = []; const checar = (nome, ok, det = '') => { resultados.push({ nome, ok }); console.log(`${ok ? '✓' : '✗'} ${nome}${det ? `  (${det})` : ''}`); };

const srv = spawn(process.execPath, [join(RAIZ, 'tools/servir.mjs'), 'dev', `--porta=${PORTA}`], { cwd: RAIZ, stdio: ['ignore', 'pipe', 'pipe'] });
let log = ''; srv.stdout.on('data', (d) => { log += d; }); srv.stderr.on('data', (d) => { log += d; });
for (let i = 0; i < 100 && !log.includes('http://localhost'); i++) await dormir(100);
const nav = await puppeteer.launch({ executablePath: CROMO, headless: process.argv.includes('--visivel') ? false : 'new', args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'], defaultViewport: { width: 1280, height: 720 } });
const erros = [];
try {
  const p = await nav.newPage(); p.on('pageerror', (e) => erros.push(String(e))); p.on('console', (m) => { if (m.type() === 'error') erros.push(m.text()); });
  await p.goto(`http://localhost:${PORTA}/?hora=13`); await p.waitForFunction('document.documentElement.dataset.pronto === "1"', { timeout: 30000 });
  await p.evaluate(() => { document.getElementById('debug')?.remove(); });
  await p.mouse.click(640, 360); await dormir(200); // o gesto que libera o áudio
  const posHeroi = await p.evaluate(() => [__dunwick.mundo.heroi.x, __dunwick.mundo.heroi.z]);
  await p.evaluate(() => __dunwick.jogo.iniciarBatalha('enc_misto_1', { semente: 2 }));

  const uiModo = () => p.evaluate(() => __dunwick.batalhaUi.modo);
  const esperarModo = (lista, ms = 30000) => p.waitForFunction((l) => l.includes(__dunwick.batalhaUi.modo), { timeout: ms }, lista);
  const ret = (sel, idx = 0) => p.evaluate((s, i) => { const e = [...document.querySelectorAll(s)].filter((x) => x.offsetParent !== null || getComputedStyle(x).position === 'fixed')[i]; if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; }, sel, idx);
  async function clicar(r, botao = 'left') {
    const x = r.x + r.w / 2, y = r.y + r.h / 2;
    await p.mouse.move(x - 6, y - 4); await p.mouse.move(x, y, { steps: 3 }); await p.mouse.down({ button: botao }); await p.mouse.move(x + 2, y + 1); await p.mouse.up({ button: botao }); await dormir(120);
  }
  const clicarSel = async (sel, idx = 0) => { const r = await ret(sel, idx); if (!r) throw new Error(`não achei ${sel}[${idx}] na tela`); await clicar(r); return r; };
  const itemMenu = (i) => `.bat-menu:not(.bat-sub) .bat-item:nth-child(${i + 1})`;
  const vidaInimigos = () => p.evaluate(() => __dunwick.jogo.batalha.consultar().atores.filter((a) => a.lado === 'inimigos').reduce((s, a) => s + a.vida, 0));
  const vez = () => p.evaluate(() => __dunwick.jogo.batalha.consultar().vez);

  await esperarModo(['menu']);
  // tamanho das áreas de clique (≥ 32 px de arte)
  const k = await p.evaluate(() => Number(getComputedStyle(document.getElementById('ui')).getPropertyValue('--k')) || 1);
  const area = await ret('.bat-alvo-area-inimigos'); checar('área de clique do inimigo ≥ 32 px de arte', area.w >= 32 * k - 0.5 && area.h >= 32 * k - 0.5, `${area.w.toFixed(0)}×${area.h.toFixed(0)} px CSS, k=${k}`);
  const botaoMenu = await ret(itemMenu(0)); checar('item do menu com altura ≥ 32 px', botaoMenu.h >= 32, `${botaoMenu.h.toFixed(0)} px`);

  // clique na cena com o menu aberto: não anda no mapa, não muda nada
  await clicar({ x: 900, y: 250, w: 0, h: 0 });
  const heroiDepois = await p.evaluate(() => [__dunwick.mundo.heroi.x, __dunwick.mundo.heroi.z, __dunwick.mundo.heroi.destino]);
  checar('clique na cena durante a batalha não chega ao mapa', heroiDepois[0] === posHeroi[0] && heroiDepois[1] === posHeroi[1] && !heroiDepois[2] && (await uiModo()) === 'menu');

  // velocidade
  await clicarSel('.bat-vel'); checar('botão de velocidade alterna para 2×', (await p.evaluate(() => __dunwick.jogo.batalha.velocidade)) === 2);

  // Habilidade → submenu → Voltar (botão visível) ; Atacar → alvo → botão direito volta
  await clicarSel(itemMenu(1)); checar('clique em Habilidade abre o submenu', (await uiModo()) === 'sub');
  await clicarSel('.bat-voltar'); checar('botão Voltar fecha o submenu', (await uiModo()) === 'menu');
  await clicarSel(itemMenu(0)); checar('clique em Atacar abre a seleção de alvo', (await uiModo()) === 'alvo');
  const r0 = await ret('.bat-alvo-area-inimigos'); await clicar(r0, 'right'); checar('botão direito cancela a seleção de alvo', (await uiModo()) === 'menu');

  // hover destaca o inimigo; clique no sprite escolhe o alvo
  await clicarSel(itemMenu(0));
  const ra = await ret('.bat-alvo-area-inimigos', 1); await p.mouse.move(ra.x + ra.w / 2, ra.y + ra.h / 2, { steps: 4 }); await dormir(100);
  checar('hover no inimigo destaca o alvo (anel e seta)', await p.evaluate(() => !!document.querySelector('.bat-anel.alvo-foco:not([hidden])') && !!document.querySelector('.bat-cursor:not([hidden])')));
  await p.screenshot({ path: join(DIR, 'mouse_alvo.png') });
  const quemEdric = await vez(); await clicar(ra);
  checar('clique no sprite do inimigo confirma o Atacar', (await vez()) !== quemEdric);

  // Grace: Item → Poção → clique no aliado (caixa do Edric)
  await esperarModo(['menu']);
  await clicarSel(itemMenu(2)); await clicarSel('.bat-sub .bat-item'); checar('poção pede alvo aliado', (await uiModo()) === 'alvo');
  const antesInv = await p.evaluate(() => __dunwick.jogo.batalha.consultar().inventario.item_pocao_ervas);
  const vidaAntes = await vidaInimigos(); // o clique abaixo fecha a rodada: o controlador resolve tudo na hora
  await clicarSel('.bat-caixa', 0);
  await esperarModo(['menu', 'resultado']);
  checar('dano aplicado depois de escolher só com cliques', (await vidaInimigos()) < vidaAntes, `vida dos inimigos ${vidaAntes} → ${await vidaInimigos()}`);
  checar('poção usada no aliado clicado', (await p.evaluate(() => __dunwick.jogo.batalha.consultar().inventario.item_pocao_ervas)) === antesInv - 1);

  // vencer só com cliques: cada herói clica Atacar e clica no primeiro inimigo vivo (pelo rótulo quando ele aparece, senão pelo sprite)
  let usouRotulo = false;
  for (let g = 0; g < 40 && (await uiModo()) !== 'resultado'; g++) {
    await esperarModo(['menu', 'resultado']); if ((await uiModo()) === 'resultado') break;
    await clicarSel(itemMenu(0));
    const rot = await ret('.bat-rotulo-inimigos:not([hidden])');
    if (rot && !usouRotulo) { usouRotulo = true; await clicar(rot); } else await clicarSel('.bat-alvo-area-inimigos:not([hidden])');
  }
  await esperarModo(['resultado']);
  checar('clique no rótulo (placa) do inimigo também escolhe o alvo', usouRotulo);
  await p.screenshot({ path: join(DIR, 'mouse_vitoria.png') });
  const titulo = await p.evaluate(() => document.querySelector('.bat-resultado')?.textContent ?? '');
  checar('venceu só com cliques', titulo.includes(await p.evaluate(() => __dunwick.t('ui_bat_vitoria_titulo'))), titulo);
  await clicarSel('.bat-resultado .bat-botao');
  await p.waitForFunction('__dunwick.jogo.modo === "mapa"', { timeout: 10000 }).catch(() => {});
  checar('"Continuar" volta ao mapa', (await p.evaluate(() => __dunwick.jogo.modo)) === 'mapa');
  checar('console sem erros', erros.length === 0, erros.slice(0, 3).join(' | '));
} catch (e) { checar(`execução: ${e.message}`, false); }
finally { await nav.close(); srv.kill(); }
const falhas = resultados.filter((r) => !r.ok).length;
console.log(`\n${resultados.length - falhas}/${resultados.length} passaram`); process.exit(falhas ? 1 : 0);
