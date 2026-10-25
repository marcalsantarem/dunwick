# Critérios por marco

> **⚠️ D-024 (2026-10-24): mudança de direção.** O alvo agora é o protótipo do usuário (isométrico 2:1, 1280×720). Os critérios do M1 abaixo foram escritos para o esqueleto cinza 3D 640×360, rejeitado. Marcas na coluna de ID: **[mantém]** vale como está · **[a atualizar D-024]** depende de câmera 35°, 640×360, sala 48×32, teclas F, valores ou placeholders · **[substituir D-024]** sai. Análise e critérios novos (N-01…N-14): [impacto_d024.md](impacto_d024.md). Números novos só depois do ADR-002 (08) e do `gameplay.md` novo (03). M2 e M3 também a rever.

> **Status:** RASCUNHO v0.1 (BRF-006, onda 0) · Dono: 09 QA · 2026-10-24
> M1 **detalhado e verificável**; M2 e M3 em rascunho; M4–M6 só tópicos.
> Coerente com `01_produtor.md` §6, `docs/02_roadmap.md` e `08_arquiteto-tecnico.md` §8. Números marcados **[aguarda 08]** são provisórios até o ADR-001/spikes (BRF-001); valores de jogo vêm de `docs/gameplay.md` v0.1 (BRF-003; preenchidos em 2026-10-24).
> Plano geral: [plano_testes.md](plano_testes.md) · Casos de fórmula: [casos_unidade_m1.md](casos_unidade_m1.md).

## Como o QA recomenda

Ao fim de cada marco o QA entrega ao Produtor (01) um relatório com a tabela de critérios preenchida (✅ passa · ⚠️ passa com risco · ❌ não passa · ⬜ não testado) e uma recomendação:

| Recomendação | Quando |
|---|---|
| **Passa** | Todos os critérios **obrigatórios** ✅; nenhum ⬜ obrigatório |
| **Passa com riscos** | Obrigatórios ✅, mas algum **desejável** ❌/⚠️, **ou** um obrigatório ⚠️ dentro da tolerância declarada. Lista de riscos para o usuário aceitar (registro em `04_decisoes.md`) |
| **Não passa** | Qualquer obrigatório ❌ ou ⬜ sem justificativa aceita, ou bug S1/S2 aberto (conforme o marco) |

Quem decide é o usuário, via Produtor. Itens ⬜ sempre aparecem na seção "não testado".

## Build diária (a partir do M1)

| ID | Critério | Medida / método | Passa quando |
|---|---|---|---|
| BD-01 | Dados e assets validam | Validador do build [aguarda 08] | 0 erros |
| BD-02 | Testes automáticos passam | Executor de testes do build | 100 % passam |
| BD-03 | Jogo abre | Abrir a build no navegador de referência | Chega à sala/tela inicial sem erro no console |

---

## M1 — Protótipo cinza (detalhado)

**Entrega (roadmap):** herói se move e ataca numa sala 3D cinza com luz e câmera.
**Pronto quando (roadmap):** sensação aprovada em playtest.

### Condições de teste do M1
- **Máquina:** intermediária de referência [aguarda 08/usuário]; provisório GPU integrada recente. Registrar CPU, GPU, RAM, SO, resolução, **taxa do monitor**.
- **Navegadores:** Chrome (referência), Edge e Firefox recentes no Windows. Safari/macOS **não** é exigido no M1.
- **Janela:** 1920×1080 em tela cheia (ou janela maximizada) e uma rodada em 1280×720.
- **Cena:** `map_sala_teste` 48×32 tiles (`docs/niveis/metricas.md` §8): início (4, 7); `enemy_boneco_alvo` (11, 4) e `enemy_boneco_golpe` (16, 4), 5 tiles um do outro; zonas do M1: campo, parede solta (12–17, z 9), rampa (21–23, z 3–5), plataforma (24–35, z 1–8), escada (33–35, z 9–10), pátio, corredor de 3 tiles e arena 16×12 com porta aberta. Interação, NPC, baú, armadilha e portais **não** fazem parte do M1. Teclas de debug F1–F4 e F6–F10 (03 §10). Herói no nível 1: atributos 5, `vida_max` 140 (formulas §3.1, V1).
- **Ferramenta de medida:** modo debug do jogo (M1-19). Sem ele, a maioria dos critérios não é verificável → M1 **não passa**.

