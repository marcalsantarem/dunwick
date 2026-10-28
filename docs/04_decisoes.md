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

## D-013 — Escolhas do usuário sobre a história (2026-10-24)
Fonte: `docs/narrativa/opcoes_v1.md` (02). Escolhas:
1. **Espólio:** **ideia própria do usuário**: um **sino antigo, que havia sido roubado**; ao ser usado na vila, causa a maldição. (Substitui as opções A/B/C do 02; selo real/relicário **descartados** como espólio. Como o sino liga ao rei e ao mal gigante fica a definir com o 02.)
2. **Atingida:** **a cuidadora que criou o herói** (idosa curandeira da vila).
3. **Passado do herói:** **a aldeia queimada** (soldados do rei queimaram a aldeia dele por tributo atrasado; ele sobreviveu escondido).
4. **Rei:** **rei fantoche e chanceler tirano** (rei velho e doente; quem manda é um chanceler burocrata cruel; humor de burocracia e taxas).
5. **Feiticeira:** **charlatã de feira** (famosa por "curas" que são truques; o poder verdadeiro é de outra pessoa; empurra o herói a quem ajuda).
6. **Companheira:** **aprendiz da feiticeira** (jovem maga, nervosa e tagarela; compatível com a feiticeira charlatã: é dela o poder verdadeiro).
7. **Humor:** **Tom 2, autoironia + burocracia absurda** (pitadas dos outros tons só se o usuário pedir).
8. **Nomes:** usuário quer **escolher um a um** (pendente).
Efeitos a tratar pelo 02: o sino substitui o chefe-cavaleiro-do-selo (quem o roubou, quem o guardava na caverna?); sem "mestre instrutor" atingido, o treino precisa de outro NPC; a cuidadora é a única que saberia curar, então a vila fica sem saída; o rei fantoche + chanceler muda a figura do vilão da vingança (o herói se vinga do rei ou do chanceler?).

## D-014 — Nomes escolhidos pelo usuário (2026-10-24)
| Item | Nome |
|---|---|
| Herói | **Edric Moss** |
| Vila inicial | **Baixo Orvalho** |
| Reino | **Mor-Allen** |
| Chanceler tirano | **Oswin Cathe** |
| Rei fantoche | **Ulfrec** |
| Feiticeira charlatã | **Ysolt Brum** |
| Companheira (aprendiz) | **Grace** (nome do próprio usuário; 02 checa originalidade) |
| Mal gigante | **a definir**, depois de desenvolver mais atos da história |
- Os nomes foram checados só de memória pelo 02. **Pendente:** busca na web de originalidade antes de fixar (nomes do roteirista) e nome do jogo ("Dunwick" segue provisório; é lugar real e lembra "Dunwich").

## D-015 — Rodada final da história (2026-10-24)
**Revisão do usuário sobre as opções do 02** (as respostas dele substituem D-013 onde conflitam):
- **Sino (origem):** perdido quando a **aldeia do Edric foi saqueada**, há 10 anos (quando os pais morreram). Um **monstro** o achou e o guarda como tesouro no **covil ao fim da dungeon inicial** (caverna ou bosque, a critério do Produtor: **caverna**, coerente com a graduação). O **chefe é o monstro**. Obter o sino é a **última tarefa do treinamento**, tida como muito difícil (outros guerreiros já tentaram).
- **Sino sem vínculo com o chanceler.** É só o "start" da jornada do herói. Ao ser usado, o sino pode ter sido **corrompido** no tempo fora da vila, **ou** protegia a vila de um mal que, corrompido, ele passa a potencializar (a decidir mais adiante).
- **Maldição:** faz **todos na vila adormecerem** (a cuidadora é uma delas; a pergunta "por que ela" fica sem resposta específica). O herói **não é afetado** por causa de uma **marca**, que muito no futuro se revela como ser "o escolhido"/"diferente".
- **Cadeia do slice:** Edric procura uma curandeira → **Ysolt Brum** (a feiticeira da feira) **confessa que não tem poder real** → **Grace**, aprendiz de curandeira (classe: "curandeira" por ora; talvez "maga branca"), se prontifica a ajudar → **voltam à vila e curam quem adormeceu**: **fim do slice**.
- **Ficam como recomendado:** (b) treinador = **sargento aposentado da Guarda**; (c) aldeia queimada por **ordem do chanceler com o selo do rei**, Edric crê que foi o rei; (h) **18 anos hoje, saque há 10**; (i) **sem Luz/Sombra** por ora (Fogo, Gelo, Raio, Natureza); (k) **rei lúcido e arrependido**.
- **Nome do rei:** **Ondric** (substitui Ulfrec, por semelhança com Ulfric Stormcloak). Em D-014, onde está "Ulfrec" leia "Ondric".
- **Pontas ainda abertas:** a marca do herói (aparência e pista), o poder de Grace (cura; mecânica de cura da vila no slice), nomes de NPCs menores (j), o mal gigante e sua natureza.
- **Efeito na Bíblia v1:** o fim do slice mudou (agora termina com a cura na vila, em vez de Grace se juntando); a seção foi atualizada.

