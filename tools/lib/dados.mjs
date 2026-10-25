// Leitura e empacotamento dos dados do jogo (data/). Sem validação aqui: ver tools/validar_dados.mjs.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';

export const REGISTRO = [
  // [pasta, padrão do nome do arquivo, esquema]
  ['config', /^cfg_jogo\.json$/, 'cfg_jogo'],
  ['config', /^cfg_perfis\.json$/, 'cfg_perfis'],
  ['config', /^cfg_orcamento\.json$/, 'cfg_orcamento'],
  ['config', /^cfg_entrada\.json$/, 'cfg_entrada'],
  ['config', /^cfg_ciclo\.json$/, 'cfg_ciclo'],
  ['config', /^cfg_kit\.json$/, 'cfg_kit'],
  ['characters', /^hero_[a-z0-9_]+\.json$/, 'personagem'],
  ['enemies', /^enemy_[a-z0-9_]+\.json$/, 'inimigo'],
  ['maps', /^map_[a-z0-9_]+\.json$/, 'mapa'],
  ['texts', /^[a-z]{2}-[A-Z]{2}\.json$/, 'textos'],
];

export function lerJson(caminho) {
  try { return JSON.parse(readFileSync(caminho, 'utf8')); }
  catch (e) { throw new Error(`${caminho}: JSON inválido (${e.message})`); }
}

// Lista { arquivo (relativo a data/), caminho, esquema } de todos os arquivos de dados; arquivos fora do registro viram esquema null.
export function listarArquivos(raiz) {
  const dados = join(raiz, 'data'), saida = [];
  for (const pasta of ['config', 'characters', 'enemies', 'maps', 'texts', 'attacks']) {
    const dir = join(dados, pasta);
    if (!existsSync(dir)) continue;
    for (const nome of readdirSync(dir).sort()) {
      if (!nome.endsWith('.json')) continue;
      const reg = REGISTRO.find(([p, re]) => p === pasta && re.test(nome));
      saida.push({ arquivo: `${pasta}/${nome}`, caminho: join(dir, nome), esquema: reg ? reg[2] : null });
    }
  }
  return saida;
}

export function carregarEsquemas(raiz) {
  const dir = join(raiz, 'data', 'schemas'), out = {};
  for (const nome of readdirSync(dir)) if (nome.endsWith('.schema.json')) out[nome.replace('.schema.json', '')] = lerJson(join(dir, nome));
  return out;
}

// Pacote único que o jogo carrega: { config:{jogo,perfis,entrada,orcamento}, personagens, inimigos, mapas, textos }.
export function empacotarDados(raiz) {
  const pacote = { config: {}, personagens: {}, inimigos: {}, mapas: {}, textos: {} };
  for (const { arquivo, caminho, esquema } of listarArquivos(raiz)) {
    if (!esquema) continue;
    const obj = lerJson(caminho);
    if (esquema.startsWith('cfg_')) pacote.config[esquema.slice(4)] = obj;
    else if (esquema === 'personagem') pacote.personagens[obj.id] = obj;
    else if (esquema === 'inimigo') pacote.inimigos[obj.id] = obj;
    else if (esquema === 'mapa') pacote.mapas[obj.id] = obj;
    else if (esquema === 'textos') pacote.textos[obj.idioma] = obj.textos;
    void arquivo; void basename;
  }
  return pacote;
}
