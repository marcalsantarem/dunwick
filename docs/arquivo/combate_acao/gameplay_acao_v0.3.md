# Gameplay

> **Status:** RASCUNHO v0.3 (BRF-003; D-025: câmera isométrica e controles à Diablo) · **Dono:** 03 Jogabilidade · **Data:** 2026-10-24
> Sem stack: nada aqui nomeia ferramenta. Formato final dos dados = ADR-001 do 08.
> **Todos os valores são iniciais e devem ser ajustados em playtest.** As tabelas são a especificação do que vai para `data/`; o texto só referencia chaves das tabelas.
> Alinhado (v0.2): fórmulas e métricas do 06 (`docs/sistemas/formulas.md`, `docs/niveis/metricas.md`, D-009), controles do 07 (`docs/ui/controles_acessibilidade.md`), arte/VFX do 10 (`docs/arte/guia_visual.md` §9 e A1), critérios M1 do 09 (`docs/qa/criterios_marcos.md`), decisões D-007.
> **v0.3 (D-025): só mudaram câmera isométrica, movimento/mira no plano isométrico, entrada à Diablo (mouse) e ordem de desenho/oclusão** (§0, §3, §4.1, §4.2, §4.6, §5.2, §8, §10, §11, §12, §13). Combate, fórmulas, fôlego/mana, golpe forte, telegraph, sem crítico e o resto da v0.2 ficam como estavam.
> Pendente: laço/entrada/formatos e câmera com o 08 (ADR-002), sprites/visual com 04/10, premissa/mundo do 02. Ver §12.

Unidades: distância em **tiles** (1 tile = 1 unidade do mundo = 32 px de arte), tempo em **segundos** ou em **quadros a 60 Hz**. Ângulos em graus, medidos no plano do chão (x, z). **A lógica não muda com a câmera:** o jogo acontece no plano do chão; a tela é uma projeção isométrica fixa dele (08/10). Densidade de pixels por tile em revisão (08/10); em lógica, 1 tile = 1 unidade do mundo.

---

## 0. Parâmetros globais (dados)

| Chave | Valor | Observação |
|---|---|---|
| `passo_logico_hz` | 60 | Lógica em passo fixo; desenho interpolado (08) |
| `direcoes_movimento` | 8 (teclado) · livre, 360° (mouse e analógico) | Velocidade igual em todas as direções (ver §3.4 e §4.1) |
| `esquema_controle` | mouse | Opções: `mouse` (padrão, à Diablo), `teclado` (v0.2), gamepad automático ao detectar (§3.2) |
| `direcoes_sprite` | 4 | S, N, L desenhadas; O espelhada (04). **Em revisão 04/10:** a isometria pede 8 (5 + espelho); ver §4.6 |
| `buffer_entrada_quadros` | 7 | Faixa permitida 6–8 |
| `zona_morta_analogico` | 0,20 | Fração do curso do analógico; opção 0,05–0,40 (07) |
| `correr_modo` | segurar | Opções: `segurar`, `alternar`, `sempre` (§3.4) |
| `direcional_move` | não | Opção de acessibilidade (§3.2) |
| `resposta_entrada_max_ticks` | 1 | Com herói livre, ação começa no tick seguinte à entrada (M1-10) |
| `combo_leve_golpes` | 3 | `atk_hero_leve_1` → `_2` → `_3` |
| `habilidades_slots` | 3 | Slice usa 2–3 (D-004); slot 4 reservado e desligado |
| `dificuldade` | normal | Só Normal no slice (D-005) |
| `mult_dano_causado` / `mult_dano_recebido` | 1,0 / 1,0 | Dados de dificuldade do 06 (`formulas.md` §6); entram no passo 4a do pipeline |
| `mult_janela_esquiva` / `mult_aviso_inimigo` | 1,0 / 1,0 | Agem em §4.2 (passo 3) e §6.3 (duração do aviso) |

---

## 1. Pilares

| Pilar | O que significa na prática | Como verificar |
|---|---|---|
| **Preciso** | Golpe que parece acertar acerta; caixas em dados, independentes do sprite | Teste de alcance em todas as direções (§13) |
| **Responsivo** | Entrada vira ação no passo seguinte (≤ `resposta_entrada_max_ticks`) ou fica no buffer; pouca inércia | Teste de buffer; M1-10; playtest "lento/pesado?" |
| **Justo** | Todo golpe inimigo tem aviso legível; esquiva e timing valem mais que números | Teste de justiça: aviso ≥ mínimo da §6.3 |

Os pilares derivam do pilar 1 da Bíblia ("Combate preciso"). Se a premissa do usuário mudar o tom, revisar.

---

## 2. Loop

| Escala | O que o jogador faz | Decisão principal |
|---|---|---|
| ~30 s | Lutar contra um grupo ou explorar uma tela: aproximar, ler aviso, esquivar, punir, usar habilidade | Quando atacar e quando esquivar |
| ~5 min | Atravessar uma área, cumprir um passo de missão, abrir baú, achar atalho, voltar a um ponto de salvamento | Seguir em frente ou curar/voltar |
| Sessão | Completar uma região ou masmorra e enfrentar o chefe | Preparação (itens, habilidades) e rota |

Conteúdo concreto do loop (áreas, missões) depende do mundo do **02** — fora deste rascunho.

---

## 3. Controles e entrada

### 3.1 Ações lógicas
O código só conhece ações; teclas e botões vêm de dados e são remapeáveis. Nomes unificados com o 07 (`docs/ui/controles_acessibilidade.md` §2; divergências D1–D5 aprovadas pelo Produtor). Contextos **jogo** e **telas** são separados: a mesma tecla pode ter uma função em cada.

| Ação | Contexto | Tipo | Buffer | Descrição |
|---|---|---|---|---|
| `mover` | jogo | eixo 2D | — | Direção no chão (teclas/analógico). Mouse: ver `mover_para` |
| `mover_para` | jogo | clique (segurar) | — | **Esquema mouse:** anda até o ponto do chão sob o cursor; segurar acompanha o cursor (§3.5) |
| `acao_principal` | jogo | clique (segurar) | sim | **Esquema mouse (clique esquerdo), contextual:** sobre inimigo = atacar (anda até o alcance e bate; segurar mantém o combo); sobre NPC/objeto = interagir; no chão = `mover_para` |
| `parar_no_lugar` | jogo | segurar | — | Com `acao_principal`: ataca na direção do cursor **sem andar** |
| `correr` | jogo | segurar / alternar | — | Usa `vel_correr`; comportamento conforme `correr_modo` (§3.4) |
| `mirar` | jogo | eixo 2D | — | Direção dos golpes e habilidades: cursor (esquema mouse), analógico direito ou movimento (§3.3) |
| `atacar` | jogo | apertar | sim | Ataque leve / avança o combo |
| `forte` | jogo | apertar | sim | Ataque forte |
| `esquivar` | jogo | apertar | sim | Rolamento com invencibilidade |
| `habilidade_1..3` | jogo | apertar | sim | Habilidades equipadas (`habilidade_4` reservada, D-007) |
| `item` | jogo | apertar | não | Usa o item rápido |
| `interagir` | jogo, diálogo | apertar | não | Falar, abrir, ativar (§7); também avança diálogo |
| `menu` | jogo, telas | apertar | não | Abre/fecha a Pausa (telas do 07) |
| `inventario` | jogo | apertar | não | Atalho direto para o Inventário |
| `missoes` | jogo | apertar | não | Atalho direto para Missões |
| `mapa` | — | — | — | Reservada, **sem tecla padrão** (tela fora do slice, D-007) |
| `confirmar` / `cancelar` | telas, diálogo | apertar | não | Nunca ficam sem atribuição |
| `aba_anterior` / `aba_proxima` | telas | apertar | não | Trocar aba |
| `acao_2` / `acao_3` | telas | apertar | não | Ação secundária/terciária da tela |
| `pular_dialogo` | diálogo | segurar / alternar | não | Pula a fala/cena (02 define o que pode ser pulado) |

Em telas, diálogo e Pausa a simulação não recebe ações de jogo; buffer de jogo é esvaziado ao abrir uma tela.

### 3.2 Mapeamento padrão por dispositivo
Gamepad descrito por **posição** (genérico, sem marca). Dois esquemas (`esquema_controle`): **`mouse`** (padrão, D-025: "ação com mouse", à Diablo) e **`teclado`** (o da v0.2, que também serve ao gamepad). Teclado e gamepad continuam completos.

**Jogo — esquema `mouse` (padrão)**
| Ação | Teclado + mouse |
|---|---|
| `acao_principal` / `mover_para` | **Clique esquerdo** (segurar repete): chão = anda; inimigo = ataca; NPC/objeto = interage |
| `mover` | W A S D / setas (continuam valendo junto com o clique; cancelam o destino do clique) |
| `parar_no_lugar` | Shift (segurar) |
| `forte` | **Clique direito**: golpe forte na direção do cursor (não repete ao segurar) |
| `esquivar` | **Espaço**: rolamento na direção do cursor (sem cursor válido, na direção do movimento) |
| `habilidade_1..3` | **1 · 2 · 3**: habilidades, usadas na direção/alvo do cursor |
| `item` | Q |
| `interagir` | E (ou `acao_principal` sobre o objeto) |
| `menu` · `inventario` · `missoes` | Esc / P · B · N |
| `mirar` | Cursor (sempre ativo; sem tecla) |
| `correr` | Não há: no esquema `mouse` o herói **corre** ao seguir o clique (`correr_modo` = `sempre`) |

