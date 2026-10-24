# Plano de testes — Dunwick (nome provisório)

> **Status:** RASCUNHO v0.1 (BRF-006, onda 0) · Dono: 09 QA · 2026-10-24
> Ainda não há stack nem build. O que depende do ADR-001 está marcado **[aguarda 08]**.
> Critérios de passa/não passa por marco: [criterios_marcos.md](criterios_marcos.md). Roteiro de playtest do M1: [playtests/roteiro_m1.md](playtests/roteiro_m1.md).
> Hierarquia: usuário > Bíblia (`docs/00_biblia_projeto.md`) > documento do agente dono.

## 1. Objetivo e princípios

Garantir qualidade **verificável** em cada marco: encontrar, reproduzir, medir e recomendar ao Produtor (01) **passa / passa com riscos / não passa**. O QA não corrige bugs nem decide escopo.

1. Testar cedo e sempre (desde o M1).
2. Automatizar o repetível; testar à mão o que depende de sensação.
3. Todo bug corrigido ganha teste de regressão quando possível.
4. Nunca "tudo ok" sem a lista do que **não** foi testado.

## 2. Ambiente de teste

### 2.1 Máquinas
| Classe | Uso | Máquina |
|---|---|---|
| **Intermediária (referência)** | Metas de fps e de tempo de carga | **[aguarda 08/usuário]**. Provisório: GPU integrada recente + Chrome (BRF-001). Registrar sempre a máquina real usada (CPU, GPU, RAM, SO, resolução e taxa de atualização do monitor) |
| Fraca | Perfil Baixo, a partir do M2 | [aguarda 08] |
| Boa | Perfil Alto, a partir do M2 | [aguarda 08] |

O usuário é o único com hardware físico. Por isso, todo teste de desempenho registra a máquina e o monitor (60 Hz × 120/144 Hz muda o teste de passo fixo).

### 2.2 Matriz de navegadores (base: `08_arquiteto-tecnico.md` §8)
| Navegador | Windows | macOS | Desde |
|---|---|---|---|
| Chrome recente | ✔ | ✔ | M1 (Windows) |
| Edge recente | ✔ | ✔ | M1 (Windows) |
| Firefox recente | ✔ | ✔ | M1 (Windows) |
| Safari recente | — | ✔ | M2, **se houver Mac disponível** [aguarda usuário] |

Celular só depois do M5 (fora do slice). Versões exatas anotadas em cada execução.

### 2.3 Ambientes
Desenvolvimento local → teste (link privado) → publicação (`08` §11). M1–M4 em local; M5 também no link de teste; M6 obrigatoriamente fora do ambiente de desenvolvimento.

## 3. Riscos por área (o que mais pode dar errado)

| Área | Risco de qualidade | Liga com | Prioridade de teste |
|---|---|---|---|
| Desempenho do diorama | Luz/sombra/DoF/névoa derrubam o fps | R1 | Alta — medir em todo marco |
| Laço e tempo | Velocidade dependente da taxa do monitor; aba em segundo plano simula tempo perdido | — | Alta no M1 |
| Combate | Golpe que "parece que acertou" e não acerta; aviso curto; atordoamento infinito | R4 | Alta do M1 ao M5 |
| Entrada | Atraso, buffer errado, gamepad perdido ao desconectar | — | Alta no M1 |
| Visual | Pixel borrado/tremendo, sprite flutuando, desfoque no herói | R2, R6 | Alta no M2 |
| Save | Corrupção, migração quebrada, importação insegura | — | Alta no M3/M5 |
| Missões | Soft-lock por ordem de ações; flags inconsistentes após carregar | — | Alta no M3/M4 |
| Navegador | Áudio bloqueado, cache velho, tela cheia/zoom quebram escala | — | Média, sobe no M5 |
| Textos/UI | Chave de texto no lugar do texto; texto +40 % cortado | — | Média no M3/M4 |
| Originalidade | Elemento parecido demais com referências | R5 | Revisão por marco (com 01/10) |

## 4. Pirâmide de testes

