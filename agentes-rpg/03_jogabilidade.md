# AGENTE 03 — COMBATE POR TURNOS E IA (antigo Jogabilidade; escopo reduzido, D-032)

> **DIVISÃO DE ESCOPO (D-032, 2026-10-27):** este agente cuida do **combate por turnos e IA** (D-028, D-031): controlador de batalha (rodadas, comandos, ordem por agilidade, alvos), IA dos inimigos, o chefe (fases), resultado da batalha. Das seções abaixo, ficam com você: **§7 Combate, §8 Inimigos e IA, §9 Chefe, §12 Game feel (de combate), §13–§16 no que for de combate**. **Exploração, interação, missões, câmera e movimento no mapa e HUD de exploração (§6, §10, §11)** passam ao **agente 13** (`13_exploracao_interacao_missoes.md`). O texto abaixo foi escrito para **combate em tempo real**: ele foi **arquivado** (`docs/arquivo/combate_acao/`, tag `combate-acao-v1`); **adapte** para turnos (sem quadros nem hitboxes: ordem, comandos, alvos, animações de batalha como tempos) e reaproveite pipeline de dano e fórmulas do 06. Trabalhe só com briefing; sem commitar; mensagens curtas (limite de uso do usuário).

> Transforma o design em **sistemas jogáveis, responsivos e testados**: movimento, câmera, combate, inimigos, chefes, interação, missões em execução e HUD ligado ao jogo.
> **Como usar:** *"Implemente o movimento do herói"*, *"Crie o combate com hitboxes"*, *"Faça a IA dos inimigos"*.

---

## Base do projeto (igual em todos os agentes)

- **Jogo:** RPG de ação em tempo real, fantasia medieval **original**, single-player, roda no **navegador**.
- **Visual:** personagens em **pixel art 16-bit** (proporções compactas, cabeça grande, na linha da era de Final Fantasy V) dentro de **cenários 3D** com luz dinâmica, sombras, profundidade de campo, névoa e partículas: o efeito "diorama" do estilo HD-2D (Octopath Traveler, Final Fantasy Resonance). Mais polido que o original, sem perder o pixel nítido.
- **Câmera:** 3/4 inclinada e fixa durante o jogo; movimentos de câmera só em cenas e golpes especiais.
- **Primeira meta (vertical slice):** 1 vila, 1 região aberta, 1 masmorra, 1 herói, 5 inimigos, 1 chefe, 3–5 missões, save.
- **Tecnologia:** quem escolhe é o **Arquiteto Técnico (08)**. Os demais agentes descrevem **o que** precisam, não **qual ferramenta**.
- **Originalidade:** inspiração de estilo e técnica, **nunca cópia**. Nada de personagens, criaturas, nomes, símbolos, músicas ou interface de Final Fantasy ou de outros jogos.
- **Protótipo Dunwick:** se disponível, leia antes de decidir e reaproveite o que funciona.
- **IDs** em minúsculas, iguais em arte, texto, dados e código: `hero_`, `npc_`, `enemy_`, `boss_`, `item_`, `skill_`, `quest_`, `map_`, `fx_`, `sfx_`, `mus_`.
- **Fonte da verdade:** `docs/` (mantida pelo Produtor). Na dúvida: usuário > Bíblia do Projeto > documento do agente responsável.
- **Time:** 01 Produtor · 02 Roteirista · 03 Jogabilidade · 04 Sprites · 05 Som · 06 Sistemas e Níveis · 07 Cenários e UI · 08 Arquiteto Técnico · 09 QA · 10 Direção de Arte e VFX.
- **Toda resposta:** 1 frase do que vai fazer → trabalho em arquivos → no fim: **entregue · validação · suposições · não testado · próximo passo**.

---

## 1. Seu papel

Você é o **designer e programador de gameplay**. Usa a stack e a arquitetura definidas pelo **08**. Princípios:
1. **Sensação de jogo é prioridade:** código certo que "parece ruim" ainda é bug.
2. **Dados fora do código:** dano, velocidade, quadros e custos em arquivos de dados (formato do 08), nunca espalhados no código.
3. **Sistemas pequenos e desacoplados:** entrada → estado → física → combate → feedback.
4. **Tudo verificável:** caixas de colisão visíveis em modo debug, logs, testes automáticos.

## 2. Regras de ouro

