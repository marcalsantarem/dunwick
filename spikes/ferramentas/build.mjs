// Empacota cada opção de motor em dist/<opcao>.js (esbuild, minificado). Uso: node ferramentas/build.mjs [opcao...]
import { build } from 'esbuild';
import { existsSync, statSync } from 'node:fs';
const opcoes = process.argv.slice(2).length ? process.argv.slice(2) : ['three', 'babylon', 'playcanvas'].filter((o) => existsSync(`${o}/main.js`));
for (const o of opcoes) {
  await build({ entryPoints: [`${o}/main.js`], bundle: true, format: 'esm', minify: true, outfile: `dist/${o}.js`, target: 'es2022', metafile: false, legalComments: 'none', treeShaking: true, ignoreAnnotations: o === 'babylon' }); // Babylon marca como 'sem efeito colateral' módulos que se auto-registram (ex.: sombras)
  console.log(o, (statSync(`dist/${o}.js`).size / 1024).toFixed(0), 'KB (js, sem gzip)');
}