| Nível | Cobre | Quem | Quando roda | Ferramenta (descrita, sem stack) |
|---|---|---|---|---|
| Validação de dados e assets | IDs, referências cruzadas, esquemas, paleta, metadados de sprite/áudio | Build (08) | Todo build | Validador de esquema + validadores de assets [aguarda 08] |
| Unidade | Fórmulas (exemplos resolvidos do 06), máquina de estados, buffer, flags, save/migração | 03 + 09 | Todo build | Executor de testes sem navegador [aguarda 08] |
| Integração | Combate completo, carregar área, diálogo → missão, loja, inventário | 03 + 09 | Todo build (rápidos) | Simulação sem render, com entradas gravadas [aguarda 08] |
| Bots | Percurso, combate, teclas aleatórias, combinações de flags | 09 | Rápidos por build; longos 1×/dia | `tools/qa/` (fora do BRF-006) |
| Visual | Capturas de cenas-chave comparadas nos 3 perfis | 09 + 10 | Por marco a partir do M2 | Captura automática em navegador [aguarda 08] |
| Manual | Checklists da §6 + exploração livre | 09 + usuário | Por marco e por entrega relevante | Modo debug do jogo |
| Playtest | Sensação, clareza, diversão | 09 conduz; usuário joga | Por marco (§8) | Roteiro + questionário |

### 4.1 O que o QA precisa do jogo (requisitos de testabilidade, para o 08/03)
Pedidos a outros agentes passam pelo Produtor. Itens que o QA vai precisar, em ordem de necessidade:
1. **Modo debug** ligável por tecla: fps (média e pior 1 %), contador de ticks de simulação, estado atual do herói, caixas (hurtbox verde, hitbox vermelho, pushbox amarelo), entradas recebidas por tick, posição em tiles, câmera lenta e avanço quadro a quadro.
2. **Registro de tempos de quadro** exportável (arquivo ou cópia de texto) para calcular média e pior 1 %.
3. **Semente fixa e gravação/reprodução de entradas** (para reproduzir bugs e rodar bots) [aguarda 08].
4. **Versão/build visível** na tela e no log (para relatórios de bug).
5. Log de erros acessível sem ferramentas de desenvolvedor (painel de debug).

## 5. Casos de teste por sistema (índice)

IDs `TC-<área>-<nnn>`. Cada caso: pré-condição · passos · esperado · método (auto/manual/bot) · marco. Neste rascunho, só o **M1** está detalhado (em [criterios_marcos.md](criterios_marcos.md), seção M1). Os outros são o índice a detalhar quando o sistema existir.

| Área | Faixa | Marco | Fonte dos valores | Situação |
|---|---|---|---|---|
| Plataforma/laço (abrir, passo fixo, aba, redimensionar) | TC-PLT-001… | M1 | 08 §6, §9 | Detalhado no M1 |
| Entrada (teclado, gamepad, buffer, remapeamento) | TC-ENT-001… | M1 | 03 §6.4 | Detalhado no M1 (remapeamento: M4) |
| Movimento e câmera | TC-MOV-001… | M1 | 03 §6.1–6.3 | Detalhado no M1 |
| Combate e justiça | TC-CMB-001… | M1 (herói), M2 (1 inimigo), M3 (todos) | 03 §7, 06 `formulas.md` | Herói no M1; inimigos depois |
| Debug | TC-DBG-001… | M1 | 03 §13, 08 §10 | Detalhado no M1 |
| Visual (diorama) | TC-VIS-001… | M1 (nitidez), M2 (completo) | Guia visual do 10 | Nitidez no M1 |
| Desempenho | TC-DES-001… | Todos | 08 §8 | M1 detalhado; números finais [aguarda 08] |
| Missões e diálogos | TC-MIS-001… | M3 | 02, 06 | Pendente (fora do BRF-006) |
| Save | TC-SAV-001… | M3 | 08 §7 | Pendente |
| UI, acessibilidade e textos | TC-UI-001… | M3/M4 | 07 | Pendente |
| Áudio | TC-AUD-001… | M2/M3 | 05 | Pendente |
| Soft-lock | TC-LCK-001… | M3 | Mapas do 06 | Pendente |

## 6. Checklists por área (manual, a cada marco em que a área existir)

Base: `09_qa.md` §5. Marco indica quando o item passa a ser cobrado.

