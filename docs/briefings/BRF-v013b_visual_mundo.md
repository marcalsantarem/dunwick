# BRF v0.1.3b — Refazer o visual do mapa de mundo (D-046)

Branch `dev-v013` (não troque; não commite). O usuário reprovou o visual (captura: `build/qa/mobile/mundo_PC.png`): terreno chapado de verde, montanhas de cones, árvores pontuais, herói minúsculo, bordas vazias. Pediu: **repensar e reconstruir para ficar bonito, mesmo fora do que estava estipulado.** Referência de qualidade: mapas de mundo de Final Fantasy/Breath of Fire/Chrono Trigger da era 16-bit — **mais densidade, cor e textura que isso, com leitura clara**. Originalidade continua regra (nada de copiar). Funcionalidade (portais, marcadores, colisão, banner, placa, minimapa desligado) fica.

## Direção (10 decide em até 1 passo, liberdade total)
Escolher e documentar (`docs/arte/mapa_de_mundo.md`): câmera (top-down/oblíqua estilo 16-bit **ou** isométrica atual mais próxima e densa), resolução e escala dos tiles, paleta rica (clima de dia com variação), estilo (pixel art desenhada por código **ou** 3D estilizado denso). Pontos que costumam funcionar: tiles de pixel art com **transições/autotiles** (grama→areia→mar, estrada→grama), **água animada** com espuma na costa, **sombras de nuvens** passando, **florestas em massa** com copas sobrepostas, **montanhas detalhadas** (faces claras/escuras, neve nos picos, sombra projetada), **rios e lagos com margem**, relevo e colinas, **campos de cultivo/flores/rochas variados**, **marcadores bonitos e maiores** (vila com casas, fumaça), **herói legível** (maior que o minúsculo atual, com sombra), névoa/profundidade e moldura (borda do mundo com mar/nuvens, sem "fim do mundo" feio). Registre a decisão e ADR/decisão se mudar câmera ou resolução.

## Execução
- **07 Cenários:** tileset/props/marcadores/efeitos do mundo conforme o 10; tudo por código; item-modelo (um trecho de ~12×12 tiles) aprovado pelo 10 e pelo usuário **antes** de gerar o resto.
- **08 Arquiteto:** suporte de render (câmera, resolução do buffer, autotile/atlas de terreno, água animada, sombras de nuvem, pós) mantendo ≥ 60 fps (pior 1 % ≥ 45), 3 perfis, download ≤ ~10 MB.
- **14 Níveis:** refazer o mapa `map_mundo_orvalho` com composição melhor (costa recortada, rio sinuoso, lago, florestas em manchas, colinas, caminhos e a vila em destaque) mantendo portais/marcadores; maior se necessário.
- **04 Sprites:** herói de mundo mais legível (tamanho e animação), se o 10 pedir.
- 13 e 15 só se a mudança de câmera/escala exigir.

## Saída
Captura do item-modelo (12×12 tiles) → usuário vê **antes** da produção em massa. Depois mapa inteiro, FPS medido, `npm test`/validar/build verdes.
