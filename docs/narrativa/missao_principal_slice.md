# Missão principal do slice — esboço v4 (BRF-008 + D-015 a D-018)

> Autor: 02 Roteirista · Base: `biblia_do_mundo.md` (v3), `perguntas_abertas.md`, `textos.csv`, D-011 a D-017.
> **Fluxo [FIXO, D-015/D-017]:** sargento aposentado treina → graduação (urso-musgo) → o sino toca e a vila dorme → Edric acha o **feitiço branco** nos livros da Cuidadora → estrada até a feira → Ysolt confessa que não pode → **Grace abençoa e limpa o sino** → voltam e o **sino limpo** soa na praça: a aura sombria some e todos acordam (cena) → **epílogo livre na vila acordada** (D-018) → fim do slice.
> Onde a cena depende de uma pergunta aberta, segue a opção **recomendada** e vem marcada **[ABERTO letra]**.
> Cabe em: 1 vila (`map_baixo_orvalho`), 1 região (`map_estrada_feira`), 1 masmorra (`map_caverna_graduacao`), 1 chefe, 5 missões (1 principal + 4 secundárias, D-018). Notas de câmera/luz para 07/10; de jogo para 03/06. IDs de texto em `textos.csv`.

---

## Visão geral

| Parte | ID | Local | Em uma frase (diário) |
|---|---|---|---|
| 1 Graduação | `quest_graduacao` | Baixo Orvalho → caverna | "A Última Tarefa" |
| 2 O sono | `quest_sono` (texto: "O Sono do Sino") | Baixo Orvalho | "Procure uma pista na casa de {nome_cuidadora}." |
| 3 Mãos limpas | `quest_cura` (texto: "Mãos Limpas") | Estrada → feira → vila | "Siga a estrada até a Feira da Ysolt." |

IDs de missão: `quest_graduacao`, `quest_sono`, `quest_cura` (renomeados da v2 para casar com os textos). Secundárias em `missoes/`: `quest_sec_formulario_27b` (vila), `quest_sec_receita_zefa` (vila), `quest_sec_viajante_endividado` (estrada), `quest_sec_letras_miudas` (feira).

---

## Parte 1 — Graduação (`quest_graduacao`)

### Cena 1.1 — Baixo Orvalho, manhã (tutorial)
- **Quem:** Edric, o sargento (`npc_instrutor`), a Cuidadora (`npc_cuidadora`), o escrivão (`npc_escrivao`), o ferreiro, a taverneira.
- **O que acontece:** o sargento passa os fundamentos (mover, atacar, esquivar, golpe forte) com humor de regulamento (`txt_tut_*`, `txt_cena01_*`) e entrega a **Última Tarefa**: o sino do covil. A Cuidadora dá a **Poção de Ervas**.
- **Aberturas das secundárias da vila:** escrivão (`quest_sec_formulario_27b`) e taverneira (`quest_sec_receita_zefa`). Elas **não expiram**: podem ser terminadas no epílogo (D-018).
- **Mostrar, não explicar:** o recibo de taxa no cinto; o coxear do sargento; a faixa no antebraço de Edric.
- **Nota de jogo:** tutorial; primeiro uso do inventário. Flag `flag_graduacao_aceita`.
- **Nota de câmera/luz:** manhã de névoa baixa; a câmera se afasta devagar quando Edric sai pelo portão (3 s).

### Cena 1.2 — Caminho até a caverna
- **O que acontece:** trecho curto; fita de interdição e placa de taxa (`txt_amb_caverna_placa*`, `txt_amb_caverna_fita`); lista dos reprovados (`txt_amb_caverna_lista`). Sem o Formulário 27-B, a placa cobra taxa em dobro.

### Cena 1.3 — Caverna (masmorra)
- **Estrutura [PROPOSTA]:** corredor de entrada → sala de combate → bifurcação com atalho → sala de pista → covil. Atmosfera **B · Cinza e Brasa**; luz azul-esverdeada ao fundo.
- **Narrativa ambiental (props para o 07):** armaduras abandonadas, bandeira de graduação rasgada, marcas de garra, acampamento abandonado com lanterna acesa, tilintar do sino cada vez mais perto (`txt_amb_caverna_*`).
- **Nota de som:** o tilintar é o leitmotiv do sino (`mus_motivo_sino`).

### Cena 1.4 — Chefe: o urso-musgo (`boss_urso_musgo`) [FIXO D-017]
- **Entrada:** o urso dorme sobre o monte de objetos brilhantes, o sino no meio, um fio de luz do teto. Ele acorda como bicho acuado.
- **Fases:** 1 território → 2 posse (agarra o sino, cristais) → 3 verdade (a aura se desprende e ele solta o sino). Detalhes em `personagens/boss_urso_musgo.md`.
- **Pista da marca [FIXO D-017]:** ao chegar perto do sino, a **marca esquenta** no antebraço (`txt_ui_aviso_marca`, `sfx_marca_esquenta`).
- **Derrota [FIXO D-018]:** o urso **morre**, em cena sóbria e curta, sem gore. As armaduras de quem tentou antes cercam o corpo como **memento**; Edric pode (ação opcional) pô-las em círculo (`txt_amb_covil_armaduras*`). Edric pega o sino e reconhece o formato sem entender (`txt_cena03_edric_05` a `_09`). **Sem humor nesta cena** (D-011: sombrio sem ser gratuito).
- **Nota de jogo:** chefe com 3 fases; recompensa = `item_sino_antigo`, flag `flag_sino_recolhido`.
- **Nota de câmera:** zoom curto no sino, a luz azul-esverdeada dura um instante a mais.

