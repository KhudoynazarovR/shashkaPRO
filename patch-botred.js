const fs = require('fs');
let C = fs.readFileSync('lobbyclient.js', 'utf8');
const a = '">" + esc(p.name) + (p.prem';
if (C.split(a).length !== 2) { console.log('XATO: qator topilmadi'); process.exit(1); }
const b = '">" + (p.bot ? esc(p.name).replace(/BOT\\s*$/, "<span style=\\"color:#ff2b2b;text-shadow:0 0 8px #ff0000\\">BOT</span>") : esc(p.name)) + (p.prem';
C = C.replace(a, () => b);
fs.writeFileSync('lobbyclient.js', C);
console.log('OK');
