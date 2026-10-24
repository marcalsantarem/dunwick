# Bíblia do Mundo — v4 (BRF-008, atualizada com D-015 a D-018)

> Autor: 02 Roteirista · Base: Bíblia do Projeto v1, D-011 a D-016, `perguntas_abertas.md`.
> **Legenda de status:**
> - **[FIXO]** vem do usuário ou da Bíblia do Projeto; não mudar sem o usuário.
> - **[PROPOSTA]** preenchimento mínimo do 02 para o slice ser produzível; o usuário pode trocar.
> - **[ABERTO]** depende de uma pergunta em `perguntas_abertas.md` (cita a letra).
> Regra: nada em [PROPOSTA] ou [ABERTO] vira dado, arte final ou texto de jogo antes de aprovado.
> **v4:** D-018 adiciona epílogo livre na vila acordada, **morte do urso** (armaduras como memento) e 4ª secundária na feira. **v3:** além de D-015 (sino, maldição, fim do slice, rei **Ondric**), entram D-017: marca de sino no antebraço, chefe **urso-musgo gigante**, cura por **feitiço branco** (Grace abençoa e limpa o sino), sono sem prazo, sino limpo no fim. Fichas completas em `personagens/`, textos em `textos.csv`.

---

## 1. Pitch e pergunta temática

**Pitch [FIXO, D-015]:** Edric Moss é um órfão que sobreviveu ao saque da própria aldeia e quer ser cavaleiro. Na última tarefa do treinamento, ele traz de um covil um sino antigo que o saque havia perdido, e ao ser tocado na vila ele faz todos adormecerem, menos Edric. Para acordar quem ele ama, adia sua vingança contra a Coroa, acha nos livros da Cuidadora um feitiço branco que limpa o sino e sai atrás de uma feiticeira que o execute. A busca é só o começo: depois vem um mal antigo e, no fim, salvar o mundo.

**Pergunta temática [PROPOSTA]:** *O que você deve a quem te criou e a quem te feriu: cuidar de quem está vivo ou vingar um passado?* Subtema: um reino que se esconde atrás de formulários trata gente como número, e isso também é violência.

## 2. Tom e atmosfera

- **Palavras-chave [FIXO]:** aventura épica, humor ácido de autoironia e burocracia absurda (Tom 2), mais adulto, 16 anos (D-011), momentos melancólicos, tensão real.
- **Imagem-guia visual [FIXO, D-008]:** **A · Lanterna e Musgo** como base; a caverna puxa para **B · Cinza e Brasa**; a região aberta de dia pode puxar para **C · Iluminura**.
- **O que NÃO somos:** paródia sem peso (o humor não tira o peso das cenas sérias, Pilar 3); gore extremo; vilão sem razão; cópia de qualquer obra existente.

### Regras do humor (Tom 2) [FIXO + PROPOSTA]
1. A graça vem de **autoironia** (Edric se descreve como o pior aluno) e de **burocracia absurda** (taxas, carimbos, prazos, regulamento citado por número de página).
2. O sistema é cruel de verdade: o humor expõe, não suaviza. Nas cenas sérias (a aldeia, o sono da vila) o humor some ou fica seco.
3. Ninguém explica a piada. A fala termina na frase mais seca.
4. Linguagem forte moderada, sem nudez nem sexo explícito (D-011).

## 3. Linha do tempo

> "aj" = anos antes do início do jogo. Idade do Edric: 18 anos hoje, 8 no saque **[FIXO, D-015]**. As demais datas são **[PROPOSTA]**, só a ordem dos eventos é [FIXO].

| Quando | Evento | Status |
|---|---|---|
| Muito antes | O **sino antigo** existe na aldeia de Edric. Origem e função: protegia a aldeia de um mal, ou era só um sino. | [FIXO] existe · origem [ABERTO] (r) |
| 10 aj | Soldados do rei **saqueiam e queimam** a aldeia de Edric por **tributo atrasado**, **por ordem do chanceler com o selo do rei**. Os pais de Edric morrem. O **sino se perde** no saque. Edric (8 anos) sobrevive escondido. | [FIXO] (D-015) |
| 10 aj | Um **monstro** acha o sino e o leva para um covil, como tesouro. | [FIXO] |
| 10 aj | Edric é acolhido e criado pela **Cuidadora** em Baixo Orvalho. | [FIXO] que foi criado por ela · como o encontrou [PROPOSTA] |
| Anos seguintes | O rei **Ondric** envelhece e adoece; o chanceler **Oswin Cathe** passa a governar de fato. Edric treina com um sargento aposentado da Guarda. Vários guerreiros tentam pegar o sino e falham. | [FIXO] |
| Hoje, dia 1 | **Última tarefa do treinamento:** pegar o sino no covil, tida como muito difícil. Edric vence o monstro, que **morre**, e traz o sino. | [FIXO] |
| Hoje, dia 1 à noite | O sino toca na vila e **todos adormecem**, menos Edric. | [FIXO] |
| Hoje, dias seguintes | Edric acha o **feitiço branco** nos livros da Cuidadora e adia a vingança e a ida para cavaleiro. Na feira, Ysolt **confessa que não pode** executá-lo e **Grace abençoa e limpa o sino**. Voltam à vila, o **sino limpo** soa, a **aura sombria sai** e todos acordam (cena). Epílogo livre na vila acordada e fim do slice. | [FIXO, D-017/D-018] |

