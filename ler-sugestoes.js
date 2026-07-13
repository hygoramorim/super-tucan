#!/usr/bin/env node
// Lê as sugestões dos jogadores (nó /ideas do Firebase) e escreve em SUGESTOES.txt.
// O agente de programação roda isto a cada nova versão pra ver o que a comunidade pediu.
//
//   node ler-sugestoes.js
//
// Requer que o nó /ideas do Firebase esteja liberado para LEITURA pública.

const https = require('https');
const fs = require('fs');
const path = require('path');

const DB_URL = 'https://super-tucan-ranking-2026-default-rtdb.firebaseio.com';
const OUT = path.join(__dirname, 'SUGESTOES.txt');

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (r) => {
      let d = '';
      r.on('data', (c) => (d += c));
      r.on('end', () => {
        if (r.statusCode !== 200) return reject(new Error('HTTP ' + r.statusCode + ': ' + d));
        try { resolve(JSON.parse(d)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

(async () => {
  let data;
  try {
    data = await get(DB_URL + '/ideas.json');
  } catch (e) {
    console.error('⚠️  Não consegui ler /ideas do Firebase:', e.message);
    console.error('    (Se der 401/403, o nó /ideas precisa ser liberado para leitura no console do Firebase.)');
    process.exit(1);
  }

  const ideias = data ? Object.values(data) : [];
  ideias.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));

  const cab = [
    'SUPER TUCAN — SUGESTÕES DOS JOGADORES',
    '=====================================',
    '',
    'Sincronizado do Firebase (nó /ideas). Game Designer: Cisco (Francisco, 9 anos).',
    'Total de sugestões: ' + ideias.length,
    '',
    '---------------------------------------------------------------------------',
    ''
  ];
  const linhas = ideias.length
    ? ideias.map((i, n) =>
        (n + 1) + '. [' + (i.date || 's/data') + '] ' + (i.who || 'ANÔNIMO') + ':\n   ' + (i.text || '').replace(/\n/g, ' '))
    : ['(nenhuma sugestão enviada ainda)'];

  fs.writeFileSync(OUT, cab.concat(linhas).join('\n') + '\n', 'utf8');
  console.log('✅ ' + ideias.length + ' sugestão(ões) escritas em SUGESTOES.txt');
})();
