// Batalha de treino (v0.1.2b) no Chrome real: boneco sem ações mostra "{nome} não faz nada." (tipo 'passar' do 03), resultado curto
// "Treino concluído" sem XP/moedas, Continuar volta ao mapa com o grupo restaurado; fugir do treino também mostra o resultado curto.
// Capturas em build/qa/treino/. Uso: node tools/testar_treino.mjs [--porta=5198] [--cromo=...]
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (nome, padrao) => { const a = process.argv.find((x) => x.startsWith(`--${nome}=`)); return a ? a.slice(nome.length + 3) : padrao; };
const PORTA = Number(arg('porta', 5198)), CROMO = arg('cromo', process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe');
const DIR = join(RAIZ, 'build', 'qa', 'treino'); mkdirSync(DIR, { recursive: true });
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const resultados = []; const checar = (nome, ok, det = '') => { resultados.push({ nome, ok }); console.log(`${ok ? '✓' : '✗'} ${nome}${det ? `  (${det})` : ''}`); };
const srv = spawn(process.execPath, [join(RAIZ, 'tools/servir.mjs'), 'dev', `--porta=${PORTA}`], { cwd: RAIZ, stdio: ['ignore', 'pipe', 'pipe'] });
let log = ''; srv.stdout.on('data', (d) => { log += d; }); srv.stderr.on('data', (d) => { log += d; });
for (let i = 0; i < 100 && !log.includes('http://localhost'); i++) await dormir(100);
const nav = await puppeteer.launch({ executablePath: CROMO, headless: 'new', args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'], defaultViewport: { width: 1280, height: 720 } });
const erros = [];
try {
  const p = await nav.newPage(); p.on('pageerror', (e) => erros.push(String(e))); p.on('console', (m) => { if (m.type() === 'error') erros.push(m.text()); });
  await p.goto(`http://localhost:${PORTA}/?hora=13`); await p.waitForFunction('document.documentElement.dataset.pronto === "1"', { timeout: 30000 });
  await p.evaluate(() => { document.getElementById('debug')?.remove(); window.__msgs = []; new MutationObserver(() => { const m = document.querySelector('.bat-info-texto')?.textContent; if (m && __msgs.at(-1) !== m) __msgs.push(m); }).observe(document.body, { childList: true, subtree: true, characterData: true }); });
  const modo = () => p.evaluate(() => __dunwick.batalhaUi.modo);
  const esperar = (l) => p.waitForFunction((l) => l.includes(__dunwick.batalhaUi.modo), { timeout: 30000 }, l);
  const vidaAntes = await p.evaluate(() => __dunwick.jogo.estado().grupo);
  // 1) vencer o boneco: Edric e Grace atacam (velocidade 2×)
  await p.evaluate(() => { __dunwick.plataforma.preferencias.definir('velocidade_batalha', 2); __dunwick.jogo.iniciarBatalha('enc_boneco_treino', { semente: 1 }); });
  await esperar(['menu']);
  for (let g = 0; g < 60 && (await modo()) !== 'resultado'; g++) { await esperar(['menu', 'resultado']); if ((await modo()) === 'resultado') break; await p.keyboard.press('Digit1'); await p.keyboard.press('Enter'); }
  const msgs = await p.evaluate(() => __msgs), nomeBoneco = await p.evaluate(() => __dunwick.t(__dunwick.mundo.dados.combate.inimigos.enemy_boneco_treino.nome_txt));
  const esperado = await p.evaluate((n) => __dunwick.t('ui_batalha_nao_faz_nada', { nome: n }), nomeBoneco);
  checar('o boneco "não faz nada" no log (tipo passar do 03)', msgs.includes(esperado), esperado);
  const res = await p.evaluate(() => document.querySelector('.bat-resultado')?.textContent ?? '');
  checar('resultado curto "Treino concluído", sem XP nem moedas', res.includes(await p.evaluate(() => __dunwick.t('ui_bat_treino_concluido'))) && !res.includes(await p.evaluate(() => __dunwick.t('ui_bat_ganhou_xp', { xp: '' }).trim())), res);
  await p.screenshot({ path: join(DIR, 'treino_vitoria.png') });
  await p.click('.bat-resultado .bat-botao'); await p.waitForFunction('__dunwick.jogo.modo === "mapa"', { timeout: 10000 });
  checar('Continuar volta ao mapa com o grupo restaurado', JSON.stringify(await p.evaluate(() => __dunwick.jogo.estado().grupo)) === JSON.stringify(vidaAntes));
  // 2) fugir do treino: também o resultado curto, sem "Tentar de novo"
  await p.evaluate(() => __dunwick.jogo.iniciarBatalha('enc_boneco_treino', { semente: 2 })); await esperar(['menu']);
  const podeFugir = await p.evaluate(() => __dunwick.jogo.batalha.consultar().pode_fugir);
  if (podeFugir) {
    for (let g = 0; g < 20 && (await modo()) !== 'resultado'; g++) { await esperar(['menu', 'resultado']); if ((await modo()) === 'resultado') break; await p.keyboard.press('Digit5'); }
    const r2 = await p.evaluate(() => document.querySelector('.bat-resultado')?.textContent ?? '');
    checar('fugir do treino mostra o resultado curto, sem "Tentar de novo"', r2.includes(await p.evaluate(() => __dunwick.t('ui_bat_treino_concluido'))) && !r2.includes(await p.evaluate(() => __dunwick.t('ui_gameover_tentar'))), r2);
    await p.click('.bat-resultado .bat-botao');
  } else checar('fugir do treino (encontro não permite fuga: pulado)', true);
  checar('console sem erros', erros.length === 0, erros[0] ?? '');
} catch (e) { checar(`execução: ${e.message}`, false); }
finally { await nav.close(); srv.kill(); }
const falhas = resultados.filter((r) => !r.ok).length;
console.log(`\n${resultados.length - falhas}/${resultados.length} passaram`); process.exit(falhas ? 1 : 0);
