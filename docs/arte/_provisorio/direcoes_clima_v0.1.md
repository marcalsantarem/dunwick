# Direções de clima visual

> **Status:** **decidido (D-008): A · Lanterna e Musgo como base**, com a masmorra podendo puxar para B e a região aberta de dia para C. Proposta original v0.1 abaixo (BRF-002, D-006). Autor: 10 Diretor de Arte.
> As três direções valem para **qualquer premissa**. Quando o mundo existir, a escolhida vira o roteiro de cor por região (etapa 2). Pode-se misturar: uma direção de base com momentos da outra (ex.: a masmorra puxa para B).
> Todas respeitam o que é fixo: pixel nítido, luz quente contra sombra fria, perigo em magenta, legibilidade em 1 segundo.

## Resumo

| | A · Lanterna e Musgo **(recomendada)** | B · Cinza e Brasa | C · Iluminura |
|---|---|---|---|
| Sensação | acolhedor, vivido, "fim de tarde" | melancólico, frio, solitário | claro, de livro ilustrado, aventureiro |
| Temperatura da luz | quente (sol baixo âmbar ~3000–3500 K), sombras azul-esverdeadas | fria (céu encoberto ~7000 K), ilhas de luz quente (fogo) | neutra a quente (sol alto ~5000 K), sombras azul-claras |
| Contraste | médio-alto, guiado pela luz | alto **localmente** (poças de luz), baixo no geral | médio, uniforme, sombras curtas |
| Saturação | média; picos nas luzes e na vegetação | baixa; cor só no fogo, na magia e no herói | alta, cores limpas |
| Névoa | leve e dourada no fundo | densa, cinza-azulada, encurta a vista | quase nenhuma, céu aberto |
| Pós dominante | bloom suave, tilt-shift médio | névoa, vinheta, volumétrica nas brechas | tilt-shift forte (miniatura), bloom baixo |
| Custo no navegador | médio | médio-alto (névoa + volumétrica) | baixo |
| Risco | ficar "genérico de HD-2D" se não tiver cor-assinatura própria | escuro demais para a leitura de combate; cansa em sessões longas | perder a profundidade do "diorama"; parecer plano |

---

## A · Lanterna e Musgo (recomendada)

**Palavras-chave:** entardecer, musgo, lanterna, pedra úmida, poeira no ar, maquete de mesa, calor humano.
**Anti-palavras:** neon, cromado, sangue, céu azul-cartão-postal, preto puro, glow em tudo.

- **Luz:** sol baixo e lateral (âmbar) que desenha sombras longas; luzes pontuais quentes (lanternas, janelas) começam a acender quando a cena escurece. As sombras puxam para **azul-esverdeado**, não para preto.
- **Cor:** terra, musgo e pedra como base; a vegetação é o verde mais vivo do cenário. A cor-assinatura do herói (etapa 2) deve ser **fria** (ex.: um azul ou um ciano de tecido) para saltar sobre o fundo quente.
- **Atmosfera:** poeira e pólen dourados no ar, névoa leve no fundo, folhas caindo.
- **Cena típica:** uma praça de pedra no fim da tarde, com um muro coberto de musgo e um poço no centro. O sol entra baixo entre os telhados e deixa um retângulo dourado no chão. Uma lanterna acende sobre uma porta. O herói atravessa a faixa de luz e a sombra dele se alonga sobre as pedras. O fundo (colinas, uma torre) se dissolve em desfoque e névoa cor de mel.
- **Por que recomendo:** é a direção em que o diorama rende mais por custo — luz quente com sombra fria dá volume aos sprites e separa planos sem precisar de muito pós. Tem a maior margem de leitura em combate (fundo médio, perigo magenta e herói frio saltam). Ela também **muda bem**: dá para escurecer na masmorra (vira B) ou abrir numa região ensolarada (puxa C) sem trocar de identidade.
- **Como fica nosso, e não cópia:** a referência HD-2D usa muito dourado. A diferença vem do **musgo/verde-azulado nas sombras**, do perigo em magenta e de uma UI de pergaminho escuro (nada de janela azul).

## B · Cinza e Brasa

**Palavras-chave:** inverno, cinza, lã, brasa, respiração no frio, silêncio, vela na janela.
**Anti-palavras:** sol a pino, verde vivo, alegria saturada, cores de doce.

- **Luz:** céu encoberto e difuso, quase sem sombra direcional. A luz forte vem só do **fogo** (tochas, braseiros, magia), que abre poças quentes num mundo frio. É o maior contraste de temperatura das três.
- **Cor:** cinzas azulados e marrons dessaturados; a cor aparece em pouquíssimos lugares (fogo, herói, perigo, itens). Cada cor saturada tem significado.
- **Atmosfera:** névoa densa, neve fina ou cinza no ar, vapor.
- **Cena típica:** uma rua estreita com neve suja pisada. A névoa engole as casas a poucos tiles de distância. Um braseiro abre um círculo laranja no chão onde dois NPCs se aquecem. O herói vem da névoa e só ganha cor ao entrar na luz.
- **Pontos fortes:** atmosfera muito marcante e emotiva; as luzes de efeito brilham muito.
- **Riscos:** névoa e escuro brigam com a regra "perigo nunca escondido" e exigem mais luz de preenchimento em combate. É a mais cara no perfil Baixo, porque sem névoa volumétrica perde muito. Funciona melhor como **clima de uma região** do que do jogo todo.

## C · Iluminura

**Palavras-chave:** manhã, livro ilustrado, estandarte, céu limpo, campo florido, miniatura, tinta.
**Anti-palavras:** lama, escuridão, névoa grossa, cinza, grunge.

- **Luz:** sol alto e branco-quente, sombras curtas e bem definidas em azul-claro. Preenchimento forte do céu; quase nada fica escuro.
- **Cor:** paleta limpa e saturada, com cores "de pigmento" (ocre, verde-folha, vermelho-tijolo, azul-céu). O contorno escuro dos sprites pesa mais no visual.
- **Atmosfera:** pouca névoa; nuvens passando com sombra no chão, borboletas, pétalas.
- **Cena típica:** uma estrada de terra entre campos amarelos e cercas de madeira, num meio-dia limpo. O tilt-shift forte desfoca as bordas e a cena parece uma maquete fotografada de cima. Um moinho gira ao fundo, e as nuvens fazem sombras que correm pelo chão.
- **Pontos fortes:** a mais leve para o navegador e a que fica mais bonita no perfil Baixo; leitura excelente.
- **Riscos:** com pouca sombra e névoa o "diorama" perde profundidade e o jogo pode parecer um 2D comum. Sustenta menos os momentos melancólicos.

---

## Recomendação

**A · Lanterna e Musgo** como base do jogo, com permissão para regiões puxarem para B (masmorra, momentos tristes) ou C (região aberta de dia). Quando a premissa chegar, confirmo ou ajusto antes da etapa 2.

**Para o usuário decidir:** A, B, C ou uma mistura (ex.: "A com masmorra em B").