Tipo: **O** = obrigatório · **D** = desejável.

### A. Plataforma e laço

| ID | Tipo | Critério | Medida | Método | Passa quando |
|---|---|---|---|---|---|
| M1-01 [a atualizar D-024] | O | Abre no navegador sem erro | Erros no console; tempo do comando documentado até a sala jogável | Abrir 3× em cada navegador da matriz M1, cache limpo na 1ª vez; cronometrar | 0 erros nas 9 aberturas; sala jogável em ≤ 8 s (local) [aguarda 08] |
| M1-02 [mantém] | O | 60 fps na sala cinza | fps médio e **pior 1 %** em 3 min | Herói andando, atacando e esquivando sem parar por 3 min; exportar tempos de quadro do debug; descartar os 10 s iniciais | Média ≥ 58 fps **e** pior 1 % ≥ 45 fps no Chrome da máquina de referência [aguarda 08]; Edge/Firefox: média ≥ 55 (D se abaixo) |
| M1-03 [mantém] | O | Sem engasgos | Quadros > 50 ms após a carga | Mesma gravação de M1-02 | ≤ 1 quadro > 50 ms por minuto; nenhum > 250 ms |
| M1-04 [mantém] | O | Passo fixo de 60 Hz | Ticks de simulação por segundo; distância percorrida | Contar ticks no debug por 10 s; andar em linha reta 10 s (entrada contínua) num monitor de 60 Hz e, se houver, num de 120/144 Hz (ou com fps limitado a 30 por ferramenta do navegador) | 600 ± 1 ticks em 10 s; distância igual entre taxas de quadro (diferença ≤ 1 %) |
| M1-05 [mantém] | O | Aba em segundo plano pausa e **não** simula o tempo perdido | Ticks e posição antes/depois; áudio | Herói andando (ou parado com algo em movimento); trocar de aba por 30 s; voltar | Contador de ticks avança ≤ 2 durante a ausência; herói/objetos na mesma posição (± 0,05 tile); sem "corrida" acelerada ao voltar; áudio (se houver) para e volta |
| M1-06 [a atualizar D-024] | O | Redimensionar a janela não quebra | Escala inteira, sem erro | Redimensionar 5× entre 1280×720 e tela cheia; alternar tela cheia 3× | Sem erro no console; pixel continua nítido (ver M1-14); câmera continua centrada |

### B. Entrada

| ID | Tipo | Critério | Medida | Método | Passa quando |
|---|---|---|---|---|---|
| M1-07 [a atualizar D-024] | O | Teclado aciona todas as ações do M1 | Ações lógicas recebidas | Debug de entradas: acionar cada ação do M1 (`mover` 8 direções, `correr`, `atacar`, `forte`, `esquivar` e as de debug F1–F4, F6–F10; 03 §3.2/§10) | 100 % das ações reconhecidas; F5, F11 e Ctrl+W continuam com o navegador (não são capturados) |
| M1-08 [a atualizar D-024] | O | Gamepad aciona as mesmas ações | Idem | Gamepad padrão (layout comum de console); conectar com o jogo aberto | 100 % das ações; analógico com zona morta (herói não anda sozinho com o analógico solto, 30 s) |
| M1-09 [a atualizar D-024] | O | Gamepad conecta/desconecta durante o jogo | Erros, controle | Desconectar e reconectar 3× durante o movimento | Sem erro; herói para ao desconectar (não fica andando); controle volta em ≤ 2 s após reconectar; teclado funciona o tempo todo |
| M1-10 [mantém] | O | Resposta da entrada | Ticks entre a entrada e o início da ação | Avanço quadro a quadro no debug: apertar ataque com herói livre | Ação começa no tick seguinte à entrada (≤ 1 tick) |
| M1-11 [mantém] | O | Buffer de entrada | Execução de ação apertada antes do fim da anterior | Quadro a quadro (F6/F7, buffer visível em F4): apertar `atacar` e, em outra rodada, `esquivar`, N quadros antes de o estado permitir a ação, N = 1…10 | Executa para N ≤ 7; **não** executa para N ≥ 8 (`buffer_entrada_quadros` = 7); nenhuma ação dupla; com 2 ações no buffer vale a mais recente (empate: `esquivar` > `forte` > `atacar`) |

