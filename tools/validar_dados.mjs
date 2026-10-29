// Validador de dados (roda no build e em `npm run validar`): esquema (Ajv) + regras cruzadas do projeto.
// Mensagem de erro sempre aponta ARQUIVO e CAMPO: "data/config/cfg_jogo.json /camera/inclinacao_graus: deve ser <= 60".
import Ajv2020 from 'ajv/dist/2020.js';
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { listarArquivos, carregarEsquemas, lerJson } from './lib/dados.mjs';
import { validarMapasLigados } from './lib/validar_mapas_ligados.mjs';

const RAIZ_PADRAO = join(dirname(fileURLToPath(import.meta.url)), '..');
const PREFIXOS_ID = ['hero', 'npc', 'enemy', 'boss', 'item', 'skill', 'quest', 'map', 'fx', 'sfx', 'mus', 'txt', 'ui', 'amb', 'atk', 'cfg', 'perfil', 'env', 'prop', 'enc', 'z', 'cen'];

function mensagemAjv(e) {
  const extra = e.params?.additionalProperty ? ` (campo "${e.params.additionalProperty}")` : e.params?.allowedValues ? ` (${e.params.allowedValues.join(' | ')})` : e.params?.missingProperty ? ` ("${e.params.missingProperty}")` : '';
  return [e.instancePath || '/', `${e.message}${extra}`];
}

