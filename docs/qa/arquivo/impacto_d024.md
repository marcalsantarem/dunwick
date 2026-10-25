# Impacto da D-024 nos documentos de QA

> **ARQUIVADO (D-025, 2026-10-24):** o protótipo era só referência de estilo; a D-025 anulou a mudança de sistemas e critérios. Este documento não vale. Os trechos que a D-025 mantém (câmera isométrica, clique, oclusão, nitidez, sala de teste) foram aplicados direto em `criterios_marcos.md` e `plano_testes.md`.

> **Status:** RASCUNHO v0.1 (BRF-011) · Dono: 09 QA · 2026-10-24 · Só documentos; sem números novos até o **ADR-002** (08) e o `gameplay.md` novo (03).
> Alvo novo: protótipo do usuário (isométrico 2:1, 1280×720, Canvas 2D, arte pintada por código). O esqueleto cinza 3D 640×360 foi rejeitado.
> Marcação nos outros arquivos: **`[a atualizar D-024]`** = depende de algo que mudou; **`[mantém]`** = vale como está; **`[substituir D-024]`** = sai e entra o novo critério da §3.

## 1. O que o QA jogou (e o que não deu para verificar)

Abri https://dunwick.netlify.app no navegador do app (Windows) e usei o código local para entender o laço.

| Observado | Valor / fato | Confiança |
|---|---|---|
| Canvas | 1280×720 (`<canvas id="game">`), DPR 1 | medido |
| Carregamento até o menu | **~40 s** nesta medição (barra "Pintando o vale…" 0 → 100 %); o Produtor cita ~25 s. O código executa os passos de geração em fatias de 30 ms **por quadro** (`LOAD_STEPS`), então o tempo depende do fps e de a aba estar em primeiro plano | medido uma vez, com o painel às vezes oculto: **não é número de referência** |
| FPS do overlay F3 | 33–35 nesta máquina/painel | **não confiável**: o painel do navegador ficava oculto e o navegador reduz o laço de animação nesse caso. Precisa medir em primeiro plano, na máquina de referência |
| Laço | `dt` **variável**, limitado a 0,05 s (`clamp((now − lastT)/1000, 0, 0.05)`); **não é passo fixo de 60 Hz** | lido no código |
| Aba em segundo plano | o navegador para o laço; o limite de 0,05 s evita "correr" ao voltar (não simula o tempo perdido) | lido no código; não testado ao vivo |
| Aleatoriedade | `Math.random()` em crítico (10 %), drops, IA e efeitos; **sem semente** | lido no código |
| Tecla N | **liga/desliga** o ciclo ("Ciclo dia/noite desligado"); não avança a hora | observado |
| F3 | overlay de depuração (fps, entidades, efeitos, caixas de colisão em magenta) | observado |
| Mapa (M) | minimapa grande circular; fecha com M | observado |
| Menu | tela de título com fundo desfocado e lista de controles | observado |
| HUD | retrato, barra de vida e de fôlego, 2 ícones de habilidade (Q, E), minimapa redondo, objetivo no canto | observado |

**Não verificado** (o painel oculto reduz o laço e a automação de teclas só dá toques curtos): andar contínuo, combo, giro, investida, rolamento, dano, morte, inimigos, diálogos, save, gamepad, toque. Esses itens ficam como **a testar** quando o 08 refizer o esqueleto e o 03 escrever o gameplay novo. Para jogar de verdade, o usuário precisa estar com a janela em primeiro plano.

## 2. Impacto nos critérios do M1 (`criterios_marcos.md`)

