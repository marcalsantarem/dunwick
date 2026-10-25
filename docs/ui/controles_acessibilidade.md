# Controles e acessibilidade — vertical slice (v0.2, direção do protótipo)

> **Dono:** 07 Cenários e UI · **Versão:** v0.2 (BRF-011 / D-024) · **Data:** 2026-10-24 · substitui a v0.1 (BRF-005).
> **Base:** controles do protótipo "Vale de Dunwick" (`referencia/prototipo/index.html`, `Input`, `drawTitle`), reconciliados com as regras do projeto. Nomes das ações: alinhar com o 03 (`docs/gameplay.md`, reescrita em andamento). Telas: [inventario_telas.md](inventario_telas.md).

## 0. O que mudou em relação à v0.1

| Tema | v0.1 | v0.2 |
|---|---|---|
| Esquema padrão | J/K/L, 1–3, R, I… (esquema do 03 v0.2) | **o do protótipo:** WASD/setas, Shift, Espaço/clique, Q, E, esquiva, F, M, Esc |
| Ataque forte | `forte` (K / clique direito) | **sai**: o protótipo não tem; o botão direito vira **esquiva**. Habilidades **Q (giro)** e **E (investida)** ocupam esse papel (03 confirma) |
| Habilidades | `habilidade_1..3` em 1/2/3 | `habilidade_1` = giro (Q) · `habilidade_2` = investida (E) · `habilidade_3` reservada |
| Mira | opcional | **mouse mira** (protótipo); gamepad: analógico direito + assistência |
| Menus | só teclado/gamepad | protótipo: **só mouse/toque**. Mantemos teclado e gamepad e **mantemos** os cliques |
| Gamepad | padrão do 03 | o protótipo **não** tem gamepad (a análise cita, o código não); proposta nova (§3.2) |
| Atalhos de tela | N = diário, B = bolsa | **N volta a ser ciclo dia/noite** (protótipo): diário em **J** |

## 1. Princípios
1. O código só conhece **ações lógicas**; teclas e botões são dados remapeáveis.
2. Teclado por **posição física** (WASD funciona em ABNT2/AZERTY); o rótulo exibido segue o layout do jogador.
3. Toda ação de segurar tem alternativa "alternar" (correr, atacar contínuo).
4. Ícones/selos mudam para o **último dispositivo usado**, em HUD, dicas, "Como jogar" e barra de comandos; o selo da tecla no HUD (Q/E) mostra a **atribuição atual**, não "Q" fixo.
5. Jogável **só com teclado**, **só com mouse+teclado** e **só com gamepad**; menus navegáveis pelos três.

## 2. Ações lógicas

⚠ = divergência/pendência (§8). Coluna "Protótipo" = como está no código.

| Ação | Protótipo | Contexto | Tipo | Observação |
|---|---|---|---|---|
| `mover` | WASD / setas | jogo | eixo 2D | 8 direções no plano isométrico; "para cima" = para cima na tela |
| `correr` | Shift | jogo | segurar / alternar | gasta fôlego (protótipo: 18/s) |
| `atacar` | Espaço / clique esq. | jogo | apertar (+ segurar contínuo, opção) | combo ×3 |
| `habilidade_1` | **Q** — golpe giratório (recarga 6 s) | jogo | apertar | |
| `habilidade_2` | **E** — investida (recarga 8 s) | jogo | apertar | |
| `habilidade_3` | — | jogo | apertar | reservada (D-007) |
| `esquivar` | Ctrl / C / botão direito | jogo | apertar | rolamento; custa 20 de fôlego (06) ⚠ Ctrl |
| `interagir` | F | jogo, diálogo | apertar | também avança diálogo e abre baús |
| `mirar` | mouse | jogo | posição / eixo 2D | o golpe sai na direção do cursor |
| `item` | — (não existe) | jogo | apertar | **novo:** item rápido (cura) |
| `mapa` | M | jogo | apertar | abre/fecha o mapa grande |
| `menu` | Esc | jogo | apertar | pausa |
| `bolsa` | — | jogo | apertar | **novo** (tela de itens, se mantida — §8 do inventário) |
| `diario` | — (missão fica no HUD) | jogo | apertar | **novo** (histórico de missões) |
| `ciclo_tempo` | N | jogo | apertar | alterna dia/noite; ⚠ **só build de dev** ou opção (pergunta ao usuário) |
| `debug` | F3 | dev | apertar | só no build de desenvolvimento (F1–F10, regra do 03) |
| `confirmar` / `cancelar` | clique / (nada) | telas | apertar | `cancelar` não existe no protótipo; novo |
| `aba_anterior` / `aba_proxima` | — | telas | apertar | novo |
| `acao_2` / `acao_3` | — | telas | apertar | novo |
| `pular_dialogo` | — | diálogo | segurar / alternar | novo |

