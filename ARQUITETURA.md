# 🦜 SUPER TUCAN REMASTERED — Guia de Arquitetura & Retomada

> Documento técnico para **retomar o desenvolvimento** com segurança. Leia isto antes
> de mexer no jogo. O README.md é o guia público/da comunidade; este aqui é o mapa interno.

**Versão atual:** `v5.27` · **Studio:** CISCO GAMES · **Game Designer:** Cisco (Francisco, 9 anos)
**Repo:** https://github.com/hygoramorim/super-tucan · **Jogo no ar:** https://hygoramorim.github.io/super-tucan/

---

## 1. O que é (em uma frase)

Flappy Bird brasileiro, cartoon, **arquivo único** `index.html` (~5100 linhas, Canvas 2D, sem build,
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
| GAME_VERSION | 4647 | **Bump a cada push** pelo padrão `5.14`, `5.15`... `5.99`, `6.01` e confirme no ar via curl. |

## 5. Sistemas de gameplay (resumo)

- **Biomas:** 1–5 têm distância fixa (`p.dist`); ao percorrer, `phaseIdx++`. O 6º (Pantanal) é
  infinito e ganha "níveis" a cada 15s (`p3Level`, teto 10).
- **Bossfights Urubu/Cobra** (ideias do Cisco/Tucano/Guilherme): depois do 3º bioma e no Pantanal,
  o jogo agenda um **portal em tronco oco**. Galhos/ovos/power-ups param durante a leitura do portal;
  entrar pelo buraco teleporta para uma arena curta: Cemitério Cartoon para o Urubu, Toca da Cobra para
  a Cobra. Não há ovos normais dentro da bossfight. Ao vencer, o jogador recebe bônus fixo não
  multiplicável (`+180` no Urubu, `+220` na Cobra). O Urubu também concede `×3` por `4200` de distância,
  sem multiplicador permanente de score para manter o ranking honesto.
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
- **Eventos:** tempestade, vulcão, noite de 30s, terremoto e eventos do ET. +
  nave do ET e clique no ET (noite mágica 15s + ovos `×2` por 15s).
- **Economia de ovos:** carteira persistente (`superTucan_eggBank`) → loja de acessórios e pets.
- **Amiguinhos:** aves equipadas seguem o tucano e têm hitbox apenas de coleta (ovos/power-ups);
  não colidem com galhos, inimigos ou projéteis.
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
5. Bump `GAME_VERSION` pelo padrão novo (`+0.01` a cada push: `5.14`, `5.15`... `5.99`, `6.01`), commit (com crédito ao Francisco quando a ideia for dele), `git push origin main`.
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
- **v5.9** — onda de polimento: HUD mais legível, contornos cartoon no tucano/galhos, telegráficos
  de boss com alvo travado, selo cosmético de boss vencido e refactors seguros em loja/pets, `draw()`
  e cobras decorativas.
- **v5.9.1** — hitbox do tucano reforçada como proporcional ao tamanho das comidas; amiguinhos equipados
  agora coletam ovos e power-ups com hitbox própria.
- **v5.10** — rodada Cisco: vulcão com bolas de fogo centralizadas/letais, noite de 30s, ET com bônus
  `×2` por 15s, combo zerando ao perder ovo comum/dourado, Urubu com bônus pós-boss e Cobra
  com ciclo de ataques por veneno, rabada, ovo e mordida.
- **v5.10.1** — galhos ajustados visualmente: copas de folhas cobrem as pontas da madeira para não
  deixar tocos aparentes na abertura segura.
- **v5.10.2** — cobertura das pontas dos galhos ficou maior, mais larga e mais "gordinha", como um
  maço de folhas sobre a madeira.
- **v5.13** — pacote Cisco: vulcão com tremor-aviso antes das bolas de fogo, novo evento Terremoto,
  água turbinada (jogo mais lento, pulo alto, escudo de 5s e pontos `×2`), nave anunciando o ET
  5s antes da moitinha, clique no ET com noite/pontos `×2`/gravidade baixa, créditos das ideias,
  6 acessórios novos e 6 novas aves brasileiras na lojinha.
- **v5.13.1** — ajustes de design do Cisco: ET exposto por 1,5s, UFO com raio de abdução, Urubu mais
  bravo, gavião redesenhado, jiboia corrigida, coruja-buraqueira própria, óculos/cachecol/mochila/fone
  reposicionados e remoção de Seriema/Asa Brilhante da lojinha.
- **v5.13.2** — build temporária de teste: Cobra antecipada para o segundo bioma antes do Urubu.
- **v5.13.3** — Chefã Cobra virou Anaconda: ovos coletáveis e ovos nocivos com cobrinhas, rabadas
  com alerta `!!!`, mordidas horizontais por faixa e visual maior/mais assustador.
- **v5.13.4** — ajustes de design: ET com ciclo 1,5s exposto/2s escondido, jiboia com movimento
  corrigido, brigadeiro desenhado como bolinha granulada brilhante, Urubu só com bico e remoção de
  Coruja-buraqueira, Cachecol, Mochilinha e Fone da lojinha.
- **v5.13.5** — refactor da Chefã Anaconda: rabada substituída por língua vermelha rápida com alerta,
  ovos lançados em sequência reta e rápida, mordida saindo de fora da cena por três faixas horizontais
  e visual da cobra mais escuro/agressivo.
- **v5.13.6** — árvores de primeiríssimo plano agora têm troncos prolongados para fora da tela, sem
  raízes ou base visível.
- **v5.13.7** — ovos, joias, frutas e power-ups comuns passam a respeitar distância mínima de 200px
  entre itens coletáveis para evitar sobreposição visual.
- **v5.13.8** — lua e estrelas da noite foram movidas para o layer de fundo do cenário, antes de
  nuvens, parallax, obstáculos e personagens.
- **v5.13.9** — estrelas do céu noturno distribuídas de forma pseudoaleatória e estrela cadente no
  fundo a cada 8 segundos.
- **v5.13.10** — Chefã Anaconda: língua pequena some durante a linguada grande; mordida virou projeção
  fantasma/espiritual e causa tremor de tela ao ser lançada.
- **v5.13.11** — revisão/otimização leve: estrelas noturnas pré-calculadas e checagem de distância
  entre itens sem alocação temporária por tentativa.
- **v5.13.12** — Chefã Anaconda com +4s entre ataques, ovos em trajetória curva/não linear e linguada
  maior/larga com alarme mais visível e +2s de antecipação.
- **v5.13.13** — mordida fantasma da Chefã Anaconda agora alterna corretamente entre as três faixas
  horizontais, em vez de ficar presa na faixa inferior.
- **v5.13.14** — ritmo da Chefã Anaconda recalibrado: intervalo extra entre ataques reduzido para 2s
  e linguada com alerta/execução mais rápidos.
- **v5.13.15** — arquitetura dos bosses ajustada: Cobra obrigatória entra direto no Pampas sem portal,
  Urubu volta a ser portal opcional, mordida fantasma atravessa a tela e ossos do Urubu ficam rápidos
  em linha reta, sem gravidade.
- **v5.13.16** — Urubu: remoção da plaquinha/seta do topo, recompensa `×3` pelos próximos 2 biomas e
  lançamento aleatório de super ovos de Urubu coletáveis valendo 25 pontos.
- **v5.13.17** — Urubu arremessa 1/3 mais frequentemente; ossos voam 20% mais rápido que super ovos;
  super ovo ganhou festa visual com luzes, confetes e `+25` grande piscando.
- **v5.13.18** — Vulcão mais justo: bolas de fogo menos numerosas, mais diagonais e mais lentas; no
  celular vertical, arremessos do Urubu ficam 30% mais lentos e espaçados.
- **v5.13.19** — ajuste mobile vertical da Cobra com revisão de agente especialista: cabeça presa à
  borda direita, corpo recortado para fora da tela e origens de língua/ovos clampadas para manter leitura.
- **v5.13.20** — Vulcão virou efeito de fundo: bolas de fogo não colidem mais com o Tucano e explodem
  como fogos de artifício ao tocar o chão.
- **v5.13.21** — itens extras além dos ovos agora têm 33% de chance de surgir a cada 3 galhos,
  mantendo distância mínima de 200px entre coletáveis.
- **v5.13.22** — sistema de Amigos evoluiu para "Meu Bando": convite por código, pedidos com aceite,
  remoção da busca pública por nome e recompensa local controlada para os primeiros vínculos.
- **v5.13.23** — ventania removida dos eventos, alimentos dobrados dentro dos itens extras e toque no
  ET agora também bate asa/subindo o tucano.
- **v5.13.24** — correção de alvo: a redução de dificuldade foi aplicada aos pássaros inimigos letais
  do Pantanal, com frequência pela metade, mantendo a fauna/revoadas decorativas do cenário.
- **v5.13.25** — pássaros inimigos letais do Pantanal agora nascem fora da abertura segura entre galhos
  e preferem faixas afastadas da altura atual do tucano, evitando fechar o trajeto normal.
- **v5.13.26** — antes de qualquer bossfight, se o jogador estiver em celular vertical, o jogo congela
  e mostra uma animação pedindo para virar para horizontal; após virar, um toque inicia a arena.
- **v5.13.27** — correção do spawn de alimentos: chance real de item extra subiu para 66% a cada
  3 galhos, 80% desses itens são alimentos e o posicionamento tenta áreas longe dos ovos.
- **v5.13.28** — alimentos mais presentes e justos: chance de item extra em 75%, 85% viram alimentos,
  distância para ovos reduzida para 1/3, spawn dentro da abertura longe das folhas e sem repetir alimento.
- **v5.13.29** — Pampas ganhou evento exclusivo de Neve: cenário fica branquinho, flocos caem e o
  tucano fica mais pesado, com queda e pulo afetados como na chuva.
- **v5.13.30** — nova fase `LAGO CRISTALINO` após o Cerrado: entrada com placa "MERGULHE", fase
  subaquática fácil de ~60s, parallax aquático, peixes/animais brasileiros, plantas como obstáculos,
  snorkel/bolhas no Tucano e música feliz de tema aquático.
- **v5.13.31** — plantas/algas do Lago Cristalino ganharam paleta arco-íris, brilho e folhas coloridas
  para reforçar o visual multicolorido da fase.
- **v5.13.32** — Lago Cristalino otimizado para não travar ao entrar na água: modo leve automático em
  telas menores/retina, menos gradientes/animais/bolhas por frame e algas arco-íris mais legíveis.
- **v5.13.33** — corte extra de ~50% no peso visual do Lago Cristalino: DPR máximo reduzido, modo leve
  sempre ativo no lago, menos raios/rochas/plantas/animais/bolhas e snorkel mais leve.
- **v5.13.34** — tutorial passou a incluir uma sequência curta do Lago Cristalino; a fase do lago foi
  refatorada para pesar como os demais biomas, sem fauna terrestre/insetos/revoadas na água.
- **v5.13.35** — Lago bonito leve v2: mais peixes simples, tartaruguinha aquática discreta, bolhas
  limitadas e algas um pouco mais coloridas sem reativar fauna terrestre ou render pesado.
- **v5.13.36** — física de entrada no Lago suavizada para dar tempo de adaptação ao jogador, com peso
  da água progressivo, mergulho inicial menos brusco e baiacu aquático leve no fundo.
- **v5.13.37** — alimentos passaram a pontuar como ovos especiais: valem 2 pontos base, entram no
  combo acumulativo, recebem multiplicadores ativos e mostram `+N 🥚` ao serem coletados.
- **v5.13.38** — festa de pontuação ajustada para acontecer apenas a cada 100 pontos: o placar pulsa,
  ganha destaque visual e toca uma musiquinha de conquista mais rápida/ritmada a cada novo marco.
- **v5.14** — padrão de versionamento simplificado: a partir de agora cada push avança `+0.01`
  (`5.14`, `5.15`... `5.99`, depois `6.01`), sem usar terceiro número de patch.
- **v5.15** — créditos das ideias atualizados para incluir a Juju como autora da ideia da fase do
  Lago Cristalino.
- **v5.16** — rebalanceamento de pontuação para tornar ~3000 pontos mais acessível após dois bosses:
  combo sobe em 4/8/12 coletas, alimentos valem 3 pontos base, ovo bônus entre galhos sobe para 50%,
  bosses dão bônus fixo não multiplicável e o bônus `×3` do Urubu passa a durar 4200 de distância.
- **v5.17** — Pantanal infinito ficou mais desfrutável: crescimento total de velocidade limitado a
  ~15%, galhos apertam muito menos, teto final de velocidade menor e ovos/alimentos ganham bônus
  progressivo por ciclo (`×1.0` até `×2.0`) para recompensar permanência.
- **v5.18** — hitbox do Tucano passa a acompanhar integralmente o tamanho visual das comidas:
  brigadeiro aumenta corpo/bico/coleta proporcionalmente e alface reduz esses alcances na mesma escala.
- **v5.19** — adicionada fase bônus aleatória `OVER THE RAINBOW`: 15s de céu aberto com nuvens,
  arco-íris, timer regressivo e tela cheia de ovos/alimentos para farmar pontos; surge entre os
  primeiros biomas e reaparece a cada 4 ciclos, com placar festivo ao final.
- **v5.20** — fase bônus ficou mais limpa visualmente: pop-ups de pontos, combo, comidas e marcos
  de 100 são silenciados durante os 15s, mantendo contador fixo e festa final.
- **v5.21** — criado Modo Treino: fica somente na Amazônia em ciclo infinito, usa dificuldade mais
  aberta, pontuação vale metade do normal e não envia resultado ao ranking global.
- **v5.22** — adicionada a variação bônus `JARDIM DOS GIRASSÓIS`, inspirada pela Juju: 15s em um
  campo ensolarado com parallax leve, girassóis, abelhas decorativas, mais alimentos e coleta calma
  alternando com `OVER THE RAINBOW` sem alongar a rota principal.
- **v5.23** — Jardim dos Girassóis reposicionado para aparecer mais cedo: a primeira fase bônus agora
  entra logo após a Amazônia e é sempre o Jardim; nas próximas aparições, o Jardim também tem maior
  chance que o arco-íris.
- **v5.24** — sistema de fases bônus oficializado com duas fases intercaladas entre biomas/ciclos:
  `JARDIM DOS GIRASSÓIS` primeiro, depois `OVER THE RAINBOW`, repetindo em rotação fixa a cada
  3 transições após a primeira aparição.
- **v5.25** — mensagens numéricas de ganho de pontos em floaters/HUD de bônus passaram de `🥚` para
  `PTS`, evitando que o emoji do ovo suba sobre o texto e prejudique a leitura.
- **v5.26** — adicionada festa especial a cada 1000 pontos conquistados: pulso maior no score,
  confete ampliado, som de conquista mais cheio e mensagem destacada, mantendo a festa menor de
  100 em 100 pontos.
- **v5.27** — amiguinhos/pets passam a voar realmente atrás do Tucano, com deslocamento horizontal
  próprio e hitbox/aura de coleta acompanhando a nova posição visual.
