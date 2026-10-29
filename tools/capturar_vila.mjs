// Capturas da vila v0.1.2 (07): exterior (props, casas, marcas do saque) e os cinco interiores, no Chrome real. Sobe o servidor de desenvolvimento,
// leva o herói a cada lugar (sem simular o jogo) e grava PNGs em docs/arte/capturas_v012/. Só olhar: não confere nada além de "abriu sem erro".
// Uso: node tools/capturar_vila.mjs [--janela=1280x720] [--cromo=<chrome.exe>] [--so=exterior|interiores]
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (n, p) => { const a = process.argv.find((x) => x.startsWith(`--${n}=`)); return a ? a.slice(n.length + 3) : p; };
const [JW, JH] = arg('janela', '1280x720').split('x').map(Number), SO = arg('so', 'tudo'), PORTA = 5189;
const CROMO = arg('cromo', process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe');
const SAIDA = join(RAIZ, 'docs', 'arte', 'capturas_v012'); mkdirSync(SAIDA, { recursive: true });
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

const servidor = spawn(process.execPath, [join(RAIZ, 'tools/servir.mjs'), 'dev', `--porta=${PORTA}`], { cwd: RAIZ, stdio: ['ignore', 'pipe', 'pipe'] });
let saida = ''; servidor.stdout.on('data', (d) => { saida += d; }); servidor.stderr.on('data', (d) => { saida += d; });
for (let i = 0; i < 100 && !saida.includes('http://localhost'); i++) await dormir(100);
if (!saida.includes('http://localhost')) { console.error('servidor não subiu:\n' + saida); servidor.kill(); process.exit(1); }
const navegador = await puppeteer.launch({ executablePath: CROMO, headless: 'new', args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-gpu-rasterization', `--window-size=${JW},${JH}`], defaultViewport: { width: JW, height: JH, deviceScaleFactor: 1 } });
const erros = [];
async function abrir(query, ajustar) {
  const p = await navegador.newPage();
  if (ajustar) { // só para a captura: altera os dados em trânsito (não mexe em data/)
    await p.setRequestInterception(true);
    p.on('request', async (r) => { if (r.url().endsWith('/dados.json')) { const d = await (await fetch(r.url())).json(); ajustar(d); r.respond({ contentType: 'application/json', body: JSON.stringify(d) }); } else r.continue(); });
  } p.on('pageerror', (e) => erros.push(String(e))); p.on('console', (m) => { if (m.type() === 'error') erros.push(m.text()); });
  await p.goto(`http://localhost:${PORTA}/?${query}`); await p.waitForFunction('window.__dunwick && window.__dunwick.mundo', { timeout: 60000 }); await p.keyboard.press('Shift'); await p.evaluate(() => { const d = document.getElementById('debug'); if (d) d.style.display = 'none'; }); await dormir(1200); return p;
}
/** Leva o herói e a câmera a (x, z) no mapa atual, sem passar pelo jogo. */
const ir = (p, x, z, hora) => p.evaluate(([x, z, hora]) => {
  const m = __dunwick.mundo, h = m.heroi, c = m.camera; h.x = h.ox = x; h.z = h.oz = z; h.destino = null; c.x = c.ox = x; c.z = c.oz = z; if (hora !== undefined) { m.hora = hora; m.cicloLigado = false; }
}, [x, z, hora]);
const foto = async (p, nome, x, z, hora = 17) => { await ir(p, x, z, hora); await dormir(900); await p.screenshot({ path: join(SAIDA, `${nome}.png`) }); console.log('✓', nome); };

if (SO !== 'interiores') {
  const p = await abrir('hora=17&perfil=perfil_alto');
  await foto(p, 'ext_01_portico_quadro', 25, 23); // pórtico (24; 19,5) com o gancho vazio e o quadro de avisos (28,5; 21)
  await foto(p, 'ext_02_maren_canteiro', 18, 13.8); await foto(p, 'ext_03_taverna', 32, 15);
  await foto(p, 'ext_04_forja_brasa_noite', 45, 16.2, 21.5); // forno de brasa em (43,5; 14,6), a leste da forja await foto(p, 'ext_05_posto_escrivao', 40, 29, 17);
  await foto(p, 'ext_06_torvan_patio', 12, 21, 17); await foto(p, 'ext_07_marcas_do_saque', 30.5, 39.2, 17); await foto(p, 'ext_08_muro_fuligem_sul', 13, 40, 17);
  await foto(p, 'ext_09_praca_entardecer', 24, 26, 18.5); await p.close();
}
if (SO !== 'exterior') {
  // cada interior: abre a vila, põe o herói na porta (o portal troca o mapa) e fotografa já dentro
  const nomes = ['casa_maren', 'taverna', 'forja', 'casa_torvan', 'posto_escrivao'];
  for (const nome of nomes) {
    const p = await abrir('hora=17&perfil=perfil_alto'); const [x, z] = await p.evaluate((n) => { const q = __dunwick.mundo.mapa.dados.portais.find((o) => o.destino.mapa === `map_${n}_interior`); return [q.x, q.z]; }, nome); await ir(p, x, z, 17); await dormir(1500);
    const mapa = await p.evaluate(() => __dunwick.mundo.mapaId); console.log(nome, '→', mapa);
    await p.screenshot({ path: join(SAIDA, `int_${nome}.png`) }); await p.close();
  }
}
console.log(erros.length ? `erros no console (${erros.length}):\n` + [...new Set(erros)].slice(0, 8).join('\n') : 'console limpo');
await navegador.close(); servidor.kill(); process.exit(erros.length ? 1 : 0);
