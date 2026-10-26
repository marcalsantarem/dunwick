# quest_sec_receita_sopa — Sopa para quem nunca janta

> Secundária curta. **[PROPOSTA]** (02). Textos em `textos.csv` (`txt_quest_sec_receita_*`, `txt_npc_taverneira_*`).

- **Tipo:** secundária (vila).
- **Quem dá, onde, condição:** `npc_taverneira`, na taverna. Aparece depois do tutorial e **não expira**: pode ser terminada no epílogo (vila acordada, D-018).
- **Objetivo no diário (≤ 90 caracteres):** "Leve a erva de Maren à taverneira para fazer a sopa dela."
- **Motivo emocional:** a taverneira quer fazer uma sopa para Maren, que cuida de todos e nunca janta; ela deve um favor e não sabe como pagar.
- **Passos:**
  1. Falar com a taverneira: ela precisa da **folha-de-orvalho** (erva do jardim de Maren) e não quer pedir.
  2. Pedir a erva a Maren (ela dá, mas desconfia: "o que ela quer de mim?").
  3. Voltar à taverna e entregar a erva; a taverneira cozinha.
  4. Levar a sopa a Maren, que a aceita com uma frase seca e um sorriso.
- **Escolhas e consequências:** Edric pode contar a verdade a Maren ou inventar uma desculpa (muda só a fala dela).
- **Recompensa:** `item_sopa_ervas` (cura leve, 06) + uma fala extra da taverneira sobre o sino.
- **Diálogos ligados:** `txt_npc_taverneira_*`, `txt_npc_maren_*`.
- **Flags:** `flag_sec_receita_aceita`, `flag_sec_receita_erva`, `flag_sec_receita_ok`.
- **O que muda no mundo depois:** se feita antes do sino, há uma **tigela vazia** ao lado de Maren quando a vila adormece (prop do 07), e na cena da cura ela acorda procurando a tigela. Se feita no epílogo, Maren aceita a sopa e come com Grace e Edric.
- **Nota para o 09 (QA):** funciona nos dois estados do mapa (vila de dia e vila acordada). Não expira.
