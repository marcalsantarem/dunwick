# UI de batalha por turnos — M1 (BL-005)

> **Dono:** 15 UI/UX · **Status:** RASCUNHO v0.1 · 2026-10-27 · base: D-028, D-031, D-033; `docs/combate_turnos.md` v0.2 (03); `docs/arte/guia_visual.md` §4/§8 (10); `inventario_telas.md` R1–R11; `controles_acessibilidade.md`.
> Sem stack e sem código. A UI **lê o estado e os eventos do 03**; não decide regra. Tempos em **segundos**, todos em `cfg_ui_batalha` (dados). Textos só por ID (`ui_` interface, `txt_` conteúdo do 02); +40 % de espaço; nada por concatenação.

---

## 1. Layout da tela

Medidas na **referência de arte 960×540** (proposta do 10, [TRAVA 08]); grade de 8 px, margem segura 16 px, escala inteira. Se o 08 fixar 640×360, valem as **proporções** (cada faixa em % da altura) e os painéis encolhem para a grade.

```
┌──────────────────────────────────────────────────────────────────────┐
│ [ORDEM]  ◆Lobo ▸ ◇Edric ▸ ◇Grace ▸ ◆Slime          [Rodada 2]  [2×] │  faixa topo  ≈ 8 %
│                                                                      │
│   inimigos (esq.)                               grupo (dir.)         │
│      ▼ cursor                                                        │
│   [slot 2]                                           [slot 3 reserv.]│  palco 3D   ≈ 62 %
│ [slot 1]   Lobo ▬▬▬▭                                [slot 1] Edric   │  (07/10)
│   [slot 3]                                           [slot 2] Grace  │
│                                                                      │
│ ┌ MENSAGEM / DESCRIÇÃO ───────────────────────────────────────────┐  │  faixa info ≈ 8 %
│ └─────────────────────────────────────────────────────────────────┘  │
│ ┌ COMANDOS ──────┐ ┌ EDRIC ◀ ───────────────┐ ┌ GRACE ────────────┐  │
│ │ ▶ Atacar        │ │ [retr] Vida 100/100 ▬▬ │ │ [retr] Vida 70/70 │  │  faixa base ≈ 22 %
│ │   Habilidade    │ │        Mana  14/14  ▬▬ │ │        Mana 29/29 │  │
│ │   Item          │ │ ícone do comando: ⚔    │ │ ícone: —          │  │
│ │   Defender      │ └────────────────────────┘ └───────────────────┘  │
│ │   Fugir         │ (3º espaço reservado ao grupo de 3, oculto)      │
│ └─────────────────┘                                                   │
└──────────────────────────────────────────────────────────────────────┘
```

| Zona | Conteúdo | Regras |
|---|---|---|
| **Topo** | Barra de ordem (§5), contador de rodada `ui_bat_rodada`, selo de velocidade (1×/2×) | Nunca cobre sprites (palco começa abaixo) |
| **Palco** | Cena 3D do 07; inimigos à esquerda (slots −x), grupo à direita (+x) — posições de `combate_turnos.md` §10.1 | Sobre o palco só: cursor de alvo, nome+barra do alvo em foco, números de dano/cura. Nenhum painel fixo |
| **Info** | Caixa única de **mensagem** (§8) ou **descrição** (§4) | Fundo opaco próprio (A11); 2 linhas máx. |
| **Base** | Menu de comandos (esquerda) + **caixas do grupo** (uma por membro, até 3) | Moldura de madeira escura + linho, cantos de latão (guia §8). Nada de degradê azul |

- **Caixa do membro:** retrato pequeno (§10), nome (`txt_` do 02), **Vida** e **Mana** com número **e** barra (`ui_bat_vida`, `ui_bat_mana`), ícone do comando escolhido na rodada, marcador ◀ de "escolhendo agora".
- **Inimigos não têm caixa fixa:** nome e barra só no alvo em foco (cursor) e por 1,5 s após levar dano (`t_barra_inimigo_visivel`). Barra de inimigo sem número no M1 (decisão de design: suposição, ver final).
- O espaço do 3º membro e do 3º slot inimigo existe no layout desde já (oculto quando vazio).

---

## 2. Fluxo da rodada (o que a UI mostra em cada fase)

