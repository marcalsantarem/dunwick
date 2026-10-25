# Roteiro de playtest — M1 (protótipo cinza)

> **⚠️ D-024:** controles, sala e bonecos deste roteiro são do esqueleto cinza. **[a atualizar D-024]** para WASD/Shift/Espaço/Q/E/Ctrl, a praça de Baixo Orvalho e os inimigos do protótipo. O formato (≤ 15 min, questionário de sensação, ficha) **[mantém]**. Ver [../impacto_d024.md](../impacto_d024.md).

> **Status:** RASCUNHO v0.1 (BRF-006) · Dono: 09 QA · 2026-10-24
> **Jogador:** o usuário (padrão D-006: usuário + bots). **Duração:** ≤ 15 min.
> **Pergunta do marco:** andar e atacar são gostosos? A câmera incomoda?
> Resultado alimenta o critério **M1-24** de [criterios_marcos.md](../criterios_marcos.md).

## Antes de começar (QA prepara; não conta no tempo)
- Build do M1 aberta no navegador de referência, em tela cheia, **modo debug desligado**.
- Gamepad à mão (se houver), desconectado no início.
- Este arquivo aberto para anotar. Copiar a seção "Ficha de resultado" para `playtest_m1_<nn>.md`.

## Regras para o jogador
- Jogue como quiser dentro de cada bloco; não precisa "acertar".
- Fale em voz alta o que sentir ("lento", "pesado", "gostoso", "não entendi").
- O QA não explica nada além do que está escrito aqui.

## Sessão (14 min)

| Bloco | Tempo | O que fazer | O que o QA observa |
|---|---|---|---|
| 0. Controles | 1 min | Ler a lista de comandos do protótipo (tela ou papel do 03) | Dúvidas sobre comandos |
| 1. Andar | 2 min | Andar e correr pela sala toda, em círculos, em zigue-zague e contra paredes e quinas | Hesitação ao virar; herói preso; reclamação de inércia ou de patinar |
| 2. Câmera | 1 min | Ir aos 4 cantos e parar; andar rápido de um lado ao outro | Herói sai de vista ou fica escondido; enjoo, câmera "atrasada" |
| 3. Atacar | 3 min | Bater no alvo de treino de todos os lados: combo leve, ataque forte, misturar | Golpes que "deviam ter acertado"; combo truncado; impacto fraco |
| 4. Esquivar | 2 min | Esquivar em todas as direções, inclusive no meio de um ataque | Esquiva atrasada ou ignorada; distância estranha |
| 5. Gamepad | 2 min | Conectar o gamepad e repetir 1, 3 e 4 rapidamente (se não houver gamepad, repetir com teclado e marcar "n/a") | Diferença de sensação entre dispositivos |
| 6. Livre | 1 min | Fazer o que quiser | O que o jogador procura fazer sozinho |
| 7. Questionário | 2 min | Responder abaixo | — |

Total: 14 min (folga de 1 min).

## Questionário (notas de 1 a 5)
1 = muito ruim · 3 = aceitável · 5 = ótimo.

| # | Pergunta | Nota | Comentário (1 frase) |
|---|---|---|---|
| Q1 | Andar e correr respondem na hora? | | |
| Q2 | O ataque é gostoso (peso, impacto, ritmo do combo)? | | |
| Q3 | Quando parecia que acertou, acertou? | | |
| Q4 | A esquiva responde e tem a distância certa? | | |
| Q5 | A câmera é confortável (não incomoda, não esconde o herói)? | | |
| Q6 | Os controles são fáceis de aprender? | | |
| Q7 | Teclado ou gamepad: qual foi melhor? Por quê? | — | |
| Q8 | **Aprova seguir para o M2 com esta sensação?** (sim / sim com ajustes / não) | — | |
| Q9 | A 1 coisa que mais incomodou: | — | |
| Q10 | A 1 coisa que mais gostou: | — | |

**Passa (M1-24):** média de Q1–Q6 ≥ 4, nenhuma nota ≤ 2 e Q8 = "sim" ou "sim com ajustes" (ajustes viram itens para o 03 via Produtor; com ajustes = "passa com riscos").

## Complemento com bots
Bots não fazem parte do BRF-006 (dependem da stack). Quando existirem, rodam **antes** da sessão:
- **Teclas aleatórias** 10 min na mesma build → travas, erros no console, estados presos (apoia M1-15f e M1-23).
- **Combate** no alvo de treino nas 8 direções → taxa de acerto (apoia M1-15b).
Os resultados vão na ficha, separados da opinião do jogador.

## Ficha de resultado (copiar para `playtest_m1_<nn>.md`)

```markdown
# Playtest M1 — <nn>
- Data: · Build: · Navegador: · Máquina/monitor: · Dispositivos: teclado / gamepad <modelo>
- Jogador: usuário · Conduzido por: 09 QA · Duração real:

## Notas
Q1: · Q2: · Q3: · Q4: · Q5: · Q6: · Média Q1–Q6:
Q7: · Q8: · Q9: · Q10:

## Observações por bloco (fatos, sem interpretação)
- Bloco 1:
- …

## Achados
| # | Tipo (bug / sensação / sugestão) | Descrição | Evidência | Dono sugerido |
|---|---|---|---|---|

## Bots (se rodaram)
- 

## Resultado M1-24: passa / passa com riscos / não passa
## Não testado:
```
