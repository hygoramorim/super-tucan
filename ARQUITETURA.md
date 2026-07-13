# 🦜 SUPER TUCAN REMASTERED — Guia de Arquitetura & Retomada

> Documento técnico para **retomar o desenvolvimento** com segurança. Leia isto antes
> de mexer no jogo. O README.md é o guia público/da comunidade; este aqui é o mapa interno.

**Versão atual:** `v5.8.1` · **Studio:** CISCO GAMES · **Game Designer:** Cisco (Francisco, 9 anos)
**Repo:** https://github.com/hygoramorim/super-tucan · **Jogo no ar:** https://hygoramorim.github.io/super-tucan/

---

## 1. O que é (em uma frase)

Flappy Bird brasileiro, cartoon, **arquivo único** `index.html` (~4650 linhas, Canvas 2D, sem build,
sem dependências), rodando em GitHub Pages. Um tucano voa por 6 biomas do Brasil coletando ovos,
desviando de galhos e enfrentando eventos e um chefão.

## 2. Como rodar, testar e publicar

```bash
cd ~/Projects/super-tucan

# rodar local
python3 -m http.server 8099
# abrir http://localhost:8099/index.html?v=qualquercoisa   (o ?v= fura o cache)

# publicar (GitHub Pages republica sozinho ao dar push na main)
git add -A && git commit -m "..." && git push origin main
# o build do Pages leva ~1-3 min. Confirmar no ar:
curl -s https://hygoramorim.github.io/super-tucan/ | grep -o "GAME_VERSION = '[^']*'"
```

⚠️ **GitHub Pages já esteve DESLIGADO uma vez** (deu 404 no site inteiro). Se voltar a dar 404,
   não é o código — é a config. Religar: `gh api -X POST repos/hygoramorim/super-tucan/pages -f 'source[branch]=main' -f 'source[path]=/'`

## 3. Estrutura de arquivos

| Arquivo | Papel |
|---|---|
| `index.html` | **O JOGO INTEIRO** (HTML + CSS + JS num `<script>` clássico, não module). Tudo mora aqui. |
| `README.md` | Descrição pública + seção de sugestões da comunidade (sincronizada). |
| `ARQUITETURA.md` | Este documento. |
| `SUGESTOES.txt` | Sugestões dos jogadores em texto puro (sincronizado do Firebase). |
| `ler-sugestoes.js` | `node ler-sugestoes.js` → baixa `/ideas` do Firebase e grava em SUGESTOES.txt + README.md. Rodar a cada nova versão. |
| `monitor-sugestoes.js` | Cron diário (9h) que avisa no Telegram/Kairos quando chega sugestão nova. Usa `.env` do Kairos. |
| `gerar-preview.js` | Gera a **galeria de personagens** (preview local): copia o index.html expondo as funções de desenho em `window.__PREVIEW__` e trocando `const ctx`→`let ctx`. Rodar `node gerar-preview.js` sempre que a arte mudar. |
| `preview/index.html` | A galeria: carrega a cópia num iframe e desenha cada personagem num mini-canvas usando a arte REAL do jogo. Serve para o Hygor/Cisco darem feedback de design. |
| `.sugestoes-vistas.json` | (git-ignored) IDs de sugestões já avisadas no Telegram. |

## 4. Mapa do código (`index.html`) — âncoras por linha

> Single-file: use estas linhas como índice. Podem deslocar alguns números ao editar;
> confira com `grep -n "function X" index.html`.