```
batalha_iniciou → entrada (t_entrada_batalha) → rodada_iniciou
  → COMANDOS: para cada membro vivo: comando_pedido → menu → [submenu] → alvo → comando_escolhido
      (cancelar no 1º nível volta ao membro anterior; no Edric não faz nada)
  → execucao_iniciou (menu some; ordem final na barra)
  → por ato: turno_iniciou → ato_executado → dano/curou/... → ato_apresentado
  → rodada_terminou → próxima rodada | venceu / perdeu / fugiu / empate → batalha_terminou
```

- Durante a **execução** o menu fica **oculto**; as caixas do grupo continuam visíveis e animam (`t_barra_vida`).
- Entrada do jogador na execução: só **acelerar** (segurar `confirmar` = 2× enquanto segura) e **pausa** (`menu`). Nenhuma escolha.

---

## 3. Menu de comandos

| Ordem | ID do texto | Ícone (04) | Abre | Desabilitado quando |
|---|---|---|---|---|
| 1 | `ui_bat_cmd_atacar` | espada | seleção de alvo (inimigo) | nunca |
| 2 | `ui_bat_cmd_habilidade` | estrela/runa | submenu de habilidades | ator sem nenhuma habilidade usável (mana) |
| 3 | `ui_bat_cmd_item` | bolsa | submenu de itens | nenhum item com `uso_batalha` em estoque |
| 4 | `ui_bat_cmd_defender` | escudo | confirma direto (alvo `si`) | nunca |
| 5 | `ui_bat_cmd_fugir` | bota | confirma direto | `pode_fugir` = não (chefe) |

- A lista de comandos e quais estão habilitados vem de `comando_pedido` (a UI não calcula).
- **Desabilitado:** texto em `ui` secundário **+ ícone de cadeado + motivo** na caixa de descrição (`ui_bat_motivo_sem_mana`, `ui_bat_motivo_sem_item`, `ui_bat_motivo_nao_foge`). Nunca só cor (A12). Confirmar num desabilitado: som `ui_erro` e o motivo pisca 1× (≤ 1 Hz).
- **Foco:** moldura dourada `brilho_*` + seta ▶ (forma + cor). Foco inicial: último comando usado por aquele membro (na 1ª rodada, Atacar).
- **Submenus (Habilidade / Item):** lista ao lado do menu, mesma moldura. Linha de habilidade: ícone · nome (`txt_skill_*`) · custo `ui_bat_custo_mana` (`{custo}`). Linha de item: ícone · nome (`txt_item_*`) · `ui_bat_qtd` (`{qtd}`). Item sem mana/estoque: cadeado + motivo.
- **Atalhos de teclado:** 1–5 escolhem o comando direto; no submenu, 1–9 escolhem a linha.

---

## 4. Caixa de descrição

- Mostra a descrição do item em foco: comando (`ui_bat_desc_*`), habilidade (`txt_skill_*_desc`) ou item (`txt_item_*_desc`), + linha de dados: custo, alvo (`ui_bat_alvo_inimigo_1`, `ui_bat_alvo_aliado_1`, `ui_bat_alvo_si`, `ui_bat_alvo_todos`…).
- Em seleção de alvo: nome do alvo + `ui_bat_vida_alvo` (`{vida}`/`{vida_max}` para aliados; barra para inimigos).
- Fora da fase de comandos, a mesma caixa vira a **caixa de mensagens** (§8).

---

## 5. Ordem do turno (barra no topo)

- **Na fase de comandos:** mostra a **previsão** com os comandos já escolhidos (o 03 precisa expor a ordem prevista; ver pedidos) e inimigos como ◆ sem a ação. Membros ainda sem comando aparecem com "?".
- **Em `execucao_iniciou`:** trava a ordem; o ator de `turno_iniciou` ganha destaque (moldura dourada + seta ▼); quem já agiu fica esmaecido **com ✓**; quem caiu, riscado **com ícone de caído** (`ato_cancelado` mostra o ✕).
- Cada marco = retrato pequeno 24×24 (§10) + forma do lado: **losango** = inimigo, **círculo** = grupo (não depende de cor). Ícone de escudo sobre quem escolheu Defender (explica a prioridade).

---

## 6. Seleção de alvo

| Dispositivo | Como |
|---|---|
| Teclado | ←/→ (ou ↑/↓) troca o alvo entre os válidos, na ordem dos slots; `confirmar` (Enter/Espaço) escolhe; `cancelar` (Esc/Backspace) volta ao menu |
| Mouse | Passar sobre o sprite ou sobre a caixa do aliado = foco; clique esquerdo = escolhe; clique direito = volta. Área de clique ≥ 1 tile em volta do sprite (`raio_clique_alvo_tiles` 0,6, como na exploração) |
| Gamepad | Direcional/analógico troca; face sul escolhe; face leste volta |

