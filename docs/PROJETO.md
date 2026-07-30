# Super Tucan - Visao do Projeto

## Essencia

Super Tucan e um jogo arcade mobile-first inspirado em Flappy Bird, ambientado em biomas brasileiros, com humor, fauna nacional, eventos climaticos, itens, amigos animais, bosses e sugestoes vindas das criancas que testam o jogo.

O jogo precisa parecer vivo, alegre e brasileiro, mas sem perder a leitura imediata: o jogador deve entender em menos de um segundo o que pode coletar, o que mata e para onde ha passagem.

## Publico

- Criancas testando pela primeira vez.
- Familia e amigos acompanhando rankings.
- Jogadores casuais em celular, principalmente vertical.

## Estado atual

- Stack: `index.html` unico, Canvas 2D, GitHub Pages.
- Ranking e sugestoes: Firebase Realtime Database via REST.
- Biomas/fases:
  - Amazonia
  - Cerrado
  - Lago Cristalino
  - Mata Atlantica
  - Caatinga
  - Pampas
  - Pantanal infinito
- Chefes:
  - Cobra/Anaconda obrigatoria nos Pampas.
  - Urubu opcional via portal.
- Tutorial:
  - inclui treino de voo, ovos, galhos e Lago Cristalino.
- Loja:
  - acessorios e amigos animais comprados com ovos.
  - ate 2 amiguinhos podem estar ativos por partida.
  - amiguinhos coletam itens proximo ao tucano e contribuem para o COMBO (v5.50+).
  - cada ave tem um papel (v5.53+): coletor de ovos, caca-premios ou protetor (salva 1x por partida).
  - nivel de amizade por partidas jogadas com a ave (10/30 partidas), so visual.
- Engajamento diario (v5.53+):
  - 3 missoes por dia, iguais para todos (seed da data), pagas em ovos da lojinha.
  - sequencia de dias jogando o Desafio do Dia, com marcos em 3/7/30 dias.
  - voo rasante: passar rente ao galho alimenta o COMBO (sem pontos diretos).
- Comunidade:
  - jogadores enviam ideias pela tela de sugestoes.

## Direcao de design

- Visual cartoon, cores saturadas e silhuetas muito claras.
- Obstaculos precisam ser reconheciveis mesmo em celular pequeno.
- Itens nao devem ficar sobre galhos, folhas ou perto demais da abertura segura.
- Fauna decorativa enriquece o cenario, mas nao pode parecer colisao injusta.
- Eventos devem avisar antes de punir.
- Bossfight deve parecer especial, mas nao quebrar o ritmo arcade.

## Regras do universo

- O jogo celebra fauna, comida e paisagens brasileiras.
- Elementos fantasticos sao bem-vindos quando combinam com o tom: ET de Varginha, Cobra fantasma, Urubu do cemiterio.
- Violencia deve ser cartoon e leve.
- Recompensas devem ser divertidas, mas sem destruir o ranking.
- O Lago Cristalino deve ser um respiro: fase bonita, facil, multicolorida e leve.

## Cuidados tecnicos

- Manter performance estavel em celular.
- Evitar objetos animados demais no Lago.
- Evitar crescimento descontrolado de estado global.
- Atualizar `GAME_VERSION` a cada push, somando `0.01` no padrão `5.14`, `5.15`... `5.99`, depois `6.01`.
- Atualizar `ARQUITETURA.md` quando mexer em regra importante.
