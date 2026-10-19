const fs = require('fs');
let s = fs.readFileSync('rooms.js', 'utf8');
const a = "function finish(room, winner, reason) {";
const b = "if (!room.vsBot) results.push({";
const n = (t, x) => t.split(x).length - 1;
if (n(s, a) !== 1 || n(s, b) !== 1 || s.includes('botReward(')) { console.log('XATO yoki allaqachon qollangan'); process.exit(1); }
const fn = `const BOT_COINS = { bot_easy: 1, bot_mid: 2, bot: 3, bot_pro: 5, bot_gm: 8, bot_champ: 12 };
  const BOT_DAILY = 20, BOT_MIN_PLIES = 8;
  function botReward(room, winner) {
    if (!room.vsBot || !winner || (room.moves || []).length < BOT_MIN_PLIES) return;
    const wu = room.white && room.white.uid, bu = room.black && room.black.uid;
    const botUid = isBotUid(wu) ? wu : isBotUid(bu) ? bu : null;
    const human = isBotUid(wu) ? bu : wu;
    const humanColor = isBotUid(wu) ? 'black' : 'white';
    if (!botUid || !human || winner !== humanColor) return;
    const coins = BOT_COINS[botUid]; if (!coins) return;
    const eco = require('./economy'), u = require('./store').users()[String(human)];
    if (!u) return;
    const day = new Date().toISOString().slice(0, 10);
    if (!u.botDay || u.botDay.day !== day) u.botDay = { day, n: 0 };
    if (u.botDay.n >= BOT_DAILY) return;
    u.botDay.n++;
    eco.add(human, coins, 'bot_win');
  }
  `;
s = s.replace(a, fn + a);
s = s.replace(b, "try { botReward(room, winner); } catch (e) { console.log('botReward:', e.message); }\n    " + b);
fs.writeFileSync('rooms.js', s);
console.log('OK');
