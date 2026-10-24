# Missão principal do slice — esboço (BRF-008)

> Autor: 02 Roteirista · Base: `biblia_do_mundo.md`, `perguntas_abertas.md`, D-011 a D-014, D-012.
> Esboço em 3 partes; **sem diálogos completos** (fora de escopo). Onde a cena depende de uma pergunta aberta, a cena segue a opção **recomendada** e vem marcada **[ABERTO letra]**.
> Cabe em: 1 vila (`map_baixo_orvalho`), 1 região aberta (`map_estrada_feira`), 1 masmorra (`map_caverna_graduacao`), 1 chefe. Fim do slice na feira.
> Notas de câmera/luz são para 07/10; notas de jogo para 03/06.

---

## Visão geral

| Parte | ID | Local | Em uma frase (aparece no diário) |
|---|---|---|---|
| 1 Graduação | `quest_graduacao` | Baixo Orvalho → caverna | "Complete a prova de graduação na caverna e traga a prova." |
| 2 Maldição | `quest_sino_maldito` | Baixo Orvalho | "Algo deu errado. Descubra como ajudar a cuidadora." |
| 3 Rumo à feiticeira | `quest_rumo_ysolt` | Região aberta → feira | "Encontre Ysolt Brum, a feiticeira que dizem curar maldições." |

Tipo: **principal** (as 3 partes). Missões secundárias (2–4) ficam fora deste esboço; os NPCs de cada lugar abaixo são os pontos onde elas se penduram.

---

## Parte 1 — Graduação (`quest_graduacao`)

### Cena 1.1 — Baixo Orvalho, manhã (tutorial)
- **Quem:** Edric, o instrutor `npc_instrutor` [ABERTO b], a Cuidadora (`npc_cuidadora`), moradores.
- **O que acontece:** o instrutor passa os fundamentos (mover, atacar, esquivar) com humor de regulamento e entrega a **ficha de graduação**; a Cuidadora insiste em alimentá-lo e dá um **item de cura**. O quadro de avisos mostra editais e a **taxa de caverna** (humor).
- **Mostrar, não explicar:** o recibo de taxa preso no cinto; a Cuidadora ajeita o gibão de Edric.
- **Nota de jogo:** tutorial de combate e esquiva; flag `flag_graduacao_aceita`. Primeiro uso do inventário (item de cura).
- **Nota de câmera/luz:** manhã de névoa baixa; câmera se afasta devagar quando Edric sai pelo portão (cena curta, 3 s).

### Cena 1.2 — Caminho até a caverna
- **O que acontece:** trecho curto fora da vila; **fita de interdição** da Coroa e a placa de **taxa de acesso** na entrada [humor]. Dica de que a caverna foi **trocada em cima da hora** [ABERTO a = B, recomendada].
- **Nota de jogo:** primeiros inimigos da fauna da caverna.

### Cena 1.3 — Caverna (masmorra)
- **Estrutura [PROPOSTA]:** corredor de entrada → sala de combate → bifurcação com atalho → sala de pista → câmara do chefe. Atmosfera **B · Cinza e Brasa**; luz azul-esverdeada no fundo.
- **Narrativa ambiental (5 detalhes, viram props para o 07):** (1) caixotes com selo de fiscalização da Coroa, lacrados; (2) um acampamento abandonado às pressas; (3) marcas de arrasto de algo pesado até a câmara; (4) um recibo rasgado de "taxa de urgência"; (5) uma lanterna ainda acesa, de ninguém.
- **Pista final [ABERTO a]:** um **bilhete** com carimbo da chancelaria deixado na sala antes do chefe (recomendada B: liga ao Oswin sem nomeá-lo; Edric lê com humor e ignora).

### Cena 1.4 — Chefe (`boss_guardiao_sino`) [ABERTO a]
- **Entrada:** o chefe cobra uma taxa de invasão (humor de burocracia); o **sino** pende no fundo da câmara, verde-azulado.
- **Fases da luta × história (conceito):** 1 controle (usa regras e procedimentos) → 2 perda de controle (o sino o domina) → 3 verdade (confessa que só o guardava).
- **Derrota:** o chefe cai e o sino é recolhido. **Edric pega o sino como prova de graduação.**
- **Nota de jogo:** chefe com 3 fases (06/03 detalham); recompensa = **item do sino** (`item_sino_antigo`, item-chave, não equipável) e flag `flag_sino_recolhido`.
- **Nota de câmera:** zoom curto ao quebrar a corrente do sino, sino brilha mais forte e a câmara escurece um tom (primeira pista de que algo está errado).

**Fecha a Parte 1:** diário atualiza para a Parte 2.

---

## Parte 2 — Maldição (`quest_sino_maldito`)

### Cena 2.1 — Volta a Baixo Orvalho (entardecer)
- **O que acontece:** a vila se junta na praça (luz Lanterna e Musgo: lanternas acendem). O instrutor registra a graduação com carimbo e taxa. A **tradição manda tocar o objeto de prova** (para registro). Edric pega o sino [PROPOSTA, liga a prova ao "uso na vila", D-013].
- **Nota de câmera:** plano amplo da praça; a câmera sobe levemente ao erguer o sino.

