// Executa a matriz de medições de uma opção e grava resultados/<opcao>/<nome>.json (+ .png). Uso: node ferramentas/lote.mjs <opcao> <grupo>
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
const [opcao, grupo] = process.argv.slice(2);
const base = `spike=`;
const G = {
  pos360: [], luzes360: [],
  base: [],
  res: [],
  nitidezoz: [], nitidez: [], diorama: [], multidao: [], pos: [], luzes: [], carregamento: [], audio: [],
};
for (const esc of [1, 2, 3]) for (const cam of ['persp', 'orto']) for (const snap of [1, 0]) for (const mover of [0, 1]) for (const res of ['nativa', 'baixa']) {
  if (res === 'baixa' && esc === 1) continue;
  G.nitidez.push([`nit_e${esc}_${cam}_snap${snap}_mov${mover}_${res}`, `${base}sprite&perfil=alto&teste=nitidez&escala=${esc}&camera=${cam}&snap=${snap}&mover=${mover}&res=${res}&hud=0&w=1920&h=1080`, 2, true]);
}
for (const esc of [1, 2, 3]) for (const cam of ['persp', 'orto']) for (const oz of [0, -3, -6, 6]) G.nitidezoz.push([`nitoz_e${esc}_${cam}_oz${oz}`, `${base}sprite&perfil=alto&teste=nitidez&escala=${esc}&camera=${cam}&oz=${oz}&hud=0&w=1920&h=1080`, 1, true]);
for (const perfil of ['alto', 'medio', 'baixo']) {
  G.diorama.push([`diorama_${perfil}`, `${base}diorama&perfil=${perfil}&escala=3&luzes=4&hud=0`, 12, false]);
  G.multidao.push([`multidao_${perfil}`, `${base}multidao&perfil=${perfil}&escala=3&luzes=4&hud=0&mover=1`, 12, false]);
  G.carregamento.push([`carga_${perfil}`, `${base}carregamento&perfil=${perfil}&escala=3&luzes=4&hud=0`, 3, false]);
}
for (const pos of ['', 'nevoa', 'cor', 'bloom', 'dof', 'vol', 'bloom,dof,vol,nevoa,cor']) G.pos.push([`pos_${pos || 'nenhum'}`.replace(/,/g, '+'), `${base}diorama&perfil=alto&escala=3&luzes=4&hud=0&pos=${pos}`, 8, false]);
for (const n of [0, 2, 4, 8, 12, 16]) for (const perfil of ['alto', 'baixo']) G.luzes.push([`luzes_${n}_${perfil}`, `${base}diorama&perfil=${perfil}&escala=3&luzes=${n}&hud=0&pos=`, 6, false]);
for (const perfil of ['alto', 'medio', 'baixo']) for (const [rn, q] of [['1080nativa', 'res=nativa&escala=3&w=1920&h=1080'], ['720nativa', 'res=nativa&escala=2&w=1280&h=720'], ['640x360esc3', 'res=baixa&escala=3&w=1920&h=1080']]) G.res.push([`res_${rn}_${perfil}`, `${base}multidao&perfil=${perfil}&luzes=4&hud=0&mover=1&${q}`, 10, false]);
for (const perfil of ['alto', 'medio', 'baixo']) G.base.push([`base_multidao_${perfil}`, `${base}multidao&perfil=${perfil}&escala=3&luzes=4&hud=0&mover=1&pos=`, 10, false]);
for (const pos of ['', 'nevoa', 'cor', 'bloom', 'dof', 'vol', 'bloom,dof,vol,nevoa,cor']) G.pos360.push([`pos360_${pos || 'nenhum'}`.replace(/,/g, '+'), `${base}multidao&perfil=alto&luzes=4&hud=0&mover=1&res=baixa&escala=3&w=1920&h=1080&pos=${pos}`, 8, false]);
for (const n of [4, 8, 16]) for (const perfil of ['alto', 'baixo']) G.luzes360.push([`luzes360_${n}_${perfil}`, `${base}multidao&perfil=${perfil}&luzes=${n}&hud=0&mover=1&res=baixa&escala=3&w=1920&h=1080&pos=`, 8, false]);
G.audio.push(['audio', `${base}audio`, 1, false]);
const alvo = (G[grupo] || []);
mkdirSync(`resultados/${opcao}`, { recursive: true });
for (const [nome, query, seg, nit] of alvo) {
  try {
    const saida = execFileSync('node', ['ferramentas/medir.mjs', opcao, query, String(seg), `--captura=resultados/${opcao}/${nome}.png`, ...(nit ? ['--nitidez'] : [])], { encoding: 'utf8', timeout: 240000 });
    writeFileSync(`resultados/${opcao}/${nome}.json`, saida);
    const r = JSON.parse(saida);
    console.log(nome.padEnd(34), r.fpsMedio ?? '-', 'fps · pior1%', r.fpsPior1 ?? '-', '· chamadas', r.chamadasDesenho ?? '-', '·', r.nitidez ? `nitidez ${r.nitidez.blocosUniformesPct}%` : '', r.erros?.length ? `ERROS ${r.erros.slice(0, 2)}` : '');
  } catch (e) { console.log(nome, 'FALHOU', String(e.message).slice(0, 200)); }
}
