# Dunwick (nome provisório)

> **Status:** v1.0 — **APROVADA pelo usuário em 2026-10-24** (fecha a parte de Bíblia do M0).
> Mantido pelo Produtor (01). Hierarquia de verdade: usuário > esta Bíblia > documento do agente dono.
> Itens **[A DEFINIR]** não têm decisão ainda; ninguém inventa nomes ou fatos além do que está aqui.

## Pitch e pilares

> Um órfão treina para ser cavaleiro e, na missão final de graduação, traz de uma caverna um espólio que se revela maldito. Para salvar quem ele ama, adia a vingança contra o rei tirano e sai atrás de uma feiticeira. A busca cresce até virar a luta para salvar o mundo de um mal gigante.
> Combate de ação em tempo real, rápido e legível, em cenários-diorama de luz viva.
> Aventura épica com humor ácido e tom adulto (16 anos), com momentos melancólicos e tensão.

**Pilares:**
1. **Combate preciso:** todo golpe inimigo tem aviso; esquiva e timing valem mais que números.
2. **Mundo-diorama:** pixel art nítido em cenários 3D com luz, sombra e profundidade (direção de arte **A · Lanterna e Musgo**, D-008).
3. **Começa pequena, termina grande:** a história parte de um aprendiz e de uma maldição na vila e cresce até o destino do mundo; humor ácido sem tirar o peso dos momentos sérios.

## Premissa (origem: usuário)

- **Herói:** jovem aprendiz de guerreiro, órfão, de passado trágico. Quer se tornar cavaleiro e, no fundo, **vingar o passado contra um rei/tirano do país**. A vingança é o **pano de fundo**, não o centro. Nome **[A DEFINIR]**.
- **Estrutura de abertura** (inspirada só na estrutura da primeira missão de FFVIII, nada copiado): uma **missão final de graduação** numa caverna, com um chefe.
- **Gancho:** o chefe deixa um **espólio misterioso**. Depois da formatura, o objeto se revela **maldito/enfeitiçado** e atinge alguém da vila. O herói **adia a vingança e a ida para ser cavaleiro** e sai atrás de **uma feiticeira** capaz de desfazer a maldição.
- **Primeira companheira (NPC):** ele a encontra na busca. A ideia de longo prazo é um **grupo de 3** (jogador + 2 NPCs que lutam sozinhos, com habilidades que o jogador pode usar) e **mais NPCs recrutáveis do que vagas**, para variar o gameplay.
- **Arco geral:** pequeno e pessoal no começo; depois o rei e a maldição se ligam a um **mal gigante**; o final é **salvar o mundo**.
- **Tom:** humor leve e ácido, mais adulto, com tensão real. Classificação-alvo **16 anos** (D-011).
- **Ainda não definido:** nomes (herói, vila, rei, feiticeira, companheira, mal gigante), o que é o espólio, quem na vila é atingido, a origem da vingança. O 02 propõe opções ao usuário; nada vira fato sem aprovação.

## Público e classificação

- Jogadores de RPG de ação e fãs de pixel art, 16+ (classificação-alvo **16 anos**; humor ácido, tom mais adulto).
- Sessões de 20–40 min; slice completo em ~1–2 h.
- Limites do 16 anos em D-011 (violência mais explícita sem gore extremo; sem nudez/sexo explícito; sangue desligável).

## Escopo atual — vertical slice (M3)

### DENTRO
| Área | Quantidade |
|---|---|
| Vila | 1 (`map_vila_*`) |
| Região aberta | 1 |
| Masmorra | 1 |
| Herói jogável | 1 (`hero_*`) |
| Inimigos comuns | 5 (`enemy_*`) |
| Chefe | 1 (`boss_*`) |
| Missões | 3–5 (1 principal em 3 partes: graduação, maldição, rumo à feiticeira; + 2–4 secundárias) |
| Sistemas | movimento, esquiva, ataque básico, 2–3 habilidades, vida/recurso, itens de cura, inventário simples, diálogo, missões, save local |
| Plataforma | navegador de computador, teclado + mouse, gamepad |
| Idioma | português do Brasil |

### O que o slice conta da história (proposta, 02 confirma)
Vila (treino e vida cotidiana) → caverna da graduação (**masmorra** + **chefe**) → volta à vila com o espólio, que desencadeia a maldição → **região aberta** rumo à feiticeira → fim do slice com a **primeira companheira** se juntando em cena. O encontro com a feiticeira e o resto do mundo ficam depois do slice.

