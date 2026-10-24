# O urso-musgo gigante — id: boss_urso_musgo

> Ficha de chefe (modelo do 02 §6.3). **[FIXO]** usuário · **[PROPOSTA]** 02 · **[ABERTO]** perguntas.
> Nome provisório **Musgoso** [PROPOSTA, pergunta j]; nos textos, `{nome_urso}`. Substitui o ID provisório `boss_guardiao_sino`.

- **Tipo e papel no jogo:** chefe da caverna da graduação [FIXO D-015/D-017]. Obter o sino é a **última tarefa do treinamento**; vários guerreiros já falharam.
- **Papel narrativo:** guardião involuntário e **espelho do herói**: ambos guardam, por motivos errados, o que sobrou de uma aldeia.
- **Conceito:** um urso enorme coberto de musgo e cristais que acumula objetos brilhantes.
- **Aparência [PROPOSTA]:** urso de ombros largos, **musgo grosso no dorso**, **cristais azul-esverdeados** que saem das costas e dos ombros, garras grossas, olhos pequenos e escuros. Cicatrizes antigas (de outros guerreiros). Dorme sobre um monte de objetos brilhantes (talheres, armaduras, moedas, bandeirolas), com o **sino no meio**.
- **Motivação compreensível:** achou o sino brilhante e o sino "canta" para ele; ele o guarda como filhote guarda um brinquedo. Não é mau: protege o que o conforta.
- **Ligação com o herói:** o sino é o da aldeia de Edric; nenhum dos dois sabe.
- **Arena e por que ali:** o **covil**, fim da caverna: câmara redonda com um buraco no teto por onde cai um fio de luz, monte de brilhantes no centro e o sino pendurado numa estalactite quebrada. Imagem forte para 07/10: o fio de luz bate no sino, que devolve um reflexo azul-esverdeado nas paredes.

## Fases da luta × fases da história [PROPOSTA]
| Fase | História | Resumo para 03/06 |
|---|---|---|
| 1 Controle | Defende o território. | Golpes grandes e legíveis (pancada, varrida, investida). Poucos ataques, telegraph longo. |
| 2 Perda de controle | Agarra o sino e a aura sombria do sino o domina. | Cristais lançam estilhaços em arco; ataques mais rápidos, mas telegraph mantido. |
| 3 Verdade | A aura se desprende do urso e o sino o solta. | Ataques frenéticos e imprevisíveis em padrão, mas **o aviso nunca some**; janela de dano maior. Termina na morte do urso (cena). |

## Falas
Não fala. Sons: rugido (entrada), tilintar do sino a cada golpe de fase 2, gemido (fase 3), queda e silêncio (morte). O texto aparece só nas placas do cenário e nas falas de Edric (ver `textos.csv`, `txt_boss_*`).

## Ponto fraco explicado pela história e visível no design
O **sino** pendurado/preso à pata atrapalha a pata dianteira esquerda: o urso a protege e a usa pouco. A região do **ombro esquerdo** (musgo ralo, cristais quebrados por tentativas anteriores) é o ponto vulnerável e brilha após a fase 2.

## Ataque-assinatura e sua história
**Estouro de cristais:** o urso bate no chão e estilhaços azul-esverdeados explodem em arco. História: os cristais crescem onde o sino toca; cada pancada "responde" ao sino.

## Recompensa narrativa
- O **sino** (`item_sino_antigo`, item-chave, não equipável).
- **Lista de nomes** de quem tentou antes, pendurada no covil (lore), e o **círculo de armaduras** como memento.
- Pista: o sino é o da aldeia de Edric (ele reconhece o formato, sem entender).

## Destino do urso [FIXO D-018]
O urso **morre** depois da luta. Cena sóbria e curta, sem gore: ao perder a aura, ele olha para Edric, tenta alcançar o sino, tomba e fica quieto. **Memento:** as armaduras de quem tentou antes cercam o corpo; Edric pode (ação opcional) **pôr as armaduras em círculo** em volta dele (`txt_amb_covil_armaduras*`). Sem humor nessa cena; a Cuidadora e o sargento tratam disso no epílogo.

