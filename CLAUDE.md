# SUPER TUCAN - Guia rapido para agentes

Este arquivo existe para qualquer agente de IA retomar o projeto com contexto, cuidado e sem quebrar o que ja esta funcionando.

## Projeto

- Nome: **Super Tucan Remastered**
- Studio: **CISCO GAMES**
- Game Designer: **Cisco / Francisco**
- Repo: https://github.com/hygoramorim/super-tucan
- Jogo publicado: https://hygoramorim.github.io/super-tucan/
- Stack: HTML + CSS + JavaScript em arquivo unico (`index.html`), Canvas 2D, sem build.
- Versao atual no codigo: procurar `GAME_VERSION` em `index.html`.
- Versionamento: a cada push, avance `GAME_VERSION` em `+0.01`. Exemplo: `5.14`, `5.15`... `5.99`, depois `6.01`. Nao usar terceiro numero de patch.

## Antes de mexer

1. Leia `README.md`, `ARQUITETURA.md` e `docs/README.md`.
2. Confira estado do git:
   ```bash
   git status --short
   ```
3. Se for rodada com sugestoes dos jogadores, rode:
   ```bash
   node ler-sugestoes.js
   ```
4. Preserve alteracoes existentes do usuario. Nao reverta arquivos sem pedido explicito.

## Regras importantes

- O jogo deve continuar mobile-first: toque faz o tucano voar.
- `index.html` e um arquivo unico por escolha de simplicidade e deploy no GitHub Pages.
- O desafio diario depende de determinismo. Use:
  - `rng()` para sorteios que afetam gameplay, ranking ou desafio.
  - `Math.random()` apenas para cosmeticos, particulas e decoracao.
- O Lago Cristalino precisa permanecer leve: nada de fauna terrestre na agua, poucos objetos animados e desenho barato por frame.
- Bosses:
  - Cobra/Anaconda e obrigatoria nos Pampas.
  - Urubu e opcional via portal.
  - Antes de bossfight em celular vertical, o jogo deve sugerir virar para horizontal.

## Validacao minima

```bash
node -e "const fs=require('fs'); const html=fs.readFileSync('index.html','utf8'); const m=html.match(/<script>([\s\S]*)<\/script>/); if(!m) throw new Error('script nao encontrado'); new Function(m[1]); console.log('JS OK');"
git diff --check
node gerar-preview.js
node -e "const fs=require('fs'); const html=fs.readFileSync('preview/jogo-para-preview.html','utf8'); const m=html.match(/<script>([\s\S]*)<\/script>/); if(!m) throw new Error('script nao encontrado'); new Function(m[1]); console.log('PREVIEW JS OK');"
```

## Publicacao

O GitHub Pages publica a partir da branch `main`.

Antes de commitar, atualize `GAME_VERSION` seguindo o padrao do projeto: `+0.01` por push.

```bash
git add index.html README.md ARQUITETURA.md docs CLAUDE.md
git commit -m "docs: organiza retomada do projeto"
git push origin main
```

Depois confirme a versao no ar:

```bash
curl -s https://hygoramorim.github.io/super-tucan/ | grep -o "GAME_VERSION = '[^']*'"
```

## Onde documentar

- `README.md`: explicacao publica do jogo e sugestoes da comunidade.
- `ARQUITETURA.md`: mapa tecnico profundo, historico e restricoes.
- `docs/README.md`: indice da pasta de documentacao.
- `docs/PROJETO.md`: estado atual do produto, universo e regras de design.
- `docs/ROADMAP.md`: proximas evolucoes organizadas por prioridade.
- `docs/FLUXO-DE-TRABALHO.md`: rotina para desenvolver, testar e publicar.