## D-016 — Tecnologia (ADR-001, 2026-10-24)
- **Decisão (usuário):** **Three.js + câmera ortográfica + resolução interna 640×360** (escala inteira ×3). Medido: Alto 176 fps (pior 1 % 120), Baixo 478, 1ª tela ≈ 2 s, download inicial 1,75 MB. Ferramentas gratuitas/abertas; **geradores de assets em JavaScript/Node** (sem Python/Pillow); normal map OpenGL (verde para cima); animar sprites por shader/instância.
- **Efeito:** ADR-001 sai de "proposto" para aceito. Falta o usuário informar a máquina dele (remedir) e se há Mac/Safari. Próximo: briefing do esqueleto M1 (só quando o usuário pedir).

## D-017 — Marca, chefe, cura e sino (2026-10-24)
Respostas do usuário às perguntas n, o, p, q, r, s do 02:
- **n) Marca do Edric:** **desenho de sino no antebraço**; esquenta e brilha quando o sino toca (pista no slice).
- **o) A cura (resposta própria):** a **Grace "abençoa" o sino** (feitiço branco antigo) e o **limpa**; ao usá-lo, a **aura sombria da vila some e as pessoas acordam**. O Edric encontra o feitiço nos **livros da cuidadora/curandeira** e vai atrás de uma feiticeira (Ysolt) para executá-lo; Ysolt confessa que não pode, e a Grace o faz. Mecânica no slice: cena/uso do sino limpo, sem estado "adormecido" jogável (06/03 confirmam).
- **p) Chefe da caverna:** **urso-musgo gigante** (musgo e cristais, acumula objetos brilhantes). Nome ainda a escolher.
- **q) Urgência:** **sono sem prazo** (recomendada, aceita por padrão; a urgência é emocional).
- **r) Sino no fim do slice:** o sino fica **"limpo"** (resposta própria; sem vínculo com a Coroa; mistério sobre o mal mantido).
- **s) Classe da Grace:** **curandeira** por ora (aceita por padrão; "maga branca" pode vir depois).
- **Pendente:** (j) nomes de NPCs menores, aldeia queimada, capital, instituição, sino e chefe; mal gigante. O 02 ainda não foi avisado desta rodada (será junto com a rodada de nomes).

## D-018 — Secundárias, urso e quantidade (2026-10-24)
Respostas do usuário às perguntas t, u, v do 02:
- **t) Epílogo livre na vila acordada:** após a cura, o jogador pode terminar as secundárias da vila que faltarem. **Exige** uma cena a mais e um estado "vila acordada" (06/03 confirmam o custo).
- **u) O urso-musgo morre** depois da luta; as armaduras de quem tentou antes ficam como memento. Mais sombrio. **Atenção:** a fala da Cuidadora "É só um sino" perde contraste com morte; o 02 ajusta o tom.
- **v) 4 secundárias (total 5 missões, no limite da Bíblia):** 2 na vila, 1 na estrada e **1 nova na feira** (a escrever pelo 02).
- Pendentes: nomes menores (j), mal gigante, nome do jogo.
- O 02 ainda não foi avisado desta rodada (será junto com a rodada de nomes).

