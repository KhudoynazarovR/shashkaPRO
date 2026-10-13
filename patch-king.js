const fs = require('fs');
let s = fs.readFileSync('rules-bridge.js', 'utf8');
if (s.includes('BLACK_KING;n[m.to.r]')) { console.log('Allaqachon bor'); process.exit(0); }
const a = 'n[m.to.r][m.to.c]=p;return n}';
const n = s.split(a).length - 1;
if (n !== 1) { console.log('XATO: ' + n + ' marta topildi'); process.exit(1); }
s = s.replace(a, () => 'let q=p;if(p===WHITE&&m.to.r===0)q=WHITE_KING;if(p===BLACK&&m.to.r===7)q=BLACK_KING;n[m.to.r][m.to.c]=q;return n}');
fs.writeFileSync('rules-bridge.js', s);
console.log('TAYYOR');
