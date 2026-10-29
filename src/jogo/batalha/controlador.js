// Controlador da batalha para a APRESENTAÇÃO (cena, UI, som): a API pública do contrato (docs/combate_turnos.md "Integração").
// Envolve o motor (batalha.js) sem expor exceções: comando recusado volta como { ok: false, erro }. Simulação pura (sem three nem DOM).
import { criarEventos } from '../eventos.js';
import { criarBatalha, EVENTOS_BATALHA } from './batalha.js';

const MAPA_RESULTADO = { vitoria: 'vitoria', derrota: 'derrota', fugiu: 'fuga', empate: 'fuga' };

export function criarControladorBatalha(dados, { encontro, semente = 1, grupo, estadoGrupo, inventario, velocidade = 1 } = {}) {
  const cfg = dados.config.batalha, ponte = criarEventos(), fila = [];
  let vel = velocidade;
  if (!cfg.velocidades_batalha.includes(vel)) throw new Error(`velocidade ${vel}× não existe (opções: ${cfg.velocidades_batalha.join(', ')})`);
  const b = criarBatalha(dados, { encontro, semente, grupo, estadoGrupo, inventario, eventos: ponte });
  const encontroDados = dados.combate.encontros[encontro];
  const posCena = (a) => (cfg.posicoes[a.lado === 'grupo' ? 'grupo' : 'inimigos'][a.pos - 1]);

  // cópia do evento para a apresentação: duração dividida pela velocidade e o instante do impacto dentro do ato
  const paraFila = (ev) => {
    const c = { ...ev };
    if (ev.nome === 'ato_executado') { c.duracao_real_s = ev.duracao_s / vel; c.impacto_s = c.duracao_real_s * cfg.fracao_impacto; c.intervalo_s = cfg.tempos.t_intervalo_ato / vel; }
    return c;
  };
  for (const n of EVENTOS_BATALHA) ponte.em(n, (ev) => fila.push(paraFila(ev)));

  const resumoAtor = (a) => ({ uid: a.uid, id: a.id, nome_txt: a.nome_txt, lado: a.lado, slot: a.pos, posicao_cena: posCena(a), vida: a.vida, vida_max: a.vida_max, mana: a.mana, mana_max: a.mana_max, defendendo: a.defendendo, caido: a.caido, nivel: a.nivel ?? null });

  const ctrl = {
    /** Assina um evento (ou '*' para todos). Devolve a função que cancela a assinatura. */
    assinar(nome, fn) {
      if (nome !== '*') { if (!EVENTOS_BATALHA.includes(nome)) throw new Error(`evento "${nome}" não existe (catálogo: ${EVENTOS_BATALHA.join(', ')})`); return ponte.em(nome, fn); }
      const fora = EVENTOS_BATALHA.map((n) => ponte.em(n, fn)); return () => fora.forEach((f) => f());
    },
    iniciar() { b.iniciar(); },
    /** cmd = { ator, comando: 'atacar'|'habilidade'|'item'|'defender'|'fugir', id?, alvo? }. Nunca lança por regra do jogo. */
    enviarComando(cmd) {
      const { ator, ...resto } = cmd ?? {};
      const erro = b.validarComando(ator, resto);
      if (erro) return { ok: false, erro };
      const r = b.escolher(ator, resto);
      return { ok: true, pronto: r.pronto, proximo: b.atorDaVez() };
    },
    voltar() { return b.voltar(); },
    /** Executa a rodada inteira (só quando `pronto`). Devolve os eventos novos (em ordem) e o resultado se a batalha acabou. */
    executar() {
      if (!b.pronto) return { ok: false, erro: 'comandos_incompletos', eventos: [], resultado: null };
      const marca = fila.length; b.executar();
      return { ok: true, eventos: fila.slice(marca), resultado: b.resultado ? ctrl.encerrar() : null };
    },
    /** Tira da fila e devolve os eventos que a apresentação ainda não consumiu (inclui os do iniciar()). */
    esvaziarFila() { return fila.splice(0, fila.length); },
    definirVelocidade(v) { if (!cfg.velocidades_batalha.includes(v)) return false; vel = v; return true; },
    get velocidade() { return vel; },
    get fim() { return !!b.resultado; },
    get pronto() { return b.pronto; },
    get rodada() { return b.rodada; },
    /** Estado para desenhar a tela, sem vazar a IA: atores, quem escolhe agora, comandos com motivo, ordem prevista, escolhas do grupo, estoque. */
    consultar() {
      const vez = b.atorDaVez(), est = b.estado();
      const escolhas = {}; for (const [uid, c] of Object.entries(est.escolhas)) if (b.ator(uid).lado === 'grupo') escolhas[uid] = { comando: c.comando, id: c.id ?? null, alvo: c.alvo ?? null };
      return {
        encontro, semente, rodada: b.rodada, fase: b.fase, velocidade: vel, pode_fugir: encontroDados.pode_fugir, treino: !!encontroDados.treino, fim: !!b.resultado,
        vez, comandos: vez ? b.comandosDe(vez) : null, ordem_prevista: b.ordemPrevista(), escolhas,
        atores: ['grupo', 'inimigos'].flatMap((l) => est.atores.filter((a) => a.lado === l).map((a) => resumoAtor(b.ator(a.uid)))),
        inventario: b.inventario(),
      };
    },
    /** Resultado no formato do mundo (só depois do fim): { resultado: 'vitoria'|'derrota'|'fuga', ... }. */
    encerrar() {
      const r = b.resultado; if (!r) return null;
      return {
        resultado: MAPA_RESULTADO[r.resultado], treino: !!r.treino, motivo: r.resultado === 'empate' ? 'empate' : null, xp: r.xp, moedas: r.moedas, itens: r.itens, niveis: r.niveis,
        semente: r.semente, rodadas: r.rodadas, tempo_animacao_s: r.tempo_animacao_s, grupo: r.grupo, inventario: r.inventario,
      };
    },
    /** Depuração: termina como fuga agora. */
    abandonar() { b.abandonar(); return ctrl.encerrar(); },
    // leitura para políticas automáticas e testes (mesmos nomes do motor)
    comandosDe: (uid) => b.comandosDe(uid), atorDaVez: () => b.atorDaVez(), ator: (uid) => b.ator(uid), vivos: (l) => b.vivos(l), log: b.log,
  };
  return ctrl;
}