| Critério | Estado | Por quê / o que muda |
|---|---|---|
| M1-01 abre sem erro | **[a atualizar]** | Limite de 8 s não serve se carregar custa ~25–40 s. Ver N-01 |
| M1-02 60 fps / M1-03 sem engasgos | **[mantém]** (cena e resolução mudam) | Medir na praça de Baixo Orvalho a 1280×720, luz e partículas ligadas |
| M1-04 passo fixo 60 Hz | **[mantém]** | O protótipo usa `dt` variável; o BRF-011 mantém o passo fixo. O 08 confirma no ADR-002 |
| M1-05 aba em segundo plano | **[mantém]** | Teste igual; o protótipo já não "corre" ao voltar (dt ≤ 0,05 s) |
| M1-06 redimensionar | **[a atualizar]** | 1280×720 nativo: escala não inteira, letterbox, tela cheia. Ver N-03 |
| M1-07 a M1-09 entrada | **[a atualizar]** | Ações novas: WASD/setas, Shift, Espaço/clique, Q, E, Ctrl/C/botão direito, F, M, Esc, N, F3. Gamepad mantém. Toque existe no protótipo (fora do slice?) |
| M1-10 resposta, M1-11 buffer | **[mantém]** | Valor do buffer vem do 03 novo |
| M1-12, M1-13 velocidades e diagonal | **[a atualizar]** | Protótipo: andar 2,2 · correr 3,5 tiles/s, tile isométrico. Diagonal igual **no plano do mundo** (não na tela). Ver N-05 |
| M1-14a, M1-14b colisão e deslizar | **[mantém]** | |
| M1-14c câmera 35°, limites | **[substituir D-024]** | Isométrica 2:1 fixa, segue o herói; limites do mapa 80×80. Ver N-04 |
| M1-14d pés não deslizam | **[mantém]** | |
| M1-14e percurso da sala 48×32 | **[substituir D-024]** | Praça de Baixo Orvalho + trecho de vila/estrada |
| M1-15a a M1-15j combate | **[a atualizar]** | Quadros, alcance, combo, giro, investida, rolamento, fôlego (correr gasta), valores e bonecos. **Mantêm-se** os princípios: um acerto por golpe, "se parece que acertou, acertou", aviso em todo golpe inimigo, invencibilidade da esquiva, pós-dano, parede bloqueia golpe. Ver N-07 |
| M1-16 pixel nítido 1×/2×/3× | **[substituir D-024]** | Não é mais pixel art 640×360. Ver N-02 |
| M1-17 sem tremor com a câmera | **[a atualizar]** | A câmera segue o herói em pixels de tela; testar tremor de textura/contorno |
| M1-18 normal map e sombra | **[substituir D-024]** | Sem normal map no protótipo; luz 2D, tochas e sombra sob objetos. O que vale é do guia visual do 10 |
| M1-19 debug F1–F10 | **[a atualizar]** | Protótipo só tem F3. O 08 define as funções no novo esqueleto; o QA pede as mesmas capacidades (tempos de quadro, ticks, estado, caixas, entradas, passo a passo) |
| M1-20 a M1-23 dados, validação, testes, 15 min | **[mantém]** | |
| M1-24 sensação | **[mantém]** | `roteiro_m1.md` precisa de controles novos |
| M1-25, M1-26 bugs | **[mantém]** | |
| M2 (diorama, 3 perfis, DoF) | **[a atualizar]** | Sem desfoque de profundidade nem normal map; perfis dependem do ADR-002 |
| M3 | **[mantém]** (números a rever) | Itens de save, missão, soft-lock continuam |

Outros arquivos: `casos_unidade_m1.md` — fórmulas **[a atualizar]** (valores do protótipo × 06; crítico); `playtests/roteiro_m1.md` — **[a atualizar]** (controles e sala); `plano_testes.md` — ver §4.

## 3. O que se mantém (não depende do visual)

- Passo fixo de 60 Hz com desenho interpolado; aba em segundo plano pausa sem simular o tempo perdido (M1-04, M1-05).
- Entrada por **ações lógicas**, remapeável por dados; gamepad que conecta e desconecta (M1-07 a M1-11).
- Números em dados validados por esquema; texto por ID; nenhum número de gameplay no código (M1-20, M1-21).
- Testes automáticos de fórmulas e da máquina de estados (M1-22, M1-22b); estabilidade de 15 e 60 min; sem vazamento (M1-23).
- Telegraph obrigatório em todo golpe inimigo; efeitos e HUD nunca cobrem o aviso; flashes ≤ 3/s; tremor, flashes, partículas e desfoque desligáveis.
- Save local com versão, migração, escrita segura, exportar/importar e arquivo inválido recusado (já existe `localStorage` no protótipo; o resto vem do 08).
- Acessibilidade (daltonismo, reduzir movimento, teclado e gamepad, textos +40 %), matriz de navegadores, soft-lock, severidades S1 a S4 e modelo de relatório de bug.

## 4. Critérios novos propostos (rascunho; limites ficam [aguarda 08/10/03])

Tipo: **O** obrigatório · **D** desejável. Os limites com número são **provisórios** até o ADR-002.

