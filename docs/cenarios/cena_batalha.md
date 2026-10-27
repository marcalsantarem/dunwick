# Cena de batalha 3D — M1 (BL-006)

> **Dono:** 07 Cenários · **Versão:** v0.1 (plano, sem código nem arte) · **Data:** 2026-10-27 · **Base:** `docs/combate_turnos.md` §10, `docs/cenarios/kit_isometrico.md`, `docs/arte/guia_visual.md` (§7, §9.1), D-029/D-031/D-033 e o esqueleto lido em `src/motor/`, `data/config/` e `data/maps/map_baixo_orvalho_praca.json`.
> **Regra:** **sem fundo pintado**. O fundo é o diorama 3D HD-2D, feito com o **mesmo kit, as mesmas texturas e a mesma luz** da exploração. Valores de câmera são **propostas**; o 08 confirma num ensaio.

## 1. Ideia em uma frase
A batalha acontece num **palco 3D curto e frontal** (a "arena"), montado com as peças do kit, visto por uma **câmera de batalha de lado** (o eixo x do palco é o eixo horizontal da tela), com a luz de entardecer da direção A e névoa de mel ao fundo. A câmera de exploração (giro 45°) não serve: nela o eixo do combate seria uma diagonal.

## 2. Câmera de batalha (proposta; o 08 confirma)

| Item | Valor | Por quê |
|---|---|---|
| Projeção | **ortográfica** (como a exploração) | pixel nítido e estável, sem variação com a distância |
| Giro (yaw) | **0°** (olha para −z; **+x = direita da tela**) | `combate_turnos` §10.1 exige o eixo x horizontal na tela; grupo à direita, inimigos à esquerda |
| Inclinação | **25°** (faixa 22–28°; 08 testa serrilha do chão) | menor que a exploração (30°): linhas de personagens mais separadas e fundo mais "palco" |
| Resolução interna | **640×360** (modo por cena; escala inteira 3× em 1080p) | 20 × 11,25 tiles visíveis; Edric ≈ 2,2 tiles ≈ 64 px ≈ 18 % da altura. A 960×540 ele ficaria com 12 % (pequeno). Pixel maior que o da exploração **só dentro da batalha**; a névoa da transição esconde a troca |
| Alvo da câmera | `(0 ; 0 ; −1,6)` no centro da tela | põe os pés da fileira do meio (z = 0) a **56 % da altura**; a faixa inferior fica livre para a UI (15) |
| Movimento | **fixo**; só golpe especial e chefe (§9 do combate) | regra do projeto |
| Tremor | desligável (A02) | acessibilidade |

**Enquadramento resultante** (640×360 px de arte, 32 px por tile; pés = linha onde o personagem "pisa"; 1 tile de profundidade = 13,5 px na vertical):

| Slot | Posição no mundo (x ; z) | Tela (x ; y dos pés) | Topo da cabeça (y) |
|---|---|---|---|
| Grupo 1 · Edric | **(+3,0 ; 0,0)** | (416 ; 202) | ≈ 138 |
| Grupo 2 · Grace | **(+3,6 ; +1,6)** | (435 ; 224) | ≈ 160 |
| Grupo 3 · reservado | **(+3,6 ; −1,6)** | (435 ; 180) | ≈ 116 |
| Inimigo 1 | **(−3,0 ; 0,0)** | (224 ; 202) | ≈ 138 |
| Inimigo 2 | **(−3,6 ; −1,6)** | (205 ; 180) | ≈ 116 |
| Inimigo 3 | **(−3,6 ; +1,6)** | (205 ; 224) | ≈ 160 |

- Mesmas posições do `combate_turnos.md` §10.1 (unidades do mundo = tiles; origem no centro do palco; **z + = para a câmera**). O alvo 3 do grupo e o inimigo 3 ficam em lados opostos de z de propósito, como no documento do 03.
- **Y dos pés** = 56 % + z · 13,5 px. Cabeças a 2,2 tiles × cos 25° × 32 ≈ 64 px acima dos pés.
- **Contato corpo a corpo:** o atacante vai até 1,1 tile do alvo (x ≈ −1,9 para Edric contra o inimigo 1): atravessa o centro, que fica livre (§4).
- **Zona da UI (15):** os 26 % inferiores (y > 266). O pé mais baixo (Grace, 224) e a sombra ficam 40 px acima. Nomes e números de dano ocupam y ≈ 90–135, sobre o fundo (§4 garante que ali não há detalhe que brigue com o texto).
- **Âncora para a UI:** o 08 expõe `projetarSlot(lado, slot)` → pixel de tela (cabeça e pés), para o 15 posicionar nomes, setas de alvo e números.

