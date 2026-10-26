// Carregamento de dados e assets pelo manifesto (URLs com hash em produção; caminhos diretos em desenvolvimento).
// A arte é ASSADA no build (npm run assets): o jogo só baixa PNG, nada é desenhado no carregamento (ADR-002).
import * as THREE from 'three';

export const NOMES_TEXTURAS = ['grama_a', 'grama_b', 'grama_c', 'terra', 'calcada', 'reboco', 'madeira', 'telha_laranja', 'telha_musgo', 'ardosia', 'casca', 'pedra', 'folhagem', 'tabuas'];

export function lerManifesto() {
  const el = document.getElementById('manifesto');
  if (!el) throw new Error('manifesto ausente no index.html');
  return JSON.parse(el.textContent);
}

export function criarCarregador(manifesto) {
  const url = (rel) => manifesto.assets?.[rel] ?? `assets/${rel}`;
  const carregadorTex = new THREE.TextureLoader();
  const json = async (rel) => { const r = await fetch(url(rel)); if (!r.ok) throw new Error(`${rel}: HTTP ${r.status}`); return r.json(); };
  const textura = (rel, { premultiplicar = false } = {}) => new Promise((ok, erro) => carregadorTex.load(url(rel), (t) => { t.colorSpace = THREE.SRGBColorSpace; t.premultiplyAlpha = premultiplicar; t.needsUpdate = true; ok(t); }, undefined, () => erro(new Error(`falha ao carregar ${rel}`))));
  return {
    async dados() { const r = await fetch(manifesto.dados); if (!r.ok) throw new Error(`dados: HTTP ${r.status}`); return r.json(); },
    async atlas(id) { const [meta, t] = await Promise.all([json(`sprites/${id}/${id}.meta.json`), textura(`sprites/${id}/${id}.png`, { premultiplicar: true })]); t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter; return { meta, textura: t }; },
    textura: (nome) => textura(`env/tex_${nome}.png`),
    async bytes(rel) { const r = await fetch(url(rel)); if (!r.ok) throw new Error(`${rel}: HTTP ${r.status}`); return r.arrayBuffer(); },
  };
}

/** Carrega tudo que a cena precisa, em paralelo, a partir dos dados já lidos. */
export async function carregarRecursos(carregador, dados) {
  const ids = [...new Set([...Object.values(dados.personagens), ...Object.values(dados.inimigos)].map((d) => d.sprite))];
  const [atlas, texs, ping] = await Promise.all([Promise.all(ids.map((id) => carregador.atlas(id))), Promise.all(NOMES_TEXTURAS.map((n) => carregador.textura(n))), carregador.bytes('audio/sfx_teste_ping.wav')]);
  return { atlas: Object.fromEntries(ids.map((id, i) => [id, atlas[i]])), metas: Object.fromEntries(ids.map((id, i) => [id, atlas[i].meta])), texturas: Object.fromEntries(NOMES_TEXTURAS.map((n, i) => [n, texs[i]])), sfxPing: ping };
}
