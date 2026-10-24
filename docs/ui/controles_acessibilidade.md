# Controles e acessibilidade — vertical slice

> **Dono:** 07 Cenários e UI · **Versão:** v0.1 (rascunho, BRF-005) · **Data:** 2026-10-24
> Sem stack. Nomes das ações seguem `agentes-rpg/03_jogabilidade.md` §7.1; alinhamento final com `docs/gameplay.md` (BRF-003, em andamento). Telas citadas: [inventario_telas.md](inventario_telas.md).

## 1. Princípios
1. O código só conhece **ações lógicas**; teclas e botões são dados de configuração, remapeáveis.
2. Teclado identificado pela **posição física** da tecla (WASD funciona em ABNT2, AZERTY etc.), e o **rótulo exibido** segue o layout do jogador.
3. Toda ação que exige segurar tem alternativa "alternar" (pressionar uma vez).
4. Ícones e rótulos mudam para o **último dispositivo usado** (teclado+mouse ou gamepad), em HUD, dicas, barra de comandos e "Como jogar".
5. Nada exige mouse: o jogo inteiro é jogável **só com teclado** e **só com gamepad**.

## 2. Ações lógicas

Nomes = `docs/gameplay.md` §3.1 (03). ⚠ = divergência levada ao Produtor (§8). "+07" = ação ou atribuição que o 07 acrescenta.

| Ação | Origem | Contexto | Tipo | Observação |
|---|---|---|---|---|
| `mover` | 03 | jogo | eixo 2D | 8 direções |
| `correr` | 03 | jogo | segurar / alternar ⚠ | modo escolhível (A31) |
| `mirar` | 03 | jogo | eixo 2D | opcional (`mira_modo`, 03 §3.3) |
| `atacar` | 03 | jogo | apertar | combo de 3 |
| `forte` | 03 | jogo | apertar | entra no slice (D-007) |
| `esquivar` | 03 | jogo | apertar | |
| `habilidade_1..3` | 03 | jogo | apertar | `habilidade_4` reservada (D-007) |
| `item` | 03 | jogo | apertar | usa o item rápido |
| `interagir` | 03 | jogo | apertar | também avança diálogo |
| `menu` | 03 | jogo, telas | apertar | abre/fecha Pausa |
| `mapa` | 03 | — | — | ⚠ tela fora do slice (D-007): reservada, sem tecla padrão |
| `inventario` | +07 ⚠ | jogo | apertar | atalho direto para o Inventário |
| `missoes` | +07 ⚠ | jogo | apertar | atalho direto para Missões |
| `confirmar` / `cancelar` | 03 | telas, diálogo | apertar | nunca ficam sem atribuição |
| `aba_anterior` / `aba_proxima` | +07 ⚠ | telas | apertar | |
| `acao_2` / `acao_3` | +07 ⚠ | telas | apertar | ação secundária/terciária da tela |
| `pular_dialogo` | +07 ⚠ | diálogo | segurar / alternar | |

## 3. Mapeamento padrão
Base = `docs/gameplay.md` §3.2. Gamepad por **posição** (face sul/leste/oeste/norte, ombros, gatilhos), sem marca. Contextos **jogo** e **telas** são separados: a mesma tecla pode ter uma função em cada.

### 3.1 Jogo

| Ação | Teclado + mouse | Teclado só | Gamepad |
|---|---|---|---|
| `mover` | W A S D / setas | setas | Analógico esquerdo (direcional: ver ⚠ D3) |
| `correr` | Shift esquerdo | Shift esquerdo | Gatilho esquerdo |
| `mirar` | Posição do mouse | — | Analógico direito |
| `atacar` | Clique esquerdo | J | Face oeste |
| `forte` | Clique direito (menu de contexto bloqueado só sobre o jogo) | K | Face norte |
| `esquivar` | Espaço | L | Face leste |
| `habilidade_1` | 1 | U | Ombro direito |
| `habilidade_2` | 2 | I | Gatilho direito |
| `habilidade_3` | 3 | O | Ombro esquerdo |
| `item` | Q | H | Direcional ↑ |
| `interagir` | E | E | Face sul |
| `menu` | Esc (+07: alternativa P) | Esc / P | Start |
| `mapa` | ⚠ sem padrão (03: M) | ⚠ sem padrão (03: M) | ⚠ sem padrão (03: Select) |
| `inventario` | B ("bolsa"; `I` já é `habilidade_2` no teclado só) | B | Select ⚠ |
| `missoes` | N | N | Direcional ↓ ⚠ |