## D-019 — Custo dos estados da vila e extras do urso (BRF-010, 2026-10-24)
- **Vila em 3 estados: versão COMPLETA** (usuário): sprites novos de aldeões deitados (adormecida) e poses próprias na vila acordada, além da luz. Custo de arte **médio** (04 Sprites e 07 Cenário). Simulação: mapa único com 3 variantes escolhidas ao carregar pelas flags, precedência acordada > adormecida > dia; aldeões dormindo são props sem IA, sem hurtbox e sem colisão que bloqueie rota; o save guarda só flags.
- **Memento das armaduras: SIMPLIFICADO** (usuário): só visual, sem interação (substitui a ação opcional de 3 s e `flag_armaduras_circulo`).
- **Ponto fraco do urso: SIMPLIFICADO** (usuário): apenas bônus quando a postura quebra, sem hurtbox por zona (o ×1,25 de ponto fraco em formulas §4.4 vira só o bônus de postura quebrada; 06 ajusta).
- **Aceito das respostas do 03/06:** estado CENA do herói (invencível, trava na morte do chefe, pausa de 30 quadros); roteiro de cena em dados (passos temporizados) compartilhado pelas cenas 1.4, 2.2, 3.3 e 3.4, com formato do 08; flag `flag_urso_derrotado` (o urso não renasce); manter uma só flag entre `flag_vila_curada` e `flag_vila_acordada`; não salvar em CENA ou DIÁLOGO; ponto da cura checa flags, não inventário; Grace seguidora sem colisão com o herói; itens com valores iniciais (doce 25, sopa 30, poção 50, carimbo sem efeito).
- **O M1 não muda** (tudo isso é M3).

## D-020 — Treinamento íntimo, nomes e a aldeia (2026-10-24)
- **Treinamento (usuário):** é **íntimo**: o Edric tem **um mestre** que o treina e ele é o **único aluno**. O desafio final **não é uma formatura de guilda**: é um **teste para o mestre considerar que ele está pronto** para ir ao mundo. O plano dele seria então **alistar-se na Guarda de Mor-Allen**, mas isso **não acontece** por causa do desenrolar da história.
- **Mestre:** **Torvan Keel** (ex-sargento aposentado da Guarda, seco, cita o regulamento; substitui "o sargento"). **Cuidadora/curandeira:** **Maren**. **Instituição:** **A Guarda de Mor-Allen** (o que ele sonha em integrar). **Capital:** **Valmora**. **O sino:** **O Sino de Cobre**.
- **Aldeia saqueada há 10 anos = a própria Baixo Orvalho** (reconstruída). O sino era dela; volta para casa. Maren e Torvan são sobreviventes. Não há outra aldeia a nomear.
- **Regra de nomes (usuário):** **nomes típicos de RPG, não brasileiros** (pessoas). Nomes de lugares em português descritivo (Baixo Orvalho) são aceitos. Renomear NPCs com nomes brasileiros (ex.: "Zefa", "Seu Tadeu Doce").
- **Pendentes:** nome do urso-musgo, do vendedor da feira e de demais NPCs menores (02 propõe, tipo RPG); mal gigante; nome do jogo.
- **Ajuste de história:** onde os textos dizem "graduação/formatura" ou "cavaleiro", trocar pelo teste do mestre; o "plano de ser cavaleiro" vira "alistar-se na Guarda"; a "vingança" segue como pano de fundo.

