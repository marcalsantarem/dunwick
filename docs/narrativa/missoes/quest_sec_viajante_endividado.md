# quest_sec_viajante_endividado — Pedágio sem fiscal

> Secundária curta. **[PROPOSTA]** (02). Textos em `textos.csv` (`txt_quest_sec_viajante_*`, `txt_npc_viajante_*`).

- **Tipo:** secundária (estrada).
- **Quem dá, onde, condição:** `npc_viajante` (nome provisório **Tam Rowley**, pergunta j; nome de RPG, D-020), num posto de pedágio vazio da estrada. Aparece na Parte 3.
- **Objetivo no diário (≤ 90 caracteres):** "Ajude o viajante preso no pedágio sem fiscal."
- **Motivo emocional:** o viajante carrega o que sobrou de uma casa perdida por tributo; ele ecoa o passado de Edric.
- **Passos:**
  1. Falar com o viajante: a cancela está trancada e há uma placa "pague na saída, caixa automática". Ele não tem moedas.
  2. **Escolha:** (a) **pagar** com moedas de Edric; (b) **achar o fiscal** (dorme atrás de uma árvore e tem a chave) e convencê-lo; (c) **ignorar**.
  3. Receber a recompensa conforme a escolha.
- **Escolhas e consequências:**
  - **(a) Pagar:** perde moedas; o viajante dá um mapa de um atalho para a feira.
  - **(b) Fiscal:** requer um diálogo curto (humor de burocracia: o fiscal aceita "pagamento em formulário"); o viajante dá um item de cura e o atalho.
  - **(c) Ignorar:** nada muda, mas o viajante aparece depois na feira com uma fala melancólica.
- **Recompensa:** atalho (nível 06 marca o mapa) + item; valores com o 06.
- **Diálogos ligados:** `txt_npc_viajante_*`, `txt_npc_fiscal_*`.
- **Flags:** `flag_sec_viajante_aceita`, `flag_sec_viajante_resolvida` (0 = ignorada, 1 = paga, 2 = fiscal).
- **O que muda no mundo depois:** cancela aberta (se resolvida) e o viajante segue caminho.
- **Nota para o 09 (QA):** a missão **nunca trava a principal**; o viajante aparece na feira em qualquer caso.
