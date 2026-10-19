const fs = require('fs');
let s = fs.readFileSync('lobby.js', 'utf8');
const a = "elo: (su && su.elo) || 1000, gems: (su && su.diamonds) || 0, wins: (su && su.wins) || 0, hasAv: !!(su && su.avatar), bot: !!c.isBot";
const b = "else p.busy = p.busy && !!c.lb.inRoom;";
const c = "function playersList() {";
if (s.split(a).length !== 2 || s.split(b).length !== 2 || s.split(c).length !== 2) {
  console.log('XATO: kutilgan qatorlar topilmadi, hech narsa o\'zgarmadi'); process.exit(1);
}
s = s.replace(a, "elo: (c.isBot ? botElo(c.lb.uid) : 0) || (su && su.elo) || 1000, gems: (su && su.diamonds) || 0, wins: (su && su.wins) || 0, hasAv: !!(su && su.avatar), bot: !!c.isBot");
s = s.replace(b, "else { p.busy = p.busy && !!c.lb.inRoom; if (c.isBot) p.elo = botElo(c.lb.uid) || p.elo; }");
s = s.replace(c, "function botElo(u) { try { const m = require('./store').db.botElo; return (m && m[u] && m[u].elo) || 0; } catch (e) { return 0; } }\n  " + c);
fs.writeFileSync('lobby.js', s);
console.log('OK: lobby.js tuzatildi');
