const fs = require('fs');
const NAMES = {
  bot_easy: 'Shogird BOT',
  bot_mid: 'Jangchi BOT',
  bot: 'Yo‘lbars BOT',
  bot_pro: 'Arslon BOT',
  bot_gm: 'Sulton BOT',
  bot_champ: 'Legend BOT'
};
let L = fs.readFileSync('lobby.js', 'utf8'), ok = 0;
for (const uid in NAMES) {
  const re = new RegExp("(uid: '" + uid + "', name: ')([^']*)(')");
  if (re.test(L)) { L = L.replace(re, (m, a, b, c) => a + NAMES[uid] + c); ok++; } else console.log('topilmadi:', uid);
}
fs.writeFileSync('lobby.js', L);
console.log('Nomlar:', ok, 'ta');

let C = fs.readFileSync('lobbyclient.js', 'utf8');
const a = '"<div class=\\"lbinf\\"><b>" + esc(p.name)';
if (C.split(a).length !== 2) console.log('XATO: lobbyclient qatori topilmadi');
else {
  C = C.replace(a, '"<div class=\\"lbinf\\"><b" + (p.bot ? " style=\\"color:#f5b82e;text-shadow:0 0 8px #f5a300\\"" : "") + ">" + esc(p.name)');
  fs.writeFileSync('lobbyclient.js', C); console.log('Oltin yozuv OK');
}
let B = fs.readFileSync('botarena.js', 'utf8');
B = B.split('Math.max(600,').join('Math.max(100,');
fs.writeFileSync('botarena.js', B); console.log('Arena chegarasi OK');
