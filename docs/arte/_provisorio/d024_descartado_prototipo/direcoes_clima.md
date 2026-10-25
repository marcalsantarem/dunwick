# Direções de clima visual

> **Status:** v1.0 (D-024) · Autor: 10 Diretor de Arte · 2026-10-24.
> **Decidido pelo usuário (D-008): A · Lanterna e Musgo como base**, com a masmorra podendo puxar para **B · Cinza e Brasa** e a região aberta de dia para **C · Iluminura**. A proposta original (3 direções em pixel art 3D) está em `_provisorio/direcoes_clima_v0.1.md`.
> Este documento diz **como a direção A se combina com o visual do protótipo e com o ciclo dia/noite**. Valores numéricos: [paleta.json](paleta.json) → `luz_por_hora`; regras: [guia_visual.md](guia_visual.md) §5.

## Como as direções se encaixam no protótipo

O protótipo é **quente e saturado de dia** (direção C na prática) e escurece à noite com um *multiply* azulado (direção B). A direção escolhida é a **A**, que fica **entre os dois**: a hora do fim de tarde, mais dourada e com mais sombra. Por isso não trocamos de estilo, **trocamos de hora**.

| Direção | Papel no jogo | Hora do ciclo | Onde aparece |
|---|---|---|---|
| **A · Lanterna e Musgo** | **hora-base** e identidade | fim de tarde (e o começo do crepúsculo) | Baixo Orvalho (padrão), praça, forja, casa da Maren |
| **C · Iluminura** | variação clara | dia e manhã | região aberta de dia (estrada e feira de dia), parte acordada da vila |
| **B · Cinza e Brasa** | variação escura | crepúsculo avançado e noite | masmorra (covil do Hollowpaw), vila adormecida, cenas tristes |

Regra: **moldura de UI, paleta de material, perigo e brilho não mudam entre direções.** Muda a **luz** (grade, sombra, névoa, partículas, luzes artificiais).

## A · Lanterna e Musgo (base) — o que ela soma ao protótipo

**Palavras-chave:** entardecer, musgo, lanterna, pedra úmida, poeira no ar, maquete viva, calor humano.
**Anti-palavras:** neon, cromado, sangue, céu cartão-postal, preto puro, glow em tudo.

| Aspecto | Protótipo (dia) | + Direção A (fim de tarde) |
|---|---|---|
| Luz-chave | branca, sombras curtas | **âmbar** (`#FFC892` no grade), sol baixo à esquerda, **sombras longas (1,6×)** |
| Cor da sombra | verde-escura translúcida | **azul-esverdeada** (`rgba(18,46,48,0.42)`), nunca preto |
| Luzes artificiais | só à noite | **começam a acender** (35 %): lanternas, janelas, forja |
| Névoa | quase nenhuma | **cor de mel** (`#F2D3A0`), leve, nas bordas do mapa |
| Partículas | poeira, folhas | **poeira e pólen dourados** no ar, folhas, fumaça de chaminé |
| Contraste | alto e plano | **médio-alto guiado pela luz** (poças de luz sob lanternas, retângulos de sol nas ruas) |
| Cor-assinatura do herói | vermelho/marrom | **musgo azulado** (frio) com linho claro: salta sobre o fundo quente |

**Cena típica (a praça de Baixo Orvalho):** o sol baixo entra pela esquerda e deixa um retângulo dourado no calçamento; as sombras azul-esverdeadas dos telhados caem para a direita; o poço de pedra no centro ganha uma poça de luz de uma lanterna recém-acesa; a névoa cor de mel apaga o fundo; poeira dourada flutua; o Edric atravessa a faixa de luz com sombra comprida. Detalhes na [cena-modelo](cena_modelo_praca.md).

## B · Cinza e Brasa (variação escura)

**Quando:** masmorra, vila adormecida, noites tristes. **Grade** `#5F6B98` (noite) / `#E0A890` (crepúsculo). Luz principal = **fogo** (tocha, braseiro, forja) e o **aqua do sino** (`sino_aqua`); sombra azul-escura; névoa azul-acinzentada; poucas cores saturadas (fogo, herói, perigo, itens). **Cuidados:** combate legível (luz de preenchimento na faixa de combate; telegraph emissivo); a noite nunca fica mais escura que a do protótipo.

## C · Iluminura (variação clara)

**Quando:** região aberta de dia, feira de dia, vila acordada. **Grade** `#FFFFFF` (dia) / `#FFE8CC` (manhã). Sol alto, sombras curtas e azul-claras, cores limpas e saturadas (a grama de `#5E8C3A`), pouca névoa, pétalas e borboletas. **Cuidado:** com pouca sombra o "diorama" perde profundidade; mantenha a **oclusão ambiente**, as **sombras de copa** e as **3 camadas de profundidade**.

## Transições

- Entre regiões, a cor do sol e da névoa **interpola ao longo de alguns tiles** (nada de corte).
- O estado da vila (dia/adormecida/acordada, D-019) escolhe a **hora padrão** (guia §5.3).
- O ciclo contínuo (tecla N) passa por manhã → dia → fim de tarde → crepúsculo → noite → manhã e interpola entre elas.
