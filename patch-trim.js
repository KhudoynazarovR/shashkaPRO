const fs = require('fs');
let lines = fs.readFileSync('menu.js', 'utf8').split('\n');
const keys = ['"@ai:ed"', '"@ai:pdn"', '"@lite"'];
for (const k of keys) {
  const n = lines.filter(l => l.includes(k) && l.trim().startsWith('[')).length;
  if (n !== 1) { console.log('XATO: ' + k + ' -> ' + n + ' marta topildi'); process.exit(1); }
}
lines = lines.filter(l => !(l.trim().startsWith('[') && keys.some(k => l.includes(k))));
fs.writeFileSync('menu.js', lines.join('\n'));
console.log('TAYYOR');
