// Simulação rápida da economia v0.1.4 (06): preços, ganho por batalha, quantas batalhas até comprar e o efeito do equipamento
// nas batalhas (motor real, política simples do 03). Uso: node tools/simulacoes/economia.mjs [--n=2000]
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { empacotarDados } from '../lib/dados.mjs';
import { simularLote } from '../../src/jogo/batalha/politica.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const n = Number((process.argv.find((a) => a.startsWith('--n=')) ?? '--n=2000').slice(4));
const dados = empacotarDados(RAIZ), eco = dados.config.economia, itens = dados.combate.itens;
const arred = (x) => Math.floor(x + 0.5 + 1e-9), pct = (x) => `${(x * 100).toFixed(1)} %`;
const textos = JSON.parse(readFileSync(join(RAIZ, 'data/texts/pt-BR.json'), 'utf8')).textos, nome = (id) => textos[itens[id].nome_txt];

console.log(`Coroas iniciais ${eco.coroas_iniciais} · venda ${eco.venda_pct} % da compra\n`);
console.log('PREÇOS (compra / venda / venda = 50 % arredondado?)');
for (const [id, p] of Object.entries(eco.precos)) console.log(`  ${nome(id).padEnd(22)} ${String(p.compra).padStart(4)} ${String(p.venda).padStart(4)}   ${p.venda === arred((p.compra * eco.venda_pct) / 100) ? 'ok' : 'DIVERGE'}`);

// ganho por encontro (moedas dos inimigos, dados reais)
const ganho = (id) => dados.combate.encontros[id].inimigos.reduce((s, e) => s + dados.combate.inimigos[e].moedas, 0);
const encs = ['enc_slime_1', 'enc_lobo_1', 'enc_misto_1'], medio = encs.reduce((s, e) => s + ganho(e), 0) / encs.length;
console.log('\nGANHO POR BATALHA (Coroas)');
for (const e of encs) console.log(`  ${e.padEnd(14)} ${ganho(e)}`);
console.log(`  média dos três ${medio.toFixed(1)}`);
console.log('\nBATALHAS ATÉ COMPRAR (média de ganho, partindo das Coroas iniciais)');
for (const [id, p] of Object.entries(eco.precos)) console.log(`  ${nome(id).padEnd(22)} ${String(p.compra).padStart(4)} Coroas → ${Math.max(0, Math.ceil((p.compra - eco.coroas_iniciais) / medio))} batalha(s)`);
const regiao = 25, renda = eco.coroas_iniciais + regiao * medio;
const lista = ['item_espada_ferro', 'item_cajado_freixo', 'item_gibao_couro'].reduce((s, i) => s + eco.precos[i].compra, 0) + 5 * eco.precos.item_pocao_ervas.compra;
console.log(`\nREGIÃO (${regiao} batalhas): renda ${renda.toFixed(0)} Coroas; lista completa (3 equipamentos + 5 poções) ${lista}; a renda cobre ${(Math.min(1, renda / lista) * 100).toFixed(0)} % da lista (meta do 06: sobrar pouco e faltar um pouco, para haver escolha; sem moeda sobrando nem grind)`);

// efeito do equipamento nas batalhas (motor real)
function com(...ids) {
  const d = structuredClone(dados);
  for (const id of ids) {
    const it = itens[id];
    for (const h of it.para) {
      const her = d.combate.herois[h];
      if (it.stats.poder_arma !== undefined) her.arma.poder = it.stats.poder_arma;
      if (it.stats.armadura !== undefined) her.armadura = it.stats.armadura;
      for (const [k, v] of Object.entries(it.bonus_itens ?? {})) her.bonus_itens[k] += v;
    }
  }
  return d;
}
const variantes = [['sem compras', []], ['+ espada', ['item_espada_ferro']], ['+ gibão (Edric e Grace)', ['item_gibao_couro']], ['+ cajado', ['item_cajado_freixo']], ['tudo', ['item_espada_ferro', 'item_cajado_freixo', 'item_gibao_couro']]];
console.log(`\nEFEITO DO EQUIPAMENTO (${n} batalhas por linha; heróis do nível 1 dos dados)`);
for (const e of ['enc_lobo_1', 'enc_misto_1']) {
  console.log(`  ${e}`);
  for (const [rot, ids] of variantes) {
    const r = simularLote(com(...ids), e, n, 1);
    console.log(`    ${rot.padEnd(26)} vitória ${pct(r.vitoria).padStart(8)}  rodadas ${r.rodadas_media.toFixed(2)}  vida do grupo no fim ${pct(r.vida_grupo_fim)}`);
  }
}