**Jogo — esquema `teclado` (v0.2; também o do gamepad)**
| Ação | Teclado + mouse (esquema `teclado`: o clique esquerdo ataca, não anda) | Teclado só (alternativo) | Gamepad |
|---|---|---|---|
| `mover` | W A S D / setas | setas | Analógico esquerdo (direcional só com a opção `direcional_move`) |
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
| `menu` | Esc / P | Esc / P | Start |
| `inventario` | B | B | Select |
| `missoes` | N | N | Direcional ↓ |
| `mapa` | — | — | — |

**Telas e diálogo** (detalhe no 07 §3.2)
| Ação | Teclado + mouse | Teclado só | Gamepad |
|---|---|---|---|
| `confirmar` | Enter / clique esquerdo | Enter | Face sul |
| `cancelar` | Esc / Backspace / clique direito | Esc / Backspace | Face leste |
| `aba_anterior` / `aba_proxima` | Q / E | Q / E | Ombro esquerdo / direito |
| `acao_2` / `acao_3` | F / R | F / R | Face oeste / norte |
| `pular_dialogo` | Segurar Esc ou Backspace | idem | Segurar Start |

Regras:
- Nenhuma ação essencial depende só do mouse: o esquema `teclado`/gamepad cobre tudo (mover, mirar, atacar, forte, esquivar, habilidades, interagir). Mudar de dispositivo no meio do jogo funciona sem menu (troca os ícones de dica e o esquema ativo — 07).
- Clique que cai em UI (HUD, menu, diálogo) **não** age no mundo. Menu de contexto do navegador bloqueado só sobre o jogo.
- Opção `clique_mover_ativo` (sim): desligar mantém a mira por cursor e `acao_principal` só ataca/interage, sem andar (acessibilidade e quem prefere WASD).
- **Direcional do gamepad = atalhos** (D3, aprovado): ↑ `item`, ↓ `missoes`; movimento só no analógico. Motivo: o herói anda em 8 direções com velocidade contínua, o que o analógico cobre, e atalhos no direcional não exigem soltar o analógico. **Acessibilidade:** com a opção `direcional_move` ligada, o direcional move e os atalhos saem dele (ficam só no remapeamento).
- Esc em tela cheia, no navegador, só sai da tela cheia; por isso `menu` também tem P e `cancelar` também tem Backspace (D5). Sair da tela cheia abre a Pausa (07).
- Gamepad desconectado durante o jogo: todas as ações dele são soltas no mesmo tick (herói para) e o jogo abre a Pausa com aviso (07); reconectar volta sem menu; teclado funciona o tempo todo (M1-09).
- O jogo não captura atalhos do navegador (F5, F11, Ctrl+W) (M1-07). Teclas F são bloqueadas no remapeamento do jogador (07 §3.3); as teclas de debug (§10) só existem em build de desenvolvimento.

**Ações exigidas no M1** (lista para o M1-07/M1-08): `mover` (8 direções), `mover_para`, `acao_principal`, `parar_no_lugar`, `mirar` (cursor), `correr`, `atacar`, `forte`, `esquivar` e as ações de debug da §10. As demais existem nos dados, mas sem efeito no M1.

### 3.3 Mira e alvo assistido
| Chave | Valor | Observação |
|---|---|---|
| `mira_modo` | por esquema | `cursor` (esquema mouse, padrão), `movimento` (teclado), `analogico` (gamepad, analógico direito). Troca sozinho com o último dispositivo usado |
| `mira_cursor_zona_morta_tiles` | 0,4 | Cursor mais perto que isto do herói mantém a direção anterior |
| `assistencia_alcance_tiles` | 2,0 | Só em `movimento` e `analogico`: procura alvos até esta distância |
| `assistencia_correcao_max_graus` | 15 | Gira o golpe corpo a corpo no máximo isto em direção ao alvo |

- **Cursor → mundo:** o ponto do cursor é projetado no plano do chão (x, z); a direção da mira é do herói a esse ponto. O ângulo é **contínuo** (qualquer ângulo, não 8): o setor, a linha e a investida giram junto, e o sprite usa a direção desenhada mais próxima (§4.6). Sem assistência de ângulo com o cursor (o jogador já mira).
- Em `movimento`/`analogico`, sem alvo dentro do alcance e do ângulo, o golpe sai na direção atual, sem correção.
- Habilidades: `skill_giro` ignora a mira (círculo); `skill_disparo` e `skill_investida` seguem o cursor.

### 3.4 Buffer e leitura de entrada
- `correr_modo` (opção, D4): `segurar` (padrão) — corre enquanto segura; `alternar` — um aperto liga/desliga, e parar de mover desliga; `sempre` — corre sempre e segurar `correr` faz andar.
- Entradas lidas **no início de cada passo lógico**; apertos que ocorrem entre passos não se perdem (fila — pergunta ao 08, §12.2).
- Ação com buffer = guardada por `buffer_entrada_quadros`; executa no primeiro quadro em que o estado permite. Expira depois disso.
- Se houver mais de uma no buffer, vale a **mais recente**; empate no mesmo quadro: `esquivar` > `habilidade_n` > `forte` > `atacar`.
- Analógico: abaixo de `zona_morta_analogico` = parado; acima, a direção é **livre** (360°). Só o teclado gera 8 direções. Os testes de alcance continuam nas 8 direções mais 3 ângulos arbitrários.

### 3.5 Clicar para mover e atacar (esquema `mouse`)
| Chave | Valor | Observação |
|---|---|---|
| `clique_chegada_tiles` | 0,15 | Chega ao destino quando a distância fica menor que isto |
| `clique_fila_quadros` | 12 | Clique feito durante golpe, esquiva ou dano fica guardado (destino ou ataque) por este tempo e depois é descartado |
| `clique_alvo_margem_px` | 12 | Margem de clique em volta do inimigo na tela (hurtbox projetada) |
| `caminho_modo` | `reta_deslizando` | Opções: `reta_deslizando`, `a_estrela` (grade de 0,5 tile, replaneja a cada 30 q) |

- **Alvo sob o cursor, por prioridade:** UI > inimigo (hurtbox projetada) > objeto/NPC interativo > chão. Objetos decorativos **nunca** capturam clique (um inimigo atrás de uma casa continua clicável, §8.4).
- **Clique no chão:** o herói anda (corre) até o ponto em linha reta com deslizamento; segurar o botão faz o destino acompanhar o cursor. W A S D, analógico, esquiva e dano cancelam o destino.
- **Clique em inimigo:** anda até `alcance − 0,1` e bate; segurar mantém o combo (a fila é realimentada); se o alvo morre ou some, para. Com `parar_no_lugar` (Shift) bate na direção do cursor sem andar, mesmo sem alvo.
- **Clique em NPC/objeto:** anda até `raio_interacao_tiles` e interage; se algo bloqueia ou o alvo some, para.
- **Custo de caminho:** `reta_deslizando` é de custo **baixo** (sem busca; o herói pode ficar preso em concavidades, e o mapa evita becos côncavos entre os pontos de interesse). `a_estrela` é custo **médio** e entra só se o playtest mostrar herói preso. **M1 usa `reta_deslizando`.**
- Feedback: marcador de destino no chão (10; nunca magenta, que é perigo), contorno e barra de vida do inimigo sob o cursor, e cursor de espada/mão (07).

---

## 4. Parâmetros do herói (dados)

ID provisório do herói: `hero_principal` **[aguarda 02]**. Arquétipo provisório: espada + esquiva + 2–3 habilidades, sem vocações (D-004, D-006).

### 4.1 Movimento
| Chave | Valor | Equivalente | Origem |
|---|---|---|---|
| `vel_andar` | 3,5 tiles/s | — | §6.1 do 03 |
| `vel_correr` | 6,0 tiles/s | — | §6.1 do 03 |
| `aceleracao_s` | 0,06 s | ≈ 4 quadros até vel. máxima | §6.1 |
| `freada_s` | 0,05 s | ≈ 3 quadros até parar | §6.1 |
| `giro_instantaneo` | sim | Virar não tem custo de tempo | Sensação |

Regras de movimento:
- **Diagonal normalizada:** módulo da velocidade igual em todas as direções (as 8 do teclado e as livres do mouse/analógico).
- **W A S D seguem a tela, não os eixos do mundo:** W vai para o topo da tela, que na isometria é uma diagonal do mundo; as 8 direções do teclado são as 8 da tela. A velocidade é no **mundo**, então na tela o deslocamento vertical parece cerca de metade do horizontal (2:1). Se incomodar, ajusta-se `vel_andar`/`vel_correr`, nunca a projeção.
- **Deslizar em paredes:** componente de velocidade paralela à parede é mantida; só a normal é removida.
- **Sem pulo livre** no slice; desníveis só por rampas e escadas (métricas do 06).
- **Pés não deslizam:** velocidade e ciclo de caminhada do sprite precisam casar (§4.5).
- Direção do sprite = direção do movimento; durante ataque, direção da mira. Mapeamento na §4.6.

