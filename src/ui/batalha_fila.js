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

/**
 * Rótulos (nome + barra) sobre a cena sem cobrir outro rótulo nem o sprite de outro ator. Tudo em px da camada.
 * corpos: [{ uid, x, y0, y1, w, lado }] = retângulo do sprite (x centro, y0 cabeça, y1 pés; lado −1 inimigos à esquerda, +1 grupo).
 * rotulos: [{ uid, w, h }] só dos que aparecem agora. Tenta, nesta ordem: acima da cabeça (deixando `reserva` para a seta ▼),
 * ao lado de fora, abaixo dos pés; se nada couber, sobe acima do obstáculo. Devolve { uid: { x, y } } (canto superior esquerdo).
 */
export function posicionarRotulos(corpos, rotulos, area, { reserva = 16, folga = 4 } = {}) {
  const colide = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  const caixaCorpo = (c) => ({ x: c.x - c.w / 2, y: c.y0, w: c.w, h: c.y1 - c.y0 });
  const prender = (r) => ({ ...r, x: Math.min(Math.max(r.x, 0), Math.max(0, area.w - r.w)), y: Math.min(Math.max(r.y, 0), Math.max(0, area.h - r.h)) });
  const porUid = new Map(corpos.map((c) => [c.uid, c])), postos = [], saida = {};
  // de baixo para cima na tela (quem está mais perto da câmera escolhe primeiro)
  for (const r of [...rotulos].sort((a, b) => porUid.get(b.uid).y1 - porUid.get(a.uid).y1)) {
    const c = porUid.get(r.uid), lado = c.lado ?? 1;
    const obst = [...postos, ...corpos.filter((o) => o.uid !== r.uid).map(caixaCorpo)];
    const livre = (k) => !obst.some((o) => colide(k, o));
    const candidatos = [
      { x: c.x - r.w / 2, y: c.y0 - reserva - r.h },
      { x: lado < 0 ? c.x - c.w / 2 - folga - r.w : c.x + c.w / 2 + folga, y: c.y0 },
      { x: c.x - r.w / 2, y: c.y1 + folga },
    ].map((k) => prender({ ...k, w: r.w, h: r.h }));
    let k = candidatos.find(livre);
    if (!k) { k = candidatos[0]; for (let g = 0; g < 20; g++) { const o = obst.find((x) => colide(k, x)); if (!o) break; k = prender({ ...k, y: o.y - k.h - folga }); if (k.y === 0) break; } }
    postos.push(k); saida[r.uid] = { x: k.x, y: k.y };
  }
  return saida;
}

/** Foco inicial: inimigo de menor slot; aliado com menor fração de vida (cura). */
export function alvoInicial(alvos, alvoTipo) {
  if (!alvos.length) return null;
  if (alvoTipo.startsWith('aliado')) return alvos.slice().sort((a, b) => a.vida / a.vida_max - b.vida / b.vida_max || a.slot - b.slot)[0].uid;
  return alvos[0].uid;
}
