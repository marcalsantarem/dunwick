# BRIEFING BRF-005: 07 Cenario — Inventário de telas, fluxos de UI, controles e acessibilidade

- **Onda:** 0 · **Prioridade:** P1 · **Emitido:** 2026-10-24 pelo Produtor
- **Objetivo:** mapear todas as telas e fluxos de UI do slice e os requisitos de controles e acessibilidade, sem arte e sem stack, para que o 03 (HUD ligado ao estado) e o 10 (moldura/ícones) tenham uma lista fechada.
- **Ler antes:** `agentes-rpg/07_cenarios-e-ui.md` (Parte B, §4), `CLAUDE.md`, `docs/00_biblia_projeto.md` (escopo DENTRO/FORA), `docs/04_decisoes.md` (D-004, D-005).

## Especificação
- Inventário de telas do slice (§4.1, §4.4): título "Pressione para começar", menu principal, slots de save (3 + automático; exportar/importar), opções, pausa, inventário simples, diálogo, missões, game over, HUD. Só o que está no escopo DENTRO; o resto vai para uma lista "fora do slice".
- Fluxograma de navegação entre telas (texto ou diagrama), incluindo voltar/cancelar em teclado, mouse e gamepad.
- HUD: o que mostra, de qual estado do jogo vem cada informação, e a regra de nunca cobrir o telegraph.
- Controles (§4.5): ações lógicas, mapeamento padrão por dispositivo e remapeamento. Alinhar os nomes das ações com o 03 (BRF-003, em paralelo); divergências vêm a mim.
- Acessibilidade (§4.6) como checklist: tremor, flashes (≤ 3/s), partículas, desfoque desligáveis; tamanho de texto; contraste; legendas; nenhum significado só por cor.
- Textos por ID (`txt_`/`ui_`) e +40 % de espaço reservado em todo elemento com texto.

## Itens (lista fechada)
1. `docs/ui/inventario_telas.md` (telas, fluxos, HUD)
2. `docs/ui/controles_acessibilidade.md`

## Fora de escopo
Qualquer arte, moldura, fonte, ícone; cenários (Parte A); implementação.

## Pronto quando
- [ ] Toda tela do slice listada com propósito, entradas, saídas e textos por ID
- [ ] Fluxograma cobre as 3 formas de entrada
- [ ] HUD mapeado para estados do jogo
- [ ] Checklist de acessibilidade completo e verificável pelo 09
- [ ] Entrega no formato: entregue · validação · suposições · não testado · próximo passo

## Depende de
Nada para começar.
