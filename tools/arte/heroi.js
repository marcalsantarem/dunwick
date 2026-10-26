// Herói Edric: poses por animação e montagem do atlas (5 direções × quadros). Tudo em dados no meta (quadros, fps, eventos); o jogo
// não conhece nada daqui além do .meta.json. Cada animação do protótipo-alvo do usuário (idle, andar, correr, 3 ataques, rolamento,
// dano) existe como quadros próprios, desenhados por código (nada copiado).
import { DIRS5, poseBase, desenharHumanoide, PALETA_EDRIC } from './humanoide.js';
import { tela } from './util.js';

const DEG = Math.PI / 180;
export const ANIMS_HEROI = {
  idle: { quadros: 4, fps: 6, loop: true },
  andar: { quadros: 8, fps: 10, loop: true, eventos: [{ quadro: 1, tipo: 'passo' }, { quadro: 5, tipo: 'passo' }] },
  correr: { quadros: 8, fps: 14, loop: true, eventos: [{ quadro: 1, tipo: 'passo' }, { quadro: 5, tipo: 'passo' }] },
  ataque1: { quadros: 6, fps: 16, loop: false, eventos: [{ quadro: 2, tipo: 'hit_inicio' }, { quadro: 4, tipo: 'hit_fim' }] },
  ataque2: { quadros: 6, fps: 16, loop: false, eventos: [{ quadro: 2, tipo: 'hit_inicio' }, { quadro: 4, tipo: 'hit_fim' }] },
  ataque3: { quadros: 6, fps: 16, loop: false, eventos: [{ quadro: 3, tipo: 'hit_inicio' }, { quadro: 4, tipo: 'hit_fim' }] },
  rolar: { quadros: 6, fps: 15, loop: false },
  dano: { quadros: 2, fps: 8, loop: false },
};

function pose(anim, f) {
  const p = poseBase(), n = ANIMS_HEROI[anim].quadros, ph = (f / n) * Math.PI * 2;
  switch (anim) {
    case 'idle': p.bob = Math.sin(ph) * 0.9; p.capa = Math.sin(ph + 1) * 0.8; p.bracoD = 0.12 + Math.sin(ph) * 0.03; p.espada = { modo: 'repouso', a: 0 }; break;
    case 'andar': case 'correr': {
      const corre = anim === 'correr', A = corre ? 1.05 : 0.7;
      p.coxaD = Math.sin(ph) * A; p.coxaE = -Math.sin(ph) * A;
      p.joelhoD = Math.max(0, Math.sin(ph + 1.5)) * (corre ? 1.3 : 0.85); p.joelhoE = Math.max(0, Math.sin(ph + 1.5 + Math.PI)) * (corre ? 1.3 : 0.85);
      p.levantaD = Math.max(0, Math.cos(ph)) * (corre ? 1 : 0.6); p.levantaE = Math.max(0, -Math.cos(ph)) * (corre ? 1 : 0.6);
      p.bracoE = Math.sin(ph) * (corre ? 0.9 : 0.5); p.bracoD = -Math.sin(ph) * (corre ? 0.5 : 0.3) + 0.15; p.cotoveloE = corre ? 1.1 : 0.5;
      p.bob = Math.abs(Math.cos(ph)) * (corre ? 2.6 : 1.6) - (corre ? 1.2 : 0.6); p.inclina = corre ? 4 : 0.8; p.capa = corre ? 6 : 2.5 + Math.sin(ph * 2);
      p.espada = { modo: 'repouso', a: 0 }; break;
    }
    case 'ataque1': case 'ataque2': {
      const H = anim === 'ataque1' ? [100, 118, 45, -45, -100, -78] : [-100, -118, -45, 45, 100, 78];
      p.espada = { modo: 'h', a: H[f] }; p.giro = [-0.25, -0.45, 0.05, 0.45, 0.6, 0.3][f] * (anim === 'ataque1' ? 1 : -1);
      p.inclina = [0, -1.5, 2, 4, 3.5, 1.5][f]; p.coxaD = [0, 0, 0.5, 0.7, 0.7, 0.4][f]; p.coxaE = -p.coxaD * 0.7; p.bracoD = [-0.4, -0.8, 1.0, 1.35, 1.2, 0.8][f]; p.bracoE = [-0.3, -0.4, 0.4, 0.5, 0.4, 0.2][f];
      p.rastro = [0, 0.3, 1, 1, 0.5, 0][f]; p.capa = [1, 2, 5, 6, 4, 2][f]; p.agacha = [0, 0.2, 0.1, 0.15, 0.1, 0][f]; break;
    }
    case 'ataque3': {
      const V = [95, 125, 40, -30, -58, -42];
      p.espada = { modo: 'v', a: V[f] }; p.inclina = [-1, -3, 1, 5, 5, 3][f]; p.agacha = [0, 0, 0.1, 0.3, 0.35, 0.2][f];
      p.coxaD = [0, 0, 0.5, 0.9, 0.9, 0.5][f]; p.coxaE = -p.coxaD * 0.6; p.bracoD = [-1.9, -2.4, -0.8, 1.2, 1.5, 1.0][f]; p.bracoE = p.bracoD * 0.5;
      p.rastro = [0, 0.2, 0.8, 1, 0.6, 0][f]; p.capa = [2, 4, 6, 8, 5, 3][f]; break;
    }
    case 'rolar': {
      p.rola = [0, 0.9, 2.2, 3.7, 5.2, 6.28][f]; p.agacha = [0.5, 1, 1, 1, 1, 0.6][f]; p.bracoD = 1.2; p.bracoE = 1.2; p.cotoveloD = p.cotoveloE = 1.6; p.coxaD = 1; p.coxaE = 0.9; p.joelhoD = p.joelhoE = 1.8; p.capa = 6;
      p.espada = { modo: 'embainhada', a: 0 }; break;
    }
    case 'dano': p.inclina = -4 - f; p.bracoD = -0.5; p.bracoE = -0.6; p.bob = -1; p.capa = 4; p.espada = { modo: 'repouso', a: 0 }; break;
  }
  void DEG; return p;
}

export function gerarAtlasHeroi({ escala = 1.5, celula = 192, ancora = [96, 168], colunas = 12 } = {}) {
  const quadros = []; for (const [nome, a] of Object.entries(ANIMS_HEROI)) for (let d = 0; d < DIRS5.length; d++) for (let f = 0; f < a.quadros; f++) quadros.push({ nome, d, f });
  const linhas = Math.ceil(quadros.length / colunas), cv = tela(colunas * celula, linhas * celula), c = cv.getContext('2d');
  const inicio = {}; let i = 0;
  for (const { nome, d, f } of quadros) {
    const k = i++; if (f === 0 && d === 0) inicio[nome] = k;
    const col = k % colunas, lin = Math.floor(k / colunas);
    c.save(); c.beginPath(); c.rect(col * celula, lin * celula, celula, celula); c.clip();
    c.translate(col * celula + ancora[0], lin * celula + ancora[1]); c.scale(escala, escala);
    desenharHumanoide(c, DIRS5[d], pose(nome, f), PALETA_EDRIC); c.restore();
  }
  const meta = {
    id: 'hero_edric', tipo: 'sprite_humanoide', celula: [celula, celula], ancora, arte_escala: escala, ref_celula: celula / escala,
    direcoes: ['s', 'se', 'l', 'ne', 'n'], espelhar: { sw: 'se', o: 'l', nw: 'ne' }, colunas,
    anims: Object.fromEntries(Object.entries(ANIMS_HEROI).map(([n, a]) => [n, { ...a, inicio: inicio[n] }])),
  };
  return { canvas: cv, meta };
}