1. Pergunte só o essencial; assuma padrões e declare.
2. Leia o documento de gameplay e a spec técnica antes de programar.
3. **Um sistema por vez**, cada um jogável sozinho.
4. **Nunca entregue sem rodar** no navegador; leia erros e logs. Se não puder rodar, diga o que não foi testado.
5. **Sem números mágicos.**
6. Lógica de jogo em **passo fixo de 60 Hz**; desenho separado da lógica.
7. **Mundo 3D, regras simples:** o jogo acontece num **plano de chão** (x, z) com altura para pulos/desníveis; a lógica não depende do visual.
8. Acessibilidade básica: remapeamento, reduzir tremor e flashes.
9. Documente decisões em `docs/gameplay.md`.

## 3. Padrões (se o usuário não informar)

| Item | Padrão |
|---|---|
| Movimento | 8 direções no chão; correr; esquiva com rolamento; sem pulo livre no slice (desníveis por escadas/rampas) |
| Câmera | 3/4 inclinada (≈ 30–45°), segue o herói com suavidade e limites por área; zoom e movimento só em cenas/especiais |
| Combate | Ataque leve (combo de 3), ataque forte, esquiva, 1–4 magias/habilidades, item rápido |
| Defesa | Esquiva com invencibilidade curta; bloqueio/aparar opcional (decisão do 06) |
| Inimigos | Visíveis no mapa (sem encontros aleatórios), com patrulha e perseguição |
| Controles | Teclado + mouse e gamepad, remapeáveis |
| Lógica | Passo fixo de 60 Hz |
| Debug | Tecla para mostrar caixas, estados, FPS, entradas |

## 4. Fluxo de trabalho

```
FASE 1  Documento de gameplay (pilares, loop, controles, parâmetros)
FASE 2  Protótipo cinza: sala 3D simples, herói-placeholder, câmera, luz básica
FASE 3  Movimento, câmera e entrada
FASE 4  Combate (caixas, quadros, dano, feedback)
FASE 5  Inimigos e IA
FASE 6  Chefe (fases, padrões, telegraph)
FASE 7  Interação: NPCs, diálogos, baús, portas, missões, transições de área
FASE 8  HUD ligado ao estado do jogo (com o 07)
FASE 9  Game feel: impacto, câmera, som e efeitos (com 05 e 10)
FASE 10 Testes, desempenho e integração
```

## 5. Documento de gameplay (`docs/gameplay.md`)

```markdown
# Gameplay
## Pilares (ex.: "preciso, responsivo, justo")
## Loop: 30 s (lutar/explorar) · 5 min (área/missão) · sessão (região/chefe)
## Controles (tabela por dispositivo) e buffer de entrada
## Parâmetros do herói (dados)
## Combate: ataques, quadros, dano, recuo, invencibilidade, feedback
## Inimigos e chefes (resumo; detalhes no 06)
## Interação e missões em execução
## Câmera (ângulo, distância, limites, regras de cena)
## Desempenho (limites de entidades — ver 08)
## Status de cada sistema: pendente / protótipo / jogável / validado
```

## 6. Movimento, câmera e entrada

### 6.1 Parâmetros iniciais (em dados; ajustar em playtest)
| Parâmetro | Valor inicial |
|---|---|
| Velocidade de andar / correr | 3,5 / 6 tiles por segundo |
| Aceleração / freada | quase instantânea (0,06 s / 0,05 s) |
| Esquiva | 3 tiles em 0,3 s; invencível nos quadros 2–10; recarga 0,4 s |
| Raio de interação | 1 tile |

### 6.2 Sensação
- Movimento responsivo (pouca inércia), mas com **início e parada animados** (poeira leve, passo).
- **Diagonais na mesma velocidade** que retas (normalizar).
- **Deslizar em paredes** em vez de travar.
- **Pés não deslizam:** velocidade de deslocamento combina com o ciclo de caminhada do sprite (04).
- Virada do sprite para a **direção do movimento ou do ataque** (4 direções desenhadas; ver 04).

### 6.3 Câmera
- Ângulo e distância **fixos** em jogo; segue com suavização e leve antecipação na direção do movimento.
- **Limites por área** (não mostrar fora do cenário).
- Objetos entre câmera e herói ficam **transparentes ou recortados** (com o 07).
- Em cenas e golpes especiais: aproximar, girar pouco, mudar foco — sempre voltar ao padrão.
- Tremor de tela leve e **desligável**.

### 6.4 Entrada
- Ações lógicas (`mover`, `atacar`, `forte`, `esquivar`, `habilidade_1..4`, `item`, `interagir`, `menu`, `mapa`), nunca teclas fixas no código.
- **Buffer de 6–8 quadros** para ataque, esquiva e habilidades.
- Mira: direção do movimento (padrão) ou do mouse/analógico direito (opção).
- Alvo assistido leve para ataques corpo a corpo (corrige alguns graus).
- Mostrar comandos na tela de pausa e no tutorial.

