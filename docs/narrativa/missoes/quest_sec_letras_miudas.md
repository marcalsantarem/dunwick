# quest_sec_letras_miudas — Letras Miúdas

> Secundária curta (4ª, D-018 v=B). **[PROPOSTA]** (02). Valores de recompensa com o 06. Textos em `textos.csv` (`txt_quest_sec_letras_*`, `txt_npc_vendedor_feira_*`, `txt_npc_curiosa_*`, `txt_item_contrato_ysolt_*`).

- **Tipo:** secundária (feira).
- **Quem dá, onde, condição:** `npc_vendedor_feira` (nome provisório **Bram Honeywell**, pergunta j; nome de RPG, D-020), na feira. Aparece ao chegar à feira (Cena 3.2), **antes de o jogador falar com Ysolt**.
- **Objetivo no diário (≤ 90 caracteres):** "Descubra a cláusula que prende o vendedor ao contrato da Ysolt."
- **Motivo emocional:** o vendedor comprou o "Pacote Anti-Dívida" para salvar o telhado da mãe e a dívida cresceu; Grace quer ver Ysolt corrigir o que mente, e Edric conhece o preço de um papel mal lido.
- **Passos:**
  1. Falar com o vendedor: ele entrega o **contrato** (`item_contrato_ysolt`) e pede ajuda.
  2. **Achar 3 pistas** pela feira (letreiro "garantidas", rodapé das exclusões, a fala da curiosa sobre a tinta da cláusula 14-B).
  3. **Escolha:**
     - **(a) Citar o artigo e exigir o reembolso:** Edric confronta Ysolt (vício de forma, art. 44, parágrafo oculto). Ela devolve as moedas, irritada.
     - **(b) Pedir a Grace que corrija o letreiro:** Grace troca "garantidas" por "possíveis" em silêncio; o vendedor recebe crédito em doces, sem confronto.
  4. Voltar ao vendedor.
- **Consequências:**
  - (a): a loja de Ysolt cobra mais caro de Edric no resto da cena; Grace fica calada (a Ysolt "ferida" aparece na confissão mais frágil).
  - (b): Ysolt nem percebe; Grace ganha confiança, e a cena da confissão (3.2) fica mais leve.
- **Recompensa:** `item_doce_limao` (cura leve) + (a) as moedas devolvidas ao vendedor (que o recompensa com 1 doce extra) ou (b) crédito de doces; valores com o 06.
- **Diálogos ligados:** `txt_npc_vendedor_feira_*`, `txt_npc_curiosa_*`, `txt_quest_sec_letras_*`.
- **Flags:** `flag_sec_letras_aceita`, `flag_sec_letras_pistas` (0–3), `flag_sec_letras_resolvida` (0 = aberta, 1 = reembolso, 2 = letreiro corrigido).
- **O que muda no mundo depois:** (a) vendedor fecha a barraca por um tempo; (b) o letreiro mostra "CURAS POSSÍVEIS" (troca de prop para o 07).
- **Nota para o 09 (QA):** a missão **não expira por acidente**: a cena da confissão só começa quando o jogador fala com Ysolt e confirma (`txt_ui_feira_confirma`). Se ele sair sem fazê-la, a missão fica aberta no diário e **não** é concluída (não há retorno à feira no slice; aceitável por escolha do jogador).
