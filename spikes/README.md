# Spikes do ADR-001 (BRF-001)

Código **descartável** que mede qual stack faz o visual "diorama" (sprite 2D iluminado em cena 3D) a 60 fps no navegador.
**Não é o esqueleto M1.** Resultados e decisão em `docs/tecnico/spikes.md` e `docs/tecnico/decisoes/ADR-001.md`.

Opções com spike: **Three.js** (`three/`) e **Babylon.js** (`babylon/`). PlayCanvas, Godot e Unity foram avaliados no papel (ver ADR-001).

## Rodar

Requisitos: Node 24, Chrome. Placeholders usam `ffmpeg` (opcional, só para o áudio comprimido).

```bash
cd spikes
npm install                 # versões fixas, ver package.json
npm run placeholders        # gera assets/ (sprites + normal map + máscara de brilho, atlas, partículas, áudio)
npm run build               # dist/three.js e dist/babylon.js (esbuild)
npm run servir              # http://localhost:8080  (deixe rodando)
```

Abrir no navegador (parâmetros na URL):

| Spike | URL |
|---|---|
| 1 Sprite iluminado | `/three/?spike=sprite&perfil=alto` · `/babylon/?spike=sprite` |
| 1 Nitidez (1×/2×/3×) | `/three/?spike=sprite&teste=nitidez&escala=3&camera=orto&hud=0` |
| 2 Diorama | `/three/?spike=diorama&perfil=alto` |
| 3 Multidão (40 inimigos + 150 projéteis) | `/three/?spike=multidao&perfil=alto&mover=1` |
| 4 Carregamento | `/three/?spike=carregamento` |
| 5 Áudio | `/three/?spike=audio` (clique em "Pressione para começar") |

Parâmetros: `perfil=alto|medio|baixo` · `escala=1|2|3` · `camera=orto|persp` · `res=nativa|baixa` (baixa = 640×360 interno esticado) · `snap=0|1` · `luzes=N` ·
`pos=dof,bloom,vol,nevoa,cor` (lista vazia = sem pós) · `partilum=1` · `recorte=0|1` · `mover=1` · `w`/`h` · `hud=0` · `sync=0`.

## Medir (automático, Chrome com GPU real)

```bash
node ferramentas/medir.mjs three "spike=multidao&perfil=alto&mover=1" 12 --captura=resultados/x.png   # um caso
node ferramentas/lote.mjs three multidao                                                                # um grupo
sh ferramentas/rodar_tudo.sh                                                                            # tudo (≈ 30 min)
```

Grupos do lote: `nitidez`, `nitidezoz`, `diorama`, `multidao`, `base`, `pos`, `luzes`, `res`, `carregamento`, `audio`.
Saída em `resultados/<opcao>/<caso>.json` + `.png`. `ferramentas/erros.mjs <caminho>` imprime erros do console.

## Método (resumo)

- Laço de passo fixo 60 Hz com acumulador, igual nas duas opções (`comum/laco.js`); simulação, cenário, áudio e medidor são comuns (`comum/`).
- fps = quadros/segundo em Chrome headless com GPU real, **sem limite de vsync**, com `gl.finish()` ao fim de cada quadro (mede CPU + GPU). "Pior 1 %" = fps da média do 1 % de quadros mais lentos.
- 2,5 s de aquecimento + 8–12 s medidos por caso.
- Placeholders são gerados por código, determinísticos; nenhuma arte final.
