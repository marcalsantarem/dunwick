# Itens-modelo

> **Status:** v1.0 — RASCUNHO para aprovação (BRF-011 / D-024). Autor: 10 Diretor de Arte · 2026-10-24.
> Regra: **nenhuma produção em massa antes de cada item-modelo ser aprovado pelo 10 e, no fim, pelo usuário.** Este documento define **o que é cada item, o que ele prova e como será aprovado**. Nada foi produzido.
> Base: [guia_visual.md](guia_visual.md) · [paleta.json](paleta.json) · `sprites/plano_sprites_v2.md` (04).
> **IDs de cenário (`env_`, `prop_`) são proposta**: o CLAUDE.md lista só os prefixos de sprites, texto, UI, áudio e FX; 07/Produtor confirmam.

## Ordem

| # | Item-modelo | ID | Dono | Prova | Depende de |
|---|---|---|---|---|---|
| M1 | Herói parado e andando | `hero_edric` | 04 | proporção, cel-shading, rim light, contorno, 5 direções, leitura sobre o chão | aprovação do guia (§14 Q1 e Q3) |
| M2 | Casa e tiles da praça | `env_casa_enxaimel_telha_a`, `env_chao_calcamento_a`, `env_chao_grama_a` | 07 | escala, enxaimel, telha, sombra projetada, variação, transição de chão | M1 (escala do herói) |
| M3 | Ícone de habilidade | `ui_icone_habilidade_giro` | 07 | estilo de ícone, ouro biselado, recarga, brilho de prontidão | — |
| M4 | Painel de UI | `ui_painel_madeira_ouro` | 07 | madeira, moldura, ornamento sino/gota, 9 fatias, estados | M3 |
| M5 | Efeito de impacto | `fx_impacto_medio` | 10 (com 03) | luz curta, faíscas, tingimento, flashes ≤ 3/s | M1 |

Cada um entra na [cena-modelo da praça](cena_modelo_praca.md) quando aprovado. O M1 é o primeiro.

---

## M1 · `hero_edric` (04)

**O que entrega (só isto, antes da aprovação):** **idle (4 q) e walk (8 q)** nas 5 direções + **1 quadro-chave de `atk1`** (silhueta e rastro). Nenhuma outra animação nem personagem.

**Especificação visual (a confirmar com a ficha `narrativa/personagens/hero_edric.md`):**
- **Tamanho:** célula 128×128, âncora (64,112), corpo ≈ 70 px, cabeça ≈ 24 px (≈ 1/3). **[USUÁRIO Q3]** — a alternativa é ≈ 50 px (protótipo).
- **Silhueta:** compacta, ombros estreitos, **uma ombreira só (direita, couro)**; postura levemente curvada, sempre alerta.
- **Roupa e cores:** gibão de treino remendado em `musgo_edric` (escuro e azulado, para separar da grama), calça `terra`/`madeira` escura, botas `couro`, **faixa de linho** (`linho_3`) no antebraço esquerdo, fivelas `ouro_3`, recibo de taxa dobrado no cinto (`linho_2`, balança na corrida). **Sem magenta.**
- **Marca:** desenho de sino no antebraço esquerdo, escondido pela faixa; no quadro-chave extra opcional, a faixa solta com brilho `sino_aqua_3`.
- **Rosto:** olhos com brilho, sobrancelhas teimosas, boca seca (levemente de lado), cabelo `cabelo_3` (castanho) com movimento secundário.
- **Arma:** espada de treino de ponta cega (`aco_2/3`) e escudo curto (madeira + `aco`), a arma não cobre a ombreira.
- **Sombreamento:** 3–4 passos por material, luz frontal-superior-esquerda, sombra fria, **rim light** frio de 1–2 px (dia/tarde), quente à noite.
- **Contorno:** 1 px marrom-escuro translúcido, hierárquico (base mais escura).
- **Sombra no chão:** não pintada; elipse de contato e projetada vêm da cena.

**Critérios de aprovação (o 10 confere; marcar tudo):**
- [ ] **Silhueta** em preto sólido legível sobre `grama_4`, `terra_3` e `pedra_3` (a ombreira única se reconhece)
- [ ] **Melhor que o protótipo** lado a lado na mesma escala: anatomia, rosto, mãos, sombreamento, rim light
- [ ] Contraste de valor do gibão contra o chão típico **ΔL ≥ 0,19** (grama, terra, calçamento)
- [ ] **5 direções coerentes** (cabelo, ombreira, faixa, recibo; o lado oposto **não** é só espelho do rosto/ombreira — o rig inverte a ombreira)
- [ ] Âncora idêntica em todos os quadros; passos sem deslizar (casa com a velocidade do 03)
- [ ] Sem magenta e sem verde que se funde com a grama
- [ ] **Três horas** (dia, fim de tarde, noite com tocha) com rim light e grade aplicados
- [ ] Contorno suave sem serrilhado nem halo a 1,0× e a 1,5×
- [ ] Peso por quadro dentro do orçamento do 08
- [ ] Originalidade (nenhum traço de personagem de outro jogo)

---

## M2 · Casa e tiles (07)

