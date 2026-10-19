const fs = require('fs');
let s = fs.readFileSync('botarena.js', 'utf8');
const re = /\n  if \(!d\.botEloInit\d+\)[^\n]*/;
if (!re.test(s)) { console.log('XATO: avval patch-botelo.js ni ishga tushiring'); process.exit(1); }
const line = "\n  if (!d.botEloInit2) { d.botEloInit2 = true; const E0 = { bot_easy: 1200, bot_mid: 1300, bot: 1500, bot_pro: 1700, bot_gm: 1800, bot_champ: 2000 }; for (const u in E0) { const o = d.botElo[u] || (d.botElo[u] = { w: 0, l: 0, dr: 0 }); o.elo = E0[u]; } dirty = true; }";
s = s.replace(re, () => line);
fs.writeFileSync('botarena.js', s);
console.log('OK');
