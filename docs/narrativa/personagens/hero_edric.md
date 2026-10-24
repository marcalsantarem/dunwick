# Edric Moss — id: hero_edric

> Ficha completa (modelo do 02 §6). Legenda: **[FIXO]** decidido pelo usuário · **[PROPOSTA]** preenchimento do 02, sujeito a aprovação · **[ABERTO]** em `perguntas_abertas.md`.
> Textos de jogo deste personagem: `textos.csv` (IDs `txt_cena01_edric_*` a `txt_cena09_edric_*`, `txt_barks_edric_*`).

- **Tipo e papel no jogo:** herói jogável [FIXO]. **Papel na história:** órfão do saque que traz o sino para a vila sem querer e, por isso, é o único que pode (e quer) consertar [FIXO].
- **Conceito em 1 frase:** o pior aluno da turma que chega vivo ao fim de todas as provas.
- **Idade:** 18 anos; 8 no saque (D-015) [FIXO].

## Aparência para o artista (04/10) [PROPOSTA]
- **Silhueta:** compacta, cabeça grande, ombros estreitos; lê-se de longe pelo **contorno de uma ombreira só**.
- **Roupa:** gibão de treino remendado verde-musgo, ombreira de couro só no ombro direito, calça marrom, botas gastas; **faixa de linho clara no antebraço esquerdo**, que cobre a marca.
- **Cores:** verde-musgo (gibão), marrom-couro, linho claro (faixa), toque de latão (fivelas). Sem magenta (reservado a perigo, D-007).
- **Objeto-assinatura:** o **recibo de taxa dobrado preso ao cinto** (humor); espada de treino de ponta cega que vira espada de verdade depois da graduação.
- **A marca [FIXO que existe; forma FIXO]:** **desenho de sino no antebraço esquerdo**, que **esquenta e brilha quando o sino toca**. Normalmente escondida pela faixa; a faixa se afrouxa quando a marca esquenta. Cor do brilho: **azul-esverdeado** (a mesma luz do sino).

## Personalidade
- **Traços:** seco, teimoso, leal. **Contradição:** ri de tudo, mas guarda um rancor que nunca ri.

## Voz
- Frases curtas, autoironia, burocracia citada de cabeça; piora quando o assunto é a aldeia.
- **Falas (Tom 2):**
  1. "Tirei nota mínima em esquiva. Mas em chegar vivo ao fim da prova, nota dez."
  2. "A taxa de formatura cobrou até a taxa de cobrança. Aí já é arte."
  3. "Todo mundo dormiu menos eu. Primeira vez que ninguém me manda calar."

## Desejo · Necessidade · Medo · Segredo · Falha
- **Desejo:** virar cavaleiro e vingar a aldeia. **Necessidade:** aprender que cuidar de quem está vivo pesa mais que acertar contas. **Medo:** perder de novo quem o acolheu. **Segredo:** não sabe o que é a marca nem por que o sino não o derruba [PROPOSTA]. **Falha:** vai direto ao alvo sem ver o custo; culpa o **rei** por algo que o chanceler ordenou.

## Estilo de combate / habilidades (para 03 e 06)
- Combate de espada e escudo curto, corpo a corpo, **esquiva como ferramenta principal** (pilar 1). Ver `docs/gameplay.md` e `docs/sistemas/formulas.md`.
- O arco **não** dá habilidade nova no slice. Depois do slice a evolução do arco (cuidar × vingar) vira habilidade (pedido para 06).

## Relações
- **Cuidadora (npc_cuidadora):** quase mãe; ele a trata com ironia para não dizer "obrigado".
- **Sargento (npc_instrutor):** mestre que ele finge desprezar.
- **Grace:** primeira companheira; contraste (ele calado, ela tagarela).
- **Ysolt:** achou uma charlatã onde esperava uma salvadora.
- **Rei (Ondric) e Oswin:** alvos da vingança; o alvo certo é outro (Edric ainda não sabe).

