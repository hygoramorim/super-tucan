# Super Tucan - Fluxo de Trabalho

## Retomada de uma sessao

```bash
cd ~/Projects/super-tucan
git status --short
git pull --ff-only
```

Leia:

```bash
sed -n '1,220p' README.md
sed -n '1,260p' ARQUITETURA.md
sed -n '1,220p' docs/PROJETO.md
sed -n '1,220p' docs/ROADMAP.md
```

Se a tarefa envolver sugestoes dos jogadores:

```bash
node ler-sugestoes.js
sed -n '1,220p' SUGESTOES.txt
```

## Desenvolvimento local

```bash
python3 -m http.server 8099
```

Abrir:

```text
http://localhost:8099/index.html?v=dev
```

Use `?v=` para furar cache.

## Validacao antes de publicar

```bash
node -e "const fs=require('fs'); const html=fs.readFileSync('index.html','utf8'); const m=html.match(/<script>([\s\S]*)<\/script>/); if(!m) throw new Error('script nao encontrado'); new Function(m[1]); console.log('JS OK');"
git diff --check
node gerar-preview.js
node -e "const fs=require('fs'); const html=fs.readFileSync('preview/jogo-para-preview.html','utf8'); const m=html.match(/<script>([\s\S]*)<\/script>/); if(!m) throw new Error('script nao encontrado'); new Function(m[1]); console.log('PREVIEW JS OK');"
```

## Publicacao

1. Atualize `GAME_VERSION` em `index.html`, sempre somando `0.01` por push: `5.14`, `5.15`... `5.99`, depois `6.01`.
2. Atualize `ARQUITETURA.md` se houver mudanca de regra, fase, boss, item ou arquitetura.
3. Rode as validacoes.
4. Commit e push:

```bash
git add index.html README.md ARQUITETURA.md docs CLAUDE.md
git commit -m "tipo: descricao curta"
git push origin main
```

5. Confirmar GitHub Pages:

```bash
curl -s https://hygoramorim.github.io/super-tucan/ | grep -o "GAME_VERSION = '[^']*'"
```

## Padrao de commits

Sugestoes simples:

- `feat: adiciona fase do lago`
- `fix: corrige colisao da cobra`
- `tune: suaviza fisica do lago`
- `art: ajusta desenho do urubu`
- `docs: organiza retomada do projeto`

## Checklist de release

- [ ] `GAME_VERSION` atualizado.
- [ ] `ARQUITETURA.md` atualizado quando necessario.
- [ ] `README.md` sem informacao desatualizada.
- [ ] JS principal validado.
- [ ] Preview gerado quando houve mudanca visual.
- [ ] Preview validado.
- [ ] Commit feito.
- [ ] Push enviado.
- [ ] Versao confirmada no GitHub Pages.
