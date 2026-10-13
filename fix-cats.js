const fs = require('fs');
let lines = fs.readFileSync('roomclient.js', 'utf8').split('\n');
const i = lines.findIndex(l => l.includes('var CATS = '));
if (i < 0) { console.log('XATO: CATS topilmadi'); process.exit(1); }
const m = /^(\s*var CATS = )(.*);\s*$/.exec(lines[i]);
if (!m) { console.log('XATO: qator formati boshqacha'); process.exit(1); }
const C = JSON.parse(m[2]);
C.forEach(c => {
  c[0] = c[0].replace(/😈/g, '😤').trim();
  c[2] = c[2].map(x => x.replace(/😈/g, '😤').trim());
});
lines[i] = m[1] + JSON.stringify(C) + ';';
fs.writeFileSync('roomclient.js', lines.join('\n'));
fs.writeFileSync('phrases.json', JSON.stringify(C.reduce((a, c) => a.concat(c[2]), [])));
const all = C.reduce((a, c) => a.concat(c[2]), []);
console.log('TAYYOR', all.length, 'ibora; 😈:', all.filter(x => x.includes('😈')).length, '; bo\u2018sh joyli:', all.filter(x => x !== x.trim()).length);
