# quest_sec_receita_zefa — Sopa para quem nunca janta

> Secundária curta. **[PROPOSTA]** (02). Textos em `textos.csv` (`txt_quest_sec_receita_*`, `txt_npc_taverneira_*`).

- **Tipo:** secundária (vila).
- **Quem dá, onde, condição:** `npc_taverneira`, na taverna. Aparece depois do tutorial, **só antes da caverna**.
- **Objetivo no diário (≤ 90 caracteres):** "Leve a erva da Cuidadora à taverneira para fazer a sopa dela."
- **Motivo emocional:** a taverneira quer fazer uma sopa para a Cuidadora, que cuida de todos e nunca janta; ela deve um favor e não sabe como pagar.
- **Passos:**
  1. Falar com a taverneira: ela precisa da **folha-de-orvalho** (erva do jardim da Cuidadora) e não quer pedir.
  2. Pedir a erva à Cuidadora (ela dá, mas desconfia: "o que ela quer de mim?").
  3. Voltar à taverna e entregar a erva; a taverneira cozinha.
  4. Levar a sopa à Cuidadora, que a aceita com uma frase seca e um sorriso.
- **Escolhas e consequências:** Edric pode contar a verdade à Cuidadora ou inventar uma desculpa (muda só a fala dela).
- **Recompensa:** `item_sopa_ervas` (cura leve, 06) + uma fala extra da taverneira sobre o sino.
- **Diálogos ligados:** `txt_npc_taverneira_*`, `txt_npc_cuidadora_*`.
- **Flags:** `flag_sec_receita_aceita`, `flag_sec_receita_erva`, `flag_sec_receita_ok`.
- **O que muda no mundo depois:** quando a vila adormece, há uma **tigela vazia** ao lado da Cuidadora (narrativa ambiental, prop do 07). Na cena da cura, ela acorda procurando a tigela.
- **Nota para o 09 (QA):** expira ao iniciar a Parte 2; aviso no diário.
