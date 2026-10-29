// Apresentação mapa ↔ batalha: decide o que desenhar (`visao`), faz a transição por névoa (cobre → troca → revela, sem flash), cria o toque
// da batalha (toque_batalha.js), liga a cena de batalha e fecha a batalha (`jogo.encerrarBatalha()`) no fim.
// Enquanto ninguém assume os comandos (a UI do 15 chama `assumirComandos()`), a batalha roda sozinha com a política automática do grupo
// e se fecha sozinha ao terminar; com a UI no comando, quem fecha (`encerrarBatalha`) é ela e a apresentação só acompanha o modo.
// Ponto de montagem da UI: `container` (#ui) acompanha o retângulo do jogo na tela; veja `layoutUi`.
import { criarToque } from '../motor/toque_batalha.js';
import { decidirSimples } from '../jogo/batalha/politica.js';

export function criarApresentacao({ mundo, dados, cenaBatalha, ren, container, opcoes = {} }) {
  const jogo = mundo.jogo, cfgB = dados.config.batalha, T = cfgB.tempos.t_entrada_batalha;
  // `opcoes.reduzirMovimento` pode ser função (preferência viva): vale a cada batalha/transição
  const reduzir = () => !!(typeof opcoes.reduzirMovimento === 'function' ? opcoes.reduzirMovimento() : opcoes.reduzirMovimento);
  let tCobre = 0.35 * T, tRevela = 0.65 * T; const tempos = () => { tCobre = reduzir() ? 0.15 : 0.35 * T; tRevela = reduzir() ? 0.15 : 0.65 * T; };
  const apr = {
    visao: 'mapa', trans: null, toque: null, ctrl: null, cobertura: 0, automatico: true, aoGameOver: null, ultimoResultado: null,
    /** A UI (15) chama isto ao assumir a escolha de comandos: a política automática se desliga. */
    assumirComandos() { apr.automatico = false; },
  };
  let esperaGameOver = 0, avisouGameOver = false;

  function trocarParaBatalha() {
    apr.ctrl = jogo.batalha; ren.definirArte(...cenaBatalha.arte);
    apr.toque = criarToque(apr.ctrl, { cfg: cfgB, acoes: dados.combate.acoes, infoPose: cenaBatalha.infoPoseDe(apr.ctrl), reduzirMovimento: reduzir(), reduzirFlashes: !!opcoes.reduzirFlashes, externo: !apr.automatico });
    cenaBatalha.ligar(apr.toque); apr.visao = 'batalha';
  }
  function trocarParaMapa() {
    cenaBatalha.desligar(); ren.definirArte(...ren.arteBase); apr.visao = 'mapa'; apr.toque = null; apr.ctrl = null;
  }

  /** Avança transições e a batalha. `dt` em segundos de apresentação (já descontada a pausa do debug). */
  apr.atualizar = (dt) => {
    const t = apr.trans;
    if (t) {
      t.t += dt;
      if (t.fase === 'cobre') {
        apr.cobertura = Math.min(1, t.t / tCobre);
        if (t.t >= tCobre) {
          apr.cobertura = 1; t.fase = 'revela'; t.t = 0;
          if (t.tipo === 'entrar') trocarParaBatalha();
          else { if (jogo.modo === 'batalha') apr.ultimoResultado = jogo.encerrarBatalha(); trocarParaMapa(); esperaGameOver = 1.5; avisouGameOver = false; }
        }
      } else {
        apr.cobertura = Math.max(0, 1 - t.t / tRevela);
        if (apr.toque && t.tipo === 'entrar') apr.toque.avancar(dt); // os atores já deslizam enquanto a névoa abre
        if (t.t >= tRevela) { apr.cobertura = 0; apr.trans = null; }
      }
      return;
    }
    if (apr.visao === 'mapa') {
      if (jogo.modo === 'batalha') { tempos(); apr.trans = { tipo: 'entrar', fase: 'cobre', t: 0 }; }
      else if (jogo.modo === 'game_over') { // com UI (15): ela mostra "Tentar de novo"; sem UI, tenta de novo sozinho depois de 1,5 s
        if (apr.aoGameOver) { if (!avisouGameOver) { avisouGameOver = true; apr.aoGameOver(jogo); } } else if (apr.automatico) { esperaGameOver -= dt; if (esperaGameOver <= 0) jogo.tentarDeNovo(); }
      }
      return;
    }
    // visão da batalha
    if (jogo.modo !== 'batalha') { apr.trans = { tipo: 'sair', fase: 'cobre', t: 0 }; return; } // alguém fechou a batalha por fora
    const { toque, ctrl } = apr; toque.avancar(dt);
    if (toque.terminou && apr.automatico) { apr.trans = { tipo: 'sair', fase: 'cobre', t: 0 }; return; }
    if (apr.automatico && toque.ocioso && !ctrl.fim) { // política automática do grupo (modo_automatico)
      const vez = ctrl.consultar().vez;
      if (vez) ctrl.enviarComando({ ator: vez, ...decidirSimples(ctrl, dados, vez) });
      if (ctrl.pronto) ctrl.executar();
    }
  };

  /** Retângulo do jogo na tela → #ui: tamanho em px CSS e variáveis `--arte-w/--arte-h` (px de arte) e `--k` (px CSS por px de arte). */
  let chaveUi = '';
  apr.layoutUi = (canvas) => {
    if (!container) return;
    const e = ren.estado, r = canvas.getBoundingClientRect(), fx = r.width / canvas.width, fy = r.height / canvas.height, [aw, ah] = ren.arte;
    const chave = [r.left, r.top, e.vx, e.vy, e.vw, e.vh, e.altura, aw, ah, apr.visao].join('|'); if (chave === chaveUi) return; chaveUi = chave;
    const s = container.style; s.left = `${r.left + e.vx * fx}px`; s.top = `${r.top + (e.altura - e.vy - e.vh) * fy}px`; s.width = `${e.vw * fx}px`; s.height = `${e.vh * fy}px`;
    s.setProperty('--arte-w', String(aw)); s.setProperty('--arte-h', String(ah)); s.setProperty('--k', String((e.vw * fx) / aw)); container.dataset.visao = apr.visao;
  };
  /** Posição de tela (px de arte e px CSS) dos 6 slots; vazio fora da batalha. */
  apr.slots = () => (apr.visao === 'batalha' ? cenaBatalha.slots(Number(container?.style.getPropertyValue('--k')) || 1) : []);
  return apr;
}
