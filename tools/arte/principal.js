// Ponto de entrada do gerador de arte (executa dentro do Chrome headless): devolve { arquivos: {caminho: base64 PNG|json} }.
import { gerarAtlasHeroi } from './heroi.js';
import { gerarAtlasBoneco } from './boneco.js';
import { todasTexturas } from './texturas.js';

const png = (cv) => cv.toDataURL('image/png').split(',')[1];

window.GERAR_ARTE = () => {
  const arquivos = {}, t0 = performance.now(), tempos = {};
  const marca = (nome, t) => { tempos[nome] = Math.round(performance.now() - t); };
  let t = performance.now();
  const h = gerarAtlasHeroi(); arquivos['sprites/hero_edric/hero_edric.png'] = png(h.canvas); arquivos['sprites/hero_edric/hero_edric.meta.json'] = JSON.stringify(h.meta, null, 2) + '\n'; marca('heroi', t);
  t = performance.now();
  for (const tipo of ['alvo', 'golpe']) { const b = gerarAtlasBoneco(tipo); arquivos[`sprites/${b.meta.id}/${b.meta.id}.png`] = png(b.canvas); arquivos[`sprites/${b.meta.id}/${b.meta.id}.meta.json`] = JSON.stringify(b.meta, null, 2) + '\n'; } marca('bonecos', t);
  t = performance.now();
  const tx = todasTexturas(); for (const [nome, cv] of Object.entries(tx)) arquivos[`env/tex_${nome}.png`] = png(cv); marca('texturas', t);
  return { arquivos, tempos, total_ms: Math.round(performance.now() - t0) };
};
window.__arteProntaParaGerar = true;
