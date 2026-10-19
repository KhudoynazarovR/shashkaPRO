const fs = require('fs');
let s = fs.readFileSync('botarena.js', 'utf8');
const a = "clamp(bot.secs + (e - 1000) / 1000, 0.05, 1.5)";
if (s.split(a).length !== 2) { console.log('XATO: qator topilmadi'); process.exit(1); }
s = s.replace(a, "clamp(bot.secs * 0.5 + (e - 1000) / 1000, 0.05, 6)");
fs.writeFileSync('botarena.js', s);
console.log('OK');
