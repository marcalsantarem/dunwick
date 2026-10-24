# Missão principal do slice — esboço v2 (BRF-008 + D-015)

> Autor: 02 Roteirista · Base: `biblia_do_mundo.md` (v2), `perguntas_abertas.md`, D-011 a D-016.
> **Fluxo [FIXO, D-015]:** sargento aposentado treina → graduação (monstro no covil) → vila dorme → região aberta até a feira → Ysolt confessa que não tem poder → Grace se prontifica → voltam à vila e curam: **fim do slice**.
> Esboço sem diálogos completos. Onde a cena depende de uma pergunta aberta, segue a opção **recomendada** e vem marcada **[ABERTO letra]**.
> Cabe em: 1 vila (`map_baixo_orvalho`), 1 região (`map_estrada_feira`), 1 masmorra (`map_caverna_graduacao`), 1 chefe. Notas de câmera/luz são para 07/10; notas de jogo para 03/06.

---

## Visão geral

| Parte | ID | Local | Em uma frase (aparece no diário) |
|---|---|---|---|
| 1 Graduação | `quest_graduacao` | Baixo Orvalho → caverna | "Traga o sino do covil: a última tarefa do treinamento." |
| 2 O sono | `quest_sino_maldito` | Baixo Orvalho | "Algo deu errado. Todos dormem. Procure alguém que possa curar." |
| 3 Rumo à cura | `quest_rumo_cura` | Estrada → feira → vila | "Encontre quem possa acordar a vila e traga de volta." |

Tipo: **principal** (as 3 partes). Missões secundárias (2–4) ficam fora deste esboço: penduram-se nos NPCs da vila **antes** do sino (Parte 1) e nos viajantes da estrada.

---

## Parte 1 — Graduação (`quest_graduacao`)

### Cena 1.1 — Baixo Orvalho, manhã (tutorial)
- **Quem:** Edric, o sargento aposentado (`npc_instrutor`), a Cuidadora (`npc_cuidadora`), moradores.
- **O que acontece:** o sargento passa os fundamentos (mover, atacar, esquivar) com humor de regulamento. Explica a **última tarefa do treinamento**: pegar o sino no covil, tida como muito difícil, outros já falharam. A Cuidadora insiste em alimentá-lo e dá um **item de cura**. O quadro de avisos mostra editais e a **taxa de caverna**.
- **Mostrar, não explicar:** o recibo de taxa no cinto; o coxear do sargento (ele já tentou; [PROPOSTA]).
- **Nota de jogo:** tutorial de combate e esquiva; primeiro uso do inventário. Flag `flag_graduacao_aceita`.
- **Nota de câmera/luz:** manhã de névoa baixa; a câmera se afasta devagar quando Edric sai pelo portão (cena curta, 3 s).

### Cena 1.2 — Caminho até a caverna
- **O que acontece:** trecho curto fora da vila; fita de interdição e placa com a taxa de acesso. Lista pregada de nomes dos que tentaram antes, cada um com carimbo de "reprovado" (humor).
- **Nota de jogo:** primeiros inimigos da fauna da caverna.

### Cena 1.3 — Caverna (masmorra)
- **Estrutura [PROPOSTA]:** corredor de entrada → sala de combate → bifurcação com atalho → sala de pista → covil. Atmosfera **B · Cinza e Brasa**; luz azul-esverdeada ao fundo.
- **Narrativa ambiental (5 detalhes, viram props para o 07):** (1) armaduras abandonadas por quem desistiu; (2) bandeira de graduação rasgada; (3) marcas de garra e arrasto no chão até o covil; (4) um acampamento abandonado às pressas, lanterna ainda acesa; (5) tilintar distante e regular de um sino, cada vez mais perto.
- **Nota de som:** o tilintar é o leitmotiv do sino (05).