### 4.2 Esquiva
| Chave | Valor | Equivalente | Origem |
|---|---|---|---|
| `esquiva_distancia_tiles` | 3,0 | — | §6.1 |
| `esquiva_duracao_quadros` | 18 | 0,3 s | §6.1 |
| `esquiva_invencivel_inicio` | 2 | quadro da esquiva | §6.1 |
| `esquiva_invencivel_base_quadros` | 9 | tamanho da janela em Normal | §6.1 |
| `esquiva_invencivel_fim` | derivado = 10 | `inicio + arred(base × mult_janela_esquiva) − 1`; piso de janela 4 q, teto `esquiva_duracao_quadros` | 06 `formulas.md` §6.2 (J1–J4) |
| `esquiva_recarga_quadros` | 24 | 0,4 s, conta após o fim da esquiva | §6.1 |
| `esquiva_direcao` | esquema `mouse`: direção do cursor (sem cursor válido, a do movimento); `teclado`/gamepad: entrada atual, e sem entrada a direção do sprite | — | D-025 |
| `esquiva_custo` | 25 | **fôlego**, debitado no 1º quadro da esquiva | D-009 / `formulas.md` §3.3 |

A esquiva atravessa a hurtbox de inimigos (pushbox entre personagens desligada durante a esquiva), mas não atravessa paredes.

### 4.3 Caixas do herói (confirmadas em `docs/niveis/metricas.md` §2)
| Chave | Valor | Observação |
|---|---|---|
| `pushbox_raio_tiles` | 0,35 | Círculo no chão (confirmado 06) |
| `hurtbox_raio_tiles` | 0,30 | Menor que o visual (regra §7.1.3 do 03) |
| `hurtbox_altura_tiles` | 0,0 – 1,4 | Faixa de altura (confirmado 06) |
| `raio_interacao_tiles` | 1,0 | §6.1 |

### 4.4 Dano recebido e recursos
| Chave | Valor | Observação |
|---|---|---|
| `dano_travamento_min_quadros` | 20 | Estado DANO dura `max(este, travamento_final do golpe)`. Antes: `dano_atordoamento_min_quadros` (renomeado, ver §5.3). Mudança de valor passa pelo 06 (D-009) |
| `invencivel_pos_dano_quadros` | 60 | Após sair de DANO; sprite pisca (frequência respeita flashes ≤ 3/s). Mudança de valor passa pelo 06 |
| `resist_recuo_heroi` | 0 | O herói sempre sofre recuo e travamento inteiros (06 §7.2) |
| `reinicio_apos_morte_max_s` | 3 | Da entrada em MORTE até a sala jogável de novo (aprovado em D-009); mede-se no debug. O reinício põe o herói em `inicio_jogador`, com vida, mana e fôlego cheios, e reinicia os inimigos de teste; os contadores do debug não zeram sozinhos |
| `folego_custo_ativo` | sim | Opção só de desenvolvimento: `não` desliga o gasto de fôlego (ver §11.1, item 14b) |

Recursos do herói (fórmulas e atributos: `formulas.md` §2–§3; valores de nível 1, com atributos em 5):

| Chave | Valor nv. 1 | Observação |
|---|---|---|
| `vida_max` | 140 | `80 + 12 × vigor + itens`; vida e mana enchem ao subir de nível |
| `mana_max` | 45 | `20 + 5 × mente`; as habilidades gastam mana (fora do M1) |
| `folego_max` | 100 | `90 + 2 × destreza`; esquiva e golpe forte gastam fôlego |

Regras de fôlego (valores do 06 §3.3; ajustar em playtest):

| Chave | Valor | Observação |
|---|---|---|
| `esquiva_custo` | 25 | §4.2 |
| `atk_hero_forte.custo` | 20 | §5.3 |
| `custo_folego_correr_s` | 0 | Correr é grátis no slice; o campo existe |
| `folego_regen_por_s` | 40 | Recarga |
| `folego_regen_atraso_quadros` | 30 | Depois do último gasto |
| `folego_exausto_atraso_quadros` | 60 | Quando o fôlego chegou a 0 |

- **Ação com custo só sai se `recurso ≥ custo`.** Sem fôlego suficiente, a ação **não executa nem gasta nada**: fica no buffer até expirar (`buffer_entrada_quadros`), dispara o evento `sem_folego` (som e aviso no HUD, 05/07) e o estado atual continua.
- O custo é debitado no 1º quadro da ação. Cancelar um golpe com esquiva (janela do §5.3) paga a esquiva normalmente.
- Mana por acerto (`mana_por_acerto` 3, 06 §3.2) acontece no passo 5 do pipeline para golpes `atk_hero_*`, **só quando o alvo tem `concede_mana = sim` nos dados**. Inimigos reais: sim. `enemy_boneco_alvo` (vida infinita): **não**, para não permitir encher mana no boneco. É a leitura do 03 para a frase "não vale contra enemy_boneco_alvo fora do debug" do 06 §3.2; o debug pode forçar `sim`. Sem efeito no M1 (mana está fora).

### 4.5 Casamento movimento × animação (requisito para o 04)
| Chave | Valor | Observação |
|---|---|---|
| `passo_andar_tiles` | 0,5 | Distância de um passo; ciclo = 2 passos **[proposta, 04 confirma]** |
| `passos_por_s_andar` | 7,0 | = `vel_andar` / `passo_andar_tiles` |
| `passo_correr_tiles` | 0,75 | Passada maior ao correr |
| `passos_por_s_correr` | 8,0 | = `vel_correr` / `passo_correr_tiles` |

Se o 04 não conseguir ciclos nessas frequências dentro de 8–12 fps, ajusta-se `passo_*_tiles` ou a velocidade, nunca deixar o pé deslizar. Divergência vai ao Produtor.

### 4.6 Direção do sprite
Regra do 10 (`docs/arte/guia_visual.md` A1.2), decidida pelo Produtor (D-007):

| Situação | Sprite |
|---|---|
| Movimento reto (S, N, L, O) | a própria direção (O = L espelhado) |
| Diagonal, e a direção atual é uma das duas componentes | mantém a atual (ex.: vindo de S, virando para SE → continua S); evita piscar entre poses |
| Diagonal partindo de PARADO (ou a direção atual não é componente) | o **lado** (L ou O) da diagonal |
| Ataque / habilidade | vira no 1º quadro para a direção mais próxima da mira (cursor ou alvo assistido, §3.3) e não troca durante o golpe |

**Em revisão 04/10 (D-025):** com mira livre pelo cursor e câmera isométrica, o sprite precisa de mais direções. Proposta do 03: **8 direções** (5 desenhadas + espelho), a mais próxima do ângulo de mira, com **histerese de 10°** para não piscar entre poses. Se o 04 desenhar 8, a regra das diagonais acima (A1.2) deixa de ser necessária. A hitbox usa o ângulo real, não o do sprite.

---

## 5. Combate

### 5.1 Máquina de estados do herói
| Estado | Entra quando | Sai para | Transições permitidas a partir dele |
|---|---|---|---|
| PARADO | sem entrada de `mover` | ANDAR, CORRER, ATAQUE_1, ATAQUE_FORTE, ESQUIVA, HABILIDADE, INTERAGIR | todas as "livres" |
| ANDAR | `mover` sem `correr` | PARADO, CORRER, e as mesmas de PARADO | livres |
| CORRER | `mover` + `correr` | PARADO, ANDAR, e as mesmas de PARADO | livres |
| ATAQUE_1/2/3 | `atacar` em estado livre (1) ou na janela de combo (2, 3) | próximo ATAQUE_n, ESQUIVA (na janela de cancelamento), PARADO | só as declaradas em `cancelavel_em` |
| ATAQUE_FORTE | `forte` em estado livre, com `fôlego ≥ custo` | ESQUIVA (janela), PARADO | `cancelavel_em` |
| ESQUIVA | `esquivar` em estado livre ou janela cancelável, fora de recarga, com `fôlego ≥ esquiva_custo` | PARADO (ou ANDAR/CORRER se houver entrada) | nenhuma até terminar |
| HABILIDADE | `habilidade_n` em estado livre, com custo e recarga ok | PARADO | `cancelavel_em` da habilidade |
| DANO | golpe passou pelo pipeline e não foi ignorado | PARADO, MORTE | nenhuma (ver §4.4) |
| MORTE | vida ≤ 0 | — (game over / reinício, tela do 07) | nenhuma |
| INTERAGIR / DIÁLOGO | `interagir` com alvo válido | PARADO ao fim | controle travado até o fim |
| CENA | gatilho de cena (flag ou fim de chefe, §15) | PARADO ao fim da cena | nenhuma; controle travado, herói invencível, buffer esvaziado; só `pular_dialogo` age. Não se salva durante a CENA (§15, g) |

"Livre" = PARADO, ANDAR, CORRER. Cada estado implementa entrar, atualizar, sair e lista de transições permitidas; transição não declarada é ignorada e registrada no log de debug.

### 5.2 Caixas
| Caixa | Função | Cor no debug | Forma |
|---|---|---|---|
| Hurtbox | Recebe dano | Verde | Círculo + faixa de altura |
| Hitbox | Causa dano, só nos quadros ativos | Vermelho | Círculo, setor ou retângulo + faixa de altura |
| Pushbox | Colisão física no chão | Amarelo | Círculo |