### C. Movimento e câmera

| ID | Tipo | Critério | Medida | Método | Passa quando |
|---|---|---|---|---|---|
| M1-12 [a atualizar D-024] | O | Velocidades conforme os dados | tiles/s (posição no debug) | Andar e correr 5 s em linha reta, 3×; calcular tiles/s | Andar 3,5 e correr 6,0 tiles/s ± 5 % na medida manual (o teste automático do 03 usa ± 1 %) |
| M1-13 [a atualizar D-024] | O | Diagonal igual à reta | tiles/s na diagonal | Igual a M1-12 nas 4 diagonais | Diferença ≤ 2 % em relação à reta |
| M1-14a [mantém] | O | Não atravessa paredes | Ocorrências | 20 tentativas contra paredes e 10 em quinas, andando, correndo e esquivando | 0 atravessadas; 0 vezes preso (sai em ≤ 1 s mudando a direção) |
| M1-14b [mantém] | O | Desliza na parede | Comportamento | Andar a 45° contra a parede | Herói desliza ao longo dela em vez de parar |
| M1-14e [substituir D-024] | O | Percurso da sala sem prender nem cair | Tempo; ocorrências | Laço campo → rampa → plataforma → escada → pátio → campo, andando; depois correndo; depois campo → corredor (5–7, z 15–24) → arena e volta | Laço completo nos dois sentidos, sem prender; subir a rampa e descer a escada sem ficar preso; borda da plataforma bloqueia (sem queda); passa pelo corredor e pela porta de 3 tiles com o herói inteiro (diâmetro do pushbox 0,7) e o mesmo em 2 tiles de largura; arena → início a pé em ≤ 17,5 s andando (metricas §8.5: 61 tiles, limite superior) |
| M1-14c [substituir D-024] | O | Câmera 3/4 fixa e dentro dos limites | Ângulo; área visível | Percorrer os 4 cantos da sala (0–48 × 0–32), o campo, a plataforma e os cantos da arena (30–45 × 18–29) | Ângulo fixo em 35° (`camera_angulo_graus`) sem variação durante o jogo; nunca mostra fora da sala; herói sempre visível; tremor desliga pela opção |
| M1-14d [mantém] | D | Pés não deslizam | Visual | Observar em câmera lenta (debug) andando e correndo | Avaliação do QA: passo combina com o deslocamento (placeholder pode não ter ciclo; ⬜ se não tiver) |

### D. Combate do herói

