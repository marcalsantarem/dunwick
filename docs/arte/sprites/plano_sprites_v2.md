# Plano de sprites v2 — a partir do protótipo (D-024 / BRF-011)

> Autor: 04 Sprites · 2026-10-24 · **Rascunho para aprovação.** Nenhum sprite foi gerado.
> Substitui, onde conflita, a especificação 64×64 / 3 direções / selout de pixel art do `04_sprites.md` §3 e do guia visual v0.3 §3/§5. Tamanhos e ferramenta dependem do **ADR-002 (08)** e do guia visual novo (**10**).

## 1. O que o protótipo faz (lido em `drawHumanoid`, `buildHumanoidSet`, `drawBeast`, `HERO_ANIMS`)

- Personagem = **partes projetadas** (`makeProj(dir5)` leva coordenadas do corpo `f,l,u` a tela); pose = deslocamentos; **ordem de profundidade por parte** (`d`). É o mesmo método da §8 do meu documento, e funciona bem: proporção nunca encolhe entre quadros.
- Desenho **vetorial com antialiasing** (cápsulas, elipses, gradientes), contorno uniforme marrom-escuro de 1 px. Gerado no carregamento (~25 s).
- Célula **96×96**, âncora **(48,78)**, corpo ≈ 50 px. **5 direções** (costas, 3/4 costas, lado, 3/4 frente, frente; o resto espelhado, via `DIR8_TO5`).
- Animações: idle 4q/6fps · walk 8q/10 · run 8q/14 · atk1-3 6q/16 · roll 6q/15 · hurt 2q · death 5q/6. Animais: idle 2, walk 6, run 6, attack 5, hurt 2, death 4.

**Onde fica abaixo de "bem feito":** membros são cápsulas de largura única (sem afinar, sem músculo/joelho/cotovelo definidos); rosto = dois pontos + traço; mãos = bolinha; cabelo = elipses/espetos; sombreamento = um gradiente linear por parte (sem passos de luz definidos, sem luz de borda); contorno igual em tudo (sem hierarquia); capa/cabelo sem movimento secundário; ataque sem rastro (smear) nem antecipação marcada; rolamento é só rotação do corpo todo; morte é tombar rígido; inimigos sem **aviso** próprio (só 1 quadro de agachar); cabeça pequena para o "cabeça grande" do projeto.

## 2. O que muda (sprites v2)

| Item | Protótipo | v2 |
|---|---|---|
| Forma | cápsulas uniformes | **membros afilados** com articulação visível (ombro, cotovelo, joelho, bota), tronco com cintura, mãos com polegar |
| Proporção | ~3 cabeças, cabeça pequena | **cabeça grande (≈ 1/3 do corpo)**, mais personalidade; silhueta única por personagem (herói = 1 ombreira só) |
| Sombreamento | 1 gradiente/parte | **cel-shading de 3–4 passos** por material, luz fixa frontal-superior-esquerda, sombra fria / luz quente (rampas da paleta do 10) |
| Luz de borda | nenhuma | **rim light** frio de 1–2 px no lado oposto à luz principal (casa com Lanterna e Musgo e com noite/tocha) |
| Contorno | marrom único | **contorno hierárquico**: escuro na base e no contorno externo, tom da rampa do material por dentro, mais claro onde há luz |
| Rosto | 2 pontos | olhos com brilho, sobrancelha, boca; **expressão por animação** (dano, ataque, medo) |
| Cabelo/capa/cachecol | estáticos | **movimento secundário** (atraso de 1–2 quadros, balanço) |
| Ataque | pose por quadro | **antecipação → ataque → recuperação**, **smear/rastro** da arma, *squash & stretch* leve, parada de 1–2 quadros no impacto (hit-stop é do 03) |
| Rolamento / morte | rotação rígida | rolamento enrolado com poeira (fx do 10); morte em 2 tempos (joelhos → queda) com ricochete |
| Inimigo | sem aviso | **aviso de 3–6 quadros** (pose exagerada, retenção, brilho de contorno); o magenta de perigo é do VFX (10), o sprite só dá a pose |
| Sombra no chão | desenhada à parte no jogo | sombra elíptica de contato é **camada à parte** (não pintada no sprite), fornecida como fx |
| Entrega | gerado no carregamento | **sprites gerados em build** para arquivo + `.meta.json` (eventos de quadro) — 08 confirma; evita 25 s de carregamento |

Ganho de acabamento sem mudar de técnica: o método de partes projetadas **fica**; troco o "pincel" (cápsula) por formas afiladas com rampas de cor, adiciono rim light, expressões e movimento secundário, e renderizo com **supersampling** (4×) reduzido ao tamanho final para bordas limpas.

## 3. O que se mantém

Partes + pose como deslocamentos · 5 direções com lados espelhados · mesma lista de animações do protótipo (idle, andar, correr, 3 ataques, rolamento, dano, morte) · origem nos pés com a mesma âncora em todos os quadros · tudo por código, sem arte externa · variantes por troca de paleta (aldeões, cores de lobo) · IDs `hero_/npc_/enemy_/boss_` · ficha de sprite por personagem · validação obrigatória · originalidade.

## 4. Tamanho e escala (proposta; **confirmar com 10 e 08**)

Tela 1280×720, tile isométrico 64×32.

| Tipo | Célula | Altura do corpo | Âncora |
|---|---|---|---|
| Herói / NPC | **128×128** | ≈ 70 px (cabeça ≈ 24) | (64, 112) |
| Inimigo pequeno (morcego, slime) | 96×96 | 36–48 px | (48, 80) |
| Inimigo médio (lobo, goblin, besouro) | 128×128 | 48–64 px | (64, 112) |
| Chefe (Hollowpaw) | **320×320** | ≈ 200 px | (160, 280) |

