# Publicação e versionamento

> Mantido pelo Produtor (01) e pelo Arquiteto (08). Criado em 2026-10-26.

## Branches
- **`main`**: versão **oficial e estável**. Só recebe PR vindo da `dev`. Cada PR vira uma tag (`v0.1.0`, `v0.2.0`…).
- **`dev`**: a **próxima versão**. O trabalho do dia a dia é commitado aqui.
- Branches de funcionalidade (`feature/...`) só para mudanças grandes ou arriscadas; entram na `dev` por PR.

## Netlify (site `dunwick`)
| Campo | Valor |
|---|---|
| Repositório | `marcalsantarem/dunwick` |
| Production branch | `main` |
| Base directory | vazio (raiz) |
| Build command | `npm run build` |
| Publish directory | `build/prod` |
| Variável de ambiente | `NODE_VERSION=24` |
| Branch deploys | branch adicional `dev` |

- **Produção:** https://dunwick.netlify.app (branch `main`).
- **Desenvolvimento:** https://dev--dunwick.netlify.app (branch `dev`). Só publica quando há um **novo push** na `dev` depois de ativar o branch deploy.
- O build falha (e a publicação é cancelada) se qualquer teste falhar.