- **Cursor:** mão/seta de pergaminho **acima da cabeça** do alvo + contorno dourado no sprite (forma + cor). Nunca magenta.
- Foco inicial: inimigo de menor slot vivo (atacar); para cura, o aliado com **menor fração de vida**; para `si`, pula a seleção.
- Alvos inválidos (caídos, outro lado) não recebem foco; `aliados_todos`/`inimigos_todos` (futuro): cursor sobre todos ao mesmo tempo.
- Mouse direto no palco também vale para **Atacar**: com o menu no 1º nível, clicar num inimigo = Atacar nele (atalho; R11 continua: clique em UI nunca vaza para o palco).

---

## 7. Números de dano e cura

| Caso | Visual | Texto |
|---|---|---|
| Dano normal | número em linho claro com contorno escuro, sobe 0,5 tile e some (`t_numero_dano` 0,8) | só o número `{valor}` (`ui_bat_num_dano`) |
| Dano em `fraco` | número maior + ícone de seta ↑ + rótulo `ui_bat_efetivo_fraco` ("Ponto fraco!") | idem |
| Dano em `resistente` | número menor + ícone de escudo rachado + `ui_bat_efetivo_resiste` | idem |
| Alvo `defendendo` | ícone de escudo ao lado do número | — |
| Cura | número em verde-musgo claro **com sinal +** e ícone de folha | `ui_bat_num_cura` (`+{valor}`) |
| Mana gasta | número pequeno na caixa do membro, sem flutuar no palco | `ui_bat_num_mana` |

- Sinal, ícone e tamanho distinguem os tipos **sem depender de cor** (A12). Nunca vermelho-brasa (reservado a alerta) nem magenta.
- Números sobem **para cima do sprite**, nunca sobre a caixa do grupo nem sobre a barra de ordem. Vários números no mesmo alvo empilham com deslocamento de 8 px.
- O número aparece no **impacto** (evento de quadro `impacto`/`solta_efeito` da pose), não no início do ato.

---

## 8. Mensagens (caixa de info)

Uma mensagem por vez, 1–2 linhas, fila curta; cada uma fica `t_mensagem` (1,2 s; 0,6 s em 2×) ou até `confirmar`.

| Evento | ID | Exemplo de variáveis |
|---|---|---|
| `batalha_iniciou` | `ui_bat_msg_inicio` | `{nome_inimigo_lista}` vem pronto do 02 por encontro (`txt_enc_*_inicio`), nunca montado |
| `ato_executado` (habilidade/item) | `ui_bat_msg_usa_habilidade`, `ui_bat_msg_usa_item` | `{nome_ator}`, `{nome_habilidade}` / `{nome_item}` |
| `defendeu` | `ui_bat_msg_defende` | `{nome_ator}` |
| `fuga_tentada` | `ui_bat_msg_fuga_ok` / `ui_bat_msg_fuga_falhou` | `{nome_ator}` |
| `ato_falhou` | `ui_bat_msg_falhou_{motivo}` | `{nome_ator}` |
| `caiu` | `ui_bat_msg_caiu` | `{nome_alvo}` |
| `skill_slime_balanco` (`tipo` = `espera`) | `txt_skill_slime_balanco_msg` (02) | — |

Ataque básico **não** gera mensagem (o número basta). Com "reduzir texto" desligado, a mensagem nunca acelera além de 0,6 s.

---

## 9. Telas de resultado

### 9.1 Vitória — `ui_tela_bat_vitoria` (evento `venceu`, após `t_vitoria`)
- Painel central (pergaminho): título `ui_bat_vitoria_titulo`; linhas `ui_bat_ganhou_xp` (`{xp}`), `ui_bat_ganhou_ouro` (`{ouro}`); lista de itens com ícone e `ui_bat_ganhou_item` (`{nome_item}`, `{qtd}`); por membro: barra de XP enchendo e, se subiu, `ui_bat_subiu_nivel` (`{nome_ator}`, `{nivel}`) com selo e lista dos atributos que subiram.
- Membro caído: linha `ui_bat_sem_xp_caido` (explica o 0).
- `confirmar` pula a animação da contagem; 2º `confirmar` fecha → `batalha_terminou`. Sem "voltar" (não há para onde); a dica mostra o botão de continuar.

