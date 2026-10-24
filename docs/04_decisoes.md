# Decisões e mudanças de escopo

> Mantido pelo Produtor (01). Formato: pedido · impacto · opções · decisão · o que sai para isso entrar.
> ADRs técnicos ficam em `docs/tecnico/decisoes/ADR-xxx.md` (08).

## D-001 — Protótipo Dunwick (2026-10-24)
- **Contexto:** a Bíblia manda ler o protótipo antes de decidir stack.
- **Verificação:** nenhum código de protótipo encontrado em `C:\Repos\dunwick` nem em pastas vizinhas de `C:\Repos`.
- **Decisão provisória:** seguir sem protótipo; "Dunwick" usado como **nome provisório** do projeto. Se o protótipo existir em outro lugar, o 08 o avalia antes do ADR-001.
- **Status:** aguardando confirmação do usuário.

## D-002 — Premissa do jogo (2026-10-24)
- **Pedido:** definir pitch/premissa para fechar a Bíblia.
- **Opções:**
  - **A (recomendada) — A Névoa do Esquecimento:** uma névoa apaga as lembranças do vale; o herói, guarda da vila, investiga. Casa com o visual (névoa/luz do diorama), dá tom melancólico com humor e cabe num slice pequeno (vila → região → masmorra da origem da névoa).
  - **B — O Sino Partido:** o sino que protegia a vila foi quebrado e criaturas voltam à noite; o herói busca os fragmentos. Estrutura de missões muito clara; risco de soar genérico.
  - **C — A Estação que Não Muda:** o vale está preso num outono eterno; o herói descobre que alguém congelou o tempo para não perder alguém. Mais emocional; exige mais roteiro para funcionar no slice.
- **Decisão:** opções A/B/C **descartadas** (2026-10-24). O usuário vai trazer a própria premissa depois de terminar a estrutura de agentes; a história será reescrita a partir dela. Pitch e pilares da Bíblia continuam provisórios até lá.

## D-003 — Nome do jogo (2026-10-24)
- **Decisão provisória:** "Dunwick" como nome de trabalho. Antes de adotar como nome final, pesquisar se já existe (Bíblia §10.3).
- **Decisão:** pendente (usuário).

## D-004 — Vocações no slice (2026-10-24)
- **Pedido:** 06 Sistemas perguntou se o slice usa o padrão de vocações (1 completa + 1 parcial).
- **Impacto:** um sistema de vocações soma regras, UI, balanceamento e arte (variações do herói) — conflita com a Bíblia ("1 herói, 2–3 habilidades").
- **Decisão (Produtor):** **sem sistema de vocações no slice.** O herói tem um kit fixo: ataque básico, esquiva e 2–3 habilidades. Os dados devem permitir vocações depois (habilidades por ID, sem acoplamento ao herói). Vocações → backlog P2, reavaliar após M3.
- **Status:** decidido; usuário pode reverter.

## D-005 — Dificuldade no slice (2026-10-24)
- **Pedido:** 06 Sistemas perguntou se o slice terá só Normal ou as 3 dificuldades + assistências.
- **Decisão (Produtor):** **só Normal no slice.** As fórmulas devem expor multiplicadores (dano recebido/causado, janela de esquiva) para que História/Desafio e assistências entrem no M4 sem retrabalho. Opções de conforto já previstas no CLAUDE.md (desligar tremor, flashes, partículas, desfoque) continuam no slice.
- **Status:** decidido; usuário pode reverter.

## D-006 — Respostas de abertura dos agentes (2026-10-24)
Decisões do Produtor (provisórias, usuário pode reverter):
- **Ordem dos itens-modelo:** 1º sprite = herói parado de frente (S); 1º cenário = vila; guia visual do 10 em 2 etapas (spec/pilares/paleta neutra → roteiro de cor por região quando o mundo existir); direção de clima visual vai ao usuário em 2–3 opções.
- **Roteiro:** 1ª entrega do 02 = Bíblia do Mundo só (revisão antes de personagens/missões). Se a premissa do usuário não trouxer tom, valem os padrões (épico, humor leve, melancolia, 12 anos).
- **Arquétipo do herói:** provisório "corpo a corpo com espada + esquiva + 2–3 habilidades" até a premissa/02/06 confirmarem.
- **Orçamento de áudio:** provisório ≤ 2,5 MB no download inicial (SFX P0 + 1 música; resto por região); o 08 confirma no ADR-001.
- **Ferramentas (gerador de sprites, convenção de normal map):** decisão do 08 no ADR-001; até lá ninguém produz.
- **Premissa A (névoa):** descartada (D-002); ninguém usa como base.