### 3.2 Telas e diálogo

| Ação | Teclado + mouse | Teclado só | Gamepad |
|---|---|---|---|
| Mover foco | setas / W A S D; o foco segue o cursor | setas | Analógico esquerdo / direcional |
| `confirmar` | Enter / clique esquerdo | Enter | Face sul |
| `cancelar` | Esc / clique direito / botão "Voltar" (+07: Backspace ⚠) | Esc / Backspace | Face leste |
| `aba_anterior` / `aba_proxima` | Q / E; clique na aba | Q / E | Ombro esquerdo / direito |
| `acao_2` / `acao_3` | F / R; botões na tela | F / R | Face oeste / norte |
| `pular_dialogo` | Segurar Esc ou Backspace; botão "Pular" | idem | Segurar Start |
| Rolar lista longa | Page Up / Page Down; roda | Page Up / Page Down | Analógico direito |

- Zona morta do analógico padrão 20 % (opção 5–40 %); vibração desligável.
- Gamepad desconectado durante o jogo → Pausa automática + `ui_aviso_gamepad_desconectado`.

### 3.3 Teclas do navegador a evitar (não atribuíveis ou com aviso)
| Tecla | Por quê | Regra |
|---|---|---|
| F1–F12 | ajuda, recarregar (F5), tela cheia (F11), ferramentas (F12) | bloqueadas no remapeamento do jogador; F1–F10 só funcionam como atalhos de depuração no build de desenvolvimento (03) |
| Ctrl/Cmd + qualquer, Alt + qualquer | atalhos do navegador e do sistema (fechar aba, nova janela, menu) | modificadores só sozinhos; combinações bloqueadas |
| Alt sozinho | ativa barra de menu em alguns navegadores no Windows | bloqueado |
| Tab | move o foco da página | bloqueado como padrão; permitido com aviso |
| Esc | sai da tela cheia | permitido; sair da tela cheia abre a Pausa |
| Teclas mortas do ABNT2 (´ ~ ^ `) e Ç | comportamento varia por layout | permitidas com aviso; nunca padrão |
| Windows/Command, Print Screen | sistema | bloqueadas |

## 4. Ícones por dispositivo
- Conjunto de ícones **original** (10): teclas com rótulo do layout, botões do mouse e posições do gamepad (face sul/leste/oeste/norte, ombros, gatilhos, analógicos, Start, Select). Sem símbolos de fabricantes no slice; símbolos específicos por marca ficam para depois (risco legal, 01).
- Troca de conjunto: na primeira entrada de outro dispositivo, sem atraso; sem "piscar" (troca no máximo 1 vez por 0,5 s).

## 5. Remapeamento (Opções → Controles)
| # | Regra | Verificável por |
|---|---|---|
| RM1 | Cada ação tem 2 atribuições por dispositivo (principal, alternativa), ambas remapeáveis | Opções |
| RM2 | Ao escolher tecla já usada **no mesmo contexto**: aviso `ui_aviso_conflito_tecla` mostrando a outra ação, com "Trocar" (as duas trocam) ou "Cancelar". **Nenhum conflito silencioso.** Contextos diferentes (jogo × telas) podem repetir tecla | Tentar atribuir J a `forte` |
| RM3 | `confirmar`, `cancelar` e `menu` nunca ficam sem atribuição em nenhum dispositivo | Tentar limpar |
| RM4 | Teclas de §3.3 bloqueadas recusadas com `ui_aviso_tecla_reservada` | Tentar F5 |
| RM5 | "Restaurar padrão" por dispositivo, com confirmação | Opções |
| RM6 | Segurar/alternar escolhível para `correr` e `pular_dialogo` | Opções |
| RM7 | Esperando tecla: Esc (ou "Voltar" no gamepad) cancela; tempo limite de 5 s sem entrada cancela | Opções |
| RM8 | Remapeamento salvo nas configurações (separadas do save), versionado; arquivo inválido → padrão + aviso | Recarregar a página |
| RM9 | HUD, dicas e "Como jogar" mostram a atribuição **atual** | Remapear e abrir "Como jogar" |

## 6. Ajuda e tutorial
- "Como jogar" sempre acessível (menu principal e pausa), com as atribuições atuais.
- Tutorial contextual curto (texto do 02/03): 1 dica por ação na primeira vez que ela é útil; repetível em "Como jogar"; desligável.

## 7. Checklist de acessibilidade (para o 09)

**P** = vem ligado/garantido por padrão · **O** = opção do jogador. Texto das opções em `ui_opt_*`.

### 7.1 Sensibilidade (fotossensibilidade e movimento)
| ID | Requisito | Tipo | Como verificar |
|---|---|---|---|
| A01 | Nenhum flash/clarão acima de **3 por segundo** em qualquer configuração | P | Gravar combate com chefe e efeitos no máximo; contar transições claro/escuro por segundo |
| A02 | Desligar **tremor de tela** (`ui_opt_tremor`) | O | Desligar e acertar/levar golpe forte: câmera parada |
| A03 | Desligar/reduzir **flashes** (`ui_opt_flashes`) | O | Desligado: impacto e vida baixa sem clarão |
| A04 | Reduzir **partículas** (`ui_opt_particulas`: normal/reduzido/mínimo) | O | Mínimo: só partículas que comunicam jogo (telegraph, cura) |
| A05 | Desligar **desfoque de profundidade** (`ui_opt_desfoque`) | O | Desligado: cena inteira nítida |
| A06 | **Reduzir movimento** (`ui_opt_reduzir_movimento`): transições de UI instantâneas, sem deslizar/pulsar | O | Ligar e navegar por todas as telas |
| A07 | Aviso de fotossensibilidade na 1ª execução | P | Limpar dados e abrir |

### 7.2 Visão
| ID | Requisito | Tipo | Como verificar |
|---|---|---|---|
| A10 | Contraste de texto ≥ **4,5:1** (texto pequeno) e ≥ 3:1 (texto grande, ícones, foco, barras) contra o próprio fundo. **Base medida pelo 10 no painel `ui_*`:** texto 16,2:1 · secundário 9,6:1 · borda 3,7:1 (`docs/arte/guia_visual.md` §4). Nenhuma combinação nova pode ficar abaixo do mínimo | P | Medir todas as combinações texto/ícone × fundo em todas as telas e no HUD; comparar com a base |
| A18 | **Reservas de cor:** nenhum elemento de UI/HUD em magenta `perigo_*`; dourado `brilho_*` só no foco da UI (guia §8–§9); erro de UI e vida baixa com forma + ícone + texto + rampa **`alerta_ui`** (`paleta.json` v0.2 do 10: vermelho-brasa `#f44d21`, contorno `#780105`, contraste **≥ 5,1:1** no painel, validada nos 4 modos de visão) | P | Varredura das cores usadas nas telas e no HUD contra a paleta |
| A11 | Todo texto sobre o 3D tem **fundo próprio** (caixa ou faixa); opção de fundo opaco (`ui_opt_fundo_texto`) | P + O | Diálogo e notificações sobre cena clara e escura |
| A12 | **Nenhum significado só por cor**: vida baixa, raridade, estado bom/ruim, missão principal/secundária, habilidade indisponível, item selecionado — todos têm forma, ícone ou texto | P | Ver tudo em escala de cinza |
| A13 | Modo daltônico (`ui_opt_daltonismo`: protanopia, deuteranopia, tritanopia) ajusta cores de UI e telegraph mantendo as formas | O | Simulador de daltonismo em HUD e combate |
| A14 | **Tamanho da UI** (`ui_opt_tamanho_ui`) em escalas inteiras disponíveis na resolução | O | Mudar e conferir margens e zona de ação |
| A15 | **Tamanho do texto** (`ui_opt_tamanho_texto`: normal/grande) independente da UI, sem cortar texto | O | Grande + textos +40 % em todas as telas |
| A16 | Foco sempre visível por **forma + cor** | P | Navegar só com teclado em todas as telas |
| A17 | Telegraph sempre visível: névoa, desfoque, partículas, HUD e primeiro plano nunca o cobrem | P | Combate em cada área com tudo ligado |

### 7.3 Audição
| ID | Requisito | Tipo | Como verificar |
|---|---|---|---|
| A20 | **Legendas** para falas fora da caixa de diálogo e sons narrativos (`ui_opt_legendas`), com nome do falante | O (ligada por padrão) | Cena com fala ambiente |
| A21 | **Indicador visual de sons importantes** (ataque fora da tela, inimigo se aproximando) na borda da tela | O | Inimigo atacando fora da tela, com som mudo |
| A22 | Volumes separados: geral, música, efeitos, ambiente, interface | O | Zerar um por vez |
| A23 | Nenhuma informação de jogo só por som (todo alerta sonoro tem par visual) | P | Jogar o slice sem som |

### 7.4 Controle e movimento
| ID | Requisito | Tipo | Como verificar |
|---|---|---|---|
| A30 | Remapeamento completo (§5) | O | RM1–RM9 |
| A31 | Alternativa a segurar botão (§5 RM6) | O | Correr e pular diálogo em modo alternar |
| A32 | Jogo completo só com teclado e só com gamepad; mouse opcional | P | Terminar o slice com cada um |
| A33 | Nenhum evento de pressionar repetidamente rápido (sem "aperte X várias vezes") | P | Revisão de design |
| A34 | Assistências de combate (06) | — | **Fora do slice** (D-005); multiplicadores já expostos nas fórmulas |

### 7.5 Cognição
| ID | Requisito | Tipo | Como verificar |
|---|---|---|---|
| A40 | Objetivo atual sempre visível (HUD, opção ligada por padrão) e na pausa | P + O | Abrir pausa em qualquer momento |
| A41 | **Pausar a qualquer momento**, inclusive em diálogo e luta com chefe | P | Pausar em cada estado do herói |
| A42 | Tutorial repetível ("Como jogar") | P | Abrir do menu e da pausa |
| A43 | Diálogo sem tempo limite, com velocidade de texto ajustável, avanço manual e histórico | P + O | Deixar diálogo parado 2 min |
| A44 | Nenhum menu com tempo limite | P | Revisão de todas as telas |

### 7.6 Navegador
| ID | Requisito | Tipo | Como verificar |
|---|---|---|---|
| A50 | Redimensionar a janela e zoom do navegador (50–200 %) sem cortar UI nem esticar pixel | P | Redimensionar durante jogo e telas |
| A51 | Pausa automática ao perder foco, trocar de aba ou sair da tela cheia; tempo perdido não é simulado | P | Trocar de aba durante combate |
| A52 | Áudio só começa após o primeiro gesto (tela de título) | P | Abrir a página e não tocar em nada |

### 7.7 Texto e localização
| ID | Requisito | Tipo | Como verificar |
|---|---|---|---|
| A60 | Todo texto por ID (`ui_`/`txt_`); nenhum texto no código; nenhuma frase concatenada | P | Busca no código por texto literal (09/08) |
| A61 | Todo elemento com texto suporta **+40 %** sem cortar ou sobrepor | P | Pseudo-localização +40 % em todas as telas |
| A62 | Fonte com todos os acentos do português (á à â ã é ê í ó ô õ ú ç, maiúsculas e minúsculas) | P | Tela de teste com o alfabeto |

## 8. Divergências com `docs/gameplay.md` §3.1–§3.2 — **D1–D5 aprovadas (D-007)**; entram na v0.2 do gameplay.md (03)
Resolvidas pela D-007: `forte` entra no slice; `habilidade_4` reservada; mira com mouse/analógico é do 03 (§3.3). O 07 adotou os nomes do 03 (`confirmar`/`cancelar`, posições sul/leste/oeste/norte).

| # | Ponto | 03 hoje | Proposta do 07 |
|---|---|---|---|
| D1 | Ações que faltam no §3.1 | — | Incluir `inventario`, `missoes`, `aba_anterior`, `aba_proxima`, `acao_2`, `acao_3`, `pular_dialogo` |
| D2 | `mapa` | M / M / Select | Reservada **sem tecla padrão** (tela fora do slice, D-007); Select do gamepad vai para `inventario` |
| D3 | Direcional do gamepad | move **e** `item` no ↑ (conflito no mesmo contexto) | Em jogo, direcional = atalhos (↑ `item`, ↓ `missoes`) e mover só no analógico; opção "direcional move" para quem prefere (aí os atalhos saem do direcional) |
| D4 | `correr` | só segurar + "correr por padrão" | `correr_modo` = segurar / alternar / sempre (A31) |
| D5 | `cancelar` e `menu` | Esc | Acrescentar Backspace em `cancelar` e P em `menu`: no navegador, Esc em tela cheia só sai da tela cheia |
| — | `inventario` no teclado | (não existe) | **B** ("bolsa"), porque `I` já é `habilidade_2` no esquema só teclado; `missoes` = N. Não é divergência, só registro |
