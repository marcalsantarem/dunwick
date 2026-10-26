# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Estado atual do repositório

Há código: **esqueleto M1** (Three.js, ADR-001 aceito em D-016). Comandos: `npm install`; `npm run dev` (http://localhost:5173, debug ligado); `npm test` (node:test; um arquivo: `node --test tests/heroi.test.mjs`; um teste: `--test-name-pattern`); `npm run validar` (dados + assets); `npm run build` (validar → testes → empacotar → peso, saída em `build/prod`); `npm run test:navegador` (Chrome real; `-- --medir=60`). Detalhes em `docs/tecnico/esqueleto_m1.md`. `src/jogo/` é simulação pura (sem three/DOM); `src/motor/` é a única camada que importa `three`. Geradores de assets em JavaScript/Node (sem Python). Documentos dos agentes em `agentes-rpg/`; decisões em `docs/04_decisoes.md`; a Bíblia aprovada em `docs/00_biblia_projeto.md`. O repositório é git.

**Atenção (D-028):** o combate de ação em tempo real foi arquivado em `docs/arquivo/combate_acao/` e na tag `combate-acao-v1`. Trechos abaixo sobre passo fixo de 60 Hz, quadros, telegraph e esquiva valem para a exploração e para um possível modo de ação futuro; o combate por turnos será especificado depois.

Idioma do projeto: **português do Brasil** (documentos, textos e comunicação).

## O projeto

RPG **de combate por turnos** (D-028, estilo Breath of Fire; mundo isométrico), fantasia medieval **original**, single-player, **no navegador**. Sprites em pixel art 16-bit (compactos, cabeça grande) dentro de cenários 3D com luz dinâmica, sombras, profundidade de campo, névoa e partículas (estilo "diorama"/HD-2D). Câmera 3/4 fixa (≈30–45°); movimento de câmera só em cenas e golpes especiais.

**Meta atual (vertical slice):** 1 vila, 1 região aberta, 1 masmorra, 1 herói, 5 inimigos, 1 chefe, 3–5 missões, save. Nada de P2/P3 antes do slice.

**Originalidade é regra dura:** referências (Final Fantasy V, Octopath Traveler etc.) são de estilo e técnica; nunca copiar personagens, criaturas, nomes, símbolos, músicas ou UI (ex.: nada da janela azul em degradê).

"Protótipo Dunwick": se existir código de protótipo, ele deve ser lido e avaliado (pelo 08) antes de qualquer decisão de stack.

## Como os agentes funcionam

Cada arquivo em `agentes-rpg/` é a instrução completa de um papel. Ao receber um pedido, identifique o agente responsável e **leia o arquivo dele antes de agir** — cada um traz padrões, templates de documento, fluxos por fase, checklists e caminhos de entrega.

| # | Agente | Responsável por |
|---|---|---|
| 01 | Produtor | Plano, escopo, Bíblia do Projeto, briefings, marcos, localização/lançamento/legal. Não cria assets |
| 02 | Roteirista | Mundo, personagens, missões, diálogos, textos |
| 03 | Jogabilidade | Implementa gameplay (movimento, câmera, combate, IA, interação, HUD ligado ao estado) |
| 04 | Sprites | Pixel art **gerada por código** (ex.: Python + Pillow) + normal map + metadados + preview |
| 05 | Som | SFX e música **sintetizados por código**, mixagem, validação |
| 06 | Sistemas e Níveis | Regras, números, fórmulas, balanceamento, layouts de mapa em dados |
| 07 | Cenários e UI | Kit 3D modular, props, luz/atmosfera, telas de UI, controles, acessibilidade |
| 08 | Arquiteto Técnico | **Único que escolhe ferramentas/stack**; arquitetura, formatos, save, pipeline, desempenho, publicação |
| 09 | QA | Encontra, reproduz, mede e recomenda passa/não passa; não corrige nem decide escopo |
| 10 | Direção de Arte e VFX | Guia visual, paleta mestra, pós-processamento, itens-modelo, cena-modelo, efeitos; aprova arte do 04/07 |

Regras transversais (valem para todos):
- Fora do 08, agentes descrevem **o que** precisam, nunca **qual ferramenta**.
- Hierarquia de verdade: **usuário > Bíblia do Projeto (`docs/00_biblia_projeto.md`) > documento do agente dono**.
- **Item-modelo antes de produção em massa** (1 inimigo, 1 tile, 1 música… aprovado primeiro).
- Pergunte só o essencial; se faltar algo, assuma o padrão da tabela "Padrões" do agente, declare e siga.
- Decisões criativas são do usuário: ofereça 2–3 opções e recomende uma. Escolha de stack também (08 recomenda com números de spikes).
- Mudança de escopo/número sempre registrada (`docs/04_decisoes.md`; ADRs em `docs/tecnico/decisoes/ADR-xxx.md`).
- **Formato de toda resposta:** 1 frase do que vai fazer → trabalho em arquivos (não texto solto no chat) → no fim: **entregue · validação · suposições · não testado · próximo passo**.

Ordem de dependências: Produtor (Bíblia + escopo) → 08 (spec + esqueleto) / 10 (guia visual) / 02 (mundo) → 06, 03, 04, 07, 05 → integração → 09. Marcos M0 Fundação → M1 Protótipo cinza → M2 Cena-modelo → M3 Vertical slice → M4 Polimento → M5 Beta → M6 Lançamento (critérios em `01_produtor.md` §6 e `09_qa.md` §8).

## Convenções compartilhadas

- **IDs** em minúsculas, idênticos em arte, texto, dados, código e áudio, com prefixos: `hero_`, `npc_`, `enemy_`, `boss_`, `item_`, `skill_`, `quest_`, `map_`, `fx_`, `sfx_`, `mus_` (também `txt_`, `ui_`, `amb_`, `atk_`, `cfg_`, `perfil_`, `z_`).
- **Densidade única:** 1 tile = 1 unidade do mundo = 32×32 px de arte, em sprites, texturas, UI e efeitos. Escala inteira, sem filtro/suavização.
- Sprites: célula 64×64 (herói/NPC), âncora nos pés (ex.: 32,60), 4 direções (S, N, L desenhadas; O espelhada), 8–12 fps, alpha só 0/255, pouca sombra pintada (a luz vem da cena via normal map).
- Distâncias em **tiles** e **segundos**; tempos de combate em **quadros a 60 Hz**.
- **Todo texto do jogo em tabelas por ID** (nunca no código); UI reserva +40 % de espaço; nunca montar frases por concatenação (usar variáveis inteiras como `{nome_item}`).
- Telegraph obrigatório em todo golpe inimigo; efeitos e HUD nunca cobrem o aviso. Flashes ≤ 3/s; tremor, flashes, partículas e desfoque desligáveis.

## Arquitetura técnica prevista (definida pelo 08)

```
Plataforma (navegador) └─ Motor (render, câmera, luz, pós, áudio, carregamento)
  └─ Simulação (passo fixo 60 Hz; estados, combate, IA, missões) — não conhece pixels/shaders
      └─ Conteúdo em dados (personagens, ataques, itens, mapas, textos)
Apresentação (sprites, VFX, UI) lê o estado da simulação; comunicação por eventos (dano, morreu, golpe_acertou, missão_mudou)
```

- Laço com acumulador de passo fixo 1/60 e desenho interpolado; aba em segundo plano pausa simulação e áudio sem simular o tempo perdido.
- Jogo acontece num **plano de chão (x, z)** + faixa de altura; hitboxes são formas no chão (círculo, cone, retângulo) definidas em dados por ataque/quadro, independentes do sprite.
- **Sem números mágicos:** dano, velocidades, quadros, custos em `data/`, validados por esquema a cada build. Eventos de quadro (passo, hit_start/hit_end, som, efeito) ficam nos `.meta.json` dos sprites.
- Pipeline de dano em ordem fixa (`03_jogabilidade.md` §7.4), alinhada às fórmulas únicas de `docs/sistemas/formulas.md` (06), cujos exemplos resolvidos viram testes.
- Reuso de objetos (pools), nada criado/destruído por quadro. Orçamento: 60 fps (pior 1 % ≥ 45), ~40 inimigos + ~150 partículas/projéteis, download inicial ≤ ~10 MB, perfis Alto/Médio/Baixo.
- Regras do navegador: áudio só após clique/tecla; save local com versão, migração, escrita segura, backup e exportar/importar (validação rígida; nunca inserir texto do save como HTML).

Estrutura de pastas prevista (ajustável à stack):
```
docs/    documentos do time (00_biblia_projeto, 01_lista_assets, 02_roadmap, 03_backlog, 04_decisoes, 05_riscos + narrativa/, sistemas/, niveis/, arte/, audio/, ui/, cenarios/, tecnico/, qa/, gameplay.md)
data/    conteúdo (characters, attacks, enemies, bosses, items, skills, quests, maps, texts)
assets/  sprites/<id>/, env/, props/, fx/, ui/, audio/
src/     motor/, jogo/, ui/, plataforma/
tools/   validadores (validar_sprites, validar_audio…), geradores de assets por código, simulações, bots de QA
tests/
build/   saída gerada (não editar à mão)
```

Build previsto: validar dados → validar assets → testes → empacotar → relatório de peso por área. Nunca declarar algo pronto sem rodar no navegador; se não foi possível, dizer explicitamente o que não foi testado.