### FORA (até depois do slice)
Grupo de combate (a companheira entra **só como cena e diálogo** no fim do slice, sem lutar; D-012), multiplayer, árvore de talentos extensa, crafting, celular, idioma inglês (entra no M4), dublagem, editor de níveis para jogadores, conquistas, monetização ativa.

## Referências (estilo e técnica, **nunca para copiar**)

- **Final Fantasy V** — proporções de sprite 16-bit, legibilidade em célula pequena.
- **Octopath Traveler / HD-2D** — sprite 2D em cenário 3D com luz, profundidade de campo e névoa.
- **Zelda: A Link to the Past / Secret of Mana** — ritmo de combate de ação em vista 3/4.

Proibido: personagens, criaturas, nomes, símbolos, músicas e UI dessas obras (ex.: janela azul em degradê).

## Plataforma e restrições do navegador (resumo; detalhe pelo 08)

- 60 fps em computador intermediário (pior 1 % ≥ 45); perfis Alto/Médio/Baixo.
- Download inicial ≤ ~10 MB; áudio só após clique/tecla; save local com versão e exportar/importar.
- Stack: **a definir pelo 08** (ADR-001), após spikes com números.

## Time e responsabilidades

| # | Agente | Responsável por |
|---|---|---|
| 01 | Produtor | Plano, escopo, Bíblia, briefings, marcos, localização/lançamento/legal |
| 02 | Roteirista | Mundo, personagens, missões, diálogos |
| 03 | Jogabilidade | Implementação do gameplay |
| 04 | Sprites | Pixel art gerada por código + normal map |
| 05 | Som | SFX e música sintetizados por código |
| 06 | Sistemas e Níveis | Regras, números, balanceamento, mapas em dados |
| 07 | Cenários e UI | Kit 3D, props, luz, telas de UI, acessibilidade |
| 08 | Arquiteto Técnico | Stack, arquitetura, formatos, desempenho, publicação |
| 09 | QA | Testes, medições, passa/não passa |
| 10 | Direção de Arte e VFX | Guia visual, paleta, pós, efeitos; aprova arte |

Equipe: 1 usuário + agentes de IA. Prazo por marcos, sem datas fixas.

### Comando e delegação

Cada agente roda numa **sessão própria** do Claude Desktop. O **Produtor comanda**: tudo passa por ele.

| Sessão | Papel | Instrução |
|---|---|---|
| Produtor - Agent principal | 01 | `agentes-rpg/01_produtor.md` |
| Roteirista | 02 | `agentes-rpg/02_roteirista.md` |
| Jogabilidade | 03 | `agentes-rpg/03_jogabilidade.md` |
| Sprites | 04 | `agentes-rpg/04_sprites.md` |
| Som | 05 | `agentes-rpg/05_som.md` |
| Sistemas | 06 | `agentes-rpg/06_sistemas-e-niveis.md` |
| Cenario | 07 | `agentes-rpg/07_cenarios-e-ui.md` |
| Arquiteto | 08 | `agentes-rpg/08_arquiteto-tecnico.md` |
| QA | 09 | `agentes-rpg/09_qa.md` |
| Diretor de Arte | 10 | `agentes-rpg/10_direcao-de-arte-e-vfx.md` |

Regras:
1. **Usuário → Produtor → agentes.** O usuário fala com o Produtor; o Produtor transforma o pedido em briefing e delega.
2. **Nenhum agente trabalha sem briefing** escrito em `docs/briefings/BRF-xxx_<agente>_<entrega>.md` (modelo do `01_produtor.md` §7), com critério de pronto.
3. **Entrega volta ao Produtor**, no formato *entregue · validação · suposições · não testado · próximo passo*. O Produtor valida, atualiza `01_lista_assets.md`/roadmap e decide o próximo passo.
4. **Agentes não se pedem trabalho diretamente.** Se um precisa de algo de outro, pede ao Produtor. Podem ler os documentos uns dos outros em `docs/`.
5. **Decisões criativas, de escopo e de stack** sobem ao usuário pelo Produtor (2–3 opções + recomendação).
6. Cada agente escreve só nas suas pastas (`docs/<área>/`, `assets/<área>/`, `src/<área>/` conforme spec do 08); `docs/00–05` e `docs/briefings/` são do Produtor.

## Links

- Roadmap: [02_roadmap.md](02_roadmap.md) · Decisões: [04_decisoes.md](04_decisoes.md) · Riscos: [05_riscos.md](05_riscos.md)
- Lista de assets: `01_lista_assets.md` (criada após mundo + guia visual) · Backlog: `03_backlog.md`
- Agentes: [`agentes-rpg/`](../agentes-rpg/)