### Cena 1.4 — Chefe (`boss_guardiao_sino`) [ABERTO p]
- **Entrada:** o monstro dorme sobre seu tesouro, com o sino no meio; acorda quando Edric se aproxima.
- **Fases (conceito):** 1 território (defende o covil) → 2 posse (agarra o sino, fica furioso) → 3 verdade (o sino o corrompe; ele o larga) [ABERTO r].
- **Derrota:** o monstro cai e o sino fica no chão, ainda zumbindo. Edric o recolhe como prova da graduação.
- **Nota de jogo:** chefe com 3 fases (06/03 detalham); recompensa = **`item_sino_antigo`** (item-chave, não equipável); flag `flag_sino_recolhido`.
- **Nota de câmera:** zoom curto no sino, a luz verde-azulada dura um instante a mais, a câmara escurece um tom (primeira pista de que algo está errado).

**Fecha a Parte 1:** diário passa para a Parte 2.

---

## Parte 2 — O sono (`quest_sino_maldito`)

### Cena 2.1 — Volta a Baixo Orvalho (entardecer)
- **O que acontece:** a vila se junta na praça (Lanterna e Musgo: lanternas acendem). O sargento registra a graduação com carimbo e taxa. A tradição manda **tocar o objeto de prova** para registro. Edric ergue o sino [PROPOSTA, liga a prova ao "uso na vila", D-015].
- **Nota de câmera:** plano amplo da praça; a câmera sobe ao erguer o sino.

### Cena 2.2 — O sino toca
- **O que acontece:** o sino toca uma vez. As lanternas piscam. **Um a um, todos adormecem**: o sargento, os moradores, a Cuidadora (que diz a fala "É só um sino" antes de cair). Edric **não adormece**: sente um calor na **marca** [ABERTO n] e vê a vila toda cair.
- **Mostrar, não explicar:** a colher de pau cai no chão sem som; o silêncio toma o lugar do barulho.
- **Nota de jogo:** cena curta, sem combate; flag `flag_vila_dorme`. Sem timer.
- **Nota de som:** o timbre do sino abafa todos os sons de vila ao ecoar.

### Cena 2.3 — A vila adormecida
- **O que acontece:** Edric percorre a praça: ninguém acorda (tentativas cômicas de acordar; ronco, murmúrios, uma taverna cheia de gente dormindo sobre as canecas). A Cuidadora era a curandeira; **não há mais ninguém para curar** [FIXO: procura uma curandeira]. No quadro de avisos, o **cartaz de Ysolt Brum**, que promete curar maldições (humor: letras miúdas).
- **Escolha pequena [PROPOSTA]:** Edric pode examinar 2–3 adormecidos (informação sobre a estrada, itens de cura). Não trava a missão.
- **Gancho emocional:** Edric **adia** a vingança e a ida para cavaleiro. Fala de exemplo (Tom 2): "Primeiro ela, depois a Coroa. A Coroa que espere na fila, ela adora fila."
- **Urgência [ABERTO q]:** quanto tempo a vila pode dormir; o 06 decide se há indicador visual, sem timer de jogo.

**Fecha a Parte 2:** o portão da vila se abre para a região aberta.

---

## Parte 3 — Rumo à cura (`quest_rumo_cura`)

### Cena 3.1 — A estrada
- **O que acontece:** Edric atravessa a região aberta (atmosfera **C · Iluminura**). **Gente da estrada** (saqueadores arruinados por taxas, que também são vítimas) e fauna. **Cartazes de Ysolt** a cada trecho, com propaganda e cláusulas em letras miúdas.
- **Narrativa ambiental (5 detalhes):** (1) pedágio vazio com cancela quebrada; (2) carroça de recolhimento de tributo tombada; (3) edital assinado por Oswin Cathe colado em árvore; (4) acampamento de famílias que fugiram de tributo; (5) espantalho com selo da Coroa no peito.
- **Escolha pequena:** ajudar ou ignorar um viajante endividado [PROPOSTA]. Efeito: pequena recompensa/informação; não altera o final.
- **Nota de jogo:** exploração aberta com 2–3 áreas de combate; atalho opcional.