### 9.2 Derrota — `ui_tela_bat_derrota` (evento `perdeu`)
- Escurece o palco (sem flash), título `ui_bat_derrota_titulo`, e abre **`ui_tela_game_over`** do inventário (§2.10): Tentar de novo (foco inicial) · Carregar · Menu.

### 9.3 Fuga e empate
- `fugiu`: mensagem `ui_bat_msg_fuga_ok` e saída direta (`t_fuga`), sem tela.
- `empate` (rodadas_max): mensagem `ui_bat_msg_empate` e saída sem recompensa.

---

## 10. Estados × eventos do 03

| Evento | Barra de ordem | Menu | Caixas do grupo | Palco (UI) | Info |
|---|---|---|---|---|---|
| `batalha_iniciou` | monta vazia | oculto | montam com valores iniciais | — | msg de início |
| `rodada_iniciou` | previsão `?` | — | limpa ícone de comando | — | — |
| `comando_pedido` | — | **abre** para o ator, habilitados conforme evento | ◀ no ator | — | descrição |
| `comando_escolhido` | atualiza previsão | avança ao próximo membro | ícone do comando | — | — |
| `execucao_iniciou` | trava ordem final | **fecha** | — | cursor some | — |
| `turno_iniciou` | destaca ator | — | brilho na caixa do ator (se grupo) | — | — |
| `ato_executado` | — | — | — | — | msg (se habilidade/item/defender) |
| `dano` | — | — | — | número + efetividade | — |
| `curou` | — | — | — | número + | — |
| `mana_gasta` | — | — | número de mana | — | — |
| `item_usado` | — | — | — | — | (já na msg) |
| `defendeu` | escudo no marco | — | ícone escudo | — | msg |
| `fuga_tentada` | — | — | — | — | msg ok/falhou |
| `ato_falhou` | ✕ no marco | — | — | — | msg do motivo |
| `ato_cancelado` | ✕ no marco | — | — | — | — |
| `caiu` | marco riscado | — | caixa: estado **Caído** (ícone + texto `ui_bat_estado_caido`, barra vazia) | barra do inimigo some | msg |
| `vida_mudou` | — | — | barra anima `t_barra_vida`; **vida baixa** ≤ 25 %: `alerta_ui` + coração rachado + texto `ui_bat_vida_baixa`, pulso ≤ 1 Hz | barra do alvo | — |
| `mana_mudou` | — | — | barra de mana anima | — | — |
| `fase_mudou` | — | — | — | — (cena do 07/10) | msg do 02 (chefe, futuro) |
| `rodada_terminou` | limpa ✓ e escudos | — | limpa ícone de defender | — | — |
| `venceu` | some | — | — | — | → tela 9.1 |
| `perdeu` | some | — | — | — | → tela 9.2 |
| `fugiu` / `empate` | some | — | — | — | msg → saída |
| `batalha_terminou` | — | — | — | — | UI desmonta; volta ao HUD de exploração |

A UI sinaliza `ato_apresentado` só quando número, barras e mensagem do ato terminaram (respeitando `velocidade_batalha`).

---

## 11. Controles na batalha

| Ação lógica | Teclado | Mouse | Gamepad |
|---|---|---|---|
| Mover foco | setas / WASD | foco segue o cursor | direcional / analógico esq. |
| `confirmar` | Enter / Espaço | clique esquerdo | face sul |
| `cancelar` | Esc / Backspace | clique direito / botão "Voltar" (`ui_voltar`) | face leste |
| Comando direto | 1–5 | — | — |
| Acelerar (segurar) | segurar Espaço na execução | segurar clique esquerdo | segurar face sul |
| Velocidade 1×/2× (alterna) | Tab | clique no selo | face oeste |
| Pausa | P (Esc só pausa fora de menu aberto) | botão de pausa no topo | Start |

- Batalha **jogável só com mouse, só com teclado e só com gamepad** (checklist do 15).
- Selos de botão do último dispositivo usado na barra de comandos (R7).

---

## 12. Acessibilidade (lista para o 09)

