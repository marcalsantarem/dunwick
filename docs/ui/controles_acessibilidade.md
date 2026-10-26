# Controles e acessibilidade — vertical slice

> **Dono:** 07 Cenários e UI · **Versão:** v0.3 (v0.1 restaurada + D-025: visão isométrica e controles à Diablo) · **Data:** 2026-10-24
> Sem stack. Nomes das ações = `docs/gameplay.md` §3.1 (03; D1–D5 aprovadas, D-007). Telas: [inventario_telas.md](inventario_telas.md).
> **O que mudou na v0.3 (só isto):** (1) **mouse como controle principal** — clicar para mover/atacar/interagir, mira no cursor, cursor que muda de forma; (2) novas ações `mover_clique` e `ancorar`; (3) acessibilidade e armadilhas do navegador para o jogo com mouse; (4) isometria: movimento em 8 direções relativas à **tela**. Tudo o mais continua como na v0.1 (D-025).

## 1. Princípios
1. O código só conhece **ações lógicas**; teclas e botões são dados remapeáveis.
2. Teclado por **posição física** (WASD funciona em ABNT2/AZERTY); o rótulo exibido segue o layout do jogador.
3. Toda ação de segurar tem alternativa "alternar".
4. Ícones e selos mudam para o **último dispositivo usado**, em HUD, dicas, barra de comandos e "Como jogar".
5. **Três formas de jogar, todas completas:** mouse + teclado (padrão), só teclado e só gamepad; menus navegáveis pelos três.
6. **O mouse comanda, o teclado assiste:** o cursor decide *o que* se faz (mover, atacar, interagir); as teclas decidem *como* (habilidades, esquiva, corrida).

## 2. Ações lógicas

⚠ = divergência/pendência (§8). "Origem": 03 = `gameplay.md`; **07** = acrescentada por este documento.

| Ação | Origem | Contexto | Tipo | Observação |
|---|---|---|---|---|
| `mover` | 03 | jogo | eixo 2D | 8 direções **relativas à tela** (W = para cima na tela, que é uma diagonal do mundo; conversão no 03/08) |
| **`mover_clique`** | **07** ⚠ | jogo | apertar / segurar | **Diablo:** clique esquerdo no chão = andar até o ponto; **segurar** = seguir o cursor; qualquer entrada de `mover` cancela |
| `correr` | 03 | jogo | segurar / alternar | `correr_modo`; vale também para `mover_clique` |
| `mirar` | 03 | jogo | posição / eixo 2D | **cursor do mouse** (padrão com mouse); gamepad: analógico direito; sem mouse: assistência (03 §3.3) |
| `atacar` | 03 | jogo | apertar (+ segurar) | clique esquerdo **sobre inimigo** = aproxima e ataca; com ataque no cursor, segurar repete o combo |
| `forte` | 03 | jogo | apertar | clique direito |
| `esquivar` | 03 | jogo | apertar | rolamento na direção do `mover`; sem direção = para onde o cursor aponta |
| `habilidade_1..3` | 03 | jogo | apertar | disparam **no cursor** (cone/área/projétil na direção do cursor); `habilidade_4` reservada |
| `item` | 03 | jogo | apertar | item rápido |
| `interagir` | 03 | jogo, diálogo | apertar | também **clique sobre NPC/objeto** (anda até o raio de interação e interage) |
| **`ancorar`** | **07** ⚠ | jogo | segurar | **Diablo "ficar parado":** ataca sem sair do lugar; **sem tecla padrão** até o 03 decidir (D8) |
| `menu` | 03 | jogo, telas | apertar | Pausa |
| `inventario`, `missoes` | 03 | jogo | apertar | atalhos para as telas |
| `mapa` | 03 | — | — | reservada, **sem tecla** (tela fora do slice) |
| `confirmar` / `cancelar` | 03 | telas, diálogo | apertar | nunca ficam sem atribuição |
| `aba_anterior` / `aba_proxima` | 03 | telas | apertar | |
| `acao_2` / `acao_3` | 03 | telas | apertar | |
| `pular_dialogo` | 03 | diálogo | segurar / alternar | |