## 3. Mapeamento padrão

### 3.1 Jogo — teclado + mouse

| Ação | Principal | Alternativa | Mouse |
|---|---|---|---|
| `mover` | W A S D | setas | — |
| `correr` | Shift esquerdo | — | — |
| `atacar` | Espaço | K | clique esquerdo |
| `habilidade_1` (giro) | Q | 1 | — |
| `habilidade_2` (investida) | E | 2 | — |
| `habilidade_3` | — | 3 | — |
| `esquivar` | **C** | L | **botão direito** |
| `interagir` | F | — | — |
| `item` | R | H | — |
| `mapa` | M | — | — |
| `menu` | Esc | P | — |
| `bolsa` | B | — | — |
| `diario` | J | — | — |
| `mirar` | — | — | posição do cursor |

**Sem mouse:** o esquema principal funciona inteiro no teclado; `mirar` passa a ser automático (assistência do 03, `mira_modo = movimento`), que vira o padrão quando não há movimento de mouse.

### 3.2 Jogo — gamepad (proposta; o protótipo não tem; posição sem marca)

| Ação | Botão |
|---|---|
| `mover` | analógico esquerdo |
| `correr` | gatilho esquerdo (alternar: opção) |
| `atacar` | face oeste |
| `esquivar` | face leste |
| `interagir` | face sul |
| `habilidade_1` / `habilidade_2` | ombro direito / gatilho direito |
| `habilidade_3` | face norte (reservada) |
| `item` | direcional ↑ |
| `bolsa` / `diario` | direcional ← / direcional ↓ |
| `mapa` | Select |
| `menu` | Start |
| `mirar` | analógico direito (com assistência do 03) |

- Zona morta do analógico 20 % (opção 5–40 %); vibração desligável.
- O direcional faz atalhos em jogo (só o analógico move); opção "direcional também move" desliga os atalhos dele.
- Gamepad desconectado → **abre a Pausa** (`ui_aviso_gamepad_desconectado`).

### 3.3 Telas e diálogo

| Ação | Teclado + mouse | Gamepad |
|---|---|---|
| Mover foco | setas / WASD; foco segue o cursor | analógico esq. / direcional |
| `confirmar` | Enter / Espaço / clique esquerdo | face sul |
| `cancelar` | Esc / Backspace / clique direito / botão "Voltar" | face leste |
| `aba_anterior` / `aba_proxima` | Q / E; clique na aba | ombros esq. / dir. |
| `acao_2` / `acao_3` | F / R; botões na tela | face oeste / norte |
| Avançar diálogo | `interagir` (F) / `confirmar` / clique | face sul |
| `pular_dialogo` | segurar Esc ou Backspace; botão "Pular" | segurar Start |
| Escolha de resposta | 1–4 / setas + Enter / clique | direcional + face sul |
| Rolar lista | Page Up/Down; roda | analógico dir. |

### 3.4 Teclas do navegador e armadilhas

