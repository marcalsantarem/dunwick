# BRIEFING BRF-009: 08 Arquiteto — Esqueleto do M1 (protótipo cinza)

- **Prioridade:** P0 · **Emitido:** 2026-10-24 pelo Produtor · **Stack aprovada pelo usuário:** D-016 (Three.js, câmera ortográfica 35°, resolução interna 640×360 ×3, JavaScript/Node, ferramentas gratuitas)
- **Objetivo:** entregar a base que **abre no navegador** e sobre a qual o 03 implementa o M1 e o 10/04/07 montam a cena-modelo (M2). É a §10 do `08_arquiteto_tecnico.md`.
- **Ler antes:** `agentes-rpg/08_arquiteto-tecnico.md` (§5–§12), `docs/tecnico/decisoes/ADR-001.md`, `docs/tecnico/spikes.md`, `docs/gameplay.md` (v0.2: §3, §6, §10, §11.1), `docs/qa/criterios_marcos.md` (M1), `docs/niveis/metricas.md` (`map_sala_teste`).

## Especificação
- Projeto na raiz (`src/`, `data/`, `assets/`, `tools/`, `tests/`, `build/`) conforme §5.3 do 08; **reaproveite** o que valer de `spikes/`, sem arrastar `node_modules`/`dist`/placeholders para o repositório (`.gitignore` correto).
- Laço de **passo fixo 60 Hz** com acumulador, desenho interpolado, limite de passos por quadro (proposta do 03: 5) e pausa ao perder o foco sem simular o tempo perdido.
- Câmera ortográfica a 35°, resolução interna 640×360 com escala inteira, sem tremor de pixel.
- **Sala cinza** `map_sala_teste` (48×32) carregada de **dados**, com luz, e sprite-placeholder iluminado com sombra.
- Entrada por **ações lógicas** (nomes do `gameplay.md` §3.1; teclado e gamepad, gamepad conecta/desconecta em jogo).
- Carregamento de **dados validados por esquema** (Ajv, a fixar) e validador rodando no build; textos em tabela por ID.
- Canal de áudio **desbloqueado por clique/tecla**.
- **Modo debug** (só no build de desenvolvimento): fps (média e pior 1 %), tempos de quadro exportáveis, contador de ticks, posição em tiles, caixas, estados, avanço quadro a quadro, câmera lenta; **alvo de treino** (`enemy_boneco_alvo`) e boneco que golpeia (`enemy_boneco_golpe`) como entidades simples (a lógica de combate é do 03).
- Perfis de qualidade Alto/Médio/Baixo em **dados**.
- **Teste automático** rodando (um teste real de passo fixo) e script de build: validar dados → validar assets → testes → empacotar → relatório de peso.
- Documentar em `docs/tecnico/` como rodar, testar e o que cada pasta é.

## Fora de escopo
Combate, IA, HUD, save, arte final, áudio real, qualquer conteúdo de história. Sem dependências pagas.

## Pronto quando
- [ ] `npm`/script único abre o jogo no navegador, com a sala cinza, o placeholder se movendo (sem lógica de combate)
- [ ] 60 fps medidos na sala; resultado registrado no `spikes.md` ou em `docs/tecnico/`
- [ ] Debug com todos os itens acima funcionando
- [ ] Validador de dados e teste automático rodam e passam
- [ ] Peso do download inicial reportado (meta ≤ 10 MB; esperado ≈ 2 MB)
- [ ] `.gitignore` correto e o repositório sem `node_modules`
- [ ] Entrega no formato: entregue · validação · suposições · não testado · próximo passo

## Depende de
Nada. Perguntas ao usuário (computador de referência, Mac): eu faço depois; use a máquina desta sessão por enquanto. Retorno: uma única mensagem curta ao entregar ou se algo bloquear.