## 3. Arenas

Cada encontro tem `cenario` (`combate_turnos` §11); proponho o prefixo de ID **`cen_`** (o Produtor registra) e um arquivo `data/cenarios/cen_*.json` com slots, câmera, luz, névoa e lista de peças (formato com o 08).

### 3.1 `cen_praca` — a praça de Baixo Orvalho (**P0**, os 3 encontros do M1)
Coordenadas **locais** do palco; a arena é um grupo separado, longe do mapa (§6). Reaproveita a praça: calçada, musgo, lanternas, casas e poço.

```
 z ↑ fundo (topo da tela, névoa de mel)
-14 ·   carvalhos/pinheiros em linha (moldura, muito enevoados)
-10 ·       [casa A musgo]            [casa B telha]       fachada +z visível
 -7 ·  ___ linha de base do fundo (nada alto à frente dela) ___
 -5 ·  arbustos e pedras só nos flancos (|x| ≥ 6)     poço (+7,5 ; −5,2)
 -3 ·  (L1)                                          (L2)   lanternas
        ─ ─ ─ ─ ─ faixa de combate: calçada limpa, x ∈ [−5,5], z ∈ [−3,+3] ─ ─ ─
 +3 ·  inimigos ◀── centro livre ──▶ grupo       marcas de posição no chão
 +6 ·  grama baixa e terra (sob a UI)
        x:  −12      −6       0       +6      +12
```

| Camada | Peças do kit (esqueleto já tem) | Posição local | Observação |
|---|---|---|---|
| Chão do palco | calçada (`c`) elíptica, x ∈ [−9, 9], z ∈ [−4, 4]; borda de **musgo** (`m`) e depois grama/terra | — | desgaste ao centro, juntas com musgo; sem desenho no centro (leitura dos sprites) |
| Marcas de posição | decalques discretos: círculo de ≈ 0,8 tile sob cada slot | 6 slots (§2) | ancoram os sprites; baixo contraste |
| Fundo próximo | **2 casas** (`casa`, faces +z detalhadas) | A: (−6 ; −8,5; rot 0; `telhado: musgo`) · B: (+5 ; −9; rot 0; `telhado: telha`) | frente da fachada em z = −7; vão central (x −3,5..2,5) mostra a rua e a névoa |
| Luz | **4 lanternas** (`lanterna`, 2,7 tiles) | (−7 ; −3,2), (+7 ; −3,2), (−7,5 ; +3,6), (+7,5 ; +3,6) | só nos flancos; no perfil Baixo valem as 2 de trás |
| Âncora do lugar | `poco` | (+7,5 ; −5,2) | atrás do flanco do grupo: "é Baixo Orvalho" |
| Flancos baixos | `barril`, `caixote`, `arbusto`, `pedra` | \|x\| ≥ 6, z de −5 a +2 | altura ≤ 0,9 tile |
| Moldura de fundo | `arvore`, `pinheiro` | linha em z = −11 a −14, x de −12 a +12 | muito enevoados; cortam o topo da tela |
| Vida | partículas de poeira dourada e folhas; fumaça das chaminés das casas | `efeitos` | ≤ 40 no perfil Baixo |

### 3.2 `cen_estrada` — a estrada (**P1**, "se couber")
Região aberta (direção C: luz de dia, sombras frias suaves). Mesma estrutura de camadas: **faixa de terra** (`t`) no palco com grama e musgo nas bordas; fundo com **carvalhos e pinheiros** em duas linhas (z −8 e −13), **cerca baixa** nos flancos, **pedras**; sem casa. Névoa clara e mais curta; sem lanternas (luz do sol com mais sombra projetada). Custo: ≈ 25 instâncias do kit; **nenhuma peça nova**. Cartaz em poste (`prop_cartaz`) é opcional (P2). A caverna (direção B) e o covil do Hollowpaw ficam fora do M1.

## 4. Leitura dos sprites e oclusão (regras de ouro da cena)