### 6.1 Combate e justiça
- [ ] (M2) Todo golpe inimigo tem aviso ≥ mínimo do 03/06 (comum 18, forte 36, pesado de chefe 60 quadros)
- [ ] (M1) **Se parece que acertou, acertou**, nas 8 direções
- [ ] (M1) Caixas batem com o visual no modo debug
- [ ] (M1) Cada golpe acerta uma vez por alvo
- [ ] (M2) Sem atordoamento infinito; (M1) invencibilidade da esquiva nos quadros certos
- [ ] (M1) Feedback de impacto presente e proporcional (pausa, flash, recuo; som quando houver)
- [ ] (M3) No máximo 1–2 inimigos atacando ao mesmo tempo
- [ ] (M2) Efeitos do jogador nunca escondem o aviso inimigo

### 6.2 Movimento e câmera
- [ ] (M1) Pés não deslizam; diagonais na mesma velocidade
- [ ] (M1) Sem atravessar paredes nem prender em quinas
- [ ] (M1) Câmera dentro dos limites; (M2) oclusão funciona, herói nunca some
- [ ] (M3) Movimentos de câmera em cenas voltam ao padrão

### 6.3 Visual (diorama)
- [ ] (M1) Pixel nítido em 1×, 2×, 3× e ao redimensionar a janela
- [ ] (M1) Pixels não tremem quando a câmera se move
- [ ] (M1) Sprite iluminado (normal map) e com sombra no chão; não flutua nem afunda
- [ ] (M2) Desfoque não atinge herói, inimigos próximos nem UI
- [ ] (M2) Bonito e legível nos perfis Alto, Médio e Baixo
- [ ] (M2) Flashes ≤ 3 por segundo; opções de reduzir funcionam

### 6.4 Missões e diálogos (M3)
- [ ] Todos os caminhos simulados; nenhuma trava por ordem de ações
- [ ] Flags consistentes depois de salvar e carregar
- [ ] Nenhuma chave de texto no lugar do texto

### 6.5 Save (M3; migração no M5)
- [ ] Salvar/carregar em todos os pontos
- [ ] Fechar a aba durante o salvamento não corrompe
- [ ] Migração de save de versão anterior
- [ ] Exportar/importar; arquivo inválido recusado sem quebrar; conteúdo do save nunca inserido como HTML
- [ ] Armazenamento cheio/bloqueado mostra aviso

### 6.6 Navegador
- [ ] (M1/M2) Áudio só inicia depois do primeiro clique/tecla
- [ ] (M1) Aba em segundo plano pausa jogo (e som) sem simular o tempo perdido
- [ ] (M1) Redimensionar; (M2) tela cheia e zoom sem quebrar a escala inteira
- [ ] (M1) Gamepad conecta/desconecta durante o jogo
- [ ] (M2) Perda do contexto gráfico: recupera ou recarrega sem perder save
- [ ] (M5) Atualização de versão não deixa arquivos velhos no cache

### 6.7 Desempenho (metas do 08 §8)
- [ ] (M1) 60 fps na máquina intermediária; pior 1 % ≥ 45
- [ ] (M3) Cena de pico: 40 inimigos + magias + ~150 partículas
- [ ] (M3) Tempo até jogar ≤ 5–8 s em 10 Mbps; download inicial ≤ ~10 MB
- [ ] (M5) Sessão de 60+ min sem vazamento (memória ≤ 400–600 MB)
- [ ] (M2) Perfil automático escolhe bem; troca manual funciona

### 6.8 UI, acessibilidade e textos (M3/M4)
- [ ] Tudo navegável só com teclado e só com gamepad
- [ ] Remapeamento sem conflitos
- [ ] Textos longos (+40 %) não cortam
- [ ] Modo daltônico, reduzir movimento, legendas
- [ ] Toda tela tem "voltar"

### 6.9 Soft-lock (M3)
Portas, quedas, portais, missões, chefe, falta de dinheiro/itens essenciais: tentar de propósito chegar a um estado sem saída.

## 7. Automação: o que e quando

| Quando | O que roda | Bloqueia o build? |
|---|---|---|
| Todo build | Validação de dados/assets · testes de unidade · integração rápida · bot de teclas aleatórias curto (~2 min) | Sim, se falhar |
| 1×/dia | Bots longos (percurso, combate, flags) · medição de desempenho na cena de referência | Não; gera relatório |
| Por marco | Matriz de navegadores · capturas visuais nos 3 perfis · playtest · checklists da §6 | Decide passa/não passa |

