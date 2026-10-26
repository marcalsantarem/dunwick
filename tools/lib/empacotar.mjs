// Opções do esbuild e geração do index.html, compartilhadas pelo build (produção) e pelo servidor (desenvolvimento).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export function opcoesEsbuild(raiz, { dev, saida, nomeJs }) {
  return {
    entryPoints: [join(raiz, 'src/plataforma/principal.js')], bundle: true, format: 'esm', platform: 'browser', target: 'es2022',
    outfile: join(saida, nomeJs), minify: !dev, sourcemap: dev ? 'inline' : false, legalComments: 'none', treeShaking: true,
    define: { __DEV__: dev ? 'true' : 'false' }, logLevel: 'warning',
  };
}

/** index.html a partir do modelo; `manifesto` = { dados, assets }. Em dev os caminhos são diretos. */
export function gerarIndex(raiz, { js, css, manifesto }) {
  const html = readFileSync(join(raiz, 'src/plataforma/index.html'), 'utf8');
  return html.replace('%CSS%', css).replace('%JS%', js).replace('%MANIFESTO%', JSON.stringify(manifesto).replace(/</g, '\\u003c'));
}

export const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.map': 'application/json' };