| ID | Tipo | Critério | Medida | Método | Passa quando |
|---|---|---|---|---|---|
| M1-15a [a atualizar D-024] | O | Quadros de ataque conforme dados | Preparação/ativo/recuperação em quadros | Quadro a quadro, com estado e hitbox no debug, para leve (combo de 3) e forte | Iguais ao arquivo de dados (± 0 quadro); hitbox vermelha só nos quadros ativos |
| M1-15b [a atualizar D-024] | O | "Se parece que acertou, acertou" | Acertos no `enemy_boneco_alvo` | Alcance medido da **origem do golpe** (centro da pushbox do herói no 1º quadro ativo, já com o avanço) até a **borda da hurtbox** do alvo (raio 0,40): distância entre centros = X % × alcance + 0,40 (03 §5.2 regra 6). Posições com F2: leve_1/leve_2 (alcance 1,3): 90 % → centros 1,57 · 110 % → 1,83; leve_3 (1,5): 1,75 · 2,05; forte (1,7): 1,93 · 2,27. 8 direções, 3× cada golpe | 90 %: acerta em 72/72 tentativas (8 direções × 3 repetições × 3 tipos: leve_1, leve_3, forte); 110 %: 0/72. Alvo em diagonal com assistência de mira (`assistencia_correcao_max_graus` 15) testado à parte e anotado |
| M1-15c [a atualizar D-024] | O | Um acerto por golpe por alvo, com o dano da fórmula | Contador F10 (acertos, dano) | 10 golpes de cada tipo no `enemy_boneco_alvo` | Cada golpe registra exatamente 1 acerto; dano por golpe, herói nível 1 contra resistência 0: leve_1 e leve_2 = **13**, leve_3 = **20**, forte = **33** (formulas D1–D3); combo completo = **46** |
| M1-15d [a atualizar D-024] | O | Esquiva: distância, duração e recarga | Tiles, quadros | Quadro a quadro com F2/F7, nas 8 direções | 3,0 tiles (± 5 %) em 18 quadros; nova esquiva só 24 quadros após o fim da anterior (apertar antes: não sai, salvo pelo buffer); custo de 25 de fôlego debitado no 1º quadro da esquiva |
| M1-15d2 [a atualizar D-024] | O | Esquiva: invencibilidade (teste ativo) | Dano recebido por quadro de início | Contra `enemy_boneco_golpe`, com F6/F7: iniciar a esquiva de modo que o 1º quadro ativo do golpe caia no quadro k da esquiva, k = 1…12, 2 rodadas cada | Sem dano para k = 2…10; com dano para k = 1, 11 e 12 (hurtbox marcada como invencível em F1 só em 2–10) |
| M1-15g [a atualizar D-024] | O | Aviso do `enemy_boneco_golpe` | Quadros de aviso; marcador | Quadro a quadro, 5 golpes | Aviso ≥ 18 quadros (`aviso_min_comum_quadros`); intervalo entre golpes = 120 quadros ± 1 (metricas §8.3); marcador no chão com a forma exata da hitbox, enche até 100 % no 1º quadro ativo; nenhum efeito do herói cobre o marcador; o golpe do `enemy_boneco_golpe` não alcança o `enemy_boneco_alvo` (5 tiles) |
| M1-15h [a atualizar D-024] | O | Herói recebe dano e morre | Estados | Deixar o `enemy_boneco_golpe` acertar sem esquivar, sem usar poção, e contar | Cada acerto tira **18** (D7); vida 140 → 122 → … → 14 após o 7º acerto → **morre no 8º** (formulas §12); DANO dura ≥ 20 quadros (`dano_travamento_min_quadros`); invencibilidade pós-dano 60 quadros (nenhum 2º acerto dentro dela; sprite pisca ≤ 3 vezes/s); MORTE → reinício na sala com vida cheia e sem erro no console. Reinício em ≤ 3 s da entrada em MORTE até a sala jogável (`reinicio_apos_morte_max_s`, medido no debug); herói volta a `inicio_jogador` com vida, mana e fôlego cheios; bonecos reiniciados; contadores F10 **não** zeram sozinhos |
| M1-15i [a atualizar D-024] | O | Fôlego (03 §4.4, itens 7 e 14b) | Esquivas seguidas; quadros de recarga; estado do recurso | Com F2 mostrando o fôlego: (a) 5 esquivas seguidas; (b) forte com fôlego < 20; (c) esperar a recarga após 1 gasto e após exaustão; (d) ligar/desligar `folego_custo_ativo` | `folego_max` 100; esquiva gasta 25 e forte 20; saem 4 esquivas seguidas e a 5ª **não** executa nem gasta nada: fica no buffer até expirar (7 quadros) e dispara `sem_folego`; recarga de 1 esquiva = 68 quadros (F3); forte deixa 80 e volta em 60 quadros (F5); com 24 de fôlego a esquiva não sai, com 25 sai e deixa 0 (F6); após 4 esquivas (exausto) a 5ª só sai 98 quadros depois do último gasto, apertando de novo dentro da janela do buffer (F7); exausto cheio = 210 quadros (F4); recarga de 40/s começa 30 quadros após o gasto (60 se exausto); correr não gasta; com a opção desligada nada gasta |
| M1-15j [a atualizar D-024] | O | Parede bloqueia golpe (03 §5.9, item 14c) | Acertos com e sem colisor | Herói e `enemy_boneco_alvo` a 90 % do alcance (leve e forte): (a) sem nada entre eles; (b) com a parede solta (12–17, z 9) entre eles; (c) com a meia-parede da arena (37–39, z 20) entre eles — o boneco precisa ser posicionado pelo debug; (d) herói na plataforma (altura 1) e boneco no campo | (a) acerta; (b) 0 acertos; (c) 0 acertos (e o herói continua visível atrás dela); (d) 0 acertos (diferença de altura ≥ 1,0). O aviso do boneco não é cortado pela parede |
| M1-15e [a atualizar D-024] | O | Feedback de impacto | Presença | Acertar o alvo com leve e forte | Pausa de impacto (2–8 quadros), flash (1–2 quadros) e recuo presentes; forte visivelmente maior que leve; tremor desligável |
| M1-15f [a atualizar D-024] | O | Máquina de estados sem travar | Estado preso | Sequências aleatórias de ataque/esquiva/movimento por 2 min (manual, "amassar botões") | Nunca fica preso num estado; estado no debug sempre volta a PARADO/ANDAR |