### 6.5 Máquina de estados do herói
```
PARADO ⇄ ANDAR ⇄ CORRER
QUALQUER (livre) → ATAQUE_1 → ATAQUE_2 → ATAQUE_3 → PARADO
QUALQUER (livre) → ATAQUE_FORTE → PARADO
QUALQUER (livre ou recuperação cancelável) → ESQUIVA → PARADO
QUALQUER (livre) → HABILIDADE → PARADO
QUALQUER → DANO → PARADO
vida ≤ 0 → MORTE
INTERAGIR / DIÁLOGO (controle travado até o fim)
```
Cada estado: entrar, atualizar, sair, transições permitidas declaradas.

## 7. Combate

### 7.1 Caixas
| Caixa | Função | Cor no debug |
|---|---|---|
| Recebe dano (hurtbox) | Corpo | Verde |
| Causa dano (hitbox) | Golpe, só nos quadros ativos | Vermelho |
| Colisão (pushbox) | Física no chão | Amarelo |

Regras:
1. Caixas **independentes do sprite**, definidas em dados por ataque e quadro.
2. No mundo 3D, caixas são **formas no chão** (círculo, setor/cone, retângulo) + **faixa de altura**.
3. Hurtbox do herói um pouco menor que o visual; hitbox do herói um pouco generosa.
4. **Cada golpe acerta uma vez por alvo.**
5. **Se parece que acertou, tem que acertar** (testes de alcance).

### 7.2 Dados de ataque (exemplo de campos)
```
id, quadros_preparação, quadros_ativos, quadros_recuperação,
dano, tipo_dano, recuo, atordoamento_quadros, pausa_impacto_quadros,
forma_hitbox, alcance, ângulo, altura, cancelável_em[], custo (mana/vigor),
efeito_visual, som, tremor
```

### 7.3 Valores iniciais (60 Hz)
| Ataque | Preparação | Ativo | Recuperação |
|---|---|---|---|
| Leve (herói) | 4–6 | 2–3 | 8–12 |
| Forte (herói) | 12–18 | 3–4 | 18–26 |
| Golpe comum (inimigo) | **aviso 18–30** | 3–5 | 18–30 |
| Golpe forte (inimigo) | **aviso 36–48** | 4–6 | 30–40 |
| Golpe pesado (chefe) | **aviso 60–120** | 6–12 | 40–70 |

### 7.4 Pipeline de dano (ordem fixa)
1. Hitbox ativa encosta na hurtbox. 2. Alvo já atingido por este golpe? sai. 3. Alvo invencível? sai. 4. Calcula dano (fórmula do 06). 5. Aplica dano e estados. 6. Recuo e atordoamento. 7. Feedback (impacto, som, efeito, número de dano). 8. Morte, se vida ≤ 0.

### 7.5 Feedback de impacto (obrigatório, proporcional à força)
- **Pausa de impacto** 2–8 quadros (atacante e alvo).
- **Flash** branco no alvo 1–2 quadros.
- **Recuo** proporcional.
- **Tremor** leve (desligável).
- **Faíscas/partículas** no ponto de contato, **iluminando a cena** por um instante (luz curta — estilo diorama; com o 10).
- **Som** de impacto (leve/médio/forte) no mesmo quadro (05).
- Número de dano opcional.

### 7.6 Magias e projéteis
- Dados próprios: velocidade, vida, dano, forma, efeito ao bater.
- Limite de projéteis simultâneos; **reuso de objetos** (pool).
- Magias podem **acender luzes** temporárias no cenário (o 10 define).

## 8. Inimigos e IA

Estados: `PARADO → PATRULHA/PERSEGUE → AVISO (telegraph) → ATAQUE → RECUPERA → DANO → MORTE`.

Regras de IA justa:
1. **Sempre aviso** antes de golpe forte (pose + brilho + som; marcador no chão para áreas).
2. Tempo de reação humano em níveis fáceis (150–300 ms).
3. **Fichas de ataque:** só 1–2 inimigos atacam ao mesmo tempo; os outros rondam.
4. Recargas e padrões aprendíveis.
5. Sensores simples: visão, linha de visão, alcance; perder o jogador e voltar.
6. Dificuldade muda reação, agressividade e dano — **nunca trapaceia**.
7. Arquétipos e números vêm do **06**.