| Sistema | Linha aprox. | Notas |
|---|---|---|
| i18n (pt/en/es/zh) — `I18N`, `t(key)` | 326, 374 | 4 idiomas. localStorage `superTucan_lang`. zh tem risco de fonte no canvas. |
| **PHASES** (6 biomas) | 406 | Cada bioma: cores do tucano (`body/wing/beak/eye`), céu, `dist`, `speed`, `gap`, `spacing`, `deco`. Pantanal (índice 5 = LAST) tem `dist: Infinity`. |
| **currentDiff()** (funil de dificuldade) | 454 | Calcula speed/gap/spacing atuais + modificadores `k` (relógio, pena, vulcão, livro, comida, **bossDiffMult**). |
| Firebase (`DB_URL`) | 637 | Realtime DB REST. Nós: `players/` (ranking, 1 por nome), `ideas/` (sugestões). |
| SHOP_ITEMS / PET_ITEMS | 788, 812 | Loja: acessórios e aves companheiras (custam ovos). |
| publishPlayer / ranking | 832 | Ranking global = nó `players/<nome>` com `{best, xp}`. |
| **RNG com seed** — `mulberry32`, `rng()` | 862 | ⚠️ **CRÍTICO** (ver §6). |
| FAUNA / NIGHT_FAUNA | 893, 911 | Fauna decorativa por bioma (dia/noite). Cosmética: usa `Math.random`, nunca `rng()`. |
| FOODS (comidas do Brasil) | 946 | 6 comidas com efeitos +/− por 15s. |
| **queueBossPortal() / spawnBoss()** | 981 | Portal de boss, arena própria e chefões Urubu/Cobra alternados. |
| resetGame() | 1003 | Zera TODO o estado da partida. Ao adicionar variável de partida nova, resete aqui. |
| update() (loop de física/lógica) | 1209 | Coração do jogo. Transição de fase, boss, eventos, colisão, itens. |
| drawET | 3000 | ET de Varginha atrás da moita (clip esconde o corpo agachado). |
| drawBoss / drawSnakeBoss | 3143 | Urubu planando e Cobra chefã. |
| drawToucan | 3516 | Protagonista. Recebe a PHASE inteira como `p` (cores). Chama drawAccessory. |
| drawPet | 3662 | Aves companheiras. Arara-azul e beija-flor têm desenho próprio; resto é genérico. |
| drawAccessory | 3772 | Óculos (grandes, de sol), cartola, capa (Superman), coroa, gravata, laço. |
| draw() (render) | 3940 | Ordem de desenho da cena. |
| GAME_VERSION | 4647 | **Bump a cada release** e confirme no ar via curl. |

## 5. Sistemas de gameplay (resumo)

- **Biomas:** 1–5 têm distância fixa (`p.dist`); ao percorrer, `phaseIdx++`. O 6º (Pantanal) é
  infinito e ganha "níveis" a cada 15s (`p3Level`, teto 10).
- **Bossfights Urubu/Cobra** (ideias do Cisco/Tucano/Guilherme): depois do 3º bioma e no Pantanal,
  o jogo agenda um **portal em tronco oco**. Galhos/ovos/power-ups param durante a leitura do portal;
  entrar pelo buraco teleporta para uma arena curta: Cemitério Cartoon para o Urubu, Toca da Cobra para
  a Cobra. Não há ovos dentro da bossfight, e a recompensa é de progresso/celebração/conquista, sem
  multiplicador permanente de score para manter o ranking honesto.
  - Cada boss aumenta a dificuldade **+10% permanente e acumulativa** naquela partida via
    `bossDiffMult() = 1.10 ^ min(bossAppearances, 5)` (aplicado à velocidade em `currentDiff()`).
  - **Tetos (importantes — não remover):** o multiplicador do boss trava em 5 aparições e há
    um teto de velocidade **final** `d.speed = Math.min(d.speed, 7.0)` em `currentDiff()`. Sem eles, o
    `Math.min(5.6, ...)` do Pantanal (que roda ANTES de aplicar `k`) não segura o multiplicador do boss
    e sessões longas ficam injogáveis. (achado do code review da v5.2).
  - Ao nascer numa **transição de fase**, o portal é ENFILEIRADO (`bossQueued`, ~140 frames) em vez de
    entrar já, para o jogador ver primeiro o banner do novo bioma.
- **Power-ups:** pena (veloc.+pontos), escudo, relógio (câmera lenta), água (pulo alto), livro das
  maldições (4 efeitos aleatórios), 6 comidas.
- **Eventos:** ventania, tempestade, vulcão (bolas de fogo), noite. + nave do ET e clique no ET
  (noite mágica 15s).
- **Economia de ovos:** carteira persistente (`superTucan_eggBank`) → loja de acessórios e pets.
- **Ranking:** duas leituras do nó `players/` — recordistas (ovos) e veteranos (XP).

## 6. ⚠️ CONSTRAINTS que NÃO podem ser quebrados

1. **Determinismo da seed do desafio diário.** O desafio diário usa `mulberry32(seed do dia)` como
   `rng()` para sortear a sequência de obstáculos/eventos/itens — **tem que ser idêntica para todos
   os jogadores no mesmo dia**. Regra de ouro:
   - Efeitos **cosméticos** (fauna, insetos, partículas) → use `Math.random()`.
   - Qualquer coisa que **afete o sorteio do desafio** (posição de galho, qual evento, qual item) →
     use `rng()`, e o mesmo cálculo para todos. **Nunca** adicione/remova chamadas de `rng()` no
     caminho do sorteio sem replicar exatamente para todos, senão quebra a paridade do ranking diário.
   - `spawnBoss()` e o gatilho do boss por distância são determinísticos e NÃO usam `rng()` do sorteio
     (o `boneTimer` aleatório é cosmético). Mantenha assim.
