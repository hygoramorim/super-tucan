#!/usr/bin/env node
// Gera a página de PREVIEW dos personagens do SUPER TUCAN — 100% local e sem IA.
// Faz uma CÓPIA do index.html (o jogo original fica intocado) e injeta, antes do
// </script>, um bloco que expõe as funções e globais de desenho reais em window.*.
// Depois a página preview-personagens.html carrega essa cópia num iframe oculto e
// desenha cada personagem num mini-canvas, usando exatamente a arte do jogo.
//
//   node gerar-preview.js
//   npx serve   (ou: python3 -m http.server 8099)  e abra /preview/index.html

const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, 'index.html');
const OUTDIR = path.join(__dirname, 'preview');
const GAME_COPY = path.join(OUTDIR, 'jogo-para-preview.html');

if (!fs.existsSync(OUTDIR)) fs.mkdirSync(OUTDIR);

let html = fs.readFileSync(SRC, 'utf8');

// Bloco injetado: expõe em window o que a página de preview precisa chamar.
// Fica ANTES do </script>, então enxerga todas as globais/funções do jogo.
const EXPOSE = `
/* ===== PREVIEW HOOK (injetado por gerar-preview.js — não existe no jogo publicado) ===== */
window.__PREVIEW__ = {
  // funções de desenho
  drawCritter, drawToucan, drawET, drawBoss, drawSnakeBoss, drawBossPortal, drawVenom,
  drawUFO, drawPet, drawAccessory, drawPowerup, drawEgg, drawBug, drawEnemy, blinkEye,
  // catálogos / dados
  PHASES, FAUNA, NIGHT_FAUNA, SHOP_ITEMS, PET_ITEMS, FOODS, FOOD_KINDS,
  // permite ao preview posicionar o "bird" e mexer no relógio da animação
  setBird(o){ bird = Object.assign(bird || {}, o); },
  setFrames(n){ frames = n; },
  // o preview injeta o próprio ctx antes de cada desenho e restaura depois,
  // pra não brigar com o loop interno do jogo (que roda no iframe oculto).
  _realCtx: null,
  useCtx(c){ if(!this._realCtx) this._realCtx = ctx; ctx = c; },
  restoreCtx(){ if(this._realCtx) ctx = this._realCtx; },
  // o "chão do jogo" onde drawCritter ancora os bichos (translate interno)
  groundY(){ return H - GROUND_H + 8; },
  gameH(){ return H; }, groundH(){ return GROUND_H; },
  // stubs para equipar acessório/pet sem localStorage sujar
  forceEquip(id){ window.localStorage.setItem('superTucan_equipped', id || ''); },
  forcePet(id){ window.localStorage.setItem('superTucan_pet', id || ''); },
  // zera o trail da ave companheira para ela cair no fallback (bird.x-60, bird.y-20)
  clearPetTrail(){ try { petTrail.length = 0; } catch(e){} },
  // ---- hooks de TESTE da lógica do boss (a cada 3 biomas + dificuldade +10%) ----
  getBossAppearances(){ return bossAppearances; },
  setBossAppearances(n){ bossAppearances = n; },
  callSpawnBoss(){ spawnBoss(); },
  bossDiffMult(){ return bossDiffMult(); },
  getBoss(){ return boss ? { x: boss.x, life: boss.life } : null; },
  clearBoss(){ boss = null; },
  setPhaseIdx(n){ phaseIdx = n; },
  getPhaseIdx(){ return phaseIdx; },
  diffSpeed(){ return currentDiff().speed; }
};
// Congela o loop interno do jogo: este arquivo é só uma FONTE de arte para o
// preview. Sem isso, o loop do jogo (requestAnimationFrame) fica redesenhando no
// ctx e disputa com o preview. Trocamos por no-op — nenhum loop novo é agendado.
window.requestAnimationFrame = function(){ return 0; };
// também paramos o setInterval do jogo (autosave/relógio interno), se houver id.
try { for (let i = 1; i < 99999; i++) clearInterval(i); } catch(e) {}
window.__PREVIEW_READY__ = true;
`;

// O jogo declara `const ctx = canvas.getContext('2d')`. No preview precisamos
// redirecionar esse ctx para cada mini-canvas, então na CÓPIA (só nela) trocamos
// por `let ctx`. O index.html publicado permanece com const, intocado.
const before = html;
html = html.replace("const ctx = canvas.getContext('2d');", "let ctx = canvas.getContext('2d'); // preview: let p/ redirecionar");
if (html === before) console.warn('⚠️  não achei a linha do const ctx — o preview pode não pintar.');

const idx = html.lastIndexOf('</script>');
if (idx === -1) { console.error('❌ não achei </script> no index.html'); process.exit(1); }
html = html.slice(0, idx) + EXPOSE + '\n' + html.slice(idx);

// O jogo roda o loop de animação sozinho; no preview a gente não quer isso rodando
// (só queremos as funções). Não há problema em deixar rodar num iframe oculto e
// pequeno, mas para economizar CPU escondemos o canvas e pausamos via display:none.
fs.writeFileSync(GAME_COPY, html, 'utf8');
console.log('✅ cópia do jogo com hook de preview →', path.relative(__dirname, GAME_COPY));
