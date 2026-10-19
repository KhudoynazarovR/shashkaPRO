const fs = require('fs');
let s = fs.readFileSync('aiview.js', 'utf8');
const from = 'vis("nvPg")) return;';
const n = s.split(from).length - 1;
if (n !== 1) { console.log('XATO: ' + n + ' marta topildi'); process.exit(1); }
s = s.replace(from, () => 'vis("nvPg") || document.getElementById("spPz")) return;');
fs.writeFileSync('aiview.js', s);
console.log('TAYYOR');