**Edric crê que o rei mandou queimar a aldeia [FIXO]**; a verdade (foi Oswin, com o selo do rei) fica para depois do slice.

## 4. Geografia

Mínima, só o que o slice precisa. Cada lugar tem função de jogo e uma imagem forte para o 07/10.

### 4.1 Baixo Orvalho (vila) — `map_baixo_orvalho` [FIXO nome · PROPOSTA o resto]
- **Função de jogo:** tutorial, NPCs, missões secundárias, ponto de partida e de volta. Duas vezes: viva (antes) e adormecida (depois).
- **Imagem forte (Lanterna e Musgo):** vila no fundo de um vale onde o orvalho nunca seca; telhados de musgo, lanternas que acendem ao entardecer, **poço no centro**.
- **Imagem forte, depois do sino:** a mesma vila **toda adormecida**: gente deitada onde estava, de lado na praça, na porta da taberna, com a lanterna acesa e o silêncio no lugar do barulho. É o contraste visual do slice.
- **Lugares-chave:** praça com poço; a **casa da Cuidadora** (ervas pendendo, luz de vela, **estante de livros** com o feitiço branco [FIXO D-017]); o **campo de treino** da Guarda; a **taverna**; a **forja**; o **quadro de avisos** com editais, taxas e (depois) o cartaz de Ysolt.
- **Três estados do mapa [FIXO D-017/D-018]:** (1) **dia** (Parte 1); (2) **adormecida** (cenário, habitantes deitados como props; só a casa da Cuidadora é interativa); (3) **acordada** (epílogo livre, secundárias da vila podem ser terminadas).

### 4.2 A caverna da graduação — `map_caverna_graduacao` [PROPOSTA nome genérico]
- **Função de jogo:** masmorra + chefe. Atmosfera B · Cinza e Brasa.
- **Imagem forte:** corredor de pedra molhada que desce até o **covil**, onde o **urso-musgo** dorme sobre um monte de objetos brilhantes (armaduras, talheres, bandeirolas) e, no meio, o **sino** azul-esverdeado. Um fio de luz do teto bate no sino.
- **Narrativa ambiental [PROPOSTA]:** sinais dos que **tentaram antes**: armaduras abandonadas, bandeiras de graduações passadas rasgadas, marcas de garra, uma lista pregada de nomes de tentativas (humor: com carimbo de "reprovado").

### 4.3 A região aberta — `map_estrada_feira` [PROPOSTA nome genérico]
- **Função de jogo:** exploração, combate, lore de estrada; liga Baixo Orvalho à feira. Atmosfera C · Iluminura de dia.
- **Imagem forte:** estrada de terra pelas colinas, **cartazes colados em árvores e postes** (editais e propaganda de Ysolt) e, ao longe, a lona colorida da feira.
- **Presença da Coroa [PROPOSTA]:** postos de pedágio vazios, carro de recolhimento de tributo, editais assinados por Oswin.

### 4.4 A feira de Ysolt — `map_feira_ysolt` [PROPOSTA]
- **Função de jogo:** destino da Parte 3; cena da confissão de Ysolt e do encontro com Grace.
- **Imagem forte:** feira itinerante armada numa clareira ao entardecer, com barracas, lanternas coloridas e letreiro enorme: **"CURAS GARANTIDAS (CONSULTE AS EXCLUSÕES)"**.

### 4.5 Mor-Allen (reino) — visão geral [FIXO nome · PROPOSTA o resto]
- Reino governado do papel: muitas leis, selos, taxas e repartições; pouco cuidado real com o povo.
- Capital e castelo: sem nome [ABERTO j]. No slice aparecem por **documentos, cartazes e soldados**.
- A Guarda (quem forma aprendizes e cavaleiros): nome provisório [ABERTO j].

