# Backlog

> Mantido pelo Gestor de Backlog (11); priorização final e escopo são do Produtor (01) e do usuário.
> **Prioridade:** P0 (sem isso o marco não fecha) · P1 (muito importante) · P2 (bom ter) · P3 (futuro). **Nada de P2/P3 antes do vertical slice (M3).**
> **Custo:** P = 1 passada curta · M = 1–2 passadas com arquivos · G = várias passadas, código e teste no navegador.
> **Status:** proposto · a fazer · em produção · em revisão · feito. Quadro em [05_quadro.md](05_quadro.md).

## Onda 1 (proposta) — M1: uma batalha por turnos jogável

Objetivo da onda: Edric + Grace contra 1 inimigo comum, numa tela de batalha separada, entrando e saindo pelo mapa isométrico (D-028, D-031). Placeholders são aceitos onde a arte final ainda não existe (Grace e inimigo vêm na onda 2).

### BL-004 · Especificação do combate por turnos do M1 — P0 · 03 (apoio 06) · M · proposto
- **Entrega:** documento de combate por turnos (03) com: rodada estilo Breath of Fire (comandos de todo o grupo → execução por agilidade), comandos do M1 (Atacar, Habilidade, Item, Defender; Fugir opcional), estados (vivo, caído), fim de batalha (vitória/derrota), eventos para a apresentação; e a parte do 06: fórmulas por turno, atributos de Edric, Grace e do inimigo do M1, 1 habilidade de cada (cura da Grace) e exemplos resolvidos que viram testes.
- **Pronto quando:** o Produtor valida; toda regra cabe em dados (`data/`), sem número mágico; a lista de poses necessárias e as posições na cena estão escritas (alimenta BL-006/007).
- **Depende de:** — (D-028, D-031). **Decisão a subir:** qual inimigo comum entra no M1 (sugestão: Slime ou Lobo).

### BL-005 · UI de batalha — P0 · 15 (apoio 10) · M · proposto
- **Entrega:** layout da tela de batalha: caixas de vida/mana do grupo embaixo, menu de comandos, escolha de alvo, ordem da rodada, mensagens; controles por teclado, mouse e gamepad; textos por ID; +40 % de espaço; original (nada de janela azul em degradê).
- **Pronto quando:** mock aprovado pelo 10 e pelo Produtor; implementação em `src/ui/` lendo o estado da batalha (pode vir junto da BL-008).
- **Depende de:** BL-004.

### BL-006 · Cena de batalha 3D — P0 · 07 (apoio 10) · M · proposto
- **Entrega:** palco de batalha (chão, fundo, luz, névoa) no padrão HD-2D aprovado, câmera fixa de batalha, posições do grupo e dos inimigos, pronto para receber sprites.
- **Pronto quando:** roda no navegador a 60 fps na máquina de referência (D-022); aprovado pelo 10.
- **Depende de:** BL-004 (posições).

### BL-007 · Poses de batalha do Edric — P0 · 04 (10 aprova) · M · proposto
- **Entrega:** poses/animações de batalha geradas por código (parado em guarda, atacar, habilidade, sofrer dano, caído, vitória), no padrão do Edric aprovado (D-030), com metadados.
- **Pronto quando:** `npm run validar` passa; preview aprovado pelo 10.
- **Depende de:** BL-004 (lista de poses).

### BL-008 · Controlador de batalha + transição mundo ↔ batalha — P0 · 03 (apoio 13 e 08) · G · proposto
- **Entrega:** controlador da rodada em `src/jogo/` (simulação pura, testada), IA simples do inimigo, gatilho no mapa (13; ponto fixo ou passos, sem tabela de encontros ainda) que leva à batalha e volta ao mapa com o resultado; integração com motor/UI pelo 08.
- **Pronto quando:** dá para jogar a batalha do início ao fim no navegador (vitória e derrota), `npm test` e `npm run build` passam, sem erro no console.
- **Depende de:** BL-004; usa BL-005/006/007 ou substitutos.

## P0 — fecham o M1 (onda 2)

### BL-009 · Sprite + poses de batalha da Grace — P0 · 04 (10 aprova) · M
- Grace no padrão do Edric (célula 96, rosto em molde), poses de batalha incluindo cura. Depende de BL-004.

### BL-010 · Sprite + poses do inimigo do M1 — P0 · 04 (10 aprova) · P
- O inimigo escolhido na BL-004 (D-023), com poses de batalha. Depende de BL-004.

### BL-011 · Playtest do M1 — P0 · 09 · M
- Roteiro de teste, medição (fps, erros), relatório passa/não passa para o critério do M1. Depende de BL-008 a BL-010.

### BL-012 · Bíblia e CLAUDE.md alinhados aos turnos — P0 · 01 · P
- A Bíblia ainda fala em "combate de ação em tempo real", "esquiva e timing" e "Grace sem lutar"; alinhar a D-028/D-031. Sem dependências.

