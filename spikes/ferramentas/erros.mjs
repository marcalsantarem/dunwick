// Depuração: abre uma URL e imprime erros/avisos do console. Uso: node ferramentas/erros.mjs <caminho?query>
import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath: process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--use-angle=d3d11', '--ignore-gpu-blocklist'] });
const p = await b.newPage(); p.on('console', (m) => console.log(`[${m.type()}]`, m.text().slice(0, 400))); p.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 600)));
await p.goto(`http://localhost:8080/${process.argv[2]}`); await new Promise((r) => setTimeout(r, 6000)); await b.close();
