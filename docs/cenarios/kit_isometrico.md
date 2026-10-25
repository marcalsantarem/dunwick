# Kit modular isométrico e variantes de Baixo Orvalho — plano (v0.2)

> **Dono:** 07 Cenários e UI · **Versão:** v0.2 (corrigida pela D-025; a v0.1 copiava o protótipo e foi descartada) · **Data:** 2026-10-24 · **Status:** PLANO. Nenhuma arte produzida (item-modelo e cena-modelo aprovados pelo 10 antes de produzir).
> **Alvo (D-025):** HD-2D **bonito e polido**: sprites 2D em cenário 3D modular com luz, sombras, profundidade e névoa, visto em **câmera isométrica fixa**. O protótipo do usuário é **só referência do estilo isométrico**: nada dele é copiado (peças, números, UI).
> **Não decide** ângulo final, resolução, densidade de pixel (10/08, ADR-002) nem layout (06): descreve **o que** o cenário precisa e as regras que a vista isométrica impõe.

## 1. O que a vista isométrica muda no kit

A câmera é fixa, gira 45° no plano e inclina ≈ 30° (ângulo final: ADR-002 do 08/10). Isso cria regras que o kit da v0.1 (câmera 3/4 de frente) não tinha:

| # | Consequência | Regra do kit |
|---|---|---|
| I1 | **Só duas faces de cada bloco aparecem** (as voltadas para a câmera, "sul" e "leste") e o topo. As outras duas ficam escondidas. | Detalhar, texturizar e dar vida (janelas, portas, cartazes) **às faces visíveis**; as escondidas recebem só textura simples (peso e tempo). Portas, janelas e entradas **voltam para as faces visíveis**. |
| I2 | **Objetos altos escondem o que está atrás** (acima na tela). | Regra de ouro de composição: **objetos altos (casas, torres, árvores grandes, muros) ficam no fundo (norte/oeste)** das áreas jogáveis; os caminhos e o combate acontecem **à frente** deles. Nada importante (inimigo, NPC, baú, perigo) atrás de um objeto alto sem **recorte/transparência** ou **silhueta** (§3). |
| I3 | **Ordenação por profundidade:** peças e sprites se sobrepõem em diagonais. | Cada peça declara **âncora nos pés**, **pegada em tiles** e **altura**; o motor ordena/usa profundidade (08). Nada de peça "flutuando" entre dois níveis de altura. |
| I4 | **Eixos diagonais:** ruas e muros correm em diagonal na tela. | O kit é feito em **múltiplos de 1 tile**; peças em **pares** (eixo X e eixo Y: cerca, muro, escada, ponte). Cantos têm peça própria. |
| I5 | **A silhueta lê melhor de cima:** o chão domina a imagem. | Chão com **3–5 variações + transições**, caminhos legíveis (pedra = andar; muro/casa = bloqueio), **bordas marcadas** em degraus e penhascos. |
| I6 | **A câmera não gira** nem dá zoom. | Podemos "mentir" nas faces escondidas e nas costas dos objetos; cada cena tem um só ponto de vista a compor. |
| I7 | **Telhado e parede da frente cobrem o interior.** | Casas visitáveis têm **corte** (§3): telhado e parede frontal ficam translúcidos/somem ao entrar. Interior modelado como "caixa aberta". |
| I8 | **Sombras e luzes mostram altura.** | Sombra direcional coerente por hora (longa no entardecer) **+ sombra de contato** sob cada peça; luz de janela/lanterna com halo no chão. |
| I9 | **Bordas do mapa:** nunca mostrar o "fim do mundo". | Colinas, névoa e árvores-moldura nas bordas; câmera limitada por zona. |

## 2. Convenções do kit

