// Cabeça do Edric desenhada À MÃO como moldes de pixels (26×26 por vista): um caractere por cor; espaços só separam grupos de 5 colunas.
// Proporção (jovem, 18 anos): oval um pouco mais alto que largo, mandíbula mais estreita que a testa, olhos de 4×3 px na linha do meio,
// afastados por 1 olho, sobrancelhas de 1 px, nariz = ponto de luz + sombra de 2 px, boca de 5–6 px em meio sorriso, orelha pequena.
// Luz do alto-esquerda; contorno do rosto em marrom quente (O), do cabelo em marrom escuro (o).
//   .  transparente        o  contorno do cabelo / cílio / pupila     O  contorno do rosto e boca (marrom quente)
//   a b c  cabelo: sombra, base, luz                                  1 2 3  pele: sombra, base, luz       w  brilho do olho
export const LEGENDA = { o: ['couro', 0], O: ['pele', 0], a: ['couro', 1], b: ['couro', 2], c: ['couro', 3], 1: ['pele', 1], 2: ['pele', 2], 3: ['pele', 3], w: ['linho', 3] };

const S = `
..... ....o ooooo oo... ..... .
..... ..obc cbbbb baao. ..... .
..... obbcc cbbbb bbbaa o.... .
....o bbbcc cbbbb bbbba ao... .
...ob bbcbb cbbbb bbbbb aao.. .
..obb bbbbc bbbbb bbbbb baao. .
..obb bbcbb bbbbb bbbbb baao. .
..obb bbbbb abbbb bbbab baao. .
..obb bbabb bbbbc bbbbb baao. .
..obb bbbbb bbabb bbbbb baao. .
..obb 1aa11 1bbbb bb1aa 1aao. .
..obb 332aa a2222 aaa22 2aao. .
..obb 33222 22222 22222 2aao. .
.OO22 22ooo o2222 oooo2 221OO .
O2122 22awa a2222 awaa2 22111 O
O1122 222aa 22222 2aa22 22111 O
.OO22 22211 22222 21122 221OO .
..O23 33222 22322 22222 221O. .
...O2 32222 22112 22222 21O.. .
...O2 22222 22222 22222 21O.. .
....O 22222 22222 O2222 1O... .
..... O2222 OOOOO 22221 O.... .
..... .O222 23322 2221O ..... .
..... ..O22 22222 221O. ..... .
..... ...O2 22222 21O.. ..... .
..... ....O OOOOO OO... ..... .`;

const SE = `
..... ...oo ooooo oo... ..... .
..... .ocbb cbbbb baao. ..... .
....o bcbbb bbbbb bbbaa o.... .
...ob cbbbb bbbbb bbbba ao... .
..obb cbbbb bbbbb bbbbb bao.. .
.obbb ccbbb bbbbb bbbbb bbao. .
.obbb bbcbb bbbbb bbbbb bbao. .
.obbb bbbbb abbbb bbbbb bbao. .
.obbb bbabb bbbbb bbbbb bbao. .
.obbb bbbbb bbbbb bbabb bbao. .
.obbb bbbbb bbbbb bb111 111O. .
.obbb bbbbb b2aaa aa22a aa2O. .
.obbb bbbbb bb222 22222 222O. .
.obbb bO2O2 22ooo o222o oo2O. .
.obbb bO112 22awa a222a aa2O. .
.obbb bO112 222aa 22322 a22O. .
.obbb bOOO2 22211 22222 2223O .
.obbb b3222 22222 22222 221O. .
.obbb b3222 22222 22222 21O.. .
..oab bb322 22222 22O22 2O... .
...oa abb32 22OOO OO221 O.... .
...oo aabb2 22332 2221O ..... .
..... oabb2 22222 21O.. ..... .
..... .oab2 22222 1O... ..... .
..... ..oo2 2222O ..... ..... .
..... ...oo OOOOO OO... ..... .`;

