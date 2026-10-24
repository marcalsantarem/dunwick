# BRIEFING BRF-004: 06 Sistemas — Fórmulas, atributos e métricas de nível

- **Onda:** 0 · **Prioridade:** P0 · **Emitido:** 2026-10-24 pelo Produtor
- **Objetivo:** ter as regras numéricas centrais (uma fonte por fórmula, com exemplos resolvidos que virarão testes) e as métricas de nível, para o protótipo cinza e para o pipeline de dano do 03.
- **Ler antes:** `agentes-rpg/06_sistemas-e-niveis.md` (§1–§6, §11.1, §11.6), `CLAUDE.md`, `docs/00_biblia_projeto.md`, `docs/04_decisoes.md` (D-004, D-005, D-006).

## Especificação
- Fases 1–3 do 06: pilares/fantasia (o que o jogador decide a cada 10 s / 10 min / sessão), atributos, recursos, fórmulas, tipos de dano, resistências e estados.
- Kit fixo do herói, sem vocações (D-004); habilidades por ID, desacopladas do herói.
- Só Normal (D-005), mas com **multiplicadores expostos** (dano recebido/causado, janela de esquiva) para História/Desafio no M4.
- Cada fórmula com **≥ 2 exemplos resolvidos** (entrada → saída), prontos para virar teste.
- Tipos de dano e estados **genéricos** (ex.: físico/elemental); nomes de mundo ficam provisórios e marcados "[aguarda 02]".
- Métricas de nível (§11.1) em tiles: tamanho do herói, alcance, larguras de corredor, alturas, distâncias de encontro; e a **sala de teste do M1** descrita em dados, com nomes provisórios.
- Ordem do pipeline de dano igual à do `03_jogabilidade.md` §7.4.

## Itens (lista fechada)
1. `docs/sistemas/formulas.md`
2. `docs/niveis/metricas.md` (inclui a sala de teste do M1)

## Fora de escopo
Bestiário, chefe, itens, economia, loot, mapa do mundo, vila/região/masmorra (dependem do mundo do 02). Formato final de `data/` (depende do ADR-001): use tabelas no documento.

## Pronto quando
- [ ] Toda fórmula com exemplos resolvidos e unidades
- [ ] Multiplicadores de dificuldade expostos
- [ ] Pipeline de dano na mesma ordem do 03 §7.4
- [ ] Métricas em tiles/segundos/quadros; sala de teste do M1 descrita
- [ ] Perguntas para 03 (alinhamento) e 02 (tipos de dano do mundo) listadas para eu repassar
- [ ] Entrega no formato: entregue · validação · suposições · não testado · próximo passo

## Depende de
Nada para começar. O 03 (BRF-003) escreve em paralelo; divergências vêm a mim.
