const fs = require('fs');
let s = fs.readFileSync('lobby.js', 'utf8');
const a = 'function payWin(room, whiteUid, blackUid, tid) {';
if (s.split(a).length !== 2) { console.log('ANCHOR XATO'); process.exit(1); }
if (s.includes("require('./stats')")) { console.log('allaqachon bor'); process.exit(); }
fs.copyFileSync('lobby.js', 'lobby.js.before-stats');
s = s.replace(a, () => a + "\n  if (!room.noshowBoth && room.reason !== 'noshow' && (room.plies || 0) >= MIN_REWARD_PLIES) require('./stats').record(whiteUid, blackUid, room.winner);");
fs.writeFileSync('lobby.js', s);
console.log('yangilandi');