**Entrega:** 1 casa `env_casa_enxaimel_telha_a` + 1 tile de calçamento `env_chao_calcamento_a` + 1 tile de grama `env_chao_grama_a` (com 3 variações de ruído) + uma **transição** grama↔calçamento.

**Casa (especificação):**
- **Pegada:** 3×3 tiles (losango de 192×96 px na base), parede ≈ **1,8×** o herói (≈ 126 px), telhado em **telha laranja** (`telha_*`), porta ≈ **1,35×** o herói, chaminé de tijolo, 2 janelas com **cortina e luz acesa** à noite (`luz_fogo_*`), vigas de **enxaimel** (`madeira_*`) sobre **reboco** (`reboco_*`), base de pedra (`pedra_*`).
- **Detalhes:** vaso de flores, caixote ou barril encostado, trepadeira de musgo no canto da parede (direção A), calha com gotejar de orvalho.
- **Luz:** face esquerda mais clara, direita mais escura; **sombra projetada** longa e azul-esverdeada (fim de tarde, comprimento 1,6); **oclusão ambiente** de 6–10 px na base.
- **Variantes depois da aprovação:** telhado de ardósia (`ardosia_*`), tamanhos 2×3 e 3×3, esquinas.

**Calçamento e grama:** textura de pedras irregulares com rejunte escuro (`pedra_*`), 3 variantes; grama em 3 tons (`grama_3..5`) com ruído e tufos; **transição** sem emenda reta; flores raras (rosadas só claras e pequenas).

**Critérios:**
- [ ] A casa tem **a mesma linguagem** (contorno, luz, passos) do herói
- [ ] Escala certa em relação ao herói (porta 1,35×; parede ≥ 1,8×)
- [ ] Sombra projetada e oclusão ambiente corretas nas 3 horas
- [ ] Sem repetição visível do tile em 3 telas; transição natural
- [ ] Janela acesa liga de noite sem alterar a silhueta
- [ ] Orçamento de peso e de desenho (cache em bloco) dentro do 08
- [ ] Parece **nossa** (ornamento de sino/gota, musgo), não genérica

---

## M3 · `ui_icone_habilidade_giro` (07)

**Entrega:** o ícone circular da habilidade giratória (Q), nos estados **normal, em recarga (setor de relógio com número), pronta (brilho curto), desabilitada**; e o selo da tecla.

- **Tamanho:** raio ≈ 28 px (o protótipo usa um raio similar), borda `ouro_3` biselada (3 px), fundo em degradê de `ui_madeira_*` com leve toque roxo-escuro para separar do painel.
- **Símbolo:** 3 arcos de lâmina em círculo com setas, `linho_3`; **não copiar** ícone de outro jogo; o símbolo é do projeto.
- **Recarga:** setor escuro com o número em branco; ao ficar pronta, **brilho curto** (≤ 200 ms, sem flash de tela).
- **Critérios:** [ ] legível a 28 px e a 2× · [ ] contraste do símbolo ≥ 4,5:1 · [ ] estados distinguíveis sem cor · [ ] mesma moldura do painel (M4) · [ ] nada de magenta nem de azul-janela.

---

## M4 · `ui_painel_madeira_ouro` (07)

**Entrega:** painel **de 9 fatias** (escalável) em 3 estados — normal, foco/selecionado, desabilitado — com título e divisor.

- **Material:** madeira escura com **veios gerados** (`ui_madeira_*`), gradiente vertical, **moldura de ouro biselada** (2–3 px: realce `ouro_4/5`, sombra interna `ouro_1`), **cantos com ornamento próprio** (sino pequeno ou gota de orvalho; nada de losango genérico), rebites discretos, sombra projetada suave.
- **Texto de teste:** título em serifa dourada, corpo `linho_3`, secundário `linho_2`; **+40 %** de espaço.
- **Critérios:** [ ] contraste de texto ≥ 7:1 · [ ] 9 fatias sem distorção dos cantos · [ ] os 3 estados se distinguem sem cor · [ ] funciona sobre vila clara e escura · [ ] **não parece** UI de outro jogo (sem janela azul em degradê).

---

## M5 · `fx_impacto_medio` (10, com 03)

**Entrega:** o efeito de um golpe de força **média** (combo ×3 do Edric), com **faíscas**, arco de corte curto na direção do golpe, **tingimento do alvo** (1 quadro), **luz curta** (6 quadros, raio 96 px, intensidade 0,9) e **partículas** (8). Ficha em `docs/arte/vfx/fx_impacto_medio.md` e prévia nas 3 horas.

- **Critérios:** [ ] legível em 1 quadro · [ ] ≤ 3 flashes/s mesmo com combo e 2 alvos · [ ] não cobre o telegraph · [ ] versão reduzida (sem luz, sem tremor, tingimento médio) · [ ] mesmo quadro do som e do acerto (eventos do 03).

---

## Fluxo de aprovação

1. Dono produz **só o item-modelo** + ficha.
2. 10 revisa com o checklist acima (aprovado / aprovado com ajustes / reprovado, com motivos).
3. O Produtor leva ao usuário (itens M1, M2, M4 e a cena-modelo; M3 e M5 o 10 pode aprovar sozinho).
4. Só então entram as variantes e a produção em massa.
