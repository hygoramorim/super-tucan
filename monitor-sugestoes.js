#!/usr/bin/env node
// Monitor de sugestões do SUPER TUCAN.
// Roda 1x/dia (via cron): busca as sugestões novas no Firebase (que ainda não foram
// avisadas) e manda um resumo no Telegram do Kairos com o texto completo + quem sugeriu.
// Guarda os IDs já avisados em .sugestoes-vistas.json pra não repetir.
//
//   node monitor-sugestoes.js
//
// Usa TELEGRAM_BOT_TOKEN + OWNER_TELEGRAM_ID do .env do Kairos.

const https = require('https');
const fs = require('fs');
const path = require('path');

require(path.join(process.env.HOME, 'Projects/kairos/agent/node_modules/dotenv'))
  .config({ path: path.join(process.env.HOME, 'Projects/kairos/agent/.env') });

const DB_URL = 'https://super-tucan-ranking-2026-default-rtdb.firebaseio.com';
const SEEN_FILE = path.join(__dirname, '.sugestoes-vistas.json');
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT = process.env.OWNER_TELEGRAM_ID;

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (r) => {
      let d = ''; r.on('data', c => d += c);
      r.on('end', () => {
        if (r.statusCode !== 200) return reject(new Error('HTTP ' + r.statusCode));
        try { resolve(JSON.parse(d)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}
function tg(text) {
  return new Promise((resolve) => {
    if (!TOKEN || !CHAT) { console.error('⚠️ Telegram não configurado'); return resolve(false); }
    const body = JSON.stringify({ chat_id: CHAT, text, parse_mode: 'Markdown', disable_web_page_preview: true });
    const req = https.request({ host: 'api.telegram.org', path: '/bot' + TOKEN + '/sendMessage', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } },
      (r) => { r.resume(); r.on('end', () => resolve(r.statusCode === 200)); });
    req.on('error', () => resolve(false));
    req.write(body); req.end();
  });
}
function loadSeen() { try { return JSON.parse(fs.readFileSync(SEEN_FILE, 'utf8')); } catch (e) { return []; } }
function saveSeen(ids) { fs.writeFileSync(SEEN_FILE, JSON.stringify(ids), 'utf8'); }

(async () => {
  let data;
  try { data = await get(DB_URL + '/ideas.json'); }
  catch (e) { console.error('⚠️ Não li /ideas:', e.message); process.exit(1); }

  const all = data || {};
  const seen = loadSeen();
  const novasIds = Object.keys(all).filter(id => !seen.includes(id));

  if (!novasIds.length) { console.log('Nenhuma sugestão nova hoje.'); return; }

  const novas = novasIds.map(id => all[id]);
  const linhas = novas.map((s, n) =>
    (n + 1) + '. *' + (s.who || 'ANÔNIMO') + '*: ' + (s.text || '').replace(/\n/g, ' '));
  const msg = ['💡 *' + novas.length + ' sugestão(ões) nova(s) no Super Tucan!*', '', ...linhas,
    '', '📄 https://github.com/hygoramorim/super-tucan#-sugest%C3%B5es-da-comunidade'].join('\n');

  const ok = await tg(msg);
  if (ok) { saveSeen(seen.concat(novasIds)); console.log('✅ Avisado no Telegram: ' + novas.length + ' nova(s).'); }
  else { console.error('⚠️ Falha ao avisar no Telegram — não marcarei como vistas (tenta de novo amanhã).'); process.exit(1); }
})();