## 5. Sociedade e política

- **Rei Ondric [FIXO]:** velho e doente; símbolo, não governante. É **lúcido e arrependido**: sabe o que Oswin faz e não tem força para pará-lo. Não aparece no slice (estátuas, moedas, selo).
- **Chanceler Oswin Cathe [FIXO]:** burocrata cruel que manda em tudo em nome do rei. **Ordenou a queima da aldeia de Edric com o selo do rei.** Governa por **papel**: taxas, prazos, carimbos, "pareceres". **Não tem ligação com o sino** (D-015). Não aparece em cena no slice (cartas, editais, assinatura).
- **Tributo [FIXO]:** a Coroa cobra tributo; atrasar pode ser punido com aniquilação.
- **A burocracia como arma [PROPOSTA]:** o poder de Oswin é **formulário**; queimar uma aldeia é "procedimento padrão". Taxas para o humor (texto vai para `textos.csv`): taxa de graduação, de caverna, de urgência, de sino.
- **Dilema sem vilão claro [PROPOSTA, regra do 02]:** o povo de Baixo Orvalho depende da Coroa para sobreviver, e o rei (a face da Coroa) está arrependido. Edric quer vingança contra o rei, mas o rei não é o culpado direto. A moral cinzenta nasce daí.
- **Facções do slice [PROPOSTA]:** (1) a Coroa (Ondric/Oswin, fiscais e soldados); (2) a Guarda; (3) o povo de Baixo Orvalho; (4) a feira (comerciantes e charlatães que escapam do tributo). Razão defensável de cada uma fica para a Bíblia da Narrativa.

## 6. Magia (regras) — [PROPOSTA, para o 06 transformar em sistema]

1. **Fonte:** magia é rara; vem de poucas pessoas com um dom e de objetos antigos. A maioria dos "magos" anunciados é farsante (Ysolt).
2. **Custo:** usar magia **cansa o corpo** (mana/fôlego no jogo); objetos antigos cobram um preço de quem os usa ou do ambiente (o sino é o exemplo).
3. **Limite:** magia **não desfaz o passado nem ressuscita**; só alivia, protege ou fere. Curar o **sono do sino** é possível (é o fim do slice).
4. **Maldição [FIXO]:** efeito persistente causado por um objeto ou rito. A do sino faz **todos na vila adormecerem**, **sem prazo** (a urgência é emocional, D-017). Vem de uma **aura sombria** que o sino carrega.
5. **A marca de Edric [FIXO D-017]:** **desenho de sino no antebraço esquerdo**; **esquenta e brilha** (azul-esverdeado) quando o sino toca, e é por ela que Edric não adormece. Muito no futuro revela-se que ele é "o escolhido"/"diferente"; **não revelar o significado no slice**. Fica escondida por uma faixa de linho.
6. **O feitiço branco / a Bênção [FIXO D-017]:** rito antigo que **limpa a sombra deixada por um objeto ou som**. Exige **mãos que curam** e o objeto a limpar. Está nos livros da Cuidadora; Ysolt não pode executá-lo; **Grace** pode. Depois dele o sino fica **limpo**: continua cantando, sem a sombra. O mistério sobre o mal antigo (corrompido ou protetor) **continua**; sem vínculo com a Coroa.
7. **Elementos [FIXO, D-015]:** **Fogo, Gelo, Raio, Natureza (veneno)**. **Sem Luz e Sombra** por ora. A bênção branca é **cor do rito**, não elemento; no slice a cura é cena, a mecânica de cura fica para depois (06).

## 7. Bestiário narrativo (slice) — [PROPOSTA]

5 inimigos comuns e 1 chefe. Aqui só o motivo narrativo; combate é do 06/03.
- **Fauna da caverna (2–3 tipos):** bichos do escuro e da umidade. Motivo: território e fome. Quais exatamente fica para o 04/10 com o 06.
- **Gente da estrada (2–3 tipos):** saqueadores famintos, arruinados por taxas; **não são monstros**, são vítimas da burocracia. Moral cinzenta.
- **Chefe [FIXO D-017]:** **urso-musgo gigante** (musgo e cristais, acumula objetos brilhantes), `boss_urso_musgo`. Nome provisório **Musgoso** [PROPOSTA j]. **Morre** depois da luta [FIXO D-018]. Ficha completa em `personagens/boss_urso_musgo.md`.
- Sons característicos e aparência de cada inimigo: o 02 detalha quando o 06 fechar a lista.

## 8. Glossário (grafia oficial)

