# quest_sec_formulario_27b — Formulário 27-B

> Secundária curta. **[PROPOSTA]** (02). Valores de recompensa com o 06. Textos em `textos.csv` (`txt_quest_sec_form27b_*`, `txt_npc_escrivao_*`).

- **Tipo:** secundária (vila).
- **Quem dá, onde, condição:** `npc_escrivao`, no posto do escrivão (Coroa), junto à praça de Baixo Orvalho. Aparece depois do tutorial (Cena 1.1) e **não expira**: pode ser terminada no epílogo (vila acordada, D-018).
- **Objetivo no diário (≤ 90 caracteres):** "Reúna os 3 carimbos do Formulário 27-B."
- **Motivo emocional:** o escrivão do tributo acredita que o formulário protege quem entra em lugar perigoso e quer que Edric volte; o saque lhe ensinou que quem some sem papel vira estatística.
- **Passos:**
  1. Falar com o escrivão (da Coroa): ele explica o formulário e exige 3 carimbos (armas, saúde, juramento).
  2. **Carimbo de armas:** ferreiro. Ele só carimba com o **recibo de taxa** que Edric carrega no cinto (o recibo vira prop de missão; Edric não perde o item, ele é devolvido).
  3. **Carimbo de saúde:** Maren. Ela carimba com a colher de pau, mas só se Edric prometer comer algo.
  4. **Carimbo de juramento:** Torvan (de brincadeira: "Juro que ele é um péssimo aluno. Carimbado.").
  5. Entregar o formulário ao escrivão.
- **Escolhas e consequências:** nenhuma de peso. Se feita antes da caverna, a placa não cobra taxa extra; depois da caverna o escrivão registra o formulário **retroativamente** (humor).
- **Recompensa:** 2 itens de cura pequenos + `item_carimbo_honorario` (item de lore; valores com o 06).
- **Diálogos ligados:** `txt_npc_escrivao_*`, `txt_npc_ferreiro_*`, `txt_npc_maren_*`, `txt_npc_torvan_*`.
- **Flags:** `flag_sec_27b_aceita`, `flag_sec_27b_carimbos` (0–3), `flag_sec_27b_ok`.
- **O que muda no mundo depois:** o escrivão pendura o formulário na parede ("Caso resolvido"); depois do sino ele aparece dormindo ao lado dele (detalhe de cena).
- **Nota para o 09 (QA):** funciona nos dois estados do mapa (vila de dia, Parte 1; vila acordada, epílogo); os NPCs usam os textos `txt_epi_*` no epílogo. Não pode travar a principal.