2. **Arquivo único.** Não quebrar `index.html` em módulos sem necessidade — o deploy do Pages e o
   preview dependem de ser um arquivo só e `<script>` clássico.
3. **`const ctx` no jogo.** O preview troca por `let ctx` só na cópia. Não mudar no jogo publicado.
4. **Mobile-first:** toque = voar. Não introduzir controles que dependam de teclado/mouse.

## 7. Firebase (ranking + sugestões)

- **DB:** `https://super-tucan-ranking-2026-default-rtdb.firebaseio.com` (REST, sem SDK).
- **Nós e regras** (publicadas no console do Firebase):
  - `players/<nome>`: 1 registro por nome (`{best, xp}`). Posse do nome é **por device** (não por IP;
    corrige o bug de CGNAT em que usuários do mesmo IP público roubavam nomes).
  - `ideas/<id>`: sugestões. Regra permite **criar+validar**, mas **nega sobrescrever/apagar**
    (`!data.exists()`), protegendo as sugestões. Por isso testes deixados no nó só o Hygor apaga no console.
- **Sugestões → dev:** jogador manda ideia pela tela 💡 IDEIAS → grava em `/ideas` → `node ler-sugestoes.js`
  traz para `SUGESTOES.txt`/README a cada versão. O agente de programação deve LER `SUGESTOES.txt`
  antes de cada release.

## 8. Notificações (Kairos/Telegram)

- `monitor-sugestoes.js` roda via **cron do macOS às 9h** (`crontab -l` para ver): avisa no Telegram
  do Kairos só as sugestões NOVAS (texto completo + quem sugeriu). Depende do Mac estar ligado às 9h.
- Usa `TELEGRAM_BOT_TOKEN` + `OWNER_TELEGRAM_ID` do `~/Projects/kairos/agent/.env` (chamada direta à
  API do Telegram, não depende do bot estar rodando).

## 9. Fluxo recomendado para uma nova rodada de mudanças

1. `node ler-sugestoes.js` — veja o que a comunidade pediu (`SUGESTOES.txt`).
2. Edite a arte/lógica em `index.html`. Efeitos que afetam o sorteio diário → `rng()`; cosméticos → `Math.random()`.
3. Para feedback de **design de personagem**: `node gerar-preview.js` e sirva `preview/index.html`
   (galeria com a arte real; marque "ajustar" nos cards).
4. Valide sem erro de console (Playwright, `?v=` furando cache). Confirme que a **seed diária** não mudou.
5. Bump `GAME_VERSION`, commit (com crédito ao Francisco quando a ideia for dele), `git push origin main`.
6. Aguarde o build e confirme a versão no ar com `curl`.

## 10. Histórico de versões (resumo)

- **v2.2→v2.5** — redesign cartoon dos animais, modo noite, ET de Varginha, insetos, itens (livro/água),
  ET com 3 bossas, ajuste de dificuldade, correção do bug de criação de nome (posse por device).
- **Ondas A/B/C (→ v5.x)** — 3 ondas com as 23 ideias do Francisco: ranking justo (2 abas), combos+escudo,
  poções, vulcão com bolas de fogo, comidas do Brasil, nave do ET, **chefão urubu**, economia de ovos
  (loja + aves companheiras), i18n (4 idiomas).
- **v5.1** — Cisco creditado como Game Designer; correção do bug de espaços no campo de sugestões;
  remoção da voz do tucano; capa animada em 5 frames; pipeline de sugestões (Firebase→README/txt).
- **v5.2** — feedback de arte do Cisco (ET escondido pela moita + pescoço/braços no tronco; asas do urubu
  simétricas/planando; movimento das cobras corrigido; arara-azul e beija-flor redesenhados; óculos de
  sol grandes; capa estilo Superman). + **Boss a cada 3 biomas** com dificuldade +10% acumulativa por
  aparição. + galeria de preview de personagens (`gerar-preview.js`).
- **v5.3** — campo de texto da tela 💡 IDEIAS ampliado de 240 para 720 caracteres (3×), mantendo
  sincronização Firebase → `SUGESTOES.txt`/README.
- **v5.8** — plano das sugestões: portal de boss, arena Cemitério/Toca da Cobra, chefã Cobra alternada
  com o Urubu, bossfight sem ovos, recompensa sem inflar ranking, conquistas e tradução expandida para
  gameplay, loja, amigos, ranking e pós-jogo.
- **v5.8.1** — bossfight reduzida de 45s para 30s.
