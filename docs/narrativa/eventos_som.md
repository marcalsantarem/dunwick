# Eventos narrativos para o Som (05) — slice

> Autor: 02 Roteirista. Lista do **que acontece** e do **tom** de cada momento; timbre, instrumento e técnica são do 05.
> IDs: prefixos `sfx_`, `mus_`, `amb_` (convenção do projeto). **[PROPOSTA]** até o 05 confirmar com o Produtor.
> Regras de acessibilidade: nenhum som essencial depende só de frequência alta; flashes ≤ 3/s (D-007).

## Leitmotivs
| ID | Associado a | Tom | Quando aparece |
|---|---|---|---|
| `mus_motivo_sino` | O **sino antigo** | Grave, rouco, metálico, "cantando" baixo; com **sombra** (dissonância leve) antes da limpeza | Covil, volta, vila adormecida |
| `mus_motivo_sino_limpo` | O **sino limpo** | O mesmo timbre, afinado, claro, sem dissonância | Cena da bênção, cura, final |
| `mus_motivo_coroa` | A Coroa (Oswin/Ondric) | Marcha burocrática (percussão seca de carimbo), tom oficial | Editais, cartazes, fiscais |
| `mus_motivo_ysolt` | A feira e Ysolt | Alegre, teatral, de mercado, com sineta aguda | Feira |
| `mus_motivo_grace` | Grace | Tema pequeno, hesitante, que cresce quando ela cura | Feira, bênção, cura |

## Música por área
| ID | Onde | Tom |
|---|---|---|
| `mus_vila_dia` | Baixo Orvalho (manhã) | Calorosa, simples, cordas dedilhadas |
| `mus_vila_noite` | Baixo Orvalho (entardecer) | Mesma melodia, mais lenta, com sinos de vento |
| `mus_vila_sono` | Vila adormecida | Quase silêncio; um drone grave e respiração |
| `mus_caverna` | Caverna | Cinza e Brasa: eco, percussão distante |
| `mus_boss_urso` | Chefe | Grave, percussivo; o sino como eco (3 fases com intensidade crescente) |
| `mus_estrada` | Estrada | Aberta, iluminura, flauta e cordas leves |
| `mus_feira` | Feira | Ver `mus_motivo_ysolt` |
| `mus_cura` | A cura | O tema de Grace + o sino limpo em coro |
| `mus_fim` | Encerramento | Retoma o tema da vila, mais lento |
| `mus_morte_urso` | Morte do urso | Quase só o sino, uma nota longa e abafada; sem percussão; luto, não vitória |
| `mus_epilogo` | Epílogo na vila acordada | Tema da vila em tom menor, que clareia aos poucos; entra o tema de Grace |
| `mus_feira_confissao` | Confissão de Ysolt | O tema alegre da feira se desmonta, sobra só a sineta |

## Ambientes
`amb_vila_dia` (galinhas, martelo, passos de pedra) · `amb_vila_sono` (silêncio com ronco leve e vento) · `amb_vila_acordada` (vida normal, mais baixa que de dia) · `amb_caverna` (pingos, eco) · `amb_covil` (tilintar do monte brilhante) · `amb_estrada` (vento, passarinhos, cancela rangendo) · `amb_feira` (burburinho, sinetas, pano batendo).

## Eventos de efeito sonoro (SFX)
| ID | Quando | Tom/nota |
|---|---|---|
| `sfx_sino_toque_sujo` | O sino toca na vila (Cena 2.2) | Uma nota só, grave, com sombra; **abafa todo o resto** por um instante |
| `sfx_sino_toque_limpo` | O sino limpo toca (cura) | Mesma nota, limpa; abre o espaço sonoro |
| `sfx_sino_zumbido` | Sino por perto, antes do toque | Zumbido baixo, contínuo, quase imperceptível |
| `sfx_marca_esquenta` | A marca esquenta | Zumbido grave que acompanha o sino; sobe de volume |
| `sfx_marca_brilha` | A marca brilha | Curto "ting" de cristal, discreto |
| `sfx_bencao_grace` | Grace abençoa o sino | Acorde suave e puro; água corrente e vidro |
| `sfx_sombra_sobe` | A aura sombria sai do sino e da vila | Fumaça, sopro grave, sussurro que some |
| `sfx_vila_dorme` | Cada habitante cai | Respiração longa, tecido, passos que param |
| `sfx_vila_acorda` | Cada habitante acorda | Respiração curta, bocejo, passos voltando |
| `sfx_carimbo` | Carimbo do escrivão | Thud seco, curto |
| `sfx_pena_riscando` | Escrivão escrevendo | Pena em papel |
| `sfx_martelo_forja` | Ferreiro | Bate-bate-pausa, ritmo fixo |
| `sfx_panela_taverna` | Taverneira | Borbulhar e colher de pau |
| `sfx_sineta_ysolt` | Ysolt chama fregueses | Sineta aguda de mão (diferente do sino antigo) |
| `sfx_pilao_ervas` | Cuidadora | Batida de pilão em tigela |
| `sfx_bengala_sargento` | Sargento | Bengala na pedra |
| `sfx_urso_rugido` | Entrada do chefe | Grave, curto, com tilintar do monte |
| `sfx_urso_passo` | Passos do urso | Peso + metal tilintando |
| `sfx_urso_cristais` | Estouro de cristais | Vidro grosso em pedra |
| `sfx_urso_gemido` | Fase 3 | Gemido curto, vulnerável |
| `sfx_urso_queda` | Morte do urso | Queda de peso, um último tilintar do monte, silêncio longo |
| `sfx_armaduras_circulo` | Edric põe as armaduras em círculo | Metal pousando devagar, sem batida; respeitoso |
| `sfx_vila_acordada_amb` | Epílogo | Vozes, panelas, passos: a vila volta aos poucos |
| `sfx_contrato_papel` | Contrato da Ysolt | Papel grosso, páginas virando |
| `sfx_letreiro_troca` | Grace troca o letreiro | Tinta, madeira raspando, risada curta |
| `sfx_cancela_rangido` | Cancela da estrada | Ferro enferrujado |
| `sfx_pedagio_moeda` | Pagamento do pedágio | Moedas e carimbo |
| `sfx_ui_diario` | Diário abre/atualiza | Folha virando |
| `sfx_item_chave` | Obtém item-chave | Chime curto, pesado |

## Sons característicos por personagem (§6.2 do 02)
- **Edric:** passos de bota, respiração curta; sem voz falada (texto).
- **Cuidadora:** pilão, cadeira de balanço.
- **Sargento:** bengala, folhas do Regulamento, tosse.
- **Ysolt:** colares, frascos, sineta.
- **Grace:** páginas de caderno, frascos.
- **Urso:** passadas pesadas, tilintar, rugido grave.
- **Aldeões:** martelo (ferreiro), panela (taverneira), carimbo (escrivão).

## Para o 05: três regras de narrativa
1. O **sino** é sempre a mesma nota. Antes da limpeza tem sombra; depois, não. O jogador deve **ouvir** a diferença.
2. A vila adormecida é o momento mais quieto do jogo; o silêncio deve ser **desconfortável**, não relaxante. A **morte do urso** é o momento mais **solene**: sem comemoração musical; o sino é a única voz.
3. A sineta de Ysolt e o sino antigo **não podem ser confundidos**.
