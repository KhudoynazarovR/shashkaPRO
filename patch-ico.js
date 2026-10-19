const fs = require('fs');
let s = fs.readFileSync('ratings.js', 'utf8');
const a = 'function ico() { return tab === "puz" ? "🧩" : "🪙"; }';
if (s.split(a).length !== 2) { console.log('XATO: qator topilmadi'); process.exit(1); }
s = s.replace(a, 'function ico() { return ({ puz: "🧩", elo: "📊", diamonds: "🪙", wins: "🏆", games: "🎮" })[tab] || ""; }');
fs.writeFileSync('ratings.js', s);
console.log('OK');
