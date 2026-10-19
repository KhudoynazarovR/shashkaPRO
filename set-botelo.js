const fs = require('fs');
const E = { bot_easy: 400, bot_mid: 700, bot: 1100, bot_pro: 1300, bot_gm: 1600, bot_champ: 2000 };
const f = 'data/db.json', d = JSON.parse(fs.readFileSync(f, 'utf8'));
if (!d.botElo) { console.log('XATO: botElo topilmadi'); process.exit(1); }
fs.copyFileSync(f, 'data/db.json.bak-botelo');
for (const u in E) d.botElo[u] = Object.assign(d.botElo[u] || { w: 0, l: 0, dr: 0 }, { elo: E[u] });
fs.writeFileSync(f, JSON.stringify(d, null, 2));
console.log('OK', JSON.stringify(d.botElo).slice(0, 200));
