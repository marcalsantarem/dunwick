# quest_sec_formulario_27b — Formulário 27-B

> Secundária curta. **[PROPOSTA]** (02). Valores de recompensa com o 06. Textos em `textos.csv` (`txt_quest_sec_form27b_*`, `txt_npc_escrivao_*`).

- **Tipo:** secundária (vila).
- **Quem dá, onde, condição:** `npc_escrivao`, no campo de treino de Baixo Orvalho. Aparece depois do tutorial (Cena 1.1) e **só antes da caverna**.
- **Objetivo no diário (≤ 90 caracteres):** "Reúna os 3 carimbos do Formulário 27-B antes de entrar na caverna."
- **Motivo emocional:** o escrivão acredita que o formulário protege quem entra; ele nunca viu ninguém voltar sem o papel assinado e quer que o aluno volte.
- **Passos:**
  1. Falar com o escrivão: ele explica o formulário e exige 3 carimbos (armas, saúde, juramento).
  2. **Carimbo de armas:** ferreiro. Ele só carimba com o **recibo de taxa** que Edric carrega no cinto (o recibo vira prop de missão; Edric não perde o item, ele é devolvido).
  3. **Carimbo de saúde:** Cuidadora. Ela carimba com a colher de pau, mas só se Edric prometer comer algo.
  4. **Carimbo de juramento:** o sargento (de brincadeira: "Juro que ele é um péssimo aluno. Carimbado.").
  5. Entregar o formulário ao escrivão.
- **Escolhas e consequências:** nenhuma de peso. Opcional pular: sem o formulário, a placa da caverna cobra uma **taxa extra** (texto; efeito de jogo é só moeda, 06).
- **Recompensa:** 2 itens de cura pequenos + **desconto na taxa de caverna** (valores com o 06).
- **Diálogos ligados:** `txt_npc_escrivao_*`, `txt_npc_ferreiro_*`, `txt_npc_cuidadora_*`, `txt_npc_instrutor_*`.
- **Flags:** `flag_sec_27b_aceita`, `flag_sec_27b_carimbos` (0–3), `flag_sec_27b_ok`.
- **O que muda no mundo depois:** o escrivão pendura o formulário na parede ("Caso resolvido"); depois do sino ele aparece dormindo ao lado dele (detalhe de cena).
- **Nota para o 09 (QA):** a missão **expira** quando a Parte 2 começa; o diário avisa "disponível até a caverna". Não pode travar a principal.
