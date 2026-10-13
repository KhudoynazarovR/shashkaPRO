const fs = require('fs');
let L = fs.readFileSync('lobby.js', 'utf8'), U = fs.readFileSync('lobbyclient.js', 'utf8');
let bad = 0;
function rep(src, anchor, add, where) {
  const n = src.split(anchor).length - 1;
  if (n !== 1) { console.log('ANCHOR XATO (' + n + '): ' + anchor.slice(0, 70)); bad++; return src; }
  return src.replace(anchor, () => where === 'before' ? add + anchor : where === 'after' ? anchor + add : add);
}
// server: to'lovdan oldin tekshiruv
L = rep(L, "if (m.type === 'lbTCreate') {", "\n    { const cl0 = clubsApi.check(uid, m.clubIds); if (cl0.error) { err(c, cl0.error); return true; } }", 'after');
L = rep(L, "if (m.type === 'lbTJoin' && t0 && !t0.players.has(uid)) {", "\n    if (t0.clubIds && t0.clubIds.length && !clubsApi.inAny(uid, t0.clubIds)) { err(c, 'Bu turnir faqat klub a‘zolari uchun'); return true; }", 'after');
// client
U = rep(U, 'sendMsg({ type: "lbTCreate", kind:', 'sendMsg({ type: "lbTCreate", clubIds: lbClubIds(), kind:', 'replace');
U = rep(U, 'window.lbFriend = function', fs.readFileSync('clubtour-ui.part', 'utf8'), 'before');
U = rep(U, 'if (t.players.length > 12)', 'h += lbClubTbl(t); ', 'before');
if (bad) { console.log('YOZILMADI'); process.exit(1); }
fs.writeFileSync('lobby.js', L); fs.writeFileSync('lobbyclient.js', U);
console.log('PATCH_OK');