Regras:
1. Caixas independentes do sprite, definidas em dados por ataque (e por quadro quando o golpe varre).
2. Teste de colisão no plano (x, z) **e** sobreposição das faixas de altura.
3. Cada ativação de golpe guarda a lista de alvos já atingidos: **um acerto por alvo por golpe**.
4. Hitbox do herói generosa: a margem já está incluída no `alcance_tiles` das tabelas (§5.3).
5. **Parede bloqueia golpe** (decisão do 03, pedido do 06): ver §5.9. Atacante e alvo precisam ter linha livre no plano e estar no mesmo andar.
6. **Como se mede o alcance:** `alcance_tiles` vai da **origem do golpe** (centro da pushbox do atacante, na posição do 1º quadro ativo, já com o avanço) até a **borda da hurtbox do alvo**, e não até o centro dele. Há acerto se o círculo da hurtbox intersecta o setor (ou a forma) do golpe; em distância: `distância_centros − hurtbox_raio_alvo ≤ alcance_tiles`. Assim o alcance não depende do tamanho do inimigo.
   Para o teste de alcance (M1-15b), "alvo a X % do alcance" = distância origem → **borda** da hurtbox igual a X % do `alcance_tiles` (90 % acerta, 110 % erra). Alvo de treino: `enemy_boneco_alvo` com `hurtbox_raio_tiles` 0,40 e `hurtbox_altura_tiles` 0,0–1,4 **[proposta do 03; o 06 confirma nas métricas]**.
7. **Direção do golpe = a mira** (§3.3): contínua com o cursor, quantizada em 8 com o teclado. O setor gira com o ângulo; o aviso do inimigo também (a forma exata da hitbox no chão, §6.2).

### 5.3 Ataques do herói (dados)
Prefixo `atk_` aprovado para ataques básicos (D-007; o 08 confirma o formato). Quadros contados a partir do quadro 1 do ataque.

| ID | Prep. | Ativo | Recup. | Total | Forma | Alcance (tiles) | Ângulo | Altura (tiles) | Avanço (tiles) | Força |
|---|---|---|---|---|---|---|---|---|---|---|
| `atk_hero_leve_1` | 5 | 3 | 10 | 18 | setor | 1,3 | 100 | 0,0–1,2 | 0,15 | leve |
| `atk_hero_leve_2` | 5 | 3 | 10 | 18 | setor | 1,3 | 100 | 0,0–1,2 | 0,15 | leve |
| `atk_hero_leve_3` | 6 | 3 | 12 | 21 | setor | 1,5 | 150 | 0,0–1,2 | 0,30 | médio |
| `atk_hero_forte` | 15 | 4 | 22 | 41 | setor | 1,7 | 120 | 0,0–1,4 | 0,40 | forte |

| ID | Combo aceita desde | Esquiva cancela desde | Recuo (tiles) | Travamento (quadros) | Pausa impacto |
|---|---|---|---|---|---|
| `atk_hero_leve_1` | quadro 6 | quadro 9 | 0,3 | 20 | 3 |
| `atk_hero_leve_2` | quadro 6 | quadro 9 | 0,3 | 20 | 3 |
| `atk_hero_leve_3` | — | quadro 10 | 0,6 | 24 | 5 |
| `atk_hero_forte` | — | quadro 30 | 1,0 | 30 | 7 |

Campos de dano do 06 (`formulas.md` §4.3; multiplicadores confirmados):

| ID | Mult. dano | Atributo | Escala | Tipo de dano | Postura | Acúmulo de estado | Custo | Dano nv. 1 |
|---|---|---|---|---|---|---|---|---|
| `atk_hero_leve_1` | 1,0 | destreza | 2,0 | `corte` | 10 | — | — | 13 |
| `atk_hero_leve_2` | 1,0 | destreza | 2,0 | `corte` | 10 | — | — | 13 |
| `atk_hero_leve_3` | 1,5 | destreza | 2,0 | `corte` | 15 | — | — | 20 |
| `atk_hero_forte` | 2,5 | forca | 2,0 | `corte` | 30 | — | fôlego 20 | 33 |

- Faixas da §7.3 do 03 respeitadas (leve 4–6 / 2–3 / 8–12; forte 12–18 / 3–4 / 18–26).
- Janela de combo: a entrada é aceita do quadro "combo aceita desde" até o fim da recuperação (com buffer); o próximo golpe **começa no primeiro quadro da recuperação** (= mesmo quadro de "esquiva cancela desde"), nunca durante o ativo. Sem entrada até o fim → PARADO e combo volta ao `_1`.
- `atk_hero_forte` não encadeia a partir do combo leve na v0.2 (testar em playtest).
- **Travamento** (`travamento_quadros`, antes "atordoamento") = quadros em que o alvo fica em DANO depois de um acerto. Renomeado para não se confundir com o estado `est_atordoado` (06 §5.3). Com `resist_recuo`, o valor final é `arred(travamento × (1 − resist_recuo))` e, se for 0, o alvo **não entra em DANO** (só recebe pausa de impacto, tingimento e som). Os leves travam o suficiente para ligar o combo contra alvo sem resistência.
- Campos de apresentação por ataque (`efeito_visual`, `som`, `tremor`) seguem a força pela tabela §5.6.

### 5.4 Habilidades (mecânica do 03; números do 06, provisórios)
Habilidades por ID, desacopladas do herói (D-004). Custos, recargas e multiplicadores: `formulas.md` §8. **Fora do M1.**

| ID | Mecânica | Forma | Prep. | Ativo | Recup. | Custo (mana) | Recarga | Mult. dano | Atributo | Tipo | Postura |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `skill_giro` | Golpe em volta do herói | círculo, raio 1,6 | 10 | 6 | 20 | 15 | 360 q (6 s) | 1,8 | forca | `corte` | 20 |
| `skill_disparo` | Projétil em linha reta | projétil (§5.5) | 12 | 1 (dispara) | 16 | 8 | 90 q (1,5 s) | 1,2 | mente | `elem_1` **[aguarda 02]** | 5 |
| `skill_investida` (opcional) | Avanço com golpe | retângulo 3,0 × 0,8 | 8 | 10 | 18 | 12 | 480 q (8 s) | 2,0 | forca | `impacto` | 25 |

`skill_disparo` acumula 35 de `est_queimando` por acerto; as demais não acumulam estado. No esquema `mouse`, `skill_disparo` e `skill_investida` seguem o **cursor** e `skill_giro` ignora a mira (§3.3).

### 5.5 Projéteis
| Chave | Valor | Observação |
|---|---|---|
| `proj_vel_tiles_s` | 10,0 | `skill_disparo` |
| `proj_vida_s` | 0,8 | Some ao fim, ao bater em parede ou no 1º alvo |
| `proj_raio_tiles` | 0,25 | Círculo + faixa de altura 0,3–1,0 |
| `proj_max_heroi` | 6 | Por dono; total global no §9 |

Projéteis vêm de pool; magias podem acender luz curta (definição do 10).

### 5.6 Feedback de impacto por força (dados)
| Força | Pausa impacto (quadros) | Tingimento claro do alvo (quadros) | Tremor | Partículas | Luz de impacto (quadros) | Som | Efeito |
|---|---|---|---|---|---|---|---|
| leve | 3 | 1 | nenhum | 4 | 4 | `sfx_impacto_leve` | `fx_impacto_leve` |
| médio | 5 | 1 | leve | 8 | 6 | `sfx_impacto_medio` | `fx_impacto_medio` |
| forte | 7 | 2 | médio | 14 | 8 | `sfx_impacto_forte` | `fx_impacto_forte` |

- Pausa de impacto vale para atacante e alvo; faixa da §7.5 do 03 (2–8).
- Níveis de tremor na tabela da §8.2; desligável. Partículas e luz desligáveis (perfil Baixo e acessibilidade).
- **Tingimento do alvo** (A1.5 do 10, D-007): o sprite do alvo é tingido em tom claro, sem flash de tela. Não conta no limite de flashes. Com "reduzir flashes" ligado, usa um tom médio por 1 quadro.
- **Limite global ≤ 3/s** vale para flash de tela, bloom de área grande e luz de impacto forte. O excedente perde só o pico de luz; o acerto e o resto do feedback acontecem normalmente.
- Luz curta de impacto: regra e valores do 10 (A1.4). A coluna de luz acima é a duração e precisa bater com a do 10.
- IDs de efeito do 10 (A1.3) ligados a eventos do 03: `fx_impacto_*` (`golpe_acertou`), `fx_poeira_esquiva` (`esquiva_inicio`), `fx_poeira_passo` (`passo`), `fx_aviso_circulo/cone/retangulo/linha` (`aviso_inicio`, pela forma). Não usados no slice (D-007: sem crítico nem bloqueio): `fx_impacto_critico`, `fx_impacto_bloqueio`.
- Som e efeito no **mesmo quadro** do acerto. IDs propostos; o 05 e o 10 confirmam.
- Número de dano: opção, desligado por padrão **[proposta]**.

### 5.7 Pipeline de dano (ordem fixa)
Idêntica à de `formulas.md` §4.5 (alinhada com o 06 em D-009).

| Passo | O que acontece |
|---|---|
| 1. Hitbox ativa encosta na hurtbox | Plano (x, z) **e** faixa de altura **e** linha livre sem parede (§5.9) |
| 2. Alvo já atingido por esta ativação? | sai |
| 3. Alvo invencível (esquiva, pós-dano, transição de chefe)? | sai. Janela da esquiva com `mult_janela_esquiva` (§4.2) |
| 4. Calcula | **4a** `dano_final` (06 §4.1) · **4b** `dano_postura` (06 §7.1) · **4c** acúmulo de estado (06 §5.2). Tudo determinístico, sem aleatoriedade |
| 5. Aplica | Subtrai vida; soma acúmulo e dispara estado se ≥ 100; `mana_por_acerto` ao herói |
| 6. Recuo e travamento | `resist_recuo` (06 §7.2) reduz recuo e travamento; travamento final 0 → não entra em DANO; postura ≤ 0 → QUEBRADO (§6.1) |
| 7. Feedback e eventos | §5.6 e §5.8 |
| 8. Morte | se vida ≤ 0 |