- **Escala única:** 1 tile = 1 unidade do mundo; toda peça é múltipla de tile; herói ≈ 1,2–1,6 tile de altura (04/10 fecham); porta = 1,5 tile; parede = 2 tiles. Densidade de pixel/resolução: **10/08** (ADR-002) — o kit não fixa px por tile.
- **Geometria simples + textura rica:** blocos, rampas, telhados, rochas facetadas, troncos; **detalhe na textura** (reboco manchado, vigas e X de enxaimel, pedra, musgo), geometria enxuta. Tudo gerado **por código**.
- **Vegetação, grama alta, flores, cercas finas:** planos voltados para a câmera ("billboards") ou cruzados, com balanço de vento.
- **Cada peça tem em dado:** `id`, pegada de colisão (retângulo/polígono em tiles) **igual ao visual**, `altura`, `oclusao` (`nenhuma | recorte | transparencia(40 %)`), `terreno` (para o passo do 05 e a poeira do 10), `luzes[]`, `animacao[]`, estados.
- **Interativos** (baú, porta, alavanca, quadro de avisos, ponto de salvamento, poço): estados (`fechado/aberto`, `apagado/aceso`) e **contorno dourado** ao aproximar ou ao passar o cursor (a UI e o 10 definem a forma do contorno).
- **IDs (propostos; o Produtor registra os prefixos):** `env_` para peças de cenário (estruturas, natureza, chão), `prop_` para objetos menores; `map_` e `fx_` já existem.

## 3. Oclusão e sobreposição na câmera isométrica

| Técnica | Quando | Detalhe |
|---|---|---|
| **Translucidez/recorte** da peça que cobre o herói | herói ou inimigo em combate atrás de objeto alto (casa, torre, árvore, muro) | Peça fica a ≈ 40 % de opacidade, ou é **recortada** num círculo em volta do herói; transição ≤ 150 ms. O 08 escolhe a técnica (recorte por máscara, ordem de desenho, *dither*). |
| **Silhueta de oclusão** do herói | sempre que algo o cobrir | Contorno claro do herói por cima do objeto; desligável em Opções (A81). |
| **Telegraph acima do cenário alto** | golpe inimigo com zona sob objeto alto | A zona de aviso (chão) **nunca** fica escondida: o objeto fica translúcido ou o aviso é desenhado por cima com contorno (decisão 10/08). Teste obrigatório do 09. |
| **Corte de edifício** | herói entra em casa/taverna | Telhado e parede frontal somem; piso, mobília e parede de fundo ficam visíveis. |
| **Árvores e arcos em primeiro plano** | emoldurar a cena | Copas **semitransparentes** quando sobrepõem o herói ou o telegraph; nunca bloqueiam a leitura. |
| **Alvo clicável atrás de objeto** | NPC/inimigo oculto | Contorno visível através do objeto (picking pelo 08) — A83. |
| **Zonas de câmera** | limites de mapa | A câmera para antes do vazio; o herói pode sair do centro ali. |

**Regra de composição derivada (I2):** o 06 evita encostar corredores e arenas de combate **atrás** de objetos altos; quando inevitável, o 07 marca a **zona de oclusão** do módulo em dado e o 09 a testa.

## 4. Lista de peças do kit (modular)

Prioridade: **P0** item-modelo / slice mínimo · **P1** slice completo · **P2** depois.

### 4.1 Chão e terreno
| ID | Peça | Observação | Prio |
|---|---|---|---|
| `env_chao_grama` | grama (3–5 variações + grama alta + transições para terra/pedra) | musgo nas bordas úmidas | **P0** |
| `env_chao_terra` | terra e estrada | rodas, pegadas, poças | **P0** |
| `env_chao_calcamento` | **calçamento de pedra da praça** | pedras individuais, **juntas de musgo**, desgaste ao centro, círculo ao redor do poço | **P0** |
| `env_chao_transicao_*` | transições grama ↔ terra ↔ pedra ↔ água | **borda orgânica**, sem emenda | **P0** |
| `env_degrau`, `env_rampa`, `env_escada` | desníveis em múltiplos de 0,5 tile, **bordas bem marcadas** | pares de eixo | P1 |
| `env_penhasco_borda` | borda de penhasco/colina | contorno claro, nunca esconde caminho | P1 |
| `env_agua`, `env_ponte_madeira` | riacho com reflexo e espuma; ponte | só se o 06 usar | P2 |

