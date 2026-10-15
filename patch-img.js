const fs = require('fs');
let E = fs.readFileSync('economy.js', 'utf8');
if (E.includes('puzimg.js')) { console.log('Allaqachon bor'); process.exit(0); }
const from = "fetch('https://api.telegram.org/bot' + process.env.BOT_TOKEN + '/sendMessage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(_pb) })";
const n = E.split(from).length - 1;
if (n !== 1) { console.log('XATO: ' + n + ' marta topildi'); process.exit(1); }
E = E.replace(from, () => "require('./puzimg.js')(_pb, b, j.side)");
fs.writeFileSync('economy.js', E);
console.log('TAYYOR');