export function validarDados(raiz = RAIZ_PADRAO) {
  const erros = [], avisos = [];
  const erro = (arq, campo, msg) => erros.push(`data/${arq} ${campo}: ${msg}`);
  const esquemas = carregarEsquemas(raiz), ajv = new Ajv2020({ allErrors: true, strict: true }), validadores = {};
  for (const [nome, esq] of Object.entries(esquemas)) validadores[nome] = ajv.compile(esq);

  const arquivos = listarArquivos(raiz), lidos = {}, esquemaDe = {};
  for (const { arquivo, caminho, esquema } of arquivos) {
    if (!esquema) { if (!arquivo.endsWith('.gitkeep')) avisos.push(`data/${arquivo}: sem esquema registrado (ignorado)`); continue; }
    let obj; try { obj = lerJson(caminho); } catch (e) { erros.push(e.message); continue; }
    const v = validadores[esquema];
    if (!v) { erro(arquivo, '/', `esquema "${esquema}" não existe em data/schemas`); continue; }
    if (!v(obj)) { for (const e of v.errors) { const [c, m] = mensagemAjv(e); erro(arquivo, c, m); } continue; }
    lidos[arquivo] = obj; esquemaDe[arquivo] = esquema;
    if (esquema !== 'textos' && basename(arquivo, '.json') !== obj.id) erro(arquivo, '/id', `deve ser igual ao nome do arquivo ("${basename(arquivo, '.json')}")`);
    const pref = String(obj.id ?? '').split('_')[0];
    if (esquema !== 'textos' && !PREFIXOS_ID.includes(pref)) erro(arquivo, '/id', `prefixo "${pref}_" não está na lista de prefixos do projeto`);
  }
  const por = (esq) => Object.entries(lidos).filter(([a]) => esquemaDe[a] === esq);
  const um = (esq) => por(esq)[0]?.[1];
  const jogo = um('cfg_jogo'), perfis = um('cfg_perfis'), entrada = um('cfg_entrada'), ciclo = um('cfg_ciclo'), kit = um('cfg_kit');
  const chavesTexto = new Set(por('textos').flatMap(([, t]) => Object.keys(t.textos)));
  const exigeTexto = (arq, campo, id) => { if (!chavesTexto.has(id)) erro(arq, campo, `texto "${id}" não existe em data/texts`); };
  const metaSprite = (id) => { const p = join(raiz, 'assets', 'sprites', id, `${id}.meta.json`); return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null; };
  const temSprite = (arq, campo, id) => {
    for (const ext of ['.png', '.meta.json']) if (!existsSync(join(raiz, 'assets', 'sprites', id, id + ext))) erro(arq, campo, `sprite "${id}": falta assets/sprites/${id}/${id}${ext} (rode npm run assets)`);
    return metaSprite(id);
  };
  for (const esq of ['cfg_jogo', 'cfg_perfis', 'cfg_entrada', 'cfg_orcamento', 'cfg_ciclo', 'cfg_kit']) if (!um(esq)) erros.push(`data/: falta o arquivo de "${esq}" (ou ele é inválido)`);

  if (perfis) {
    const ids = perfis.perfis.map((p) => p.id);
    if (!ids.includes(perfis.padrao)) erro('config/cfg_perfis.json', '/padrao', `perfil "${perfis.padrao}" não existe`);
    if (new Set(ids).size !== ids.length) erro('config/cfg_perfis.json', '/perfis', 'IDs de perfil repetidos');
    perfis.perfis.forEach((p, i) => exigeTexto('config/cfg_perfis.json', `/perfis/${i}/nome_txt`, p.nome_txt));
  }
  if (jogo) {
    if (jogo.camera.near >= jogo.camera.far) erro('config/cfg_jogo.json', '/camera/near', 'deve ser menor que far');
    if (jogo.camera.distancia <= jogo.camera.near || jogo.camera.distancia >= jogo.camera.far) erro('config/cfg_jogo.json', '/camera/distancia', 'deve ficar entre near e far');
    if (jogo.resolucao.modo === 'arte' && jogo.resolucao.arte[0] * 9 !== jogo.resolucao.arte[1] * 16) erro('config/cfg_jogo.json', '/resolucao/arte', 'a resolução de arte deve ser 16:9');
  }
  if (ciclo) {
    ciclo.pontos.forEach((p, i) => { if (i && p.hora <= ciclo.pontos[i - 1].hora) erro('config/cfg_ciclo.json', `/pontos/${i}/hora`, 'as horas devem ser estritamente crescentes'); });
    if (ciclo.pontos[0].hora > 6 || ciclo.pontos[ciclo.pontos.length - 1].hora < 23) avisos.push('data/config/cfg_ciclo.json: cobertura de horas incompleta (esperado de ≤ 6 até ≥ 23)');
  }
  if (entrada) {
    const uso = new Map();
    const registrar = (ctx, tecla, quem) => { const k = `${ctx}|${tecla}`; if (uso.has(k)) erro('config/cfg_entrada.json', '/', `tecla "${tecla}" usada por "${uso.get(k)}" e "${quem}" no mesmo contexto`); else uso.set(k, quem); };
    for (const [n, e] of Object.entries(entrada.eixos)) for (const [dir, teclas] of Object.entries(e.teclado)) for (const t of teclas) registrar(e.contexto, t, `${n}.${dir}`);
    for (const [n, a] of Object.entries(entrada.acoes)) for (const t of a.teclado) registrar(a.contexto, t, n);
    for (const [n, d] of Object.entries(entrada.debug)) for (const t of d.teclado) registrar('debug', t, n);
    for (const [n, d] of Object.entries(entrada.debug)) if (d.teclado.some((t) => t === 'F5' || t === 'F11')) erro('config/cfg_entrada.json', `/debug/${n}`, 'F5 e F11 ficam livres para o navegador');
    for (const [n, a] of Object.entries(entrada.acoes)) if (a.teclado.some((t) => /^F[0-9]+$/.test(t))) erro('config/cfg_entrada.json', `/acoes/${n}`, 'teclas F são reservadas ao debug e ao navegador');
    for (const acao of ['clique_principal', 'correr', 'atacar', 'forte', 'esquivar', 'ancorar']) if (!entrada.acoes[acao]) erro('config/cfg_entrada.json', '/acoes', `ação obrigatória "${acao}" ausente`);
  }
  // ---- herói: ataques coerentes com a animação do sprite (quadros × fps) ----
  for (const [arq, h] of por('personagem')) {
    const meta = temSprite(arq, '/sprite', h.sprite);
    if (h.movimento.vel_correr <= h.movimento.vel_andar) erro(arq, '/movimento/vel_correr', 'deve ser maior que vel_andar');
    if (meta) {
      for (const [k, anim] of Object.entries(h.animacoes)) if (!meta.anims[anim]) erro(arq, `/animacoes/${k}`, `animação "${anim}" não existe no sprite (${Object.keys(meta.anims).join(', ')})`);
      const confere = (campo, anim, total) => { const a = meta.anims[anim]; if (!a) { erro(arq, `${campo}/anim`, `animação "${anim}" não existe no sprite`); return; } const dur = (a.quadros * 60) / a.fps; const razao = total / dur; if (razao < 0.6 || razao > 1.8) erro(arq, campo, `duração de ${total} quadros estica a animação "${anim}" demais (${a.quadros} quadros a ${a.fps} fps = ${dur.toFixed(0)} quadros a 60 Hz; razão ${razao.toFixed(2)}, aceito 0,6–1,8)`); };
      h.ataques.forEach((a, i) => confere(`/ataques/${i}/quadros`, a.anim, a.quadros.preparacao + a.quadros.ativo + a.quadros.recuperacao));
      confere('/forte/quadros', h.forte.anim, h.forte.quadros.preparacao + h.forte.quadros.ativo + h.forte.quadros.recuperacao);
      confere('/esquiva/duracao_quadros', h.esquiva.anim, h.esquiva.duracao_quadros);
    }
    if (h.esquiva.invencivel_quadros[1] > h.esquiva.duracao_quadros) erro(arq, '/esquiva/invencivel_quadros', 'a janela de invencibilidade passa da duração da esquiva');
    const ids = h.ataques.map((a) => a.id).concat(h.forte.id); if (new Set(ids).size !== ids.length) erro(arq, '/ataques', 'IDs de ataque repetidos');
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
    m.planta.forEach((linha, z) => { if (linha.length !== L) erro(arq, `/planta/${z}`, `linha com ${linha.length} colunas, tamanho diz ${L}`); for (let x = 0; x < linha.length; x++) if (!m.legenda[linha[x]]) { erro(arq, `/planta/${z}`, `caractere "${linha[x]}" (coluna ${x}) não está na legenda`); break; } });
    const ids = new Set();
    m.objetos.forEach((o, i) => {
      if (ids.has(o.id)) erro(arq, `/objetos/${i}/id`, `ID "${o.id}" repetido`); ids.add(o.id);
      const pegada = o.tipo === 'inimigo' ? true : kit?.pegadas[o.tipo];
      if (!pegada) erro(arq, `/objetos/${i}/tipo`, `tipo "${o.tipo}" não tem pegada em cfg_kit`);
      if (o.tipo === 'cerca' || o.tipo === 'muro_fuligem') { for (const c of ['x0', 'z0', 'x1', 'z1']) if (o[c] === undefined) erro(arq, `/objetos/${i}/${c}`, `${o.tipo} exige x0, z0, x1, z1`); }
      else { if (o.x === undefined || o.z === undefined) erro(arq, `/objetos/${i}`, 'objeto exige x e z'); else if (o.x < 0 || o.z < 0 || o.x > L || o.z > A) erro(arq, `/objetos/${i}`, `objeto "${o.id}" fora do mapa`); }
      if (o.tipo === 'casa' && (!o.w || !o.d || o.telhado === undefined)) erro(arq, `/objetos/${i}`, 'casa exige w, d e telhado');
      if (pegada && pegada.forma === 'ret' && o.tipo !== 'casa' && ((pegada.w === undefined && !o.w) || (pegada.d === undefined && !o.d))) erro(arq, `/objetos/${i}`, `"${o.tipo}" tem pegada sem tamanho em cfg_kit: exige w e d no objeto`);
      if (pegada && pegada.forma === 'dupla' && !o.w) erro(arq, `/objetos/${i}/w`, 'pórtico exige w (vão entre os postes)');
      if (o.tipo === 'inimigo' && !inimigos[o.id]) erro(arq, `/objetos/${i}/id`, `inimigo "${o.id}" não existe em data/enemies`);
    });
    const [lx, lz, lw, lh] = m.limites_camera; if (lx < 0 || lz < 0 || lx + lw > L || lz + lh > A) erro(arq, '/limites_camera', 'limites saem do mapa');
    if (m.inicio_jogador.tile[0] >= L || m.inicio_jogador.tile[1] >= A) erro(arq, '/inicio_jogador/tile', 'início fora do mapa');
  }
  if (kit && jogo) validarMapasLigados(por('mapa'), kit, jogo.mundo, erro, exigeTexto); // edifícios, portais ida e volta, início/chegadas livres, POIs alcançáveis (v0.1.2)
  // ---- combate por turnos (regras cruzadas; esquemas em data/schemas/*_batalha, encontro, cfg_batalha) ----
  const cb = um('cfg_batalha');
  if (por('cfg_batalha').length === 0 && por('encontro').length) erros.push('data/combate: falta cfg_batalha.json (ou ele é inválido)');
  const acoes = Object.fromEntries(por('acao_batalha').map(([a, x]) => [x.id, [a, x]]));
  const itensB = Object.fromEntries(por('item_batalha').map(([a, x]) => [x.id, [a, x]]));
  const heroisB = Object.fromEntries(por('heroi_batalha').map(([a, x]) => [x.id, [a, x]]));
  const inimigosB = Object.fromEntries(por('inimigo_batalha').map(([a, x]) => [x.id, [a, x]]));
  if (cb) {
    const f = cb.fuga; if (f.min > f.max) erro('combate/cfg_batalha.json', '/fuga/min', 'deve ser ≤ max');
    for (const [k, [a, x]] of Object.entries(acoes)) {
      exigeTexto(a, '/nome_txt', x.nome_txt);
      if (!cb.tempos[x.tempo]) erro(a, '/tempo', `tempo "${x.tempo}" não existe em cfg_batalha.tempos`);
      if (x.efeito === 'dano') {
        if ((x.dano_base === undefined) === (x.mult_dano === undefined)) erro(a, '/', 'ação de dano exige exatamente um entre "dano_base" (inimigo) e "mult_dano" (herói, sobre poder_arma)');
        for (const c of ['atributo', 'escala', 'tipo_dano']) if (x[c] === undefined) erro(a, `/${c}`, 'ação de dano exige este campo');
      }
      if (x.efeito === 'cura') for (const c of ['atributo', 'escala', 'cura_base']) if (x[c] === undefined) erro(a, `/${c}`, 'ação de cura exige este campo');
      if (x.efeito === 'cura' && !x.alvo_tipo.startsWith('aliado') && x.alvo_tipo !== 'si') erro(a, '/alvo_tipo', 'cura deve mirar aliado ou si');
      if (x.tipo === 'ataque' && x.custo.mana !== 0) erro(a, '/custo/mana', 'ataque básico não custa mana');
    }
    for (const [, [a, x]] of Object.entries(itensB)) { exigeTexto(a, '/nome_txt', x.nome_txt); if (!cb.tempos[x.tempo]) erro(a, '/tempo', `tempo "${x.tempo}" não existe em cfg_batalha.tempos`); }
    for (const [, [a, h]] of Object.entries(heroisB)) {
      exigeTexto(a, '/nome_txt', h.nome_txt);
      const ref = (campo, id) => { if (!acoes[id]) erro(a, campo, `ação "${id}" não existe em data/attacks`); };
      ref('/kit/ataque', h.kit.ataque); h.kit.habilidades.forEach((id, i) => ref(`/kit/habilidades/${i}`, id));
      h.kit.itens.forEach((id, i) => { if (!itensB[id]) erro(a, `/kit/itens/${i}`, `item "${id}" não existe em data/combate`); });
      if (acoes[h.kit.ataque] && acoes[h.kit.ataque][1].efeito !== 'dano') erro(a, '/kit/ataque', 'o ataque básico deve ser de dano');
      for (const id of [h.kit.ataque, ...h.kit.habilidades]) if (acoes[id] && acoes[id][1].dano_base !== undefined) erro(a, '/kit', `"${id}" usa dano_base (de inimigo); herói usa mult_dano`);
    }
    for (const [, [a, e]] of Object.entries(inimigosB)) {
      exigeTexto(a, '/nome_txt', e.nome_txt);
      e.ia.forEach((o, i) => {
        if (!acoes[o.acao]) erro(a, `/ia/${i}/acao`, `ação "${o.acao}" não existe em data/attacks`);
        else if (acoes[o.acao][1].dano_base === undefined && acoes[o.acao][1].efeito === 'dano') erro(a, `/ia/${i}/acao`, `"${o.acao}" usa mult_dano; inimigo usa dano_base`);
        if (o.alvo_regra === 'misto' && o.prob_menor_vida === undefined) erro(a, `/ia/${i}/prob_menor_vida`, 'regra "misto" exige prob_menor_vida');
      });
      e.drops.forEach((d, i) => { if (!itensB[d.item]) erro(a, `/drops/${i}/item`, `item "${d.item}" não existe em data/combate`); });
    }
    for (const [arq, e] of por('encontro')) {
      exigeTexto(arq, '/nome_txt', e.nome_txt);
      e.inimigos.forEach((id, i) => { if (!inimigosB[id]) erro(arq, `/inimigos/${i}`, `inimigo "${id}" não existe em data/combate`); });
    }
    cb.debug.encontros.forEach((id, i) => { if (!por('encontro').some(([, e]) => e.id === id)) erro('combate/cfg_batalha.json', `/debug/encontros/${i}`, `encontro "${id}" não existe em data/combate`); });
    for (const id of Object.keys(cb.inventario_teste)) if (!itensB[id]) erro('combate/cfg_batalha.json', `/inventario_teste/${id}`, 'item não existe em data/combate');
  }
  // ---- exploração: encontro aleatório por passos (13) ----
  for (const [arq, z] of por('zonas_encontro')) {
    const mapa = por('mapa').find(([, m]) => m.id === z.mapa)?.[1];
    if (!mapa) { erro(arq, '/mapa', `mapa "${z.mapa}" não existe em data/maps`); continue; }
    if (por('zonas_encontro').filter(([, o]) => o.mapa === z.mapa).length > 1) erro(arq, '/mapa', `mais de um arquivo de encontros para "${z.mapa}"`);
    const [L, A] = mapa.tamanho, ids = new Set();
    const ret = (campo, r, id) => {
      if (ids.has(id)) erro(arq, campo, `zona "${id}" repetida`); ids.add(id);
      if (r[0] > r[2] || r[1] > r[3]) erro(arq, campo + '/ret', 'x0 ≤ x1 e z0 ≤ z1');
      if (r[2] >= L || r[3] >= A) erro(arq, campo + '/ret', `fora do mapa (${L} × ${A} tiles)`);
    };
    z.zonas_seguras.forEach((s, i) => ret(`/zonas_seguras/${i}`, s.ret, s.id));
    z.zonas_encontro.forEach((s, i) => {
      ret(`/zonas_encontro/${i}`, s.ret, s.id);
      s.tabela.forEach((t, j) => { if (!por('encontro').some(([, e]) => e.id === t.encontro)) erro(arq, `/zonas_encontro/${i}/tabela/${j}/encontro`, `encontro "${t.encontro}" não existe em data/combate`); });
    });
    const [ix, iz] = mapa.inicio_jogador.tile;
    if (z.zonas_encontro.some((s) => ix >= s.ret[0] && ix <= s.ret[2] && iz >= s.ret[1] && iz <= s.ret[3]) && !z.zonas_seguras.some((s) => ix >= s.ret[0] && ix <= s.ret[2] && iz >= s.ret[1] && iz <= s.ret[3])) avisos.push(`data/${arq}: o início do jogador está numa zona de encontro`);
  }
  const textos = por('textos');
  if (textos.length > 1) for (const [arq, t] of textos.slice(1)) for (const k of Object.keys(textos[0][1].textos)) if (!(k in t.textos)) erro(arq, '/textos', `falta "${k}" (existe em ${textos[0][0]})`);
  return { erros, avisos, arquivos: Object.keys(lidos).length };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const { erros, avisos, arquivos } = validarDados(process.argv[2] ? process.argv[2] : RAIZ_PADRAO);
  for (const a of avisos) console.warn('aviso:', a);
  if (erros.length) { console.error(`\n✗ validar dados: ${erros.length} erro(s)`); for (const e of erros) console.error('  ' + e); process.exit(1); }
  console.log(`✓ validar dados: ${arquivos} arquivos válidos`);
}