| Tecla | Problema | Regra |
|---|---|---|
| **Ctrl (como esquiva do protótipo)** | **Ctrl+W fecha a aba, Ctrl+T/N abrem abas, Ctrl+Shift+… — o navegador reserva e o jogo não consegue cancelar.** Como W = andar para cima, **esquivar para cima com Ctrl fecha o jogo**. O protótipo bloqueia Ctrl com `preventDefault`, mas isso **não impede** Ctrl+W, Ctrl+T, Ctrl+N, Ctrl+Tab no Chrome | **Ctrl não vem como padrão.** Esquiva = **C** e botão direito. Ctrl só como atribuição opcional, com aviso `ui_aviso_ctrl_navegador` e proibido em combinação com W/T/N |
| Espaço | rola a página | bloqueado sobre o jogo (como no protótipo) |
| Setas, Tab | rolam/movem foco da página | bloqueadas sobre o jogo; Tab recusado no remapeamento |
| Botão direito | menu de contexto | bloqueado **só sobre o canvas** (como no protótipo) |
| Esc | sai da tela cheia | permitido; **sair da tela cheia abre a Pausa**; `cancelar` tem também Backspace |
| F1–F12 | ajuda, recarregar, tela cheia, ferramentas, busca (F3) | recusadas no remapeamento do jogador; F1–F10 só como atalhos de dev (03) |
| Alt, Windows/Command, Print Screen | menu/sistema | recusadas |
| Teclas mortas do ABNT2 (´ ~ ^ `) e Ç | variam por layout | permitidas com aviso; nunca padrão |
| Segurar tecla / repetição do SO | repetição automática | ações usam "apertou" (sem repetição); o protótipo faz `!e.repeat` — manter |

## 4. Ícones e selos
- Selos de tecla (placa de madeira com borda de ouro, protótipo: círculo no canto do ícone de habilidade), botões do mouse e posições do gamepad (sul/leste/oeste/norte, ombros, gatilhos, analógicos, Start, Select). **Sem símbolos de fabricantes** no slice.
- Troca de conjunto na primeira entrada de outro dispositivo, no máximo 1 vez por 0,5 s.
- Texto "Q", "E" nunca fixo em dica, diálogo ou tutorial: sempre `{tecla_habilidade_1}` etc. (o protótipo escreve "F ▶" e "Q"/"E" no código).

## 5. Remapeamento (Opções → Controles)
| # | Regra | Verificável por |
|---|---|---|
| RM1 | 2 atribuições por ação e dispositivo | Opções |
| RM2 | Conflito no mesmo contexto: aviso mostrando a outra ação, com "Trocar" ou "Cancelar"; **nenhum conflito silencioso** | atribuir C a `habilidade_1` |
| RM3 | `confirmar`, `cancelar` e `menu` nunca ficam sem atribuição | tentar limpar |
| RM4 | Teclas de §3.4 recusadas com `ui_aviso_tecla_reservada` | tentar F5 e Alt |
| RM5 | "Restaurar padrão" por dispositivo, com confirmação | Opções |
| RM6 | Segurar/alternar para `correr`, `atacar` (contínuo) e `pular_dialogo` | Opções |
| RM7 | Esperando tecla: Esc ou "Voltar" cancela; 5 s sem entrada cancela | Opções |
| RM8 | Remapeamento salvo nas configurações (separadas do save), versionado; inválido → padrão + aviso | recarregar |
| RM9 | HUD, dicas e "Como jogar" mostram a atribuição **atual** | remapear e abrir |

## 6. Ajuda e tutorial
"Como jogar" sempre acessível (título e pausa); tutorial contextual curto na primeira vez de cada ação (o protótipo só mostra a tabela no título); repetível; desligável. **Primeira área = tutorial** com um lobo/dummy para combo, giro, investida, rolamento (aviso de golpe incluso).

## 7. Checklist de acessibilidade (para o 09)

**P** = garantido por padrão · **O** = opção do jogador. Itens marcados **[protótipo]** descrevem algo que o protótipo faz hoje e que precisa de controle.

### 7.1 Sensibilidade (fotossensibilidade e movimento)
| ID | Requisito | Tipo | Como verificar |
|---|---|---|---|
| A01 | Nenhum flash/clarão acima de **3 por segundo** em qualquer configuração | P | gravar combate com chefe, efeitos no máximo; contar transições |
| A02 | Desligar **tremor de tela** (`ui_opt_tremor`) | O | desligar e levar golpe forte |
| A03 | Desligar/reduzir **flashes** (`ui_opt_flashes`): inclui o **clarão vermelho do retrato** ao levar dano e o brilho de habilidade pronta **[protótipo]** | O | desligar e levar dano |
| A04 | Reduzir **partículas** (normal/reduzido/mínimo): faíscas, poeira, folhas, pássaros **[protótipo]** | O | mínimo: só as que comunicam jogo (telegraph, cura) |
| A05 | Desligar **desfoque**: o do título/pausa (`blurScreen`) **[protótipo]** e o de profundidade | O | desligado: fundo nítido |
| A06 | **Reduzir movimento** (`ui_opt_reduzir_movimento`): UI sem deslizar/pulsar, sem balanço de câmera, cartões de capítulo sem fade, ícone de habilidade sem girar | O | ligar e navegar por todas as telas |
| A07 | Aviso de fotossensibilidade na 1ª execução | P | limpar dados e abrir |
| A08 | **Ciclo dia/noite** com opção **dia fixo** e **noite fixa**; transições lentas (≥ 5 s) sem variação brusca **[protótipo]** | O | alternar em Opções |
| A09 | **Números de dano e texto flutuante** (`floatText`) desligáveis/reduzidos **[protótipo]** | O | desligar e lutar |

### 7.2 Visão
| ID | Requisito | Tipo | Como verificar |
|---|---|---|---|
| A10 | **Contraste:** ≥ 4,5:1 texto pequeno, ≥ 3:1 texto grande, ícones, foco, barras | P | medir todas as combinações; **base medida pelo 07 no protótipo** (calculadas, contra painel **opaco**): texto `#F2E6C8`/madeira `#3A2818` 11,3:1 · ouro `#E8C877`/madeira 8,7:1 · borda de ouro `#C9A24A` 5,8:1 · pergaminho `#3A2614`/`#F0E2BE` 11,1:1 · botão `#FFE9A0`/`#9A2A28` 6,4:1 · selo de tecla 13,5:1 · `alerta_ui` `#F44D21`/madeira 4,0:1 (**só para ícone e contorno, nunca como cor de texto**) · narração no pergaminho `#6A5034`/`#D8C49A` **4,4:1 → falha; escurecer** |
| A11 | **Texto sobre o mundo** sempre com painel ou contorno; painéis atrás de texto com **opacidade ≥ 0,9** (o protótipo usa 0,7–0,82: o contraste cai sobre grama clara) | P + O | texto sobre a praça de dia e na grama clara |
| A12 | **Nenhum significado só por cor:** vida baixa, estados, missão (feita/atual/bloqueada), mapa (§2.9 do inventário), habilidade indisponível, raridade — sempre forma, ícone ou texto **[protótipo]: missões e minimapa usam só cor** | P | ver tudo em escala de cinza |
| A13 | **Modo daltônico** (protanopia, deuteranopia, tritanopia) ajusta cores de UI, minimapa e telegraph mantendo formas | O | simulador |
| A14 | **Tamanho da UI** (100/125/150 %) | O | conferir margens e zona de ação |
| A15 | **Tamanho do texto** (normal/grande), independente da UI, sem cortar; **mínimo 14 px a 1280×720** (o protótipo tem textos de **9 px** — "XP" — e **11 px** — selo de tecla — abaixo disso) | O + P | medir |
| A16 | **Foco sempre visível por forma + cor** (anel duplo + setas) | P | navegar só com teclado |
| A17 | **Telegraph sempre visível:** noite, névoa, desfoque, HUD, partículas e números de dano nunca o cobrem; contraste do magenta com o chão **à noite** ≥ 3:1 | P | combate de dia, entardecer e noite em cada área |
| A18 | **Reservas de cor:** nenhuma UI em magenta `perigo_*`; dourado como moldura/foco; erro e vida baixa em `alerta_ui` com forma + ícone + texto; **vermelho do HUD** distinto de `perigo_*` e `alerta_ui` nos 4 modos (pergunta ao 10) | P | varredura de cores |

### 7.3 Audição
| ID | Requisito | Tipo | Como verificar |
|---|---|---|---|
| A20 | **Legendas** de falas fora da caixa e sons narrativos, com nome do falante | O (ligada) | cena com fala ambiente |
| A21 | **Indicador visual de sons importantes** (ataque fora da tela, inimigo se aproximando, sino) na borda da tela | O | inimigo atacando fora da tela, som mudo |
| A22 | Volumes: geral, música, efeitos, ambiente, interface (o protótipo só tem "Som: sim/não") **[protótipo]** | O | zerar um por vez |
| A23 | Nenhuma informação só por som (o **sino**, o **aviso de golpe**, o **alerta de vida baixa** têm par visual) | P | jogar sem som |

### 7.4 Controle
| ID | Requisito | Tipo | Como verificar |
|---|---|---|---|
| A30 | Remapeamento completo (§5) **[protótipo]: não há** | O | RM1–RM9 |
| A31 | Alternativa a segurar: `correr` alternar, `atacar` contínuo ao segurar (o protótipo usa "segure p/ combo" no toque), `pular_dialogo` | O | modo alternar |
| A32 | Jogo completo só com teclado, só com mouse+teclado e só com gamepad; **menus** navegáveis por teclado e gamepad **[protótipo]: só mouse** | P | terminar o slice com cada um |
| A33 | Sem eventos de apertar repetidamente | P | revisão |
| A34 | **Esquiva sem Ctrl por padrão** (§3.4) | P | esquivar para cima 20× sem fechar a aba |
| A35 | Assistências de combate (06) | — | **Fora do slice** (D-005) |
| A36 | Mira assistida e `mira_modo = movimento` para quem joga sem mouse | O | jogar só com teclado |

### 7.5 Cognição
| ID | Requisito | Tipo | Como verificar |
|---|---|---|---|
| A40 | Objetivo atual sempre visível (painel de missão no HUD, opção ligada) e na pausa | P + O | abrir pausa em qualquer momento |
| A41 | **Pausar a qualquer momento** (inclui diálogo, cena e chefe) | P | pausar em cada estado |
| A42 | Tutorial repetível | P | abrir do título e da pausa |
| A43 | Diálogo sem limite de tempo, velocidade ajustável, avanço manual, histórico | P + O | deixar 2 min parado |
| A44 | Nenhum menu com tempo limite; **cartões e mensagens** (3–3,5 s no protótipo) dispensáveis e revisáveis no diário | P | revisão |

### 7.6 Navegador
| ID | Requisito | Tipo | Como verificar |
|---|---|---|---|
| A50 | Redimensionar e zoom 50–200 % sem cortar UI nem esticar a imagem; **1280×720 lógicos** com proporção mantida | P | redimensionar durante o jogo |
| A51 | Pausa automática ao perder foco, trocar de aba ou sair da tela cheia; tempo perdido não é simulado (o protótipo limpa as teclas ao perder o foco: manter) | P | trocar de aba em combate |
| A52 | Áudio só após o primeiro gesto (título) | P | abrir e não tocar |
| A53 | **Ctrl+W/T/N não podem ser acionados por acidente pelo esquema padrão** | P | A34 |

### 7.7 Texto e localização
| ID | Requisito | Tipo | Como verificar |
|---|---|---|---|
| A60 | Todo texto por ID; nenhum no código; nenhuma frase concatenada (o protótipo escreve tudo no código, inclusive "(baixinho)" e "[ação]" como marcas no texto) **[protótipo]** | P | busca no código |
| A61 | +40 % sem cortar | P | pseudo-localização |
| A62 | Fonte com todos os acentos do português | P | tela de teste |

## 8. Pendências para o Produtor
| # | Ponto | Proposta do 07 |
|---|---|---|
| D1 | **Ctrl como esquiva do protótipo** fecha a aba com W (Ctrl+W) | Padrão **C** e botão direito; Ctrl só opcional com aviso (A34) |
| D2 | `diario` em J e alternativa de `atacar` em K (evita conflito) | 03 confirma |
| D3 | `forte` some do esquema | 03 confirma: habilidades Q/E assumem o papel; D-007 dizia "golpes fortes entram" |
| D4 | `habilidade_3` | reservada; 1–3 como alternativas de teclado |
| D5 | `ciclo_tempo` (N) | **só opção/dev** (pergunta ao usuário no inventário §8) |
| D6 | Gamepad não existe no protótipo | proposta de §3.2; 03 valida |
| D7 | `item` (R) e `bolsa` (B) são novos | só se o usuário quiser bolsa/itens (inventário §8) |