**Fecha a Parte 1:** diário passa para a Parte 2.

---

## Parte 2 — O sono (`quest_sono`)

### Cena 2.1 — Volta a Baixo Orvalho (entardecer)
- **O que acontece:** a vila se junta na praça (Lanterna e Musgo: lanternas acendem). Edric volta calado: "O urso, não". O sargento diz que o Regulamento não prevê luto; a Cuidadora avisa que o sino "cheira a luto" e pede que ele toque baixo (`txt_cena04_*`). A tradição manda tocar o objeto de prova; Edric toca baixo, por respeito. O humor volta só depois.
- **Nota de câmera:** plano amplo da praça; a câmera sobe ao erguer o sino.

### Cena 2.2 — O sino toca
- **O que acontece:** o sino toca uma vez (`sfx_sino_toque_sujo`). A **marca esquenta e brilha** no antebraço de Edric (`txt_cena05_edric_01`). As lanternas piscam; **um a um, todos adormecem**, incluindo a Cuidadora, que cai logo depois de pedir que ele toque baixo (`txt_cena04_cuid_02`). Edric não cai. A fala dela é um aviso ("cheira a luto"), não uma piada: o contraste com a morte do urso é de peso, não de ironia.
- **Mostrar, não explicar:** a colher de pau cai sem som; a tigela de sopa (se a secundária foi feita) fica ao lado dela.
- **Nota de jogo:** cena curta, sem combate; flag `flag_vila_dorme`. **Sono sem prazo** (D-017). Estado do mapa: **vila adormecida** (cenário).
- **Nota de som:** o timbre abafa todos os sons; segue `mus_vila_sono`.

### Cena 2.3 — A vila adormecida e a casa da Cuidadora
- **O que acontece:** Edric percorre a praça (cenário; sem estado "adormecido" jogável, [FIXO D-017]): ronco sincronizado, escrivão sobre o papel, taverna cheia (`txt_cena06_edric_01` a `_04`). Na **casa da Cuidadora**, na estante, ele acha o **Livro de Ervas e Bênçãos** (`item_livro_cuidadora`) com o **feitiço branco** que limpa o que o som sujou (`txt_cena06_livro_*`). Ele percebe que não tem "mãos que curam" e precisa de uma **feiticeira**; o cartaz de Ysolt Brum, no quadro de avisos, promete curar maldições (`txt_cena06_cartaz_*`).
- **Gancho emocional:** Edric **adia** a vingança e a ida para cavaleiro: "Primeiro ela, depois a Coroa. A Coroa que espere na fila, ela adora fila."
- **Nota de jogo:** interação mínima (casa); flags `flag_feitico_encontrado`, `flag_rumo_ysolt_aceito`.

**Fecha a Parte 2:** o portão da vila se abre para a estrada.

---

## Parte 3 — Mãos limpas (`quest_cura`)

### Cena 3.1 — A estrada
- **O que acontece:** Edric atravessa a região aberta (atmosfera **C · Iluminura**). Gente da estrada (arruinados por taxas, não monstros), fauna e cartazes de Ysolt (`txt_cena06_cartaz_*`, `txt_estrada_*`).
- **Narrativa ambiental:** pedágio vazio e cancela quebrada; carroça de tributo tombada; edital do chanceler; acampamento de famílias que fugiram do tributo; espantalho com o selo da Coroa (`txt_estrada_edital_*`).
- **Secundária:** `quest_sec_viajante_endividado` (escolha pequena, nunca trava).
- **Nota de jogo:** exploração aberta, 2–3 áreas de combate, atalho opcional.

### Cena 3.2 — A feira de Ysolt: a confissão [FIXO D-017]
- **Antes da cena:** o jogador pode andar pela feira e fazer `quest_sec_letras_miudas` (vendedor de doces, contrato, letreiro, Grace). A cena da confissão só começa quando ele fala com Ysolt e confirma (`txt_ui_feira_confirma`).
- **O que acontece:** entardecer, lanternas coloridas, letreiro "CURAS GARANTIDAS (CONSULTE AS EXCLUSÕES)". Edric mostra o livro (o feitiço); Ysolt tenta vender o "Pacote Anti-Eco", o teatro desmorona e ela **confessa que não pode** (`txt_cena07_ysolt_05`). Ela chama **Grace**, que tem "mão boa" (`txt_cena07_ysolt_07`).
- **Nota de câmera/luz:** feira em tons quentes; ao confessar, a luz esfria e a câmera se aproxima de Ysolt.
- **Nota de jogo:** cena de diálogo, sem combate; flag `flag_ysolt_confessou`.