---

## Background (chefe, ~480 palavras) [PROPOSTA]

**1. Mundo comum.** O urso nasceu numa galeria funda da caverna, longe do sol, e viveu de fungos, peixe cego e tudo que a chuva trazia pelos veios da pedra. Cresceu devagar, como cresce o musgo. Era um bicho solitário, sem inimigos, e tinha uma coleção pequena de coisas que reluziam, trazidas pela água.

**2. Ferida.** Há dez anos, uma carroça de soldados virou numa encosta acima da caverna e despejou carga no fundo de uma fenda. Entre os destroços estava um sino de cobre manchado de fuligem. O urso o achou e o arrastou até o covil. O sino tocou uma vez, baixo, sob a pata. A partir daquele dia o urso nunca mais dormiu longe dele.

**3. Mentira em que acredita.** "O sino é meu e canta para mim." Na verdade o som é o chamado de algo que está dentro do sino, e o urso está sendo mudado por ele, devagar. O musgo cresce mais depressa, os cristais afloram, a pele fica mais dura.

**4. Escolhas.** O urso tornou o covil uma fortaleza. Afugentou cinco bandos de caçadores, dois aprendizes de cavaleiro e um sargento, que saiu mancando. Cada tentativa deixou nele uma cicatriz e no covil uma peça de armadura nova no monte.

**5. Marcas visíveis.** Musgo grosso nas costas, cristais azul-esverdeados nos ombros, cicatrizes de espada, um tilintar constante quando se move perto do sino, o monte brilhante como ninho.

**6. Presente.** Dorme sobre o sino. Quando alguém chega, acorda como um bicho acuado, não como um monstro. O musgo está mais fundo do que nunca, e o sino, mais quente.

**7. Gancho.** A aura sombria do sino domina o urso na luta (fase 2); quando Edric a quebra, o urso volta a ser um bicho e, sem o sino, não sobrevive: a aura era o que o mantinha. A mentira "é meu" se desfaz com ele; o que sobra é um animal que morreu guardando uma coisa bonita e o peso disso para Edric (a vitória não tem festa).

### Notas para arte (10/04/07)
1. Silhueta: ombros largos com cristais em fileira; musgo como textura de pelo.
2. Cores: verde-musgo e pedra cinza, cristais azul-esverdeados (o mesmo azul do sino), olhos sem brilho, **sem magenta** (reservado a perigo).
3. Escala: ocupa ≈ 3×3 tiles no mundo; sprite maior que a célula 64×64 do herói (04 define).
4. Cenário: monte de brilhantes com objetos reconhecíveis (armaduras, talheres, bandeirolas), fio de luz do teto, estalactite quebrada com o sino.
5. Fase 3: a aura se desfaz em fumaça escura que sobe, deixando o urso mais claro. Morte: sem sangue, luz azul-esverdeada se apagando devagar; as armaduras ao redor entram em foco (circulo).

### Notas de combate (03/06)
1. **Telegraph obrigatório** em todos os golpes (D-007); efeitos de cristal e HUD nunca cobrem o aviso.
2. Golpes propostos: **pancada** vertical (círculo no chão), **varrida** de garra (cone), **investida** (retângulo), **estouro de cristais** (arco, fase 2+). Valores no 06.
3. **Postura** (QUEBRADO) conforme D-009; o ponto fraco do ombro esquerdo dá bônus.
4. Sem invocações; arena sem obstáculos grandes (pilares só para cobertura).
5. Chefe de **3 fases**; dica visual de troca (flash ≤ 3/s). A morte é **cena** (sem controle do jogador), curta; o 03 define o corte entre fim de luta e cena.

### Notas de som (05)
1. Tema do chefe: grave e percussivo, com o timbre do sino como **eco** (não como melodia).
2. Passadas pesadas com tilintar metálico dos objetos do monte.
3. Rugido grave e curto (entrada), gemido (fase 3), queda de peso (derrota).
4. Estouro de cristais: vidro grosso batendo em pedra.
5. A cada golpe de fase 2, uma nota do sino fora do tom.