### 4.2 Estruturas (cada uma com **faces visíveis** detalhadas, I1)
| ID | Peça | Variações / parâmetros | Prio |
|---|---|---|---|
| `env_casa_enxaimel` | casa de aldeão (reboco + vigas + base de pedra) | corpos 2×2, 3×2, 3×3 · telhado (`telha`, `ardosia`, **`telha_musgo`**) · mansarda · chaminé · janelas acesas · semente | **P0** |
| `env_casa_maren` | casa da curandeira: ervas pendendo, luz de vela, estante vista pela janela | herda a casa + props; **interativa na vila adormecida** | **P0** |
| `env_taverna` | taverna da Elda Pott | 4×3, placa, varanda, mesas externas | P1 |
| `env_forja` | forja do Hargen Stoll (forno de pedra, chaminé alta, bigorna) | brasa e fumaça | P1 |
| `env_posto_escrivao` | posto do Corvin Ledge (guichê, carimbos) | casa pequena + balcão | P1 |
| `env_portico` | **pórtico da vila** com viga e **gancho do sino** | `sino = ausente / presente`; bandeirola da vila | **P0** |
| `env_muro_pedra` | muros retos, quina, portão | `fuligem`, `musgo`, `quebrado` | **P0** |
| `env_cerca` | cerca de madeira (eixos X/Y, canto, portão) | `quebrada` | **P0** |
| `env_pateo_treino` | quintal do Torvan (boneco, rack, cerca baixa) | props | P1 |
| `env_torre`, `env_ruina` | torre/ruínas (região aberta, caverna) | com o 02/06 | P2 |

### 4.3 Props
| ID | Peça | Estados / animação | Prio |
|---|---|---|---|
| `prop_poco` | **poço de pedra** — o poço seco onde o Edric se escondeu | `seco/com_agua`; corda e balde | **P0** |
| `prop_lanterna_poste`, `prop_lanterna_parede` | lanternas (**direção A**) | `apagada/acesa`, halo, oscila | **P0** |
| `prop_barril`, `prop_caixote`, `prop_saco` | volumes pequenos | empilháveis | **P0** |
| `prop_bau` | baú | `fechado/aberto`, brilho ao aproximar | **P0** |
| `prop_quadro_avisos` | editais e taxas; cartaz de Ysolt aparece por flag | texto por ID | **P0** |
| `prop_ponto_salvamento` | marco/santuário com chama calma (10 define) | `apagado/aceso` | **P0** |
| `prop_sino_cobre` | **Sino de Cobre** quando presente | `doente` (verde-azulado) → `limpo` (cobre); balanço | P0 |
| `prop_bandeira_vila` | bandeirola com a cor própria da vila | ondula | P0 |
| `prop_banco`, `prop_mesa_ext`, `prop_varal`, `prop_ervas`, `prop_bigorna`, `prop_forno`, `prop_boneco_treino`, `prop_rack_armas`, `prop_cartaz` | decoração e narrativa | balançam/brilham | P1 |
| `prop_carroca` (Coroa), `prop_estaca` | região aberta | — | P2 |

### 4.4 Natureza
| ID | Peça | Variações | Prio |
|---|---|---|---|
| `env_arvore_carvalho` | tronco 3D + copa (geometria simples ou sprite) | 6 + versão **musgo** + **outono** | **P0** |
| `env_arvore_pinheiro` | pinheiro e pinheiro-prateado | 3 + 1 | P1 |
| `env_arvore_queimada_rebrotada` | **árvore queimada que rebrotou** (história: saque) | 1 | **P0** |
| `env_arbusto`, `env_flor`, `env_tufo` | arbustos, flores, grama alta animada | 3 + 4 + 3 | **P0** |
| `env_pedra`, `env_pedra_musgo` | rochas facetadas | 3 + 3 | **P0** |
| `env_toco`, `env_tronco_oco` | toco e tronco oco | 1 + 1 | P1 |