1. **Faixa de combate limpa:** em x ∈ [−5, 5] e z ∈ [−5,5; +6] **nada** mais alto que 0,5 tile e **nenhum decalque** que tenha contraste com o chão. Só as marcas de posição.
2. **Linha de base do fundo em z = −7** (y ≈ 108): fica **acima** das cabeças da fileira de trás (y ≈ 116). Assim os sprites se destacam contra o chão, não contra janelas e telhados. Objetos altos só atrás dessa linha; nos flancos (\|x\| ≥ 6) podem existir lanternas e árvores mais à frente porque ficam fora dos sprites (x dos sprites: ± 4,6).
3. **Nada na frente:** não há primeiro plano alto em z > +2,5 dentro de \|x\| < 6 (a câmera é de lado; nenhuma peça cobre ator nenhum). **Sem oclusão** na batalha por construção; a silhueta/recorte do esqueleto fica desligada nesta câmera.
4. **Contraste:** o fundo é **mais escuro e menos saturado** que os sprites (luminância média ≤ 70 % da dos sprites), com névoa crescente para cima; os sprites mantêm contorno e normal map. O 10 define os números.
5. **Cor reservada:** magenta `perigo_*` nunca no cenário; o brilho dourado só nas lanternas e em interativos (aqui, só lanternas).
6. **Luz-chave:** a mesma direção fixa da exploração (alto-esquerda-atrás): sombras caem para a frente-direita nos dois lados; **sombra de contato** forte sob cada ator.
7. **Fundo e UI:** nada de detalhe de alta frequência atrás de nomes/números (y 90–135); a fachada das casas fica acima disso por causa da linha de base.
8. **Mortes e saídas:** o ator que some (Slime, Lobo) deixa só a sombra de contato por 0,3 s; nada de cadáver no cenário no M1.

## 5. Luz, névoa e atmosfera de batalha (direção A; valores finais: 10)

| Item | Proposta | Fonte |
|---|---|---|
| Hora | a **hora atual do ciclo** (`cfg_ciclo`): a batalha à noite é à noite (lanternas acesas) | continuidade com o mapa |
| Sol | mesma cor/elevação do ciclo, **sombra com área menor** (cobertura ≈ ±14 tiles em vez de ±26): sombras mais nítidas | `cena.js` (COB) |
| Preenchimento | + luz hemisférica de **leitura** (+0,10–0,15) na faixa de combate: "leitura vem antes de clima" | guia §7 |
| Luzes pontuais | até 4 lanternas (**8/4/2** por perfil Alto/Médio/Baixo) | `cfg_perfis` |
| Névoa | **0 %** no palco; **15–25 %** em z = −7; **45–60 %** em z = −14; cor de mel (âmbar) de dia/entardecer, cinza-azulada à noite | guia §7; 08 ajusta curva |
| Profundidade de campo | foco na faixa z ∈ [−3, +3]; desfoque crescente para o fundo e leve para a frente (efeito de maquete) | `pos_dof` (**perfil Baixo: só névoa e tom**) |
| Vinheta | a do perfil, um pouco mais forte (+0,05) para centrar a ação | `cfg_perfis` |
| Partículas | poeira dourada lenta, folhas, fumaça de chaminé; desligáveis (A04) | `efeitos.js` |
| Telegraph | **não há** no combate por turnos; o magenta continua reservado ao mundo | D-028 |

## 6. Transição mapa ↔ batalha (visual)

Proposta (escolha **A**; a B fica como alternativa):

| Passo | Tempo | O que se vê |
|---|---|---|
| 1. Alerta | 0,35 s | passos disparam o encontro: o herói para, o jogo "congela" um instante e o ícone de alerta aparece sobre ele (som do 05) |
| 2. Cobertura | 0,25 s | a tela vai à **névoa de mel** (cor da névoa do momento), sem piscar branco |
| 3. Troca | instantânea | a câmera passa para a de batalha; a arena (grupo fora do mapa) já está carregada; os atores nos slots |
| 4. Revelação | 0,35 s | a névoa se abre revelando a arena; os atores **entram deslizando** de x = ±8 até o slot (0,45 s) |
| 5. Saída | 0,30 s | vitória: névoa cobre, a câmera volta ao mapa, o herói reaparece onde parou |