const E = `
..... ...oo ooooo o.... ..... .
..... .ocbb cbbbb bao.. ..... .
....o ccbbb cbbbb bbbao ..... .
...ob bbbcc cbbbb bbbba o.... .
..obb bbccb bbbbb bbbbb bo... .
..obb bbbbc bbbbb bbbbb bbo.. .
..obb bbcbb bbbbb bbbbb bbo.. .
..obb bbbbb abbbb bbbbb bbo.. .
..obb bbabb bbbbb bbbbb bbo.. .
..obb bbbbb bbbbb bbbbb bbbo. .
..obb bbbbb bbbbb bbbbb b12O. .
..obb bbbbb bbbbb bb3aa aaaO. .
..obb bbbbb bbbbb bb322 222O. .
..obb bbbbb O22O2 22ooo o22O. .
..obb bbbbb O11O2 22awa a22O. .
..obb bbbbb O11O2 222aa 222O. .
..obb bbbbb OOO22 22222 2232O .
..obb bbbbb bb222 22222 221O. .
...ob bbbbb bb222 22222 22O.. .
...ob bbbbb bb222 22222 22O.. .
....o bbbbb bb222 22222 222O. .
..... obbbb bb222 22222 2OO.. .
..... .obbb bb222 22222 2O... .
..... ..obb bb222 2222O ..... .
..... ...oo oo222 22O.. ..... .
..... ..... ..ooo OOOOO ..... .`;

const N = `
..... ....o ooooo oo... ..... .
..... ..obc cbbbb baao. ..... .
..... obbcc cbbbb bbbaa o.... .
....o bbbcc cbbbb bbbba ao... .
...ob bbcbb cbbbb bbbbb aao.. .
..obb bbbbc bbbbb bbbbb baao. .
..obb bbcbb bbbbb bbbbb baao. .
..obb bbbbb abbbb bbbab baao. .
..obb bbabb bbbbc bbbbb baao. .
..obb bbbbb bbabb bbbbb baao. .
..obb bbbbb bbbbb bbbbb baao. .
..obb bbabb bbbbb bbbbb baao. .
..obb bbbbb bbbbb bbbbb baao. .
O1obb bbbbb bbabb bbbbb baao1 O
O1obb bbabb bbbbb bbbbb baao1 O
.Oobb bbbbb bbbbb bbbbb baaoO .
...ob bbbbb bbabb bbbbb bao.. .
...ob bbabb bbbbb bbbbb bao.. .
...ob bbbbb bbbbb bbabb bao.. .
....o bbbbb babbb bbbbb ao... .
..... obbbb bbbbb bbbba o.... .
..... .oabb bbbbb bbabo ..... .
..... ..obb bbbbb bbbo. ..... .
..... ...oo ooooo oo... ..... .
..... ..... ..... ..... ..... .
..... ..... ..... ..... ..... .`;

const NE = N.replace('O1obb bbbbb bbabb bbbbb baao1 O', '..obb bbbbb bbabb bbbbb baao1 O').replace('O1obb bbabb bbbbb bbbbb baao1 O', '..obb bbabb bbbbb bbbbb baao1 O').replace('.Oobb bbbbb bbbbb bbbbb baaoO .', '..obb bbbbb bbbbb bbbbb baaoO .');

function ler(txt, nome) {
  const linhas = txt.trim().split('\n').map((l) => l.replace(/ /g, ''));
  if (linhas.length !== 26) throw new Error(`molde ${nome}: ${linhas.length} linhas (esperado 26)`);
  linhas.forEach((l, i) => { if (l.length !== 26) throw new Error(`molde ${nome}, linha ${i}: ${l.length} colunas (esperado 26): ${l}`); for (const ch of l) if (ch !== '.' && !LEGENDA[ch]) throw new Error(`molde ${nome}, linha ${i}: caractere "${ch}" fora da legenda`); });
  return linhas;
}
/** Mechas: só nos pixels de cabelo de base (b), riscos de sombra (a) e luz (c) em diagonal (frente: franja varrida) ou quase verticais (costas). A forma da cabeça é toda manual. */
function mechas(linhas, costas) {
  return linhas.map((lin, y) => [...lin].map((ch, x) => {
    if (ch !== 'b' || y < 3) return ch;
    const k = costas ? (x + Math.floor(y / 5)) % 6 : (x - Math.floor(y / 2) + 40) % 6; // riscos contínuos (várias linhas seguidas), não pontilhado
    if (k === 0) return 'a';
    if (k === 3 && x < 15 && y < 10) return 'c';
    return ch;
  }).join(''));
}
export const MOLDES = { s: mechas(ler(S, 's'), false), se: mechas(ler(SE, 'se'), false), l: mechas(ler(E, 'l'), false), ne: mechas(ler(NE, 'ne'), true), n: mechas(ler(N, 'n'), true) };
// deslocamento (colunas, linhas) do molde em relação à cabeça de referência, por vista; ajustado olhando a imagem
export const AJUSTE = { s: [0, 2], se: [1, 2], l: [2, 2], ne: [0, 2], n: [0, 2] };