### Cena 3.3 — Grace abençoa e limpa o sino [FIXO D-017]
- **O que acontece:** Grace, nervosa, reconhece o feitiço (leu num livro velho, nunca tentou). Ela faz o rito sobre o sino: vela, tigela, palavras. A **marca de Edric esquenta**. A **sombra sai do sino como fumaça** (`sfx_sombra_sobe`) e o sino fica **limpo** (`item_sino_limpo`) (`txt_cena08_*`). Ysolt, atônita, libera Grace; Grace pergunta se há taxa de rescisão.
- **Mostrar, não explicar:** o brilho branco-esverdeado nas mãos de Grace, diferente do azul-esverdeado do sino.
- **Nota de jogo:** cena; Grace passa a andar ao lado de Edric (D-012: sem lutar, sem habilidades); flags `flag_grace_no_grupo`, `flag_sino_limpo`.

### Cena 3.4 — A cura em Baixo Orvalho: fim do slice [FIXO D-017]
- **O que acontece:** Edric e Grace voltam à vila adormecida. Na praça, perto do poço, Edric usa o **sino limpo** (interação) e ele soa uma vez (`sfx_sino_toque_limpo`). A **aura sombria sai da vila** como fumaça (`sfx_sombra_sobe`) e **todos acordam** (`sfx_vila_acorda`), em círculos a partir da casa da Cuidadora. É uma **cena**: não há estado "adormecido" jogável (D-017; 06/03 confirmam).
- **Mostrar, não explicar:** a primeira lanterna que volta a acender; a colher de pau se mexendo; a Cuidadora procurando a tigela.
- **O que NÃO se revela:** o significado da marca e a natureza do mal antigo (corrompido ou protetor). O sino fica **limpo**, e os dois ainda o ouvem "pensando" (`txt_cena09_edric_07`, `txt_cena09_grace_05`).
- **Segue para o epílogo (3.5)**: o estado do mapa passa para **vila acordada**.

### Cena 3.5 — Epílogo livre na vila acordada [FIXO D-018]
- **O que acontece:** corte para a manhã seguinte (`txt_cena11_*`). Baixo Orvalho está acordada, com fome e sem lembrar de nada; o jogador tem controle livre. NPCs usam os textos de epílogo (`txt_epi_*`) e, nas secundárias da vila, os mesmos diálogos de missão.
- **O que o jogador pode fazer:** terminar `quest_sec_formulario_27b` e `quest_sec_receita_zefa` (não expiram), falar com todos, comprar itens. Grace anda junto (sem lutar, D-012).
- **Cenas curtas de fechamento:** Edric conta à Cuidadora do urso (`txt_epi_cuid_01`/`_02`, `txt_epi_edric_cuid`); Edric e o sargento (`txt_epi_edric_sargento`, `txt_epi_sargento_01`).
- **Como termina:** o jogador vai ao portão com Grace; um aviso pergunta se quer **partir** ou **ficar** (`txt_ui_epilogo_sair`, `_ficar`, `_partir`). Ao partir: `txt_cena12_cuid_adeus` e tela de encerramento (`txt_cena10_*`; texto "continua" a definir com o Produtor).
- **Estado do mapa:** `flag_vila_acordada` liga o estado **vila acordada** (NPCs em pé, lanternas acesas, sem sono). Custo para 06/03 confirmar: três estados do mapa (dia, adormecida, acordada) e uma cena a mais.

---

## Gancho para depois do slice (sem inventar atos novos)
1. O sino está **limpo**, mas "pensa": o mistério do mal antigo continua aberto.
2. A **marca** de Edric: o significado ("o escolhido") não se explica no slice.
3. Edric ainda crê que o **rei** mandou queimar a aldeia; a verdade (Oswin, com o selo do rei) e o **rei Ondric**, lúcido e arrependido, ficam para depois.
4. Grace passa a ser a primeira companheira; Ysolt volta como aliada relutante ou rival.

## Marcadores de estado (flags) do slice
`flag_graduacao_aceita` · `flag_sino_recolhido` · `flag_vila_dorme` · `flag_feitico_encontrado` · `flag_rumo_ysolt_aceito` · `flag_ysolt_confessou` · `flag_sino_limpo` · `flag_grace_no_grupo` · `flag_vila_curada` · `flag_vila_acordada` · `flag_epilogo_partir`. Secundárias: ver arquivos em `missoes/`.

## Pontos para o 09 (QA): a missão não deve travar
- Ordem livre das conversas na vila (Parte 1) e das escolhas da estrada.
- Sair da caverna antes do chefe e voltar mantém o estado.
- Secundárias da vila **não expiram**: funcionam em vila de dia e em vila acordada (epílogo).
- A cura só dispara com `flag_sino_limpo` e `flag_grace_no_grupo`, dentro de Baixo Orvalho.
- Voltar à vila durante a Parte 3 antes de limpar o sino mantém `flag_vila_dorme`.
- `quest_sec_letras_miudas` só pode ser perdida se o jogador sair da feira sem fazê-la, depois de confirmar a cena de Ysolt.

## Dependências abertas (resumo)
j (nomes) · custo dos estados do mapa (06/03 confirmam). Respostas em `perguntas_abertas.md`.
