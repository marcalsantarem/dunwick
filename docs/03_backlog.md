# Backlog

> Mantido pelo Produtor (01). Prioridades: P0 (sem isso não funciona) · P1 (muito importante) · P2 (bom ter) · P3 (futuro). Nada de P2/P3 antes do vertical slice (M3).

## Ideias do usuário para quando chegar a hora

### BL-001 · Habilidades que evoluem pelo uso (P2, depois do slice) — 2026-10-26
- **Ideia (usuário):** em vez de árvore tradicional, a habilidade muda conforme **como o jogador a usa**. Exemplo: **Golpe** → usado para *finalizar inimigos* evolui para **Execução** (mais dano em inimigos enfraquecidos); usado contra *inimigos protegidos* evolui para **Quebra-guarda**; usado para *proteger aliados* evolui para **Contra-ataque** (pune quem ataca os companheiros). Dois jogadores, mesma classe, estilos diferentes. Possível extensão: **combinações/reações** entre habilidades (fogo cria explosões; eletricidade conduz por inimigos molhados).
- **Avaliação do Produtor:** viabilidade **boa**, se as evoluções forem **predefinidas** e poucas. Ver detalhes na conversa de 2026-10-26: contadores de uso por contexto (os eventos `dano`, `morreu`, `golpe_acertou` já existem na arquitetura), tabela de evoluções em dados (`evolui_para` + condição + limiar), interface que mostra o progresso, e custo de conteúdo que multiplica (habilidades × ramos: nome, ícone, efeito, texto, som). Combina com o grupo de 3 (proteger aliados exige aliados) e com a história (Edric "quer ser cavaleiro": a evolução pelo comportamento pode virar a classe).
- **Preparar agora (barato):** manter habilidades por ID desacopladas do herói (já em D-004), e o save guardar contadores por habilidade. Não implementar antes do slice.
- **Decisões abertas:** classe/evolução do Edric (fixa por nível, árvore, escolha de direção ou **evolução por uso**); modo de combate (tempo real, turnos ou híbrido).

### BL-002 · Combate em turnos estilo Breath of Fire (DECIDIDO, D-028) — 2026-10-26
- **Ideia (usuário):** combate de turnos em cena de batalha, personagens e inimigos em sprite sobre o cenário, caixas de vida e habilidade embaixo. Grupo de 3 (herói + 2 aliados). Possibilidade de modo híbrido ou por partes (dungeons em ação). Comparação de custo a pedido do usuário quando o limite de uso permitir.

### BL-003 · Versão remaster com arte refeita (P3, futuro) — 2026-10-27
- **Ideia (usuário):** depois do jogo pronto, retrabalhar a arte como uma versão "remaster", possivelmente com editor de pixel art ou IA de imagem local. Hoje tudo é por código (D-029).
- **Cuidados:** registrar a origem de cada asset, revisar os termos das ferramentas de IA (Bíblia §10.3) e manter os IDs e o formato dos sprites para trocar os arquivos sem mexer no jogo.
