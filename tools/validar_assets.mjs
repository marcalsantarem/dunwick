// Validador de assets (roda no build): folhas de sprite (albedo + normal + brilho + meta), atlas de cenário, FX e áudio.
// Regras do projeto (CLAUDE.md / ADR-001): célula 64×64, âncora nos pés, alpha só 0/255, normal map com alpha 0 fora da silhueta,
// texturas ≤ 2048 px, tiles de 32 px. Uso: node tools/validar_assets.mjs [raiz]
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodificarPng, lerCabecalhoPng } from './lib/png.mjs';
import { lerCabecalhoWav } from './lib/wav.mjs';

const RAIZ_PADRAO = join(dirname(fileURLToPath(import.meta.url)), '..');
const MAX_TEXTURA = 2048;

function alphaBinario(img) { for (let i = 3; i < img.px.length; i += 4) if (img.px[i] !== 0 && img.px[i] !== 255) return false; return true; }

export function validarAssets(raiz = RAIZ_PADRAO) {
  const erros = [], avisos = [];
  const erro = (arq, msg) => erros.push(`assets/${arq}: ${msg}`);
  const lerPng = (arq) => { try { return decodificarPng(readFileSync(join(raiz, 'assets', arq))); } catch (e) { erro(arq, e.message); return null; } };
  const dirSprites = join(raiz, 'assets', 'sprites');
  let sprites = 0;
  if (existsSync(dirSprites)) for (const id of readdirSync(dirSprites).sort()) {
    if (!statSync(join(dirSprites, id)).isDirectory()) continue;
    sprites++;
    const rel = (s) => `sprites/${id}/${id}${s}`;
    for (const s of ['.png', '_n.png', '_e.png', '.meta.json']) if (!existsSync(join(raiz, 'assets', rel(s)))) erro(rel(s), 'arquivo obrigatório não existe');
    if (!existsSync(join(raiz, 'assets', rel('.meta.json')))) continue;
    let meta;
    try { meta = JSON.parse(readFileSync(join(raiz, 'assets', rel('.meta.json')), 'utf8')); } catch (e) { erro(rel('.meta.json'), `JSON inválido (${e.message})`); continue; }
    if (meta.id !== id) erro(rel('.meta.json'), `id "${meta.id}" deve ser "${id}"`);
    const { celula, ancora, direcoes, quadros } = meta;
    if (!Array.isArray(celula) || celula.length !== 2 || celula.some((n) => !Number.isInteger(n) || n < 8)) { erro(rel('.meta.json'), 'celula deve ser [largura, altura] inteiros'); continue; }
    if (!Array.isArray(ancora) || ancora[0] < 0 || ancora[0] >= celula[0] || ancora[1] < 0 || ancora[1] >= celula[1]) erro(rel('.meta.json'), 'ancora fora da célula');
    if (!Array.isArray(direcoes) || !direcoes.length || direcoes.some((d) => !['s', 'n', 'l', 'o'].includes(d))) erro(rel('.meta.json'), 'direcoes deve listar s, n, l (o é espelhada de l)');
    if (!Number.isInteger(quadros) || quadros < 1) { erro(rel('.meta.json'), 'quadros deve ser inteiro >= 1'); continue; }
    if (meta.normal_map !== 'opengl_y_cima') erro(rel('.meta.json'), 'normal_map deve ser "opengl_y_cima" (ADR-001 §7)');
    const W = celula[0] * quadros, H = celula[1] * (direcoes?.length ?? 0);
    if (W > MAX_TEXTURA || H > MAX_TEXTURA) erro(rel('.png'), `folha ${W}×${H} passa de ${MAX_TEXTURA} px`);
    const alb = lerPng(rel('.png')), nrm = lerPng(rel('_n.png')), emi = lerPng(rel('_e.png'));
    for (const [nome, img] of [['.png', alb], ['_n.png', nrm], ['_e.png', emi]]) {
      if (!img) continue;
      if (img.w !== W || img.h !== H) erro(rel(nome), `tamanho ${img.w}×${img.h}; esperado ${W}×${H} (${quadros} quadros × ${direcoes?.length} direções de ${celula[0]}×${celula[1]})`);
      else if (!alphaBinario(img)) erro(rel(nome), 'alpha deve ser só 0 ou 255 (sem meio-tom)');
    }
    if (alb && nrm && alb.w === nrm.w && alb.h === nrm.h) {
      let fora = 0;
      for (let i = 3; i < alb.px.length; i += 4) if (alb.px[i] === 0 && nrm.px[i] !== 0) fora++;
      if (fora) erro(rel('_n.png'), `${fora} pixels de normal fora da silhueta (alpha deve ser 0 onde o albedo é transparente)`);
    }
  }
  // atlas de cenário
  const dirEnv = join(raiz, 'assets', 'env');
  if (existsSync(dirEnv)) for (const nome of readdirSync(dirEnv).filter((n) => n.endsWith('.png') && !n.endsWith('_n.png'))) {
    const base = nome.replace('.png', ''), meta = join(dirEnv, `${base}.meta.json`);
    if (!existsSync(meta)) { erro(`env/${nome}`, 'falta o .meta.json do atlas'); continue; }
    if (!existsSync(join(dirEnv, `${base}_n.png`))) erro(`env/${nome}`, 'falta o normal map (_n.png)');
    const { tile, colunas } = JSON.parse(readFileSync(meta, 'utf8')), cab = lerCabecalhoPng(readFileSync(join(dirEnv, nome)));
    if (cab.w > MAX_TEXTURA || cab.h > MAX_TEXTURA) erro(`env/${nome}`, `atlas ${cab.w}×${cab.h} passa de ${MAX_TEXTURA} px`);
    if (cab.w % tile || cab.h % tile) erro(`env/${nome}`, `atlas ${cab.w}×${cab.h} não é múltiplo do tile de ${tile} px`);
    if (cab.w / tile !== colunas) erro(`env/${nome}`, `colunas do meta (${colunas}) ≠ largura/tile (${cab.w / tile})`);
    const nrm = lerPng(`env/${base}_n.png`); if (nrm && (nrm.w !== cab.w || nrm.h !== cab.h)) erro(`env/${base}_n.png`, 'tamanho diferente do albedo');
  }
  // FX
  const dirFx = join(raiz, 'assets', 'fx');
  if (existsSync(dirFx)) for (const nome of readdirSync(dirFx).filter((n) => n.endsWith('.png'))) { const img = lerPng(`fx/${nome}`); if (img && (img.w > MAX_TEXTURA || img.h > MAX_TEXTURA)) erro(`fx/${nome}`, 'textura grande demais'); }
  // áudio
  const dirAudio = join(raiz, 'assets', 'audio');
  if (existsSync(dirAudio)) for (const nome of readdirSync(dirAudio)) {
    const ext = extname(nome);
    if (ext === '.wav') { try { const c = lerCabecalhoWav(readFileSync(join(dirAudio, nome))); if (c.bits !== 16) erro(`audio/${nome}`, 'WAV deve ser PCM de 16 bits'); } catch (e) { erro(`audio/${nome}`, e.message); } }
    else if (ext === '.ogg') { if (readFileSync(join(dirAudio, nome)).subarray(0, 4).toString('ascii') !== 'OggS') erro(`audio/${nome}`, 'não é um arquivo Ogg'); }
    else if (ext) avisos.push(`assets/audio/${nome}: formato "${ext}" fora do padrão (Ogg-Opus; WAV só para placeholder)`);
  }
  return { erros, avisos, sprites };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const { erros, avisos, sprites } = validarAssets(process.argv[2] || RAIZ_PADRAO);
  for (const a of avisos) console.warn('aviso:', a);
  if (erros.length) { console.error(`\n✗ validar assets: ${erros.length} erro(s)`); for (const e of erros) console.error('  ' + e); process.exit(1); }
  console.log(`✓ validar assets: ${sprites} sprites, atlas, fx e áudio válidos`);
}
