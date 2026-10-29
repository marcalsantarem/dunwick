# Plano de teste dos mapas — v0.1.2 (vila + interiores)

Dono dos dados: 14. As regras rodam em `npm run validar` (`tools/validar_dados.mjs` + `tools/lib/validar_mapas_ligados.mjs`, do 08) e em `npm test` (`tests/mapas_ligados.test.mjs`, `tests/mapa_ciclo_camera.test.mjs`, `tests/encontros.test.mjs`). Gerar os dados: `node tools/gerar_vila.mjs`.

| # | Regra | Como é conferida | Onde |
|---|---|---|---|
| 1 | IDs únicos: objetos, edifícios, portais e POIs de cada mapa; IDs de mapa = nome do arquivo | validador (erro "repetido" / "igual ao nome do arquivo") | validar |
| 2 | Edifício = objeto `casa` com o mesmo `x, z, w, d`; nenhum edifício se sobrepõe a outro | validador cruzado | validar |
| 3 | Porta encostada ao edifício; gatilho da porta em chão livre e alcançável | validador (porta longe; portal alcançável) | validar |
| 4 | Ida e volta: todo portal ativo aponta para um portal que aponta de volta (vila ↔ interior) | validador ("sem volta") + teste de portal quebrado | validar + test |
| 5 | Chegada de cada portal fora de colisão e fora do próprio gatilho (não dispara de novo) | validador + teste | validar + test |
| 6 | Início do jogador fora de colisão, em todos os mapas | validador + teste "início livre" | validar + test |
| 7 | Todo POI e toda chegada alcançáveis a pé a partir do início (busca em grade de 0,5 tile com o raio do herói e a colisão real do jogo) | validador | validar |
| 8 | Interior: `tipo_mapa: interior`, portal de saída ativo, sem arquivo de zonas (sem encontro) | validador + `data/exploracao` só tem `z_enc_baixo_orvalho` | validar |
| 9 | Vila 100 % segura: uma zona segura `[0,0,47,47]`, `zonas_encontro` vazia, `ligado: false` | teste "dados reais: a vila inteira é segura" | test |
| 10 | Árvores, arbustos e pedras fora de prédios (+ folga), caminhos, portas, pátio e saídas | por construção no gerador (área proibida) + regra 7 | gerador |
| 11 | Props novos só entram com tipo no kit e no esquema | gerador (`noKit`) + validação de esquema | gerador + validar |

## No navegador (manual, 09)

1. Andar do início até cada porta (5) e entrar; sair e conferir que o herói aparece **fora** do gatilho, virado para fora.
2. Andar pela vila inteira: nenhum encontro aleatório.
3. Saídas norte e sul: pisar no gatilho não faz nada (inativas).
4. Minimapa: os 9 edifícios e as portas batem com o mapa.
