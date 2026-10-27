<div align="center">

# 🔔 Dunwick

**Um RPG isométrico de combate por turnos, direto no navegador.**
Fantasia medieval original, humor ácido e um sino que nunca devia ter voltado para casa.

[**▶ Jogar a versão estável**](https://dunwick.netlify.app) · [**🧪 Versão em desenvolvimento**](https://dev--dunwick.netlify.app)

![status](https://img.shields.io/badge/status-em%20desenvolvimento-orange)
![versão](https://img.shields.io/badge/versão-v0.1.0-blue)
![classificação](https://img.shields.io/badge/classificação-16%2B-red)
![plataforma](https://img.shields.io/badge/plataforma-navegador-brightgreen)

</div>

---

## 📖 A história

Edric Moss é órfão e o único aluno de um mestre rabugento, o ex-sargento Torvan Keel. O teste final do treinamento é recuperar o **Sino de Cobre**, roubado de Baixo Orvalho no saque que levou os pais de Edric. Ele traz o sino de volta, e é aí que o problema começa: quando o sino toca, **a vila inteira adormece**.

Sem querer, Edric adia o sonho de entrar para a Guarda de Mor-Allen (e a vingança que carrega) para sair atrás de uma curandeira. O que ele encontra é uma feiticeira de feira com mais conversa do que poder, e uma aprendiz que talvez saiba mais do que ela mesma.

*Começa pequena, termina grande.* O primeiro trecho do jogo (o **vertical slice**) cobre a vila, a caverna do urso-musgo, a estrada e a cura. O resto do mundo vem depois.

## ✨ O jogo

- **Visão isométrica HD-2D:** sprites de pixel art nítidos dentro de um cenário 3D com luz, sombras, névoa e profundidade.
- **Combate por turnos** no estilo de RPGs clássicos: cena de batalha com o grupo e os inimigos em sprite, comandos e habilidades. *(em definição; o design de ação em tempo real está arquivado em `docs/arquivo/combate_acao/`)*
- **Exploração isométrica:** clique para andar pelo mundo.
- **Tudo gerado por código:** sprites, texturas, cenário e sons são produzidos por scripts, sem arte externa.
- **Acessível:** tremor, flashes, partículas e desfoque podem ser desligados.

## 🕹️ Jogue agora

| Versão | Endereço |
|---|---|
| Estável (`main`) | https://dunwick.netlify.app |
| Em desenvolvimento (`dev`) | https://dev--dunwick.netlify.app |

**Controles atuais do esqueleto (exploração):** clique no chão para andar, `W A S D` também movem. `F1`–`F12` abrem o modo debug (`F3` mostra o fps, `F12` troca o perfil de qualidade).

> O jogo ainda está no começo. O que existe hoje é a praça de Baixo Orvalho, o herói andando e atacando, e a base técnica. Combate completo, inimigos, chefe e missões estão a caminho.

## 🛠️ Rodar localmente

Requisitos: **Node.js 24 ou mais novo** e o **Chrome**.

```bash
npm install
npm run dev
```

Depois abra http://localhost:5173.

| Comando | O que faz |
|---|---|
| `npm run dev` | servidor local com modo debug |
| `npm test` | testes automáticos |
| `npm run validar` | valida dados e assets |
| `npm run build` | validar, testar, empacotar e gerar o relatório de peso em `build/prod` |
| `npm run preview` | serve a versão empacotada |
| `npm run test:navegador` | verificações no Chrome real |

## 🧱 Tecnologia

JavaScript puro e [Three.js](https://threejs.org), com dados em JSON validados por esquema (Ajv) e empacotamento com esbuild. A simulação roda em passo fixo de 60 Hz e não conhece o desenho; a apresentação lê o estado dela.

```
src/jogo/      simulação pura (sem three nem DOM)
src/motor/     renderização, câmera, luz, pós-processamento
src/ui/        interface
data/          conteúdo em dados (personagens, mapas, textos, configuração)
assets/        sprites, texturas, sons
tools/         validadores, geradores e build
tests/         testes automáticos
docs/          documentos do projeto
```

Mais detalhes em [`docs/tecnico/esqueleto_m1.md`](docs/tecnico/esqueleto_m1.md).

## 🤖 Como o projeto é feito

Dunwick é produzido por **uma pessoa e um time de agentes de IA**, cada um com um papel definido em [`agentes-rpg/`](agentes-rpg/):

| # | Papel | Cuida de |
|---|---|---|
| 01 | Produtor | plano, escopo, marcos, decisões |
| 02 | Roteirista | mundo, personagens, missões, textos |
| 03 | Combate por turnos e IA | Controlador de batalha (rodadas, comandos, ordem), IA dos inimigos e do chefe |
| 04 | Sprites | pixel art gerada por código |
| 05 | Som | efeitos e música sintetizados |
| 06 | Design de Combate e Classes | Classes, habilidades, fórmulas, itens, bestiário, balanceamento com simulações |
| 07 | Cenários | Kit isométrico, props, luz, montagem, cena de batalha |
| 08 | Arquiteto Técnico | arquitetura, dados, desempenho, publicação |
| 09 | QA | testes e critérios por marco |
| 10 | Direção de Arte e VFX | guia visual, paleta, efeitos |
| 11 | Gestor de Backlog e Publicação | Backlog, quadro de tarefas, versões, README, publicação |
| 13 | Exploração, Interação e Missões | Mapa explorável, diálogos, encontros aleatórios, missões, save |
| 14 | Níveis e Mundo | Mapas, métricas isométricas, zonas de encontro |
| 15 | UI/UX | Menus de batalha, HUD, diálogo, controles, acessibilidade |

Tudo é decidido pelo usuário e registrado em [`docs/04_decisoes.md`](docs/04_decisoes.md). A fonte da verdade é a [Bíblia do Projeto](docs/00_biblia_projeto.md).

## 🗺️ Marcos

| Marco | Entrega | Situação |
|---|---|---|
| M0 Fundação | Bíblia, história, guia visual, especificações | ✅ |
| M1 Protótipo | herói anda e ataca numa cena isométrica | 🔄 em andamento |
| M2 Cena-modelo | uma cena com arte final, luz e efeitos | ⏳ |
| M3 Vertical slice | vila, caverna, estrada, chefe, som e história | ⏳ |
| M4 Polimento | game feel, áudio final, tutorial, inglês | ⏳ |
| M5 Beta | testes completos e balanceamento | ⏳ |
| M6 Lançamento | versão publicada | ⏳ |

## 🌿 Branches e versões

- **`main`:** versão oficial e estável. Só recebe pull request vindo da `dev`.
- **`dev`:** a próxima versão. O trabalho do dia a dia acontece aqui.
- Cada versão oficial recebe uma tag (`v0.1.0`, `v0.2.0`…).

Detalhes em [`docs/tecnico/publicacao.md`](docs/tecnico/publicacao.md).

## 📄 Licença

A definir.