| ID | Tipo | Critério | Medida / método | Passa quando (provisório) |
|---|---|---|---|---|
| N-01 | O | **Tempo de carregamento** | Cronometrar do clique no link até o menu jogável: 3× com cache limpo e 3× com cache quente; rede e máquina registradas; aba em primeiro plano | Cache limpo ≤ [aguarda 08] s (sugestão: ≤ 8 s na máquina de referência, o protótipo hoje fica em ~25–40 s); cache quente ≤ 3 s. **Tela de carregamento** mostra progresso real, não trava o navegador (nenhum quadro > 200 ms) e a aba pode ficar em segundo plano sem quebrar |
| N-02 | O | **Nitidez a 1280×720** | Capturas em 100 % de zoom do navegador de: texto da UI, retrato, contorno de sprites, bordas de telhado/cerca, minimapa | Sem borrão de reescala a 100 %; texto legível e sem serrilhado quebrado; imagem não "nada" ao mover a câmera. Critério de **beleza** não é do QA (é do 10) |
| N-03 | O | **Escala e janela** | 1280×720, 1920×1080, 1366×768, janela menor, tela cheia, zoom 125 %/150 % do navegador e tela de alta densidade (DPR 2) | Proporção 16:9 preservada (barras, sem esticar); sem corte de HUD; nitidez igual ao N-02 em cada tamanho; sem erro de console ao redimensionar |
| N-04 | O | **Câmera isométrica** | Percorrer cantos do mapa, bordas e portões; seguir o herói correndo | Ângulo 2:1 constante; câmera nunca mostra fora do mapa; herói sempre visível (oclusão por telhado/árvore tratada); suavização sem "elástico" que perca o herói em corrida |
| N-05 | O | **Movimento no plano isométrico** | Debug mostra x, y do **mundo**; andar/correr nas 8 direções 5 s, 3× | Velocidade no mundo igual nas 8 direções (≤ 2 %); na tela a diagonal parece igual (avaliação do QA); valores = `gameplay.md` novo (protótipo: andar 2,2 · correr 3,5 tiles/s [aguarda 03]) |
| N-06 | O | **Ordem de desenho (profundidade)** | Herói passando atrás e na frente de casa, árvore, poço, cerca, torre do sino, inimigo e NPC | Nunca fica na frente/atrás errado em 20 passagens por tipo de objeto; sombra no chão; nada "flutua" nem afunda |
| N-07 | O | **Combate do protótipo × regras do projeto** | Quadro a quadro (debug): combo ×3, giro (Q, recarga 6 s), investida (E, 8 s), rolamento (20 de fôlego), correr gastando fôlego | Cada golpe: um acerto por alvo; invencibilidade do rolamento medida; recarga e custo = dados; **todo golpe inimigo tem aviso ≥ mínimo** (lobo, javali, alfa, javali-rei), hoje a verificar; efeitos do herói não cobrem o aviso; limite de inimigos atacando juntos respeitado |
| N-08 | O | **Dano e crítico reproduzíveis** | Rodar o mesmo combate 10× com a mesma semente | Resultados idênticos. Se o crítico de 10 % ficar (decisão do usuário), o jogo precisa de **semente fixa/forçar crítico** no debug para testar; sem isso o teste de dano não é reproduzível |
| N-09 | O | **Ciclo dia/noite** | Debug define a hora (manhã, tarde, anoitecer, noite) e liga/desliga o ciclo; ciclo completo de 300 s | Cada hora tem leitura boa: herói, inimigos, aviso magenta e HUD legíveis em todas; transição sem salto brusco nem flash > 3/s; luzes de tocha/forja ligam à noite; fps na noite ≥ fps do dia − 10 %; hora **salva e restaurada** com o save; o botão N tem efeito claro |
| N-10 | O | **Desempenho com cenário rico** | 3 min na praça, com NPCs, partículas, pássaros, névoa e 10–20 inimigos em combate; modo noite incluso | Média ≥ 58 fps e pior 1 % ≥ 45 na máquina de referência [aguarda 08]; sem quadro > 50 ms por minuto; memória ≤ [aguarda 08] após 15 min |
| N-11 | O | **Perfis de qualidade** | Perfis Alto/Médio/Baixo conforme o ADR-002 (partículas, luz, névoa) | Cada perfil atinge N-10 na máquina da sua classe; troca automática e manual funcionam |
| N-12 | O | **HUD e UI de madeira e ouro** | Telas: título, HUD, pausa, mapa, diálogo, missão, loja, inventário | Texto +40 % não corta; navegável por teclado e gamepad; toda tela com "voltar"; HUD nunca cobre o aviso de golpe; contraste do texto sobre madeira/ouro ≥ 4,5:1 [aguarda 07] |
| N-13 | D | **Toque e celular** | Controles na tela do protótipo | Fora do slice até depois do M5; se o usuário quiser, vira critério próprio |
| N-14 | O | **Ordem de carregamento e erros** | Recarregar durante o carregamento; perder a rede; cancelar | Sem tela travada; mensagem clara; save intacto |

## 5. Perguntas ao usuário (via Produtor)

1. **Carregamento:** aceita ~25–40 s para ver o menu (como hoje) ou quer meta de poucos segundos? Isso muda o passo de geração de assets (o 08/04 avaliam geração na primeira vez e cache).
2. **Crítico de 10 %:** fica? Se sim, o jogo precisa de semente fixa para testes (N-08).
3. **Toque/celular:** o protótipo já tem controles na tela. Mantém fora do slice (BRF) ou entra?
4. **Máquina de referência:** qual computador e monitor, e há Mac para Safari?
5. **Playtesters:** continuam usuário + bots?

## 6. Dependências e próximos passos

- **08:** ADR-002 (passo fixo × `dt` variável, tempo de carga, perfis, debug, semente de aleatoriedade).
- **03:** `gameplay.md` novo (controles, fôlego, combo, golpes, valores, aviso).
- **10/07:** critérios objetivos de legibilidade (tamanho mínimo do herói em px, contraste, tamanho do aviso) para virarem N-02, N-12; o QA mede, não define arte.
- Quando esses chegarem, o QA reescreve `criterios_marcos.md` (M1), `casos_unidade_m1.md` e `roteiro_m1.md` e remove as marcas `[a atualizar D-024]`.