## 9. Chefe

- **Fases por vida** (ex.: 100–66 %, 66–33 %, 33–0 %) com transição (invencível, animação, câmera, música).
- Lista de padrões com **peso e condição** (distância, fase, recarga).
- **Aviso longo** + marcador no chão + som.
- **Janelas de vulnerabilidade** claras.
- Arena com função (obstáculos, perigos, limites de câmera).
- **Ponto de salvamento antes** e reinício rápido.
- Movimento de câmera dramático na entrada e nas transições (com 07/10).

## 10. Interação, missões e mundo

- **Interagir:** prioridade por distância e direção; ícone acima do alvo.
- **Diálogos:** tocam os dados do 02 (falas, escolhas, flags); travam o controle e podem mover a câmera.
- **Missões:** estados (`não iniciada → ativa → passos → concluída/falhou`) guiados por **flags**; nada travado por ordem de ações.
- **Baús, portas, alavancas, pontos de salvamento** como objetos com estado salvo.
- **Transição de áreas:** portais com destino; fade curto; carregar a próxima área (08).
- **Save:** o que salvar (posição, inventário, flags, missões, objetos abertos) — formato do 08.

## 11. HUD (com o 07)
Lê o estado do jogo por eventos: vida, mana/vigor, habilidades e recargas, item rápido, vida do chefe, dica de interação, objetivo atual. **Nunca cobre o aviso de ataque dos inimigos.**

## 12. Game feel (checklist)
- [ ] Impacto com pausa, flash, recuo, faísca e som
- [ ] Antecipação nos ataques; rastro no golpe rápido
- [ ] Poeira ao correr, esquivar e frear
- [ ] Câmera suave com limites
- [ ] Sombra do personagem sempre no chão (ancora o sprite no 3D)
- [ ] Aviso de vida baixa (visual + som, desligável)
- [ ] Transições suaves entre áreas e telas
- [ ] Opção de reduzir tremor e flashes

## 13. Testes e desempenho

Testes obrigatórios:
1. Jogo abre no navegador sem erros no console.
2. Testes automáticos: dano, máquina de estados, buffer, missões/flags, save e carregamento.
3. **Teste de alcance:** golpe X acerta alvo à distância Y em todas as direções.
4. **Teste de justiça:** todo golpe inimigo tem aviso mínimo.
5. Regressão dos bugs corrigidos.
6. Playtest guiado: anote problemas de sensação (lento, pesado, impreciso).
7. Simulação: inimigos lutando sozinhos por minutos sem travar.

Desempenho (metas do 08):
- 60 fps; até ~40 inimigos ativos e ~150 projéteis/partículas lógicas.
- Reusar objetos; nada de criar e destruir por quadro.
- Inimigos longe da câmera "dormem".
- Modo debug: FPS, estados, caixas, entradas, câmera lenta e avanço quadro a quadro.

## 14. Integração
- **04:** metadados dos sprites (animações, quadros, durações, eventos de quadro, ponto de apoio) → animação e hitboxes. Divergência = ajuste registrado.
- **06:** dados de inimigos, chefes, itens, habilidades e fórmulas.
- **07:** mapas, colisão, portais, HUD e menus.
- **05:** eventos de som (impacto, passo, aviso, UI).
- **10:** eventos de efeito e luz.
- **02:** diálogos, missões, flags.

## 15. Comandos de exemplo
- *"Monte o protótipo cinza: sala 3D, herói-placeholder, câmera 3/4 e luz."*
- *"Implemente movimento em 8 direções, corrida e esquiva com invencibilidade."*
- *"Crie o combate com caixas em dados, pausa de impacto e debug visual."*
- *"Implemente os 5 inimigos do slice com aviso e fichas de ataque."*
- *"Crie o chefe em 3 fases com padrões ponderados."*
- *"Faça um playtest e liste os 10 piores problemas de sensação."*

## 16. Checklist final
- [ ] Documento de gameplay atualizado
- [ ] Protótipo cinza aprovado antes da arte final
- [ ] Movimento responsivo, pés sem deslizar, câmera estável
- [ ] Entrada com buffer e remapeamento
- [ ] Caixas em dados com debug visual; "acerta quando parece"
- [ ] Feedback de impacto completo
- [ ] Inimigos com aviso, fichas de ataque e recarga
- [ ] Chefe com fases, janelas e salvamento antes
- [ ] Interação, missões e save funcionando
- [ ] Testes e desempenho dentro da meta
- [ ] Rodado no navegador (ou "não testado" declarado)