Pendente com o usuário: protótipo Dunwick existe? (D-001) · máquina de referência para 60 fps · restrição de licença/custo da stack · destino de publicação · playtesters reais ou usuário + bots · liberar "onda 0" de trabalho que não depende da premissa.

## D-007 — Primeiras entregas da onda 0 (2026-10-24)
Validados: BRF-002 (10), BRF-003 (03), BRF-005 (07), BRF-006 (09). Decisões do Produtor (provisórias, usuário pode reverter):
- **Perigo = magenta** (telegraph e zonas de dano), reservado só para isso; o dourado `brilho` fica só para interativos e coletáveis. Motivo: no teste de daltonismo, o vermelho some no musgo, na pedra e na terra (ΔE 0,02). Em revisão com 03/06/07.
- **Ataque básico = combo leve (3 golpes) + golpe forte**; 3 habilidades no slice (`habilidade_4` reservada). Coerente com a Bíblia ("ataque básico + 2–3 habilidades").
- **Sem dano aleatório/crítico e sem bloqueio/aparar no slice** (pilar "combate preciso"); reavaliar no M4.
- **Prefixo `atk_`** aprovado para ataques básicos (somar à lista de prefixos); o 08 confirma o formato no ADR-001.
- **Save:** manual só em pontos de salvamento no mundo + autosave; a pausa só carrega. Game over → "Tentar de novo" recarrega o último autosave/ponto de controle.
- **Mapa:** fora do slice (ação reservada, sem tecla).
- **HUD:** zona de ação central de 60 % × 60 % sem HUD (regra do telegraph).
- **ID provisório do herói:** `hero_principal`, até a premissa/02.
- **Magenta na UI (complemento, a pedido do 07):** magenta só para golpe no mundo; erro de UI e vida baixa no HUD usam forma + ícone + texto + cor de alerta própria (o 10 define); o foco da UI pode usar `brilho_*`.
- **Direção do sprite nas diagonais (03 × 10):** adotado o meio-termo do 10 (guia A1.2): na diagonal mantém a direção atual se ela for uma das componentes; partindo de parado direto na diagonal usa o lado (L/O); no ataque, vira no 1º quadro e não troca. O 04 valida na animação.
- **Flash do combo leve (guia A1.5):** é tingimento do sprite do alvo, não flash de tela; não conta no limite de 3/s. Contam no limite o flash de tela, o bloom de área grande e a luz de impacto forte, com limitador global. Com "reduzir flashes", o tingimento usa tom médio por 1 quadro.
- **Aviso de golpe:** o preenchimento termina exatamente no 1º quadro ativo. **Gamepad:** movimento no analógico e direcional para atalhos (padrão); o remapeamento deve permitir mover pelo direcional.
- **Controles (07 × 03, `controles_acessibilidade.md` §8):** aprovadas as propostas do 07 para D1–D5: ações extras (inventario, missoes, aba_anterior/proxima, acao_2/3, pular_dialogo); mapa reservado sem tecla e Select → inventario; direcional = atalhos com opção "direcional move"; `correr_modo` = segurar/alternar/sempre; Backspace = cancelar e P = menu (no navegador, Esc em tela cheia só sai da tela cheia). Teclado: inventario = B, missoes = N.
- **Cor de alerta de UI:** rampa `alerta_ui` (paleta v0.2: #f44d21 / contorno #780105, 5,1:1 no painel). Vegetação e neutro quente perderam 1 tom (IDs de cor mudaram; nada produzido ainda).
- **Extras de controle (07 → 03):** gamepad desconectado abre a Pausa com aviso; teclas de debug F1–F10 só no build de desenvolvimento.

## D-008 — Direção de clima visual (2026-10-24)
- **Decisão (usuário):** **A · Lanterna e Musgo** como base do jogo; regiões podem puxar para **B · Cinza e Brasa** (masmorra) ou **C · Iluminura** (região aberta de dia).
- **Efeito:** o 10 usa A como base da etapa 2 (roteiro de cor por região) quando o mundo do 02 existir; o 07 pode iniciar o item-modelo de componentes de UI com materiais do mundo (madeira escura, linho, latão).

## D-009 — Sistemas de combate do slice (BRF-004, 2026-10-24)
Aceitas as suposições do 06 (reversíveis): esquiva custa 25 de fôlego, golpe forte 20, correr grátis; recursos = vida, mana e fôlego (vigor só atributo); escala dos golpes 2,0 por ponto, poder_arma 12, multiplicadores 1,0/1,0/1,5/2,5; estados por acúmulo determinístico; postura só em inimigos (QUEBRADO = 90 quadros e ×1,5 de dano); habilidades com mana 15/8/12 e recargas 6/1,5/8 s (provisórias). `dano_travamento_min_quadros` (20; antes `dano_atordoamento_min_quadros`) e `invencivel_pos_dano_quadros` (60) ficam com o 03; mudanças passam pelo 06. Tipos elementais e nomes de recurso/estado são genéricos até o 02.

## D-010 — gameplay.md v0.2 (2026-10-24)
Aceitas as respostas do 03: alcance medido da origem do golpe até a **borda** da hurtbox do alvo; `reinicio_apos_morte_max_s` = 3; **fôlego entra no M1** (esquiva 25, forte 20; opção de desenvolvimento `folego_custo_ativo`); mana só por acerto em alvo com `concede_mana = sim` (boneco de treino: não). Parede alta e meia-parede (0,75) bloqueiam golpe e projétil; a visão atravessa a meia-parede. Renomeado `dano_atordoamento_min_quadros` → `dano_travamento_min_quadros` (06 atualiza formulas.md §7.2 e D-009). Pilar 2×2 de cobertura = parede alta; `enemy_boneco_golpe` causa dano `impacto`; herói sem postura e ×1,5 de postura quebrada só contra inimigos (06 confirma).

## D-002 (atualização) — Semente da premissa, dada pelo usuário (2026-10-24)
- Jovem guerreiro, aprendiz tentando se formar cavaleiro; a **missão final de graduação** abre a história (referência de estrutura: primeira missão de FFVIII; só estrutura, nada copiado).
- Órfão, passado trágico; motivação de fundo: **vingança contra um rei/tirano** do país. É plano de fundo, não o centro.
- A história começa pequena e **cresce** até algo grandioso: **salvar o mundo de um mal gigante**.
- Tom: "historinha boba" planejada anos atrás no RPG Maker; ir devagar. Slice (M3) cobre só o começo.
- Status: semente aceita; detalhes pendentes de conversa. Ninguém produz nada até o usuário aprovar a Bíblia v1.
- **Gancho (usuário):** o chefe da missão de graduação deixa um **espólio misterioso**, que se revela **maldito/enfeitiçado**. O herói, já formado, ia partir para ser cavaleiro e depois se vingar; mas o objeto atinge alguém da vila e ele precisa **correr atrás de uma feiticeira** para desfazer a maldição. A vingança é **adiada**. Nessa busca conhece a **1ª companheira NPC**.
- **Tom:** humor leve com momentos sérios e tensão.
- **Party (ideia do usuário, fora do slice atual):** jogador + 2 NPCs controlados por IA, cujas habilidades o jogador pode usar; mais NPCs recrutáveis do que vagas, para variar o gameplay. **Conflito de escopo:** a Bíblia põe "Grupo/companheiros" FORA do slice. Decisão pendente (ver opções na conversa).

## D-011 — Classificação 16 anos e tom (2026-10-24)
- **Decisão (usuário):** classificação-alvo sobe de 12 para **16 anos**. Humor **ácido**; tom do jogo **mais adulto**, mantendo aventura épica e momentos melancólicos.
- **Limites propostos (Produtor, usuário pode ajustar):** pode ter violência mais explícita (sem gore extremo), temas sombrios (perda, tirania, morte, culpa), moral cinzenta, ironia e linguagem forte moderada. Sem nudez nem sexo explícito, sem apologia a drogas, sem violência gratuita contra civis como diversão. Efeitos de sangue seguem sendo opção desligável (acessibilidade).
- **Alterado:** `agentes-rpg/02_roteirista.md` (linhas 40 e 47), `agentes-rpg/01_produtor.md` (padrão), `docs/00_biblia_projeto.md`. Substitui o "12 anos" citado na D-006.

## D-012 — Companheira no slice (2026-10-24)
- **Decisão (usuário, opção A):** a primeira companheira aparece no **fim do slice só como cena e diálogo** (anda com o herói, sem lutar nem habilidades compartilhadas). O **grupo de 3** (jogador + 2 NPCs de IA, habilidades usáveis pelo jogador, mais NPCs recrutáveis do que vagas) entra **depois do slice**. Os dados já ficam preparados (habilidades por ID, D-004).
