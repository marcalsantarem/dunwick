// Entrada por AÇÕES LÓGICAS (gameplay.md §3). O código do jogo só conhece ações; teclas/botões vêm de data/config/cfg_entrada.json.
// Teclado e mouse chegam por eventos (fila: um aperto entre dois passos não se perde); o gamepad é amostrado por quadro desenhado
// (a plataforma não entrega eventos de botão). amostrar() é chamado uma vez no início de CADA passo lógico.
import { BufferEntrada } from './buffer.js';

export function criarEntradaLogica(cfgEntrada, cfgJogo) {
  const zonaMorta = cfgJogo.entrada.zona_morta_analogico, buffer = new BufferEntrada(cfgJogo.entrada.buffer_entrada_quadros);
  const acoes = cfgEntrada.acoes, eixos = cfgEntrada.eixos, debug = cfgEntrada.debug;
  const porTecla = new Map(), porBotao = new Map(), porTeclaDebug = new Map(), porTeclaEixo = new Map(); // tecla → [...]
  const add = (m, k, v) => { (m.get(k) ?? m.set(k, []).get(k)).push(v); };
  for (const [nome, a] of Object.entries(acoes)) { for (const t of a.teclado) add(porTecla, t, nome); for (const b of a.gamepad) add(porBotao, Number(b.split(':')[1]), nome); }
  for (const [nome, d] of Object.entries(debug)) for (const t of d.teclado) add(porTeclaDebug, t, nome);
  for (const [nome, e] of Object.entries(eixos)) for (const [dir, teclas] of Object.entries(e.teclado)) for (const t of teclas) add(porTeclaEixo, t, { eixo: nome, dir });

  const abaixoTeclado = new Set(), contagem = new Map(), segurando = new Set(), apertadasPendentes = [], debugPendentes = [];
  const dirs = { cima: false, baixo: false, esquerda: false, direita: false }, dirsContagem = new Map();
  let padAnterior = [], padEixo = { x: 0, z: 0 }, padConectado = false;
  const snap = { mover: { x: 0, z: 0 }, segurando, apertou: [], gamepad: false, tick: 0 };

  const incAcao = (nome) => { const c = (contagem.get(nome) ?? 0) + 1; contagem.set(nome, c); if (c === 1) { segurando.add(nome); apertadasPendentes.push(nome); } };
  const decAcao = (nome) => { const c = (contagem.get(nome) ?? 0) - 1; if (c <= 0) { contagem.delete(nome); segurando.delete(nome); } else contagem.set(nome, c); };

  return {
    buffer,
    /** Evento de tecla (code do KeyboardEvent) ou botão do mouse ('mouse:0'). Devolve true se a tecla é do jogo (para preventDefault). */
    teclaAbaixo(codigo) {
      if (abaixoTeclado.has(codigo)) return porTecla.has(codigo) || porTeclaEixo.has(codigo) || porTeclaDebug.has(codigo);
      abaixoTeclado.add(codigo);
      for (const n of porTecla.get(codigo) ?? []) incAcao(n);
      for (const { dir } of porTeclaEixo.get(codigo) ?? []) { const c = (dirsContagem.get(dir) ?? 0) + 1; dirsContagem.set(dir, c); dirs[dir] = true; }
      for (const n of porTeclaDebug.get(codigo) ?? []) debugPendentes.push(n);
      return porTecla.has(codigo) || porTeclaEixo.has(codigo) || porTeclaDebug.has(codigo);
    },
    teclaAcima(codigo) {
      if (!abaixoTeclado.delete(codigo)) return;
      for (const n of porTecla.get(codigo) ?? []) decAcao(n);
      for (const { dir } of porTeclaEixo.get(codigo) ?? []) { const c = (dirsContagem.get(dir) ?? 1) - 1; dirsContagem.set(dir, Math.max(0, c)); if (c <= 0) dirs[dir] = false; }
    },
    /** Perdeu o foco/aba oculta: solta tudo (evita herói andando sozinho ao voltar). */
    soltarTudo() {
      for (const c of [...abaixoTeclado]) this.teclaAcima(c);
      this.atualizarGamepad(null);
      apertadasPendentes.length = 0; debugPendentes.length = 0;
    },
    /**
     * Amostra do gamepad (uma por quadro desenhado): { botoes: boolean[], eixos: number[] } ou null se desconectado.
     * Desconectar solta TODAS as ações do gamepad no mesmo instante (o herói para) — M1-09.
     */
    atualizarGamepad(pad) {
      if (!pad) {
        if (padConectado) for (let i = 0; i < padAnterior.length; i++) if (padAnterior[i]) for (const n of porBotao.get(i) ?? []) decAcao(n);
        padAnterior = []; padEixo = { x: 0, z: 0 }; padConectado = false; return;
      }
      padConectado = true;
      const n = Math.max(pad.botoes.length, padAnterior.length);
      for (let i = 0; i < n; i++) {
        const agora = !!pad.botoes[i], antes = !!padAnterior[i];
        if (agora === antes) continue;
        for (const nome of porBotao.get(i) ?? []) agora ? incAcao(nome) : decAcao(nome);
      }
      padAnterior = pad.botoes.slice();
      const m = eixos.mover.gamepad;
      let ax = pad.eixos[m.eixo_x] ?? 0, az = pad.eixos[m.eixo_z] ?? 0;
      const mag = Math.hypot(ax, az);
      if (mag < zonaMorta) { ax = 0; az = 0; } else { const k = (mag - zonaMorta) / (1 - zonaMorta) / mag; ax *= k; az *= k; } // reescala fora da zona morta
      padEixo = { x: ax, z: az };
    },
    get gamepadConectado() { return padConectado; },
    /** Ações de debug apertadas desde a última chamada (lidas por QUADRO, não por passo: F6 pausa a simulação). */
    drenarDebug() { const r = debugPendentes.slice(); debugPendentes.length = 0; return r; },
    /** Início de cada passo lógico: devolve o instantâneo (objeto reutilizado) e alimenta o buffer. */
    amostrar(tick) {
      snap.tick = tick;
      let x = (dirs.direita ? 1 : 0) - (dirs.esquerda ? 1 : 0), z = (dirs.baixo ? 1 : 0) - (dirs.cima ? 1 : 0);
      if (x === 0 && z === 0) { x = padEixo.x; z = padEixo.z; }
      snap.mover.x = x; snap.mover.z = z;
      snap.apertou.length = 0;
      for (const nome of apertadasPendentes) { snap.apertou.push(nome); if (acoes[nome].buffer) buffer.empurrar(nome, tick); }
      apertadasPendentes.length = 0;
      buffer.expirar(tick);
      snap.gamepad = padConectado;
      return snap;
    },
    segurando,
  };
}
