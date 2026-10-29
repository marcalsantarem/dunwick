# Combate de ação em tempo real: arquivo (D-028)

> Em 2026-10-26 o usuário decidiu seguir com **combate por turnos**. Tudo o que já havia sido projetado para o **combate de ação em tempo real (isométrico, estilo Diablo)** está guardado aqui e na **tag `combate-acao-v1`** do git, para poder ser retomado depois (modo de ação futuro, seções do jogo em ação ou modo híbrido).

## O que está preservado
| Arquivo | O que é |
|---|---|
| `gameplay_acao_v0.3.md` | Jogabilidade de ação: movimento isométrico, mira no cursor, entrada à Diablo (clique para mover e atacar), esquiva, fôlego, combo, golpe forte, 3 habilidades, aviso magenta (telegraph), câmera, oclusão, máquina de estados, caixas, pipeline de dano |
| `formulas_acao.md` | Fórmulas e exemplos resolvidos (atributos, mana, fôlego, esquiva, postura, estados), parte reaproveitável em turnos |
| `bestiario_slice_acao.md` | Os 5 inimigos comuns com contra-jogo de ação |
| `criterios_marcos_acao.md` | Critérios de teste do M1 de ação |

Também ficam no histórico do git (tag `combate-acao-v1`): o esqueleto isométrico com clique para mover e atacar, os briefings BRF-003/BRF-010, as decisões D-007 a D-010, D-019, D-023 e as medições de desempenho.

## O que continua valendo no jogo por turnos (reaproveitável)
Atributos, mana, tipos de dano, resistências, estados, fórmulas de dano, habilidades por ID, inimigos e chefe (vida, resistências, fases), itens, XP, a história e os nomes, a direção de arte, o mundo isométrico de exploração e o esqueleto técnico (renderização, câmera, dados, testes).

## O que fica específico do modo de ação
Tempo real a 60 Hz, aviso de golpe em quadros, esquiva com invencibilidade, fôlego por segundo, mira no cursor, hitboxes e hurtboxes, oclusão do aviso, A* do clique, estados CENA e movimento livre em combate.