| ID | Requisito |
|---|---|
| B01 | Nenhuma informação só por cor: comando desabilitado (cadeado + motivo), vida baixa (ícone + texto + pulso), lado na ordem (losango/círculo), tipo de número (sinal + ícone), alvo (cursor + contorno) |
| B02 | Flashes ≤ 3/s; impacto e vida baixa sem clarão com `ui_opt_flashes` desligado; tremor da UI desligável |
| B03 | Contraste ≥ 4,5:1 no texto dos painéis; números sobre o 3D com contorno de 1 px de arte + opção de fundo opaco |
| B04 | `velocidade_batalha` 1×/2× e acelerar segurando; mensagens nunca abaixo de 0,6 s; nenhum tempo limite para escolher comando |
| B05 | Reduzir movimento: barras e números sem animação (valor final direto), transições instantâneas |
| B06 | Tamanho de texto e de UI independentes; todos os rótulos com +40 % de espaço (Habilidade/Defender são os mais longos) |
| B07 | Foco sempre visível (forma + cor) e preservado ao voltar de submenu |
| B08 | Todo submenu e seleção de alvo têm voltar; derrota e vitória têm botão claro de continuar |
| B09 | Números e cursor nunca cobrem a barra de ordem nem as caixas do grupo |

---

## 13. IDs de texto desta versão

`ui_bat_rodada` (`{n}`) · `ui_bat_vida` · `ui_bat_mana` · `ui_bat_cmd_atacar|habilidade|item|defender|fugir` · `ui_bat_desc_atacar|habilidade|item|defender|fugir` · `ui_bat_motivo_sem_mana|sem_item|nao_foge` · `ui_bat_custo_mana` (`{custo}`) · `ui_bat_qtd` (`{qtd}`) · `ui_bat_alvo_inimigo_1|aliado_1|si|todos` · `ui_bat_vida_alvo` · `ui_bat_num_dano|num_cura|num_mana` · `ui_bat_efetivo_fraco|efetivo_resiste` · `ui_bat_msg_inicio|usa_habilidade|usa_item|defende|fuga_ok|fuga_falhou|falhou_{motivo}|caiu|empate` · `ui_bat_estado_caido` · `ui_bat_vida_baixa` · `ui_bat_vitoria_titulo` · `ui_bat_ganhou_xp|ganhou_ouro|ganhou_item` · `ui_bat_subiu_nivel` · `ui_bat_sem_xp_caido` · `ui_bat_derrota_titulo` · `ui_bat_velocidade` (`{vel}`) · `ui_bat_pausa`.
Do 02 (`txt_`): nomes de heróis, inimigos, habilidades e itens + `_desc`; `txt_enc_*_inicio`; `txt_skill_slime_balanco_msg`.

---

## 14. Pedidos (via Produtor)

**Ao 04 (ícones e retratos, 32 px/tile, gerados por código):**
- 5 ícones de comando 16×16 (espada, runa, bolsa, escudo, bota) + estados (normal / desabilitado com cadeado).
- Ícones 16×16: cadeado, escudo, escudo rachado, seta ↑, folha (cura), coração rachado, ✓, ✕, caído, "?".
- Ícones de habilidade e item do M1 16×16: `skill_golpe_firme`, `skill_cura`, `item_pocao`.
- **Retratos pequenos** de batalha: 32×32 (caixa do grupo) e 24×24 (barra de ordem) para Edric, Grace, Slime, Lobo — recorte do rosto/cabeça do sprite, sem retrato pintado (o retrato grande é da fase 2).
- Cursor de alvo (mão/seta de pergaminho) 16×16 com 2 quadros.

**Ao 10:** aprovar o item-modelo **painel de comandos + caixa de membro** (moldura madeira/linho/latão, foco dourado); cor do número de dano (linho claro) e de cura (verde-musgo claro) dentro da paleta; fonte em pixel e tamanhos; regra de vida baixa (`alerta_ui`) nas caixas; transições de painel (≤ 150 ms).

**Ao 03:** expor a **ordem prevista** durante a fase de comandos (ou a UI calcula com a mesma função pura do 03 — preferível uma função única); `comando_pedido` com o **motivo** de cada comando desabilitado; confirmar que `ato_apresentado` é o sinal da UI para liberar o próximo ato.

**Ao 05:** sons `ui_` de foco, confirmar, cancelar, erro, contagem de XP, subir de nível.

**Ao 02:** nomes e descrições (`txt_`) e as frases de início de cada encontro.

**Ao 08:** referência de resolução (960×540 ou 640×360) para fechar as medidas; `cfg_ui_batalha` no esquema de config.
