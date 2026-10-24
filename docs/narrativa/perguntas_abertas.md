# Perguntas abertas — pontas soltas da história (v4, após D-018)

> Autor: 02 Roteirista · Para o Produtor levar ao usuário. Cada pergunta tem 2–3 opções e uma **recomendada**.
> Nada aqui é fato até o usuário escolher. As letras são citadas em `biblia_do_mundo.md`, `missao_principal_slice.md` e nas fichas.
> O mal gigante **não precisa** ser respondido agora.

---

## 1. Já respondido pelo usuário (D-015 a D-018; não reabrir)

| Antiga | Tema | Resposta |
|---|---|---|
| a | Quem roubou o sino, quem o guardava | Perdido no saque da aldeia de Edric (10 anos); um monstro o achou; **o chefe é o monstro** |
| b | Quem treina Edric | **Sargento aposentado da Guarda** |
| c | Ordem da queima | **Chanceler Oswin com o selo do rei**; Edric crê que foi o rei |
| d | Sino × chanceler × mal | **Sem vínculo com o chanceler**; mistério sobre o mal mantido |
| e | Fim do slice | **Cura na vila** (sino limpo soa; todos acordam) |
| f / g | Maldição e por que a cuidadora | **Todos adormecem**; sem resposta específica |
| h | Idade | **18 hoje, saque há 10** |
| i | Luz e Sombra | **Não por ora** |
| k | Rei | **Lúcido e arrependido**; nome **Ondric** |
| l / o / s | Poder de Grace, cura, classe | **Curandeira**; Grace **abençoa e limpa o sino** (feitiço branco); sem estado adormecido jogável |
| n | Marca | **Desenho de sino no antebraço**, esquenta e brilha quando o sino toca |
| p | Chefe | **Urso-musgo gigante** |
| q | Urgência | **Sono sem prazo** |
| r | Sino no fim | **Limpo**, sem vínculo com a Coroa |
| t | Secundárias da vila | **Epílogo livre na vila acordada** (D-018); não expiram |
| u | Destino do urso | **Morre**; armaduras de quem tentou antes como memento (D-018) |
| v | Nº de secundárias | **4** (total 5); a nova é `quest_sec_letras_miudas`, na feira (D-018) |

### Originalidade (busca web)
**Ondric**, **Edric Moss**, **Baixo Orvalho**, **Mor-Allen**, **Ysolt Brum** e **Oswin Cathe** (completo): sem conflito encontrado. "Oswin" sozinho existe em Fire Emblem. Busca de texto, sem checagem de marca (fica para o M6).
Nomes menores propostos abaixo (j) e nomes dos NPCs de aldeões: **não checados**; checo quando o usuário escolher.

---

## j) Nomes de NPCs menores e instituições [pendente; o 02 usa a primeira opção como PROPOSTA nos textos]

Nos textos, esses nomes aparecem como **variáveis** (`{nome_cuidadora}`, `{nome_sargento}`, `{nome_urso}`, `{nome_guarda}`), então trocar não exige reescrever. Os nomes de personagens abaixo ainda estão nas fichas, não nos textos.

| Item | Opções (a primeira é a PROPOSTA em uso) |
|---|---|
| **Cuidadora** | **Dona Brisolda** · Tia Nelva · Mãe Tuca · Vó Cacilda |
| **Sargento aposentado** | **Sargento Bartolo Quint** · Instrutor Vasco Pell · Hobart Tuck |
| **Instituição que forma cavaleiros** | **A Guarda de Mor-Allen** · A Ordem do Selo · A Academia Real |
| **Capital de Mor-Allen** | **Aldeburgo** · Ostenwall · Valmora |
| **O sino** | **O Sino de Cobre** · O Sino Rouco · O Sino da Aldeia |
| **Aldeia queimada de Edric** | **Vale Seco** · Pedra Alta · Rio Fundo · Ferrugem |
| **Urso-musgo** | **Musgoso** · O Guardião do Covil · Garra-de-Prata |
| **Ferreiro** | **Mestre Odilon** · Mestre Gedeão · Tobias Brant |
| **Taverneira** | **Zefa Caneca** · Tia Marta · Dona Ivete |
| **Escrivão** | **Escrivão Plínio Selo** · Escrivão Arlindo Pena · Escrivão Teófilo Tinta |
| **Viajante da estrada** | **Tomé Carga** · Beto Mala · Zé Cancela |
| **Vendedor da feira** | **Seu Tadeu Doce** · Seu Anselmo · Dona Lídia |
| **Nome do feitiço branco** | **A Bênção Branca** · O Rito da Água Limpa · A Limpeza |

---

## w) O memento do urso: ação opcional ou automática?

D-018 fixa que o urso morre e as armaduras ficam como memento. Falta definir como o jogador participa.
- **A — Ação opcional (recomendada):** o jogador escolhe pôr as armaduras em círculo (`txt_amb_covil_armaduras_acao`); quem não faz vê o círculo já formado, só que menos arrumado. Pouco custo, peso emocional, sem obrigar.
- **B — Cena automática:** Edric arruma sozinho numa cena curta. Mais controlado; − tira a escolha.
- **C — Só cenário:** as armaduras ficam como estão. Mais barato; − perde o gesto.

## x) Custo dos três estados do mapa (06/03 confirmam)

Para cumprir D-017/D-018, `map_baixo_orvalho` precisa de **dia**, **adormecida** (cenário) e **acordada** (epílogo).
- **A — Três estados com o mesmo mapa e props trocados (recomendada):** reaproveita o mapa; NPCs mudam de pose (em pé, deitados, em pé); luz muda. O 06/03 decide se é por estado do mapa ou por flags.
- **B — Duas cenas separadas para dormir e acordar:** só o dia e o epílogo são jogáveis; o sono é cutscene. Mais simples; − o jogador não anda pela vila adormecida (hoje a casa da Cuidadora é interativa).
- **C — Cortar a adormecida jogável:** a casa da Cuidadora vira cutscene e o jogador só controla Edric de novo na estrada. Corte maior.

---

## Mal gigante (sem pressão)
Nome e natureza continuam **em aberto**; o slice não os usa. Quando o usuário quiser, o 02 propõe 2–3 opções coerentes com o sino limpo e a marca.

---

## Resumo das recomendações (para o Produtor levar em bloco)
w A · x A · j (usuário escolhe um a um; os recomendados já estão nos textos como variáveis).

**Combinações a evitar:** x=C com a Parte 2 atual (a casa da Cuidadora deixa de ser interativa, o livro precisaria virar cena); w=B com u de D-018 (morte do urso fica ainda mais "de cena", pouco de jogador).
