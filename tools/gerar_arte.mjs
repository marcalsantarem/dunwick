// Gera TODA a arte por código (sprites e texturas) e grava em assets/. O gerador (tools/arte/*.js, Canvas 2D) roda no Chrome headless:
// ADR-002 — a arte é assada no BUILD, não no carregamento (o jogo só baixa PNG). Determinístico (sementes fixas).
// Uso: npm run assets  [-- --cromo=<chrome.exe>]  [-- --previa]  (--previa também grava build/qa/arte_*.png ampliados para olhar)
import { build } from 'esbuild';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { codificarWav } from './lib/wav.mjs';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..'), SAIDA = join(RAIZ, 'assets');
const arg = (n, p) => (process.argv.find((a) => a.startsWith(`--${n}=`)) ?? `--${n}=${p}`).split('=')[1];
const CROMO = arg('cromo', process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe');

const r = await build({ entryPoints: [join(RAIZ, 'tools/arte/principal.js')], bundle: true, write: false, format: 'iife', target: 'es2022', logLevel: 'warning' });
const codigo = r.outputFiles[0].text;
const navegador = await puppeteer.launch({ executablePath: CROMO, headless: 'new', args: ['--ignore-gpu-blocklist'] });
try {
  const pag = await navegador.newPage(); pag.on('pageerror', (e) => { console.error('erro na página:', e.message); process.exitCode = 1; });
  await pag.setContent('<!doctype html><meta charset="utf-8"><body></body>'); await pag.addScriptTag({ content: codigo });
  await pag.waitForFunction('window.__arteProntaParaGerar === true');
  const { arquivos, tempos, total_ms } = await pag.evaluate('window.GERAR_ARTE()');
  let bytes = 0;
  for (const [rel, dados] of Object.entries(arquivos)) { const destino = join(SAIDA, rel), buf = rel.endsWith('.json') ? Buffer.from(dados) : Buffer.from(dados, 'base64'); mkdirSync(dirname(destino), { recursive: true }); writeFileSync(destino, buf); bytes += buf.length; }
  console.log(`arte gerada em ${total_ms} ms (${JSON.stringify(tempos)}): ${Object.keys(arquivos).length} arquivos, ${(bytes / 1024).toFixed(0)} KB → assets/`);
} finally { await navegador.close(); }

// SFX de teste (prova o desbloqueio do áudio por gesto): 0,15 s, mono, 24 kHz, sem dependências. Áudio real é do 05.
{
  const taxa = 24000, n = Math.round(taxa * 0.15), a = new Float32Array(n);
  for (let i = 0; i < n; i++) { const t = i / taxa; a[i] = Math.exp(-t * 18) * 0.5 * Math.sin(2 * Math.PI * (660 + 440 * t) * t); }
  mkdirSync(join(SAIDA, 'audio'), { recursive: true }); writeFileSync(join(SAIDA, 'audio', 'sfx_teste_ping.wav'), codificarWav([a], taxa));
}
