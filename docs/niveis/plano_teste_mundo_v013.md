# Plano de teste do mapa de mundo — v0.1.3 (D-045, D-048)

Dono dos dados: 14. As regras rodam em `npm run validar` (`tools/validar_dados.mjs` + `tools/lib/validar_mapas_ligados.mjs`) e em `npm test`. Para gerar os dados: `node tools/gerar_mundo.mjs` (mundo) e `node tools/gerar_vila.mjs` (vila, por causa da saída sul).

| # | Regra | Como é conferida | Onde |
|---|---|---|---|
| 1 | `tipo_mapa: mundo`, planta 48 × 48 e só materiais da legenda do esquema (grama, mata_rala, estrada, agua, montanha, areia) | esquema | validar |
| 2 | `solidos` = agua e montanha. Mar, rio, lago e serra bloqueiam; mata, praia e estrada não | esquema + colisão de `mapa.js` | validar + test |
| 3 | Sem `arvore_mundo` nem `montanha_mundo` no mapa (D-048). Os objetos são só `marcador_*`, `ponte_mundo` e `rocha_mundo` | gerador + checagem do 14 (lista de tipos) | gerador |
| 4 | Ida e volta: `marcador_vila` ↔ `saida_sul` da vila, ambos ativos | validador ("sem volta") | validar |
| 5 | As chegadas dos 3 marcadores e da `saida_sul` caem fora de colisão e fora do próprio gatilho | validador + checagem do 14 | validar |
| 6 | Bosque e caverna: portal `ativo: false`, objeto `interditado`, `nome_txt` e `aviso_txt` existentes na tabela de textos | validador (texto inexistente) | validar |
| 7 | Os 3 marcadores e a ponte são alcançáveis a pé a partir da chegada da vila (grade de 0,5 tile, raio do herói, colisão real) | validador + checagem do 14 | validar |
| 8 | Ninguém chega à borda do mapa: o mar e a serra fecham os quatro lados | checagem do 14 (busca não alcança x/z 0 nem 47) | gerador |
| 9 | Rochas nunca sobre estrada, ponte, clareira de marcador ou chegada | por construção no gerador + regra 7 | gerador |
| 10 | Sem encontros, NPCs nem baús no mundo (v0.1.5 trará encontros) | não existe arquivo de zonas para o mundo | validar |
| 11 | O jogo começa na vila: o mundo não é o mapa inicial | `mundo.js` escolhe o primeiro mapa `exterior` | test |

## No navegador (manual, 09)

1. Sair da vila pelo vão sul. O herói de mundo deve aparecer ao sul do marcador da vila, virado para o sul, e aparece o banner "Campos de Baixo Orvalho".
2. Voltar ao marcador da vila. O herói deve entrar na vila no vão sul, virado para o norte, fora do gatilho.
3. Ir aos marcadores do bosque e da caverna: só aparece o aviso, sem troca de mapa. Ao aproximar, aparece o nome do marcador.
4. Seguir as 3 estradas até o fim. A ponte deve ser atravessável, e o rio, o lago e o mar devem bloquear.
5. Andar rente à costa e à serra nos quatro lados: não há saída pela borda nem borda vazia na tela.
6. Andar dentro das massas de floresta: o herói passa (mata não bloqueia) e não fica preso entre árvores e rochas.
7. Medir FPS nos perfis alto, médio e baixo e no celular (meta: 60 fps; pior 1 % ≥ 45).