Bots e scripts ficam fora do BRF-006; serão projetados quando a stack existir [aguarda 08].

## 8. Calendário de playtests

Padrão até o usuário responder (D-006): **usuário + bots**. Se houver jogadores reais, a meta volta a ser 5 por rodada (novatos e veteranos de RPG de ação), com gravação só com consentimento.

| Marco | Pergunta principal | Formato | Duração |
|---|---|---|---|
| M1 | Andar e atacar são gostosos? A câmera incomoda? | [Roteiro M1](playtests/roteiro_m1.md) | ≤ 15 min |
| M2 | O visual convence? Dá para ler herói e inimigo com névoa e desfoque? | Roteiro M2 (a escrever) | ≤ 15 min |
| M3 | O ciclo vila → região → masmorra → vila é claro? Sabe o que fazer depois? | Sessão completa do slice | ~1–2 h |
| M4 | História e missões prendem? Dificuldade ok? Som ajuda? | Sessão completa | ~1–2 h |
| M5 | Estável, rápido, acessível em vários navegadores? | Matriz + sessão 60 min | ≥ 60 min |

Relatórios em `docs/qa/playtests/playtest_<marco>_<nn>.md`: achados priorizados, evidência, recomendação por dono. Separar sempre **bug** × **opinião (sensação)** × **sugestão**.

## 9. Bugs

### 9.1 Severidade (a prioridade P0–P3 é do 01)
| Nível | Definição | Exemplo |
|---|---|---|
| **S1 Bloqueador** | Trava, perde save, impede progresso | Preso na masmorra; save corrompido; jogo não abre |
| **S2 Grave** | Sistema importante quebrado, sem alternativa | Missão não conclui; chefe invencível; gamepad para de responder |
| **S3 Médio** | Atrapalha, mas tem alternativa | Colisão ruim; texto cortado |
| **S4 Leve** | Cosmético | Pixel fora do lugar |

### 9.2 Fluxo
Encontrar → reproduzir (≥ 2 vezes, ou registrar "1 vez") → relatório → Produtor prioriza e repassa ao dono → dono corrige → QA verifica na build nova → regressão (teste automático quando possível) → fechar.
Estados: `aberto` · `em correção` · `corrigido (aguarda verificação)` · `fechado` · `não reproduz` · `não é bug`.

### 9.3 Modelo de relatório — `docs/qa/bugs/bug_<nnn>.md`
Numeração sequencial com 3 dígitos (`bug_001.md`). Copiar o bloco abaixo:

```markdown
# bug_<nnn> — <título curto e específico>

- **Estado:** aberto
- **Severidade:** S1 | S2 | S3 | S4 · **Área:** <combate/movimento/…> · **Dono sugerido:** <03/04/…>
- **Versão/build:** <id da build> · **Navegador:** <nome versão> · **Sistema:** <SO> · **Máquina:** <CPU/GPU/RAM, monitor Hz>
- **Encontrado em:** <data> por <QA/usuário/bot>

## Passos para reproduzir
1. …
2. …
3. …

## Esperado × obtido
- **Esperado:** …
- **Obtido:** …

## Frequência
sempre | às vezes (<n>/<m> tentativas) | 1 vez

## Evidência
- Captura/vídeo: <caminho>
- Log do console / painel de debug: <trecho ou caminho>
- Dados relevantes (estado, tick, posição em tiles): …

## Notas
<hipótese, se houver — sem propor correção de código>

## Verificação
- Corrigido na build: … · Verificado por: … em … · Teste de regressão: <id do teste ou "manual">
```

## 10. Pendências deste plano

| # | Pendência | Depende de |
|---|---|---|
| 1 | Máquina de referência e números finais de fps/carga/memória | 08 (BRF-001) / usuário |
| 2 | Ferramentas de teste (executor, captura, gravação de entradas) | 08 (ADR-001) |
| 3 | ~~Valores de movimento/combate do M1~~ — aplicados em `criterios_marcos.md` (2026-10-24) | 03 (`docs/gameplay.md` v0.1) ✅ |
| 4 | Fórmulas e exemplos resolvidos para testes de unidade | 06 (`formulas.md`, BRF-004) |
| 5 | Haverá Mac para Safari? Haverá jogadores reais? | Usuário (via 01) |
| 6 | Projeto dos bots (`tools/qa/`) | Stack + briefing futuro |