## P1 — antes do M2 / M3

| ID | Item | Dono (apoio) | Custo | Marco | Depende de |
|---|---|---|---|---|---|
| BL-013 | Revisão dos documentos dos agentes pós-turnos (o que sai do tempo real) | 03, 06, 07, 04, 09 | M | M1–M2 | BL-004 |
| BL-014 | `CHANGELOG.md`, tag `v0.1.0` do esqueleto e README com turnos | 11 | P | M1 | BL-012 |
| BL-015 | Pendências do Edric: oeste espelhado, mapa de relevo, 5 cores novas (D-030) | 04 (10) | M | M2 | — |
| BL-016 | Polir animação e gráficos do esqueleto (D-027) | 04, 07 (10) | M | M2 | — |
| BL-017 | Cena-modelo de batalha: efeitos, pós, som de golpes | 10, 07, 05 | G | M2 | M1 |
| BL-018 | Lista de assets do slice com donos (`01_lista_assets.md`) | 01 (11) | P | M2 | BL-004 |
| BL-019 | Encontros aleatórios e zonas de encontro | 13, 14 | M | M3 | BL-008 |
| BL-020 | Os 5 inimigos comuns: fichas, IA, sprites (D-023) | 06, 03, 04 | G | M3 | M1 |
| BL-021 | Chefe Hollowpaw: ficha, IA, sprite, cena | 06, 03, 04, 07 | G | M3 | BL-020 |
| BL-022 | Mapas do slice: vila em 3 estados (D-019/D-026), região, masmorra | 14, 07 | G | M3 | M2 |
| BL-023 | Missões, diálogos e textos do slice | 13, 02, 15 | G | M3 | BL-022 |
| BL-024 | Save local completo (versão, migração, exportar/importar) | 13, 08 | M | M3 | BL-023 |
| BL-025 | Música e SFX do slice | 05 | G | M3 | M2 |
| BL-026 | Itens, inventário e progressão do slice | 06, 15 | M | M3 | BL-004 |

## P2/P3 — depois do slice (ideias do usuário)

### BL-001 · Habilidades que evoluem pelo uso — P2 · 06 · G · depois do M3 (2026-10-26)
- **Ideia (usuário):** a habilidade muda conforme **como o jogador a usa**. Ex.: **Golpe** → finalizar inimigos vira **Execução**; contra inimigos protegidos vira **Quebra-guarda**; protegendo aliados vira **Contra-ataque**. Extensão possível: combinações/reações (fogo explode; eletricidade conduz em molhados).
- **Avaliação do Produtor:** viável se as evoluções forem **predefinidas** e poucas: contadores de uso por contexto (eventos `dano`, `morreu`, `golpe_acertou`), tabela de evoluções em dados (`evolui_para` + condição + limiar), interface de progresso; custo de conteúdo multiplica (habilidades × ramos). Combina com o grupo e com a história do Edric.
- **Preparar agora (barato):** habilidades por ID desacopladas do herói (D-004); save guarda contadores por habilidade. Não implementar antes do slice.
- **Em aberto:** classe/evolução do Edric.

### BL-003 · Versão remaster com arte refeita — P3 · 04, 10 · G · futuro (2026-10-27)
- **Ideia (usuário):** depois do jogo pronto, refazer a arte (editor de pixel art ou IA de imagem local). Hoje tudo é por código (D-029).
- **Cuidados:** registrar a origem de cada asset, revisar termos de IA (Bíblia §10.3), manter IDs e formato dos sprites para trocar arquivos sem mexer no jogo.

## Fechados

- **BL-002 · Combate em turnos estilo Breath of Fire** — decidido em D-028 e detalhado em D-031 (rodadas, encontro aleatório, Grace luta). Vira as tarefas BL-004 a BL-011.

## Itens da demo v0.1.x (D-034, 2026-10-28)

| ID | Tarefa | Donos | Versão |
|---|---|---|---|
| BL-027 | Minimapa no jogo | 15, 08 | v0.1.2 |
| BL-028 | Baús de tesouro e estado do mundo serializável | 13, 14, 08 | v0.1.3 |
| BL-029 | NPCs da vila, janelas de diálogo, inventário e menu | 02, 04, 13, 15 | v0.1.4 |
| BL-030 | Lojas e moeda do jogo | 06, 02, 15 | v0.1.4 |
| BL-031 | Sistema de missões e diário; missões de coleta e caça | 13, 02, 15, 06 | v0.1.6 |
| BL-032 | Sistema de cenas (câmera e diálogo) e cena pós-batalha com final alternativo (poupar) | 08, 02, 07 | v0.1.8 |
| BL-033 | Geração de campos e masmorras por regras (vegetação, caminhos, salas, sementes) para expandir depois do slice (D-044) | 14, 08, 07 | pós-slice |
