# Plano de sprites v2 — HD-2D de pixel art em cena isométrica (D-025)

> Autor: 04 Sprites · 2026-10-24 · **Rascunho para aprovação.** Nenhum sprite foi gerado.
> Revisado pela **D-025**: o protótipo era só referência do estilo isométrico, **não se copia**. O estilo é **HD-2D**: sprites 2D de **pixel art nítido** em cena 3D com luz, sombra, profundidade e névoa (como a Bíblia e o `04_sprites.md` já diziam). A versão anterior deste plano (sprites suaves com antialiasing, 128×128) **foi descartada**.
> Célula, escala e ferramenta dependem do **10 (guia visual)** e do **08 (ADR-002)**. Personagens: valem as fichas do 02 (Edric: verde-musgo, uma ombreira, faixa clara, sem vermelho).

## 1. O que o protótipo ensina (só técnica de estrutura)

O método de **partes projetadas** (`makeProj`, pose = deslocamentos, ordem de profundidade por parte) é bom e é o mesmo da §8 do `04_sprites.md`: a proporção nunca encolhe entre quadros. A lista de animações e as **5 direções** (costas, 3/4 costas, lado, 3/4 frente, frente; o resto espelhado) também servem. **Não copio** o desenho (cápsulas lisas, gradientes, antialiasing), as cores, os números nem a UI.

## 2. Como fica "mais detalhe e mais polimento" sem sair do pixel art

| Tema | Plano |
|---|---|
| Resolução do desenho | **Pixel duro**: preenchimento sem antialiasing, em grade inteira, vizinho mais próximo. Alpha só 0/255 |
| Forma | Membros afilados com ombro, cotovelo, joelho e bota legíveis; tronco com cintura; mãos de 2–3 px com polegar; **cabeça grande (≈ 1/3 do corpo)**; silhueta única por personagem |
| Cor | 20–32 cores por personagem, **rampas de 4 tons** por material com **deslocamento de matiz** (sombra fria, luz quente), todas da paleta do 10 |
| Luz desenhada | Frontal-superior suave, volume em 3–4 passos; **pouca sombra pintada** (a cena ilumina, via normal map) |
| Contorno | **Seletivo (selout)** com hierarquia: tom escuro da rampa na base e nas bordas externas, sem preto puro |
| Luz de borda | Rim light de 1 px no lado oposto à luz, em cor fria (combina com Lanterna e Musgo e com noite/tocha) |
| Limpeza de pixel | Passada automática: remove pixels órfãos, suaviza escadas irregulares ("jaggies"), garante linhas de 1 px consistentes |
| Rosto | Olhos de 2×2–2×3 px com brilho, sobrancelha de 1 px, expressão por animação (ataque, dano, medo) |
| Movimento secundário | Cabelo, capa e xale com atraso de 1–2 quadros |
| Golpes | Antecipação → ativo → recuperação; **smear/rastro** da arma em 1–2 quadros; quadros ativos batem com o 03/06 |
| Inimigos | **Aviso de 3–6 quadros** (pose exagerada, retenção); o magenta de perigo é VFX do 10 |
| Rolamento e morte | Rolamento enrolado com poeira (fx do 10); morte em 2 tempos (joelhos, queda) |
| Normal map | **Volta como requisito** (HD-2D depende dele): um por quadro, mesma grade; convenção e geração por partes (cilindro, esfera, plano) conforme o 08. Máscara de brilho opcional (marca do Edric, olhos, runas, cristais do urso) |
| Entrega | PNG **indexado** + normal map + `.meta.json` com eventos de quadro; gerados em build (08 confirma) |

Para que o personagem **não pareça "boneco de pixel simples"**: mais tons por material, volume lido por 3–4 passos de luz, rim light, contorno hierárquico, expressão e movimento secundário.

## 3. O que se mantém

Partes + pose como deslocamentos · 5 direções com lados espelhados · mesma lista de animações do `04_sprites.md` §6 (idle, andar, correr, 3 ataques, rolamento, dano, morte, mais as de cada papel) · âncora nos pés idêntica em todos os quadros · tudo por código · fichas em `docs/arte/sprites/<id>.md` · validação obrigatória · variantes por paleta · originalidade.

## 4. Tamanho e escala: duas opções para 10 e 08 decidirem

O que decide é a **resolução-base de arte** e o **tile isométrico**.

| | Opção A (recomendo) | Opção B |
|---|---|---|
| Tile isométrico de arte | 64×32 | 32×16 |
| Resolução-base | 1280×720 nativa (escala 1× / 2× em 1440p) | 640×360 (escala 2×/3×) |
| Herói / NPC (célula · corpo) | **96×96 · ≈ 60 px** | 64×64 · ≈ 44 px |
| Inimigo pequeno / médio | 64 · 80 | 32 · 48 |
| Chefe (Hollowpaw) | 256×256 (≈ 170 px) | 160×160 (≈ 110 px) |
| Âncora (herói) | (48, 84) | (32, 58) |
| Detalhe | rosto e mãos legíveis, mais polimento | mais "retrô", menos detalhe, mais barato |