### Cena 3.2 — A feira de Ysolt: a confissão
- **O que acontece:** entardecer, lanternas coloridas, letreiro "CURAS GARANTIDAS (CONSULTE AS EXCLUSÕES)". Edric descreve a maldição; Ysolt tenta vender o "pacote anti-eco", o teatro dela desmorona e ela **confessa que não tem poder real** [FIXO]. Ela aponta **Grace**, a aprendiz, que "tem mão boa com ervas".
- **Nota de câmera/luz:** a feira em tons quentes; ao confessar, a luz esfria e a câmera se aproxima de Ysolt.
- **Nota de jogo:** cena de diálogo, sem combate; flag `flag_ysolt_confessou`.

### Cena 3.3 — Grace se prontifica
- **O que acontece:** Grace, nervosa, diz que é só aprendiz de curandeira, mas se prontifica a ajudar. Reconhece o som do sino ("esse zumbido não é normal") e sai da feira com Edric.
- **Mostrar, não explicar:** Grace segura o sino por um instante e ele silencia; só então ela percebe o que fez [PROPOSTA; depende de o].
- **Nota de jogo:** companheira **em cena e diálogo, sem lutar**, anda ao lado de Edric no caminho de volta (D-012). Flag `flag_grace_no_grupo`.

### Cena 3.4 — A cura em Baixo Orvalho: fim do slice [ABERTO o]
- **O que acontece:** Edric e Grace voltam à vila adormecida. Grace cura **os adormecidos**, um a um ou todos de uma vez [ABERTO o: como o jogador vive a cura]. A Cuidadora acorda primeiro. O sargento acorda reclamando de perder a refeição.
- **Mostrar, não explicar:** a primeira lanterna que volta a acender; a colher de pau se mexendo.
- **O que NÃO se revela:** a natureza do sino (corrompido ou protetor) e o significado da marca. O sino fica **mudo** [ABERTO r]; Grace sente que ele "ainda pensa".
- **Nota de câmera/luz:** a vila volta à vida em círculos, da casa da Cuidadora para fora; plano largo ao entardecer; a câmera sobe até a vila inteira acordada.
- **Fim do slice:** tela de encerramento "continua" (texto a definir com o Produtor).

---

## Gancho para depois do slice
1. O sino ainda é um mistério: corrompido ou protetor de um mal antigo (nome e natureza abertos).
2. A **marca** de Edric: o que o torna "diferente"/"o escolhido" (nunca explicar no slice).
3. Edric ainda crê que o rei mandou queimar a aldeia; a verdade (Oswin, com o selo) aparece depois, e o rei Ondric, lúcido e arrependido, é a chave.
4. Grace passa a ser o primeiro membro do grupo (cura/apoio); Ysolt volta como aliada relutante ou rival.
5. Oswin não tem ligação com o sino, mas vai perseguir quem desafia a Coroa.

## Marcadores de estado (flags) do slice
`flag_graduacao_aceita` · `flag_sino_recolhido` · `flag_vila_dorme` · `flag_ysolt_confessou` · `flag_grace_no_grupo` · `flag_vila_curada`.

## Pontos para o 09 (QA): a missão não deve travar
- Ordem livre de examinar adormecidos na Parte 2 e das escolhas da estrada.
- Sair da caverna antes do chefe e voltar mantém o estado.
- Voltar à vila durante a Parte 3 mantém `flag_vila_dorme` e permite comprar curas (se houver comerciante; [ABERTO q]).
- A cura só dispara com `flag_grace_no_grupo` e dentro de Baixo Orvalho.

## Dependências abertas (resumo)
n (marca) · o (cura) · p (monstro) · q (urgência) · r (sino) · s (classe de Grace) · j (nomes). Respostas em `perguntas_abertas.md`.