## D-021 — Nomes finais do slice (2026-10-24)
- **Urso-musgo (chefe):** **Hollowpaw**.
- **NPCs menores (aceitos):** ferreiro **Hargen Stoll**, taverneira **Elda Pott**, escrivão **Corvin Ledge**, viajante **Tam Rowley**, vendedor da feira **Bram Honeywell**.
- **Resumo dos nomes fixados:** Edric Moss · Baixo Orvalho · Mor-Allen · Valmora · Oswin Cathe · Ondric · Ysolt Brum · Grace · Torvan Keel · Maren · Hollowpaw · O Sino de Cobre · A Guarda de Mor-Allen.
- **Pendentes:** nome do mal gigante e nome do jogo ("Dunwick" provisório). Checagem formal de marca no M6 (Valmora lembra o jogo indie "Legend of Valmorra"; risco baixo-médio).
- O 02 atualiza a ficha do urso e os textos com os nomes decididos (será avisado junto com o próximo pacote, para não gastar mensagem).

## D-022 — Máquina de referência (2026-10-24)
- **Informada pelo usuário:** AMD Ryzen 3 5300G (4 núcleos, 8 threads, 4,0 GHz), gráfico integrado Radeon, 2 × 16 GB DDR4 3200 MHz, SSD SATA 480 GB, fonte 500 W. **É a mesma máquina em que o 08 mediu os spikes e o esqueleto M1**, então os números do ADR-001 já valem para ela.
- Efeito: a máquina de referência passa a ser **oficial**; "computador intermediário" = esta. Continuam pendentes: navegador que o usuário usa (assumido Chrome) e se há Mac/Safari.
- **Navegador e dispositivos (usuário, 2026-10-24):** usa **Chrome** no PC; **não tem Mac**, só **iPhone**. **Safari/macOS ficam fora da matriz de testes até o M5** (teste do áudio Ogg-Opus no Safari adiado; plano B AAC/MP3 do ADR-001 permanece). Celular continua depois do M5 (já previsto); o iPhone serve para um teste de celular nessa fase. Matriz do slice: **Chrome (principal), Edge e Firefox** no Windows.

## D-023 — Inimigos comuns do slice (2026-10-24)
- **Regra relaxada pelo usuário:** inimigos comuns podem ser **monstros genéricos de fantasia** (morcego, slime, lobo, goblin...), **sem lore profunda**. A regra de originalidade segue valendo para **personagens e criaturas específicos de outras obras** (nomes, desenhos e identidades próprias): não copiar. O chefe e os personagens da história continuam originais.
- **Os 5 inimigos comuns (aceitos):** 1) **Morcego** (caverna, Rápido) · 2) **Slime** (caverna, Emboscador) · 3) **Besouro-couraça** (caverna, Pesado) · 4) **Lobo** (estrada, Combatente) · 5) **Goblin arqueiro** (estrada, Atirador). IDs sugeridos: `enemy_morcego`, `enemy_slime`, `enemy_besouro`, `enemy_lobo`, `enemy_goblin_arqueiro` (06 confirma).
- **Efeito:** a "gente da estrada" deixa de ser saqueadores humanos arruinados por taxas; a piada da burocracia fica nos NPCs e nas secundárias. 02 ajusta a Bíblia do Mundo (§7) e os textos; 06 cria as fichas (arquétipos Rápido, Emboscador, Pesado, Combatente, Atirador) e 04/10 definem o visual.
- O 02 e o 06 ainda não foram avisados (junto com o próximo pacote).