Os exemplos resolvidos do 06 viram **testes unitários** da função de dano (D1–D11), do fôlego (F1–F4), da janela de esquiva (J1–J4) e de recuo/travamento (K1–K3), independentemente de o M1 ter habilidades ou postura.

### 5.8 Eventos de combate (para 05, 07, 10)
| Evento | Dados | Quem consome |
|---|---|---|
| `golpe_acertou` | atacante, alvo, ataque_id, ponto, força | 05 (som), 10 (efeito/luz), câmera (tremor) |
| `dano` | alvo, valor, tipo_dano | HUD (07), número de dano |
| `morreu` | entidade | missões, HUD, 05 |
| `estado_mudou` | entidade, de, para | animação, debug |
| `aviso_inicio` | entidade, ataque_id, forma, duração | 10 (marcador no chão), 05 (som de aviso) |
| `esquiva_inicio` | entidade, direção | 05, 10 (poeira) |
| `passo` | entidade, superfície | 05 — vem do evento de quadro no `.meta.json` do sprite (04) |
| `recurso_mudou` | entidade, recurso (`vida`/`mana`/`folego`), valor, máximo | HUD (07), debug |
| `sem_folego` | entidade, ação negada | 05, HUD (07) |
| `aviso_cancelado` | entidade, ataque_id | 10 (marcador some no mesmo quadro), 05 (corta o som de aviso) |
| `postura_quebrada` | entidade | 10 (`fx_quebra_postura`), 05 |

### 5.9 Colisores, parede e linha de visão
Decisões do 03 para o pedido do 06 (`formulas.md` §13 item 5; `metricas.md` §5). Cada colisor do mapa declara em dados uma faixa de altura e quatro marcas:

| Colisor (06 `metricas.md` §5) | Altura (tiles) | `bloqueia_movimento` | `bloqueia_projetil` | `bloqueia_golpe` | `bloqueia_visao` |
|---|---|---|---|---|---|
| Parede alta | ≥ 2,0 | sim | sim | sim | sim |
| Meia-parede (cobertura) | 0,75 | sim | sim | sim | **não** |
| Borda de plataforma / mureta | 1,0 | sim | sim | sim | não |
| Pilar 2×2 (cobertura) | **[06 define a altura]** | sim | sim | sim | conforme a altura |
| Degrau decorativo | ≤ 0,25 | não | não | não | não |

Regras de implementação:
1. **Golpe corpo a corpo e de área** (passo 1 do pipeline): para cada alvo candidato, traça-se o segmento no plano do centro da pushbox do atacante até o **ponto mais próximo da hurtbox do alvo**. Se cruzar um colisor com `bloqueia_golpe` cuja faixa de altura se sobreponha à da hitbox (0,0–1,2 ou 0,0–1,4), o alvo **não é atingido**. Vale para o herói e para os inimigos.
2. **Projétil:** some ao tocar colisor com `bloqueia_projetil` cuja faixa se sobreponha a `0,3–1,0` (a meia-parede de 0,75 sobrepõe; logo bloqueia).
3. **Linha de visão de inimigos:** o segmento do olho do inimigo ao herói é testado só contra colisores com `bloqueia_visao`. A meia-parede **não** esconde o herói (06 §5), então dá para ser visto atrás dela, mas o golpe e o projétil não passam.
4. **Mesmo andar:** atacante e alvo só se acertam se a diferença de altura do chão entre eles for menor que 1,0 tile (combate num plano só, `metricas.md` §5).
5. O aviso de golpe (§6.2) não é cortado pela parede: ele mostra a zona do golpe, e o golpe que a parede bloqueia simplesmente não acerta.

Teste: atacante e alvo a 90 % do alcance com parede ou meia-parede entre eles → 0 acertos; sem a parede → acerta (§13).

---

## 6. Inimigos e chefes (resumo; detalhes no 06)

Fora deste briefing: arquétipos, números e chefe. Regras que o código vai impor:

### 6.1 Estados
`PARADO → PATRULHA / PERSEGUE → AVISO → ATAQUE → RECUPERA → DANO → QUEBRADO → MORTE`. Mesmo modelo de estados do herói (entrar/atualizar/sair, transições declaradas).

**QUEBRADO** (06 `formulas.md` §7.1, pedido do 06): estado separado de DANO.

| Chave | Valor | Observação |
|---|---|---|
| `quebrado_quadros` | 90 | Sem ação durante este tempo |
| `mult_dano_quebrado` | 1,5 | Multiplicador `postura_quebrada` do 06 §4.4 |
| `postura_regen_atraso_quadros` | 120 | Sem dano de postura por este tempo antes de regenerar |
| `postura_regen_fracao_por_s` | 0,25 | Da postura máxima, por segundo |

- Entra de **qualquer** estado (inclusive AVISO e ATAQUE) quando a postura chega a 0 no passo 6: o golpe em preparação é **interrompido**, o aviso é **cancelado** (evento `aviso_cancelado`) e o inimigo perde a ficha de ataque.
- Em QUEBRADO, `resist_recuo` vale 0 e a postura volta cheia ao sair; depois volta a PERSEGUE (ou PARADO se perdeu o herói).
- **Não** é `est_atordoado`: não conta para a imunidade a controle do 06 §5.3.
- Só existe em inimigos; o herói não tem postura. Fora do M1 (o `enemy_boneco_alvo` pode usá-la em debug).

### 6.2 Aviso de golpe (telegraph)
Convenção do 10 (`docs/arte/guia_visual.md` §9) — **em revisão com 03/06/07**:

| Chave | Valor | Observação |
|---|---|---|
| `aviso_cor` | `perigo` (magenta), borda clara `perigo_4`, contorno escuro `perigo_1` | Vermelho não: some para daltônicos |
| `aviso_forma` | forma **exata** da hitbox do golpe no chão (círculo, setor, retângulo, linha) | Gerada dos mesmos dados da hitbox; nunca desenhada à mão |
| `aviso_preenchimento` | da borda para o centro, de 0 a 100 % na duração do aviso | 100 % = quadro 1 do ativo — **regra comum 03/10, aprovada pelo Produtor** |
| `aviso_camada` | acima do chão, abaixo dos personagens | Nenhum efeito do jogador por cima |
| `aviso_efeito_id` | `fx_aviso_circulo` / `_cone` / `_retangulo` / `_linha` | Escolhido pela forma da hitbox (10, A1.3) |
| `aviso_corpo` | brilho `perigo_4` curto na arma/olhos + pose de antecipação | 1 piscada; conta no limite de flashes |

- Magenta é reservado a perigo: nenhum efeito do herói usa magenta (vale para `fx_impacto_*` da §5.6).
- As cores das caixas no debug (§5.2) são só ferramenta e não seguem essa paleta.
- O evento `aviso_inicio` (§5.8) leva forma e duração para o 10 desenhar o marcador sem recalcular nada.

### 6.3 Regras de justiça (dados)
| Chave | Valor | Origem |
|---|---|---|
| `aviso_min_comum_quadros` | 18 | §7.3 do 03 (faixa 18–30) |
| `aviso_min_forte_quadros` | 36 | §7.3 (faixa 36–48) |
| `aviso_min_chefe_quadros` | 60 | §7.3 (faixa 60–120) |
| `reacao_normal_quadros` | 9–18 | 150–300 ms (§8 do 03) |
| `aviso_final` | `max(aviso_min_categoria, arred(aviso_base × mult_aviso_inimigo))` | 06 §6.3: a dificuldade nunca fica abaixo do mínimo |
| `fichas_ataque_max` | 2 | Só estes atacam ao mesmo tempo; os demais rondam |
| `dormir_alem_camera_tiles` | 4,0 | Inimigo fora da área visível + esta margem "dorme" |

- Todo ataque inimigo tem aviso ≥ mínimo da sua categoria (validado por teste). Aviso = pose + brilho + som; áreas com marcador no chão.
- Efeitos e HUD nunca cobrem o aviso.
- Dificuldade muda reação, agressividade e dano — nunca trapaceia (D-005: só Normal agora).

---

## 7. Interação e missões em execução

| Chave | Valor | Observação |
|---|---|---|
| `raio_interacao_tiles` | 1,0 | Mesmo valor da §4.3 |
| `interacao_cone_graus` | 90 | Alvo precisa estar à frente do herói |
| `interacao_prioridade` | menor `distância × (1 + ângulo/90)` | Desempate: o mais recente a ficar disponível |

- Ícone acima do alvo escolhido (evento `interacao_disponivel` → 07). No esquema `mouse`, clicar no NPC/objeto anda até ele e interage (§3.5); a prioridade por distância e ângulo vale para `interagir` por tecla.
- **Diálogos:** tocam os dados do 02 (falas, escolhas, flags); travam o controle; podem mover a câmera (§8.3).
- **Missões:** `não iniciada → ativa → passos → concluída / falhou`, guiadas por flags; nada travado por ordem de ações. Conteúdo do 02.
- **Objetos com estado salvo:** baús, portas, alavancas, pontos de salvamento.
- **Transição de área:** portal com destino; fade curto; carregamento da próxima área pelo 08.
- **O que salvar:** posição e área, vida e mana, inventário, flags, missões, objetos abertos, habilidades equipadas. Formato, versão e migração: 08.

