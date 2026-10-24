# BRIEFING BRF-001: 08 Arquiteto — Spikes técnicos + recomendação de stack (ADR-001)

- **Onda:** 0 (não depende da premissa) · **Prioridade:** P0 · **Emitido:** 2026-10-24 pelo Produtor
- **Objetivo:** medir, com números, qual stack faz o visual "diorama" (sprite 2D iluminado em cena 3D) a 60 fps no navegador, e recomendar uma ao usuário. É o maior risco do projeto (R1).
- **Ler antes:** `agentes-rpg/08_arquiteto-tecnico.md` (§3, §4, §8, §9), `CLAUDE.md`, `docs/00_biblia_projeto.md`, `docs/04_decisoes.md` (D-001, D-006), `docs/05_riscos.md` (R1).

## Especificação
- Avaliar no mínimo **3 opções** da §4.1 (protótipo Dunwick fora: não existe, D-001), com versão e licença **atuais** verificadas.
- Rodar os **5 spikes da §4.3** (sprite iluminado, diorama, multidão, carregamento, áudio) com **placeholders gerados por você**. Opções descartadas cedo por critério eliminatório podem pular spikes, com justificativa.
- Medir: fps médio e pior 1 %, memória, chamadas de desenho, tamanho do download, tempo até a primeira tela, nos perfis Alto/Médio/Baixo.
- Máquina de referência: a do usuário, se ele informar; senão, **GPU integrada recente + Chrome** (registre a máquina real em que mediu).
- Preferir soluções **gratuitas e de licença aberta**; nada pago ou com royalties sem aprovação do usuário. Não depender de um portal de publicação específico.

## Itens (lista fechada)
1. Código dos spikes em uma pasta isolada (sugestão: `spikes/<opcao>/`), cada um abrindo no navegador com um comando documentado.
2. `docs/tecnico/spikes.md`: método, máquina, tabela de resultados por opção e perfil, capturas/observações de nitidez de pixel (1×, 2×, 3×).
3. `docs/tecnico/decisoes/ADR-001.md`: opções, matriz de critérios com pesos da §4.2, **recomendação** e riscos. Status "proposto": quem decide é o usuário.
4. Lista do que o ADR-001 vai fixar para os outros agentes: linguagem dos geradores de assets (04/05/07), convenção do normal map, formato de dados/esquemas, formato de áudio, orçamento de peso por área (inclui confirmar ≤ 2,5 MB de áudio inicial).

## Fora de escopo
Esqueleto M1, arquitetura completa, save, pipeline de build, arte final. O esqueleto vem num briefing separado, **depois que o usuário aprovar a stack**.

## Pronto quando
- [ ] ≥ 3 opções avaliadas com versão/licença atuais
- [ ] 5 spikes rodados na opção recomendada (e na 2ª colocada), com números nos 3 perfis
- [ ] Cada spike roda no navegador com comando documentado
- [ ] `spikes.md` e `ADR-001.md` (proposto) escritos
- [ ] Recomendação com 2–3 opções, números e riscos, pronta para eu levar ao usuário
- [ ] Entrega no formato: entregue · validação · suposições · não testado · próximo passo

## Depende de
Nada além deste briefing. Dúvidas ou bloqueios: me avise (Produtor), não peça a outros agentes.
