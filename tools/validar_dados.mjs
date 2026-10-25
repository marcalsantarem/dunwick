// Validador de dados (roda no build e em `npm run validar`): esquema (Ajv) + regras cruzadas do projeto.
// Mensagem de erro sempre aponta ARQUIVO e CAMPO: "data/config/cfg_jogo.json /camera/angulo_graus: deve ser <= 45".
import Ajv2020 from 'ajv/dist/2020.js';
import { existsSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { listarArquivos, carregarEsquemas, lerJson } from './lib/dados.mjs';

const RAIZ_PADRAO = join(dirname(fileURLToPath(import.meta.url)), '..');
const PREFIXOS_ID = ['hero', 'npc', 'enemy', 'boss', 'item', 'skill', 'quest', 'map', 'fx', 'sfx', 'mus', 'txt', 'ui', 'amb', 'atk', 'cfg', 'perfil', 'z'];

function mensagemAjv(e) {
  const extra = e.params?.additionalProperty ? ` (campo "${e.params.additionalProperty}")` : e.params?.allowedValues ? ` (${e.params.allowedValues.join(' | ')})` : e.params?.missingProperty ? ` ("${e.params.missingProperty}")` : '';
  return `${e.instancePath || '/'}: ${e.message}${extra}`;
}

export function validarDados(raiz = RAIZ_PADRAO) {
  const erros = [], avisos = [];
  const erro = (arq, campo, msg) => erros.push(`data/${arq} ${campo}: ${msg}`);

  const esquemas = carregarEsquemas(raiz);
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  const validadores = {};
  for (const [nome, esq] of Object.entries(esquemas)) validadores[nome] = ajv.compile(esq);

  const lidos = {}; // arquivo -> objeto (apenas os que passaram pelo esquema)
  for (const { arquivo, caminho, esquema } of listarArquivos(raiz)) {
    if (!esquema) { if (!arquivo.endsWith('.gitkeep')) avisos.push(`data/${arquivo}: sem esquema registrado (ignorado)`); continue; }
    let obj;
    try { obj = lerJson(caminho); } catch (e) { erros.push(e.message); continue; }
    const v = validadores[esquema];
    if (!v) { erro(arquivo, '/', `esquema "${esquema}" não existe em data/schemas`); continue; }
    if (!v(obj)) { for (const e of v.errors) erro(arquivo, mensagemAjv(e).split(': ')[0], mensagemAjv(e).split(': ').slice(1).join(': ')); continue; }
    lidos[arquivo] = obj;
    // Regra transversal: nome do arquivo = id (exceto tabelas de texto, que se chamam pelo idioma).
    if (esquema !== 'textos' && basename(arquivo, '.json') !== obj.id) erro(arquivo, '/id', `deve ser igual ao nome do arquivo ("${basename(arquivo, '.json')}")`);
    // Regra transversal: IDs minúsculos com prefixo conhecido.
    if (!/^[a-z][a-z0-9_]*$/.test(obj.id ?? 'x') && esquema !== 'textos') erro(arquivo, '/id', 'ID deve ser minúsculo (a-z, 0-9, _)');
    const pref = String(obj.id ?? '').split('_')[0];
    if (esquema !== 'textos' && !PREFIXOS_ID.includes(pref)) erro(arquivo, '/id', `prefixo "${pref}_" não está na lista de prefixos do projeto`);
  }
  const por = (esq) => Object.entries(lidos).filter(([a]) => listarArquivos(raiz).find((f) => f.arquivo === a)?.esquema === esq);
  const um = (esq) => por(esq)[0]?.[1];

  const jogo = um('cfg_jogo'), perfis = um('cfg_perfis'), entrada = um('cfg_entrada');
  const textos = por('textos');
  const chavesTexto = new Set(textos.flatMap(([, t]) => Object.keys(t.textos)));
  const exigeTexto = (arq, campo, id) => { if (!chavesTexto.has(id)) erro(arq, campo, `texto "${id}" não existe em data/texts`); };
  const temSprite = (arq, campo, id) => {
    for (const ext of ['.png', '_n.png', '_e.png', '.meta.json']) if (!existsSync(join(raiz, 'assets', 'sprites', id, id + ext))) erro(arq, campo, `sprite "${id}": falta assets/sprites/${id}/${id}${ext}`);
  };
  const faltando = (esq) => { if (!um(esq)) erros.push(`data/: falta o arquivo de "${esq}" (ou ele é inválido)`); };
  for (const esq of ['cfg_jogo', 'cfg_perfis', 'cfg_entrada', 'cfg_orcamento']) faltando(esq);

  // ---- perfis ----
  if (perfis) {
    const ids = perfis.perfis.map((p) => p.id);
    if (!ids.includes(perfis.padrao)) erro('config/cfg_perfis.json', '/padrao', `perfil "${perfis.padrao}" não existe`);
    if (new Set(ids).size !== ids.length) erro('config/cfg_perfis.json', '/perfis', 'IDs de perfil repetidos');
    perfis.perfis.forEach((p, i) => {
      exigeTexto('config/cfg_perfis.json', `/perfis/${i}/nome_txt`, p.nome_txt);
      if (p.luzes_com_sombra > p.luzes_pontuais_max) erro('config/cfg_perfis.json', `/perfis/${i}/luzes_com_sombra`, 'não pode passar de luzes_pontuais_max');
      if ((p.luzes_com_sombra > 0) !== (p.sombra_pontual_px > 0)) erro('config/cfg_perfis.json', `/perfis/${i}/sombra_pontual_px`, 'deve ser 0 se e só se luzes_com_sombra for 0');
    });
  }
  // ---- câmera ----
  if (jogo && jogo.camera.near >= jogo.camera.far) erro('config/cfg_jogo.json', '/camera/near', 'deve ser menor que far');
  if (jogo && jogo.camera.distancia <= jogo.camera.near) erro('config/cfg_jogo.json', '/camera/distancia', 'deve ser maior que near');
  // ---- entrada: tecla repetida no mesmo contexto ----
  if (entrada) {
    const uso = new Map();
    const registrar = (ctx, tecla, quem) => { const k = `${ctx}|${tecla}`; if (uso.has(k)) erro('config/cfg_entrada.json', '/', `tecla "${tecla}" usada por "${uso.get(k)}" e "${quem}" no mesmo contexto`); else uso.set(k, quem); };
    for (const [n, e] of Object.entries(entrada.eixos)) for (const [dir, teclas] of Object.entries(e.teclado)) for (const t of teclas) registrar(e.contexto, t, `${n}.${dir}`);
    for (const [n, a] of Object.entries(entrada.acoes)) for (const t of a.teclado) registrar(a.contexto, t, n);
    for (const [n, d] of Object.entries(entrada.debug)) for (const t of d.teclado) registrar('debug', t, n);
    // Teclas que o navegador precisa manter (M1-07): F5, F11, Ctrl+W
    for (const [n, d] of Object.entries(entrada.debug)) if (d.teclado.some((t) => t === 'F5' || t === 'F11')) erro('config/cfg_entrada.json', `/debug/${n}`, 'F5 e F11 ficam livres para o navegador');
    for (const [n, a] of Object.entries(entrada.acoes)) if (a.teclado.some((t) => /^F[0-9]+$/.test(t))) erro('config/cfg_entrada.json', `/acoes/${n}`, 'teclas F são reservadas ao debug e ao navegador');
  }
  // ---- personagens e inimigos ----
  for (const [arq, h] of por('personagem')) {
    temSprite(arq, '/sprite', h.sprite);
    if (h.movimento.vel_correr <= h.movimento.vel_andar) erro(arq, '/movimento/vel_correr', 'deve ser maior que vel_andar');
    if (h.caixas.hurtbox_altura_tiles[1] <= h.caixas.hurtbox_altura_tiles[0]) erro(arq, '/caixas/hurtbox_altura_tiles', 'altura final deve ser maior que a inicial');
  }
  const inimigos = Object.fromEntries(por('inimigo').map(([a, e]) => [e.id, [a, e]]));
  for (const [arq, e] of Object.values(inimigos)) {
    temSprite(arq, '/sprite', e.sprite);
    if (e.tipo === 'boneco_golpe' && e.golpe) {
      const min = jogo?.regras.aviso_min_comum_quadros;
      if (min && e.golpe.aviso_quadros < min) erro(arq, '/golpe/aviso_quadros', `aviso de ${e.golpe.aviso_quadros} quadros é menor que o mínimo ${min} (aviso_min_comum_quadros)`);
      if (e.golpe.aviso_quadros + e.golpe.ativo_quadros >= e.golpe.ciclo_quadros) erro(arq, '/golpe/ciclo_quadros', 'ciclo deve ser maior que aviso + ativo');
    }
  }
  // ---- mapas ----
  for (const [arq, m] of por('mapa')) {
    const [L, A] = m.tamanho;
    exigeTexto(arq, '/nome_txt', m.nome_txt);
    if (m.planta.length !== A) erro(arq, '/planta', `tem ${m.planta.length} linhas, tamanho diz ${A}`);
    m.planta.forEach((linha, z) => {
      if (linha.length !== L) erro(arq, `/planta/${z}`, `linha com ${linha.length} colunas, tamanho diz ${L}`);
      for (let x = 0; x < linha.length; x++) if (!m.legenda[linha[x]]) { erro(arq, `/planta/${z}`, `caractere "${linha[x]}" (coluna ${x}) não está na legenda`); break; }
    });
    const dentro = ([x, z, w, h], campo) => { if (x + w > L || z + h > A) erro(arq, campo, `retângulo [${x}, ${z}, ${w}, ${h}] sai do mapa ${L}×${A}`); };
    m.zonas.forEach((z, i) => dentro(z.retangulo, `/zonas/${i}/retangulo`));
    m.rampas.forEach((r, i) => {
      dentro(r.retangulo, `/rampas/${i}/retangulo`);
      const [rx, rz, rw, rh] = r.retangulo;
      for (let z = rz; z < rz + rh; z++) for (let x = rx; x < rx + rw; x++) { const c = m.planta[z]?.[x]; if (c && m.legenda[c]?.tipo !== 'rampa' && m.legenda[c]?.tipo !== 'escada') { erro(arq, `/rampas/${i}`, `tile (${x}, ${z}) é "${c}" na planta, não rampa/escada`); z = rz + rh; break; } }
    });
    const [ix, iz] = m.inicio_jogador.tile, solido = (x, z) => !!m.legenda[m.planta[z]?.[x]]?.solido;
    if (ix >= L || iz >= A || solido(ix, iz)) erro(arq, '/inicio_jogador/tile', 'início fora do mapa ou dentro de parede');
    m.objetos.forEach((o, i) => {
      const [x, z] = o.tile;
      if (x >= L || z >= A) erro(arq, `/objetos/${i}/tile`, `objeto "${o.id}" fora do mapa`);
      else if (solido(x, z)) erro(arq, `/objetos/${i}/tile`, `objeto "${o.id}" dentro de parede`);
      if (o.tipo === 'inimigo' && !inimigos[o.id]) erro(arq, `/objetos/${i}/id`, `inimigo "${o.id}" não existe em data/enemies`);
    });
    const [lx, lz, lw, lh] = m.limites_camera;
    if (lx < 0 || lz < 0 || lx + lw > L || lz + lh > A) erro(arq, '/limites_camera', 'limites saem do mapa');
  }
  // ---- textos: todas as tabelas devem ter as mesmas chaves ----
  if (textos.length > 1) for (const [arq, t] of textos.slice(1)) { const base = Object.keys(textos[0][1].textos); for (const k of base) if (!(k in t.textos)) erro(arq, '/textos', `falta "${k}" (existe em ${textos[0][0]})`); }

  return { erros, avisos, arquivos: Object.keys(lidos).length };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const raiz = process.argv[2] ? process.argv[2] : RAIZ_PADRAO;
  const { erros, avisos, arquivos } = validarDados(raiz);
  for (const a of avisos) console.warn('aviso:', a);
  if (erros.length) { console.error(`\n✗ validar dados: ${erros.length} erro(s)`); for (const e of erros) console.error('  ' + e); process.exit(1); }
  console.log(`✓ validar dados: ${arquivos} arquivos válidos`);
}
