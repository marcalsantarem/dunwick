// Roda um encontro com a semente e imprime o registro de eventos; ou um lote de N batalhas com o resumo.
//   node tools/simular_batalha.mjs enc_misto_1 --semente=7
//   node tools/simular_batalha.mjs enc_lobo_1 --lote=1000
// Opções: --semente=N (padrão 1) · --lote=N (resumo, sem registro) · --resumo (só o resultado da batalha única)
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { empacotarDados } from './lib/dados.mjs';
import { jogarAutomatico, simularLote } from '../src/jogo/batalha/politica.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2), enc = args.find((a) => !a.startsWith('--'));
const opt = (n, pad) => { const a = args.find((x) => x.startsWith(`--${n}=`)); return a ? a.split('=')[1] : pad; };
const dados = empacotarDados(RAIZ);
if (!enc || !dados.combate.encontros[enc]) {
  console.error(`uso: node tools/simular_batalha.mjs <encontro> [--semente=N] [--lote=N] [--resumo]\nencontros: ${Object.keys(dados.combate.encontros).join(', ')}`);
  process.exit(1);
}
const semente = Number(opt('semente', 1)), lote = Number(opt('lote', 0));
const pct = (x) => `${(x * 100).toFixed(1)} %`;

if (lote > 0) {
  const r = simularLote(dados, enc, lote, semente);
  console.log(`${enc} · ${r.n} batalhas (sementes ${semente}…${semente + r.n - 1})`);
  console.log(`  vitória            ${pct(r.vitoria)}`);
  console.log(`  rodadas (média)    ${r.rodadas_media.toFixed(2)}  (nas vitórias: ${r.rodadas_media_vitoria.toFixed(2)})`);
  console.log(`  vida do grupo      ${pct(r.vida_grupo_fim)} no fim`);
  console.log(`  animação (média)   ${r.tempo_animacao_s.toFixed(1)} s a 1×`);
} else {
  const b = jogarAutomatico(dados, { encontro: enc, semente });
  const nome = (uid) => uid;
  const campos = (ev) => Object.entries(ev).filter(([k]) => !['nome', 'rodada', 'comandos', 'grupo', 'inventario'].includes(k)).map(([k, v]) => `${k}=${typeof v === 'object' ? JSON.stringify(v) : v}`).join(' ');
  if (!args.includes('--resumo')) for (const ev of b.log) console.log(`r${String(ev.rodada).padStart(2, '0')}  ${ev.nome.padEnd(18)} ${campos(ev)}`);
  const r = b.resultado;
  console.log(`\n=> ${r.resultado} em ${r.rodadas} rodada(s), semente ${r.semente}, ${r.tempo_animacao_s.toFixed(1)} s de animação a 1×${r.treino ? ' · TREINO (sem recompensa; grupo restaurado)' : ''}`);
  console.log(`   xp ${r.xp} · moedas ${r.moedas} · itens ${JSON.stringify(r.itens)} · níveis ${JSON.stringify(r.niveis)}`);
  console.log(`   grupo: ${r.grupo.map((g) => `${nome(g.id)} ${g.vida}/${g.vida_max} PV ${g.mana}/${g.mana_max} PM${g.caido ? ' (caído)' : ''}`).join(' · ')}`);
}