Recomendo **A**: dá o polimento pedido sem sair do pixel nítido. Peso: indexado, o herói todo (5 dir × 51 quadros × 96²) fica na casa de 0,4–0,8 MB; o conjunto completo cabe folgado nos ~10 MB.

## 5. Elenco e animações (mantidas)

Todas em 5 direções (S, SE, E, NE, N; demais espelhadas). Quadros por direção.

| ID | Quem | Animações (quadros) | Quadros × 5 dir |
|---|---|---|---|
| `hero_edric` | Edric | idle 4 · walk 8 · run 8 · atk1/2/3 6+6+6 · roll 6 · hurt 2 · death 5 · *habilidades (giro, investida) conforme 03* | 51 (+) |
| `npc_torvan` | Torvan (coxo, bengala-de-treino, Regulamento) | idle 4 · walk 6 · talk 2 · demonstrar golpe 6 | 18 |
| `npc_maren` | Maren (xale, colher de pau, cesta) | idle 4 · walk 6 · talk 2 · rotina 4 | 16 |
| `npc_grace` | Grace (capa grande, óculos, caderno) | idle 4 · walk 6 · talk 2 · nervosa 2 · abençoar 6 | 20 |
| `enemy_morcego` | Rápido | voar 4 · aviso 3 · mergulho 4 · hurt 2 · morte 4 | 17 |
| `enemy_slime` | Emboscador | idle 4 · mover 4 · aviso 4 · pulo 4 · hurt 2 · morte 5 | 23 |
| `enemy_besouro` | Pesado | idle 2 · andar 6 · aviso 5 · investida 4 · hurt 2 · morte 5 | 24 |
| `enemy_lobo` | Combatente | idle 4 · andar 6 · correr 6 · aviso 4 · bote 5 · hurt 2 · morte 5 | 32 |
| `enemy_boneco_treino` | Alvo de treino (D-043; não ataca, sem XP/drops) | batalha: bat_parado 4 · bat_dano 5 (balanço) · bat_morte 4 (tomba, perde a cabeça; volta ao normal na próxima batalha) | 13 |
| `enemy_goblin_arqueiro` | Atirador | idle 4 · andar 6 · aviso 5 · disparo 3 · hurt 2 · morte 5 | 25 |
| `boss_urso_musgo` (Hollowpaw) | Chefe, 2 fases | idle 4 · andar 6 · 4 ataques com aviso longo 6–8 · hurt 2 · transição 8 · morte 12 · entrada 8 | ~80 |

Corpo-base humanoide compartilhado (herói, Torvan, Maren, Grace, goblin, aldeões) com variações de proporção, cabelo, roupa e cor; quadrúpedes e o chefe têm rigs próprios (o chefe pode ser montado em partes: cabeça, patas, cristais). **Assimetria do Edric** (ombreira direita, faixa no antebraço esquerdo): o espelho inverteria os lados, então desenho as direções do lado oposto com o equipamento trocado, em vez de espelhar (regra §7 do `04_sprites.md`).

## 6. Item-modelo e aprovação

**Item-modelo:** `hero_edric` — **idle (4q) e walk (8q) nas 5 direções** + 1 quadro-chave de atk1 (silhueta e smear) + normal map desses quadros. Nenhum outro personagem antes da aprovação.

**Sequência:** (1) ficha `hero_edric.md` → (2) quadro parado S para aprovar silhueta e paleta → (3) 5 direções do parado → (4) walk → (5) validador → (6) envio ao 10 (folha de contato, GIFs 3×, silhueta, cena de teste).

**Critérios propostos para o 10** (ele ajusta):
1. Silhueta em preto sólido legível sobre grama, terra e pedra, com a ombreira única visível.
2. Pixel nítido: sem antialiasing, sem pixel órfão, linhas consistentes, escala inteira.
3. Lê-se no tile isométrico escolhido (rosto e mãos legíveis na Opção A).
4. Três luzes na cena-modelo (dia, entardecer/tocha, noite com névoa) com o normal map funcionando.
5. Andar sem deslizar; ciclos fecham; âncora constante.
6. Cores só da paleta do 10 (sem magenta, sem dourado reservado); 20–32 cores.
7. Faixa clara e marca do antebraço esquerdo legíveis.

## 7. Dependências e perguntas

- **10:** guia v1.0 ainda cita o protótipo (suave, 1280×720); pedir revisão pela D-025 antes do item-modelo. Confirmar rampas de 4 tons, rim light e cena-modelo da praça.
- **08 (ADR-002):** resolução-base e tile (A ou B), ferramenta de geração (Python + Pillow serve para pixel duro; **não está instalado nesta máquina**), geração em build, convenção do normal map, orçamento de peso.
- **03:** quadros ativos dos golpes e se as habilidades têm quadros próprios.
- **Pergunta ao usuário: nenhuma.** As duas anteriores (suave × borda dura, vermelho do Edric) estão resolvidas: pixel nítido e ficha do 02.
