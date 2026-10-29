# Props da vila de Baixo Orvalho — v0.1.2 (14 → 07)

Fonte das posições: `tools/lib/layout_vila.mjs` (gera `data/maps/` com `node tools/gerar_vila.mjs`). Coordenadas em tiles, `x` = leste e `z` = sul; `x, z` = centro.
**Regra de entrada:** um prop entra sozinho nos mapas quando o tipo existe em `cfg_kit.pegadas` (o esquema aceita qualquer tipo com pegada; basta rodar o gerador de novo). Em 29/10 todos os tipos abaixo já estão no kit e nos mapas.
Tipos e pegadas seguem a proposta do 07 (mensagem de 29/10); abaixo, só o que **diverge** dela vem marcado com ⚠.

## Casas (`tipo: casa`, pegada = `w × d` do objeto)

| ID | w × d | Centro (x, z) | Porta (lado) | Interior | Parâmetros sugeridos |
|---|---|---|---|---|---|
| `casa_maren` | ⚠ 6 × 5 (07: 5×4) | 14, 10,5 | sul | `map_casa_maren_interior` | `deco: maren` |
| `taverna` | ⚠ 7 × 6 (07: 6×5) | 31,5, 10 | sul | `map_taverna_interior` | `deco: taverna` |
| `forja` | ⚠ 5 × 5 (07: 4×4) | 38,5, 14,5 | sul | `map_forja_interior` | `deco: forja` |
| `casa_torvan` | ⚠ 5 × 4 (07: 4×3) | 8,5, 17 | leste | `map_casa_torvan_interior` | `deco: torvan` |
| `posto_escrivao` | ⚠ 5 × 6 (07: 4×5) | 40,5, 24 | sul | `map_posto_escrivao_interior` | `deco: escrivao` |
| `casa_sul_1` | 4 × 4 | 14, 38 | norte | — (fechada) | `estilo: padrao`, `fechada` |
| `casa_sul_2` | 4 × 4 | 19, 42 | norte | — (fechada) | `estilo: enegrecida`, `fechada` |
| `casa_nova` | ⚠ 4 × 4 (07: 3×3) | 30, 41 | norte | — (fechada) | `estilo: nova`, `fechada` (ao lado da `pedra_enegrecida`) |
| `casa_sul_4` | 4 × 4 | 37, 37 | oeste | — (fechada) | `estilo: padrao`, `fechada` |

Os tamanhos são os do esboço aprovado pelo usuário (D-041). Se o 07 preferir as casas menores, o 14 reduz `w × d` no layout. A porta fica no meio do lado indicado. Os gatilhos ficam colados à parede e precisam de **1 tile livre** na frente.

## Peças soltas da vila

| ID no mapa | Tipo | Pegada | Centro (x, z) | Onde / para quê |
|---|---|---|---|---|
| `portico` | `portico` | vão 4 em x; 2 postes círculo r 0,3 | 24, 19,5 | borda norte da praça, onde pendia o Sino de Cobre (gancho vazio); a trilha N–S passa por baixo |
| `quadro_avisos` | `quadro_avisos` | 1,8 × 0,5 | 28,5, 21 | praça, nordeste do poço |
| `quadro_editais` | `quadro_avisos` | 1,8 × 0,5 | 37, 21,2 | editais da Coroa, ao lado do posto do escrivão |
| `forja_brasa` | `forja_brasa` | 1,6 × 1,2 | 43,5, 14,6 | a leste da forja, no lado visível pela câmera |
| `canteiro_maren` | `canteiro` | 2 × 3 | 18,5, 10,5 | ervas da Maren, a leste da casa |
| `rack_armas_patio` | `rack_armas` | 1,6 × 0,5 | 9,5, 21,3 | pátio de treino, encostado na cerca norte |
| `arvore_queimada` | `arvore_queimada` | círculo r 0,45 | 26, 36 | marca do saque, rebrotando, ao sul da praça |
| `muro_fuligem` | `muro_fuligem` | linha esp. 0,5 de (8; 42,5) a (15; 42,5) | — | marca do saque, atrás das casas do sul-oeste |
| `pedra_enegrecida` | `pedra_enegrecida` | 2 × 4 | 33, 41 | ruína enegrecida colada à `casa_nova` |

## Mobília dos interiores (cômodos `L × A` = tamanho do mapa; saída no meio da borda sul)

O 07 propôs um objeto `sala` (6×5 etc.); ⚠ o contrato do 08 usa o **mapa inteiro como cômodo** (mínimo 10×8, campo `sala` no nível do mapa). O 14 segue o 08; os móveis abaixo já estão posicionados nesse cômodo.

| Mapa (L × A) | Móveis novos: tipo (centro x, z) | Do kit atual (já no mapa) |
|---|---|---|
| `map_casa_maren_interior` (10 × 8) | `estante` (1,6; 0,6), `estante` (3,2; 0,6), `canteiro` 1,6×0,6 (6,5; 0,6) = ervas, `mesa` (5; 3), `cadeira` (5; 3,9), `cama` (8,8; 1,6) | caixote, lanterna |
| `map_taverna_interior` (14 × 10) | `balcao` 4×0,7 (5; 2), `lareira` (11,5; 0,6), `mesa` (3,5; 6), `cadeira` (3,5; 6,9), `mesa` (10; 6), `cadeira` (10; 6,9), `mesa` (11,8; 3,6), `banco` (11,8; 4,5) | 3 barris, caixote, lanterna |
| `map_forja_interior` (10 × 8) | `fornalha` (2; 1), `bigorna` (4,5; 3,2), `bancada` (7,5; 0,6), `rack_armas` (9; 3) | barril, 2 caixotes |
| `map_casa_torvan_interior` (10 × 8) | `cama` (1; 1,6), `rack_armas` (5; 0,5), `mesa` (7,5; 3,5), `cadeira` (7,5; 4,4) | caixote, lanterna |
| `map_posto_escrivao_interior` (10 × 8) | `balcao` 4×0,7 (5; 3), `arquivo` (1,5; 0,6), `arquivo` (8,5; 0,6), `quadro_avisos` (5; 0,4) = editais na parede | 2 caixotes, lanterna |

Pegadas dos móveis (proposta do 07, aceita): mesa 1,6×0,9 · cadeira r 0,28 · banco 1,4×0,4 · cama 1×2 · estante 1,4×0,45 · balcão w×0,7 · lareira 1,6×0,8 · bancada 1,8×0,7 · fornalha 1,4×1 · bigorna r 0,45 · arquivo 1,2×0,6.

## Espaço reservado (não ocupar com props)

- **NPCs (v0.1.4):** 1,5 tile livre na frente de cada porta; praça entre o poço e o quadro de avisos; balcões da taverna e do posto (lado de dentro, z < 2); meio do pátio de treino.
- **Saídas:** faixa x 20–28 nas bordas norte (z 0–4) e sul (z 44–48), sem árvores.
- **Minimapa (15):** lê `edificios` (x, z, w, d, porta) e `portais`/`pois`; nenhum prop novo precisa aparecer nele.
