// Carregamento de dados e assets pelo manifesto (URLs com hash em produção; caminhos diretos em desenvolvimento).
import * as THREE from 'three';

export function lerManifesto() {
  const el = document.getElementById('manifesto');
  if (!el) throw new Error('manifesto ausente no index.html');
  return JSON.parse(el.textContent);
}

export function criarCarregador(manifesto) {
  const url = (rel) => manifesto.assets?.[rel] ?? `assets/${rel}`;
  const carregadorTex = new THREE.TextureLoader();
  const json = async (rel) => { const r = await fetch(url(rel)); if (!r.ok) throw new Error(`${rel}: HTTP ${r.status}`); return r.json(); };
  // Pixel nítido: sem filtro, sem mipmap (ADR-001). Textura de cor em sRGB; normal e brilho de dados em espaço linear.
  const textura = (rel, cor) => new Promise((ok, erro) => carregadorTex.load(url(rel), (t) => {
    t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false;
    t.colorSpace = cor ? THREE.SRGBColorSpace : THREE.NoColorSpace; ok(t);
  }, undefined, () => erro(new Error(`falha ao carregar ${rel}`))));

  return {
    async dados() { const r = await fetch(manifesto.dados); if (!r.ok) throw new Error(`dados: HTTP ${r.status}`); return r.json(); },
    async folha(id) {
      const base = `sprites/${id}/${id}`;
      const [meta, albedo, normal, brilho] = await Promise.all([json(`${base}.meta.json`), textura(`${base}.png`, true), textura(`${base}_n.png`, false), textura(`${base}_e.png`, true)]);
      return { meta, albedo, normal, brilho };
    },
    async atlas(nome) {
      const [meta, albedo, normal] = await Promise.all([json(`env/${nome}.meta.json`), textura(`env/${nome}.png`, true), textura(`env/${nome}_n.png`, false)]);
      return { meta, albedo, normal };
    },
    fx: (nome) => textura(`fx/${nome}.png`, true),
    async bytes(rel) { const r = await fetch(url(rel)); if (!r.ok) throw new Error(`${rel}: HTTP ${r.status}`); return r.arrayBuffer(); },
  };
}

/** Carrega tudo que a cena precisa, em paralelo, a partir dos dados já lidos. */
export async function carregarRecursos(carregador, dados) {
  const ids = new Set([...Object.values(dados.personagens), ...Object.values(dados.inimigos)].map((d) => d.sprite));
  const [atlas, sombra, ping, ...folhas] = await Promise.all([carregador.atlas('atlas_sala_cinza'), carregador.fx('fx_sombra_contato'), carregador.bytes('audio/sfx_teste_ping.wav'), ...[...ids].map((id) => carregador.folha(id))]);
  return { atlas, fx: { sombra }, sfxPing: ping, folhas: Object.fromEntries([...ids].map((id, i) => [id, folhas[i]])) };
}