- **Variantes de mapa por flags** (§15, e): o mesmo mapa pode ter variantes (ex.: dia, adormecida, acordada), escolhidas **ao carregar** a partir das flags; nada de estado "adormecido" jogável.

Tudo nesta seção está **fora do M1**.

---

## 8. Câmera

### 8.1 Em jogo (dados) — câmera isométrica (D-025)
| Chave | Valor | Observação |
|---|---|---|
| `camera_projecao` | isométrica fixa | Ortográfica ou perspectiva estreita: **ADR-002 do 08** (ponto aberto da D-016) |
| `camera_giro_graus` | 45 | Fixo; sem rotação pelo jogador |
| `camera_inclinacao_graus` | 30 | Proposta do 03. Faixa 26,6° (losango 2:1 em pixels) a 35,3° (isométrica verdadeira); **08/10 confirmam**. Substitui `camera_angulo_graus` 35 da câmera 3/4 |
| `camera_area_visivel_tiles` | **a recalcular** | Depende da resolução e da densidade em px por tile (08/10); era 20 × 11,25 na câmera 3/4 |
| `camera_suavizacao_s` | 0,15 | Tempo de resposta do seguimento |
| `camera_antecipacao_tiles` | 1,0 | Na direção do movimento, proporcional à velocidade (0 parado, máximo ao correr). Com o mouse, também puxa um pouco para o cursor (`camera_cursor_peso` 0,15) |
| `camera_zona_morta_tiles` | 0,25 | Movimentos menores não mexem a câmera |
| `camera_oclusao_alpha` | 0,35 | Objeto entre câmera e herói fica recortado em pontilhado de pixel (10, A1.1; o 08 decide o custo); ver §8.4 |

- Ângulo e distância **fixos** em jogo; sem rotação nem zoom pelo jogador. A câmera **segue o herói** (não o destino do clique).
- **Limites por área:** a câmera nunca mostra fora do cenário (limites vêm do mapa — 06/07), agora num losango/retângulo em coordenadas de tela.
- Câmera não treme o mundo lógico: tremor é só apresentação.

### 8.2 Tremor (dados; desligável)
| Nível | Amplitude (tiles) | Duração (quadros) |
|---|---|---|
| leve | 0,05 | 6 |
| médio | 0,10 | 10 |
| forte | 0,20 | 16 |

Opção de acessibilidade: tremor desligado ou reduzido (multiplicador de amplitude).

### 8.3 Cenas e golpes especiais
Aproximar, girar pouco e mudar foco só em cenas, entrada/transição de chefe e golpes especiais; sempre volta ao padrão da §8.1. Valores definidos com o 07/10 quando houver cenas (fora do M1).

### 8.4 Ordem de desenho e oclusão (câmera isométrica)
Na isometria os objetos ao norte e a oeste da tela (casas, árvores, torre) **cobrem** quem está atrás. As regras abaixo garantem que a lógica não dependa do que se vê.

| Camada, de baixo para cima | Regra |
|---|---|
| 1. Chão e decalques | — |
| 2. Marcadores de **aviso** e de **destino do clique** | Emissivos (não recebem luz de impacto); acima do chão, abaixo dos personagens (10 §9) |
| 3. Sombras | Projetadas no chão |
| 4. Entidades e objetos | Ordenados por profundidade: `ordem = x + z` do ponto de apoio nos pés; empate: o herói fica na frente |
| 5. Efeitos | Partículas, faíscas, luz de impacto |
| 6. Números de dano e barras de vida | Sempre à frente, em tela |
| 7. UI | — |

- **O herói nunca fica ilegível:** objetos que o cobrem ficam recortados em pontilhado dentro de `oclusao_raio_tiles` (1,5) em volta dele (`camera_oclusao_alpha`), e há contorno de silhueta atrás deles (`silhueta_oclusao` ligado).
- **O aviso nunca é coberto:** se um objeto cobrir um aviso ativo (ou o inimigo que o emite), o objeto é recortado nessa área ou o inimigo ganha silhueta. Vale a regra "efeitos e HUD nunca cobrem o aviso".
- **Clique e acerto não dependem da imagem:** o alvo do clique usa a hurtbox projetada (§3.5), e colisões, golpes e linha de visão usam só os colisores (§5.9), nunca o desenho.
- **Para 06/07 (nível e cenário):** construções com mais de 2 tiles de altura a menos de `oclusao_raio_tiles` das rotas de combate pedem recorte; prefira arenas abertas para o lado da câmera (sul/leste da tela) e evite posicionar inimigos que atacam atrás de paredes altas ao norte.

---

## 9. Desempenho (limites — metas do 08)

| Chave | Valor | Observação |
|---|---|---|
| `fps_alvo` | 60 | Pior 1 % ≥ 45 |
| `inimigos_ativos_max` | 40 | Inimigos longe "dormem" (§6.3) |
| `projeteis_particulas_logicas_max` | 150 | Pools; nada criado/destruído por quadro |

---

## 10. Ferramentas de debug

| Tecla (debug) | Função |
|---|---|
| F1 | Mostrar caixas (cores da §5.2) |
| F2 | Estado de cada entidade e quadro atual do estado; posição do herói em tiles (x, z, altura); posição do cursor no mundo, destino do clique e alvo sob o cursor |
| F3 | FPS (média e pior 1 %), tempo de quadro e contador de ticks da simulação |
| F4 | Entradas e conteúdo do buffer |
| F6 | Pausar simulação |
| F7 | Avançar um passo lógico (com F6 ativo) |
| F8 | Câmera lenta (`debug_lento_fator`) |
| F9 | Exportar tempos de quadro (gravação desde o último início) para arquivo |
| F10 | Contadores do alvo de treino (acertos, dano) — zerar |

| Chave | Valor | Observação |
|---|---|---|
| `debug_lento_fator` | 0,25 | Simulação a 1/4 da velocidade |
| `debug_gravacao_max_s` | 300 | Tempos de quadro guardados para exportação (cobre os 3 min do M1-02) |

F5 e F11 ficam livres para o navegador (M1-07). F1, F3, F7 e F10 têm função no navegador (ajuda, busca, navegação por cursor, barra de menu): só o build de desenvolvimento as intercepta, e o jogador nunca as usa (07 §3.3). Só em build de desenvolvimento; teclas remapeáveis como qualquer ação.

---

## 11. Escopo do M1 — protótipo cinza

Objetivo do M1 (roadmap): herói se move e ataca numa sala de teste com **câmera isométrica**, luz e acabamento de teste (o 08/10 definem o nível de polimento do esqueleto, D-025); **sensação aprovada em playtest**. Critério do 09: movimento, ataque e esquiva estáveis; sala de teste; 60 fps no intermediário.

### 11.1 M1 precisa ter (verificável)
| # | Item | Como verificar |
|---|---|---|
| 1 | **`map_sala_teste`** (48 × 32, `metricas.md` §8) carregada de dados, com as zonas marcadas "M1: sim": campo, parede solta, rampa, plataforma, escada, pátio (o laço campo → plataforma → pátio), corredor (sem armadilha) e arena vazia com a porta aberta | Abrir; percorrer o laço; subir a rampa e descer a escada; o script do 06 (§8.5) confirma que não há tile andável sem volta |
| 2 | Herói-placeholder com sombra sempre no chão | Visual; sombra acompanha em rampa |
| 3 | Andar e correr com `vel_andar` / `vel_correr` | Teste automático mede deslocamento por segundo (tolerância ±1 %) |
| 4 | 8 direções do teclado (e direção livre do mouse/analógico) com velocidade igual no mundo; W A S D seguem a tela | Teste: módulo igual nas 8 direções e em 3 ângulos livres |
| 5 | Aceleração e freada conforme §4.1 | Teste: quadros até velocidade máxima e até parar |
| 6 | Deslizar em paredes (sem travar em quinas) | Teste: andar a 45° contra parede mantém componente paralela |
| 7 | Esquiva: distância, duração, invencibilidade (J1–J4 do 06), recarga e custo de fôlego da §4.2 | Teste automático + debug F1/F2 mostra janela |
| 8 | Combo leve de 3 + forte com dados da §5.3, janelas de combo e cancelamento | Teste de máquina de estados e de quadros |
| 9 | Buffer de entrada (§3.4) | Teste: aperto 7 quadros antes executa; 8 quadros antes não |
| 10 | Caixas em dados com debug visual (F1) | Visual + mudar alcance só em dados muda o acerto |
| 11 | **Alvo de treino** `enemy_boneco_alvo` (provisório) em (11, 4): fixo, vida infinita no debug; recebe dano, recuo, tingimento, pausa de impacto; 1 acerto por golpe; contador de acertos e de dano no debug | M1-15b (90 % do alcance acerta, 110 % erra, 8 direções), M1-15c, M1-15e |
| 12 | `enemy_boneco_golpe` (provisório) em (16, 4): fixo; golpe a cada 120 q, dano base 18, aviso ≥ `aviso_min_comum_quadros`, desenhado conforme §6.2; o aviso dele não alcança o `enemy_boneco_alvo` | Teste de justiça; esquiva no tempo certo evita o dano → invencibilidade do M1-15d verificável já no M1 |
| 13 | Herói recebe dano: DANO, invencibilidade pós-dano, vida 0 → MORTE → reinício rápido na sala. Com `vida_max` 140 e golpe de base 18, morre no **8º** golpe sem esquiva (06 §12). Da MORTE até a sala jogável: ≤ `reinicio_apos_morte_max_s` (3 s) | Jogar; teste da máquina de estados; cronometrar o reinício no debug |
| 14 | Pipeline de dano na ordem da §5.7 com a fórmula do 06 | Exemplos D1–D11, J1–J4, K1–K3 do `formulas.md` passam como testes unitários |
| 14b | **Fôlego (decisão do 03: entra no M1; vale o M1-15i do 09):** `folego_max` 100; esquiva gasta 25 e forte 20; recarga e atrasos da §4.4; ação sem fôlego não sai, fica no buffer e gera `sem_folego`; vida e fôlego visíveis no debug; opção `folego_custo_ativo` | Testes F1–F4 do 06; 5ª esquiva seguida negada; debug F2 mostra o recurso |
| 14c | **Parede bloqueia golpe** (§5.9): alvo a 90 % do alcance atrás de parede ou meia-parede não é atingido; sem parede, é | Teste de alcance com e sem colisor na sala |
| 15 | Câmera isométrica fixa (§8.1) com suavização, antecipação, zona morta, limites da sala e tremor desligável | Visual; câmera nunca mostra fora da sala; ângulo fixo |
| 15b | Ordem de desenho e oclusão (§8.4): herói legível atrás de parede (recorte + silhueta); aviso do `enemy_boneco_golpe` nunca coberto; clique atravessa objeto decorativo | Visual com o boneco atrás da parede solta; teste de clique |
| 16 | Luz básica da cena e sombra (08/10) | Visual |
| 17 | Teclado + mouse e gamepad, por ações lógicas; dois esquemas (`mouse` padrão, `teclado`); remapeamento por dados | Trocar uma tecla nos dados sem tocar no código; trocar o esquema sem reiniciar |
| 17b | **Clicar para mover e atacar** (§3.5): clique no chão anda/corre; segurar acompanha; clique em inimigo anda até o alcance e ataca; Shift ataca parado; WASD cancela o destino; clique na UI não age no mundo | Teste de entrada simulada; debug F2 mostra destino e alvo |
| 17c | **Mira no cursor**: direção do golpe, da esquiva e da investida segue o ângulo contínuo do cursor | Teste de alcance nas 8 direções e em 3 ângulos arbitrários; sprite com histerese de 10° |
| 18 | Passo fixo 60 Hz com desenho interpolado; aba em segundo plano pausa | Teste do laço; trocar de aba e voltar |
| 19 | Debug completo da §10: fps (média e pior 1 %), contador de ticks, estado, caixas, entradas, posição em tiles, câmera lenta, avanço quadro a quadro, exportar tempos de quadro | M1-19; cada função funciona |
| 20 | Nenhum número de gameplay no código | Revisão: todo valor das §0–§8 vem de dados (inclui as marcas dos colisores da §5.9) |
| 21 | Abre no navegador sem erros no console; 60 fps na máquina de referência | Console limpo; medição de FPS (máquina: pendente com o usuário) |