## D-024 — Mudança de direção: gráfico e jogabilidade a partir do protótipo (2026-10-24)
- **Usuário:** não gostou do esqueleto cinza em Three.js (gráfico e jogabilidade). Passou o protótipo **"Vale de Dunwick"** (https://dunwick.netlify.app; cópia em `referencia/prototipo/index.html`; análise em `referencia/analise_prototipo.md`). Quer **aquela ideia, mais bonita e polida**, **sprites bem feitas**, **cenário e UI melhores**, a **jogabilidade do protótipo**, e que o **esqueleto seja refeito**.
- **Protótipo localizado:** substitui D-001 (que dizia não haver protótipo). A regra "ler o protótipo antes de decidir a stack" passa a valer: **D-016 (Three.js, 640×360, ortográfica 35°) fica em revisão**; o 08 propõe o **ADR-002**.
- **Em revisão (a confirmar após as respostas dos agentes e do 08):** câmera 3/4 a 35° → **isométrica 2:1**; 32×32 px/tile e 640×360 → **tile 64×32 isométrico, 1280×720**; "pixel art 16-bit em 3D" → visual **do protótipo**; D-007 "sem crítico" (o protótipo tem 10 %); `CLAUDE.md` e Bíblia v1 serão atualizados quando o ADR-002 for aceito.
- **Continua valendo:** história e nomes (D-013 a D-023), 16 anos, direção A Lanterna e Musgo (combinada com o protótipo pelo 10), telegraph obrigatório, passo fixo, dados fora do código, tudo gerado por código, escopo do slice.
- **O que fica obsoleto:** o esqueleto `src/motor` em Three.js e os placeholders cinza (o 08 decide o que reaproveitar: laço, dados, testes, debug).
- Briefing: `docs/briefings/BRF-011_mudanca-direcao-prototipo.md`.

## D-025 — CORREÇÃO da D-024: só a visão isométrica e o estilo de jogo mudam (2026-10-24)
- **Usuário:** o protótipo "Vale de Dunwick" foi mostrado **só como referência do estilo isométrico**. **Não é para copiar o protótipo** nem **mudar os sistemas já combinados**. A única mudança nos combinados é: **jogo isométrico, jogabilidade com sensação "meio Diablo" (ação com mouse, hack'n'slash), gráfico HD-2D bonito, bem polido e trabalhado**. "Só isso."
- **Continua valendo (tudo o que já estava pronto):** história e nomes (D-013 a D-023), 16 anos, Bíblia v1, direção A Lanterna e Musgo, telegraph magenta, passo fixo 60 Hz, dados fora do código, fórmulas e atributos do 06 (D-007, D-009: **sem crítico/aleatório, com atributos e mana, golpe forte, esquiva com fôlego**), inimigos (D-023), chefe Hollowpaw, vila em 3 estados (D-019), UI e acessibilidade planejadas pelo 07, escopo do slice, máquina e navegadores (D-022), HD-2D como estilo (sprites 2D em cena 3D com luz, sombras, profundidade, névoa) já previsto desde a Bíblia.
- **Muda:** (1) **câmera isométrica** (no lugar da 3/4 fixa a 35° de frente), (2) **controles e sensação à Diablo**: ação com mouse (clicar para mover/atacar, habilidades em teclas, mira no cursor), mantendo as regras de combate já decididas, (3) **polimento visual maior** (o esqueleto cinza e o 640×360 cru não servem; o 08/10 definem resolução e acabamento), (4) o **esqueleto** é refeito para isso.
- **Anula da D-024:** copiar números, controles exatos, crítico, UI e tamanhos do protótipo; o conteúdo de `referencia/` fica só como **referência de estilo**. A D-016 (Three.js, HD-2D) **segue em revisão só no que a câmera isométrica e o polimento exigem** (ADR-002 do 08).

## D-026 — Vila sem ciclo de dia e noite no slice (2026-10-24)
- **Decisão (usuário, opção A):** a vila usa **estados fixos** (dia, adormecida, acordada), com um **entardecer** como luz da direção A. **Sem ciclo de dia e noite contínuo** no slice; o ciclo completo fica para depois do slice.

## D-027 — Esqueleto isométrico aprovado como primeira versão (2026-10-25)
- **Usuário (testou em casa, no Chrome):** gostou bastante do esqueleto isométrico HD-2D como **versão inicial**. **Pendências de qualidade:** **melhorar a animação** e **refinar os gráficos**. Para uma primeira versão do slice, "está bem válido".
- **Efeito:** o rumo visual (isométrico, HD-2D, praça de Baixo Orvalho) está **aprovado**; o ADR-002 (medições comparativas) segue adiado; a polimento de animação e gráfico entra no backlog P1 para antes do M2.

## D-028 — Combate por turnos (2026-10-26)
- **Decisão (usuário):** o jogo segue com **combate por turnos**, no estilo **Breath of Fire** (cena de batalha com personagens e inimigos em sprite sobre o cenário, caixas de vida e habilidade embaixo), mundo **isométrico** para exploração. Grupo de **3** (herói + 2 aliados) como ideia de longo prazo.
- **Preservado:** tudo o que foi projetado para o combate de ação fica em `docs/arquivo/combate_acao/` e na **tag `combate-acao-v1`** (modo de ação futuro, seções em ação ou híbrido).
- **Substitui:** D-007, D-009 (partes de tempo real), D-010 e D-019 (partes de aviso/esquiva em tempo real), BRF-003/BRF-010 no que for de tempo real. **Segue:** história, nomes, direção de arte, inimigos (D-023), vila em 3 estados (D-019), esqueleto técnico (render, câmera, dados, testes).
- **Em aberto (a decidir com o usuário):** como o inimigo aparece (visível no mapa ou encontro aleatório), turnos por rodada ou barra de tempo (ATB), quantos no grupo no slice (companheira entra em cena, D-012), evolução de habilidades por uso (BL-001), classe do Edric.
- **Próximo passo:** o Produtor monta a comparação curta de formatos de turno quando o limite de uso do usuário permitir; só então os agentes (03, 06, 07, 04, 09) revisam seus documentos.

## D-029 — Arte segue 100 % por código (2026-10-27)
- **Decisão (usuário):** manter **todos os assets gerados por código** (sem editor externo, sem IA de imagem), por simplificação. Nenhuma conexão (MCP) de arte será adotada agora. Uma **versão remaster** com arte refeita (editor de pixel art ou IA de imagem local, com registro de origem e termos) fica como ideia futura (BL-003).
- **Para melhorar a qualidade dentro da regra:** moldes de pixels desenhados à mão em texto (como o rosto do Edric) e, se o usuário quiser, imagens de referência de estilo para o 04 desenhar olhando.

## D-030 — Visual do Edric aprovado (2026-10-27)
- **Aprovado pelo usuário:** o sprite do Edric (pose parada, 5 direções, célula 96, rosto em molde de pixels desenhado à mão, pescoço encurtado). Gerado por `tools/arte/edric.mjs` e `tools/arte/rostos.mjs`.
- **Pendências do Edric (não bloqueiam):** o lado oeste sai espelhado (ombreira e faixa trocam de lado); animações e poses de batalha por turnos ainda não existem; mapa de relevo para a luz não foi feito; o Diretor de Arte ainda precisa aprovar 5 cores novas (rampa verde-musgo e um tom de linho).
- **Item-modelo:** serve de referência de estilo para os demais personagens (Torvan, Maren, Grace, inimigos, Hollowpaw).

## D-031 — Combate por turnos: formato, encontros e grupo (2026-10-27)
- **Formato A (usuário):** **rodadas, estilo Breath of Fire**: a cada rodada escolhem-se os comandos de todo o grupo e todos agem em ordem de agilidade; tela de batalha separada, com personagens e inimigos em sprite sobre o cenário.
- **Encontros B (usuário):** **encontro aleatório** (passos no mapa disparam a batalha). Inimigos visíveis no mapa não entram por ora.
- **Grupo A (usuário):** a **Grace luta com o Edric** a partir da feira (volta à vila e luta final do slice), com cura como habilidade. Isso **substitui a parte da D-012** que dizia "só em cena, sem lutar". Grupo de 3 segue como meta futura.
- **Pendente:** revisão da estrutura de agentes (criar/dividir), que o usuário pediu para confirmar antes de qualquer alteração nos arquivos dos agentes.

## D-032 — Nova estrutura de agentes (2026-10-27)
- **Decisão (usuário, fase 1 como proposta):** dividir e criar agentes: **03 Combate por turnos e IA** + novo **13 Exploração, Interação e Missões**; **06 Design de Combate e Classes** (especialista em RPG, com simulações) + novo **14 Níveis e Mundo**; **07 Cenários** (inclui a cena de batalha 3D) + novo **15 UI/UX**; novo **11 Gestor de Backlog e Publicação** (PO + scrum master + releases). **12 Designer de Personagens e Retratos** fica para a **fase 2** (caixas de diálogo); **animador separado** só se virar gargalo.
- **Quadro de tarefas em arquivo** (`docs/05_quadro.md`) por ora; espelhar no GitHub Projects quando o plugin do GitHub funcionar.
- **Arquivos:** novos `agentes-rpg/11_*.md`, `13_*.md`, `14_*.md`, `15_*.md`; blocos de "DIVISÃO DE ESCOPO" em `03`, `06` e `07`. Os arquivos antigos mantêm o texto completo (que serve de base para as duas metades).
- **Sessões:** o usuário abre sessões novas para 11, 13, 14 e 15; as sessões Jogabilidade, Sistemas e Cenario continuam com o escopo reduzido.

## D-033 — Onda 1 aprovada e parâmetros do M1 (2026-10-27)
- **Onda 1 aprovada** (BL-004 a BL-008). **BL-004** (especificação do combate por turnos, `docs/combate_turnos.md` v0.2 e `docs/sistemas/formulas_turnos.md`) **concluída**.
- **M1:** **Fugir ligado** (desligado em chefe); **3 encontros** (`enc_slime_1`, `enc_lobo_1`, `enc_misto_1`), com **Slime e Lobo** como inimigos; **batalhas curtas aceitas** (20 s a 1 min, rebalancear no M3).
- **Liberadas agora (em paralelo):** BL-005 UI de batalha (15), BL-006 cena de batalha (07, com o 10), BL-007 poses do Edric (04). **Depois:** BL-008 controlador e transição (03, 13, 08).
- **Pendente do 06:** valores de `defesa` de Edric, Grace e Lobo.

## D-034 — Mini marcos da demo (v0.1.1 a v0.1.8) (2026-10-28)
- **Decisão (usuário):** antes do slice completo, entregar uma **demo jogável** (cerca de 30 minutos) em **versões pequenas v0.1.x**, cada uma com **um pull request `dev → main`** e tag. Roteiro em `docs/02_roadmap.md` (seção "Demo"). O slice oficial **continua** como combinado (D-007, Bíblia); a demo é um recorte dele.
- **Escopo novo aceito pelo usuário (fora do slice original):** minimapa, baús de tesouro, lojas e moeda, missões de coleta e caça na vila. Registrados como BL-027 a BL-031.
- **Substitui:** "uma PR por marco M" e "tag v0.2.0 após o M1": agora a tag é por versão v0.1.x.

## D-035 — Dungeon: bosque que leva à caverna (2026-10-28)
- **Decisão (usuário):** a região ao redor da vila é de **campos e planícies**; mais adiante há uma **parte de bosque**, e no fim dele a **caverna do Hollowpaw** (dungeon). Mantém a caverna da Bíblia e acrescenta o bosque. Nome da região e da caverna: a definir (02 + 14, v0.1.7).

## D-036 — Progressão por nível de XP; evolução por uso adiada (2026-10-28)
- **Decisão (usuário):** na v0.1.5, **subir de nível por XP** aumenta atributos e libera habilidades. **BL-001 (habilidades que evoluem pelo uso) segue adiada** para depois do slice.
- **A definir na v0.1.5:** classe do Edric e suas habilidades; modo de salvar e de recuperar vida/mana no mapa; recompensas pós-batalha.

## D-037 — Arte final depois da demo; Hollowpaw pode ser poupado (2026-10-28)
- **Arte final (M2):** entra **depois da demo v0.1.8**, antes do slice completo. A demo usa a arte atual do esqueleto.
- **Hollowpaw:** fase 3 com "Hesita" (ficha do 06) e **o jogador pode poupá-lo**. **Altera a D-018** (que dizia que ele morre). A v0.1.8 precisa de duas cenas pós-batalha (matar ou poupar) e o desfecho muda o que a vila recebe. O 02 define as consequências.