## Arco em 3 marcos [PROPOSTA]
1. **Início:** quer virar cavaleiro para chegar ao rei.
2. **Virada:** a vila dorme por culpa do sino que ele trouxe; deixa a vingança para depois.
3. **Fim do slice:** acordar a vila deixa claro que ele pode cuidar de gente; a vingança continua, mas não é mais o centro.

## Ganchos jogáveis
- A **marca** vira sinal visual e, no futuro, mecânica (**não no slice**).
- O **sino** vira item-chave (`item_sino_antigo`) e depois "sino limpo" (`item_sino_limpo`).
- O **recibo** no cinto pode virar item de lore (pista do saque).

---

## Background (7 blocos) [PROPOSTA, ~520 palavras]

**1. Mundo comum.** Vale Seco era uma aldeia de lavradores na beira do reino, onde o pai de Edric consertava telhados e a mãe fazia pão. O menino chorava pouco, falava pouco e achava a rotina boa. O reino de Mor-Allen não passava de um cartaz na porta da igreja: cobrava tributo, e o tributo sempre era pago, com atraso ou sem.

**2. Ferida.** No oitavo ano de vida de Edric, a colheita falhou. A aldeia pediu prazo; o prazo veio carimbado como "indeferido". Soldados chegaram com um selo do rei e uma ordem que ninguém na aldeia pôde ler. A aldeia foi saqueada e queimada em uma noite. Os pais de Edric o esconderam num poço seco e não voltaram. Ele ouviu tudo de lá: gritos, o fogo, o sino da aldeia sendo arrancado do pórtico e levado numa carroça que virou no caminho. Esperou até o silêncio.

**3. Mentira em que acredita.** "Foi o rei." O selo que viu era do rei; foi isso que o menino guardou. Ele acredita que, se chegar a cavaleiro, chega ao rei, e que matar o rei apaga a ferida.

**4. Escolhas.** Foi achado na estrada por uma curandeira que colhia ervas, Dona Brisolda [PROPOSTA nome]. Ela o levou para Baixo Orvalho, criou-o, lhe deu comida demais e conselhos de menos. Aos 12 anos pediu para treinar com o sargento aposentado da Guarda. Escolheu a Guarda para chegar perto da Coroa. A cada ano a sorte dele foi melhorando por azar: sobreviveu a provas em que colegas se machucaram.

**5. Marcas visíveis.** Gibão remendado, ombreira só de um lado, recibo de taxa preso ao cinto (o último papel que o pai assinou, que ele não sabe ler direito), faixa no antebraço esquerdo escondendo a **marca de sino** que ele tem desde que se lembra. A Cuidadora sempre pediu que ele a mantivesse coberta.

**6. Presente.** Dia da última tarefa: pegar o sino que um urso-musgo guarda na caverna. É o fim do treinamento; depois, a formatura e a Guarda. Ele não sabe que o sino é o da aldeia dele.

**7. Gancho.** O sino toca e todos dormem, menos ele. A mentira "foi o rei" vai se quebrar quando ele descobrir quem assinou a ordem. A marca vai se explicar; o slice não conta.

### Notas
- **Arte (10/04/07):** (1) ombreira só do ombro direito é a leitura de silhueta; (2) faixa clara no antebraço esquerdo como ponto de brilho da marca; (3) postura ligeiramente curvada, sempre alerta; (4) paleta verde-musgo e marrom, sem magenta; (5) o recibo pendurado balança na corrida (detalhe de animação secundária).
- **Combate (03/06):** esquiva como principal defesa; golpes curtos; sem habilidade de mago; estilo "escudo curto + espada de treino". Fraqueza sistêmica: pouco alcance.
- **Som (05):** passos de bota em terra e pedra; respiração curta; quando a marca esquenta, um zumbido grave bem baixo que acompanha o timbre do sino; sem voz falada (texto).