### E. Visual mínimo

| ID | Tipo | Critério | Medida | Método | Passa quando |
|---|---|---|---|---|---|
| M1-16 [substituir D-024] | O | Pixel nítido | Bordas do sprite-placeholder | Captura com zoom em 1×, 2×, 3× e após redimensionar | Sem borrão nem pixel de tamanho desigual; alpha só 0/255 |
| M1-17 [a atualizar D-024] | O | Pixel não treme com a câmera | Visual | Andar devagar e observar o sprite parado contra a câmera em movimento | Sem tremor/cintilação perceptível (avaliação do QA + usuário) |
| M1-18 [substituir D-024] | O | Sprite iluminado e assentado | Visual | Observar com a luz da sala | Recebe luz da cena; tem sombra no chão, inclusive subindo e descendo a rampa; não flutua nem afunda |

### F. Debug, dados e testes

| ID | Tipo | Critério | Medida | Método | Passa quando |
|---|---|---|---|---|---|
| M1-19 [a atualizar D-024] | O | Modo debug completo | Funções presentes | Ligar/desligar por tecla; checar cada item | Mostra fps (média e pior 1 %), ticks, estado do herói, caixas nas cores do 03 (verde/vermelho/amarelo), entradas, posição em tiles; câmera lenta e avanço quadro a quadro funcionam; exporta tempos de quadro |
| M1-20 [mantém] | O | Números vêm dos dados | Efeito de mudar um valor | Mudar velocidade de andar e alcance do ataque leve só no arquivo de dados; rodar | Comportamento muda sem mexer em código |
| M1-21 [mantém] | O | Dado inválido é recusado | Mensagem | Colocar valor inválido (texto no lugar de número) e rodar a validação | Build/validação falha com mensagem que aponta arquivo e campo |
| M1-22 [mantém] | O | Teste automático roda | Resultado | Rodar o comando de testes documentado | Passa; existe ao menos 1 teste (08 §10) |
| M1-22b [mantém] | O | Exemplos resolvidos das fórmulas viram testes | Casos passando | Rodar os testes de unidade de [casos_unidade_m1.md](casos_unidade_m1.md) (TC-FRM) | 100 % dos casos listados como M1 passam, incluindo arredondamento e pisos |
| M1-23 [mantém] | O | Estável em 15 min | Travas; memória | Sessão de 15 min (inclui o playtest); memória do navegador no início (após 1 min) e no fim | 0 travas; memória final ≤ 1,1× a inicial |

### G. Sensação (playtest) e bugs

| ID | Tipo | Critério | Medida | Método | Passa quando |
|---|---|---|---|---|---|
| M1-24 [mantém] | O | **Sensação aprovada** | Notas 1–5 do questionário | [Roteiro M1](playtests/roteiro_m1.md) com o usuário (≤ 15 min) | Média ≥ 4 nas perguntas Q1–Q6; nenhuma ≤ 2; Q8 = "sim" (passa) ou "sim com ajustes" (passa com riscos) |
| M1-25 [mantém] | O | Sem bloqueadores | Bugs abertos | Lista de bugs do M1 | 0 S1 e 0 S2 abertos |
| M1-26 [mantém] | D | S3 sob controle | Bugs abertos | Idem | ≤ 3 S3 abertos, todos com dono |

**Resumo M1 — passa quando:** M1-01 a M1-25 obrigatórios ✅ (exceções ⬜ só as previstas no próprio critério) e playtest aprovado pelo usuário.

---

## M2 — Cena-modelo (rascunho)

**Entrega:** 1 cena com herói, 1 inimigo, cenário final, luz e efeitos. **Pronto quando:** o "diorama" convence e roda a 60 fps.

