// Reprodutor da fila de eventos da batalha (puro: sem DOM nem three). A UI consome controlador.esvaziarFila() aqui e
// cada evento é "aplicado" no seu instante: ato_executado espera impacto_s antes dos resultados (dano, curou, vida…)
// e o resto do ato (duracao_real_s − impacto_s + intervalo_s) antes do próximo evento-limite. Enquanto `ocupado`, a UI
// não abre menu nem chama executar() (docs/combate_turnos.md "Integração", roteiro da apresentação).

// eventos que começam um novo trecho: esperam o resto do ato anterior terminar
const LIMITES = new Set(['rodada_iniciou', 'comando_pedido', 'execucao_iniciou', 'turno_iniciou', 'ato_executado', 'ato_cancelado', 'ato_falhou',
  'rodada_terminou', 'venceu', 'perdeu', 'fugiu', 'empate', 'batalha_terminou']);

/** aplicar(ev) → segundos extras de espera depois do evento (ou nada). `esperaExterna()` → true segura o próximo passo (a cena ainda anima). */
export function criarReprodutor({ aplicar, esperaExterna = () => false }) {
  const fila = [];
  let espera = 0, resto = 0;
  return {
    adicionar(eventos) { for (const ev of eventos) fila.push(ev); },
    get ocupado() { return fila.length > 0 || espera > 0 || resto > 0 || esperaExterna(); },
    get pendentes() { return fila.length; },
    /** Avança `dt` segundos (já multiplicados pelo acelerar). Pode aplicar vários eventos num quadro. */
    avancar(dt) {
      espera -= dt;
      while (espera <= 0 && !esperaExterna()) {
        if (resto > 0 && (fila.length === 0 || LIMITES.has(fila[0].nome))) { espera += resto; resto = 0; continue; }
        const ev = fila.shift();
        if (!ev) { espera = 0; break; }
        const extra = aplicar(ev) ?? 0;
        if (ev.nome === 'ato_executado') { espera += ev.impacto_s ?? 0; resto = Math.max(0, (ev.duracao_real_s ?? 0) - (ev.impacto_s ?? 0)) + (ev.intervalo_s ?? 0); }
        espera += extra;
      }
    },
    /** Testes e modo instantâneo: aplica tudo sem esperar. */
    esvaziar() { while (fila.length) aplicar(fila.shift()); espera = 0; resto = 0; },
  };
}

/** Alvos válidos para um alvo_tipo, na ordem de navegação (slot). `atores` = estado exibido pela UI. */
export function alvosValidos(atores, alvoTipo, uidAtor) {
  const vivos = (lado) => atores.filter((a) => a.lado === lado && !a.caido).sort((a, b) => a.slot - b.slot);
  if (alvoTipo.startsWith('inimigo')) return vivos('inimigos');
  if (alvoTipo.startsWith('aliado')) return vivos('grupo');
  return atores.filter((a) => a.uid === uidAtor);
}

/** Foco inicial: inimigo de menor slot; aliado com menor fração de vida (cura). */
export function alvoInicial(alvos, alvoTipo) {
  if (!alvos.length) return null;
  if (alvoTipo.startsWith('aliado')) return alvos.slice().sort((a, b) => a.vida / a.vida_max - b.vida / b.vida_max || a.slot - b.slot)[0].uid;
  return alvos[0].uid;
}