Render de autoria a 4× e redução; opcional "@2x" (256) para tela cheia/alta densidade se o 08 quiser. Estimativa de peso (só herói): 5 dir × 51 quadros × 128² ≈ 4,2 Mpx, na ordem de 1–1,5 MB em PNG; conjunto completo cabe em ~6–8 MB, perto do teto de ~10 MB — **o 08 deve confirmar o orçamento ou aceitar atlas com paleta indexada**.

## 5. Elenco e animações

Todas em 5 direções (S, SE, E, NE, N; demais espelhadas). Quadros por direção.

| ID | Quem | Animações (quadros) | Quadros × 5 dir |
|---|---|---|---|
| `hero_edric` | Edric | idle 4 · walk 8 · run 8 · atk1/2/3 6+6+6 · roll 6 · hurt 2 · death 5 · *giro Q 6 · investida E 4 (a confirmar com 03)* | 51 (+10) |
| `npc_torvan` | Torvan (coxo, bengala-de-treino) | idle 4 · walk 6 (coxeia) · talk 2 · demonstrar golpe 6 | 18 |
| `npc_maren` | Maren (xale, colher de pau, cesta) | idle 4 · walk 6 · talk 2 · rotina (mexer panela) 4 | 16 |
| `npc_grace` | Grace (capa grande, óculos, caderno) | idle 4 · walk 6 · talk 2 · nervosa 2 · abençoar 6 | 20 |
| `enemy_morcego` | Rápido | voar 4 · aviso 3 · mergulho 4 · hurt 2 · morte 4 | 17 |
| `enemy_slime` | Emboscador | idle 4 · mover 4 · aviso (achata) 4 · pulo 4 · hurt 2 · morte 5 | 23 |
| `enemy_besouro` | Pesado | idle 2 · andar 6 · aviso 5 · investida 4 · hurt 2 · morte 5 | 24 |
| `enemy_lobo` | Combatente | idle 4 · andar 6 · correr 6 · aviso 4 · bote 5 · hurt 2 · morte 5 | 32 |
| `enemy_goblin_arqueiro` | Atirador | idle 4 · andar 6 · aviso (puxa a corda) 5 · disparo 3 · hurt 2 · morte 5 | 25 |
| `boss_urso_musgo` (Hollowpaw?) | Chefe, 2 fases | idle 4 · andar 6 · 4 ataques com aviso longo 6–8 cada · hurt 2 · transição 8 · morte 12 · entrada 8 | ~80 |

Corpo-base humanoide compartilhado (herói, Torvan, Maren, Grace, goblin, aldeões) com variações de proporção, cabelo, roupa e cor; quadrúpedes e o chefe têm rigs próprios. Frente/costas/lado coerentes (cabelo, capa, arma, ombreira); assimetria do Edric (ombreira direita, faixa no antebraço esquerdo) obriga desenhar o lado oposto, não espelhar o rosto de forma ingênua — o espelho vale só para a pose e o rosto/ombreira são invertidos no rig.

## 6. Item-modelo e aprovação

**Item-modelo:** `hero_edric` — **idle (4q) e walk (8q) nas 5 direções**, mais **1 quadro-chave de atk1** para checar rastro e silhueta. Nenhuma outra animação ou personagem antes da aprovação.

**Sequência:** (1) rig humanoide v2 + ficha `docs/arte/sprites/hero_edric.md` → (2) quadro-chave parado (S, 5 dir) → (3) idle + walk → (4) validação → (5) envio ao 10.

**Critérios para o 10 aprovar** (proponho; ele ajusta):
1. Silhueta em preto sólido legível sobre grama, terra e pedra da praça.
2. Lado a lado com o herói do protótipo na mesma escala: melhor em anatomia, rosto, mãos, sombreamento.
3. Visto no tile 64×32 (altura ≈ 1,1 tile): lê-se a ombreira única e a faixa a distância normal.
4. Três luzes: dia, entardecer/tocha, noite com névoa.
5. Andar sem deslizar (passo bate com 2,2 e 3,5 tiles/s do 03); ciclos fecham; âncora constante.
6. Cores só da paleta do 10, sem magenta/dourado reservados.
Entrego: folha de contato (5 dir × quadros), GIFs 3×, silhueta, cena de teste, relatório do validador.

## 7. Dependências e perguntas

- **08:** ferramenta de geração e rasterização (preciso de **curvas com antialiasing ou supersampling**; Pillow puro não tem antialiasing de traço e **não está instalado** nesta máquina), geração em build ou no carregamento, formato (PNG indexado/atlas), orçamento de peso, **convenção/necessidade de normal map** em jogo isométrico 2D com luz dinâmica (proponho adiar para Pacote 2 se a iluminação for por sobreposição, como no protótipo).
- **10:** guia novo, paleta, rim light/contorno, aprovação do item-modelo, sombra de contato como fx.
- **03:** se giro (Q) e investida (E) ganham quadros próprios; quadros ativos dos 3 golpes.
- **02:** confirmar visual de Torvan/Maren/Grace (fichas lidas; aparência já serve).

**Perguntas ao usuário (3):**
1. **Estilo de acabamento:** manter o visual **suave com antialiasing** do protótipo, com sombreamento em passos (recomendo), ou **pixel art de borda dura**?
2. **Edric:** o do protótipo usa couro vermelho e capa vermelha; a ficha do 02 diz **gibão verde-musgo, uma ombreira, faixa clara, sem vermelho**. Sigo a ficha (recomendo) ou o vermelho do protótipo?
3. O chefe **Hollowpaw** é o **urso-musgo** (`boss_urso_musgo`)? Se sim, o nome está decidido?