### 4.5 Masmorra e região aberta (resumo; detalhar quando o 06 entregar os layouts)
Pisos de pedra molhada, paredes, colunas, portões, armadilhas, alavancas, tochas, cristais, covil do urso (direção B · Cinza e Brasa); cartazes em árvores e postes, pedágios vazios, lona da feira (direção C · Iluminura). **Nada produzido agora.**

## 5. O que "bonito e polido" significa no cenário (propostas ao 10)

| # | Melhoria | Por quê |
|---|---|---|
| P1 | **Musgo** em telhados, muros e pedras (decalques verde-azulados espalhados por semente) | direção A: identidade da vila |
| P2 | **Sombras direcionais coerentes** (longas no entardecer) **e sombra de contato** | profundidade na isometria |
| P3 | **Luz de janela e lanterna** com halo no chão, que acende ao entardecer | "luz que conta" |
| P4 | **Transições de chão** com borda orgânica e juntas de musgo no calçamento | chão domina a imagem (I5) |
| P5 | **Anti-repetição:** semente por casa, 3 rebocos, 3 telhados, varal/ervas/mansarda variáveis | evitar "a mesma casa" |
| P6 | **Detalhe narrativo por objeto** (cartaz, ervas, estante, fuligem) | 02: 10 detalhes por local |
| P7 | **Profundidade:** colinas e névoa nas bordas, copas em primeiro plano translúcidas | I9, oclusão |
| P8 | **Movimento ambiente:** copas e tufos ao vento, fumaça, bandeiras, orvalho que brilha, vaga-lumes à noite | "algo sempre se move" |
| P9 | **Marcas do saque:** casas novas ao lado de pedra enegrecida, árvore queimada que rebrotou, muro com fuligem, **gancho vazio no pórtico** | história pelo cenário |

## 6. A praça de Baixo Orvalho

> Mapa único `map_baixo_orvalho`. A composição abaixo é **sugestão** que respeita I1–I9; o **06 decide o layout e a colisão** (`docs/niveis/`).

```
        casas altas, taverna, casa da Maren (NORTE/OESTE da praça = fundo)
              ·  (ervas)          ·  (varanda)
   [forja]  ·       praça de pedra (andável)        · [quadro de avisos]
  (fumaça)           ◯ poço seco                        [posto do escrivão]
     árvore queimada             · [pátio do Torvan, cerca baixa]
     rebrotada                ↓ caminho de terra
                  [PÓRTICO — gancho vazio]  ← entrada do herói (SUL/LESTE = frente)
```

- **Altos atrás, andável na frente (I2):** casas e torres ao fundo; praça aberta e caminhos à frente.
- **Primeiro olhar (1 s):** pedra clara = andar; reboco/musgo escuro = bloqueio; **poço** é o foco; janelas e lanternas guiam às portas.
- **Faces visíveis (I1):** portas e janelas das casas voltadas para a câmera; fundos simples.
- **Composição:** a praça, o pórtico e a casa da Maren são "ilustrações" de câmera (cena-modelo do 10).

## 7. As três variantes (mesmo mapa, estados por flags — D-019)

O mapa e a colisão são **um só**; o estado vira a tabela `estados_mapa` (condição por flags; por objeto: `visivel`, `pose`, `interativo`, `luz`, `musica`), escolhida **ao carregar**; precedência **acordada > adormecida > dia** (06). Os números de luz são do 10; aqui, o que muda em **objetos**:

| Elemento | **Dia** (Parte 1) | **Adormecida** (aura sombria) | **Acordada** (epílogo livre) |
|---|---|---|---|
| Luz geral | normal; entardecer da direção A | **fria e baixa**, sombra azul-esverdeada; tempo parado | **manhã dourada**; orvalho brilhando |
| Janelas | acesas ao entardecer | **apagadas**, exceto a vela da casa da Maren (guia) | abertas, cortinas |
| Lanternas | acendem ao entardecer | **fracas e tremidas** | apagadas de dia |
| Aldeões | em pé, com rotina | **deitados/encostados** (D-019: versão completa, poses novas do 04) | em pé, **poses próprias** de epílogo |
| Interativos | todos | **só a casa da Maren** (porta e estante); resto com texto `ui_` do bloqueio | secundárias da vila e "Partir/Ficar" |
| Pórtico | **gancho vazio** | gancho vazio (o sino está na feira) | **Sino de Cobre pendurado**, toca na cena da cura |
| Clima e partículas | folhas, poeira, pássaros, fumaça | **névoa baixa**, "zz", sem pássaros nem fumaça | pétalas, pássaros, fumaça |
| Cartazes | editais; cartaz de Ysolt "depois" | + papéis caídos | cartaz gasto/rasgado |
| Marcas do saque | visíveis | mais escuras | parcialmente cobertas de flores/hera |
| Música | tema da vila | zumbido grave | tema caloroso (05) |

**Atenção:** aldeões adormecidos **sem colisão que bloqueie rota** (≥ 2 tiles de folga) e **fora de zonas de oclusão** importantes; o caminho início → casa da Maren → praça → portão é testado **por variante** (03/06). Troca de estado por **cena** (a cura), sem simular o "acordar".

## 8. Validação do cenário (para 09/10)

| Verificação | Critério |
|---|---|
| Costuras | sem emenda visível entre peças |
| Repetição | em 60 s de caminhada, nenhuma casa/árvore igual vizinha |
| Densidade | todas as peças na mesma densidade de pixel (a definida pelo 10/08); sem pixel esticado ou misturado |
| Paleta | só cores do guia do 10, por estado |
| Colisão | pegada visual = pegada de dado (andar rente a cada peça) |
| Legibilidade | caminho × obstáculo em 1 s, de dia e à noite; **telegraph visível em todas as luzes e sob objetos altos** |
| **Oclusão** | herói, inimigos em combate e telegraph nunca escondidos; silhueta e translucidez funcionam em todas as peças altas |
| **Faces e fundo** | portas/janelas nas faces visíveis; nada importante atrás de objeto alto (I2) |
| Composição | cada parada de câmera é uma ilustração (praça, pórtico, casa da Maren) |
| Estados | 3 variantes carregam pelas flags; sem soft-lock |
| Peso e desempenho | dentro do orçamento do 08 na máquina de referência (Ryzen 3 5300G) |
| Originalidade | sem cópia de cenários existentes |

## 9. O que o 07 precisa (via Produtor)

| Para | Pedido |
|---|---|
| **10** | Guia de cenário em isometria: ângulo, contorno, sombras, luz de janela/lanterna, **paleta por estado e por hora**, musgo; **item-modelo** (1 chão de calçamento + 1 casa + 1 poço + 1 árvore) e **cena-modelo** (a praça) para aprovar; **camada do telegraph** em relação ao cenário alto. |
| **08** | Câmera isométrica (ângulo, resolução, densidade de pixel), técnica de oclusão (recorte/translucidez/silhueta), ordenação por profundidade, picking do cursor, luz dinâmica por dados, orçamento de objetos/luzes/sombras, formato de `data/maps/` e `estados_mapa`. |
| **06** | Layout, colisão e rotas da praça seguindo I2; zonas de oclusão; `estados_mapa`; folga dos adormecidos. |
| **04** | Escala do herói contra casa e porta; poses de aldeão deitado e de epílogo. |
| **02** | Detalhes narrativos por objeto (10 por local), textos de cartazes por ID, lista de aldeões por casa. |
| **03** | Eventos de luz/clima por flags e hora; troca de estado na cena da cura; picking e regras de clique. |

## 10. Perguntas ao usuário (via Produtor)
1. **Ciclo dia/noite:** a vila tem um ciclo que passa de manhã a noite durante o jogo, ou só os três estados (dia, adormecida, acordada) com a luz de entardecer da direção A? (Recomendado: **estados fixos + entardecer** no slice; ciclo no M4.)