**Regra do cursor ("o que está sob o mouse manda"):** o clique esquerdo escolhe a ação pelo alvo sob o cursor, nesta prioridade: **elemento de UI** (não gera ação de jogo) → **inimigo** (atacar) → **NPC/objeto interativo** (interagir) → **chão** (mover). Tolerância de alvo em dados (03): raio de acerto do cursor ≥ 0,6 tile, favorecendo o que está mais à frente na profundidade.

## 3. Mapeamento padrão

### 3.1 Jogo — teclado + mouse

| Ação | Teclado + mouse | Teclado só | Gamepad |
|---|---|---|---|
| `mover` | W A S D / setas | setas | analógico esquerdo (direcional só com `direcional_move`) |
| `mover_clique` | **clique esquerdo no chão** (segurar = seguir) | — | — |
| `correr` | Shift esquerdo | Shift esquerdo | gatilho esquerdo |
| `mirar` | **posição do cursor** | assistência (03) | analógico direito |
| `atacar` | **clique esquerdo sobre inimigo** | J | face oeste |
| `forte` | **clique direito** (menu de contexto bloqueado só sobre o jogo) | K | face norte |
| `esquivar` | Espaço | L | face leste |
| `habilidade_1` / `_2` / `_3` | 1 / 2 / 3 | U / I / O | ombro direito / gatilho direito / ombro esquerdo |
| `item` | Q | H | direcional ↑ |
| `interagir` | E (ou clique sobre o alvo) | E | face sul |
| `ancorar` | ⚠ sem tecla (D8) | — | — |
| `menu` | Esc / P | Esc / P | Start |
| `inventario` | B | B | Select |
| `missoes` | N | N | direcional ↓ |
| `mapa` | — | — | — |

- As **habilidades também são clicáveis** nos ícones do HUD (jogo só com mouse; A37).
- O **item rápido** também é clicável no HUD.
- **Sem mouse:** `mirar` passa a ser a assistência do 03 (`mira_modo = movimento`) automaticamente.
- **Gamepad:** não há clique para mover; o analógico esquerdo move e o direito mira.

### 3.2 Telas e diálogo

| Ação | Teclado + mouse | Gamepad |
|---|---|---|
| Mover foco | setas / WASD; o foco segue o cursor | analógico esq. / direcional |
| `confirmar` | Enter / Espaço / clique esquerdo | face sul |
| `cancelar` | Esc / Backspace / clique direito / botão "Voltar" | face leste |
| `aba_anterior` / `aba_proxima` | Q / E; clique na aba | ombros |
| `acao_2` / `acao_3` | F / R; botões | face oeste / norte |
| Avançar diálogo | `interagir` (E) / `confirmar` / clique | face sul |
| `pular_dialogo` | segurar Esc ou Backspace; botão "Pular" | segurar Start |
| Escolha de resposta | 1–4 / setas + Enter / clique | direcional + face sul |
| Rolar lista | Page Up/Down; roda | analógico dir. |

### 3.3 Cursor e retorno visual (mouse)
O cursor **muda de forma** (nunca só de cor) e o mundo responde sob ele:

| Sob o cursor | Cursor | Resposta no mundo |
|---|---|---|
| Chão andável | seta simples | marcador de destino (anel suave no chão, **não magenta**, some ao chegar) |
| Chão não andável | seta com ✕ | nada |
| Inimigo | **espada** | **contorno** do inimigo + nome e barra de vida (ver inventário §3.2) |
| NPC / objeto interativo | **mão** / balão | contorno dourado + dica `[selo] ui_interagir_{tipo}` |
| Elemento de UI | seta de menu | foco do componente |
| Alvo fora do alcance de uma habilidade | cursor com anel vermelho-brasa (`alerta_ui`) **e** ícone de distância | prévia da área em tracejado |

- **Prévia de habilidade:** ao segurar uma habilidade (ou com a opção "mostrar alcance"), o chão mostra o **alcance e a área** em contorno claro — **não** magenta (magenta é aviso de golpe inimigo).
- **Cursor do sistema:** o cursor desenhado pelo jogo é grande o bastante (≥ 32 px) e há opção de **cursor grande**/alto contraste; sem mouse, o cursor some.
- **Cursor e telegraph:** o cursor e seus marcadores **nunca ficam acima** do aviso de golpe.