| ID | Critério (rascunho) | Passa quando (provisório) |
|---|---|---|
| M2-01 | Desempenho nos 3 perfis na máquina certa | Alto (máquina boa), Médio (intermediária), Baixo (fraca): média ≥ 58 e pior 1 % ≥ 45 [aguarda 08] |
| M2-02 | Leitura do herói e do inimigo com névoa, desfoque e bloom | DoF nunca atinge herói, inimigo próximo nem UI; usuário identifica herói e inimigo em ≤ 1 s em capturas dos 3 perfis |
| M2-03 | Pixel nítido no cenário final | Igual M1-16/17, com câmera em movimento e luz dinâmica |
| M2-04 | Iluminação por normal map e sombras | Herói e inimigo reagem à luz que se move; sombra de silhueta + contato; validação do 10 |
| M2-05 | Telegraph do inimigo | Todo golpe tem aviso ≥ 18 quadros (comum) / 36 (forte); efeitos do herói não cobrem o aviso |
| M2-06 | Combate completo herói × inimigo | Pipeline de dano na ordem do 03 §7.4; resultados iguais aos exemplos resolvidos do 06; invencibilidade da esquiva testada |
| M2-07 | Flashes e opções de conforto | ≤ 3 flashes/s; desligar tremor, flashes, partículas e desfoque funciona |
| M2-08 | Áudio | Só inicia após clique/tecla; impacto no mesmo quadro do acerto; pausa com a aba |
| M2-09 | Perfil automático | Escolhe o perfil esperado nas 3 máquinas; troca manual funciona |
| M2-10 | Navegadores | Chrome, Edge, Firefox (Windows) ok; Safari/macOS se houver Mac |
| M2-11 | Playtest visual | "O visual convence?" média ≥ 4 com o usuário (roteiro M2 a escrever) |
| M2-12 | Bugs | 0 S1, 0 S2 abertos |

## M3 — Vertical slice (rascunho)

**Entrega:** vila + região + masmorra + chefe, com som e história. **Pronto quando:** jogável do início ao fim sem erro grave.

| ID | Critério (rascunho) | Passa quando (provisório) |
|---|---|---|
| M3-01 | Jogável do início ao fim | 3 percursos completos (usuário + bot de percurso) sem trava |
| M3-02 | Missões | 3–5 missões concluem por todos os caminhos; bot de flags sem estado sem saída |
| M3-03 | Soft-lock | Testes deliberados (portas, quedas, chefe, dinheiro/itens) sem estado sem saída |
| M3-04 | Save | Salvar/carregar em todos os pontos; fechar aba durante o save não corrompe; exportar/importar; arquivo inválido recusado |
| M3-05 | Combate e justiça | Checklist 6.1 completo para os 5 inimigos e o chefe; máx. 1–2 atacando ao mesmo tempo |
| M3-06 | Desempenho | Cena de pico (40 inimigos + ~150 partículas) com média ≥ 58 / pior 1 % ≥ 45; tempo até jogar ≤ 5–8 s em 10 Mbps; download inicial ≤ ~10 MB [aguarda 08] |
| M3-07 | Textos | Nenhuma chave de texto visível; texto +40 % não corta |
| M3-08 | Playtest | Ciclo vila → região → masmorra → vila entendido; usuário sabe o que fazer depois |
| M3-09 | Bugs | **0 S1** abertos; S2 listados com plano |

## M4 — Polimento (tópicos)
Missões e diálogos completos · áudio completo e mixado · tutorial · acessibilidade (daltônico, reduzir movimento, legendas, navegação só teclado/só gamepad, remapeamento) · inglês (textos +40 %) · checklist de game feel do 03 §12 · **0 S1/S2 conhecidos**.

## M5 — Beta (tópicos)
**0 S1/S2** · S3 dentro da meta (a definir com o 01) · matriz completa de navegadores · sessão de 60 min estável (memória ≤ 400–600 MB) · migração de save testada · cache de versão nova · perda de contexto gráfico · armazenamento cheio/bloqueado · bots longos sem falha.

## M6 — Lançamento (tópicos)
Publicação testada fora do ambiente de desenvolvimento · retorno de versão (rollback) testado · save de versão anterior abre na publicada · tempo até jogar medido na rede real · revisão final de originalidade com 01/10.