- Total de entrada ≈ **1,0–1,1 s**. Sem flash (A01). **"Reduzir movimento":** corte com fade de 0,15 s e atores já nos slots.
- **A (recomendada):** arena dedicada + cobertura por névoa. Independe de onde o jogador estava e garante a composição do §4.
- **B:** girar a câmera de 45° para 0° no mesmo lugar, com a praça real ao fundo. Bonito, mas depende de onde o encontro acontece (árvores, casas e paredes podem cair na faixa de combate). Só se o 03/13 limitarem os pontos de encontro.
- O **efeito da troca** (névoa em tela cheia) é do 10 (VFX) e do 08 (passe final); o 07 só define o que aparece antes e depois.

## 7. O que o esqueleto já tem × o que falta

| Já existe (lido em `src/motor` e `data/`) | Falta para a batalha |
|---|---|
| Peças `casa`, `arvore`, `pinheiro`, `arbusto`, `pedra`, `poco`, `torre_sino`, `lanterna`, `barril`, `caixote`, `cerca` com pegada e visual em `cfg_kit` | **Grupo "arena"** separado do mapa, carregado por `cenario` |
| Chão por tipo (`grama`, `terra`, `calcada`, `musgo`) e 14 texturas | **Palco elíptico** com borda orgânica e **marcas de posição** (decalques) |
| Ciclo dia/noite, névoa, vinheta, sombra do sol por perfil, luzes pontuais por perfil | **Câmera de batalha** (giro 0°, 25°), **resolução por cena**, enquadramento (alvo `(0;0;−1,6)`) |
| Lanternas que acendem por hora; partículas e fumaça de chaminé | **Névoa por profundidade** calibrada, **foco por faixa** (DoF) e sombra de área menor |
| Sprites em plano voltado à câmera, âncora nos pés, sombra de silhueta e de contato, normal map | Sprites de batalha **de uma direção** (04); `projetarSlot` para a UI |
| Mapa `map_baixo_orvalho_praca` (48×48, 7 casas, 12 lanternas, poço, torre) | **Transição** (cobertura de névoa) e carregamento da arena sem engasgo |
| Validadores de dados e de assets | Esquema e dado `data/cenarios/cen_*.json`; teste de "faixa de combate limpa" |

Peças **novas de kit: nenhuma** no M1. Opcionais: `prop_cartaz` (P2), poças de orvalho (P2).

## 8. O que o 07 pede (via Produtor)

| Para | Pedido |
|---|---|
| **08** | (1) Confirmar câmera de batalha: ortográfica, giro 0°, 25°, resolução interna 640×360 por cena e escala inteira; (2) como montar e carregar a **arena separada** do mapa (grupo fora de vista, sem recriar por quadro); (3) sombra do sol com cobertura menor para a arena e custo; (4) **foco por faixa de profundidade** e névoa por z (custo por perfil; Baixo só com névoa); (5) `projetarSlot` para a UI; (6) formato e esquema de `data/cenarios/cen_*.json` (slots, câmera, luz, peças); (7) tempo de carga da arena. |
| **10** | Valores finais de luz, névoa, contraste fundo × sprite e preenchimento de leitura; aprovar a composição da `cen_praca` e o visual da transição; cor das marcas de posição. |
| **03** | Campo `cenario` nos encontros (`cen_praca` nos três do M1); evento de entrada/saída da cena e de "ator entra no slot"; tempos da transição (já em `cfg_batalha`). |
| **04** | Poses de batalha de **uma direção** (grupo olha para a esquerda; inimigos para a direita), mesma escala do herói (≈ 2,2 tiles) e sombra de contato; chefe maior (128–256 px) pede arena própria (fora do M1). |
| **15** | Reservar os **26 % inferiores** para a UI; nomes e números sobre y 90–135; pedir `projetarSlot` ao 08 em vez de calcular posição. |
| **05** | Ambiente da arena (vento, lanternas) e som da transição. |

## 9. Verificação (para 09/10)
Faixa de combate limpa (regra 1) · linha de base do fundo acima das cabeças (regra 2) · sprites legíveis em dia, entardecer e noite · lanternas e névoa sem esconder sprites ou texto · 6 slots nas posições da §2 (± 0,05 tile) · transição ≤ 1,1 s sem flash · desempenho dentro do orçamento do 08 nos 3 perfis · mesmo kit, sem fundo pintado.

## 10. Perguntas ao usuário
Nenhuma. (Decisão de gosto que pode subir depois: **transição A (névoa) ou B (giro da câmera)**; recomendo A.)