### 3.4 Teclas do navegador a evitar

| Tecla | Por quê | Regra |
|---|---|---|
| F1–F12 | ajuda, recarregar (F5), tela cheia (F11), ferramentas (F12), busca (F3) | bloqueadas no remapeamento do jogador; F1–F10 só como atalhos de debug no build de dev (03) |
| **Ctrl + letra** (Ctrl+W, T, N, Tab…) | o navegador reserva fechar/abrir aba; o jogo **não consegue** cancelar | **Ctrl não é padrão de nenhuma ação**; combinações bloqueadas; Ctrl sozinho só como atribuição opcional com `ui_aviso_ctrl_navegador` (A34) |
| Alt sozinho | barra de menu no Windows | bloqueado |
| Tab | move o foco da página | bloqueado como padrão; permitido com aviso |
| Esc | sai da tela cheia | permitido; **sair da tela cheia abre a Pausa**; `cancelar` tem também Backspace |
| Botão direito | menu de contexto | bloqueado **só sobre o canvas** |
| Roda do mouse | rola a página / zoom | bloqueada sobre o jogo (a câmera é fixa); em listas, rola a lista |
| Clique e arraste | seleciona texto/arrasta imagem | bloqueado sobre o jogo |
| Teclas mortas do ABNT2 (´ ~ ^ `) e Ç | variam por layout | permitidas com aviso; nunca padrão |
| Windows/Command, Print Screen | sistema | recusadas |
| Saída do cursor da janela | mouse "solto" no meio do combate | com `mover_clique` segurando, sair da janela **para** o movimento; o jogo mostra "mouse fora" só se perder o foco |

## 4. Ícones por dispositivo
- Conjunto original (10): teclas com rótulo do layout, botões do mouse (esquerdo/direito/roda) e posições do gamepad (face sul/leste/oeste/norte, ombros, gatilhos, analógicos, Start, Select). Sem símbolos de fabricantes no slice.
- Troca de conjunto na primeira entrada de outro dispositivo; no máximo 1 vez por 0,5 s.

## 5. Remapeamento (Opções → Controles)
| # | Regra | Verificável por |
|---|---|---|
| RM1 | 2 atribuições por ação e dispositivo | Opções |
| RM2 | Conflito no mesmo contexto: aviso mostrando a outra ação, com "Trocar" ou "Cancelar"; **nenhum conflito silencioso** | atribuir E a `habilidade_1` |
| RM3 | `confirmar`, `cancelar` e `menu` nunca ficam sem atribuição | tentar limpar |
| RM4 | Teclas de §3.4 recusadas com `ui_aviso_tecla_reservada` | tentar F5 |
| RM5 | "Restaurar padrão" por dispositivo, com confirmação | Opções |
| RM6 | Segurar/alternar para `correr`, `atacar` (contínuo) e `pular_dialogo` | Opções |
| RM7 | Esperando tecla: Esc ou "Voltar" cancela; 5 s sem entrada cancela | Opções |
| RM8 | Salvo nas configurações (separadas do save), versionado; inválido → padrão + aviso | recarregar |
| RM9 | HUD, dicas e "Como jogar" mostram a atribuição **atual** | remapear e abrir |
| RM10 | Botões do **mouse** são remapeáveis (esquerdo/direito/ambos trocáveis: canhoto) | trocar e jogar |

## 6. Ajuda e tutorial
"Como jogar" sempre acessível (menu e pausa) com as atribuições atuais e **demonstração do clique** (mover, atacar, interagir); tutorial contextual curto, repetível, desligável; a primeira área ensina `mover_clique`, `atacar`, esquiva e aviso de golpe.

## 7. Checklist de acessibilidade (para o 09)

**P** = garantido por padrão · **O** = opção. Texto das opções em `ui_opt_*`.

### 7.1 Sensibilidade
| ID | Requisito | Tipo | Como verificar |
|---|---|---|---|
| A01 | Nenhum flash acima de **3 por segundo** em qualquer configuração | P | gravar combate com chefe e efeitos no máximo |
| A02 | Desligar **tremor** (`ui_opt_tremor`) | O | desligar e levar golpe forte |
| A03 | Desligar/reduzir **flashes** (`ui_opt_flashes`) | O | desligar: impacto e vida baixa sem clarão |
| A04 | Reduzir **partículas** (normal/reduzido/mínimo) | O | mínimo: só as que comunicam jogo |
| A05 | Desligar **desfoque de profundidade** | O | cena inteira nítida |
| A06 | **Reduzir movimento**: transições de UI instantâneas, marcador de destino e cursor sem animação | O | navegar por todas as telas |
| A07 | Aviso de fotossensibilidade na 1ª execução | P | limpar dados e abrir |

### 7.2 Visão
| ID | Requisito | Tipo | Como verificar |
|---|---|---|---|
| A10 | Contraste ≥ **4,5:1** (texto pequeno) e ≥ 3:1 (texto grande, ícones, foco, barras). Base medida pelo 10 no painel de UI: texto 16,2:1 · secundário 9,6:1 · borda 3,7:1 | P | medir todas as combinações |
| A11 | Texto sobre o 3D com fundo próprio; opção de fundo opaco | P + O | diálogo e notificações em cena clara e escura |
| A12 | **Nenhum significado só por cor:** vida baixa, estados, raridade, missão principal/secundária, habilidade indisponível, item selecionado, **tipo de alvo sob o cursor** (forma do cursor) | P | ver tudo em escala de cinza |
| A13 | Modo daltônico (3 tipos) em UI e telegraph, mantendo formas | O | simulador |
| A14 | **Tamanho da UI** (escalas disponíveis) | O | margens e zona de ação |
| A15 | **Tamanho do texto** independente da UI | O | grande + textos +40 % |
| A16 | Foco sempre visível por **forma + cor** | P | navegar só com teclado |
| A17 | **Telegraph sempre visível:** névoa, desfoque, partículas, HUD, cursor, marcadores, números de dano e **objetos altos da cena isométrica** nunca o cobrem (A80) | P | combate em cada área |
| A18 | **Reservas de cor:** nenhuma UI em magenta `perigo_*`; erro de UI e vida baixa com forma + ícone + texto e a rampa **`alerta_ui`** (`paleta.json` v0.2: `#f44d21`, contorno `#780105`, contraste ≥ 5,1:1 no painel, validada nos 4 modos); dourado `brilho_*` só no foco da UI e em interativos | P | varredura de cores |
| A19 | **Cursor grande/alto contraste** e **cor do marcador de destino** configurável | O | Opções |

### 7.3 Audição
| ID | Requisito | Tipo | Como verificar |
|---|---|---|---|
| A20 | **Legendas** de falas fora da caixa e sons narrativos, com nome do falante | O (ligada) | cena com fala ambiente |
| A21 | **Indicador visual de sons importantes** na borda da tela (ataque fora da tela, inimigo se aproximando) | O | inimigo atacando fora da tela, mudo |
| A22 | Volumes separados: geral, música, efeitos, ambiente, interface | O | zerar um por vez |
| A23 | Nenhuma informação de jogo só por som | P | jogar sem som |

### 7.4 Controle e movimento
| ID | Requisito | Tipo | Como verificar |
|---|---|---|---|
| A30 | Remapeamento completo (§5) | O | RM1–RM10 |
| A31 | Alternativa a segurar (`correr`, `atacar` contínuo, `pular_dialogo`, **seguir o cursor**) | O | modo alternar |
| A32 | Jogo completo **só com teclado**, **só com mouse** (A37) e **só com gamepad**; menus pelos três | P | terminar o slice com cada um |
| A33 | Sem eventos de apertar repetidamente rápido | P | revisão |
| A34 | Nenhuma ação padrão usa Ctrl; nenhum atalho do navegador (Ctrl+W/T/N, F5, F11) dispara por acidente | P | jogar 10 min esquivando e andando |
| A35 | Assistências de combate (06) | — | **Fora do slice** (D-005) |
| A36 | **Assistência de mira** (03 §3.3) e `mira_modo` quando não há mouse | O | jogar só com teclado |
| A37 | **Modo só mouse:** andar/atacar/interagir por clique, habilidades e item pelos ícones clicáveis do HUD, pausa por botão na tela | O | terminar o slice só com o mouse |
| A38 | **Tolerância do cursor** (tamanho do alvo clicável) ajustável; **travar alvo** (alvo fica marcado até morrer ou sair do alcance) | O | Opções |
| A39 | Sem clique duplo ou arrastar obrigatórios; clique longo tem alternativa | P | revisão |

### 7.5 Cognição
| ID | Requisito | Tipo | Como verificar |
|---|---|---|---|
| A40 | Objetivo atual sempre visível (HUD, ligada por padrão) e na pausa | P + O | pausa em qualquer momento |
| A41 | **Pausar a qualquer momento** (inclui diálogo e chefe) | P | pausar em cada estado |
| A42 | Tutorial repetível | P | título e pausa |
| A43 | Diálogo sem limite de tempo, velocidade ajustável, avanço manual, histórico | P + O | deixar 2 min parado |
| A44 | Nenhum menu com tempo limite | P | revisão |

### 7.6 Navegador
| ID | Requisito | Tipo | Como verificar |
|---|---|---|---|
| A50 | Redimensionar e zoom sem cortar UI nem esticar pixel; **proporção da área visível** mantida (o mundo mostra mais/menos, nunca distorce) | P | redimensionar durante o jogo |
| A51 | Pausa ao perder foco, trocar de aba ou sair da tela cheia; tempo perdido não é simulado; **teclas e botões do mouse são soltos** ao perder o foco | P | trocar de aba em combate |
| A52 | Áudio só após o primeiro gesto | P | abrir e não tocar |

### 7.7 Texto
| ID | Requisito | Tipo | Como verificar |
|---|---|---|---|
| A60 | Todo texto por ID; nenhuma frase concatenada | P | busca no código |
| A61 | +40 % sem cortar | P | pseudo-localização |
| A62 | Fonte com todos os acentos do português | P | tela de teste |

### 7.8 Câmera isométrica (novo na v0.3)
| ID | Requisito | Tipo | Como verificar |
|---|---|---|---|
| A80 | **Oclusão:** o herói, os inimigos em combate e **toda zona de aviso de golpe** nunca ficam escondidos por parede, telhado, árvore ou torre: o objeto alto fica translúcido (recorte) ou o herói/telegraph ganha silhueta por cima | P | andar rente a cada objeto alto e lutar atrás dele |
| A81 | Silhueta de oclusão do herói **desligável** e com opção de **contorno forte** | O | Opções |
| A82 | **Câmera fixa**, sem rotação nem zoom do jogador (evita enjoo; o jogo é desenhado para um só ângulo) | P | revisão |
| A83 | Alvos clicáveis **não ficam atrás** de objetos altos sem indicação (contorno visível através do objeto) | P | clicar em NPC atrás de casa |
| A84 | **8 direções relativas à tela** coincidem com o que se vê (W = cima na tela) | P | andar em círculo |

## 8. Pendências para o Produtor (alinhamento com o 03)
| # | Ponto | Proposta do 07 |
|---|---|---|
| D6 | `mover_clique` e a regra "o que está sob o cursor manda" | 03 inclui no `gameplay.md` (§3.1 e §7) e define pathfinding (08 confirma custo) |
| D7 | **Mira no cursor** passa a ser o padrão com mouse (`mira_modo`) | 03 troca o padrão `movimento` → `cursor` quando há mouse; sem mouse, `movimento` |
| D8 | `ancorar` (ficar parado e atacar) | 03 decide se entra e a tecla; **não** usar Ctrl |
| D9 | Esquiva sem direção: para onde o cursor aponta | 03 confirma |
| D10 | Raio de acerto do cursor (≥ 0,6 tile) e prioridade de alvos | 03/06 definem em dados |
| D11 | Tecla da esquiva continua **Espaço** | confirmar com o 03 que Espaço não conflita com `mover_clique` segurado |
