// Laço de passo fixo: converte tempo real em número de passos lógicos por quadro desenhado (ADR-001 §10.2, gameplay.md §0).
// Puro (sem relógio nem DOM): a plataforma chama avancar(dt) uma vez por quadro e executa `passos` simulações.
export class Acumulador {
  /** @param {number} passoHz  passos lógicos por segundo (60) @param {number} maxPassos  limite por quadro desenhado (5) */
  constructor(passoHz, maxPassos) {
    this.passo = 1 / passoHz;
    this.maxPassos = maxPassos;
    this.acum = 0;
    this.alfa = 0; // fração do próximo passo já decorrida (0..1), para interpolar o desenho
    this.passosDescartados = 0; // tempo que estourou o limite e foi jogado fora (sem espiral de atraso)
  }

  /**
   * @param {number} dt     segundos reais desde o quadro anterior
   * @param {number} fator  escala de tempo (câmera lenta do debug); 1 = tempo real
   * @returns {number} passos lógicos a simular agora (0..maxPassos)
   */
  avancar(dt, fator = 1) {
    this.acum += Math.max(0, dt) * fator;
    const teto = this.passo * this.maxPassos;
    if (this.acum > teto) { this.passosDescartados += Math.floor((this.acum - teto) / this.passo); this.acum = teto; }
    const passos = Math.min(this.maxPassos, Math.floor(this.acum / this.passo + 1e-9));
    this.acum -= passos * this.passo;
    this.alfa = Math.min(1, Math.max(0, this.acum / this.passo));
    return passos;
  }

  /** Aba oculta → visível, ou depois de pausar: não simula o tempo perdido. */
  resetar() { this.acum = 0; this.alfa = 0; }
}
