// Menu principal (D-050), lado da plataforma: abrir/fechar com exclusão mútua. O estado do menu aberto vive na simulação (`mundo.menu`,
// 13); aqui ficam a pausa do relógio (`pausa.pausar('menu')`, que também suspende o áudio) e a regra de quando pode abrir:
// só explorando, sem batalha, sem diálogo/loja, sem troca de mapa pendente e sem outra pausa (início, inventário da loja, pausa manual).
export function criarMenu({ mundo, pausa, eventos }) {
  const outraPausa = () => pausa.motivos().some((m) => m !== 'menu');
  const menu = {
    get aberto() { return mundo.menu.aberto; },
    pode: () => !outraPausa() && mundo.menu.podeAbrir(),
    abrir() { if (menu.aberto || !menu.pode() || !mundo.menu.abrir()) return false; pausa.pausar('menu'); return true; },
    fechar() { if (!menu.aberto) return false; mundo.menu.fechar(); pausa.retomar('menu'); return true; },
    alternar() { return menu.aberto ? menu.fechar() : menu.abrir(); },
  };
  // se algo tirar o jogo do mapa com o menu aberto (batalha forçada pelo debug, game over), o menu fecha sozinho e a pausa solta
  eventos.em('modo_mudou', ({ para }) => { if (para !== 'mapa') menu.fechar(); });
  return menu;
}