| Termo | Definição | Status |
|---|---|---|
| **Edric Moss** | Herói | [FIXO] |
| **Baixo Orvalho** | Vila inicial | [FIXO] |
| **Mor-Allen** | Reino | [FIXO] |
| **Ondric** | Rei (fantoche, lúcido e arrependido) | [FIXO] (substitui Ulfrec) |
| **Oswin Cathe** | Chanceler tirano | [FIXO] |
| **Ysolt Brum** | Feiticeira charlatã | [FIXO] |
| **Grace** | Aprendiz de curandeira, primeira companheira | [FIXO] |
| **o sino** | Sino antigo de cobre, perdido no saque. Fica **limpo** no fim do slice. Nome próprio [ABERTO j]. | [FIXO] |
| **a Bênção** | Feitiço branco antigo que limpa a sombra do sino. Nome do rito [ABERTO j]. | [FIXO que existe] |
| **o urso-musgo** | Chefe da caverna; morre depois da luta. Nome provisório Musgoso. | [FIXO · nome PROPOSTA] |
| **a Cuidadora** | Nome provisório da mulher que criou Edric | [ABERTO j] |
| **a Guarda** | Nome provisório da instituição que forma cavaleiros | [ABERTO j] |
| **o saque** | A queima e pilhagem da aldeia de Edric, há 10 anos | [FIXO] |
| **a marca** | Desenho de sino no antebraço esquerdo de Edric; protege do sono | [FIXO D-017] |
| **mal gigante** | Nome e natureza **não definidos** | [FIXO que é assim] |

Regra: usar sempre a grafia da tabela. **Nunca nomear o mal gigante no texto do slice.** Nome da aldeia queimada de Edric: [ABERTO j].

## 9. Fichas dos personagens do slice

Fichas **completas** (modelo do 02 §6, com background, notas de arte, combate e som) em `docs/narrativa/personagens/`:

| ID | Personagem | Ficha |
|---|---|---|
| `hero_edric` | Edric Moss | [hero_edric.md](personagens/hero_edric.md) |
| `npc_cuidadora` | A Cuidadora | [npc_cuidadora.md](personagens/npc_cuidadora.md) |
| `npc_instrutor` | O sargento aposentado | [npc_instrutor.md](personagens/npc_instrutor.md) |
| `npc_ysolt` | Ysolt Brum | [npc_ysolt.md](personagens/npc_ysolt.md) |
| `npc_grace` | Grace | [npc_grace.md](personagens/npc_grace.md) |
| `boss_urso_musgo` | O urso-musgo | [boss_urso_musgo.md](personagens/boss_urso_musgo.md) |
| `npc_ferreiro` | O ferreiro | [npc_ferreiro.md](personagens/npc_ferreiro.md) |
| `npc_taverneira` | A taverneira | [npc_taverneira.md](personagens/npc_taverneira.md) |
| `npc_escrivao` | O escrivão da Guarda | [npc_escrivao.md](personagens/npc_escrivao.md) |

**Só aparecem por documento no slice (sem ficha completa ainda):**
- **Oswin Cathe** (`npc_oswin`) [FIXO]: chanceler tirano, polido, ameaça por escrito (carimbo e tinteiro, óculos de aro fino); **ordenou a queima da aldeia de Edric com o selo do rei**; **sem ligação com o sino**. Fala só em editais (`txt_estrada_edital_*`). Exemplo: "O prazo é amanhã. O de ontem já foi aplicado."
- **Rei Ondric** (`npc_ondric`) [FIXO]: velho, doente, **lúcido e arrependido**; aparece só em estátuas, moedas e selo. Fala futura de exemplo: "Assinei. Eu sempre assino. É o que sobrou do meu poder."

Textos de jogo: `textos.csv` (IDs por área). Missões secundárias em `missoes/`. Eventos para o som em `eventos_som.md`.

---

## 10. Revisão de consistência (checklist do 02)
1. Linha do tempo sem contradição com D-015: ok. 2. Grafia igual ao glossário (Ondric no lugar de Ulfrec): ok. 3. Magia respeitada: ok. 4. Personagens agem conforme desejo e medo: ok. 5. Vozes distintas: ok. 6. Tom 16+ e D-011: ok. 7. Notas para arte, combate e som: parciais. 8. Originalidade: ver `perguntas_abertas.md`. 9. Pontas soltas: todas em `perguntas_abertas.md`. 10. Textos dentro do limite: sim.
**Pontas conhecidas:** a aldeia queimada de Edric não tem nome (proposta **Vale Seco**, pergunta j); o custo dos três estados do mapa (06/03 confirmam).
