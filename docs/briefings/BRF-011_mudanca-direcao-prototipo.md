# BRIEFING BRF-011: Mudança de direção — gráfico e jogabilidade a partir do protótipo do usuário

- **Prioridade:** P0 · **Emitido:** 2026-10-24 pelo Produtor · **Decisão do usuário:** D-024 (`docs/04_decisoes.md`)
- **Contexto:** o usuário viu o esqueleto cinza em Three.js e **não gostou** do gráfico nem da jogabilidade. Ele tem um protótipo próprio, **"Vale de Dunwick"**: https://dunwick.netlify.app (código local: `referencia/prototipo/index.html`; análise: `referencia/analise_prototipo.md`). Pediu **"aquela ideia, só que mais bonito e polido, com sprites bem feitas e cenário e UI melhores"**, a **jogabilidade do protótipo** e **refazer o esqueleto**. A história atual continua (Edric, Baixo Orvalho, Sino de Cobre…).
- **Ler antes (todos):** `referencia/analise_prototipo.md`; abra o site e **jogue 5 minutos** (Jogar → andar, atacar, rolar, ver o dia/noite com N, o mapa com M), e leia o trecho do `index.html` da sua área. Documentos antigos que contradizem o protótipo valem **só no que não conflita**; o que conflita muda (você propõe).

## Regras comuns
- O visual-alvo é o do protótipo: **isométrico 2:1 fixo**, cenário rico e quente, personagens grandes e legíveis, UI de madeira e ouro, 1280×720 nativo. **Não é pixel art 640×360 em 3D cinza.**
- Mantém-se do projeto: telegraph obrigatório em golpe inimigo, passo fixo 60 Hz, números em dados, textos por ID, acessibilidade (flashes ≤ 3/s, efeitos desligáveis), originalidade, tudo gerado **por código** (sem arte externa), 16 anos.
- **Ferramenta e arquitetura são do 08**; os demais descrevem o que precisam.
- Cada um entrega **uma resposta curta** (o que muda no seu documento, o que mantém, o que perguntar ao usuário) mais os arquivos atualizados. **Não** produza assets nem código em massa agora.

## Por agente
- **08 Arquiteto (BRF-012 abaixo detalha):** avaliar o código do protótipo, **ADR-002**: como realizar esse visual com qualidade e desempenho (reaproveitar Canvas 2D modular, ou WebGL 2D, ou Three.js com sprites isométricos), com números; **refazer o esqueleto** nessa base, com módulos, dados validados, testes e debug. Substitui o esqueleto de 3D cinza.
- **10 Direção de Arte:** reescrever o guia visual a partir do protótipo (isométrico 2:1, paleta quente e saturada de dia, contorno suave, cenário rico), **combinando** com a direção A (Lanterna e Musgo: luz de fim de tarde, sombras azul-esverdeadas, lanternas) e o **ciclo dia/noite**; definir nível de polimento "mais bonito" (luz, sombras, partículas, profundidade); atualizar paleta, convenções de leitura (telegraph magenta etc.), itens-modelo e a cena-modelo (a **praça de Baixo Orvalho**).
- **04 Sprites:** plano para sprites **bem feitos** (herói Edric, Torvan, Maren, Grace, 5 inimigos, Hollowpaw), ainda **por código**, 5 direções espelhadas, animações do protótipo (idle, andar, correr, 3 ataques, rolamento, dano, morte), mais anatomia, sombreamento e contorno melhores; definir o item-modelo (Edric) e tamanhos (o 10 e o 08 confirmam).
- **07 Cenários e UI:** kit isométrico (casas enxaimel, telhados, torre do sino, poço, forja, cercas, árvores, rochas, props) e **sistema de UI de madeira e ouro** do protótipo, mais polido (retrato, barras, ícones de habilidade, minimapa redondo, diálogo, missão, menus); reescrever o inventário de telas e os controles para esse HUD.
- **03 Jogabilidade:** reescrever `gameplay.md` a partir da **jogabilidade do protótipo** (WASD, correr no Shift gastando fôlego, combo ×3, giro Q, investida E, rolamento Ctrl/C/botão direito, interagir F, mapa M, pausa Esc), mira pelo mouse e movimento livre em 8 direções no plano isométrico; reconciliar com telegraph e quadros a 60 Hz; o que o protótipo tem e o `gameplay.md` v0.2 não (e vice-versa), e o que propor ao usuário.
- **06 Sistemas:** comparar os números do protótipo (vida 100, fôlego 100, dano 12, combo 12/14/20, crítico 10 %, andar 2,2 · correr 3,5, esquiva 20, giro 6 s, investida 8 s, lobo 40/8, javali 55/12, alfa 250/18, javali-rei 340/16) com `formulas.md` e propor reconciliação (**crítico**: o D-007 diz "sem dano aleatório"; perguntar ao usuário se o protótipo o quer) e escala de arquétipos para os 5 inimigos novos (D-023).
- **09 QA:** revisar `criterios_marcos.md` e o plano de testes para o novo esqueleto (visão isométrica, 1280×720, desempenho, nitidez de sprite, ciclo dia/noite), sem inventar critério de arte.

## Pronto quando
- [ ] Cada agente respondeu em uma mensagem curta: o que muda, o que mantém, perguntas ao usuário
- [ ] Documentos de cada área atualizados para o novo alvo (ou marcados "a atualizar" com a lista)
- [ ] 08: ADR-002 com recomendação e esqueleto refeito (pronto quando abre no navegador com a praça de Baixo Orvalho, herói animado andando/atacando/rolando em dados, câmera isométrica, dia/noite básico, debug, teste automático)
- [ ] Nenhum agente produziu arte ou código em massa antes da aprovação dos itens-modelo