### 11.2 Fora do M1
Habilidades (§5.4) e mana, projéteis, itens, postura/QUEBRADO e estados do 06, inimigos com IA, chefe, interação, diálogos, missões, transição de área, save, HUD final (vida aparece no overlay de debug), som e efeitos finais (placeholders opcionais), tela de remapeamento.

---

## 12. Perguntas para repassar (via Produtor)

### 12.1 Para o 06 (fórmulas e métricas)
As 8 perguntas da v0.1 foram respondidas em `formulas.md` §13 e aplicadas nesta versão. Pendências novas:
1. Altura (e se bloqueia visão) do **pilar 2×2** de cobertura (§5.9). Proposta do 03: parede alta (≥ 2,0).
2. Renomeei `dano_atordoamento_min_quadros` para `dano_travamento_min_quadros` (§4.4) junto com a coluna de ataques. Atualizar `formulas.md` §7.2 e D-009, ou me dizer para manter o nome antigo.
3. Tipo de dano do `enemy_boneco_golpe` (o exemplo D7 não diz). Proposta: `impacto`, como a armadilha de teste.
4. Confirmar que o herói não tem postura e que `postura_quebrada` (×1,5) vale só contra inimigos.
5. `formulas.md` §3.2: trocar a frase "não vale contra enemy_boneco_alvo fora do debug" por "só concede mana alvo com `concede_mana = sim`; `enemy_boneco_alvo` = não" (§4.4).
6. Confirmar `hurtbox_raio_tiles` 0,40 do `enemy_boneco_alvo` e o do `enemy_boneco_golpe` nas métricas (§5.2, regra 6).

### 12.2 Para o 08 (laço, entrada, formatos)
1. Formato de dados e registro do prefixo `atk_` para ataques básicos (não está na lista de prefixos do CLAUDE.md).
2. Laço de passo fixo: limite de passos lógicos por quadro desenhado (proposta: 5) para evitar espiral de atraso; interpolação do desenho.
3. Entrada: fila de eventos entre passos (apertos curtos não se perdem); leitura do gamepad por amostragem a cada passo.
4. Debug: câmera lenta e avanço quadro a quadro compatíveis com o laço.
5. Câmera: perspectiva de campo estreito ou ortográfica? Resolução interna e área visível (§8.1), com o 10.
6. Onde fica o remapeamento salvo (configurações separadas do save de jogo?).
7. Colisão no plano: círculo contra polígonos com deslizamento — feita pela simulação ou por biblioteca?
8. §5.9: o dado dos colisores traz altura e quatro marcas (movimento, projétil, golpe, visão). A simulação consegue testar segmento (golpe e visão) contra eles a cada quadro ativo, sem alocação?
9. **Câmera isométrica (ADR-002):** ortográfica ou perspectiva estreita; resolução interna e densidade de px por tile; `camera_inclinacao_graus` com o 10 (26,6°–35,3°).
10. **Cursor → mundo:** raio da tela ao plano do chão, por quadro; seleção de alvo pela hurtbox projetada (§3.5), independente da imagem.
11. **Ordem de desenho e oclusão (§8.4):** como ordenar sprites e objetos por profundidade na cena e recortar o que cobre o herói e o aviso, sem custo alto.
12. **Caminho:** `reta_deslizando` no M1 e `a_estrela` depois; confirmar o custo de A* em grade de 0,5 tile.

### 12.3 Para o 07 e o 10 (alinhamento)
- 07: ~~nomes das ações e mapeamento~~ — **resolvido** (D1–D5 do 07 §8, aprovadas pelo Produtor).
- 07 (D-025): ações novas `mover_para`, `acao_principal`, `parar_no_lugar` e os dois esquemas de controle (§3.2); cursor de espada/mão, contorno e barra de vida do inimigo sob o cursor; HUD das habilidades em 1·2·3; atualizar `controles_acessibilidade.md` (o clique esquerdo deixa de ser só `atacar`).
- 04/10 (D-025): sprites com 8 direções e histerese (§4.6); marcador de destino do clique; recorte em pontilhado e silhueta atrás de objetos (§8.4).
- 10: `camera_inclinacao_graus` (§8.1), IDs de efeito de impacto (§5.6) e luz curta de impacto. Aviso de golpe (§6.2): o 03 concorda com a convenção; só pede que o preenchimento chegue a 100 % exatamente no quadro 1 do ativo.

---

## 13. Testes previstos (resumo)
- Movimento: velocidade, diagonal, aceleração/freada, deslizar em parede.
- Máquina de estados: transições permitidas e proibidas, janelas de combo/cancelamento.
- Buffer: dentro e fora da janela, prioridade.
- Clique: chão anda até a chegada (±0,15); segurar acompanha; clique em inimigo anda até `alcance − 0,1` e bate; Shift bate parado; WASD, esquiva e dano cancelam o destino; clique durante golpe fica na fila por 12 q; clique em UI não age no mundo.
- Mira: direção do golpe, esquiva e investida = ângulo do cursor (contínuo); zona morta de 0,4 tile; sprite com histerese.
- Oclusão: herói e aviso nunca ficam cobertos (silhueta/recorte); clique atravessa objeto decorativo.
- Alcance: cada ataque acerta alvo a 90 % do `alcance_tiles` em todas as `direcoes_movimento` e erra a 110 % (mesmo critério do M1-15b).
- Laço: 600 ± 1 ticks em 10 s; mesma distância percorrida com taxas de quadro diferentes (M1-04); aba em segundo plano não simula tempo perdido (M1-05).
- Justiça: todo ataque inimigo com aviso ≥ mínimo da categoria.
- Um acerto por alvo por golpe; invencibilidade (esquiva e pós-dano).
- Pipeline de dano com os exemplos resolvidos do 06 (D1–D11, F1–F4, J1–J4, K1–K3, W1–W4, P1–P4, T1–T5, A1–A3).
- Parede: golpe bloqueado por parede e meia-parede; projétil bloqueado pela meia-parede; visão atravessa a meia-parede e não a parede alta.
- Fôlego: ação sem fôlego não executa nem gasta; recarga e atraso; custo debitado no 1º quadro.
- QUEBRADO: interrompe golpe e cancela aviso; ×1,5 no dano; volta com postura cheia.
- Depois do M1: missões/flags, save/carregamento, simulação de inimigos lutando sozinhos.

---