### Cena 2.2 — O sino toca
- **O que acontece:** o sino toca uma vez. A cuidadora é atingida [ABERTO f, g: recomendado: ela empurra Edric e leva o golpe; a manifestação é bronze lento, começando pelas mãos]. As lanternas piscam, o orvalho congela por um instante, a vila silencia.
- **Mostrar, não explicar:** a colher de pau dela cai no chão com um som de metal.
- **Nota de jogo:** cutscene curta sem combate; flag `flag_cuidadora_amaldicoada`. Sem timer (a manifestação é indicador narrativo, não contagem regressiva).
- **Nota de som:** o timbre do sino é motivo recorrente (05); todos os sons de vila abafam ao ecoar.

### Cena 2.3 — A vila sem saída
- **O que acontece:** a Cuidadora é a **única curandeira**; sem ela, ninguém sabe o que fazer. Moradores sugerem soluções absurdas (formulários, taxas de "consulta de maldição", pedir parecer ao distrito). O instrutor [ABERTO b] aponta o **cartaz de Ysolt Brum** no quadro de avisos, que promete curar maldições (humor: com ressalvas em letras miúdas).
- **Escolha pequena [PROPOSTA]:** Edric pode falar com 2–3 moradores antes de ir (informação sobre a estrada e uma dica de combate). Não trava a missão.
- **Gancho emocional:** Edric **adia** a vingança e a ida para cavaleiro. Fala de exemplo [Tom 2]: "Primeiro ela, depois a Coroa. A Coroa que espere na fila, ela adora fila."
- **Nota de jogo:** itens de cura disponíveis para compra; flag `flag_rumo_ysolt_aceito`.

**Fecha a Parte 2:** o portão da vila se abre para a região aberta.

---

## Parte 3 — Rumo à feiticeira (`quest_rumo_ysolt`)

### Cena 3.1 — A estrada
- **O que acontece:** Edric atravessa a região aberta (atmosfera **C · Iluminura** de dia). **Gente da estrada** (saqueadores arruinados por taxas, que também são vítimas) e fauna. **Cartazes de Ysolt** a cada trecho, com propaganda e cláusulas em letras miúdas.
- **Narrativa ambiental (5 detalhes):** (1) pedágio vazio, cancela quebrada; (2) carroça de recolhimento de tributo tombada; (3) um edital assinado por Oswin Cathe colado em árvore; (4) um acampamento de famílias que fugiram de uma vila vizinha; (5) um espantalho com selo da Coroa pregado no peito.
- **Escolha pequena:** ajudar ou ignorar um viajante endividado [PROPOSTA]. Efeito: pequena recompensa/informação sobre a feira; não altera o final.
- **Nota de jogo:** exploração aberta com 2–3 áreas de combate; atalho opcional.

### Cena 3.2 — A feira de Ysolt (cena final do slice) [ABERTO e = A]
- **O que acontece:** entardecer, lanternas coloridas, letreiro **"CURAS GARANTIDAS (CONSULTE AS EXCLUSÕES)"**. Edric descreve a maldição; Ysolt vende um "pacote anti-eco"; a "cura" falha. **Grace**, nervosa, entra em cena e usa o poder verdadeiro [ABERTO l: recomendada B, som/ressonância] ao ver o sino. Ela o reconhece, diz que sabe o que ele é e que pode ajudar, **se ele a levar para fora dali**. Ysolt tenta impedir; a cena termina com Grace saindo da feira ao lado de Edric.
- **Mostrar, não explicar:** Grace segura o sino sem querer e ele silencia por um instante; só então ela percebe o que fez.
- **Nota de câmera/luz:** a feira em tons quentes; ao falhar a cura, a luz esfria e a câmera se aproxima de Grace. Fecha com plano largo dos dois saindo pela estrada.
- **Nota de jogo:** **cena e diálogo, sem combate** (D-012); Grace anda ao lado de Edric no trecho final, sem lutar nem habilidades. Flag `flag_grace_no_grupo`.
- **Fim do slice:** tela de encerramento "continua" (texto a definir com o Produtor).

---

## Gancho para depois do slice
1. Grace sabe o que o sino é e que o mal por trás dele é maior que a maldição de uma vila.
2. A cuidadora segue como estátua de bronze em Baixo Orvalho, com um prazo narrativo [ABERTO f].
3. Oswin sabe que o sino se moveu (carimbo na caverna) e passa a perseguir Edric por papel: pedidos de prisão, taxas de captura, fiscais.
4. Ysolt, exposta, tem acesso a dados que valem dinheiro. Volta como aliada relutante ou rival.
5. O recibo da aldeia no cinto de Edric tem uma pista sobre quem mandou queimá-la [ABERTO c].

## Marcadores de estado (flags) do slice
`flag_graduacao_aceita` · `flag_sino_recolhido` · `flag_cuidadora_amaldicoada` · `flag_rumo_ysolt_aceito` · `flag_grace_no_grupo`.

## Pontos para o 09 (QA): a missão não deve travar
- Ordem livre de falar com moradores da Parte 2 e das escolhas da estrada.
- Sair da caverna antes do chefe e voltar mantém o estado.
- Voltar à vila durante a Parte 3 mantém `flag_cuidadora_amaldicoada` e permite comprar curas.

## Dependências abertas (resumo)
a (chefe e pista) · b (instrutor) · e (final com Ysolt) · f/g (maldição) · l (poder de Grace). Respostas em `perguntas_abertas.md`.
