// Validador de assets (roda no build): atlas de sprites (PNG + meta), texturas tileáveis do cenário e áudio.
// Regras (ADR-002): atlas de sprite com grade exata (colunas × célula), âncora dentro da célula, direções s/se/l/ne/n (as de oeste são
// espelho), 8 bits RGBA, texturas de cenário 256×256, todas ≤ 4096. Uso: node tools/validar_assets.mjs [raiz]
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lerCabecalhoPng } from './lib/png.mjs';
import { lerCabecalhoWav } from './lib/wav.mjs';

const RAIZ_PADRAO = join(dirname(fileURLToPath(import.meta.url)), '..');
const MAX_TEXTURA = 4096, TEXTURAS = ['grama_a', 'grama_b', 'grama_c', 'terra', 'calcada', 'reboco', 'madeira', 'telha_laranja', 'telha_musgo', 'ardosia', 'casca', 'pedra', 'folhagem', 'tabuas'];
const DIRS = ['s', 'se', 'l', 'ne', 'n'];

export function validarAssets(raiz = RAIZ_PADRAO) {
  const erros = [], avisos = [];
  const erro = (arq, msg) => erros.push(`assets/${arq}: ${msg}`);
  const cab = (arq) => { try { return lerCabecalhoPng(readFileSync(join(raiz, 'assets', arq))); } catch (e) { erro(arq, e.message); return null; } };
  const dirSprites = join(raiz, 'assets', 'sprites');
  let sprites = 0;
  if (existsSync(dirSprites)) for (const id of readdirSync(dirSprites).sort()) {
    if (!statSync(join(dirSprites, id)).isDirectory()) continue;
    sprites++;
    const png = `sprites/${id}/${id}.png`, mj = `sprites/${id}/${id}.meta.json`;
    for (const a of [png, mj]) if (!existsSync(join(raiz, 'assets', a))) erro(a, 'arquivo obrigatório não existe');
    if (!existsSync(join(raiz, 'assets', mj)) || !existsSync(join(raiz, 'assets', png))) continue;
    let meta; try { meta = JSON.parse(readFileSync(join(raiz, 'assets', mj), 'utf8')); } catch (e) { erro(mj, `JSON inválido (${e.message})`); continue; }
    if (meta.id !== id) erro(mj, `id "${meta.id}" deve ser "${id}"`);
    const { celula, ancora, direcoes, colunas, anims, arte_escala: esc } = meta;
    if (!Array.isArray(celula) || celula.length !== 2 || celula.some((n) => !Number.isInteger(n) || n < 16)) { erro(mj, 'celula deve ser [largura, altura] inteiros'); continue; }
    if (!Array.isArray(ancora) || ancora[0] < 0 || ancora[0] >= celula[0] || ancora[1] < 0 || ancora[1] >= celula[1]) erro(mj, 'ancora fora da célula');
    if (!Array.isArray(direcoes) || !direcoes.length || direcoes.some((d) => !DIRS.includes(d))) erro(mj, `direcoes deve listar ${DIRS.join(', ')}`);
    if (!(esc > 0)) erro(mj, 'arte_escala deve ser > 0');
    if (!Number.isInteger(colunas) || colunas < 1 || !anims || !Object.keys(anims).length) { erro(mj, 'colunas e anims são obrigatórios'); continue; }
    let proximo = 0;
    for (const [nome, a] of Object.entries(anims)) {
      if (!Number.isInteger(a.quadros) || a.quadros < 1 || !(a.fps > 0) || !Number.isInteger(a.inicio)) { erro(mj, `animação "${nome}": quadros, fps e inicio são obrigatórios`); continue; }
      if (a.inicio !== proximo) erro(mj, `animação "${nome}": inicio ${a.inicio} deveria ser ${proximo} (quadros em sequência: direção a direção)`);
      proximo = a.inicio + a.quadros * direcoes.length;
      for (const ev of a.eventos ?? []) if (ev.quadro < 0 || ev.quadro >= a.quadros) erro(mj, `animação "${nome}": evento "${ev.tipo}" fora dos quadros`);
    }
    const c = cab(png); if (!c) continue;
    const W = colunas * celula[0], H = Math.ceil(proximo / colunas) * celula[1];
    if (c.w !== W || c.h !== H) erro(png, `tamanho ${c.w}×${c.h}; esperado ${W}×${H} (${proximo} quadros em ${colunas} colunas de ${celula[0]}×${celula[1]})`);
    if (c.w > MAX_TEXTURA || c.h > MAX_TEXTURA) erro(png, `atlas ${c.w}×${c.h} passa de ${MAX_TEXTURA} px`);
  }
  // texturas tileáveis do cenário
  for (const n of TEXTURAS) { const a = `env/tex_${n}.png`; if (!existsSync(join(raiz, 'assets', a))) { erro(a, 'textura obrigatória não existe (rode npm run assets)'); continue; } const c = cab(a); if (c && (c.w !== 256 || c.h !== 256)) erro(a, `textura tileável deve ser 256×256 (é ${c.w}×${c.h})`); }
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
  console.log(`✓ validar assets: ${sprites} atlas de sprite, ${TEXTURAS.length} texturas e áudio válidos`);
}