## 14. Status de cada sistema
| Sistema | Status |
|---|---|
| Laço e entrada | pendente |
| Movimento | pendente |
| Esquiva | pendente |
| Recursos (vida, mana, fôlego) | pendente |
| Câmera isométrica, ordem de desenho e oclusão | pendente |
| Entrada à mouse (clicar para mover/atacar, mira no cursor) | pendente |
| Combate (caixas, ataques, pipeline) | pendente |
| Feedback de impacto | pendente |
| Colisores, parede e linha de visão | pendente |
| Habilidades e projéteis | pendente |
| Inimigos e IA (inclui postura/QUEBRADO) | pendente |
| Chefe | pendente |
| Interação, diálogo, missões | pendente |
| Cenas (estado CENA, roteiro de cena em dados) e variantes de mapa | pendente |
| Transição de área e save | pendente |
| HUD ligado ao estado | pendente |
| Debug | pendente |

---

## 15. Respostas ao Produtor (BRF-010, itens e–h)

Premissa de leitura: `docs/narrativa/missao_principal_slice.md` v4, `boss_urso_musgo.md`, D-017 e D-018. **Nada disso entra no M1** (ver h). Valores abaixo são propostas do 03, ajustáveis em playtest; o 06 responde (a)–(d) em paralelo e as duas respostas precisam casar no ponto marcado ⇄.

### (e) Como a simulação lê os 3 estados do mapa — custo **baixo** (simulação) e **médio** (arte, de outros agentes)
- **Recomendação: variantes escolhidas ao carregar, por flags; sem troca em tempo de execução.** Um único `map_baixo_orvalho` (geometria, colisores e portais iguais) com uma lista de variantes: `dia`, `adormecida`, `acordada`. Cada variante só declara o que muda: pose dos NPCs, preset de luz (10) e quais objetos/NPCs são interativos. A escolha é uma função das flags no carregamento: `flag_vila_acordada` → acordada; senão `flag_vila_dorme` → adormecida; senão dia ⇄ (o 06 confirma esta precedência e o que cabe no esquema de missões).
- As trocas dentro de uma cena (2.2 sono, 3.4 cura, corte para 3.5) acontecem **sob fade**, reaproveitando a transição de área (portal para o mesmo mapa com a variante nova). Evita um mecanismo de troca ao vivo, que seria custo **médio** e sem ganho.
- Aldeões dormindo são **props**: sem IA, sem sensores, sem hurtbox, sem pushbox bloqueando rota. A simulação não os vê como inimigos.
- O save guarda **só flags**; a variante nunca é gravada, é recalculada.
- **Alternativa mais barata:** `acordada` reaproveita o layout e as poses de `dia`, com um preset de luz e os textos `txt_epi_*` (2 variantes visuais em vez de 3). O custo é de arte, não meu; o usuário decide com o 07/10.

### (f) Cena de morte do chefe e memento — custo **médio** (cena) e **baixo** (memento)
- **Fim da luta:** quando a vida do `boss_urso_musgo` chega a 0 (passo 8 do pipeline), a simulação **não** mata de imediato: cancela avisos e projéteis, entra o herói em CENA (invencível, sem controle), faz a pausa de impacto longa de `chefe_morte_corte_quadros` e roda a cena (urso olha, alcança o sino, tomba; luz se apaga; sem gore). Se o herói morrer **no mesmo quadro**, a morte do chefe prevalece e o herói fica com 1 de vida: não se perde depois de vencer.
- **Depois da cena:** controle livre na arena. `item_sino_antigo` (flag `flag_sino_recolhido`) e o **memento** são duas interações independentes, em qualquer ordem. O memento é um objeto interativo (`interagir`, raio 1,0): o herói entra em INTERAGIR por `memento_duracao_quadros`, as armaduras entram em círculo e liga `flag_armaduras_circulo` (sem recompensa; o 02 pode usar a flag no epílogo). Opcional, nunca bloqueia nada.
- **Flag nova que sugiro ao 02:** `flag_urso_derrotado`, para o chefe não renascer se o jogador sair da caverna antes de pegar o sino. Sem ela há soft-lock lógico (sino pegável, urso de volta).
- **Alternativa mais barata:** o memento é só visual (armaduras já em círculo na cena, sem interação). Custo ~zero; perde a escolha do jogador.
- **Peça compartilhada de custo médio:** nenhuma cena existe sem um **roteiro de cena em dados** (lista de passos temporizados: mover câmera, animação, som, diálogo, esperar, ligar flag, trocar variante). É a mesma peça das cenas 1.4, 2.2, 3.3 e 3.4; o formato é do 08. Um por todos, não um por cena.

### (g) Risco de soft-lock — vila adormecida e epílogo
| Risco | Regra de prevenção (custo baixo) |
|---|---|
| Aldeão adormecido bloqueia caminho até a casa ou o portão | Adormecidos sem pushbox bloqueante e fora das rotas de ≥ 2 tiles; o script de caminho do 06 (§8.5 das métricas) roda **por variante**: início → casa da Cuidadora → praça → portão |
| Save no meio de uma cena (flags pela metade) | Não se salva em CENA nem em DIÁLOGO; as flags de cada cena gravam **em bloco no fim** (transação); autosave ao terminar 2.2, 2.3, 3.4 e antes de "Partir" |
| Cura depende do item `item_sino_limpo` e o jogador o perdeu | Item-chave não vendável, não descartável; o ponto do poço checa **flags** (`flag_sino_limpo` e `flag_grace_no_grupo`), não o inventário |
| Jogador não sabe o que fazer na vila adormecida | Objetivo no diário e marcador na casa da Cuidadora; portão fechado até `flag_rumo_ysolt_aceito`, com texto (`ui_`) dizendo por quê |
| Secundária da vila exige NPC acordado e o jogador está na adormecida | Diário mostra "disponível depois da cura"; nenhum item dessas missões é consumido durante o sono (06/02 confirmam) |
| Grace (seguidora, sem lutar) fica presa ou longe | Sem colisão com o herói; se passar de `seguidor_teleporta_dist_tiles` ou ficar presa, reaparece atrás do herói, fora da câmera |
| "Partir" encerra e o jogador queria ficar | Aviso com confirmação, repetível; `flag_epilogo_partir` só liga na confirmação; autosave antes da tela de encerramento, então "Continuar" volta à vila acordada |
| Saídas da vila no epílogo levam a áreas já "fechadas" | No epílogo o portão só abre o aviso partir/ficar; o resto das saídas fica fechado, com texto |
| Perigo na vila | A vila não tem inimigos nem dano em nenhuma variante, então não há morte nela |
| `flag_vila_curada` e `flag_vila_acordada` fora de sincronia | Ligar as duas na mesma transação, no corte da cena 3.4 para 3.5 |

Parâmetros novos (dados; propostas):

| Chave | Valor | Observação |
|---|---|---|
| `chefe_morte_corte_quadros` | 30 | Pausa entre o último golpe e o começo da cena (0,5 s) |
| `memento_duracao_quadros` | 180 | Interação do memento (3 s) |
| `seguidor_dist_alvo_tiles` | 1,5 | Distância que Grace mantém atrás do herói |
| `seguidor_teleporta_dist_tiles` | 8 | Acima disso, ou presa por 3 s, reaparece fora da câmera |

### (h) O que muda no "M1 precisa ter"
**Nada.** O M1 continua só com `map_sala_teste`, o herói e os dois bonecos. O que aparece aqui (variantes por flags, estado CENA, roteiro de cena, morte de chefe, memento, seguidor) é trabalho do M3, e fica em §14 como pendente. Duas coisas baratas valem se alguém tiver folga no M1, sem virarem critério: o estado CENA do herói (travar controle e invencibilidade) e o carregamento de mapa já aceitar a lista `variantes`.

### Extras que afetam custo (fora do pedido)
- **Ponto fraco do urso (ombro esquerdo):** exige **hurtbox por zona** com multiplicador, em vez de uma hurtbox só. Custo **baixo-médio**, e o 06 já tem o multiplicador situacional. **Alternativa:** sem zonas, o bônus vem só da postura quebrada.
- **Grace seguidora:** é um NPC com comportamento de seguir, sem combate. Custo **baixo**, regras acima.

---

## Histórico
- v0.1 (2026-10-24) — rascunho inicial (BRF-003). Sem stack, sem premissa. Inclui a convenção de aviso do 10 e o alinhamento com os critérios M1 do 09.
- v0.2 (2026-10-24) — alinhamento com 06 (formulas.md, metricas.md, D-009), 07 (controles, D1–D5), 10 (diagonais, tingimento, IDs fx_, câmera) e D-007: fôlego e `esquiva_custo` 25, `mana_max`/`folego_max`, colunas de dano nos ataques, `travamento_quadros`, estado QUEBRADO, colisores e linha de visão (§5.9), `map_sala_teste` no M1, novos itens 14b/14c.
- v0.2.1 (2026-10-24) — §15 Respostas ao Produtor (BRF-010, e–h): variantes de mapa por flags, cena de morte do chefe e memento, regras de soft-lock, M1 inalterado; estado CENA no §5.1.
- v0.3 (2026-10-24) — **D-025:** só a visão e o estilo de controle mudam. Câmera isométrica no lugar da 3/4 a 35° (§8.1), ordem de desenho e oclusão (§8.4), movimento no plano isométrico com 8 direções no teclado e direção livre no mouse/analógico (§0, §4.1), esquema de controle `mouse` à Diablo (clique para mover/atacar, cursor mira, 1·2·3 habilidades, Espaço esquiva, clique direito golpe forte) com o esquema `teclado`/gamepad mantido (§3), sprite com 8 direções proposto (§4.6), itens novos do M1 (15b, 17b, 17c). A tentativa de reescrever tudo a partir do protótipo (D-024) foi **descartada** pela D-025: nenhum número, controle nem sistema do protótipo foi copiado.
