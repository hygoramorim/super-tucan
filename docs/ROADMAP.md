# Super Tucan - Roadmap

Este roadmap organiza proximas evolucoes possiveis. Ele nao obriga implementar tudo; serve para decidir o que melhora o jogo sem ferir o universo.

## Prioridade 1 - Qualidade da experiencia

- Testar a fase do Lago Cristalino em celulares diferentes e manter FPS estavel.
- Ajustar curva de dificuldade apos sair do lago para a retomada nao parecer brusca.
- Melhorar leitura de itens perto de folhas, galhos e fauna.
- Revisar balanceamento da Cobra nos Pampas: alerta, tempo de reacao e variedade real das faixas.
- Revisar Urubu em mobile vertical: espacamento, velocidade dos ossos e leitura do super ovo.

## Prioridade 2 - Polimento visual e sonoro

- Criar uma identidade sonora por fase sem trocar a melodia principal.
- Dar efeitos sonoros especificos para:
  - super ovo do Urubu;
  - entrada no Lago;
  - saida do Lago;
  - clique no ET;
  - alerta de boss.
- Melhorar arte de pets compraveis com silhuetas brasileiras mais fieis.
- Criar pequenas animacoes de celebracao para conquistas.

## Prioridade 3 - Amigos animais

- Reavaliar a regra de amigos que seguem o tucano.
- Definir papeis claros:
  - coletor de ovos;
  - coletor de alimentos;
  - protetor ocasional;
  - bonus cosmetico;
  - companheiro raro.
- Evitar que muitos amigos cubram a tela ou confundam colisao.
- Criar limite de amigos ativos por partida.

## Prioridade 4 - Comunidade e progressao

- Separar sugestoes recebidas por status:
  - nova;
  - em avaliacao;
  - aceita;
  - recusada;
  - implementada.
- Mostrar creditos no jogo para ideias implementadas.
- Criar tela simples de changelog para as criancas verem novidades.
- Melhorar conquistas com metas mais claras.

## Prioridade 5 - Arquitetura

- Reduzir o tamanho do `index.html` com refactors internos muito cuidadosos, sem quebrar o arquivo unico.
- Agrupar constantes por sistema: fases, bosses, itens, loja, audio e tutorial.
- Criar helpers para colisao, spawn de itens e desenho de fauna.
- Documentar melhor cada variavel global de partida.

## Ideias a avaliar com cuidado

- Mais bosses: so incluir se tiverem papel claro e nao alongarem demais a partida.
- Mais eventos climaticos: precisam ter alerta, duracao curta e leitura justa.
- Mais fauna letal: usar com parcimonia, porque pode fechar passagens e frustrar.
- Mais efeitos no Lago: incluir apenas se forem baratos para renderizar.

